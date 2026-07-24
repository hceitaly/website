import { box, face, line, type Vec3 } from "../../lib/iso";
import { IsoScene, IsoGroup } from "./IsoScene";
import { useIsoAccent } from "../../lib/isoTokens";
import { onLine, Timeline } from "./contract";

/**
 * Selezione — a row of candidate modules on the line; the one most suited is
 * lifted out and highlighted (azure). "Non tutto, ma ciò che è più adatto a te."
 */
const SLABS = [0.26, 0.42, 0.58, 0.74];
const CHOSEN = 2;
const SW = 0.55;
const SD = 1.9;
const SH = 2.7;
const LIFT = 1.15;

function slab(t: number, lifted: boolean) {
  const c = onLine(t);
  const z = lifted ? LIFT : 0;
  const o: Vec3 = [c[0] - SW / 2, c[1] - SD / 2, z];
  const b = box(o, [SW, SD, SH]);
  const fx = o[0] + SW;
  const front = face([
    [fx, o[1], z],
    [fx, o[1] + SD, z],
    [fx, o[1] + SD, z + SH],
    [fx, o[1], z + SH],
  ]);
  const lead = lifted ? line([c[0], c[1], 0], [c[0], c[1], z]) : undefined;
  return { visible: b.visible, hidden: b.hidden, front, lead };
}

function SceneContent() {
  const accent = useIsoAccent();
  const slabs = SLABS.map((t, i) => slab(t, i === CHOSEN));
  return (
    <>
      <IsoGroup variant="hidden">
        {slabs.flatMap((s) => s.hidden).map((d, i) => (
          <path key={`h${i}`} d={d} />
        ))}
      </IsoGroup>

      {/* dashed lead line from the shortlist to the chosen module */}
      <g strokeDasharray="3 3" strokeOpacity={0.75}>
        {slabs.map((s, i) => (s.lead ? <path key={`l${i}`} d={s.lead} /> : null))}
      </g>

      {/* the chosen module — azure */}
      <path d={slabs[CHOSEN].front} fill={accent} />

      {slabs.flatMap((s) => s.visible).map((d, i) => (
        <path key={`v${i}`} d={d} />
      ))}

      <Timeline nodes={SLABS} />
    </>
  );
}

export default function Selezione({ className }: { className?: string }) {
  return (
    <IsoScene
      className={className}
      title="Selezione: tra più moduli scegliamo quello più adatto"
    >
      <SceneContent />
    </IsoScene>
  );
}
