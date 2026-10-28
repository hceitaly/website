/* GET/POST /api/views — le schede prodotto più viste degli ultimi 30 giorni.

   POST { id } conta una visita; GET restituisce gli id dal più visto, ed è
   quello che la home usa per ordinare lo slider dei prodotti.

   Ogni giorno ha il suo insieme in Redis (`views:2026-10-19`) che scade da
   solo: la classifica è la somma degli ultimi WINDOW giorni, così le visite
   vecchie escono senza che nessuno debba ripulire. */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodIs, readJson } from "./_lib/http.js";
import { pipeline, redisReady } from "./_lib/redis.js";

const WINDOW = 30;
const DAY = 86_400_000;
/** Più dei dieci dello slider: il sito scarta gli id che non sono (più) in
    catalogo, e deve restargliene abbastanza. */
const LIMIT = 30;

/* Le visite fatte in locale o sulle anteprime di Vercel non devono pesare
   sulla classifica del sito vero. */
const PREFIX = process.env.VERCEL_ENV === "production" ? "views" : "views-dev";

/** Lo stesso formato degli id del catalogo (vedi `api/catalog.ts`). */
const ID = /^[a-z0-9-]{1,160}$/;

/** I motori di ricerca eseguono il JavaScript delle pagine: senza questo
    filtro anche le loro visite finirebbero in classifica. */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview/i;

const keyFor = (time: number) => `${PREFIX}:${new Date(time).toISOString().slice(0, 10)}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodIs(req, res, "GET", "POST")) return;

  // Senza database il sito resta com'è: nessuna classifica, nessun errore.
  if (!redisReady()) {
    if (req.method === "GET") res.status(200).json({ ids: [] });
    else res.status(204).end();
    return;
  }

  try {
    if (req.method === "POST") {
      const { id } = await readJson<{ id?: unknown }>(req);
      if (typeof id !== "string" || !ID.test(id)) {
        res.status(400).json({ error: "id non valido" });
        return;
      }
      if (!BOT.test(req.headers["user-agent"] ?? "")) {
        const key = keyFor(Date.now());
        await pipeline([
          ["ZINCRBY", key, 1, id],
          ["EXPIRE", key, (WINDOW + 1) * 86_400],
        ]);
      }
      res.status(204).end();
      return;
    }

    const now = Date.now();
    const keys = Array.from({ length: WINDOW }, (_, i) => keyFor(now - i * DAY));
    // [id, punteggio, id, punteggio, …], dal meno visto.
    const [flat] = (await pipeline([["ZUNION", keys.length, ...keys, "WITHSCORES"]])) as [
      string[],
    ];

    const ranked: { id: string; n: number }[] = [];
    for (let i = 0; i < flat.length; i += 2) ranked.push({ id: flat[i], n: Number(flat[i + 1]) });
    ranked.sort((a, b) => b.n - a.n);

    // La classifica cambia lentamente: la rete di Vercel la tiene dieci minuti,
    // e il database non viene interrogato a ogni apertura della home.
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ ids: ranked.slice(0, LIMIT).map((r) => r.id) });
  } catch (err) {
    console.error("[views]", err instanceof Error ? err.message : String(err));
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") res.status(200).json({ ids: [] });
    else res.status(500).json({ error: "Conteggio non riuscito" });
  }
}
