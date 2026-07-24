import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Reveals elements matching `selector` inside `scope` as they scroll
 * into view (fade + rise, staggered by DOM order).
 * Respects prefers-reduced-motion.
 */
export function useReveal(
  scope: RefObject<HTMLElement | null>,
  selector = "[data-reveal]",
) {
  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      items.forEach((item) => {
        gsap.from(item, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 84%",
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [scope, selector]);
}
