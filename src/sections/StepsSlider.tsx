import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./StepsSlider.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Five cards; titles and imagery are final — the copy is placeholder for now. */
const STEPS = [
  {
    title: "Selezioniamo",
    heading: "Titolo placeholder 01",
    image: "/assets/pannelli-solari.jpg",
  },
  {
    title: "Traduciamo",
    heading: "Titolo placeholder 02",
    image: "/assets/inverter.jpg",
  },
  {
    title: "Assistiamo",
    heading: "Titolo placeholder 03",
    image: "/assets/pompadicalore.jpg",
  },
  {
    title: "Comprendiamo",
    heading: "Titolo placeholder 04",
    image: "/assets/accumulo.webp",
  },
  {
    title: "Costruiamo",
    heading: "Titolo placeholder 05",
    image: "/assets/pinsnap-106327241187857624.jpg",
  },
];
const COUNT = STEPS.length;
const PLACEHOLDER_TEXT =
  "Testo placeholder a destra della linea. Questo blocco verrà sostituito con i contenuti definitivi della scheda.";

export default function StepsSlider() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railFillRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useLayoutEffect(() => {
    if (reduced) return;

    const ctx = gsap.context(() => {
      const titles = titleRefs.current;
      const texts = textRefs.current;
      const images = imageRefs.current;
      const thumbs = thumbRefs.current;

      // Initial state — only the first card is shown.
      gsap.set(railFillRef.current, { transformOrigin: "top center", scaleY: 0 });
      gsap.set([texts, images, thumbs].flat(), { opacity: 0 });
      gsap.set(images, { yPercent: 10 });
      gsap.set([texts[0], thumbs[0]], { opacity: 1 });
      gsap.set(images[0], { opacity: 1, yPercent: 0 });
      titles[0]?.classList.add(styles.titleActive);

      const state = { i: 0 };
      let running: gsap.core.Timeline | null = null;

      const show = (next: number) => {
        const prev = state.i;
        if (next === prev) return;
        state.i = next;

        // Left titles: CSS transitions handle black + slash + slight shift.
        titles[prev]?.classList.remove(styles.titleActive);
        titles[next]?.classList.add(styles.titleActive);

        running?.kill();
        const tl = gsap.timeline();

        // Text: strictly sequential — old fades out fully, THEN new fades in.
        tl.to(texts[prev], { opacity: 0, duration: 0.3, ease: "power2.in" }, 0).fromTo(
          texts[next],
          { opacity: 0 },
          { opacity: 1, duration: 0.45, ease: "power2.out" },
          0.34,
        );

        // Image: smooth vertical slide (may overlap — that's fine for images).
        tl.to(
          images[prev],
          { opacity: 0, yPercent: -8, duration: 0.6, ease: "power2.inOut" },
          0,
        ).fromTo(
          images[next],
          { opacity: 0, yPercent: 12 },
          { opacity: 1, yPercent: 0, duration: 0.7, ease: "power2.out" },
          0.12,
        );

        // Foot thumbnail follows the image.
        tl.to(thumbs[prev], { opacity: 0, duration: 0.3, ease: "power2.in" }, 0).fromTo(
          thumbs[next],
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power2.out" },
          0.2,
        );

        running = tl;
      };

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => "+=" + window.innerHeight * COUNT,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Vertical line fills with progress (scrubbed), like the hero line.
          gsap.set(railFillRef.current, { scaleY: self.progress });
          const idx = Math.min(COUNT - 1, Math.floor(self.progress * COUNT));
          show(idx);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="tecnologie"
      className={`${styles.steps} ${reduced ? styles.reduced : ""}`}
      data-nav-theme="light"
      aria-label="Il nostro metodo in cinque passi"
    >
      <div className={styles.inner}>
        {/* Left third: the five titles (active highlighted) + a footer thumb */}
        <div className={styles.left}>
          <nav className={styles.titles} aria-label="Passi">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                ref={(el) => {
                  titleRefs.current[i] = el;
                }}
                className={styles.title}
              >
                <span className={styles.slash} aria-hidden="true">
                  /
                </span>
                <span className={styles.titleText}>{s.title}</span>
              </div>
            ))}
          </nav>

          <div className={styles.foot}>
            <span className={styles.footLabel}>Approfondimento ↓</span>
            <div className={styles.thumbStack}>
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  className={styles.thumb}
                >
                  <img
                    src={s.image}
                    alt=""
                    className={styles.thumbImg}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical line at 1/3 — fills with progress */}
        <div className={styles.rail}>
          <div ref={railFillRef} className={styles.railFill} />
        </div>

        {/* Right two-thirds: placeholder text (top + bottom) and a big image */}
        <div className={styles.right}>
          {STEPS.map((s, i) => (
            <div key={s.title} className={styles.card}>
              <div
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className={styles.cardText}
              >
                <h3 className={styles.heading}>{s.heading}</h3>
                <p className={styles.desc}>{PLACEHOLDER_TEXT}</p>
              </div>
              <div
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                className={styles.cardImage}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className={styles.cardImg}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
