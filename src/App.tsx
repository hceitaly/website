import Navbar from "./components/Navbar";
import IsoHero from "./components/IsoHero";
import PaintHero from "./components/PaintHero";
import Hero from "./components/Hero";
import Mission from "./sections/Mission";
import RecentProducts from "./sections/RecentProducts";
import StepsSlider from "./sections/StepsSlider";
import Newsletter from "./sections/Newsletter";
import Footer from "./components/Footer";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

/** Primary home ("/") uses the paint hero; the 3D scene lives at "/3d". */
const isSecondary =
  typeof window !== "undefined" && /\/(3d|home-3d)\/?$/i.test(window.location.pathname);

export default function App() {
  useSmoothScroll();

  return (
    <>
      <Navbar />
      <main>
        {isSecondary ? <IsoHero /> : <PaintHero />}
        <Hero />
        <Mission />
        <StepsSlider />
        <RecentProducts />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
