import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Icon from "../components/Icon";
import PixelLiquidBg from "../components/PixelLiquidBg";
import { useReveal } from "../hooks/useReveal";
import { scrollToTarget } from "../hooks/useSmoothScroll";
import styles from "./AboutPage.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ============================================================
   Chi Siamo — la pagina ricalca il riferimento di design
   (apertura, manifesto, valori, team, finale video) declinato
   sui colori, i caratteri e le immagini di HCE.
   ============================================================ */

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Tendina doppia (come in home) ---------------- */

const CURTAIN_HIDDEN = "inset(0% 0% 100% 0%)"; // tendina chiusa sul bordo alto
const CURTAIN_SHOWN = "inset(0% 0% 0% 0%)";

/** I due strati sotto ogni foto: il velo blu che cala per primo, poi la foto
 *  che gli cala sopra e lo copre. `fillClass` serve quando l'immagine è un
 *  PNG ritagliato: sotto ci vuole un fondo, o il velo trasparirebbe. */
function Curtain({ src, alt, fillClass }: { src: string; alt: string; fillClass?: string }) {
  return (
    <>
      <span className={styles.cover} data-cover aria-hidden="true" />
      <span className={`${styles.fill}${fillClass ? ` ${fillClass}` : ""}`} data-fill>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </span>
    </>
  );
}

/** Accoda alla timeline la doppia tendina dei `medias` a partire dal tempo
 *  `at`: ogni foto successiva parte 0.22s dopo la precedente, come in home. */
function curtainIn(tl: gsap.core.Timeline, medias: HTMLElement[], at = 0) {
  medias.forEach((m, i) => {
    const cover = m.querySelector<HTMLElement>("[data-cover]");
    const fill = m.querySelector<HTMLElement>("[data-fill]");
    if (!cover || !fill) return;
    gsap.set([cover, fill], { clipPath: CURTAIN_HIDDEN });
    const t = at + i * 0.22;
    tl.to(cover, { clipPath: CURTAIN_SHOWN, duration: 0.45, ease: "power2.inOut" }, t).to(
      fill,
      { clipPath: CURTAIN_SHOWN, duration: 0.6, ease: "power2.inOut" },
      t + 0.4,
    );
  });
}

/* ---------------- Apertura ---------------- */

/* Lo stesso fondo liquido dell'hero della home, ma sul caldo della pagina:
   il fluido parte dal colore della carta e si addensa in un'ombra appena
   azzurrata, così le scritte nere restano leggibili. */
const HERO_PALETTE = ["#f2efea", "#e7e1d6", "#d4d2cc", "#b9c3d0", "#93aec9"];
/** Il fondo di `.page`: le zone ferme del canvas devono sparirci dentro. */
const HERO_BG = "#f2efea";

/* Il marchio sta sopra al fluido, non dentro: il canvas fa da fondo e basta,
   così il segno resta netto e il mouse non lo tocca. */
const HERO_LOGO = "/assets/HCE_Logo%20A%20Colori.png";

