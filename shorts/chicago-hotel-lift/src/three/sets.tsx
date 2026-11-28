import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Cyl, Glow, Mat, Puff, Sph, V3, brickDraw, dirtDraw, makeTex, plankDraw, rnd, stoneDraw, tint, useFontTex, useTex } from './kit';

export const HOTEL = { W: 20, D: 11, base: 0.9, ground: 4.0, floorH: 3.1, floors: 5, cols: 8, sideCols: 4 };
export const HOTEL_TOP = HOTEL.base + HOTEL.ground + HOTEL.floors * HOTEL.floorH;
const STONE = '#d8ccb4';

/* ------------------------------------------------------------------ */
/** Screw jack with a turning bar. Origin = ground under the jack. `blocks` = timber packing height under it. */
export const Jack: React.FC<{ p: V3; angle: number; ext: number; blocks?: number }> = ({ p, angle, ext, blocks = 0 }) => (
  <group position={p}>
    {Array.from({ length: Math.ceil(blocks / 0.16) }).map((_, i) => (
      <Box key={i} size={i % 2 ? [0.2, 0.15, 0.62] : [0.62, 0.15, 0.2]} p={[0, 0.08 + i * 0.16, 0]} c={i % 2 ? '#8a6138' : '#9c7044'} r={0.95} />
    ))}
    <group position={[0, blocks, 0]}>
      <Cyl rt={0.11} rb={0.19} h={0.34} p={[0, 0.17, 0]} c="#3f464e" m={0.7} r={0.45} seg={10} />
      <Cyl rt={0.2} h={0.04} p={[0, 0.02, 0]} c="#2b3036" m={0.7} r={0.5} seg={10} />
      <Cyl rt={0.045} h={ext + 0.2} p={[0, 0.34 + (ext + 0.2) / 2, 0]} c="#9aa3ab" m={0.85} r={0.3} seg={10} />
      <group rotation={[0, angle * 3, 0]}>
      {Array.from({ length: Math.max(1, Math.floor((ext + 0.1) / 0.045)) }).map((_, i) => (
        <mesh key={i} position={[0, 0.36 + i * 0.045, 0]} rotation={[Math.PI / 2 + 0.12, 0, 0]}><torusGeometry args={[0.046, 0.008, 4, 10]} /><Mat c="#6d767e" m={0.8} r={0.4} /></mesh>
      ))}
      </group>
      <Cyl rt={0.13} h={0.05} p={[0, 0.34 + ext + 0.2, 0]} c="#2b3036" m={0.7} r={0.5} seg={10} />
      {/* collar + turning bar */}
      <group position={[0, 0.42, 0]} rotation={[0, angle, 0]}>
        <Cyl rt={0.075} h={0.1} c="#22272c" m={0.8} r={0.4} seg={8} />
        <Cyl rt={0.022} h={1.1} p={[0, 0, 0.3]} rot={[Math.PI / 2, 0, 0]} c="#b08a5a" r={0.7} seg={8} />
        <Sph rad={0.032} p={[0, 0, 0.85]} c="#8a6a42" seg={8} />
      </group>
    </group>
  </group>
);

/** Criss-cross timber stack. */
export const Crib: React.FC<{ p: V3; h: number; w?: number }> = ({ p, h, w = 0.95 }) => (
  <group position={p}>
    {Array.from({ length: Math.max(0, Math.floor(h / 0.18)) }).map((_, i) => [-1, 1].map((s) => (
      <Box key={`${i}${s}`} size={i % 2 ? [0.2, 0.17, w] : [w, 0.17, 0.2]} p={i % 2 ? [s * 0.3, 0.09 + i * 0.18, 0] : [0, 0.09 + i * 0.18, s * 0.3]}
        c={['#9c7044', '#8a6138', '#a57a4c'][(i + (s > 0 ? 1 : 0)) % 3]} r={0.95} />
    )))}
  </group>
);

