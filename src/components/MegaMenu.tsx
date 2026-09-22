import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { CATEGORIES, categoryCatalog, productsByCategory, type CategoryKey } from "../data/products";
import styles from "./MegaMenu.module.css";

type Props = {
  open: boolean;
  /** Il pannello tiene aperto il menu finché il puntatore è sopra. */
  onEnter: () => void;
  onLeave: () => void;
};

/** Colonne su cui distribuire l'elenco: con 14 voci una sola non basta. */
function columnsFor(count: number) {
  if (count > 10) return 3;
  if (count > 5) return 2;
  return 1;
}

/** I nomi di listino hanno spesso una coda descrittiva dopo il trattino lungo
    ("SK POWER zebra — Made-EU, ENEA cat. A"): nel menu resta il titolo, la
    coda compare al passaggio. Si taglia solo su " — " con gli spazi, così i
    trattini dentro le parole (vetro-vetro, AI-Link) restano dove sono. */
function splitName(name: string): [string, string | null] {
  const i = name.indexOf(" — ");
  return i < 0 ? [name, null] : [name.slice(0, i), name.slice(i + 3)];
}

/** Parola mascherata: cade dall'alto, come le voci del menu principale. */
function Word({ children, mark }: { children: string; mark: string }) {
  return (
    <span className={styles.mask}>
      <span className={styles.word} data-word={mark}>
        {children}
      </span>
    </span>
  );
}

