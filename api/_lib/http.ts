/* Piccole cortesie comuni a tutti gli endpoint. */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Il corpo JSON della richiesta.
 *
 * In produzione Vercel lo ha già letto e messo in `req.body`; in locale, dove
 * gli endpoint girano dentro il dev server di Vite, arriva ancora come stream.
 * Qui vanno bene entrambi, così lo stesso file funziona nei due posti.
 */
export async function readJson<T>(req: VercelRequest): Promise<T> {
  if (req.body && typeof req.body === "object") return req.body as T;
  if (typeof req.body === "string") return JSON.parse(req.body) as T;

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return (raw ? JSON.parse(raw) : {}) as T;
}

/** Filtro sul metodo: risponde da sé con 405 e dice `false` se non combacia. */
export function methodIs(req: VercelRequest, res: VercelResponse, ...allowed: string[]): boolean {
  if (allowed.includes(req.method ?? "")) return true;
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: `Metodo ${req.method} non ammesso` });
  return false;
}

/**
 * Traduce un errore in risposta.
 *
 * Quello che il gestore legge deve dirgli cosa fare, non cosa si è rotto: i
 * messaggi che scriviamo noi (token mancante, contenuto già cambiato) sono
 * utili e passano; qualunque altra cosa diventa un messaggio generico, perché
 * un errore grezzo di GitHub in faccia a chi carica un prodotto non aiuta
 * nessuno. Il dettaglio resta nei log della funzione.
 */
export function fail(res: VercelResponse, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[admin]", message);

  const known = /GITHUB_TOKEN|GITHUB_REPO|SESSION_SECRET|modificat|troppo grande|non valid/i.test(
    message,
  );
  res.status(500).json({
    error: known ? message : "Salvataggio non riuscito. Riprova fra poco.",
  });
}
