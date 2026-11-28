import React, { createContext, useContext } from 'react';
import { rand } from '../lib/anim';

export const W = 1080;
export const H = 1920;

/* ---------------- Camera with parallax ---------------- */
type Cam = { x: number; y: number; z: number; r?: number };
const CamCtx = createContext<Cam>({ x: W / 2, y: H / 2, z: 1 });

/** World-space camera: (x,y) is the world point at screen centre; z = zoom. */
export const Camera: React.FC<{ cam: Cam; children: React.ReactNode; shake?: number; t?: number }> = ({ cam, children, shake = 0, t = 0 }) => {
  const sx = shake ? Math.sin(t * 47) * shake + Math.sin(t * 23) * shake * 0.6 : 0;
  const sy = shake ? Math.cos(t * 41) * shake : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <CamCtx.Provider value={cam}>
        <g transform={`translate(${W / 2 + sx} ${H / 2 + sy}) scale(${cam.z}) rotate(${cam.r ?? 0}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
      </CamCtx.Provider>
    </svg>
  );
};

/** Parallax layer: depth p<1 moves slower than the world (background), p>1 faster (foreground). */
export const Layer: React.FC<{ p: number; children: React.ReactNode; ox?: number; oy?: number }> = ({ p, children, ox = W / 2, oy = H / 2 }) => {
  const c = useContext(CamCtx);
  const dx = (c.x - ox) * (1 - p);
  const dy = (c.y - oy) * (1 - p);
  return <g transform={`translate(${dx} ${dy})`}>{children}</g>;
};

/* ---------------- Sky / atmosphere ---------------- */
export const Sky: React.FC<{ id: string; top: string; mid: string; bottom: string; x?: number; y?: number; w?: number; h?: number; glow?: string; glowX?: number; glowY?: number }> = ({ id, top, mid, bottom, x = -2000, y = -2000, w = 5080, h = 5000, glow, glowX = 540, glowY = 900 }) => (
  <g>
    <defs>
      <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} /><stop offset="0.55" stopColor={mid} /><stop offset="1" stopColor={bottom} />
      </linearGradient>
      {glow && <radialGradient id={`glow-${id}`}><stop offset="0" stopColor={glow} stopOpacity="0.9" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient>}
    </defs>
    <rect x={x} y={y} width={w} height={h} fill={`url(#sky-${id})`} />
    {glow && <circle cx={glowX} cy={glowY} r={700} fill={`url(#glow-${id})`} />}
  </g>
);

export const Clouds: React.FC<{ t: number; y: number; color: string; n?: number; speed?: number; seed?: number; spread?: number; opacity?: number }> = ({ t, y, color, n = 6, speed = 12, seed = 1, spread = 2400, opacity = 0.9 }) => (
  <g opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => {
      const r = rand(i + seed * 13);
      const cx = ((r * spread + t * speed * (0.6 + r)) % spread) - spread / 2 + 540;
      const cy = y + rand(i * 3 + seed) * 260;
      const s = 0.7 + rand(i * 7 + seed) * 0.9;
      return (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`} fill={color}>
          <ellipse cx={0} cy={0} rx={160} ry={46} /><circle cx={-60} cy={-24} r={58} /><circle cx={20} cy={-46} r={74} /><circle cx={90} cy={-16} r={52} />
        </g>
      );
    })}
  </g>
);

export const Rain: React.FC<{ t: number; n?: number; opacity?: number; angle?: number; x0?: number; y0?: number; w?: number; h?: number }> = ({ t, n = 160, opacity = 0.5, angle = 12, x0 = -400, y0 = -400, w = 1900, h = 2800 }) => (
  <g stroke="#cfe3ff" strokeWidth={3} strokeLinecap="round" opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => {
      const sp = 1900 + rand(i) * 900;
      const x = x0 + rand(i * 5.3) * w;
      const y = y0 + ((rand(i * 2.1) * h + t * sp) % h);
      const len = 38 + rand(i * 9) * 40;
      const dx = Math.tan((angle * Math.PI) / 180) * len;
      return <line key={i} x1={x + (y - y0) * Math.tan((angle * Math.PI) / 180) * 0.2} y1={y} x2={x - dx + (y - y0) * Math.tan((angle * Math.PI) / 180) * 0.2} y2={y + len} />;
    })}
  </g>
);

/* ---------------- City pieces ---------------- */
export const Skyline: React.FC<{ y: number; color: string; seed?: number; x0?: number; x1?: number; windows?: string; smoke?: number; t?: number }> = ({ y, color, seed = 1, x0 = -900, x1 = 2000, windows, smoke = 0, t = 0 }) => {
  const items: React.ReactNode[] = [];
  let x = x0, i = 0;
  while (x < x1) {
    const r = rand(i * 3.7 + seed);
    const w = 90 + r * 150;
    const h = 90 + rand(i * 1.3 + seed) * 200;
    const steeple = rand(i * 9.1 + seed) > 0.86;
    items.push(
      <g key={i}>
        <rect x={x} y={y - h} width={w} height={h + 400} fill={color} />
        {rand(i * 2.2 + seed) > 0.5 ? <path d={`M${x - 6} ${y - h} L${x + w / 2} ${y - h - 50} L${x + w + 6} ${y - h}Z`} fill={color} /> : <rect x={x - 6} y={y - h - 10} width={w + 12} height={12} fill={color} />}
        {steeple && <path d={`M${x + w / 2 - 22} ${y - h} L${x + w / 2 - 22} ${y - h - 90} L${x + w / 2} ${y - h - 230} L${x + w / 2 + 22} ${y - h - 90} L${x + w / 2 + 22} ${y - h}Z`} fill={color} />}
        {rand(i * 4.4 + seed) > 0.55 && <rect x={x + w * 0.7} y={y - h - 40} width={16} height={44} fill={color} />}
        {smoke > 0 && rand(i * 4.4 + seed) > 0.55 && [0, 1, 2].map((k) => {
          const ph = ((t * 0.35 + k / 3 + rand(i)) % 1);
          return <circle key={k} cx={x + w * 0.7 + 8 + ph * 60} cy={y - h - 50 - ph * 160} r={10 + ph * 34} fill="#9aa0a8" opacity={(1 - ph) * 0.35 * smoke} />;
        })}
        {windows && Array.from({ length: Math.floor(h / 55) }).map((_, row) =>
          Array.from({ length: Math.floor(w / 45) }).map((__, c) =>
            rand(i * 31 + row * 7 + c) > 0.55 ? <rect key={`${row}-${c}`} x={x + 14 + c * 45} y={y - h + 24 + row * 55} width={14} height={20} fill={windows} opacity={0.8} /> : null))}
      </g>,
    );
    x += w + 8 + rand(i * 5.5 + seed) * 30;
    i++;
  }
  return <g>{items}</g>;
};

/** Generic 1850s storefront building (origin: bottom-left at ground). */
export const Building: React.FC<{
  x: number; y: number; w: number; floors: number; fh?: number; wall: string; trim?: string; roof?: string;
  lit?: number; seed?: number; sign?: string; door?: boolean; wood?: boolean; awning?: string;
}> = ({ x, y, w, floors, fh = 120, wall, trim = '#e8dcc0', roof = '#3a2a24', lit = 0, seed = 1, sign, door = true, wood, awning }) => {
  const h = floors * fh;
  const cols = Math.max(2, Math.floor(w / 110));
  const gap = w / cols;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-h} width={w} height={h} fill={wall} />
      {/* brick / board texture */}
      {Array.from({ length: Math.floor(h / (wood ? 22 : 16)) }).map((_, r) => (
        <line key={r} x1={0} x2={w} y1={-h + r * (wood ? 22 : 16)} y2={-h + r * (wood ? 22 : 16)} stroke="rgba(0,0,0,0.10)" strokeWidth={2} />
      ))}
      <rect x={-10} y={-h - 26} width={w + 20} height={28} fill={roof} />
      <rect x={-4} y={-h - 4} width={w + 8} height={8} fill={trim} />
      {Array.from({ length: floors }).map((_, f) =>
        Array.from({ length: cols }).map((__, c) => {
          if (f === 0 && door && c === Math.floor(cols / 2)) return null;
          const on = rand(seed * 17 + f * 5 + c) < lit;
          const wx = c * gap + gap / 2 - 26, wy = -(f + 1) * fh + 26;
          return (
            <g key={`${f}-${c}`}>
              <rect x={wx - 6} y={wy - 6} width={64} height={fh - 40} fill={trim} rx={4} />
              <rect x={wx} y={wy} width={52} height={fh - 52} fill={on ? '#ffd27a' : '#2c3a4a'} />
              {on && <rect x={wx} y={wy} width={52} height={fh - 52} fill="#fff3c4" opacity={0.35} />}
              <line x1={wx + 26} x2={wx + 26} y1={wy} y2={wy + fh - 52} stroke={trim} strokeWidth={4} />
            </g>
          );
        }))}
      {door && <g><rect x={Math.floor(cols / 2) * gap + gap / 2 - 34} y={-fh + 8} width={68} height={fh - 8} fill="#4a2e20" rx={6} />
        <circle cx={Math.floor(cols / 2) * gap + gap / 2 + 20} cy={-fh / 2 + 6} r={5} fill="#d9b44a" /></g>}
      {awning && <path d={`M0 ${-fh - 4} L${w} ${-fh - 4} L${w + 20} ${-fh + 34} L-20 ${-fh + 34}Z`} fill={awning} />}
      {sign && <g><rect x={w / 2 - 150} y={-h + 4} width={300} height={54} fill="#2a1f1a" rx={6} />
        <text x={w / 2} y={-h + 43} textAnchor="middle" fill="#f3d58a" fontFamily="Anton" fontSize={34} letterSpacing={2}>{sign}</text></g>}
    </g>
  );
};

/** Jackscrew: base origin on ground; 'turn' rotates handle; 'ext' = screw extension px. */
export const Jackscrew: React.FC<{ x: number; y: number; s?: number; turn?: number; ext?: number }> = ({ x, y, s = 1, turn = 0, ext = 20 }) => {
  const a = turn * Math.PI * 2;
  const hx = Math.cos(a) * 46;
  const depth = Math.sin(a);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-30 0 L-20 -62 L20 -62 L30 0Z" fill="#5d6670" stroke="#2b3036" strokeWidth={3} />
      <rect x={-9} y={-62 - ext - 26} width={18} height={ext + 26} fill="#9aa4ad" />
      {Array.from({ length: Math.floor((ext + 26) / 8) }).map((_, i) => <line key={i} x1={-9} x2={9} y1={-62 - i * 8} y2={-66 - i * 8} stroke="#5d6670" strokeWidth={2} />)}
      <rect x={-22} y={-62 - ext - 40} width={44} height={16} fill="#3e464f" rx={3} />
      <g opacity={depth < 0 ? 0.6 : 1}>
        <line x1={0} y1={-56} x2={hx} y2={-56 + depth * 6} stroke="#2b3036" strokeWidth={7} strokeLinecap="round" />
        <circle cx={hx} cy={-56 + depth * 6} r={6} fill="#2b3036" />
      </g>
      <rect x={-16} y={-64} width={32} height={10} fill="#3e464f" />
    </g>
  );
};

export const Lamp: React.FC<{ x: number; y: number; lit?: number; s?: number }> = ({ x, y, lit = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {lit > 0 && <circle cx={0} cy={-300} r={120} fill="#ffcf73" opacity={0.25 * lit} />}
    <rect x={-6} y={-280} width={12} height={280} fill="#22262b" />
    <rect x={-16} y={-8} width={32} height={10} fill="#22262b" />
    <path d="M-22 -280 L22 -280 L16 -330 L-16 -330Z" fill={lit > 0 ? '#ffd98a' : '#a8b4bd'} stroke="#22262b" strokeWidth={5} />
    <path d="M-26 -330 L26 -330 L0 -352Z" fill="#22262b" />
  </g>
);

export const Wagon: React.FC<{ x: number; y: number; sink?: number; wobble?: number; s?: number }> = ({ x, y, sink = 0, wobble = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y + sink}) scale(${s}) rotate(${wobble})`}>
    <rect x={-170} y={-150} width={300} height={70} fill="#8a5a34" stroke="#4a2e1a" strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => <line key={i} x1={-170 + i * 75} x2={-170 + i * 75} y1={-150} y2={-80} stroke="#4a2e1a" strokeWidth={4} />)}
    <rect x={-150} y={-196} width={120} height={46} fill="#c9b07a" rx={8} />
    <rect x={-30} y={-190} width={140} height={40} fill="#a88a5a" rx={6} />
    {[-110, 80].map((wx) => (
      <g key={wx} transform={`translate(${wx} -60)`}>
        <circle r={60} fill="none" stroke="#3a2416" strokeWidth={12} />
        {[0, 45, 90, 135].map((a) => <line key={a} x1={-58 * Math.cos((a * Math.PI) / 180)} y1={-58 * Math.sin((a * Math.PI) / 180)} x2={58 * Math.cos((a * Math.PI) / 180)} y2={58 * Math.sin((a * Math.PI) / 180)} stroke="#3a2416" strokeWidth={5} />)}
        <circle r={10} fill="#3a2416" />
      </g>
    ))}
  </g>
);

/** Muddy street band with puddles and ruts. */
export const MudStreet: React.FC<{ y: number; x0?: number; w?: number; h?: number; wet?: number; t?: number; color?: string }> = ({ y, x0 = -1500, w = 4200, h = 1600, wet = 1, t = 0, color = '#5b4330' }) => (
  <g>
    <rect x={x0} y={y} width={w} height={h} fill={color} />
    {Array.from({ length: 26 }).map((_, i) => (
      <ellipse key={i} cx={x0 + rand(i * 3.3) * w} cy={y + 30 + rand(i * 7.7) * 700} rx={60 + rand(i) * 140} ry={10 + rand(i * 2) * 18} fill="rgba(40,26,16,0.45)" />
    ))}
    {wet > 0 && Array.from({ length: 12 }).map((_, i) => {
      const px = x0 + 200 + rand(i * 5.1 + 2) * (w - 400), py = y + 60 + rand(i * 4.2 + 1) * 600;
      const rr = (t * 1.6 + rand(i)) % 1;
      return (
        <g key={`p${i}`} opacity={wet}>
          <ellipse cx={px} cy={py} rx={90 + rand(i * 8) * 90} ry={16 + rand(i * 3) * 10} fill="#7d8d9a" opacity={0.55} />
          <ellipse cx={px + 10} cy={py} rx={10 + rr * 60} ry={2 + rr * 10} fill="none" stroke="#d8e6f0" strokeWidth={2} opacity={(1 - rr) * 0.8} />
        </g>
      );
    })}
  </g>
);

/** Plank sidewalk */
export const Planks: React.FC<{ x: number; y: number; w: number; h?: number; color?: string }> = ({ x, y, w, h = 34, color = '#9a7550' }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={color} />
    {Array.from({ length: Math.ceil(w / 70) }).map((_, i) => <line key={i} x1={x + i * 70} x2={x + i * 70} y1={y} y2={y + h} stroke="rgba(0,0,0,0.3)" strokeWidth={3} />)}
    <rect x={x} y={y + h} width={w} height={14} fill="rgba(0,0,0,0.25)" />
  </g>
);

/** Timber cribbing stack (criss-cross blocks) */
export const Cribbing: React.FC<{ x: number; y: number; h: number; w?: number }> = ({ x, y, h, w = 90 }) => {
  const n = Math.max(0, Math.floor(h / 22));
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={x - (i % 2 ? w / 2 : w / 2 - 10)} y={y - (i + 1) * 22} width={i % 2 ? w : w - 20} height={20} fill={i % 2 ? '#9b6b3e' : '#7f5530'} stroke="#4a2e1a" strokeWidth={2} />
      ))}
    </g>
  );
};

/** Film look overlay: vignette + warm grade + subtle animated grain */
export const FilmLook: React.FC<{ frame: number; vignette?: number; tint?: string }> = ({ frame, vignette = 0.55, tint }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={vignette} /></radialGradient>
      <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={frame % 8} /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.06 0" /></filter>
    </defs>
    {tint && <rect width={W} height={H} fill={tint} style={{ mixBlendMode: 'soft-light' }} />}
    <rect width={W} height={H} fill="url(#vig)" />
    <rect width={W} height={H} filter="url(#grain)" />
  </svg>
);
