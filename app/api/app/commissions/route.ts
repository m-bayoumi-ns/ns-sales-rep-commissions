import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { readBearerUser } from "@/lib/auth/bearer";
import { canAccessPage, isAdmin, isSeller } from "@/lib/auth/permissions";
import { hasRates } from "@/lib/commissions/schema";
import { ALL_REPS, getCommissionsView, repOptions, resolveMonth } from "@/lib/commissions/view";
import { isOdooConfigured } from "@/lib/env";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * JSON counterpart of the `/[locale]/commissions` page for the native Android app.
 * Authenticated with `Authorization: Bearer <Supabase access token>`.
 */
export async function GET(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user) return json({ error: "signed_out" }, 401);
  if (!user.active) return json({ error: "inactive", email: user.email }, 403);
  if (user.mustChangePassword) {
    return json({
      error: "must_change_password",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: isAdmin(user) ? "admin" : isSeller(user) ? "seller" : "manager",
        mustChangePassword: true,
        linkedRep: isSeller(user) ? (user.salesReps[0] ?? null) : null,
      },
    }, 403);
  }
  if (!canAccessPage(user, "sales-commissions")) return json({ error: "no_access", email: user.email }, 403);
  if (!isOdooConfigured()) return json({ error: "not_connected" }, 503);

  const month = resolveMonth(request.nextUrl.searchParams.get("month") ?? undefined);
  const repKey = request.nextUrl.searchParams.get("rep") ?? undefined;
  let view;
  try {
    view = await getCommissionsView(user, month, repKey);
  } catch (error) {
    console.error("[app commissions] failed to load:", error);
    return json({ error: "load_failed" }, 502);
  }
  const appSettings = await loadAppSettings().catch(() => ({ sellerDisplayNames: {} as Record<string, string> }));
  const displayNames = appSettings.sellerDisplayNames ?? {};

  after(() =>
    logActivity({
      action: "view_page",
      userId: user.id,
      email: user.email,
      details: { page: "sales-commissions", month, rep: repKey ?? null, client: "android" },
    }),
  );

  const admin = isAdmin(user);
  const seller = isSeller(user);
  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: admin ? "admin" : seller ? "seller" : "manager",
      mustChangePassword: user.mustChangePassword,
      linkedRep: seller ? (user.salesReps[0] ?? null) : null,
    },
    selectedRep: view.detail ? view.detail.rep.key : ALL_REPS,
    repOptions: repOptions(view.reps, displayNames),
    displayNames,
    hasRates: hasRates(view.settings),
    view: {
      ...view,
      unlinked: admin ? view.unlinked : [],
    },
  });
}
