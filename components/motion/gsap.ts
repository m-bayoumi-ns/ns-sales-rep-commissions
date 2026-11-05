"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

/**
 * Shared GSAP setup for the dashboard's motion. Every animation here is decorative:
 * the DOM always renders the final value/width, and nothing animates when the visitor
 * prefers reduced motion (checked at the moment an animation would start).
 */

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Mobile browsers resize the viewport when the URL bar hides; don't re-measure for that.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const EASE = "power3.out";

export function prefersReducedMotion() {
  return typeof window === "undefined" || window.matchMedia(REDUCED_MOTION).matches;
}

/** Live `prefers-reduced-motion: reduce` for render logic (false on the server). */
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED_MOTION);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Layout effect on the client (runs before paint, so the start state never flashes); no-op on the server. */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const pending = new Set<() => void>();

/** Fired on a `[data-reveal]` element when its fade-in actually starts (see scroll-reveal.tsx). */
const REVEAL_EVENT = "motion:reveal";
const revealStarted = new WeakSet<Element>();

export function markRevealStarted(element: Element) {
  revealStarted.add(element);
  element.dispatchEvent(new Event(REVEAL_EVENT));
}

/**
 * Runs `play` once, when `element` is first seen: if it sits inside a `[data-reveal]` section that hasn't
 * faded in yet, when that fade starts (so bars/numbers never animate while still invisible); otherwise
 * the first time it scrolls into view (immediately if it already is). `ignoreReveal` always uses the
 * scroll position (for a stricter `start` than the section's reveal). Returns a cancel function.
 */
export function onFirstView(element: Element, play: () => void, start = "top 92%", ignoreReveal = false) {
  let done = false;
  // Declared up front: ScrollTrigger fires onEnter synchronously from create() when already in view.
  let trigger: ScrollTrigger | undefined;
  const host = ignoreReveal ? null : element.closest("[data-reveal]");
  const waitForReveal = host !== null && !revealStarted.has(host);
  const run = () => {
    if (done) return;
    done = true;
    pending.delete(run);
    trigger?.kill();
    host?.removeEventListener(REVEAL_EVENT, run);
    play();
  };
  pending.add(run);
  if (waitForReveal) {
    host.addEventListener(REVEAL_EVENT, run);
  } else {
    trigger = ScrollTrigger.create({ trigger: element, start, once: true, onEnter: run });
    if (done) trigger.kill();
  }
  return () => {
    done = true;
    pending.delete(run);
    trigger?.kill();
    host?.removeEventListener(REVEAL_EVENT, run);
  };
}

/** Before printing: start everything that hasn't scrolled into view yet and jump all tweens to their end. */
export function finishAllMotion() {
  for (const run of [...pending]) run();
  for (const tween of gsap.globalTimeline.getChildren(true, true, false)) tween.progress(1);
}
