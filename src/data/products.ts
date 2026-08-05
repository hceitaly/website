/* Catalogo prodotti — dati della pagina "/prodotti".

   Le categorie sono le stesse (colori + icone) del carosello in home e dello
   slider hero, così il filtro parla la stessa lingua visiva del resto del sito.
   Vedi `data/slides.ts` e `data/recent.ts`. */

export type CategoryKey = "fotovoltaico" | "inverter" | "accumulo" | "mobilita" | "clima";

export type SectorKey = "residenziale" | "commerciale" | "industriale" | "agricolo";

export type Category = {
  key: CategoryKey;
  label: string;
  /** Colore identitario della categoria (uguale a hero + prodotti recenti). */
  color: string;
  /** Icona PNG colorata, usata nel tag di ogni scheda prodotto. */
  icon: string;
  /** Copertina della card di filtro. */
  image: string;
  /** Foto di sfondo della scheda "Scarica il catalogo". */
  catalogCover: string;
  /** PDF del catalogo — da depositare in `public/cataloghi/`. */
  catalogFile: string;
};

export type Sector = {
  key: SectorKey;
  label: string;
  /** Immagine della card di filtro — in arrivo. */
  image?: string;
};

/** Le tre sole forme della griglia, in moduli quadrati:
    - `square`     1 colonna × 1 riga
    - `vertical`   1 colonna × 2 righe
    - `horizontal` 2 colonne × 1 riga */
export type Shape = "square" | "vertical" | "horizontal";

export type CatalogProduct = {
  id: string;
  name: string;
  category: CategoryKey;
  sectors: SectorKey[];
  /** Foto del prodotto. Finché manca si usa il placeholder di categoria. */
  image?: string;
  /** Come la foto riempie il riquadro: gli scontornati stanno meglio "contain". */
  fit?: "cover" | "contain";
};

/** Filtro di sinistra — "Filtra per categoria". */
export const CATEGORIES: Category[] = [
  {
    key: "fotovoltaico",
    label: "Fotovoltaico",
    color: "#2fa1e0",
    icon: "/assets/Icona-pannelli.png",
    image: "/assets/fotovoltaico-catalog.png",
    catalogCover: "/assets/pannelli-solari.jpg",
    catalogFile: "/cataloghi/fotovoltaico.pdf",
  },
  {
    key: "inverter",
    label: "Inverter",
    color: "#1fb6a6",
    icon: "/assets/icona-inverter.png",
    image: "/assets/inverter-catalog.png",
    catalogCover: "/assets/pinsnap-106327241187857624.jpg",
    catalogFile: "/cataloghi/inverter.pdf",
  },
  {
    key: "accumulo",
    label: "Accumulo",
    color: "#3463af",
    icon: "/assets/icona%20batterie.png",
    image: "/assets/accumulo-catalog.png",
    catalogCover: "/assets/accumulo.webp",
    catalogFile: "/cataloghi/accumulo.pdf",
  },
  {
    key: "mobilita",
    label: "Mobilità",
    color: "#6250a2",
    icon: "/assets/icona%20mobilita.png",
    image: "/assets/mobilita-catalog.png",
    catalogCover: "/assets/mobilita-elettrica.jpg",
    catalogFile: "/cataloghi/mobilita.pdf",
  },
  {
    key: "clima",
    label: "Clima",
    color: "#a33c8c",
    icon: "/assets/icona%20pompa.png",
    image: "/assets/clima-catalog.png",
    catalogCover: "/assets/pompadicalore.jpg",
    catalogFile: "/cataloghi/clima.pdf",
  },
];

/** Filtro di destra — "Filtra per settore". Le foto sono provvisorie: prese
    dalla libreria già in `public/assets`, ognuna il taglio più vicino al
    settore che rappresenta. */
export const SECTORS: Sector[] = [
  { key: "residenziale", label: "Residenziale", image: "/assets/pompadicalore.jpg" },
  { key: "commerciale", label: "Commerciale", image: "/assets/mobilita-elettrica.jpg" },
  { key: "industriale", label: "Industriale", image: "/assets/pannelli-solari.jpg" },
  { key: "agricolo", label: "Agricolo", image: "/assets/pinsnap-106327241187857624.jpg" },
];

/** Artwork provvisorio: sparisce da sé appena un prodotto ha la sua `image`. */
export const PLACEHOLDER_IMAGE: Record<CategoryKey, string> = {
  fotovoltaico: "/assets/pannelli-solari.jpg",
  inverter: "/assets/inverter.jpg",
  accumulo: "/assets/accumulo.webp",
  mobilita: "/assets/mobilita-elettrica.jpg",
  clima: "/assets/pompadicalore.jpg",
};

export const CATEGORY_BY_KEY: Record<CategoryKey, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, Category>;

/* Griglia prodotti.

   L'ordine conta ancora — decide quale prodotto riceve quale forma e tiene le
   categorie mescolate — ma la forma non è più un dato del prodotto: la calcola
   `layoutShapes()` sull'elenco effettivamente a schermo. */
