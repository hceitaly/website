import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, SoftShadows, Edges, Sparkles, Float, Grid } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./IsoHero.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Palette — bright, cool, hyper-tech with neon accents                */
/* ------------------------------------------------------------------ */
const BG = "#d7e3f1";
const WHITE = "#eaf1fa";
const WHITE_2 = "#dbe6f3";
const WHITE_3 = "#c9d9ec";
const GLASS = "#a9d4f2";
const CYAN = "#3ad2ff";
const AZURE = "#2fa1e0";
const PANEL = "#4f6d95";
const FOLIAGE = "#a6c2c6";
const FOLIAGE_2 = "#93b4b0";
const TRUNK = "#a9b4c4";
const BODY = "#9aabc4";
const INKY = "#8496b3";
const SKIN = "#bfcfe4";

type Scroll = { p: number };
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/* ------------------------------------------------------------------ */
/* Camera stops                                                        */
/* ------------------------------------------------------------------ */
type Stop = { at: number; pos: [number, number, number]; target: [number, number, number] };
const STOPS: Stop[] = [
  { at: 0.06, pos: [20, 22, 26], target: [2, 9, 4] },
  { at: 0.2, pos: [15, 16, 17], target: [0, 1.5, 0] },
  { at: 0.42, pos: [39, 18, 27], target: [24, 1, 10] },
  { at: 0.6, pos: [52, 13, 10], target: [40, 1.5, -2] },
  { at: 0.74, pos: [61, 15, 20], target: [48, 1.5, 6] },
  { at: 0.93, pos: [65, 25, 15.5], target: [64, 0.2, 12] },
];

function Rig({ scroll }: { scroll: React.RefObject<Scroll> }) {
  const { camera } = useThree();
  const eased = useRef(scroll.current?.p ?? 0);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const posB = useMemo(() => new THREE.Vector3(), []);
  const tgtB = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = scroll.current?.p ?? 0;
    eased.current += (p - eased.current) * 0.08;
    const cur = eased.current;
    let a = STOPS[0];
    let b = STOPS[STOPS.length - 1];
    for (let i = 0; i < STOPS.length - 1; i++) {
      if (cur >= STOPS[i].at && cur <= STOPS[i + 1].at) {
        a = STOPS[i];
        b = STOPS[i + 1];
        break;
      }
    }
    if (cur <= STOPS[0].at) a = b = STOPS[0];
    else if (cur >= STOPS[STOPS.length - 1].at) a = b = STOPS[STOPS.length - 1];
    const t = a === b ? 0 : smooth(clamp01((cur - a.at) / (b.at - a.at)));
    pos.set(...a.pos).lerp(posB.set(...b.pos), t);
    tgt.set(...a.target).lerp(tgtB.set(...b.target), t);
    camera.position.copy(pos);
    camera.lookAt(tgt);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Primitives — rounded, chamfered-with-neon-edges, roofs, neon strips */
/* ------------------------------------------------------------------ */
type MeshProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  cast?: boolean;
};

function RBox({ position, rotation, size, color = WHITE, emissive, emissiveIntensity, cast = true }: MeshProps) {
  const r = Math.min(0.12, Math.min(...size) * 0.42);
  return (
    <RoundedBox args={size} radius={r} smoothness={3} position={position} rotation={rotation} castShadow={cast} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity ?? 0} />
    </RoundedBox>
  );
}

function CBox({ position, rotation, size, color = WHITE, emissive, emissiveIntensity, cast = true, neon = true }: MeshProps & { neon?: boolean }) {
  const [w, h, d] = size;
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2, h / 2);
    s.lineTo(-w / 2, h / 2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
    g.translate(0, 0, -d / 2);
    return g;
  }, [w, h, d]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow={cast} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.12} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity ?? 0} />
      {neon && <Edges threshold={20} color={CYAN} />}
    </mesh>
  );
}

function Roof({ position, rotation, w, h, d, color = WHITE_2 }: { position: [number, number, number]; rotation?: [number, number, number]; w: number; h: number; d: number; color?: string }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }, [w, h, d]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      <Edges threshold={20} color={CYAN} />
    </mesh>
  );
}

