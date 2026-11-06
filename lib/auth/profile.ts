import "server-only";
import type { JwtPayload, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { type AppUser, PERMISSION_TYPES } from "./types";

/**
 * User profile and permissions come only from the `public.profiles` row whose
 * `id` is the Supabase Auth user id. Auth claims are used only for identity.
 */
export const PROFILE_TABLE = "profiles";

const textList = z
  .array(z.string())
  .nullish()
  .transform((list) => (list ?? []).map((item) => item.trim()).filter(Boolean));

const permissionSchema = z.object({
  email: z.email().nullish(),
  full_name: z.string().nullish(),
  job_title: z.string().nullish(),
  permission_type: z.enum(PERMISSION_TYPES).nullish(),
  branch_filter_type: z.enum(["branch", "sales_rep"]).nullish(),
  branches: textList,
  sales_reps: textList,
  allowed_pages: textList,
  is_active: z.boolean().nullish(),
});

async function readProfileRow(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select(
      "email, full_name, job_title, permission_type, branch_filter_type, branches, sales_reps, allowed_pages, is_active",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(`[profile] failed to read ${PROFILE_TABLE}:`, error.message);
    return null;
  }
  if (!data) return null;

  const parsed = permissionSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`[profile] invalid row in ${PROFILE_TABLE}:`, parsed.error.message);
    return null;
  }
  return parsed.data;
}

export async function loadAppUser(supabase: SupabaseClient, claims: JwtPayload): Promise<AppUser> {
  const fields = await readProfileRow(supabase, claims.sub);
  const email = fields?.email?.trim().toLowerCase() || String(claims.email ?? "").toLowerCase();

  return {
    id: claims.sub,
    email,
    name: fields?.full_name?.trim() || email.split("@")[0] || email,
    jobTitle: fields?.job_title?.trim() || null,
    // No permission record → treated as specific_branches with no branches (no data).
    permissionType: fields?.permission_type ?? "specific_branches",
    branchFilterType: fields?.branch_filter_type ?? "branch",
    branches: fields?.branches ?? [],
    salesReps: fields?.sales_reps ?? [],
    allowedPages: fields?.allowed_pages ?? [],
    active: fields?.is_active ?? true,
    // Kept in the Auth user's app_metadata (only the service role can write it).
    mustChangePassword: Boolean((claims.app_metadata as { must_change_password?: unknown } | undefined)?.must_change_password),
  };
}
