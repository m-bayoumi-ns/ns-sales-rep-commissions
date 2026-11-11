import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { loadAppSettings, saveAppSettings } from "@/lib/accounts/app-settings";
import {
  createSheetAccounts,
  DEFAULT_PASSWORD,
  listSellerAccounts,
  setMustChangePassword,
  setSellerActive,
  setSellerUsername,
  sheetRepAccounts,
} from "@/lib/accounts/server";
import { ANDROID_VARIANTS } from "@/lib/android-app";
import { readBearerUser } from "@/lib/auth/bearer";
import { isAdmin } from "@/lib/auth/permissions";
import { normalizeName } from "@/lib/commissions/names";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function requireAdminUser(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user) return { user: null, response: json({ error: "signed_out" }, 401) };
  if (!isAdmin(user)) return { user: null, response: json({ error: "forbidden" }, 403) };
  return { user, response: null };
}

/**
 * Administrator seller accounts API for the native Android app:
 * - `GET /api/app/admin/accounts`: lists target-sheet reps + standalone seller accounts + default password + download variant
 * - `PATCH /api/app/admin/accounts`: executes account management actions (active, forcePassword, createFromSheet, username, displayName, androidDownload)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request);
  if (auth.response) return auth.response;

  try {
    const [accounts, settings] = await Promise.all([listSellerAccounts(), loadAppSettings()]);
    const sheet = await sheetRepAccounts(accounts);
    return json({
      accounts: accounts.filter((account) => !sheet?.reps.some((rep) => rep.account?.id === account.id)),
      sheet,
      androidDownload: settings.androidDownload ?? "native",
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (error) {
    console.error("[app admin accounts] failed to load:", error);
    return json({ error: "load_failed" }, 502);
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setActive"), userId: z.string().min(1), active: z.boolean() }),
  z.object({ action: z.literal("setForcePassword"), userId: z.string().min(1), value: z.boolean() }),
  z.object({ action: z.literal("createFromSheet"), names: z.array(z.string().max(200)).max(500).default([]) }),
  z.object({ action: z.literal("setUsername"), repName: z.string().min(1).max(200), userId: z.string().nullable().default(null), username: z.string().min(1).max(64) }),
  z.object({ action: z.literal("setDisplayName"), repName: z.string().min(1).max(200), displayName: z.string().max(120) }),
  z.object({ action: z.literal("setAndroidDownload"), variant: z.enum(ANDROID_VARIANTS) }),
]);

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser(request);
  if (auth.response) return auth.response;
  const admin = auth.user!;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, reason: "invalid" }, 400);
  const body = parsed.data;

  try {
    switch (body.action) {
      case "setActive": {
        await setSellerActive(body.userId, body.active);
        after(() =>
          logActivity({
            action: body.active ? "approve_account" : "disable_account",
            userId: admin.id,
            email: admin.email,
            details: { target: body.userId, client: "android" },
          }),
        );
        revalidatePath("/", "layout");
        return json({ ok: true });
      }
      case "setForcePassword": {
        await setMustChangePassword(body.userId, body.value);
        after(() =>
          logActivity({
            action: "force_password_change",
            userId: admin.id,
            email: admin.email,
            details: { target: body.userId, value: body.value, client: "android" },
          }),
        );
        revalidatePath("/", "layout");
        return json({ ok: true });
      }
      case "createFromSheet": {
        const results = await createSheetAccounts(body.names);
        after(() =>
          logActivity({
            action: "approve_account",
            userId: admin.id,
            email: admin.email,
            details: { created: results.filter((row) => row.status === "created").map((row) => row.username), client: "android" },
          }),
        );
        revalidatePath("/", "layout");
        return json({ ok: true, results });
      }
      case "setUsername": {
        const result = await setSellerUsername({ repName: body.repName, userId: body.userId, username: body.username });
        if (result.ok) {
          after(() =>
            logActivity({
              action: "username_changed",
              userId: admin.id,
              email: admin.email,
              details: { repName: body.repName, userId: body.userId, username: result.username, client: "android" },
            }),
          );
          revalidatePath("/", "layout");
        }
        return json(result, result.ok ? 200 : 400);
      }
      case "setDisplayName": {
        const key = normalizeName(body.repName);
        if (!key) return json({ ok: false, reason: "invalid" }, 400);
        const value = body.displayName.trim().slice(0, 120);
        const settings = await loadAppSettings();
        const sellerDisplayNames = { ...(settings.sellerDisplayNames ?? {}) };
        if (!value || normalizeName(value) === key) delete sellerDisplayNames[key];
        else sellerDisplayNames[key] = value;
        await saveAppSettings({ ...settings, sellerDisplayNames });
        revalidatePath("/", "layout");
        return json({ ok: true });
      }
      case "setAndroidDownload": {
        const settings = await loadAppSettings();
        await saveAppSettings({ ...settings, androidDownload: body.variant });
        revalidatePath("/", "layout");
        return json({ ok: true });
      }
    }
  } catch (error) {
    console.error("[app admin accounts] patch failed:", error);
    return json({ ok: false, reason: "error" }, 502);
  }
}
