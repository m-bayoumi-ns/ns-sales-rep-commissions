import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { isDemoMode } from "@/lib/dev";
import { cached, MINUTE, prevMonth } from "@/lib/finance/core";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { type CommissionSettings, defaultSettings, settingsSchema } from "./schema";

/**
 * Supabase Storage (same project as ns-home), bucket "naguib-selim-db":
 *   ns-sales-rep-commissions/settings_YYYY_MM.json   commission settings, one file per month (read / written here)
 *   Wholesales_Target/target_YYYY_MM.xlsx            the month's targets: the "Sales Rep" column lists the reps (read only)
 * In local demo mode (lib/dev.ts) the same paths are read from / written to the ".data" folder instead.
 */
export const BUCKET = process.env.COMMISSIONS_BUCKET || "naguib-selim-db";
const SETTINGS_FOLDER = process.env.COMMISSIONS_FOLDER || "ns-sales-rep-commissions";
const TARGET_FOLDER = process.env.COMMISSIONS_TARGET_FOLDER || "Wholesales_Target";

const fileMonth = (month: string) => month.replace("-", "_");
export const settingsPath = (month: string) => `${SETTINGS_FOLDER}/settings_${fileMonth(month)}.json`;
export const targetPath = (month: string) => `${TARGET_FOLDER}/target_${fileMonth(month)}.xlsx`;

const LOCAL_ROOT = path.join(process.cwd(), ".data");

