import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/lib/commissions/storage", () => ({ readJson: vi.fn(), writeJson: vi.fn() }));
vi.mock("@/lib/commissions/notifications", () => ({ notificationsFor: vi.fn() }));
vi.mock("@/lib/commissions/view", () => ({ getCommissionsView: vi.fn(), resolveMonth: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ isSeller: vi.fn() }));

const { commissionChanges } = await import("@/lib/app/feed");
const { describeDevice, sessionIdOf } = await import("@/lib/app/logins");

// Fake translator: returns "key|json(values)" so the test can see what was chosen.
const t = Object.assign((key: string, values?: Record<string, unknown>) => (values ? `${key}|${JSON.stringify(values)}` : key), {
  has: (key: string) => key.startsWith("adjustments.") && key !== "adjustments.unknown",
}) as never;

const base = {
  month: "2026-11",
  total: 1000,
  regime: "old" as const,
  achievement: 65,
  adjustments: { cash: { met: false, applies: true, amount: 0 }, salesLadder: { met: true, applies: true, amount: 500 } },
};

describe("app feed: commission changes", () => {
  it("reports nothing when nothing changed", () => {
    expect(commissionChanges(base, base, t, "en")).toEqual([]);
  });

  it("reports the total going up and down", () => {
    const up = commissionChanges(base, { ...base, total: 1250 }, t, "en");
    expect(up).toHaveLength(1);
    expect(up[0].title).toBe("total.upTitle");
    expect(up[0].body).toContain('"change":"250"');
    const down = commissionChanges(base, { ...base, total: 900 }, t, "en");
    expect(down[0].title).toBe("total.downTitle");
  });

  it("reports a system change, bonuses earned, lost and changed", () => {
    const after = {
      ...base,
      regime: "full" as const,
      adjustments: { cash: { met: true, applies: true, amount: 2000 }, salesLadder: { met: true, applies: true, amount: 750 } },
    };
    const titles = commissionChanges(base, after, t, "en").map((item) => item.title);
    expect(titles).toEqual(["regime.title", "adjustment.earnedTitle", "adjustment.changedTitle"]);
    const lost = commissionChanges(after, { ...after, adjustments: { ...after.adjustments, cash: { met: false, applies: true, amount: 0 } } }, t, "en");
    expect(lost.map((item) => item.title)).toEqual(["adjustment.lostTitle"]);
  });

  it("describes devices and reads the session id", () => {
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36")).toBe("Chrome · Windows");
    expect(describeDevice("Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36 NSCommissionsApp/1.0.6")).toBe("NS app · Android");
    const payload = Buffer.from(JSON.stringify({ session_id: "abc-123" })).toString("base64url");
    expect(sessionIdOf(`x.${payload}.y`)).toBe("abc-123");
    expect(sessionIdOf("garbage")).toBeNull();
  });
});
