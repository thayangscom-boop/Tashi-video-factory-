import React from 'react';
import * as THREE from 'three';
import { CAST3, Character3D, Look3, Pose3, STAND_HIP, toLocal, walkFeet } from './Character3D';
import { Sun } from './ExteriorShot';
import { Box, Cam, Cyl, Puff, SkyDome, Sph, V, V3, clamp, key, key3, lerp, rnd, seg, settle } from './kit';
import { CrewRow, FZ, PitStreet, RAMP, SX, TRENCH, jackX, rampY } from './liftSet';
import { STREET, STROKES, TL, inLapse, joltAt, liftAt, todAt } from './liftWorld';
import { HOTEL, Hotel3D } from './sets';

const BW = STREET + 0.12; // boardwalk surface
const mixC = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
const DAY: [number, string][] = [[0, '#2f62ad'], [0.3, '#6f9bd6'], [0.43, '#bcd3ea'], [0.5, '#e9e6da'], [0.56, '#b9a58c'], [1, '#6a5a4a']];
const DUSK: [number, string][] = [[0, '#27437c'], [0.3, '#5d6ea6'], [0.43, '#e79a78'], [0.5, '#ffd6a0'], [0.56, '#f0a070'], [1, '#6a4a48']];

const PARTNER_A: Look3 = { ...CAST3.gent, coat: '#5a4a6a', vest: '#c9a227', hatColor: '#2e2a30' };
const PARTNER_B: Look3 = { ...CAST3.gent, coat: '#4a5a44', hat: 'bowler', hatColor: '#3a3028', hair: '#8a8a8a', mustache: false, beard: true, glasses: true, vest: '#7a2a26' };
const GUEST: Look3 = { ...CAST3.gent, coat: '#6a2f3a', vest: '#e0c060', hatColor: '#1e1a22', hair: '#3a2416' };
const PEDS: Look3[] = [CAST3.lady, { ...CAST3.lady, coat: '#3f6a6a', hatColor: '#e6c9d0', hair: '#2a1a10' }, PARTNER_A, { ...CAST3.worker2, rolled: false, hat: 'bowler', hatColor: '#4a3a2a' }, { ...CAST3.lady, coat: '#7a5a9a', hair: '#a0582a' }];

/** phase-locked walk: one foot contact every `step` seconds, so footstep sounds can be placed exactly */
const stride = (speed: number, step: number) => (speed * step) / 2;
const walkAt = (t: number, t0: number, step: number, speed: number) => walkFeet((Math.PI * (t - t0)) / step, stride(speed, step));

/** Background pedestrian looping along a line (keeps the street alive). */
const Ped: React.FC<{ t: number; frame: number; i: number; z: number; speed: number; span?: [number, number]; y?: number }> = ({ t, frame, i, z, speed, span = [-26, 22], y = BW }) => {
  const dir = i % 2 ? -1 : 1; const len = span[1] - span[0];
  const d = (((t * Math.abs(speed) + i * 9.7) % len) + len) % len;
  const x = dir > 0 ? span[0] + d : span[1] - d;
  const w = walkFeet((t * Math.abs(speed) * Math.PI) / (2 * 0.24) + i, 0.24);
  return <Character3D frame={frame} seed={60 + i} pos={[x, y, z]} rotY={dir > 0 ? Math.PI / 2 : -Math.PI / 2} look={PEDS[i % PEDS.length]}
    pose={{ ...w, lean: 0.06, headYaw: Math.sin(t * 0.9 + i * 2) * 0.5 * (i % 3 === 0 ? -1 : 1), headPitch: i % 3 === 0 ? -0.25 : 0, smile: 0.5 }} />;
};

