import { type NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { logActivity } from "@/lib/activity";
import { readBearerUser } from "@/lib/auth/bearer";
import { canAccessPage, isAdmin, isSeller } from "@/lib/auth/permissions";
import { hasRates } from "@/lib/commissions/schema";
import { ALL_REPS, getCommissionsView, repOptions, resolveMonth } from "@/lib/commissions/view";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { normalizeName } from "@/lib/commissions/names";
import { isOdooConfigured } from "@/lib/env";

export const maxDuration = 60;

/**
 * The Commissions page as JSON, for the native Android app (ns-sales-rep-commissions-app).
 * Same data, permissions and calculation as /[locale]/commissions; authenticated with a Supabase access token
 * (`Authorization: Bearer …`). Query: ?month=YYYY-MM&rep=<rep key | "all">. Read-only.
 */
export async function GET(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user) return json({ error: "signed_out" }, 401);
  if (!user.active) return json({ error: "inactive" }, 403);
  if (user.mustChangePassword) return json({ error: "must_change_password" }, 403);
  if (!canAccessPage(user, "sales-commissions")) return json({ error: "no_access" }, 403);
  if (!isOdooConfigured()) return json({ error: "not_connected" }, 503);

  const params = request.nextUrl.searchParams;
  const month = resolveMonth(params.get("month") ?? undefined);
  const repKey = params.get("rep") ?? undefined;
  let view;
  let sellerDisplayNames: Record<string, string>;
  try {
    [view, sellerDisplayNames] = await Promise.all([
      getCommissionsView(user, month, repKey),
      loadAppSettings().then((settings) => settings.sellerDisplayNames ?? {}),
    ]);
  } catch (error) {
    console.error("[app commissions] failed to load:", error);
    return json({ error: "load_failed" }, 502);
  }
  after(() => logActivity({ action: "view_page", userId: user.id, email: user.email, details: { page: "sales-commissions", month, rep: repKey ?? null, client: "android" } }));

  const admin = isAdmin(user);
  const notices: { key: string; tone: "info" | "warn"; from?: string; names?: string[] }[] = [];
  if (view.source === "default" || !hasRates(view.settings)) notices.push({ key: "noRates", tone: "warn" });
  else if (view.source === "inherited" && view.inheritedFrom) notices.push({ key: "inherited", tone: "info", from: view.inheritedFrom });
  if (!view.sheetFound && admin) notices.push({ key: "noSheet", tone: "warn" });
  if (view.unlinked.length && admin) notices.push({ key: "unlinked", tone: "warn", names: view.unlinked });

  const { tiers, categoryRates, rules } = view.settings;
  const reps = view.reps.map((rep) => ({
    ...rep,
    name: sellerDisplayNames[normalizeName(rep.name)] ?? rep.name,
  }));
  return json({
    user: { name: user.name, email: user.email, admin, seller: isSeller(user), salesRepLimited: user.branchFilterType === "sales_rep" && !admin },
    fetchedAt: view.fetchedAt,
    clock: view.clock,
    months: view.months,
    settings: { tiers, categoryRates, rules },
    notices,
    allReps: ALL_REPS,
    repOptions: repOptions(view.reps, sellerDisplayNames),
    reps,
    totals: view.totals,
    detail: view.detail,
  });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