/* Constant-bright neon element (no lighting) — strips, tips, holograms. */
function Neon({ position, rotation, size, color = CYAN }: MeshProps & { color?: string }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function Antenna({ position, h = 2.2 }: { position: [number, number, number]; h?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, h, 6]} />
        <meshStandardMaterial color={WHITE_3} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, h + 0.12, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Pylon({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 4, 6]} />
        <meshStandardMaterial color={WHITE_3} metalness={0.45} roughness={0.4} />
      </mesh>
      <Neon position={[0, 3.15, 0]} size={[1.5, 0.08, 0.08]} />
      <Neon position={[0, 3.65, 0]} size={[1.1, 0.08, 0.08]} />
      <mesh position={[0, 4.15, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* A slowly spinning holographic ground ring. */
function HoloRing({ position, radius = 2.4, color = CYAN }: { position: [number, number, number]; radius?: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.25;
  });
  return (
    <mesh ref={ref} position={[position[0], 0.06, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.04, 8, 72]} />
      <meshBasicMaterial color={color} transparent opacity={0.65} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

/* A soft holographic light pillar that pulses. */
function ScanPillar({ position, r = 1.6, h = 7, color = CYAN }: { position: [number, number, number]; r?: number; h?: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current?.material as THREE.MeshBasicMaterial | undefined;
    if (m) m.opacity = 0.07 + 0.05 * Math.sin(state.clock.elapsedTime * 2 + position[0]);
  });
  return (
    <mesh ref={ref} position={[position[0], h / 2, position[2]]}>
      <cylinderGeometry args={[r, r, h, 40, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function Tree({ position, s = 1 }: { position: [number, number, number]; s?: number }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color={TRUNK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <icosahedronGeometry args={[0.78, 1]} />
        <meshStandardMaterial color={FOLIAGE} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.22, 2.05, 0.12]} castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={FOLIAGE_2} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function SolarArray({ position, rows = 2, cols = 3 }: { position: [number, number, number]; rows?: number; cols?: number }) {
  const items: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) items.push([c * 2.15 - (cols - 1) * 1.075, r * 1.75]);
  return (
    <group position={position}>
      {items.map((p, k) => (
        <group key={k} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.52, 0]} rotation={[-0.52, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.9, 0.08, 1.2]} />
            <meshStandardMaterial color={PANEL} roughness={0.3} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.55, 0.02]} rotation={[-0.52, 0, 0]}>
            <boxGeometry args={[1.75, 0.02, 1.05]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.28} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.44, 6]} />
            <meshStandardMaterial color={WHITE_3} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Person({ position, rotation = [0, 0, 0], s = 1, tone = BODY }: { position: [number, number, number]; rotation?: [number, number, number]; s?: number; tone?: string }) {
  return (
    <group position={position} rotation={rotation} scale={s}>
      <mesh position={[-0.13, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.68, 8]} />
        <meshStandardMaterial color={tone} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.13, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.68, 8]} />
        <meshStandardMaterial color={tone} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.26, 0.72, 12]} />
        <meshStandardMaterial color={tone} roughness={0.65} metalness={0.12} />
      </mesh>
      <mesh position={[-0.29, 1.02, 0.02]} rotation={[0, 0, 0.22]} castShadow>
        <capsuleGeometry args={[0.065, 0.5, 4, 8]} />
        <meshStandardMaterial color={tone} roughness={0.7} />
      </mesh>
      <mesh position={[0.29, 1.02, 0.02]} rotation={[0, 0, -0.22]} castShadow>
        <capsuleGeometry args={[0.065, 0.5, 4, 8]} />
        <meshStandardMaterial color={tone} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.21, 20, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} metalness={0.05} />
      </mesh>
    </group>
  );
}

