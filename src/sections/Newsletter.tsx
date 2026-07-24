import { useState } from "react";
import styles from "./Newsletter.module.css";

/** Small newsletter CTA — stay updated on regulations & incentives. */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) return;
    setSent(true); // placeholder — wire to a real provider later
  };

  return (
    <section className={styles.news} data-nav-theme="light" aria-label="Iscriviti alla newsletter">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 className={styles.title}>
            Sempre aggiornato
            <br />
            sulle normative.
          </h2>
          <p className={styles.sub}>
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
              <span className={styles.formLabel}>
                Iscriviti alla community — novità, aggiornamenti e normative.
              </span>
              <div className={styles.field}>
                <input
                  type="email"
                  required
                  placeholder="La tua email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  aria-label="La tua email"
                />
                <button type="submit" className={styles.submit} aria-label="Iscriviti">
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              <label className={styles.consent}>
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
