import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import styles from "./LiquidGradient.module.css";

/* Fullscreen quad rendered directly in clip space — no camera math. */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Procedural reproduction of "Gradient 3.jpg" (a soft blue mesh gradient),
 * plus a "liquid glass" lens that refracts the gradient under the cursor.
 * Colours are the ones sampled from the reference image (not the image itself).
 */
const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2  uMouse;   // 0..1, y up
  uniform float uHover;   // 0..1 eased

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  /* Mesh gradient = normalised sum of soft Gaussian colour points.
     Coordinates are y-up (0 bottom, 1 top). */
  vec3 meshGradient(vec2 uv) {
    float t = uTime * 0.04;
    vec2 warp = vec2(fbm(uv * 1.6 + t), fbm(uv * 1.6 + 5.2 - t));
    uv += (warp - 0.5) * 0.16;

    vec3 col = vec3(0.0);
    float sum = 0.0;
    float w;
    #define ADD(P, C, S) w = exp(-dot(uv - (P), uv - (P)) / ((S) * (S))); col += (C) * w; sum += w;
    ADD(vec2(0.50, 0.94), vec3(0.243, 0.298, 0.718), 0.55); // top indigo
    ADD(vec2(0.10, 0.82), vec3(0.208, 0.361, 0.780), 0.45); // upper-left royal
    ADD(vec2(0.92, 0.90), vec3(0.278, 0.443, 0.780), 0.50); // top-right royal
    ADD(vec2(0.02, 0.46), vec3(0.271, 0.271, 0.702), 0.42); // purple mid-left
    ADD(vec2(0.97, 0.50), vec3(0.106, 0.369, 0.780), 0.50); // royal right
    ADD(vec2(0.24, 0.66), vec3(0.184, 0.227, 0.545), 0.26); // dark indigo band
    ADD(vec2(0.47, 0.36), vec3(0.208, 0.635, 0.867), 0.34); // cyan swoosh
    ADD(vec2(0.78, 0.30), vec3(0.184, 0.545, 0.835), 0.30); // cyan tail
    ADD(vec2(0.06, 0.06), vec3(0.502, 0.651, 0.898), 0.34); // periwinkle BL
    ADD(vec2(0.55, 0.04), vec3(0.169, 0.427, 0.808), 0.42); // bottom royal
    #undef ADD
    return col / sum;
  }

  void main() {
    vec2 uv = vUv;
    vec3 base = meshGradient(uv);
    vec3 color = base;

    // aspect-corrected space so the lens stays circular
    vec2 p = vec2(uv.x * uAspect, uv.y);
    vec2 m = vec2(uMouse.x * uAspect, uMouse.y);
    float d = distance(p, m);

    const float R = 0.15;
    float inside = smoothstep(R, R * 0.85, d);

    if (uHover > 0.001 && inside > 0.0) {
      float edge = clamp(d / R, 0.0, 1.0);          // 0 centre -> 1 rim
      vec2 dir = d > 0.0001 ? (p - m) / d : vec2(0.0);

      // spherical refraction (bends more toward the rim) + travelling ripple
      float bulge = pow(edge, 2.5);
      float ripple = sin(d * 70.0 - uTime * 4.0) * 0.5 + 0.5;
      float amt = (0.05 * bulge + 0.006 * ripple * inside) * inside;
      vec2 refr = dir * amt;

      vec2 uv2 = uv - vec2(refr.x / uAspect, refr.y);
      uv2 = mix(uv2, uMouse, 0.10 * (1.0 - edge) * inside); // centre magnify
      vec3 glass = meshGradient(uv2);
      glass += 0.06 * inside;                        // glassy lift

      // specular highlight (offset toward top-left) + sharp glint
      vec2 sp = m + vec2(-0.045, 0.05);
      float spec = smoothstep(0.09, 0.0, distance(p, sp)) * inside;
      float glint = smoothstep(0.022, 0.0, distance(p, sp));

      // fresnel rim ring
      float rim = smoothstep(R * 0.78, R * 0.92, d) - smoothstep(R * 0.92, R, d);

      vec3 lensCol = glass;
      lensCol += vec3(0.55, 0.75, 1.00) * spec * 0.50;
      lensCol += vec3(1.00) * glint * 0.55;
      lensCol += vec3(0.60, 0.85, 1.00) * rim * 0.60;

      color = mix(base, lensCol, inside * uHover);

      // soft outer shadow to lift the lens off the surface
      float outer = smoothstep(R * 1.16, R, d) * (1.0 - inside);
      color *= 1.0 - 0.08 * outer * uHover;
    }

    // subtle dither to kill banding on the smooth gradient
    color += (hash(uv * vec2(1920.0, 1080.0) + uTime) - 0.5) * 0.02;

    gl_FragColor = vec4(color, 1.0);
  }
`;

type SceneProps = {
  pointer: React.RefObject<{ x: number; y: number }>;
  hover: React.RefObject<number>;
  reduced: boolean;
};

function Scene({ pointer, hover, reduced }: SceneProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(0.5, 0.55) },
      uHover: { value: 0 },
    }),
    [],
  );
  const eased = useRef(new THREE.Vector2(0.5, 0.55));

  useFrame((state, delta) => {
    if (!reduced) uniforms.uTime.value += delta;
    uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);

    eased.current.x += (pointer.current.x - eased.current.x) * 0.12;
    eased.current.y += (pointer.current.y - eased.current.y) * 0.12;
    uniforms.uMouse.value.copy(eased.current);

    const target = reduced ? 0 : hover.current;
    uniforms.uHover.value += (target - uniforms.uHover.value) * 0.08;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function LiquidGradient() {
  const pointer = useRef({ x: 0.5, y: 0.55 });
  const hover = useRef(0);
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: (e.clientX - r.left) / r.width,
      y: 1 - (e.clientY - r.top) / r.height, // flip to y-up
    };
  };

  return (
    <div
      className={styles.wrap}
      aria-hidden="true"
      onPointerMove={handleMove}
      onPointerEnter={() => {
        hover.current = 1;
      }}
      onPointerLeave={() => {
        hover.current = 0;
      }}
    >
      <Canvas className={styles.canvas} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Scene pointer={pointer} hover={hover} reduced={reduced} />
      </Canvas>
    </div>
  );
}
