import React from 'react';

export type Mouth = 'smile' | 'grin' | 'open' | 'o' | 'frown' | 'flat' | 'grimace';
export type Hat = 'top' | 'bowler' | 'cap' | 'night' | 'bonnet' | 'none';

export type Look = {
  skin: string; coat: string; pants: string; shoes?: string;
  hat?: Hat; hatColor?: string; hair?: string;
  mustache?: boolean; beard?: boolean; vest?: string; tie?: string;
  dress?: boolean; apron?: boolean; sleeves?: string; glasses?: boolean;
};

export type Pose = {
  walk?: number; stride?: number; // walk phase (rad) and leg swing (deg)
  armL?: number; armR?: number; elbowL?: number; elbowR?: number; // deg; + = forward / up
  lean?: number; headTilt?: number; squash?: number; bob?: number;
  mouth?: Mouth; talk?: number; brows?: number; eyes?: number; look?: number; lookY?: number;
  sink?: number; // px both feet sink into ground (mud)
};

const rad = (d: number) => (d * Math.PI) / 180;
const LEG = 92;
const UP = 46;
const LOW = 44;

const darken = (hex: string, k = 0.75) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
};

const MouthShape: React.FC<{ m: Mouth; talk: number }> = ({ m, talk }) => {
  const o = Math.max(0, Math.min(1, talk));
  if (o > 0.08 && (m === 'smile' || m === 'flat' || m === 'grin')) {
    return <g><ellipse cx={0} cy={2} rx={11} ry={3 + 9 * o} fill="#5a1f22" /><ellipse cx={0} cy={6 + 5 * o} rx={6} ry={2 + 3 * o} fill="#e0707a" /></g>;
  }
  switch (m) {
    case 'smile': return <path d="M-14 -2 Q0 12 14 -2" stroke="#4a1a1c" strokeWidth={4} fill="none" strokeLinecap="round" />;
    case 'grin': return <path d="M-16 -4 Q0 18 16 -4 Z" fill="#5a1f22" stroke="#4a1a1c" strokeWidth={3} strokeLinejoin="round" />;
    case 'open': return <g><ellipse cx={0} cy={4} rx={12} ry={14} fill="#5a1f22" /><ellipse cx={0} cy={11} rx={7} ry={4} fill="#e0707a" /></g>;
    case 'o': return <ellipse cx={0} cy={3} rx={7} ry={9} fill="#5a1f22" />;
    case 'frown': return <path d="M-13 8 Q0 -4 13 8" stroke="#4a1a1c" strokeWidth={4} fill="none" strokeLinecap="round" />;
    case 'grimace': return <g><rect x={-15} y={-3} width={30} height={13} rx={5} fill="#fff" stroke="#4a1a1c" strokeWidth={3} /><path d="M-15 3.5H15M-5 -3V10M5 -3V10" stroke="#4a1a1c" strokeWidth={1.5} /></g>;
    default: return <path d="M-11 2 H11" stroke="#4a1a1c" strokeWidth={4} strokeLinecap="round" />;
  }
};

