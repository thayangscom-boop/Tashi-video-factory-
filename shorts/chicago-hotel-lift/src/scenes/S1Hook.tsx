import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hotel } from '../components/Hotel';
import { CAST, Person } from '../components/Person';
import { Camera, Clouds, Lamp, Layer, Planks, Skyline, Sky } from '../components/World';
import { kf, pop, prog, useSceneTime } from '../lib/anim';
import { cranking, idle } from '../lib/poses';

const GROUND = 1500;

/** Window close-up: calm guest sipping tea while the world drops past outside. */
const WindowCloseup: React.FC<{ t: number; frame: number; cue: (k: number) => number }> = ({ t, frame, cue }) => {
  const drift = (t - 3) * 60; // the outside world slides down as the hotel rises
  const sip = prog(t, cue(3) + 0.1, cue(3) + 0.6) - prog(t, cue(4) - 0.1, cue(4) + 0.3);
  const lookAt = prog(t, cue(4), cue(4) + 0.25);
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {/* interior */}
      <rect width={1080} height={1920} fill="#5e3b3b" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 96} y={0} width={40} height={1920} fill="#6b4444" />)}
      <rect x={0} y={1180} width={1080} height={740} fill="#3b2620" />
      {/* lamp */}
      <circle cx={840} cy={640} r={240} fill="#ffcf73" opacity={0.25} />
      <rect x={826} y={660} width={28} height={420} fill="#2a1d15" />
      <path d="M760 660 L920 660 L880 540 L800 540Z" fill="#f2c46a" />
      {/* framed picture */}
      <rect x={140} y={430} width={260} height={200} fill="#c9a24a" /><rect x={160} y={450} width={220} height={160} fill="#6f8fa8" />
      <path d="M160 610 L240 530 L300 580 L340 540 L380 610Z" fill="#4a6a4a" />
      {/* guest */}
      <Person frame={frame} x={470} y={1330} s={2.2} look={CAST.guest} blinkSeed={3}
        pose={idle(t, 1, {
          armR: 40 + sip * 75, elbowR: 70 + sip * 40, armL: 35, elbowL: 60,
          headTilt: -4 + lookAt * 10, look: lookAt * 1, lookY: lookAt * 0.3,
          mouth: lookAt > 0.5 ? 'smile' : sip > 0.6 ? 'o' : 'flat', brows: lookAt * 0.6,
        })}
        handR={<g><path d="M-6 -24 h34 l-4 30 h-26z" fill="#f6f2ea" stroke="#9a8a7a" strokeWidth={2} /><path d="M28 -18 q14 4 0 16" stroke="#f6f2ea" strokeWidth={5} fill="none" /></g>}
      />
      {/* table hides legs */}
      <rect x={120} y={1260} width={840} height={60} fill="#7a4a2a" rx={10} />
      <rect x={160} y={1320} width={760} height={600} fill="#5a341c" />
      <ellipse cx={720} cy={1256} rx={70} ry={12} fill="#f0ebe0" />
      <path d="M690 1250 h60 l-6 -44 h-48z" fill="#d8e2ea" stroke="#8a9aa8" strokeWidth={3} />
      {/* window frame (we look in from outside) */}
      <g>
        <path d="M0 0 H1080 V1920 H0Z M120 1520 V420 Q540 60 960 420 V1520Z" fill="#a5523f" fillRule="evenodd" />
        {Array.from({ length: 70 }).map((_, r) => <line key={r} x1={0} x2={1080} y1={r * 28 - (drift % 28)} y2={r * 28 - (drift % 28)} stroke="rgba(0,0,0,0.08)" strokeWidth={3} />)}
        <path d="M120 1520 V420 Q540 60 960 420 V1520" stroke="#d9cfb8" strokeWidth={40} fill="none" />
        <rect x={60} y={1500} width={960} height={60} fill="#d9cfb8" />
        <line x1={540} x2={540} y1={200} y2={1520} stroke="#d9cfb8" strokeWidth={16} />
        {/* glass sheen */}
        <path d="M150 1500 L150 600 L360 300 L420 300 L210 1500Z" fill="#fff" opacity={0.07} />
      </g>
      {/* outside lamp top sliding down = we are rising */}
      <g transform={`translate(1010 ${1450 + drift * 2})`}><rect x={-8} y={0} width={16} height={600} fill="#22262b" /><path d="M-30 0 L30 0 L22 -64 L-22 -64Z" fill="#ffd98a" stroke="#22262b" strokeWidth={6} /></g>
    </svg>
  );
};

