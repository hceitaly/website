import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PixelLiquidBg from "./PixelLiquidBg";
import styles from "./PaintHero.module.css";

gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger);

/* Fluid ramps from the brand azure base into the deeper royal blue / indigo of
   the palette, so the swirls read as shadow on an azure field. */
const HERO_PALETTE = ["#2fa1e0", "#2b8ed8", "#1e5fbf", "#2740b0", "#2233a6"];
const HERO_BG = "#2fa1e0"; // --hce-blue, matched by .hero's CSS background

export default function PaintHero() {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const sectionRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Title scrambles in; subtitle + button rise after.
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const lines = [line1Ref.current, line2Ref.current].filter(Boolean) as HTMLSpanElement[];
      gsap.set([subtitleRef.current, ctaRef.current], { opacity: 0, y: 24 });
      const tl = gsap.timeline({ delay: 0.25 });
      lines.forEach((el, i) => {
        tl.to(
          el,
          {
            duration: 1.1,
            scrambleText: { text: el.textContent || "", chars: "upperCase", speed: 0.6, revealDelay: 0.25 },
            ease: "none",
          },
          i * 0.14,
        );
      });
      tl.to([subtitleRef.current, ctaRef.current], { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.12 }, 0.55);

      // The hero holds still while the product slider rises over it from the
      // bottom. pinSpacing must stay false: with a spacer the next section is
      // pushed down and would never travel across the pinned hero.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: false,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} id="top" className={styles.hero} data-nav-theme="dark">
      <div className={styles.canvasWrap} aria-hidden="true">
        <PixelLiquidBg
          palette={HERO_PALETTE}
          bgColor={HERO_BG}
          pixelSize={16}
          resolution={0.4}
          mouseForce={9}
          cursorSize={110}
          autoDemo={!reduced}
        />
      </div>

      {/* Deepens the azure behind the copy so white text keeps its contrast. */}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title} aria-label="Un ecosistema per l'energia">
          <span ref={line1Ref} className={styles.line}>Un ecosistema</span>
          <span ref={line2Ref} className={styles.line}>per l'energia</span>
        </h1>
        <p ref={subtitleRef} className={styles.subtitle}>
          Prodotti selezionati, competenza tecnica e assistenza continua. Dal magazzino al
          tuo impianto, in un unico percorso.
        </p>
        <a ref={ctaRef} href="/prodotti" className={styles.cta}>
          Scopri i prodotti
        </a>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span>Scrolla per esplorare</span>
        <span className={styles.scrollCueLine} />
      </div>
    </section>
  );
}