async function download(objectPath: string): Promise<Buffer | null> {
  if (isDemoMode()) {
    try {
      return await fs.readFile(path.join(LOCAL_ROOT, objectPath));
    } catch {
      return null;
    }
  }
  const { data, error } = await createSupabaseAdminClient().storage.from(BUCKET).download(objectPath);
  if (error || !data) {
    // A missing file is normal (month not set up yet); anything else is logged.
    const status = (error as { status?: number; statusCode?: string } | null)?.statusCode ?? (error as { status?: number } | null)?.status;
    if (error && String(status) !== "404" && !/not.?found/i.test(error.message)) console.error(`[storage] ${objectPath}:`, error.message);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

async function upload(objectPath: string, body: string) {
  if (isDemoMode()) {
    const file = path.join(LOCAL_ROOT, objectPath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, "utf8");
    return;
  }
  const { error } = await createSupabaseAdminClient()
    .storage.from(BUCKET)
    .upload(objectPath, new Blob([body], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

// ---------------------------------------------------------------- settings
export type StoredSettings = {
  settings: CommissionSettings;
  /** Where the settings come from: this month's file, an earlier month's file (copied forward), or the defaults. */
  source: "saved" | "inherited" | "default";
  inheritedFrom: string | null;
};

const settingsCache = new Map<string, { at: number; value: Promise<CommissionSettings | null> }>();

async function readSettingsFile(month: string): Promise<CommissionSettings | null> {
  const hit = settingsCache.get(month);
  if (hit && Date.now() - hit.at < MINUTE) return hit.value;
  const value = (async () => {
    const buffer = await download(settingsPath(month));
    if (!buffer) return null;
    const parsed = settingsSchema.safeParse({ ...JSON.parse(buffer.toString("utf8")), month });
    if (!parsed.success) {
      console.error(`[storage] ${settingsPath(month)} is not valid:`, parsed.error.message);
      return null;
    }
    return parsed.data;
  })();
  settingsCache.set(month, { at: Date.now(), value });
  value.catch(() => settingsCache.delete(month));
  return value;
}

/** The month's settings; a month without its own file starts from the latest earlier month (up to a year back). */
export async function loadSettings(month: string): Promise<StoredSettings> {
  const own = await readSettingsFile(month);
  if (own) return { settings: own, source: "saved", inheritedFrom: null };
  let earlier = month;
  for (let step = 0; step < 12; step++) {
    earlier = prevMonth(earlier);
    const previous = await readSettingsFile(earlier);
    if (previous) {
      // Rates and rules carry over; targets are per month, so they do not.
      const reps = previous.reps.map((rep) => ({ ...rep, totalTarget: null, slowTarget: null, digitalTarget: null, rangeTargets: [] }));
      return { settings: { ...previous, month, reps, updatedAt: null, updatedBy: null }, source: "inherited", inheritedFrom: earlier };
    }
  }
  return { settings: defaultSettings(month), source: "default", inheritedFrom: null };
}

export async function saveSettings(settings: CommissionSettings) {
  await upload(settingsPath(settings.month), JSON.stringify(settings, null, 2));
  settingsCache.delete(settings.month);
}

// ---------------------------------------------------------------- target sheet
export type SheetRep = { name: string; totalTarget: number | null; slowTarget: number | null; digitalTarget: number | null; rangeTargets: (number | null)[] };
export type TargetSheet = { found: boolean; path: string; reps: SheetRep[]; columns: { rep: string | null; total: string | null; slow: string | null; digital: string | null } };

const text = (value: ExcelJS.CellValue): string => {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return text(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text);
  }
  return String(value);
};
const numberOf = (value: ExcelJS.CellValue): number | null => {
  const raw = typeof value === "object" && value && "result" in value ? value.result : value;
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && String(raw ?? "").trim() !== "" ? n : null;
};

const REP_HEADER = /sales\s*rep|مندوب|البائع/i;
const SLOW_HEADER = /slow|راكد|بطيء|بطئ/i;
const DIGITAL_HEADER = /digital|ديجيتال|ديجتال|ديجيتل/i;
const TARGET_HEADER = /target|تارجت|المستهدف|الهدف|تارجيت/i;

/** Reads the month's target sheet: the reps of the "Sales Rep" column and, when present, their target columns. */
export function readTargetSheet(month: string): Promise<TargetSheet> {
  return cached(`target-sheet:${month}`, 10 * MINUTE, async () => {
    const objectPath = targetPath(month);
    const empty: TargetSheet = { found: false, path: objectPath, reps: [], columns: { rep: null, total: null, slow: null, digital: null } };
    const buffer = await download(objectPath);
    if (!buffer) return empty;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    for (const sheet of workbook.worksheets) {
      // The header row: the first of the top 15 rows with a "Sales Rep" cell.
      for (let rowIndex = 1; rowIndex <= Math.min(15, sheet.rowCount); rowIndex++) {
        const headers = new Map<number, string>();
        sheet.getRow(rowIndex).eachCell((cell, col) => headers.set(col, text(cell.value).trim()));
        const repCol = [...headers].find(([, value]) => REP_HEADER.test(value))?.[0];
        if (!repCol) continue;
        const find = (match: (value: string) => boolean) => [...headers].find(([col, value]) => col !== repCol && match(value))?.[0] ?? null;
        const slowCol = find((value) => SLOW_HEADER.test(value));
        const digitalCol = find((value) => DIGITAL_HEADER.test(value));
        // Optional "Range A" / "شريحة A" … columns.
        const rangeCols = ["A", "B", "C"].map((key) => find((value) => new RegExp(`^(range|tier|شريحة|الشريحة|فئة)\\s*${key}$`, "i").test(value.trim())));
        const totalCol = find((value) => TARGET_HEADER.test(value) && !SLOW_HEADER.test(value) && !DIGITAL_HEADER.test(value));
        const reps = new Map<string, SheetRep>();
        for (let r = rowIndex + 1; r <= sheet.rowCount; r++) {
          const row = sheet.getRow(r);
          const name = text(row.getCell(repCol).value).replace(/\s+/g, " ").trim();
          if (!name || /^(total|الاجمالي|الإجمالي|اجمالي|إجمالي)$/i.test(name)) continue;
          const entry = reps.get(name) ?? { name, totalTarget: null, slowTarget: null, digitalTarget: null, rangeTargets: [] as (number | null)[] };
          const addTo = (field: "totalTarget" | "slowTarget" | "digitalTarget", col: number | null) => {
            const value = col ? numberOf(row.getCell(col).value) : null;
            if (value != null) entry[field] = (entry[field] ?? 0) + value;
          };
          addTo("totalTarget", totalCol);
          addTo("slowTarget", slowCol);
          addTo("digitalTarget", digitalCol);
          rangeCols.forEach((col, index) => {
            const value = col ? numberOf(row.getCell(col).value) : null;
            if (value != null) entry.rangeTargets[index] = (entry.rangeTargets[index] ?? 0) + value;
          });
          reps.set(name, entry);
        }
        return {
          found: true,
          path: objectPath,
          reps: [...reps.values()],
          columns: { rep: headers.get(repCol) ?? null, total: totalCol ? headers.get(totalCol)! : null, slow: slowCol ? headers.get(slowCol)! : null, digital: digitalCol ? headers.get(digitalCol)! : null },
        };
      }
    }
    return { ...empty, found: true };
  });
}
