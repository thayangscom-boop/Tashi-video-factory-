import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Bone, Box, Cyl, Mat, Sph, V, V3, clamp, ik2, rnd, tint } from './kit';

export type Hat3 = 'top' | 'bowler' | 'cap' | 'night' | 'bonnet' | 'none';
export type Look3 = {
  skin: string; coat: string; pants: string; shoes?: string; hair: string; sleeves?: string;
  hat?: Hat3; hatColor?: string; vest?: string; scarf?: string; apron?: string;
  mustache?: boolean; beard?: boolean; glasses?: boolean; dress?: boolean; suspenders?: string; rolled?: boolean; belt?: string; lapel?: string;
  build?: number; // torso width factor
};

/** All targets are in character space: +Z is the way the character faces, origin between the feet. */
export type Pose3 = {
  hipY?: number; hipX?: number; hipZ?: number;
  lean?: number; twist?: number; side?: number; // torso rotation (rad): forward, yaw, sideways
  headYaw?: number; headPitch?: number; headRoll?: number;
  handL?: THREE.Vector3; handR?: THREE.Vector3; // IK targets; omitted = relaxed at the side
  swing?: number; // relaxed arm swing (-1..1), used when a hand target is omitted
  footL?: THREE.Vector3; footR?: THREE.Vector3; // ankle targets
  eyes?: number; brow?: number; browTilt?: number; lookX?: number; lookY?: number;
  smile?: number; open?: number; mouthW?: number;
  propR?: React.ReactNode; propL?: React.ReactNode; // rendered at the hand
};

const UPPER_LEG = 0.31, LOWER_LEG = 0.3, UPPER_ARM = 0.27, FORE_ARM = 0.25;
export const STAND_HIP = 0.66;

/** Walk cycle helper: returns foot targets + hip bob for a phase (radians). Stride is half step length. */
export const walkFeet = (phase: number, stride = 0.24, lift = 0.11) => {
  const foot = (ph: number, x: number) => {
    const p = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (p < Math.PI) return V(x, 0.07, stride * (1 - (2 * p) / Math.PI)); // stance: slides back
    const u = (p - Math.PI) / Math.PI; const e = u * u * (3 - 2 * u);
    return V(x, 0.07 + Math.sin(u * Math.PI) * lift, stride * (-1 + 2 * e)); // swing: lifts forward
  };
  return {
    footL: foot(phase, -0.1), footR: foot(phase + Math.PI, 0.1),
    hipY: STAND_HIP - 0.035 - Math.abs(Math.cos(phase)) * 0.03,
    swing: Math.sin(phase), speedPerRad: (2 * stride) / Math.PI,
  };
};

