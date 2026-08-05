import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NAV_LINKS } from "../data/navigation";
import MegaMenu from "./MegaMenu";
import styles from "./Navbar.module.css";

gsap.registerPlugin(ScrollTrigger);

/** La voce che apre il megamenu. */
const MEGA_HREF = "/prodotti";
/** Respiro per passare dal bottone al pannello senza che si chiuda. */
const CLOSE_DELAY = 140;

const LOGO_WHITE = "/assets/HCE_Logo%20A%20Bianco.png";
const LOGO_COLOR = "/assets/HCE_Logo%20A%20Colori.png";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const megaTimer = useRef(0);
  // Dark backgrounds by default (hero/slider/footer) -> white logo; light
  // sections (marked data-nav-theme="light") -> colour logo.
  const [onLight, setOnLight] = useState(false);

  // Intro animation: the bar slides down, then each menu button reveals like
  // the site's images — a logo-blue curtain, then the white face, then the
  // label word drops in from above (whole word, top -> bottom).
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const HIDDEN = "inset(0% 0% 100% 0%)"; // clipped to the top edge (empty)
    const SHOWN = "inset(0% 0% 0% 0%)"; // fully visible

    const ctx = gsap.context(() => {
      gsap.from(nav, {
        y: -80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.2,
      });

      const btns = gsap.utils.toArray<HTMLElement>(nav.querySelectorAll("[data-btn]"));
      const tl = gsap.timeline({ delay: 0.55 });

      btns.forEach((b, i) => {
        const blue = b.querySelector<HTMLElement>("[data-blue]");
        const face = b.querySelector<HTMLElement>("[data-face]");
        const word = b.querySelector<HTMLElement>("[data-word]");
        if (!blue || !face || !word) return;
        gsap.set([blue, face], { clipPath: HIDDEN });
        gsap.set(word, { yPercent: -110, opacity: 0 });
        const at = i * 0.11; // buttons cascade left -> right
        tl.to(blue, { clipPath: SHOWN, duration: 0.38, ease: "power2.inOut" }, at)
          .to(face, { clipPath: SHOWN, duration: 0.42, ease: "power2.inOut" }, at + 0.26)
          .to(
            word,
            { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", force3D: false },
            at + 0.5,
          );
      });
    }, nav);

    return () => ctx.revert();
  }, []);

  // Megamenu: apre subito, chiude con un attimo di ritardo così il puntatore
  // può attraversare lo stacco fra il bottone e il pannello.
  const openMega = () => {
    window.clearTimeout(megaTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => setMega(false), CLOSE_DELAY);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMega(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(megaTimer.current);
    };
  }, []);

  // Swap the logo variant based on the section currently under the navbar.
  useEffect(() => {
    const lightSections = gsap.utils.toArray<HTMLElement>('[data-nav-theme="light"]');
    if (!lightSections.length) return;

    const line = 38; // ~ navbar vertical centre (--nav-h / 2)
    const update = () => {
      const overLight = lightSections.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      });
      setOnLight(overLight);
    };

    const triggers = lightSections.map((s) =>
      ScrollTrigger.create({
        trigger: s,
        start: `top ${line}px`,
        end: `bottom ${line}px`,
        onToggle: update,
      }),
    );
    update();

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <header ref={navRef} className={styles.nav}>
      <div className={styles.inner}>
        <div className={`${styles.brandGroup} ${onLight ? styles.brandGroupLight : ""}`}>
          <a href="/" className={styles.brand} aria-label="HCE — vai alla home">
            <img
              src={LOGO_WHITE}
              alt="HCE — Home Comfort Electronics"
              className={`${styles.brandLogo} ${onLight ? "" : styles.brandVisible}`}
              width={960}
              height={540}
            />
            <img
              src={LOGO_COLOR}
              alt=""
              aria-hidden="true"
              className={`${styles.brandLogo} ${onLight ? styles.brandVisible : ""}`}
              width={960}
              height={540}
            />
          </a>

          <span className={styles.brandDivider} aria-hidden="true" />

          <button type="button" className={styles.user} aria-label="Area riservata">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
            </svg>
          </button>
        </div>

        <nav
          className={`${styles.links} ${open ? styles.linksOpen : ""}`}
          aria-label="Navigazione principale"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.link}
              data-btn
              aria-expanded={link.href === MEGA_HREF ? mega : undefined}
              onMouseEnter={link.href === MEGA_HREF ? openMega : closeMega}
              onMouseLeave={link.href === MEGA_HREF ? closeMega : undefined}
              onFocus={link.href === MEGA_HREF ? openMega : closeMega}
              onClick={() => setOpen(false)}
            >
              {/* Reveal layers: logo-blue curtain, then white resting face. */}
              <span className={styles.linkBlue} data-blue aria-hidden="true" />
              <span className={styles.linkFace} data-face aria-hidden="true" />
              {/* Hover: blue wipes down over the face, text turns white. */}
              <span className={styles.linkHover} aria-hidden="true" />
              <span className={styles.labelWrap}>
                <span className={styles.label} data-word>
                  {link.label}
                </span>
              </span>
            </a>
          ))}
        </nav>

        <button
          className={styles.burger}
          aria-label="Apri menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={open ? styles.barTop : ""} />
          <span className={open ? styles.barMid : ""} />
          <span className={open ? styles.barBot : ""} />
        </button>
      </div>

      <MegaMenu open={mega} onEnter={openMega} onLeave={closeMega} />
    </header>
  );
}
