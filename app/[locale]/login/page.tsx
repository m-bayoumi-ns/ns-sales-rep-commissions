import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/layout/brand-logo";
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
          <a
            href="https://wa.me/201277909022"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center gap-3 rounded-2xl border bg-muted/40 p-3 transition hover:bg-muted/70"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
              <svg aria-hidden className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32" />
              </svg>
            </span>
            <span className="text-xs leading-snug text-muted-foreground">{t("login.help")}</span>
          </a>
        </div>
      </main>

      <footer className="login-footer relative z-10 py-6 text-center text-xs text-muted-foreground">{t("app.footer")}</footer>
    </div>
  );
}
