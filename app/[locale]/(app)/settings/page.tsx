import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { MonthBar } from "@/components/commissions/month-bar";
import { PageHeading, StateCard } from "@/components/finance/report-ui";
import { requireReadyUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { availableSettingsMonths, FIRST_MONTH, loadMonthSetup, resolveMonth } from "@/lib/commissions/view";
import { isOdooConfigured } from "@/lib/env";
import { addMonths, currentMonth } from "@/lib/finance/core";
import { listSellerAccounts } from "@/lib/accounts/server";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { allNotifications } from "@/lib/commissions/notifications";
import { SettingsForm } from "./settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default function SettingsPage({ searchParams }: PageProps<"/[locale]/settings">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border bg-card" />}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SettingsContent({ searchParams }: { searchParams: PageProps<"/[locale]/settings">["searchParams"] }) {
  const user = await requireReadyUser();
  if (!isAdmin(user)) notFound();
  const t = await getTranslations("settings");
  if (!isOdooConfigured()) return <StateCard title={t("notConnected")} body={t("notConnectedBody")} />;

  const raw = (await searchParams).month;
  await connection();
  // Settings may be prepared for next month too.
  const next = addMonths(currentMonth(), 1);
  const wanted = Array.isArray(raw) ? raw[0] : raw;
  const month = wanted === next ? next : resolveMonth(wanted);
  const [setup, accounts, appSettings, months, notifications] = await Promise.all([
    loadMonthSetup(month),
    listSellerAccounts().catch((error) => {
      console.error("[settings] seller accounts unavailable:", error);
      return [];
    }),
    loadAppSettings(),
    availableSettingsMonths(),
    allNotifications(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title={t("title")} eyebrow={t("eyebrow")} subtitle={t("description")} />
      <MonthBar months={[...new Set([next, ...months])]} month={month} live={false} showStatus={false} />
      <SettingsForm
        key={`${month}:${setup.stored.settings.updatedAt ?? setup.stored.source}`}
        month={month}
        notifications={notifications}
        excelExportAccess={appSettings.excelExportAccess ?? "admins_only"}
        monthVisibilityFrom={appSettings.commissionMonthsFrom ?? FIRST_MONTH}
        monthVisibilityTo={appSettings.commissionMonthsTo ?? ""}
        initial={setup.stored.settings}
        source={setup.stored.source}
        inheritedFrom={setup.stored.inheritedFrom}
        sheet={{
          found: setup.sheet.found,
          path: setup.sheet.path,
          columns: setup.sheet.columns,
          count: setup.sheet.reps.length,
          productCommission: setup.sheet.productCommission,
        }}
        reps={setup.reps}
        candidates={setup.candidates.map(({ id, name }) => ({ id, name }))}
        accounts={accounts.filter((account) => account.active).map(({ id, name, email }) => ({ id, name, email }))}
      />
    </div>
  );
}
