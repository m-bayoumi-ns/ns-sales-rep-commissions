import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AppModeMarker, GetAppBanner } from "@/components/layout/android-app";
import { WebLaunchSplash } from "@/components/layout/web-launch-splash";
import { Providers } from "@/components/providers";
import { directionOf, isLocale, routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: "Sales rep commissions for Naguib Selim.",
    robots: { index: false, follow: false },
    // iPhone "Add to Home Screen": full-screen app with its own icon and name.
    appleWebApp: { capable: true, title: "NS Commissions", statusBarStyle: "default" },
    icons: { apple: "/brand/apple-touch-icon.png", icon: "/brand/icon-192-v2.png" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
  viewportFit: "cover",
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();
  const dir = directionOf(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(location.pathname.indexOf('/get-app')!==-1||sessionStorage.getItem('ns_web_splash')==='1')document.documentElement.dataset.splashDone='1'}catch{}",
          }}
        />
        <NextIntlClientProvider>
          <Providers direction={dir}>
            {children}
            <GetAppBanner />
            <AppModeMarker />
            <WebLaunchSplash />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
