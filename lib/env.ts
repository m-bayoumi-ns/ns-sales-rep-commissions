import { z } from "zod";
import { supabaseEnv } from "@/lib/supabase/active";

/**
 * Environment variables, validated on use. Public values may reach the browser;
 * everything else must only be read in server code.
 *
 * Supabase 1 or 2: the Supabase variables are read for the project in use
 * (lib/supabase/active.ts — chosen in ns-dashboard Settings → Supabase); project 2's
 * are the same names with "_2".
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const adminSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

/** Odoo connection (server only). The API key is used for read-only calls only — see lib/odoo/client.ts. */
const odooSchema = z.object({
  ODOO_URL: z.url().transform((url) => url.replace(/\/+$/, "").replace(/\/(odoo|web)$/, "")),
  ODOO_DB: z.string().min(1),
  ODOO_USER: z.string().min(1),
  ODOO_API_KEY: z.string().min(1),
});

export function publicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: supabaseEnv().NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** URL + service-role key: enough for activity logs and server-side table reads. */
export function adminEnv() {
  return adminSchema.parse(supabaseEnv());
}

export function isAdminConfigured() {
  return adminSchema.safeParse(supabaseEnv()).success;
}

/** True once the Supabase URL and anon key are set (sign-in can work). */
export function isSupabaseConfigured() {
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: supabaseEnv().NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }).success;
}

export function odooEnv() {
  return odooSchema.parse(supabaseEnv());
}

export function isOdooConfigured() {
  return odooSchema.safeParse(supabaseEnv()).success;
}