const Hat: React.FC<{ kind: Hat3; c: string; sway?: number }> = ({ kind, c, sway = 0 }) => {
  const d = tint(c, 0.7);
  switch (kind) {
    case 'top': return (
      <group position={[0, 0.34, -0.01]} rotation={[-0.08, 0, 0.04]}>
        <Cyl rt={0.27} h={0.022} p={[0, 0.02, 0]} c={d} r={0.5} seg={28} />
        <Cyl rt={0.172} rb={0.158} h={0.3} p={[0, 0.17, 0]} c={c} r={0.45} seg={28} />
        <Cyl rt={0.163} h={0.05} p={[0, 0.06, 0]} c="#7a2a22" r={0.6} seg={28} />
      </group>);
    case 'bowler': return (
      <group position={[0, 0.33, -0.01]} rotation={[-0.1, 0, 0]}>
        <Cyl rt={0.26} h={0.02} p={[0, 0.02, 0]} c={d} r={0.5} seg={28} />
        <mesh position={[0, 0.03, 0]} castShadow><sphereGeometry args={[0.185, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat c={c} r={0.5} /></mesh>
        <Cyl rt={0.188} h={0.035} p={[0, 0.045, 0]} c="#1b1b1f" r={0.6} seg={28} />
      </group>);
    case 'cap': return (
      <group position={[0, 0.335, 0]} rotation={[-0.12, 0, 0]}>
        <Sph rad={0.215} s={[1.02, 0.42, 1.1]} p={[0, 0.03, 0.01]} c={c} r={0.9} />
        <Cyl rt={0.13} h={0.02} s={[1, 1, 0.75]} p={[0, 0.0, 0.2]} rot={[0.25, 0, 0]} c={d} r={0.8} />
        <Sph rad={0.02} p={[0, 0.12, 0.01]} c={d} />
      </group>);
    case 'night': return (
      <group position={[0, 0.355, -0.03]} rotation={[-0.28, 0, 0]}>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.165, 0.03, 10, 24]} /><Mat c="#f4f1ea" r={1} /></mesh>
        <group rotation={[Math.PI / 2, 0, 0]} />
        <Cyl rt={0.1} rb={0.165} h={0.16} p={[0, 0.1, 0]} c={c} r={1} />
        <group position={[0, 0.18, 0]} rotation={[0, 0, -0.7 + sway * 0.15]}>
          <Cyl rt={0.05} rb={0.11} h={0.2} p={[0, 0.09, 0]} c={c} r={1} />
          <group position={[0, 0.18, 0]} rotation={[0, 0, -0.9 + sway * 0.25]}>
            <Cyl rt={0.02} rb={0.05} h={0.2} p={[0, 0.09, 0]} c={c} r={1} />
            <Sph rad={0.05} p={[0, 0.2, 0]} c="#ffffff" r={1} />
          </group>
        </group>
      </group>);
    case 'bonnet': return (
      <group position={[0, 0.2, -0.03]}>
        <mesh rotation={[0.25, 0, 0]} castShadow><sphereGeometry args={[0.235, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><Mat c={c} r={0.9} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.02, 0.05]} rotation={[Math.PI / 2 - 0.2, 0, 0]} castShadow><torusGeometry args={[0.225, 0.03, 8, 24, Math.PI]} /><Mat c={tint(c, 1.1)} r={0.9} /></mesh>
        <Sph rad={0.035} p={[0.13, -0.2, 0.1]} c="#c85a6a" />
      </group>);
    default: return null;
  }
};

