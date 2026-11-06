import { beforeEach, describe, expect, it, vi } from "vitest";

const files = new Map<string, unknown>();
const sent: { endpoint: string; payload: unknown }[] = [];
let failWith: number | null = null;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/dev", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/env", () => ({ isAdminConfigured: () => true, adminEnv: () => ({ SUPABASE_SERVICE_ROLE_KEY: "service-key" }) }));
vi.mock("@/lib/commissions/storage", () => ({
  readJson: async (p: string) => (files.has(p) ? structuredClone(files.get(p)) : null),
  writeJson: async (p: string, v: unknown) => void files.set(p, structuredClone(v)),
  removeFile: async (p: string) => void files.delete(p),
  listFiles: async (folder: string) => [...files.keys()].filter((k) => k.startsWith(`${folder}/`) && !k.slice(folder.length + 1).includes("/")).map((k) => k.slice(folder.length + 1)),
  listFolders: async (folder: string) => [...new Set([...files.keys()].filter((k) => k.startsWith(`${folder}/`)).map((k) => k.slice(folder.length + 1).split("/")[0]))],
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ auth: { admin: { getUserById: async (id: string) => ({ data: { user: { id, email: "rep@x", app_metadata: {} } } }) } } }),
}));
vi.mock("@/lib/auth/profile", () => ({ loadAppUser: async (_: unknown, claims: { sub: string }) => ({ id: claims.sub, active: true }) }));
vi.mock("@/lib/app/feed", () => ({
  buildFeed: async (_user: unknown, client: { installId: string }) => [{ id: `welcome-${client.installId}`, channel: "commission", title: "On", body: "Works", path: "/commissions" }],
}));
vi.mock("web-push", () => ({
  default: {
    generateVAPIDKeys: () => ({ publicKey: "PUB", privateKey: "PRIV" }),
    sendNotification: async (sub: { endpoint: string }, payload: string) => {
      if (failWith) throw Object.assign(new Error("gone"), { statusCode: failWith });
      sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
    },
  },
}));

const push = await import("@/lib/app/push");
const sub = { endpoint: "https://push.example/abc", keys: { p256dh: "k", auth: "a" } };

beforeEach(() => {
  files.clear();
  sent.length = 0;
  failWith = null;
});

describe("web push", () => {
  it("creates VAPID keys once and reuses them", async () => {
    expect((await push.vapidKeys()).publicKey).toBe("PUB");
    expect(files.has("ns-sales-rep-commissions/app/vapid.json")).toBe(true);
  });

  it("pushes feed items to a saved subscription, with the locale in the link", async () => {
    await push.saveSubscription("user-1", sub, "ar", "Safari · iPhone");
    expect(await push.pushFeedFor("user-1")).toBe(1);
    expect(sent[0]).toMatchObject({ endpoint: sub.endpoint, payload: { title: "On", body: "Works", url: "/ar/commissions" } });
    expect(await push.pushFeedForAll()).toEqual({ users: 1, sent: 1 });
  });

  it("drops a subscription the browser no longer accepts", async () => {
    await push.saveSubscription("user-1", sub, "en", "Chrome · Windows");
    failWith = 410;
    await push.pushFeedFor("user-1");
    expect([...files.keys()].some((k) => k.includes("/push/user-1/"))).toBe(false);
  });

  it("checks the schedule key", () => {
    const key = push.cronKey()!;
    expect(key).toHaveLength(64);
    expect(push.isValidCronKey(key)).toBe(true);
    expect(push.isValidCronKey("x".repeat(64))).toBe(false);
    expect(push.isValidCronKey(null)).toBe(false);
  });
});
