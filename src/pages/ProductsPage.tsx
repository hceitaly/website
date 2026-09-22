import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CATALOG,
  CATEGORIES,
  CATEGORY_BY_KEY,
  categoryCatalog,
  layoutShapes,
  PLACEHOLDER_IMAGE,
  type Shape,
} from "../data/products";
import { scrollToTarget } from "../hooks/useSmoothScroll";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import CatalogHero from "../components/CatalogHero";
import styles from "./ProductsPage.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Quanti moduli della griglia occupa ogni forma. */
const SHAPE_CLASS: Record<Shape, string> = {
  square: "",
  vertical: styles.cellV,
  horizontal: styles.cellH,
};

export default function ProductsPage() {
  const pageRef = useRef<HTMLElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  const filters = useCatalogFilters();
  const { cats, matches, active, clear: clearFilters } = filters;

  const visible = useMemo(() => CATALOG.filter(matches), [matches]);

  // Scegliendo una categoria, la griglia si apre con la copertina del suo
  // catalogo — il titolo nomina la categoria, quindi serve la vista ristretta.
  const catalogues = useMemo(
    () => CATEGORIES.filter((c) => cats.includes(c.key)),
    [cats],
  );

  // Le forme seguono l'elenco a schermo, non il prodotto: al cambio filtro la
  // griglia si riequilibra invece di ereditare le forme del catalogo intero.
  // Dentro una categoria i prodotti sono tutti quadrati: l'unico elemento
  // lungo è la copertina del catalogo.
  const shapes = useMemo(
    () => (catalogues.length ? [] : layoutShapes(visible.length)),
    [catalogues.length, visible.length],
  );

  // Cambia solo quando cambia l'insieme filtrato: chiave dell'animazione.
  const signature = visible.map((p) => p.id).join("|");

  // Il filtro cambia l'altezza della griglia: ScrollTrigger deve rimisurare,
  // ma una volta sola, a layout fermo.
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(t);
  }, [signature]);

  /* ---- Ingresso dei testi minori. Titolo e card filtro li anima l'hero. ---- */
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(page.querySelectorAll("[data-reveal]")).forEach((t) => {
        gsap.from(t, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: t, start: "top 92%" },
        });
      });
    }, page);

    return () => ctx.revert();
  }, []);

  /* ---- Masonry: fade-in dal basso, con un leggero delay fra i prodotti ---- */
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll("[data-card]"));
      gsap.set(cards, { y: 56, opacity: 0 });

      // In lotti: le schede entrano quando la loro riga arriva in vista, mai
      // tutte insieme — la pagina è lunga.
      ScrollTrigger.batch(cards, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.09,
            overwrite: true,
          }),
      });
    }, grid);

    return () => ctx.revert();
    // Al cambio filtro le schede sono altre: si rianimano dal basso.
  }, [signature]);

  /* ---- Pillola "Filtri" flottante: compare quando i filtri escono di vista ---- */
  useLayoutEffect(() => {
    const pill = pillRef.current;
    const filters = filtersRef.current;
    if (!pill || !filters) return;

    // `autoAlpha` porta con sé la visibility: da nascosta la pillola non
    // intercetta i click.
    gsap.set(pill, { y: 24, autoAlpha: 0 });

    const st = ScrollTrigger.create({
      trigger: filters,
      start: "bottom top+=90",
      onEnter: () => gsap.to(pill, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" }),
      onLeaveBack: () => gsap.to(pill, { y: 24, autoAlpha: 0, duration: 0.3, ease: "power2.in" }),
    });

    return () => st.kill();
  }, []);

  return (
    <main ref={pageRef} className={styles.page} data-nav-theme="light">
      <CatalogHero
        title="I nostri prodotti sono scelti per durare. Prenditi il tempo di esplorarli."
        filters={filters}
        filtersRef={filtersRef}
      />

      <div className={styles.resultsBar}>
        <span className={styles.results} data-reveal aria-live="polite">
          {visible.length === CATALOG.length
            ? `${CATALOG.length} prodotti`
            : `${visible.length} di ${CATALOG.length} prodotti`}{" "}
          <span aria-hidden="true">↓</span>
        </span>
        {active > 0 && (
          <button type="button" className={styles.clear} onClick={clearFilters}>
            Azzera filtri ({active})
          </button>
        )}
      </div>

      <div className={styles.gridWrap}>
        <div ref={gridRef} className={styles.grid}>
          {/* Copertina catalogo: foto a tutto riquadro, PDF in alto a sinistra,
              tag in alto a destra, titolo e pulsante in basso. */}
          {catalogues.map((c) => {
            const doc = categoryCatalog(c);
            return (
            <div
              key={`catalogo-${c.key}`}
              className={`${styles.cell} ${styles.cellH}`}
              style={{ "--cat": c.color } as CSSProperties}
            >
              <a
                className={`${styles.card} ${styles.catCard}`}
                data-card
                href={doc.href}
                download={doc.pdf || undefined}
              >
                <img className={styles.catCover} src={c.catalogCover} alt="" aria-hidden="true" />
                <span className={styles.catScrim} aria-hidden="true" />

                <span className={styles.catRow}>
                  <span className={styles.catKind}>{doc.pdf ? "PDF" : "Schede e manuali"}</span>
                  <span className={`${styles.cardTag} ${styles.tagOnCover}`}>
                    <span className={styles.tagFill} aria-hidden="true" />
                    <img className={styles.tagIcon} src={c.icon} alt="" aria-hidden="true" />
                    {c.label}
                  </span>
                </span>

                <span className={`${styles.catRow} ${styles.catRowEnd}`}>
                  <span className={styles.catTitle}>
                    {doc.pdf ? `Scarica il catalogo ${c.label}` : `Documentazione ${c.label}`}
                  </span>
                  <span className={styles.catBtn} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      {doc.pdf ? (
                        <>
                          <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
                          <path d="M5 19h14" />
                        </>
                      ) : (
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      )}
                    </svg>
                  </span>
                </span>
              </a>
            </div>
            );
          })}

          {visible.map((p, i) => {
            const cat = CATEGORY_BY_KEY[p.category];
            const src = p.image ?? PLACEHOLDER_IMAGE[p.category];
            const fit = p.image ? (p.fit ?? "contain") : "cover";

            return (
              <div
                key={p.id}
                className={`${styles.cell} ${SHAPE_CLASS[shapes[i] ?? "square"]}`}
                style={{ "--cat": cat.color } as CSSProperties}
              >
                <a href={`/prodotti/${p.id}`} className={styles.card} data-card>
                  <span className={styles.cardHead}>
                    <span className={styles.cardName}>{p.name}</span>
                    {/* Al passaggio del mouse il tag si riempie del colore
                        della categoria, con la stessa tendina del menu. */}
                    <span className={styles.cardTag}>
                      <span className={styles.tagFill} aria-hidden="true" />
                      <img className={styles.tagIcon} src={cat.icon} alt="" aria-hidden="true" />
                      {cat.label}
                    </span>
                  </span>

                  <span className={styles.media}>
                    <img src={src} alt={p.name} loading="lazy" decoding="async" data-fit={fit} />
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {visible.length === 0 && (
        <p className={styles.empty}>
          Nessun prodotto per questa combinazione.{" "}
          <button type="button" className={styles.clear} onClick={clearFilters}>
            Azzera i filtri
          </button>
        </p>
      )}

      <button
        ref={pillRef}
        type="button"
        className={styles.pill}
        onClick={() => filtersRef.current && scrollToTarget(filtersRef.current, -140)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filtri
        {active > 0 && <span className={styles.pillCount}>{active}</span>}
      </button>
    </main>
  );
}
