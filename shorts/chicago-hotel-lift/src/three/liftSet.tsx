import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CAST3, Character3D, Look3, Pose3, STAND_HIP, toLocal } from './Character3D';
import { Box, Cyl, Glow, Mat, Puff, Sph, V, V3, dirtDraw, lerp, plankDraw, rnd, tint, useTex } from './kit';
import { STREET, barAngle, effort, inLapse, manOff } from './liftWorld';
import { Barrel, Crib, HOTEL, Jack, Lamp3D, Wagon3D } from './sets';
import { crewLook, crewScale } from './life';

const { W, D } = HOTEL;
export const FZ = D / 2; // z of the hotel's front wall
export const SX = W / 2; // x of the hotel's side walls
export const TRENCH = 3.4; // width of the work trench in front
export const SIDE_TRENCH = 2.2;
export const RAMP = { x0: -SX - SIDE_TRENCH, x1: -3.2, z: FZ + 2.85 }; // plank ramp from the new street down into the trench
export const rampY = (x: number) => STREET * Math.min(1, Math.max(0, (RAMP.x1 - x) / (RAMP.x1 - RAMP.x0)));
export const jackX = (i: number) => -W / 2 + 0.9 + i * ((W - 1.8) / 16);

/* ---- neighbours (painted facades + real cornices), already raised to the new grade ---- */
const facadeTex = (seed: number, wall: string, signText: string | null, wood: boolean, emissive: boolean) => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d')!; const w = 512, h = 512;
  const cols = 3 + Math.floor(rnd(seed) * 2), rows = 3;
  g.fillStyle = emissive ? '#000' : wall; g.fillRect(0, 0, w, h);
  if (!emissive) for (let y = 0; y < h; y += wood ? 20 : 12) { g.fillStyle = `rgba(0,0,0,${0.06 + rnd(y + seed) * 0.08})`; g.fillRect(0, y, w, 2); }
  const cw = w / cols, rh = (h * 0.68) / rows;
  for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
    const x = cc * cw + cw * 0.22, y = 30 + r * rh, ww = cw * 0.56, hh = rh * 0.68; const lit = rnd(seed * 7 + r * 3 + cc) > 0.5;
    if (emissive) { if (lit) { g.fillStyle = '#ffb858'; g.fillRect(x, y, ww, hh); } continue; }
    g.fillStyle = '#e6dcc4'; g.fillRect(x - 8, y - 8, ww + 16, hh + 20);
    g.fillStyle = lit ? '#e8b468' : '#3a4a5e'; g.fillRect(x, y, ww, hh);
    g.fillStyle = '#e6dcc4'; g.fillRect(x + ww / 2 - 3, y, 6, hh); g.fillRect(x, y + hh / 2 - 3, ww, 6);
  }
  const sy = h * 0.72;
  if (emissive) { g.fillStyle = '#ffb04a'; g.fillRect(40, sy + 50, w * 0.32, h - sy - 70); g.fillRect(w * 0.6, sy + 50, w * 0.32, h - sy - 70); }
  else {
    g.fillStyle = '#2a1d16'; g.fillRect(0, sy, w, 44);
    if (signText) { g.fillStyle = '#f0d58c'; g.font = '34px Anton'; g.textAlign = 'center'; g.fillText(signText, w / 2, sy + 34); }
    g.fillStyle = '#e8c078'; g.fillRect(40, sy + 50, w * 0.32, h - sy - 70); g.fillRect(w * 0.6, sy + 50, w * 0.32, h - sy - 70);
    g.fillStyle = '#4a2c1a'; g.fillRect(w * 0.42, sy + 50, w * 0.15, h - sy - 50);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
export const Neighbor: React.FC<{ p: V3; size: V3; wall: string; sign: string | null; seed: number; wood?: boolean; awning?: string; night: number }> = ({ p, size, wall, sign, seed, wood = false, awning, night }) => {
  const tex = useMemo(() => ({ map: facadeTex(seed, wall, sign, wood, false), emap: facadeTex(seed, wall, sign, wood, true) }), [seed, wall, sign, wood]);
  const [w, h, d] = size;
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><Mat c={tint(wall, 0.8)} r={0.95} /></mesh>
      <mesh position={[0, h / 2, d / 2 + 0.02]} receiveShadow><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex.map} emissiveMap={tex.emap} emissive="#ffffff" emissiveIntensity={0.15 + night * 1.4} roughness={0.9} /></mesh>
      <Box size={[w + 0.5, 0.35, d + 0.5]} p={[0, h + 0.1, 0]} c={tint(wall, 0.6)} />
      <Box size={[w + 0.2, 0.6, 0.3]} p={[0, h - 0.5, d / 2 + 0.15]} c={tint(wall, 1.15)} />
      {awning && <group position={[0, 0, d / 2]}>
        <Box size={[w * 0.96, 0.12, 2.3]} p={[0, 3.25, 1.1]} rot={[0.12, 0, 0]} c={awning} r={1} />
        <Box size={[w * 0.96, 0.22, 0.1]} p={[0, 3.02, 2.2]} c={tint(awning, 0.7)} />
        {[-0.46, -0.16, 0.16, 0.46].map((f) => <Cyl key={f} rt={0.07} h={3.0} p={[w * f, 1.5, 2.12]} c="#e6dcc4" r={0.9} seg={8} />)}
        <Box size={[1.5, 0.5, 0.06]} p={[w * 0.3, 2.5, 2.3]} c="#2a1d16" /><Box size={[1.36, 0.36, 0.07]} p={[w * 0.3, 2.5, 2.31]} c="#f0d58c" />
        <Box size={[w * 0.4, 0.5, 0.5]} p={[-w * 0.22, 0.25, 1.6]} c="#8a6238" r={0.95} /><Cyl rt={0.26} rb={0.26} h={0.8} p={[w * 0.1, 0.4, 1.7]} c="#8a5c34" r={0.9} seg={10} />
      </group>}
      <Box size={[0.7, 1.3, 0.7]} p={[w * 0.25, h + 0.8, -d * 0.2]} c="#6a4034" />
    </group>
  );
};

