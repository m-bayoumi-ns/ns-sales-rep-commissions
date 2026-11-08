import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LoginFormWithParams } from "./login-form-with-params";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("submit") };
}

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div className="login-shell relative flex min-h-dvh flex-col overflow-hidden bg-[#8b735d] text-foreground dark:bg-[#0d0f12]">
      <div
        aria-hidden
        className="login-texture pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_20%_15%,rgba(67,103,127,0.22),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,130,95,0.13),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%,rgba(255,255,255,0.02)),repeating-linear-gradient(90deg,rgba(255,255,255,0.025)_0,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_7px),repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_8px)]"
      />
      <div
        aria-hidden
        className="login-vignette pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(55,38,20,0.06)_55%,rgba(55,38,20,0.22)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,12,14,0.15)_55%,rgba(10,12,14,0.65)_100%)]"
      />
      <div aria-hidden className="login-top-rule relative z-10 h-1 bg-primary" />
      <header className="login-header relative z-10 border-b bg-card/80 backdrop-blur-[1px]">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <BrandLogo label={t("app.company")} />
          <div className="ms-auto flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="login-main relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="login-card w-full max-w-[380px] rounded-2xl border bg-card/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="login-app-brand app-only">
            <BrandLogo label={t("app.company")} />
          </div>
          <div className="mt-5">
            <Suspense fallback={<LoginForm />}>
              <LoginFormWithParams />
            </Suspense>
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t("login.newSeller")}{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              {t("login.createAccount")}
            </Link>
          </p>
          <p className="mt-6 text-center text-xs text-muted-foreground">{t("login.help")}</p>
        </div>
      </main>

      <footer className="login-footer relative z-10 py-6 text-center text-xs text-muted-foreground">{t("app.footer")}</footer>
    </div>
  );
}
