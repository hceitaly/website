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
import StepsSlider from "../sections/StepsSlider";
import { useReveal } from "../hooks/useReveal";
import { scrollToTarget } from "../hooks/useSmoothScroll";
import styles from "./AboutPage.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ============================================================
   Chi Siamo — la pagina ricalca il riferimento di design
   (apertura, manifesto, valori, finale video) declinato
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
        {/* Il poster copre il riquadro finché il filmato non è pronto, così il
            blocco non parte vuoto. `metadata` e non `auto`: il file arriva
            comunque perché parte da solo, ma senza precedere il resto. */}
        <video
          className={styles.recruitVideo}
          src="/assets/video-chi-siamo.mp4"
          poster="/assets/video-chi-siamo-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
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

/** I tre criteri con cui HCE sceglie cosa offrire. Ognuno ha la sua foto:
    a riposo in un quadrato nell'angolo in basso a destra, sotto il mouse si
    allarga a fondo del riquadro. */
const ECO = [
  {
    name: "Scouting tecnico",
    img: "/assets/selezione.webp",
    text: "Prodotti scelti per le prestazioni richieste dai mercati dell'efficienza e della decarbonizzazione.",
  },
  {
    name: "Allineamento normativo",
    img: "/assets/allineamento.webp",
    text: "Criteri guidati dalla normativa attuale e prospettica.",
  },
  {
    name: "Coerenza con gli incentivi",
    img: "/assets/coerenza.webp",
    text: "Soluzioni in linea con gli strumenti di incentivazione.",
  },
];

/** Larghezza a riposo di ogni riquadro, in percentuale. */
const ECO_BASE = 100 / 3;
/** Di quanto cresce quello sotto il mouse. */
const ECO_GROW = 5;

/**
 * Le larghezze dei tre riquadri. Lo spazio lo cede solo il lato verso cui
 * il riquadro si apre: il primo e quello centrale crescono verso destra
 * (cedono quelli dopo), l'ultimo verso sinistra (cedono quelli prima). Così il bordo fermo di
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
    <section ref={ref} className={styles.eco} aria-label="Molto più di un'azienda" data-nav-theme="light">
      <div className={styles.ecoHead}>
        <h2 className={styles.ecoTitle} data-eco-title>
          Molto più di un&apos;azienda
        </h2>
        <p className={styles.ecoIntro} data-eco-text>
          HCE Italy è un&apos;azienda commerciale specializzata nella fornitura di
          prodotti per la produzione di energia da fonte rinnovabile, per la
          mobilità elettrica e per la climatizzazione efficiente. Affianchiamo
          installatori, aziende e professionisti con un&apos;offerta selezionata e
          con l&apos;esperienza di tecnici costantemente aggiornati sulle richieste
          del settore e su una normativa in continua evoluzione.
        </p>
      </div>

      {/* I tre riquadri: quello sotto il mouse si allarga e scopre il suo fondo. */}
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
            <div className={styles.ecoMedia} aria-hidden="true">
              <img src={c.img} alt="" loading="lazy" decoding="async" />
            </div>

            <div className={styles.ecoBody}>
              <h3 className={styles.ecoName}>
                {c.name}
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

  // In testa alla sezione la linea del binario scende lungo la colonna di
  // destra. Poi, ognuno al
  // proprio ingresso: la frase parola per parola, le origini riga per riga,
  // la foto in fondo con la stessa tendina.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
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

      if (railLine) gsap.set(railLine, { clipPath: railHidden() });

      const head = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 75%", once: true },
        // Lo stato di partenza della linea si rilegge al via: nel frattempo la
        // finestra può essere passata dall'altra parte del breakpoint.
        onStart: () => {
          if (railLine) gsap.set(railLine, { clipPath: railHidden() });
        },
      });
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
      {/* Colonna principale: la frase a tutta larghezza con il capoverso
          rientrato, come nel riferimento. */}
      <div className={styles.manifestoMain}>
        {/* Le parole accentate viaggiano con la loro punteggiatura: SplitText
            fa della virgola una "parola" a sé, e senza il `nowrap` potrebbe
            andare a capo da sola. */}
        <div>
          <span className={styles.sectionLabel}>I nostri obiettivi</span>
          <h2 className={styles.sectionTitle}>A chi ci rivolgiamo</h2>
        </div>
        <p className={styles.manifestoText} data-manifesto>
          <span className={styles.manifestoAccent}>Installatori,</span> società di
          ingegneria ed EPC, aziende e professionisti che cercano prodotti tecnici
          affidabili e un interlocutore competente per sceglierli.
        </p>
      </div>

      {/* Binario destro: la linea verticale, le origini in breve e una foto. */}
      <aside className={styles.manifestoRail}>
        <span className={styles.railLine} data-rail-line aria-hidden="true" />
        <p className={styles.manifestoStory} data-story>
          Il nostro obiettivo è aiutare l&apos;installatore a motivare la
          soluzione che propone al proprio cliente.
        </p>
        <figure className={styles.manifestoShot} data-rail-shot>
          <Curtain src="/assets/pompe-di-calore.webp" alt="Pompa di calore installata in una villa" />
        </figure>
      </aside>
    </section>
  );
}

