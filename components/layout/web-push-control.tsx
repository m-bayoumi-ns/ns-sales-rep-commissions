"use client";

import { BellIcon, BellOffIcon, ShareIcon, SquarePlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getPushPublicKey, subscribePush, unsubscribePush } from "@/lib/app/actions";
import { isStandalone, useDevice } from "./android-app";

type State = "loading" | "unsupported" | "install-first" | "off" | "on" | "denied" | "busy" | "error";

function base64UrlToBytes(value: string) {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/**
 * Notifications in this browser (iPhone web app on the home screen, desktop, Android browser) through web push.
 * The Android app has its own notifications, so nothing is shown there.
 */
export function WebPushControl() {
  const t = useTranslations("webPush");
  const locale = useLocale();
  const device = useDevice();
  const [state, setState] = useState<State>("loading");

  const refresh = useCallback(async () => {
    if (device === "unknown" || device === "app") return;
    if (!pushSupported()) {
      // iPhone Safari only allows web push once the site is added to the home screen.
      setState(device === "ios" && !isStandalone() ? "install-first" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") return setState("denied");
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.getSubscription();
    setState(subscription ? "on" : "off");
  }, [device]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser push state once mounted
    void refresh().catch(() => setState("error"));
  }, [refresh]);

  const turnOn = async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const key = await getPushPublicKey();
      if (!key) return setState("error");
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }));
      const ok = await subscribePush(subscription.toJSON() as never, locale);
      setState(ok ? "on" : "error");
    } catch {
      setState("error");
    }
  };

  const turnOff = async () => {
    setState("busy");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setState("error");
    }
  };

  if (device === "unknown" || device === "app" || state === "loading" || state === "unsupported") return null;

  if (state === "install-first") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed px-3 py-3 text-sm">
        <p className="font-semibold">{t("iphoneTitle")}</p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <ShareIcon aria-hidden className="size-4 shrink-0 text-primary" />
          {t("iphoneStep1")}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <SquarePlusIcon aria-hidden className="size-4 shrink-0 text-primary" />
          {t("iphoneStep2")}
        </p>
        <p className="text-muted-foreground">{t("iphoneStep3")}</p>
        <Link href="/get-app" className="text-xs font-semibold text-primary hover:underline">
          {t("more")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm font-semibold">
        {state === "on" ? <BellIcon aria-hidden className="size-4 text-success" /> : <BellOffIcon aria-hidden className="size-4 text-muted-foreground" />}
        {state === "on" ? t("on") : state === "denied" ? t("denied") : state === "error" ? t("error") : t("off")}
      </span>
      {state === "on" ? (
        <button type="button" onClick={turnOff} className="ms-auto text-xs font-semibold text-muted-foreground hover:underline">
          {t("turnOff")}
        </button>
      ) : state === "denied" ? null : (
        <button
          type="button"
          onClick={turnOn}
          disabled={state === "busy"}
          className="ms-auto inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {state === "busy" ? t("working") : t("turnOn")}
        </button>
      )}
    </div>
  );
}
