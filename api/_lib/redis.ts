/* Redis (Upstash) per i conteggi delle visite.

   Upstash risponde via HTTP: niente client da installare, basta fetch. Le
   variabili le aggiunge Vercel quando si collega il database al progetto; il
   nome dipende da come è stato collegato, quindi vanno bene tutt'e due le
   coppie. */

function config() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/** Vero se il database è collegato. */
export const redisReady = () => config() !== null;

type Command = (string | number)[];

/** Più comandi in una sola richiesta; i risultati tornano nello stesso ordine. */
export async function pipeline(commands: Command[]): Promise<unknown[]> {
  const c = config();
  if (!c) throw new Error("Redis non collegato: mancano KV_REST_API_URL e KV_REST_API_TOKEN");

  const res = await fetch(`${c.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}: ${await res.text()}`);

  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(`Redis: ${r.error}`);
    return r.result;
  });
}
