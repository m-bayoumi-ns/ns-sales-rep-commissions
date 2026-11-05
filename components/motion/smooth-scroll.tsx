"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { REDUCED_MOTION, ScrollTrigger, finishAllMotion, gsap } from "./gsap";

/**
 * Smooth (inertial) page scrolling with Lenis, driven by GSAP's ticker so ScrollTrigger stays in sync.
 * Lenis is never created for visitors who prefer reduced motion — they get plain native scrolling —
 * and it is created/destroyed live if that setting changes.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    let lenis: Lenis | null = null;

    const tick = (time: number) => lenis?.raf(time * 1000);
    const start = () => {
      if (lenis || media.matches) return;
      lenis = new Lenis({
        lerp: 0.1,
        // Native scrolling inside scrollable children (tables, menus, dialogs).
        allowNestedScroll: true,
        // Pause while a dialog/sheet locks page scroll (html overflow: hidden).
        autoToggle: true,
        stopInertiaOnNavigate: true,
        // Anchor links (e.g. "Skip to content") keep their native jump + focus behavior.
        anchors: false,
      });
      lenis.on("scroll", ScrollTrigger.update);
    };
    const stop = () => {
      lenis?.destroy();
      lenis = null;
    };
    const onMediaChange = () => (media.matches ? stop() : start());

    start();
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    media.addEventListener("change", onMediaChange);

    // Sections stream in and charts measure themselves after mount, so the page keeps growing;
    // re-measure trigger positions once it settles so reveals fire at the right scroll offset.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    observer.observe(document.body);

    window.addEventListener("beforeprint", finishAllMotion);

    return () => {
      window.removeEventListener("beforeprint", finishAllMotion);
      observer.disconnect();
      clearTimeout(timer);
      media.removeEventListener("change", onMediaChange);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      stop();
    };
  }, []);

  return null;
}