/* ------------------------------------------------------------------ */
const Window: React.FC<{ p: V3; lit: boolean; guest?: boolean; seed: number; night?: number }> = ({ p, lit, guest, seed, night = 0.6 }) => (
  <group position={p}>
    <Box size={[1.34, 2.12, 0.16]} p={[0, 0, 0.02]} c={STONE} r={0.9} />
    <Box size={[1.62, 0.2, 0.3]} p={[0, 1.16, 0.06]} c={STONE} r={0.9} />
    <Box size={[0.3, 0.3, 0.34]} p={[0, 1.2, 0.07]} c={tint(STONE, 0.92)} />
    <Box size={[1.56, 0.12, 0.34]} p={[0, -1.1, 0.1]} c={STONE} r={0.9} />
    <Box size={[1.06, 1.86, 0.05]} p={[0, 0, 0.09]} c={lit ? '#f2b45e' : '#4a5d78'} e={lit ? '#ffa23a' : '#1c2a3c'} ei={lit ? 0.35 + night * 0.5 : 0.6} r={lit ? 0.6 : 0.2} m={lit ? 0 : 0.3} shadow={false} />
    {lit && [-1, 1].map((s) => <Box key={s} size={[0.24, 1.8, 0.03]} p={[s * 0.41, 0, 0.125]} c={['#8a2f2a', '#3a5a4a', '#5a3a6a'][seed % 3]} e="#5a1a10" ei={0.4} shadow={false} />)}
    {lit && guest && <group position={[0.08, -0.5, 0.13]}>
      <Sph rad={0.17} s={[1, 1.05, 0.3]} p={[0, 0.3, 0]} c="#2a1810" shadow={false} />
      <Sph rad={0.3} s={[1.25, 0.75, 0.25]} p={[0, -0.1, 0]} c="#2a1810" shadow={false} />
    </group>}
    <Box size={[0.06, 1.86, 0.07]} p={[0, 0, 0.13]} c="#efe6d2" shadow={false} />
    <Box size={[1.06, 0.06, 0.07]} p={[0, 0.1, 0.13]} c="#efe6d2" shadow={false} />
  </group>
);

