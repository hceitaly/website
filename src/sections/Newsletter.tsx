import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./Newsletter.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Small newsletter CTA — stay updated on regulations & incentives. */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const formLabelRef = useRef<HTMLSpanElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const consentRef = useRef<HTMLLabelElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) return;
    setSent(true); // placeholder — wire to a real provider later
  };

  // First appearance: the title reveals word by word, the copy rises, and the
  // email bar grows out of a circle towards the right.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 76%", once: true },
      });

      if (titleRef.current) {
        split = new SplitText(titleRef.current, { type: "words", mask: "words" });
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        tl.to(
          split.words,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: { amount: 0.5, from: "start" },
          },
          0,
        );
      }

      const rising = [subRef.current, formLabelRef.current, consentRef.current].filter(
        Boolean,
      ) as HTMLElement[];
      if (rising.length) {
        gsap.set(rising, { y: 24, opacity: 0 });
        tl.to(
          rising,
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", stagger: 0.12 },
          0.25,
        );
      }

      // The bar is clipped to a circle at its left end, then opened rightwards.
      // Measured here (post-layout) rather than expressed in calc(), because
      // GSAP can only interpolate plain numbers inside the clip-path string.
      const field = fieldRef.current;
      if (field) {
        const collapsed = Math.max(0, field.offsetWidth - field.offsetHeight);
        gsap.set(field, { clipPath: `inset(0px ${collapsed}px 0px 0px round 999px)` });
        tl.to(
          field,
          {
            clipPath: "inset(0px 0px 0px 0px round 999px)",
            duration: 0.95,
            ease: "power3.inOut",
          },
          0.4,
        );
      }

      // Opacity only — the submit button's transform belongs to CSS (it carries
      // the -50% centring plus the hover nudge).
      if (submitRef.current) {
        gsap.set(submitRef.current, { opacity: 0 });
        tl.to(submitRef.current, { opacity: 1, duration: 0.45, ease: "power2.out" }, 1.15);
      }
    }, section);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [sent]);

  return (
    <section
      ref={sectionRef}
      className={styles.news}
      data-nav-theme="light"
      aria-label="Iscriviti alla newsletter"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 ref={titleRef} className={styles.title}>
            Sempre aggiornato
            <br />
            sulle normative.
          </h2>
          <p ref={subRef} className={styles.sub}>
            Incentivi, aggiornamenti tecnici e novità di settore, direttamente nella tua
            casella.
          </p>
        </div>

        <div className={styles.formCol}>
          {sent ? (
            <p className={styles.thanks} role="status">
              Grazie! Ti terremo aggiornato.
            </p>
          ) : (
            <form className={styles.form} onSubmit={submit} noValidate={false}>
              <span ref={formLabelRef} className={styles.formLabel}>
                Iscriviti alla community — novità, aggiornamenti e normative.
              </span>
              <div ref={fieldRef} className={styles.field}>
                <input
                  type="email"
                  required
                  placeholder="La tua email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  aria-label="La tua email"
                />
                <button
                  ref={submitRef}
                  type="submit"
                  className={styles.submit}
                  aria-label="Iscriviti"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              <label ref={consentRef} className={styles.consent}>
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Inviando la tua email accetti la nostra{" "}
                  <a href="#privacy">Privacy Policy</a>.
                </span>
              </label>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
