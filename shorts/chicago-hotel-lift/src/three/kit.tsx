import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import * as THREE from 'three';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export type V3 = [number, number, number];
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
/** 0..1 eased progress between a and b */
export const seg = (t: number, a: number, b: number) => smooth((t - a) / Math.max(1e-6, b - a));
/** overshoot settle 0..1 */
export const settle = (t: number, a: number, d = 0.5) => { const x = clamp((t - a) / d); return x <= 0 ? 0 : 1 - Math.exp(-5 * x) * Math.cos(x * 8); };
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** piecewise keyframes with smooth easing: keys [[time, value], ...] */
export const key = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], seg(t, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
export const key3 = (t: number, keys: [number, V3][]): V3 => [0, 1, 2].map((k) => key(t, keys.map(([tt, v]) => [tt, v[k]] as [number, number]))) as V3;

/** Two-bone IK: returns the mid joint (elbow/knee) and the clamped end point. */
export const ik2 = (root: THREE.Vector3, target: THREE.Vector3, a: number, b: number, pole: THREE.Vector3) => {
  const d = target.clone().sub(root);
  const L = clamp(d.length(), 0.02, a + b - 0.002);
  const dir = d.normalize();
  const end = root.clone().addScaledVector(dir, L);
  const proj = (a * a + L * L - b * b) / (2 * L);
  const h = Math.sqrt(Math.max(a * a - proj * proj, 0));
  const perp = pole.clone().addScaledVector(dir, -pole.dot(dir));
  if (perp.lengthSq() < 1e-6) perp.set(0, 0, 1);
  perp.normalize();
  return { mid: root.clone().addScaledVector(dir, proj).addScaledVector(perp, h), end };
};

/* ---------- mesh shorthands ---------- */
type MP = { c: string; r?: number; m?: number; e?: string; ei?: number; map?: THREE.Texture | null; bump?: THREE.Texture | null; bs?: number; flat?: boolean; op?: number; side?: THREE.Side };
export const Mat: React.FC<MP> = ({ c, r = 0.75, m = 0, e, ei = 1, map, bump, bs = 0.02, flat, op, side }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? '#000'} emissiveIntensity={e ? ei : 0} map={map ?? null}
    bumpMap={bump ?? null} bumpScale={bs} flatShading={flat} transparent={op !== undefined} opacity={op ?? 1} side={side ?? THREE.FrontSide} />
);
type GP = { p?: V3; rot?: V3; s?: V3 | number; shadow?: boolean; recv?: boolean; children?: React.ReactNode } & MP;
const split = (props: GP) => { const { p, rot, s, shadow = true, recv = true, children, ...mat } = props; return { p, rot, s, shadow, recv, children, mat }; };
export const Sph: React.FC<GP & { rad: number; seg?: number }> = ({ rad, seg: sg = 20, ...rest }) => {
  const { p, rot, s, shadow, recv, mat } = split(rest);
  return <mesh position={p} rotation={rot} scale={s} castShadow={shadow} receiveShadow={recv}><sphereGeometry args={[rad, sg, Math.round(sg * 0.7)]} /><Mat {...mat} /></mesh>;
};
export const Box: React.FC<GP & { size: V3 }> = ({ size, ...rest }) => {
  const { p, rot, s, shadow, recv, mat } = split(rest);
  return <mesh position={p} rotation={rot} scale={s} castShadow={shadow} receiveShadow={recv}><boxGeometry args={size} /><Mat {...mat} /></mesh>;
};
export const Cyl: React.FC<GP & { rt: number; rb?: number; h: number; seg?: number; open?: boolean; arc?: number }> = ({ rt, rb, h, seg: sg = 18, open, arc, ...rest }) => {
  const { p, rot, s, shadow, recv, mat } = split(rest);
  return <mesh position={p} rotation={rot} scale={s} castShadow={shadow} receiveShadow={recv}><cylinderGeometry args={[rt, rb ?? rt, h, sg, 1, open, 0, arc ?? Math.PI * 2]} /><Mat {...mat} /></mesh>;
};
const UP = new THREE.Vector3(0, 1, 0);
/** Tapered limb segment between two points with rounded joints. */
export const Bone: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; ra: number; rb?: number; c: string; r?: number; cap?: boolean }> = ({ a, b, ra, rb, c, r = 0.8, cap = true }) => {
  const d = b.clone().sub(a); const len = Math.max(d.length(), 1e-4);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <group>
      <mesh position={mid} quaternion={q} scale={[1, len, 1]} castShadow receiveShadow><cylinderGeometry args={[rb ?? ra, ra, 1, 14]} /><Mat c={c} r={r} /></mesh>
      {cap && <mesh position={a} castShadow><sphereGeometry args={[ra, 14, 10]} /><Mat c={c} r={r} /></mesh>}
      {cap && <mesh position={b} castShadow><sphereGeometry args={[rb ?? ra, 14, 10]} /><Mat c={c} r={r} /></mesh>}
    </group>
  );
};

