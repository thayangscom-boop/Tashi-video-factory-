import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hotel } from '../components/Hotel';
import { CAST, Person } from '../components/Person';
import { Camera, Clouds, Layer, Planks, Sky, Skyline } from '../components/World';
import { kf, pop, prog, useSceneTime } from '../lib/anim';
import { cranking, idle, talk } from '../lib/poses';

const FT = 30; // px per foot at hotel scale

const Exterior: React.FC<{ t: number; frame: number; cue: (k: number) => number }> = ({ t, frame, cue }) => {
  const G = 1560;
  const p = prog(t, -0.2, cue(3), (n) => n);
  const lift = p * 6 * FT * 0.92;
  const feet = Math.min(6, Math.floor(p * 6.05));
  const cam = { x: kf(t, [[-0.3, 560], [cue(3), 520]]), y: kf(t, [[-0.3, 1260], [cue(3), 1120]]), z: kf(t, [[-0.3, 1.25], [cue(3), 0.92]]) };
  const big = pop(t, cue(2), 0.4);
  return (
    <Camera cam={cam} t={t}>
      <Sky id="s8" top="#4f79a8" mid="#c3a98c" bottom="#f2cf98" glow="#ffe2a8" glowX={200} glowY={900} />
      <Layer p={0.3}><Clouds t={t} y={240} color="#f8e6d0" n={6} seed={41} /></Layer>
      <Layer p={0.6}><Skyline y={G - 170} color="#9a8c90" seed={43} smoke={0.7} t={t} /></Layer>
      <rect x={-1500} y={G} width={4000} height={1500} fill="#8a6a44" />
      <Planks x={-1500} y={G} w={4000} h={24} color="#a08060" />
      <Hotel x={540} y={G} s={0.92} lift={lift} t={t} turn={t * 0.8} lit={0.6} />
      {/* ruler */}
      <g transform={`translate(1010 ${G})`}>
        <rect x={-30} y={-6 * FT * 0.92 - 40} width={60} height={6 * FT * 0.92 + 40} fill="#f3e7c9" stroke="#4a3020" strokeWidth={4} />
        {Array.from({ length: 7 }).map((_, i) => <g key={i}><line x1={-30} x2={0} y1={-i * FT * 0.92} y2={-i * FT * 0.92} stroke="#4a3020" strokeWidth={4} /></g>)}
        <rect x={-30} y={-lift} width={60} height={lift} fill="#ffd23f" opacity={0.7} />
      </g>
      <g transform={`translate(830 ${G - lift - 90})`}>
        <rect x={-110} y={-60} width={220} height={84} rx={14} fill="#b3261e" transform={`scale(${1 + big * 0.25})`} />
        <text x={0} y={2} textAnchor="middle" fontFamily="Anton" fontSize={60} fill="#fff" transform={`scale(${1 + big * 0.25})`}>{feet} FT</text>
      </g>
      {[-330, -110, 110, 330].map((dx, i) => (
        <Person key={i} frame={frame} x={540 + dx} y={G + 120} s={0.6} face={i % 2 ? -1 : 1} look={[CAST.worker1, CAST.worker2, CAST.worker3][i % 3]} blinkSeed={i} pose={cranking(t * 0.9 + i * 0.25, i)} />
      ))}
    </Camera>
  );
};

