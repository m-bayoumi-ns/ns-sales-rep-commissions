import { describe, expect, it } from "vitest";
import { cleanRepName, matchProductName, matchRep } from "@/lib/commissions/names";

/** Salesperson names as they appear in Odoo (wholesale, 2026). */
const odoo = ["Aml accountant", "NSR305_أحمد عادل شحاته", "NSR370_محمود احمد مرسي حنفى", "NSR877_اسامة سمير عريان", "أحمد مصطفي غريب", "حسام عبد الحميد عبد الخالق", "NSR2619_فاطمة راضى سعد", "NSR2928_احمد محمد السيد", "محمد سيد محمد السيد - 1009913619", "NSR2916_كريم محمد محسن عبدالفتاح ابراهيم", "NSR3650-محمد محمد الورداني السيد سيد احمد", "NSR911_علاء فريد أمين محمود", "علاء فريد", "NSR3098-فتحى السيد فتحي على محمد هيكل", "NSR2182_هشام يوسف ابو النجا", "NSR2817_اسلام ابو زيد فؤاد", "(MTR-R) عبد العزيز صلاح", "NSR2938_ابرام ثروت سمير عريان", "NSR1789_اسامة محمد عبدالعاطى", "NSR2531_احمد فتحى السيد", "NSR3865-حسن ايهاب بهجت السيد خليل", "NSR3912-حازم السعيد رشاد ابو عرام", "NSR3950-حسين عصام غريب حسن", "NSR3914-محمود السعيد حسنين حسنين كحله", "Wholes sales", "NSR3949-حسام جمال الدين محمد احمد", "NSR36_رمضان احمد رمضان عيد", "NSR2927_ادم اسامه سمير عريان", "NSR141_عبد النعيم احمد عبد النعيم عبد الغني", "مخزن الامل", "(محاسب فرع) مصطفي محمود", "NSR3965-خالد عبدالقوى حسين محمد احمد", "NSR1686_حازم محمد عبد العاطى", "NSR2975_عبدالرحمن عمرو محمد عطوان عبدالرحمن"].map((name, id) => ({ id, name }));

describe("rep names", () => {
  it("strips codes and phone numbers", () => {
    expect(cleanRepName("NSR370_محمود احمد مرسي حنفى")).toBe("محمود احمد مرسي حنفى");
    expect(cleanRepName("NSR3650-محمد محمد الورداني")).toBe("محمد محمد الورداني");
    expect(cleanRepName("محمد سيد محمد السيد - 1009913619")).toBe("محمد سيد محمد السيد");
  });
  it.each([
    ["أحمد عادل شحاته", "NSR305_أحمد عادل شحاته"],
    ["محمود احمد مرسي", "NSR370_محمود احمد مرسي حنفى"],
    ["اسامة سمير عريان", "NSR877_اسامة سمير عريان"],
    ["احمد مصطفى غريب", "أحمد مصطفي غريب"],
    ["حسام عبدالحميد عبدالخالق", "حسام عبد الحميد عبد الخالق"],
    ["فاطمه راضي سعد", "NSR2619_فاطمة راضى سعد"],
    ["محمد سيد محمد السيد", "محمد سيد محمد السيد - 1009913619"],
    ["كريم محمد محسن", "NSR2916_كريم محمد محسن عبدالفتاح ابراهيم"],
    ["علاء فريد أمين محمود", "NSR911_علاء فريد أمين محمود"],
  ])("%s → %s", (sheet, expected) => {
    expect(matchRep(sheet, odoo)?.name).toBe(expected);
  });
});

describe("product name matching", () => {
  const products = [
    { id: 1, name: "Slow Fabric", code: "SF-01" },
    { id: 2, name: "Digital Service", code: null },
  ];

  it("matches normalized exact product names and internal codes", () => {
    expect(matchProductName("slow   fabric", products)?.id).toBe(1);
    expect(matchProductName("SF-01", products)?.id).toBe(1);
    expect(matchProductName("FLORA", [{ id: 3, name: "[000640] FLORA", code: "000640" }])?.id).toBe(3);
  });

  it("rejects partial names and ambiguous exact matches", () => {
    expect(matchProductName("Slow", products)).toBeNull();
    expect(matchProductName("Slow Fabric", [...products, { id: 3, name: "Slow Fabric", code: null }])).toBeNull();
  });
});