/** A man pushing a loaded handcart along the new street. */
const Handcart: React.FC<{ t: number; frame: number; speed: number; x0: number; z: number }> = ({ t, frame, speed, x0, z }) => {
  const x = x0 + ((t * speed) % 46);
  const w = walkFeet((t * speed * Math.PI) / (2 * 0.22), 0.22);
  return <group>
    <group position={[x + 1.15, STREET, z]}>
      <Box size={[1.3, 0.5, 0.8]} p={[0, 0.75, 0]} c="#8a6238" r={0.95} />
      {[-1, 1].map((s) => <group key={s} position={[0.1, 0.42, s * 0.48]} rotation={[0, 0, -(t * speed) / 0.42]}>
        <mesh castShadow><torusGeometry args={[0.4, 0.045, 6, 18]} /><meshStandardMaterial color="#3a2516" /></mesh>
        {[0, 1, 2].map((k) => <Box key={k} size={[0.78, 0.04, 0.04]} rot={[0, 0, (k * Math.PI) / 3]} c="#5a3a22" />)}
      </group>)}
      {[-1, 1].map((s) => <Box key={s} size={[1.0, 0.05, 0.05]} p={[-1.0, 0.95, s * 0.3]} rot={[0, 0, -0.12]} c="#6a4a2c" />)}
      {[0, 1, 2].map((k) => <Box key={k} size={[0.5, 0.36, 0.5]} p={[-0.3 + k * 0.32, 1.18 + (k % 2) * 0.1, (k - 1) * 0.12]} rot={[0, k, 0]} c={['#c9b07a', '#a8824e', '#b9a06a'][k]} r={1} />)}
    </group>
    <Character3D frame={frame} seed={77} pos={[x - 0.55, STREET, z]} rotY={Math.PI / 2} look={{ ...CAST3.worker1, coat: '#7a5a4a' }}
      pose={{ ...w, lean: 0.32, handL: V(-0.3, 0.98, 0.42), handR: V(0.3, 0.98, 0.42), headPitch: -0.2, smile: -0.2 }} />
  </group>;
};

