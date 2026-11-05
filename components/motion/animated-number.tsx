"use client";

import { useRef } from "react";
import { EMPTY, formatNumber, formatPercent } from "@/lib/format";
import { gsap, onFirstView, prefersReducedMotion, useIsomorphicLayoutEffect } from "./gsap";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

const FORMATS = {
  number: formatNumber,
  percent: formatPercent,
  compact: (value: number) => compact.format(value),
} satisfies Record<string, (value: number) => string>;

export type NumberFormat = keyof typeof FORMATS;

/**
 * A number that counts up from 0 the first time it scrolls into view, and tweens from the old
 * value when it changes. Server-rendered with the final text; screen readers only get the final text.
 */
export function AnimatedNumber({
  value,
  format = "number",
  prefix = "",
  delay = 0,
  animate = true,
  className,
}: {
  value: number | null;
  format?: NumberFormat;
  prefix?: string;
  delay?: number;
  /** false renders the final text with no count-up. */
  animate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const text = value === null ? EMPTY : `${prefix}${FORMATS[format](value)}`;

  useIsomorphicLayoutEffect(() => {
    const node = ref.current?.firstChild;
    if (!animate || value === null || !(node instanceof Text) || prefersReducedMotion()) {
      shown.current = value;
      return;
    }
    const render = (current: number) => {
      node.nodeValue = `${prefix}${FORMATS[format](current)}`;
    };
    const counter = { current: shown.current ?? 0 };
    const tween = (duration: number, tweenDelay: number) =>
      gsap.to(counter, {
        current: value,
        duration,
        delay: tweenDelay,
        ease: "power2.out",
        onUpdate: () => render(counter.current),
        onComplete: () => render(value),
      });

    let active: gsap.core.Tween | null = null;
    let cancel = () => {};
    if (shown.current === null) {
      render(0);
      cancel = onFirstView(ref.current!, () => {
        shown.current = value;
        active = tween(1.4, delay);
      });
    } else if (shown.current !== value) {
      shown.current = value;
      active = tween(0.8, 0);
    }
    return () => {
      cancel();
      if (active) {
        // Interrupted mid-count: the next tween continues from what is on screen.
        active.kill();
        shown.current = counter.current;
      }
    };
  }, [value, format, prefix, delay, animate]);

  // The visible copy is animated; assistive tech only ever reads the final text (never selected/copied twice).
  return (
    <span className={className}>
      <span aria-hidden ref={ref}>
        {text}
      </span>
      <span className="sr-only select-none">{text}</span>
    </span>
  );
}