/* 01 — a dense hi-tech logistics district. */
function District() {
  return (
    <group position={[0, 0, 0]}>
      <group position={[-3.5, 0, -2]}>
        <CBox position={[0, 1.2, 0]} size={[5.4, 2.4, 3.4]} color={WHITE} />
        <Roof position={[0, 2.4, 0]} rotation={[0, Math.PI / 2, 0]} w={3.6} h={0.9} d={5.4} />
        <Neon position={[0, 1.5, 1.72]} size={[4, 0.06, 0.06]} />
        <Neon position={[0, 1.0, 1.72]} size={[4, 0.06, 0.06]} color={AZURE} />
        <Antenna position={[-2, 3.3, 0]} h={2.4} />
      </group>
      <group position={[3.4, 0, -1]} rotation={[0, 0.18, 0]}>
        <CBox position={[0, 1.1, 0]} size={[4.4, 2.2, 3]} color={WHITE} />
        <RBox position={[0, 2.35, 0]} size={[4.8, 0.3, 3.4]} color={WHITE_2} />
        <Neon position={[0, 1.4, 1.55]} size={[3.2, 0.06, 0.06]} />
      </group>
      <group position={[-1, 0, 4.2]}>
        <CBox position={[0, 1.2, 0]} size={[4.8, 2.4, 3.2]} color={WHITE} />
        <Roof position={[0, 2.4, 0]} rotation={[0, Math.PI / 2, 0]} w={3.4} h={0.8} d={4.8} />
        <Antenna position={[1.8, 3.3, 0]} h={2} />
      </group>
      <group position={[6, 0, 5]} rotation={[0, -0.14, 0]}>
        <CBox position={[0, 1, 0]} size={[3.8, 2, 2.8]} color={WHITE} />
        <CBox position={[0, 2.15, 0]} size={[4, 0.3, 3]} color={WHITE_2} neon={false} />
      </group>
      <CBox position={[9.5, 0.9, -2]} size={[2.4, 1.8, 2.4]} color={WHITE} />

      <SolarArray position={[-7, 0, 2]} rows={2} cols={3} />
      <SolarArray position={[9, 0, 2.5]} rows={2} cols={2} />
      <SolarArray position={[-4.5, 0, 8]} rows={1} cols={3} />

      <CBox position={[1.4, 0.35, 2]} size={[0.8, 0.7, 0.8]} color={WHITE_3} />
      <CBox position={[2.1, 0.35, 2.4]} size={[0.8, 0.7, 0.8]} color={WHITE_2} />
      <CBox position={[1.7, 1, 2.1]} size={[0.7, 0.6, 0.7]} color={WHITE_3} />
      <mesh position={[-9.5, 1, -1]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 2, 20]} />
        <meshStandardMaterial color={WHITE_2} roughness={0.4} metalness={0.25} />
      </mesh>

      <Tree position={[-8.5, 0, -3.5]} s={1.1} />
      <Tree position={[-7.5, 0, 6.5]} s={0.9} />
      <Tree position={[1.8, 0, 8.5]} s={1} />
      <Tree position={[8.8, 0, 7.5]} s={1.2} />
      <Tree position={[6.5, 0, -5]} s={1} />

      <HoloRing position={[0, 0, 1]} radius={9} />
      <ScanPillar position={[-3.5, 0, -2]} r={2.2} h={8} />
      <Sparkles count={40} scale={[22, 6, 18]} position={[0, 3, 2]} size={3} speed={0.3} color={CYAN} opacity={0.6} />
      <Person position={[0.5, 0, 3.2]} rotation={[0, 0.6, 0]} s={0.95} />
      <Person position={[-3, 0, 1.5]} rotation={[0, -0.9, 0]} s={0.95} tone={INKY} />
    </group>
  );
}

/* 02 — rounded-tile grid, raised azure plateau, hologram + figure. */
function ProductsGrid() {
  const N = 8;
  const gap = 1.72;
  const raised: Record<string, number> = { "3,4": 1.15, "4,4": 0.75, "3,3": 0.7, "4,3": 0.9, "2,4": 0.5, "3,5": 0.5 };
  const azureKeys = new Set(["3,4", "4,3"]);
  const tiles = useMemo(() => {
    const out: { key: string; pos: [number, number, number]; h: number }[] = [];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const key = `${i},${j}`;
        const h = raised[key] ?? 0.3;
        out.push({ key, pos: [(i - (N - 1) / 2) * gap, h / 2, (j - (N - 1) / 2) * gap], h });
      }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <group position={[24, 0, 10]}>
      {tiles.map((t) => {
        const azure = azureKeys.has(t.key);
        return (
          <RBox
            key={t.key}
            position={t.pos}
            size={[1.46, t.h, 1.46]}
            color={azure ? AZURE : WHITE}
            emissive={azure ? CYAN : undefined}
            emissiveIntensity={azure ? 0.6 : 0}
            cast={t.h > 0.35}
          />
        );
      })}
      <HoloRing position={[0, 0, 0]} radius={6.5} />
      <ScanPillar position={[(3 - (N - 1) / 2) * gap, 0, (4 - (N - 1) / 2) * gap]} r={1.4} h={9} />
      <Sparkles count={40} scale={[14, 6, 14]} position={[0, 3, 0]} size={2.6} speed={0.3} color={CYAN} opacity={0.6} />
      <Person position={[(3 - (N - 1) / 2) * gap, 1.15, (4 - (N - 1) / 2) * gap]} s={0.85} rotation={[0, -0.6, 0]} />
    </group>
  );
}

