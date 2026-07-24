import type { IconName } from "../components/Icon";

export type HeroSlide = {
  icon: IconName;
  /** Small product icon (PNG, coloured to match tagColor, transparent bg). */
  iconImg: string;
  /** Catalog cover artwork shown in the catalog card. */
  catalogImg: string;
  /** Short label shown on the catalog card, e.g. "Fotovoltaico". */
  catalogName: string;
  badge: string;
  /** Tag background — the corresponding product icon's colour. */
  tagColor: string;
  number: string;
  caption: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  catalog: string;
};

/** The 5 product categories driving the hero slider — one screen each. */
export const HERO_SLIDES: HeroSlide[] = [
  {
    icon: "solar",
    iconImg: "/assets/Icona-pannelli.png",
    catalogImg: "/assets/fotovoltaico-catalog.png",
    catalogName: "Fotovoltaico",
    badge: "Fotovoltaico",
    tagColor: "#2fa1e0",
    number: "01",
    caption: "Energia dal sole",
    title: "Moduli fotovoltaici ad alta efficienza per ogni tipo di impianto",
    ctaLabel: "Scopri il fotovoltaico",
    ctaHref: "#",
    catalog: "Catalogo Fotovoltaico",
  },
  {
    icon: "inverter",
    iconImg: "/assets/icona-inverter.png",
    catalogImg: "/assets/inverter-catalog.png",
    catalogName: "Inverter",
    badge: "Inverter",
    tagColor: "#1fb6a6",
    number: "02",
    caption: "Conversione intelligente",
    title: "Inverter affidabili per la conversione e il monitoraggio dell'energia",
    ctaLabel: "Scopri gli inverter",
    ctaHref: "#",
    catalog: "Catalogo Inverter",
  },
  {
    icon: "battery",
    iconImg: "/assets/icona%20batterie.png",
    catalogImg: "/assets/accumulo-catalog.png",
    catalogName: "Accumulo",
    badge: "Accumulo",
    tagColor: "#3463af",
    number: "03",
    caption: "Energia sempre disponibile",
    title: "Sistemi di accumulo per massimizzare l'autoconsumo energetico",
    ctaLabel: "Scopri l'accumulo",
    ctaHref: "#",
    catalog: "Catalogo Accumulo",
  },
  {
    icon: "ev",
    iconImg: "/assets/icona%20mobilita.png",
    catalogImg: "/assets/mobilita-catalog.png",
    catalogName: "Mobilità",
    badge: "Mobilità elettrica",
    tagColor: "#6250a2",
    number: "04",
    caption: "Ricarica ovunque",
    title: "Soluzioni di ricarica per la mobilità elettrica del futuro",
    ctaLabel: "Scopri la mobilità elettrica",
    ctaHref: "#",
    catalog: "Catalogo Mobilità",
  },
  {
    icon: "climate",
    iconImg: "/assets/icona%20pompa.png",
    catalogImg: "/assets/clima-catalog.png",
    catalogName: "Clima",
    badge: "Climatizzazione",
    tagColor: "#a33c8c",
    number: "05",
    caption: "Comfort in ogni stagione",
    title: "Condizionatori e pompe di calore per il comfort di ogni ambiente",
    ctaLabel: "Scopri la climatizzazione",
    ctaHref: "#",
    catalog: "Catalogo Climatizzazione",
  },
];