/* ---------------- Ogni impianto, una risposta ---------------- */

/** La pila di foto accanto alla storia. `position` sposta il taglio 16:10
    quando il soggetto non sta al centro dello scatto. */
const TALENT_IMAGES: { src: string; alt: string; position?: string }[] = [
  { src: "/assets/elettronica-industriale.webp", alt: "Saldatura su una scheda elettronica" },
  {
    src: "/assets/efficientamento-energetico.webp",
    alt: "Etichetta di classe energetica compilata su un progetto",
  },
  {
    src: "/assets/zapgrid.webp",
    alt: "Auto elettrica in carica a una colonnina ZapGrid",
    position: "30% center",
  },
  { src: "/assets/hero-inverter.webp", alt: "Casa con fotovoltaico, inverter, accumulo e ricarica" },
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
          <div className={styles.talentIntro}>
            <p>
              HCE nasce nel 2008 nell&apos;elettronica industriale. Progetta e
              commercializza prodotti per il monitoraggio e il controllo con
              protocollo di comunicazione power line, che utilizza la rete
              elettrica per trasmettere dati.
            </p>
            <p>
              Intorno al 2014, HCE estende la propria attività
              all&apos;efficientamento e al monitoraggio dei sistemi energetici.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.talentImgs} data-imgs>
        {TALENT_IMAGES.map((b) => (
          <figure key={b.src} className={styles.talentMedia} data-reveal>
            <img
              src={b.src}
              alt={b.alt}
              style={b.position ? { objectPosition: b.position } : undefined}
              loading="lazy"
              decoding="async"
            />
          </figure>
        ))}
      </div>

      {/* Fissa in basso a destra finché le foto scorrono: quando il video
          si allarga, la sezione finisce e la nota risale via da sola. */}
      <div className={styles.talentAside}>
        {/* Il seguito della storia: un blocco solo, così i due passaggi
            restano agganciati insieme mentre le foto scorrono. */}
        <div className={styles.talentNote}>
          <p>
            Nel 2017 nasce la divisione Mobilità Elettrica. Il percorso
            nell&apos;elettronica e nei sistemi energetici si estende alla
            ricarica dei veicoli, portando l&apos;attività di HCE in un nuovo
            ambito di utilizzo dell&apos;elettricità.
          </p>
          <p>
            Nel 2020 HCE entra nella distribuzione di componenti per
            l&apos;elettrificazione: moduli fotovoltaici, accumulo e
            climatizzazione elettrica, oggi parte dell&apos;assortimento.
          </p>
        </div>
      </div>

      {/* Il finale video, come l'intervista del riferimento: niente bottoni,
          solo la citazione sopra il filmato. */}
      <div className={styles.talentVideoWrap} data-vwrap>
        <div className={styles.talentVideoBox} data-vbox>
          {/* `none`: il file si scarica solo quando l'ingrandimento lo fa
              partire; fino ad allora il riquadro mostra il poster, che è il
              primo fotogramma. */}
          <video
            ref={videoRef}
            className={styles.talentVideo}
            src="/assets/chi-siamo-web.mp4"
            poster="/assets/chi-siamo-poster.webp"
            muted
            loop
            playsInline
            preload="none"
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
      <span className={styles.careersLabel} data-reveal>
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
        <StepsSlider />
        <Manifesto />
        <Talent />
        <Careers />
      </div>
    </main>
  );
}
