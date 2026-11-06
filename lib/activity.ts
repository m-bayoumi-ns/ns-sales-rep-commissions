import "server-only";
import { isDemoMode } from "@/lib/dev";
import { isAdminConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ActivityAction =
  | "sign_in"
  | "sign_in_failed"
  | "sign_out"
  | "view_page"
  | "export"
  | "register"
  | "change_password"
  | "approve_account"
  | "disable_account"
  | "force_password_change"
  | "notify"
  | "username_changed"
  | "android_download_changed";

/**
 * Writes one row to public.activity_logs. Never throws: logging must not break a
 * page or a sign-in. Call it inside `after()` so it runs once the response is sent.
 */
export async function logActivity(entry: {
  action: ActivityAction;
  userId?: string | null;
  email?: string | null;
  details?: Record<string, unknown>;
}) {
  // Skip silently until the service-role key is configured, and for the local demo user.
  if (!isAdminConfigured() || isDemoMode()) return;
  try {
    const { error } = await createSupabaseAdminClient()
      .from("activity_logs")
      .insert({
        action: entry.action,
        user_id: entry.userId ?? null,
        email: entry.email ?? null,
        details: entry.details ?? {},
      });
    if (error) console.error("[activity] insert failed:", error.message);
  } catch (error) {
    console.error("[activity] insert failed:", error);
  }
}