/* 03 — assistance: a conversation, and a smart home. */
function Assistance() {
  return (
    <>
      <group position={[40, 0, -2]}>
        <RBox position={[0, 0.09, 0]} size={[5, 0.18, 3.8]} color={WHITE_2} cast={false} />
        <Person position={[-0.9, 0.18, 0]} rotation={[0, 0.6, 0]} />
        <Person position={[1, 0.18, 0.25]} rotation={[0, -0.8, 0]} tone={INKY} />
        <Float speed={3} rotationIntensity={0.4} floatIntensity={0.6}>
          <mesh position={[0.1, 2.6, 0]}>
            <torusGeometry args={[0.5, 0.03, 8, 40]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.7} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </Float>
        <HoloRing position={[0, 0, 0]} radius={3.2} />
      </group>

      <group position={[48, 0, 6]}>
        <RBox position={[0, 0.08, 0]} size={[8.5, 0.16, 6.5]} color="#c4d4c8" cast={false} />
        <group position={[-1.4, 0, -0.6]}>
          <CBox position={[0, 1.15, 0]} size={[3.4, 2.3, 3]} color={WHITE} />
          <Roof position={[0, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} w={3.2} h={1.1} d={3.4} />
          <Neon position={[0, 0.5, 1.52]} size={[2.6, 0.05, 0.05]} />
          <mesh position={[-1, 1.5, 1.52]}>
            <boxGeometry args={[0.7, 0.7, 0.1]} />
            <meshBasicMaterial color={GLASS} toneMapped={false} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.7, 2.75, 0.6]} rotation={[-0.72, 0, 0]} castShadow>
            <boxGeometry args={[2.4, 0.08, 1.3]} />
            <meshStandardMaterial color={PANEL} roughness={0.3} metalness={0.3} />
          </mesh>
          <Antenna position={[1.2, 2.4, -0.8]} h={1.4} />
        </group>
        <CBox position={[2.6, 0.35, 2]} size={[2.4, 0.6, 0.5]} color={FOLIAGE} neon={false} />
        <CBox position={[3.2, 0.35, 0]} size={[0.5, 0.6, 2.4]} color={FOLIAGE_2} neon={false} />
        <Tree position={[2.6, 0, -1.6]} s={0.8} />
        <Tree position={[3.4, 0, 2.6]} s={0.6} />
        <HoloRing position={[-1.4, 0, -0.6]} radius={3} />
        <Sparkles count={30} scale={[10, 5, 8]} position={[0, 3, 0]} size={2.4} speed={0.3} color={CYAN} opacity={0.5} />
        <Person position={[1, 0.16, 2.1]} rotation={[0, -0.4, 0]} s={0.95} />
        <Person position={[2, 0.16, 1.4]} rotation={[0, -1.3, 0]} s={0.95} tone={INKY} />
      </group>
    </>
  );
}

/* 04 — the HCE mark laid flat, glowing. */
function LogoE() {
  const geo = useMemo(() => {
    const bar = (v0: number, v1: number, left: number, slant: number, right: number) => {
      const s = new THREE.Shape();
      s.moveTo(left, v0);
      s.lineTo(right, v0);
      s.lineTo(right, v1);
      s.lineTo(left + slant, v1);
      s.closePath();
      return s;
    };
    const shapes = [bar(0, 1.15, 0, 0.7, 6), bar(1.75, 2.9, 1.4, 0.7, 6), bar(3.5, 4.65, 2.8, 0.7, 6)];
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 });
    g.center();
    return g;
  }, []);
  return (
    <group position={[64, 0, 12]}>
      <mesh geometry={geo} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1.5} castShadow receiveShadow>
        <meshStandardMaterial color={AZURE} emissive={CYAN} emissiveIntensity={0.6} roughness={0.3} metalness={0.2} />
        <Edges threshold={20} color={CYAN} />
      </mesh>
      <HoloRing position={[0, 0, 0]} radius={7} />
      <ScanPillar position={[0, 0, 0]} r={5.5} h={9} />
      <Sparkles count={50} scale={[16, 7, 16]} position={[0, 3, 0]} size={3} speed={0.35} color={CYAN} opacity={0.6} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Roads — clean iso path with an animated energy-flow shader          */
