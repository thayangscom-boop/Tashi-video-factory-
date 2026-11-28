import React from 'react';
import { CAST3, Character3D, Look3, STAND_HIP } from './Character3D';
import { Bone, Box, Cyl, Mat, Sph, V, V3, ik2, rnd, tint } from './kit';

/* ------------------------------------------------------------------ */
/** No two workers alike: skin, shirt, trousers, hat, facial hair, braces/apron/belt and build all vary by seed. */
const SKINS = ['#f0c6a0', '#d9a47a', '#a8714f', '#8a5a3c', '#e8b98f', '#c98f66'];
const SHIRTS = ['#d6c6a4', '#c9d0cf', '#e0d2b2', '#b9a98a', '#a8b4b0', '#d8b89a', '#c2b6c8', '#9aa890'];
const VESTS = ['#b79a72', '#8fa0a8', '#c0a070', '#6d4c35', '#4a5d6e', '#7a6a3a', '#5a4a44', '#93714e'];
const PANTS = ['#3b4a5c', '#4a3a2a', '#2f3b2f', '#3a3440', '#5a4a38', '#2c313c'];
const HAIR = ['#2a1a10', '#1a1210', '#a0582a', '#5a3a20', '#8a8a8a', '#3a2416'];
const CAPS = ['#4f5b45', '#6a4a2a', '#34343a', '#5a4a3a', '#3f4c5a', '#7a6a50'];
export const crewLook = (i: number): Look3 => {
  const r = (k: number) => rnd(i * 12.9 + k * 7.3);
  const pick = <T,>(a: T[], k: number) => a[Math.floor(r(k) * a.length) % a.length];
  const hat = r(1) < 0.62 ? 'cap' : r(1) < 0.8 ? 'bowler' : 'none';
  const extra = r(2);
  return {
    skin: pick(SKINS, 3), coat: pick(VESTS, 4), sleeves: pick(SHIRTS, 5), pants: pick(PANTS, 6), hair: pick(HAIR, 7),
    hat, hatColor: hat === 'bowler' ? tint(pick(CAPS, 8), 0.7) : pick(CAPS, 8),
    mustache: r(9) > 0.6, beard: r(10) > 0.75, rolled: r(11) > 0.3,
    suspenders: extra < 0.4 ? tint(pick(PANTS, 12), 0.7) : undefined, apron: extra > 0.82 ? '#6a5440' : undefined, belt: extra >= 0.4 && extra < 0.7 ? '#2a2018' : undefined,
    scarf: r(13) > 0.7 ? pick(['#a8443a', '#3d5878', '#c9a227'], 14) : undefined,
    build: 0.95 + r(15) * 0.24,
  };
};
/** body height multiplier for a crew member */
export const crewScale = (i: number) => 0.92 + rnd(i * 5.1 + 3) * 0.15;

