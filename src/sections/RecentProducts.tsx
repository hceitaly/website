import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { RECENT_PRODUCTS } from "../data/recent";
import styles from "./RecentProducts.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Auto-advance interval (ms). */
const INTERVAL = 4200;
/** How many slides are cloned onto the end for a seamless loop (>= max per-view). */
const CLONES = 2;

export default function RecentProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = RECENT_PRODUCTS.length;
    let i = 0;
    let paused = false;
    let slideW = 0;

    const measure = () => {
      const first = track.querySelector<HTMLElement>("[data-slide]");
      slideW = first ? first.getBoundingClientRect().width : viewport.clientWidth;
    };

    const goTo = (idx: number, animate: boolean) => {
      gsap.to(track, {
        x: -idx * slideW,
        duration: animate ? 0.9 : 0,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          // Reached the cloned head -> snap back to the real start seamlessly.
          if (idx >= count) {
            i = 0;
            gsap.set(track, { x: 0 });
          }
        },
      });
    };

    const advance = () => {
      if (paused) return;
      i += 1;
      goTo(i, true);
    };

    measure();
    gsap.set(track, { x: 0 });

    const timer = reduce ? 0 : window.setInterval(advance, INTERVAL);

    const onResize = () => {
      measure();
      i = i % count;
      gsap.set(track, { x: -i * slideW });
    };
    window.addEventListener("resize", onResize);

    // Pause while the visitor is interacting with the slider.
    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    viewport.addEventListener("mouseenter", onEnter);
    viewport.addEventListener("mouseleave", onLeave);

    return () => {
      if (timer) window.clearInterval(timer);
      window.removeEventListener("resize", onResize);
      viewport.removeEventListener("mouseenter", onEnter);
      viewport.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(track);
    };
  }, []);

  // First appearance: tags wipe in and letter-fade like the hero slider's
  // badges, photos use the mission section's curtain, copy rises.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const splits: SplitText[] = [];

    const ctx = gsap.context(() => {
      const HIDDEN = "inset(0% 0% 100% 0%)"; // clipped to the top edge
      const TAG_HIDDEN = "inset(0% 100% 0% 0%)"; // clipped to the left edge
      const SHOWN = "inset(0% 0% 0% 0%)";

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 78%", once: true },
      });

      gsap.set(eyebrowRef.current, { y: 20, opacity: 0 });
      tl.to(eyebrowRef.current, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0);

      const slideEls = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-slide]"));

      slideEls.forEach((slide, i) => {
        const q = <T extends HTMLElement>(sel: string) => slide.querySelector<T>(sel);
        const tag = q("[data-tag]");
        const label = q("[data-tag-label]");
        const cover = q("[data-cover]");
        const fill = q("[data-fill]");
        const copy = [q("[data-name]"), q("[data-explore]")].filter(Boolean) as HTMLElement[];
        const at = 0.12 + i * 0.13; // cards cascade left -> right

        if (tag) {
          gsap.set(tag, { clipPath: TAG_HIDDEN });
          tl.to(tag, { clipPath: SHOWN, duration: 0.5, ease: "power2.out" }, at);
        }

        if (label) {
          const split = new SplitText(label, { type: "chars" });
          splits.push(split);
          gsap.set(split.chars, { opacity: 0, x: -6 });
          tl.to(
            split.chars,
            { opacity: 1, x: 0, duration: 0.4, ease: "power3.out", stagger: { amount: 0.2 } },
            at + 0.06,
          );
        }

        if (cover && fill) {
          gsap.set([cover, fill], { clipPath: HIDDEN });
          tl.to(cover, { clipPath: SHOWN, duration: 0.45, ease: "power2.inOut" }, at + 0.1).to(
            fill,
            { clipPath: SHOWN, duration: 0.6, ease: "power2.inOut" },
            at + 0.5,
          );
        }

        if (copy.length) {
          gsap.set(copy, { y: 22, opacity: 0 });
          tl.to(
            copy,
            { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", stagger: 0.1 },
            at + 0.28,
          );
        }
      });
    }, section);

    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  const slides = [...RECENT_PRODUCTS, ...RECENT_PRODUCTS.slice(0, CLONES)];

  return (
    <section
      ref={sectionRef}
      className={styles.recent}
      data-nav-theme="light"
      aria-label="Prodotti recenti"
    >
      <div className={styles.head}>
        <span ref={eyebrowRef} className={styles.eyebrow}>
          Prodotti Recenti <span aria-hidden="true">↓</span>
        </span>
      </div>

      <div ref={viewportRef} className={styles.viewport}>
        <div ref={trackRef} className={styles.track}>
          {slides.map((p, idx) => (
            <a
              key={idx}
              data-slide
              href={p.href}
              className={styles.slide}
              aria-hidden={idx >= RECENT_PRODUCTS.length ? true : undefined}
              tabIndex={idx >= RECENT_PRODUCTS.length ? -1 : undefined}
            >
              <div className={styles.slideHead}>
                <span
                  className={styles.tag}
                  data-tag
                  style={{ "--tag-color": p.tagColor } as CSSProperties}
                >
                  <img className={styles.tagIcon} src={p.iconImg} alt="" aria-hidden="true" />
                  <span data-tag-label>{p.tag}</span>
                </span>
                <h3 className={styles.name} data-name>
                  {p.name}
                </h3>
              </div>

              <div className={styles.image}>
                <span className={styles.imgCover} data-cover aria-hidden="true" />
                <img src={p.image} alt={p.name} data-fill loading="lazy" decoding="async" />
              </div>

              <span className={styles.explore} data-explore>
                Esplora prodotto →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
