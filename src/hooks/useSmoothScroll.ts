import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
let sliderEngaged = false;

// Wheel/touch speed: the hero slider scrolls slower so each slide can be read;
// the rest of the site scrolls at normal speed.
const NORMAL_MULTIPLIER = 1;
const SLIDER_MULTIPLIER = 0.5;

/** Lenis reads the multipliers live from its internal VirtualScroll instance. */
function applyScrollSpeed() {
  const vs = (
    lenisInstance as unknown as {
      virtualScroll?: { options: { wheelMultiplier: number; touchMultiplier: number } };
    } | null
  )?.virtualScroll;
  if (!vs) return;
  const m = sliderEngaged ? SLIDER_MULTIPLIER : NORMAL_MULTIPLIER;
  vs.options.wheelMultiplier = m;
  vs.options.touchMultiplier = m;
}

/** Called by the hero: slow the scroll while the slider is engaged. */
export function setSliderScroll(engaged: boolean) {
  sliderEngaged = engaged;
  applyScrollSpeed();
}

/**
 * Freezes the page behind an overlay (drawer, modal). Lenis drives the scroll,
 * so `overflow: hidden` alone is not enough — it has to be stopped too.
 */
export function setScrollLocked(locked: boolean) {
  if (locked) lenisInstance?.stop();
  else lenisInstance?.start();
  document.body.style.overflow = locked ? "hidden" : "";
}

/**
 * Programmatic smooth scroll. Goes through Lenis when it is running — the
 * native `behavior: "smooth"` is disabled while `.lenis-smooth` is on <html>.
 */
export function scrollToTarget(target: HTMLElement | number, offset = 0) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset, duration: 1.1 });
    return;
  }
  const top =
    typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top + offset, behavior: "smooth" });
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker and synced with
 * ScrollTrigger so pinned/scrubbed timelines stay in step.
 * Disabled when the user prefers reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    });
    lenisInstance = lenis;
    applyScrollSpeed(); // honour whatever state the hero already set

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Give layout a beat, then make sure triggers measure the pinned height.
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refresh);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}
