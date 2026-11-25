/**
 * Runs once when the server starts, before it serves requests: find out which Supabase
 * project is in use (lib/supabase/active.ts), so the very first request already uses it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { refreshActiveProject } = await import("@/lib/supabase/active");
  try {
    const no = await refreshActiveProject();
    console.log(`[supabase] using project ${no}`);
  } catch (error) {
    console.error("[supabase] could not resolve the active project, using 1:", error);
  }
}
