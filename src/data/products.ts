/* Catalogo prodotti — un solo contenuto, tre usi.

   I prodotti non stanno più qui: vivono in `catalog.json`, che è il file
   scritto dal pannello `/admin`. Questo modulo lo legge, scarta le voci
   malformate e ne deriva le tre viste che il sito usa — la griglia di
   `/prodotti`, la scheda `/prodotti/<id>` e l'elenco per categoria del mega
   menu. Un prodotto caricato dal pannello compare in tutti e tre.

   Le categorie invece restano in codice: colori, icone e copertine sono scelte
   di design, non contenuto da redigere. Vedi `data/slides.ts`. */

import catalog from "./catalog.json";

export type CategoryKey = "fotovoltaico" | "inverter" | "accumulo" | "mobilita" | "clima";

export type SectorKey = "residenziale" | "industriale";

/** La suddivisione dentro una categoria. `main` è il prodotto che dà il nome
    alla categoria (l'inverter fra gli inverter, la pompa di calore nel clima);
    `condizionatori` esiste solo nel clima. */
export type KindKey = "main" | "condizionatori" | "accessori";

export type Category = {
  key: CategoryKey;
  label: string;
  /** Titolo della colonna prodotti nel mega menu. */
  menuTitle: string;
  /** Colore identitario della categoria (uguale a hero + prodotti recenti). */
  color: string;
  /** Icona PNG colorata, usata nel tag di ogni scheda prodotto. */
  icon: string;
  /** Copertina della card di filtro. */
  image: string;
  /** Foto di sfondo della scheda "Scarica il catalogo". */
  catalogCover: string;
  /** PDF del catalogo della categoria, in `public/cataloghi/`. Finché manca,
      i link "catalogo" portano alla sua documentazione nella pagina Cataloghi
      — vedi `categoryCatalog()`. */
  catalogFile?: string;
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

/** Tabella dei modelli. Le intestazioni sono contenuto anche loro: un modulo
    dichiara le celle, un inverter la potenza. La prima colonna è il nome del
    modello — è quella che il preventivo propone come scelta. */
export type ModelTable = {
  columns: string[];
  rows: string[][];
};

/** Un documento scaricabile della sezione "Schede tecniche". */
export type Datasheet = {
  label: string;
  /** PDF — caricato dal pannello in `public/schede/`. */
  file: string;
  /** Peso indicativo, mostrato accanto al formato. Facoltativo. */
  size?: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: CategoryKey;
  sectors: SectorKey[];
  /** Tipo dentro la categoria, per il filtro del catalogo. Senza, è il
      prodotto principale della categoria — vedi `KindKey`. */
  kind?: Exclude<KindKey, "main">;
  /** Con la scheda pubblicata il prodotto entra nella griglia e ha una pagina
      sua; senza, resta una voce di gamma nel menu che porta al catalogo. */
  published: boolean;
  /** Foto del prodotto. Finché manca si usa il placeholder di categoria. */
  image?: string;
  /** Come la foto riempie il riquadro: gli scontornati stanno meglio "contain". */
  fit?: "cover" | "contain";
  /** Cos'è il prodotto, in due o tre righe. */
  intro?: string;
  /** Caratteristiche in breve: una per pastiglia, sotto il titolo. */
  highlights?: string[];
  /** In evidenza — punti chiave, uno per riga. */
  points?: string[];
  /** Modelli disponibili: nella scheda e nella scelta del preventivo. */
  models?: ModelTable;
  /** Documenti scaricabili, sotto la tabella dei modelli. */
  datasheets?: Datasheet[];
  /** Prodotti che si abbinano a questo (codici di altre schede), nell'ordine
      in cui compaiono nella fila "Compatibile con" in fondo alla scheda. Vale
      solo per questa scheda: l'abbinamento inverso si scrive sull'altra. */
  compatible?: string[];
  /** Catalogo del singolo prodotto — da depositare in `public/cataloghi/`. */
  catalogFile?: string;
  /** Quando la scheda è andata online la prima volta (ISO 8601). Non si
      compila a mano: lo scrive `/api/catalog` al primo salvataggio da
      pubblicato, e da lì resta fisso. Ordina i "Prodotti Recenti" in home. */
  publishedAt?: string;
};

/** Filtro di sinistra — "Filtra per categoria". */
export const CATEGORIES: Category[] = [
  {
    key: "fotovoltaico",
    label: "Fotovoltaico",
    menuTitle: "Moduli fotovoltaici",
    color: "#2fa1e0",
    icon: "/assets/Icona-pannelli.png",
    image: "/assets/fotovoltaico-catalog.webp",
    catalogCover: "/assets/pannelli-solari.webp",
  },
  {
    key: "inverter",
    label: "Inverter",
    menuTitle: "Inverter fotovoltaici (Fox ESS)",
    color: "#1fb6a6",
    icon: "/assets/icona-inverter.png",
    image: "/assets/inverter-catalog.webp",
    catalogCover: "/assets/pinsnap-106327241187857624.jpg",
  },
  {
    key: "accumulo",
    label: "Accumulo",
    menuTitle: "Sistemi di accumulo (Fox ESS)",
    color: "#3463af",
    icon: "/assets/icona%20batterie.png",
    image: "/assets/accumulo-catalog.webp",
    catalogCover: "/assets/accumulo.webp",
  },
  {
    key: "mobilita",
    label: "Mobilità",
    menuTitle: "Mobilità elettrica",
    color: "#6250a2",
    icon: "/assets/icona%20mobilita.png",
    image: "/assets/mobilita-catalog.webp",
    catalogCover: "/assets/mobilita-elettrica.webp",
  },
  {
    key: "clima",
    label: "Clima",
    menuTitle: "Climatizzazione e pompe di calore (Ferroli)",
    color: "#a33c8c",
    icon: "/assets/icona%20pompa.png",
    image: "/assets/clima-catalog.webp",
    catalogCover: "/assets/pompadicalore.webp",
  },
];

/** Filtro di destra — "Filtra per settore". Le foto sono provvisorie: prese
    dalla libreria già in `public/assets`, ognuna il taglio più vicino al
    settore che rappresenta. */
export const SECTORS: Sector[] = [
  { key: "residenziale", label: "Residenziale", image: "/assets/pompadicalore.webp" },
  { key: "industriale", label: "Industriale", image: "/assets/pannelli-solari.webp" },
];

/** Artwork provvisorio: sparisce da sé appena un prodotto ha la sua `image`. */
export const PLACEHOLDER_IMAGE: Record<CategoryKey, string> = {
  fotovoltaico: "/assets/pannelli-solari.webp",
  inverter: "/assets/inverter.webp",
  accumulo: "/assets/accumulo.webp",
  mobilita: "/assets/mobilita-elettrica.webp",
  clima: "/assets/pompadicalore.webp",
};

/**
 * Dove porta "il catalogo" di una categoria: il PDF quando c'è, altrimenti la
 * sua documentazione nella pagina Cataloghi, già filtrata. I cinque PDF di
 * categoria non sono ancora stati consegnati: senza questo ripiego menu, slider
 * e catalogo prodotti puntavano a file inesistenti.
 */
export function categoryCatalog(c: Category): { href: string; pdf: boolean } {
  return c.catalogFile
    ? { href: c.catalogFile, pdf: true }
    : { href: `/cataloghi?categoria=${c.key}`, pdf: false };
}

export const CATEGORY_BY_KEY: Record<CategoryKey, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, Category>;

const CATEGORY_KEYS = new Set<string>(CATEGORIES.map((c) => c.key));

/** Tutta la gamma, nell'ordine in cui il JSON la elenca, bozze comprese: è
    quello che il menu mostra. Le voci senza id, senza nome o con una categoria
    che non esiste vengono scartate — un refuso nel contenuto non deve poter
    mandare in errore il sito. */
export const ALL_PRODUCTS: CatalogProduct[] = (catalog.products as CatalogProduct[]).filter(
  (p) => p.id && p.name && CATEGORY_KEYS.has(p.category),
);

/** Il prodotto di punta dell'azienda: primo nella griglia `/prodotti`, sempre
    fra i "Prodotti Recenti" della home e sempre fra i consigliati sotto le
    schede della sua categoria. Se la scheda sparisce o non è pubblicata, il
    sito torna semplicemente all'ordine normale. */
export const FLAGSHIP_ID = "fv-3sun-b60-hjt-made-in-italy-enea-cat-c";

/* Griglia prodotti: solo le schede pubblicate.

   L'ordine conta ancora — decide quale prodotto riceve quale forma e tiene le
   categorie mescolate — ma la forma non è più un dato del prodotto: la calcola
   `layoutShapes()` sull'elenco effettivamente a schermo. Il prodotto di punta
   passa davanti a tutti. */
export const CATALOG: CatalogProduct[] = ALL_PRODUCTS.filter((p) => p.published).sort(
  (a, b) => Number(b.id === FLAGSHIP_ID) - Number(a.id === FLAGSHIP_ID),
);

export const FLAGSHIP: CatalogProduct | undefined = CATALOG.find((p) => p.id === FLAGSHIP_ID);

/**
 * Le ultime schede andate online, dalla più nuova: lo slider "Prodotti
 * Recenti" della home. Conta `publishedAt`; a parità di data — o per le schede
 * pubblicate prima che la data esistesse — vince la posizione nel JSON, dove il
 * pannello aggiunge i prodotti nuovi in coda.
 */
export function recentProducts(limit = 10): CatalogProduct[] {
  const time = (p: CatalogProduct) => {
    const t = p.publishedAt ? Date.parse(p.publishedAt) : NaN;
    return Number.isNaN(t) ? 0 : t;
  };
  // Il prodotto di punta apre sempre lo slider, qualunque sia la sua data.
  const rest = CATALOG.filter((p) => p !== FLAGSHIP)
    .map((p, i) => ({ p, i, t: time(p) }))
    .sort((a, b) => b.t - a.t || b.i - a.i)
    .map(({ p }) => p);
  return (FLAGSHIP ? [FLAGSHIP, ...rest] : rest).slice(0, limit);
}

/** La gamma di una categoria, per la colonna centrale del mega menu. */
export function productsByCategory(key: CategoryKey): CatalogProduct[] {
  return ALL_PRODUCTS.filter((p) => p.category === key);
}

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

/** Le schede pubblicate che si abbinano a questa, nell'ordine scelto nel
    pannello. Un codice che non porta a una scheda pubblicata si salta. */
export function compatibleWith(product: CatalogProduct): CatalogProduct[] {
  return (product.compatible ?? []).flatMap((id) => {
    const p = CATALOG.find((x) => x.id === id);
    return p && p.id !== product.id ? [p] : [];
  });
}

/** Come si chiama, categoria per categoria, il prodotto principale: è la
    prima voce del filtro per tipo. */
const MAIN_KIND_LABEL: Record<CategoryKey, string> = {
  fotovoltaico: "Moduli",
  inverter: "Inverter",
  accumulo: "Batterie",
  mobilita: "Ricarica",
  clima: "Pompe di calore",
};

const KIND_ORDER: KindKey[] = ["main", "condizionatori", "accessori"];

/** Tutti i tipi che una categoria può avere: le voci fra cui sceglie il
    pannello. I condizionatori stanno solo nel clima. */
export function kindOptions(category: CategoryKey): { key: KindKey; label: string }[] {
  return KIND_ORDER.filter((k) => k !== "condizionatori" || category === "clima").map((key) => ({
    key,
    label:
      key === "main"
        ? MAIN_KIND_LABEL[category]
        : key === "condizionatori"
          ? "Condizionatori"
          : "Accessori",
  }));
}

/** I tipi da proporre come filtro per una categoria: solo quelli che hanno
    davvero prodotti a catalogo, e nessuno se la categoria ne ha uno solo —
    un filtro con una voce sola non filtra niente. */
export function kindsForCategory(category: CategoryKey): { key: KindKey; label: string }[] {
  const present = new Set(
    CATALOG.filter((p) => p.category === category).map((p) => p.kind ?? "main"),
  );
  const kinds = kindOptions(category).filter((k) => present.has(k.key));
  return kinds.length > 1 ? kinds : [];
}