function Belief() {
  const ref = useRef<HTMLElement>(null);
  const [noMotion] = useState(reduced);

  /* Il bottone punta alla sezione "Lavora con noi", in fondo alla pagina:
     ci arriva con lo scorrimento morbido di Lenis invece che di scatto. */
  const goToCareers = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("lavora-con-noi");
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target, -100);
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      // Tutta l'apertura entra in sequenza all'arrivo sulla pagina: il ritardo
      // lascia finire la tendina della transizione fra pagine.
      const tl = gsap.timeline({ delay: 0.35 });

      // Il marchio sale dentro il proprio riquadro, come le scritte in
      // maschera del resto della pagina: il riquadro taglia, l'immagine sale.
      tl.from("[data-wordmark]", { yPercent: 100, duration: 1, ease: "power3.out" }, 0);

      const claim = el.querySelector<HTMLElement>("[data-claim]");
      if (claim) {
        const split = new SplitText(claim, { type: "words", mask: "words" });
        splits.push(split);
        tl.from(
          split.words,
          {
            yPercent: 115,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: { amount: 0.45 },
          },
          0.35,
        );
      }
      tl.from("[data-claim-rule]", { scaleX: 0, duration: 0.7, ease: "power2.inOut" }, 0.6)
        .from("[data-claim-hint]", { y: 14, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.75)
        .from("[data-recruit]", { y: 30, opacity: 0, duration: 0.85, ease: "power3.out" }, 0.55);

      // L'apertura resta ferma mentre il resto della pagina le sale sopra,
      // come l'hero della home. `pinSpacing` deve restare false: con lo spazio
      // di riserva la sezione seguente verrebbe spinta più in basso e non
      // arriverebbe mai ad attraversarla.
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: false,
      });
    }, el);

    return () => {
      splits.forEach((split) => split.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.belief} data-nav-theme="light">
      <div className={styles.beliefCanvas} aria-hidden="true">
        <PixelLiquidBg
          palette={HERO_PALETTE}
          bgColor={HERO_BG}
          pixelSize={16}
          resolution={0.4}
          mouseForce={9}
          cursorSize={110}
          autoDemo={!noMotion}
        />
      </div>

      {/* Il marchio, grande al centro: appoggiato sopra al fluido e fuori
          dalla sua portata. Il riquadro fa da maschera all'entrata dal basso. */}
      <h1 className={styles.wordmark}>
        <span className={styles.wordmarkMark} data-wordmark aria-hidden="true">
          <img className={styles.wordmarkImg} src={HERO_LOGO} alt="" />
        </span>
        <span className={styles.wordmarkLabel}>HCE — Home Comfort Electronics</span>
      </h1>

      {/* In basso a sinistra: la frase e l'invito a scendere. */}
      <div className={styles.claim}>
        <p className={styles.claimText} data-claim>
          La qualità è l&apos;unica direzione che seguiamo
        </p>
        <span className={styles.claimRule} data-claim-rule aria-hidden="true" />
        <span className={styles.claimHint} data-claim-hint>
          Ecco come facciamo
          <Icon name="arrow" className={styles.claimArrow} />
        </span>
      </div>

      {/* In basso a destra: la ricerca di personale, sul video dell'azienda. */}
      <aside className={styles.recruit} data-recruit aria-label="Lavora con noi">
        <video
          className={styles.recruitVideo}
          src="/assets/video-chi-siamo.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <span className={styles.recruitShade} aria-hidden="true" />

        <p className={styles.recruitText}>
          Cerchiamo menti appassionate da coinvolgere nel nostro percorso.
        </p>

        <a
          className={styles.work}
          href="#lavora-con-noi"
          onClick={goToCareers}
          data-no-transition
        >
          <Icon name="hand" className={styles.workIcon} />
          <span className={styles.workLabel}>Lavora con noi</span>
        </a>
      </aside>
    </section>
  );
}

/* ---------------- L'ecosistema ---------------- */

/** Le quattro realtà del gruppo, nell'ordine in cui compaiono. */
const ECO = [
  {
    name: "HCE",
    role: "Home Comfort Electronics",
    img: "/assets/inverter.jpg",
    text: "Distribuzione specializzata di fotovoltaico, accumulo, climatizzazione e ricarica, con assistenza tecnica a chi installa.",
  },
  {
    name: "G.M.T.",
    role: "Efficienza energetica",
    img: "/assets/pinsnap-106327241187857624.jpg",
    text: "Tecnologie per l'uso razionale dell'energia: consumi più bassi e obiettivi dell'agenda ONU 2030 più vicini.",
  },
  {
    name: "ZapGrid",
    role: "Mobilità elettrica",
    img: "/assets/mobilita-elettrica.jpg",
    text: "L'anello fra chi gestisce le stazioni di ricarica e chi guida elettrico: domanda e offerta che si incontrano.",
  },
  {
    name: "KOINÈ",
    role: "Sviluppo sostenibile",
    img: "/assets/pannelli-solari.jpg",
    text: "Fondazione senza scopo di lucro: comunità, istituzioni e imprese insieme, su un modello di crescita responsabile.",
  },
];

/** Larghezza a riposo di ogni riquadro, in percentuale. */
const ECO_BASE = 25;
/** Di quanto cresce quello sotto il mouse. */
const ECO_GROW = 5;

