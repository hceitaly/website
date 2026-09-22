/* L'apertura delle pagine di catalogo: la frase grande, poi le card per
   filtrare per categoria e per settore.

   È la stessa in `/prodotti` e in `/cataloghi` — cambia solo la frase. Porta
   con sé la propria animazione d'ingresso: il titolo parola per parola, le
   card che salgono con la tendina colorata davanti alla foto. */

import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CATEGORIES, SECTORS } from "../data/products";
import type { CatalogFilters } from "../hooks/useCatalogFilters";
import styles from "./CatalogHero.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const HIDDEN = "inset(0% 0% 100% 0%)"; // clip sul bordo alto (vuoto)
const SHOWN = "inset(0% 0% 0% 0%)";

type Props = {
  title: string;
  filters: CatalogFilters;
  /** La barra dei filtri: la pagina la usa per la pillola "Filtri" che ci
      riporta quando si è scesi. */
  filtersRef: RefObject<HTMLDivElement | null>;
};

export default function CatalogHero({ title, filters, filtersRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { cats, sectors, openSectors, toggleCat, toggleSector } = filters;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      // Titolo — reveal parola per parola, come le altre dichiarazioni del sito.
      const heading = root.querySelector<HTMLElement>("[data-statement]");
      if (heading) {
        split = new SplitText(heading, { type: "words", mask: "words" });
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.9, from: "start" },
          delay: 0.25,
        });
      }

      // Etichette dei gruppi — sollevamento + dissolvenza.
      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hero-reveal]")).forEach((t) => {
        gsap.from(t, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: t, start: "top 92%" },
        });
      });

      // Card di filtro — la tendina colorata del brand scende, poi l'immagine,
      // con la card che sale. Cascata da sinistra a destra.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: filtersRef.current, start: "top 85%", once: true },
      });

      const cards = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-filter-card]"));
      cards.forEach((card, i) => {
        const cover = card.querySelector<HTMLElement>("[data-cover]");
        const fill = card.querySelector<HTMLElement>("[data-fill]");
        const at = i * 0.07;

        gsap.set(card, { y: 26, opacity: 0 });
        tl.to(card, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, at);

        if (cover && fill) {
          gsap.set([cover, fill], { clipPath: HIDDEN });
          tl.to(cover, { clipPath: SHOWN, duration: 0.4, ease: "power2.inOut" }, at + 0.1).to(
            fill,
            { clipPath: SHOWN, duration: 0.5, ease: "power2.inOut" },
            at + 0.38,
          );
        }
      });
    }, root);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [filtersRef]);

  return (
    <div ref={rootRef}>
      <header className={styles.head}>
        <h1 className={styles.title} data-statement>
          {title}
        </h1>
      </header>

      <div ref={filtersRef} className={styles.filters}>
        {/* Sinistra — le categorie colorate, le stesse della home. */}
        <section className={styles.group} aria-label="Filtra per categoria">
          <span className={styles.groupLabel} data-hero-reveal>
            <strong>Filtra</strong> per categoria
          </span>
          <div className={`${styles.row} ${styles.rowCats}`}>
            {CATEGORIES.map((c) => {
              const on = cats.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  data-filter-card
                  aria-pressed={on}
                  onClick={() => toggleCat(c.key)}
                  className={`${styles.fCard} ${styles.fCat} ${on ? styles.fOn : ""} ${
                    cats.length && !on ? styles.fOff : ""
                  }`}
                  style={{ "--cat": c.color } as CSSProperties}
                >
                  <span className={styles.fThumb}>
                    <span className={styles.fCover} data-cover aria-hidden="true" />
                    <span className={styles.fFill} data-fill>
                      <img src={c.image} alt="" aria-hidden="true" loading="lazy" />
                    </span>
                  </span>
                  <span className={styles.fLabel}>
                    <img className={styles.fIcon} src={c.icon} alt="" aria-hidden="true" />
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Destra — i settori di applicazione. */}
        <section className={styles.group} aria-label="Filtra per settore">
          <span className={styles.groupLabel} data-hero-reveal>
            <strong>Filtra</strong> per settore
          </span>
          <div className={`${styles.row} ${styles.rowSectors}`}>
            {SECTORS.map((s) => {
              const on = sectors.includes(s.key);
              // Nessun prodotto per questo settore nelle categorie scelte.
              const locked = openSectors !== null && !openSectors.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  data-filter-card
                  disabled={locked}
                  aria-pressed={on}
                  title={locked ? "Nessun prodotto in questo settore per la categoria scelta" : undefined}
                  onClick={() => toggleSector(s.key)}
                  className={`${styles.fCard} ${styles.fSector} ${on ? styles.fOn : ""} ${
                    !locked && sectors.length && !on ? styles.fOff : ""
                  }`}
                >
                  <span className={styles.fThumb}>
                    <span className={styles.fCover} data-cover aria-hidden="true" />
                    <span className={styles.fFill} data-fill>
                      {s.image ? (
                        <img src={s.image} alt="" aria-hidden="true" loading="lazy" />
                      ) : (
                        <span className={styles.fEmpty} aria-hidden="true" />
                      )}
                    </span>
                  </span>
                  <span className={styles.fLabel}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