export const Character3D: React.FC<{
  pos: V3; rotY?: number; scale?: number; look: Look3; pose?: Pose3; seed?: number; frame?: number;
}> = ({ pos, rotY = 0, scale = 1, look, pose = {}, seed = 0, frame = 0 }) => {
  const {
    hipY = STAND_HIP, hipX = 0, hipZ = 0, lean = 0, twist = 0, side = 0,
    headYaw = 0, headPitch = 0, headRoll = 0, swing = 0,
    eyes = 1, brow = 0, browTilt = 0, lookX = 0, lookY = 0, smile = 0.4, open = 0, mouthW = 1,
  } = pose;
  const w = look.build ?? 1;
  const sleeve = look.sleeves ?? look.coat;
  const shoes = look.shoes ?? '#2a1f1a';
  const skinD = tint(look.skin, 0.86);

  // skeleton in character space
  const hips = V(hipX, hipY, hipZ);
  const qT = new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, twist, side, 'YXZ'));
  const tp = (x: number, y: number, z: number) => V(x, y, z).applyQuaternion(qT).add(hips);
  const shL = tp(-0.2 * w, 0.46, 0), shR = tp(0.2 * w, 0.46, 0);
  const neck = tp(0, 0.52, 0.0);
  const qH = qT.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(headPitch, headYaw, headRoll, 'YXZ')));
  const hpL = tp(-0.1, -0.03, 0), hpR = tp(0.1, -0.03, 0);
  const fL = pose.footL ?? V(-0.11, 0.07, 0), fR = pose.footR ?? V(0.11, 0.07, 0);
  const kneePole = V(0, 0.1, 1);
  const legL = ik2(hpL, fL, UPPER_LEG, LOWER_LEG, kneePole.clone().add(V(-0.12, 0, 0)));
  const legR = ik2(hpR, fR, UPPER_LEG, LOWER_LEG, kneePole.clone().add(V(0.12, 0, 0)));
  const rest = (s: number, sh: THREE.Vector3) => sh.clone().add(V(s * 0.07, -0.47, 0.05 + s * -swing * 0.2).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, twist, 0))));
  const hL = pose.handL ?? rest(-1, shL), hR = pose.handR ?? rest(1, shR);
  const armL = ik2(shL, hL, UPPER_ARM, FORE_ARM, V(-0.6, -0.5, -1).applyQuaternion(qT));
  const armR = ik2(shR, hR, UPPER_ARM, FORE_ARM, V(0.6, -0.5, -1).applyQuaternion(qT));
  const foreDir = (a: { mid: THREE.Vector3; end: THREE.Vector3 }) => new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), a.end.clone().sub(a.mid).normalize());

  const coatGeo = useMemo(() => {
    const pts = look.dress
      ? [[0.4, -0.6], [0.4, -0.56], [0.34, -0.36], [0.25, -0.1], [0.17, 0.12], [0.185, 0.34], [0.17, 0.45], [0.085, 0.53], [0, 0.54]]
      : [[0.0, -0.2], [0.21, -0.19], [0.225, -0.14], [0.2, 0.02], [0.172, 0.18], [0.195, 0.35], [0.178, 0.455], [0.085, 0.53], [0, 0.54]];
    return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  }, [look.dress]);

  const cyc = (frame + Math.floor(rnd(seed) * 90) + 40) % 105;
  const eyeOpen = Math.min(eyes, cyc < 3 ? 0.08 : 1.4);
  const foot = (a: THREE.Vector3, k: THREE.Vector3) => {
    const pitch = clamp((a.y - 0.07) * 3, 0, 0.7);
    return (
      <group position={[a.x, a.y - 0.03, a.z]} rotation={[pitch, 0, 0]}>
        <Sph rad={0.1} s={[0.82, 0.55, 1.5]} p={[0, 0.0, 0.055]} c={shoes} r={0.45} />
        <Box size={[0.15, 0.025, 0.27]} p={[0, -0.04, 0.05]} c={tint(shoes, 0.6)} />
        <group visible={false}><Sph rad={0.01} p={[k.x, 0, 0]} c="#000" /></group>
      </group>
    );
  };
  const hand = (a: { mid: THREE.Vector3; end: THREE.Vector3 }, s: number, prop?: React.ReactNode) => (
    <group position={a.end} quaternion={foreDir(a)}>
      {!look.rolled && <Cyl rt={0.054} rb={0.052} h={0.05} p={[0, 0.03, 0]} c={tint(sleeve, 1.15)} />}
      <Sph rad={0.058} s={[1, 1.15, 0.8]} p={[0, -0.035, 0]} c={look.skin} r={0.6} />
      <Sph rad={0.024} p={[s * -0.045, -0.03, 0.025]} c={look.skin} r={0.6} />
      {prop}
    </group>
  );

  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={scale}>
      {/* legs */}
      {!look.dress && <>
        <Bone a={hpL} b={legL.mid} ra={0.09} rb={0.075} c={look.pants} />
        <Bone a={legL.mid} b={legL.end} ra={0.075} rb={0.06} c={look.pants} />
        <Bone a={hpR} b={legR.mid} ra={0.09} rb={0.075} c={look.pants} />
        <Bone a={legR.mid} b={legR.end} ra={0.075} rb={0.06} c={look.pants} />
      </>}
      {foot(legL.end, legL.mid)}{foot(legR.end, legR.mid)}
      {/* torso */}
      <group position={hips} quaternion={qT}>
        <mesh geometry={coatGeo} scale={[w, 1, 0.74]} castShadow receiveShadow><Mat c={look.coat} r={0.85} side={THREE.DoubleSide} /></mesh>
        {!look.dress && <Sph rad={0.19} s={[1, 0.6, 0.72]} p={[0, -0.06, 0]} c={look.pants} />}
        {look.vest && <Box size={[0.13, 0.36, 0.02]} p={[0, 0.25, 0.128]} rot={[0.09, 0, 0]} c={look.vest} r={0.7} shadow={false} />}
        {(look.lapel || look.vest) && [-1, 1].map((sd) => <Box key={sd} size={[0.075, 0.34, 0.025]} p={[sd * 0.085, 0.3, 0.128]} rot={[0.1, sd * 0.35, sd * 0.2]} c={look.lapel ?? tint(look.coat, 0.8)} r={0.8} shadow={false} />)}
        {look.belt && <Cyl rt={0.212 * w} h={0.045} s={[1, 1, 0.76]} p={[0, -0.02, 0]} c={look.belt} r={0.6} seg={24} />}
        {look.apron && <Box size={[0.3, 0.5, 0.02]} p={[0, 0.02, 0.155]} rot={[-0.06, 0, 0]} c={look.apron} r={1} />}
        {look.suspenders && [-1, 1].map((s) => <Box key={s} size={[0.035, 0.42, 0.02]} p={[s * 0.09, 0.26, 0.135]} rot={[0.1, 0, s * -0.08]} c={look.suspenders!} />)}
        {!look.apron && !look.suspenders && [0.08, 0.2, 0.32].map((y) => <Sph key={y} rad={0.016} p={[0.012, y, 0.142 - (y - 0.2) * (y - 0.2) * 0.3]} c={tint(look.coat, 0.55)} m={0.3} r={0.4} shadow={false} />)}
        {/* collar / lapels */}
        <mesh position={[0, 0.5, 0.01]} rotation={[Math.PI / 2 - 0.25, 0, 0]} castShadow><torusGeometry args={[0.085, 0.028, 8, 20]} /><Mat c={look.scarf ?? '#efe9dc'} r={0.9} /></mesh>
      </group>
      {/* arms */}
      <Bone a={shL} b={armL.mid} ra={0.07} rb={0.058} c={sleeve} />
      <Bone a={armL.mid} b={armL.end} ra={0.058} rb={0.048} c={look.rolled ? look.skin : sleeve} />
      <Bone a={shR} b={armR.mid} ra={0.07} rb={0.058} c={sleeve} />
      <Bone a={armR.mid} b={armR.end} ra={0.058} rb={0.048} c={look.rolled ? look.skin : sleeve} />
      {hand(armL, -1, pose.propL)}{hand(armR, 1, pose.propR)}
      {/* head */}
      <group position={neck} quaternion={qH}>
        <Cyl rt={0.06} rb={0.065} h={0.1} p={[0, 0.02, 0]} c={skinD} />
        <Sph rad={0.205} s={[1, 1.06, 0.97]} p={[0, 0.22, 0]} c={look.skin} r={0.62} seg={32} />
        <Sph rad={0.17} s={[1.08, 0.8, 0.95]} p={[0, 0.13, 0.02]} c={look.skin} r={0.62} seg={28} />
        {[-1, 1].map((s) => <Sph key={s} rad={0.045} s={[0.5, 1, 0.8]} p={[s * 0.2, 0.19, -0.01]} c={skinD} r={0.6} />)}
        {/* hair */}
        {look.hair !== 'none' && <mesh position={[0, 0.225, -0.012]} rotation={[-0.42, 0, 0]} scale={[1.04, 1.1, 1.03]} castShadow><sphereGeometry args={[0.213, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} /><Mat c={look.hair} r={0.95} /></mesh>}
        {look.dress && <Sph rad={0.12} s={[1.7, 1.3, 0.8]} p={[0, 0.12, -0.12]} c={look.hair} r={0.95} />}
        {/* face */}
        <Sph rad={0.036} s={[1, 0.9, 1]} p={[0, 0.165, 0.2]} c={tint(look.skin, 0.93)} r={0.5} shadow={false} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.078, 0.235, 0.168]} rotation={[0, s * 0.18, 0]}>
            <Sph rad={0.042} s={[1, clamp(eyeOpen, 0.08, 1.4), 0.55]} c="#fbfaf6" r={0.25} shadow={false} />
            {eyeOpen > 0.3 && <Sph rad={0.021} p={[lookX * 0.016, lookY * 0.014, 0.019]} s={[1, 1, 0.5]} c="#1c1820" r={0.2} shadow={false} />}
            {eyeOpen > 0.3 && <Sph rad={0.007} p={[lookX * 0.016 + 0.008, lookY * 0.014 + 0.009, 0.03]} c="#ffffff" e="#ffffff" shadow={false} />}
            <Box size={[0.075, 0.017, 0.02]} p={[0, 0.062 + brow * 0.022, 0.012]} rot={[0, 0, s * (-browTilt * 0.5 + 0.06)]} c={look.hair === 'none' ? '#6b5a4a' : look.hair} shadow={false} />
          </group>
        ))}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.125, 0.14, 0.158]} rotation={[0, s * 0.6, 0]}><circleGeometry args={[0.034, 16]} /><meshBasicMaterial color="#ff7d7d" transparent opacity={0.22} depthWrite={false} /></mesh>)}
        {open > 0.06
          ? <group position={[0, 0.088, 0.186]}>
            <Sph rad={0.05} s={[0.9 * mouthW, 0.2 + open * 0.9, 0.3]} c="#4a1518" r={0.5} shadow={false} />
            <Sph rad={0.03} s={[0.9 * mouthW, 0.3 + open * 0.4, 0.3]} p={[0, -0.022 * open, 0.008]} c="#d86a74" r={0.5} shadow={false} />
          </group>
          : <mesh position={[0, 0.092 + (smile >= 0 ? 0.03 : -0.045) * Math.min(1, Math.abs(smile) + 0.3), 0.192]} rotation={[0, 0, (smile >= 0 ? -1 : 1) * Math.PI / 2 - Math.PI * 0.32]} scale={[1, Math.min(1, Math.abs(smile) + 0.25), 0.6]}>
            <torusGeometry args={[0.048 * mouthW, 0.0085, 6, 18, Math.PI * 0.64]} /><Mat c="#4a1a1c" r={0.6} />
          </mesh>}
        {look.mustache && [-1, 1].map((s) => <Sph key={s} rad={0.03} s={[1.9, 0.55, 0.5]} p={[s * 0.045, 0.126, 0.192]} rot={[0, s * 0.3, s * -0.3]} c={look.hair} r={1} shadow={false} />)}
        {look.beard && <mesh position={[0, 0.135, 0.022]} castShadow><sphereGeometry args={[0.19, 24, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} /><Mat c={look.hair} r={1} /></mesh>}
        {look.glasses && [-1, 1].map((s) => <mesh key={s} position={[s * 0.078, 0.235, 0.195]}><torusGeometry args={[0.05, 0.006, 6, 20]} /><Mat c="#3a3028" m={0.6} r={0.3} /></mesh>)}
        <Hat kind={look.hat ?? 'none'} c={look.hatColor ?? '#222'} sway={Math.sin(frame * 0.12 + seed)} />
      </group>
    </group>
  );
};

