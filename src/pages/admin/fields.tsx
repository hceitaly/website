/* I mattoni del modulo.

   Ogni campo del prodotto ha la sua forma — una parola sola, una frase per
   riga, una tabella, un file — e ognuno qui è un pezzo a sé che sa solo
   leggere un valore e restituirne uno nuovo. La pagina li mette in fila. */

import { useId, useRef, useState, type ReactNode } from "react";
import { uploadFile, type UploadKind } from "./api";
import type { Datasheet, ModelTable } from "../../data/products";
import styles from "./Admin.module.css";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------
   Caratteristiche — parole singole, una per pastiglia
   ------------------------------------------------------------------ */

export function ChipList({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const word = draft.trim();
    // Niente doppioni: due pastiglie uguali sono un errore di battitura.
    if (word && !value.includes(word)) onChange([...value, word]);
    setDraft("");
  };

  return (
    <div className={styles.chips}>
      {value.map((word) => (
        <span key={word} className={styles.chip}>
          {word}
          <button
            type="button"
            onClick={() => onChange(value.filter((w) => w !== word))}
            aria-label={`Togli ${word}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className={styles.chipInput}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        // Invio aggiunge senza spedire il modulo; la virgola fa lo stesso,
        // perché è così che si scrive un elenco di getto.
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   In evidenza — una frase per riga
   ------------------------------------------------------------------ */

export function LineList({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const set = (i: number, text: string) => onChange(value.map((v, j) => (j === i ? text : v)));

  return (
    <div className={styles.lines}>
      {value.map((line, i) => (
        <div key={i} className={styles.line}>
          <input
            className={styles.input}
            value={line}
            placeholder={placeholder}
            onChange={(e) => set(i, e.target.value)}
          />
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={`Togli la riga ${i + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className={styles.addBtn} onClick={() => onChange([...value, ""])}>
        + Aggiungi punto
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   Modelli — la tabella che compare nella scheda e nel preventivo
   ------------------------------------------------------------------ */

/** Colonne di partenza per una tabella nuova: sono quelle che il catalogo usa
    già, e restano modificabili riga per riga. */
const DEFAULT_COLUMNS = ["Modello", "Descrizione", "Dimensioni (mm)", "Spec"];

export function ModelsField({
  value,
  onChange,
}: {
  value: ModelTable | undefined;
  onChange: (next: ModelTable | undefined) => void;
}) {
  const table = value ?? { columns: DEFAULT_COLUMNS, rows: [] };

  const setColumn = (i: number, text: string) =>
    onChange({ ...table, columns: table.columns.map((c, j) => (j === i ? text : c)) });

  const setCell = (r: number, c: number, text: string) =>
    onChange({
      ...table,
      rows: table.rows.map((row, i) => (i === r ? row.map((v, j) => (j === c ? text : v)) : row)),
    });

  const addRow = () => onChange({ ...table, rows: [...table.rows, table.columns.map(() => "")] });

  const addColumn = () =>
    onChange({
      columns: [...table.columns, "Nuova colonna"],
      rows: table.rows.map((r) => [...r, ""]),
    });

  const dropColumn = (i: number) =>
    onChange({
      columns: table.columns.filter((_, j) => j !== i),
      rows: table.rows.map((r) => r.filter((_, j) => j !== i)),
    });

  return (
    <div className={styles.models}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {table.columns.map((col, i) => (
                <th key={i}>
                  <input
                    className={styles.headInput}
                    value={col}
                    onChange={(e) => setColumn(i, e.target.value)}
                    aria-label={`Intestazione colonna ${i + 1}`}
                  />
                  {/* La prima colonna è il nome del modello: è quella che il
                      preventivo propone come scelta, quindi non si toglie. */}
                  {i > 0 && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => dropColumn(i)}
                      aria-label={`Togli la colonna ${col}`}
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {table.columns.map((_, c) => (
                  <td key={c}>
                    <input
                      className={styles.cellInput}
                      value={row[c] ?? ""}
                      onChange={(e) => setCell(r, c, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => onChange({ ...table, rows: table.rows.filter((_, i) => i !== r) })}
                    aria-label={`Togli il modello ${row[0] || r + 1}`}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.tableBtns}>
        <button type="button" className={styles.addBtn} onClick={addRow}>
          + Aggiungi modello
        </button>
        <button type="button" className={styles.addBtn} onClick={addColumn}>
          + Aggiungi colonna
        </button>
        {table.rows.length > 0 && (
          <button type="button" className={styles.dropBtn} onClick={() => onChange(undefined)}>
            Elimina la tabella
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Allegati
   ------------------------------------------------------------------ */

/** Stato comune a tutti i caricamenti: uno per volta, con il suo errore. */
function useUpload(kind: UploadKind) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      return await uploadFile(file, kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento non riuscito.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, send };
}

export function ImageField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}) {
  const id = useId();
  const { busy, error, send } = useUpload("image");

  return (
    <div className={styles.upload}>
      {value ? (
        <figure className={styles.preview}>
          <img src={value} alt="" />
          <figcaption>
            <code>{value}</code>
            <button type="button" className={styles.dropBtn} onClick={() => onChange(undefined)}>
              Togli
            </button>
          </figcaption>
        </figure>
      ) : (
        <p className={styles.empty}>Nessuna foto: il prodotto userà l&apos;immagine della categoria.</p>
      )}

      <input
        id={id}
        type="file"
        accept="image/*"
        className={styles.file}
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const up = await send(file);
          if (up) onChange(up.url);
        }}
      />
      <label htmlFor={id} className={styles.fileBtn} data-busy={busy}>
        {busy ? "Carico…" : value ? "Sostituisci foto" : "Carica foto"}
      </label>
      <span className={styles.hint}>
        Ridotta e convertita in WebP prima dell&apos;invio: puoi caricare la foto del fornitore così com&apos;è.
      </span>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function DatasheetsField({
  value,
  onChange,
}: {
  value: Datasheet[];
  onChange: (next: Datasheet[]) => void;
}) {
  const id = useId();
  const { busy, error, send } = useUpload("datasheet");
  const pending = useRef<string>("");

  return (
    <div className={styles.upload}>
      {value.length > 0 && (
        <ul className={styles.docs}>
          {value.map((doc, i) => (
            <li key={doc.file}>
              <input
                className={styles.input}
                value={doc.label}
                placeholder="Nome del documento"
                onChange={(e) =>
                  onChange(value.map((d, j) => (j === i ? { ...d, label: e.target.value } : d)))
                }
              />
              <span className={styles.docMeta}>PDF · {doc.size ?? "—"}</span>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Togli ${doc.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id={id}
        type="file"
        accept="application/pdf"
        multiple
        className={styles.file}
        disabled={busy}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";

          // Uno per volta, e l'elenco si aggiorna a ogni file: se il quinto
          // fallisce, i primi quattro restano caricati.
          let next = value;
          for (const file of files) {
            pending.current = file.name;
            const up = await send(file);
            if (!up) break;
            next = [
              ...next,
              { label: file.name.replace(/\.pdf$/i, ""), file: up.url, size: up.size },
            ];
            onChange(next);
          }
        }}
      />
      <label htmlFor={id} className={styles.fileBtn} data-busy={busy}>
        {busy ? `Carico ${pending.current}…` : "Aggiungi schede tecniche"}
      </label>
      <span className={styles.hint}>Solo PDF, fino a 3 MB l&apos;uno. Il nome resta modificabile.</span>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function CatalogField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}) {
  const id = useId();
  const { busy, error, send } = useUpload("catalog");

  return (
    <div className={styles.upload}>
      {value ? (
        <p className={styles.docLine}>
          <code>{value}</code>
          <button type="button" className={styles.dropBtn} onClick={() => onChange(undefined)}>
            Togli
          </button>
        </p>
      ) : (
        <p className={styles.empty}>Nessun catalogo dedicato a questo prodotto.</p>
      )}

      <input
        id={id}
        type="file"
        accept="application/pdf"
        className={styles.file}
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const up = await send(file);
          if (up) onChange(up.url);
        }}
      />
      <label htmlFor={id} className={styles.fileBtn} data-busy={busy}>
        {busy ? "Carico…" : value ? "Sostituisci catalogo" : "Carica catalogo"}
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