/* ------------------------------------------------------------------ */
const WAYPOINTS: [number, number][] = [
  [0, 0],
  [24, 0],
  [24, 10],
  [40, 10],
  [40, -2],
  [48, -2],
  [48, 6],
  [64, 6],
  [64, 12],
];

const roadVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const roadFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  void main() {
    float dash = fract(vUv.x * 55.0 - uTime * 1.1);
    float seg = smoothstep(0.0, 0.06, dash) * (1.0 - smoothstep(0.06, 0.42, dash));
    float inten = 0.32 + seg * 1.5;
    gl_FragColor = vec4(uColor * inten, min(1.0, inten));
  }
`;

function Roads({ scroll }: { scroll: React.RefObject<Scroll> }) {
  const { curve } = useMemo(() => {
    const raw = WAYPOINTS.map(([x, z]) => new THREE.Vector3(x, 0.14, z));
    const c = 0.9;
    const pts: THREE.Vector3[] = [raw[0].clone()];
    for (let i = 1; i < raw.length - 1; i++) {
      const p = raw[i];
      const din = p.clone().sub(raw[i - 1]).normalize();
      const dout = raw[i + 1].clone().sub(p).normalize();
      pts.push(p.clone().addScaledVector(din, -c));
      pts.push(p.clone().addScaledVector(dout, c));
    }
    pts.push(raw[raw.length - 1].clone());
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    return { curve: path };
  }, []);

  const tube = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.06, 8, false), [curve]);
  const tubeCount = tube.index ? tube.index.count : 0;
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(CYAN) } }), []);

  const dotsGeo = useMemo(() => {
    const n = 140;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const pt = curve.getPointAt(i / (n - 1));
      arr[i * 3] = pt.x + (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 1] = pt.y + Math.random() * 0.6;
      arr[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [curve]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    const p = scroll.current?.p ?? 0;
    const f = smooth(clamp01((p - 0.1) / 0.85));
    tube.setDrawRange(0, Math.floor(tubeCount * f));
    dotsGeo.setDrawRange(0, Math.floor(140 * f));
  });

  return (
    <group>
      <mesh geometry={tube}>
        <shaderMaterial vertexShader={roadVert} fragmentShader={roadFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <points geometry={dotsGeo}>
        <pointsMaterial color={CYAN} size={0.13} sizeAttenuation transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}

/* Interactive floor — hover lights up a dot grid smoothly. */
const floorVert = /* glsl */ `
  varying vec3 vWorld;
  void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }
`;
const floorFrag = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  uniform vec2 uMouse; uniform float uHover; uniform float uTime; uniform vec3 uColor;
  void main() {
    vec2 p = vWorld.xz;
    vec2 f = fract(p / 2.3) - 0.5;
    float dot = 1.0 - smoothstep(0.10, 0.17, length(f));
    float md = distance(p, uMouse);
    float glow = (1.0 - smoothstep(0.0, 11.0, md)) * uHover;
    float ring = (1.0 - smoothstep(0.0, 0.35, abs(md - mod(uTime * 3.0, 12.0)))) * uHover * 0.6;
    float idle = 0.045 + 0.03 * sin(uTime * 1.4 + p.x * 0.5 + p.y * 0.6);
    float inten = dot * (idle + glow + ring);
    if (inten < 0.012) discard;
    gl_FragColor = vec4(uColor, inten);
  }
`;

