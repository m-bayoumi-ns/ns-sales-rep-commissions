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
import { readBearerUser } from "@/lib/auth/bearer";
import { isAdmin } from "@/lib/auth/permissions";
import { normalizeName } from "@/lib/commissions/names";
import { ANDROID_VARIANTS } from "@/lib/android-app";

export async function GET(request: NextRequest) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  try {
    const [accounts, settings] = await Promise.all([listSellerAccounts(), loadAppSettings()]);
    const sheet = await sheetRepAccounts(accounts);
    return json({
      accounts: accounts.filter((account) => !sheet?.reps.some((rep) => rep.account?.id === account.id)),
      sheet,
      autoApprove: settings.autoApprove,
      androidDownload: settings.androidDownload ?? "native",
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (error) {
    console.error("[app admin accounts] failed to load:", error);
    return json({ error: "load_failed" }, 502);
  }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("active"), userId: z.string().min(1).max(64), value: z.boolean() }),
  z.object({ action: z.literal("forcePassword"), userId: z.string().min(1).max(64), value: z.boolean() }),
  z.object({ action: z.literal("autoApprove"), value: z.boolean() }),
  z.object({ action: z.literal("createSheetAccounts"), names: z.array(z.string().trim().min(1).max(200)).max(500).default([]) }),
  z.object({ action: z.literal("username"), repName: z.string().trim().min(1).max(200), userId: z.string().min(1).max(64).nullable().default(null), username: z.string().max(64) }),
  z.object({ action: z.literal("displayName"), repName: z.string().trim().min(1).max(200), value: z.string().trim().max(120) }),
  z.object({ action: z.literal("androidDownload"), value: z.enum(ANDROID_VARIANTS) }),
]);

export async function PATCH(request: NextRequest) {
  const user = await readAdmin(request);
  if (user instanceof NextResponse) return user;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "invalid_input" }, 400);
  }
  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_input" }, 400);

  try {
    const action = parsed.data;
    switch (action.action) {
      case "active":
        await setSellerActive(action.userId, action.value);
        after(() => logActivity({ action: action.value ? "approve_account" : "disable_account", userId: user.id, email: user.email, details: { target: action.userId } }));
        break;
      case "forcePassword":
        await setMustChangePassword(action.userId, action.value);
        after(() => logActivity({ action: "force_password_change", userId: user.id, email: user.email, details: { target: action.userId, value: action.value } }));
        break;
      case "autoApprove": {
        const settings = await loadAppSettings();
        await saveAppSettings({ ...settings, autoApprove: action.value });
        break;
      }
      case "createSheetAccounts": {
        const results = await createSheetAccounts(action.names);
        after(() => logActivity({ action: "approve_account", userId: user.id, email: user.email, details: { created: results.filter((row) => row.status === "created").map((row) => row.username) } }));
        return json({ ok: true, results });
      }
      case "username": {
        const result = await setSellerUsername({ repName: action.repName, userId: action.userId, username: action.username });
        if (!result.ok) return json({ error: result.reason, detail: result.detail }, 400);
        after(() => logActivity({ action: "username_changed", userId: user.id, email: user.email, details: { repName: action.repName, userId: action.userId, username: result.username } }));
        return json({ ok: true, username: result.username });
      }
      case "displayName": {
        const settings = await loadAppSettings();
        const sellerDisplayNames = { ...(settings.sellerDisplayNames ?? {}) };
        const key = normalizeName(action.repName);
        if (action.value) sellerDisplayNames[key] = action.value;
        else delete sellerDisplayNames[key];
        await saveAppSettings({ ...settings, sellerDisplayNames });
        after(() => logActivity({ action: "seller_display_name_changed", userId: user.id, email: user.email, details: { repName: action.repName, displayName: action.value || null } }));
        break;
      }
      case "androidDownload": {
        const settings = await loadAppSettings();
        await saveAppSettings({ ...settings, androidDownload: action.value });
        after(() => logActivity({ action: "android_download_changed", userId: user.id, email: user.email, details: { value: action.value } }));
        break;
      }
    }
    return json({ ok: true });
  } catch (error) {
    console.error("[app admin accounts] update failed:", error);
    return json({ error: "update_failed" }, 502);
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
