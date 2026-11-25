import { describe, expect, it } from "vitest";
import { productRuleSchema } from "@/lib/commissions/schema";

describe("product category from the Android app", () => {
  it("treats anything but slow / digital as unclassified", () => {
    for (const category of ["null", "", "fast", null, undefined]) {
      expect(productRuleSchema.parse({ key: "k", templateName: "x", category }).category).toBeNull();
    }
    expect(productRuleSchema.parse({ key: "k", templateName: "x", category: "slow" }).category).toBe("slow");
    expect(productRuleSchema.parse({ key: "k", templateName: "x", category: "digital" }).category).toBe("digital");
  });
});
