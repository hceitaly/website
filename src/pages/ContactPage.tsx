import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import PixelLiquidBg from "../components/PixelLiquidBg";
import { COMPANY } from "../data/content";
import {
  CONTACT_CLAIMS,
  CONTACT_FORMS,
  DEPARTMENTS,
  type FieldDef,
  type FormDef,
} from "../data/contacts";
import { useReveal } from "../hooks/useReveal";
import { scrollToTarget } from "../hooks/useSmoothScroll";
import styles from "./ContactPage.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ============================================================
   Contatti — la pagina è divisa in due, come il riferimento.

   A sinistra un pannello fermo: il fondo liquido della home e
   una giostra di frasi che gira di continuo, per conto suo.
   A destra il titolo, la sede, i reparti e i tre moduli.
   ============================================================ */

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Il numero come lo compone il telefono, non come lo si legge. */
const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** La sede su Google Maps: ci si arriva dall'indirizzo stesso. */
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${COMPANY.name} ${COMPANY.address}`,
)}`;

/* ---------------- Il pannello di sinistra ---------------- */

/* Lo stesso fluido dell'apertura di Chi Siamo, virato sull'azzurro del
   marchio: il pannello è mezza pagina, e da solo deve reggere il colore. */
const SIDE_PALETTE = ["#f2efea", "#e3e9f2", "#a8cdec", "#2fa1e0", "#2233a6"];
const SIDE_BG = "#f2efea";

/** Velocità della giostra di frasi, in pixel al secondo. */
const CLAIM_SPEED = 26;

