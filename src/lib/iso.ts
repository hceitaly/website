/**
 * Isometric projection helpers for technical wireframe SVG illustrations.
 *
 * Classic 30° isometric: the two horizontal axes (x, y) fan out at ±30° from
 * the horizon and the vertical axis (z) points straight up on screen.
 *
 *   px = (x - y) * cos(30°)
 *   py = (x + y) * sin(30°) - z
 *
 * All values are in abstract "world" units; multiply by {@link ISO_SCALE} and
 * shift by {@link ISO_OFFSET} to land in the SVG coordinate space.
 *
 * Unit convention: 1 world unit = 1 structural module (the centre-to-centre
 * pitch of a photovoltaic panel). Every scene uses this scale, so illustrations
 * stay comparable without per-scene eyeballing.
 *
 * No external dependencies.
 */

/** A point (or extent) in isometric world space: `[x, y, z]`. */
export type Vec3 = [number, number, number];

/** cos(30°) — horizontal spread of the projected x/y axes. */
export const COS_30 = Math.cos(Math.PI / 6);

/** sin(30°) — vertical foreshortening of the projected x/y axes. */
export const SIN_30 = Math.sin(Math.PI / 6);

/** World-units → SVG-units multiplier. Shared by every scene so illustrations
 * stay comparable; sized so the busiest composition (three buildings) fits. */
export const ISO_SCALE = 16;

/** Screen-space translation applied after scaling, as `[dx, dy]`. */
export const ISO_OFFSET: [number, number] = [200, 222];

/** Decimal places kept in emitted path data (keeps `d` strings compact). */
const PRECISION = 3;

/** Trim a number to {@link PRECISION} decimals without trailing zeros. */
function fmt(n: number): string {
  return Number(n.toFixed(PRECISION)).toString();
}

/**
 * Project a world point onto the 2D SVG plane using the classic 30°
 * isometric transform, then apply {@link ISO_SCALE} and {@link ISO_OFFSET}.
 */
export function iso(x: number, y: number, z: number): [number, number] {
  const px = (x - y) * COS_30;
  const py = (x + y) * SIN_30 - z;
  return [px * ISO_SCALE + ISO_OFFSET[0], py * ISO_SCALE + ISO_OFFSET[1]];
}

/** Project a {@link Vec3} tuple. Thin convenience wrapper over {@link iso}. */
function project([x, y, z]: Vec3): [number, number] {
  return iso(x, y, z);
}

/**
 * Inverse of {@link iso} on the ground plane (z = 0): maps an SVG point back to
 * the world point that projects there. Handy for pinning scene features to
 * fixed screen coordinates (e.g. a timeline that must hit exact pixels).
 */
export function ground(sx: number, sy: number): Vec3 {
  const pxr = (sx - ISO_OFFSET[0]) / ISO_SCALE;
  const pyr = (sy - ISO_OFFSET[1]) / ISO_SCALE;
  const xMinusY = pxr / COS_30;
  const xPlusY = pyr / SIN_30; // z = 0, so py = (x + y) * sin30
  return [(xMinusY + xPlusY) / 2, (xPlusY - xMinusY) / 2, 0];
}

/**
 * Path `d` for a single straight segment between two world points.
 * Example: `"M12 8L40 22"`.
 */
export function line(from: Vec3, to: Vec3): string {
  const [ax, ay] = project(from);
  const [bx, by] = project(to);
  return `M${fmt(ax)} ${fmt(ay)}L${fmt(bx)} ${fmt(by)}`;
}

/**
 * Closed path `d` for a filled polygon face — used for the solid orange
 * volumes that punctuate the wireframe. Points are given in world space and
 * projected in order; the path is auto-closed with `Z`.
 */
export function face(points: Vec3[]): string {
  if (points.length === 0) return "";
  const [start, ...rest] = points;
  const [sx, sy] = project(start);
  let d = `M${fmt(sx)} ${fmt(sy)}`;
  for (const p of rest) {
    const [px, py] = project(p);
    d += `L${fmt(px)} ${fmt(py)}`;
  }
  return `${d}Z`;
}

/** Wireframe edges of a box, split by viewer visibility. */
export interface BoxEdges {
  /** The 9 edges of the three viewer-facing faces. */
  visible: string[];
  /** The 3 edges meeting at the occluded back-bottom corner. */
  hidden: string[];
}

/**
 * Wireframe axis-aligned box from `origin` extending by `size` along each axis.
 * Returns `d` strings split into `visible` (the 9 edges of the three
 * viewer-facing faces) and `hidden` (the 3 edges meeting at the occluded
 * back-bottom `origin` corner). A transparent technical wireframe draws both
 * layers, dimming the hidden one.
 */
export function box(origin: Vec3, size: Vec3): BoxEdges {
  const [ox, oy, oz] = origin;
  const [sx, sy, sz] = size;

  // Corner at unit position (i, j, k), each component 0 or 1.
  const v = (i: number, j: number, k: number): Vec3 => [
    ox + i * sx,
    oy + j * sy,
    oz + k * sz,
  ];

  // The (0,0,0) corner is the hidden one (min x+y+z, farthest from viewer).
  const visibleEdges: [Vec3, Vec3][] = [
    // top face (z = 1)
    [v(0, 0, 1), v(1, 0, 1)],
    [v(0, 0, 1), v(0, 1, 1)],
    [v(1, 0, 1), v(1, 1, 1)],
    [v(0, 1, 1), v(1, 1, 1)],
    // front-facing bottom edges (z = 0)
    [v(1, 0, 0), v(1, 1, 0)],
    [v(0, 1, 0), v(1, 1, 0)],
    // vertical edges rising to the visible top corners
    [v(1, 0, 0), v(1, 0, 1)],
    [v(0, 1, 0), v(0, 1, 1)],
    [v(1, 1, 0), v(1, 1, 1)],
  ];

  // The three edges incident to the hidden corner.
  const hiddenEdges: [Vec3, Vec3][] = [
    [v(0, 0, 0), v(1, 0, 0)],
    [v(0, 0, 0), v(0, 1, 0)],
    [v(0, 0, 0), v(0, 0, 1)],
  ];

  const toPaths = (edges: [Vec3, Vec3][]): string[] =>
    edges.map(([from, to]) => line(from, to));

  return { visible: toPaths(visibleEdges), hidden: toPaths(hiddenEdges) };
}