export const CATALOG: CatalogProduct[] = [
  {
    id: "fv-sonnenkraft",
    name: "Moduli Sonnenkraft",
    category: "fotovoltaico",
    sectors: ["residenziale", "commerciale", "industriale"],
    image: "/assets/modulo-fotovoltaico.webp",
  },
  {
    id: "inv-serie-t-g3",
    name: "Inverter Serie T (G3)",
    category: "inverter",
    sectors: ["residenziale", "commerciale", "industriale", "agricolo"],
    image: "/assets/inverter-serie%20t.png",
  },
  {
    id: "acc-g-max",
    name: "Batterie G-MAX (100 kW / 215 kWh)",
    category: "accumulo",
    sectors: ["commerciale", "industriale", "agricolo"],
    image: "/assets/batterie.webp",
  },
  {
    id: "mob-fox-ess-serie-a",
    name: "Serie A Fox ESS",
    category: "mobilita",
    sectors: ["residenziale", "commerciale", "agricolo"],
    image:
      "/assets/se516-fox-ess-caricabatterie-fox-11kw-serie-a-per-veicoli-elettrici-trifase-con-cavo-tipo-2-da-6-m.jpg",
  },
  {
    id: "cli-ferroli-omnia-st",
    name: "Gamma Ferroli OMNIA ST 3.2",
    category: "clima",
    sectors: ["residenziale", "commerciale", "agricolo"],
    image: "/assets/b_Ferroli_OMNIA-ST-32_tnj7XW7Wo7.webp",
  },
];

/* ------------------------------------------------------------------
   Forme della griglia
   ------------------------------------------------------------------ */

/** Fasce da 2 file × 4 colonne = 8 moduli, riempite da 6 prodotti:
    1 orizzontale + 1 verticale + 4 quadrati. Il rapporto è fisso — i quadrati
    sono sempre il doppio delle forme lunghe, e orizzontali e verticali sono
    sempre in pari — così la griglia resta bilanciata con qualunque filtro.
    Nelle quattro fasce il verticale gira sulle colonne 4·1·2·3 e l'orizzontale
    si sposta: alternandole non si vede la ripetizione.
    L'ordine dentro ogni fascia è quello che il piazzamento di CSS Grid segue
    senza dover tornare indietro a riempire buchi. */
const BANDS: Shape[][] = [
  // [ h h s v / s s s v ]
  ["horizontal", "square", "vertical", "square", "square", "square"],
  // [ v s s s / v h h s ]
  ["vertical", "square", "square", "square", "horizontal", "square"],
  // [ s v h h / s v s s ]
  ["square", "vertical", "horizontal", "square", "square", "square"],
  // [ h h v s / s s v s ]
  ["horizontal", "vertical", "square", "square", "square", "square"],
];

/** Prodotti per fascia. */
const BAND = 6;

/** Oltre l'ottava fila è tutto quadrato: 8 file = 4 fasce = 24 prodotti. */
const SHAPED = 24;

/**
 * Assegna una forma a ogni prodotto **dell'elenco a schermo**, non del
 * catalogo: filtrando, le forme si ricalcolano sul nuovo insieme, così la
 * griglia resta piena e bilanciata invece di ereditare le forme di prodotti
 * che non ci sono più. Le fasce si susseguono finché ci sono 6 prodotti a
 * disposizione; la coda che avanza è quadrata, e chiude l'ultima fila.
 */
export function layoutShapes(count: number): Shape[] {
  const shapes: Shape[] = [];
  const shaped = Math.min(count, SHAPED);

  while (shapes.length + BAND <= shaped) {
    shapes.push(...BANDS[(shapes.length / BAND) % BANDS.length]);
  }

  // Con 3 o 5 prodotti d'avanzo una fila aperta da un orizzontale chiude più
  // stretta di quanto farebbero i soli quadrati (3 → fila piena, 5 → due celle
  // libere invece di tre). Negli altri resti i quadrati fanno di meglio.
  const left = shaped - shapes.length;
  if (left === 3 || left === 5) shapes.push("horizontal", "square", "square");

  while (shapes.length < count) shapes.push("square");
  return shapes;
}

/**
 * I settori davvero coperti dalle categorie selezionate — quelli per cui esiste
 * almeno un prodotto. `null` quando non c'è nessun filtro di categoria: allora
 * valgono tutti. Es.: nel fotovoltaico non c'è nulla per l'agricolo, quindi
 * scegliendo "Fotovoltaico" il settore "Agricolo" resta fuori.
 */
export function sectorsForCategories(cats: CategoryKey[]): Set<SectorKey> | null {
  if (cats.length === 0) return null;
  const open = new Set<SectorKey>();
  for (const p of CATALOG) {
    if (cats.includes(p.category)) for (const s of p.sectors) open.add(s);
  }
  return open;
}
