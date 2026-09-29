import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

/** Cambio slide: la vecchia esce, la nuova entra dallo stesso verso. Anima i
    figli `[data-slide]` del corpo ogni volta che `slide` cambia; `back` dice se
    si è tornati indietro. */
export function useSlideIn(
  bodyRef: RefObject<HTMLElement | null>,
  slide: string | number,
  back: boolean,
  open: boolean,
) {
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || !open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-slide]", {
        x: back ? -28 : 28,
        opacity: 0,
        duration: 0.45,
        ease: "power3.out",
      });
    }, body);

    body.scrollTop = 0;
    return () => ctx.revert();
  }, [bodyRef, slide, back, open]);
}