export default function MegaMenu({ open, onEnter, onLeave }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<CategoryKey>(CATEGORIES[0].key);

  const cat = useMemo(
    () => CATEGORIES.find((c) => c.key === active) ?? CATEGORIES[0],
    [active],
  );
  /* La gamma della categoria, presa dal catalogo: quello che il pannello
     carica compare qui senza toccare nulla. I prodotti con scheda puntano
     alla loro pagina, le voci di gamma al catalogo già filtrato. */
  const items = useMemo(() => productsByCategory(active), [active]);
  const doc = categoryCatalog(cat);

  /* ---- Apertura: il pannello cala, poi le scritte entrano a cascata ---- */
  // Niente `gsap.context` qui: il revert taglierebbe di netto anche l'uscita,
  // e il pannello sparirebbe invece di richiudersi.
  const first = useRef(true);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element>(sel: string) => Array.from(panel.querySelectorAll<T>(sel));
    const cats = q<HTMLElement>('[data-word="cat"]');
    const heads = q<HTMLElement>('[data-word="head"]');
    const media = panel.querySelector<HTMLElement>("[data-media]");
    const targets = [panel, ...cats, ...heads, media].filter(Boolean) as HTMLElement[];

    gsap.killTweensOf(targets);

    const HIDDEN = "inset(0% 0% 100% 0%)"; // clip sul bordo alto
    const SHOWN = "inset(0% 0% 0% 0%)";

    if (!open) {
      // Al primo render è già chiuso: niente da animare.
      if (first.current || reduce) gsap.set(panel, { autoAlpha: 0, clipPath: HIDDEN });
      else gsap.to(panel, { autoAlpha: 0, clipPath: HIDDEN, duration: 0.3, ease: "power2.in" });
      first.current = false;
      return;
    }

    first.current = false;

    if (reduce) {
      gsap.set(panel, { autoAlpha: 1, clipPath: SHOWN });
      gsap.set([...heads, ...cats], { yPercent: 0, opacity: 1 });
      if (media) gsap.set(media, { clipPath: SHOWN });
      return;
    }

    gsap.set(panel, { autoAlpha: 1 });
    gsap.set([...heads, ...cats], { yPercent: -110, opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo(
      panel,
      { clipPath: HIDDEN },
      { clipPath: SHOWN, duration: 0.5, ease: "power3.out" },
    )
      .to(
        heads,
        { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.06 },
        0.16,
      )
      // Le categorie entrano una dopo l'altra: è il ritardo che dà il ritmo.
      .to(
        cats,
        { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.07 },
        0.24,
      );

    if (media) {
      gsap.set(media, { clipPath: HIDDEN });
      tl.to(media, { clipPath: SHOWN, duration: 0.6, ease: "power2.inOut" }, 0.3);
    }
  }, [open]);

  /* ---- Cambio categoria: la colonna prodotti si riscrive a cascata ---- */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-word="prod"]',
        { yPercent: -110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.07, delay: 0.05 },
      );
      gsap.fromTo(
        "[data-shot]",
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power2.inOut" },
      );
    }, panel);

    return () => ctx.revert();
  }, [active, open]);

  return (
    <div
      ref={panelRef}
      className={styles.mega}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden={!open}
      style={{ "--cat": cat.color } as CSSProperties}
    >
      {/* L'obliqua fra categorie e prodotti. Verso il catalogo non serve: quel
          bordo ce l'ha già l'immagine, tagliata alla stessa inclinazione. */}
      <span className={`${styles.rule} ${styles.rule1}`} aria-hidden="true" />

      {/* Colonna 1 — categorie */}
      <div className={styles.col}>
        <span className={styles.colHead}>
          <Word mark="head">Categorie</Word>
        </span>

        <ul className={styles.cats}>
          {CATEGORIES.map((c) => {
            const on = c.key === active;
            return (
              <li key={c.key}>
                {/* Al passaggio mostra la gamma, al click porta al catalogo
                    già filtrato su quella categoria. */}
                <a
                  href={`/prodotti?categoria=${c.key}`}
                  className={`${styles.cat} ${on ? styles.catOn : ""}`}
                  style={{ "--cat": c.color } as CSSProperties}
                  onMouseEnter={() => setActive(c.key)}
                  onFocus={() => setActive(c.key)}
                  tabIndex={open ? 0 : -1}
                >
                  <span className={styles.catFill} aria-hidden="true" />
                  <span className={styles.catBody}>
                    <img className={styles.catIcon} src={c.icon} alt="" aria-hidden="true" />
                    <Word mark="cat">{c.label}</Word>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Colonna 2 — prodotti della categoria in evidenza */}
      <div className={`${styles.col} ${styles.colProducts}`}>
        {/* Il titolo della gamma cambia con la categoria: entra insieme
            all'elenco, non con le intestazioni fisse. */}
        <span className={styles.colHead}>
          <span className={styles.mask}>
            <span className={styles.word} data-word="prod">
              {cat.menuTitle}
            </span>
          </span>
        </span>

        <ul
          className={styles.products}
          style={{ "--pcols": columnsFor(items.length) } as CSSProperties}
        >
          {items.map((item) => {
            const [title, detail] = splitName(item.name);
            return (
              <li key={item.id}>
                {/* Il nome intero resta quello che legge uno screen reader:
                    la coda è nascosta solo alla vista. */}
                <a
                  className={styles.product}
                  href={item.published ? `/prodotti/${item.id}` : `/prodotti?categoria=${item.category}`}
                  tabIndex={open ? 0 : -1}
                  aria-label={item.name}
                >
                  <span className={styles.mask}>
                    <span className={styles.word} data-word="prod">
                      {title}
                    </span>
                  </span>
                  {detail && (
                    <span className={styles.detail} aria-hidden="true">
                      <span className={styles.detailText}>{detail}</span>
                    </span>
                  )}
                  <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </li>
            );
          })}
        </ul>

        <a className={styles.all} href="/prodotti" tabIndex={open ? 0 : -1}>
          <Word mark="head">Vedi tutto il catalogo</Word>
        </a>
      </div>

      {/* Colonna 3 — copertina del catalogo, a tutta altezza */}
      {/* Il taglio obliquo sta sul contenitore; la tendina di GSAP su quello
          interno, altrimenti l'animazione sovrascriverebbe il `clip-path`. */}
      <a
        className={styles.media}
        href={doc.href}
        download={doc.pdf || undefined}
        tabIndex={open ? 0 : -1}
      >
        <span className={styles.mediaInner} data-media>
          <img className={styles.shot} data-shot src={cat.image} alt="" aria-hidden="true" />
          <span className={styles.mediaLabel}>
            <span>{doc.pdf ? `Catalogo ${cat.label}` : `Documenti ${cat.label}`}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
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
}
