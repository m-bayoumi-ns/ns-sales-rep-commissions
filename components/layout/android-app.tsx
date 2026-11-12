"use client";

import { AppleIcon, BellIcon, BellOffIcon, CheckCircle2Icon, DownloadIcon, ExternalLinkIcon, SmartphoneIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { hasAppInstalled } from "@/lib/app/actions";
import { ANDROID_APK_URL, sizeMb, type AndroidRelease, type AndroidVariant } from "@/lib/android-app";
import { cn } from "@/lib/utils";

export type Device = "app" | "android" | "ios" | "desktop" | "unknown";

/** Methods the Android app exposes to its pages (MainActivity.Bridge). Older app versions lack some. */
type NSAppBridge = {
  checkNow?: () => void;
  testNotification?: () => boolean;
  openNotificationSettings?: () => void;
  status?: () => string;
};
declare global {
  interface Window {
    NSApp?: NSAppBridge;
  }
}

const noop = () => () => {};

function detectDevice(): Device {
  const ua = navigator.userAgent;
  if (ua.includes("NSCommissionsApp")) return "app";
  if (/android/i.test(ua)) return "android";
  // iPadOS 13+ reports itself as a Mac; touch support tells them apart.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

/** Installed iPhone web app (opened from the home screen), or any browser's installed app window. */
export function isStandalone() {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/** Android app or installed web app: the app layout (no Home / language / theme buttons in the header). */
function isAppShell() {
  return navigator.userAgent.includes("NSCommissionsApp") || isStandalone();
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.2 5.7 5.8 3.3a.6.6 0 0 1 1-.6l1.5 2.5a8.1 8.1 0 0 1 7.4 0l1.5-2.5a.6.6 0 0 1 1 .6l-1.4 2.4A7.2 7.2 0 0 1 20 12H4a7.2 7.2 0 0 1 3.2-6.3ZM8 8.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm8 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6ZM4 13h16v5a2 2 0 0 1-2 2h-1v2a1 1 0 0 1-2 0v-2H9v2a1 1 0 0 1-2 0v-2H6a2 2 0 0 1-2-2v-5Zm-3 1a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0v-4Zm20 0a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0v-4Z" />
    </svg>
  );
}

/** The visitor's device, read once on the client ("unknown" while rendering on the server). */
export function useDevice(): Device {
  return useSyncExternalStore(noop, detectDevice, () => "unknown");
}

function isNewerSemver(remote: string, current: string): boolean {
  if (!remote || !current || remote === current) return false;
  const rParts = remote.replace(/^v/i, "").split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const cParts = current.replace(/^v/i, "").split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(rParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const rv = rParts[i] ?? 0;
    const cv = cParts[i] ?? 0;
    if (rv !== cv) return rv > cv;
  }
  return false;
}

/**
 * Keeps <html data-app> set inside the Android app, and checks if a mandatory app update is available.
 */
export function AppModeMarker() {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [mandatoryUpdate, setMandatoryUpdate] = useState<{ version: string; current: string; bytes: number } | null>(null);

  useLayoutEffect(() => {
    if (isAppShell()) document.documentElement.setAttribute("data-app", "");
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.userAgent.includes("NSCommissionsApp")) return;
    const uaMatch = navigator.userAgent.match(/NSCommissionsApp\/([0-9.]+)/i);
    const currentVersion = readStatus()?.version ?? uaMatch?.[1] ?? "";
    if (!currentVersion) return;

    const checkUpdate = () => {
      fetch("/api/app/download?info=1&variant=web", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { version?: string; bytes?: number } | null) => {
          if (data?.version && isNewerSemver(data.version, currentVersion)) {
            setMandatoryUpdate({ version: data.version, current: currentVersion, bytes: data.bytes ?? 0 });
          }
        })
        .catch(() => {});
    };

    checkUpdate();
    window.addEventListener("focus", checkUpdate);
    return () => window.removeEventListener("focus", checkUpdate);
  }, []);

  if (!mandatoryUpdate) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-xs">
      <div className="flex w-full max-w-sm flex-col items-center gap-3.5 rounded-3xl border bg-card p-6 text-center shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/app-icon.png" alt="" width={60} height={60} className="size-15 rounded-2xl shadow-md" />
        <h2 className="text-lg font-extrabold text-foreground">
          {isAr ? "تحديث جديد متاح للتطبيق" : "App Update Available"}
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {isAr
            ? "يتوفر إصدار جديد من تطبيق عمولات المندوبين. يرجى الانتقال إلى صفحة التطبيق لتحميل النسخة الجديدة."
            : "A new version of the Sales Rep Commissions app is available. Please visit the app page to download the new version."}
        </p>
        <span dir="ltr" className="rounded-full border border-primary/20 bg-accent px-3.5 py-1 text-xs font-bold text-primary tabular-nums">
          v{mandatoryUpdate.current} → v{mandatoryUpdate.version}
          {mandatoryUpdate.bytes > 0 ? ` · ${sizeMb(mandatoryUpdate.bytes)} MB` : ""}
        </span>
        <a
          href={isAr ? "/ar/get-app?update=1&variant=web" : "/en/get-app?update=1&variant=web"}
          className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <DownloadIcon aria-hidden className="size-4" />
          {isAr ? "تحميل الآن" : "Download Now"}
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- open the installed app from the browser

// Android WebView app package.
const APP_PACKAGE = "com.naguibselim.commissions";
const APP_HOST = "ns-scw.bayoumi.dev";

/**
 * Android browser: is the NS Commissions app installed? Chrome's related-apps check first, then the account's
 * phones (a phone of this user has the app). null while checking.
 */
export function useAppInstalled(device: Device): boolean | null {
  const [installed, setInstalled] = useState<boolean | null>(null);
  useEffect(() => {
    if (device !== "android") return;
    const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<{ id?: string; platform?: string }[]> };
    let alive = true;
    // 1. Chrome's own check (works when Chrome can verify the app); 2. else: has this account a phone with the app?
    const fromChrome = nav.getInstalledRelatedApps
      ? nav
          .getInstalledRelatedApps()
          .then((apps) => apps.some((app) => app.id === APP_PACKAGE))
          .catch(() => false)
      : Promise.resolve(false);
    fromChrome
      .then((found) => found || hasAppInstalled().catch(() => false))
      .then((found) => alive && setInstalled(found));
    return () => {
      alive = false;
    };
  }, [device]);
  return installed;
}