/** The hotel (original stylised design). Origin: centre of footprint at street level; `lift` raises it. */
export const Hotel3D: React.FC<{ lift: number; t: number; jackAngle?: (i: number) => number; night?: number; shake?: number; ownJacks?: boolean; doorOpen?: number; smoke?: number; underGlow?: boolean }> = ({ lift, t, jackAngle = () => 0, night = 0.6, shake = 0, ownJacks = true, doorOpen = 0, smoke = 0.22, underGlow = true }) => {
  const { W, D, base, ground, floorH, floors, cols, sideCols } = HOTEL;
  const wallH = ground + floors * floorH;
  const brickF = useTex(512, 512, brickDraw('#a4513d', '#6f4638'), [W / 3, wallH / 3]);
  const brickS = useTex(512, 512, brickDraw('#96493a', '#6a4236'), [D / 3, wallH / 3]);
  const stone = useTex(256, 256, stoneDraw(STONE), [W / 2, 1]);
  const sign = useFontTex(1024, 180, (g, w, h) => {
    g.fillStyle = '#1b2740'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b44a'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f5d98c'; g.font = '118px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('T R E M O N T   H O U S E', w / 2, h / 2 + 6);
  }, ['118px Anton']);
  const mats = useMemo(() => {
    const m = (map: THREE.Texture) => new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.6, roughness: 0.92 });
    const s = m(brickS), f = m(brickF), top = new THREE.MeshStandardMaterial({ color: '#4a3a34', roughness: 1 });
    return [s, s, top, top, f, f];
  }, [brickF, brickS]);
  const y0 = base;
  const fz = D / 2, sx = W / 2;
  const jx = (i: number) => -W / 2 + 0.9 + i * ((W - 1.8) / 16);
  const blocks = Math.max(0, lift - 0.86);
  return (
    <group>
      {/* ---- what holds it up ---- */}
      {lift > 0.05 && (
        <group>
          <Box size={[W - 1.2, Math.max(0.01, lift), D - 4]} p={[0, lift / 2, -1.2]} c="#140d09" r={1} shadow={false} />
          {Array.from({ length: 17 }).map((_, i) => i % 2 === 0
            ? (ownJacks ? <Jack key={i} p={[jx(i), 0, fz - 0.32]} angle={jackAngle(i)} ext={Math.max(0.02, lift - blocks - 0.62)} blocks={blocks} /> : null)
            : <Crib key={i} p={[jx(i), 0, fz - 0.5]} h={lift - 0.02} />)}
          {Array.from({ length: 9 }).map((_, i) => <Crib key={`s${i}`} p={[sx - 0.55, 0, fz - 1.6 - i * 1.1]} h={lift - 0.02} />)}
          {Array.from({ length: 9 }).map((_, i) => <Crib key={`t${i}`} p={[-sx + 0.55, 0, fz - 1.6 - i * 1.1]} h={lift - 0.02} />)}
          {Array.from({ length: 8 }).map((_, i) => <Crib key={`r${i}`} p={[jx(i * 2 + 1), 0, fz - 2.4]} h={lift - 0.02} />)}
          {underGlow && [-6, 0, 6].map((lx) => <group key={lx}><Glow p={[lx, lift * 0.55, fz - 1.4]} size={2.6} color="#ffb04a" op={0.5} />
            <pointLight position={[lx, lift * 0.6, fz - 1.3]} color="#ffb060" intensity={6} distance={7} decay={2} /></group>)}
        </group>
      )}
      {/* ---- the building ---- */}
      <group position={[Math.sin(t * 38) * shake, lift + Math.abs(Math.sin(t * 31)) * shake, 0]}>
        {/* needle beams under the sill */}
        {Array.from({ length: 9 }).map((_, i) => <Box key={i} size={[0.3, 0.26, D + 0.2]} p={[-W / 2 + 1.2 + i * ((W - 2.4) / 8), -0.13, 0]} c="#7a5632" r={0.95} />)}
        <Box size={[W + 0.9, 0.3, 0.36]} p={[0, -0.02, fz - 0.05]} c="#8a6238" r={0.95} />
        {/* foundation */}
        <mesh position={[0, base / 2, 0]} castShadow receiveShadow><boxGeometry args={[W + 0.3, base, D + 0.3]} /><Mat c="#ffffff" map={stone} bump={stone} bs={0.5} r={0.95} /></mesh>
        {/* brick mass */}
        <mesh position={[0, y0 + wallH / 2, 0]} castShadow receiveShadow material={mats}><boxGeometry args={[W, wallH, D]} /></mesh>
        {/* corner quoins */}
        {[-1, 1].map((s) => Array.from({ length: 16 }).map((_, i) => (
          <group key={`${s}${i}`}>
            <Box size={[i % 2 ? 0.9 : 0.6, 0.55, 0.16]} p={[s * (sx - (i % 2 ? 0.45 : 0.3)), y0 + 0.6 + i * 1.2, fz + 0.04]} c={STONE} r={0.9} />
            <Box size={[0.16, 0.55, i % 2 ? 0.6 : 0.9]} p={[s * (sx + 0.04), y0 + 0.6 + i * 1.2, fz - (i % 2 ? 0.3 : 0.45)]} c={STONE} r={0.9} />
          </group>
        )))}
        {/* string courses */}
        {Array.from({ length: floors + 1 }).map((_, f) => <Box key={f} size={[W + 0.36, 0.2, D + 0.36]} p={[0, y0 + ground + f * floorH - 0.2, 0]} c={STONE} r={0.9} />)}
        {/* upper windows: front + right side + left side */}
        {Array.from({ length: floors }).map((_, f) => Array.from({ length: cols }).map((__, c) => {
          const id = f * 17 + c * 5; const lit = rnd(id + 0.3) < 0.62;
          return <Window key={`f${f}-${c}`} p={[-W / 2 + (c + 0.5) * (W / cols), y0 + ground + f * floorH + 1.45, fz]} lit={lit} guest={rnd(id + 4.4) > 0.5} seed={id} night={night} />;
        }))}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * sx, 0, 0]} rotation={[0, s * Math.PI / 2, 0]}>
            {Array.from({ length: floors + 1 }).map((_, f) => Array.from({ length: sideCols }).map((__, c) => {
              const id = f * 13 + c * 9 + (s > 0 ? 100 : 200);
              return <Window key={`${f}-${c}`} p={[-D / 2 + (c + 0.5) * (D / sideCols), y0 + (f === 0 ? 2.0 : ground + (f - 1) * floorH + 1.45), 0]} lit={rnd(id + 0.7) < 0.5} guest={rnd(id) > 0.6} seed={id} night={night} />;
            }))}
          </group>
        ))}
        {/* ground-floor arcade */}
        <Box size={[W + 0.3, 0.5, 0.5]} p={[0, y0 + ground - 0.55, fz + 0.12]} c={STONE} r={0.9} />
        {Array.from({ length: cols + 1 }).map((_, c) => (
          <group key={c} position={[-W / 2 + c * (W / cols), y0, fz + 0.16]}>
            <Box size={[0.5, ground - 0.8, 0.44]} p={[0, (ground - 0.8) / 2, 0]} c={STONE} r={0.9} />
            <Box size={[0.66, 0.2, 0.6]} p={[0, 0.1, 0]} c={tint(STONE, 0.9)} />
            <Box size={[0.66, 0.22, 0.6]} p={[0, ground - 0.9, 0]} c={tint(STONE, 0.95)} />
          </group>
        ))}
        {Array.from({ length: cols }).map((_, c) => {
          const cx = -W / 2 + (c + 0.5) * (W / cols); const door = c === 3 || c === 4;
          return (
            <group key={`g${c}`} position={[cx, y0, fz]}>
              <Box size={[W / cols - 0.5, ground - 1.0, 0.06]} p={[0, (ground - 1.0) / 2 + 0.1, 0.04]} c="#eeb260" e="#ff9c38" ei={0.3 + night * 0.5} r={0.5} shadow={false} />
              {!door && [-0.62, 0.62].map((mx) => <Box key={mx} size={[0.06, ground - 1.9, 0.1]} p={[mx, (ground - 1.0) / 2 + 0.5, 0.08]} c="#3a2618" shadow={false} />)}
              {!door && <Box size={[W / cols - 0.5, 0.07, 0.1]} p={[0, ground - 1.75, 0.08]} c="#3a2618" shadow={false} />}
              {!door && <Box size={[W / cols - 0.7, 0.5, 0.04]} p={[0, ground - 1.4, 0.07]} c="#7a2a26" e="#5a1a10" ei={0.5} shadow={false} />}
              {!door && c % 2 === 0 && <group position={[0.35, 1.25, 0.08]}><Sph rad={0.2} s={[1, 1.05, 0.2]} p={[0, 0.42, 0]} c="#2a1810" shadow={false} /><Sph rad={0.34} s={[1.2, 1.1, 0.2]} p={[0, -0.1, 0]} c="#2a1810" shadow={false} /></group>}
              {!door && <Box size={[W / cols - 0.5, 0.9, 0.1]} p={[0, 0.5, 0.08]} c="#5a3a26" r={0.8} />}
              {!door && <Box size={[0.07, ground - 1.9, 0.1]} p={[0, (ground - 1.0) / 2 + 0.5, 0.08]} c="#3a2618" shadow={false} />}
              {door && <>
                {/* hinged door leaf (opens outward) */}
                <group position={[c === 3 ? -1.0 : 1.0, 0, 0.1]} rotation={[0, (c === 3 ? -1 : 1) * (c === 3 ? doorOpen : doorOpen * 0.25) * 1.75, 0]}>
                  <Box size={[2.0, 1.85, 0.07]} p={[c === 3 ? 1.0 : -1.0, 0.1 + 0.925, 0]} c="#7a4a28" r={0.6} />
                  <Box size={[1.5, 0.6, 0.03]} p={[c === 3 ? 1.0 : -1.0, 0.55, 0.045]} c="#5e361c" r={0.6} shadow={false} />
                  <Box size={[1.5, 0.75, 0.03]} p={[c === 3 ? 1.0 : -1.0, 1.4, 0.045]} c="#5e361c" r={0.6} shadow={false} />
                  <Sph rad={0.06} p={[c === 3 ? 1.8 : -1.8, 1.05, 0.07]} c="#d9b44a" m={0.9} r={0.25} />
                </group>
                <Box size={[W / cols - 0.9, 1.0, 0.08]} p={[0, 2.35, 0.1]} c="#eeb260" e="#ff9c38" ei={0.4 + night * 0.5} shadow={false} />
              </>}
            </group>
          );
        })}
        {/* entrance canopy + steps */}
        <Box size={[5.6, 0.14, 2.0]} p={[0, y0 + ground - 0.9, fz + 1.1]} rot={[0.12, 0, 0]} c="#7a2a26" r={0.9} />
        {[-1, 0, 1].map((k) => <Box key={k} size={[1.0, 0.16, 2.02]} p={[k * 2.1, y0 + ground - 0.89, fz + 1.1]} rot={[0.12, 0, 0]} c="#efe2c4" r={0.9} shadow={false} />)}
        {[-1, 1].map((s) => <Cyl key={s} rt={0.035} h={1.9} p={[s * 2.6, y0 + ground - 0.35, fz + 1.05]} rot={[0.85, 0, 0]} c="#2a2a2e" m={0.6} r={0.4} />)}
        {/* cornice */}
        <Box size={[W + 0.7, 0.3, D + 0.7]} p={[0, y0 + wallH + 0.05, 0]} c={STONE} r={0.9} />
        {Array.from({ length: 34 }).map((_, i) => <Box key={i} size={[0.26, 0.3, 0.3]} p={[-W / 2 - 0.1 + i * ((W + 0.2) / 33), y0 + wallH + 0.34, fz + 0.38]} c={STONE} r={0.9} />)}
        {[-1, 1].map((s) => Array.from({ length: 18 }).map((_, i) => <Box key={`${s}${i}`} size={[0.3, 0.3, 0.26]} p={[s * (sx + 0.38), y0 + wallH + 0.34, -D / 2 + 0.2 + i * ((D - 0.4) / 17)]} c={STONE} r={0.9} />))}
        <Box size={[W + 1.5, 0.34, D + 1.5]} p={[0, y0 + wallH + 0.66, 0]} c={tint(STONE, 1.03)} r={0.9} />
        <Box size={[W + 0.4, 0.7, D + 0.4]} p={[0, y0 + wallH + 1.15, 0]} c="#8a4636" r={0.95} />
        {/* chimneys + smoke */}
        {[-7, -2.5, 3, 7.5].map((cx, i) => (
          <group key={cx} position={[cx, y0 + wallH + 1.5, -1.5 + (i % 2) * 2]}>
            <Box size={[0.9, 1.9, 0.9]} p={[0, 0.9, 0]} c="#7e3f32" r={0.95} /><Box size={[1.1, 0.2, 1.1]} p={[0, 1.9, 0]} c={STONE} />
            {[0, 1, 2, 3].map((k) => { const ph = (t * smoke + k / 4 + i * 0.13) % 1; return <Puff key={k} p={[ph * 2.4 + Math.sin(ph * 5 + i) * 0.3, 2.2 + ph * 5, 0]} size={1 + ph * 3.2} color="#c9b6ae" op={(1 - ph) * 0.35} />; })}
          </group>
        ))}
        {/* roof sign */}
        {sign && <group position={[0, y0 + wallH + 2.6, fz - 0.6]}>
          <mesh castShadow><boxGeometry args={[11, 1.9, 0.16]} /><meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.6} /></mesh>
          {[-4.6, -1.5, 1.5, 4.6].map((px) => <Cyl key={px} rt={0.05} h={1.4} p={[px, -1.4, -0.2]} rot={[0.3, 0, 0]} c="#2a2a2e" />)}
        </group>}
        {/* flag */}
        <Cyl rt={0.05} h={4.6} p={[sx - 1.6, y0 + wallH + 3.6, 1.5]} c="#3a2a20" />
        {Array.from({ length: 9 }).map((_, i) => <Box key={i} size={[0.3, 1.25, 0.03]} p={[sx - 1.4 + i * 0.29, y0 + wallH + 5.1 - i * 0.02, 1.5 + Math.sin(t * 7 - i * 0.8) * 0.05 * i]} rot={[0, Math.cos(t * 7 - i * 0.8) * 0.25, 0]} c={i < 3 ? '#27407a' : '#c2352c'} r={1} side={THREE.DoubleSide} />)}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ */
