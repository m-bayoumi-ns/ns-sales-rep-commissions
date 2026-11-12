import "server-only";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { isDemoMode } from "@/lib/dev";
import { cached, MINUTE, prevMonth } from "@/lib/finance/core";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { type Category, type CommissionSettings, defaultSettings, settingsSchema } from "./schema";

/**
 * Supabase Storage (same project as ns-home), bucket "naguib-selim-db":
 *   ns-sales-rep-commissions/settings_YYYY_MM.json   commission settings, one file per month (read / written here)
 *   Wholesales_Target/target_YYYY_MM.xlsx            the month's targets and "Product commission" sheet (read only)
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

/** Names of the files directly inside a folder (empty when the folder does not exist). */
export async function listFiles(folder: string): Promise<string[]> {
  if (isDemoMode()) {
    try {
      return (await fs.readdir(path.join(LOCAL_ROOT, folder), { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }
  const { data, error } = await createSupabaseAdminClient().storage.from(BUCKET).list(folder, { limit: 100 });
  if (error) {
    console.error(`[storage] list ${folder}:`, error.message);
    return [];
  }
  return (data ?? []).filter((item) => item.id != null && item.name !== ".emptyFolderPlaceholder").map((item) => item.name);
}

export async function listTargetMonths(): Promise<string[]> {
  const files = await listFiles(TARGET_FOLDER);
  return [...new Set(files.flatMap((file) => {
    const match = /^target_(\d{4})_(0[1-9]|1[0-2])\.xlsx$/i.exec(file);
    return match ? [`${match[1]}-${match[2]}`] : [];
  }))];
}

/** Names of the sub-folders directly inside a folder. */
export async function listFolders(folder: string): Promise<string[]> {
  if (isDemoMode()) {
    try {
      return (await fs.readdir(path.join(LOCAL_ROOT, folder), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }
  const { data, error } = await createSupabaseAdminClient().storage.from(BUCKET).list(folder, { limit: 1000 });
  if (error) {
    console.error(`[storage] list ${folder}:`, error.message);
    return [];
  }
  return (data ?? []).filter((item) => item.id == null).map((item) => item.name);
}

/** Deletes a file (no error when it is already gone). */
export async function removeFile(objectPath: string) {
  if (isDemoMode()) {
    await fs.rm(path.join(LOCAL_ROOT, objectPath), { force: true });
    return;
  }
  const { error } = await createSupabaseAdminClient().storage.from(BUCKET).remove([objectPath]);
  if (error) console.error(`[storage] remove ${objectPath}:`, error.message);
}

/** Small JSON files in the same bucket (app settings, notifications). null when missing or unreadable. */
export async function readJson<T>(objectPath: string): Promise<T | null> {
  const buffer = await download(objectPath);
  if (!buffer) return null;
  try {
    return JSON.parse(buffer.toString("utf8")) as T;
  } catch (error) {
    console.error(`[storage] ${objectPath} is not valid JSON:`, error);
    return null;
  }
}

export async function writeJson(objectPath: string, data: unknown) {
  await upload(objectPath, JSON.stringify(data, null, 2));
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
    let raw: unknown;
    try {
      raw = JSON.parse(buffer.toString("utf8"));
    } catch {
      // An empty or broken file counts as "no settings saved" (the month falls back to an earlier month / defaults).
      console.error(`[storage] ${settingsPath(month)} is empty or not valid JSON`);
      return null;
    }
    const parsed = settingsSchema.safeParse({ ...(raw as object), month });
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
  // Target values are read from Excel and are never persisted in the monthly JSON.
  const { reps, ...commissionSettings } = settings;
  await upload(settingsPath(settings.month), JSON.stringify({
    ...commissionSettings,
    products: commissionSettings.products.filter((product) => product.templateId > 0),
    reps: reps.map(({ name, odooUserId }) => ({ name, odooUserId })),
  }, null, 2));
  settingsCache.delete(settings.month);
}

// ---------------------------------------------------------------- target sheet
export type SheetRep = { name: string; totalTarget: number | null; slowTarget: number | null; digitalTarget: number | null; rangeTargets: (number | null)[] };
export type SheetProductCommission = {
  key: string;
  row: number;
  category: string;
  categoryKey: Category | null;
  productName: string;
  price: number | null;
  anyPrice: boolean;
  commission: number | null;
  priceText: string;
  commissionText: string;
  valid: boolean;
};
export type TargetSheet = {
  found: boolean;
  path: string;
  reps: SheetRep[];
  columns: { rep: string | null; total: string | null; slow: string | null; digital: string | null; ranges: (string | null)[] };
  productCommission: {
    found: boolean;
    columns: { category: string | null; productName: string | null; price: string | null; commission: string | null };
    rows: SheetProductCommission[];
  };
};

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
const percentageOf = (cell: ExcelJS.Cell): number | null => {
  const value = numberOf(cell.value);
  if (value != null) return cell.numFmt?.includes("%") ? value * 100 : value;
  const textValue = text(cell.value).trim();
  const percentText = textValue.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*%$/);
  return percentText ? Number(percentText[1]) : null;
};

const REP_HEADER = /sales\s*rep|مندوب|البائع/i;
const SLOW_HEADER = /slow|راكد|بطيء|بطئ/i;
const DIGITAL_HEADER = /digital|ديجيتال|ديجتال|ديجيتل/i;
const TARGET_HEADER = /target|تارجت|المستهدف|الهدف|تارجيت/i;
const PRODUCT_COMMISSION_SHEET = "product commission";
const PRODUCT_CATEGORY_HEADER = /^categories?$/i;
const PRODUCT_NAME_HEADER = /^product\s*name$/i;
const PRICE_HEADER = /^price$/i;
const COMMISSION_HEADER = /^commission$/i;

function emptyTargetSheet(found: boolean, objectPath: string): TargetSheet {
  return {
    found,
    path: objectPath,
    reps: [],
    columns: { rep: null, total: null, slow: null, digital: null, ranges: [null, null, null] },
    productCommission: { found: false, columns: { category: null, productName: null, price: null, commission: null }, rows: [] },
  };
}

function categoryOf(value: string): Category | null {
  if (SLOW_HEADER.test(value)) return "slow";
  if (DIGITAL_HEADER.test(value)) return "digital";
  return null;
}

function parseProductCommission(workbook: ExcelJS.Workbook): TargetSheet["productCommission"] {
  const sheet = workbook.worksheets.find((item) => item.name.replace(/\s+/g, " ").trim().toLowerCase() === PRODUCT_COMMISSION_SHEET);
  if (!sheet) return emptyTargetSheet(false, "").productCommission;

  for (let headerRow = 1; headerRow <= Math.min(15, sheet.rowCount); headerRow++) {
    const headers = new Map<number, string>();
    sheet.getRow(headerRow).eachCell((cell, col) => headers.set(col, text(cell.value).replace(/\s+/g, " ").trim()));
    const categoryCol = [...headers].find(([, value]) => PRODUCT_CATEGORY_HEADER.test(value))?.[0] ?? null;
    const productNameCol = [...headers].find(([, value]) => PRODUCT_NAME_HEADER.test(value))?.[0] ?? null;
    const priceCol = [...headers].find(([, value]) => PRICE_HEADER.test(value))?.[0] ?? null;
    const commissionCol = [...headers].find(([, value]) => COMMISSION_HEADER.test(value))?.[0] ?? null;
    if (!categoryCol && !productNameCol && !priceCol && !commissionCol) continue;

    const columns = {
      category: categoryCol ? headers.get(categoryCol) ?? null : null,
      productName: productNameCol ? headers.get(productNameCol) ?? null : null,
      price: priceCol ? headers.get(priceCol) ?? null : null,
      commission: commissionCol ? headers.get(commissionCol) ?? null : null,
    };
    const rows: SheetProductCommission[] = [];
    const occurrences = new Map<string, number>();
    if (!categoryCol || !productNameCol || !priceCol || !commissionCol) return { found: true, columns, rows };

    for (let rowIndex = headerRow + 1; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      const category = text(row.getCell(categoryCol).value).replace(/\s+/g, " ").trim();
      const productName = text(row.getCell(productNameCol).value).replace(/\s+/g, " ").trim();
      const priceCell = row.getCell(priceCol);
      const commissionCell = row.getCell(commissionCol);
      const priceText = text(priceCell.value).replace(/\s+/g, " ").trim();
      const commissionText = text(commissionCell.value).trim();
      if (!category && !productName && !priceText && !commissionText) continue;

      const anyPrice = /^any\s+price$/i.test(priceText);
      const price = anyPrice ? null : numberOf(priceCell.value);
      const commission = percentageOf(commissionCell);
      const categoryKey = categoryOf(category);
      const identity = [
        categoryKey ?? category.toLowerCase(),
        productName.toLowerCase(),
        anyPrice ? "any" : price == null ? `invalid:${priceText.toLowerCase()}` : String(price),
      ].join("\u001f");
      const occurrence = occurrences.get(identity) ?? 0;
      occurrences.set(identity, occurrence + 1);
      const key = `pc-${createHash("sha256").update(`${identity}\u001f${occurrence}`).digest("hex").slice(0, 24)}`;
      const valid = Boolean(productName && category && (anyPrice || (price != null && price >= 0)) && commission != null && commission >= 0 && commission <= 1000);
      rows.push({ key, row: rowIndex, category, categoryKey, productName, price, anyPrice, commission, priceText, commissionText, valid });
    }

    return { found: true, columns, rows };
  }
  return { found: true, columns: { category: null, productName: null, price: null, commission: null }, rows: [] };
}

/** Reads the month's target workbook and its product commission rows. */
export function readTargetSheet(month: string): Promise<TargetSheet> {
  return cached(`target-sheet:v3:${month}`, MINUTE, async () => {
    const objectPath = targetPath(month);
    const empty = emptyTargetSheet(false, objectPath);
    const buffer = await download(objectPath);
    if (!buffer) return empty;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    return parseTargetWorkbook(workbook, objectPath);
  });
}

export function parseTargetWorkbook(workbook: ExcelJS.Workbook, objectPath: string): TargetSheet {
  const productCommission = parseProductCommission(workbook);
  for (const sheet of workbook.worksheets) {
    for (let rowIndex = 1; rowIndex <= Math.min(15, sheet.rowCount); rowIndex++) {
      const headers = new Map<number, string>();
      sheet.getRow(rowIndex).eachCell((cell, col) => headers.set(col, text(cell.value).replace(/\s+/g, " ").trim()));
      const repCol = [...headers].find(([, value]) => REP_HEADER.test(value))?.[0];
      if (!repCol) continue;
      const find = (match: (value: string) => boolean) => [...headers].find(([col, value]) => col !== repCol && match(value))?.[0] ?? null;
      const slowCol = find((value) => SLOW_HEADER.test(value));
      const digitalCol = find((value) => DIGITAL_HEADER.test(value));
      const rangeCols = ["A", "B", "C"].map((key) => find((value) => new RegExp(`^(range|tier|شريحة|الشريحة|فئة)\\s*${key}$`, "i").test(value)));
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
        columns: {
          rep: headers.get(repCol) ?? null,
          total: totalCol ? headers.get(totalCol)! : null,
          slow: slowCol ? headers.get(slowCol)! : null,
          digital: digitalCol ? headers.get(digitalCol)! : null,
          ranges: rangeCols.map((col) => col ? headers.get(col) ?? null : null),
        },
        productCommission,
      };
    }
  }
  return { ...emptyTargetSheet(true, objectPath), productCommission };
}
