import { KeyRoundIcon, ShieldAlertIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageLoadingStatus } from "@/components/common/loading-status";
import { requireUser } from "@/lib/auth/dal";
import { isAdmin, isSeller } from "@/lib/auth/permissions";
import { AndroidAppCard } from "@/components/layout/android-app";
import { ANDROID_APP } from "@/lib/android-app";
import { PhoneNotifications } from "@/components/layout/phone-notifications";
import { AndroidBottomNav } from "@/components/layout/android-bottom-nav";
import { PasswordForm } from "./password-form";
import { AccountControls } from "./account-controls";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { normalizeName } from "@/lib/commissions/names";
import { devicesFor } from "@/lib/app/devices";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default function AccountPage({ searchParams }: PageProps<"/[locale]/account">) {
  return (
    <Suspense fallback={<PageLoadingStatus />}>
      <Account searchParams={searchParams} />
    </Suspense>
  );
}

/** My account: who I am and a password change. A forced change is shown first and blocks every other page until done. */
async function Account({ searchParams }: { searchParams: PageProps<"/[locale]/account">["searchParams"] }) {
  await connection();
  const user = await requireUser();
  const t = await getTranslations("account");
  const params = await searchParams;
  const role = isAdmin(user) ? t("roleAdmin") : isSeller(user) ? t("roleSeller") : t("roleManager");
  const appSettings = isSeller(user) ? await loadAppSettings() : null;
  const sellerRep = user.salesReps[0];
  const sellerDisplayName = sellerRep ? appSettings?.sellerDisplayNames?.[normalizeName(sellerRep)] ?? sellerRep : null;
  const month = Array.isArray(params.month) ? params.month[0] : params.month;
  const rep = Array.isArray(params.rep) ? params.rep[0] : params.rep;

  const devices = await devicesFor(user.id).catch(() => []);
  const STALE_MS = 45 * 60 * 1000;
  const notificationsWorking = devices.some((d) => d.lastSeenAt != null && Date.now() - Date.parse(d.lastSeenAt) < STALE_MS);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="px-1 text-2xl font-bold">{t("title")}</h1>
      {user.mustChangePassword ? (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
          <ShieldAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("forced")}
        </p>
      ) : null}
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
            <UserRoundIcon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <bdi className="account-identity-default web-only block truncate font-semibold">{user.name}</bdi>
            <div className="app-only flex min-w-0 items-center gap-2">
              <bdi className="account-identity-seller min-w-0 truncate font-semibold">{sellerDisplayName ?? user.name}</bdi>
              <span className="shrink-0 rounded-full bg-[#5a3a1d] px-2 py-0.5 text-[11px] font-semibold text-white">{role}</span>
            </div>
            <bdi className="block truncate text-xs text-muted-foreground">{user.email}</bdi>
          </div>
          <span className="web-only ms-auto rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{role}</span>
        </div>
        {isSeller(user) && user.salesReps.length ? (
          <p className="account-linked-rep border-t px-5 py-3 text-sm text-muted-foreground">
            {t("linkedRep")} <bdi className="font-medium text-foreground">{user.salesReps[0]}</bdi>
          </p>
        ) : null}
        <div className="web-only flex flex-col gap-4 border-t px-5 py-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRoundIcon aria-hidden className="size-4 text-primary" />
            {t("changePassword")}
          </h2>
          <PasswordForm />
        </div>
      </section>

      {user.mustChangePassword ? null : <div className="web-only"><AndroidAppCard release={ANDROID_APP.release} /></div>}
      {user.mustChangePassword ? null : (
        <div className="web-only">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl border bg-card" />}>
            <PhoneNotifications user={user} />
          </Suspense>
        </div>
      )}
      {user.mustChangePassword ? null : (
        <AccountControls
          mustChangePassword={user.mustChangePassword}
          hasDevices={devices.length > 0}
          notificationsWorking={notificationsWorking}
        />
      )}
      {user.mustChangePassword ? null : <AndroidBottomNav active="account" month={month} rep={rep} />}
    </div>
  );
}
