import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CAST3, Character3D, Look3, Pose3, STAND_HIP, walkPose } from './Character3D';
import { Sun } from './ExteriorShot';
import { Box, Cam, Cyl, Glow, Mat, Puff, SkyDome, Sph, V, V3, clamp, dirtDraw, key, key3, lerp, plankDraw, rnd, seg, settle, tint, useTex } from './kit';
import { CrewRow, FZ, Neighbor, PitStreet, SX } from './liftSet';
import { STREET } from './liftWorld';
import TLjson from './openTimeline.json';
import { Barrel, HOTEL, Hotel3D, Lamp3D, Wagon3D } from './sets';

export const OT = TLjson;
const BW = STREET + 0.12;
const mixC = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;

/* ---- the lift, as timed for the opening ---- */
const PULL = OT.pull; const STROKES = OT.strokes;
const pulls = (t: number) => STROKES.reduce((a, s) => a + seg(t, s, s + PULL), 0);
const liftAt = (t: number) => 0.95 + pulls(t) * 0.075;
const bar = (t: number, off = 0) => {
  let a = 0.2;
  for (const s0 of STROKES) {
    const s = s0 + off;
    if (t >= s - 0.22) a = lerp(0.2, 0.3, seg(t, s - 0.22, s));
    if (t >= s) a = lerp(0.3, -0.75, seg(t, s, s + PULL));
    if (t >= s + PULL + 0.15) a = lerp(-0.75, 0.2, seg(t, s + PULL + 0.15, s + PULL + 0.6));
  }
  return a;
};
const eff = (t: number, off = 0) => STROKES.reduce((m, s) => Math.max(m, seg(t, s + off - 0.1, s + off + 0.1) * (1 - seg(t, s + off + PULL, s + off + PULL + 0.25))), 0);
const joltAt = (t: number) => STROKES.reduce((m, s) => Math.max(m, seg(t, s + 0.05, s + 0.14) * (1 - seg(t, s + 0.16, s + PULL + 0.1))), 0);

const PEDS: Look3[] = [CAST3.lady, { ...CAST3.lady, coat: '#3f6a6a', hatColor: '#e6c9d0', hair: '#2a1a10' }, { ...CAST3.gent, coat: '#5a4a6a' }, { ...CAST3.worker2, rolled: false, hat: 'bowler', hatColor: '#4a3a2a' }, { ...CAST3.lady, coat: '#7a5a9a', hair: '#a0582a' }];
const Walker: React.FC<{ t: number; frame: number; i: number; z: number; y: number; speed: number; span: [number, number]; look?: Look3; extra?: Pose3 }> = ({ t, frame, i, z, y, speed, span, look, extra }) => {
  const dir = i % 2 ? -1 : 1; const len = span[1] - span[0]; const d = (((t * speed + i * 7.3) % len) + len) % len;
  return <Character3D frame={frame} seed={60 + i} pos={[dir > 0 ? span[0] + d : span[1] - d, y, z]} rotY={dir > 0 ? Math.PI / 2 : -Math.PI / 2} look={look ?? PEDS[i % PEDS.length]}
    pose={{ ...walkPose((t * speed * Math.PI) / (2 * 0.3) + i, 0.3), smile: 0.4, ...extra }} />;
};

