/* POST /api/upload — deposita nel repository una foto o un PDF.

   I file finiscono in `public/`, che Vite pubblica così com'è: il percorso
   restituito qui è già quello buono da salvare nel prodotto. */

import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "./_lib/auth.js";
import { readFile, writeFile } from "./_lib/github.js";
import { fail, methodIs, readJson } from "./_lib/http.js";

/** Dove va ogni tipo di allegato, e cosa accetta. */
const KINDS = {
  image: { dir: "public/assets", ext: ["jpg", "jpeg", "png", "webp", "avif", "svg"] },
  datasheet: { dir: "public/schede", ext: ["pdf"] },
  catalog: { dir: "public/cataloghi", ext: ["pdf"] },
} as const;

type Kind = keyof typeof KINDS;

/* Vercel accetta richieste fino a 4,5 MB e il base64 gonfia di un terzo:
   oltre questa soglia il file non arriverebbe nemmeno alla funzione, quindi
   è meglio dirlo prima con parole chiare. Le foto passano già compresse dal
   pannello, quindi il limite lo incontrano in pratica solo i PDF. */
const MAX_BYTES = 3_200_000;

/** Nome di file prevedibile: niente accenti, spazi o maiuscole nell'URL. */
function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function human(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodIs(req, res, "POST")) return;
  if (!requireSession(req, res)) return;

  try {
    const body = await readJson<{ filename?: string; contentBase64?: string; kind?: Kind }>(req);
    const kind = body.kind && body.kind in KINDS ? body.kind : null;

    if (!kind) throw new Error("Tipo di allegato non valido.");
    if (!body.filename || !body.contentBase64) throw new Error("File non valido: manca il contenuto.");

    const rule = KINDS[kind];
    const ext = body.filename.split(".").pop()?.toLowerCase() ?? "";
    if (!(rule.ext as readonly string[]).includes(ext)) {
      throw new Error(`Formato .${ext} non ammesso qui: usa ${rule.ext.join(", ")}.`);
    }

    // Il base64 può arrivare come data URL dal browser: teniamo solo i dati.
    const raw = body.contentBase64.includes(",")
      ? body.contentBase64.slice(body.contentBase64.indexOf(",") + 1)
      : body.contentBase64;
    const bytes = Buffer.from(raw, "base64");

    if (bytes.length === 0) throw new Error("File non valido: è vuoto.");
    if (bytes.length > MAX_BYTES) {
      throw new Error(
        `Il file pesa ${human(bytes.length)}: il limite è ${human(MAX_BYTES)}. Comprimilo e riprova.`,
      );
    }

    /* Nome = titolo leggibile + impronta del contenuto. Ricaricare lo stesso
       file dà lo stesso nome (nessun doppione nel repository), mentre un file
       diverso non può sovrascrivere quello di un altro prodotto per via di un
       nome uguale. */
    const base = slug(body.filename.replace(/\.[^.]+$/, "")) || kind;
    const mark = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 8);
    const name = `${base}-${mark}.${ext}`;
    const path = `${rule.dir}/${name}`;

    // Già presente e identico: è lo stesso contenuto, non serve un commit.
    const existing = await readFile(path);
    if (!existing) {
      await writeFile({
        path,
        contentBase64: bytes.toString("base64"),
        message: `Carica ${name}`,
      });
    }

    res.status(200).json({
      url: `/${path.replace(/^public\//, "")}`,
      size: human(bytes.length),
      reused: Boolean(existing),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/non valid|non ammesso|limite|è vuoto/i.test(message)) {
      res.status(400).json({ error: message });
      return;
    }
    fail(res, err);
  }
}
