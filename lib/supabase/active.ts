/**
 * Supabase 1 or 2 — which project this site uses.
 *
 * The choice is made by hand in ns-dashboard (Settings → Supabase) or ns-pulling-data
 * (Control): it is saved in public.backend_switch in BOTH projects, and every ns-* site
 * follows the newest row among the projects that answer (so one that is out of quota or
 * down never blocks it). NS_SUPABASE_ACTIVE=1|2 forces a project.
 *
 * Project 1 uses the usual variables; project 2 the same names with "_2"
 * (NEXT_PUBLIC_SUPABASE_URL_2, SUPABASE_SERVICE_ROLE_KEY_2, SUPABASE_S3_ENDPOINT_2 …).
 * Without the _2 variables the site simply stays on project 1, as before.
 *
 * The answer is kept in globalThis for the whole server process (proxy, pages, actions)
 * and checked again every 30 s. Plain fetch and no "server-only": the proxy uses it too.
 */
export type ProjectNo = 1 | 2;

const TTL_MS = 30_000;
const TIMEOUT_MS = 4_000;

/** Every variable that belongs to one Supabase project (project 2 = the same name + "_2"). */
const PROJECT_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_S3_ACCESS_KEY_ID", "S3_ACCESS_KEY",
  "SUPABASE_S3_SECRET_ACCESS_KEY", "S3_SECRET_KEY",
  "SUPABASE_S3_ENDPOINT", "S3_ENDPOINT",
  "SUPABASE_S3_REGION", "S3_REGION",
  "SUPABASE_STORAGE_BUCKET", "BUCKET_NAME",
  "SUPABASE_DB_URL", "DATABASE_URL",
] as const;

type Store = { no: ProjectNo; at: number };
const shared = globalThis as typeof globalThis & { __nsSupabaseActive?: Store; __nsSupabaseRefresh?: Promise<ProjectNo> | null };

const read = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

function project(no: ProjectNo) {
  const s = no === 1 ? "" : "_2";
  return {
    url: read(`NEXT_PUBLIC_SUPABASE_URL${s}`) ?? read(`SUPABASE_URL${s}`),
    anonKey: read(`NEXT_PUBLIC_SUPABASE_ANON_KEY${s}`) ?? read(`SUPABASE_ANON_KEY${s}`),
    serviceKey: read(`SUPABASE_SERVICE_ROLE_KEY${s}`),
  };
}

/** URL + service-role key set for that project. */
export function isProjectConfigured(no: ProjectNo): boolean {
  const p = project(no);
  return Boolean(p.url && p.serviceKey);
}

/** NS_SUPABASE_ACTIVE=1|2 in the environment wins over the saved choice. */
export function activeOverride(): ProjectNo | null {
  const value = read("NS_SUPABASE_ACTIVE");
  return value === "1" || value === "2" ? (Number(value) as ProjectNo) : null;
}

/** The project in use, without waiting (a stale answer is refreshed in the background). */
export function activeProject(): ProjectNo {
  const override = activeOverride();
  const stored = shared.__nsSupabaseActive;
  const no = override ?? stored?.no ?? 1;
  // Only once the server has resolved it (instrumentation.ts / proxy), so never during the build's
  // prerender; performance.now(), not Date.now(): reading the clock while rendering blocks prerendering.
  if (!override && stored && performance.now() - stored.at > TTL_MS) void refreshActiveProject();
  return no === 2 && isProjectConfigured(2) ? 2 : 1;
}

/**
 * process.env as the rest of the site expects it, but with the ACTIVE project's Supabase
 * variables under the usual names. lib/env.ts reads everything through this.
 */
export function supabaseEnv(): NodeJS.ProcessEnv {
  if (activeProject() === 1) return process.env;
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of PROJECT_KEYS) env[key] = read(`${key}_2`);
  env.NEXT_PUBLIC_SUPABASE_URL ??= env.SUPABASE_URL;
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= env.SUPABASE_ANON_KEY;
  return env;
}

type SwitchRow = { active: number; changed_at: string | null };

async function readSwitch(no: ProjectNo): Promise<SwitchRow | null> {
  const p = project(no);
  if (!p.url || !p.serviceKey) return null;
  try {
    const res = await fetch(`${p.url.replace(/\/$/, "")}/rest/v1/backend_switch?id=eq.1&select=active,changed_at`, {
      headers: { apikey: p.serviceKey, Authorization: `Bearer ${p.serviceKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as SwitchRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** The newest saved choice among the projects that answer; 1 when none answers. */
export function chooseActive(rows: (SwitchRow | null)[]): ProjectNo {
  const known = rows.filter((row): row is SwitchRow => Boolean(row));
  if (!known.length) return 1;
  known.sort((a, b) => (b.changed_at ?? "").localeCompare(a.changed_at ?? ""));
  return known[0].active === 2 ? 2 : 1;
}

/** Asks both projects now and shares the answer. */
export function refreshActiveProject(): Promise<ProjectNo> {
  shared.__nsSupabaseRefresh ??= (async () => {
    try {
      const override = activeOverride();
      let no: ProjectNo = override ?? 1;
      if (!override && isProjectConfigured(2)) {
        const previous = shared.__nsSupabaseActive?.no;
        no = chooseActive(await Promise.all([readSwitch(1), readSwitch(2)]));
        if (previous && previous !== no) console.warn(`[supabase] switched: project ${previous} → ${no}`);
      }
      shared.__nsSupabaseActive = { no, at: performance.now() };
      return no;
    } finally {
      shared.__nsSupabaseRefresh = null;
    }
  })();
  return shared.__nsSupabaseRefresh;
}

/** The project in use, asking again first when the shared answer is older than 30 s. */
export async function getActiveProject(): Promise<ProjectNo> {
  if (activeOverride()) return activeOverride()!;
  const stored = shared.__nsSupabaseActive;
  if (!stored || performance.now() - stored.at > TTL_MS) return refreshActiveProject();
  return activeProject();
}
