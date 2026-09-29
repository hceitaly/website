import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { setScrollLocked } from "../hooks/useSmoothScroll";
import styles from "./Drawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Nome della finestra per i lettori di schermo. */
  label: string;
  eyebrow: ReactNode;
  title: ReactNode;
  /** Colore d'accento: quello della categoria, o il blu del marchio. */
  color: string;
  children: ReactNode;
};

/** Il guscio delle tendine laterali: velo, pannello da destra, testata con la
    ×, Esc per chiudere, fuoco dentro finché è aperta e pagina ferma dietro. Il
    contenuto — slide, modulo, piede — lo mette chi la usa. */
export default function Drawer({ open, onClose, label, eyebrow, title, color, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** Elemento a cui restituire il fuoco alla chiusura. */
  const openerRef = useRef<Element | null>(null);

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

  return (
    <div className={styles.root} aria-hidden={!open}>
      <div ref={scrimRef} className={styles.scrim} onClick={onClose} role="presentation" />

      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ "--cat": color } as CSSProperties}
      >
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Chiudi">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {children}
      </aside>
    </div>
  );
}

/** Spunta usata nelle card selezionabili e nella conferma. */
export function Tick() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

type StepperProps = {
  /** Nome del modello, per le etichette dei bottoni. */
  label: string;
  /** Il testo del campo: può essere vuoto mentre si riscrive. */
  value: string;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
};

/** Contatore − n +: il campo si può anche scrivere, e da vuoto si segna. */
export function Stepper({ label, value, onChange, onStep }: StepperProps) {
  const n = Number.parseInt(value, 10);
  return (
    <span className={styles.stepper}>
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={!(n > 1)}
        aria-label={`Diminuisci la quantità di ${label}`}
      >
        −
      </button>
      <input
        className={styles.qtyInput}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Quantità di ${label}`}
        aria-invalid={!(n >= 1)}
      />
      <button type="button" onClick={() => onStep(1)} aria-label={`Aumenta la quantità di ${label}`}>
        +
      </button>
    </span>
  );
}
