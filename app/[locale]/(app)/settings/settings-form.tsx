"use client";

import { BellRingIcon, CheckCircle2Icon, CopyIcon, InfoIcon, Loader2Icon, PackageSearchIcon, PlusIcon, SaveIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { rateChanges } from "@/lib/commissions/changes";
import { matchRep } from "@/lib/commissions/names";
import type { ProductSearchResult } from "@/lib/commissions/odoo";
import { CATEGORIES, type Category, type CommissionSettings, type ProductRule, type RepSetting, type Rules } from "@/lib/commissions/schema";
import type { RepEntry } from "@/lib/commissions/view";
import { formatDateTime, formatMonth, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { findProducts, saveCommissionSettings } from "./actions";

type Props = {
  month: string;
  initial: CommissionSettings;
  source: "saved" | "inherited" | "default";
  inheritedFrom: string | null;
  sheet: { found: boolean; path: string; count: number; columns: { rep: string | null; total: string | null; slow: string | null; digital: string | null } };
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
const uid = () => Math.random().toString(36).slice(2, 10);

/** Number field that keeps what is typed (commas allowed) and reports a number or null. */
function NumberInput({ value, onChange, label, placeholder, suffix, className }: { value: number | null; onChange: (value: number | null) => void; label: string; placeholder?: string; suffix?: string; className?: string }) {
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
        onChange={(event) => {
          setText(event.target.value);
          onChange(toNum(event.target.value));
        }}
        onBlur={() => setText(value == null ? "" : formatNumber(value) === "—" ? "" : String(value))}
        className={cn(inputClass, suffix && "pe-9")}
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

export function SettingsForm({ month, initial, source, inheritedFrom, sheet, reps: monthReps, candidates, accounts }: Props) {
  const t = useTranslations("settings");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [settings, setSettings] = useState<CommissionSettings>(() => ({
    ...initial,
    month,
    // The month's reps (from the target sheet), with their saved / sheet targets and Odoo link.
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
      <ProductsCard settings={settings} update={update} />
      <RulesCard rules={settings.rules} setRule={setRule} />
      <RepsCard settings={settings} update={update} sheet={sheet} monthName={monthName} candidates={candidates} monthReps={monthReps} />
      <NotifyCard notify={notify} setNotify={setNotify} accounts={accounts} changes={changes.length} />

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

// ---------------------------------------------------------------- 2. products
function ProductsCard({ settings, update }: { settings: CommissionSettings; update: Updater }) {
  const t = useTranslations("settings.products");
  const [filter, setFilter] = useState<Category | "all">("all");
  const setCategoryRate = (category: Category, rate: number | null) =>
    update((current) => ({ ...current, categoryRates: { ...current.categoryRates, [category]: rate ?? 0 } }));
  const add = (category: Category) =>
    update((current) => ({
      ...current,
      products: [...current.products, { key: uid(), templateId: 0, templateName: "", code: null, variantId: null, color: null, category }],
    }));
  const setProduct = (key: string, patch: Partial<ProductRule>) =>
    update((current) => ({ ...current, products: current.products.map((product) => (product.key === key ? { ...product, ...patch } : product)) }));
  const remove = (key: string) => update((current) => ({ ...current, products: current.products.filter((product) => product.key !== key) }));
  const shown = settings.products.filter((product) => filter === "all" || product.category === filter);
  const count = (category: Category) => settings.products.filter((product) => product.category === category).length;

  return (
    <Card
      title={t("title")}
      description={t("description")}
      actions={
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button key={category} type="button" variant="outline" onClick={() => add(category)}>
              <PlusIcon aria-hidden />
              {t(`add.${category}`)}
            </Button>
          ))}
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <Field key={category} label={t(`rate.${category}`)}>
            <NumberInput
              label={t(`rate.${category}`)}
              value={settings.categoryRates[category]}
              onChange={(value) => setCategoryRate(category, value)}
              suffix="%"
            />
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {(["all", ...CATEGORIES] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium", filter === key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {key === "all" ? t("all", { count: settings.products.length }) : t(`tab.${key}`, { count: count(key) })}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="flex flex-col gap-2">
          <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] gap-2 px-1 text-xs font-medium text-muted-foreground lg:grid">
            <span>{t("product")}</span>
            <span>{t("color")}</span>
            <span>{t("category")}</span>
            <span className="w-9" />
          </div>
          {shown.map((product) => (
            <ProductRow key={product.key} product={product} onChange={(patch) => setProduct(product.key, patch)} onRemove={() => remove(product.key)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          <PackageSearchIcon aria-hidden className="size-6" />
          {t("empty")}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </Card>
  );
}

function ProductRow({ product, onChange, onRemove }: { product: ProductRule; onChange: (patch: Partial<ProductRule>) => void; onRemove: () => void }) {
  const t = useTranslations("settings.products");
  const [variants, setVariants] = useState<{ id: number; color: string | null }[] | null>(null);
  return (
    <div className="grid grid-cols-2 items-start gap-2 rounded-lg border p-2 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:border-0 lg:p-0">
      <div className="col-span-2 lg:col-span-1">
        <ProductPicker
          key={product.templateId}
          value={product.templateId ? product.templateName : ""}
          onPick={(item) => {
            setVariants(item.variants);
            onChange({ templateId: item.templateId, templateName: item.name, code: item.code, variantId: null, color: null });
          }}
        />
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-muted-foreground lg:sr-only">{t("color")}</span>
        <select
          value={product.variantId ?? ""}
          disabled={!product.templateId}
          onChange={(event) => {
            const id = event.target.value ? Number(event.target.value) : null;
            const color = id ? (variants?.find((variant) => variant.id === id)?.color ?? product.color) : null;
            onChange({ variantId: id, color });
          }}
          className={inputClass}
        >
          <option value="">{t("allColors")}</option>
          {product.variantId && !variants?.some((variant) => variant.id === product.variantId) ? <option value={product.variantId}>{product.color ?? `#${product.variantId}`}</option> : null}
          {(variants ?? []).map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.color ?? `#${variant.id}`}
            </option>
          ))}
        </select>
        {product.templateId && !variants ? (
          <button type="button" className="text-start text-[11px] text-primary hover:underline" onClick={async () => setVariants((await findProducts(product.code ?? product.templateName)).find((item) => item.templateId === product.templateId)?.variants ?? [])}>
            {t("loadColors")}
          </button>
        ) : null}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-muted-foreground lg:sr-only">{t("category")}</span>
        <select value={product.category} onChange={(event) => onChange({ category: event.target.value as Category })} className={inputClass}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`cat.${category}`)}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t("remove")} title={t("remove")} className="self-end text-destructive lg:self-start">
        <Trash2Icon aria-hidden />
      </Button>
    </div>
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
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("collection")} hint={t("collectionHint")}>
                <NumberInput label={t("collection")} value={rules.collectionPct} onChange={n("collectionPct")} suffix="%" />
              </Field>
              <Field label={t("collectionBonus")}>
                <NumberInput label={t("collectionBonus")} value={rules.collectionBonus} onChange={n("collectionBonus")} suffix={t("egp")} />
              </Field>
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
            <Field label={t("oldMode")}>
              <select value={rules.oldSystemMode} onChange={(event) => setRule("oldSystemMode", event.target.value as Rules["oldSystemMode"])} className={inputClass}>
                <option value="base">{t("oldModeBase")}</option>
                <option value="rate">{t("oldModeRate")}</option>
              </select>
            </Field>
            {rules.oldSystemMode === "rate" ? (
              <Field label={t("oldRate")}>
                <NumberInput label={t("oldRate")} value={rules.oldRate} onChange={n("oldRate")} suffix="%" />
              </Field>
            ) : null}
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
          {(["A", "B", "C", "slow", "digital"] as const).map((key) => {
            const on = rules.statementDetails[key];
            return (
              <label key={key} className={cn("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm", on ? "border-primary bg-accent font-medium" : "text-muted-foreground")}>
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={on} onChange={(event) => setRule("statementDetails", { ...rules.statementDetails, [key]: event.target.checked })} />
                {key === "slow" || key === "digital" ? t(`cat.${key}`) : t("rangeKey", { key })}
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
  const setRep = (index: number, patch: Partial<RepSetting>) => update((current) => ({ ...current, reps: current.reps.map((rep, i) => (i === index ? { ...rep, ...patch } : rep)) }));
  const autoOf = useMemo(() => new Map(monthReps.map((rep) => [rep.name, matchRep(rep.name, candidates)?.id ?? null])), [monthReps, candidates]);
  const total = settings.reps.reduce((sum, rep) => sum + (rep.totalTarget ?? 0), 0);
  const unitLabel = (key: "slow" | "digital") => (units[key] === "qty" ? t("qty") : t("egp"));
  const rangeUnit = settings.rules.rangeUnit === "qty" ? t("qty") : t("egp");
  const ranges = settings.tiers.map((tier, index) => ({ index, key: String.fromCharCode(65 + index), active: tier.rate > 0 || tier.from > 0 || tier.to != null }));
  const setRange = (repIndex: number, rangeIndex: number, value: number | null) =>
    update((current) => ({
      ...current,
      reps: current.reps.map((rep, i) => {
        if (i !== repIndex) return rep;
        const next = [...(rep.rangeTargets ?? [])];
        while (next.length <= rangeIndex) next.push(null);
        next[rangeIndex] = value;
        return { ...rep, rangeTargets: next };
      }),
    }));
  const rangeTotal = (index: number) => settings.reps.reduce((sum, rep) => sum + (rep.rangeTargets?.[index] ?? 0), 0);
  return (
    <Card title={t("title")} description={t("description", { month: monthName })}>
      <p className={cn("flex flex-wrap items-center gap-2 text-sm", sheet.found ? "text-muted-foreground" : "text-warning")}>
        {sheet.found ? <CheckCircle2Icon aria-hidden className="size-4 text-success" /> : <TriangleAlertIcon aria-hidden className="size-4" />}
        {sheet.found ? t("sheetFound", { count: sheet.count }) : t("sheetMissing")}
        <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">naguib-selim-db/{sheet.path}</code>
        {sheet.found && (sheet.columns.total || sheet.columns.slow || sheet.columns.digital) ? (
          <span className="text-xs">{t("sheetColumns", { columns: [sheet.columns.total, sheet.columns.slow, sheet.columns.digital].filter(Boolean).join("، ") })}</span>
        ) : null}
      </p>
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
                      <NumberInput label={t("total")} value={rep.totalTarget} onChange={(value) => setRep(index, { totalTarget: value })} placeholder="—" />
                    </td>
                    {ranges.map((range) => (
                      <td key={range.key} className="px-3 py-2">
                        <NumberInput label={t("range", { key: range.key })} value={rep.rangeTargets?.[range.index] ?? null} onChange={(value) => setRange(index, range.index, value)} placeholder="—" />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <NumberInput label={t("slow")} value={rep.slowTarget} onChange={(value) => setRep(index, { slowTarget: value })} placeholder="—" />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput label={t("digital")} value={rep.digitalTarget} onChange={(value) => setRep(index, { digitalTarget: value })} placeholder="—" />
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
                <td colSpan={2} />
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
