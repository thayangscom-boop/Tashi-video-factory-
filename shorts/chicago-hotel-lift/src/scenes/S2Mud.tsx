import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CAST, Person } from '../components/Person';
import { Building, Camera, Clouds, Lamp, Layer, MudStreet, Planks, Rain, Sky, Skyline, Wagon } from '../components/World';
import { kf, pop, prog, rand, useSceneTime } from '../lib/anim';
import { idle, walking } from '../lib/poses';

/** Shot A: aerial of the low, flat town beside Lake Michigan. */
const Aerial: React.FC<{ t: number; cue: (k: number) => number }> = ({ t, cue }) => {
  const cam = { x: kf(t, [[-0.4, 520], [4.2, 560]]), y: kf(t, [[-0.4, 820], [4.2, 1060]]), z: kf(t, [[-0.4, 0.82], [4.2, 1.12]]) };
  const lvl = pop(t, cue(3) - 0.1, 0.5);
  const storm = prog(t, 2.6, 4.2);
  return (
    <Camera cam={cam}>
      <Sky id="s2a" top={storm > 0.5 ? '#3d4a5c' : '#6d8db0'} mid="#9fb3c4" bottom="#c9d3d6" />
      <Layer p={0.3}><Clouds t={t} y={250} color="#5c6878" n={8} seed={5} opacity={0.5 + storm * 0.5} /></Layer>
      {/* lake */}
      <rect x={-2000} y={960} width={5000} height={260} fill="#4f7a96" />
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={-800 + rand(i) * 2600 + Math.sin(t + i) * 20} x2={-740 + rand(i) * 2600 + Math.sin(t + i) * 20} y1={980 + rand(i * 3) * 220} y2={980 + rand(i * 3) * 220} stroke="#bcd6e6" strokeWidth={4} opacity={0.6} />
      ))}
      {/* marshy land, barely above the water */}
      <rect x={-2000} y={1200} width={5000} height={2000} fill="#6f7f4a" />
      <rect x={-2000} y={1200} width={5000} height={14} fill="#55663a" />
      {Array.from({ length: 70 }).map((_, i) => {
        const gx = -900 + rand(i * 1.7) * 2900, gy = 1240 + rand(i * 2.9) * 700;
        return <path key={i} d={`M${gx} ${gy} l-8 -40 M${gx} ${gy} l2 -50 M${gx} ${gy} l12 -38`} stroke="#4c5e30" strokeWidth={5} strokeLinecap="round" transform={`rotate(${Math.sin(t * 2 + i) * 4} ${gx} ${gy})`} />;
      })}
      {Array.from({ length: 9 }).map((_, i) => <ellipse key={`w${i}`} cx={-600 + rand(i * 4.1) * 2400} cy={1300 + rand(i * 7.3) * 600} rx={120} ry={24} fill="#5f7f8f" opacity={0.75} />)}
      {/* low wooden town */}
      <g transform="translate(0 1220)">
        {Array.from({ length: 11 }).map((_, i) => (
          <Building key={i} x={-300 + i * 170} y={0} w={150} floors={1 + (i % 3 === 0 ? 1 : 0)} fh={70} wall={['#9b7653', '#86684a', '#a8855e'][i % 3]} roof="#5a4030" lit={0} seed={i} wood door={false} />
        ))}
      </g>
      {/* lake level marker */}
      <g opacity={Math.min(1, lvl)}>
        <line x1={-600} x2={1700} y1={1200} y2={1200} stroke="#fff" strokeWidth={5} strokeDasharray="22 16" />
        <g transform={`translate(560 ${1130}) scale(${lvl})`}>
          <rect x={-250} y={-46} width={500} height={64} rx={14} fill="#0e2a3d" opacity={0.85} />
          <text x={0} y={2} textAnchor="middle" fill="#fff" fontFamily="Anton" fontSize={40} letterSpacing={3}>ONLY A FEW FEET ABOVE THE LAKE</text>
        </g>
      </g>
      {storm > 0 && <Rain t={t} n={140} opacity={storm * 0.45} />}
    </Camera>
  );
};

