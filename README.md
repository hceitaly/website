# HCE — Home Comfort Electronics

Sito vetrina di **H.C.E. srl**, distribuzione specializzata di tecnologie per
fotovoltaico, accumulo, climatizzazione e mobilità elettrica.

Stack: **React + TypeScript + Vite**, animazioni con **GSAP** (+ ScrollTrigger)
e sfondo 3D con **three.js** (`@react-three/fiber` + `drei`).

## Avvio

```bash
npm install
npm run dev      # server di sviluppo su http://localhost:5173
npm run build    # type-check + build di produzione in dist/
npm run preview  # anteprima della build
```

## Struttura

```
src/
├─ main.tsx                 # entrypoint
├─ App.tsx                  # composizione della home
├─ index.css               # reset + base + helper (.container, .eyebrow)
├─ styles/
│  └─ tokens.css           # design tokens (colori brand, font, spaziature)
├─ data/
│  ├─ navigation.ts        # voci di menu
│  └─ content.ts           # testi/dati delle sezioni
├─ hooks/
│  └─ useReveal.ts         # reveal on-scroll con GSAP ScrollTrigger
├─ components/
│  ├─ Logo.tsx             # logo HCE ricostruito in SVG (varianti light/dark)
│  ├─ Icon.tsx             # set di icone SVG
│  ├─ Navbar.tsx           # header fisso + menu mobile
│  ├─ Hero.tsx             # hero con timeline GSAP di ingresso
│  ├─ Section.tsx          # wrapper riutilizzabile per le sezioni
│  ├─ CardGrid.tsx         # griglia di card (prodotti/obiettivi/step)
│  ├─ Footer.tsx           # contatti + ecosistema
│  └─ three/
│     ├─ HeroBackground.tsx  # <Canvas> R3F dello sfondo hero
│     └─ WaveField.tsx       # griglia di punti animata (shader GLSL)
└─ sections/
   ├─ About.tsx            # #chi-siamo
   ├─ Offerings.tsx        # #cosa-offriamo
   ├─ Products.tsx         # #prodotti
   └─ Projects.tsx         # #progetti (placeholder casi studio)
```

## Design system

I colori e i font del brand sono centralizzati in
[`src/styles/tokens.css`](src/styles/tokens.css) come variabili CSS
(`--hce-blue`, `--grad-brand`, `--font-display`, …). Le sezioni usano CSS Modules
per lo styling scoped.

## Prossimi passi

Le sezioni attuali sono una base con i contenuti principali del company profile.
Da sviluppare: dettaglio prodotti, casi studio reali (`#progetti`), pagina
certificati e form di contatto.
