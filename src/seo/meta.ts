/* SEO — cosa sa un motore di ricerca di ogni pagina prima di eseguire il
   JavaScript.

   Il sito è una single page app: senza questo modulo ogni indirizzo riceve lo
   stesso index.html, con lo stesso titolo e la stessa descrizione. Google in
   parte rimedia eseguendo lo script, ma chi mostra l'anteprima di un link —
   WhatsApp, LinkedIn, Facebook, Slack — non lo esegue: una scheda prodotto
   condivisa mostrerebbe il titolo della home.

   Qui c'è, per ogni pagina: titolo, descrizione, indirizzo canonico, anteprima
   social e dati strutturati (schema.org). Lo usano due parti:
   - la build (vite.config.ts), che scrive un HTML per pagina, la sitemap e
     robots.txt;
   - il browser (main.tsx), che rimette l'intestazione giusta in sviluppo e
     sugli indirizzi che non hanno un file loro. */

import { CATALOG, CATEGORY_BY_KEY } from "../data/products";
import { COMPANY } from "../data/content";

/** Dominio di produzione. Su Vercel si imposta con VITE_SITE_URL; questo è il
    ripiego, dedotto dall'email aziendale. */
export const DEFAULT_SITE_URL = "https://www.hceitaly.it";

export function siteUrl(fromEnv?: string): string {
  return (fromEnv || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

const SITE_NAME = "HCE — Home Comfort Electronics";

/** Anteprima social di tutte le pagine: 1200×630, il formato che WhatsApp,
    LinkedIn e Facebook mostrano grande. JPG perché LinkedIn non legge WebP. */
const SHARE_IMAGE = { path: "/og-image.jpg", width: 1200, height: 630 };

const LOGO = "/assets/HCE_Logo%20A%20Colori.png";

export type Head = {
  /** Indirizzo canonico, senza dominio. */
  path: string;
  title: string;
  description: string;
  /** `false` per le pagine che non devono finire nei risultati. */
  index: boolean;
  /** Voci del percorso, per le "briciole" nei risultati di Google. */
  crumbs: { name: string; path: string }[];
  /** Pagine che portano con sé i dati dell'azienda. */
  organization: boolean;
  website: boolean;
};

/** Accorcia a una frase intera: Google taglia oltre i ~155 caratteri, meglio
    decidere noi dove. */
function clip(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s—–-]+$/, "")}…`;
}

const HOME = { name: "Home", path: "/" };

/* ---------------------------------------------------------------- */
/* Le pagine                                                         */
/* ---------------------------------------------------------------- */

const PAGES: Record<string, Omit<Head, "path">> = {
  "/": {
    title: "HCE — Fotovoltaico, accumulo, clima e mobilità elettrica",
    description:
      "Distributore a Padova di moduli fotovoltaici, inverter, sistemi di accumulo, ricarica per auto elettriche e pompe di calore: prodotti selezionati, consulenza tecnica e assistenza.",
    index: true,
    crumbs: [],
    organization: true,
    website: true,
  },
  "/prodotti": {
    title: "Catalogo prodotti | HCE",
    description:
      "Moduli fotovoltaici, inverter Fox ESS, sistemi di accumulo, wall box e pompe di calore Ferroli: il catalogo HCE, con modelli, schede tecniche e richiesta di preventivo.",
    index: true,
    crumbs: [HOME, { name: "Prodotti", path: "/prodotti" }],
    organization: false,
    website: false,
  },
  "/cataloghi": {
    title: "Cataloghi, schede tecniche e manuali | HCE",
    description:
      "Schede tecniche, manuali di installazione e certificazioni di tutti i prodotti HCE — fotovoltaico, inverter, accumulo, mobilità elettrica e clima — da scaricare in PDF.",
    index: true,
    crumbs: [HOME, { name: "Cataloghi", path: "/cataloghi" }],
    organization: false,
    website: false,
  },
  "/chi-siamo": {
    title: "Chi siamo | HCE",
    description:
      "H.C.E. srl: distribuzione specializzata per l'energia a Padova. Selezioniamo i prodotti, affianchiamo gli installatori e assistiamo prima, durante e dopo l'acquisto.",
    index: true,
    crumbs: [HOME, { name: "Chi siamo", path: "/chi-siamo" }],
    organization: true,
    website: false,
  },
  "/contatti": {
    title: "Contatti | HCE",
    description: `Contatti di ${COMPANY.name} a Padova: ufficio commerciale, ufficio tecnico e assistenza. Telefono ${COMPANY.phone}, email ${COMPANY.email}.`,
    index: true,
    crumbs: [HOME, { name: "Contatti", path: "/contatti" }],
    organization: true,
    website: false,
  },
};

/** Gli indirizzi inglesi e le varianti della home: su Vercel i primi fanno un
    redirect permanente, ma l'intestazione deve comunque dire qual è l'originale. */
const ALIASES: Record<string, string> = {
  "/about": "/chi-siamo",
  "/contact": "/contatti",
  "/products": "/prodotti",
};

/** La testa di una pagina, dato il suo indirizzo (con o senza query). */
export function headFor(pathname: string): Head {
  let path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  path = path.toLowerCase().replace(/^\/products(?=\/)/, "/prodotti");
  path = ALIASES[path] ?? path;

  if (PAGES[path]) return { path, ...PAGES[path] };

  // La home in 3D è la stessa home: non va indicizzata come pagina a parte.
  if (path === "/3d" || path === "/home-3d") return { ...headFor("/"), path: "/", index: false };

  if (path === "/admin") {
    return {
      path,
      title: "Pannello prodotti | HCE",
      description: "Area riservata.",
      index: false,
      crumbs: [],
      organization: false,
      website: false,
    };
  }

  const id = /^\/prodotti\/([\w-]+)$/.exec(path)?.[1];
  const product = id ? CATALOG.find((p) => p.id === id) : undefined;
  if (product) {
    const cat = CATEGORY_BY_KEY[product.category];
    const full = `${product.name} | ${cat.label} | HCE`;
    return {
      path,
      // Oltre i ~65 caratteri Google taglia: via la categoria, resta il nome.
      title: full.length <= 65 ? full : `${product.name} | HCE`,
      description: clip(
        product.intro ??
          `${product.name}: ${cat.label.toLowerCase()} nel catalogo HCE, con modelli, schede tecniche e richiesta di preventivo.`,
      ),
      index: true,
      crumbs: [HOME, { name: "Prodotti", path: "/prodotti" }, { name: product.name, path }],
      organization: false,
      website: false,
    };
  }

  // Un prodotto che non esiste mostra il catalogo, e un indirizzo sconosciuto
  // la home: contenuti che vivono altrove, quindi fuori dai risultati.
  if (id) return { ...headFor("/prodotti"), index: false };
  return { ...headFor("/"), index: false };
}

/* ---------------------------------------------------------------- */
/* Dati strutturati                                                  */
/* ---------------------------------------------------------------- */

/* Nessun `Product` di schema.org sulle schede: Google lo considera valido solo
   con prezzo, recensioni o valutazioni, e senza segnalerebbe ogni scheda come
   errore in Search Console. Le schede portano le briciole, che non chiedono
   nulla del genere. */

function structuredData(head: Head, site: string): object[] {
  const out: object[] = [];
  const org = `${site}/#organizzazione`;

  if (head.organization) {
    const a = COMPANY.addressParts;
    out.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": org,
      name: COMPANY.name,
      alternateName: SITE_NAME,
      url: `${site}/`,
      logo: `${site}${LOGO}`,
      email: COMPANY.email,
      telephone: COMPANY.phone.replace(/[^\d+]/g, ""),
      vatID: `IT${COMPANY.taxCode}`,
      taxID: COMPANY.taxCode,
      address: {
        "@type": "PostalAddress",
        streetAddress: a.street,
        postalCode: a.postalCode,
        addressLocality: a.city,
        addressRegion: a.province,
        addressCountry: a.country,
      },
    });
  }

  if (head.website) {
    out.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: `${site}/`,
      name: SITE_NAME,
      inLanguage: "it-IT",
      publisher: { "@id": org },
    });
  }

  if (head.crumbs.length > 1) {
    out.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: head.crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: `${site}${c.path === "/" ? "/" : c.path}`,
      })),
    });
  }

  return out;
}

