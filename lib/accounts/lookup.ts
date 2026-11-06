import "server-only";
import { PROFILE_TABLE } from "@/lib/auth/profile";
import { normalizeName } from "@/lib/commissions/names";
import { isAdminConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Sign-in with the seller's name (as in the target sheet, without the code): the email of the one seller
 * account with that name, or null. Only accounts created by this site are searched.
 */
export async function emailForSellerName(typed: string): Promise<string | null> {
  const wanted = normalizeName(typed);
  if (!wanted || !isAdminConfigured()) return null;
  const { data, error } = await createSupabaseAdminClient()
    .from(PROFILE_TABLE)
    .select("email, full_name, sales_reps")
    .eq("branch_filter_type", "sales_rep")
    .contains("allowed_pages", ["sales-commissions"]);
  if (error) {
    console.error("[signIn] seller name lookup failed:", error.message);
    return null;
  }
  const matches = (data ?? []).filter((row) => [row.full_name, ...(row.sales_reps ?? [])].some((name) => name && normalizeName(name) === wanted));
  return matches.length === 1 && matches[0].email ? String(matches[0].email).toLowerCase() : null;
}
