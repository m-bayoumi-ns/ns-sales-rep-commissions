import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageHeading, StateCard } from "@/components/finance/report-ui";
import { DEFAULT_PASSWORD, listSellerAccounts, loadAppSettings, sheetRepAccounts } from "@/lib/accounts/server";
import { SheetReps } from "./sheet-reps";
import { requireReadyUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { AccountsTable } from "./accounts-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts");
  return { title: t("title") };
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border bg-card" />}>
      <Accounts />
    </Suspense>
  );
}

async function Accounts() {
  await connection();
  const user = await requireReadyUser();
  if (!isAdmin(user)) notFound();
  const t = await getTranslations("accounts");
  let data;
  try {
    const [accounts, settings] = await Promise.all([listSellerAccounts(), loadAppSettings()]);
    const sheet = await sheetRepAccounts(accounts);
    data = { accounts, settings, sheet };
  } catch (error) {
    console.error("[accounts] load failed:", error);
    return <StateCard tone="error" title={t("errorTitle")} body={t("errorBody")} />;
  }
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeading title={t("title")} eyebrow={t("eyebrow")} subtitle={t("description")} />
      {data.sheet ? <SheetReps month={data.sheet.month} reps={data.sheet.reps} defaultPassword={DEFAULT_PASSWORD} /> : null}
      <AccountsTable accounts={data.accounts.filter((account) => !data.sheet?.reps.some((rep) => rep.account?.id === account.id))} autoApprove={data.settings.autoApprove} sheetMonth={data.sheet?.month ?? null} sheetCount={data.sheet?.reps.length ?? 0} />
    </div>
  );
}
