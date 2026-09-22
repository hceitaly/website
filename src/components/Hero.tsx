import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Icon from "./Icon";
import { HERO_SLIDES } from "../data/slides";
import { CATEGORY_BY_KEY, categoryCatalog } from "../data/products";
import { setSliderScroll } from "../hooks/useSmoothScroll";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

const SLIDE_COUNT = HERO_SLIDES.length;
/** The first slide is the static opening frame; each remaining slide takes one
    scroll unit to rise over the previous one. */
const UNIT_COUNT = SLIDE_COUNT - 1;

type SlideParts = {
  badge: HTMLSpanElement | null;
  title: HTMLHeadingElement | null;
  cta: HTMLAnchorElement | null;
  number: HTMLSpanElement | null;
  caption: HTMLSpanElement | null;
  catalog: HTMLDivElement | null;
};

/** Split text into per-letter spans (words kept intact for wrapping). */
function SplitLetters({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-hidden="true">
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className={styles.word}>
            {Array.from(word).map((ch, ci) => (
              <span key={ci} data-char className={styles.char}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>(HERO_SLIDES.map(() => null));
  const partsRef = useRef<SlideParts[]>(
    HERO_SLIDES.map(() => ({
      badge: null,
      title: null,
      cta: null,
      number: null,
      caption: null,
      catalog: null,
    })),
  );
  const slideContentRefs = useRef<(HTMLDivElement | null)[]>(HERO_SLIDES.map(() => null));
  const chromeRef = useRef<HTMLDivElement>(null);
  const trackWrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const slides = partsRef.current;
      const chars = (el: HTMLElement | null) =>
        el ? gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-char]")) : [];
      const images = imageRefs.current.filter(Boolean) as HTMLElement[];

      const ENTER = "power3.out";
      const CLIP_HIDDEN = "inset(0% 100% 0% 0%)";
      const CLIP_SHOWN = "inset(0% 0% 0% 0%)";

      const els = slides.map((p) => ({
        title: p.title,
        badge: p.badge,
        cta: p.cta,
        catalog: p.catalog,
        number: p.number,
        caption: p.caption,
        titleChars: chars(p.title),
        badgeChars: chars(p.badge),
        parents: [p.title, p.badge, p.cta, p.catalog, p.number, p.caption].filter(
          Boolean,
        ) as HTMLElement[],
      }));

      const hideSlide = (i: number) => {
        const s = els[i];
        gsap.set([s.title, s.badge], { opacity: 1 });
        gsap.set(s.titleChars, { yPercent: 110, opacity: 0 });
        gsap.set(s.badge, { clipPath: CLIP_HIDDEN });
        gsap.set(s.badgeChars, { opacity: 0, x: -6 });
        // Slide 0's number/caption ride up with the slide, so their `y` is owned
        // by the rise tween — only fade them here.
        gsap.set([s.number, s.caption], i === 0 ? { opacity: 0 } : { opacity: 0, y: 10 });
        // pointerEvents travels with the fade: a faded-out slide still sits on
        // top of the visible one, so without this its CTA and catalog card
        // swallow every hover and click meant for the slide on screen.
        gsap.set([s.cta, s.catalog], { opacity: 0, y: 14, pointerEvents: "none" });
      };

      // Fully-shown state (no enter animation) — used for the first slide, whose
      // content is "part of the slide" and simply rides up with it.
      const showSlide = (i: number) => {
        const s = els[i];
        gsap.set([s.title, s.badge], { opacity: 1 });
        gsap.set(s.titleChars, { yPercent: 0, opacity: 1 });
        gsap.set(s.badge, { clipPath: CLIP_SHOWN });
        gsap.set(s.badgeChars, { opacity: 1, x: 0 });
        gsap.set([s.number, s.caption], { opacity: 1 });
        gsap.set([s.cta, s.catalog], { opacity: 1, y: 0, pointerEvents: "auto" });
      };

      // Initial hidden states — applied before first paint (useLayoutEffect).
      // The first product slide is the opening frame: its image sits at full
      // height and its content (line included) is shown from the start.
      gsap.set(images, { yPercent: 100 });
      gsap.set(images[0], { yPercent: 0 });
      for (let i = 1; i < SLIDE_COUNT; i++) hideSlide(i);
      showSlide(0);
      gsap.set(chromeRef.current, { opacity: 1 });
      gsap.set(fillRef.current, { scaleX: 0, transformOrigin: "left center" });

      // --- Per-slide text: triggered, time-based (NOT scrubbed) so each
      // animation, once started, always plays to completion even if the user
      // stops scrolling mid-way. Enter = letters + tag wipe; exit = fast fade.
      const active = new Array<boolean>(SLIDE_COUNT).fill(false);
      active[0] = true; // first slide's content is shown from the start
      const running = new Array<gsap.core.Timeline | gsap.core.Tween | null>(
        SLIDE_COUNT,
      ).fill(null);

      const playEnter = (i: number) => {
        running[i]?.kill();
        const s = els[i];
        const t = gsap.timeline();
        t.add(() => hideSlide(i))
          .to(
            s.titleChars,
            {
              yPercent: 0,
              opacity: 1,
              ease: ENTER,
              duration: 0.55,
              stagger: { amount: 0.3, from: "start" },
            },
            0,
          )
          .to(s.badge, { clipPath: CLIP_SHOWN, ease: "power2.out", duration: 0.5 }, 0)
          .to(
            s.badgeChars,
            {
              opacity: 1,
              x: 0,
              ease: ENTER,
              duration: 0.4,
              stagger: { amount: 0.2, from: "start" },
            },
            0.06,
          )
          .to(
            [s.number, s.caption],
            i === 0
              ? { opacity: 1, ease: ENTER, duration: 0.5, stagger: 0.08 }
              : { opacity: 1, y: 0, ease: ENTER, duration: 0.5, stagger: 0.08 },
            0,
          )
          .to(
            [s.cta, s.catalog],
            { opacity: 1, y: 0, pointerEvents: "auto", ease: ENTER, duration: 0.55, stagger: 0.1 },
            0.08,
          );
        running[i] = t;
      };

      const playExit = (i: number) => {
        running[i]?.kill();
        // Exit is ONLY a fast fade-out — no movement.
        running[i] = gsap.to(els[i].parents, {
          opacity: 0,
          pointerEvents: "none",
          duration: 0.22,
          ease: "power1.in",
        });
      };

      // Scroll windows (in progress units) where each slide's text is shown.
      // The first slide's exit uses the same formula as the rest, so the 1->2
      // transition starts just before the second slide reaches the centre line,
      // in step with every other transition.
      // Slide i's image rises at time i-1, so its text enters ~0.6 into that
      // rise and exits ~0.4 into the next slide's rise. Slide 0 is the opening
      // frame (rise time -1), shown from the start until slide 1 covers it.
      const enterAt = (i: number) => (i - 0.4) / UNIT_COUNT;
      const exitAt = (i: number) =>
        i < SLIDE_COUNT - 1 ? (i + 0.4) / UNIT_COUNT : Infinity;

      const syncText = (p: number) => {
        // Slides 2..N: enter + exit as usual (in both scroll directions).
        for (let i = 1; i < SLIDE_COUNT; i++) {
          const show = p >= enterAt(i) && p < exitAt(i);
          if (show !== active[i]) {
            active[i] = show;
            if (show) playEnter(i);
            else playExit(i);
          }
        }
        // Slide 1 is "part of the slide": shown by default (it rode up with the
        // slide, no enter animation). It only fades out when leaving downward,
        // and only plays its enter animation when scrolling back UP into it.
        const show0 = p < exitAt(0);
        if (show0 !== active[0]) {
          active[0] = show0;
          if (show0) playEnter(0); // upward re-entry: animate the text in
          else playExit(0); // downward exit: fade out
        }
      };

      // --- Scrubbed timeline: ONLY the curtain images (linear) + progress
      // line. onUpdate drives the triggered text above from scroll position.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * UNIT_COUNT,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => syncText(self.progress),
          // Slow the scroll only while the slider is pinned/active; normal after.
          onToggle: (self) => setSliderScroll(self.isActive),
          onRefresh: (self) => setSliderScroll(self.isActive),
        },
      });

      // The progress line fills across the whole pinned scroll.
      tl.to(fillRef.current, { scaleX: 1, duration: UNIT_COUNT, ease: "none" }, 0);
      // Each slide after the first rises over one scroll unit (slide i at i-1).
      for (let i = 1; i < SLIDE_COUNT; i++) {
        tl.to(images[i], { yPercent: 0, duration: 1, ease: "none" }, i - 1);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="prodotti"
      className={`${styles.hero} ${reducedMotion ? styles.reduced : ""}`}
    >
      {/* Product curtain slider — the first slide is the opening frame. */}
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.badge}
          ref={(el) => {
            imageRefs.current[i] = el;
          }}
          className={`${styles.imageLayer} ${styles.photo} ${styles[`bg${i}`]}`}
          style={{ zIndex: i + 1, order: reducedMotion ? i * 2 + 2 : undefined }}
        >
          <Icon name={slide.icon} className={styles.watermark} />
        </div>
      ))}

      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.badge}
          ref={(el) => {
            slideContentRefs.current[i] = el;
          }}
          className={styles.slideContent}
          style={
            {
              zIndex: 10 + i,
              order: reducedMotion ? i * 2 + 3 : undefined,
              // Inherited by the badge and by the CTA's hover fill.
              "--tag-color": slide.tagColor,
            } as CSSProperties
          }
        >
          <span
            ref={(el) => {
              partsRef.current[i].badge = el;
            }}
            className={styles.badge}
          >
            <span className={styles.badgeInner}>
              <img className={styles.badgeIcon} src={slide.iconImg} alt="" aria-hidden="true" />
              <SplitLetters text={slide.badge} />
            </span>
          </span>

          <div className={styles.titleBlock}>
            <h2
              ref={(el) => {
                partsRef.current[i].title = el;
              }}
              className={styles.slideTitle}
              aria-label={slide.title}
            >
              <SplitLetters text={slide.title} />
            </h2>
            <a
              ref={(el) => {
                partsRef.current[i].cta = el;
              }}
              href={`/prodotti?categoria=${slide.category}`}
              className={styles.cta}
            >
              <span className={styles.ctaInner}>
                <img className={styles.ctaIcon} src={slide.iconImg} alt="" aria-hidden="true" />
                <span className={styles.ctaLabel}>{slide.ctaLabel}</span>
              </span>
            </a>
          </div>

          <div
            ref={(el) => {
              partsRef.current[i].catalog = el;
            }}
            className={styles.catalogCard}
          >
            <div className={styles.catalogBody}>
              <div className={styles.catalogHeading}>
                <span className={styles.catalogName}>{slide.catalogName}</span>
                <span className={styles.catalogWord}>Catalogo</span>
              </div>
              <a
                href={categoryCatalog(CATEGORY_BY_KEY[slide.category]).href}
                download={categoryCatalog(CATEGORY_BY_KEY[slide.category]).pdf || undefined}
                className={styles.catalogDownload}
              >
                {categoryCatalog(CATEGORY_BY_KEY[slide.category]).pdf ? "Scarica ora" : "Vedi i documenti"}
                <Icon
                  name={categoryCatalog(CATEGORY_BY_KEY[slide.category]).pdf ? "download" : "arrow"}
                  className={styles.catalogDownloadIcon}
                />
              </a>
            </div>
            <div className={styles.catalogPanel}>
              <img
                src={slide.catalogImg}
                alt={slide.catalog}
                className={styles.catalogCover}
                decoding="async"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Shared chrome: one progress line spanning all 5 slides. */}
      <div
        ref={chromeRef}
        className={styles.chrome}
        style={{ order: reducedMotion ? SLIDE_COUNT * 2 + 3 : undefined }}
      >
        <div ref={trackWrapRef} className={styles.trackWrap}>
          <div className={styles.track}>
            <div ref={fillRef} className={styles.fill} />
          </div>
        </div>

        {HERO_SLIDES.map((slide, i) => (
          <span
            key={slide.badge}
            ref={(el) => {
              partsRef.current[i].number = el;
            }}
            className={styles.slideNumber}
          >
            {slide.number}
          </span>
        ))}
        {HERO_SLIDES.map((slide, i) => (
          <span
            key={slide.badge}
            ref={(el) => {
              partsRef.current[i].caption = el;
            }}
            className={styles.slideCaption}
          >
            {slide.caption}
          </span>
        ))}
      </div>
    </section>
  );
}
