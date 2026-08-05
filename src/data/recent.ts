export type RecentProduct = {
  /** Category tag label + colour (matches the hero product palette). */
  tag: string;
  tagColor: string;
  /** Small product icon (PNG, coloured). */
  iconImg: string;
  /** Product name shown under the tag. */
  name: string;
  /** Product photo. */
  image: string;
  href: string;
};

/** "Prodotti Recenti" — the auto-advancing showcase slider.
    Inverters are featured first, per the current launch. */
export const RECENT_PRODUCTS: RecentProduct[] = [
  {
    tag: "Inverter",
    tagColor: "#1fb6a6",
    iconImg: "/assets/icona-inverter.png",
    name: "Inverter ibrido monofase",
    image: "/assets/inverter.jpg",
    href: "/prodotti",
  },
  {
    tag: "Fotovoltaico",
    tagColor: "#2fa1e0",
    iconImg: "/assets/Icona-pannelli.png",
    name: "Modulo full-black ad alta resa",
    image: "/assets/pannelli-solari.jpg",
    href: "/prodotti",
  },
  {
    tag: "Accumulo",
    tagColor: "#3463af",
    iconImg: "/assets/icona%20batterie.png",
    name: "Batteria ad alta densità",
    image: "/assets/accumulo.webp",
    href: "/prodotti",
  },
  {
    tag: "Mobilità",
    tagColor: "#6250a2",
    iconImg: "/assets/icona%20mobilita.png",
    name: "Wallbox per ricarica domestica",
    image: "/assets/mobilita-elettrica.jpg",
    href: "/prodotti",
  },
  {
    tag: "Clima",
    tagColor: "#a33c8c",
    iconImg: "/assets/icona%20pompa.png",
    name: "Pompa di calore aria-acqua",
    image: "/assets/pompadicalore.jpg",
    href: "/prodotti",
  },
];
