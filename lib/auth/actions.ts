"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { isLocale, routing } from "@/i18n/routing";
import { logActivity } from "@/lib/activity";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearFailures, isLocked, recordFailure } from "./rate-limit";
import { safeNextPath } from "./safe-next";
import { directLoginEmail } from "@/lib/accounts/usernames";
import { emailForSellerName } from "@/lib/accounts/lookup";
import { describeDevice, recordLogin, sessionIdOf } from "@/lib/app/logins";
import { pushFeedFor } from "@/lib/app/push";

export type SignInState = {
  status: "idle" | "invalid" | "locked" | "not_configured" | "error";
  fieldErrors?: { email?: true; password?: true };
  email?: string;
};

const credentials = z.object({
  // A work email, or a seller username (e.g. "nsr305") created from the target sheet.
  email: z.string().trim().min(2).max(254),
  password: z.string().min(1).max(200),
});

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const localeField = String(formData.get("locale") ?? "");
  const locale = isLocale(localeField) ? localeField : routing.defaultLocale;
  const rawEmail = String(formData.get("email") ?? "");

  const parsed = credentials.safeParse({ email: rawEmail, password: formData.get("password") });
  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((issue) => issue.path[0]));
    return {
      status: "idle",
      email: rawEmail,
      fieldErrors: { email: fields.has("email") || undefined, password: fields.has("password") || undefined },
    };
  }
  if (!isSupabaseConfigured()) return { status: "not_configured", email: rawEmail };

  const { password } = parsed.data;
  // Email, username, or the seller's name as written in the target sheet.
  const email = directLoginEmail(parsed.data.email) ?? (await emailForSellerName(parsed.data.email));
  if (!email) return { status: "invalid", email: rawEmail };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limitKeys = [`email:${email}`, `ip:${ip}`];
  if (isLocked(limitKeys)) return { status: "locked", email: rawEmail };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    recordFailure(limitKeys);
    after(() => logActivity({ action: "sign_in_failed", email, details: { ip, reason: error?.code ?? "unknown" } }));
    // Supabase reports wrong email and wrong password the same way — so do we.
    const isCredentials = !error || error.code === "invalid_credentials" || error.status === 400;
    if (!isCredentials) console.error("[signIn] Supabase sign-in failed:", error);
    return { status: isCredentials ? "invalid" : "error", email: rawEmail };
  }

  clearFailures(limitKeys);
  after(() => logActivity({ action: "sign_in", userId: data.user.id, email, details: { ip } }));
  // Lets the user's Android app warn them about a sign-in from another device.
  const device = describeDevice((await headers()).get("user-agent"));
  const sessionId = sessionIdOf(data.session?.access_token);
  after(async () => {
    await recordLogin(data.user.id, { at: new Date().toISOString(), sessionId, device });
    await pushFeedFor(data.user.id);
  });
  redirect(safeNextPath(String(formData.get("next") ?? ""), locale));
}

export async function signOut(locale: string) {
  const supabase = isSupabaseConfigured() ? await createSupabaseServerClient() : null;
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    await supabase.auth.signOut();
    if (data?.claims) {
      const claims = data.claims;
      after(() => logActivity({ action: "sign_out", userId: claims.sub, email: claims.email ?? null }));
    }
  }
  redirect(`/${isLocale(locale) ? locale : routing.defaultLocale}/login`);
}
