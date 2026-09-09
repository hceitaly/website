import { FOOTER_SHORTCUTS } from "../data/navigation";
import { COMPANY, ECOSYSTEM } from "../data/content";
import styles from "./Footer.module.css";

export default function Footer() {
  const tel = `tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`;

  return (
    <footer id="contatti" className={styles.footer}>
      {/* Lead: the promise, then a single call to action. */}
      <div className={styles.lead}>
        <h2 className={styles.headline}>
          Forniture complete per l&apos;energia,
          <br />e un partner su cui contare.
        </h2>
        <a className={styles.cta} href="/contatti">
          Richiedi una consulenza
        </a>
      </div>

      {/* Full-bleed shortcut row, split by vertical rules. */}
      <nav className={styles.shortcuts} aria-label="Collegamenti rapidi">
        {FOOTER_SHORTCUTS.map((link) => (
          <a key={link.href} className={styles.shortcut} href={link.href}>
            <span className={styles.shortcutLabel}>{link.label}</span>
            <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h14M13.5 5.5 20 12l-6.5 6.5" />
            </svg>
          </a>
        ))}
      </nav>

      {/* Thin meta strip: the details the shortcuts don't carry. */}
      <div className={styles.meta}>
        <div className={styles.metaGroups}>
          <div className={styles.metaGroup}>
            <h3 className={styles.metaTitle}>Sede</h3>
            <p className={styles.metaText}>
              {COMPANY.name}
              <br />
              {COMPANY.address}
            </p>
          </div>
          <div className={styles.metaGroup}>
            <h3 className={styles.metaTitle}>Contatti</h3>
            <p className={styles.metaText}>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
              <br />
              <a href={tel}>{COMPANY.phone}</a>
            </p>
          </div>
          <div className={styles.metaGroup}>
            <h3 className={styles.metaTitle}>Ecosistema</h3>
            <p className={styles.metaText}>
              {ECOSYSTEM.map((e) => (
                <span key={e.name}>
                  {e.name}
                  <br />
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className={styles.metaSide}>
          <div className={styles.social}>
            <a
              className={styles.socialBtn}
              href="https://www.linkedin.com"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.96-1.8-2.96-1.8 0-2.08 1.4-2.08 2.86V21H9z" />
              </svg>
            </a>
            <a
              className={styles.socialBtn}
              href="https://www.instagram.com"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.05.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.05.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.17-.42-.37-1.05-.42-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.05-.37 2.23-.42C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.38.19-1.7.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.8-.32 1.7C4.01 8.5 4 8.85 4 12s.01 3.5.07 4.74c.04.9.19 1.38.32 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.8.28 1.7.32 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.7a2.86 2.86 0 00-.69-1.06 2.86 2.86 0 00-1.06-.69c-.32-.13-.8-.28-1.7-.32C15.5 4.01 15.15 4 12 4zm0 3.06A4.94 4.94 0 1112 16.94 4.94 4.94 0 0112 7.06zm0 1.8a3.14 3.14 0 100 6.28 3.14 3.14 0 000-6.28zm5.16-.72a1.15 1.15 0 11-2.3 0 1.15 1.15 0 012.3 0z" />
              </svg>
            </a>
          </div>
          <div className={styles.legal}>
            <a href="#privacy">Privacy Policy</a>
            <a href="#termini">Termini</a>
            <span className={styles.credit}>
              © {new Date().getFullYear()} {COMPANY.name}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
