import { box, line, iso, type Vec3 } from "../../lib/iso";
import { IsoScene, IsoGroup } from "./IsoScene";
import { useIsoAccent } from "../../lib/isoTokens";
import { onLine, Timeline } from "./contract";

/**
 * Vicinanza — two structures side by side, joined at roof height by an azure
 * bridge: we stay close and truly understand the other's work.
 * "Comprendiamo davvero il vostro lavoro."
 */
const A_T = 0.34;
const B_T = 0.66;
const BW = 1.85;
const BD = 2.1;
const BH = 2.3;

function building(t: number) {
  const c = onLine(t);
  const o: Vec3 = [c[0] - BW / 2, c[1] - BD / 2, 0];
  return { edges: box(o, [BW, BD, BH]), topCentre: [c[0], c[1], BH] as Vec3 };
}

function SceneContent() {
  const accent = useIsoAccent();
  const a = building(A_T);
  const b = building(B_T);

  return (
    <>
      <IsoGroup variant="hidden">
        {[...a.edges.hidden, ...b.edges.hidden].map((d, i) => (
          <path key={`h${i}`} d={d} />
        ))}
      </IsoGroup>

      {[...a.edges.visible, ...b.edges.visible].map((d, i) => (
        <path key={`v${i}`} d={d} />
      ))}

      {/* the link between the two — azure */}
      <path d={line(a.topCentre, b.topCentre)} stroke={accent} strokeWidth={3} />
      {[a.topCentre, b.topCentre].map((p, i) => {
        const [cx, cy] = iso(...p);
        return <circle key={i} cx={cx} cy={cy} r={3.4} fill={accent} stroke="none" />;
      })}

      <Timeline nodes={[A_T, B_T]} />
    </>
  );
}

export default function Vicinanza({ className }: { className?: string }) {
  return (
    <IsoScene
      className={className}
      title="Vicinanza: due realtà affiancate e collegate, vicine nel lavoro"
    >
      <SceneContent />
    </IsoScene>
  );
}
