import { useId, type ReactNode } from "react";
import {
  VIEWBOX,
  STROKE,
  STROKE_WIDTH,
  STROKE_HIDDEN_OPACITY,
  IsoDefs,
  IsoAccentContext,
  accentUrl,
} from "../../lib/isoTokens";

export interface IsoSceneProps {
  children: ReactNode;
  className?: string;
  /** Accessible name for the illustration, exposed as an SVG <title>. */
  title: string;
}

/**
 * SVG wrapper for an isometric illustration. Mounts the shared <defs>, applies
 * the wireframe stroke defaults to a parent group, and exposes the scene's
 * accent gradient to descendants via context. The background is intentionally
 * left to CSS so the same illustration reads on any surface.
 */
export function IsoScene({ children, className, title }: IsoSceneProps) {
  const uid = useId();
  // useId contains characters illegal in an SVG fragment id (colons); strip
  // them so `url(#…)` references stay valid, but keep the unique core.
  const idPrefix = `iso-${uid.replace(/[^a-zA-Z0-9]/g, "")}-`;
  const titleId = `${uid}title`;

  return (
    <svg
      viewBox={VIEWBOX}
      className={className}
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{title}</title>
      <IsoDefs idPrefix={idPrefix} />
      <IsoAccentContext.Provider value={accentUrl(idPrefix)}>
        <g
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </g>
      </IsoAccentContext.Provider>
    </svg>
  );
}

export interface IsoGroupProps {
  children: ReactNode;
  /** "hidden" dims the group to STROKE_HIDDEN_OPACITY for occluded edges. */
  variant?: "visible" | "hidden";
}

/**
 * Groups edge paths under the scene's stroke defaults. The "hidden" variant
 * fades the group so occluded box edges read as a transparent wireframe.
 */
export function IsoGroup({ children, variant = "visible" }: IsoGroupProps) {
  return (
    <g strokeOpacity={variant === "hidden" ? STROKE_HIDDEN_OPACITY : undefined}>
      {children}
    </g>
  );
}
