import Navbar from "./components/Navbar";
import IsoHero from "./components/IsoHero";
import PaintHero from "./components/PaintHero";
import Hero from "./components/Hero";
import Mission from "./sections/Mission";
import RecentProducts from "./sections/RecentProducts";
import StepsSlider from "./sections/StepsSlider";
import Newsletter from "./sections/Newsletter";
import Footer from "./components/Footer";
import ProductsPage from "./pages/ProductsPage";
import ProductPage from "./pages/ProductPage";
import { CATALOG } from "./data/products";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

const path = typeof window !== "undefined" ? window.location.pathname : "/";

/** Primary home ("/") uses the paint hero; the 3D scene lives at "/3d". */
const isSecondary = /\/(3d|home-3d)\/?$/i.test(path);
/** Catalogo prodotti. */
const isProducts = /^\/(prodotti|products)\/?$/i.test(path);
/** Scheda singola: "/prodotti/<id>". Un id sconosciuto ricade sul catalogo. */
const productId = /^\/(?:prodotti|products)\/([\w-]+)\/?$/i.exec(path)?.[1];
const product = productId ? CATALOG.find((p) => p.id === productId) : undefined;

export default function App() {
  useSmoothScroll();

  return (
    <>
      <Navbar />
      {product ? (
        <ProductPage product={product} />
      ) : isProducts || productId ? (
        <ProductsPage />
      ) : (
        <main>
          {isSecondary ? <IsoHero /> : <PaintHero />}
          <Hero />
          <Mission />
          <StepsSlider />
          <RecentProducts />
          <Newsletter />
        </main>
      )}
      <Footer />
    </>
  );
}
