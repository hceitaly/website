import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { CATEGORY_BY_KEY, type CatalogProduct } from "../data/products";
import { COMPANY } from "../data/content";
import { setScrollLocked } from "../hooks/useSmoothScroll";
import styles from "./QuoteDrawer.module.css";

type Props = {
  product: CatalogProduct;
  open: boolean;
  onClose: () => void;
};

type Form = {
  /** Modelli scelti, ciascuno con la sua quantità. La quantità resta testo
      finché si scrive: un campo svuotato per essere riscritto non deve far
      sparire il modello dalla richiesta. */
  quantita: Record<string, string>;
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
  quantita: {},
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
  /* Gli stessi modelli della scheda: chi chiede il preventivo sceglie fra le
     righe della tabella. Senza tabella resta un'unica voce, il prodotto. */
  const options = (product.models?.rows ?? [[product.name, "", ""]]).map((row) => ({
    name: row[0],
    desc: row[1] ?? "",
    dims: row[2] ?? "",
  }));

  /** Con un solo modello non c'è niente da scegliere: è già selezionato. */
  const initial = (): Form => ({
    ...EMPTY,
    quantita: options.length === 1 ? { [options[0].name]: "1" } : {},
  });

  const [form, setForm] = useState<Form>(initial);
  const [sent, setSent] = useState(false);

  const cat = CATEGORY_BY_KEY[product.category];

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* ---- Modelli e quantità ---- */

  // Nell'ordine della tabella, non in quello in cui sono stati cliccati.
  const selected = options.filter((o) => o.name in form.quantita);
  const qty = (name: string) => Number.parseInt(form.quantita[name] ?? "", 10);
  const total = selected.reduce((sum, o) => sum + (qty(o.name) || 0), 0);

  const toggle = (name: string) =>
    setForm((f) => {
      const next = { ...f.quantita };
      if (name in next) delete next[name];
      else next[name] = "1";
      return { ...f, quantita: next };
    });

  const setQty = (name: string, value: string) =>
    setForm((f) => ({ ...f, quantita: { ...f.quantita, [name]: value.replace(/\D/g, "") } }));

  const stepQty = (name: string, delta: number) =>
    setQty(name, String(Math.max(1, (qty(name) || 0) + delta)));

  const step1Done =
    selected.length > 0 && selected.every((o) => qty(o.name) >= 1) && form.destinazione !== "";
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
      gsap.set(panel, { xPercent: 100, visibility: "visible" });
      gsap.to(scrim, { autoAlpha: 1, duration: d * 0.7, ease: "power2.out" });
      gsap.to(panel, { xPercent: 0, duration: d, ease: "power3.out" });
      return;
    }

    // Chiusa: fuori schermo, senza animare al primo render. E nascosta: appena
    // oltre il bordo la sua ombra sbordava nella pagina come una striscia grigia,
    // e col Tab si finiva nei campi di un modulo che non si vede.
    gsap.set(panel, { xPercent: 100, visibility: "hidden" });
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
      setForm(initial());
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
                  <legend className={styles.legend}>
                    {options.length > 1 ? "Scegli i modelli" : "Modello"}
                  </legend>
                  {options.length > 1 && (
                    <p className={styles.hint}>
                      Puoi sceglierne più di uno: per ciascuno indichi la quantità.
                    </p>
                  )}
                  <div className={styles.cards}>
                    {options.map((o) => {
                      const on = o.name in form.quantita;
                      return (
                        <button
                          key={o.name}
                          type="button"
                          className={`${styles.card} ${on ? styles.cardOn : ""}`}
                          aria-pressed={on}
                          onClick={() => toggle(o.name)}
                        >
                          <span className={styles.tick} aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M5 12.5 10 17.5 19 7" />
                            </svg>
                          </span>
                          <span className={styles.cardName}>{o.name}</span>
                          {o.desc && <span className={styles.cardMeta}>{o.desc}</span>}
                          {/* Le dimensioni arrivano già con le unità ("… mm · 22,5 kg"). */}
                          {o.dims && <span className={styles.cardMeta}>{o.dims}</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Una riga per modello scelto: nome, contatore, e la × per
                    toglierlo senza doverlo ricercare fra le schede. */}
                {selected.length > 0 && (
                  <fieldset className={styles.group}>
                    <legend className={styles.legend}>
                      {selected.length > 1 ? "Quantità per modello" : "Quantità"}
                    </legend>
                    <ul className={styles.qtyList}>
                      {selected.map((o) => {
                        const n = qty(o.name);
                        return (
                          <li key={o.name} className={styles.qtyRow}>
                            <span className={styles.qtyName}>{o.name}</span>
                            <span className={styles.stepper}>
                              <button
                                type="button"
                                onClick={() => stepQty(o.name, -1)}
                                disabled={!(n > 1)}
                                aria-label={`Diminuisci la quantità di ${o.name}`}
                              >
                                −
                              </button>
                              <input
                                className={styles.qtyInput}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.quantita[o.name]}
                                onChange={(e) => setQty(o.name, e.target.value)}
                                aria-label={`Quantità di ${o.name}`}
                                aria-invalid={!(n >= 1)}
                              />
                              <button
                                type="button"
                                onClick={() => stepQty(o.name, 1)}
                                aria-label={`Aumenta la quantità di ${o.name}`}
                              >
                                +
                              </button>
                            </span>
                            {options.length > 1 && (
                              <button
                                type="button"
                                className={styles.qtyRemove}
                                onClick={() => toggle(o.name)}
                                aria-label={`Togli ${o.name} dalla richiesta`}
                              >
                                ×
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {selected.length > 1 && (
                      <p className={styles.qtyTotal}>
                        {selected.length} modelli · {total} pezzi in tutto
                      </p>
                    )}
                  </fieldset>
                )}

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
