export type NavLink = { label: string; href: string };

export const NAV_LINKS: NavLink[] = [
  { label: "Chi Siamo", href: "/chi-siamo" },
  { label: "Prodotti", href: "/prodotti" },
  { label: "Contatti", href: "/contatti" },
];

/** The three large shortcut cells in the footer. */
export const FOOTER_SHORTCUTS: NavLink[] = [
  { label: "I Nostri Prodotti", href: "/prodotti" },
  { label: "Chi Siamo", href: "/chi-siamo" },
  { label: "Contattaci", href: "/contatti" },
];