export const SceneHook: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const lift = 70 + Math.max(0, t + 0.2) * 34; // continuous rise
  const turn = t * 1.4;
  // camera: punchy push-out reveal, then push into a window
  const cam = {
    x: kf(t, [[-0.2, 640], [1.6, 540], [3.0, 540], [3.9, 650]]),
    y: kf(t, [[-0.2, 1330], [1.6, 1020], [3.0, 980], [3.9, 760]]),
    z: kf(t, [[-0.2, 1.55], [1.6, 0.86], [3.0, 0.9], [3.9, 4.2]]),
  };
  const closeup = prog(t, cue(3) - 0.15, cue(3) + 0.1);
  const badge = pop(t, 0.05, 0.5);
  const workers = [-340, -170, 0, 170, 340];
  return (
    <AbsoluteFill>
      <Camera cam={cam} t={t} shake={kf(t, [[0, 6], [0.6, 1.5]])}>
        <Sky id="s1" top="#3b5f8a" mid="#e9a46a" bottom="#f6d6a0" glow="#ffd9a0" glowX={760} glowY={1100} />
        <Layer p={0.2}><Clouds t={t} y={300} color="#f3c9a6" n={7} seed={2} /></Layer>
        <Layer p={0.45}><Skyline y={GROUND - 140} color="#8a6f78" seed={4} smoke={1} t={t} /></Layer>
        <Layer p={0.7}><Skyline y={GROUND - 40} color="#6a4f58" seed={9} windows="#ffd27a" /></Layer>
        {/* street */}
        <rect x={-2000} y={GROUND} width={5000} height={1600} fill="#6a5040" />
        <Planks x={-2000} y={GROUND} w={5000} h={30} />
        <Hotel x={540} y={GROUND} s={0.9} lift={lift} t={t} turn={turn} lit={0.6} />
        {/* foreground workers turning screws in front of the foundation */}
        {workers.map((dx, i) => (
          <Person key={i} frame={frame} blinkSeed={i} x={540 + dx} y={GROUND + 110} s={0.62}
            face={i % 2 ? -1 : 1} look={[CAST.worker1, CAST.worker2, CAST.worker3][i % 3]}
            pose={cranking(turn + i * 0.2, i)} />
        ))}
        {/* onlookers */}
        <Person frame={frame} x={-60} y={GROUND + 260} s={0.95} look={CAST.lady} blinkSeed={7}
          pose={idle(t, 2, { mouth: 'o', brows: 1, armR: 120, elbowR: 60, look: 1, lookY: -0.6 })} />
        <Person frame={frame} x={1140} y={GROUND + 280} s={1} face={-1} look={CAST.narratorMan} blinkSeed={5}
          pose={idle(t, 4, { mouth: 'open', brows: 1, armR: 150, elbowR: 20, lookY: -1, headTilt: -8 })} />
        <Lamp x={-200} y={GROUND + 240} s={1.1} />
        <Lamp x={1300} y={GROUND + 240} s={1.1} />
      </Camera>
      {closeup > 0 && <AbsoluteFill style={{ opacity: closeup }}><WindowCloseup t={t} frame={frame} cue={cue} /></AbsoluteFill>}
      {/* year badge */}
      <div style={{ position: 'absolute', top: 210, width: '100%', textAlign: 'center', transform: `scale(${badge})`, opacity: Math.min(1, badge * 2) * (1 - prog(t, 4.6, 5.2)) }}>
        <span style={{ fontFamily: 'Anton', fontSize: 70, letterSpacing: 6, color: '#fff', background: '#b3261e', padding: '8px 34px', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>CHICAGO · 1861</span>
      </div>
    </AbsoluteFill>
  );
};
