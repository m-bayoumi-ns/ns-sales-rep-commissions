"use client";

import { useRef } from "react";
import { EASE, gsap, onFirstView, prefersReducedMotion, useIsomorphicLayoutEffect } from "./gsap";

/**
 * A horizontal bar fill (width in %) that grows from 0 the first time it scrolls into view,
 * and glides to its new width when the value changes. Rendered at its final width.
 */
export function GrowBar({
  width,
  delay = 0,
  immediate = false,
  className,
  color,
}: {
  width: number;
  delay?: number;
  /** Grow as soon as it mounts (e.g. inside a tab panel that was just opened) instead of waiting to be scrolled into view. */
  immediate?: boolean;
  className?: string;
  /** Bar fill (a CSS colour / variable); defaults to the className's background. */
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      shown.current = width;
      return;
    }
    let cancel = () => {};
    if (shown.current === null) {
      gsap.set(element, { width: "0%" });
      // Remember the width only once the grow has finished: if the effect re-runs mid-grow
      // (tab switch, React dev double-run), the bar starts over instead of jumping to the end.
      const grow = () => {
        gsap.fromTo(
          element,
          { width: "0%" },
          {
            width: `${width}%`,
            duration: 1.1,
            delay,
            ease: EASE,
            onComplete: () => {
              shown.current = width;
            },
          },
        );
      };
      if (immediate) grow();
      else cancel = onFirstView(element, grow);
    } else if (shown.current !== width) {
      gsap.fromTo(element, { width: `${shown.current}%` }, { width: `${width}%`, duration: 0.7, ease: EASE });
      shown.current = width;
    }
    return () => {
      cancel();
      gsap.killTweensOf(element);
      // Never leave a half-grown bar behind if interrupted.
      if (shown.current !== null) gsap.set(element, { width: `${shown.current}%` });
    };
  }, [width, delay, immediate]);

  return <div ref={ref} className={className} style={{ width: `${width}%`, ...(color ? { background: color } : {}) }} />;
}