/**
 * Le larghezze dei quattro riquadri. Lo spazio lo cede solo il lato verso cui
 * il riquadro si apre: i primi due crescono verso destra (cedono quelli dopo),
 * gli ultimi due verso sinistra (cedono quelli prima). Così il bordo fermo di
 * ogni riquadro resta davvero fermo.
 */
function ecoWidths(active: number | null) {
  const w = ECO.map(() => ECO_BASE);
  if (active === null) return w;
  const donors = ECO.map((_, i) => i).filter((i) =>
    active < ECO.length / 2 ? i > active : i < active,
  );
  if (!donors.length) return w;
  w[active] = ECO_BASE + ECO_GROW;
  donors.forEach((i) => {
    w[i] = ECO_BASE - ECO_GROW / donors.length;
  });
  return w;
}

function Ecosystem() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const widths = ecoWidths(active);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      const title = el.querySelector<HTMLElement>("[data-eco-title]");
      if (title) {
        const split = new SplitText(title, { type: "words", mask: "words" });
        splits.push(split);
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.5 },
          scrollTrigger: { trigger: el, start: "top 78%", once: true },
        });
      }

      // Il testo entra riga per riga; `autoSplit` rifà le righe se il testo
      // rifluisce, e `onSplit` rimonta l'animazione — a meno che sia già
      // passata: allora le righe nuove restano semplicemente visibili.
      const text = el.querySelector<HTMLElement>("[data-eco-text]");
      if (text) {
        let shown = false;
        let tween: gsap.core.Tween | undefined;
        splits.push(
          new SplitText(text, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              tween?.scrollTrigger?.kill();
              tween?.kill();
              if (shown) return;
              tween = gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.08,
                scrollTrigger: {
                  trigger: text,
                  start: "top 84%",
                  once: true,
                  onEnter: () => {
                    shown = true;
                  },
                },
              });
            },
          }),
        );
      }

      gsap.from("[data-eco-row]", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1,
        ease: "power2.inOut",
        scrollTrigger: { trigger: "[data-eco-row]", start: "top 88%", once: true },
      });

      gsap.from("[data-eco-cell]", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-eco-row]", start: "top 85%", once: true },
      });
    }, el);

    return () => {
      splits.forEach((split) => split.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.eco} aria-label="L'ecosistema HCE" data-nav-theme="light">
      <div className={styles.ecoHead}>
        <h2 className={styles.ecoTitle} data-eco-title>
          Molto più di un&apos;azienda
        </h2>
        <p className={styles.ecoIntro} data-eco-text>
          H.C.E. S.r.l. si inserisce in un ecosistema orientato all&apos;innovazione
          sostenibile portando competenze trasversali nei settori dell&apos;energia,
          della mobilità elettrica e della salute. Nata nel 2008, ha saputo evolversi
          nel tempo affiancando realtà come G.M.T., KOINÈ e ZapGrid, contribuendo a
          costruire un sistema integrato di soluzioni per le sfide ambientali e
          tecnologiche del presente e del futuro.
        </p>
      </div>

      {/* I quattro riquadri: quello sotto il mouse si allarga e scopre la foto. */}
      <div className={styles.ecoRow} data-eco-row>
        {ECO.map((c, i) => (
          <article
            key={c.name}
            className={`${styles.ecoCell} ${active === i ? styles.ecoCellOn : ""}`}
            style={{ "--eco-w": `${widths[i]}%` } as CSSProperties}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive((prev) => (prev === i ? null : prev))}
            data-eco-cell
          >
            <img
              className={styles.ecoImg}
              src={c.img}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
            <span className={styles.ecoShade} aria-hidden="true" />

            <div className={styles.ecoBody}>
              <h3 className={styles.ecoName}>
                {c.name}
                <span className={styles.ecoRole}>{c.role}</span>
              </h3>

              <div className={styles.ecoFoot}>
                <span className={styles.ecoNumber} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className={styles.ecoText}>{c.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Manifesto disteso ---------------- */

function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  // In testa alla sezione, in un'unica sequenza: la lineetta dell'etichetta si
  // tira da sinistra, la scritta sale, la doppia tendina cala sul prodotto e
  // la linea del binario scende lungo la colonna di destra. Poi, ognuno al
  // proprio ingresso: la frase parola per parola, le origini riga per riga,
  // la foto in fondo con la stessa tendina.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      const tagLine = el.querySelector<HTMLElement>("[data-tag-line]");
      const tagText = el.querySelector<HTMLElement>("[data-tag-text]");
      const object = el.querySelector<HTMLElement>("[data-object]");
      const statement = el.querySelector<HTMLElement>("[data-manifesto]");
      const railLine = el.querySelector<HTMLElement>("[data-rail-line]");
      const story = el.querySelector<HTMLElement>("[data-story]");
      const shot = el.querySelector<HTMLElement>("[data-rail-shot]");

      // La linea del binario è verticale sul desktop, e scende dall'alto;
      // sotto i 900px è orizzontale, e si tira da sinistra.
      const railHidden = () =>
        window.matchMedia("(max-width: 900px)").matches
          ? "inset(0% 100% 0% 0%)"
          : "inset(0% 0% 100% 0%)";

      if (tagLine) gsap.set(tagLine, { clipPath: "inset(0% 100% 0% 0%)" });
      if (tagText) gsap.set(tagText, { y: 12, opacity: 0 });
      if (railLine) gsap.set(railLine, { clipPath: railHidden() });

      const head = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 75%", once: true },
        // Lo stato di partenza della linea si rilegge al via: nel frattempo la
        // finestra può essere passata dall'altra parte del breakpoint.
        onStart: () => {
          if (railLine) gsap.set(railLine, { clipPath: railHidden() });
        },
      });
      if (tagLine) {
        head.to(tagLine, { clipPath: CURTAIN_SHOWN, duration: 0.7, ease: "power2.inOut" }, 0);
      }
      if (tagText) {
        head.to(tagText, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.15);
      }
      if (object) curtainIn(head, [object], 0.1);
      if (railLine) {
        head.to(railLine, { clipPath: CURTAIN_SHOWN, duration: 1.4, ease: "power2.inOut" }, 0.2);
      }

      // La frase, parola per parola, come il manifesto in cima alla pagina.
      if (statement) {
        const split = new SplitText(statement, { type: "words", mask: "words" });
        splits.push(split);
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.9 },
          scrollTrigger: { trigger: statement, start: "top 82%", once: true },
        });
      }

      // Le origini, riga per riga. Se il testo rifluisce (il font che arriva,
      // la finestra che cambia) `autoSplit` rifà le righe e richiama `onSplit`,
      // che rimonta l'animazione — a meno che non sia già passata: allora le
      // righe nuove restano semplicemente visibili.
      if (story) {
        let shown = false;
        let tween: gsap.core.Tween | undefined;
        splits.push(
          new SplitText(story, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              tween?.scrollTrigger?.kill();
              tween?.kill();
              if (shown) return;
              tween = gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.1,
                scrollTrigger: {
                  trigger: story,
                  start: "top 85%",
                  once: true,
                  onEnter: () => {
                    shown = true;
                  },
                },
              });
            },
          }),
        );
      }

      // La foto in fondo al binario: la stessa doppia tendina, al suo ingresso.
      if (shot) {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: shot, start: "top 88%", once: true },
        });
        curtainIn(tl, [shot]);
      }
    }, el);

    return () => {
      splits.forEach((split) => split.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.manifesto} aria-label="Il nostro manifesto" data-nav-theme="light">
      {/* Colonna principale: il prodotto etichettato in alto, poi la frase
          a tutta larghezza con il capoverso rientrato, come nel riferimento. */}
      <div className={styles.manifestoMain}>
        <figure className={styles.manifestoObject}>
          <figcaption className={styles.manifestoTag}>
            <span className={styles.tagLine} data-tag-line aria-hidden="true" />
            <span className={styles.tagText} data-tag-text>
              Inverter Serie T ↓
            </span>
          </figcaption>
          <div className={styles.manifestoObjectMedia} data-object>
            <Curtain
              src="/assets/inverter-serie%20t.png"
              alt="Inverter Fox ESS Serie T"
              fillClass={styles.fillPaper}
            />
          </div>
        </figure>

        {/* Le parole accentate viaggiano con la loro punteggiatura: SplitText
            fa della virgola una "parola" a sé, e senza il `nowrap` potrebbe
            andare a capo da sola. */}
        <p className={styles.manifestoText} data-manifesto>
          H.C.E. S.r.l. lavora ogni giorno per essere un punto di riferimento{" "}
          <span className={styles.manifestoAccent}>affidabile</span> nel panorama
          della transizione energetica e della mobilità{" "}
          <span className={styles.nowrap}>
            <span className={styles.manifestoAccent}>sostenibile</span>.
          </span>
        </p>
      </div>

      {/* Binario destro: la linea verticale, le origini in breve e una foto. */}
      <aside className={styles.manifestoRail}>
        <span className={styles.railLine} data-rail-line aria-hidden="true" />
        <p className={styles.manifestoStory} data-story>
          L&apos;obiettivo non è solo fornire prodotti, ma contribuire attivamente
          a un modello di sviluppo più responsabile e orientato al futuro.
        </p>
        <figure className={styles.manifestoShot} data-rail-shot>
          <Curtain src="/assets/inverter.jpg" alt="Inverter installato in campo" />
        </figure>
      </aside>
    </section>
  );
}

