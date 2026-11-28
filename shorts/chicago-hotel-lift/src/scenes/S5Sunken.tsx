import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CAST, Person } from '../components/Person';
import { Building, Camera, Clouds, Lamp, Layer, Sky, Skyline } from '../components/World';
import { kf, pop, prog, rand, useSceneTime } from '../lib/anim';
import { idle, walking } from '../lib/poses';

const Outside: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const OLD = 1480, NEW = 1180;
  const cam = { x: kf(t, [[-0.3, 440], [2.3, 560]]), y: kf(t, [[-0.3, 1200], [2.3, 1260]]), z: kf(t, [[-0.3, 0.98], [2.3, 1.12]]) };
  const tag = pop(t, 0.9, 0.4);
  return (
    <Camera cam={cam} t={t}>
      <Sky id="s5" top="#6f93b8" mid="#bcd0dc" bottom="#e6e0cc" />
      <Layer p={0.3}><Clouds t={t} y={260} color="#f4f6f8" n={6} seed={11} /></Layer>
      <Layer p={0.6}><Skyline y={NEW - 120} color="#9aa3ad" seed={17} smoke={0.7} t={t} /></Layer>
      <Building x={-120} y={OLD} w={560} floors={4} fh={125} wall="#9a5a44" roof="#3a2a20" lit={0.3} seed={41} sign="BOOTS & SHOES" />
      <Building x={500} y={OLD} w={620} floors={4} fh={125} wall="#86684a" roof="#3a2a20" lit={0.3} seed={42} sign="HARDWARE" />
      {/* the raised street: an embankment of fill right up against the facades */}
      <rect x={-1200} y={NEW} width={1080} height={1400} fill="#8a6a44" />
      <rect x={1120} y={NEW} width={1300} height={1400} fill="#8a6a44" />
      <rect x={-120} y={OLD} width={1240} height={1000} fill="#8a6a44" />
      {/* cut-away: fill against the facade, drawn translucent so the buried doors show */}
      <rect x={-120} y={NEW} width={1240} height={OLD - NEW} fill="#8a6a44" opacity={0.55} />
      <rect x={-120} y={NEW} width={1240} height={OLD - NEW} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="14 10" opacity={0.7} />
      <rect x={-1200} y={NEW - 14} width={3600} height={18} fill="#7a7a80" />
      {Array.from({ length: 26 }).map((_, i) => <rect key={i} x={-1200 + i * 120} y={NEW - 12} width={110} height={14} rx={4} fill="#9a9aa0" />)}
      {/* cut-away trench showing the buried doors */}
      {Array.from({ length: 20 }).map((_, i) => <circle key={i} cx={-100 + rand(i) * 1200} cy={NEW + 20 + rand(i * 3) * (OLD - NEW - 40)} r={6 + rand(i * 5) * 8} fill="#6f5434" />)}
      <line x1={-200} x2={1300} y1={OLD} y2={OLD} stroke="#fff" strokeWidth={5} strokeDasharray="18 14" opacity={tag} />
      <g transform={`translate(540 ${OLD + 70}) scale(${tag})`}>
        <rect x={-200} y={-46} width={400} height={62} rx={12} fill="#0e2a3d" opacity={0.85} />
        <text x={0} y={2} textAnchor="middle" fill="#fff" fontFamily="Anton" fontSize={38}>OLD GROUND FLOOR</text>
      </g>
      {/* pedestrians now walk past at the second-floor windows */}
      {[0, 1, 2].map((i) => {
        const px = ((t * 120 + i * 420) % 1500) - 200;
        return <Person key={i} frame={frame} x={px} y={NEW - 4} s={0.7} look={[CAST.lady, CAST.narratorMan, CAST.worker2][i]} blinkSeed={i} pose={walking(t, 1.7, i, { mouth: 'smile' })} />;
      })}
      <Lamp x={120} y={NEW - 4} s={0.8} /><Lamp x={980} y={NEW - 4} s={0.8} />
    </Camera>
  );
};

