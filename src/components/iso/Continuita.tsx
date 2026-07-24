import { box, face, line, iso, ground, type Vec3 } from "../../lib/iso";
import { IsoScene, IsoGroup } from "./IsoScene";
import { useIsoAccent, ACCENT_FROM } from "../../lib/isoTokens";

/**
 * Continuità — three states of the same PV installation strung along one
 * continuous orange timeline: survey (rilievo), install (posa), operation
 * (esercizio). All three buildings come from a single parametric `buildHouse`.
 *
 * ENTRY / EXIT are the fixed slider hook points (same y across all five
 * illustrations); the timeline is projected through them so it lands on exact
 * pixels while still being built from the iso helpers.
 */

/** Slider hook points, in SVG space — shared contract across all scenes. */
export const ENTRY: [number, number] = [40, 200];
export const EXIT: [number, number] = [360, 200];

// House dimensions, in world units (1 unit = one PV-module pitch).
const W = 3.2;
const D = 3.2;
const H = 1.9;
const R = 1.15; // ridge rise above the eave
const PANEL_CAP = 3; // panels the front roof slope holds at full build-out

const STATES = ["rilievo", "posa", "esercizio"] as const;
type State = (typeof STATES)[number];

interface HouseGeometry {
  visible: string[];
  hidden: string[];
  panels: string[]; // accent-filled roof panels
  meterFront?: string; // accent-filled meter face
  dims: string[]; // dashed survey dimensions
  scaffold: string[]; // light install scaffolding
}

/** Panels tiled up the front (+X) roof slope, as closed `face` paths. */
function panelsOnSlope(o: Vec3, count: number): string[] {
  const [ox, oy] = o;
  const gap = 0.14;
  const f0 = 0.18; // start fraction up the slope (eave → ridge)
  const f1 = 0.82; // end fraction up the slope
  const xLow = ox + W - f0 * (W / 2);
  const xHigh = ox + W - f1 * (W / 2);
  const zLow = H + f0 * R;
  const zHigh = H + f1 * R;
  const out: string[] = [];
  for (let k = 0; k < count; k++) {
    const y0 = oy + (D * (k + gap)) / count;
    const y1 = oy + (D * (k + 1 - gap)) / count;
    out.push(
      face([
        [xLow, y0, zLow],
        [xLow, y1, zLow],
        [xHigh, y1, zHigh],
        [xHigh, y0, zHigh],
      ]),
    );
  }
  return out;
}

/** Gable-roof edges (ridge + rafters); the box already draws the eave rect. */
function roofEdges(o: Vec3): { visible: string[]; hidden: string[] } {
  const [ox, oy] = o;
  const cx = ox + W / 2;
  const LEa: Vec3 = [ox, oy, H];
  const REa: Vec3 = [ox + W, oy, H];
  const REb: Vec3 = [ox + W, oy + D, H];
  const RGa: Vec3 = [cx, oy, H + R];
  const RGb: Vec3 = [cx, oy + D, H + R];
  const LEb: Vec3 = [ox, oy + D, H];
  return {
    visible: [line(RGa, RGb), line(REa, RGa), line(REb, RGb), line(LEb, RGb)],
    hidden: [line(LEa, RGa)],
  };
}

/** Dashed survey dimensions: one length run and one height run, with ticks. */
function dimEdges(o: Vec3): string[] {
  const [ox, oy] = o;
  const off = 0.5;
  const t = 0.28;
  const a: Vec3 = [ox + W + off, oy, 0];
  const b: Vec3 = [ox + W + off, oy + D, 0];
  const h1: Vec3 = [ox + W + off, oy + D, H];
  return [
    line(a, b),
    line([a[0] - t, a[1], 0], [a[0] + t, a[1], 0]),
    line([b[0] - t, b[1], 0], [b[0] + t, b[1], 0]),
    line(b, h1),
    line([b[0], b[1] - t, 0], [b[0], b[1] + t, 0]),
    line([h1[0], h1[1] - t, H], [h1[0], h1[1] + t, H]),
  ];
}

/** Light scaffolding: corner posts rising past the eave, plus a couple rails. */
function scaffoldEdges(o: Vec3): string[] {
  const [ox, oy] = o;
  const top = H + 0.5;
  const posts: [number, number][] = [
    [ox + W, oy],
    [ox + W, oy + D],
    [ox, oy + D],
  ];
  const out = posts.map(([px, py]) => line([px, py, 0], [px, py, top]));
  out.push(line([ox + W, oy, top - 0.15], [ox + W, oy + D, top - 0.15]));
  out.push(line([ox + W, oy + D, top - 0.15], [ox, oy + D, top - 0.15]));
  out.push(line([ox + W, oy, H * 0.5], [ox + W, oy + D, H * 0.5]));
  return out;
}

