import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { RECENT_PRODUCTS } from "../data/recent";
import styles from "./RecentProducts.module.css";

/** Auto-advance interval (ms). */
const INTERVAL = 4200;
/** How many slides are cloned onto the end for a seamless loop (>= max per-view). */
const CLONES = 2;

export default function RecentProducts() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  const slides = [...RECENT_PRODUCTS, ...RECENT_PRODUCTS.slice(0, CLONES)];

  return (
    <section className={styles.recent} data-nav-theme="light" aria-label="Prodotti recenti">
      <div className={styles.head}>
        <span className={styles.eyebrow}>
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
                  style={{ "--tag-color": p.tagColor } as CSSProperties}
                >
                  <img className={styles.tagIcon} src={p.iconImg} alt="" aria-hidden="true" />
                  {p.tag}
                </span>
                <h3 className={styles.name}>{p.name}</h3>
              </div>

              <div className={styles.image}>
                <img src={p.image} alt={p.name} loading="lazy" decoding="async" />
              </div>

              <span className={styles.explore}>Esplora prodotto →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
