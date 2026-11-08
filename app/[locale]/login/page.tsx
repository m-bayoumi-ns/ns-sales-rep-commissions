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
    <div className="login-shell relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="login-header relative z-10 border-b bg-card">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <BrandLogo label={t("app.company")} />
          <div className="ms-auto flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="login-main relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="login-card w-full max-w-[380px] rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
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
