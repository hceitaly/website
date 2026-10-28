import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CATALOG, CATEGORY_BY_KEY, PLACEHOLDER_IMAGE } from "../data/products";
import { COMPANY } from "../data/content";
import { SALES_REPS } from "../data/contacts";
import {
  clearCart,
  closeCart,
  removeLine,
  setLineQty,
  useCart,
  useCartOpen,
  REQUEST_HINT,
  type CartLine,
} from "../lib/cart";
import { useSlideIn } from "../hooks/useSlideIn";
import Drawer, { Stepper, Tick } from "./Drawer";
import styles from "./Drawer.module.css";

type Contact = {
  destinazione: string;
  /** Il commerciale a cui va la richiesta: una chiave di SALES_REPS. */
  commerciale: string;
  nome: string;
  telefono: string;
  email: string;
  azienda: string;
  installazione: "si" | "no" | "";
  privacy: boolean;
  marketing: boolean;
};

const EMPTY: Contact = {
  destinazione: "",
  commerciale: "",
  nome: "",
  telefono: "",
  email: "",
  azienda: "",
  installazione: "",
  privacy: false,
  marketing: false,
};

const lineKey = (l: CartLine) => `${l.productId}\u0000${l.model}`;

/** Le bozze senza quella di una riga: il campo torna a mostrare la quantità
    salvata. */
const without = (key: string) => (d: Record<string, string>) => {
  const next = { ...d };
  delete next[key];
  return next;
};

/** La richiesta di preventivo: i prodotti messi da parte nelle schede, la
    destinazione e i dati di chi scrive. Si apre dalla barra in alto o dalla
    conferma di una scheda, e parte tutta in un solo invio. */
