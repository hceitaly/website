import { useSyncExternalStore } from "react";

/* La richiesta di preventivo: i modelli che il visitatore ha messo da parte
   sfogliando le schede, ciascuno con la sua quantità.

   Ogni pagina del sito è un caricamento a sé, quindi la richiesta vive nel
   browser (localStorage) e non in uno stato di React: chi aggiunge un inverter,
   torna al catalogo e aggiunge una batteria deve ritrovarli entrambi. Se il
   browser non concede lo spazio — navigazione privata, dati bloccati — la
   richiesta funziona lo stesso, solo che non sopravvive al cambio pagina. */

export type CartLine = {
  /** Scheda di provenienza: serve per foto, colore e link. */
  productId: string;
  /** Nome del prodotto al momento dell'aggiunta: resta leggibile anche se la
      scheda nel frattempo viene tolta dal catalogo. */
  productName: string;
  /** Una riga della tabella modelli (o il prodotto stesso, se non ne ha). */
  model: string;
  qty: number;
};

const KEY = "hce:richiesta";

/** Come funziona la richiesta, in una riga: sotto il bottone della scheda e
    dentro la tendina. */
export const REQUEST_HINT =
  "Aggiungi tutti i prodotti di cui hai bisogno alla richiesta del preventivo, quando hai raccolto tutto compila il form per finalizzare la richiesta.";

let lines: CartLine[] = read();
let open = false;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter(
          (l): l is CartLine =>
            typeof l?.productId === "string" &&
            typeof l?.productName === "string" &&
            typeof l?.model === "string" &&
            Number.isInteger(l?.qty) &&
            l.qty >= 1,
        )
      : [];
  } catch {
    return [];
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Nessuno spazio disponibile: resta in memoria per questa pagina. */
  }
  emit();
}

// Un'altra scheda del browser ha cambiato la richiesta: la si segue.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    lines = read();
    emit();
  });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Le righe della richiesta, nell'ordine in cui sono state aggiunte. */
export function useCart() {
  return useSyncExternalStore(subscribe, () => lines);
}

/** Se la tendina della richiesta è aperta. */
export function useCartOpen() {
  return useSyncExternalStore(subscribe, () => open);
}

export function openCart() {
  open = true;
  emit();
}

export function closeCart() {
  open = false;
  emit();
}

/** Riscrive la parte di un prodotto: i modelli scelti con le loro quantità.
    Le righe degli altri prodotti restano dove sono; quelle di questo prendono
    il posto delle vecchie, o finiscono in fondo se è la prima volta. */
export function setProductLines(
  productId: string,
  productName: string,
  quantities: { model: string; qty: number }[],
) {
  const fresh = quantities
    .filter((q) => q.qty >= 1)
    .map((q) => ({ productId, productName, model: q.model, qty: q.qty }));
  const at = lines.findIndex((l) => l.productId === productId);
  const rest = lines.filter((l) => l.productId !== productId);
  const pos = at === -1 ? rest.length : at;
  commit([...rest.slice(0, pos), ...fresh, ...rest.slice(pos)]);
}

export function setLineQty(productId: string, model: string, qty: number) {
  commit(lines.map((l) => (l.productId === productId && l.model === model ? { ...l, qty } : l)));
}

export function removeLine(productId: string, model: string) {
  commit(lines.filter((l) => !(l.productId === productId && l.model === model)));
}

export function clearCart() {
  commit([]);
}
