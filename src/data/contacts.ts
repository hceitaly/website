import { COMPANY } from "./content";

/* ============================================================
   Contatti — i reparti da chiamare e i tre moduli della pagina.

   Tutto quello che l'azienda dovrà correggere (numeri, caselle
   di posta, orari) sta qui: la pagina si limita a disegnarlo.
   ============================================================ */

export type Department = {
  key: string;
  /** Il reparto, come lo cerca chi chiama. */
  name: string;
  /** Di cosa si occupa, in una riga. */
  text: string;
  /** Numero da comporre: oggi è il centralino per tutti e tre i reparti,
   *  se l'azienda ha linee dirette basta sostituirlo qui. */
  phone: string;
  /** Casella dedicata. SEGNAPOSTO: da confermare con l'azienda. */
  email: string;
  hours: string;
};

export const DEPARTMENTS: Department[] = [
  {
    key: "tecnico",
    name: "Ufficio tecnico",
    text: "Dimensionamento, compatibilità fra componenti e configurazioni da verificare prima dell'ordine.",
    phone: COMPANY.phone,
    email: "tecnico@hceitaly.it",
    hours: "Lun–Ven 8:30–13:00 / 14:00–18:00",
  },
  {
    key: "assistenza",
    name: "Assistenza",
    text: "Supporto dopo la consegna: guasti, sostituzioni in garanzia e messa in servizio.",
    phone: COMPANY.phone,
    email: "assistenza@hceitaly.it",
    hours: "Lun–Ven 9:00–13:00 / 14:00–17:30",
  },
  {
    key: "commerciale",
    name: "Ufficio commerciale",
    text: "Offerte, disponibilità a magazzino, tempi di consegna e condizioni per la rete installatori.",
    phone: COMPANY.phone,
    email: "commerciale@hceitaly.it",
    hours: "Lun–Ven 8:30–13:00 / 14:00–18:00",
  },
];

/* ---------------- I tre moduli ---------------- */

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
  required?: boolean;
  /** Occupa tutte e due le colonne della griglia. */
  wide?: boolean;
  autoComplete?: string;
};

export type FormDef = {
  /** Anche l'ancora: "/contatti#lavora-con-noi" apre già la scheda giusta. */
  id: string;
  /** L'etichetta del bottone che sceglie il modulo. */
  tab: string;
  title: string;
  text: string;
  /** Prima domanda, a risposta chiusa: orienta il resto della richiesta. */
  choice?: { label: string; options: string[] };
  fields: FieldDef[];
  cta: string;
  /** Cosa si legge a invio avvenuto. */
  done: string;
};

/** Presenti in tutti e tre i moduli, nello stesso ordine. */
const IDENTITY: FieldDef[] = [
  {
    name: "nome",
    label: "Nome e cognome",
    placeholder: "Mario Rossi",
    required: true,
    autoComplete: "name",
  },
  {
    name: "azienda",
    label: "Azienda",
    placeholder: "Ragione sociale",
    autoComplete: "organization",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "nome@azienda.it",
    required: true,
    autoComplete: "email",
  },
  {
    name: "telefono",
    label: "Telefono",
    type: "tel",
    placeholder: "+39 000 000 0000",
    autoComplete: "tel",
  },
];

export const CONTACT_FORMS: FormDef[] = [
  {
    id: "richieste",
    tab: "Richieste",
    title: "Richieste e preventivi",
    text: "Un preventivo, la disponibilità a magazzino, una scheda tecnica o una configurazione da controllare: scrivici cosa ti serve e ti risponde il reparto competente.",
    fields: [
      ...IDENTITY,
      {
        name: "prodotto",
        label: "Prodotto o categoria",
        placeholder: "Es. inverter ibrido, accumulo, pompa di calore",
      },
      {
        name: "luogo",
        label: "Luogo dell'impianto",
        placeholder: "Città o provincia",
      },
      {
        name: "messaggio",
        label: "La tua richiesta",
        type: "textarea",
        placeholder: "Descrivi l'impianto, le quantità e i tempi che hai in mente.",
        required: true,
        wide: true,
      },
    ],
    cta: "Invia la richiesta",
    done: "Richiesta ricevuta: ti rispondiamo entro un giorno lavorativo.",
  },
  {
    id: "assistenza",
    tab: "Assistenza",
    title: "Assistenza tecnica",
    text: "Un impianto già in funzione che dà problemi, una sostituzione in garanzia, una messa in servizio da seguire. Più dettagli ci dai, meno passaggi servono per risolvere.",
    choice: {
      label: "Che tipo di intervento serve?",
      options: [
        "Guasto o anomalia",
        "Garanzia e sostituzioni",
        "Messa in servizio",
        "Configurazione e firmware",
      ],
    },
    fields: [
      ...IDENTITY,
      {
        name: "modello",
        label: "Prodotto e modello",
        placeholder: "Es. Fox ESS Serie T 8 kW",
        required: true,
      },
      {
        name: "seriale",
        label: "Numero di serie",
        placeholder: "Lo trovi sull'etichetta del prodotto",
      },
      {
        name: "ordine",
        label: "Riferimento d'ordine o DDT",
        placeholder: "Se lo hai a portata di mano",
      },
      {
        name: "installazione",
        label: "Data di installazione",
        placeholder: "Anche solo il mese e l'anno",
      },
      {
        name: "messaggio",
        label: "Cosa succede",
        type: "textarea",
        placeholder:
          "Descrivi il problema, il codice di errore mostrato e cosa hai già provato.",
        required: true,
        wide: true,
      },
    ],
    cta: "Apri la richiesta di assistenza",
    done: "Richiesta aperta: l'assistenza ti contatta con i prossimi passi.",
  },
  {
    id: "lavora-con-noi",
    tab: "Lavora con noi",
    title: "Lavora con noi",
    text: "Che tu sia un installatore, un rifornitore o semplicemente una persona interessata al nostro settore: noi ascolteremo le tue proposte.",
    choice: {
      label: "Come ti presenti?",
      options: [
        "Installatore",
        "Rifornitore o produttore",
        "Candidatura",
        "Interessato al settore",
      ],
    },
    fields: [
      ...IDENTITY,
      {
        name: "citta",
        label: "Dove operi",
        placeholder: "Città o area geografica",
      },
      {
        name: "link",
        label: "Sito o profilo LinkedIn",
        placeholder: "Un posto dove vedere quello che fai",
      },
      {
        name: "messaggio",
        label: "La tua proposta",
        type: "textarea",
        placeholder:
          "Raccontaci chi sei e cosa hai in mente: collaborazione, fornitura, candidatura.",
        required: true,
        wide: true,
      },
    ],
    cta: "Mandaci la proposta",
    done: "Proposta ricevuta: la leggiamo e ti rispondiamo di persona.",
  },
];

/** Le frasi che scorrono nel pannello di sinistra. */
export const CONTACT_CLAIMS = [
  "Un numero per ogni reparto, non un centralino qualsiasi.",
  "Rispondiamo entro un giorno lavorativo.",
  "Ogni preventivo nasce dall'impianto, non da un listino.",
  "L'assistenza continua dopo la consegna.",
  "Ascoltiamo chi installa, chi fornisce e chi vuole entrare nel settore.",
];