export default function CartDrawer() {
  const open = useCartOpen();
  const lines = useCart();
  const bodyRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Contact>(EMPTY);
  const [sent, setSent] = useState(false);
  /** Letto alla chiusura, che non deve cambiare a ogni invio: la tendina
      rifarebbe il giro del fuoco. */
  const sentRef = useRef(false);
  useEffect(() => {
    sentRef.current = sent;
  }, [sent]);
  /** Quantità in corso di scrittura: un campo svuotato per riscriverlo resta
      vuoto qui, senza togliere la riga dalla richiesta. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const set = <K extends keyof Contact>(key: K, value: Contact[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* Le righe raggruppate per scheda, nell'ordine in cui sono entrate. */
  const groups: { productId: string; productName: string; lines: CartLine[] }[] = [];
  for (const l of lines) {
    const g = groups.find((x) => x.productId === l.productId);
    if (g) g.lines.push(l);
    else groups.push({ productId: l.productId, productName: l.productName, lines: [l] });
  }
  const pieces = lines.reduce((sum, l) => sum + l.qty, 0);

  const writeQty = (l: CartLine, raw: string) => {
    const value = raw.replace(/\D/g, "");
    const n = Number.parseInt(value, 10);
    const key = lineKey(l);
    if (n >= 1) {
      setLineQty(l.productId, l.model, n);
      setDrafts(without(key));
    } else {
      setDrafts((d) => ({ ...d, [key]: value }));
    }
  };

  const stepQty = (l: CartLine, delta: number) => {
    const key = lineKey(l);
    setDrafts(without(key));
    setLineQty(l.productId, l.model, Math.max(1, l.qty + delta));
  };

  const remove = (l: CartLine) => {
    const key = lineKey(l);
    setDrafts(without(key));
    removeLine(l.productId, l.model);
  };

  const step1Done =
    lines.length > 0 && Object.keys(drafts).length === 0 && form.destinazione.trim() !== "" &&
    form.commerciale !== "";
  const canSend = form.nome.trim() !== "" && form.email.trim() !== "" && form.privacy;

  const empty = lines.length === 0 && !sent;
  useSlideIn(bodyRef, sent ? "sent" : empty ? "empty" : step, step === 0 && !sent, open);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || lines.length === 0) return;
    // segnaposto — qui partirà l'invio a /api/richiesta (HubSpot)
    setSent(true);
    clearCart();
  };

  const close = useCallback(() => {
    closeCart();
    // Ripulisce dopo l'uscita, così la tendina non "sfarfalla" mentre esce.
    window.setTimeout(() => {
      setStep(0);
      setDrafts({});
      // Dopo un invio si riparte da zero; altrimenti i dati restano, per chi
      // chiude un momento e torna ad aggiungere un prodotto.
      if (sentRef.current) setForm(EMPTY);
      setSent(false);
    }, 450);
  }, []);

  return (
    <Drawer
      open={open}
      onClose={close}
      label="La tua richiesta di preventivo"
      eyebrow={
        sent || empty
          ? "Preventivo"
          : `${groups.length} ${groups.length === 1 ? "prodotto" : "prodotti"} · ${pieces} pezzi`
      }
      title="La tua richiesta"
      color="var(--hce-blue)"
    >
      {!sent && !empty && (
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
                <Tick />
              </span>
              <h3 className={styles.doneTitle}>Richiesta inviata</h3>
              <p className={styles.doneText}>
                Grazie, {form.nome.trim().split(" ")[0]}. Ti ricontattiamo al più presto con il
                preventivo.
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
          ) : empty ? (
            <div className={styles.done} data-slide>
              <h3 className={styles.doneTitle}>La richiesta è vuota</h3>
              <p className={styles.doneText}>
                Apri la scheda di un prodotto e scegli &ldquo;Richiedi preventivo&rdquo;: i
                modelli che aggiungi si raccolgono qui, e li invii tutti insieme.
              </p>
              <a className={styles.ambassadorCta} href="/prodotti">
                <span className={styles.ambassadorFill} aria-hidden="true" />
                Sfoglia i prodotti
              </a>
            </div>
          ) : step === 0 ? (
            <div className={styles.slide} data-slide>
              <p className={styles.hint}>{REQUEST_HINT}</p>
              <ul className={styles.items}>
                {groups.map((g) => {
                  const product = CATALOG.find((p) => p.id === g.productId);
                  const cat = product ? CATEGORY_BY_KEY[product.category] : undefined;
                  const src = product
                    ? (product.image ?? PLACEHOLDER_IMAGE[product.category])
                    : undefined;
                  return (
                    <li
                      key={g.productId}
                      className={styles.item}
                      style={cat ? ({ "--item": cat.color } as CSSProperties) : undefined}
                    >
                      <div className={styles.itemHead}>
                        {src && (
                          <img
                            className={styles.thumb}
                            src={src}
                            alt=""
                            style={{ objectFit: product?.fit ?? "cover" }}
                            loading="lazy"
                          />
                        )}
                        <div>
                          {cat && <span className={styles.itemCat}>{cat.label}</span>}
                          {product ? (
                            <a className={styles.itemName} href={`/prodotti/${product.id}`}>
                              {g.productName}
                            </a>
                          ) : (
                            <span className={styles.itemName}>{g.productName}</span>
                          )}
                        </div>
                      </div>

                      <ul className={styles.qtyList}>
                        {g.lines.map((l) => (
                          <li key={l.model} className={styles.qtyRow}>
                            <span className={styles.qtyName}>{l.model}</span>
                            <Stepper
                              label={l.model}
                              value={drafts[lineKey(l)] ?? String(l.qty)}
                              onChange={(v) => writeQty(l, v)}
                              onStep={(d) => stepQty(l, d)}
                            />
                            <button
                              type="button"
                              className={styles.qtyRemove}
                              onClick={() => remove(l)}
                              aria-label={`Togli ${l.model} dalla richiesta`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>

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

              <label className={styles.field}>
                <span className={styles.legend}>Commerciale di riferimento</span>
                <select
                  className={`${styles.input} ${styles.select}`}
                  value={form.commerciale}
                  onChange={(e) => set("commerciale", e.target.value)}
                >
                  <option value="" disabled>
                    Scegli a chi inviare la richiesta
                  </option>
                  {SALES_REPS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name} — {r.area}
                    </option>
                  ))}
                </select>
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
                          <Tick />
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

        {!sent && !empty && (
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
    </Drawer>
  );
}
