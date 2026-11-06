"use client";

import { AppleIcon, BellIcon, BellOffIcon, CheckCircle2Icon, DownloadIcon, ExternalLinkIcon, SmartphoneIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { hasAppInstalled } from "@/lib/app/actions";
import { ANDROID_APK_URL, ANDROID_RELEASE as release, sizeMb } from "@/lib/android-app";
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

/** The visitor's device, read once on the client ("unknown" while rendering on the server). */
export function useDevice(): Device {
  return useSyncExternalStore(noop, detectDevice, () => "unknown");
}

/**
 * Keeps <html data-app> set inside the Android app. The inline script in the root layout sets it on a full
 * page load, but switching language re-renders the root layout on the client (a new <html>, and inline
 * scripts don't run again), which brought back the browser header until the next refresh.
 */
export function AppModeMarker() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (navigator.userAgent.includes("NSCommissionsApp")) document.documentElement.setAttribute("data-app", "");
  }, [pathname]);
  return null;
}

// ---------------------------------------------------------------- open the installed app from the browser

const APP_PACKAGE = "com.naguibselim.commissions";
const APP_HOST = "ns-sales-rep-commissions.vercel.app";

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
            <Link href="/get-app" className="min-w-0 flex-1 outline-none" onClick={() => setClosed(true)}>
              <span className="block text-sm font-semibold leading-tight">{t("title")}</span>
              <span className="line-clamp-2 block text-xs text-muted-foreground">{device === "ios" ? t("bodyIos") : t("bodyAndroid")}</span>
            </Link>
            <Link
              href="/get-app"
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
export function AndroidDownloadButton({ className }: { className?: string }) {
  const t = useTranslations("androidApp");
  const locale = useLocale();
  const device = useDevice();
  const installed = useAppInstalled(device);
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
        "inline-flex h-12 items-center gap-3 rounded-xl bg-primary px-5 text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <DownloadIcon aria-hidden className="size-5" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[11px] opacity-80">{t("page.androidSmall")}</span>
        <span className="text-sm font-semibold">{t("page.androidBig")}</span>
      </span>
    </a>
  );
}

/** Android browsers where installation can't be detected: "Already have the app? Open it". */
export function OpenInstalledAppLink() {
  const t = useTranslations("androidApp.page");
  const locale = useLocale();
  const device = useDevice();
  const installed = useAppInstalled(device);
  if (device !== "android" || installed) return null;
  return (
    <a href={openInAppHref(`/${locale}/commissions`, `/${locale}/get-app`)} className="text-sm font-semibold text-primary hover:underline">
      {t("alreadyInstalled")}
    </a>
  );
}

/** iPhone button, disabled until the iOS version ships. */
export function IosSoonButton({ className }: { className?: string }) {
  const t = useTranslations("androidApp.page");
  return (
    <span
      aria-disabled
      className={cn("inline-flex h-12 cursor-not-allowed items-center gap-3 rounded-xl border border-dashed bg-card/60 px-5 text-muted-foreground", className)}
    >
      <AppleIcon aria-hidden className="size-5" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[11px]">{t("iosSmall")}</span>
        <span className="text-sm font-semibold">{t("iosBig")}</span>
      </span>
    </span>
  );
}

/** One line under the buttons that speaks to the visitor's own device. */
export function DeviceNote() {
  const t = useTranslations("androidApp.page");
  const device = useDevice();
  if (device === "unknown") return <p className="h-5" />;
  const text = device === "app" ? t("noteApp") : device === "android" ? t("noteAndroid") : device === "ios" ? t("noteIos") : t("noteDesktop");
  return <p className="min-h-5 text-sm text-muted-foreground">{text}</p>;
}

// ---------------------------------------------------------------- signed-in entry points

/** "Mobile app" entry in the account menu; hidden inside the app itself. */
export function AndroidAppMenuItem() {
  const t = useTranslations("androidApp");
  const device = useDevice();
  const router = useRouter();
  if (device === "app") return null;
  return (
    <DropdownMenuItem onClick={() => router.push("/get-app")}>
      <SmartphoneIcon aria-hidden />
      {t("menu")}
    </DropdownMenuItem>
  );
}

/** Small card on My account linking to the app page. */
export function AndroidAppCard() {
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
