import { Suspense } from "react";
import { AppHeader, AppHeaderSkeleton } from "@/components/layout/app-header";
import { HeaderUser, HeaderUserSkeleton } from "@/components/layout/header-user";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<AppHeaderSkeleton />}>
        <AppHeader
          userSlot={
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          }
        />
      </Suspense>
      <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
