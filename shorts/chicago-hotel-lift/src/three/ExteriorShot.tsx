import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CAST3, Character3D, Look3, Pose3, STAND_HIP, toLocal } from './Character3D';
import { Cam, Puff, SkyDome, V, V3, clamp, key, key3, lerp, rnd, seg, settle } from './kit';
import { HOTEL, Hotel3D, StreetSet } from './sets';

/** Key light with a shadow frustum that follows the action, so shadows stay crisp in close-ups. */
export const Sun: React.FC<{ dir: V3; focus: V3; extent: number; color: string; intensity: number; map?: number }> = ({ dir, focus, extent, color, intensity, map = 2048 }) => {
  const light = useMemo(() => { const l = new THREE.DirectionalLight(); l.castShadow = true; return l; }, []);
  light.color.set(color); light.intensity = intensity;
  light.position.set(focus[0] + dir[0] * 80, focus[1] + dir[1] * 80, focus[2] + dir[2] * 80);
  light.target.position.set(...focus); light.target.updateMatrixWorld();
  const c = light.shadow.camera; c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  light.shadow.mapSize.set(map, map); light.shadow.bias = -0.0006; light.shadow.normalBias = 0.04; light.shadow.radius = 3;
  return <><primitive object={light} /><primitive object={light.target} /></>;
};

/** Times (s) at which the foreman signals a coordinated turn of every screw. */
export const STROKES = [0.5, 1.45, 2.5, 3.3, 4.2, 5.1];
const PULL = 0.42;
/** 0..n cumulative pull progress */
export const pulls = (t: number) => STROKES.reduce((a, s) => a + seg(t, s, s + PULL), 0);
export const liftAt = (t: number) => 0.92 + pulls(t) * 0.13;
/** bar angle: sweeps on the pull, then is re-set for the next bite */
const barAngle = (t: number, off = 0) => {
  let a = 0.2;
  for (const s0 of STROKES) {
    const s = s0 + off;
    if (t >= s - 0.18) a = lerp(0.2, 0.25, seg(t, s - 0.18, s)); // anticipation: settle the grip
    if (t >= s) a = lerp(0.25, -0.75, seg(t, s, s + PULL)); // the pull
    if (t >= s + PULL + 0.12) a = lerp(-0.75, 0.2, seg(t, s + PULL + 0.12, s + PULL + 0.45)); // re-set the bar
  }
  return a;
};
const effort = (t: number, off = 0) => STROKES.reduce((m, s) => Math.max(m, seg(t, s + off - 0.1, s + off + 0.1) * (1 - seg(t, s + off + PULL, s + off + PULL + 0.25))), 0);

const WORKERS: Look3[] = [CAST3.worker1, CAST3.worker2, CAST3.worker3];

