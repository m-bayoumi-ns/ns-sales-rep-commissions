import "server-only";
import { ping } from "@/lib/commissions/notifications";
import { readJson, writeJson } from "@/lib/commissions/storage";

/**
 * Sign-ins per user (Supabase Storage, ns-sales-rep-commissions/app/logins/<userId>.json), so the Android WebView app can
 * warn the owner when their account is signed in somewhere else. Each entry carries the Supabase session id:
 * the app compares it with its own session and only reports other sessions.
 */
const KEEP = 20;

export type LoginEvent = {
  at: string;
  sessionId: string | null;
  /** Short description of the device, e.g. "Chrome · Windows" or "NS app · Android". */
  device: string;
};

const fileOf = (userId: string) => `ns-sales-rep-commissions/app/logins/${userId.replace(/[^a-zA-Z0-9-]/g, "")}.json`;

/** The `session_id` claim of a Supabase access token (no verification needed: the token was just issued to us). */
export function sessionIdOf(accessToken: string | undefined | null): string | null {
  try {
    const payload = JSON.parse(Buffer.from(String(accessToken).split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

export function describeDevice(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  const os = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iPhone"
      : /windows/i.test(ua)
        ? "Windows"
        : /mac os x|macintosh/i.test(ua)
          ? "Mac"
          : /linux/i.test(ua)
            ? "Linux"
            : "";
  const app = /NSCommissionsApp/.test(ua)
    ? "NS app"
    : /edg\//i.test(ua)
      ? "Edge"
      : /opr\/|opera/i.test(ua)
        ? "Opera"
        : /samsungbrowser/i.test(ua)
          ? "Samsung Internet"
          : /chrome|crios/i.test(ua)
            ? "Chrome"
            : /firefox|fxios/i.test(ua)
              ? "Firefox"
              : /safari/i.test(ua)
                ? "Safari"
                : "Browser";
  return os ? `${app} · ${os}` : app;
}

export async function recordLogin(userId: string, event: LoginEvent) {
  try {
    const current = (await readJson<{ items?: LoginEvent[] }>(fileOf(userId)))?.items ?? [];
    await writeJson(fileOf(userId), { items: [event, ...current].slice(0, KEEP) });
    // Open copies of the app hear this on the realtime channel and check for news at once.
    await ping();
  } catch (error) {
    console.error("[logins] could not record sign-in:", error);
  }
}

export async function loginsFor(userId: string): Promise<LoginEvent[]> {
  return (await readJson<{ items?: LoginEvent[] }>(fileOf(userId)))?.items ?? [];
}