/** Doll-house cut-away: life goes on inside while the building rises. */
const Cutaway: React.FC<{ t: number; frame: number; cue: (k: number) => number }> = ({ t, frame, cue }) => {
  const rise = (t - cue(3)) * 10;
  const camY = kf(t, [[cue(3) - 0.2, 620], [cue(4) + 0.4, 620], [cue(5) - 0.05, 1060], [cue(5) + 0.5, 1060], [cue(6) - 0.05, 1500], [6.8, 1520]]);
  const cam = { x: 540, y: camY - rise, z: kf(t, [[cue(3) - 0.2, 1.2], [6.8, 1.12]]) };
  const eat = Math.max(0, Math.sin((t - cue(4)) * 5));
  const ding = pop(t, cue(6) + 0.3, 0.3);
  const zz = (t * 0.8) % 1;
  return (
    <Camera cam={cam} t={t}>
      {/* outside world sliding down past the windows */}
      <rect x={-1000} y={-1000} width={3200} height={4000} fill="#b7c9d8" />
      <g transform={`translate(0 ${rise * 0.0})`}>
        <rect x={-1000} y={1800 + 0} width={3200} height={2000} fill="#8a6a44" />
      </g>
      <g transform={`translate(0 ${-rise})`}>
        {/* building shell */}
        <rect x={40} y={200} width={1000} height={1700} fill="#a5523f" />
        {/* rooms */}
        {[
          { y: 300, wall: '#e9d8b4', floor: '#7a5030' },
          { y: 760, wall: '#b8c8d8', floor: '#5a4030' },
          { y: 1220, wall: '#d8b8a0', floor: '#6a3a28' },
        ].map((r, i) => (
          <g key={i}>
            <rect x={80} y={r.y} width={920} height={420} fill={r.wall} />
            {Array.from({ length: 10 }).map((_, k) => <rect key={k} x={80 + k * 92} y={r.y} width={30} height={420} fill="#000" opacity={0.04} />)}
            <rect x={80} y={r.y + 380} width={920} height={40} fill={r.floor} />
            <rect x={720} y={r.y + 60} width={180} height={220} fill="#9cc0dc" stroke="#d9cfb8" strokeWidth={14} />
            <line x1={810} x2={810} y1={r.y + 60} y2={r.y + 280} stroke="#d9cfb8" strokeWidth={8} />
            {/* lamp post outside sliding down = rising */}
            <g transform={`translate(880 ${r.y + 250 + rise * 1.2})`}><rect x={-6} y={0} width={12} height={200} fill="#2a2e33" /><rect x={-16} y={-34} width={32} height={34} fill="#ffd98a" /></g>
            <rect x={720} y={r.y + 280} width={180} height={300} fill={r.wall} />
            <rect x={80} y={r.y - 20} width={920} height={20} fill="#d9cfb8" />
          </g>
        ))}
        {/* dining */}
        <rect x={240} y={560} width={360} height={24} fill="#7a4a2a" /><rect x={260} y={584} width={320} height={96} fill="#f4efe4" />
        <ellipse cx={420} cy={556} rx={50} ry={10} fill="#fff" /><circle cx={420} cy={548} r={16} fill="#c8742e" />
        <Person frame={frame} x={330} y={690} s={0.95} look={CAST.lady} blinkSeed={1}
          pose={idle(t, 0, { armR: 80 + eat * 50, elbowR: 60 + eat * 50, mouth: eat > 0.6 ? 'o' : 'smile', talk: 0, look: 0.5 })} />
        <Person frame={frame} x={520} y={690} s={0.95} face={-1} look={CAST.narratorMan} blinkSeed={4}
          pose={idle(t, 2, { armR: 90, elbowR: 60, mouth: 'smile', talk: talk(t) * 0.8 })}
          handR={<path d="M-6 -24 h30 l-4 26 h-22z" fill="#f6f2ea" stroke="#9a8a7a" strokeWidth={2} />} />
        {/* bedroom */}
        <rect x={180} y={1010} width={460} height={130} rx={14} fill="#6a4a8a" />
        <rect x={160} y={960} width={40} height={180} fill="#4a2e1a" /><rect x={620} y={1000} width={40} height={140} fill="#4a2e1a" />
        <rect x={210} y={985} width={120} height={50} rx={20} fill="#fff" />
        <g transform="translate(480 1004) rotate(-90) scale(0.9)">
          <Person frame={frame} x={0} y={0} s={1} shadow={false} look={CAST.guest} pose={{ eyes: 0, mouth: 'o', armR: 20, armL: 20, headTilt: -4 + Math.sin(t * 2.4) * 2 }} />
        </g>
        <path d="M200 1010 Q420 990 640 1020 L640 1100 L200 1100Z" fill="#8a6ab0" />
        {[0, 1, 2].map((k) => {
          const ph = (zz + k / 3) % 1;
          return <text key={k} x={330 + ph * 120} y={930 - ph * 160} fontFamily="Anton" fontSize={40 + ph * 30} fill="#2a3a6a" opacity={1 - ph}>Z</text>;
        })}
        {/* lobby / check-in */}
        <rect x={420} y={1440} width={420} height={160} fill="#5a341c" />
        <rect x={400} y={1420} width={460} height={30} fill="#7a4a2a" />
        <g transform={`translate(560 1416)`}><path d="M-22 0 Q0 -36 22 0Z" fill="#d9b44a" /><circle cx={0} cy={-34} r={5} fill="#d9b44a" /></g>
        {ding > 0 && <g transform={`translate(560 1340) scale(${ding})`} opacity={1 - prog(t, cue(6) + 0.8, cue(6) + 1.2)}>
          <text x={0} y={0} textAnchor="middle" fontFamily="Anton" fontSize={64} fill="#b3261e">DING!</text></g>}
        <Person frame={frame} x={700} y={1600} s={0.9} face={-1} look={CAST.clerk} blinkSeed={3}
          pose={idle(t, 1, { mouth: 'smile', talk: talk(t) * 0.7, armR: 50, elbowR: 40 })} />
        <Person frame={frame} x={kf(t, [[cue(5), 120], [cue(6), 340]], (n) => n)} y={1600} s={0.95} look={{ ...CAST.pullman, coat: '#6a5a3a', vest: '#2a4a3a' }} blinkSeed={6}
          pose={t < cue(6) ? { ...idle(t, 3), walk: t * 5.4, stride: 22, mouth: 'smile' } : idle(t, 3, { armR: 110 * ding, elbowR: 20, mouth: 'grin' })} />
        <rect x={100} y={1520} width={80} height={80} fill="#7a5a3a" /><rect x={110} y={1490} width={60} height={30} fill="#5a3a2a" />
      </g>
    </Camera>
  );
};

export const SceneRise: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const cut = cue(3) - 0.2;
  return <AbsoluteFill>{t < cut ? <Exterior t={t} frame={frame} cue={cue} /> : <Cutaway t={t} frame={frame} cue={cue} />}</AbsoluteFill>;
};
