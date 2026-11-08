import { BellRingIcon, LogInIcon, SmartphoneIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { devicesFor } from "@/lib/app/devices";
import { loginsFor } from "@/lib/app/logins";
import type { AppUser } from "@/lib/auth/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ThisPhoneNotifications } from "./android-app";
import { TestNotificationButton } from "./test-notification-button";
import { WebPushControl } from "./web-push-control";

/** A phone that has not checked in for this long is shown as "not checking". */
const STALE_MS = 45 * 60 * 1000;

/**
 * My account → Phone notifications (website and app): the user's phones with the app and when each last
 * reached the server, a "send test notification" button, and the account's recent sign-ins.
 */
export async function PhoneNotifications({ user }: { user: AppUser }) {
  const t = await getTranslations("phoneNotify");
  const locale = await getLocale();
  const [devices, logins, sessionId] = await Promise.all([
    devicesFor(user.id).catch(() => []),
    loginsFor(user.id).catch(() => []),
    currentSessionId(),
  ]);
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

  return (
    <>
      <section className="phone-notifications-web overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
          <BellRingIcon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        <ThisPhoneNotifications />
        <WebPushControl />
        <h3 className="text-sm font-semibold">{t("phones")}</h3>
        {devices.length ? (
          <ul className="flex flex-col gap-2">
            {devices.map((device) => {
              const fresh = isFresh(device.lastSeenAt);
              return (
                <li key={device.installId} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm">
                  <SmartphoneIcon aria-hidden className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {device.device ?? t("phone")}
                      {device.appVersion ? <span className="text-xs font-normal text-muted-foreground"> · {t("version", { version: device.appVersion })}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{device.lastSeenAt ? t("lastCheck", { time: time.format(new Date(device.lastSeenAt)) }) : t("never")}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", fresh ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                    {fresh ? t("active") : t("stale")}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground">{t("noPhones")}</p>
        )}
        <TestNotificationButton disabled={!devices.length} />
        <p className="text-xs text-muted-foreground">{t("howItWorks")}</p>
      </div>

      <div className="flex flex-col gap-2 border-t px-5 py-4">
        <h3 className="text-sm font-semibold">{t("signIns")}</h3>
        {logins.length ? (
          <ul className="flex flex-col divide-y text-sm">
            {logins.slice(0, 6).map((login) => (
              <li key={`${login.at}-${login.sessionId}`} className="flex items-center gap-3 py-2">
                <LogInIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <bdi className="font-medium">{login.device}</bdi>
                  <span className="block text-xs text-muted-foreground">{time.format(new Date(login.at))}</span>
                </span>
                {sessionId && login.sessionId === sessionId ? (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{t("thisSession")}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noSignIns")}</p>
        )}
      </div>
      </section>
      <section className="phone-notifications-android rounded-3xl border bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">{t("title")}</h2>
        <p className={cn("mb-3 flex items-center gap-2 text-sm font-semibold", devices.some((device) => isFresh(device.lastSeenAt)) ? "text-success" : "text-warning")}>
          <BellRingIcon aria-hidden className="size-4" />
          {devices.some((device) => isFresh(device.lastSeenAt)) ? t("deliveryWorking") : t("deliveryNotWorking")}
        </p>
        <TestNotificationButton disabled={!devices.length} />
      </section>
    </>
  );
}

function isFresh(lastSeenAt: string | null) {
  return lastSeenAt != null && Date.now() - Date.parse(lastSeenAt) < STALE_MS;
}

async function currentSessionId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    return typeof data?.claims?.session_id === "string" ? data.claims.session_id : null;
  } catch {
    return null;
  }
}
