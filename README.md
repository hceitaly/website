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
│  ├─ content.ts           # testi/dati delle sezioni
│  ├─ products.ts          # catalogo: categorie, settori, prodotti
│  └─ productDetails.ts    # contenuti lunghi della scheda prodotto
├─ pages/
│  ├─ ProductsPage.tsx     # "/prodotti": doppio filtro + griglia modulare
│  └─ ProductPage.tsx      # "/prodotti/<id>": foto ferma + colonna che scorre
├─ hooks/
│  └─ useReveal.ts         # reveal on-scroll con GSAP ScrollTrigger
├─ components/
│  ├─ Logo.tsx             # logo HCE ricostruito in SVG (varianti light/dark)
│  ├─ Icon.tsx             # set di icone SVG
│  ├─ Navbar.tsx           # header fisso + menu mobile
│  ├─ Hero.tsx             # hero con timeline GSAP di ingresso
│  ├─ Section.tsx          # wrapper riutilizzabile per le sezioni
│  ├─ CardGrid.tsx         # griglia di card (prodotti/obiettivi/step)
│  ├─ MegaMenu.tsx         # megamenu prodotti, aperto in hover dalla navbar
│  ├─ QuoteDrawer.tsx      # richiesta preventivo: tendina da destra, 2 slide
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

## Rotte

Non c'è un router: `App.tsx` sceglie la pagina dal `pathname`.

| Percorso                | Pagina                                    |
| ----------------------- | ----------------------------------------- |
| `/`                     | home (paint hero)                         |
| `/3d`, `/home-3d`       | home con la scena 3D isometrica           |
| `/prodotti`, `/products`| catalogo prodotti                         |
| `/prodotti?categoria=…` | catalogo con la categoria già filtrata    |
| `/prodotti/<id>`        | scheda prodotto (id di `CATALOG`)         |

## Prossimi passi

Le sezioni attuali sono una base con i contenuti principali del company profile.
Da sviluppare: dettaglio prodotti, casi studio reali (`#progetti`), pagina
certificati e form di contatto.

Il catalogo tiene un prodotto per categoria, con le foto reali scontornate. Sono
ancora provvisorie le immagini delle card "Filtra per settore" e le copertine
catalogo, pescate dalla libreria esistente. In
[`src/data/products.ts`](src/data/products.ts) basta valorizzare `image` su
ogni voce: dove manca subentra il placeholder di categoria.

Il filtro per categoria si può preselezionare dall'URL con
`?categoria=fotovoltaico` (più chiavi separate da virgola): ci arrivano i
bottoni "Scopri…" dello slider in home e le voci del megamenu.

Il filtro per settore è vincolato a quello per categoria: `sectorsForCategories`
calcola quali settori hanno davvero prodotti nelle categorie scelte, e gli
altri diventano grigi e non cliccabili (p.es. il fotovoltaico non ha nulla per
l'agricolo). Se una categoria appena scelta svuota un settore già selezionato,
quel settore viene deselezionato da solo.

La griglia è modulare: 4 colonne di moduli quadrati, gronda di 20px, e ogni
prodotto occupa 1×1 (`square`), 1×2 (`vertical`) o 2×1 (`horizontal`).
L'altezza di riga vale la larghezza di colonna, calcolata in CSS con `100cqw`
— nessuna misura in JS.

La forma **non è un dato del prodotto**: la calcola `layoutShapes()` sul numero
di prodotti effettivamente a schermo, così al cambio filtro la griglia si
riequilibra invece di ereditare le forme del catalogo intero. Lavora a fasce di
2 file × 4 colonne, 6 prodotti ciascuna: 1 orizzontale + 1 verticale + 4
quadrati. Le forme lunghe restano quindi sempre la metà dei quadrati, e le
quattro fasce ruotano la posizione del verticale (colonne 4·1·2·3) perché non si
veda la ripetizione. Oltre l'ottava fila è tutto quadrato.

Aggiungere o togliere prodotti non rompe niente: cambia solo quante fasce
entrano. L'ordine in `CATALOG` conta ancora, perché decide quale prodotto
riceve quale forma e tiene le categorie mescolate.

La voce "Prodotti" della navbar apre in hover
[`MegaMenu`](src/components/MegaMenu.tsx): pannello alto il 40% della finestra,
largo quanto la pagina dentro i margini, tagliato dalle stesse oblique a -12°
dei bottoni del menu (linee, pieni delle categorie e bordo dell'immagine
coincidono). Categorie a sinistra, gamma della categoria al centro, copertina del catalogo a
destra.

Le gamme stanno nella costante `MENU` dentro il componente, non in
`products.ts`: il megamenu elenca tutto il listino, mentre la griglia e le
schede continuano a mostrare i prodotti con foto e contenuti di `CATALOG`. Le
voci che hanno già una scheda portano lì, le altre al catalogo.

Il bottone "Richiedi preventivo" della scheda apre
[`QuoteDrawer`](src/components/QuoteDrawer.tsx): una tendina larga 508px che
entra da destra, con due slide (prodotto → contatti), i consensi privacy e
marketing e l'invio. **L'invio è un segnaposto** (`setSent(true)`, come la
newsletter): va collegato a un servizio reale.

Filtrando per categoria la griglia si apre invece con la **copertina del
catalogo** — foto a tutto riquadro, orizzontale, con "PDF", il tag, il titolo
"Scarica il catalogo …" e il pulsante di download ai quattro angoli — e tutti i
prodotti diventano quadrati. Copertina e PDF stanno su `catalogCover` e
`catalogFile` di ogni categoria: **i PDF vanno ancora depositati** in
`public/cataloghi/` (`fotovoltaico.pdf`, `inverter.pdf`, `accumulo.pdf`,
`mobilita.pdf`, `clima.pdf`), altrimenti il download risponde 404.
