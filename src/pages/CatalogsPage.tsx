/* `/cataloghi` — la documentazione di ogni prodotto, in un posto solo.

   Stessa apertura della pagina prodotti, stessi filtri; sotto, un prodotto per
   riga: a sinistra chi è, a destra i suoi documenti divisi in schede tecniche,
   manuali e il resto (certificazioni, etichette, depliant). */

import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CATALOG,
  CATEGORIES,
  PLACEHOLDER_IMAGE,
  type CatalogProduct,
  type Datasheet,
} from "../data/products";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import CatalogHero from "../components/CatalogHero";
import styles from "./CatalogsPage.module.css";

gsap.registerPlugin(ScrollTrigger);

/* Le tre colonne dei documenti. Il tipo si ricava dall'etichetta scritta nel
   pannello: "Scheda tecnica (inglese)", "Guida rapida di installazione",
   "Dichiarazione di conformità CEI 0-21"… Quello che non è né scheda né
   manuale finisce nella terza. */
const KINDS = [
  { key: "scheda", title: "Schede tecniche", test: /scheda tecnica|scheda prodotto|datasheet|dati tecnici/i },
  { key: "manuale", title: "Manuali", test: /manual|istruzion|installazion|montaggio|guida|uso e manut/i },
  { key: "altro", title: "Certificazioni e altri documenti", test: /.*/ },
] as const;

function byKind(docs: Datasheet[]) {
  return KINDS.map((k) => ({
    ...k,
    items: docs.filter((d) => KINDS.find((x) => x.test.test(d.label))?.key === k.key),
  })).filter((g) => g.items.length > 0);
}

/** Per confrontare senza badare a maiuscole e accenti: "mobilita" trova "Mobilità". */
function plain(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Il testo in cui cercare: nome del prodotto e nomi dei modelli — chi arriva
    qui spesso ha in mano un codice ("KPV450HC"), non il nome della gamma. */
function haystack(p: CatalogProduct) {
  return plain([p.name, ...(p.models?.rows.map((r) => r[0]) ?? [])].join(" "));
}

export default function CatalogsPage() {
  const pageRef = useRef<HTMLElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filters = useCatalogFilters();
  const { matches, active, clear } = filters;

  const [query, setQuery] = useState("");
  // La ricerca filtra mentre si scrive: il valore differito tiene fluida la
  // digitazione anche quando l'elenco da ridisegnare è lungo.
  const q = plain(useDeferredValue(query).trim());

  // Solo i prodotti che hanno documenti: una riga vuota a destra non serve.
  const withDocs = useMemo(() => CATALOG.filter((p) => p.datasheets?.length), []);

  const visible = useMemo(
    () => withDocs.filter((p) => matches(p) && (!q || haystack(p).includes(q))),
    [withDocs, matches, q],
  );

  const docCount = visible.reduce((n, p) => n + (p.datasheets?.length ?? 0), 0);

  // Raggruppati per categoria, nell'ordine delle categorie del sito.
  const sections = useMemo(
    () =>
      CATEGORIES.map((c) => ({ cat: c, items: visible.filter((p) => p.category === c.key) })).filter(
        (s) => s.items.length > 0,
      ),
    [visible],
  );

  const signature = visible.map((p) => p.id).join("|");

  // Cambiando l'elenco cambia l'altezza della pagina: ScrollTrigger rimisura.
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

  /* ---- Righe: salgono in lotti quando arrivano in vista ---- */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(list.querySelectorAll("[data-row]"));
      gsap.set(rows, { y: 40, opacity: 0 });
      ScrollTrigger.batch(rows, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
      });
    }, list);

    return () => ctx.revert();
  }, [signature]);

  const reset = () => {
    clear();
    setQuery("");
  };

  return (
    <main ref={pageRef} className={styles.page} data-nav-theme="light">
      <CatalogHero
        title="Schede tecniche e manuali di ogni prodotto, pronti da scaricare."
        filters={filters}
        filtersRef={filtersRef}
      />

      <div className={styles.bar}>
        <span className={styles.results} data-reveal aria-live="polite">
          {visible.length} {visible.length === 1 ? "prodotto" : "prodotti"} · {docCount}{" "}
          {docCount === 1 ? "documento" : "documenti"} <span aria-hidden="true">↓</span>
        </span>

        <label className={styles.search}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca un prodotto o un modello"
            aria-label="Cerca un prodotto o un modello"
          />
        </label>

        {(active > 0 || query) && (
          <button type="button" className={styles.clear} onClick={reset}>
            Azzera
          </button>
        )}
      </div>

      <div ref={listRef} className={styles.list}>
        {sections.map(({ cat, items }) => (
          <section
            key={cat.key}
            className={styles.section}
            style={{ "--cat": cat.color } as CSSProperties}
            aria-labelledby={`cat-${cat.key}`}
          >
            <h2 id={`cat-${cat.key}`} className={styles.sectionHead}>
              <img src={cat.icon} alt="" aria-hidden="true" />
              {cat.label}
              <span className={styles.sectionCount}>
                {items.length} {items.length === 1 ? "prodotto" : "prodotti"}
              </span>
            </h2>

            <ul className={styles.rows}>
              {items.map((p) => {
                const docs = p.datasheets ?? [];
                return (
                  <li key={p.id} className={styles.row} data-row>
                    {/* Sinistra — il prodotto. Resta fermo mentre i suoi
                        documenti scorrono, finché la riga è in vista. */}
                    <div className={styles.product}>
                      <a className={styles.thumb} href={`/prodotti/${p.id}`} tabIndex={-1} aria-hidden="true">
                        <img
                          src={p.image ?? PLACEHOLDER_IMAGE[p.category]}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          data-fit={p.image ? "contain" : "cover"}
                        />
                      </a>
                      <div className={styles.productText}>
                        <h3 className={styles.productName}>
                          <a href={`/prodotti/${p.id}`}>{p.name}</a>
                        </h3>
                        <span className={styles.productMeta}>
                          {docs.length} {docs.length === 1 ? "documento" : "documenti"}
                        </span>
                      </div>
                    </div>

                    {/* Destra — i documenti, divisi per tipo. */}
                    <div className={styles.docs}>
                      {byKind(docs).map((g) => (
                        <div key={g.key} className={styles.docGroup}>
                          <h4 className={styles.docTitle}>{g.title}</h4>
                          <ul className={styles.files}>
                            {g.items.map((d) => (
                              <li key={d.file}>
                                <a className={styles.file} href={d.file} download>
                                  <span className={styles.fileName}>{d.label}</span>
                                  <span className={styles.fileMeta}>
                                    PDF{d.size ? ` · ${d.size}` : ""}
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
                                      <path d="M5 19h14" />
                                    </svg>
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {visible.length === 0 && (
        <p className={styles.empty}>
          Nessun prodotto per questa ricerca.{" "}
          <button type="button" className={styles.clear} onClick={reset}>
            Azzera i filtri
          </button>
        </p>
      )}
    </main>
  );
}