export const ExteriorShot: React.FC<{ t: number; frame: number; shot: 'hero' | 'wide' }> = ({ t, frame, shot }) => {
  const { W, D } = HOTEL;
  const lift = liftAt(t);
  const blocks = Math.max(0, lift - 0.86);
  const jx = (i: number) => -W / 2 + 0.9 + i * ((W - 1.8) / 16);
  const fz = D / 2;
  const off = (i: number) => (rnd(i * 3.7) - 0.5) * 0.09; // human, not robotic: slightly different timing per man
  const jackAngle = (i: number) => barAngle(t, off(i));
  const jolt = STROKES.reduce((m, s) => Math.max(m, seg(t, s, s + 0.08) * (1 - seg(t, s + 0.1, s + PULL))), 0);

  const cam = shot === 'hero'
    ? { pos: key3(t, [[0, [2.9, 0.95, fz + 2.5]], [1.9, [2.2, 1.15, fz + 3.0]]]) as V3, look: key3(t, [[0, [-0.6, 1.25, fz + 0.1]], [1.9, [-0.7, 1.45, fz + 0.0]]]) as V3, fov: 50 }
    : { pos: key3(t, [[1.7, [-20.5, 1.4, fz + 36]], [3.7, [-18.5, 4.4, fz + 41]]]) as V3, look: key3(t, [[1.7, [1.2, 5.6, 0]], [3.7, [1.2, 7.4, 0]]]) as V3, fov: 50 };
  const camShake = jolt * 0.035;
  cam.pos = [cam.pos[0] + Math.sin(t * 61) * camShake, cam.pos[1] + Math.cos(t * 53) * camShake, cam.pos[2]];

  const sunDir: V3 = [-0.62, 0.36, 0.7];
  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
      <fog attach="fog" args={['#e6a888', 28, 190]} />
      <SkyDome stops={[[0, '#27437c'], [0.3, '#5d6ea6'], [0.43, '#e79a78'], [0.5, '#ffd6a0'], [0.56, '#f0a070'], [1, '#6a4a48']]} sun={{ dir: [0.55, 0.1, -0.83], color: '#ffd9a0', size: 320 }} />
      <hemisphereLight args={['#93b0ff', '#8a5a3c', 0.75]} />
      <Sun dir={sunDir} focus={shot === 'hero' ? [-1, 1, fz + 1] : [0, 6, 4]} extent={shot === 'hero' ? 11 : 30} color="#ffb070" intensity={2.7} map={shot === 'hero' ? 2048 : 4096} />
      <directionalLight position={[30, 22, -40]} color="#7fa6ff" intensity={1.1} />
      <StreetSet t={t} night={0.7} lamps={shot === 'wide'} />
      <Hotel3D lift={lift} t={t} jackAngle={jackAngle} night={0.7} shake={jolt * 0.012} />

      {/* the crew: one man on every jack bar, hands locked to the bar by IK */}
      {Array.from({ length: 9 }).map((_, k) => {
        const i = k * 2; const a = jackAngle(i); const e = effort(t, off(i));
        const pos: V3 = [jx(i) - 0.74, 0, fz + 0.36]; const rotY = Math.PI / 2;
        const pivot = V(jx(i), blocks + 0.42, fz - 0.32);
        const along = (d: number) => toLocal(pivot.clone().add(V(Math.sin(a) * d, 0, Math.cos(a) * d)), pos, rotY);
        const u = (0.25 - a) / 1.0; // 0 = reaching forward for the bar, 1 = hauled back to the chest
        const pose: Pose3 = {
          hipY: STAND_HIP - 0.17 + blocks * 0.45 - e * 0.03, hipZ: lerp(0.14, -0.1, u), hipX: 0.03,
          lean: lerp(0.62, -0.06, u), twist: lerp(-0.1, 0.3, u), side: 0,
          headPitch: lerp(-0.45, 0.05, u), headYaw: 0.5,
          handR: along(0.84), handL: along(0.64),
          footL: V(-0.17, 0.07, -0.16), footR: V(0.17, 0.07, 0.2),
          smile: e > 0.3 ? -0.9 : 0.5, open: e > 0.5 ? 0.25 : 0, mouthW: 1.2, browTilt: e, brow: -e * 0.5, eyes: 1 - e * 0.45, lookY: 0.3,
        };
        return <Character3D key={k} frame={frame} seed={k + 2} pos={pos} rotY={rotY} look={WORKERS[k % 3]} pose={pose} />;
      })}

      {/* the foreman calls each turn: arm up (anticipation) -> chop down (signal) */}
      {(() => {
        const up = STROKES.reduce((m, s) => Math.max(m, seg(t, s - 0.45, s - 0.2) * (1 - seg(t, s - 0.03, s + 0.12))), 0);
        const call = STROKES.reduce((m, s) => Math.max(m, seg(t, s - 0.05, s + 0.03) * (1 - seg(t, s + 0.2, s + 0.4))), 0);
        return <Character3D frame={frame} seed={40} pos={[-3.6, 0, fz + 2.5]} rotY={2.1} look={CAST3.pullman}
          pose={{
            lean: -0.08 * up + 0.14 * call, twist: -0.2, hipY: STAND_HIP - 0.01 - call * 0.03,
            handR: V(0.3 + call * 0.1, lerp(0.95, 1.55, up), lerp(0.42, 0.18, up)), handL: V(-0.3, 0.72, 0.12),
            headPitch: -0.12 - up * 0.1, headYaw: -0.25, open: call * 0.8, smile: 0.6, brow: up * 0.6, mouthW: 1.1,
            footL: V(-0.14, 0.07, -0.04), footR: V(0.14, 0.07, 0.1),
          }} />;
      })()}

      {/* onlookers: point, gasp, hold on to hats */}
      {(() => {
        const gasp = settle(t, 1.9, 0.5);
        const lp: V3 = [-18.2, 0, fz + 31.5], gp: V3 = [-19.9, 0, fz + 31.0];
        return <>
          <Character3D frame={frame} seed={51} pos={lp} rotY={2.55} look={CAST3.lady}
            pose={{ handR: V(0.22, 1.2 + gasp * 0.45, 0.35), handL: V(-0.12, 0.95, 0.24), headPitch: -0.35 * gasp, open: 0.6 * gasp, brow: gasp, eyes: 1 + gasp * 0.3, lean: -0.1 * gasp, lookY: 0.8 }} />
          <Character3D frame={frame} seed={52} pos={gp} rotY={2.75} look={CAST3.gent}
            pose={{ handR: V(0.16, 1.42 + gasp * 0.12, 0.12), headPitch: -0.4 * gasp, lean: -0.14 * gasp, open: 0.5 * gasp, brow: gasp, lookY: 0.8, hipY: STAND_HIP - 0.02 * gasp, footL: V(-0.12, 0.07, 0.02 - gasp * 0.12), footR: V(0.12, 0.07, 0.04) }} />
        </>;
      })()}

      {/* dust shaken loose along the sill on every turn */}
      {STROKES.map((s, si) => Array.from({ length: 16 }).map((_, i) => {
        const u = clamp((t - s - rnd(i + si) * 0.08) / 1.3); if (u <= 0 || u >= 1) return null;
        return <Puff key={`${si}-${i}`} p={[-W / 2 + 0.6 + rnd(i * 3 + si) * (W - 1.2), lift - 0.1 - u * u * (lift - 0.1) + 0.2, fz + 0.2 + u * (0.4 + rnd(i) * 0.8)]} size={0.5 + u * 1.5} color="#e6cfae" op={(1 - u) * 0.45} />;
      }))}
      {/* motes drifting in the low sun */}
      {Array.from({ length: 40 }).map((_, i) => <Puff key={`m${i}`} p={[-14 + rnd(i) * 26 + Math.sin(t * 0.6 + i) * 0.4, 0.4 + rnd(i * 2) * 5 + Math.sin(t * 0.8 + i * 2) * 0.2, fz + 0.5 + rnd(i * 3) * 14]} size={0.1 + rnd(i * 5) * 0.14} color="#ffe2b0" op={0.5} />)}
    </>
  );
};