/* ---------------- Come lavoriamo ---------------- */

/** I quattro passaggi, con la foto che li accompagna. */
const METHOD = [
  {
    title: "Analisi dell'esigenza",
    text: "Ascoltiamo il progetto e troviamo il metodo migliore per realizzarlo.",
    img: "/assets/pannelli-solari.jpg",
  },
  {
    title: "Configurazione",
    text: "Il nostro ufficio tecnico dimensiona i sistemi e trova i componenti che fanno per te.",
    img: "/assets/inverter.jpg",
  },
  {
    title: "Fornitura",
    text: "Selezioniamo i prodotti e in base alle indicazioni li spediamo o installiamo in loco.",
    img: "/assets/batterie.webp",
  },
  {
    title: "Assistenza",
    text: "Ti seguiremo anche dopo l'installazione, per verificare che tutto funzioni correttamente.",
    img: "/assets/pompadicalore.jpg",
  },
];

function Method() {
  const ref = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    const sticky = stickyRef.current;
    if (!el || !sticky || reduced()) return;

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      const title = el.querySelector<HTMLElement>("[data-method-title]");
      if (title) {
        const split = new SplitText(title, { type: "words", mask: "words" });
        splits.push(split);
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.5 },
          scrollTrigger: { trigger: el, start: "top 78%", once: true },
        });
      }

      gsap.from("[data-method-label]", {
        y: 16,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
      });

      // La riga alla quale avviene il cambio: la metà dell'immagine ferma.
      // Sul bordo alto il cambio arrivava troppo presto — il blocco nuovo era
      // ancora sotto la foto, e accanto al testo che si stava leggendo si
      // vedeva la foto di quello prima. A metà foto le due cose combaciano.
      // Lo scostamento va letto dal CSS (`top`), non dal riquadro
      // dell'elemento: quello si muove con la pagina, e la riga di cambio si
      // sposterebbe con lui. L'altezza invece sta ferma.
      const switchLine = () =>
        (parseFloat(getComputedStyle(sticky).top) || 0) + sticky.offsetHeight / 2;
      const line = () => `top ${switchLine()}px`;

      gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-method-step]")).forEach(
        (step, i) => {
          ScrollTrigger.create({
            trigger: step,
            start: line,
            // Stessa riga dell'inizio: un blocco lascia il posto al seguente
            // nello stesso istante, senza vuoti fra l'uno e l'altro.
            end: () => `bottom ${switchLine()}px`,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              if (self.isActive) setShown(i);
            },
          });

          gsap.from(step, {
            y: 34,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 88%", once: true },
          });
        },
      );
    }, el);

    return () => {
      splits.forEach((split) => split.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.method} aria-label="Come lavoriamo" data-nav-theme="light">
      <div className={styles.methodHead}>
        <span className={styles.methodLabel} data-method-label>
          Come lavoriamo
        </span>
        <h2 className={styles.methodTitle} data-method-title>
          Il metodo HCE
        </h2>
      </div>

      <div className={styles.methodBody}>
        {/* La colonna sinistra attraversa tutte le righe: la foto ci resta
            agganciata mentre i blocchi le scorrono accanto. */}
        <div className={styles.methodMediaCol}>
          <div ref={stickyRef} className={styles.methodSticky}>
            {METHOD.map((m, i) => (
              <img
                key={m.img}
                className={`${styles.methodImg} ${i === shown ? styles.methodImgOn : ""}`}
                src={m.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
            ))}

            {/* La "e" del marchio, in bianco, nell'angolo in alto a destra. */}
            <span className={styles.methodMark} aria-hidden="true">
              <img src="/assets/HCE_Icona%20A%20Bianca.png" alt="" width={960} height={960} />
            </span>
          </div>
        </div>

        {METHOD.map((m, i) => (
          <article key={m.title} className={styles.methodStep} data-method-step>
            {/* Senza colonna affiancata (schermi stretti) ogni blocco porta
                con sé la propria foto. */}
            <img
              className={styles.methodStepImg}
              src={m.img}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
            <h3 className={styles.methodStepTitle}>{m.title}</h3>
            <p className={styles.methodStepText}>{m.text}</p>
            <span className={styles.methodNumber} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Il team ---------------- */

const DEPARTMENTS = [
  { name: "Commerciale", text: "Ascolta le esigenze e costruisce l'offerta giusta per ogni impianto." },
  { name: "Ufficio tecnico", text: "Configura i sistemi e verifica la coerenza di ogni fornitura." },
  { name: "Logistica", text: "Muove il materiale dai poli di magazzino al cantiere, nei tempi giusti." },
  { name: "Assistenza", text: "Risponde dopo la consegna: supporto continuo per tutta la vita dell'impianto." },
  { name: "Amministrazione", text: "Tiene in ordine ordini, pratiche e incentivi, senza sorprese." },
  { name: "Marketing", text: "Racconta i prodotti e tiene aggiornata la rete su novità e normative." },
];

function Team() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  // Il titolo entra parola per parola, in maschera.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    let split: SplitText | undefined;
    const ctx = gsap.context(() => {
      const title = el.querySelector<HTMLElement>("[data-meet-title]");
      if (title) {
        split = new SplitText(title, { type: "words", mask: "words" });
        gsap.set(split.words, { yPercent: 110, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.6 },
          scrollTrigger: { trigger: el, start: "top 75%", once: true },
        });
      }
    }, el);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.team} aria-label="Il team" data-nav-theme="light">
      <span className={styles.teamLabel} data-reveal>
        Il team HCE
      </span>
      <div className={styles.teamBelow}>
        <h2 className={styles.teamBelowTitle} data-meet-title>
          Le persone dietro ogni fornitura ben fatta
        </h2>
        <p className={styles.teamIntro} data-reveal>
          Siamo un team multidisciplinare di tecnici, commerciali e specialisti
          di prodotto, con un&apos;unica ossessione: impianti che funzionano.
        </p>
        <span className={styles.teamCount} data-reveal>
          I nostri reparti ↓
        </span>

        <div className={styles.teamDepts}>
          {DEPARTMENTS.map((d) => (
            <div key={d.name} className={styles.dept} data-reveal>
              <h3 className={styles.deptName}>{d.name}</h3>
              <p className={styles.deptText}>{d.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Ogni impianto, una risposta ---------------- */

const TALENT_IMAGES = [
  { src: "/assets/pannelli-solari.jpg", alt: "Impianto fotovoltaico" },
  { src: "/assets/inverter.jpg", alt: "Inverter installato in campo" },
  { src: "/assets/pinsnap-106327241187857624.jpg", alt: "Impianto agrivoltaico" },
  { src: "/assets/accumulo.webp", alt: "Sistema di accumulo" },
  {
    src: "/assets/se516-fox-ess-caricabatterie-fox-11kw-serie-a-per-veicoli-elettrici-trifase-con-cavo-tipo-2-da-6-m.jpg",
    alt: "Caricabatterie per veicoli elettrici",
  },
  { src: "/assets/b_Ferroli_OMNIA-ST-32_tnj7XW7Wo7.webp", alt: "Pompa di calore Ferroli OMNIA" },
];

function Talent() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useReveal(ref);

  /* L'ultima "foto" della pila è il primo fotogramma del video. Il blocco si
     fissa allo schermo e, scorrendo, il riquadro cresce dalla larghezza della
     colonna a tutto schermo; a espansione completa il video parte da solo. */
  useLayoutEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video || reduced()) return;

    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      const wrap = el.querySelector<HTMLElement>("[data-vwrap]");
      const box = el.querySelector<HTMLElement>("[data-vbox]");
      const quote = el.querySelector<HTMLElement>("[data-vquote]");
      const imgs = el.querySelector<HTMLElement>("[data-imgs]");
      if (!wrap || !box || !quote || !imgs) return;

      // Stato di partenza: stesso bordo e stessa larghezza della colonna
      // delle foto, formato 16:10 come loro, a filo del bordo alto del
      // blocco — così in fila con la pila, a un solo stacco dall'ultima.
      const startBox = () => {
        const w = wrap.getBoundingClientRect();
        const r = imgs.getBoundingClientRect();
        const width = r.width;
        return { left: r.left - w.left, width, height: (width * 10) / 16 };
      };

      // Quanto dista il bordo alto del riquadro dal bordo dello schermo nel
      // momento in cui il riquadro è esattamente al centro in verticale: è lì
      // che l'ingrandimento comincia, ed è di tanto che il riquadro dovrà poi
      // crescere anche verso l'alto per arrivare a coprire tutto.
      const startOffset = () =>
        Math.max(0, (window.innerHeight - startBox().height) / 2);

      // La frase a sinistra resta agganciata finché il penultimo scatto non
      // è passato del tutto. La colonna che la contiene arriva quindi al
      // fondo di quello scatto più lo spazio che serve alla frase per
      // sfilare via: la misura dipende da quanto è alta la frase, che cambia
      // con la larghezza della finestra, quindi si calcola qui invece di
      // fissarla nel foglio di stile.
      const lead = el.querySelector<HTMLElement>("[data-lead]");
      const leadTitle = el.querySelector<HTMLElement>("[data-lead-title]");
      const figs = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-imgs] figure"));

      const sizeLead = () => {
        if (!lead || !leadTitle || figs.length < 2) return;
        lead.style.height = "";
        // In colonna sola la frase non è agganciata: niente da misurare.
        if (window.matchMedia("(max-width: 900px)").matches) return;
        const col = imgs.getBoundingClientRect();
        const penultimate = figs[figs.length - 2].getBoundingClientRect().bottom;
        const stickyTop = parseFloat(getComputedStyle(leadTitle).top) || 0;
        const wanted = penultimate - col.top + stickyTop + leadTitle.offsetHeight;
        // Oltre la pila di foto non si può andare: lì la colonna finisce.
        lead.style.height = `${Math.min(wanted, col.height)}px`;
      };

      sizeLead();
      ScrollTrigger.addEventListener("refreshInit", sizeLead);
      cleanups.push(() => {
        ScrollTrigger.removeEventListener("refreshInit", sizeLead);
        if (lead) lead.style.height = "";
      });

      gsap.set(quote, { opacity: 0, y: 50 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: () => `top ${startOffset()}px`,
          end: "+=120%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Il filmato parte con l'ingrandimento, non alla fine; tornando
            // indietro oltre il punto di partenza si rimette in pausa.
            if (self.progress > 0.02) video.play().catch(() => {});
            else if (!video.paused) video.pause();
          },
        },
      });

      // Il riquadro parte dal centro dello schermo e cresce in tutte le
      // direzioni: verso l'alto di quanto lo separa dal bordo, verso il basso
      // e ai lati fino a riempire lo schermo.
      tl.fromTo(
        box,
        {
          left: () => startBox().left,
          top: 0,
          width: () => startBox().width,
          height: () => startBox().height,
        },
        {
          left: 0,
          top: () => -startOffset(),
          width: "100%",
          height: "100%",
          ease: "none",
          duration: 0.8,
        },
      ).to(quote, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.78);
    }, el);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.talent} aria-label="La nostra storia" data-nav-theme="light">
      {/* Fissa in alto a sinistra mentre le foto scorrono al centro. La
          colonna che la contiene finisce col penultimo scatto: da lì il
          testo riprende a scorrere, come la nota di destra. */}
      <div className={styles.talentLead} data-lead>
        <div className={styles.talentSticky} data-lead-title>
          <h2 className={styles.talentLabel}>La nostra storia</h2>
          <p className={styles.talentIntro}>
            H.C.E. srl è una società nata nel 2008 per la progettazione e
            commercializzazione di prodotti elettrici ed elettronici
            all&apos;avanguardia nel settore del monitoraggio e controllo
            industriale con protocollo di comunicazione power line.
          </p>
        </div>
      </div>

      <div className={styles.talentImgs} data-imgs>
        {TALENT_IMAGES.map((b) => (
          <figure key={b.src} className={styles.talentMedia} data-reveal>
            <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
          </figure>
        ))}
      </div>

      {/* Fissa in basso a destra finché le foto scorrono: quando il video
          si allarga, la sezione finisce e la nota risale via da sola. */}
      <div className={styles.talentAside}>
        {/* Le due divisioni nate dopo: un blocco solo, così restano
            agganciate insieme mentre le foto scorrono. */}
        <div className={styles.talentNote}>
          <p>
            Nasce nel 2017 la divisione Mobilità Elettrica per rispondere alla
            sempre maggior esigenza di tutela del nostro pianeta incentivando un
            passaggio alla mobilità sostenibile diminuendo la dipendenza dalle
            fonti fossili.
          </p>
          <p>
            La nuova divisione Health Care è dedicata alla commercializzazione di
            prodotti per la prevenzione e sicurezza delle persone sul luogo di
            lavoro e non solo.
          </p>
        </div>
      </div>

      {/* Il finale video, come l'intervista del riferimento: niente bottoni,
          solo la citazione sopra il filmato. */}
      <div className={styles.talentVideoWrap} data-vwrap>
        <div className={styles.talentVideoBox} data-vbox>
          <video
            ref={videoRef}
            className={styles.talentVideo}
            src="/assets/video-chi-siamo.mp4"
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Il lavoro di HCE, in un filmato"
          />
          <span className={styles.talentVideoShade} aria-hidden="true" />
          <blockquote className={styles.talentVideoQuote} data-vquote>
            <p>
              &ldquo;Il nostro obiettivo è supportare il lavoro in campo con una
              proposta solida, chiara e orientata all&apos;installazione.&rdquo;
            </p>
            <footer>Il team HCE</footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Lavora con noi ---------------- */