const facade = (seed: number, wall: string, signText: string | null, wood: boolean) => {
  const cols = 3 + Math.floor(rnd(seed) * 2), rows = 3;
  const paint = (emissive: boolean) => makeTex(512, 512, (g, w, h) => {
    g.fillStyle = emissive ? '#000' : wall; g.fillRect(0, 0, w, h);
    if (!emissive) for (let y = 0; y < h; y += wood ? 20 : 12) { g.fillStyle = `rgba(0,0,0,${0.06 + rnd(y + seed) * 0.08})`; g.fillRect(0, y, w, 2); }
    const cw = w / cols, rh = (h * 0.68) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + cw * 0.22, y = 30 + r * rh, ww = cw * 0.56, hh = rh * 0.68; const lit = rnd(seed * 7 + r * 3 + c) > 0.5;
      if (emissive) { if (lit) { g.fillStyle = '#ffb858'; g.fillRect(x, y, ww, hh); } continue; }
      g.fillStyle = '#e6dcc4'; g.fillRect(x - 8, y - 8, ww + 16, hh + 20);
      g.fillStyle = lit ? '#ffcf7a' : '#27323e'; g.fillRect(x, y, ww, hh);
      g.fillStyle = '#e6dcc4'; g.fillRect(x + ww / 2 - 3, y, 6, hh); g.fillRect(x, y + hh / 2 - 3, ww, 6);
    }
    const sy = h * 0.72;
    if (emissive) { g.fillStyle = '#ffb04a'; g.fillRect(40, sy + 50, w * 0.32, h - sy - 70); g.fillRect(w * 0.6, sy + 50, w * 0.32, h - sy - 70); return; }
    g.fillStyle = '#2a1d16'; g.fillRect(0, sy, w, 44);
    if (signText) { g.fillStyle = '#f0d58c'; g.font = '34px Anton'; g.textAlign = 'center'; g.fillText(signText, w / 2, sy + 34); }
    g.fillStyle = '#ffd58a'; g.fillRect(40, sy + 50, w * 0.32, h - sy - 70); g.fillRect(w * 0.6, sy + 50, w * 0.32, h - sy - 70);
    g.fillStyle = '#4a2c1a'; g.fillRect(w * 0.42, sy + 50, w * 0.15, h - sy - 50);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, sy + 44, w, 8);
  });
  return { map: paint(false), emap: paint(true) };
};

