import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { CATEGORY_BY_KEY, type CatalogProduct } from "../data/products";
import { PRODUCT_DETAILS } from "../data/productDetails";
import { COMPANY } from "../data/content";
import { setScrollLocked } from "../hooks/useSmoothScroll";
import styles from "./QuoteDrawer.module.css";

type Props = {
  product: CatalogProduct;
  open: boolean;
  onClose: () => void;
};

type Form = {
  modello: string;
  quantita: string;
  destinazione: string;
  nome: string;
  telefono: string;
  email: string;
  azienda: string;
  installazione: "si" | "no" | "";
  privacy: boolean;
  marketing: boolean;
};

const EMPTY: Form = {
  modello: "",
  quantita: "",
  destinazione: "",
  nome: "",
  telefono: "",
  email: "",
  azienda: "",
  installazione: "",
  privacy: false,
  marketing: false,
};

export default function QuoteDrawer({ product, open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** Elemento a cui restituire il fuoco alla chiusura. */
  const openerRef = useRef<Element | null>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [sent, setSent] = useState(false);

  const cat = CATEGORY_BY_KEY[product.category];
  const models = PRODUCT_DETAILS[product.id]?.models;

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const step1Done = form.modello !== "" && form.quantita !== "" && form.destinazione !== "";
  const canSend = form.nome !== "" && form.email !== "" && form.privacy;

  /* ---- Apertura: la tendina entra da destra, il velo la accompagna ---- */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = reduce ? 0 : 0.5;

    if (open) {
      openerRef.current = document.activeElement;
      gsap.killTweensOf([panel, scrim]);
      gsap.set(scrim, { autoAlpha: 0 });
      gsap.set(panel, { xPercent: 100 });
      gsap.to(scrim, { autoAlpha: 1, duration: d * 0.7, ease: "power2.out" });
      gsap.to(panel, { xPercent: 0, duration: d, ease: "power3.out" });
      return;
    }

    // Chiusa: fuori schermo, senza animare al primo render.
    gsap.set(panel, { xPercent: 100 });
    gsap.set(scrim, { autoAlpha: 0 });
  }, [open]);

  /* ---- Fuoco, tasto Esc e blocco dello scroll dietro ---- */
  useEffect(() => {
    if (!open) return;

    setScrollLocked(true);
    closeRef.current?.focus();

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

  /* ---- Cambio slide: la vecchia esce, la nuova entra dallo stesso verso ---- */
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || !open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-slide]", {
        x: step === 0 ? -28 : 28,
        opacity: 0,
        duration: 0.45,
        ease: "power3.out",
      });
    }, body);

    body.scrollTop = 0;
    return () => ctx.revert();
  }, [step, sent, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSent(true); // segnaposto — da collegare a un servizio reale
  };

  const close = () => {
    onClose();
    // Ripulisce dopo l'uscita, così la tendina non "sfarfalla" mentre esce.
    window.setTimeout(() => {
      setStep(0);
      setSent(false);
      setForm(EMPTY);
    }, 450);
  };

  return (
    <div className={styles.root} aria-hidden={!open}>
      <div
        ref={scrimRef}
        className={styles.scrim}
        onClick={close}
        role="presentation"
      />

      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Richiedi preventivo — ${product.name}`}
        style={{ "--cat": cat.color } as CSSProperties}
      >
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>{product.name}</span>
            <h2 className={styles.title}>Richiedi preventivo</h2>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Chiudi">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {!sent && (
          <div className={styles.steps} aria-hidden="true">
            <span className={step === 0 ? styles.stepOn : ""} />
            <span className={step === 1 ? styles.stepOn : ""} />
          </div>
        )}

        <form className={styles.form} onSubmit={submit}>
          <div ref={bodyRef} className={styles.body} data-lenis-prevent>
            {sent ? (
              <div className={styles.done} data-slide role="status">
                <span className={styles.doneMark} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5 10 17.5 19 7" />
                  </svg>
                </span>
                <h3 className={styles.doneTitle}>Richiesta inviata</h3>
                <p className={styles.doneText}>
                  Grazie, {form.nome.split(" ")[0]}. Ti ricontattiamo al più presto con il
                  preventivo per {product.name}.
                </p>

                {/* Aggancio: chi chiede un preventivo è spesso un installatore. */}
                <div className={styles.ambassador}>
                  <h4 className={styles.ambassadorTitle}>Sei un installatore?</h4>
                  <p className={styles.ambassadorText}>
                    Entra a far parte del nostro programma ambassador e ricevi promozioni
                    periodiche dedicate.
                  </p>
                  <a
                    className={styles.ambassadorCta}
                    href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(
                      "Programma Ambassador HCE",
                    )}&body=${encodeURIComponent(
                      `Ciao, sono ${form.nome} e vorrei aderire al programma ambassador.`,
                    )}`}
                  >
                    <span className={styles.ambassadorFill} aria-hidden="true" />
                    Scopri il programma
                  </a>
                </div>
              </div>
            ) : step === 0 ? (
              <div className={styles.slide} data-slide>
                <fieldset className={styles.group}>
                  <legend className={styles.legend}>Scegli il modello</legend>
                  <div className={styles.cards}>
                    {(models?.rows ?? [[product.name, "", "", ""]]).map((row) => {
                      const on = form.modello === row[0];
                      return (
                        <button
                          key={row[0]}
                          type="button"
                          className={`${styles.card} ${on ? styles.cardOn : ""}`}
                          aria-pressed={on}
                          onClick={() => set("modello", row[0])}
                        >
                          <span className={styles.tick} aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M5 12.5 10 17.5 19 7" />
                            </svg>
                          </span>
                          <span className={styles.cardName}>{row[0]}</span>
                          {row[1] && <span className={styles.cardMeta}>{row[1]}</span>}
                          {row[2] && <span className={styles.cardMeta}>{row[2]} mm</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className={styles.field}>
                  <span className={styles.legend}>Inserisci la quantità</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Es. 24 moduli"
                    value={form.quantita}
                    onChange={(e) => set("quantita", e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.legend}>Inserisci destinazione</span>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Città o provincia di consegna"
                    value={form.destinazione}
                    onChange={(e) => set("destinazione", e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className={styles.slide} data-slide>
                <label className={styles.field}>
                  <span className={styles.legend}>Nome e cognome *</span>
                  <input
                    className={styles.input}
                    type="text"
                    autoComplete="name"
                    placeholder="Mario Rossi"
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.legend}>Inserisci numero di telefono</span>
                  <input
                    className={styles.input}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+39 000 000 0000"
                    value={form.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.legend}>Mail *</span>
                  <input
                    className={styles.input}
                    type="email"
                    autoComplete="email"
                    placeholder="nome@azienda.it"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.legend}>Azienda</span>
                  <input
                    className={styles.input}
                    type="text"
                    autoComplete="organization"
                    placeholder="Ragione sociale"
                    value={form.azienda}
                    onChange={(e) => set("azienda", e.target.value)}
                  />
                </label>

                <fieldset className={styles.group}>
                  <legend className={styles.legend}>Hai bisogno di assistenza nell&apos;installazione?</legend>
                  <div className={styles.cards}>
                    {(["si", "no"] as const).map((v) => {
                      const on = form.installazione === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          className={`${styles.card} ${styles.cardShort} ${on ? styles.cardOn : ""}`}
                          aria-pressed={on}
                          onClick={() => set("installazione", v)}
                        >
                          <span className={styles.tick} aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M5 12.5 10 17.5 19 7" />
                            </svg>
                          </span>
                          <span className={styles.cardName}>{v === "si" ? "Sì" : "No"}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className={styles.consents}>
                  <label className={styles.consent}>
                    <input
                      type="checkbox"
                      checked={form.privacy}
                      onChange={(e) => set("privacy", e.target.checked)}
                    />
                    <span>
                      Ho letto e accetto la <a href="#privacy">Privacy Policy</a> e acconsento
                      al trattamento dei dati per rispondere alla richiesta. *
                    </span>
                  </label>

                  <label className={styles.consent}>
                    <input
                      type="checkbox"
                      checked={form.marketing}
                      onChange={(e) => set("marketing", e.target.checked)}
                    />
                    <span>
                      Acconsento all&apos;uso dei miei dati per finalità di marketing:
                      novità di prodotto, aggiornamenti normativi e comunicazioni
                      commerciali.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Azione flottante, come nel modello. */}
          {!sent && (
            <div className={styles.foot}>
              {step === 1 && (
                <button type="button" className={styles.back} onClick={() => setStep(0)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 12H4M10.5 5.5 4 12l6.5 6.5" />
                  </svg>
                  Indietro
                </button>
              )}

              {step === 0 ? (
                <button
                  type="button"
                  className={styles.cta}
                  disabled={!step1Done}
                  onClick={() => setStep(1)}
                >
                  <span className={styles.ctaFill} aria-hidden="true" />
                  Continua
                </button>
              ) : (
                <button type="submit" className={styles.cta} disabled={!canSend}>
                  <span className={styles.ctaFill} aria-hidden="true" />
                  Invia richiesta
                </button>
              )}
            </div>
          )}
        </form>
      </aside>
    </div>
  );
}
