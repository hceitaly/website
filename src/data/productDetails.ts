/* Contenuti della scheda prodotto (`/prodotti/<id>`).

   Stanno fuori da `products.ts` perché quello descrive la griglia — nome,
   categoria, settori, foto — mentre qui c'è il testo lungo, che riguarda un
   prodotto per volta. La chiave è l'`id` del prodotto in `CATALOG`. */

export type ModelTable = {
  head: string[];
  rows: string[][];
};

export type ProductDetail = {
  /** Caratteristiche tecniche in breve: una per pastiglia, sotto il titolo. */
  highlights: string[];
  /** Cos'è il prodotto, in due o tre righe. */
  intro: string;
  /** Punti chiave, uno per riga. */
  points: string[];
  /** Tabella dei modelli disponibili. */
  models?: ModelTable;
  /** Catalogo del singolo prodotto — da depositare in `public/cataloghi/`. */
  catalogFile: string;
};

export const PRODUCT_DETAILS: Record<string, ProductDetail | undefined> = {
  "fv-sonnenkraft": {
    highlights: ["TopCon 2.0", "half-cut", "HW4 grandine", "Stäubli MC4", "fino a 1500 V"],
    intro:
      "Moduli ad alta efficienza per impianti residenziali, commerciali e industriali, costruiti per durare: celle TopCon di seconda generazione, struttura half-cut e telaio testato alla grandine.",
    points: [
      "Registrati nel Registro ENEA (Categoria A)",
      "Vetro antiriflesso (bassa riflessione)",
      "Garanzia prodotto e prestazioni fino a 30 anni",
    ],
    models: {
      head: ["Modello", "Descrizione", "Dimensioni (mm)", "Spec"],
      rows: [
        ["KPV445HC", "445 Wp HC Zebra", "1748×1143×35", "108 celle"],
        ["KPV450HC", "450 Wp HC Zebra", "1748×1143×35", "108 celle"],
        ["KPV500HC", "500 Wp HC Zebra", "1935×1143×35", "120 celle"],
      ],
    },
    catalogFile: "/cataloghi/moduli-sonnenkraft.pdf",
  },
};
