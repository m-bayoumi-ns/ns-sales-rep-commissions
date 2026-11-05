import { z } from "zod";

/**
 * Environment variables, validated once. Public values may reach the browser;
 * everything else must only be read in server code.
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
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** URL + service-role key: enough for activity logs and server-side table reads. */
export function adminEnv() {
  return adminSchema.parse(process.env);
}

export function isAdminConfigured() {
  return adminSchema.safeParse(process.env).success;
}

/** True once the Supabase URL and anon key are set (sign-in can work). */
export function isSupabaseConfigured() {
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }).success;
}

export function odooEnv() {
  return odooSchema.parse(process.env);
}

export function isOdooConfigured() {
  return odooSchema.safeParse(process.env).success;
}
