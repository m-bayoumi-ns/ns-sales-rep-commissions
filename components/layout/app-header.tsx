import { HomeIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { BrandLogo } from "./brand-logo";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

export function AppHeaderSkeleton() {
  return (
    <header aria-hidden className="h-16 border-b bg-card/95">
      <div className="mx-auto flex h-full max-w-[1440px] items-center px-4 md:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      </div>
    </header>
  );
}

/** `userSlot` is the signed-in user menu, streamed in behind a Suspense boundary. */
export async function AppHeader({ userSlot }: { userSlot?: React.ReactNode }) {
  const [t, user] = await Promise.all([getTranslations(), getCurrentUser()]);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        {t("header.skipToContent")}
      </a>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:gap-3 md:px-6 lg:px-8">
        <Link href="/commissions" className="flex shrink-0 items-center gap-3 rounded-md">
          <BrandLogo label={t("app.company")} />
        </Link>
        <a
          href="https://ns.bayoumi.dev/"
          aria-label={t("header.home")}
          title={t("header.home")}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <HomeIcon aria-hidden />
        </a>
        <div className="ms-auto flex items-center gap-1 sm:gap-3">
          {user ? <NotificationBell /> : null}
          <LanguageSwitcher />
          <ThemeToggle />
          {userSlot}
        </div>
      </div>
    </header>
  );
}
