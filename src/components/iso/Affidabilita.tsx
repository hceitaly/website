import { box, face, type Vec3 } from "../../lib/iso";
import { IsoScene, IsoGroup } from "./IsoScene";
import { useIsoAccent } from "../../lib/isoTokens";
import { onLine, Timeline } from "./contract";

/**
 * Affidabilità — a stable stack built up layer by layer, the crown highlighted
 * (azure): trust assembled over time, with coherence.
 * "Costruiamo fiducia con il tempo e con coerenza."
 */
const T = 0.5;
const LAYER_H = 0.95;

// Three stacked, slightly tapering layers.
const LAYERS = [
  { s: 3.3, z: 0 },
  { s: 2.8, z: LAYER_H },
  { s: 2.3, z: LAYER_H * 2 },
];

function layer(cx: number, cy: number, s: number, z: number) {
  const o: Vec3 = [cx - s / 2, cy - s / 2, z];
  const b = box(o, [s, s, LAYER_H]);
  const top = face([
    [o[0], o[1], z + LAYER_H],
    [o[0] + s, o[1], z + LAYER_H],
    [o[0] + s, o[1] + s, z + LAYER_H],
    [o[0], o[1] + s, z + LAYER_H],
  ]);
  return { visible: b.visible, hidden: b.hidden, top };
}

function SceneContent() {
  const accent = useIsoAccent();
  const c = onLine(T);
  const stack = LAYERS.map((l) => layer(c[0], c[1], l.s, l.z));
  const crown = stack[stack.length - 1];

  return (
    <>
      <IsoGroup variant="hidden">
        {stack.flatMap((l) => l.hidden).map((d, i) => (
          <path key={`h${i}`} d={d} />
        ))}
      </IsoGroup>

      {/* crown of the stack — azure */}
      <path d={crown.top} fill={accent} />

      {stack.flatMap((l) => l.visible).map((d, i) => (
        <path key={`v${i}`} d={d} />
      ))}

      <Timeline nodes={[T]} />
    </>
  );
}

export default function Affidabilita({ className }: { className?: string }) {
  return (
    <IsoScene
      className={className}
      title="Affidabilità: una struttura solida costruita a strati nel tempo"
    >
      <SceneContent />
    </IsoScene>
  );
}
