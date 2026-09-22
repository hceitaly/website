import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import IsoHero from "./components/IsoHero";
import PaintHero from "./components/PaintHero";
import Hero from "./components/Hero";
import Mission from "./sections/Mission";
import RecentProducts from "./sections/RecentProducts";
import StepsSlider from "./sections/StepsSlider";
import Footer from "./components/Footer";
import ProductsPage from "./pages/ProductsPage";
import ProductPage from "./pages/ProductPage";
import CatalogsPage from "./pages/CatalogsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
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

/* Il pannello arriva a parte: è un pezzo di applicazione che serve a una
   persona sola, e non deve pesare sul sito che vedono tutti gli altri. */
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
          {isSecondary ? <IsoHero /> : <PaintHero />}
          <Hero />
          <Mission />
          <StepsSlider />
          <RecentProducts />
        </main>
      )}
      <Footer />
    </>
  );
}
