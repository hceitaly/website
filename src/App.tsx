import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Mission from "./sections/Mission";
import RecentProducts from "./sections/RecentProducts";
import StepsSlider from "./sections/StepsSlider";
import Footer from "./components/Footer";
import { CATALOG } from "./data/products";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

const path = typeof window !== "undefined" ? window.location.pathname : "/";

/** Primary home ("/") uses the paint hero; the 3D scene lives at "/3d". */
const isSecondary = /\/(3d|home-3d)\/?$/i.test(path);
/** Catalogo prodotti. */
const isProducts = /^\/(prodotti|products)\/?$/i.test(path);
/** Documentazione: schede tecniche e manuali di ogni prodotto. */
const isCatalogs = /^\/cataloghi\/?$/i.test(path);
/** Pagina Chi Siamo. */
const isAbout = /^\/(chi-siamo|about)\/?$/i.test(path);
/** Pagina Contatti. */
const isContact = /^\/(contatti|contact)\/?$/i.test(path);
/** Pannello di gestione del catalogo. */
const isAdmin = /^\/admin\/?$/i.test(path);
/** Scheda singola: "/prodotti/<id>". Un id sconosciuto ricade sul catalogo. */
const productId = /^\/(?:prodotti|products)\/([\w-]+)\/?$/i.exec(path)?.[1];
const product = productId ? CATALOG.find((p) => p.id === productId) : undefined;

/* Ogni pagina arriva per conto suo.

   Il sito ne mostra una sola per caricamento — l'indirizzo è già deciso qui
   sopra — ma importandole tutte in cima finivano in un unico file da 1,5 MB che
   ogni visitatore scaricava intero: chi apriva il catalogo si portava dietro
   anche Chi Siamo, i contatti e le due scene tridimensionali. Con `lazy` il
   browser chiede solo il pezzo che serve davvero.

   Vale soprattutto per i due sfondi animati: si portano dietro three.js, che da
   solo pesa più di tutto il resto del sito messo insieme, e servono alla sola
   pagina iniziale.

   Il pannello di gestione è qui per lo stesso motivo: è un pezzo di
   applicazione che serve a una persona sola, e non deve pesare sul sito che
   vedono tutti gli altri. */
const PaintHero = lazy(() => import("./components/PaintHero"));
const IsoHero = lazy(() => import("./components/IsoHero"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CatalogsPage = lazy(() => import("./pages/CatalogsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

export default function App() {
  // Due rami separati e non due rami dentro lo stesso componente: il sito ha
  // i suoi hook (lo scroll morbido, le animazioni), il pannello no.
  if (isAdmin) {
    return (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    );
  }
  return <Site />;
}

function Site() {
  useSmoothScroll();

  return (
    <>
      <Navbar />
      {/* Barra e piede stanno fuori dall'attesa: sono gli stessi ovunque e
          compaiono subito, mentre il pezzo della pagina arriva. */}
      <Suspense fallback={null}>
        {product ? (
          <ProductPage product={product} />
        ) : isProducts || productId ? (
          <ProductsPage />
        ) : isCatalogs ? (
          <CatalogsPage />
        ) : isAbout ? (
          <AboutPage />
        ) : isContact ? (
          <ContactPage />
        ) : (
          <main>
            {/* Niente attesa separata per lo sfondo: deve entrare nella pagina
                insieme a tutto il resto. Montandolo dopo, le animazioni di
                GSAP hanno già spostato i nodi che gli stanno accanto e React
                non ritrova più il punto dove inserirlo — la pagina resta
                bianca. */}
            {isSecondary ? <IsoHero /> : <PaintHero />}
            <Hero />
            <Mission />
            <StepsSlider />
            <RecentProducts />
          </main>
        )}
      </Suspense>
      <Footer />
    </>
  );
}
