/* Filtri per categoria e per settore, condivisi da `/prodotti` e `/cataloghi`.

   Le due pagine filtrano la stessa gamma con le stesse regole: tenerle qui
   evita che una delle due, un giorno, cominci a filtrare in modo diverso. */

import { useCallback, useMemo, useState } from "react";
import {
  CATEGORIES,
  kindsForCategory,
  sectorsForCategories,
  type CatalogProduct,
  type CategoryKey,
  type KindKey,
  type SectorKey,
} from "../data/products";

/* I filtri sono a scelta singola, come dei radio: una categoria, un tipo, un
   settore. Cliccare la voce già scelta la spegne — è l'unico modo di tornare
   a "tutti" senza un bottone in più. */

/**
 * Categoria preselezionata da `?categoria=` — è così che arrivano i bottoni
 * dello slider in home e le voci del megamenu. Una chiave che non esiste si
 * scarta.
 */
function categoryFromUrl(): CategoryKey | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("categoria");
  if (!raw) return null;
  const wanted = raw.split(",")[0].trim().toLowerCase();
  return CATEGORIES.find((c) => c.key === wanted)?.key ?? null;
}

export function useCatalogFilters() {
  const [cat, setCat] = useState<CategoryKey | null>(categoryFromUrl);
  const [kind, setKind] = useState<KindKey | null>(null);
  const [sector, setSector] = useState<SectorKey | null>(null);

  const cats = useMemo(() => (cat ? [cat] : []), [cat]);

  // Settori raggiungibili con la categoria scelta: gli altri si spengono.
  const openSectors = useMemo(() => sectorsForCategories(cats), [cats]);

  // I tipi in cui si divide la categoria scelta: pompe di calore,
  // condizionatori e accessori nel clima; prodotto e accessori nelle altre.
  // Vuoto senza categoria, o se la categoria non ha suddivisioni.
  const kinds = useMemo(() => (cat ? kindsForCategory(cat) : []), [cat]);

  // Cambiando categoria il tipo non vale più, e un settore già scelto può
  // restare senza prodotti: in quel caso lo lasciamo cadere, così il filtro
  // non mente.
  const toggleCat = useCallback(
    (key: CategoryKey) => {
      const next = cat === key ? null : key;
      const open = sectorsForCategories(next ? [next] : []);
      setCat(next);
      setKind(null);
      if (open) setSector((s) => (s && !open.has(s) ? null : s));
    },
    [cat],
  );

  const toggleKind = useCallback((key: KindKey) => setKind((k) => (k === key ? null : key)), []);

  const toggleSector = useCallback(
    (key: SectorKey) => setSector((s) => (s === key ? null : key)),
    [],
  );

  const clear = useCallback(() => {
    setCat(null);
    setKind(null);
    setSector(null);
  }, []);

  const matches = useCallback(
    (p: CatalogProduct) =>
      (!cat || p.category === cat) &&
      (!kind || (p.kind ?? "main") === kind) &&
      (!sector || p.sectors.includes(sector)),
    [cat, kind, sector],
  );

  return {
    cats,
    kind,
    kinds,
    sector,
    openSectors,
    toggleCat,
    toggleKind,
    toggleSector,
    clear,
    matches,
    /** Quanti filtri sono accesi, per il bottone "Azzera". */
    active: (cat ? 1 : 0) + (kind ? 1 : 0) + (sector ? 1 : 0),
  };
}

export type CatalogFilters = ReturnType<typeof useCatalogFilters>;
