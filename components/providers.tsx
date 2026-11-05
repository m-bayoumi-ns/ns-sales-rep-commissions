"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ThemeProvider } from "next-themes";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({
  children,
  direction,
}: {
  children: React.ReactNode;
  direction: "ltr" | "rtl";
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="ns-theme"
      // The inline theme script only needs to run on hard loads. On client
      // navigations (e.g. switching locale) React re-renders this script tag on
      // the client and warns it won't execute. Mark it text/plain there so the
      // browser skips it and React stays quiet; suppressHydrationWarning (set by
      // next-themes) covers the type mismatch.
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
    >
      <DirectionProvider direction={direction}>
        <TooltipProvider>
          <SmoothScroll />
          {children}
          <Toaster position={direction === "rtl" ? "bottom-left" : "bottom-right"} />
        </TooltipProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
