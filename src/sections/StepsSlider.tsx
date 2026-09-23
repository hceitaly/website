import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./StepsSlider.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Le cinque schede: il verbo a sinistra, il seguito della frase e il testo
 *  sulla scheda a destra. */
const STEPS = [
  {
    title: "Selezioniamo",
    heading: "I prodotti che fanno per te",
    text: "Individuiamo i prodotti più adatti alle esigenze specifiche di ogni cliente, scegliendo tra soluzioni di qualità e tecnologie all'avanguardia.",
    image: "/assets/pannelli-solari.webp",
  },
  {
    title: "Traduciamo",
    heading: "Le complessità del settore",
    text: "Offriamo un affiancamento tecnico competente per orientare le scelte verso le soluzioni più efficaci e convenienti.",
    image: "/assets/inverter.webp",
  },
  {
    title: "Assistiamo",
    heading: "Prima, durante e dopo l'acquisto",
    text: "Assicuriamo risposte rapide e soluzioni concrete.",
    image: "/assets/pompadicalore.webp",
  },
  {
    title: "Comprendiamo",
    heading: "I vostri bisogni",
    text: "Mettiamo a disposizione un team con esperienza trasversale nei settori dell'energia, dell'elettronica e della mobilità sostenibile.",
    image: "/assets/accumulo.webp",
  },
  {
    title: "Costruiamo",
    heading: "Rapporti duraturi",
    text: "Sia con i nostri collaboratori che con i nostri fornitori.",
    image: "/assets/pinsnap-106327241187857624.jpg",
  },
];
const COUNT = STEPS.length;

/** Telefoni, schermi in verticale (anche i tablet tenuti dritti) e schermi
    bassi come il telefono in orizzontale: lì la sezione bloccata allo scroll
    non ha spazio, e i passi si leggono uno sotto l'altro. */
const STACKED = "(max-width: 767.98px), (orientation: portrait), (max-height: 559.98px)";

/** Vero finché la media query è soddisfatta; segue rotazioni e ridimensioni. */
function useMedia(query: string) {
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatch(mq.matches);
    mq.addEventListener("change", sync);
    sync();
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return match;
}

export default function StepsSlider() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railFillRef = useRef<HTMLDivElement>(null);
  const footLabelRef = useRef<HTMLSpanElement>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  // Chi ha chiesto meno movimento riceve la versione impilata ovunque.
  const stacked = useMedia(STACKED) || reduced;

  useLayoutEffect(() => {
    // L'evidenza del titolo attivo è una classe, non uno stile: il revert di
    // GSAP non la tocca. Passando da impilata a bloccata e ritorno, senza
    // questa pulizia resterebbero accesi due titoli.
    titleRefs.current.forEach((t) => t?.classList.remove(styles.titleActive));
    if (reduced) return;

    if (stacked) {
      // Impilata: ogni passo entra quando arriva in vista — il titolo sale, la
      // foto si scopre con la stessa tendina doppia del resto del sito.
      const ctx = gsap.context(() => {
        const HIDDEN = "inset(0% 0% 100% 0%)";
        const SHOWN = "inset(0% 0% 0% 0%)";
        cardRefs.current.forEach((card) => {
          if (!card) return;
          const words = card.querySelectorAll<HTMLElement>("[data-rise]");
          const cover = card.querySelector<HTMLElement>("[data-cover]");
          const fill = card.querySelector<HTMLElement>("[data-fill]");
          gsap.set(words, { y: 28, opacity: 0 });
          gsap.set([cover, fill], { clipPath: HIDDEN });
          gsap
            .timeline({ scrollTrigger: { trigger: card, start: "top 82%", once: true } })
            .to(words, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1 }, 0)
            .to(cover, { clipPath: SHOWN, duration: 0.45, ease: "power2.inOut" }, 0.15)
            .to(fill, { clipPath: SHOWN, duration: 0.6, ease: "power2.inOut" }, 0.55);
        });
      }, sectionRef);
      return () => ctx.revert();
    }

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

      // ---- First appearance ------------------------------------------------
      // Texts stagger in; the first image and thumbnail use the mission
      // section's two-layer curtain (blue cover wipes down, then the photo).
      const HIDDEN = "inset(0% 0% 100% 0%)"; // clipped to the top edge (empty)
      const SHOWN = "inset(0% 0% 0% 0%)";

      const layers = [images[0], thumbs[0]].map((el) => ({
        cover: el?.querySelector<HTMLElement>("[data-cover]") ?? null,
        fill: el?.querySelector<HTMLElement>("[data-fill]") ?? null,
      }));
      const titleEls = titles.filter(Boolean) as HTMLDivElement[];
      // The step transitions own the .cardText wrapper's opacity, so the intro
      // animates its children (heading + copy) instead of fighting for it.
      const firstText = texts[0] ? (Array.from(texts[0].children) as HTMLElement[]) : [];

      gsap.set(
        layers.flatMap((l) => [l.cover, l.fill]).filter(Boolean) as HTMLElement[],
        { clipPath: HIDDEN },
      );
      gsap.set(titleEls, { yPercent: 55, opacity: 0 });
      gsap.set([...firstText, footLabelRef.current], { y: 26, opacity: 0 });

      const intro = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%", once: true },
      });

      intro
        .to(
          titleEls,
          { yPercent: 0, opacity: 1, duration: 0.75, ease: "power3.out", stagger: 0.09 },
          0,
        )
        .to(
          firstText,
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.12 },
          0.2,
        )
        .to(footLabelRef.current, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.5);

      layers.forEach((l, i) => {
        if (!l.cover || !l.fill) return;
        const at = 0.25 + i * 0.18;
        intro
          .to(l.cover, { clipPath: SHOWN, duration: 0.45, ease: "power2.inOut" }, at)
          .to(l.fill, { clipPath: SHOWN, duration: 0.6, ease: "power2.inOut" }, at + 0.4);
      });

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
  }, [reduced, stacked]);

  return (
    <section
      ref={sectionRef}
      id="tecnologie"
      className={`${styles.steps} ${stacked ? styles.stacked : ""}`}
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
            <span ref={footLabelRef} className={styles.footLabel}>
              Approfondimento ↓
            </span>
            <div className={styles.thumbStack}>
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  className={styles.thumb}
                >
                  <span className={styles.mediaCover} data-cover aria-hidden="true" />
                  <img
                    src={s.image}
                    alt=""
                    className={styles.thumbImg}
                    data-fill
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

        {/* Right two-thirds: heading at the top, copy at the bottom, big image */}
        <div className={styles.right}>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={styles.card}
            >
              {/* Il verbo dentro la scheda serve solo nella versione impilata,
                  dove non c'è la colonna dei titoli a sinistra. */}
              <p className={styles.cardTitle} data-rise>
                {s.title}
              </p>
              <div
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className={styles.cardText}
              >
                <h3 className={styles.heading} data-rise>
                  {s.heading}
                  <span className={styles.headingArrow} aria-hidden="true">
                    {" "}
                    ↓
                  </span>
                </h3>
                <p className={styles.desc}>{s.text}</p>
              </div>
              <div
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                className={styles.cardImage}
              >
                <span className={styles.mediaCover} data-cover aria-hidden="true" />
                <img
                  src={s.image}
                  alt={s.title}
                  className={styles.cardImg}
                  data-fill
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
