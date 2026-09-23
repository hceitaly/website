import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useReveal } from "../hooks/useReveal";
import styles from "./Mission.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Placeholder "Recent News" entries — swap for real content later. */
const NEWS = [
  {
    title: "Efficienza energetica: le novità normative del 2025",
    date: "3 Giugno 2025",
    image: "/assets/pinsnap-106327241187857624.jpg",
  },
  {
    title: "Nuovi sistemi di accumulo ad alta densità",
    date: "12 Maggio 2025",
    image: "/assets/accumulo.webp",
  },
];

/** Two layers for the reveal: a logo-blue curtain, then the image itself. */
function Media({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <>
      <div className={styles.cover} data-cover />
      <div className={styles.fill} data-fill>
        <img src={src} alt={alt} className={styles.img} loading="lazy" decoding="async" />
      </div>
    </>
  );
}

export default function Mission() {
  const sectionRef = useRef<HTMLElement>(null);

  // Text: fade + rise on scroll-in, like the rest of the site.
  useReveal(sectionRef);

  // Images: logo-blue curtain wipes in top->bottom, then the image wipes in
  // top->bottom over it — the 3 slots cascade with a slight delay.
  // Statement: split into words that rise + fade in, word by word.
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      const HIDDEN = "inset(0% 0% 100% 0%)"; // clipped to the top edge (empty)
      const SHOWN = "inset(0% 0% 0% 0%)"; // fully visible
      const medias = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-media]"));

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 72%" },
      });

      medias.forEach((m, i) => {
        const cover = m.querySelector<HTMLElement>("[data-cover]");
        const fill = m.querySelector<HTMLElement>("[data-fill]");
        if (!cover || !fill) return;
        gsap.set([cover, fill], { clipPath: HIDDEN });
        const at = i * 0.22; // slight delay between the three images
        tl.to(cover, { clipPath: SHOWN, duration: 0.45, ease: "power2.inOut" }, at).to(
          fill,
          { clipPath: SHOWN, duration: 0.6, ease: "power2.inOut" },
          at + 0.4,
        );
      });

      // Mission statement — reveal word by word (each word masked, rising in).
      const statement = el.querySelector<HTMLElement>("[data-statement]");
      if (statement) {
        split = new SplitText(statement, { type: "words", mask: "words" });
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.9, from: "start" },
          scrollTrigger: { trigger: statement, start: "top 82%" },
        });
      }
    }, el);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="chi-siamo"
      className={styles.mission}
      aria-label="La nostra missione"
      data-nav-theme="light"
    >
      <div className={styles.grid}>
        <div className={styles.brand} data-reveal>
          HCE<sup className={styles.reg}>®</sup>
          <span className={styles.brandSub}>Home Comfort Electronics</span>
        </div>

        <div className={styles.newsLabel} data-reveal>
          Recent News <span aria-hidden="true">↓</span>
        </div>

        <div className={styles.statementWrap}>
          <figure className={styles.cutout} data-media>
            <Media src="/assets/pannelli-solari.webp" alt="Impianto fotovoltaico HCE" />
          </figure>
          <p className={styles.statement} data-statement>
            La nostra missione è fornire soluzioni all’avanguardia per l’efficienza
            energetica, con prodotti di qualità e la competenza di tecnici sempre
            aggiornati sulle normative di settore. Partner di fiducia per l’eccellenza.
          </p>
        </div>

        {/* Provisional #normative target: the news block leads with the
            regulatory update until a dedicated section exists. */}
        <aside id="normative" className={styles.news}>
          {NEWS.map((n) => (
            <article key={n.title} className={styles.card}>
              <div className={styles.cardMedia} data-media>
                <Media src={n.image} alt={n.title} />
              </div>
              <div className={styles.cardBody} data-reveal>
                <h3 className={styles.cardTitle}>{n.title}</h3>
                <span className={styles.cardDate}>{n.date}</span>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
