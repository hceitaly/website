import { line, iso, ground, type Vec3 } from "../../lib/iso";
import { ACCENT_FROM } from "../../lib/isoTokens";

/**
 * Shared "slider hook" contract for the five step illustrations. Every scene
 * threads the same isometric line from ENTRY (left) to EXIT (right) at the same
 * SVG height, so the connecting line reads as one continuous thread as the
 * scenes cross-fade past each other.
 */
export const ENTRY: [number, number] = [40, 200];
export const EXIT: [number, number] = [360, 200];

const ENTRY_W = ground(ENTRY[0], ENTRY[1]);
const EXIT_W = ground(EXIT[0], EXIT[1]);

/** A ground point at fraction `t` (0 = ENTRY, 1 = EXIT) along the line. */
export const onLine = (t: number): Vec3 => [
  ENTRY_W[0] + (EXIT_W[0] - ENTRY_W[0]) * t,
  ENTRY_W[1] + (EXIT_W[1] - ENTRY_W[1]) * t,
  0,
];

/** Perpendicular ground offset (screen-vertical) from a point on the line. */
export const offLine = (p: Vec3, k: number): Vec3 => [p[0] + k, p[1] + k, 0];

/** The connecting isometric line (ENTRY → EXIT) plus accent nodes. */
export function Timeline({ nodes = [] as number[] }: { nodes?: number[] }) {
  return (
    <>
      <path d={line(ENTRY_W, EXIT_W)} stroke={ACCENT_FROM} strokeWidth={2.5} />
      {nodes.map((t, i) => {
        const [cx, cy] = iso(...onLine(t));
        return <circle key={i} cx={cx} cy={cy} r={3} fill={ACCENT_FROM} stroke="none" />;
      })}
    </>
  );
}