/**
 * Android "intent:" link that opens this page in the app; if the app isn't installed, Chrome goes to
 * the fallback (the download page) instead.
 */
export function openInAppHref(pathWithLocale: string, fallbackPath: string) {
  const fallback = encodeURIComponent(`https://${APP_HOST}${fallbackPath}`);
  return `intent://${APP_HOST}${pathWithLocale}#Intent;scheme=https;package=${APP_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

// ---------------------------------------------------------------- mobile banner

const DISMISS_KEY = "ns-get-app-dismissed";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * Bottom banner for phone visitors in the browser: invites them to the app page.
 * Hidden inside the app, on the app page itself, on computers, and for a week after "Not now".
 */
export function GetAppBanner() {
  const t = useTranslations("androidApp.banner");
  const locale = useLocale();
  const device = useDevice();
  const installed = useAppInstalled(device);
  const pathname = usePathname();
  const snoozed = useSyncExternalStore(noop, dismissedRecently, () => true);
  const [closed, setClosed] = useState(false);

  if (closed || snoozed || pathname.startsWith("/get-app")) return null;
  if (typeof window !== "undefined" && isStandalone()) return null;
  if (device !== "android" && device !== "ios") return null;
  // Wait for the install check, so the button doesn't flip from "Download" to "Open".
  if (device === "android" && installed === null) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode: hide for this visit only */
    }
    setClosed(true);
  };

  return (
    <div
      role="region"
      aria-label={t("label")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static icon */}
        <img src="/brand/app-icon.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
        {installed ? (
          <>
            {/* The app is on this phone: open the same page in it. */}
            <a href={openInAppHref(`/${locale}${pathname}`, `/${locale}/get-app`)} className="min-w-0 flex-1 outline-none">
              <span className="block text-sm font-semibold leading-tight">{t("title")}</span>
              <span className="line-clamp-2 block text-xs text-muted-foreground">{t("bodyInstalled")}</span>
            </a>
            <a
              href={openInAppHref(`/${locale}${pathname}`, `/${locale}/get-app`)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLinkIcon aria-hidden className="size-3.5" />
              {t("openApp")}
            </a>
          </>
        ) : (
          <>
            <Link href="/get-app" target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 outline-none" onClick={() => setClosed(true)}>
              <span className="block text-sm font-semibold leading-tight">{t("title")}</span>
              <span className="line-clamp-2 block text-xs text-muted-foreground">{device === "ios" ? t("bodyIos") : t("bodyAndroid")}</span>
            </Link>
            <Link
              href="/get-app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setClosed(true)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {device === "android" ? <DownloadIcon aria-hidden className="size-3.5" /> : null}
              {device === "android" ? t("download") : t("open")}
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={close}
          aria-label={t("notNow")}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <XIcon aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- download buttons

/** Primary Android button: download in a browser, "Installed" inside the app. */
export function AndroidDownloadButton({ className, release, variant, updateRequested }: { className?: string; release: AndroidRelease; variant: AndroidVariant; updateRequested: boolean }) {
  const t = useTranslations("androidApp");
  const locale = useLocale();
  const device = useDevice();
  const installed = useAppInstalled(device);
  if (updateRequested) {
    return (
      <a
        href={`${ANDROID_APK_URL}?variant=${variant}`}
        download="NS-Commissions.apk"
        className={cn(
          "inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-primary px-5 text-primary-foreground shadow-sm transition hover:bg-primary/90",
          className,
        )}
      >
        <DownloadIcon aria-hidden className="size-5" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11px] opacity-80">{t("page.updateAvailable", { version: release.version })}</span>
          <span className="text-sm font-semibold">{t("page.update")}</span>
        </span>
      </a>
    );
  }
  if (installed) {
    return (
      <a
        href={openInAppHref(`/${locale}/commissions`, `/${locale}/get-app`)}
        className={cn(
          "inline-flex h-12 items-center gap-3 rounded-xl bg-primary px-5 text-primary-foreground shadow-sm transition hover:bg-primary/90",
          className,
        )}
      >
        <ExternalLinkIcon aria-hidden className="size-5" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11px] opacity-80">{t("page.installedSmall")}</span>
          <span className="text-sm font-semibold">{t("page.openApp")}</span>
        </span>
      </a>
    );
  }
  if (device === "app") {
    return (
      <span className={cn("inline-flex h-12 items-center gap-2 rounded-xl bg-success-soft px-5 text-sm font-semibold text-success", className)}>
        <CheckCircle2Icon aria-hidden className="size-5" />
        {t("installed")}
      </span>
    );
  }
  return (
    <a
      href={ANDROID_APK_URL}
      download="NS-Commissions.apk"
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <AndroidIcon className="size-5 shrink-0" />
      <span>{t("page.androidDownload")}</span>
    </a>
  );
}

/** Android browsers where installation can't be detected: "Already have the app? Open it". */
export function OpenInstalledAppLink({ updateRequested = false }: { updateRequested?: boolean }) {
  const t = useTranslations("androidApp.page");
  const locale = useLocale();
  const device = useDevice();
  const installed = useAppInstalled(device);
  if (device !== "android" || installed || updateRequested) return null;
  return (
    <a href={openInAppHref(`/${locale}/commissions`, `/${locale}/get-app`)} className="text-sm font-semibold text-primary hover:underline">
      {t("alreadyInstalled")}
    </a>
  );
}

/** Indicates that an iOS app is not currently available. */
export function IosSoonButton({ className }: { className?: string }) {
  const t = useTranslations("androidApp.page");
  return (
    <button
      type="button"
      disabled
      className={cn(
        "inline-flex h-12 cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border bg-muted/50 px-5 text-sm font-semibold text-muted-foreground opacity-80",
        className,
      )}
    >
      <AppleIcon aria-hidden className="size-5 shrink-0" />
      <span className="whitespace-nowrap">{t("iosNotAvailable")}</span>
    </button>
  );
}

/** One line under the buttons that speaks to the visitor's own device. */
export function DeviceNote({ updateRequested = false }: { updateRequested?: boolean }) {
  const t = useTranslations("androidApp.page");
  const device = useDevice();
  if (device === "unknown") return <p className="h-5" />;
  const text = updateRequested && (device === "android" || device === "app")
    ? t("noteUpdate")
    : device === "app"
      ? t("noteApp")
      : device === "android"
        ? t("noteAndroid")
        : device === "ios"
          ? t("noteIos")
          : t("noteDesktop");
  return <p className="min-h-5 text-sm text-muted-foreground">{text}</p>;
}

// ---------------------------------------------------------------- signed-in entry points

/** "Mobile app" entry in the account menu; hidden inside the app itself. */
export function AndroidAppMenuItem() {
  const t = useTranslations("androidApp");
  const device = useDevice();
  const locale = useLocale();
  if (device === "app") return null;
  return (
    <DropdownMenuItem onClick={() => window.open(`/${locale}/get-app`, "_blank", "noopener,noreferrer")}>
      <SmartphoneIcon aria-hidden />
      {t("menu")}
    </DropdownMenuItem>
  );
}

/** Small card on My account linking to the app page. */
export function AndroidAppCard({ release }: { release: AndroidRelease }) {
  const t = useTranslations("androidApp");
  const device = useDevice();
  return (
    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static icon */}
        <img src="/brand/app-icon.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("meta", {
              version: release.version,
              size: sizeMb(release.bytes),
            })}
          </p>
        </div>
        {device === "app" ? (
          <span className="ms-auto rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">{t("installed")}</span>
        ) : (
          <Link
            href="/get-app"
            target="_blank"
            rel="noopener noreferrer"
            className="ms-auto inline-flex h-9 shrink-0 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("view")}
          </Link>
        )}
      </div>
    </section>
  );
}

type AppStatus = {
  enabled?: boolean;
  lastCheckAt?: number;
  lastStatus?: string;
  version?: string;
};

function readStatus(): AppStatus | null {
  try {
    const raw = window.NSApp?.status?.();
    return raw ? (JSON.parse(raw) as AppStatus) : null;
  } catch {
    return null;
  }
}

/**
 * Inside the app only: whether this phone allows notifications, with a shortcut to turn them on.
 * Shown at the top of My account → Phone notifications (the test button and last check are there too).
 */
export function ThisPhoneNotifications() {
  const t = useTranslations("androidApp.notify");
  const device = useDevice();
  const [status, setStatus] = useState<AppStatus | null>(null);
  const refresh = useCallback(() => setStatus(readStatus()), []);

  useEffect(() => {
    if (device !== "app") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the native bridge once mounted
    refresh();
    const timer = setInterval(refresh, 3000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [device, refresh]);

  if (device !== "app") return null;
  if (!window.NSApp?.status) return <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning">{t("update")}</p>;
  if (!status) return null;
  if (status.enabled) {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-success">
        <BellIcon aria-hidden className="size-4" />
        {t("on")}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-destructive-soft px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <BellOffIcon aria-hidden className="size-4" />
        {t("off")}
      </span>
      <button
        type="button"
        onClick={() => window.NSApp?.openNotificationSettings?.()}
        className="ms-auto inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {t("turnOn")}
      </button>
    </div>
  );
}
