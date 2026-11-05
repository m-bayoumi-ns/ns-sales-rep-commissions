/**
 * Payment-method families, read from the Odoo journal a payment was registered in.
 *
 * Odoo has one journal per way of getting paid (each branch's cash box, each bank's card terminal,
 * each installment company…). Their names follow a clear pattern, so they are grouped here by name.
 * Order matters: the first matching rule wins (e.g. "Geidea - تقسيط" is an installment, not a card).
 */
export const METHOD_FAMILIES = ["cash", "card", "installment", "bank", "online", "wallet", "cod", "cheque", "other"] as const;
export type MethodFamily = (typeof METHOD_FAMILIES)[number];

/** Installment companies (consumer finance). `match` runs on the lowercase journal name. */
export const INSTALLMENT_PROVIDERS: { key: string; en: string; ar: string; match: RegExp }[] = [
  { key: "valu", en: "valU", ar: "فاليو", match: /valu|فاليو/ },
  { key: "premium", en: "Premium Card", ar: "بريميوم", match: /premium|بريميوم|بريميم/ },
  { key: "souhoola", en: "Souhoola", ar: "سهولة", match: /souhoola|سهولة|سهوله/ },
  { key: "contact", en: "Contact", ar: "كونتاكت", match: /contact|كونتاكت/ },
  { key: "aman", en: "Aman", ar: "أمان", match: /aman|امان|أمان/ },
  { key: "forsa", en: "Forsa", ar: "فرصة", match: /forsa|فرصة|فرصه/ },
  { key: "halan", en: "Halan", ar: "حالا", match: /haln|halan|حالا/ },
  { key: "khazna", en: "Khazna", ar: "خزنة", match: /khazna|خزنة تقسيط/ },
  { key: "mogo", en: "MID / Mogo", ar: "ميد / موجو", match: /mogo|ميد\/موجو|\bmid\b/ },
  { key: "blnk", en: "blnk", ar: "بلنك", match: /blnk|بلنك/ },
  { key: "belcash", en: "BelCash", ar: "بل كاش", match: /belcash|بل كاش/ },
  { key: "mylo", en: "Mylo", ar: "مايلو", match: /mylo|مايلو/ },
  { key: "sympl", en: "Simple", ar: "سيمبل", match: /simple|sympl|سيمبل/ },
  { key: "tru", en: "TRU", ar: "ترو", match: /\btru\b|ترو/ },
  { key: "seven", en: "Seven", ar: "سيفين", match: /seven|سيفين/ },
  { key: "clever", en: "Clever", ar: "كليفر", match: /clever|كليفر/ },
  { key: "geidea", en: "Geidea installments", ar: "جيديا تقسيط", match: /geidea|جيديا/ },
  { key: "fawry", en: "Fawry installments", ar: "فوري تقسيط", match: /fawry|فوري/ },
  { key: "cib", en: "CIB installments", ar: "تقسيط CIB", match: /cib/ },
];

/** Card terminals / acquirers, grouped by bank rather than by branch terminal. */
const CARD_PROVIDERS: { key: string; en: string; ar: string; match: RegExp }[] = [
  { key: "bm-visa", en: "Banque Misr cards", ar: "فيزا بنك مصر", match: /فيزا بنك مصر|بنك مصر.*فيزا/ },
  { key: "cib-visa", en: "CIB cards", ar: "فيزا CIB", match: /فيزا.*cib|cib.*فيزا/ },
  { key: "geidea", en: "Geidea", ar: "جيديا", match: /geidea|gediea|جيديا/ },
  { key: "paymob", en: "Paymob", ar: "باي موب", match: /paymob|بايموب|باى موب|باي موب/ },
];

const ONLINE_PROVIDERS: { key: string; en: string; ar: string; match: RegExp }[] = [
  { key: "fawry", en: "Fawry", ar: "فوري", match: /fawry|فوري/ },
  { key: "geidea-link", en: "Geidea (Online)", ar: "جيديا (أونلاين)", match: /link|شوبيفاي|shopify/ },
  { key: "online-shipping", en: "Online payment (couriers)", ar: "سداد أونلاين (شركات الشحن)", match: /سداد اونلاين|سداد أونلاين/ },
];

const WALLET_PROVIDERS: { key: string; en: string; ar: string; match: RegExp }[] = [
  { key: "vodafone", en: "Vodafone Cash", ar: "فودافون كاش", match: /فودافون|vodafone/ },
  { key: "etisalat", en: "e& Cash", ar: "اتصالات كاش", match: /اتصالات|etisalat|e&/ },
  { key: "instapay", en: "InstaPay", ar: "إنستاباي", match: /instapay|انستا/ },
];

