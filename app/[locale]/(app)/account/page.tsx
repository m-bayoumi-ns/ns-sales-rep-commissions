import { KeyRoundIcon, ShieldAlertIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { isAdmin, isSeller } from "@/lib/auth/permissions";
import { AndroidAppCard } from "@/components/layout/android-app";
import { PhoneNotifications } from "@/components/layout/phone-notifications";
import { PasswordForm } from "./password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default function AccountPage({ searchParams }: PageProps<"/[locale]/account">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-xl animate-pulse rounded-3xl border bg-card" />}>
      <Account searchParams={searchParams} />
    </Suspense>
  );
}

/** My account: who I am and a password change. A forced change is shown first and blocks every other page until done. */
async function Account({ searchParams }: { searchParams: PageProps<"/[locale]/account">["searchParams"] }) {
  await connection();
  const user = await requireUser();
  const t = await getTranslations("account");
  await searchParams;
  const role = isAdmin(user) ? t("roleAdmin") : isSeller(user) ? t("roleSeller") : t("roleManager");
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
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
            <UserRoundIcon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <bdi className="block truncate font-semibold">{user.name}</bdi>
            <bdi className="block truncate text-xs text-muted-foreground">{user.email}</bdi>
          </div>
          <span className="ms-auto rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{role}</span>
        </div>
        {isSeller(user) && user.salesReps.length ? (
          <p className="border-b px-5 py-3 text-sm text-muted-foreground">
            {t("linkedRep")} <bdi className="font-medium text-foreground">{user.salesReps[0]}</bdi>
          </p>
        ) : null}
        <div className="flex flex-col gap-4 px-5 py-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRoundIcon aria-hidden className="size-4 text-primary" />
            {t("changePassword")}
          </h2>
          <PasswordForm />
        </div>
      </section>
      {user.mustChangePassword ? null : <AndroidAppCard />}
      {user.mustChangePassword ? null : (
        <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl border bg-card" />}>
          <PhoneNotifications user={user} />
        </Suspense>
      )}
    </div>
  );
}