export const LiftShot: React.FC<{ t: number; frame: number; shot: number }> = ({ t, frame, shot }) => {
  const lift = liftAt(t), tod = todAt(t), jolt = joltAt(t);
  const blocks = Math.max(0, lift - 0.86);
  const lapse = inLapse(t);
  const sp = lapse ? 7 : 1; // street life speeds up in the time-lapse
  const frontXs = Array.from({ length: 9 }).map((_, k) => jackX(k * 2));
  const sideXs = [-3.6, -1.3, 1.0, 3.3];

  /* ---------------- foreman: George Pullman ---------------- */
  const wp = TL.walks.pullman;
  const pWalk = clamp((t - wp.t0) / (wp.t1 - wp.t0));
  const turn = seg(t, wp.t1 - 0.05, wp.t1 + 0.4);
  const pPos: V3 = [-5.0 + 1.5 * Math.min(Math.max(t, 0), wp.t1), BW, FZ + lerp(4.6, 4.02, turn)];
  const pRot = lerp(Math.PI / 2, Math.PI, turn);
  const point = settle(t, 1.75, 0.4) * (1 - seg(t, 2.6, 3.0));
  const beckon = seg(t, 2.7, 3.0) * (1 - seg(t, 4.3, 4.6));
  const wh = TL.whistle; // whistle to lips -> blow -> chop
  const raise = seg(t, wh - 0.4, wh - 0.12) * (1 - seg(t, wh + 0.36, wh + 0.5));
  const blow = seg(t, wh - 0.04, wh + 0.03) * (1 - seg(t, wh + 0.3, wh + 0.4));
  const callUp = STROKES.reduce((m, s) => Math.max(m, seg(t, s - 0.5, s - 0.25) * (1 - seg(t, s - 0.06, s + 0.06))), 0);
  const chop = STROKES.reduce((m, s) => Math.max(m, seg(t, s - 0.06, s + 0.04) * (1 - seg(t, s + 0.25, s + 0.45))), 0);
  const stepTurn = Math.sin(clamp((t - wp.t1) / 0.4) * Math.PI);
  const pullman: Pose3 = t < wp.t1
    ? { ...walkAt(t, wp.t0, wp.step, 1.5), lean: 0.07, twist: Math.sin((Math.PI * (t - wp.t0)) / wp.step) * 0.08, headYaw: -0.35 * seg(t, 0.5, 1.2), headPitch: -0.12, smile: 0.7, handL: V(-0.24, 0.86, 0.16), propL: <Cyl rt={0.035} h={0.7} rot={[Math.PI / 2, 0, 0.2]} c="#e9e0c8" r={1} /> }
    : {
      hipY: STAND_HIP - 0.02 + raise * 0.02 - chop * 0.04, lean: 0.14 * point - 0.08 * raise + 0.1 * blow + 0.16 * chop - 0.06 * callUp, twist: -0.12 * point,
      headPitch: 0.34 * point - 0.1 * raise + 0.3 * chop - 0.15 * callUp + (shot >= 4 ? 0.3 : 0), headYaw: 0.25 * beckon,
      handL: V(-0.3, 1.02 - 0.12, 0.3), // on the rail
      handR: raise > 0.02 ? V(lerp(0.3, 0.07, raise), lerp(0.8, 1.27, raise), lerp(0.2, 0.27, raise))
        : V(0.3 + 0.04 * chop, lerp(lerp(0.75, 0.98, point), 1.6, Math.max(callUp, beckon * (0.6 + 0.4 * Math.sin(t * 9)))) - chop * 0.1, lerp(0.2, 0.55, Math.max(point, chop))),
      footL: V(-0.13, 0.07 + stepTurn * 0.06, 0), footR: V(0.13, 0.07, 0.05),
      open: Math.max(point * (0.3 + 0.3 * Math.abs(Math.sin(t * 14))), chop * 0.8, blow * 0.22), mouthW: blow > 0.3 ? 0.45 : 1.1, smile: 0.6, brow: point * 0.4 + raise * 0.6, eyes: 1 - blow * 0.75,
      propR: raise > 0.3 ? <Cyl rt={0.016} h={0.07} p={[0, -0.07, 0.03]} rot={[Math.PI / 2, 0, 0]} c="#e8c45a" m={0.3} r={0.3} e="#6a4a10" ei={0.6} /> : undefined,
    };
  const partner = (dx: number, dz: number, look: Look3, kind: 'hat' | 'plan', seed: number) => {
    const pos: V3 = [pPos[0] + dx - (t > wp.t1 ? 0 : 0), BW, FZ + 4.6 + dz - turn * 0.25];
    const up = seg(t, 1.5, 1.9);
    const pose: Pose3 = t < wp.t1
      ? { ...walkAt(t, wp.t0 + seed * 0.11, wp.step, 1.5), lean: 0.06, headYaw: -0.5 * seg(t, 0.2, 0.9), headPitch: -0.3 * seg(t, 0.2, 0.9), smile: 0.4 }
      : kind === 'hat'
        ? { headPitch: -0.5 * up, lean: -0.1 * up, handR: V(0.17, lerp(0.8, 1.5, up), 0.14), open: 0.4 * up, brow: up, smile: 0.3, hipY: STAND_HIP - 0.01 }
        : { headPitch: 0.3 * up, handL: V(-0.2, 0.98, 0.34), handR: V(0.2, 0.98, 0.34), smile: 0.3, propR: <Box size={[0.55, 0.01, 0.4]} p={[-0.2, -0.06, 0.02]} rot={[0.5, 0, 0]} c="#dfe9f2" r={1} /> };
    return <Character3D key={seed} frame={frame} seed={seed} pos={pos} rotY={lerp(Math.PI / 2, kind === 'hat' ? Math.PI * 0.95 : Math.PI * 0.8, turn)} look={look} pose={pose} />;
  };

  /* ---------------- camera per shot ---------------- */
  let cam: { pos: V3; look: V3; fov: number };
  let sunFocus: V3 = [0, 2, FZ + 2]; let sunExtent = 16; let sunMap = 2048;
  if (shot === 0) {
    const px = pPos[0]; const rev = seg(t, 1.35, 2.2);
    cam = { pos: [px + lerp(3.6, 1.9, rev), BW + lerp(1.2, 3.1, rev), FZ + lerp(6.4, 5.7, rev)], look: [px + lerp(0.1, -1.2, rev), lerp(BW + 1.12, 0.4, rev), FZ + lerp(4.5, 0.9, rev)], fov: lerp(40, 50, rev) };
    sunFocus = [px, BW, FZ + 4]; sunExtent = 13;
  } else if (shot === 1) {
    cam = { pos: key3(t, [[2.25, [2.2, 8.2, FZ + 2.9]], [3.5, [1.2, 3.6, FZ + 2.7]], [4.6, [-0.55, 0.78, FZ + 1.3]]]) as V3, look: key3(t, [[2.25, [-7.0, 1.4, FZ + 2.5]], [3.5, [-4.6, 0.9, FZ + 1.8]], [4.6, [-2.4, 0.42, FZ + 0.1]]]) as V3, fov: 46 };
    sunFocus = [-5, 1.5, FZ + 2]; sunExtent = 15;
  } else if (shot === 2) {
    const w = seg(t, TL.whip - 0.14, TL.whip + 0.14); const tr = seg(t, TL.whip, 7.0);
    cam = { pos: [lerp(pPos[0] + 0.55, -1.2, w) + tr * -0.5, lerp(BW + 1.12, 1.15, w), FZ + lerp(2.35, 1.85, w)], look: [lerp(pPos[0] + 0.02, -5.6, w), lerp(BW + 1.36, 0.86, w), FZ + lerp(4.0, 0.25, w)], fov: lerp(30, 46, w) };
    sunFocus = [-2.5, 2, FZ + 2]; sunExtent = 10;
  } else if (shot === 3) {
    cam = { pos: key3(t, [[7.0, [0.95, 0.7, FZ + 1.0]], [8.05, [0.78, 0.64, FZ + 0.8]]]) as V3, look: [-0.08, lift - 0.2, FZ - 0.3], fov: 40 };
    sunFocus = [0, 1, FZ + 1]; sunExtent = 7;
  } else if (shot === 4) {
    cam = { pos: key3(t, [[8.05, [0.2, 7.2, FZ + 4.7]], [10.3, [0.9, 8.0, FZ + 5.1]]]) as V3, look: key3(t, [[8.05, [-6.6, 0.9, FZ + 1.2]], [10.3, [-6.4, 1.0, FZ + 1.2]]]) as V3, fov: 50 };
    sunFocus = [-6, 2, FZ + 1.5]; sunExtent = 11;
  } else if (shot === 5) {
    cam = { pos: key3(t, [[10.0, [-21, BW + 1.6, FZ + 31]], [12.1, [-19.6, BW + 2.5, FZ + 33.5]]]) as V3, look: key3(t, [[10.0, [0.6, 6.4, 0]], [12.1, [0.6, 8.0, 0]]]) as V3, fov: 48 };
    sunFocus = [0, 6, 4]; sunExtent = 32; sunMap = 4096;
  } else {
    cam = { pos: key3(t, [[12.05, [1.0, BW + 2.2, FZ + 7.4]], [14.2, [0.5, BW + 1.6, FZ + 5.6]]]) as V3, look: key3(t, [[12.05, [-1.2, BW + 0.5, FZ + 2.6]], [14.2, [-1.25, BW + 1.0, FZ + 1.4]]]) as V3, fov: 44 };
    sunFocus = [-1, BW, FZ + 2.5]; sunExtent = 10;
  }
  const sk = jolt * (shot === 3 ? 0.012 : shot === 2 ? 0.03 : 0.02);
  cam.pos = [cam.pos[0] + Math.sin(t * 61) * sk, cam.pos[1] + Math.cos(t * 53) * sk, cam.pos[2]];

  /* ---------------- light: working daylight -> dusk ---------------- */
  const sunDir = new THREE.Vector3(lerp(-0.5, -0.62, tod), lerp(0.82, 0.3, tod), lerp(0.55, 0.7, tod)).normalize();
  const stops = DAY.map(([o, c], i) => [o, mixC(c, DUSK[i][1], tod)] as [number, string]);

  /* ---------------- payoff: gangplank + guest ---------------- */
  const slide = seg(t, 12.03, TL.plank); const pd = t > TL.plank ? Math.exp(-(t - TL.plank) * 9) * Math.cos((t - TL.plank) * 30) : 1;
  const plankRear = FZ + 0.15 + 3.55 + (1 - slide) * 3.4;
  const gw = TL.walks.guest; const gGo = clamp((t - gw.t0) / (gw.t1 - gw.t0)); const tip = seg(t, TL.hatTip - 0.3, TL.hatTip) * (1 - seg(t, TL.hatTip + 0.35, TL.hatTip + 0.6));
  const seen = seg(t, TL.plank, TL.plank + 0.25);
  const aside = seg(t, TL.plank + 0.1, TL.plank + 0.55);

  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
      <fog attach="fog" args={[mixC('#cfdbe6', '#e6a888', tod), 30, 210]} />
      <SkyDome stops={stops} sun={{ dir: [0.55, lerp(0.5, 0.1, tod), -0.83], color: mixC('#fff6e0', '#ffd9a0', tod), size: lerp(160, 320, tod) }} />
      <hemisphereLight args={[mixC('#c4daff', '#93b0ff', tod), mixC('#8f7256', '#8a5a3c', tod), lerp(0.95, 0.75, tod)]} />
      <Sun dir={[sunDir.x, sunDir.y, sunDir.z]} focus={sunFocus} extent={sunExtent} color={mixC('#fff0d4', '#ffab66', tod)} intensity={lerp(3.0, 2.7, tod)} map={sunMap} />
      <directionalLight position={[30, 22, -40]} color="#8fb2ff" intensity={lerp(0.7, 1.1, tod)} />

      <PitStreet t={t} tod={tod} lift={lift}
        plank={shot >= 5 ? { slide: shot === 5 ? 0 : slide, drop: shot === 5 ? 0 : (slide < 1 ? 1 - slide * 0.6 : pd * 0.4) } : null} />
      <Hotel3D lift={lift} t={t} ownJacks={false} night={tod * 0.9} shake={jolt * 0.01} doorOpen={seg(t, 11.6, 12.0)} smoke={lapse ? 1.4 : 0.22} />

      {/* front crew; the left-side crew is only built for the shots that can see it */}
      <group position={[0, 0, FZ]}>
        <CrewRow t={t} frame={frame} lift={lift} xs={frontXs} lookAt={(1 - seg(t, TL.whip - 0.1, TL.whip + 0.15)) * seg(t, 2.0, 2.6)} hide={t < 4.75 ? [3, 4] : []}
          slide={{ k: 3, z: lerp(1.0, 0, seg(t, 3.75, TL.jackSet)) }} ready={t > 4.75 ? 1 : 0} />
      </group>
      {shot === 5 && <group position={[-SX, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><CrewRow t={t} frame={frame} lift={lift} xs={sideXs} seed={20} /></group>}

      {/* ---- shot 2 (and the reveal before it): men, jackscrews and timber coming down the ramp ---- */}
      {shot <= 1 && Array.from({ length: 7 }).map((_, i) => {
        const cw = TL.walks.carriers; const s = i * 1.75 + 1.45 * (Math.max(t, 1.2) - 1.2) - 2.6;
        const x = RAMP.x0 - 2.5 + s; if (x > -4.6 - (i % 2) * 0.6 && i < 2) return null;
        const y = x < RAMP.x0 ? BW - 0.1 : rampY(x) + (x < RAMP.x1 ? 0.05 : 0); const down = x > RAMP.x0 && x < RAMP.x1;
        const w = walkAt(t, cw.t0 + i * 0.13, cw.step, 1.45); const kind = i % 3;
        const pos: V3 = [x, y, RAMP.z + (x > RAMP.x1 ? Math.min(1, (x - RAMP.x1) / 3) * -0.4 : 0)];
        return <group key={i}>
          <Character3D frame={frame} seed={30 + i} pos={pos} rotY={Math.PI / 2} look={[CAST3.worker2, CAST3.worker3, CAST3.worker1][i % 3]}
            pose={{ ...w, lean: down ? -0.1 : 0.08, twist: Math.sin((Math.PI * (t - cw.t0)) / cw.step + i) * 0.06, headPitch: down ? 0.25 : 0, headYaw: i % 2 ? 0.3 : -0.2, smile: 0.2,
              handR: kind === 2 ? V(0.26, 0.5, 0.1) : V(0.2, 1.24, 0.12), handL: kind === 1 ? V(-0.12, 1.22, 0.2) : undefined }} />
          <group position={pos} rotation={[0, Math.PI / 2, 0]}>
            {kind === 0 && <group position={[0.2, 1.28 + (w.hipY - STAND_HIP), -0.05]} rotation={[Math.PI / 2 - 0.15, 0, 0]}><Cyl rt={0.1} rb={0.17} h={0.3} c="#3f464e" m={0.7} r={0.45} seg={10} /><Cyl rt={0.04} h={0.3} p={[0, 0.3, 0]} c="#9aa3ab" m={0.85} r={0.3} seg={8} /></group>}
            {kind === 1 && <Box size={[0.2, 0.18, 2.3]} p={[0.02, 1.33 + (w.hipY - STAND_HIP), -0.1]} rot={[0.06, 0, 0]} c="#a57a4c" r={0.95} />}
            {kind === 2 && <group position={[0.3, 0.3 + (w.hipY - STAND_HIP), 0.1]}><Cyl rt={0.15} rb={0.12} h={0.26} c="#6a747e" m={0.6} r={0.5} /><mesh position={[0, 0.16, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.14, 0.01, 4, 12, Math.PI]} /><meshStandardMaterial color="#333" /></mesh></group>}
          </group>
        </group>;
      })}
      {/* the man setting his jack under the sill (pushes it home), and one driving a wedge with a mallet */}
      {shot <= 1 && (() => {
        const sl = lerp(1.0, 0, seg(t, 3.75, TL.jackSet)); const jx = jackX(6); const pos: V3 = [jx + 0.25, 0, FZ + 0.72 + sl];
        const done = seg(t, TL.jackSet, TL.jackSet + 0.3);
        const grip = toLocal(V(jx, blocks + 0.2, FZ - 0.32 + sl + 0.18), pos, Math.PI);
        return <Character3D frame={frame} seed={45} pos={pos} rotY={Math.PI} look={CAST3.worker1}
          pose={{ hipY: lerp(0.36, 0.52, done), lean: lerp(0.75, 0.3, done), hipZ: -0.1, handL: grip.clone().add(V(-0.13, 0, 0)), handR: lerp(1, 0, done) > 0.5 ? grip.clone().add(V(0.13, 0, 0)) : V(0.3, 0.9, 0.3),
            footL: V(-0.2, 0.07, -0.25), footR: V(0.18, 0.07, 0.12), headPitch: lerp(0.1, -0.5, done), headYaw: done * 0.9, smile: lerp(-0.6, 0.8, done), browTilt: 1 - done, eyes: 1 }} />;
      })()}

      {/* ---- the foreman and his partners on the boardwalk ---- */}
      {shot !== 3 && <Character3D frame={frame} seed={40} pos={shot >= 5 ? [-4.3, BW, FZ + 4.3] : pPos} rotY={shot >= 5 ? 2.0 : pRot} look={CAST3.pullman}
        pose={shot >= 5 ? { handL: V(-0.24, 0.72, 0.1), handR: V(0.24, 0.72, 0.1), smile: 0.9, headYaw: 0.2, lean: -0.05, brow: 0.4, hipY: STAND_HIP - 0.01 } : pullman} />}
      {shot !== 3 && shot < 5 && partner(-1.05, 0.5, PARTNER_A, 'hat', 41)}
      {shot !== 3 && shot < 5 && partner(-1.9, -0.25, PARTNER_B, 'plan', 42)}

      {/* ---- life on the new street ---- */}
      {shot !== 3 && shot !== 6 && [0, 1, 2, 3, 4].map((i) => <Ped key={i} t={t} frame={frame} i={i} z={FZ + TRENCH + 2.2 + (i % 3) * 0.45} speed={(1.15 + i * 0.08) * sp} />)}
      {shot !== 3 && shot !== 2 && shot !== 6 && <Handcart t={t} frame={frame} speed={1.1 * sp} x0={-19} z={FZ + TRENCH + 6.2} />}
      {/* onlookers at the rail: point, lean over, hold hats */}
      {(shot === 4 || shot === 5 || shot === 0) && (() => {
        const g = STROKES.reduce((m, s) => Math.max(m, seg(t, s + 0.1, s + 0.3) * (1 - seg(t, s + 0.7, s + 0.95))), 0);
        return <>
          <Character3D frame={frame} seed={51} pos={[3.4, BW, FZ + 4.0]} rotY={Math.PI * 1.05} look={CAST3.lady}
            pose={{ handR: V(0.2, 1.15 + g * 0.2, 0.42), handL: V(-0.2, 1.0, 0.3), lean: 0.12, headPitch: 0.3 - g * 0.2, open: 0.5 * g, brow: g, eyes: 1 + g * 0.3 }} />
          <Character3D frame={frame} seed={52} pos={[4.5, BW, FZ + 4.05]} rotY={Math.PI * 0.95} look={PEDS[3]}
            pose={{ handL: V(-0.26, 1.02, 0.3), handR: V(0.26, 1.02, 0.3), lean: 0.3 + g * 0.08, headPitch: 0.35, headYaw: Math.sin(t * 1.3) * 0.3, smile: 0.5 }} />
        </>;
      })()}

      {shot === 3 && <pointLight position={[1.2, 0.9, FZ + 1.6]} color="#ffd9a8" intensity={2.5} distance={5} decay={2} />}

      {/* ---- payoff: the gangplank is run out, and a guest strolls onto the new street ---- */}
      {shot === 6 && <>
        {[-0.34, 0.34].map((dx, i) => {
          const pos: V3 = [-1.25 + dx - aside * (i ? 1.45 : 1.05), BW, plankRear + 0.42 + aside * (i ? 0.75 : 0.05)];
          const w = walkFeet(slide * Math.PI * 3 + i * Math.PI, 0.2);
          return <Character3D key={i} frame={frame} seed={55 + i} pos={pos} rotY={Math.PI - aside * (i ? 1.25 : 0.9)} look={i ? CAST3.worker2 : CAST3.worker1}
            pose={aside < 0.05
              ? { ...w, hipY: 0.44, lean: 0.8, handL: V(-0.16, 0.2, 0.5), handR: V(0.16, 0.2, 0.5), headPitch: -0.5, smile: -0.7, browTilt: 1 }
              : { hipY: lerp(0.5, STAND_HIP - 0.01, aside), lean: lerp(0.5, 0, aside), handR: i ? V(0.3, 0.95 + 0.1 * Math.sin(t * 5), 0.4) : V(0.2, lerp(0.6, 1.36, seg(t, 12.9, 13.2)), 0.22), headYaw: -0.3, smile: 0.9, brow: 0.5 }} />;
        })}
        <Character3D frame={frame} seed={58} pos={[-1.25, lift + HOTEL.base + 0.14, FZ + 0.3 + gGo * 1.4 * (gw.t1 - gw.t0)]} rotY={0} look={GUEST}
          pose={gGo > 0 && gGo < 1
            ? { ...walkAt(t, gw.t0, gw.step, 1.4), lean: 0.05, smile: 0.9, headYaw: 0.25, swing: undefined }
            : gGo >= 1
              ? { handR: V(0.17, lerp(0.8, 1.5, tip), lerp(0.15, 0.13, tip)), headPitch: tip * 0.25, headYaw: 0.3, lean: tip * 0.1, smile: 1, brow: 0.5, footR: V(0.12, 0.07, 0.12), hipY: STAND_HIP - 0.01 - tip * 0.02 }
              : { headPitch: lerp(0.45, 0, seen), lean: lerp(0.12, 0, seen), handR: V(0.2, lerp(1.0, 0.75, seen), 0.25), handL: V(-0.22, 0.74, 0.1), smile: lerp(-0.3, 0.8, seen), brow: seen, footR: V(0.12, 0.07 + Math.max(0, Math.sin(t * 16)) * 0.04 * (1 - seen), 0.1) }} />
        <Character3D frame={frame} seed={59} pos={[-3.3, BW, FZ + 3.95]} rotY={1.9} look={CAST3.lady}
          pose={{ handL: V(-0.05 - 0.06 * Math.abs(Math.sin(t * 13)) * seen, 1.05, 0.34), handR: V(0.05 + 0.06 * Math.abs(Math.sin(t * 13)) * seen, 1.05, 0.34), smile: 1, brow: 0.6, headYaw: -0.2, hipY: STAND_HIP - 0.01 + 0.015 * Math.abs(Math.sin(t * 13)) * seen }} />
        {Array.from({ length: 10 }).map((_, i) => { const u = clamp((t - TL.plank) / 0.9); if (u <= 0 || u >= 1) return null; return <Puff key={i} p={[-1.9 + rnd(i) * 1.3, lift + HOTEL.base + 0.15 + u * 0.4, FZ + 0.2 + rnd(i * 3) * 0.6]} size={0.3 + u * 0.8} color="#e6cfae" op={(1 - u) * 0.5} />; })}
      </>}

      {/* dust shaken loose along the sill on every turn; a steady haze of it in the time-lapse */}
      {shot !== 6 && STROKES.map((s, si) => Array.from({ length: shot === 3 ? 8 : 14 }).map((_, i) => {
        const u = clamp((t - s - 0.08 - rnd(i + si) * 0.08) / 1.2); if (u <= 0 || u >= 1) return null;
        const x = shot === 3 ? -1.4 + rnd(i * 3 + si) * 2.8 : -SX + 0.6 + rnd(i * 3 + si) * (HOTEL.W - 1.2);
        return <Puff key={`${si}-${i}`} p={[x, lift - 0.05 - u * u * (lift - 0.1) * 0.8, FZ + 0.05 + u * (0.2 + rnd(i) * 0.5)]} size={(shot === 3 ? 0.12 : 0.4) + u * (shot === 3 ? 0.3 : 1.2)} color="#e6cfae" op={(1 - u) * 0.45} />;
      }))}
      {lapse && Array.from({ length: 18 }).map((_, i) => { const u = (t * 2.2 + rnd(i)) % 1; return <Puff key={`l${i}`} p={[-SX + rnd(i * 3) * HOTEL.W, lift * (1 - u), FZ + 0.3 + u * 0.8]} size={0.6 + u * 1.4} color="#e6cfae" op={(1 - u) * 0.35} />; })}
      {/* motes in the light */}
      {shot !== 3 && Array.from({ length: 30 }).map((_, i) => <Puff key={`m${i}`} p={[-12 + rnd(i) * 24 + Math.sin(t * 0.6 + i) * 0.4, 0.5 + rnd(i * 2) * 6 + Math.sin(t * 0.8 + i * 2) * 0.2, FZ + 0.5 + rnd(i * 3) * 8]} size={0.08 + rnd(i * 5) * 0.12} color="#fff2d0" op={0.45} />)}
      <group visible={false}><Sph rad={0.01} c="#000" /></group>
    </>
  );
};