/* ------------------------------------------------------------------ */
const COATS: [string, string][] = [['#6a4028', '#2a1a10'], ['#8a5a34', '#3a2416'], ['#3a302a', '#15100c'], ['#9a9488', '#5a5650'], ['#7a4a30', '#e8dcc0']];
/** Draught horse at a walk. Faces +z. `dist` (metres travelled) drives the legs, so hooves do not slide. `strain` 0..1 = hauling hard. */
export const Horse: React.FC<{ p: V3; rotY?: number; dist: number; coat?: number; s?: number; strain?: number; t?: number }> = ({ p, rotY = 0, dist, coat = 0, s = 1, strain = 0, t = 0 }) => {
  const [c, mane] = COATS[coat % COATS.length];
  const stride = 0.42; const ph = (dist * Math.PI) / (2 * stride);
  const foot = (off: number, x: number, z: number) => {
    const q = (((ph + off) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (q < Math.PI) return V(x, 0.07, z + stride * (1 - (2 * q) / Math.PI));
    const u = (q - Math.PI) / Math.PI; const e = u * u * (3 - 2 * u);
    return V(x, 0.07 + Math.sin(u * Math.PI) * 0.2, z + stride * (-1 + 2 * e));
  };
  const bob = Math.sin(ph * 2) * 0.025; const nod = Math.sin(ph * 2 + 0.6) * 0.07 + strain * 0.35 + Math.sin(t * 7) * strain * 0.06;
  const legs: [number, number, number, boolean][] = [[0, -0.2, 0.62, true], [Math.PI, 0.2, 0.62, true], [Math.PI, -0.2, -0.62, false], [0, 0.2, -0.62, false]];
  const by = 1.28 + bob - strain * 0.06;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <group position={[0, by, 0]} rotation={[strain * 0.08, 0, 0]}>
        <Sph rad={0.44} s={[0.78, 0.82, 1.85]} c={c} r={0.7} seg={24} />
        <Sph rad={0.4} s={[0.8, 0.9, 0.9]} p={[0, 0.03, 0.55]} c={c} r={0.7} />
        <Sph rad={0.42} s={[0.82, 0.92, 0.9]} p={[0, 0.04, -0.52]} c={c} r={0.7} />
        {/* neck, head, ears, mane */}
        <group position={[0, 0.2, 0.72]} rotation={[0.75 + nod, 0, 0]}>
          <Cyl rt={0.15} rb={0.24} h={0.75} p={[0, 0.34, 0]} c={c} r={0.7} />
          <Box size={[0.07, 0.7, 0.14]} p={[0, 0.36, -0.2]} c={mane} r={1} />
          <group position={[0, 0.74, 0.04]} rotation={[0.85 - nod * 0.5, 0, 0]}>
            <Sph rad={0.2} s={[0.72, 0.8, 1.0]} p={[0, 0, 0.06]} c={c} r={0.7} />
            <Cyl rt={0.1} rb={0.15} h={0.42} p={[0, -0.04, 0.34]} rot={[Math.PI / 2, 0, 0]} c={c} r={0.7} />
            <Sph rad={0.1} s={[1, 0.85, 0.9]} p={[0, -0.05, 0.56]} c={tint(c, 0.7)} r={0.6} />
            {[-1, 1].map((sd) => <Cyl key={sd} rt={0.005} rb={0.045} h={0.14} p={[sd * 0.09, 0.19, -0.02]} rot={[-0.2, 0, sd * -0.25]} c={c} seg={6} />)}
            {[-1, 1].map((sd) => <Sph key={sd} rad={0.028} p={[sd * 0.125, 0.04, 0.16]} c="#15100c" r={0.2} shadow={false} />)}
            <Box size={[0.06, 0.2, 0.1]} p={[0, 0.17, 0.08]} rot={[0.5, 0, 0]} c={mane} r={1} />
            {/* bridle */}
            <mesh position={[0, -0.04, 0.4]} rotation={[0, 0, 0]}><torusGeometry args={[0.135, 0.012, 5, 14]} /><Mat c="#2a1a10" r={0.6} /></mesh>
          </group>
        </group>
        {/* collar + harness strap */}
        <mesh position={[0, 0.08, 0.72]} rotation={[0.5, 0, 0]} castShadow><torusGeometry args={[0.36, 0.06, 8, 20]} /><Mat c="#2a1d14" r={0.6} /></mesh>
        <mesh position={[0, 0, 0.05]} rotation={[0, 0, 0]}><torusGeometry args={[0.37, 0.018, 5, 20]} /><Mat c="#2a1d14" r={0.6} /></mesh>
        {/* tail */}
        <group position={[0, 0.16, -0.88]} rotation={[-0.5 + Math.sin(ph * 2) * 0.1 + Math.sin(t * 3) * 0.08, 0, Math.sin(t * 2.3) * 0.25]}><Cyl rt={0.07} rb={0.03} h={0.85} p={[0, -0.42, 0]} c={mane} r={1} /></group>
      </group>
      {legs.map(([off, x, z, front], i) => {
        const hip = V(x, by - (front ? 0.22 : 0.16), z + (front ? 0.02 : -0.04));
        const ft = foot(off, x, z + (front ? 0.02 : -0.1) - strain * 0.12);
        const leg = ik2(hip, ft.clone().add(V(0, 0.06, 0)), 0.56, 0.56, V(0, 0.15, front ? 1 : -1));
        return <group key={i}>
          <Bone a={hip} b={leg.mid} ra={front ? 0.1 : 0.13} rb={0.065} c={c} r={0.7} />
          <Bone a={leg.mid} b={leg.end} ra={0.06} rb={0.048} c={tint(c, 0.85)} r={0.7} />
          <Cyl rt={0.065} rb={0.085} h={0.12} p={[ft.x, ft.y, ft.z]} c="#1c1612" r={0.5} />
        </group>;
      })}
    </group>
  );
};

type Load = 'barrels' | 'crates' | 'sacks' | 'timber';
/** A horse-drawn wagon with a seated driver. Local +z is the direction of travel. */
export const HorseWagon: React.FC<{ p: V3; rotY: number; dist: number; frame: number; seed?: number; load?: Load; coat?: number; strain?: number; t?: number; driver?: Look3; sink?: number }> = ({ p, rotY, dist, frame, seed = 0, load = 'barrels', coat = 0, strain = 0, t = 0, driver, sink = 0 }) => {
  const wr = 0.55; const roll = -dist / wr; const jog = Math.sin(dist * 4.1) * 0.015;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Horse p={[0, 0, 2.75]} dist={dist} coat={coat} strain={strain} t={t} />
      {/* shafts */}
      {[-1, 1].map((s) => <Box key={s} size={[0.06, 0.06, 2.5]} p={[s * 0.42, 1.12, 1.9]} rot={[0.06, 0, 0]} c="#5a3a22" r={0.9} />)}
      <group position={[0, jog - sink, 0]} rotation={[sink * 0.12, 0, sink * 0.1]}>
        <Box size={[1.45, 0.14, 3.0]} p={[0, 1.0, -0.2]} c="#8a6238" r={0.95} />
        {[-1, 1].map((s) => <Box key={s} size={[0.07, 0.42, 3.0]} p={[s * 0.72, 1.26, -0.2]} c="#7a5632" r={0.95} />)}
        <Box size={[1.45, 0.42, 0.07]} p={[0, 1.26, -1.68]} c="#7a5632" r={0.95} />
        <Box size={[1.3, 0.12, 0.5]} p={[0, 1.5, 1.05]} c="#6a4a2c" r={0.9} />
        {[[-0.82, 0.85], [0.82, 0.85], [-0.82, -1.25], [0.82, -1.25]].map(([x, z], i) => (
          <group key={i} position={[x, wr + 0.03, z]} rotation={[roll, 0, 0]}>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[wr, 0.055, 6, 22]} /><Mat c="#3a2516" r={0.9} /></mesh>
            {[0, 1, 2, 3].map((k) => <Box key={k} size={[0.05, 1.06, 0.05]} rot={[(k * Math.PI) / 4, 0, 0]} c="#5a3a22" />)}
            <Cyl rt={0.09} h={0.16} rot={[0, 0, Math.PI / 2]} c="#2a1a10" />
          </group>
        ))}
        {load === 'barrels' && [[-0.35, -0.2], [0.35, -0.3], [0, -1.0], [-0.36, 0.45]].map(([x, z], i) => <group key={i} position={[x, 1.08, z]}><Cyl rt={0.27} rb={0.27} h={0.8} p={[0, 0.4, 0]} c="#8a5c34" r={0.9} seg={12} /><Cyl rt={0.285} h={0.05} p={[0, 0.2, 0]} c="#2e3338" m={0.6} seg={12} /><Cyl rt={0.285} h={0.05} p={[0, 0.62, 0]} c="#2e3338" m={0.6} seg={12} /></group>)}
        {load === 'crates' && [[-0.3, -0.3, 0], [0.34, -0.7, 0], [0.1, 0.3, 0], [-0.1, -0.5, 0.56]].map(([x, z, y], i) => <Box key={i} size={[0.62, 0.55, 0.7]} p={[x, 1.36 + y, z]} rot={[0, i * 0.4, 0]} c={['#9a7446', '#8a6238', '#a8824e', '#b08a5a'][i]} r={0.95} />)}
        {load === 'sacks' && [[-0.3, -0.2, 0], [0.3, -0.5, 0], [0, 0.3, 0], [0.05, -0.9, 0], [-0.1, -0.3, 0.3]].map(([x, z, y], i) => <Sph key={i} rad={0.34} s={[1.1, 0.6, 1.5]} p={[x, 1.28 + y, z]} rot={[0, i * 0.7, 0]} c={['#c9b98a', '#b9a878', '#d4c498'][i % 3]} r={1} />)}
        {load === 'timber' && Array.from({ length: 7 }).map((_, i) => <Box key={i} size={[0.2, 0.18, 3.6]} p={[-0.45 + (i % 4) * 0.3 + Math.floor(i / 4) * 0.15, 1.18 + Math.floor(i / 4) * 0.19, -0.3]} c={['#a57a4c', '#96693c', '#b08655'][i % 3]} r={0.95} />)}
        {/* driver on the box, reins in hand */}
        <Character3D frame={frame} seed={200 + seed} pos={[0, 1.56 - 0.52, 0.98]} look={driver ?? { ...CAST3.worker1, coat: '#5a4a3a', hat: 'bowler', hatColor: '#3a3028', rolled: false }}
          pose={{ hipY: 0.56, lean: 0.12 + strain * 0.25, handL: V(-0.16, 0.92 + jog * 2, 0.45), handR: V(0.16, 0.92 - jog * 2 + strain * 0.25 * Math.abs(Math.sin(t * 6)), 0.45), footL: V(-0.14, 0.12, 0.5), footR: V(0.14, 0.12, 0.52), headYaw: Math.sin(dist * 0.5 + seed) * 0.4, headPitch: 0.05, smile: strain > 0.3 ? -0.7 : 0.3, open: strain > 0.5 ? 0.4 : 0, browTilt: strain }} />
        {[-1, 1].map((s) => <Box key={s} size={[0.015, 0.015, 2.5]} p={[s * 0.15, 1.82, 2.2]} rot={[-0.1, s * 0.03, 0]} c="#2a1a10" shadow={false} />)}
      </group>
    </group>
  );
};
export const SEAT = STAND_HIP;