const COD_PROVIDERS: { key: string; en: string; ar: string; match: RegExp }[] = [
  { key: "bosta", en: "Bosta", ar: "بوسطة", match: /bosta|بوسطة/ },
  { key: "mylerz", en: "Mylerz", ar: "مايلرز", match: /mylerz|مايلرز/ },
  { key: "aramex", en: "Aramex", ar: "أرامكس", match: /aramex|ارامكس/ },
  { key: "courier", en: "Other couriers", ar: "شركات شحن أخرى", match: /./ },
];

export type JournalClass = {
  family: MethodFamily;
  /** Stable key of the provider/group inside the family (e.g. "valu", "bm-visa", or "j:<id>"). */
  providerKey: string;
  providerEn: string;
  providerAr: string;
};

type JournalInput = { id: number; name: string; code: string; type: string };

function pick(list: { key: string; en: string; ar: string; match: RegExp }[], name: string) {
  return list.find((item) => item.match.test(name)) ?? null;
}

export function classifyJournal(journal: JournalInput): JournalClass {
  const name = journal.name.toLowerCase();
  const own = (family: MethodFamily): JournalClass => ({ family, providerKey: `j:${journal.id}`, providerEn: journal.name, providerAr: journal.name });
  const as = (family: MethodFamily, provider: { key: string; en: string; ar: string } | null): JournalClass =>
    provider ? { family, providerKey: provider.key, providerEn: provider.en, providerAr: provider.ar } : own(family);

  if (/شيكات|شيك|cheque|check|اوراق قبض|أوراق قبض/.test(name)) return as("cheque", { key: "cheques", en: "Cheques", ar: "شيكات" });
  // Only cash and bank journals receive money; sales / misc journals are never a payment method.
  if (journal.type !== "cash" && journal.type !== "bank") return own("other");
  if (/سداد عند التوصيل|\bcod\b|بوالص/.test(name)) return as("cod", pick(COD_PROVIDERS, name));
  if (/تقسيط|installment/.test(name) || /valu|فاليو|premium|بريميوم|بريميم|souhoola|سهولة/.test(name)) {
    return as("installment", pick(INSTALLMENT_PROVIDERS, name));
  }
  if (/فودافون|vodafone|اتصالات كاش|etisalat|instapay|انستاباي|محفظة|wallet/.test(name)) return as("wallet", pick(WALLET_PROVIDERS, name));
  if (/fawry|فوري|link|شوبيفاي|shopify|سداد اونلاين|سداد أونلاين/.test(name)) return as("online", pick(ONLINE_PROVIDERS, name));
  if (/فيزا|visa|mastercard|geidea|gediea|جيديا|paymob|بايموب|باى موب|باي موب|pos/.test(name)) return as("card", pick(CARD_PROVIDERS, name));
  if (/شركات شقيقة|شركات شقيقه/.test(name)) return own("other");
  if (journal.type === "cash") return as("cash", { key: "cash", en: "Cash (branch treasuries)", ar: "نقدي (خزائن الفروع)" });
  if (journal.type === "bank") return as("bank", { key: "bank", en: "Bank transfer / deposit", ar: "تحويل / إيداع بنكي" });
  return own("other");
}

/**
 * Fixed categorical order (validated for colour-blind separation; see dataviz palette) —
 * a family keeps its colour whatever the filters show. "other" is a neutral grey.
 */
export const FAMILY_COLOR_VAR: Record<MethodFamily, string> = {
  cash: "var(--series-1)",
  card: "var(--series-2)",
  installment: "var(--series-3)",
  bank: "var(--series-4)",
  online: "var(--series-5)",
  wallet: "var(--series-6)",
  cod: "var(--series-7)",
  cheque: "var(--series-8)",
  other: "var(--series-other)",
};

// ---------------------------------------------------------------- the six payment methods of this report
/**
 * The report shows six methods. Online payments (Fawry, payment links) and card terminals count as
 * "POS"; mobile wallets (e& Cash, Vodafone Cash, InstaPay) count as "Banks"; journals that are not a
 * payment method ("other") are left out.
 */
export const PAY_METHODS = ["cash", "bank", "pos", "installment", "cheque", "cod"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export function payMethodOf(family: MethodFamily): PayMethod | null {
  switch (family) {
    case "card":
    case "online":
      return "pos";
    case "wallet":
      return "bank";
    case "other":
      return null;
    default:
      return family;
  }
}

export const PAY_METHOD_COLOR_VAR: Record<PayMethod, string> = {
  cash: "var(--series-1)",
  bank: "var(--series-4)",
  pos: "var(--series-2)",
  installment: "var(--series-3)",
  cheque: "var(--series-8)",
  cod: "var(--series-7)",
};
