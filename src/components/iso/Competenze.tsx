import { box, face, line, type Vec3 } from "../../lib/iso";
import { IsoScene, IsoGroup } from "./IsoScene";
import { useIsoAccent } from "../../lib/isoTokens";
import { onLine, offLine, Timeline } from "./contract";

/**
 * Competenze — a central hub (the know-how, azure top) that resolves several
 * inputs into coherent choices: satellite nodes wired back to the core.
 * "Riusciamo a tradurre la complessità in scelte utili."
 */
const HUB_T = 0.5;
const HW = 2.5;
const HD = 2.5;
const HH = 1.6;
const NS = 0.85;

// Satellite nodes: [fraction along line, perpendicular offset].
const NODES: [number, number][] = [
  [0.18, 0],
  [0.82, 0],
  [0.5, 2.7],
  [0.5, -2.7],
];

function cube(cx: number, cy: number) {
  const o: Vec3 = [cx - NS / 2, cy - NS / 2, 0];
  return { edges: box(o, [NS, NS, NS]), top: [cx, cy, NS] as Vec3 };
}

function SceneContent() {
  const accent = useIsoAccent();
  const c = onLine(HUB_T);
  const ho: Vec3 = [c[0] - HW / 2, c[1] - HD / 2, 0];
  const hub = box(ho, [HW, HD, HH]);
  const hubTop = face([
    [ho[0], ho[1], HH],
    [ho[0] + HW, ho[1], HH],
    [ho[0] + HW, ho[1] + HD, HH],
    [ho[0], ho[1] + HD, HH],
  ]);
  const hubTopCentre: Vec3 = [c[0], c[1], HH];

  const nodes = NODES.map(([t, k]) => {
    const p = offLine(onLine(t), k);
    return cube(p[0], p[1]);
  });

  return (
    <>
      <IsoGroup variant="hidden">
        {[...hub.hidden, ...nodes.flatMap((n) => n.edges.hidden)].map((d, i) => (
          <path key={`h${i}`} d={d} />
        ))}
      </IsoGroup>

      {/* wiring from each node up to the hub */}
      <g strokeOpacity={0.75}>
        {nodes.map((n, i) => (
          <path key={`w${i}`} d={line(hubTopCentre, n.top)} />
        ))}
      </g>

      {/* hub top — azure */}
      <path d={hubTop} fill={accent} />

      {[...hub.visible, ...nodes.flatMap((n) => n.edges.visible)].map((d, i) => (
        <path key={`v${i}`} d={d} />
      ))}

      <Timeline nodes={[0.2, 0.8]} />
    </>
  );
}

export default function Competenze({ className }: { className?: string }) {
  return (
    <IsoScene
      className={className}
      title="Competenze: molte variabili tradotte in scelte coerenti attorno a un nucleo"
    >
      <SceneContent />
    </IsoScene>
  );
}
