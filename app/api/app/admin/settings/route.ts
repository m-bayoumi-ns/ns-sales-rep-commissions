import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { listSellerAccounts } from "@/lib/accounts/server";
import { pushFeedFor, pushFeedForAll } from "@/lib/app/push";
import { readBearerUser } from "@/lib/auth/bearer";
import { isAdmin } from "@/lib/auth/permissions";
import { rateChanges } from "@/lib/commissions/changes";
import { addNotification } from "@/lib/commissions/notifications";
import { searchProducts } from "@/lib/commissions/odoo";
import { type CommissionSettings, settingsSchema } from "@/lib/commissions/schema";
import { loadSettings, saveSettings } from "@/lib/commissions/storage";
import { availableMonths, loadMonthSetup, resolveMonth } from "@/lib/commissions/view";
import { isOdooConfigured } from "@/lib/env";
import { addMonths, currentMonth } from "@/lib/finance/core";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function requireAdminUser(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user) return { user: null, response: json({ error: "signed_out" }, 401) };
  if (!isAdmin(user)) return { user: null, response: json({ error: "forbidden" }, 403) };
  return { user, response: null };
}

/**
 * Administrator commission settings API for the native Android app:
 * - `GET /api/app/admin/settings?search=<q>`: searches Odoo products (read-only)
 * - `GET /api/app/admin/settings?month=YYYY-MM`: loads month setup, Odoo rep candidates, and active seller accounts
 * - `PUT /api/app/admin/settings`: saves monthly settings and optionally broadcasts rate-change notifications
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request);
  if (auth.response) return auth.response;

  const search = request.nextUrl.searchParams.get("search");
  if (search !== null) {
    const query = search.trim().slice(0, 80);
    if (query.length < 2) return json({ products: [] });
    try {
      const products = await searchProducts(query);
      return json({ products });
    } catch (error) {
      console.error("[app admin settings] product search failed:", error);
      return json({ products: [] });
    }
  }

  if (!isOdooConfigured()) return json({ error: "not_connected" }, 503);

  const next = addMonths(currentMonth(), 1);
  const wanted = request.nextUrl.searchParams.get("month") ?? undefined;
  const month = wanted === next ? next : resolveMonth(wanted);

  try {
    const [setup, accounts, months] = await Promise.all([
      loadMonthSetup(month),
      listSellerAccounts().catch((error) => {
        console.error("[app admin settings] seller accounts unavailable:", error);
        return [];
      }),
      availableMonths(),
    ]);

    const settings: CommissionSettings = {
      ...setup.stored.settings,
      month,
      reps: setup.reps.map((rep) => ({
        name: rep.name,
        odooUserId: rep.odooUserId,
        totalTarget: rep.totalTarget,
        slowTarget: rep.slowTarget,
        digitalTarget: rep.digitalTarget,
        rangeTargets: rep.rangeTargets,
      })),
    };

    return json({
      month,
      months: [next, ...months],
      settings,
      source: setup.stored.source,
      inheritedFrom: setup.stored.inheritedFrom,
      sheet: {
        found: setup.sheet.found,
        path: setup.sheet.path,
        count: setup.sheet.reps.length,
        columns: setup.sheet.columns,
        productCommission: setup.sheet.productCommission,
      },
      reps: setup.reps,
      candidates: setup.candidates.map(({ id, name }) => ({ id, name })),
      accounts: accounts.filter((account) => account.active).map(({ id, name, email }) => ({ id, name, email })),
    });
  } catch (error) {
    console.error("[app admin settings] load failed:", error);
    return json({ error: "load_failed" }, 502);
  }
}

const notifySchema = z.object({
  mode: z.enum(["none", "all", "users"]).default("none"),
  userIds: z.array(z.string().min(1).max(64)).max(500).default([]),
  note: z.string().trim().max(500).optional(),
});

export async function PUT(request: NextRequest) {
  const auth = await requireAdminUser(request);
  if (auth.response) return auth.response;
  const user = auth.user!;

  const body = (await request.json().catch(() => null)) as { settings?: unknown; notify?: unknown } | null;
  const parsed = settingsSchema.safeParse(body?.settings ?? body);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        reason: "invalid",
        detail: parsed.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(" · "),
      },
      400,
    );
  }

  const notify = notifySchema.safeParse(body?.notify ?? { mode: "none" });
  const savedAt = new Date().toISOString();
  let notified = 0;

  try {
    const clean: CommissionSettings = {
      ...parsed.data,
      products: parsed.data.products.filter((product) => product.templateId > 0),
      rules: {
        ...parsed.data.rules,
        salesBonuses: parsed.data.rules.salesBonuses.filter((step) => step.amount > 0),
      },
      updatedAt: savedAt,
      updatedBy: user.email,
    };

    const before = (await loadSettings(clean.month)).settings;
    await saveSettings(clean);

    const changes = rateChanges(before, clean);
    if (notify.success && notify.data.mode !== "none" && (changes.length || notify.data.note)) {
      const recipients =
        notify.data.mode === "all"
          ? { mode: "all" as const }
          : { mode: "users" as const, userIds: notify.data.userIds };
      if (recipients.mode === "all" || recipients.userIds.length) {
        await addNotification({
          month: clean.month,
          by: user.name,
          recipients,
          changes,
          note: notify.data.note || null,
        });
        notified = recipients.mode === "all" ? -1 : recipients.userIds.length;
        after(() =>
          logActivity({
            action: "notify",
            userId: user.id,
            email: user.email,
            details: { month: clean.month, changes: changes.length, recipients, client: "android" },
          }),
        );
        after(async () => {
          if (recipients.mode === "all") await pushFeedForAll();
          else for (const id of recipients.userIds) await pushFeedFor(id);
        });
      }
    }
  } catch (error) {
    console.error("[app admin settings] save failed:", error);
    return json(
      { ok: false, reason: "storage", detail: error instanceof Error ? error.message : undefined },
      502,
    );
  }

  revalidatePath("/", "layout");
  return json({ ok: true, savedAt, notified });
}