/* ---------- camera ---------- */
export const Cam: React.FC<{ pos: V3; look: V3; fov?: number; roll?: number }> = ({ pos, look, fov = 35, roll = 0 }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  cam.position.set(...pos); cam.fov = fov; cam.near = 0.1; cam.far = 600; cam.up.set(Math.sin(roll), Math.cos(roll), 0);
  cam.lookAt(...look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return null;
};

/* ---------- procedural textures ---------- */
type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
export const makeTex = (w: number, h: number, draw: Draw, repeat?: [number, number]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (repeat) t.repeat.set(...repeat);
  return t;
};
export const useTex = (w: number, h: number, draw: Draw, repeat?: [number, number], deps: unknown[] = []) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => makeTex(w, h, draw, repeat), deps);
/** Texture that needs web fonts: waits for them before drawing. */
/** Fonts must be loaded BEFORE the 3D canvas mounts (textures are drawn synchronously). Use in the DOM-side composition. */
export const useFontsReady = (fonts: string[]) => {
  const [ok, setOk] = useState(false);
  const [hd] = useState(() => delayRender('fonts for 3D textures'));
  useEffect(() => {
    Promise.all(fonts.map((f) => document.fonts.load(f))).catch(() => null).then(() => { setOk(true); continueRender(hd); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ok;
};
export const useFontTex = (w: number, h: number, draw: Draw, _fonts: string[]) => useTex(w, h, draw);
const shade = (hex: string, k: number) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return `#${c.getHexString()}`; };
export const tint = shade;

export const brickDraw = (base: string, mortar: string): Draw => (g, w, h) => {
  g.fillStyle = mortar; g.fillRect(0, 0, w, h);
  const bh = h / 16, bw = w / 8;
  for (let r = 0; r < 16; r++) for (let c = -1; c < 9; c++) {
    const k = 0.78 + rnd(r * 31 + c * 7) * 0.4;
    g.fillStyle = shade(base, k);
    g.fillRect(c * bw + (r % 2) * bw / 2 + 2, r * bh + 2, bw - 4, bh - 4);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(c * bw + (r % 2) * bw / 2 + 2, r * bh + 2, bw - 4, 3);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(c * bw + (r % 2) * bw / 2 + 2, r * bh + bh - 6, bw - 4, 3);
  }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i) * 0.08})`; g.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 14 * rnd(i * 7), 14 * rnd(i * 9)); }
};
export const plankDraw = (base: string, n = 8): Draw => (g, w, h) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = shade(base, 0.8 + rnd(i * 3.3) * 0.35); g.fillRect((i * w) / n, 0, w / n, h);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect((i * w) / n, 0, 3, h);
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd(i * 9 + k) * 0.06})`; g.fillRect((i * w) / n + rnd(k * 2 + i) * (w / n), 0, 2, h); }
    g.fillStyle = 'rgba(30,20,10,0.5)'; g.beginPath(); g.arc((i * w) / n + w / n / 2, rnd(i) * h, 4, 0, 7); g.fill();
  }
};
export const dirtDraw = (base: string): Draw => (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    const x = rnd(i * 1.3) * w, y = rnd(i * 2.7) * h, r = 2 + rnd(i * 4.1) * 26;
    g.fillStyle = rnd(i * 6.3) > 0.5 ? `rgba(0,0,0,${0.02 + rnd(i) * 0.07})` : `rgba(255,220,170,${0.02 + rnd(i) * 0.05})`;
    g.beginPath(); g.ellipse(x, y, r, r * 0.6, rnd(i) * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 16; i++) { g.strokeStyle = 'rgba(20,12,6,0.18)'; g.lineWidth = 6 + rnd(i) * 8; g.beginPath(); const y = rnd(i * 5) * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + 30 * (rnd(i) - 0.5), (2 * w) / 3, y + 40 * (rnd(i * 2) - 0.5), w, y); g.stroke(); }
};
export const stoneDraw = (base: string): Draw => (g, w, h) => {
  g.fillStyle = shade(base, 0.7); g.fillRect(0, 0, w, h);
  const bh = h / 4, bw = w / 4;
  for (let r = 0; r < 4; r++) for (let c = -1; c < 5; c++) { g.fillStyle = shade(base, 0.85 + rnd(r * 9 + c) * 0.25); g.fillRect(c * bw + (r % 2) * bw / 2 + 3, r * bh + 3, bw - 6, bh - 6); }
};

/** Sky dome with vertical gradient + optional sun glow. */
export const SkyDome: React.FC<{ stops: [number, string][]; sun?: { dir: V3; color: string; size?: number } }> = ({ stops, sun }) => {
  const tex = useTex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, undefined, [JSON.stringify(stops)]);
  const glow = useGlowTex();
  return (
    <group>
      <mesh><sphereGeometry args={[400, 24, 16]} /><meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
      {sun && <sprite position={[sun.dir[0] * 380, sun.dir[1] * 380, sun.dir[2] * 380]} scale={[sun.size ?? 260, sun.size ?? 260, 1]}>
        <spriteMaterial map={glow} color={sun.color} blending={THREE.AdditiveBlending} fog={false} depthWrite={false} transparent /></sprite>}
    </group>
  );
};
export const useGlowTex = () => useTex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
/** Soft additive glow billboard (fake bloom for lamps / windows). */
export const Glow: React.FC<{ p: V3; size: number; color: string; op?: number }> = ({ p, size, color, op = 0.6 }) => {
  const glow = useGlowTex();
  return <sprite position={p} scale={[size, size, 1]}><spriteMaterial map={glow} color={color} opacity={op} blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>;
};
/** Soft puff sprite for dust / smoke / steam (normal blending). */
export const Puff: React.FC<{ p: V3; size: number; color: string; op: number }> = ({ p, size, color, op }) => {
  const glow = useGlowTex();
  return <sprite position={p} scale={[size, size, 1]}><spriteMaterial map={glow} color={color} opacity={op} depthWrite={false} transparent /></sprite>;
};
