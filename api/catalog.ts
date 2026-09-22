/* GET/PUT /api/catalog — leggere e riscrivere il catalogo prodotti.

   Il file è `src/data/catalog.json`, lo stesso che il sito importa a build
   time: salvare significa fare un commit, e il commit fa ripartire Vercel.
   Leggiamo dal repository e non dal bundle perché fra un salvataggio e la
   pubblicazione passa un minuto, e in quel minuto il pannello deve mostrare
   l'ultima versione salvata, non quella dell'ultima build. */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "./_lib/auth.js";
import { readFile, writeFile } from "./_lib/github.js";
import { fail, methodIs, readJson } from "./_lib/http.js";

const PATH = "src/data/catalog.json";

/* Le stesse chiavi di `src/data/products.ts`. Sono ripetute qui di proposito:
   la funzione gira su Vercel, compilata a parte dal sito, e non deve dipendere
   dal codice del frontend per sapere cosa è valido. Sono cinque costanti che
   cambiano di rado; se cambiano, vanno cambiate in tutt'e due i posti. */
const CATEGORIES = ["fotovoltaico", "inverter", "accumulo", "mobilita", "clima"];
const SECTORS = ["residenziale", "industriale"];

type Product = Record<string, unknown>;

const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Elenco di stringhe ripulito: via i vuoti, via gli spazi di troppo. */
function textList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isText).map((s) => s.trim());
}

/**
 * Controlla e **normalizza** il prodotto.
 *
 * Non si limita a dire di sì o di no: ricostruisce l'oggetto campo per campo,
 * così quello che finisce nel repository ha sempre la stessa forma e i campi
 * lasciati vuoti spariscono invece di restare come stringhe vuote. Tutto ciò
 * che non riconosce viene scartato — il JSON resta pulito anche se qualcuno
 * manda più di quanto il pannello chieda.
 */
function clean(raw: Product, index: number): Product {
  const where = `Prodotto ${index + 1}`;

  if (!isText(raw.id)) throw new Error(`${where}: manca il codice identificativo.`);
  if (!/^[a-z0-9-]+$/.test(raw.id as string)) {
    throw new Error(`${where}: il codice "${raw.id}" non è valido (solo lettere minuscole, numeri e trattini).`);
  }
  if (!isText(raw.name)) throw new Error(`${where}: manca il titolo.`);
  if (!CATEGORIES.includes(raw.category as string)) {
    throw new Error(`${where} "${raw.name}": categoria "${raw.category}" non valida.`);
  }

  const out: Product = {
    id: (raw.id as string).trim(),
    name: (raw.name as string).trim(),
    category: raw.category,
    sectors: Array.isArray(raw.sectors) ? raw.sectors.filter((s) => SECTORS.includes(s)) : [],
    published: raw.published === true,
  };

  if (isText(raw.image)) out.image = (raw.image as string).trim();
  if (raw.fit === "cover" || raw.fit === "contain") out.fit = raw.fit;
  if (isText(raw.intro)) out.intro = (raw.intro as string).trim();

  const highlights = textList(raw.highlights);
  if (highlights.length) out.highlights = highlights;

  const points = textList(raw.points);
  if (points.length) out.points = points;

  // La tabella entra solo se ha davvero delle righe: intestazioni sole non
  // servono a nessuno, e il preventivo userebbe colonne senza modelli.
  const models = raw.models as { columns?: unknown; rows?: unknown } | undefined;
  if (models && Array.isArray(models.rows)) {
    const columns = textList(models.columns);
    const rows = models.rows
      .filter((r): r is unknown[] => Array.isArray(r))
      .map((r) => r.map((cell) => (typeof cell === "string" ? cell.trim() : "")))
      // La prima colonna è il nome del modello: una riga senza nome non è una riga.
      .filter((r) => r[0]);

    if (columns.length && rows.length) {
      // Righe tutte lunghe quanto le intestazioni: la tabella non deve poter
      // uscire storta per una cella dimenticata.
      out.models = {
        columns,
        rows: rows.map((r) => columns.map((_, i) => r[i] ?? "")),
      };
    }
  }

  if (Array.isArray(raw.datasheets)) {
    const sheets = (raw.datasheets as Product[])
      .filter((d) => d && isText(d.label) && isText(d.file))
      .map((d) => {
        const sheet: Product = { label: (d.label as string).trim(), file: (d.file as string).trim() };
        if (isText(d.size)) sheet.size = (d.size as string).trim();
        return sheet;
      });
    if (sheets.length) out.datasheets = sheets;
  }

  if (isText(raw.catalogFile)) out.catalogFile = (raw.catalogFile as string).trim();

  return out;
}

function validate(products: unknown): Product[] {
  if (!Array.isArray(products)) throw new Error("Contenuto non valido: manca l'elenco prodotti.");

  const clean_ = products.map((p, i) => clean(p as Product, i));

  const seen = new Set<string>();
  for (const p of clean_) {
    const id = p.id as string;
    if (seen.has(id)) {
      throw new Error(`Il codice "${id}" è usato da due prodotti: dev'essere unico.`);
    }
    seen.add(id);
  }

  return clean_;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodIs(req, res, "GET", "PUT")) return;
  if (!requireSession(req, res)) return;

  try {
    if (req.method === "GET") {
      const file = await readFile(PATH);
      if (!file) {
        res.status(200).json({ products: [], sha: null });
        return;
      }
      const parsed = JSON.parse(file.text) as { products?: unknown };
      res.status(200).json({ products: parsed.products ?? [], sha: file.sha });
      return;
    }

    const body = await readJson<{ products?: unknown; sha?: string }>(req);
    const products = validate(body.products);

    // Indentato e con l'a capo finale: nel diff di GitHub si legge come un
    // file scritto a mano, non come una riga sola generata da una macchina.
    const text = `${JSON.stringify({ products }, null, 2)}\n`;

    const saved = await writeFile({
      path: PATH,
      contentBase64: Buffer.from(text, "utf8").toString("base64"),
      message: `Aggiorna catalogo prodotti (${products.length} voci)`,
      sha: body.sha,
    });

    res.status(200).json({ ok: true, sha: saved.sha, commit: saved.commit, count: products.length });
  } catch (err) {
    // Gli errori di validazione sono indicazioni per chi sta compilando, non
    // guasti: vanno restituiti così come sono, con il codice giusto.
    const message = err instanceof Error ? err.message : String(err);
    if (/^(Prodotto |Il codice |Contenuto non valido)/.test(message)) {
      res.status(400).json({ error: message });
      return;
    }
    fail(res, err);
  }
}