const HatShape: React.FC<{ h: Hat; c: string }> = ({ h, c }) => {
  const d = darken(c, 0.7);
  switch (h) {
    case 'top': return <g><rect x={-46} y={-70} width={92} height={10} rx={5} fill={d} /><rect x={-34} y={-140} width={68} height={74} rx={6} fill={c} /><rect x={-34} y={-84} width={68} height={10} fill="#7a2a22" /><rect x={-38} y={-144} width={76} height={10} rx={5} fill={c} /></g>;
    case 'bowler': return <g><ellipse cx={0} cy={-58} rx={58} ry={11} fill={d} /><path d="M-42 -58 Q-44 -118 0 -120 Q44 -118 42 -58 Z" fill={c} /><rect x={-42} y={-70} width={84} height={8} fill="#2a2018" /></g>;
    case 'cap': return <g><path d="M-54 -48 Q-56 -98 6 -100 Q58 -96 54 -52 Z" fill={c} /><path d="M10 -56 Q60 -70 78 -48 Q50 -42 10 -48Z" fill={d} /><circle cx={0} cy={-98} r={5} fill={d} /></g>;
    case 'night': return <g><path d="M-54 -46 Q-50 -116 10 -118 Q70 -110 92 -40 L80 -36 Q60 -84 30 -80 Q50 -60 54 -44 Z" fill={c} /><rect x={-56} y={-56} width={112} height={16} rx={8} fill="#fff" opacity={0.85} /><circle cx={88} cy={-34} r={12} fill="#fff" /></g>;
    case 'bonnet': return <g><path d="M-62 -10 Q-70 -110 0 -112 Q70 -110 62 -10 Q50 -70 0 -74 Q-50 -70 -62 -10Z" fill={c} /><path d="M-30 40 Q0 50 30 40" stroke={d} strokeWidth={6} fill="none" /></g>;
    default: return null;
  }
};