const Neighbor: React.FC<{ p: V3; size: V3; wall: string; sign: string | null; seed: number; wood?: boolean; awning?: string; night?: number; rotY?: number }> = ({ p, size, wall, sign, seed, wood = false, awning, night = 0.6, rotY = 0 }) => {
  const tex = useFontTexPair(seed, wall, sign, wood);
  const [w, h, d] = size;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><Mat c={tint(wall, 0.8)} r={0.95} /></mesh>
      {tex && <mesh position={[0, h / 2, d / 2 + 0.02]} receiveShadow><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex.map} emissiveMap={tex.emap} emissive="#ffffff" emissiveIntensity={0.7 + night} roughness={0.9} /></mesh>}
      <Box size={[w + 0.5, 0.35, d + 0.5]} p={[0, h + 0.1, 0]} c={tint(wall, 0.6)} />
      <Box size={[w + 0.2, 0.6, 0.3]} p={[0, h - 0.5, d / 2 + 0.15]} c={tint(wall, 1.15)} />
      {awning && <Box size={[w * 0.9, 0.1, 1.7]} p={[0, h * 0.3 + 0.3, d / 2 + 0.8]} rot={[0.3, 0, 0]} c={awning} r={1} />}
      <Box size={[0.7, 1.3, 0.7]} p={[w * 0.25, h + 0.8, -d * 0.2]} c="#6a4034" />
    </group>
  );
};
const useFontTexPair = (seed: number, wall: string, sign: string | null, wood: boolean) => {
  return useMemo(() => facade(seed, wall, sign, wood), [seed, wall, sign, wood]);
};

