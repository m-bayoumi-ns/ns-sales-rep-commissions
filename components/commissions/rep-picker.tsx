"use client";

import { UserRoundIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Seller filter at the top of the page: the page shows one seller's figures at a time.
 * "All sellers" opens the team summary. The choice is kept in the URL (?rep=…), so it survives a month change and a refresh.
 */
export function RepPicker({ reps, value, month, allowAll }: { reps: { key: string; name: string; linked: boolean }[]; value: string; month: string; allowAll: boolean }) {
  const t = useTranslations("cm.picker");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const isAll = value === "all";
  const Icon = isAll ? UsersIcon : UserRoundIcon;
  return (
    <label data-no-print className="relative flex min-w-0 items-center">
      <span className="sr-only">{t("label")}</span>
      <Icon aria-hidden className="pointer-events-none absolute start-2.5 size-4 text-primary" />
      <select
        value={value}
        disabled={pending}
        onChange={(event) => startTransition(() => router.push({ pathname, query: { month, rep: event.target.value } }))}
        className="h-9 w-full min-w-[220px] max-w-[340px] rounded-lg border-2 border-primary/40 bg-card ps-8 pe-3 text-sm font-semibold shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30"
      >
        {allowAll ? <option value="all">{t("all", { count: reps.length })}</option> : null}
        <optgroup label={t("sellers")}>
          {reps.map((rep) => (
            <option key={rep.key} value={rep.key}>
              {rep.name}
              {rep.linked ? "" : ` (${t("notLinked")})`}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
