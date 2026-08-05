import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  CATALOG,
  CATEGORIES,
  CATEGORY_BY_KEY,
  layoutShapes,
  PLACEHOLDER_IMAGE,
  SECTORS,
  sectorsForCategories,
  type CategoryKey,
  type SectorKey,
  type Shape,
} from "../data/products";
import { scrollToTarget } from "../hooks/useSmoothScroll";
import styles from "./ProductsPage.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const HIDDEN = "inset(0% 0% 100% 0%)"; // clip sul bordo alto (vuoto)
const SHOWN = "inset(0% 0% 0% 0%)";

/** Quanti moduli della griglia occupa ogni forma. */
const SHAPE_CLASS: Record<Shape, string> = {
  square: "",
  vertical: styles.cellV,
  horizontal: styles.cellH,
};

/** Aggiunge/toglie una chiave da un set di filtri. */
function toggle<T>(set: T[], key: T): T[] {
  return set.includes(key) ? set.filter((k) => k !== key) : [...set, key];
}

/**
 * Categorie preselezionate da `?categoria=` — è così che arrivano qui i bottoni
 * dello slider in home e le voci del megamenu. Accetta più chiavi separate da
 * virgola e scarta quelle che non esistono.
 */
function categoriesFromUrl(): CategoryKey[] {
  if (typeof window === "undefined") return [];
  const raw = new URLSearchParams(window.location.search).get("categoria");
  if (!raw) return [];
  const wanted = raw.split(",").map((s) => s.trim().toLowerCase());
  return CATEGORIES.filter((c) => wanted.includes(c.key)).map((c) => c.key);
}

export default function ProductsPage() {
  const pageRef = useRef<HTMLElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  const [cats, setCats] = useState<CategoryKey[]>(categoriesFromUrl);
  const [sectors, setSectors] = useState<SectorKey[]>([]);

  const visible = useMemo(
    () =>
      CATALOG.filter(
        (p) =>
          (cats.length === 0 || cats.includes(p.category)) &&
          (sectors.length === 0 || p.sectors.some((s) => sectors.includes(s))),
      ),
    [cats, sectors],
  );

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

  // Settori raggiungibili con le categorie scelte: gli altri si spengono.
  const openSectors = useMemo(() => sectorsForCategories(cats), [cats]);

  // Scegliendo una categoria un settore già selezionato può restare senza
  // prodotti: in quel caso lo lasciamo cadere, così il filtro non mente.
  const toggleCat = useCallback(
    (key: CategoryKey) => {
      const next = toggle(cats, key);
      const open = sectorsForCategories(next);
      setCats(next);
      if (open) {
        setSectors((sel) => (sel.every((s) => open.has(s)) ? sel : sel.filter((s) => open.has(s))));
      }
    },
    [cats],
  );

  const active = cats.length + sectors.length;
  // Cambia solo quando cambia l'insieme filtrato: chiave dell'animazione.
  const signature = visible.map((p) => p.id).join("|");

  // Il filtro cambia l'altezza della griglia: ScrollTrigger deve rimisurare,
  // ma una volta sola, a layout fermo.
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(t);
  }, [signature]);

  const clearFilters = useCallback(() => {
    setCats([]);
    setSectors([]);
  }, []);

  /* ---- Ingresso: testi come nel resto del sito, card filtro a tendina ---- */
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      // Titolo — reveal parola per parola, come le altre dichiarazioni del sito.
      const title = page.querySelector<HTMLElement>("[data-statement]");
      if (title) {
        split = new SplitText(title, { type: "words", mask: "words" });
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

      // Testi minori — sollevamento + dissolvenza, come `useReveal`.
      const texts = gsap.utils.toArray<HTMLElement>(page.querySelectorAll("[data-reveal]"));
      texts.forEach((t) => {
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

      const cards = gsap.utils.toArray<HTMLElement>(
        filtersRef.current?.querySelectorAll("[data-filter-card]") ?? [],
      );

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
    }, page);

    return () => {
      split?.revert();
      ctx.revert();
    };
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
      <header className={styles.head}>
        <h1 className={styles.title} data-statement>
          I nostri prodotti sono scelti per durare. Prenditi il tempo di esplorarli.
        </h1>
      </header>

      <div ref={filtersRef} className={styles.filters}>
        {/* Sinistra — le categorie colorate, le stesse della home. */}
        <section className={styles.group} aria-label="Filtra per categoria">
          <span className={styles.groupLabel} data-reveal>
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
          <span className={styles.groupLabel} data-reveal>
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
                  onClick={() => setSectors((v) => toggle(v, s.key))}
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
          {catalogues.map((c) => (
            <div
              key={`catalogo-${c.key}`}
              className={`${styles.cell} ${styles.cellH}`}
              style={{ "--cat": c.color } as CSSProperties}
            >
              <a className={`${styles.card} ${styles.catCard}`} data-card href={c.catalogFile} download>
                <img className={styles.catCover} src={c.catalogCover} alt="" aria-hidden="true" />
                <span className={styles.catScrim} aria-hidden="true" />

                <span className={styles.catRow}>
                  <span className={styles.catKind}>PDF</span>
                  <span className={`${styles.cardTag} ${styles.tagOnCover}`}>
                    <span className={styles.tagFill} aria-hidden="true" />
                    <img className={styles.tagIcon} src={c.icon} alt="" aria-hidden="true" />
                    {c.label}
                  </span>
                </span>

                <span className={`${styles.catRow} ${styles.catRowEnd}`}>
                  <span className={styles.catTitle}>Scarica il catalogo {c.label}</span>
                  <span className={styles.catBtn} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
                      <path d="M5 19h14" />
                    </svg>
                  </span>
                </span>
              </a>
            </div>
          ))}

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