export const Lamp3D: React.FC<{ p: V3; on?: number; light?: boolean }> = ({ p, on = 1, light = true }) => (
  <group position={p}>
    <Cyl rt={0.07} rb={0.11} h={0.5} p={[0, 0.25, 0]} c="#1e2226" m={0.7} r={0.4} />
    <Cyl rt={0.045} h={3.0} p={[0, 1.9, 0]} c="#1e2226" m={0.7} r={0.4} />
    <Box size={[0.7, 0.05, 0.05]} p={[0, 3.1, 0]} c="#1e2226" />
    <Cyl rt={0.2} rb={0.13} h={0.42} p={[0, 3.6, 0]} c="#ffd98a" e="#ffb347" ei={2.5 * on} seg={4} op={0.95} shadow={false} />
    <Cyl rt={0.02} rb={0.26} h={0.2} p={[0, 3.92, 0]} c="#1e2226" seg={4} />
    <Glow p={[0, 3.6, 0]} size={3.2} color="#ffb04a" op={0.7 * on} />
    {light && <pointLight position={[0, 3.5, 0]} color="#ffb060" intensity={40 * on} distance={14} decay={2} />}
  </group>
);

export const Barrel: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => {
  const geo = useMemo(() => new THREE.LatheGeometry([[0.0, 0], [0.26, 0], [0.33, 0.3], [0.34, 0.45], [0.33, 0.6], [0.26, 0.9], [0, 0.9]].map(([r, y]) => new THREE.Vector2(r, y)), 16), []);
  return <group position={p} scale={s}><mesh geometry={geo} castShadow receiveShadow><Mat c="#8a5c34" r={0.9} /></mesh>
    {[0.14, 0.45, 0.76].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[y === 0.45 ? 0.342 : 0.3, 0.014, 4, 16]} /><Mat c="#2e3338" m={0.8} r={0.4} /></mesh>)}</group>;
};

