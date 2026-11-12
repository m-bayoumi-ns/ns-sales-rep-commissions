import { AlertTriangleIcon, DatabaseIcon, FileWarningIcon, InfoIcon, Settings2Icon, UnlinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { after, connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LoadingStatus } from "@/components/common/loading-status";
import { MonthBar } from "@/components/commissions/month-bar";
import { RepApp } from "@/components/commissions/rep-app";
import type { AppSection } from "@/components/layout/android-bottom-nav";
import { TeamList } from "@/components/commissions/team-list";
import { RepPicker } from "@/components/commissions/rep-picker";
import { StateCard } from "@/components/finance/report-ui";
import { NoAccess } from "@/components/layout/no-access";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { logActivity } from "@/lib/activity";
import { requireReadyUser } from "@/lib/auth/dal";
import { canAccessPage, isAdmin } from "@/lib/auth/permissions";
import { hasRates } from "@/lib/commissions/schema";
import { ALL_REPS, getCommissionsView, repOptions, resolveCommissionMonth } from "@/lib/commissions/view";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { isOdooConfigured } from "@/lib/env";
import { formatMonth } from "@/lib/format";

export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cm");
  return { title: t("title") };
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function CommissionsRoute({ searchParams }: PageProps<"/[locale]/commissions">) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Loading />}>
        <Commissions searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function Loading() {
  const t = useTranslations("common.loading");
  return (
    <div aria-busy className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-lg">
        <LoadingStatus title={t("title")} steps={[t("step1"), t("step2"), t("step3")]} hint={t("hint")} />
      </div>
    </div>
  );
}

async function Commissions({ searchParams }: { searchParams: PageProps<"/[locale]/commissions">["searchParams"] }) {
  const user = await requireReadyUser();
  const [t, tc] = await Promise.all([getTranslations("cm"), getTranslations("common")]);
  const locale = (await getLocale()) as Locale;

  if (!user.active || !canAccessPage(user, "sales-commissions")) {
    return <NoAccess page={tc("appName")} email={user.email} reason={!user.active ? "inactive" : "page"} />;
  }
  if (!isOdooConfigured()) return <StateCard icon={<DatabaseIcon aria-hidden />} title={tc("notConnectedTitle")} body={tc("notConnectedBody")} />;

  const raw = await searchParams;
  // Live figures: never prerendered (the month, "today" and the data are read per request).
  await connection();
  const month = await resolveCommissionMonth(first(raw.month));
  if (!month) return <StateCard title={t("month.noAvailableTitle")} body={t("month.noAvailableBody")} />;
  const repKey = first(raw.rep);
  const requestedSection = first(raw.section);
  const initialTab: AppSection = requestedSection === "sales" || requestedSection === "collections" || requestedSection === "statement" ? requestedSection : "summary";
  const admin = isAdmin(user);
  const appSettings = await loadAppSettings();
  const canExport = admin || appSettings.excelExportAccess === "report_access";
  let view;
  try {
    view = await getCommissionsView(user, month, repKey, canExport && repKey === ALL_REPS);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof Error && error.name === "AbortError") throw error;
    console.error("[commissions] failed to load:", error);
    return <StateCard tone="error" icon={<AlertTriangleIcon aria-hidden />} title={tc("errorTitle")} body={tc("errorBody")} />;
  }
  after(() => logActivity({ action: "view_page", userId: user.id, email: user.email, details: { page: "sales-commissions", month, rep: repKey ?? null } }));

  const monthName = formatMonth(month, locale);
  const notices: { key: string; tone: "info" | "warn"; icon: React.ReactNode; text: string; action?: React.ReactNode }[] = [];
  const settingsLink = admin ? (
    <Link href={{ pathname: "/settings", query: { month } }} className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
      <Settings2Icon aria-hidden className="size-3.5" />
      {t("notices.openSettings")}
    </Link>
  ) : undefined;
  if (view.source === "default" || !hasRates(view.settings)) notices.push({ key: "rates", tone: "warn", icon: <Settings2Icon aria-hidden className="size-4" />, text: t("notices.noRates", { month: monthName }), action: settingsLink });
  else if (view.source === "inherited" && view.inheritedFrom) notices.push({ key: "inherited", tone: "info", icon: <InfoIcon aria-hidden className="size-4" />, text: t("notices.inherited", { from: formatMonth(view.inheritedFrom, locale) }), action: settingsLink });
  if (!view.sheetFound && admin) notices.push({ key: "sheet", tone: "warn", icon: <FileWarningIcon aria-hidden className="size-4" />, text: t("notices.noSheet", { month: monthName }) });
  if (view.unlinked.length && admin) notices.push({ key: "unlinked", tone: "warn", icon: <UnlinkIcon aria-hidden className="size-4" />, text: t("notices.unlinked", { names: view.unlinked.join("، ") }), action: settingsLink });

  const showDetail = view.detail != null;
  const options = repOptions(view.reps, appSettings.sellerDisplayNames);
  return (
    <ScrollReveal className="flex flex-col gap-5">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2">
        {options.length > 1 ? <RepPicker reps={options} value={showDetail ? view.detail!.rep.key : ALL_REPS} month={month} allowAll={options.length > 1} /> : null}
        {!showDetail ? <MonthBar months={view.months} month={month} live={!view.clock.closed} keepRep={ALL_REPS} showAppNotifications /> : null}
      </div>
      {notices.map((notice) => (
        <p
          key={notice.key}
          role="status"
          className={
            notice.tone === "warn"
              ? "mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning"
              : "mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-2xl border bg-accent px-3 py-2.5 text-sm text-accent-foreground"
          }
        >
          {notice.icon}
          <span className="flex-1">{notice.text}</span>
          {notice.action}
        </p>
      ))}
      {view.reps.length === 0 ? (
        <StateCard title={t("empty.title")} body={t(user.branchFilterType === "sales_rep" && !admin ? "empty.notListed" : "empty.body", { month: monthName })} />
      ) : showDetail ? (
        <RepApp key={initialTab} detail={view.detail!} settings={view.settings} clock={view.clock} months={view.months} teamLink={view.reps.length > 1} initialTab={initialTab} />
      ) : (
        <TeamList view={view} locale={locale} canExport={canExport} displayNames={appSettings.sellerDisplayNames} />
      )}
    </ScrollReveal>
  );
}
