import { BellRingIcon, ChartLineIcon, ShareIcon, ShieldCheckIcon, SquarePlusIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AndroidDownloadButton, DeviceNote, IosSoonButton } from "@/components/layout/android-app";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";
import { ANDROID_RELEASE, sizeMb } from "@/lib/android-app";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("androidApp.page");
  return { title: t("metaTitle") };
}

const FEATURES = [
  { key: "f1", icon: WalletIcon },
  { key: "f2", icon: ChartLineIcon },
  { key: "f3", icon: BellRingIcon },
  { key: "f4", icon: ShieldCheckIcon },
] as const;

/** Public page presenting the mobile app: Android download, install steps, iPhone coming soon. */
export default function GetAppPage() {
  const t = useTranslations();
  const p = (key: string, values?: Record<string, string>) => t(`androidApp.page.${key}`, values);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(116,76,39,0.18),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(210,165,116,0.12),transparent_65%)]"
      />
      <div aria-hidden className="relative z-10 h-1 bg-primary" />
      <header className="relative z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 md:px-6">
          <Link href="/commissions" aria-label={t("app.name")}>
            <BrandLogo label={t("app.company")} />
          </Link>
          <div className="ms-auto flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-4 py-12 md:px-6 md:py-16">
        {/* Hero */}
        <section className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary">{p("eyebrow")}</span>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
              <img src="/brand/app-icon.png" alt="" width={72} height={72} className="size-[72px] rounded-[20px] shadow-lg" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{p("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("app.company")}</p>
              </div>
            </div>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">{p("lead")}</p>
            <div className="flex flex-wrap gap-3">
              <AndroidDownloadButton />
              <IosSoonButton />
            </div>
            <p className="text-xs text-muted-foreground">
              {p("version", { version: ANDROID_RELEASE.version, size: sizeMb(ANDROID_RELEASE.bytes) })}
            </p>
            <DeviceNote />
          </div>

          {/* Phone preview */}
          <div aria-hidden className="mx-auto w-[250px] md:w-[270px]">
            <div className="rounded-[42px] border-[10px] border-neutral-900 bg-background p-0 shadow-[0_30px_60px_rgba(0,0,0,0.30)] dark:border-neutral-700">
              <div className="overflow-hidden rounded-[32px]">
                <div className="flex h-7 items-center justify-center bg-primary">
                  <span className="h-1.5 w-14 rounded-full bg-black/25" />
                </div>
                <div className="flex flex-col gap-3 bg-background p-4">
                  <div className="flex items-center gap-2">
                    <span className="brand-mask block h-5 w-[25px] text-primary" style={{ maskImage: "url(/brand/ns-mark.png)" }} />
                    <span className="h-2 w-16 rounded bg-muted" />
                    <span className="ms-auto size-6 rounded-full bg-accent" />
                  </div>
                  <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                    <span className="block text-[10px] opacity-80">{p("mockCommission")}</span>
                    <span className="block text-2xl font-bold tabular-nums">12,480</span>
                    <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/25">
                      <span className="block h-full w-[78%] rounded-full bg-white" />
                    </span>
                    <span className="mt-1.5 block text-[10px] opacity-80">{p("mockTarget")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[64, 82].map((w) => (
                      <div key={w} className="rounded-xl border bg-card p-2.5">
                        <span className="block h-1.5 w-10 rounded bg-muted" />
                        <span className="mt-2 block h-3 rounded bg-accent" style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex h-20 items-end gap-1.5 rounded-xl border bg-card p-2.5">
                    {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
                      <span key={i} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl border bg-card p-2.5">
                      <span className="size-6 rounded-lg bg-accent" />
                      <span className="h-2 flex-1 rounded bg-muted" />
                      <span className="h-2 w-8 rounded bg-primary/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features" className="flex flex-col gap-5">
          <h2 id="features" className="text-xl font-bold">{p("featuresTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ key, icon: Icon }) => (
              <div key={key} className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="font-semibold">{p(`${key}Title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{p(`${key}Body`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Install */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold">{p("androidTitle")}</h2>
            <ol className="flex flex-col gap-3">
              {(["s1", "s2", "s3", "s4"] as const).map((s, i) => (
                <li key={s} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{p(s)}</span>
                </li>
              ))}
            </ol>
            <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{p("androidNote")}</p>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-dashed bg-card/60 p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{p("iosTitle")}</h2>
              <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-[11px] font-semibold text-warning">{p("soon")}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{p("iosBody")}</p>
            <h3 className="text-sm font-semibold">{p("iosMeanwhile")}</h3>
            <ol className="flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-3">
                <ShareIcon aria-hidden className="size-5 shrink-0 text-primary" />
                {p("i1")}
              </li>
              <li className="flex items-center gap-3">
                <SquarePlusIcon aria-hidden className="size-5 shrink-0 text-primary" />
                {p("i2")}
              </li>
            </ol>
          </div>
        </section>

        <p className="text-center text-sm text-muted-foreground">
          {p("help")}{" "}
          <Link href="/commissions" className="font-semibold text-primary hover:underline">
            {p("openSite")}
          </Link>
        </p>
      </main>

      <footer className="relative z-10 border-t py-6 text-center text-xs text-muted-foreground">{t("app.footer")}</footer>
    </div>
  );
}
