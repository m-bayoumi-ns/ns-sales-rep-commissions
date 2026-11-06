"use client";

import { AppleIcon, CheckCircle2Icon, DownloadIcon, SmartphoneIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ANDROID_APK_URL, ANDROID_RELEASE as release, sizeMb } from "@/lib/android-app";
import { cn } from "@/lib/utils";

export type Device = "app" | "android" | "ios" | "desktop" | "unknown";

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
  const device = useDevice();
  const pathname = usePathname();
  const snoozed = useSyncExternalStore(noop, dismissedRecently, () => true);
  const [closed, setClosed] = useState(false);

  if (closed || snoozed || pathname.startsWith("/get-app")) return null;
  if (device !== "android" && device !== "ios") return null;

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
        <Link href="/get-app" className="min-w-0 flex-1 outline-none" onClick={() => setClosed(true)}>
          <span className="block text-sm font-semibold leading-tight">{t("title")}</span>
          <span className="line-clamp-2 block text-xs text-muted-foreground">
            {device === "ios" ? t("bodyIos") : t("bodyAndroid")}
          </span>
        </Link>
        <Link
          href="/get-app"
          onClick={() => setClosed(true)}
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("open")}
        </Link>
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
  const device = useDevice();
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

/** iPhone button, disabled until the iOS version ships. */
export function IosSoonButton({ className }: { className?: string }) {
  const t = useTranslations("androidApp.page");
  return (
    <span
      aria-disabled
      className={cn(
        "inline-flex h-12 cursor-not-allowed items-center gap-3 rounded-xl border border-dashed bg-card/60 px-5 text-muted-foreground",
        className,
      )}
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
  const text =
    device === "app" ? t("noteApp") : device === "android" ? t("noteAndroid") : device === "ios" ? t("noteIos") : t("noteDesktop");
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
    <section className="flex items-center gap-3 rounded-3xl border bg-card px-5 py-4 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static icon */}
      <img src="/brand/app-icon.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0">
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("meta", { version: release.version, size: sizeMb(release.bytes) })}
        </p>
      </div>
      {device === "app" ? (
        <span className="ms-auto rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
          {t("installed")}
        </span>
      ) : (
        <Link
          href="/get-app"
          className="ms-auto inline-flex h-9 shrink-0 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("view")}
        </Link>
      )}
    </section>
  );
}
