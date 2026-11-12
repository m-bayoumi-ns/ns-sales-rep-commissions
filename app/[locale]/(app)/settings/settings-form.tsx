"use client";

import { BellRingIcon, CheckCircle2Icon, CopyIcon, FileSpreadsheetIcon, InfoIcon, Loader2Icon, PackageSearchIcon, PlusIcon, SaveIcon, SearchIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { rateChanges } from "@/lib/commissions/changes";
import { matchRep, normalizeName } from "@/lib/commissions/names";
import type { ProductSearchResult } from "@/lib/commissions/odoo";
import type { CommissionNotification } from "@/lib/commissions/notifications";
import { type CommissionSettings, type ProductRule, type RepSetting, type Rules } from "@/lib/commissions/schema";
import type { SheetProductCommission } from "@/lib/commissions/storage";
import type { RepEntry } from "@/lib/commissions/view";
import { formatDateTime, formatMonth, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChangeText } from "@/components/layout/notification-bell";
import { findProducts, deleteCommissionNotification, saveCommissionMonthVisibility, saveCommissionSettings, saveExcelExportAccess } from "./actions";

type Props = {
  month: string;
  notifications: CommissionNotification[];
  excelExportAccess: "admins_only" | "report_access";
  monthVisibilityFrom: string;
  monthVisibilityTo: string;
  initial: CommissionSettings;
  source: "saved" | "inherited" | "default";
  inheritedFrom: string | null;
  sheet: {
    found: boolean;
    path: string;
    count: number;
    columns: { rep: string | null; total: string | null; slow: string | null; digital: string | null; ranges?: (string | null)[] };
    productCommission: {
      found: boolean;
      columns: { category: string | null; productName: string | null; price: string | null; commission: string | null };
      rows: SheetProductCommission[];
    };
  };
  reps: RepEntry[];
  candidates: { id: number; name: string }[];
  /** Active seller accounts that can be notified. */
  accounts: { id: string; name: string; email: string }[];
};

const inputClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const toNum = (value: string): number | null => {
  const text = value.replace(/[,\s]/g, "");
  if (text === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};
/** Number field that keeps what is typed (commas allowed) and reports a number or null. */
function NumberInput({ value, onChange, label, placeholder, suffix, className, readOnly = false }: { value: number | null; onChange: (value: number | null) => void; label: string; placeholder?: string; suffix?: string; className?: string; readOnly?: boolean }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  // The value changed from outside (not by typing here): show it.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (toNum(text) !== value) setText(value == null ? "" : String(value));
  }
  return (
    <label className={cn("relative flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <input
        dir="ltr"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => {
          if (readOnly) return;
          setText(event.target.value);
          onChange(toNum(event.target.value));
        }}
        onBlur={() => { if (!readOnly) setText(value == null ? "" : formatNumber(value) === "—" ? "" : String(value)); }}
        className={cn(inputClass, suffix && "pe-9", readOnly && "cursor-default bg-muted/40")}
      />
      {suffix ? <span className="pointer-events-none absolute end-2.5 text-xs text-muted-foreground">{suffix}</span> : null}
    </label>
  );
}

function Card({ title, description, children, actions }: { title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function SettingsForm({ month, notifications, excelExportAccess, monthVisibilityFrom, monthVisibilityTo, initial, source, inheritedFrom, sheet, reps: monthReps, candidates, accounts }: Props) {
  const t = useTranslations("settings");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [settings, setSettings] = useState<CommissionSettings>(() => ({
    ...initial,
    month,
    // Targets come from Excel; saved settings provide only the Odoo link.
    reps: monthReps.map((rep) => ({ name: rep.name, odooUserId: rep.odooUserId, totalTarget: rep.totalTarget, slowTarget: rep.slowTarget, digitalTarget: rep.digitalTarget, rangeTargets: rep.rangeTargets })),
  }));
  const [dirty, setDirty] = useState(source !== "saved");
  const [status, setStatus] = useState<{ kind: "saved" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [notify, setNotify] = useState<NotifyState>({ mode: "all", userIds: [], note: "" });
  const changes = useMemo(() => rateChanges(initial, settings), [initial, settings]);
  const update = (change: (current: CommissionSettings) => CommissionSettings) => {
    setSettings(change);
    setDirty(true);
    setStatus(null);
  };
  const setRule = <K extends keyof Rules>(key: K, value: Rules[K]) => update((current) => ({ ...current, rules: { ...current.rules, [key]: value } }));

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    startSaving(async () => {
      const clean: CommissionSettings = {
        ...settings,
        products: settings.products.filter((product) => product.templateId > 0),
        rules: { ...settings.rules, salesBonuses: settings.rules.salesBonuses.filter((step) => step.amount > 0) },
      };
      try {
        const result = await saveCommissionSettings(clean, { mode: notify.mode, userIds: notify.userIds, note: notify.note || undefined });
        if (!result.ok) {
          setStatus({ kind: "error", text: `${t(`status.${result.reason}`)}${result.detail ? ` (${result.detail})` : ""}` });
          return;
        }
        setDirty(false);
        setStatus({
          kind: "saved",
          text: `${t("status.saved", { date: formatDateTime(new Date(result.savedAt), locale) })}${result.notified ? ` · ${result.notified < 0 ? t("notify.sentAll") : t("notify.sentSome", { count: result.notified })}` : ""}`,
        });
        setNotify((current) => ({ ...current, note: "" }));
        router.refresh();
      } catch (error) {
        console.error("[settings] save failed:", error);
        setStatus({ kind: "error", text: t("status.storage") });
      }
    });

  const monthName = formatMonth(month, locale);
  return (
    <div className="flex flex-col gap-5 pb-24">
      {source === "inherited" && inheritedFrom ? (
        <p className="flex items-center gap-2 rounded-xl border bg-accent px-3 py-2.5 text-sm">
          <CopyIcon aria-hidden className="size-4 shrink-0" />
          {t("inherited", { from: formatMonth(inheritedFrom, locale), month: monthName })}
        </p>
      ) : source === "default" ? (
        <p className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning">
          <InfoIcon aria-hidden className="size-4 shrink-0" />
          {t("fresh", { month: monthName })}
        </p>
      ) : initial.updatedAt ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2Icon aria-hidden className="size-3.5 text-success" />
          {t("lastSaved", { date: formatDateTime(new Date(initial.updatedAt), locale), by: initial.updatedBy ?? "—" })}
        </p>
      ) : null}

      <TiersCard settings={settings} update={update} />
      <OldSystemTiersCard settings={settings} setRule={setRule} />
      <ProductsCard settings={settings} update={update} productCommission={sheet.productCommission} />
      <RulesCard rules={settings.rules} setRule={setRule} />
      <RepsCard settings={settings} update={update} sheet={sheet} monthName={monthName} candidates={candidates} monthReps={monthReps} />
      <MonthVisibilityCard initialFrom={monthVisibilityFrom} initialTo={monthVisibilityTo} />
      <ExcelExportAccessCard initial={excelExportAccess} />
      <NotifyCard notify={notify} setNotify={setNotify} accounts={accounts} changes={changes.length} />
      <CommissionNotificationsCard initial={notifications} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 md:px-6 lg:px-8">
          <Button type="button" onClick={save} disabled={saving} size="lg">
            {saving ? <Loader2Icon aria-hidden className="animate-spin" /> : <SaveIcon aria-hidden />}
            {saving ? t("saving") : t("save", { month: monthName })}
          </Button>
          {status ? (
            <p role={status.kind === "saved" ? "status" : "alert"} className={cn("text-sm", status.kind === "saved" ? "text-success" : "text-destructive")}>
              {status.text}
            </p>
          ) : dirty ? (
            <p className="text-sm text-warning">{t("unsaved")}</p>
          ) : null}
          <span className="ms-auto hidden text-xs text-muted-foreground md:block" dir="ltr">
            {t("storedAt")}: naguib-selim-db/ns-sales-rep-commissions/settings_{month.replace("-", "_")}.json
          </span>
        </div>
      </div>
    </div>
  );
}

type NotifyState = { mode: "none" | "all" | "users"; userIds: string[]; note: string };

function CommissionNotificationsCard({ initial }: { initial: CommissionNotification[] }) {
  const t = useTranslations("notify");
  const locale = useLocale() as Locale;
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [deleting, startDeleting] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = initial.filter((item) => !deletedIds.has(item.id));

  const remove = (item: CommissionNotification) => {
    if (!window.confirm(t("management.confirmDelete", { month: formatMonth(item.month, locale) }))) return;
    setDeletingId(item.id);
    setError(null);
    startDeleting(async () => {
      try {
        const result = await deleteCommissionNotification(item.id);
        if (!result.ok) {
          setError(t(`management.status.${result.reason}`));
          return;
        }
        setDeletedIds((current) => new Set(current).add(item.id));
      } catch (caught) {
        console.error("[settings] commission notification delete failed:", caught);
        setError(t("management.status.storage"));
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <Card title={t("management.title")} description={t("management.description")}>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {items.length ? (
        <ul className="divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 p-3 sm:p-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold">{t("itemTitle", { month: formatMonth(item.month, locale) })}</p>
                  <time className="text-xs text-muted-foreground">{formatDateTime(new Date(item.at), locale)}</time>
                </div>
                {item.note ? <p className="text-sm">{item.note}</p> : null}
                {item.changes.length ? (
                  <ul className="flex flex-col gap-1">
                    {item.changes.slice(0, 8).map((change, index) => (
                      <li key={index} className="text-xs text-muted-foreground"><ChangeText change={change} /></li>
                    ))}
                    {item.changes.length > 8 ? <li className="text-xs text-muted-foreground">{t("more", { count: item.changes.length - 8 })}</li> : null}
                  </ul>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {t("by", { name: item.by })}
                  {" · "}
                  {item.recipients.mode === "all" ? t("management.toAll") : t("toSome", { count: item.recipients.userIds.length })}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label={t("management.deleteButton", { month: formatMonth(item.month, locale) })}
                title={t("management.delete")}
                disabled={deleting}
                onClick={() => remove(item)}
              >
                {deleting && deletingId === item.id ? <Loader2Icon aria-hidden className="animate-spin" /> : <Trash2Icon aria-hidden />}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </Card>
  );
}

function MonthVisibilityCard({ initialFrom, initialTo }: { initialFrom: string; initialTo: string }) {
  const t = useTranslations("settings.monthVisibility");
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [saved, setSaved] = useState({ from: initialFrom, to: initialTo });
  const [status, setStatus] = useState<"saved" | "invalid" | "forbidden" | "storage" | null>(null);
  const [saving, startSaving] = useTransition();
  const dirty = from !== saved.from || to !== saved.to;

  const save = () => startSaving(async () => {
    try {
      const result = await saveCommissionMonthVisibility({ from, to });
      if (!result.ok) {
        setStatus(result.reason);
        return;
      }
      setSaved({ from, to });
      setStatus("saved");
      router.refresh();
    } catch (error) {
      console.error("[settings] commission month visibility save failed:", error);
      setStatus("storage");
    }
  });

  return (
    <Card title={t("title")} description={t("description")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("from")}>
          <input
            type="month"
            aria-label={t("from")}
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value);
              setStatus(null);
            }}
            className={inputClass}
          />
        </Field>
        <Field label={t("to")}>
          <input
            type="month"
            aria-label={t("to")}
            value={to}
            min={from}
            onChange={(event) => {
              setTo(event.target.value);
              setStatus(null);
            }}
            className={inputClass}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={save} disabled={saving || !dirty || !from}>
          {saving ? <Loader2Icon aria-hidden className="animate-spin" /> : <SaveIcon aria-hidden />}
          {saving ? t("saving") : t("save")}
        </Button>
        {status ? (
          <p role={status === "saved" ? "status" : "alert"} className={cn("text-sm", status === "saved" ? "text-success" : "text-destructive")}>
            {t(`status.${status}`)}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function ExcelExportAccessCard({ initial }: { initial: Props["excelExportAccess"] }) {
  const t = useTranslations("settings.exportAccess");
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [saving, startSaving] = useTransition();

  const save = () => startSaving(async () => {
    try {
      const result = await saveExcelExportAccess(value);
      if (!result.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
    } catch (error) {
      console.error("[settings] Excel export access save failed:", error);
      setStatus("error");
    }
  });

  return (
    <Card title={t("title")} description={t("description")}>
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("label")} hint={t("hint")}>
          <select
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === "admins_only" || nextValue === "report_access") setValue(nextValue);
              setStatus(null);
            }}
            className={inputClass}
          >
            <option value="admins_only">{t("adminsOnly")}</option>
            <option value="report_access">{t("reportAccess")}</option>
          </select>
        </Field>
        <Button type="button" onClick={save} disabled={saving || value === initial} variant="outline">
          {saving ? <Loader2Icon aria-hidden className="animate-spin" /> : <FileSpreadsheetIcon aria-hidden />}
          {saving ? t("saving") : t("save")}
        </Button>
        {status ? <span role={status === "error" ? "alert" : "status"} className={cn("text-sm", status === "error" ? "text-destructive" : "text-success")}>{t(status)}</span> : null}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- 5. notify sellers
function NotifyCard({ notify, setNotify, accounts, changes }: { notify: NotifyState; setNotify: (change: (current: NotifyState) => NotifyState) => void; accounts: Props["accounts"]; changes: number }) {
  const t = useTranslations("settings.notify");
  const toggle = (id: string) => setNotify((current) => ({ ...current, userIds: current.userIds.includes(id) ? current.userIds.filter((item) => item !== id) : [...current.userIds, id] }));
  return (
    <Card title={t("title")} description={t("description")}>
      <p className={cn("flex items-center gap-2 text-sm", changes ? "text-foreground" : "text-muted-foreground")}>
        <BellRingIcon aria-hidden className={cn("size-4", changes ? "text-primary" : "")} />
        {changes ? t("changes", { count: changes }) : t("noChanges")}
      </p>
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {(["all", "users", "none"] as const).map((mode) => (
          <label key={mode} className={cn("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm", notify.mode === mode ? "border-primary bg-accent font-medium" : "text-muted-foreground")}>
            <input type="radio" name="notify-mode" className="accent-[var(--primary)]" checked={notify.mode === mode} onChange={() => setNotify((current) => ({ ...current, mode }))} />
            {t(`mode.${mode}`, { count: accounts.length })}
          </label>
        ))}
      </div>
      {notify.mode === "users" ? (
        accounts.length ? (
          <div className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
            {accounts.map((account) => (
              <label key={account.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={notify.userIds.includes(account.id)} onChange={() => toggle(account.id)} />
                <span className="flex min-w-0 flex-col">
                  <bdi className="truncate">{account.name}</bdi>
                  <bdi dir="ltr" className="truncate text-start text-[11px] text-muted-foreground">{account.email}</bdi>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noAccounts")}</p>
        )
      ) : null}
      {notify.mode !== "none" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">{t("note")}</span>
          <textarea
            value={notify.note}
            maxLength={500}
            rows={2}
            onChange={(event) => setNotify((current) => ({ ...current, note: event.target.value }))}
            placeholder={t("notePlaceholder")}
            className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </label>
      ) : null}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </Card>
  );
}

type Updater = (change: (current: CommissionSettings) => CommissionSettings) => void;

// ---------------------------------------------------------------- 1. price tiers
function TiersCard({ settings, update }: { settings: CommissionSettings; update: Updater }) {
  const t = useTranslations("settings.tiers");
  const setTier = (index: number, patch: Partial<CommissionSettings["tiers"][number]>) =>
    update((current) => ({ ...current, tiers: current.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)) }));
  const overlaps = settings.tiers.some((a, i) =>
    settings.tiers.some((b, j) => i < j && a.rate + b.rate > 0 && a.from < (b.to ?? Infinity) && b.from < (a.to ?? Infinity)),
  );
  return (
    <Card title={t("title")} description={t("description")}>
      <div className="grid gap-3 md:grid-cols-3">
        {settings.tiers.map((tier, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">{String.fromCharCode(65 + index)}</span>
              {t("range", { key: String.fromCharCode(65 + index) })}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("from")}>
                <NumberInput label={t("from")} value={tier.from} onChange={(value) => setTier(index, { from: value ?? 0 })} suffix={t("perUnit")} />
              </Field>
              <Field label={t("to")}>
                <NumberInput label={t("to")} value={tier.to} onChange={(value) => setTier(index, { to: value })} placeholder={t("noLimit")} suffix={t("perUnit")} />
              </Field>
            </div>
            <Field label={t("rate")}>
              <NumberInput label={t("rate")} value={tier.rate} onChange={(value) => setTier(index, { rate: value ?? 0 })} suffix="%" />
            </Field>
          </div>
        ))}
      </div>
      {overlaps ? (
        <p className="flex items-center gap-2 text-sm text-warning">
          <TriangleAlertIcon aria-hidden className="size-4" />
          {t("overlap")}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </Card>
  );
}

function OldSystemTiersCard({
  settings,
  setRule,
}: {
  settings: CommissionSettings;
  setRule: <K extends keyof Rules>(key: K, value: Rules[K]) => void;
}) {
  const t = useTranslations("settings.oldTiers");
  const { rules } = settings;
  const setTier = (index: number, patch: Partial<CommissionSettings["tiers"][number]>) =>
    setRule("oldSystemTiers", rules.oldSystemTiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  const overlaps = rules.oldSystemTiers.some((a, i) =>
    rules.oldSystemTiers.some((b, j) => i < j && a.rate + b.rate > 0 && a.from < (b.to ?? Infinity) && b.from < (a.to ?? Infinity)),
  );
  const addTier = () => {
    if (rules.oldSystemTiers.length >= 6) return;
    setRule("oldSystemTiers", [...rules.oldSystemTiers, { from: 0, to: null, rate: 0 }]);
  };
  const removeTier = (index: number) => {
    if (rules.oldSystemTiers.length <= 1) return;
    setRule("oldSystemTiers", rules.oldSystemTiers.filter((_, i) => i !== index));
  };

  return (
    <Card
      title={t("title")}
      description={t("description", { from: rules.lowAchievementPct, to: rules.oldSystemUntilPct })}
      actions={
        <Button type="button" variant="outline" onClick={addTier} disabled={rules.oldSystemTiers.length >= 6}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      }
    >
      <>
          <div className="grid gap-3 md:grid-cols-3">
            {rules.oldSystemTiers.map((tier, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">{String.fromCharCode(65 + index)}</span>
                    {t("range", { key: String.fromCharCode(65 + index) })}
                  </span>
                  <Button type="button" variant="ghost" size="icon" aria-label={t("remove")} onClick={() => removeTier(index)} disabled={rules.oldSystemTiers.length <= 1}>
                    <Trash2Icon aria-hidden className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t("from")}>
                    <NumberInput label={t("from")} value={tier.from} onChange={(value) => setTier(index, { from: value ?? 0 })} suffix={t("perUnit")} />
                  </Field>
                  <Field label={t("to")}>
                    <NumberInput label={t("to")} value={tier.to} onChange={(value) => setTier(index, { to: value })} placeholder={t("noLimit")} suffix={t("perUnit")} />
                  </Field>
                </div>
                <Field label={t("rate")}>
                  <NumberInput label={t("rate")} value={tier.rate} onChange={(value) => setTier(index, { rate: value ?? 0 })} suffix="%" />
                </Field>
              </div>
            ))}
          </div>
          {overlaps ? (
            <p className="flex items-center gap-2 text-sm text-warning">
              <TriangleAlertIcon aria-hidden className="size-4" />
              {t("overlap")}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </>
    </Card>
  );
}

// ---------------------------------------------------------------- 2. products
function ProductsCard({ settings, update, productCommission }: { settings: CommissionSettings; update: Updater; productCommission: Props["sheet"]["productCommission"] }) {
  const t = useTranslations("settings.products");
  const setProduct = (key: string, patch: Partial<ProductRule>) =>
    update((current) => ({ ...current, products: current.products.map((product) => (product.key === key ? { ...product, ...patch } : product)) }));
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const linkedCount = productCommission.rows.filter((row) => settings.products.some((product) => product.key === row.key && product.templateId > 0)).length;
  const categoryKeyFor = (row: SheetProductCommission) =>
    row.categoryKey ? `known:${row.categoryKey}` : `source:${normalizeName(row.category) || "empty"}`;
  const categoryProducts = new Map<string, { label: string; productNames: Set<string> }>();
  for (const row of productCommission.rows) {
    const productName = normalizeName(row.productName);
    const sourceCategory = row.category.trim();
    const key = categoryKeyFor(row);
    const label = row.categoryKey ? t(`cat.${row.categoryKey}`) : sourceCategory || t("unclassified");
    const category = categoryProducts.get(key) ?? { label, productNames: new Set<string>() };
    if (productName) category.productNames.add(productName);
    categoryProducts.set(key, category);
  }
  const categorySummary = [...categoryProducts.values()];
  const categoryOptions = [...categoryProducts.entries()].map(([value, category]) => ({ value, label: category.label }));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredRows = productCommission.rows.filter((row) => {
    if (categoryFilter !== "all" && categoryKeyFor(row) !== categoryFilter) return false;
    if (!normalizedQuery) return true;
    const product = settings.products.find((item) => item.key === row.key);
    return [row.productName, product?.templateName, product?.code]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <Card title={t("title")} description={t("description")}>
      <p className={cn("flex items-center gap-2 text-sm", productCommission.found ? "text-muted-foreground" : "text-warning")}>
        {productCommission.found ? <CheckCircle2Icon aria-hidden className="size-4 text-success" /> : <TriangleAlertIcon aria-hidden className="size-4" />}
        {productCommission.found
          ? t("sourceStatus", { count: productCommission.rows.length, linked: linkedCount })
          : t("sourceMissing")}
      </p>
      {productCommission.found ? (
        <p className="text-sm text-muted-foreground">
          {t("categorySummary")}{" "}
          {categorySummary.length
            ? categorySummary.map((category, index) => (
                <span key={category.label}>
                  {index ? " · " : ""}
                  {category.label}: {category.productNames.size}
                </span>
              ))
            : t("noCategoryProducts")}
        </p>
      ) : null}
      {productCommission.rows.length ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="relative w-full max-w-sm">
              <span className="sr-only">{t("searchFilter")}</span>
              <SearchIcon aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchFilter")}
                className="h-9 w-full rounded-lg border border-input bg-card ps-8 pe-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </label>
            <Field label={t("categoryFilter")}>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClass}>
                <option value="all">{t("allCategories")}</option>
                {categoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="fin-head text-xs">
                  <th className="px-3 py-2 text-start font-semibold">{t("category")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("product")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("price")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("commission")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("odooProduct")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("linkStatus")}</th>
                </tr>
              </thead>
              <tbody>
              {filteredRows.length ? filteredRows.map((row) => {
                const product = settings.products.find((item) => item.key === row.key);
                return (
                  <tr key={row.key} className="border-t align-top">
                    <td className="px-3 py-2">{row.categoryKey ? t(`cat.${row.categoryKey}`) : row.category || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        {!product?.templateId ? (
                          <span aria-label={t("unmatched")} title={t("unmatched")} className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning-soft text-xs font-bold text-warning">!</span>
                        ) : null}
                        <bdi>{row.productName || "—"}</bdi>
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums" dir="ltr">
                      {row.anyPrice ? t("anyPrice") : row.price != null ? formatNumber(row.price) : row.priceText || "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums" dir="ltr">
                      {row.commission != null ? `${formatNumber(row.commission)}%` : row.commissionText || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <ProductPicker
                        key={`${row.key}:${product?.templateId ?? 0}`}
                        value={product?.templateId ? product.templateName : ""}
                        onPick={(item) => setProduct(row.key, { templateId: item.templateId, templateName: item.name, code: item.code, variantId: null, color: null })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("text-xs font-medium", product?.templateId ? "text-success" : "text-warning")}>
                        {product?.templateId ? t("linked") : t("notLinked")}
                      </span>
                      {!row.valid ? (
                        <span className="mt-1 block text-xs text-destructive">
                          {!row.category.trim()
                            ? t("missingCategory")
                            : t("invalidRow")}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">{t("noFilteredProducts")}</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          <PackageSearchIcon aria-hidden className="size-6" />
          {productCommission.found ? t("empty") : t("sourceMissing")}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </Card>
  );
}

/** Type-ahead over Odoo products (name or internal code). */
function ProductPicker({ value, onPick }: { value: string; onPick: (item: ProductSearchResult) => void }) {
  const t = useTranslations("settings.products");
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const search = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) return setResults([]);
    timer.current = setTimeout(async () => {
      const id = ++seq.current;
      setLoading(true);
      const found = await findProducts(text);
      if (id === seq.current) {
        setResults(found);
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="relative">
      <label className="relative flex items-center">
        <span className="sr-only">{t("product")}</span>
        <PackageSearchIcon aria-hidden className="pointer-events-none absolute start-2.5 size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => search(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t("searchPlaceholder")}
          className={cn(inputClass, "ps-8", !value && "border-dashed")}
        />
        {loading ? <Loader2Icon aria-hidden className="absolute end-2.5 size-4 animate-spin text-muted-foreground" /> : null}
      </label>
      {open && query.trim().length >= 2 ? (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {results.length ? (
            results.map((item) => (
              <li key={item.templateId}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick(item);
                    setQuery(item.name);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted"
                >
                  <bdi className="truncate">{item.name}</bdi>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t("colors", { count: item.variants.length })}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-sm text-muted-foreground">{loading ? t("searching") : t("noResults")}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- 3. conditions
function RulesCard({ rules, setRule }: { rules: Rules; setRule: <K extends keyof Rules>(key: K, value: Rules[K]) => void }) {
  const t = useTranslations("settings.rules");
  const n = (key: keyof Rules) => (value: number | null) => setRule(key, (value ?? 0) as never);
  const steps = rules.salesBonuses;
  const setStep = (index: number, patch: Partial<Rules["salesBonuses"][number]>) => setRule("salesBonuses", steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  return (
    <Card title={t("title")} description={t("description")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
          <legend className="px-1 text-sm font-semibold">{t("bonusesTitle")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("allTargetsBonus")} hint={t("allTargetsHint")}>
              <NumberInput label={t("allTargetsBonus")} value={rules.allTargetsBonusPct} onChange={n("allTargetsBonusPct")} suffix="%" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("slowMin")}>
                <NumberInput label={t("slowMin")} value={rules.slowMinPct} onChange={n("slowMinPct")} suffix="%" />
              </Field>
              <Field label={t("slowDeduction")}>
                <NumberInput label={t("slowDeduction")} value={rules.slowDeductionPct} onChange={n("slowDeductionPct")} suffix="%" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("cashShare")} hint={t("cashHint")}>
                <NumberInput label={t("cashShare")} value={rules.cashSharePct} onChange={n("cashSharePct")} suffix="%" />
              </Field>
              <Field label={t("cashBonus")}>
                <NumberInput label={t("cashBonus")} value={rules.cashBonus} onChange={n("cashBonus")} suffix={t("egp")} />
              </Field>
              <div className="col-span-2">
                <Field label={t("minAchievement")} hint={t("minAchievementHint")}>
                  <NumberInput label={t("minAchievement")} value={rules.cashMinAchievementPct} onChange={(value) => setRule("cashMinAchievementPct", value)} placeholder={t("minAchievementEmpty")} suffix="%" />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("collection")} hint={t("collectionHint")}>
                <NumberInput label={t("collection")} value={rules.collectionPct} onChange={n("collectionPct")} suffix="%" />
              </Field>
              <Field label={t("collectionBonus")}>
                <NumberInput label={t("collectionBonus")} value={rules.collectionBonus} onChange={n("collectionBonus")} suffix={t("egp")} />
              </Field>
              <div className="col-span-2">
                <Field label={t("minAchievement")} hint={t("minAchievementHint")}>
                  <NumberInput label={t("minAchievement")} value={rules.collectionMinAchievementPct} onChange={(value) => setRule("collectionMinAchievementPct", value)} placeholder={t("minAchievementEmpty")} suffix="%" />
                </Field>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
          <legend className="px-1 text-sm font-semibold">{t("systemsTitle")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("lowPct")} hint={t("lowHint")}>
              <NumberInput label={t("lowPct")} value={rules.lowAchievementPct} onChange={n("lowAchievementPct")} suffix="%" />
            </Field>
            <Field label={t("lowRate")}>
              <NumberInput label={t("lowRate")} value={rules.lowRate} onChange={n("lowRate")} suffix="%" />
            </Field>
            <Field label={t("oldUntil")} hint={t("oldHint", { from: rules.lowAchievementPct })}>
              <NumberInput label={t("oldUntil")} value={rules.oldSystemUntilPct} onChange={n("oldSystemUntilPct")} suffix="%" />
            </Field>
            <Field label={t("minimum")} hint={t("minimumHint")}>
              <NumberInput label={t("minimum")} value={rules.minimumSales} onChange={n("minimumSales")} suffix={t("egp")} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("unitOf", { name: t("cat.slow") })}>
              <span className={cn(inputClass, "flex items-center text-muted-foreground")}>{t("unitAmount")}</span>
            </Field>
            <Field label={t("unitOf", { name: t("cat.digital") })}>
              <select
                value={rules.categoryUnits.digital}
                onChange={(event) => setRule("categoryUnits", { ...rules.categoryUnits, digital: event.target.value as "qty" | "amount" })}
                className={inputClass}
              >
                <option value="qty">{t("unitQty")}</option>
                <option value="amount">{t("unitAmount")}</option>
              </select>
            </Field>
          </div>
        </fieldset>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-semibold">{t("detailsTitle")}</legend>
        <p className="text-xs text-muted-foreground">{t("detailsHint")}</p>
        <div className="flex flex-wrap gap-2">
          {(["A", "B", "C", "ns", "slow", "digital"] as const).map((key) => {
            const on = rules.statementDetails[key];
            return (
              <label key={key} className={cn("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm", on ? "border-primary bg-accent font-medium" : "text-muted-foreground")}>
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={on} onChange={(event) => setRule("statementDetails", { ...rules.statementDetails, [key]: event.target.checked })} />
                {key === "A" || key === "B" || key === "C" ? t("rangeKey", { key }) : t(`cat.${key}`)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-semibold">{t("ladderTitle")}</legend>
        <p className="text-xs text-muted-foreground">{t("ladderHint")}</p>
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <Field label={t("ladderFrom")}>
                <NumberInput label={t("ladderFrom")} value={step.from} onChange={(value) => setStep(index, { from: value ?? 0 })} suffix={t("egp")} />
              </Field>
              <Field label={t("ladderTo")}>
                <NumberInput label={t("ladderTo")} value={step.to} onChange={(value) => setStep(index, { to: value })} placeholder={t("noLimit")} suffix={t("egp")} />
              </Field>
              <Field label={t("ladderBonus")}>
                <NumberInput label={t("ladderBonus")} value={step.amount} onChange={(value) => setStep(index, { amount: value ?? 0 })} suffix={t("egp")} />
              </Field>
              <Button type="button" variant="ghost" size="icon" aria-label={t("remove")} title={t("remove")} className="text-destructive" onClick={() => setRule("salesBonuses", steps.filter((_, i) => i !== index))}>
                <Trash2Icon aria-hidden />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="w-fit" onClick={() => setRule("salesBonuses", [...steps, { from: 0, to: null, amount: 0 }])}>
          <PlusIcon aria-hidden />
          {t("ladderAdd")}
        </Button>
      </fieldset>
    </Card>
  );
}

// ---------------------------------------------------------------- 4. reps & targets
function RepsCard({
  settings,
  update,
  sheet,
  monthName,
  candidates,
  monthReps,
}: {
  settings: CommissionSettings;
  update: Updater;
  sheet: Props["sheet"];
  monthName: string;
  candidates: { id: number; name: string }[];
  monthReps: RepEntry[];
}) {
  const t = useTranslations("settings.reps");
  const units = settings.rules.categoryUnits;
  const sheetRangeColumns = sheet.columns.ranges ?? [];
  const setRep = (index: number, patch: Partial<RepSetting>) => update((current) => ({ ...current, reps: current.reps.map((rep, i) => (i === index ? { ...rep, ...patch } : rep)) }));
  const autoOf = useMemo(() => new Map(monthReps.map((rep) => [rep.name, matchRep(rep.name, candidates)?.id ?? null])), [monthReps, candidates]);
  const total = settings.reps.reduce((sum, rep) => sum + (rep.totalTarget ?? 0), 0);
  const slowTotal = settings.reps.reduce((sum, rep) => sum + (rep.slowTarget ?? 0), 0);
  const digitalTotal = settings.reps.reduce((sum, rep) => sum + (rep.digitalTarget ?? 0), 0);
  const unitLabel = (key: "slow" | "digital") => (units[key] === "qty" ? t("qty") : t("egp"));
  const rangeUnit = settings.rules.rangeUnit === "qty" ? t("qty") : t("egp");
  const ranges = settings.tiers.map((tier, index) => ({ index, key: String.fromCharCode(65 + index), active: tier.rate > 0 || tier.from > 0 || tier.to != null }));
  const sheetHasTargetColumns = Boolean(sheet.columns.total || sheet.columns.slow || sheet.columns.digital || sheetRangeColumns.some(Boolean));
  const rangeTotal = (index: number) => settings.reps.reduce((sum, rep) => sum + (rep.rangeTargets?.[index] ?? 0), 0);
  return (
    <Card title={t("title")} description={t("description", { month: monthName })}>
      <p className={cn("flex flex-wrap items-center gap-2 text-sm", sheet.found ? "text-muted-foreground" : "text-warning")}>
        {sheet.found ? <CheckCircle2Icon aria-hidden className="size-4 text-success" /> : <TriangleAlertIcon aria-hidden className="size-4" />}
        {sheet.found ? t("sheetFound", { count: sheet.count }) : t("sheetMissing")}
        <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">naguib-selim-db/{sheet.path}</code>
        {sheet.found && (sheet.columns.total || sheet.columns.slow || sheet.columns.digital || sheetRangeColumns.some(Boolean)) ? (
          <span className="text-xs">{t("sheetColumns", { columns: [sheet.columns.total, ...sheetRangeColumns, sheet.columns.slow, sheet.columns.digital].filter(Boolean).join("، ") })}</span>
        ) : null}
      </p>
      {sheet.found && sheetHasTargetColumns ? (
        <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success">
          <CheckCircle2Icon aria-hidden className="size-4 shrink-0" />
          {t("excelSource")}
        </p>
      ) : null}
      <label className="flex w-fit items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("rangeUnit")}</span>
        <select
          value={settings.rules.rangeUnit}
          onChange={(event) => update((current) => ({ ...current, rules: { ...current.rules, rangeUnit: event.target.value as "qty" | "amount" } }))}
          className={cn(inputClass, "w-auto")}
        >
          <option value="amount">{t("unitAmount")}</option>
          <option value="qty">{t("unitQty")}</option>
        </select>
      </label>
      {settings.reps.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1320px] text-sm">
            <thead>
              <tr className="fin-head text-xs">
                <th className="px-3 py-2 text-start font-semibold">{t("rep")}</th>
                <th className="px-3 py-2 text-start font-semibold">{t("odoo")}</th>
                <th className="px-3 py-2 text-start font-semibold">{t("total")} ({t("egp")})</th>
                {ranges.map((range) => (
                  <th key={range.key} className="px-3 py-2 text-start font-semibold">
                    {t("range", { key: range.key })} ({rangeUnit})
                  </th>
                ))}
                <th className="px-3 py-2 text-start font-semibold">{t("slow")} ({unitLabel("slow")})</th>
                <th className="px-3 py-2 text-start font-semibold">{t("digital")} ({unitLabel("digital")})</th>
              </tr>
            </thead>
            <tbody>
              {settings.reps.map((rep, index) => {
                const auto = autoOf.get(rep.name) ?? null;
                return (
                  <tr key={rep.name} className="border-t align-top">
                    <td className="px-3 py-2 font-medium">
                      <bdi>{rep.name}</bdi>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={rep.odooUserId ?? ""}
                        onChange={(event) => setRep(index, { odooUserId: event.target.value ? Number(event.target.value) : null })}
                        className={cn(inputClass, !rep.odooUserId && "border-destructive")}
                      >
                        <option value="">{t("notLinked")}</option>
                        {rep.odooUserId && !candidates.some((user) => user.id === rep.odooUserId) ? <option value={rep.odooUserId}>#{rep.odooUserId}</option> : null}
                        {candidates.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                            {user.id === auto ? ` ✓` : ""}
                          </option>
                        ))}
                      </select>
                      {rep.odooUserId && rep.odooUserId === auto ? <span className="mt-1 block text-[11px] text-muted-foreground">{t("autoMatched")}</span> : null}
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput label={t("total")} value={rep.totalTarget} onChange={() => {}} placeholder="—" readOnly />
                    </td>
                    {ranges.map((range) => (
                      <td key={range.key} className="px-3 py-2">
                        <NumberInput label={t("range", { key: range.key })} value={rep.rangeTargets?.[range.index] ?? null} onChange={() => {}} placeholder="—" readOnly />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <NumberInput label={t("slow")} value={rep.slowTarget} onChange={() => {}} placeholder="—" readOnly />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput label={t("digital")} value={rep.digitalTarget} onChange={() => {}} placeholder="—" readOnly />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/50 font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  {t("count", { count: settings.reps.length })}
                </td>
                <td dir="ltr" className="px-3 py-2 text-start tabular-nums">
                  {formatNumber(total)}
                </td>
                {ranges.map((range) => (
                  <td key={range.key} dir="ltr" className="px-3 py-2 text-start tabular-nums">
                    {formatNumber(rangeTotal(range.index))}
                  </td>
                ))}
                <td dir="ltr" className="px-3 py-2 text-start tabular-nums">
                  {formatNumber(slowTotal)}
                </td>
                <td dir="ltr" className="px-3 py-2 text-start tabular-nums">
                  {formatNumber(digitalTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      )}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </Card>
  );
}