export const Wagon3D: React.FC<{ p: V3; rotY?: number }> = ({ p, rotY = 0 }) => {
  const plank = useTex(256, 256, plankDraw('#8a6238', 6));
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow><boxGeometry args={[3.4, 0.16, 1.5]} /><Mat c="#fff" map={plank} r={0.95} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[0, 1.3, s * 0.72]} castShadow><boxGeometry args={[3.4, 0.5, 0.07]} /><Mat c="#fff" map={plank} r={0.95} /></mesh>)}
      {[[-1.1, 0.75], [1.1, 0.75], [-1.1, -0.75], [1.1, -0.75]].map(([x, z], i) => (
        <group key={i} position={[x, 0.62, z * 1.12]}>
          <mesh castShadow><torusGeometry args={[0.56, 0.06, 6, 22]} /><Mat c="#3a2516" r={0.9} /></mesh>
          {[0, 1, 2, 3].map((k) => <Box key={k} size={[1.1, 0.05, 0.05]} rot={[0, 0, (k * Math.PI) / 4]} c="#5a3a22" />)}
          <Cyl rt={0.1} h={0.16} rot={[Math.PI / 2, 0, 0]} c="#2a1a10" />
        </group>
      ))}
      {Array.from({ length: 7 }).map((_, i) => <Box key={i} size={[3.9, 0.2, 0.22]} p={[0.2, 1.2 + Math.floor(i / 4) * 0.21, -0.5 + (i % 4) * 0.3 + Math.floor(i / 4) * 0.15]} rot={[0, (rnd(i) - 0.5) * 0.06, 0]} c={['#a57a4c', '#96693c', '#b08655'][i % 3]} r={0.95} />)}
      <Box size={[1.8, 0.08, 0.08]} p={[-2.5, 0.85, 0]} rot={[0, 0, -0.25]} c="#5a3a22" />
    </group>
  );
};

