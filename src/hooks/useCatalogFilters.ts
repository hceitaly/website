/* Filtri per categoria e per settore, condivisi da `/prodotti` e `/cataloghi`.

   Le due pagine filtrano la stessa gamma con le stesse regole: tenerle qui
   evita che una delle due, un giorno, cominci a filtrare in modo diverso. */

import { useCallback, useMemo, useState } from "react";
import {
  CATEGORIES,
  sectorsForCategories,
  type CatalogProduct,
  type CategoryKey,
  type SectorKey,
} from "../data/products";

/** Aggiunge/toglie una chiave da un set di filtri. */
function toggle<T>(set: T[], key: T): T[] {
  return set.includes(key) ? set.filter((k) => k !== key) : [...set, key];
}

/**
 * Categorie preselezionate da `?categoria=` — è così che arrivano i bottoni
 * dello slider in home e le voci del megamenu. Accetta più chiavi separate da
 * virgola e scarta quelle che non esistono.
 */
function categoriesFromUrl(): CategoryKey[] {
  if (typeof window === "undefined") return [];
  const raw = new URLSearchParams(window.location.search).get("categoria");
  if (!raw) return [];
  const wanted = raw.split(",").map((s) => s.trim().toLowerCase());
  return CATEGORIES.filter((c) => wanted.includes(c.key)).map((c) => c.key);
}

export function useCatalogFilters() {
  const [cats, setCats] = useState<CategoryKey[]>(categoriesFromUrl);
  const [sectors, setSectors] = useState<SectorKey[]>([]);

  // Settori raggiungibili con le categorie scelte: gli altri si spengono.
  const openSectors = useMemo(() => sectorsForCategories(cats), [cats]);

  // Scegliendo una categoria un settore già selezionato può restare senza
  // prodotti: in quel caso lo lasciamo cadere, così il filtro non mente.
  const toggleCat = useCallback(
    (key: CategoryKey) => {
      const next = toggle(cats, key);
      const open = sectorsForCategories(next);
      setCats(next);
      if (open) {
        setSectors((sel) => (sel.every((s) => open.has(s)) ? sel : sel.filter((s) => open.has(s))));
      }
    },
    [cats],
  );

  const toggleSector = useCallback((key: SectorKey) => setSectors((v) => toggle(v, key)), []);

  const clear = useCallback(() => {
    setCats([]);
    setSectors([]);
  }, []);

  const matches = useCallback(
    (p: CatalogProduct) =>
      (cats.length === 0 || cats.includes(p.category)) &&
      (sectors.length === 0 || p.sectors.some((s) => sectors.includes(s))),
    [cats, sectors],
  );

  return {
    cats,
    sectors,
    openSectors,
    toggleCat,
    toggleSector,
    clear,
    matches,
    /** Quanti filtri sono accesi, per il bottone "Azzera". */
    active: cats.length + sectors.length,
  };
}

export type CatalogFilters = ReturnType<typeof useCatalogFilters>;