/* ================================================================== */
/** Shots 1-2: the hotel on its jacks. 'wide' sells the scale, 'crew' shows the work. */
export const HookShot: React.FC<{ t: number; frame: number; shot: 'wide' | 'crew' }> = ({ t, frame, shot }) => {
  const lift = liftAt(t); const jolt = joltAt(t); const tod = 0.42;
  const frontXs = useMemo(() => Array.from({ length: 25 }).map((_, k) => -SX + 0.9 + k * 1.175), []);
  const sideXs = useMemo(() => Array.from({ length: 9 }).map((_, k) => -5.2 + k * 1.3), []);
  const cam = shot === 'wide'
    ? { pos: key3(t, [[0, [SX + 1.6, 1.5, FZ + 2.75]], [2.4, [SX + 2.3, 3.3, FZ + 3.0]]]) as V3, look: key3(t, [[0, [-1, 6.2, FZ - 0.8]], [2.4, [-1, 7.4, FZ - 0.8]]]) as V3, fov: 64 }
    : { pos: key3(t, [[2.3, [-3.2, 1.75, FZ + 3.1]], [3.9, [-4.3, 1.7, FZ + 3.05]]]) as V3, look: key3(t, [[2.3, [-9.6, 1.15, FZ + 0.2]], [3.9, [-10.7, 1.2, FZ + 0.2]]]) as V3, fov: 46 };
  const sk = jolt * 0.025; cam.pos = [cam.pos[0] + Math.sin(t * 61) * sk, cam.pos[1] + Math.cos(t * 53) * sk, cam.pos[2]];
  const DAY: [number, string][] = [[0, '#2f62ad'], [0.3, '#6f9bd6'], [0.43, '#bcd3ea'], [0.5, '#e9e6da'], [0.56, '#b9a58c'], [1, '#6a5a4a']];
  const DUSK = ['#27437c', '#5d6ea6', '#e79a78', '#ffd6a0', '#f0a070', '#6a4a48'];
  const stops = DAY.map(([o, c], i) => [o, mixC(c, DUSK[i], tod)] as [number, string]);
  const up = STROKES.reduce((m, s) => Math.max(m, seg(t, s - 0.5, s - 0.25) * (1 - seg(t, s - 0.06, s + 0.06))), 0);
  const chop = STROKES.reduce((m, s) => Math.max(m, seg(t, s - 0.06, s + 0.04) * (1 - seg(t, s + 0.25, s + 0.45))), 0);
  const gasp = STROKES.reduce((m, s) => Math.max(m, seg(t, s + 0.1, s + 0.3) * (1 - seg(t, s + 0.7, s + 0.95))), 0);
  // two men carrying a long timber along the trench; a third stacking cribbing
  const cx = -17.5 + t * 1.25; const cph = (t * 1.25 * Math.PI) / (2 * 0.3);
  const stack = (t * 0.9) % 1; const reach = Math.sin(clamp(stack / 0.5) * Math.PI); const place = seg(stack, 0.5, 0.8) * (1 - seg(stack, 0.9, 1));
  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
      <fog attach="fog" args={[mixC('#cfdbe6', '#e6a888', tod), 34, 230]} />
      <SkyDome stops={stops} sun={{ dir: [0.55, 0.3, -0.83], color: '#ffe9c0', size: 240 }} />
      <hemisphereLight args={['#b4cdfd', '#8c6a4c', 0.9]} />
      <Sun dir={[-0.55, 0.6, 0.6]} focus={shot === 'wide' ? [2, 6, FZ + 2] : [-8, 1.5, FZ + 1.5]} extent={shot === 'wide' ? 30 : 12} color="#ffd9a6" intensity={3.0} map={shot === 'wide' ? 4096 : 2048} />
      <directionalLight position={[30, 22, -40]} color="#8fb2ff" intensity={0.9} />
      <PitStreet t={t} tod={tod} lift={lift} lamps={false} />
      <Hotel3D lift={lift} t={t} ownJacks={false} deepRows night={0.35} shake={jolt * 0.01} />
      <group position={[0, 0, FZ]}><CrewRow t={t} frame={frame} lift={lift} xs={frontXs} bar={bar} eff={eff} /></group>
      {shot === 'wide' && <group position={[-SX, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><CrewRow t={t} frame={frame} lift={lift} xs={sideXs} seed={30} bar={bar} eff={eff} /></group>}
      {/* timber gang */}
      {[0, 1].map((i) => <Character3D key={i} frame={frame} seed={80 + i} pos={[cx - i * 2.6, 0, FZ + 1.5]} rotY={Math.PI / 2} look={[CAST3.worker2, CAST3.worker1][i]}
        pose={{ ...walkPose(cph + i * Math.PI, 0.3, { arms: false, lean: 0.1 }), handR: V(0.2, 1.42, 0.1), handL: V(-0.02, 1.4, 0.16), headYaw: -0.25, side: -0.05 }} />)}
      <Box size={[4.6, 0.2, 0.2]} p={[cx - 1.3, 1.52 + Math.abs(Math.cos(cph)) * -0.03, FZ + 1.7]} c="#a57a4c" r={0.95} />
      {/* cribbing man: bends, lifts a block, sets it on the stack */}
      <Character3D frame={frame} seed={84} pos={[9.5, 0, FZ + 2.4]} rotY={Math.PI * 0.75} look={CAST3.worker3}
        pose={{ hipY: STAND_HIP - 0.28 * reach, lean: 0.75 * reach + 0.15 * place, handL: V(-0.16, lerp(lerp(0.9, 0.28, reach), 1.05, place), 0.42), handR: V(0.16, lerp(lerp(0.9, 0.28, reach), 1.05, place), 0.42),
          footL: V(-0.2, 0.07, -0.1), footR: V(0.2, 0.07, 0.12), headPitch: 0.3 * reach, smile: -0.3, browTilt: 0.6 }} />
      {/* foreman on the boardwalk gives each signal; onlookers react */}
      <Character3D frame={frame} seed={40} pos={[-7.4, BW, FZ + 4.02]} rotY={Math.PI} look={CAST3.pullman}
        pose={{ hipY: STAND_HIP - 0.02 - chop * 0.04, lean: 0.16 * chop - 0.06 * up, handL: V(-0.3, 0.92, 0.3), handR: V(0.3 + 0.04 * chop, lerp(1.0, 1.95, up) - chop * 0.1, lerp(0.22, 0.55, chop)), headPitch: 0.3 * chop - 0.15 * up + 0.2, open: chop * 0.8, mouthW: 1.1, smile: 0.5 }} />
      {([[-10.2, 0.08, CAST3.lady], [-11.4, -0.06, PEDS[3]], [-3.6, 0.05, PEDS[2]]] as [number, number, Look3][]).map(([x, r, lk], i) => (
        <Character3D key={i} frame={frame} seed={50 + i} pos={[x, BW, FZ + 4.0]} rotY={Math.PI * (1 + r)} look={lk}
          pose={i === 0 ? { handR: V(0.2, 1.35 + gasp * 0.25, 0.42), handL: V(-0.2, 1.1, 0.3), lean: 0.1, headPitch: -0.25 - gasp * 0.15, open: 0.5 * gasp, brow: gasp, eyes: 1 + gasp * 0.3 }
            : i === 1 ? { handL: V(-0.26, 0.96, 0.3), handR: V(0.26, 0.96, 0.3), lean: 0.28 + gasp * 0.06, headPitch: 0.3, headYaw: Math.sin(t * 1.3) * 0.3 }
              : { handR: V(0.17, lerp(1.0, 1.82, settle(t, 0.7, 0.4)), 0.14), headPitch: -0.5, lean: -0.1, open: 0.3 * gasp, brow: 0.6 }} />))}
      {[0, 1, 2, 3].map((i) => <Walker key={i} t={t} frame={frame} i={i} z={FZ + 3.4 + 2.2 + (i % 3) * 0.45} y={BW} speed={1.2 + i * 0.07} span={[-30, 24]} />)}
      {/* dust off the sill on each turn */}
      {STROKES.map((s, si) => Array.from({ length: 22 }).map((_, i) => {
        const u = clamp((t - s - 0.08 - rnd(i + si) * 0.08) / 1.2); if (u <= 0 || u >= 1) return null;
        return <Puff key={`${si}-${i}`} p={[-SX + 0.6 + rnd(i * 3 + si) * (HOTEL.W - 1.2), lift - 0.05 - u * u * (lift - 0.1) * 0.8, FZ + 0.05 + u * (0.2 + rnd(i) * 0.5)]} size={0.4 + u * 1.2} color="#e6cfae" op={(1 - u) * 0.45} />;
      }))}
      {Array.from({ length: 30 }).map((_, i) => <Puff key={`m${i}`} p={[-16 + rnd(i) * 26 + Math.sin(t * 0.6 + i) * 0.4, 0.5 + rnd(i * 2) * 7 + Math.sin(t * 0.8 + i * 2) * 0.2, FZ + 0.5 + rnd(i * 3) * 9]} size={0.08 + rnd(i * 5) * 0.12} color="#fff2d0" op={0.45} />)}
    </>
  );
};

/* ================================================================== */
/** Shot 4: early Chicago from the air — a low wooden town on marsh, barely above the lake. */
export const LakeTownShot: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const marsh = useTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#6f7a48'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = [`rgba(60,80,40,${0.1 + rnd(i) * 0.2})`, `rgba(150,140,80,${0.08 + rnd(i) * 0.14})`, `rgba(90,70,50,${0.1 + rnd(i) * 0.15})`][i % 3]; g.beginPath(); g.ellipse(rnd(i * 1.3) * w, rnd(i * 2.7) * h, 4 + rnd(i * 4.1) * 30, 3 + rnd(i * 5.1) * 12, rnd(i) * 3, 0, 7); g.fill(); }
  }, [6, 4]);
  const mud = useTex(512, 512, dirtDraw('#5e4a36'), [1, 8]);
  const storm = seg(t, 8.6, 10.2) * 0.55;
  const houses = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; d: number; c: string; r: string; rot: number }[] = [];
    for (let gx = -6; gx <= 5; gx++) for (let gz = 0; gz < 7; gz++) for (let k = 0; k < 2; k++) {
      const id = gx * 31 + gz * 7 + k; const x = gx * 15 + 3 + k * 6.5 + rnd(id) * 1.5, z = -8 - gz * 14 - rnd(id * 3) * 3;
      if (x > 20 && x < 36) continue; if (rnd(id * 5) > 0.82) continue;
      out.push({ x, z, w: 4.5 + rnd(id * 2) * 3, h: 2.8 + rnd(id * 7) * (gz > 1 ? 3.4 : 1.6), d: 5 + rnd(id * 9) * 3, c: ['#9b7653', '#86684a', '#a8855e', '#b29a78', '#7a5d44'][Math.abs(id) % 5], r: ['#5a4030', '#4a3a34', '#6a4a36'][Math.abs(id) % 3], rot: (rnd(id * 11) - 0.5) * 0.1 });
    }
    return out;
  }, []);
  const reeds = useMemo(() => Array.from({ length: 260 }).map((_, i) => { const a = rnd(i * 1.7); const x = -90 + a * 180; const nearShore = rnd(i * 3.3) > 0.4; return { x, z: nearShore ? 8.5 - rnd(i * 5.1) * 7 : -10 - rnd(i * 7.7) * 70, h: 0.9 + rnd(i * 2.9) * 1.2 }; }).filter((r) => !(r.x > 20 && r.x < 36)), []);
  const cam = { pos: key3(t, [[5.4, [-4, 52, 78]], [7.6, [4, 16, 52]], [9.4, [9, 2.1, 30]], [10.2, [9.6, 1.9, 29]]]) as V3, look: key3(t, [[5.4, [0, 0, -30]], [7.6, [0, 2, -34]], [9.4, [-2, 2.2, -30]], [10.2, [-2, 2.3, -30]]]) as V3 };
  const LAND = 0.45;
  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={46} />
      <fog attach="fog" args={[mixC('#cbd8de', '#7d8894', storm), 60, 320]} />
      <SkyDome stops={[[0, mixC('#4a78b8', '#4a5666', storm)], [0.3, mixC('#8fb2d8', '#69747f', storm)], [0.45, mixC('#d8e2e4', '#8d979e', storm)], [0.5, mixC('#eee6d2', '#a7adb0', storm)], [0.56, '#8a9aa0'], [1, '#4a5a60']]} sun={{ dir: [-0.3, 0.45, -0.84], color: '#fff2d0', size: lerp(220, 60, storm) }} />
      <hemisphereLight args={[mixC('#c8dcff', '#8f9aaa', storm), '#6a6248', lerp(0.95, 0.7, storm)]} />
      <Sun dir={[-0.45, 0.62, 0.35]} focus={[0, 0, -30]} extent={95} color={mixC('#fff0d4', '#aab4c0', storm)} intensity={lerp(2.8, 0.9, storm)} map={4096} />
      {/* Lake Michigan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[900, 900]} /><Mat c={mixC('#5f96b8', '#5a7890', storm)} r={0.3} m={0.15} /></mesh>
      {Array.from({ length: 90 }).map((_, i) => { const ph = (t * 0.5 + rnd(i)) % 1; return <Box key={i} size={[1.5 + rnd(i * 2) * 4, 0.02, 0.09]} p={[-70 + rnd(i * 3.1) * 140 + ph * 2, 0.03, 10 + rnd(i * 5.3) * 60]} c="#eaf6ff" e="#cfe8ff" ei={0.6} op={Math.sin(ph * Math.PI) * 0.7} shadow={false} />; })}
      {Array.from({ length: 16 }).map((_, i) => <Box key={`f${i}`} size={[10, 0.03, 0.28]} p={[-88 + i * 11.4, 0.04, 9.2 + Math.sin(t * 1.4 + i * 1.7) * 0.5]} c="#f4fbff" op={0.55 + 0.25 * Math.sin(t * 1.4 + i * 1.7)} shadow={false} />)}
      {/* the land: flat, wet, a hand's breadth above the water (river mouth between the two slabs) */}
      {([[-85, 210], [143, 214]] as number[][]).map(([x, w], i) => (
        <group key={i}>
          <mesh position={[x, LAND / 2, -91]} receiveShadow castShadow><boxGeometry args={[w, LAND, 200]} /><Mat c="#6a5a3c" r={1} /></mesh>
          <mesh position={[x, LAND + 0.005, -91]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, 200]} /><Mat c="#fff" map={marsh} r={0.95} /></mesh>
        </group>
      ))}
      {/* sloughs and standing water */}
      {Array.from({ length: 34 }).map((_, i) => { const x = -85 + rnd(i * 3.3) * 170; if (x > 18 && x < 38) return null; return <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[x, LAND + 0.02, 4 - rnd(i * 5.9) * 95]} scale={[1, 0.45, 1]}><circleGeometry args={[2 + rnd(i * 2) * 5, 18]} /><Mat c={mixC('#7fa6bd', '#5d7482', storm)} r={0.1} m={0.6} /></mesh>; })}
      {/* muddy streets */}
      {Array.from({ length: 12 }).map((_, i) => { const x = -90 + i * 15 + 10.6; if (x > 18 && x < 38) return null; return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, LAND + 0.03, -52]}><planeGeometry args={[4.2, 104]} /><Mat c="#fff" map={mud} r={0.6} /></mesh>; })}
      {[-14, -42, -70].map((z) => <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[-36, LAND + 0.03, z + 3.5]}><planeGeometry args={[108, 4]} /><Mat c="#5e4a36" r={0.6} /></mesh>)}
      {/* houses */}
      {houses.map((hh, i) => (
        <group key={i} position={[hh.x, LAND, hh.z]} rotation={[0, hh.rot, 0]}>
          <Box size={[hh.w, hh.h, hh.d]} p={[0, hh.h / 2, 0]} c={hh.c} r={0.95} />
          <Cyl rt={0.02} rb={Math.max(hh.w, hh.d) * 0.78} h={1.7} p={[0, hh.h + 0.85, 0]} rot={[0, Math.PI / 4, 0]} c={hh.r} seg={4} r={1} />
          <Box size={[0.9, 1.5, 0.05]} p={[0, 0.75, hh.d / 2 + 0.03]} c="#3a2a1e" shadow={false} />
          {[-1, 1].map((s) => <Box key={s} size={[0.8, 0.9, 0.05]} p={[s * hh.w * 0.3, hh.h * 0.6, hh.d / 2 + 0.03]} c={i % 3 ? '#2c3a4a' : '#f0c070'} e={i % 3 ? undefined : '#ffb04a'} ei={0.8} shadow={false} />)}
          {i % 4 === 0 && <><Box size={[0.6, 1.4, 0.6]} p={[hh.w * 0.25, hh.h + 1.2, 0]} c="#6a4034" />
            {[0, 1, 2].map((k) => { const ph = (t * 0.25 + k / 3 + i * 0.13) % 1; return <Puff key={k} p={[hh.w * 0.25 + ph * 3, hh.h + 2.2 + ph * 4, 0]} size={1 + ph * 3} color="#d8d0c8" op={(1 - ph) * 0.4} />; })}</>}
        </group>
      ))}
      {/* church, warehouse on the river, pier with a schooner */}
      <group position={[-22, LAND, -36]}><Box size={[7, 6, 12]} p={[0, 3, 0]} c="#e6e0d0" /><Cyl rt={0.02} rb={5.6} h={3} p={[0, 7.5, 0]} rot={[0, Math.PI / 4, 0]} seg={4} c="#5a4a44" /><Box size={[2.6, 9, 2.6]} p={[0, 4.5, 6.4]} c="#e6e0d0" /><Cyl rt={0.02} rb={2} h={6} p={[0, 12, 6.4]} rot={[0, Math.PI / 4, 0]} seg={4} c="#5a4a44" /></group>
      <group position={[41, LAND, -12]}><Box size={[10, 8, 16]} p={[0, 4, 0]} c="#8a5c44" /><Cyl rt={0.02} rb={9.6} h={3} p={[0, 9.5, 0]} rot={[0, Math.PI / 4, 0]} seg={4} c="#4a3a34" /></group>
      <group position={[14, 0, 10]}>
        <Box size={[3, 0.25, 22]} p={[0, 0.95, 4]} c="#8a6a48" r={0.95} />
        {Array.from({ length: 8 }).map((_, i) => [-1.3, 1.3].map((x) => <Cyl key={`${i}${x}`} rt={0.16} h={1.8} p={[x, 0.2, -6 + i * 3]} c="#5a4430" />))}
        <group position={[5.5, 0.3 + Math.sin(t * 1.1) * 0.12, 9]} rotation={[Math.sin(t * 0.9) * 0.03, 0.2, Math.sin(t * 1.1) * 0.04]}>
          <Box size={[2.6, 1.3, 11]} p={[0, 0.4, 0]} c="#4a3426" /><Box size={[2.2, 0.2, 10]} p={[0, 1.1, 0]} c="#9a7a54" />
          {[-2.4, 2.2].map((z, i) => <group key={z} position={[0, 1, z]}><Cyl rt={0.09} rb={0.13} h={9 - i} p={[0, (9 - i) / 2, 0]} c="#6a4c30" />
            <mesh position={[0, 4.6 - i * 0.4, 1.3]} rotation={[0, Math.PI / 2, 0]} castShadow><planeGeometry args={[2.8, 5.6 - i]} /><Mat c="#efe6d2" r={1} side={THREE.DoubleSide} /></mesh></group>)}
        </group>
      </group>
      {/* reeds along the shore and in the wet ground */}
      {reeds.map((r, i) => <Cyl key={i} rt={0.01} rb={0.06} h={r.h} p={[r.x, LAND + r.h / 2 - (r.z > 6 ? 0.3 : 0), r.z]} rot={[Math.sin(t * 2 + i) * 0.1, 0, Math.cos(t * 1.7 + i) * 0.12]} c={i % 3 ? '#5c6e34' : '#8a8a48'} seg={4} shadow={false} />)}
      {/* life on the shore road: a wagon and people on foot */}
      <group position={[-40 + ((t - 5.4) * 2.2), LAND, 2.4]}><Wagon3D p={[0, 0, 0]} rotY={0} /></group>
      {[0, 1, 2, 3, 4].map((i) => <Walker key={i} t={t} frame={frame} i={i} z={3.6 - (i % 2) * 2.2} y={LAND} speed={1.2 + i * 0.1} span={[-24, 30]} />)}
      {/* gulls */}
      {Array.from({ length: 6 }).map((_, i) => { const bx = -14 + ((t * 4 + i * 6) % 40), by = 5 + i * 1.6 + Math.sin(t * 1.6 + i) * 0.8, fl = Math.sin(t * 9 + i * 2) * 0.6;
        return <group key={i} position={[bx, by, 24 - i * 3]}>{[-1, 1].map((s) => <Box key={s} size={[0.7, 0.03, 0.2]} p={[s * 0.32, Math.abs(fl) * 0.1, 0]} rot={[0, 0, s * fl]} c="#f4f4f0" shadow={false} />)}</group>; })}
      {/* weather rolling in from the west */}
      {Array.from({ length: 14 }).map((_, i) => <Puff key={`c${i}`} p={[-260 + storm * 200 + i * 22 + Math.sin(i) * 20, 50 + rnd(i) * 30, -140 - rnd(i * 3) * 60]} size={90 + rnd(i * 7) * 60} color="#5a6370" op={0.9 * storm} />)}
      {Array.from({ length: 10 }).map((_, i) => <Puff key={`w${i}`} p={[-120 + ((i * 37 + t * 2) % 260), 60 + rnd(i) * 30, -200 - rnd(i * 3) * 40]} size={50 + rnd(i * 7) * 40} color="#ffffff" op={0.6 * (1 - storm)} />)}
    </>
  );
};