/* ---------------------------------------------------------------- */
/* HTML                                                              */
/* ---------------------------------------------------------------- */

function attr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * I tag della testa. Ognuno porta `data-seo`: è così che il browser li ritrova
 * e li sostituisce. Il titolo solo se richiesto — nel browser lo imposta
 * `document.title`.
 */
export function renderHead(head: Head, site: string, withTitle = true): string {
  const url = `${site}${head.path === "/" ? "/" : head.path}`;
  const image = `${site}${SHARE_IMAGE.path}`;
  const t = attr(head.title);
  const d = attr(head.description);

  const tags = [
    withTitle ? `<title>${t}</title>` : "",
    `<meta data-seo name="description" content="${d}" />`,
    `<link data-seo rel="canonical" href="${url}" />`,
    `<meta data-seo name="robots" content="${head.index ? "index, follow" : "noindex, follow"}" />`,
    `<meta data-seo property="og:type" content="website" />`,
    `<meta data-seo property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta data-seo property="og:locale" content="it_IT" />`,
    `<meta data-seo property="og:title" content="${t}" />`,
    `<meta data-seo property="og:description" content="${d}" />`,
    `<meta data-seo property="og:url" content="${url}" />`,
    `<meta data-seo property="og:image" content="${image}" />`,
    `<meta data-seo property="og:image:width" content="${SHARE_IMAGE.width}" />`,
    `<meta data-seo property="og:image:height" content="${SHARE_IMAGE.height}" />`,
    `<meta data-seo property="og:image:alt" content="${attr(SITE_NAME)}" />`,
    `<meta data-seo name="twitter:card" content="summary_large_image" />`,
    `<meta data-seo name="twitter:title" content="${t}" />`,
    `<meta data-seo name="twitter:description" content="${d}" />`,
    `<meta data-seo name="twitter:image" content="${image}" />`,
    // `<` scritto come \u003c: un testo con "</script>" non può chiudere il tag.
    ...structuredData(head, site).map(
      (o) => `<script data-seo type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`,
    ),
  ];

  return tags.filter(Boolean).join("\n    ");
}

/* ---------------------------------------------------------------- */
/* Pagine da generare, sitemap, robots                               */
/* ---------------------------------------------------------------- */

/** Ogni indirizzo che ha un suo file HTML alla build. */
export function prerenderRoutes(): string[] {
  return [
    ...Object.keys(PAGES),
    ...CATALOG.map((p) => `/prodotti/${p.id}`),
    "/3d",
    "/home-3d",
    "/admin",
  ];
}

export function sitemap(site: string): string {
  const urls = prerenderRoutes()
    .map((r) => ({ r, head: headFor(r) }))
    // Solo le pagine indicizzabili, e ciascuna una volta sola (la home in 3D
    // ha come canonico la home).
    .filter(({ r, head }) => head.index && head.path === r)
    .map(({ r }) => {
      const id = /^\/prodotti\/(.+)$/.exec(r)?.[1];
      const image = id ? CATALOG.find((p) => p.id === id)?.image : undefined;
      const loc = `${site}${r === "/" ? "/" : r}`;
      return [
        "  <url>",
        `    <loc>${attr(loc)}</loc>`,
        image ? `    <image:image><image:loc>${attr(site + image)}</image:loc></image:image>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function robots(site: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");
}
