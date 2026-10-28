/* Le visite alle schede prodotto. Le conta `/api/views`, e la home le usa per
   mettere in testa allo slider i prodotti più visti degli ultimi 30 giorni. */

const SEEN = "hce:viewed";

function seen(): string[] {
  try {
    const list: unknown = JSON.parse(sessionStorage.getItem(SEEN) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Conta una visita al prodotto: l'apertura della scheda o la scelta dei
    modelli dalla griglia del catalogo. Una sola per prodotto e per sessione:
    chi ricarica la pagina o torna indietro non gonfia la classifica. */
export function trackView(id: string) {
  const list = seen();
  if (list.includes(id)) return;
  try {
    sessionStorage.setItem(SEEN, JSON.stringify([...list, id]));
  } catch {
    // Senza sessionStorage la visita si conta comunque, solo senza filtro.
  }

  const body = JSON.stringify({ id });
  // sendBeacon parte anche se chi visita cambia pagina subito dopo.
  const sent = navigator.sendBeacon?.("/api/views", new Blob([body], { type: "application/json" }));
  if (!sent) {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

/** Gli id dal più visto; vuoto se il conteggio non è disponibile, e allora la
    home tiene l'ordine per data. */
export async function fetchTopViewed(): Promise<string[]> {
  try {
    const res = await fetch("/api/views");
    if (!res.ok) return [];
    const data = (await res.json()) as { ids?: unknown };
    return Array.isArray(data.ids)
      ? data.ids.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
