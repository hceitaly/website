import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  CATALOG,
  CATEGORY_BY_KEY,
  PLACEHOLDER_IMAGE,
  type CatalogProduct,
} from "../data/products";
import QuoteDrawer from "../components/QuoteDrawer";
import styles from "./ProductPage.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Prodotti consigliati in fondo alla scheda. */
const MAX_RELATED = 4;

const HIDDEN = "inset(0% 0% 100% 0%)"; // clip sul bordo alto (vuoto)
const SHOWN = "inset(0% 0% 0% 0%)";

export default function ProductPage({ product }: { product: CatalogProduct }) {
  const pageRef = useRef<HTMLElement>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const cat = CATEGORY_BY_KEY[product.category];
  const src = product.image ?? PLACEHOLDER_IMAGE[product.category];
  /* Chi guarda un inverter confronta inverter: in fondo alla scheda solo la
     sua categoria, e al massimo quattro. Sono quelli che seguono nell'ordine del
     catalogo, ripartendo dall'inizio in fondo all'elenco: il listino tiene
     vicini i prodotti affini, e prendere sempre i primi quattro metterebbe gli
     stessi consigli sotto ogni scheda della categoria. */
  const siblings = CATALOG.filter((p) => p.category === product.category);
  const at = siblings.findIndex((p) => p.id === product.id);
  const others = [...siblings.slice(at + 1), ...siblings.slice(0, at)].slice(0, MAX_RELATED);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      // Titolo — parola per parola, come le altre dichiarazioni del sito.
      const title = page.querySelector<HTMLElement>("[data-statement]");
      if (title) {
        split = new SplitText(title, { type: "words", mask: "words" });
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.6, from: "start" },
          delay: 0.3,
        });
      }

      // Foto del prodotto — sipario nel colore della categoria, poi l'immagine.
      const cover = page.querySelector<HTMLElement>("[data-cover]");
      const fill = page.querySelector<HTMLElement>("[data-fill]");
      if (cover && fill) {
        gsap.set([cover, fill], { clipPath: HIDDEN });
        gsap
          .timeline({ delay: 0.15 })
          .to(cover, { clipPath: SHOWN, duration: 0.5, ease: "power2.inOut" })
          .to(fill, { clipPath: SHOWN, duration: 0.65, ease: "power2.inOut" }, 0.42);
      }

      // Tutto il resto — sollevamento + dissolvenza all'arrivo in vista.
      gsap.utils.toArray<HTMLElement>(page.querySelectorAll("[data-reveal]")).forEach((el) => {
        gsap.from(el, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%" },
        });
      });
    }, page);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [product.id]);

  return (
    <main
      ref={pageRef}
      className={styles.page}
      data-nav-theme="light"
      style={{ "--cat": cat.color } as CSSProperties}
    >
      <div className={styles.wrap}>
        {/* Colonna sinistra: resta ferma mentre la destra scorre. */}
        <div className={styles.left}>
          <a className={styles.back} href="/prodotti">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12H4M10.5 5.5 4 12l6.5 6.5" />
            </svg>
            Prodotti
          </a>

          <div className={styles.stage}>
            <div className={styles.shot}>
              <span className={styles.shotCover} data-cover aria-hidden="true" />
              <span className={styles.shotFill} data-fill>
                <img src={src} alt={product.name} />
              </span>
            </div>
          </div>
        </div>

        {/* Colonna destra: scorre. */}
        <div className={styles.right}>
          <span className={styles.tag} data-reveal>
            <img className={styles.tagIcon} src={cat.icon} alt="" aria-hidden="true" />
            {cat.label}
          </span>

          <h1 className={styles.title} data-statement>
            {product.name}
          </h1>

          {/* Ogni riga compare solo se il suo campo è stato compilato nel
              pannello: una scheda appena creata mostra il titolo e il
              preventivo, e si arricchisce man mano che viene redatta. */}
          {product.intro && (
            <div className={styles.row} data-reveal>
              <span className={styles.rowLabel}>Cos&apos;è</span>
              <p className={styles.intro}>{product.intro}</p>
            </div>
          )}

          {/* Stessa griglia delle righe: il bottone parte dalla colonna
              del testo, a filo con la descrizione qui sopra. */}
          <div className={styles.actions} data-reveal>
            <button type="button" className={styles.btn} onClick={() => setQuoteOpen(true)}>
              <span className={styles.btnFill} aria-hidden="true" />
              Richiedi preventivo
            </button>
          </div>

          {product.highlights && product.highlights.length > 0 && (
            <div className={`${styles.row} ${styles.ruled}`} data-reveal>
              <span className={styles.rowLabel}>Caratteristiche</span>
              <span className={styles.chips}>
                {product.highlights.map((h) => (
                  <span key={h} className={styles.chip}>
                    {h}
                  </span>
                ))}
              </span>
            </div>
          )}

          {product.points && product.points.length > 0 && (
            <div className={`${styles.row} ${styles.ruled}`} data-reveal>
              <span className={styles.rowLabel}>In evidenza</span>
              <ul className={styles.points}>
                {product.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* La tabella prende tutta la larghezza della colonna, etichetta
              sopra: di fianco le resterebbero poco più di 400 px per quattro
              colonne di testo. Tabella vera o schede impilate lo decide il CSS
              sulla larghezza disponibile. I ruoli ARIA sono espliciti perché
              quando le celle cambiano `display` alcuni browser smettono di
              annunciarle come tabella. */}
          {product.models && product.models.rows.length > 0 && (
            <div className={`${styles.row} ${styles.rowWide} ${styles.ruled}`} data-reveal>
              <span className={styles.rowLabel}>Modelli</span>
              <div className={styles.tableWrap}>
                <table className={styles.table} role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      {product.models.columns.map((h) => (
                        <th key={h} scope="col" role="columnheader">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {product.models.rows.map((r, n) => (
                      <tr key={`${r[0]}-${n}`} role="row">
                        {r.map((cell, i) =>
                          i === 0 ? (
                            <th key={i} scope="row" role="rowheader">
                              {cell}
                            </th>
                          ) : (
                            <td key={i} role="cell" data-label={product.models!.columns[i]}>
                              {cell}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {product.datasheets && product.datasheets.length > 0 && (
            <div className={`${styles.row} ${styles.ruled}`} data-reveal>
              <span className={styles.rowLabel}>Schede tecniche</span>
              <ul className={styles.files}>
                {product.datasheets.map((d) => (
                  <li key={d.file}>
                    <a className={styles.file} href={d.file} download>
                      <span className={styles.fileName}>{d.label}</span>
                      <span className={styles.fileMeta}>
                        <span className={styles.fileKind}>
                          PDF{d.size ? ` · ${d.size}` : ""}
                        </span>
                        <span className={styles.fileIcon} aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
                            <path d="M5 19h14" />
                          </svg>
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Chiusura: gli altri prodotti a catalogo. */}
      {others.length > 0 && (
        <section className={styles.more}>
          <span className={styles.moreLabel} data-reveal>
            Altri prodotti
          </span>
          <div className={styles.moreGrid}>
            {others.map((p) => {
              const c = CATEGORY_BY_KEY[p.category];
              return (
                <a
                  key={p.id}
                  href={`/prodotti/${p.id}`}
                  className={styles.card}
                  data-reveal
                  style={{ "--cat": c.color } as CSSProperties}
                >
                  <span className={styles.cardHead}>
                    <span className={styles.cardName}>{p.name}</span>
                    <span className={styles.cardTag}>
                      <span className={styles.cardTagFill} aria-hidden="true" />
                      <img className={styles.tagIcon} src={c.icon} alt="" aria-hidden="true" />
                      {c.label}
                    </span>
                  </span>
                  <span className={styles.cardMedia}>
                    <img
                      src={p.image ?? PLACEHOLDER_IMAGE[p.category]}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <QuoteDrawer product={product} open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </main>
  );
}
