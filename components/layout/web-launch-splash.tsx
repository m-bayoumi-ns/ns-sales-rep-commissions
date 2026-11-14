"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "ns_web_splash";
const TITLE = "Sales Rep Commissions";
const CHAR_INTERVAL_MS = 38;
const START_DELAY_MS = 260;
const HOLD_AFTER_TYPING_MS = 480;
const FADE_OUT_MS = 420;

/**
 * Full-screen launch splash for the web app only:
 * - Clean NS logo with no box behind it over the signature brown gradient.
 * - "Sales Rep Commissions" typed letter-by-letter underneath with a sleek animated caret.
 * - Plays once per browser/PWA session on entry (skipped on /get-app).
 */
export function WebLaunchSplash() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"active" | "leaving" | "done">("active");
  const [typedCount, setTypedCount] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    if (phase !== "active") return;

    let alreadyDone =
      Boolean(pathname?.includes("/get-app")) ||
      document.documentElement.dataset.splashDone === "1";

    if (!alreadyDone) {
      try {
        if (sessionStorage.getItem(SPLASH_KEY) === "1") {
          alreadyDone = true;
        } else {
          sessionStorage.setItem(SPLASH_KEY, "1");
        }
      } catch {
        // Ignore storage restrictions in private browsing
      }
    }

    if (alreadyDone) {
      document.documentElement.dataset.splashDone = "1";
      const doneTimer = window.setTimeout(() => setPhase("done"), 0);
      return () => window.clearTimeout(doneTimer);
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const t0 = window.setTimeout(() => {
        setTypedCount(TITLE.length);
        setTypingDone(true);
      }, 0);
      const t1 = window.setTimeout(() => setPhase("leaving"), 350);
      const t2 = window.setTimeout(() => {
        document.documentElement.dataset.splashDone = "1";
        setPhase("done");
      }, 650);
      return () => {
        window.clearTimeout(t0);
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    let intervalId: number | undefined;
    let holdTimer: number | undefined;
    let finishTimer: number | undefined;

    const startTimer = window.setTimeout(() => {
      let current = 0;
      intervalId = window.setInterval(() => {
        current += 1;
        setTypedCount(current);
        if (current >= TITLE.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId);
          setTypingDone(true);
          holdTimer = window.setTimeout(() => {
            setPhase("leaving");
            finishTimer = window.setTimeout(() => {
              document.documentElement.dataset.splashDone = "1";
              setPhase("done");
            }, FADE_OUT_MS);
          }, HOLD_AFTER_TYPING_MS);
        }
      }, CHAR_INTERVAL_MS);
    }, START_DELAY_MS);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (holdTimer !== undefined) window.clearTimeout(holdTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
    };
  }, [phase, pathname]);

  if (phase === "done") return null;

  const visibleChars = TITLE.slice(0, typedCount).split("");

  return (
    <div
      aria-hidden="true"
      className={cn(
        "ns-web-splash fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden select-none",
        "bg-gradient-to-br from-[#5a3a1d] via-[#4a2d16] to-[#2e1d0f] text-white",
        "transition-all duration-[420ms] ease-out",
        phase === "leaving" ? "pointer-events-none scale-[1.02] opacity-0" : "opacity-100",
      )}
    >
      {/* Subtle warm ambient radial glow behind the logo (no box) */}
      <div className="pointer-events-none absolute size-72 rounded-full bg-[#d2a574]/15 blur-3xl" />

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Clean NS mark without any box or container */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/ns-mark.png"
          alt="NS"
          width={116}
          height={94}
          className="ns-splash-logo-anim h-auto w-24 object-contain drop-shadow-[0_6px_22px_rgba(0,0,0,0.28)] sm:w-28"
        />

        {/* Letter-by-letter animated "Sales Rep Commissions" */}
        <p
          dir="ltr"
          className="mt-6 flex min-h-7 items-center justify-center font-[family-name:var(--font-inter)] text-base font-medium tracking-[0.06em] text-white/95 sm:text-lg"
        >
          <span>
            {visibleChars.map((ch, idx) => (
              <span key={idx} className="ns-splash-char-anim">
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
          <span
            className={cn(
              "ms-0.5 inline-block h-[1.1em] w-[2px] rounded-full bg-[#e2be94] transition-opacity duration-300",
              typingDone ? "opacity-0" : "ns-splash-caret-anim",
            )}
          />
        </p>
      </div>
    </div>
  );
}
