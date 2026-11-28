import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CAST3, Character3D, Pose3 } from './Character3D';
import { Box, Cam, Cyl, Glow, Mat, Puff, Sph, V, V3, clamp, key3, lerp, plankDraw, rnd, seg, settle, useTex } from './kit';

/** Hotel room interior. tl = seconds since the cut. The building is jolted upward at JOLT. */
const JOLT = 0.72;

export const RoomShot: React.FC<{ t: number; frame: number }> = ({ t: tl, frame }) => {
  const wallpaper = useTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7d4a4a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#8a5454'; g.fillRect(i * 64 + 6, 0, 26, h); g.fillStyle = 'rgba(240,200,140,0.5)'; g.fillRect(i * 64 + 44, 0, 3, h); }
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = 'rgba(245,210,150,0.55)'; g.beginPath(); g.arc(x * 64 + 19, y * 64 + 32 + (x % 2) * 20, 5, 0, 7); g.fill(); g.fillRect(x * 64 + 17, y * 64 + 18 + (x % 2) * 20, 4, 28); }
  }, [5, 3]);
  const floor = useTex(512, 512, plankDraw('#7a5232', 9), [1.5, 3]);
  const wood = useTex(256, 256, plankDraw('#6a4326', 5));
  const rug = useTex(256, 256, (g, w) => {
    g.fillStyle = '#7a2f33'; g.fillRect(0, 0, w, w);
    [[118, '#d9b56a'], [104, '#2f4a5a'], [84, '#c98a4a'], [60, '#7a2f33'], [36, '#e3c98a']].forEach(([r, c]) => { g.fillStyle = c as string; g.beginPath(); g.arc(w / 2, w / 2, r as number, 0, 7); g.fill(); });
    for (let i = 0; i < 16; i++) { g.fillStyle = '#2f4a5a'; g.beginPath(); g.arc(w / 2 + Math.cos(i * 0.3927) * 72, w / 2 + Math.sin(i * 0.3927) * 72, 7, 0, 7); g.fill(); }
  });
  const quilt = useTex(256, 256, (g, w) => { for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) { g.fillStyle = ['#a8443a', '#d9b56a', '#3d5878', '#e9dcc0', '#5a7a5a'][(x * 3 + y * 2 + ((x * y) % 3)) % 5]; g.fillRect(x * 43, y * 43, 42, 42); } });
  const picture = useTex(256, 192, (g, w, h) => {
    const sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#7a9cc0'); sk.addColorStop(1, '#f0d0a0'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a6a5a'; g.beginPath(); g.moveTo(0, h); g.lineTo(60, 80); g.lineTo(120, 130); g.lineTo(180, 60); g.lineTo(w, h); g.fill();
    g.fillStyle = '#3a5a7a'; g.fillRect(0, 150, w, 42);
  });
  const paper = useTex(256, 320, (g, w, h) => {
    g.fillStyle = '#eee6d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2622'; g.font = '700 30px Fredoka'; g.textAlign = 'center'; g.fillText('DAILY NEWS', w / 2, 40);
    g.fillRect(14, 52, w - 28, 3);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 26; r++) { g.fillStyle = `rgba(40,36,32,${0.35 + rnd(c * 40 + r) * 0.3})`; g.fillRect(16 + c * 80, 66 + r * 9.5, 60 + rnd(r + c) * 12, 4); }
  });
  const outside = useTex(512, 512, (g, w, h) => {
    const sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#31508c'); sk.addColorStop(0.55, '#e8a07a'); sk.addColorStop(0.8, '#ffd9a0'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,200,170,0.5)'; [[120, 120, 90], [330, 200, 120], [220, 90, 60]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.3, 0, 0, 7); g.fill(); });
  });
  const facadeTex = useTex(512, 256, (g, w, h) => {
    g.fillStyle = '#6a4a48'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, w, 2); }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { g.fillStyle = '#d8c8a8'; g.fillRect(c * 85 + 14, r * 110 + 34, 52, 78); g.fillStyle = rnd(r * 9 + c) > 0.45 ? '#ffc56a' : '#2a3442'; g.fillRect(c * 85 + 20, r * 110 + 40, 40, 66); }
    g.fillStyle = '#3a2a2a'; g.fillRect(0, 0, w, 22);
  });
  const drape = useMemo(() => new THREE.LatheGeometry([[0, 0.765], [0.5, 0.765], [0.53, 0.73], [0.55, 0.6], [0.58, 0.5], [0.57, 0.47]].map(([r, y]) => new THREE.Vector2(r, y)), 28), []);
  const cupGeo = useMemo(() => new THREE.LatheGeometry([[0.0, 0], [0.028, 0], [0.032, 0.012], [0.05, 0.05], [0.055, 0.085], [0.05, 0.085], [0.045, 0.05], [0, 0.016]].map(([r, y]) => new THREE.Vector2(r, y)), 20), []);

  // --- story beats -------------------------------------------------------
  const jolt = seg(tl, JOLT, JOLT + 0.06) * (1 - seg(tl, JOLT + 0.08, JOLT + 0.5));
  const swing = tl > JOLT ? Math.exp(-(tl - JOLT) * 1.6) * Math.sin((tl - JOLT) * 9) : 0; // hanging lamp keeps swinging
  const raise = seg(tl, 0.02, 0.5);
  const startle = seg(tl, JOLT, JOLT + 0.12) * (1 - seg(tl, 1.2, 1.5));
  const glance = seg(tl, JOLT + 0.1, JOLT + 0.32) * (1 - seg(tl, 1.2, 1.5));
  const cheers = settle(tl, 1.45, 0.5);
  const sip = seg(tl, 0.42, 0.6) * (1 - seg(tl, JOLT - 0.02, JOLT + 0.08));
  const drop = jolt * 0.03; // everything loose lags the floor for a moment

  const gp: V3 = [-0.2, 0, -0.55]; const gRot = 0.72;
  const toWorld = (l: THREE.Vector3) => l.clone().applyAxisAngle(V(0, 1, 0), gRot).add(V(...gp));
  // cup path in the guest's local space: saucer -> lips -> lowered in surprise -> raised in a toast
  const cupL = V(
    lerp(lerp(0.2, 0.07, raise), 0.24, Math.max(startle * 0.6, cheers)),
    lerp(lerp(0.8, 1.05, raise) - startle * 0.14, 1.16, cheers) - Math.sin(clamp(tl / 0.12) * Math.PI) * 0.015,
    lerp(lerp(0.52, 0.3, raise) + startle * 0.08, 0.5, cheers),
  );
  const cupW = toWorld(cupL);
  const cupTilt = sip * 0.55 - startle * 0.25;
  const pose: Pose3 = {
    hipY: 0.5 + jolt * 0.03, hipZ: -0.02, lean: 0.06 + sip * 0.1 - startle * 0.12, twist: -glance * 0.25 + cheers * 0.05, side: cheers * 0.04,
    headPitch: sip * 0.16 - startle * 0.12, headYaw: -glance * 1.0 + cheers * -0.1, headRoll: cheers * 0.12,
    handR: cupL.clone().add(V(0.07, 0.035, -0.02)), handL: V(-0.2, 0.83 + startle * 0.06, 0.42),
    footL: V(-0.13, 0.07, 0.3), footR: V(0.13, 0.07, 0.36 - startle * 0.1),
    eyes: 1 + startle * 0.4 - sip * 0.6, brow: startle + cheers * 0.5, lookX: -glance * 1.2, lookY: -sip * 0.6,
    smile: lerp(0.35, 0.95, cheers), open: startle * 0.35 * (1 - cheers), mouthW: 1,
  };

  const shake = jolt * 0.02;
  const cam = {
    pos: key3(tl, [[0, [2.0, 1.5, 2.3]], [2.3, [1.55, 1.38, 1.8]]]).map((v, i) => v + (i === 1 ? Math.sin(tl * 70) * shake : Math.cos(tl * 63) * shake * 0.6)) as V3,
    look: key3(tl, [[0, [-0.1, 0.92, -0.5]], [2.3, [-0.08, 0.98, -0.5]]]) as V3,
  };
  const outY = -0.35 - tl * 0.1 - seg(tl, JOLT, JOLT + 0.4) * 0.16; // the street sinks away outside

  const WX = -0.95, WZ = -2.2; // window centre on the back wall
  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={40} />
      <color attach="background" args={['#1a1210']} />
      <hemisphereLight args={['#ffd9b0', '#3a2620', 0.3]} />
      {/* cool dusk light through the window: rim on the guest, window-shaped patch on the floor */}
      <directionalLight position={[WX - 1.2, 3.6, WZ - 5]} target-position={[0.3, 0.4, 0.6]} color="#8db4ff" intensity={3.2} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0006} shadow-normalBias={0.03} />
      {/* warm practicals */}
      <pointLight position={[1.25, 1.42, -1.55]} color="#ffb060" intensity={7} distance={7} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
      <pointLight position={[0.9, 1.9, 1.6]} color="#ffc890" intensity={5} distance={8} decay={2} />

      {/* ---- shell ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5.4, 5.4]} /><Mat c="#fff" map={floor} bump={floor} bs={0.4} r={0.7} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.006, -0.2]} receiveShadow><circleGeometry args={[1.35, 40]} /><Mat c="#fff" map={rug} r={1} /></mesh>
      {/* back wall with a real window opening (so light and shadow pass through it) */}
      {([[-2.0, 1.5, 1.0, 3.0], [1.15, 1.5, 3.1, 3.0], [WX, 0.42, 1.2, 0.84], [WX, 2.75, 1.2, 0.5]] as number[][]).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, WZ]} castShadow receiveShadow><boxGeometry args={[w, h, 0.2]} /><Mat c="#fff" map={wallpaper} r={0.95} /></mesh>
      ))}
      <mesh position={[-2.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[5.4, 3]} /><Mat c="#fff" map={wallpaper} r={0.95} /></mesh>
      <mesh position={[2.6, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[5.4, 3]} /><Mat c="#fff" map={wallpaper} r={0.95} /></mesh>
      <Box size={[5.2, 0.1, 5.4]} p={[0, 3.02, 0]} c="#d9c8a8" shadow={false} />
      {/* wainscot + rails */}
      {[-2.0, 1.15].map((x, i) => <mesh key={x} position={[x, 0.45, WZ + 0.12]} receiveShadow castShadow><boxGeometry args={[i ? 3.1 : 1.0, 0.9, 0.05]} /><Mat c="#fff" map={wood} r={0.6} /></mesh>)}
      <Box size={[1.2, 0.84, 0.05]} p={[WX, 0.42, WZ + 0.12]} c="#5a3820" r={0.6} />
      <Box size={[5.2, 0.07, 0.09]} p={[0, 0.92, WZ + 0.14]} c="#4a2e1a" r={0.5} />
      <Box size={[5.2, 0.14, 0.1]} p={[0, 2.93, WZ + 0.13]} c="#e3d4b4" />
      <mesh position={[-2.47, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[5.4, 0.9]} /><Mat c="#fff" map={wood} r={0.6} /></mesh>
      {/* window: frame, sash bars, sill, glass */}
      <group position={[WX, 1.67, WZ]}>
        {[-1, 1].map((s) => <Box key={s} size={[0.1, 1.76, 0.28]} p={[s * 0.6, 0, 0]} c="#eadfc8" r={0.6} />)}
        <Box size={[1.3, 0.1, 0.28]} p={[0, 0.86, 0]} c="#eadfc8" r={0.6} />
        <Box size={[1.46, 0.07, 0.42]} p={[0, -0.85, 0.08]} c="#eadfc8" r={0.6} />
        <Box size={[0.05, 1.66, 0.05]} c="#eadfc8" /><Box size={[1.14, 0.05, 0.05]} p={[0, 0.1, 0]} c="#eadfc8" />
        <Box size={[1.14, 1.66, 0.01]} p={[0, 0, -0.03]} c="#bcd4ff" op={0.12} r={0.05} shadow={false} recv={false} />
        {/* curtains with folds; they sway after the jolt */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.78, 1.0, 0.2]} rotation={[0, 0, s * swing * 0.05]}>
            {Array.from({ length: 5 }).map((_, i) => <Cyl key={i} rt={0.05} rb={0.075 + (i % 2) * 0.01} h={2.1} p={[s * i * 0.085 - s * 0.1, -1.05, (i % 2) * 0.05]} c={i % 2 ? '#8e2f33' : '#7a262b'} r={0.95} seg={8} />)}
            <Box size={[0.5, 0.06, 0.16]} p={[0, -1.2, 0.04]} c="#d9b56a" m={0.4} r={0.5} />
          </group>
        ))}
        <Box size={[2.2, 0.26, 0.26]} p={[0, 1.08, 0.2]} c="#6a2126" r={0.9} />
        <Cyl rt={0.025} h={2.3} p={[0, 0.98, 0.2]} rot={[0, 0, Math.PI / 2]} c="#d9b56a" m={0.8} r={0.3} />
      </group>
      {/* the world outside, sinking as the hotel rises */}
      <mesh position={[WX, 2.2, WZ - 14]}><planeGeometry args={[30, 16]} /><meshBasicMaterial map={outside} /></mesh>
      <group position={[0, outY, 0]}>
        <mesh position={[WX + 1, 0.2, WZ - 9]}><planeGeometry args={[14, 5]} /><meshBasicMaterial map={facadeTex} color="#d8b0a0" /></mesh>
        <Box size={[14.4, 0.3, 0.5]} p={[WX + 1, 2.8, WZ - 8.8]} c="#4a3030" shadow={false} />
        <Box size={[0.8, 1.4, 0.8]} p={[WX - 1.2, 3.4, WZ - 9.4]} c="#5a3a34" shadow={false} />
        <group position={[WX + 0.36, 0.95, WZ - 2.4]}>
          <Cyl rt={0.03} h={1.6} p={[0, -0.8, 0]} c="#16181c" shadow={false} />
          <Cyl rt={0.13} rb={0.085} h={0.28} p={[0, 0.15, 0]} c="#ffd98a" e="#ffb347" ei={2.4} seg={4} shadow={false} />
          <Cyl rt={0.01} rb={0.17} h={0.13} p={[0, 0.36, 0]} c="#16181c" seg={4} shadow={false} />
          <Glow p={[0, 0.15, 0.1]} size={1.3} color="#ffb04a" op={0.8} />
        </group>
      </group>

      {/* ---- furniture ---- */}
      {/* bed in the far right corner */}
      <group position={[1.75, 0, -1.15]}>
        <Box size={[1.5, 0.3, 2.0]} p={[0, 0.3, 0]} c="#5a3a22" r={0.6} />
        <Box size={[1.4, 0.2, 1.9]} p={[0, 0.55, 0]} c="#e9e2d2" r={1} />
        <mesh position={[0, 0.67, 0.3]} castShadow receiveShadow><boxGeometry args={[1.46, 0.08, 1.35]} /><Mat c="#fff" map={quilt} r={1} /></mesh>
        <Sph rad={0.3} s={[1.6, 0.4, 0.9]} p={[0, 0.74, -0.68]} c="#f4efe4" r={1} />
        <Box size={[1.56, 1.3, 0.1]} p={[0, 0.75, -1.02]} c="#4a2e1a" r={0.5} />
        {[-1, 1].map((s) => <group key={s}><Cyl rt={0.05} h={1.5} p={[s * 0.76, 0.75, -1.02]} c="#3a2212" /><Sph rad={0.075} p={[s * 0.76, 1.55, -1.02]} c="#d9b56a" m={0.8} r={0.3} /></group>)}
        <Box size={[1.56, 0.6, 0.08]} p={[0, 0.5, 1.0]} c="#4a2e1a" r={0.5} />
      </group>
      {/* nightstand + oil lamp (the warm key light) */}
      <group position={[1.25, 0, -1.85]} >
        <Box size={[0.5, 0.86, 0.42]} p={[-0.6, 0.43, 0]} c="#5a3820" r={0.55} />
        <Sph rad={0.02} p={[-0.6, 0.6, 0.22]} c="#d9b56a" m={0.8} />
        <group position={[-0.6, 0.86, 0]}>
          <Cyl rt={0.05} rb={0.1} h={0.1} p={[0, 0.05, 0]} c="#b8923e" m={0.8} r={0.3} />
          <Sph rad={0.09} p={[0, 0.17, 0]} c="#b8923e" m={0.8} r={0.3} />
          <Cyl rt={0.05} rb={0.085} h={0.3} p={[0, 0.42, 0]} c="#ffe2a8" e="#ffb04a" ei={2.6} op={0.9} shadow={false} />
          <Glow p={[0, 0.42, 0.05]} size={1.5} color="#ffb04a" op={0.8} />
        </group>
      </group>
      {/* picture, coat stand, trunk */}
      <group position={[0.75, 1.95, WZ + 0.13]}>
        <Box size={[0.9, 0.7, 0.05]} c="#b8923e" m={0.6} r={0.4} />
        <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.76, 0.56]} /><Mat c="#fff" map={picture} r={0.8} /></mesh>
      </group>
      <group position={[-2.1, 0, -1.7]}>
        <Cyl rt={0.03} h={1.9} p={[0, 0.95, 0]} c="#3a2212" /><Cyl rt={0.22} rb={0.26} h={0.05} p={[0, 0.03, 0]} c="#3a2212" />
        {[0, 1, 2, 3].map((k) => <Cyl key={k} rt={0.015} h={0.26} p={[Math.cos(k * 1.57) * 0.1, 1.82, Math.sin(k * 1.57) * 0.1]} rot={[Math.sin(k * 1.57) * 0.9, 0, -Math.cos(k * 1.57) * 0.9]} c="#3a2212" />)}
        <group position={[0.02, 1.9, 0.02]} rotation={[0, 0, swing * 0.06]}><Cyl rt={0.25} h={0.02} c="#1c1a20" /><Cyl rt={0.15} rb={0.14} h={0.26} p={[0, 0.13, 0]} c="#25222a" r={0.5} /></group>
      </group>
      <group position={[-1.75, 0, 0.2]} rotation={[0, 0.3, 0]}>
        <Box size={[0.9, 0.46, 0.5]} p={[0, 0.23, 0]} c="#6a4326" r={0.7} /><Cyl rt={0.25} h={0.9} p={[0, 0.46, 0]} rot={[0, 0, Math.PI / 2]} s={[1, 1, 1]} c="#5a3820" arc={Math.PI} r={0.7} />
        {[-0.3, 0.3].map((x) => <Box key={x} size={[0.06, 0.5, 0.52]} p={[x, 0.25, 0]} c="#b8923e" m={0.7} r={0.4} />)}
      </group>
      {/* hanging lamp: swings after the jolt (secondary motion that proves the room moved) */}
      <group position={[0.55, 3.0, 0.25]} rotation={[0, 0, swing * 0.22]}>
        <Cyl rt={0.008} h={0.8} p={[0, -0.4, 0]} c="#2a2a2e" shadow={false} />
        <Cyl rt={0.07} rb={0.2} h={0.16} p={[0, -0.86, 0]} c="#2f5a48" r={0.5} shadow={false} />
        <Sph rad={0.06} p={[0, -0.96, 0]} c="#ffe2a8" e="#ffb04a" ei={3} shadow={false} />
        <Glow p={[0, -0.96, 0]} size={1.2} color="#ffb04a" op={0.7} />
      </group>
      {/* chair */}
      <group position={gp} rotation={[0, gRot, 0]}>
        <Box size={[0.48, 0.05, 0.46]} p={[0, 0.39, -0.02]} c="#5a3820" r={0.5} />
        <Sph rad={0.22} s={[1, 0.25, 1]} p={[0, 0.43, -0.02]} c="#2f5a48" r={1} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => <Cyl key={i} rt={0.025} h={z < 0 ? 1.05 : 0.39} p={[x * 0.21, z < 0 ? 0.525 : 0.195, z * 0.2 - 0.02]} c="#4a2e1a" />)}
        {[0.7, 0.86, 1.02].map((y) => <Box key={y} size={[0.42, 0.08, 0.03]} p={[0, y, -0.22]} c="#5a3820" />)}
      </group>
      {/* tea table: everything on it hops with the jolt */}
      <group position={[0.24, 0, -0.08]}>
        <Cyl rt={0.05} rb={0.07} h={0.72} p={[0, 0.36, 0]} c="#3a2212" /><Cyl rt={0.3} rb={0.34} h={0.05} p={[0, 0.03, 0]} c="#3a2212" />
        <mesh geometry={drape} scale={[0.82, 1, 0.82]} castShadow receiveShadow><Mat c="#f1ead8" r={1} side={THREE.DoubleSide} /></mesh>
        <group position={[0, 0.775 + drop * 1.2, 0]}>
          {/* teapot */}
          <group position={[-0.16, 0, -0.14]} rotation={[0, 0.6, jolt * 0.08]}>
            <Sph rad={0.1} s={[1, 0.85, 1]} p={[0, 0.085, 0]} c="#e8ecf0" r={0.25} />
            <Cyl rt={0.02} rb={0.035} h={0.14} p={[0.13, 0.11, 0]} rot={[0, 0, -0.9]} c="#e8ecf0" r={0.25} />
            <mesh position={[-0.11, 0.09, 0]}><torusGeometry args={[0.05, 0.012, 6, 14]} /><Mat c="#e8ecf0" r={0.25} /></mesh>
            <Sph rad={0.045} s={[1, 0.4, 1]} p={[0, 0.17, 0]} c="#3d5878" r={0.3} /><Sph rad={0.016} p={[0, 0.2, 0]} c="#d9b56a" m={0.8} />
            <Cyl rt={0.101} h={0.02} p={[0, 0.1, 0]} c="#3d5878" r={0.3} />
            {[0, 1, 2].map((k) => { const ph = (tl * 0.5 + k / 3) % 1; return <Puff key={k} p={[0.19 + Math.sin(ph * 6) * 0.03, 0.2 + ph * 0.5, 0]} size={0.12 + ph * 0.3} color="#ffffff" op={(1 - ph) * 0.3} />; })}
          </group>
          {/* saucer, biscuits, folded newspaper, bud vase */}
          <Cyl rt={0.085} rb={0.05} h={0.014} p={[0.16, 0.007, 0.2]} c="#e8ecf0" r={0.25} />
          <Cyl rt={0.11} rb={0.07} h={0.014} p={[0.2, 0.007, -0.2]} c="#e8ecf0" r={0.25} />
          {[0, 1, 2].map((k) => <Cyl key={k} rt={0.035} h={0.014} p={[0.18 + k * 0.03, 0.022 + k * 0.014, -0.2 + (k % 2) * 0.03]} c="#c98a4a" r={0.9} />)}
          <mesh position={[-0.22, 0.008, 0.2]} rotation={[-Math.PI / 2, 0, 0.5]} receiveShadow><planeGeometry args={[0.3, 0.38]} /><Mat c="#fff" map={paper} r={1} /></mesh>
          <Cyl rt={0.02} rb={0.035} h={0.13} p={[-0.02, 0.065, -0.3]} c="#3d7a8a" r={0.2} op={0.85} />
          <Cyl rt={0.004} h={0.16} p={[-0.02, 0.2, -0.3]} c="#3a6a3a" /><Sph rad={0.03} p={[-0.02, 0.29, -0.3]} c="#e86a7a" r={0.8} />
        </group>
      </group>
      {/* the cup travels with the hand */}
      <group position={cupW} rotation={[0, gRot, 0]}>
        <group rotation={[-cupTilt, 0, 0]}>
          <mesh geometry={cupGeo} castShadow><Mat c="#f2f4f6" r={0.2} side={THREE.DoubleSide} /></mesh>
          <Cyl rt={0.045} h={0.004} p={[0, 0.07, 0]} c="#8a4a22" r={0.15} shadow={false} />
          <mesh position={[0.06, 0.045, 0]}><torusGeometry args={[0.022, 0.007, 6, 12]} /><Mat c="#f2f4f6" r={0.2} /></mesh>
          <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.052, 0.004, 4, 20]} /><Mat c="#3d5878" r={0.3} /></mesh>
        </group>
        {[0, 1, 2].map((k) => { const ph = (tl * 0.7 + k / 3) % 1; return <Puff key={k} p={[Math.sin(ph * 7 + k) * 0.02, 0.1 + ph * 0.3, 0]} size={0.07 + ph * 0.18} color="#ffffff" op={(1 - ph) * 0.35} />; })}
        {/* a splash jumps out of the cup on the jolt */}
        {jolt > 0.02 && [0, 1, 2].map((k) => <Sph key={k} rad={0.008} p={[(k - 1) * 0.02, 0.09 + jolt * 0.06, 0.01 * k]} c="#8a4a22" shadow={false} />)}
      </group>

      <Character3D frame={frame} seed={3} pos={[gp[0], gp[1] + drop, gp[2]]} rotY={gRot} look={CAST3.guest} pose={pose} />
      {/* dust shaken from the ceiling */}
      {Array.from({ length: 14 }).map((_, i) => { const u = clamp((tl - JOLT - rnd(i) * 0.1) / 1.4); if (u <= 0 || u >= 1) return null; return <Puff key={i} p={[-1 + rnd(i * 3) * 2.4, 2.9 - u * 1.6, -1.2 + rnd(i * 5) * 1.8]} size={0.06 + u * 0.12} color="#f0e0c0" op={(1 - u) * 0.5} />; })}
    </>
  );
};