/* ================================================================== */
/** Shot 5: when it rained, the streets turned into deep, sucking mud. */
export const MudStreetShot: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const mud = useTex(1024, 1024, dirtDraw('#4a3828'), [8, 4]);
  const planks = useTex(512, 256, plankDraw('#8a6a48', 12), [14, 1]);
  const mw = OT.mudWalk;
  const flash = Math.max(seg(t, OT.thunder - 0.02, OT.thunder + 0.02) * (1 - seg(t, OT.thunder + 0.05, OT.thunder + 0.16)), 0.7 * seg(t, OT.thunder + 0.2, OT.thunder + 0.23) * (1 - seg(t, OT.thunder + 0.26, OT.thunder + 0.4)));
  // the gentleman: steps off the boardwalk, each stride sinks deeper, then he is stuck fast
  const hz = key(t, [[10.0, -6.5], [mw.t0, -5.6], [mw.t1, -1.6], [13.9, -1.5]]);
  const depth = key(t, [[mw.t0 - 0.1, 0], [mw.t0 + 0.5, 0.16], [mw.t1, 0.5], [13.9, 0.58]]);
  const onWalk = t < mw.t0 - 0.25 ? 0.3 : lerp(0.3, 0, seg(t, mw.t0 - 0.25, mw.t0 + 0.1)); // boardwalk height under him
  const stuck = seg(t, mw.t1 - 0.05, mw.t1 + 0.15);
  const tug = seg(t, OT.tug - 0.28, OT.tug) * (1 - seg(t, OT.tug + 0.12, OT.tug + 0.3));
  const slump = seg(t, OT.slump, OT.slump + 0.3);
  const ph = (Math.PI * (t - mw.t0)) / mw.step;
  const wob = Math.sin(t * 11) * stuck * (1 - slump);
  const hero: Pose3 = stuck < 0.5
    ? { ...walkPose(t < mw.t0 ? (Math.PI * (t - 10)) / 0.4 : ph, t < mw.t0 ? 0.28 : 0.2, { lift: t < mw.t0 ? 0.12 : 0.3, lean: 0.14 }), headPitch: 0.3 * seg(t, mw.t0, mw.t0 + 0.5), smile: lerp(0.5, -0.7, seg(t, mw.t0 + 0.2, mw.t0 + 0.7)), brow: seg(t, mw.t0 + 0.3, mw.t0 + 0.8), browTilt: 0.5 * seg(t, mw.t0 + 0.3, mw.t0 + 0.8) }
    : {
      hipY: STAND_HIP - 0.06 + tug * 0.14 - slump * 0.08, lean: 0.12 - tug * 0.3 + slump * 0.25, side: wob * 0.07, twist: wob * 0.1,
      footL: V(-0.14, 0.07, 0.02), footR: V(0.14, 0.07 + tug * 0.1, 0.16),
      handL: V(-0.42 - tug * 0.12, 1.1 + tug * 0.45 + wob * 0.1 - slump * 0.35, 0.18), handR: V(0.42 + tug * 0.12, 1.1 + tug * 0.45 - wob * 0.1 - slump * 0.35, 0.18),
      headPitch: lerp(0.45, -0.1, slump) - tug * 0.4, headYaw: slump * 0.25, smile: lerp(-0.9, -0.4, slump), open: tug * 0.7, mouthW: 1.1, brow: 1 - slump * 0.6, browTilt: 1 - slump, eyes: 1 + tug * 0.3,
    };
  const heave = OT.wagonHeave.reduce((m, h) => Math.max(m, seg(t, h - 0.3, h) * (1 - seg(t, h + 0.15, h + 0.5))), 0);
  const cam = { pos: key3(t, [[10.0, [-5.2, 2.0, 10.2]], [12.2, [-3.6, 1.6, 6.4]], [13.9, [-2.4, 1.4, 3.9]]]) as V3, look: key3(t, [[10.0, [0.4, 1.5, -5]], [12.2, [-1.2, 1.0, -1.8]], [13.9, [-1.5, 0.85, -1.5]]]) as V3 };
  const rows: [number, number, number, string, string, number, boolean][] = [[-27, 11, 9, '#8c6a4a', 'DRY GOODS', 3, true], [-14.5, 12, 12, '#7a5a5a', 'HARDWARE', 5, false], [-1.5, 12.5, 8.5, '#9a6a4c', 'BOOTS & SHOES', 7, false], [11.5, 11, 11, '#86745a', 'SALOON', 9, true], [24, 12, 9.5, '#7d6a58', 'GROCER', 11, true]];
  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={44} />
      <fog attach="fog" args={['#77828c', 14, 85]} />
      <SkyDome stops={[[0, '#3a4452'], [0.35, '#59636e'], [0.5, '#8b949a'], [0.56, '#6a7178'], [1, '#3a4046']]} />
      <hemisphereLight args={['#aab8ca', '#4a4038', 1.05 + flash * 2.5]} />
      <Sun dir={[-0.35, 0.8, 0.45]} focus={[-1, 1, -2]} extent={18} color="#b9c4d2" intensity={1.1 + flash * 5} />
      <directionalLight position={[10, 6, -20]} color="#8fa4c8" intensity={0.5} />
      {/* the street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[160, 60]} /><Mat c="#ffffff" map={mud} bump={mud} bs={2.2} r={0.32} m={0.15} /></mesh>
      {Array.from({ length: 16 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[-16 + rnd(i * 3.1) * 32, 0.012, -5 + rnd(i * 5.7) * 11]} scale={[1, 0.5, 1]}><circleGeometry args={[0.6 + rnd(i * 2) * 1.5, 20]} /><Mat c="#8693a0" r={0.06} m={0.75} /></mesh>)}
      {[-3.4, -1.1, 1.6, 3.9].map((z, i) => <Box key={z} size={[70, 0.02, 0.32]} p={[0, 0.006, z + Math.sin(i) * 0.3]} c="#2e2218" r={0.3} shadow={false} />)}
      {/* far side: plank sidewalk and a row of storefronts */}
      <mesh position={[0, 0.15, -7.4]} castShadow receiveShadow><boxGeometry args={[80, 0.3, 2.6]} /><Mat c="#fff" map={planks} r={0.8} /></mesh>
      {Array.from({ length: 30 }).map((_, i) => <Box key={i} size={[0.16, 0.5, 0.16]} p={[-40 + i * 2.7, 0.1, -6.15]} c="#5a4430" />)}
      {rows.map(([x, w, h, wall, sign, seed, wood]) => <Neighbor key={seed} p={[x, 0.2, -13.6]} size={[w, h, 10]} wall={wall} sign={sign} seed={seed} wood={wood} awning={seed % 4 === 3 ? '#6a2f2a' : '#2f4a5a'} night={0.9} />)}
      {[-9, 6.5].map((x) => <Lamp3D key={x} p={[x, 0.3, -6.4]} on={1} light />)}
      {/* near side: where we stand */}
      <mesh position={[0, 0.15, 8.6]} receiveShadow><boxGeometry args={[80, 0.3, 3]} /><Mat c="#fff" map={planks} r={0.8} /></mesh>
      <group position={[-7.4, 0.3, 7.6]}><Barrel p={[0, 0, 0]} /><Barrel p={[0.75, 0, 0.3]} s={0.9} /></group>
      <group position={[-1.2, 0.3, 7.3]}>{[-1.4, 1.4].map((x) => <Box key={x} size={[0.14, 1.1, 0.14]} p={[x, 0.55, 0]} c="#5a4430" />)}<Box size={[3.1, 0.12, 0.12]} p={[0, 1.0, 0]} c="#6a5038" /></group>
      {/* a wagon bogged to the axles; its driver throws his weight at the wheel */}
      <group position={[2.9, -0.34, -4.2]} rotation={[0.03 + heave * 0.02, -0.2, 0.06 - heave * 0.03]}><Wagon3D p={[0, 0, 0]} /></group>
      <Character3D frame={frame} seed={90} pos={[0.75, -0.22, -3.5]} rotY={1.35} look={{ ...CAST3.worker1, coat: '#6a5a4a' }}
        pose={{ hipY: STAND_HIP - 0.22 - heave * 0.08, lean: 0.55 + heave * 0.25, handL: V(-0.18, 0.95, 0.5 + heave * 0.06), handR: V(0.18, 1.05, 0.5 + heave * 0.06), footL: V(-0.16, 0.07, -0.42 - heave * 0.12), footR: V(0.16, 0.07, 0.1), headPitch: 0.25, smile: -0.9, open: heave * 0.4, browTilt: 1, eyes: 1 - heave * 0.5 }} />
      {/* passers-by keeping to the planks: one under an umbrella, one running for cover with a hand on his hat */}
      <Walker t={t} frame={frame} i={0} z={-7.3} y={0.3} speed={1.15} span={[-18, 16]} look={CAST3.lady}
        extra={{ handR: V(0.2, 1.3, 0.25), propR: <group rotation={[0, 0, 0]}><Cyl rt={0.012} h={1.0} p={[0, 0.45, 0]} c="#3a2a1e" /><Cyl rt={0.02} rb={0.62} h={0.24} p={[0, 0.95, 0]} c="#2c3a4a" r={0.7} seg={10} /></group> }} />
      <Walker t={t} frame={frame} i={1} z={-7.9} y={0.3} speed={2.6} span={[-10, 26]} look={PEDS[3]} extra={{ handR: V(0.17, 1.86, 0.12), lean: 0.22, headPitch: 0.2, smile: -0.3 }} />
      {/* the gentleman */}
      <Character3D frame={frame} seed={95} pos={[-1.5, onWalk - depth, hz]} rotY={0} look={CAST3.gent} pose={hero} />
      {/* mud closes round his legs; bubbles and ripples where he is stuck */}
      {depth > 0.05 && [0, 1, 2].map((k) => { const u = (t * 1.3 + k / 3) % 1; return <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, 0.02, hz + 0.05]}><ringGeometry args={[0.25 + u * 0.5, 0.29 + u * 0.5, 24]} /><meshBasicMaterial color="#8a7a66" transparent opacity={(1 - u) * 0.6} /></mesh>; })}
      {tug > 0.3 && Array.from({ length: 8 }).map((_, i) => <Sph key={i} rad={0.035} p={[-1.5 + Math.cos(i) * (0.2 + tug * 0.25), 0.05 + Math.sin(tug * Math.PI) * (0.15 + rnd(i) * 0.25), hz + Math.sin(i) * (0.2 + tug * 0.25)]} c="#3a2a1c" r={0.4} shadow={false} />)}
      {/* rain: streaks, splashes on the puddles, runoff from the awnings */}
      {Array.from({ length: 340 }).map((_, i) => { const y = 9 - ((t * 15 + rnd(i) * 9) % 9); return <Box key={i} size={[0.012, 0.55, 0.012]} p={[-13 + rnd(i * 3.3) * 26 + y * 0.12, y, -9 + rnd(i * 7.1) * 18]} rot={[0, 0, -0.12]} c="#dfe9f5" op={0.42} shadow={false} recv={false} />; })}
      {Array.from({ length: 34 }).map((_, i) => { const u = (t * 2.6 + rnd(i)) % 1; return <mesh key={`s${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-12 + rnd(i * 3.7) * 24, 0.025, -5.5 + rnd(i * 9.1) * 12]}><ringGeometry args={[u * 0.22, u * 0.22 + 0.025, 16]} /><meshBasicMaterial color="#dfe9f5" transparent opacity={(1 - u) * 0.6} /></mesh>; })}
      {Array.from({ length: 8 }).map((_, i) => <Puff key={`h${i}`} p={[-20 + i * 6 + Math.sin(t * 0.4 + i) * 1.5, 1.4, -5 - rnd(i) * 3]} size={9} color="#9aa6b0" op={0.16} />)}
      {[-9, 6.5].map((x) => <Glow key={x} p={[x, 0.06, -5.2]} size={3.6} color="#ffb04a" op={0.16} />)}
    </>
  );
};
