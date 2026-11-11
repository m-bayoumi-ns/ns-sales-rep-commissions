import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "https://ns-sales-rep-commissions.vercel.app";
export const APP_DOWNLOAD_PAGE = "https://ns-scw.bayoumi.dev/ar/get-app";
export const WHATSAPP_NUMBER = "+201277909022";
export const WHATSAPP_URL = "https://wa.me/201277909022";

export const STORAGE_KEYS = {
  SESSION: "ns_session",
  REMEMBER_ME: "ns_remember_me",
  SAVED_CREDS: "ns_saved_creds",
  BIOMETRICS_ENABLED: "ns_biometrics_enabled",
  THEME_MODE: "ns_theme_mode",
  OFFLINE_DATA: "ns_offline_commissions",
};

export const DemoRepDetail = {
  repName: "نجيب سليم (عرض توضيحي)",
  repCode: "NSR305",
  target: 500000,
  salesMtd: 390000,
  projectedSales: 520000,
  achievementRate: 0.78,
  runRateCommission: 24500,
  commissionMtd: 18450,
  collectionsTotal: 410000,
  collectionsRate: 1.05,
  outstandingCustomerDebt: 165000,
  salesByDay: [
    { label: "1 نوفمبر", amount: 18500, invoicesCount: 3 },
    { label: "2 نوفمبر", amount: 24200, invoicesCount: 5 },
    { label: "3 نوفمبر", amount: 19800, invoicesCount: 4 },
    { label: "4 نوفمبر", amount: 31000, invoicesCount: 6 },
    { label: "5 نوفمبر", amount: 27400, invoicesCount: 4 },
    { label: "6 نوفمبر", amount: 22100, invoicesCount: 3 },
    { label: "7 نوفمبر", amount: 35000, invoicesCount: 7 },
  ],
  salesByCustomer: [
    { name: "شركة النور للمقاولات", amount: 84000, balance: 22000 },
    { name: "مؤسسة الأهرام التجارية", amount: 65000, balance: 14000 },
    { name: "شركة السلام للتوريدات", amount: 52000, balance: 35000 },
    { name: "محلات الصفا الحديثة", amount: 48000, balance: 9500 },
    { name: "معرض الفجر الجديد", amount: 39000, balance: 18000 },
  ],
  salesByInvoice: [
    { number: "INV-2026-0891", customer: "شركة النور للمقاولات", date: "2026-11-07", amount: 35000 },
    { number: "INV-2026-0885", customer: "مؤسسة الأهرام التجارية", date: "2026-11-06", amount: 22100 },
    { number: "INV-2026-0872", customer: "شركة السلام للتوريدات", date: "2026-11-05", amount: 27400 },
    { number: "INV-2026-0860", customer: "محلات الصفا الحديثة", date: "2026-11-04", amount: 31000 },
  ],
  salesByProduct: [
    { name: "سيراميك رويال فرز أول 60x60", qty: 320, amount: 96000 },
    { name: "بورسلين كليوباترا إسباني", qty: 210, amount: 88000 },
    { name: "بلاط حوائط ليزر فينسيا", qty: 180, amount: 54000 },
    { name: "طقم حمام ديورافيت كلاسيك", qty: 15, amount: 45000 },
  ],
  collectionsBreakdown: [
    { type: "مدفوعات نقدية / بنكية", amount: 260000 },
    { type: "شيكات تحت التحصيل", amount: 110000 },
    { type: "مقبوضات خزينة", amount: 40000 },
  ],
  statementItems: [
    { category: "شريحة أ (سعر الوحدة العالي)", rate: "3.5%", sales: 160000, commission: 5600 },
    { category: "شريحة ب (سعر الوحدة المتوسط)", rate: "2.5%", sales: 140000, commission: 3500 },
    { category: "شريحة ج (سعر الوحدة الاقتصادي)", rate: "1.5%", sales: 90000, commission: 1350 },
    { category: "حافز تحقيق مستهدف الراكد", rate: "+20%", sales: 0, commission: 2000 },
    { category: "مكافأة نسبة التحصيل الممتازة", rate: "+", sales: 0, commission: 2000 },
  ],
  netPayableCommission: 18450,
};

export const api = {
  async getStoredSession() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveSession(user) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } catch (e) {
      console.warn("saveSession error", e);
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (e) {
      console.warn("clearSession error", e);
    }
  },

  async login(identifier, password) {
    const trimmed = (identifier || "").trim();
    if (!trimmed || !password) {
      throw new Error("يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور");
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmed, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const user = {
          name: data?.user?.user_metadata?.full_name || trimmed,
          email: data?.user?.email || trimmed,
          role: data?.user?.user_metadata?.role || "مندوب مبيعات",
          id: data?.user?.id || "u-1",
        };
        await this.saveSession(user);
        return user;
      }
    } catch (e) {
      console.warn("Login remote failed, checking demo mode", e);
    }

    // Demo/offline fallback so the rep can always see the app
    const demoUser = {
      name: trimmed || "مندوب مبيعات",
      email: trimmed.includes("@") ? trimmed : `${trimmed}@naguibselim.com`,
      role: "مندوب مبيعات",
      id: "demo-user",
    };
    await this.saveSession(demoUser);
    return demoUser;
  },

  async fetchCommissions() {
    try {
      const res = await fetch(`${API_BASE}/api/commissions`);
      if (res.ok) {
        const data = await res.json();
        if (data?.detail) {
          await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(data.detail));
          return data.detail;
        }
      }
    } catch (e) {
      console.warn("fetchCommissions network error, using fallback", e);
    }

    // Fallback to offline cached or demo
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return DemoRepDetail;
  },
};
