"use client";

import { CheckCircle2Icon, Loader2Icon, SmartphoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { setAndroidDownload } from "@/lib/accounts/actions";
import { ANDROID_APPS, ANDROID_VARIANTS, type AndroidVariant, sizeMb } from "@/lib/android-app";
import { cn } from "@/lib/utils";

/** Settings → which Android app the website's "Download for Android" button serves. Saved at once (not per month). */
export function AndroidDownloadCard({ initial }: { initial: AndroidVariant }) {
  const t = useTranslations("settings.androidDownload");
  const [value, setValue] = useState<AndroidVariant>(initial);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [saving, startSaving] = useTransition();

  const choose = (next: AndroidVariant) => {
    if (next === value || saving) return;
    const previous = value;
    setValue(next);
    setStatus(null);
    startSaving(async () => {
      const result = await setAndroidDownload(next).catch(() => ({ ok: false }));
      if (result.ok) setStatus("saved");
      else {
        setValue(previous);
        setStatus("error");
      }
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <SmartphoneIcon aria-hidden className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">{t("title")}</h2>
            <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs">
          {saving ? (
            <>
              <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
              <span className="text-muted-foreground">{t("saving")}</span>
            </>
          ) : status === "saved" ? (
            <>
              <CheckCircle2Icon aria-hidden className="size-3.5 text-success" />
              <span className="text-success">{t("saved")}</span>
            </>
          ) : status === "error" ? (
            <span className="text-destructive">{t("error")}</span>
          ) : null}
        </p>
      </header>

      <div role="radiogroup" aria-label={t("title")} className="grid gap-3 sm:grid-cols-2">
        {ANDROID_VARIANTS.map((variant) => {
          const selected = value === variant;
          const release = ANDROID_APPS[variant].release;
          return (
            <button
              key={variant}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={saving}
              onClick={() => choose(variant)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-start transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-wait",
                selected ? "border-primary bg-accent/60 ring-1 ring-primary" : "hover:bg-muted/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-primary" : "border-muted-foreground/40",
                )}
              >
                {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {t(`${variant}.title`)}
                  {variant === "native" ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{t("recommended")}</span>
                  ) : null}
                </span>
                <span className="text-sm text-muted-foreground">{t(`${variant}.hint`)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("version", { version: release.version, size: sizeMb(release.bytes) })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </section>
  );
}
