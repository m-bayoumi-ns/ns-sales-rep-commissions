"use client";

import { CheckCircle2Icon, FileSpreadsheetIcon, Loader2Icon, UserPlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createAccountsFromSheet, setAccountActive, setForcePassword } from "@/lib/accounts/actions";
import { Switch } from "./accounts-table";
import type { CreateResult, SheetRepAccount } from "@/lib/accounts/server";
import { formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The reps of the latest target sheet: who already has an account, and a button to create the missing ones
 * (username + default password; the seller must choose a new password at first sign-in).
 */
export function SheetReps({ month, reps, defaultPassword }: { month: string; reps: SheetRepAccount[]; defaultPassword: string }) {
  const t = useTranslations("accounts.sheet");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<CreateResult[] | null>(null);
  const missing = reps.filter((rep) => !rep.account);
  const tAcc = useTranslations("accounts");
  // Optimistic switch state per account id.
  const [overrides, setOverrides] = useState<Record<string, { active?: boolean; mustChangePassword?: boolean }>>({});
  const toggle = (id: string, patch: { active?: boolean; mustChangePassword?: boolean }, action: () => Promise<{ ok: boolean }>, message: string) => {
    setOverrides((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(message);
      else {
        toast.error(tAcc("failed"));
        setOverrides((current) => ({ ...current, [id]: {} }));
      }
      router.refresh();
    });
  };

  const create = (names: string[], key: string) => {
    if (key === "all" && !window.confirm(t("confirm", { count: missing.length, password: defaultPassword }))) return;
    setBusy(key);
    start(async () => {
      const response = await createAccountsFromSheet(names);
      setBusy(null);
      if (!response.ok) {
        toast.error(t("failed"));
        return;
      }
      const created = response.results.filter((row) => row.status === "created").length;
      const failed = response.results.filter((row) => row.status === "error");
      if (created) toast.success(t("created", { count: created }));
      if (failed.length) toast.error(t("someFailed", { count: failed.length }));
      setResults(response.results);
      router.refresh();
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <FileSpreadsheetIcon aria-hidden className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">{t("title", { month: formatMonth(month, locale) })}</h2>
            <p className="text-sm text-muted-foreground">{t("description", { password: defaultPassword })}</p>
          </div>
        </div>
        <Button type="button" disabled={pending || !missing.length} onClick={() => create([], "all")}>
          {busy === "all" ? <Loader2Icon aria-hidden className="animate-spin" /> : <UserPlusIcon aria-hidden />}
          {missing.length ? t("createAll", { count: missing.length }) : t("allDone")}
        </Button>
      </header>

      <ul className="divide-y overflow-hidden rounded-2xl border">
        {reps.map((rep) => (
          <li key={rep.name} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <bdi className="truncate text-left text-sm font-medium rtl:text-right">{rep.name}</bdi>
              <span dir="ltr" className="text-start text-xs text-muted-foreground">
                {t("username")}: <span className="font-semibold text-foreground">{rep.account ? (rep.account.username ?? rep.account.email) : rep.username}</span>
              </span>
            </div>
            {rep.account ? (
              (() => {
                const account = rep.account;
                const active = overrides[account.id]?.active ?? account.active;
                const force = overrides[account.id]?.mustChangePassword ?? account.mustChangePassword;
                return (
                  <div className="flex items-center gap-4">
                    <span className={cn("hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-flex", active ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                      <CheckCircle2Icon aria-hidden className="size-3" />
                      {active ? t("hasAccount") : t("waiting")}
                    </span>
                    <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                      <Switch checked={active} label={tAcc("activeSwitch")} disabled={pending} onChange={(value) => toggle(account.id, { active: value }, () => setAccountActive(account.id, value), tAcc(value ? "approved" : "disabled"))} />
                      {tAcc("activeSwitch")}
                    </label>
                    <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                      <Switch
                        checked={force}
                        label={tAcc("forceSwitch")}
                        disabled={pending}
                        onChange={(value) => toggle(account.id, { mustChangePassword: value }, () => setForcePassword(account.id, value), tAcc(value ? "forceOn" : "forceOff"))}
                      />
                      {tAcc("forceSwitch")}
                    </label>
                  </div>
                );
              })()
            ) : (
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => create([rep.name], rep.name)}>
                {busy === rep.name ? <Loader2Icon aria-hidden className="animate-spin" /> : <UserPlusIcon aria-hidden />}
                {t("create")}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {results?.some((row) => row.status === "created") ? (
        <div className="rounded-2xl border border-success/30 bg-success-soft p-3 text-sm">
          <p className="mb-2 font-semibold text-success">{t("loginTitle")}</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {results
              .filter((row) => row.status === "created")
              .map((row) => (
                <li key={row.username} className="flex items-center justify-between gap-2 rounded-lg bg-card px-2 py-1">
                  <bdi className="truncate">{row.name}</bdi>
                  <span dir="ltr" className="shrink-0 font-mono text-xs">
                    {row.username} / {defaultPassword}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{t("loginHint")}</p>
        </div>
      ) : null}
      {results?.some((row) => row.status === "error") ? (
        <ul className="rounded-2xl border border-destructive/30 bg-destructive-soft p-3 text-xs text-destructive">
          {results
            .filter((row) => row.status === "error")
            .map((row) => (
              <li key={row.name}>
                <bdi>{row.name}</bdi>: {row.detail ?? t("failed")}
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}
