import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CATEGORY_BY_KEY, PLACEHOLDER_IMAGE, recentProducts } from "../data/products";
import styles from "./RecentProducts.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Le ultime schede pubblicate dal pannello, dalla più nuova. */
const PRODUCTS = recentProducts(10);
const COUNT = PRODUCTS.length;

/** Auto-advance interval (ms). */
const INTERVAL = 4200;
/** Slides cloned onto each end for a seamless loop in both directions (>= max per-view). */
const CLONES = Math.min(2, COUNT);
/** A drag of this fraction of a slide is enough to move on by one. */
const FLICK = 0.15;
/** Pixels of movement before a press counts as a drag rather than a click. */
const DRAG_START = 6;

/** Wraps an index into 0…COUNT-1. */
const wrap = (n: number) => ((n % COUNT) + COUNT) % COUNT;

/** The track as rendered: the last CLONES products, all of them, the first CLONES. */
const SLIDES = [
  ...Array.from({ length: CLONES }, (_, k) => PRODUCTS[wrap(k - CLONES)]),
  ...PRODUCTS,
  ...PRODUCTS.slice(0, CLONES),
];

export default function RecentProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || COUNT < 2) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /** Current position in slides: 0 is the first real product. Fractional mid-drag. */
    let pos = 0;
    let hovering = false;
    let slideW = 0;
    let timer = 0;

    const measure = () => {
      const first = track.querySelector<HTMLElement>("[data-slide]");
      slideW = first ? first.getBoundingClientRect().width : viewport.clientWidth;
    };

    const xOf = (p: number) => -(p + CLONES) * slideW;

    const goTo = (target: number) => {
      pos = target;
      gsap.to(track, {
        x: xOf(target),
        duration: reduce ? 0.3 : 0.9,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          // Landed on a clone -> jump to the real slide it copies, invisibly.
          pos = wrap(target);
          gsap.set(track, { x: xOf(pos) });
        },
      });
    };

    const restart = () => {
      window.clearInterval(timer);
      if (reduce) return;
      timer = window.setInterval(() => {
        if (!hovering && pointer === null) goTo(Math.round(pos) + 1);
      }, INTERVAL);
    };

    measure();
    gsap.set(track, { x: xOf(0) });
    restart();

    const onResize = () => {
      measure();
      pos = wrap(Math.round(pos));
      gsap.set(track, { x: xOf(pos) });
    };
    window.addEventListener("resize", onResize);

    // Pause while the pointer is over the slider.
    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };
    viewport.addEventListener("mouseenter", onEnter);
    viewport.addEventListener("mouseleave", onLeave);

    /* ---- Drag: mouse, pen and horizontal swipes (vertical ones still scroll the page) ---- */

    let pointer: number | null = null;
    let startX = 0;
    let startPos = 0;
    let dragging = false;
    /** Set by a real drag, so the click that ends it doesn't open the product. */
    let swallowClick = false;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || pointer !== null) return;
      pointer = e.pointerId;
      startX = e.clientX;
      dragging = false;
      swallowClick = false;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const dx = e.clientX - startX;

      if (!dragging) {
        if (Math.abs(dx) < DRAG_START) return;
        dragging = true;
        swallowClick = true;
        viewport.setPointerCapture(e.pointerId);
        viewport.dataset.dragging = "";
        gsap.killTweensOf(track);
        // Pick up from wherever the track is, even halfway through a slide.
        startPos = -(gsap.getProperty(track, "x") as number) / slideW - CLONES;
        startX = e.clientX;
        return;
      }

      pos = startPos - dx / slideW;
      // Keep the view inside the rendered clones by hopping a whole loop.
      if (pos < -1) {
        pos += COUNT;
        startPos += COUNT;
      } else if (pos >= COUNT) {
        pos -= COUNT;
        startPos -= COUNT;
      }
      gsap.set(track, { x: xOf(pos) });
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      if (!dragging) return;
      dragging = false;
      delete viewport.dataset.dragging;

      const moved = pos - startPos;
      let target = Math.round(pos);
      // A short flick still turns the page.
      if (Math.abs(moved) > FLICK && target === Math.round(startPos)) target += Math.sign(moved);
      goTo(target);
      restart();
    };

    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    // Links and images would otherwise start the browser's own drag-and-drop.
    const onDragStart = (e: DragEvent) => e.preventDefault();

    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", onUp);
    viewport.addEventListener("pointercancel", onUp);
    viewport.addEventListener("click", onClick, true);
    viewport.addEventListener("dragstart", onDragStart);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", onResize);
      viewport.removeEventListener("mouseenter", onEnter);
      viewport.removeEventListener("mouseleave", onLeave);
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerup", onUp);
      viewport.removeEventListener("pointercancel", onUp);
      viewport.removeEventListener("click", onClick, true);
      viewport.removeEventListener("dragstart", onDragStart);
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
        // Cards cascade left -> right from the first one in view; the rest,
        // off-screen, finish together so a quick drag never finds them blank.
        const at = 0.12 + Math.min(Math.max(i - CLONES, 0), 2) * 0.13;

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

  if (COUNT === 0) return null;

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
          {SLIDES.map((p, idx) => {
            const cat = CATEGORY_BY_KEY[p.category];
            const clone = idx < CLONES || idx >= CLONES + COUNT;
            // Product shots are cut-outs and sit whole on white; the category
            // artwork standing in for a missing one fills the frame.
            const fit = p.image ? (p.fit ?? "contain") : "cover";

            return (
              <a
                key={idx}
                data-slide
                href={`/prodotti/${p.id}`}
                className={styles.slide}
                aria-hidden={clone || undefined}
                tabIndex={clone ? -1 : undefined}
              >
                <div className={styles.slideHead}>
                  <span
                    className={styles.tag}
                    data-tag
                    style={{ "--tag-color": cat.color } as CSSProperties}
                  >
                    <img className={styles.tagIcon} src={cat.icon} alt="" aria-hidden="true" />
                    <span data-tag-label>{cat.label}</span>
                  </span>
                  <h3 className={styles.name} data-name>
                    {p.name}
                  </h3>
                </div>

                <div className={styles.image}>
                  <span className={styles.imgCover} data-cover aria-hidden="true" />
                  <img
                    src={p.image ?? PLACEHOLDER_IMAGE[p.category]}
                    alt={p.name}
                    data-fill
                    data-fit={fit}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <span className={styles.explore} data-explore>
                  Esplora prodotto →
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
