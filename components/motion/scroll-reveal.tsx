"use client";

import { useRef } from "react";
import { EASE, ScrollTrigger, gsap, markRevealStarted, prefersReducedMotion, useIsomorphicLayoutEffect } from "./gsap";

/**
 * Fades + lifts every `[data-reveal]` element inside it as it scrolls into view, in staggered batches
 * (`data-reveal="fade"`: fade only, no lift).
 *
 * Those elements are pre-hidden by CSS (globals.css) only when scripting is on and motion is allowed,
 * so they never flash before hydration. Only mark elements that are always rendered while this wrapper
 * is mounted: the scan re-runs when the wrapper re-renders (e.g. new server data), not on child state.
 */
export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // No dependency list on purpose: re-scan after every render to pick up newly streamed sections.
  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Only this wrapper's own sections: a nested ScrollReveal (e.g. a streamed Suspense block) animates
    // its own once it has hydrated — touching them earlier would break hydration.
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])")).filter(
      (element) => element.closest("[data-reveal-root]") === root,
    );
    if (targets.length === 0) return;

    const markRevealed = (elements: Element[]) => elements.forEach((element) => element.setAttribute("data-revealed", ""));
    if (prefersReducedMotion()) {
      markRevealed(targets);
      targets.forEach(markRevealStarted);
      return;
    }

    // data-reveal="fade" → opacity only, no slide.
    gsap.set(targets, { autoAlpha: 0, y: (_index: number, element: HTMLElement) => (element.dataset.reveal === "fade" ? 0 : 24) });
    const triggers = ScrollTrigger.batch(targets, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => {
        markRevealed(batch);
        // One tween per element (staggered by delay) so each can tell its contents when it starts showing.
        batch.forEach((element, index) =>
          gsap.to(element, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay: index * 0.08,
            ease: EASE,
            clearProps: "opacity,visibility,transform",
            onStart: () => markRevealStarted(element),
          }),
        );
      },
    });
    return () => triggers.forEach((trigger) => trigger.kill());
  });

  return (
    <div ref={ref} className={className} data-reveal-root="">
      {children}
    </div>
  );
}