function Side() {
  const listRef = useRef<HTMLDivElement>(null);
  const [noMotion] = useState(reduced);

  /* Le frasi girano da sole, di continuo, mentre il pannello resta fermo:
     la colonna è scritta due volte e sale di una copia intera, poi riparte
     da capo — il salto non si vede perché quello che arriva è identico a
     quello che se ne va. La durata si ricava dall'altezza, così la velocità
     è la stessa su ogni schermo. */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || reduced()) return;

    let tween: gsap.core.Tween | undefined;
    const build = () => {
      tween?.kill();
      const copy = list.scrollHeight / 2; // una delle due copie
      if (copy <= 0) return;
      gsap.set(list, { y: 0 });
      tween = gsap.to(list, {
        y: -copy,
        duration: copy / CLAIM_SPEED,
        ease: "none",
        repeat: -1,
      });
    };

    // Il testo rifluisce quando la finestra cambia: la corsa va rifatta
    // sulla nuova altezza, o il punto di ripartenza non torna più.
    const ro = new ResizeObserver(build);
    ro.observe(list);

    return () => {
      ro.disconnect();
      tween?.kill();
    };
  }, []);

  return (
    <aside className={styles.side}>
      <div className={styles.sideCanvas} aria-hidden="true">
        <PixelLiquidBg
          palette={SIDE_PALETTE}
          bgColor={SIDE_BG}
          pixelSize={16}
          resolution={0.4}
          mouseForce={9}
          cursorSize={110}
          autoDemo={!noMotion}
        />
      </div>

      <div className={styles.sideMask}>
        {/* Due copie di seguito: la seconda serve solo a coprire il ritorno,
            e per chi legge con la voce sintetica sarebbe un doppione. */}
        <div className={styles.sideList} ref={listRef}>
          {[...CONTACT_CLAIMS, ...CONTACT_CLAIMS].map((claim, i) => (
            <div
              key={i}
              className={styles.claimBlock}
              aria-hidden={i >= CONTACT_CLAIMS.length ? "true" : undefined}
            >
              <span className={styles.sep} aria-hidden="true">
                <span className={styles.sepLine} />
                <span className={styles.sepDash} />
                <span className={styles.sepLine} />
              </span>
              <p className={styles.claim}>{claim}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Il titolo ---------------- */

function Head() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    let split: SplitText | undefined;
    const ctx = gsap.context(() => {
      const title = el.querySelector<HTMLElement>("[data-title]");
      if (!title) return;
      split = new SplitText(title, { type: "chars", mask: "chars" });
      // Il ritardo lascia finire la tendina della transizione fra pagine.
      gsap.from(split.chars, {
        yPercent: 115,
        duration: 0.8,
        ease: "power3.out",
        stagger: { amount: 0.4 },
        delay: 0.35,
      });
    }, el);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <header className={styles.head} ref={ref}>
      <h1 className={styles.title} data-title>
        Contatti
      </h1>
      <span className={styles.notch} aria-hidden="true" />
    </header>
  );
}

/* ---------------- I numeri da chiamare ---------------- */

function Lines() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section className={styles.block} ref={ref} aria-label="Sede e numeri utili">
      {/* La sede apre la sezione: chi passa di persona deve trovarla subito. */}
      <div className={styles.place} data-reveal>
        <span className={styles.label}>Sede</span>
        {/* L'indirizzo è lui stesso il link alla mappa: nessun colore a
            parte, solo la riga che compare al passaggio del mouse. */}
        <a className={styles.placeText} href={MAP_URL} target="_blank" rel="noreferrer">
          {COMPANY.name}
          <br />
          {COMPANY.address}
        </a>
        <a className={styles.placeMail} href={`mailto:${COMPANY.email}`}>
          {COMPANY.email}
        </a>
      </div>

      <div className={styles.depts}>
        {DEPARTMENTS.map((d) => (
          <article key={d.key} className={styles.dept} data-reveal>
            <div className={styles.deptMain}>
              <h3 className={styles.deptName}>{d.name}</h3>
              <p className={styles.deptText}>{d.text}</p>
            </div>

            <div className={styles.deptLines}>
              <a className={styles.phone} href={tel(d.phone)}>
                <span className={styles.phoneNumber}>{d.phone}</span>
              </a>
              <a className={styles.deptMail} href={`mailto:${d.email}`}>
                {d.email}
              </a>
              <span className={styles.hours}>{d.hours}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- I tre moduli ---------------- */

/** Vuoto per tutti i campi del modulo: cambiando scheda si riparte da qui. */
const empty = (def: FormDef) =>
  Object.fromEntries(def.fields.map((f) => [f.name, ""])) as Record<string, string>;

/** "/contatti#lavora-con-noi" apre già il modulo giusto; senza ancora si
 *  parte dalla sola domanda, e il modulo arriva dopo la scelta. */
function tabFromHash(): number | null {
  if (typeof window === "undefined") return null;
  const id = window.location.hash.replace("#", "");
  const i = CONTACT_FORMS.findIndex((f) => f.id === id);
  return i < 0 ? null : i;
}

function Field({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `f-${def.name}`;
  return (
    <div className={`${styles.field} ${def.wide ? styles.wide : ""}`}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {def.label}
        {def.required && <span aria-hidden="true"> *</span>}
      </label>
      {def.type === "textarea" ? (
        <textarea
          id={id}
          className={`${styles.input} ${styles.area}`}
          placeholder={def.placeholder}
          required={def.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input
          id={id}
          className={styles.input}
          type={def.type ?? "text"}
          placeholder={def.placeholder}
          required={def.required}
          autoComplete={def.autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function Forms() {
  const ref = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(tabFromHash);
  const def = active === null ? null : CONTACT_FORMS[active];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const i = tabFromHash();
    return i === null ? {} : empty(CONTACT_FORMS[i]);
  });
  const [choice, setChoice] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend =
    privacy &&
    def !== null &&
    def.fields.every((f) => !f.required || (values[f.name] ?? "").trim() !== "");

  /* Arrivo con l'ancora: la scheda è già quella giusta, resta da portarci
     la pagina — lo scorrimento è di Lenis, il salto del browser non basta. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !window.location.hash) return;
    const id = window.location.hash.replace("#", "");
    if (!CONTACT_FORMS.some((f) => f.id === id)) return;
    const t = window.setTimeout(() => scrollToTarget(el, -80), 600);
    return () => window.clearTimeout(t);
  }, []);

  /* Cambio scheda: i campi nuovi entrano dal basso, come le tendine del
     preventivo. Vale anche per la conferma di invio. */
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || reduced()) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-slide]", {
        y: 26,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    }, body);

    return () => ctx.revert();
  }, [active, sent]);

  /** Ripulisce il modulo: al cambio di scheda e dopo un invio riuscito. */
  const reset = (i: number) => {
    setActive(i);
    setValues(empty(CONTACT_FORMS[i]));
    setChoice("");
    setPrivacy(false);
    setSent(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSent(true); // segnaposto — da collegare a un servizio reale
  };

  return (
    <section className={styles.forms} ref={ref} id="moduli" aria-label="Scrivici">
      <span className={styles.label}>Scrivici</span>
      <h2 className={styles.blockTitle}>Di cosa hai bisogno?</h2>

      {/* La domanda si risponde qui: finché non si sceglie, sotto non c'è
          nulla. Il bottone scelto resta pieno, gli altri si riempiono al
          passaggio del mouse — la stessa tendina dei bottoni del menu. */}
      <div className={styles.tabs} role="tablist" aria-label="Tipo di richiesta">
        {CONTACT_FORMS.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            id={`tab-${f.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${f.id}`}
            className={`${styles.tab} ${i === active ? styles.tabOn : ""}`}
            onClick={() => i !== active && reset(i)}
          >
            <span className={styles.tabFill} aria-hidden="true" />
            <span className={styles.tabLabel}>{f.tab}</span>
          </button>
        ))}
      </div>

      {def !== null && (
        <div
          className={styles.panel}
          ref={bodyRef}
          role="tabpanel"
          id={`panel-${def.id}`}
          aria-labelledby={`tab-${def.id}`}
        >
          {sent ? (
            <div className={styles.done} data-slide role="status">
              <span className={styles.doneMark} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5 10 17.5 19 7" />
                </svg>
              </span>
              <h3 className={styles.doneTitle}>{def.done}</h3>
              <p className={styles.doneText}>
                Grazie {(values.nome ?? "").split(" ")[0]}. Se nel frattempo ti serve
                una risposta subito, chiama il {COMPANY.phone}.
              </p>
              <button
                type="button"
                className={styles.again}
                onClick={() => reset(active ?? 0)}
              >
                Invia un&apos;altra richiesta
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={submit} data-slide>
              <div className={styles.intro}>
                <h3 className={styles.formTitle}>{def.title}</h3>
                <p className={styles.formText}>{def.text}</p>
              </div>

              <div className={styles.grid}>
                {def.choice && (
                  <fieldset className={`${styles.field} ${styles.wide}`}>
                    <legend className={styles.fieldLabel}>{def.choice.label}</legend>
                    <div className={styles.chips}>
                      {def.choice.options.map((o) => (
                        <button
                          key={o}
                          type="button"
                          className={`${styles.chip} ${choice === o ? styles.chipOn : ""}`}
                          aria-pressed={choice === o}
                          onClick={() => setChoice(choice === o ? "" : o)}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {def.fields.map((f) => (
                  <Field
                    key={f.name}
                    def={f}
                    value={values[f.name] ?? ""}
                    onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
                  />
                ))}
              </div>

              <div className={styles.foot}>
                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                  />
                  <span>
                    Ho letto la <a href="#privacy">Privacy Policy</a> e acconsento al
                    trattamento dei dati per rispondere alla richiesta. *
                  </span>
                </label>

                <button type="submit" className={styles.cta} disabled={!canSend}>
                  <span className={styles.ctaFill} aria-hidden="true" />
                  {def.cta}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------- Pagina ---------------- */

export default function ContactPage() {
  return (
    <main className={styles.page} data-nav-theme="light">
      <div className={styles.split}>
        <Side />

        <div className={styles.main}>
          <Head />
          <Lines />
          <Forms />
        </div>
      </div>
    </main>
  );
}
