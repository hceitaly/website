import { useRef, useState } from "react";
import { CATEGORY_BY_KEY, type CatalogProduct } from "../data/products";
import { openCart, setProductLines, useCart } from "../lib/cart";
import { useSlideIn } from "../hooks/useSlideIn";
import Drawer, { Stepper, Tick } from "./Drawer";
import styles from "./Drawer.module.css";

type Props = {
  product: CatalogProduct;
  open: boolean;
  onClose: () => void;
};

/** Modelli scelti, ciascuno con la sua quantità. La quantità resta testo
    finché si scrive: un campo svuotato per essere riscritto non deve far
    sparire il modello dalla scelta. */
type Quantities = Record<string, string>;

/** Il primo passo del preventivo, dalla scheda: quali modelli e quanti. La
    scelta finisce nella richiesta, che raccoglie i prodotti di più schede e
    si invia tutta insieme dalla tendina della barra in alto. */
export default function QuoteDrawer({ product, open, onClose }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

  /* Gli stessi modelli della scheda: chi chiede il preventivo sceglie fra le
     righe della tabella. Senza tabella resta un'unica voce, il prodotto. */
  const options = (product.models?.rows ?? [[product.name, "", ""]]).map((row) => ({
    name: row[0],
    desc: row[1] ?? "",
    dims: row[2] ?? "",
  }));

  const inCart = cart.filter((l) => l.productId === product.id);

  /** Si riparte da quello che è già nella richiesta, così riaprire la tendina
      corregge le quantità invece di sommarle. Con un solo modello non c'è
      niente da scegliere: è già selezionato. */
  const initial = (): Quantities =>
    inCart.length > 0
      ? Object.fromEntries(inCart.map((l) => [l.model, String(l.qty)]))
      : options.length === 1
        ? { [options[0].name]: "1" }
        : {};

  const [quantita, setQuantita] = useState<Quantities>(initial);
  const [added, setAdded] = useState(false);
  /** Ricorda se all'apertura il prodotto era già nella richiesta: dopo il
      salvataggio lo è comunque, e il testo della conferma cambierebbe. */
  const [wasInCart, setWasInCart] = useState(inCart.length > 0);

  /* La tendina resta montata anche chiusa: ogni apertura riparte dalla
     richiesta com'è adesso, che nel frattempo può essere cambiata altrove. */
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuantita(initial());
      setAdded(false);
      setWasInCart(inCart.length > 0);
    }
  }

  const cat = CATEGORY_BY_KEY[product.category];

  // Nell'ordine della tabella, non in quello in cui sono stati cliccati.
  const selected = options.filter((o) => o.name in quantita);
  const qty = (name: string) => Number.parseInt(quantita[name] ?? "", 10);
  const total = selected.reduce((sum, o) => sum + (qty(o.name) || 0), 0);

  const toggle = (name: string) =>
    setQuantita((q) => {
      const next = { ...q };
      if (name in next) delete next[name];
      else next[name] = "1";
      return next;
    });

  const setQty = (name: string, value: string) =>
    setQuantita((q) => ({ ...q, [name]: value.replace(/\D/g, "") }));

  const stepQty = (name: string, delta: number) =>
    setQty(name, String(Math.max(1, (qty(name) || 0) + delta)));

  const canAdd = selected.length > 0 && selected.every((o) => qty(o.name) >= 1);

  useSlideIn(bodyRef, added ? "added" : "choose", !added, open);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    setProductLines(
      product.id,
      product.name,
      selected.map((o) => ({ model: o.name, qty: qty(o.name) })),
    );
    setAdded(true);
  };

  const goToCart = () => {
    onClose();
    openCart();
  };

  const count = cart.reduce((sum, l) => sum + l.qty, 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      label={`Richiedi preventivo — ${product.name}`}
      eyebrow={product.name}
      title="Richiedi preventivo"
      color={cat.color}
    >
      <form className={styles.form} onSubmit={add}>
        <div ref={bodyRef} className={styles.body} data-lenis-prevent>
          {added ? (
            <div className={styles.done} data-slide role="status">
              <span className={styles.doneMark} aria-hidden="true">
                <Tick />
              </span>
              <h3 className={styles.doneTitle}>
                {wasInCart ? "Richiesta aggiornata" : "Aggiunto alla richiesta"}
              </h3>
              <p className={styles.doneText}>
                {selected.length > 1
                  ? `${selected.length} modelli di ${product.name}, ${total} pezzi in tutto.`
                  : `${total} × ${selected[0]?.name ?? product.name}.`}{" "}
                Puoi aggiungere altri prodotti e inviare tutto insieme, oppure inviare la
                richiesta adesso.
              </p>
            </div>
          ) : (
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
                    const on = o.name in quantita;
                    return (
                      <button
                        key={o.name}
                        type="button"
                        className={`${styles.card} ${on ? styles.cardOn : ""}`}
                        aria-pressed={on}
                        onClick={() => toggle(o.name)}
                      >
                        <span className={styles.tick} aria-hidden="true">
                          <Tick />
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
                    {selected.map((o) => (
                      <li key={o.name} className={styles.qtyRow}>
                        <span className={styles.qtyName}>{o.name}</span>
                        <Stepper
                          label={o.name}
                          value={quantita[o.name]}
                          onChange={(v) => setQty(o.name, v)}
                          onStep={(d) => stepQty(o.name, d)}
                        />
                        {options.length > 1 && (
                          <button
                            type="button"
                            className={styles.qtyRemove}
                            onClick={() => toggle(o.name)}
                            aria-label={`Togli ${o.name} dalla scelta`}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {selected.length > 1 && (
                    <p className={styles.qtyTotal}>
                      {selected.length} modelli · {total} pezzi in tutto
                    </p>
                  )}
                </fieldset>
              )}
            </div>
          )}
        </div>

        <div className={styles.foot}>
          {added ? (
            <>
              <button type="button" className={styles.back} onClick={onClose}>
                Continua a sfogliare
              </button>
              <button type="button" className={styles.cta} onClick={goToCart}>
                <span className={styles.ctaFill} aria-hidden="true" />
                Vai alla richiesta{count > 0 ? ` (${count})` : ""}
              </button>
            </>
          ) : (
            <button type="submit" className={styles.cta} disabled={!canAdd}>
              <span className={styles.ctaFill} aria-hidden="true" />
              {inCart.length > 0 ? "Aggiorna la richiesta" : "Aggiungi alla richiesta"}
            </button>
          )}
        </div>
      </form>
    </Drawer>
  );
}