function InteractiveFloor() {
  const target = useRef(new THREE.Vector2(0, 0));
  const hoverTarget = useRef(0);
  const uniforms = useMemo(
    () => ({ uMouse: { value: new THREE.Vector2(0, 0) }, uHover: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(CYAN) } }),
    [],
  );
  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.lerp(target.current, 0.15);
    uniforms.uHover.value += (hoverTarget.current - uniforms.uHover.value) * 0.06;
  });
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[32, 0.04, 6]}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        target.current.set(e.point.x, e.point.z);
        hoverTarget.current = 1;
      }}
      onPointerOut={() => {
        hoverTarget.current = 0;
      }}
    >
      <planeGeometry args={[220, 220]} />
      <shaderMaterial vertexShader={floorVert} fragmentShader={floorFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[32, 0, 6]} receiveShadow>
      <planeGeometry args={[260, 260]} />
      <meshStandardMaterial color={BG} roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

function Scene({ scroll }: { scroll: React.RefObject<Scroll> }) {
  return (
    <>
      <color attach="background" args={[BG]} />
      <SoftShadows size={20} samples={16} focus={0.7} />
      <hemisphereLight args={["#ffffff", "#bccee4", 1.1]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[-14, 28, 16]}
        intensity={1.45}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-camera-left={-30}
        shadow-camera-right={90}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-normalBias={0.03}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[30, 14, -20]} intensity={0.5} color="#8fdcff" />

      <Ground />
      <Grid
        position={[32, 0.02, 6]}
        args={[240, 240]}
        cellSize={2}
        cellThickness={0.6}
        cellColor="#9db6d6"
        sectionSize={10}
        sectionThickness={1.1}
        sectionColor={CYAN}
        fadeDistance={95}
        fadeStrength={1.4}
        infiniteGrid={false}
      />
      <InteractiveFloor />
      <District />
      <ProductsGrid />
      <Assistance />
      <LogoE />
      <Roads scroll={scroll} />

      <Pylon position={[24, 0, -3]} />
      <Pylon position={[40, 0, 4]} />
      <Pylon position={[56, 0, 9]} />

      <Rig scroll={scroll} />
    </>
  );
}

/* ------------------------------------------------------------------ */
const STEPS = [
  { n: "01", title: "Il magazzino", text: "Un polo logistico di magazzini, pannelli e verde: prodotti pronti e disponibili." },
  { n: "02", title: "Il catalogo", text: "Tante tecnologie, una sola regia. La soluzione giusta spicca tra le altre." },
  { n: "03", title: "L'assistenza", text: "Persone vicine: consulenza dedicata e impianti chiavi in mano." },
  { n: "04", title: "HCE", text: "Un unico ecosistema integrato per l'efficienza energetica." },
];

export default function IsoHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const scroll = useRef<Scroll>({ p: 0 });
  const [phase, setPhase] = useState(0);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useLayoutEffect(() => {
    if (reduced) {
      scroll.current.p = 0.06;
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const phaseFor = (p: number) => (p < 0.12 ? 0 : p < 0.32 ? 1 : p < 0.52 ? 2 : p < 0.82 ? 3 : 4);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => "+=" + window.innerHeight * 5.2,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scroll.current.p = self.progress;
        setPhase((prev) => {
          const next = phaseFor(self.progress);
          return next === prev ? prev : next;
        });
      },
    });
    return () => st.kill();
  }, [reduced]);

  return (
    <section ref={sectionRef} id="top" className={styles.hero} data-nav-theme="light">
      <div className={styles.canvasWrap}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [20, 22, 26], fov: 28, near: 0.1, far: 400 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.35;
          }}
        >
          <Scene scroll={scroll} />
        </Canvas>
      </div>

      <div className={`${styles.intro} ${phase > 0 ? styles.introHidden : ""}`}>
        <h1 className={styles.title}>
          Un ecosistema
          <br />
          per l'energia
        </h1>
        <p className={styles.subtitle}>
          Prodotti selezionati, competenza tecnica e assistenza continua.
          <br />
          Dal magazzino al tuo impianto, in un unico percorso.
        </p>
        <span className={styles.scrollCue}>Scorri per scoprire il percorso</span>
      </div>

      <div className={`${styles.steps} ${phase > 0 ? styles.stepsShown : ""}`}>
        {STEPS.map((s, i) => (
          <div key={s.n} className={`${styles.step} ${phase === i + 1 ? styles.stepActive : ""}`}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>{s.n}</span>
              <span className={styles.stepTitle}>{s.title}</span>
            </div>
            <div className={styles.stepBody}>
              <p className={styles.stepText}>{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
