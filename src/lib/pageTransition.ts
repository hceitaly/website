import gsap from "gsap";

/* ============================================================
   Transizione fra pagine — colonne oblique a tutto schermo.

   Il sito naviga con link veri (niente router): ogni pagina è un
   caricamento nuovo. La transizione perciò vive in due metà.

   1. Uscita — al click il link viene fermato, le colonne calano
      dall'alto fino a coprire lo schermo, poi si naviga davvero.
   2. Entrata — la pagina che si apre nasce già coperta (il flag in
      `sessionStorage` lo legge lo script in linea di `index.html`,
      prima del primo paint) e le colonne proseguono verso il basso
      liberando la pagina.

   Le colonne scendono sempre nello stesso verso: fra le due pagine
   il movimento sembra uno solo. Il markup e lo stato di partenza
   stanno in `index.html`.
   ============================================================ */

/** Il flag che la pagina in uscita lascia a quella in arrivo. */
const FLAG = "hce:pt";
/** Stessa inclinazione dei bottoni del menu e delle oblique del megamenu. */
const SKEW = -12;

/** Entrata: la tendina cala e frena, come nel megamenu. Parte veloce
 *  perché è la risposta al click: un `inOut` sembrerebbe un ritardo. */
const IN = { duration: 0.48, ease: "power3.out", stagger: 0.045 };
/** Uscita: più distesa, e accelera andandosene: la pagina si scopre pulita. */
const OUT = { duration: 0.62, ease: "power3.inOut", stagger: 0.04 };

/** Oltre questa attesa la pagina si scopre comunque, montata o no. */
const MOUNT_TIMEOUT = 900;

/** Una transizione alla volta: il secondo click non deve accavallarsi. */
let busy = false;

const root = () => document.documentElement;
const columns = () => gsap.utils.toArray<HTMLElement>(".pt-col");
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Le due metà dell'animazione ---------------- */

function playIn(done: () => void) {
  const cols = columns();
  if (!cols.length) {
    done();
    return;
  }

  root().setAttribute("data-pt", "in");
  gsap.killTweensOf(cols);
  gsap.fromTo(
    cols,
    { y: 0, yPercent: -101, skewX: SKEW },
    { y: 0, yPercent: 0, skewX: SKEW, ...IN, onComplete: done },
  );
}

function playOut() {
  const cols = columns();
  const done = () => {
    root().removeAttribute("data-pt");
    // Tolto lo stile in linea le colonne tornano al loro posto, in alto
    // fuori schermo, pronte per la prossima uscita.
    gsap.set(cols, { clearProps: "transform" });
  };

  if (!cols.length) {
    done();
    return;
  }

  gsap.killTweensOf(cols);
  root().setAttribute("data-pt", "out");
  gsap.fromTo(
    cols,
    { y: 0, yPercent: 0, skewX: SKEW },
    { y: 0, yPercent: 101, skewX: SKEW, ...OUT, delay: 0.06, onComplete: done },
  );
}

/** Scopre la pagina appena React ha montato qualcosa — o comunque presto. */
function whenReady(run: () => void) {
  const mount = document.getElementById("root");
  const start = performance.now();
  const tick = () => {
    if (mount?.firstElementChild || performance.now() - start > MOUNT_TIMEOUT) run();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------------- Intercettazione dei link ---------------- */

/** La destinazione da animare, oppure `null` se il click non ci riguarda. */
function targetUrl(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const el = e.target as Element | null;
  const a = el?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement)) return null;
  // Download (i cataloghi), nuove schede e uscite esplicite restano al browser.
  if (a.hasAttribute("download") || a.dataset.noTransition !== undefined) return null;
  if (a.target && a.target !== "_self") return null;

  const url = new URL(a.href, location.href);
  // Altri siti, `mailto:` e `tel:` hanno origine diversa: non li tocchiamo.
  if (url.origin !== location.origin) return null;
  // Ancore nella stessa pagina: se ne occupa lo scroll.
  if (url.pathname === location.pathname && url.search === location.search) return null;

  return url;
}

function onClick(e: MouseEvent) {
  if (busy) return;
  const url = targetUrl(e);
  if (!url) return;

  e.preventDefault();
  busy = true;
  playIn(() => {
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch {
      /* senza flag la pagina nuova si apre scoperta: sgradevole, non rotto */
    }
    location.href = url.href;
    // Se la navigazione non parte (link morto, richiesta annullata) la pagina
    // resterebbe murata: dopo qualche secondo il velo si toglie da solo.
    setTimeout(() => {
      busy = false;
      playOut();
    }, 5000);
  });
}

/** Ritorno dalla cronologia: la pagina è ancora quella che avevamo coperto. */
function onPageShow(e: PageTransitionEvent) {
  if (!e.persisted) return;
  busy = false;
  if (root().hasAttribute("data-pt")) playOut();
}

/* ---------------- Avvio ---------------- */

export function initPageTransition() {
  if (reduced()) {
    root().removeAttribute("data-pt");
    return;
  }

  if (root().getAttribute("data-pt") === "cover") whenReady(playOut);

  document.addEventListener("click", onClick);
  window.addEventListener("pageshow", onPageShow);
}