/** Small meter volume set against the front-right base corner. */
function meterBox(o: Vec3): { edges: string[]; front: string } {
  const mo: Vec3 = [o[0] + W + 0.15, o[1] + D - 1.0, 0];
  const size: Vec3 = [0.55, 0.7, 0.85];
  const b = box(mo, size);
  const fx = mo[0] + size[0];
  const front = face([
    [fx, mo[1], 0],
    [fx, mo[1] + size[1], 0],
    [fx, mo[1] + size[1], size[2]],
    [fx, mo[1], size[2]],
  ]);
  return { edges: [...b.visible, ...b.hidden], front };
}

/**
 * Build one house from its front-bottom corner (the point sitting on the
 * timeline). Every state shares the same body + roof; extras key off `state`.
 */
function buildHouse(front: Vec3, state: State): HouseGeometry {
  const o: Vec3 = [front[0] - W, front[1] - D, 0];
  const body = box(o, [W, D, H]);
  const roof = roofEdges(o);
  const g: HouseGeometry = {
    visible: [...body.visible, ...roof.visible],
    hidden: [...body.hidden, ...roof.hidden],
    panels: [],
    dims: [],
    scaffold: [],
  };
  if (state === "rilievo") {
    g.dims = dimEdges(o);
  } else if (state === "posa") {
    g.scaffold = scaffoldEdges(o);
    g.panels = panelsOnSlope(o, 2);
  } else {
    g.panels = panelsOnSlope(o, PANEL_CAP);
    const m = meterBox(o);
    g.visible.push(...m.edges);
    g.meterFront = m.front;
  }
  return g;
}

// The timeline endpoints, projected so they hit ENTRY / EXIT exactly, plus
// three fronts spaced along it. Geometry is static, so build it once.
const ENTRY_W = ground(ENTRY[0], ENTRY[1]);
const EXIT_W = ground(EXIT[0], EXIT[1]);
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  0,
];
const FRONTS = [0.26, 0.5, 0.74].map((t) => lerp3(ENTRY_W, EXIT_W, t));
const HOUSES = FRONTS.map((front, i) => buildHouse(front, STATES[i]));
const TIMELINE = line(ENTRY_W, EXIT_W);
const DOTS = FRONTS.map((f) => iso(...f));

const flat = (pick: (h: HouseGeometry) => string[]): string[] =>
  HOUSES.flatMap(pick);

/** Inner content — lives under IsoScene so it can read the accent gradient. */
function SceneContent() {
  const accent = useIsoAccent();
  return (
    <>
      {/* occluded edges */}
      <IsoGroup variant="hidden">
        {flat((h) => h.hidden).map((d, i) => (
          <path key={`hid${i}`} d={d} />
        ))}
      </IsoGroup>

      {/* survey dimensions (dashed) */}
      <g strokeDasharray="3 3" strokeOpacity={0.7}>
        {flat((h) => h.dims).map((d, i) => (
          <path key={`dim${i}`} d={d} />
        ))}
      </g>

      {/* install scaffolding (light) */}
      <g strokeWidth={0.75} strokeOpacity={0.65}>
        {flat((h) => h.scaffold).map((d, i) => (
          <path key={`sca${i}`} d={d} />
        ))}
      </g>

      {/* orange volumes: roof panels + meter face */}
      {flat((h) => h.panels).map((d, i) => (
        <path key={`pan${i}`} d={d} fill={accent} />
      ))}
      {HOUSES.map((h, i) =>
        h.meterFront ? (
          <path key={`met${i}`} d={h.meterFront} fill={accent} />
        ) : null,
      )}

      {/* visible wireframe, over the fills */}
      {flat((h) => h.visible).map((d, i) => (
        <path key={`vis${i}`} d={d} />
      ))}

      {/* continuous timeline + state nodes */}
      <path d={TIMELINE} stroke={ACCENT_FROM} strokeWidth={2.5} />
      {DOTS.map(([cx, cy], i) => (
        <circle key={`dot${i}`} cx={cx} cy={cy} r={3.2} fill={ACCENT_FROM} stroke="none" />
      ))}
    </>
  );
}

export default function Continuita({ className }: { className?: string }) {
  return (
    <IsoScene
      className={className}
      title="Continuità: rilievo, posa ed esercizio di un impianto fotovoltaico lungo una linea temporale"
    >
      <SceneContent />
    </IsoScene>
  );
}
