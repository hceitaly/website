/* Il pannello: entra, sistema il catalogo, pubblica.

   Il catalogo intero sta in memoria mentre si lavora e parte con un solo
   salvataggio — un commit, una ripubblicazione. Finché non si preme "Pubblica"
   non è cambiato niente, né sul sito né nel repository. */

import { useCallback, useEffect, useState } from "react";
import {
  CATEGORIES,
  type CatalogProduct,
  type CategoryKey,
} from "../../data/products";
import { getSession, loadCatalog, login, logout, saveCatalog } from "./api";
import ProductEditor from "./ProductEditor";
import styles from "./Admin.module.css";

/** Codice pagina a partire dal titolo, con la sigla della categoria davanti:
    è la forma che hanno già i prodotti a catalogo (`fv-sonnenkraft`). */
function makeId(name: string, category: CategoryKey, taken: string[]): string {
  const prefix = { fotovoltaico: "fv", inverter: "inv", accumulo: "acc", mobilita: "mob", clima: "cli" }[
    category
  ];
  const base =
    `${prefix}-${name}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || `${prefix}-prodotto`;

  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export default function AdminPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [sha, setSha] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- Sessione e catalogo ---- */

  const fetchCatalog = useCallback(async () => {
    try {
      const data = await loadCatalog();
      setProducts(data.products);
      setSha(data.sha);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Non riesco a leggere il catalogo.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSession();
        setEmail(s.email);
        if (s.email) await fetchCatalog();
      } finally {
        setReady(true);
      }
    })();
  }, [fetchCatalog]);

  /* Una chiusura per sbaglio con il lavoro a metà è la perdita più facile da
     evitare: il browser chiede conferma finché c'è qualcosa da pubblicare. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (next: CatalogProduct[]) => {
    setProducts(next);
    setDirty(true);
    setNote(null);
  };

  /* ---- Comandi della lista ---- */

  const create = (category: CategoryKey) => {
    const id = makeId("nuovo prodotto", category, products.map((p) => p.id));
    const product: CatalogProduct = {
      id,
      name: "Nuovo prodotto",
      category,
      sectors: [],
      published: false,
    };
    edit([...products, product]);
    setEditing(id);
  };

  /** Sposta il prodotto sopra o sotto il vicino **della stessa categoria**:
      è quello l'ordine che si vede, nella colonna del menu. */
  const move = (id: string, dir: -1 | 1) => {
    const i = products.findIndex((p) => p.id === id);
    if (i < 0) return;

    const step = dir === -1 ? -1 : 1;
    let j = i + step;
    while (j >= 0 && j < products.length && products[j].category !== products[i].category) j += step;
    if (j < 0 || j >= products.length) return;

    const next = [...products];
    [next[i], next[j]] = [next[j], next[i]];
    edit(next);
  };

  const publish = async () => {
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const saved = await saveCatalog(products, sha);
      setSha(saved.sha);
      setDirty(false);
      setNote(`Pubblicato: ${saved.count} prodotti. Il sito si aggiorna fra circa un minuto.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pubblicazione non riuscita.");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Schermate ---- */

  if (!ready) return <div className={styles.boot}>Carico il pannello…</div>;

  if (!email) {
    return (
      <LoginScreen
        onDone={async (who) => {
          setEmail(who);
          await fetchCatalog();
        }}
      />
    );
  }

  const current = editing ? products.find((p) => p.id === editing) : undefined;

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <img src="/favicon-HCE.png" alt="" width={28} height={28} />
          <span>Catalogo prodotti</span>
        </div>

        <div className={styles.topActions}>
          {dirty && <span className={styles.badge}>Modifiche non pubblicate</span>}
          <button
            type="button"
            className={styles.primary}
            onClick={publish}
            disabled={saving || !dirty}
          >
            {saving ? "Pubblico…" : "Pubblica le modifiche"}
          </button>
          <button
            type="button"
            className={styles.ghost}
            onClick={async () => {
              await logout();
              setEmail(null);
            }}
          >
            Esci
          </button>
        </div>
      </header>

      {(note || error) && (
        <div className={error ? styles.errorBar : styles.noteBar} role="status">
          {error ?? note}
        </div>
      )}

      {current ? (
        <ProductEditor
          product={current}
          taken={products.filter((p) => p !== current).map((p) => p.id)}
          onChange={(next) => edit(products.map((p) => (p.id === current.id ? next : p)))}
          onDelete={() => {
            edit(products.filter((p) => p.id !== current.id));
            setEditing(null);
          }}
          onBack={() => setEditing(null)}
        />
      ) : (
        <main className={styles.list}>
          <p className={styles.intro}>
            I prodotti compaiono nel menu nell&apos;ordine di questo elenco, raccolti per categoria.
            Quelli con la scheda pubblicata hanno anche una pagina nel catalogo.
          </p>

          {CATEGORIES.map((cat) => {
            const items = products.filter((p) => p.category === cat.key);
            return (
              <section key={cat.key} className={styles.group}>
                <h2 className={styles.groupHead} style={{ "--cat": cat.color } as React.CSSProperties}>
                  <img src={cat.icon} alt="" width={22} height={22} />
                  {cat.label}
                  <span className={styles.count}>{items.length}</span>
                </h2>

                <ul className={styles.rows}>
                  {items.map((p, i) => (
                    <li key={p.id} className={styles.row}>
                      <button type="button" className={styles.rowMain} onClick={() => setEditing(p.id)}>
                        <span className={styles.thumb}>
                          {p.image ? <img src={p.image} alt="" /> : <span aria-hidden="true">—</span>}
                        </span>
                        <span className={styles.rowText}>
                          <span className={styles.rowName}>{p.name}</span>
                          <span className={styles.rowMeta}>
                            {p.published ? "Scheda pubblicata" : "Solo nel menu"}
                            {p.sectors.length > 0 && ` · ${p.sectors.join(", ")}`}
                          </span>
                        </span>
                      </button>

                      <span className={styles.rowBtns}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => move(p.id, -1)}
                          disabled={i === 0}
                          aria-label={`Sposta ${p.name} più in alto`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => move(p.id, 1)}
                          disabled={i === items.length - 1}
                          aria-label={`Sposta ${p.name} più in basso`}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>

                <button type="button" className={styles.addBtn} onClick={() => create(cat.key)}>
                  + Nuovo prodotto in {cat.label}
                </button>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Accesso
   ------------------------------------------------------------------ */

function LoginScreen({ onDone }: { onDone: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const who = await login(email, password);
      onDone(who.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accesso non riuscito.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.login}>
      <form className={styles.loginCard} onSubmit={submit}>
        <img src="/favicon-HCE.png" alt="" width={40} height={40} />
        <h1 className={styles.loginTitle}>Catalogo prodotti</h1>
        <p className={styles.loginText}>Entra per aggiungere o modificare i prodotti del sito.</p>

        <input
          className={styles.input}
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? "Entro…" : "Entra"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
