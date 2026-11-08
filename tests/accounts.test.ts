import { describe, expect, it } from "vitest";
import { rateChanges } from "@/lib/commissions/changes";
import { findSheetName } from "@/lib/commissions/names";
import { defaultSettings, settingsSchema } from "@/lib/commissions/schema";

describe("registration name check", () => {
  const sheet = ["NSR305_أحمد عادل شحاته", "أحمد مصطفى غريب", "NSR370_محمود احمد مرسي حنفى"];
  it("accepts the sheet name with or without the code and spelling variants", () => {
    expect(findSheetName("NSR305_أحمد عادل شحاته", sheet)).toBe("NSR305_أحمد عادل شحاته");
    expect(findSheetName("احمد عادل شحاتة", sheet)).toBe("NSR305_أحمد عادل شحاته");
    expect(findSheetName("احمد مصطفي غريب", sheet)).toBe("أحمد مصطفى غريب");
  });
  it("rejects names that are not in the sheet (or only partly match)", () => {
    expect(findSheetName("أحمد عادل", sheet)).toBeNull();
    expect(findSheetName("محمد علي", sheet)).toBeNull();
    expect(findSheetName("", sheet)).toBeNull();
  });
});

describe("rate changes for notifications", () => {
  const before = settingsSchema.parse({ ...defaultSettings("2026-11"), tiers: [{ from: 0, to: 111, rate: 0.05 }, { from: 111, to: 126, rate: 0.15 }, { from: 126, to: null, rate: 0.25 }] });
  it("finds nothing when nothing changed", () => {
    expect(rateChanges(before, structuredClone(before))).toEqual([]);
  });
  it("lists tier, category, rule and product changes", () => {
    const after = structuredClone(before);
    after.tiers[1].rate = 0.2;
    after.rules.oldSystemTiers[0].rate = 0.3;
    after.categoryRates.slow = 1;
    after.rules.cashBonus = 3000;
    after.products.push({ key: "x", templateId: 5, templateName: "BLOOM", code: null, variantId: null, color: null, category: "slow" });
    const kinds = rateChanges(before, after).map((change) => change.kind);
    expect(kinds).toEqual(["tier", "oldTier", "categoryRate", "productAdded", "rule"]);
  });
});

import { loginEmail, usernameFor, usernameOf } from "@/lib/accounts/usernames";

describe("seller usernames", () => {
  it("uses the employee code, else the Odoo user id, and stays unique", () => {
    const taken = new Set<string>();
    expect(usernameFor("NSR305_أحمد عادل شحاته", 5651, taken)).toBe("nsr305");
    expect(usernameFor("أحمد مصطفى غريب", 5655, taken)).toBe("rep5655");
    expect(usernameFor("NSR305 duplicate", null, taken)).toBe("nsr305-2");
  });
  it("maps usernames to sign-in emails and back", () => {
    expect(loginEmail("NSR305")).toBe("nsr305@reps.naguibselim.local");
    expect(loginEmail("Name@NaguibSelim.com")).toBe("name@naguibselim.com");
    expect(usernameOf("nsr305@reps.naguibselim.local")).toBe("nsr305");
    expect(usernameOf("name@naguibselim.com")).toBeNull();
  });
});

import { directLoginEmail } from "@/lib/accounts/usernames";

describe("sign-in identifier", () => {
  it("accepts the full sheet name with its code", () => {
    expect(directLoginEmail("NSR305_أحمد عادل شحاته")).toBe("nsr305@reps.naguibselim.local");
    expect(directLoginEmail("  nsr305 ")).toBe("nsr305@reps.naguibselim.local");
    expect(directLoginEmail("rep5655")).toBe("rep5655@reps.naguibselim.local");
    expect(directLoginEmail("Ahmed.Essam@nstextile-eg.com")).toBe("ahmed.essam@nstextile-eg.com");
  });
  it("leaves plain names to the server lookup", () => {
    expect(directLoginEmail("أحمد مصطفى غريب")).toBeNull();
  });
});
