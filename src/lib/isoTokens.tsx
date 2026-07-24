import { createContext, useContext } from "react";

/**
 * Design tokens for the isometric technical-wireframe illustrations, plus the
 * shared <defs> that carry the accent gradient.
 */

/** Stroke colour of the wireframe (warm grey). */
export const STROKE = "#8C857B";

/** Stroke width, in SVG user units. */
export const STROKE_WIDTH = 1.25;

/** Opacity applied to the hidden-edge layer. */
export const STROKE_HIDDEN_OPACITY = 0.35;

/** Canvas background (warm paper). Applied via CSS, never inside the SVG. */
export const BG = "#EDE6D8";

/** Accent gradient start (top-left) — brand azure, from the HCE logo. */
export const ACCENT_FROM = "#2fa1e0";

/** Accent gradient end (bottom-right) — deeper brand blue. */
export const ACCENT_TO = "#1e5fbf";

/** Shared viewBox: every scene lives in the same 400×400 world window. */
export const VIEWBOX = "0 0 400 400";

/** Base id of the accent gradient; an idPrefix is prepended per mount. */
export const ACCENT_ID = "isoAccent";

/**
 * SVG paint reference for the accent gradient, e.g. `fill={accentUrl(prefix)}`.
 * Pass the same prefix used on the matching {@link IsoDefs}.
 */
export const accentUrl = (idPrefix = ""): string =>
  `url(#${idPrefix}${ACCENT_ID})`;

export interface IsoDefsProps {
  /**
   * Prefix prepended to every gradient id so several scenes on one page never
   * collide. {@link IsoScene} supplies a unique one automatically.
   */
  idPrefix?: string;
}

/**
 * `<defs>` holding the accent gradient, oriented top-left → bottom-right
 * (objectBoundingBox, so it maps corner-to-corner of whatever shape it fills).
 * Safe to mount many times per page as long as each mount gets a distinct
 * `idPrefix`.
 */
export function IsoDefs({ idPrefix = "" }: IsoDefsProps) {
  return (
    <defs>
      <linearGradient id={`${idPrefix}${ACCENT_ID}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={ACCENT_FROM} />
        <stop offset="1" stopColor={ACCENT_TO} />
      </linearGradient>
    </defs>
  );
}

/**
 * Carries the resolved accent paint url (`url(#…)`) down to descendants of an
 * {@link IsoScene}, so shapes reference their own scene's gradient rather than
 * a hard-coded id. Defaults to the un-prefixed id for use outside a scene.
 */
export const IsoAccentContext = createContext<string>(accentUrl());

/** Accent paint url for the enclosing {@link IsoScene}. */
export const useIsoAccent = (): string => useContext(IsoAccentContext);