/** The street as it was in 1861: the hotel sits in a work trench at the OLD level; the NEW street runs 11 ft higher on fill. */
export const PitStreet: React.FC<{ t: number; tod: number; lift: number; lamps?: boolean; plank?: { slide: number; drop: number } | null; detail?: boolean }> = ({ t, tod, lift, lamps = true, plank = null, detail = true }) => {
  const dirt = useTex(1024, 1024, dirtDraw('#7a5c44'), [30, 30]);
  const dirtTop = useTex(1024, 1024, dirtDraw('#8a6c50'), [16, 10]);
  const planks = useTex(512, 256, plankDraw('#9a7550', 12), [12, 1]);
  const wallTex = useTex(512, 512, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = tint('#8a6644', 0.75 + rnd(i * 3) * 0.4); g.fillRect(0, (i * h) / 8, w, h / 8); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, (i * h) / 8, w, 4); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i) * 0.12})`; g.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 40 * rnd(i * 7), 3); }
  }, [6, 1]);
  const signTex = useTex(256, 96, (g, w, h) => { g.fillStyle = '#f1e6c8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a1a14'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#7a1a14'; g.font = '44px Anton'; g.textAlign = 'center'; g.fillText('NEW GRADE', w / 2, 64); });
  const lampOn = 0.25 + tod * 0.75;
  const frontZ = FZ + TRENCH, leftX = -SX - SIDE_TRENCH, rightX = SX + SIDE_TRENCH;
  const posts = (n: number, f: (i: number) => V3, rotY = 0) => Array.from({ length: n }).map((_, i) => <Box key={i} size={[0.2, STREET + 0.25, 0.2]} p={f(i)} rot={[0, rotY, 0]} c="#6a4a2c" r={0.95} />);
  const gapA = -2.4, gapB = -0.1; // rail opening for the gangplank
  return (
    <group>
      {/* old street level = trench floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 40]} /><Mat c="#ffffff" map={dirt} bump={dirt} bs={1.2} r={0.97} /></mesh>
      {/* the fill that carries the new street */}
      {([[0, frontZ + 60, 240, 120], [leftX - 60, frontZ - 60, 120, 120], [rightX + 60, frontZ - 60, 120, 120], [0, -FZ - SIDE_TRENCH - 30, W + 2 * SIDE_TRENCH, 60]] as number[][]).map(([x, z, w, d], i) => (
        <group key={i}>
          <Box size={[w, STREET, d]} p={[x, STREET / 2 - 0.01, z]} c="#5a4232" r={1} />
          <mesh position={[x, STREET + 0.005, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, d]} /><Mat c="#ffffff" map={dirtTop} bump={dirtTop} bs={1} r={0.97} /></mesh>
        </group>
      ))}
      {/* timber retaining walls + posts */}
      <mesh position={[0, STREET / 2, frontZ - 0.07]} castShadow receiveShadow><boxGeometry args={[rightX - leftX, STREET, 0.14]} /><Mat c="#fff" map={wallTex} bump={wallTex} bs={0.6} r={0.95} /></mesh>
      {posts(15, (i) => [leftX + 0.4 + i * ((rightX - leftX - 0.8) / 14), STREET / 2 + 0.1, frontZ - 0.22])}
      {[leftX, rightX].map((x) => (
        <group key={x}>
          <mesh position={[x + (x < 0 ? 0.07 : -0.07), STREET / 2, frontZ - (D + TRENCH + SIDE_TRENCH) / 2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow><boxGeometry args={[D + TRENCH + SIDE_TRENCH, STREET, 0.14]} /><Mat c="#fff" map={wallTex} bump={wallTex} bs={0.6} r={0.95} /></mesh>
          {posts(9, (i) => [x + (x < 0 ? 0.22 : -0.22), STREET / 2 + 0.1, frontZ - 1 - i * 1.9])}
        </group>
      ))}
      {/* diagonal shoring braces on the front wall */}
      {[-7.5, 1.5, 6.5].map((x) => <Box key={x} size={[0.14, 3.2, 0.14]} p={[x, 1.35, frontZ - 0.75]} rot={[0.42, 0, 0]} c="#7a5632" r={0.95} />)}
      {/* plank ramp down into the trench, on trestles */}
      {(() => {
        const len = Math.hypot(RAMP.x1 - RAMP.x0, STREET); const ang = Math.atan2(STREET, RAMP.x1 - RAMP.x0);
        return <group>
          <mesh position={[(RAMP.x0 + RAMP.x1) / 2, STREET / 2 - 0.05, RAMP.z]} rotation={[0, 0, -ang]} castShadow receiveShadow><boxGeometry args={[len, 0.09, 1.05]} /><Mat c="#fff" map={planks} r={0.95} /></mesh>
          {Array.from({ length: 12 }).map((_, i) => { const x = RAMP.x0 + 0.6 + i * 0.75; return <Box key={i} size={[0.06, 0.035, 1.05]} p={[x, rampY(x) + 0.03, RAMP.z]} rot={[0, 0, -ang]} c="#6a4a2c" shadow={false} />; })}
          {[0.12, 0.34, 0.56, 0.78].map((f) => { const x = lerp(RAMP.x0, RAMP.x1, f); const h = rampY(x) - 0.1; return <group key={f}>
            {[-0.45, 0.45].map((dz) => <Box key={dz} size={[0.13, h, 0.13]} p={[x, h / 2, RAMP.z + dz]} c="#7a5632" r={0.95} />)}
            <Box size={[0.1, 0.1, 1.1]} p={[x, h - 0.08, RAMP.z]} c="#7a5632" /><Box size={[0.08, h * 1.1, 0.08]} p={[x, h / 2, RAMP.z]} rot={[0.5, 0, 0]} c="#8a6238" />
          </group>; })}
        </group>;
      })()}
      {/* boardwalk + rail along the trench edge (gap where the gangplank goes) */}
      <mesh position={[0, STREET + 0.06, frontZ + 1.7]} castShadow receiveShadow><boxGeometry args={[70, 0.12, 3.4]} /><Mat c="#fff" map={planks} bump={planks} bs={0.3} r={0.95} /></mesh>
      {Array.from({ length: 22 }).map((_, i) => { const x = leftX + 0.6 + i * 1.16; if (x > gapA && x < gapB) return null; return <Box key={i} size={[0.1, 1.0, 0.1]} p={[x, STREET + 0.6, frontZ + 0.12]} c="#5a3c22" r={0.9} />; })}
      {([[leftX + 0.6, gapA - 0.1], [gapB + 0.1, rightX]] as number[][]).map(([a, b], i) => [0.62, 1.06].map((y) => <Box key={`${i}${y}`} size={[b - a, 0.07, 0.07]} p={[(a + b) / 2, STREET + y, frontZ + 0.12]} c="#6a4a2c" r={0.9} />))}
      {/* gangplank: slid across to the door when the hotel reaches grade */}
      {plank && <group position={[-1.25, STREET + 0.13, FZ + 0.15 + 1.75 + (1 - plank.slide) * 3.4]} rotation={[plank.drop * 0.05, 0, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[1.25, 0.09, 3.6]} /><Mat c="#fff" map={planks} r={0.95} /></mesh>
        {[-1.3, 0, 1.3].map((z) => <Box key={z} size={[1.3, 0.05, 0.1]} p={[0, 0.06, z]} c="#6a4a2c" />)}
      </group>}
      {/* surveyor's staff: one stripe per foot, with a NEW GRADE board at street level */}
      <group position={[SX + 0.75, 0, FZ + 0.9]}>
        {Array.from({ length: 13 }).map((_, i) => <Cyl key={i} rt={0.05} h={0.3048} p={[0, 0.1524 + i * 0.3048, 0]} c={i % 2 ? '#f4efe2' : '#b3261e'} r={0.7} seg={8} />)}
        <mesh position={[-0.02, STREET + 0.32, 0.07]} castShadow><boxGeometry args={[0.95, 0.36, 0.04]} /><meshStandardMaterial map={signTex} roughness={0.8} /></mesh>
        <Box size={[1.4, 0.035, 0.035]} p={[0, STREET, 0.05]} c="#b3261e" />
        {/* pointer fixed to the building: rides up the staff */}
        <group position={[-0.5, lift + HOTEL.base, -0.5]}><Box size={[0.9, 0.05, 0.05]} p={[0, 0, 0.5]} c="#1b2740" /><Cyl rt={0.001} rb={0.09} h={0.2} p={[0.42, 0, 0.5]} rot={[0, 0, -Math.PI / 2]} c="#ffd23f" seg={4} /></group>
      </group>
      {/* lanterns hung on the shoring */}
      {[-8.2, -1.2, 5.6].map((x, i) => <group key={x} position={[x, STREET - 0.95, frontZ - 0.45]}>
        <Cyl rt={0.07} rb={0.09} h={0.22} c="#ffd98a" e="#ffb347" ei={2.2} seg={6} shadow={false} /><Cyl rt={0.02} rb={0.1} h={0.08} p={[0, 0.15, 0]} c="#22262b" seg={6} />
        <Glow p={[0, 0, 0.1]} size={1.6} color="#ffb04a" op={0.45 + tod * 0.3} />
        {lamps && i !== 1 && <pointLight color="#ffb060" intensity={5 + tod * 8} distance={8} decay={2} />}
      </group>)}
      {/* neighbours on the new grade */}
      <group position={[0, STREET, 0]}>
        <Neighbor p={[-SX - 8.5, 0, -0.5]} size={[12, 9.5, 10]} wall="#8c6a4a" sign="DRY GOODS" seed={3} wood awning="#6a2f2a" night={tod} />
        <Neighbor p={[-SX - 21.5, 0, 0.5]} size={[11, 12.5, 11]} wall="#7a5a5a" sign="HARDWARE" seed={5} night={tod} />
        <Neighbor p={[SX + 8.2, 0, -0.2]} size={[11.5, 11.5, 10]} wall="#9a6a4c" sign="BOOTS & SHOES" seed={7} awning="#2f4a5a" night={tod} />
        <Neighbor p={[SX + 21, 0, 0.8]} size={[12, 8.5, 11]} wall="#86745a" sign="SALOON" seed={9} wood night={tod} />
        {Array.from({ length: 26 }).map((_, i) => {
          const x = -90 + i * 7.2 + rnd(i) * 3, h = 7 + rnd(i * 2.3) * 16, z = -32 - rnd(i * 4.1) * 40;
          return <group key={i}><Box size={[6 + rnd(i * 6) * 4, h, 8]} p={[x, h / 2, z]} c={['#7d6a78', '#8a7478', '#6f6074'][i % 3]} r={1} shadow={false} />
            {rnd(i * 8.8) > 0.8 && <Cyl rt={0.01} rb={1.3} h={9} p={[x, h + 4.5, z]} c="#6a5868" seg={4} shadow={false} />}</group>;
        })}
        <Lamp3D p={[-SX - 1.0, 0, frontZ + 0.5]} on={lampOn} light={lamps && tod > 0.3} />
        <Lamp3D p={[SX + 1.4, 0, frontZ + 0.5]} on={lampOn} light={lamps && tod > 0.3} />
        <Lamp3D p={[-24, 0, frontZ + 3.4]} on={lampOn} light={false} />
        {detail && <>
          <Wagon3D p={[8.5, 0, frontZ + 7.5]} rotY={0.25} />
          {[[4.6, 3.9], [5.3, 4.2], [4.9, 4.8]].map(([x, z], i) => <Barrel key={i} p={[x, 0.12, frontZ + z - 2.6]} s={1 + rnd(i) * 0.15} />)}
          {[[-6.2, 1.9, 0.7], [-6.9, 1.7, 0.5], [-6.5, 1.8, 1.25]].map(([x, z, y], i) => <Box key={i} size={[0.8, 0.6, 0.7]} p={[x, i === 2 ? 1.02 : 0.42, frontZ + z]} rot={[0, y, 0]} c={['#9a7446', '#8a6238', '#a8824e'][i]} r={0.95} />)}
          {/* stock of timber + spare jacks waiting on the boardwalk */}
          {Array.from({ length: 8 }).map((_, i) => <Box key={i} size={[3.2, 0.2, 0.22]} p={[-15.5, 0.22 + Math.floor(i / 4) * 0.21, frontZ + 1.0 + (i % 4) * 0.26]} rot={[0, (rnd(i) - 0.5) * 0.05, 0]} c={['#a57a4c', '#96693c', '#b08655'][i % 3]} r={0.95} />)}
          {[0, 1, 2, 3].map((i) => <group key={i} position={[-17.6 - (i % 2) * 0.5, 0.12, frontZ + 1.0 + Math.floor(i / 2) * 0.5]}><Cyl rt={0.11} rb={0.19} h={0.34} p={[0, 0.17, 0]} c="#3f464e" m={0.7} r={0.45} seg={10} /><Cyl rt={0.045} h={0.25} p={[0, 0.45, 0]} c="#9aa3ab" m={0.85} r={0.3} seg={8} /></group>)}
          {Array.from({ length: 7 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[-20 + rnd(i * 3.1) * 40, 0.02, frontZ + 6 + rnd(i * 5.7) * 14]}><circleGeometry args={[0.8 + rnd(i * 2) * 1.4, 20]} /><Mat c="#a9b6c8" r={0.12} m={0.1} /></mesh>)}
        </>}
      </group>
      {/* trench clutter: spare cribbing, a ladder, tool chest, buckets */}
      {detail && <>
        <Crib p={[7.2, 0, FZ + 2.6]} h={0.56} />
        {Array.from({ length: 5 }).map((_, i) => <Box key={i} size={[1.5, 0.18, 0.2]} p={[4.6 + (i % 2) * 0.1, 0.09 + Math.floor(i / 3) * 0.19, FZ + 2.4 + (i % 3) * 0.25]} rot={[0, 0.2 + rnd(i) * 0.1, 0]} c={['#a57a4c', '#96693c', '#b08655'][i % 3]} r={0.95} />)}
        <group position={[9.6, 0, frontZ - 0.35]} rotation={[0.2, 0, 0]}>
          {[-1, 1].map((s) => <Box key={s} size={[0.07, 3.9, 0.07]} p={[s * 0.26, 1.95, 0]} c="#9a7446" />)}
          {Array.from({ length: 9 }).map((_, i) => <Box key={i} size={[0.52, 0.05, 0.05]} p={[0, 0.35 + i * 0.42, 0]} c="#8a6238" />)}
        </group>
        <Box size={[0.9, 0.42, 0.45]} p={[2.6, 0.21, FZ + 2.9]} rot={[0, 0.15, 0]} c="#5a3c22" r={0.8} />
        <Cyl rt={0.16} rb={0.13} h={0.3} p={[1.7, 0.15, FZ + 2.8]} c="#6a747e" m={0.6} r={0.5} />
      </>}
      {/* sky life: clouds drift (they race during the time-lapse) and a few birds cross */}
      {Array.from({ length: 12 }).map((_, i) => <Puff key={i} p={[-130 + ((i * 31 + t * 1.6 + (inLapse(t) ? (t - 10.3) * 45 : t > 11.9 ? 72 : 0)) % 260), 44 + rnd(i) * 30, -120 - rnd(i * 3) * 40]} size={46 + rnd(i * 7) * 40} color={tod > 0.5 ? ['#ffc9a0', '#f2a590', '#ffe0b8'][i % 3] : '#ffffff'} op={0.55} />)}
      {Array.from({ length: 5 }).map((_, i) => { const bx = -30 + ((t * 5 + i * 9) % 70), by = 27 + i * 1.3 + Math.sin(t * 2 + i) * 0.6, fl = Math.sin(t * 14 + i * 2) * 0.7;
        return <group key={i} position={[bx, by, -6 - i * 2]}>{[-1, 1].map((s) => <Box key={s} size={[0.5, 0.03, 0.16]} p={[s * 0.22, Math.abs(fl) * 0.08, 0]} rot={[0, 0, s * fl]} c="#2a2a30" shadow={false} />)}</group>; })}
    </group>
  );
};

/* ------------------------------------------------------------------ */
const CREW: Look3[] = [CAST3.worker1, CAST3.worker2, CAST3.worker3];

/** A row of screw jacks along one wall with a man on every bar. Local frame: wall face at z=0, street side = +z, row runs along x. */
export const CrewRow: React.FC<{
  t: number; frame: number; lift: number; xs: number[]; seed?: number; lookAt?: number; // lookAt: 0..1 heads turned to the foreman
  hide?: number[]; slide?: { k: number; z: number }; ready?: number; bar?: (t: number, off: number) => number; eff?: (t: number, off: number) => number; variety?: boolean;
}> = ({ t, frame, lift, xs, seed = 0, lookAt = 0, hide = [], slide, ready = 1, bar = barAngle, eff = effort, variety = false }) => {
  const blocks = Math.max(0, lift - 0.86);
  const stage = blocks > 0.25 ? blocks - 0.12 : 0; // plank staging the men stand on once the packing gets tall
  return (
    <group>
      {stage > 0 && <>
        <Box size={[xs[xs.length - 1] - xs[0] + 2.4, 0.07, 1.0]} p={[(xs[0] + xs[xs.length - 1]) / 2 - 0.5, stage - 0.035, 0.5]} c="#9a7550" r={0.95} />
        {xs.map((x, k) => <Crib key={`c${k}`} p={[x - 1.5, 0, 0.55]} h={stage - 0.07} w={0.8} />)}
      </>}
      {xs.map((x, k) => {
        const off = manOff(k + seed) * (variety ? 1.6 : 1); const spotter = variety && (k + seed) % 6 === 4; const a = spotter ? 0.2 : bar(t, off); const e = eff(t, off) * ready;
        const sc = variety ? crewScale(k + seed) : 1; const vr = rnd(k * 9.1 + seed); // per-man scale and style
        const sz = slide && slide.k === k ? slide.z : 0;
        const pos: V3 = [x - 0.74, stage, 0.36]; const rotY = Math.PI / 2;
        const pivot = V(x, blocks + 0.42, -0.32);
        const along = (d: number) => toLocal(pivot.clone().add(V(Math.sin(a) * d, 0, Math.cos(a) * d)), pos, rotY, sc);
        const u = (0.3 - a) / 1.05;
        const idle = Math.sin(t * 1.7 + k * 1.3);
        const pose: Pose3 = {
          hipY: STAND_HIP - 0.17 + (blocks - stage) * 0.45 - e * 0.03 + idle * 0.006, hipZ: lerp(0.14, -0.1, u), hipX: 0.03 + idle * 0.01,
          lean: lerp(0.6, -0.08, u), twist: lerp(-0.1, 0.3, u),
          headPitch: lerp(lerp(-0.45, 0.05, u), -0.5, lookAt), headYaw: lerp(0.45, -0.95, lookAt) + idle * 0.05,
          handR: along(variety ? 0.78 + vr * 0.08 : 0.84), handL: along(variety ? 0.52 + vr * 0.14 : 0.64),
          footL: V(-0.17, 0.07 + Math.sin(Math.min(1, Math.max(0, u)) * Math.PI) * 0.05, -0.2 - u * 0.12), footR: V(0.17, 0.07 + Math.sin(Math.min(1, Math.max(0, 1 - u)) * Math.PI) * 0.03, 0.26 - u * 0.1),
          smile: e > 0.3 ? -0.9 : 0.4, open: e > 0.5 ? 0.28 : 0, mouthW: 1.2, browTilt: e, brow: lookAt * 0.6 - e * 0.5, eyes: 1 - e * 0.45, lookY: lookAt * 0.6,
        };
        return <group key={k}>
          <Jack p={[x, 0, -0.32 + sz]} angle={a} ext={Math.max(0.02, lift - blocks - 0.62)} blocks={blocks} />
          {!hide.includes(k) && !spotter && <Character3D frame={frame} seed={k + seed + 2} pos={pos} rotY={rotY} scale={sc} look={variety ? crewLook(k + seed * 3 + 1) : CREW[(k + seed) % 3]} pose={variety ? { ...pose, lean: (pose.lean ?? 0) * (0.85 + vr * 0.3), headYaw: (pose.headYaw ?? 0) + Math.sin(t * (0.8 + vr) + k) * 0.18 * (1 - e) } : pose} />}
          {/* every sixth man is a spotter: kneels at his jack, watches the screw through the pull, then looks up and signals */}
          {spotter && (() => { const sp: V3 = [x + 0.48, stage, 0.92]; const sr = Math.PI + 0.45; const ok = 1 - e; const wave = ok * Math.max(0, Math.sin(t * 2.2 + k));
            return <Character3D frame={frame} seed={k + seed + 2} pos={sp} rotY={sr} scale={sc} look={crewLook(k + seed * 3 + 1)}
              pose={{ hipY: 0.52, lean: 0.5 - wave * 0.25, hipZ: -0.05, footL: V(-0.16, 0.07, -0.42), footR: V(0.16, 0.07, 0.22), handL: V(-0.2, 0.62, 0.3),
                handR: wave > 0.2 ? V(0.3, 1.5 + wave * 0.2, 0.1) : toLocal(V(x + 0.12, blocks + 0.55, -0.1), sp, sr, sc), headPitch: lerp(0.3, -0.45, wave), headYaw: lerp(-0.3, 0.9, wave), smile: 0.2 + wave * 0.5, browTilt: e * 0.6 }} />; })()}
        </group>;
      })}
    </group>
  );
};