/** Simple expressive cartoon person. Origin = point between the feet on the ground. */
export const Person: React.FC<{
  x: number; y: number; s?: number; face?: 1 | -1; look: Look; pose?: Pose;
  handR?: React.ReactNode; handL?: React.ReactNode; shadow?: boolean; blinkSeed?: number; frame?: number;
}> = ({ x, y, s = 1, face = 1, look, pose = {}, handR, handL, shadow = true, blinkSeed = 0, frame = 0 }) => {
  const {
    walk = 0, stride = 0, armL = 0, armR = 0, elbowL = 10, elbowR = 10, lean = 0, headTilt = 0,
    squash = 1, bob = 0, mouth = 'smile', talk = 0, brows = 0, eyes = 1, look: lk = 0, lookY = 0, sink = 0,
  } = pose;
  const a1 = Math.sin(walk) * stride;
  const a2 = -a1;
  const hip = LEG * Math.cos(rad(Math.abs(a1))) * squash + bob - Math.abs(Math.sin(walk)) * 0 ;
  const hipY = -hip + sink;
  // automatic blinking
  const cycle = (frame + blinkSeed * 37 + 55) % 113;
  const blink = cycle < 4 ? 0.1 : 1;
  const eyeOpen = Math.min(eyes, blink);
  const skinD = darken(look.skin, 0.85);
  const coatD = darken(look.coat, 0.78);
  const sleeve = look.sleeves ?? look.coat;
  const shoes = look.shoes ?? '#2b211c';
  const torsoH = 92 * (2 - squash) ** 0.5;
  const shoulderY = hipY - torsoH + 10;
  const headY = shoulderY - 52;

  const leg = (ang: number, off: number, back: boolean) => {
    const fx = off + Math.sin(rad(ang)) * LEG;
    const fy = hipY + Math.cos(rad(ang)) * LEG;
    return (
      <g key={off}>
        <line x1={off} y1={hipY} x2={fx} y2={fy - 6} stroke={back ? darken(look.pants, 0.8) : look.pants} strokeWidth={22} strokeLinecap="round" />
        <ellipse cx={fx + 9} cy={fy - 4} rx={19} ry={9} fill={shoes} />
      </g>
    );
  };
  const arm = (sh: number, el: number, sx: number, back: boolean, hand?: React.ReactNode) => {
    const ex = sx + Math.sin(rad(sh)) * UP, ey = shoulderY + Math.cos(rad(sh)) * UP;
    const fa = sh + el;
    const hx = ex + Math.sin(rad(fa)) * LOW, hy = ey + Math.cos(rad(fa)) * LOW;
    const col = back ? darken(sleeve, 0.8) : sleeve;
    return (
      <g>
        <path d={`M${sx} ${shoulderY} L${ex} ${ey} L${hx} ${hy}`} stroke={col} strokeWidth={19} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={hx} cy={hy} r={11} fill={back ? skinD : look.skin} />
        {hand ? <g transform={`translate(${hx} ${hy}) rotate(${-fa})`}>{hand}</g> : null}
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      {shadow && <ellipse cx={0} cy={2} rx={62} ry={11} fill="rgba(0,0,0,0.28)" />}
      <g clipPath={sink > 0 ? undefined : undefined}>
        {leg(a2, -14, true)}
        {leg(a1, 14, false)}
      </g>
      <g transform={`rotate(${lean} 0 ${hipY})`}>
        {arm(-armL, -elbowL, -30, true, handL)}
        {/* torso */}
        {look.dress ? (
          <path d={`M-30 ${shoulderY} Q0 ${shoulderY - 10} 30 ${shoulderY} L56 ${hipY + 40} Q0 ${hipY + 56} -56 ${hipY + 40} Z`} fill={look.coat} />
        ) : (
          <g>
            <path d={`M-38 ${shoulderY + 4} Q0 ${shoulderY - 12} 38 ${shoulderY + 4} L42 ${hipY + 14} Q0 ${hipY + 22} -42 ${hipY + 14} Z`} fill={look.coat} />
            {look.vest && <path d={`M-16 ${shoulderY + 2} L16 ${shoulderY + 2} L20 ${hipY + 6} L-20 ${hipY + 6}Z`} fill={look.vest} />}
            <path d={`M0 ${shoulderY} L0 ${hipY + 16}`} stroke={coatD} strokeWidth={3} />
            {[0.35, 0.6, 0.85].map((k) => <circle key={k} cx={7} cy={lerpN(shoulderY, hipY, k)} r={3.5} fill={coatD} />)}
          </g>
        )}
        {look.apron && <path d={`M-28 ${shoulderY + 30} L28 ${shoulderY + 30} L32 ${hipY + 30} L-32 ${hipY + 30}Z`} fill="#e9e2cf" />}
        {look.tie && <path d={`M-9 ${shoulderY - 2} L9 ${shoulderY - 2} L0 ${shoulderY + 10}Z M-4 ${shoulderY + 6} L4 ${shoulderY + 6} L0 ${shoulderY + 34}Z`} fill={look.tie} />}
        {/* head */}
        <g transform={`rotate(${headTilt} 0 ${shoulderY}) translate(0 ${headY})`}>
          <rect x={-11} y={30} width={22} height={24} fill={skinD} />
          {look.hair && <path d="M-58 -6 Q-62 -60 0 -62 Q62 -60 58 -6 Q46 -40 0 -44 Q-46 -40 -58 -6Z" fill={look.hair} />}
          {look.dress && look.hair && <path d="M-58 0 Q-70 40 -46 60 L-40 10Z M58 0 Q70 40 46 60 L40 10Z" fill={look.hair} />}
          <ellipse cx={0} cy={0} rx={55} ry={57} fill={look.skin} />
          <ellipse cx={-50} cy={6} rx={9} ry={13} fill={skinD} />
          {/* face, offset slightly toward facing direction (3/4 view) */}
          <g transform={`translate(${8} 0)`}>
            <ellipse cx={-28} cy={22} rx={9} ry={6} fill="#ff8f8f" opacity={0.35} />
            <ellipse cx={34} cy={22} rx={9} ry={6} fill="#ff8f8f" opacity={0.35} />
            {[-14, 18].map((ex, i) => (
              <g key={i} transform={`translate(${ex} -6)`}>
                <ellipse cx={0} cy={0} rx={10} ry={13 * eyeOpen + 0.5} fill="#fff" />
                {eyeOpen > 0.3 && <circle cx={lk * 4} cy={2 + lookY * 4} r={6} fill="#1d1a22" />}
                {eyeOpen > 0.3 && <circle cx={lk * 4 + 2} cy={-1 + lookY * 4} r={2} fill="#fff" />}
                <path d={`M-11 ${-20 - brows * 6 + (i === 0 ? -brows * 3 : brows * 3)} L11 ${-20 - brows * 6 + (i === 0 ? brows * 3 : -brows * 3)}`}
                  stroke={look.hair ?? '#3b2a20'} strokeWidth={5} strokeLinecap="round" />
              </g>
            ))}
            {look.glasses && <g fill="none" stroke="#333" strokeWidth={3}><circle cx={-14} cy={-6} r={14} /><circle cx={18} cy={-6} r={14} /><path d="M0 -6 H4" /></g>}
            <path d="M4 4 Q10 14 2 16" stroke={skinD} strokeWidth={4} fill="none" strokeLinecap="round" />
            <g transform="translate(2 30)"><MouthShape m={mouth} talk={talk} /></g>
            {look.mustache && <path d="M-20 24 Q-6 14 2 22 Q10 14 24 24 Q12 30 2 26 Q-8 30 -20 24Z" fill={look.hair ?? '#3b2a20'} />}
            {look.beard && <path d="M-44 14 Q-40 64 4 66 Q48 64 50 14 Q40 46 4 46 Q-34 46 -44 14Z" fill={look.hair ?? '#3b2a20'} />}
          </g>
          <HatShape h={look.hat ?? 'none'} c={look.hatColor ?? '#222'} />
        </g>
        {arm(armR, elbowR, 30, false, handR)}
      </g>
    </g>
  );
};

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ready-made cast (original designs). */
export const CAST: Record<string, Look> = {
  narratorMan: { skin: '#f2c9a0', coat: '#3f5a7a', pants: '#2e3440', hat: 'top', hatColor: '#26222a', hair: '#4a3020', mustache: true, vest: '#a8443a', tie: '#2a2a2a' },
  guest: { skin: '#f6d2b0', coat: '#7b4d8a', pants: '#3a3046', hat: 'night', hatColor: '#d9e4f2', hair: '#8a5a30' },
  lady: { skin: '#e8b98f', coat: '#b0413e', pants: '#5a2a2a', hat: 'bonnet', hatColor: '#f0d9a8', hair: '#5a3622', dress: true },
  engineer: { skin: '#efc39b', coat: '#2f3e46', pants: '#262a30', hat: 'none', hair: '#6b6b6b', beard: true, glasses: true, vest: '#c9a227', tie: '#7a2222' },
  pullman: { skin: '#f3cba5', coat: '#1f2a44', pants: '#20242e', hat: 'bowler', hatColor: '#2b2b33', hair: '#3a2416', vest: '#7c5a2a', tie: '#9d2f2f' },
  worker1: { skin: '#d9a47a', coat: '#6d4c35', pants: '#3a4a5a', hat: 'cap', hatColor: '#4f5b45', hair: '#2a1a10', sleeves: '#d8c8a8', mustache: true },
  worker2: { skin: '#a8714f', coat: '#4a5d6e', pants: '#4a3a2a', hat: 'cap', hatColor: '#6a4a2a', hair: '#1a1210', sleeves: '#c8b898' },
  worker3: { skin: '#f0c095', coat: '#7a6a3a', pants: '#2f3b2f', hat: 'cap', hatColor: '#333', hair: '#a0582a', sleeves: '#e0d0b0', beard: true },
  owner: { skin: '#f0c6a0', coat: '#5a2e2e', pants: '#2a2020', hat: 'top', hatColor: '#3a2a2a', hair: '#ccc', mustache: true, vest: '#e0c060', tie: '#222' },
  clerk: { skin: '#e9bd94', coat: '#2c4a3a', pants: '#2a2a2a', hat: 'none', hair: '#2a1a10', vest: '#ddd', tie: '#a02020', mustache: true },
  sick: { skin: '#d8d6a8', coat: '#5a5a6a', pants: '#3a3a44', hat: 'cap', hatColor: '#3a3a3a', hair: '#3a2a1a' },
};