/** Convert a world point into a character's local space (for IK hand/foot targets). */
export const toLocal = (world: THREE.Vector3, pos: V3, rotY = 0, scale = 1) =>
  world.clone().sub(V(...pos)).applyAxisAngle(V(0, 1, 0), -rotY).multiplyScalar(1 / scale);

export const CAST3: Record<string, Look3> = {
  guest: { skin: '#f3cdb0', coat: '#7a4f93', pants: '#4a3a5c', hair: '#8a5a30', hat: 'night', hatColor: '#cfdcf0', shoes: '#6a3a2a', scarf: '#e8d9b8' },
  lady: { skin: '#eab892', coat: '#a83e44', pants: '#5a2a2a', hair: '#5a3622', hat: 'bonnet', hatColor: '#efd9a4', dress: true, scarf: '#f1e6d0', build: 0.9 },
  gent: { skin: '#f0c5a0', coat: '#3d5878', pants: '#2c313c', hair: '#4a3020', hat: 'top', hatColor: '#25222a', mustache: true, vest: '#a8443a' },
  pullman: { skin: '#f2caa6', coat: '#1f2c4a', pants: '#20242e', hair: '#3a2416', hat: 'bowler', hatColor: '#2a2a32', vest: '#8a6a34', scarf: '#f3ede0' },
  worker1: { skin: '#d9a47a', coat: '#b79a72', pants: '#3b4a5c', hair: '#2a1a10', hat: 'cap', hatColor: '#4f5b45', mustache: true, suspenders: '#5a3a26', sleeves: '#d6c6a4', build: 1.08, rolled: true, belt: '#3a2a1e' },
  worker2: { skin: '#a8714f', coat: '#8fa0a8', pants: '#4a3a2a', hair: '#1a1210', hat: 'cap', hatColor: '#6a4a2a', suspenders: '#3a2a20', sleeves: '#c9d0cf', build: 1.1, rolled: true, belt: '#2a2018' },
  worker3: { skin: '#f0c095', coat: '#c0a070', pants: '#2f3b2f', hair: '#a0582a', hat: 'cap', hatColor: '#34343a', beard: true, apron: '#6a5440', sleeves: '#e0d2b2', build: 1.12, rolled: true },
};
