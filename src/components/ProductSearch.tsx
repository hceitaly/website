import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import {
  CATALOG,
  CATEGORY_BY_KEY,
  PLACEHOLDER_IMAGE,
  SECTORS,
  type CatalogProduct,
} from "../data/products";
import { setScrollLocked } from "../hooks/useSmoothScroll";
import styles from "./ProductSearch.module.css";

/* ============================================================
   Ricerca prodotti — il pannello che scende dalla barra.

   Si apre dalla lente accanto al marchio: cala come una tendina
   dal bordo basso della navbar, con il velo dietro. Cerca fra i
   prodotti a catalogo per nome, categoria e settore.
   ============================================================ */

type Props = {
  open: boolean;
  onClose: () => void;
};

const HIDDEN = "inset(0% 0% 100% 0%)"; // tagliato sul bordo alto (vuoto)
const SHOWN = "inset(0% 0% 0% 0%)";

/** Minuscole e senza accenti: "Mobilità" si trova anche scrivendo "mobilita". */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const SECTOR_LABEL = Object.fromEntries(SECTORS.map((s) => [s.key, s.label]));

/** Tutto ciò per cui un prodotto può essere trovato, in una stringa sola. */
function haystack(p: CatalogProduct) {
  return norm(
    [p.name, CATEGORY_BY_KEY[p.category].label, ...p.sectors.map((s) => SECTOR_LABEL[s] ?? s)].join(
      " ",
    ),
  );
}

export default function ProductSearch({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** A chi restituire il fuoco alla chiusura: la lente. */
  const openerRef = useRef<Element | null>(null);

  const [q, setQ] = useState("");

  // A campo vuoto si vede il catalogo intero: è corto, e vale come indice.
  const results = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return CATALOG;
    // Ogni parola deve comparire: "inverter t" trova la Serie T e nient'altro.
    const words = needle.split(/\s+/);
    return CATALOG.filter((p) => {
      const hay = haystack(p);
      return words.every((w) => hay.includes(w));
    });
  }, [q]);

  /* ---- Apertura: la tendina cala, il velo la accompagna ---- */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = reduce ? 0 : 0.45;

    gsap.killTweensOf([panel, scrim]);

    if (open) {
      openerRef.current = document.activeElement;
      gsap.set(panel, { autoAlpha: 1 });
      gsap.fromTo(
        panel,
        { clipPath: HIDDEN },
        { clipPath: SHOWN, duration: d, ease: "power3.out" },
      );
      gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.8 });
      return;
    }

    // Chiusa: la tendina risale e sparisce. Al primo render non c'è niente
    // da animare, e `autoAlpha: 0` la toglie di mezzo senza lampeggiare.
    gsap.to(panel, {
      clipPath: HIDDEN,
      duration: d,
      ease: "power3.inOut",
      onComplete: () => gsap.set(panel, { autoAlpha: 0 }),
    });
    gsap.to(scrim, { autoAlpha: 0, duration: d * 0.7 });
  }, [open]);

  /* ---- Fuoco, tasto Esc e blocco dello scroll dietro ---- */
  useEffect(() => {
    if (!open) return;

    setScrollLocked(true);
    inputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      setScrollLocked(false);
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  // Chiudendo si riparte da campo vuoto, ma solo a tendina risalita.
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => setQ(""), 450);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className={styles.root} aria-hidden={!open}>
      <div ref={scrimRef} className={styles.scrim} onClick={onClose} role="presentation" />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Cerca fra i prodotti"
      >
        <div className={styles.bar}>
          <svg className={styles.lens} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>

          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            placeholder="Cerca un prodotto, una categoria, un settore…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cerca fra i prodotti"
            // La ricerca è locale e immediata: l'invio non deve ricaricare.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />

          <button type="button" className={styles.close} onClick={onClose} aria-label="Chiudi la ricerca">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.body} data-lenis-prevent>
          <span className={styles.count} aria-live="polite">
            {q.trim() === ""
              ? `Tutto il catalogo — ${CATALOG.length} prodotti`
              : `${results.length} ${results.length === 1 ? "risultato" : "risultati"}`}
          </span>

          {results.length === 0 ? (
            <p className={styles.empty}>
              Nessun prodotto per «{q.trim()}».{" "}
              <a href="/prodotti">Sfoglia il catalogo</a> o chiedi all&apos;ufficio tecnico.
            </p>
          ) : (
            <ul className={styles.list}>
              {results.map((p) => {
                const c = CATEGORY_BY_KEY[p.category];
                return (
                  <li key={p.id}>
                    <a
                      className={styles.hit}
                      href={`/prodotti/${p.id}`}
                      style={{ "--cat": c.color } as CSSProperties}
                    >
                      <span className={styles.thumb}>
                        <img
                          src={p.image ?? PLACEHOLDER_IMAGE[p.category]}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                        />
                      </span>
                      <span className={styles.hitBody}>
                        <span className={styles.hitName}>{p.name}</span>
                        <span className={styles.hitCat}>
                          <img className={styles.hitIcon} src={c.icon} alt="" aria-hidden="true" />
                          {c.label}
                        </span>
                      </span>
                      <svg className={styles.hitArrow} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12h14M13.5 5.5 20 12l-6.5 6.5" />
                      </svg>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          <a className={styles.all} href="/prodotti">
            Vedi tutto il catalogo
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h14M13.5 5.5 20 12l-6.5 6.5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