/** Street environment around the hotel: ground, neighbours, skyline, lamps, props, atmosphere. */
export const StreetSet: React.FC<{ t: number; night?: number; lamps?: boolean }> = ({ t, night = 0.6, lamps = true }) => {
  const dirt = useTex(1024, 1024, dirtDraw('#7a5c44'), [26, 26]);
  const plank = useTex(512, 256, plankDraw('#9a7550', 10), [10, 1]);
  const { W, D } = HOTEL;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[420, 420]} /><Mat c="#ffffff" map={dirt} bump={dirt} bs={1.2} r={0.97} /></mesh>
      {/* wheel ruts + puddles catching the sky */}
      {Array.from({ length: 9 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[-22 + rnd(i * 3.1) * 44, 0.012, D / 2 + 6 + rnd(i * 5.7) * 16]}><circleGeometry args={[0.8 + rnd(i * 2) * 1.6, 20]} /><Mat c="#b98a78" r={0.08} m={0.85} /></mesh>)}
      {/* neighbours left / right, set back to form a street wall */}
      <Neighbor p={[-W / 2 - 8.4, 0, -0.5]} size={[12, 9.5, 10]} wall="#8c6a4a" sign="DRY GOODS" seed={3} wood awning="#6a2f2a" night={night} />
      <Neighbor p={[-W / 2 - 21.5, 0, 0.5]} size={[11, 12.5, 11]} wall="#7a5a5a" sign="HARDWARE" seed={5} night={night} />
      <Neighbor p={[W / 2 + 7.8, 0, -0.2]} size={[11, 11.5, 10]} wall="#9a6a4c" sign="BOOTS & SHOES" seed={7} awning="#2f4a5a" night={night} />
      <Neighbor p={[W / 2 + 20.5, 0, 0.8]} size={[12, 8.5, 11]} wall="#86745a" sign="SALOON" seed={9} wood night={night} />
      {/* plank sidewalks by the neighbours */}
      {[-W / 2 - 15, W / 2 + 14.5].map((x) => <mesh key={x} position={[x, 0.12, D / 2 + 1.6]} castShadow receiveShadow><boxGeometry args={[26, 0.24, 2.6]} /><Mat c="#fff" map={plank} r={0.95} /></mesh>)}
      {/* far city */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = -90 + i * 7.2 + rnd(i) * 3, h = 7 + rnd(i * 2.3) * 16, z = -32 - rnd(i * 4.1) * 40;
        return <group key={i}><Box size={[6 + rnd(i * 6) * 4, h, 8]} p={[x, h / 2, z]} c={['#6d5560', '#7a5f62', '#5f4d5c'][i % 3]} r={1} shadow={false} />
          {rnd(i * 8.8) > 0.8 && <Cyl rt={0.01} rb={1.3} h={9} p={[x, h + 4.5, z]} c="#5a4656" seg={4} shadow={false} />}
          {Array.from({ length: 5 }).map((__, k) => rnd(i * 11 + k) > 0.45 ? <Box key={k} size={[0.5, 0.8, 0.05]} p={[x - 2 + (k % 3) * 1.6, 2 + Math.floor(k / 3) * 2.6 + rnd(k + i) * (h - 6), z + 4.05]} c="#ffc06a" e="#ffb04a" ei={1.5} shadow={false} /> : null)}</group>;
      })}
      {/* street furniture */}
      <Lamp3D p={[-W / 2 - 2.2, 0, D / 2 + 3.4]} on={0.5 + night * 0.5} light={lamps} />
      <Lamp3D p={[W / 2 + 2.6, 0, D / 2 + 3.8]} on={0.5 + night * 0.5} light={lamps} />
      <Lamp3D p={[-23.5, 0, D / 2 + 24]} on={0.5 + night * 0.5} light={false} />
      <Wagon3D p={[-W / 2 - 1.5, 0, D / 2 + 8.2]} rotY={0.35} />
      {[[9.2, 6.6], [9.9, 6.9], [9.5, 7.5]].map(([x, z], i) => <Barrel key={i} p={[x, 0, D / 2 + z - 4]} s={1 + rnd(i) * 0.15} />)}
      {[[11.2, 3.4, 0.7], [11.9, 3.2, 0.5], [11.5, 3.3, 1.25]].map(([x, z, y], i) => <Box key={i} size={[0.8, 0.6, 0.7]} p={[x, i === 2 ? 0.9 : 0.3, D / 2 + z]} rot={[0, y, 0]} c={['#9a7446', '#8a6238', '#a8824e'][i]} r={0.95} />)}
      {/* loose timbers + ladder against the wall */}
      {Array.from({ length: 6 }).map((_, i) => <Box key={i} size={[0.22, 0.2, 3.6]} p={[-7.6 + (i % 3) * 0.26, 0.1 + Math.floor(i / 3) * 0.2, D / 2 + 3.6]} rot={[0, 1.2 + rnd(i) * 0.08, 0]} c={['#a57a4c', '#96693c', '#b08655'][i % 3]} r={0.95} />)}
      <group position={[7.2, 0, D / 2 + 1.5]} rotation={[-0.28, 0, 0]}>
        {[-1, 1].map((s) => <Box key={s} size={[0.07, 5.2, 0.07]} p={[s * 0.28, 2.6, 0]} c="#9a7446" />)}
        {Array.from({ length: 11 }).map((_, i) => <Box key={i} size={[0.56, 0.05, 0.05]} p={[0, 0.4 + i * 0.45, 0]} c="#8a6238" />)}
      </group>
      {/* atmosphere: drifting clouds + ground haze */}
      {Array.from({ length: 12 }).map((_, i) => <Puff key={i} p={[-130 + ((i * 31 + t * 1.6) % 260), 38 + rnd(i) * 30, -120 - rnd(i * 3) * 40]} size={46 + rnd(i * 7) * 40} color={['#ffc9a0', '#f2a590', '#ffe0b8'][i % 3]} op={0.5} />)}
      {Array.from({ length: 10 }).map((_, i) => <Puff key={`h${i}`} p={[-40 + i * 9 + Math.sin(t * 0.3 + i) * 2, 1.2, -14 - rnd(i) * 10]} size={16} color="#ffc9a0" op={0.16} />)}
    </group>
  );
};
