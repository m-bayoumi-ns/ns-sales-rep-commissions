"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

const STEP_MS = 1600;

/**
 * Shown while the page loads its data: a spinner, a title and a step line that cycles
 * (reading files → matching targets → calculating → preparing charts). Purely informative.
 */
export function LoadingStatus({ title, steps, hint }: { title: string; steps: string[]; hint: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (steps.length < 2) return;
    // Stop on the last step instead of looping back to "reading files".
    const id = window.setInterval(() => setStep((current) => Math.min(current + 1, steps.length - 1)), STEP_MS);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2Icon aria-hidden className="size-5 animate-spin motion-reduce:animate-none" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm font-semibold">{title}</p>
        <p key={step} className="animate-in text-xs text-muted-foreground duration-300 fade-in-0 slide-in-from-bottom-1">
          {steps[step]}
        </p>
        {/* Indeterminate bar: a short segment sliding across. */}
        <div aria-hidden className="relative mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="absolute inset-y-0 w-1/3 animate-[loading-slide_1.4s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none" />
        </div>
        <p className="text-[11px] text-muted-foreground/80">{hint}</p>
      </div>
      <style>{`@keyframes loading-slide { 0% { inset-inline-start: -33%; } 100% { inset-inline-start: 100%; } }`}</style>
    </div>
  );
}