/** Shot B: street level, a gentleman sinks into the mud. */
const Street: React.FC<{ t: number; cue: (k: number) => number; frame: number }> = ({ t, cue, frame }) => {
  const t0 = cue(4) - 0.1;
  const lt = t - t0;
  const G = 1420;
  const walkStop = cue(6) - 0.2;
  const manX = kf(t, [[t0, 300], [walkStop, 560]], (n) => n);
  const sink = kf(t, [[t0 + 0.4, 0], [walkStop, 34], [cue(6) + 1.2, 70]]);
  const stuck = prog(t, walkStop, walkStop + 0.3);
  const tug = Math.max(0, Math.sin((t - walkStop) * 9)) * stuck;
  const cam = {
    x: kf(t, [[t0, 520], [cue(6), 570]]),
    y: kf(t, [[t0, 1240], [cue(6) - 0.3, 1330], [cue(6) + 1.4, 1480]]),
    z: kf(t, [[t0, 0.95], [cue(6) - 0.3, 1.15], [cue(6) + 1.4, 1.75]]),
  };
  const flash = Math.max(0, 1 - Math.abs(t - 0.62) * 9) + Math.max(0, 1 - Math.abs(t - 0.78) * 12) * 0.6;
  return (
    <>
      <Camera cam={cam} t={t}>
        <Sky id="s2b" top="#2c3646" mid="#4f5d6e" bottom="#77838c" />
        <Layer p={0.25}><Clouds t={t} y={200} color="#3a4554" n={9} seed={8} speed={30} /></Layer>
        <Layer p={0.55}><Skyline y={G - 300} color="#4a5560" seed={13} smoke={0.6} t={t} /></Layer>
        {[-520, -230, 60, 380, 700, 1010, 1300].map((bx, i) => (
          <Building key={i} x={bx} y={G - 40} w={270} floors={2 + (i % 2)} fh={115} wall={['#8a6a4a', '#7a5d44', '#94704c', '#6e5640'][i % 4]} roof="#3a2a20"
            lit={0.35} seed={i + 3} wood awning={i % 3 === 0 ? '#7a3a2e' : undefined} sign={i === 2 ? 'DRY GOODS' : i === 4 ? 'SALOON' : undefined} />
        ))}
        <Planks x={-700} y={G - 40} w={2600} h={26} />
        <MudStreet y={G} t={t} x0={-1200} w={3600} color="#4e3a2a" />
        <Lamp x={140} y={G - 40} /><Lamp x={960} y={G - 40} />
        {/* stuck wagon */}
        <Wagon x={900} y={G + 190} sink={36} wobble={Math.sin(t * 5) * 1.2} s={0.9} />
        <Person frame={frame} x={1080} y={G + 196} s={0.7} face={-1} look={CAST.worker2} blinkSeed={4}
          pose={{ ...idle(t, 3), lean: 24, armR: 100, elbowR: 10, armL: 95, elbowL: 10, mouth: 'grimace', brows: -1, squash: 0.92 }} />
        {/* our gentleman */}
        <g>
          <Person frame={frame} x={manX} y={G + 300 + sink * 0.4} s={1.1} look={CAST.narratorMan} blinkSeed={2}
            pose={t < walkStop ? walking(lt, 1.7, 0, { mouth: 'flat', sink }) :
              { ...idle(t, 1), lean: -10 - tug * 10, armL: 40 + tug * 40, elbowL: 40, armR: 60 + tug * 30, elbowR: 20, mouth: tug > 0.4 ? 'grimace' : 'open', brows: 1, squash: 0.96, headTilt: -6 }} />
          {/* mud swallowing the boots */}
          <ellipse cx={manX} cy={G + 300 + sink * 0.4 - 2} rx={90} ry={26} fill="#4e3a2a" />
          <ellipse cx={manX} cy={G + 300 + sink * 0.4 - 10} rx={70} ry={14} fill="#3b2a1e" />
          {stuck > 0 && [0, 1, 2].map((k) => {
            const ph = ((t * 1.3 + k / 3) % 1);
            return <circle key={k} cx={manX - 40 + k * 40} cy={G + 290 + sink * 0.4 - ph * 30} r={8 + ph * 6} fill="none" stroke="#6b5440" strokeWidth={3} opacity={1 - ph} />;
          })}
        </g>
        <Rain t={t} n={220} opacity={0.5} x0={-600} y0={-200} w={2400} h={2600} />
      </Camera>
      <AbsoluteFill style={{ background: '#e8f0ff', opacity: flash * 0.75 }} />
    </>
  );
};

export const SceneMud: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const cut = cue(4) - 0.1;
  const whiteOut = Math.max(0, 1 - Math.abs(t - cut) * 7);
  return (
    <AbsoluteFill>
      {t < cut ? <Aerial t={t} cue={cue} /> : <Street t={t} cue={cue} frame={frame} />}
      <AbsoluteFill style={{ background: '#dfe9ff', opacity: whiteOut * 0.9 }} />
    </AbsoluteFill>
  );
};
