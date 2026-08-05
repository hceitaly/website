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
import { PRODUCT_DETAILS } from "../data/productDetails";
import QuoteDrawer from "../components/QuoteDrawer";
import styles from "./ProductPage.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const HIDDEN = "inset(0% 0% 100% 0%)"; // clip sul bordo alto (vuoto)
const SHOWN = "inset(0% 0% 0% 0%)";

export default function ProductPage({ product }: { product: CatalogProduct }) {
  const pageRef = useRef<HTMLElement>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const cat = CATEGORY_BY_KEY[product.category];
  const detail = PRODUCT_DETAILS[product.id];
  const src = product.image ?? PLACEHOLDER_IMAGE[product.category];
  const others = CATALOG.filter((p) => p.id !== product.id);

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

          {detail && (
            <>
              <div className={styles.row} data-reveal>
                <span className={styles.rowLabel}>Cos&apos;è</span>
                <p className={styles.intro}>{detail.intro}</p>
              </div>

              <div className={styles.actions} data-reveal>
                <button type="button" className={styles.btn} onClick={() => setQuoteOpen(true)}>
                  <span className={styles.btnFill} aria-hidden="true" />
                  Richiedi preventivo
                </button>
                <a className={styles.btn} href={detail.catalogFile} download>
                  <span className={styles.btnFill} aria-hidden="true" />
                  <svg className={styles.btnIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
                    <path d="M5 19h14" />
                  </svg>
                  Scarica il catalogo prodotto
                </a>
              </div>

              <div className={`${styles.row} ${styles.ruled}`} data-reveal>
                <span className={styles.rowLabel}>Caratteristiche</span>
                <span className={styles.chips}>
                  {detail.highlights.map((h) => (
                    <span key={h} className={styles.chip}>
                      {h}
                    </span>
                  ))}
                </span>
              </div>

              <div className={`${styles.row} ${styles.ruled}`} data-reveal>
                <span className={styles.rowLabel}>In evidenza</span>
                <ul className={styles.points}>
                  {detail.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              {detail.models && (
                <div className={`${styles.row} ${styles.ruled}`} data-reveal>
                  <span className={styles.rowLabel}>Modelli</span>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          {detail.models.head.map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.models.rows.map((r) => (
                          <tr key={r[0]}>
                            {r.map((cell, i) => (
                              <td key={i}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
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