const Doorway: React.FC<{ t: number; cue: (k: number) => number; frame: number }> = ({ t, cue, frame }) => {
  const open = prog(t, cue(2), cue(2) + 0.5);
  const fall = prog(t, cue(4), cue(4) + 0.4, (n) => n * n);
  const shock = prog(t, cue(3) + 0.1, cue(3) + 0.3);
  const cam = { x: kf(t, [[cue(2) - 0.3, 540], [cue(4) + 1, 470]]), y: kf(t, [[cue(2) - 0.3, 1060], [cue(4) + 1, 960]]), z: kf(t, [[cue(2) - 0.3, 1.0], [cue(4) + 1, 1.35]]) };
  return (
    <Camera cam={cam} t={t} shake={fall > 0 && fall < 1 ? 8 : 0}>
      {/* shop interior */}
      <rect x={-800} y={-600} width={2800} height={3200} fill="#6b5240" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-800 + i * 240} y={-600} width={12} height={3200} fill="#5a4434" />)}
      <rect x={-800} y={1500} width={2800} height={1000} fill="#3a2a20" />
      {/* shelves with boots */}
      {[0, 1, 2].map((r) => <g key={r}><rect x={-300} y={560 + r * 260} width={420} height={18} fill="#4a3020" />
        {[0, 1, 2].map((k) => <path key={k} d={`M${-270 + k * 130} ${560 + r * 260} v-80 h40 v50 h40 v30z`} fill="#3a2418" />)}</g>)}
      {/* door frame */}
      <rect x={300} y={520} width={460} height={980} fill="#3a2418" />
      {/* the wall of dirt behind the door */}
      <rect x={330} y={550} width={400} height={950} fill="#7a5a3a" />
      {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={340 + rand(i * 1.1) * 380} cy={560 + rand(i * 2.3) * 930} r={6 + rand(i * 4) * 12} fill={i % 3 ? '#5f4428' : '#8f6f4a'} />)}
      <path d={`M380 ${700} q40 30 20 70 q-20 40 30 80`} stroke="#c88a8a" strokeWidth={10} fill="none" strokeLinecap="round" transform={`translate(${Math.sin(t * 3) * 6} 0)`} />
      <path d="M600 560 q-10 60 20 100 M640 560 q20 40 0 90" stroke="#4a3018" strokeWidth={5} fill="none" />
      {/* door swinging inward */}
      <g transform={`translate(330 550) scale(${1 - open * 0.85} 1)`}>
        <rect x={0} y={0} width={400} height={950} fill="#6a3e22" stroke="#3a2010" strokeWidth={8} />
        <rect x={50} y={60} width={300} height={360} fill="#5a341c" /><rect x={50} y={500} width={300} height={380} fill="#5a341c" />
        <circle cx={360} cy={500} r={14} fill="#d9b44a" />
      </g>
      {/* falling clods */}
      {fall > 0 && Array.from({ length: 12 }).map((_, i) => (
        <circle key={i} cx={360 + rand(i) * 360 + fall * (rand(i * 2) - 0.5) * 300} cy={900 + rand(i * 3) * 200 + fall * 520} r={14 + rand(i * 4) * 18} fill="#6f5434" opacity={1 - fall * 0.3} />
      ))}
      {fall > 0 && <ellipse cx={530} cy={1500} rx={60 + fall * 220} ry={20 + fall * 30} fill="#6f5434" />}
      <Person frame={frame} x={kf(t, [[cue(2) - 0.2, 140], [cue(3), 230]])} y={1520} s={1.65} look={{ ...CAST.clerk, apron: true }} blinkSeed={5}
        pose={idle(t, 1, {
          armR: 60 + shock * 80, elbowR: 30 - shock * 20, armL: 30 + shock * 90, elbowL: 30,
          mouth: shock > 0.5 ? 'open' : 'smile', brows: shock * 1.2, look: 1 - shock * 1.4, lean: -shock * 8, eyes: 1 + shock * 0.2,
        })} />
    </Camera>
  );
};

export const SceneSunken: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const cut = cue(2) - 0.2;
  return (
    <AbsoluteFill>
      {t < cut ? <Outside t={t} frame={frame} /> : <Doorway t={t} cue={cue} frame={frame} />}
    </AbsoluteFill>
  );
};
