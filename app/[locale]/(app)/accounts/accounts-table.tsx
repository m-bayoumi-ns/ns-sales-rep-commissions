"use client";

import { CheckCircle2Icon, Clock3Icon, KeyRoundIcon, Loader2Icon, UserRoundIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { setAccountActive, setForcePassword } from "@/lib/accounts/actions";
import type { SellerAccount } from "@/lib/accounts/server";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50", checked ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5 rtl:-translate-x-5.5" : "translate-x-0.5 rtl:-translate-x-0.5")} />
    </button>
  );
}

/** Seller accounts: approve / disable, and force a password change at next sign-in (switches itself off once done). */
export function AccountsTable({ accounts }: { accounts: SellerAccount[] }) {
  const t = useTranslations("accounts");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rows, applyOptimistic] = useOptimistic(accounts, (current, change: { id: string; patch: Partial<SellerAccount> }) =>
    current.map((row) => (row.id === change.id ? { ...row, ...change.patch } : row)),
  );
  const run = (id: string, patch: Partial<SellerAccount>, action: () => Promise<{ ok: boolean }>, message: string) =>
    start(async () => {
      applyOptimistic({ id, patch });
      const result = await action();
      if (result.ok) toast.success(message);
      else toast.error(t("failed"));
      router.refresh();
    });

  const pendingCount = rows.filter((row) => !row.active).length;
  return (
    <div className="flex flex-col gap-4">
      {pendingCount ? (
        <p className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-2.5 text-sm text-warning">
          <Clock3Icon aria-hidden className="size-4" />
          {t("pendingCount", { count: pendingCount })}
        </p>
      ) : null}

      <h2 className="px-1 pt-2 text-sm font-semibold">{t("otherTitle")}</h2>
      {rows.length ? (
        <ul className="divide-y overflow-hidden rounded-3xl border bg-card shadow-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", row.active ? "bg-accent text-primary" : "bg-warning-soft text-warning")}>
                <UserRoundIcon aria-hidden className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <bdi className="truncate font-semibold">{row.name}</bdi>
                  {row.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                      <CheckCircle2Icon aria-hidden className="size-3" />
                      {t("active")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">{t("pending")}</span>
                  )}
                  {row.mustChangePassword ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                      <KeyRoundIcon aria-hidden className="size-3" />
                      {t("mustChange")}
                    </span>
                  ) : null}
                </span>
                <bdi dir="ltr" className="truncate text-start text-xs text-muted-foreground">
                  {row.username ? `${t("usernameLabel")}: ${row.username}` : row.email}
                </bdi>
                <span className="text-[11px] text-muted-foreground">{row.lastSignIn ? t("lastSignIn", { date: formatDateTime(new Date(row.lastSignIn), locale) }) : t("neverSignedIn")}</span>
              </div>
              <div className="flex items-center gap-5">
                <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <Switch checked={row.active} label={t("activeSwitch")} disabled={pending} onChange={(value) => run(row.id, { active: value }, () => setAccountActive(row.id, value), t(value ? "approved" : "disabled"))} />
                  {t("activeSwitch")}
                </label>
                <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <Switch
                    checked={row.mustChangePassword}
                    label={t("forceSwitch")}
                    disabled={pending}
                    onChange={(value) => run(row.id, { mustChangePassword: value }, () => setForcePassword(row.id, value), t(value ? "forceOn" : "forceOff"))}
                  />
                  {t("forceSwitch")}
                </label>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      )}
      {pending ? <Loader2Icon aria-hidden className="mx-auto size-4 animate-spin text-muted-foreground" /> : null}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