function Careers() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section
      ref={ref}
      id="lavora-con-noi"
      className={styles.careers}
      aria-label="Lavora con noi"
      data-nav-theme="light"
    >
      <span className={styles.teamLabel} data-reveal>
        Lavora con noi
      </span>
      <h2 className={styles.careersTitle} data-reveal>
        Cerchiamo persone appassionate per il nostro percorso.
      </h2>

      <div className={styles.careersGrid}>
        <a
          className={styles.careerCard}
          href="/contatti#lavora-con-noi"
          data-reveal
        >
          <span className={styles.careerName}>Candidatura spontanea</span>
          <span className={styles.careerMeta}>
            <span>
              Padova, Italia
              <br />
              Tempo pieno
            </span>
            <span className={styles.careerApply}>
              Candidati
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h15M13 5l7 7-7 7" />
              </svg>
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}

/* ---------------- Pagina ---------------- */

export default function AboutPage() {
  return (
    // Il tema della navbar è dichiarato sezione per sezione: la pagina
    // alterna bande chiare e scure, e il logo deve seguirle.
    <main className={styles.page}>
      <Belief />
      {/* Un blocco solo, opaco: sale sopra l'apertura fissata. */}
      <div className={styles.rise}>
        <Ecosystem />
        <Manifesto />
        <Method />
        <Talent />
        <Team />
        <Careers />
      </div>
    </main>
  );
}
