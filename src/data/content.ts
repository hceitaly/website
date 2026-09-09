import type { IconName } from "../components/Icon";

export type Card = {
  icon: IconName;
  title: string;
  text: string;
};

/** "Chi Siamo" — objectives / value props */
export const OBJECTIVES: Card[] = [
  {
    icon: "layers",
    title: "Assortimento selezionato",
    text: "Referenze scelte per applicazioni reali e combinazioni coerenti tra le diverse tecnologie.",
  },
  {
    icon: "headset",
    title: "Supporto all'installatore",
    text: "Indicazioni applicative e supporto nella definizione della configurazione più adatta.",
  },
  {
    icon: "map",
    title: "Copertura nazionale",
    text: "Una struttura logistica su più poli garantisce continuità di servizio su tutto il territorio.",
  },
];

/** "Cosa Offriamo" — the journey we follow with the client */
export const OFFERING_STEPS: Card[] = [
  {
    icon: "target",
    title: "Valutazione",
    text: "Analizziamo esigenze e obiettivi per definire la soluzione tecnica più adatta.",
  },
  {
    icon: "box",
    title: "Fornitura integrata",
    text: "Prodotti selezionati e coerenti tra loro, pronti per l'installazione in campo.",
  },
  {
    icon: "headset",
    title: "Supporto post-vendita",
    text: "Assistenza continua oltre la fornitura, in ogni fase del percorso.",
  },
];

/** "Prodotti" — the 5 product categories from the profile */
export const PRODUCTS: Card[] = [
  {
    icon: "solar",
    title: "Pannelli Fotovoltaici",
    text: "Moduli ad alta efficienza per ogni tipologia di impianto residenziale e industriale.",
  },
  {
    icon: "inverter",
    title: "Inverter Fotovoltaici",
    text: "Conversione affidabile e monitoraggio per impianti di ogni dimensione.",
  },
  {
    icon: "battery",
    title: "Sistemi di Accumulo",
    text: "Batterie e storage per massimizzare l'autoconsumo e l'indipendenza energetica.",
  },
  {
    icon: "ev",
    title: "Mobilità Elettrica",
    text: "Soluzioni di ricarica per accompagnare il passaggio alla mobilità sostenibile.",
  },
  {
    icon: "climate",
    title: "Condizionatori e Pompe di Calore",
    text: "Climatizzazione efficiente e riscaldamento a basso consumo energetico.",
  },
];

/** Ecosystem partners — descrizioni dal profilo aziendale. */
export const ECOSYSTEM = [
  {
    name: "GMT S.p.A.",
    text: "G.M.T. S.p.A. è attiva nell'applicazione di tecnologie efficienti per l'uso razionale dell'energia, al fine di ridurre i consumi energetici e concorrere al raggiungimento degli obiettivi previsti dall'agenda ONU 2030.",
  },
  {
    name: "KOINÈ",
    text: "KOINÈ ETS è una fondazione senza scopo di lucro nata per promuovere un nuovo modello di sviluppo sostenibile, con l'obiettivo di coinvolgere comunità, istituzioni e imprese in percorsi di crescita responsabile.",
  },
  {
    name: "ZapGrid",
    text: "ZapGrid è l'anello di collegamento tra i gestori delle stazioni e-mobility e gli utilizzatori di autoveicoli elettrici. ZapGrid si occupa dell'invisibile processo che coniuga l'offerta e la domanda nel mondo della mobilità elettrica.",
  },
];

export const COMPANY = {
  name: "H.C.E. srl",
  address: "Via Sesta Strada, 8 — 35129 Padova (PD)",
  phone: "+39 049.5479331",
  email: "info@hceitaly.it",
};
