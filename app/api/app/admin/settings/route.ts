import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listSellerAccounts, loadAppSettings } from "@/lib/accounts/server";
import { readBearerUser } from "@/lib/auth/bearer";
import { isAdmin } from "@/lib/auth/permissions";
import { addNotification } from "@/lib/commissions/notifications";
import { rateChanges } from "@/lib/commissions/changes";
import { searchProducts } from "@/lib/commissions/odoo";
import { settingsSchema } from "@/lib/commissions/schema";
import { loadSettings, saveSettings } from "@/lib/commissions/storage";
import { availableMonths, loadMonthSetup, resolveMonth } from "@/lib/commissions/view";
import { logActivity } from "@/lib/activity";
import { pushFeedFor, pushFeedForAll } from "@/lib/app/push";
import { addMonths, currentMonth } from "@/lib/finance/core";
import { isOdooConfigured } from "@/lib/env";

const notifySchema = z.object({
  mode: z.enum(["none", "all", "users"]),
  userIds: z.array(z.string().min(1).max(64)).max(500).default([]),
  note: z.string().trim().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  const search = request.nextUrl.searchParams.get("search");
  if (search != null) {
    const query = z.string().trim().max(80).safeParse(search);
    if (!query.success) return json({ error: "invalid_input" }, 400);
    try {
      return json({ products: await searchProducts(query.data) });
    } catch (error) {
      console.error("[app admin settings] product search failed:", error);
      return json({ error: "load_failed" }, 502);
    }
  }
  if (!isOdooConfigured()) return json({ error: "not_connected" }, 503);

  const raw = request.nextUrl.searchParams.get("month") ?? undefined;
  const next = addMonths(currentMonth(), 1);
  const month = raw === next ? next : resolveMonth(raw);
  try {
    const [setup, accounts, appSettings] = await Promise.all([
      loadMonthSetup(month),
      listSellerAccounts(),
      loadAppSettings(),
    ]);
    return json({
      month,
      months: [next, ...availableMonths()],
      settings: {
        ...setup.stored.settings,
        month,
        reps: setup.reps.map(({ name, odooUserId, totalTarget, slowTarget, digitalTarget, rangeTargets }) => ({
          name,
          odooUserId,
          totalTarget,
          slowTarget,
          digitalTarget,
          rangeTargets: setup.stored.settings.tiers.map((_, index) => rangeTargets[index] ?? null),
        })),
      },
      source: setup.stored.source,
      inheritedFrom: setup.stored.inheritedFrom,
      sheet: {
        found: setup.sheet.found,
        path: setup.sheet.path,
        count: setup.sheet.reps.length,
        columns: setup.sheet.columns,
      },
      candidates: setup.candidates.map(({ id, name }) => ({ id, name })),
      accounts: accounts.filter((account) => account.active).map(({ id, name, email }) => ({ id, name, email })),
      androidDownload: appSettings.androidDownload ?? "native",
    });
  } catch (error) {
    console.error("[app admin settings] failed to load:", error);
    return json({ error: "load_failed" }, 502);
  }
}

export async function PUT(request: NextRequest) {
  const user = await readAdmin(request);
  if (user instanceof NextResponse) return user;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "invalid_input" }, 400);
  }
  const bodySchema = z.object({ settings: z.unknown(), notify: notifySchema.optional() });
  const body = bodySchema.safeParse(raw);
  if (!body.success) return json({ error: "invalid_input" }, 400);
  const parsed = settingsSchema.safeParse(body.data.settings);
  if (!parsed.success) {
    return json({
      error: "invalid_settings",
      detail: parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" · "),
    }, 400);
  }
  const notify = body.data.notify ?? { mode: "none" as const, userIds: [] };
  const savedAt = new Date().toISOString();
  try {
    const before = (await loadSettings(parsed.data.month)).settings;
    await saveSettings({ ...parsed.data, updatedAt: savedAt, updatedBy: user.email });
    const changes = rateChanges(before, parsed.data);
    let notified = 0;
    if (notify.mode !== "none" && (changes.length || notify.note)) {
      const recipients = notify.mode === "all" ? { mode: "all" as const } : { mode: "users" as const, userIds: notify.userIds };
      if (recipients.mode === "all" || recipients.userIds.length) {
        await addNotification({ month: parsed.data.month, by: user.name, recipients, changes, note: notify.note || null });
        notified = recipients.mode === "all" ? -1 : recipients.userIds.length;
        after(() => logActivity({ action: "notify", userId: user.id, email: user.email, details: { month: parsed.data.month, changes: changes.length, recipients } }));
        after(async () => {
          if (recipients.mode === "all") await pushFeedForAll();
          else for (const id of recipients.userIds) await pushFeedFor(id);
        });
      }
    }
    after(() => logActivity({ action: "save_commission_settings", userId: user.id, email: user.email, details: { month: parsed.data.month } }));
    return json({ savedAt, notified });
  } catch (error) {
    console.error("[app admin settings] save failed:", error);
    return json({ error: "save_failed" }, 502);
  }
}

async function adminDenied(request: NextRequest) {
  const user = await readAdmin(request);
  return user instanceof NextResponse ? user : null;
}

async function readAdmin(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user) return json({ error: "signed_out" }, 401);
  if (!user.active) return json({ error: "inactive" }, 403);
  if (user.mustChangePassword) return json({ error: "must_change_password" }, 403);
  if (!isAdmin(user)) return json({ error: "no_access" }, 403);
  return user;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
