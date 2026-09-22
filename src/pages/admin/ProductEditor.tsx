/* Il modulo di un prodotto: gli stessi campi che la scheda pubblica mostra,
   nello stesso ordine in cui si leggono sul sito. */

import { CATEGORIES, SECTORS, type CatalogProduct, type CategoryKey, type SectorKey } from "../../data/products";
import { CatalogField, ChipList, DatasheetsField, Field, ImageField, LineList, ModelsField } from "./fields";
import styles from "./Admin.module.css";

type Props = {
  product: CatalogProduct;
  /** Gli altri codici già in uso: servono a non crearne due uguali. */
  taken: string[];
  onChange: (next: CatalogProduct) => void;
  onDelete: () => void;
  onBack: () => void;
};

export default function ProductEditor({ product, taken, onChange, onDelete, onBack }: Props) {
  const set = <K extends keyof CatalogProduct>(key: K, value: CatalogProduct[K]) =>
    onChange({ ...product, [key]: value });

  const cat = CATEGORIES.find((c) => c.key === product.category);
  const clash = taken.includes(product.id);

  return (
    <div className={styles.editor}>
      <header className={styles.editorHead}>
        <button type="button" className={styles.back} onClick={onBack}>
          ← Tutti i prodotti
        </button>
        <span className={styles.crumb} style={{ "--cat": cat?.color } as React.CSSProperties}>
          {cat?.label}
        </span>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Il prodotto</h2>

          <Field label="Titolo" hint="Come appare nel menu, nel catalogo e in cima alla scheda.">
            <input
              className={styles.input}
              value={product.name}
              placeholder="Es. Moduli Sonnenkraft"
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          <Field
            label="Indirizzo della pagina"
            hint="Cambiarlo cambia il link: chi aveva salvato il vecchio non lo trova più."
          >
            <span className={styles.slug}>
              <span>/prodotti/</span>
              <input
                className={styles.input}
                value={product.id}
                onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            </span>
          </Field>
          {clash && <p className={styles.error}>Questo indirizzo è già usato da un altro prodotto.</p>}

          <Field label="Categoria" hint="Decide il colore, l'icona e dove finisce nel menu.">
            <select
              className={styles.input}
              value={product.category}
              onChange={(e) => set("category", e.target.value as CategoryKey)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tag" hint="Con quali filtri del catalogo compare.">
            <span className={styles.toggles}>
              {SECTORS.map((s) => {
                const on = product.sectors.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
                    aria-pressed={on}
                    onClick={() =>
                      set(
                        "sectors",
                        on
                          ? product.sectors.filter((k) => k !== s.key)
                          : ([...product.sectors, s.key] as SectorKey[]),
                      )
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </span>
          </Field>

          <Field
            label="Scheda pubblicata"
            hint="Pubblicata: entra nel catalogo con una pagina sua. Non pubblicata: resta una voce di gamma nel menu, che porta al catalogo."
          >
            <span className={styles.toggles}>
              <button
                type="button"
                className={`${styles.toggle} ${product.published ? styles.toggleOn : ""}`}
                aria-pressed={product.published}
                onClick={() => set("published", !product.published)}
              >
                {product.published ? "Pubblicata" : "Solo nel menu"}
              </button>
            </span>
          </Field>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Foto</h2>
          <ImageField value={product.image} onChange={(v) => set("image", v)} />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Descrizione</h2>

          <Field label="Cos'è" hint="Due o tre righe: cosa fa il prodotto e per chi.">
            <textarea
              className={styles.textarea}
              rows={5}
              value={product.intro ?? ""}
              placeholder="Moduli ad alta efficienza per impianti residenziali e industriali…"
              onChange={(e) => set("intro", e.target.value)}
            />
          </Field>

          <Field label="Caratteristiche" hint="Parole singole. Invio o virgola per aggiungerle.">
            <ChipList
              value={product.highlights ?? []}
              onChange={(v) => set("highlights", v)}
              placeholder="Es. half-cut"
            />
          </Field>

          <Field label="In evidenza" hint="Frasi intere, una per riga.">
            <LineList
              value={product.points ?? []}
              onChange={(v) => set("points", v)}
              placeholder="Es. Garanzia prodotto fino a 30 anni"
            />
          </Field>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Modelli</h2>
          <p className={styles.cardNote}>
            Compaiono nella scheda come tabella e nella richiesta di preventivo come elenco fra cui
            scegliere. La prima colonna è il nome del modello.
          </p>
          <ModelsField value={product.models} onChange={(v) => set("models", v)} />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Documenti</h2>

          <Field label="Schede tecniche">
            <DatasheetsField
              value={product.datasheets ?? []}
              onChange={(v) => set("datasheets", v)}
            />
          </Field>

          <Field label="Catalogo del prodotto" hint="Facoltativo: un PDF dedicato a questo prodotto.">
            <CatalogField value={product.catalogFile} onChange={(v) => set("catalogFile", v)} />
          </Field>
        </section>

        <section className={`${styles.card} ${styles.danger}`}>
          <h2 className={styles.cardTitle}>Elimina</h2>
          <p className={styles.cardNote}>
            Il prodotto sparisce da catalogo e menu. Le foto e i PDF caricati restano nel sito.
          </p>
          <button type="button" className={styles.dropBtn} onClick={onDelete}>
            Elimina questo prodotto
          </button>
        </section>
      </div>
    </div>
  );
}
