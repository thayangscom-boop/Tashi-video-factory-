import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hotel } from '../components/Hotel';
import { CAST, Person } from '../components/Person';
import { Camera, Clouds, Lamp, Layer, Planks, Sky, Skyline } from '../components/World';
import { kf, pop, prog, useSceneTime } from '../lib/anim';
import { walking } from '../lib/poses';

/** Dusk over a raised, paved, gas-lit Chicago. Crane up and out. */
export const SceneOutro: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const G = 1520;
  const lights = prog(t, cue(2) - 0.1, cue(2) + 0.5);
  const cam = { x: kf(t, [[-0.4, 540], [5, 560]]), y: kf(t, [[-0.4, 1380], [cue(2), 1150], [5, 900]]), z: kf(t, [[-0.4, 1.35], [cue(2), 1.0], [5, 0.62]]) };
  const end = pop(t, 3.35, 0.5);
  return (
    <AbsoluteFill>
      <Camera cam={cam} t={t}>
        <Sky id="s9" top="#1f2f5a" mid="#c4647a" bottom="#ffb36b" glow="#ffd08a" glowX={760} glowY={1150} />
        {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={(i * 137) % 2400 - 700} cy={-300 + ((i * 89) % 700)} r={2 + (i % 3)} fill="#fff" opacity={0.3 + lights * 0.5} />)}
        <Layer p={0.25}><Clouds t={t} y={300} color="#e88a7a" n={6} seed={51} opacity={0.7} /></Layer>
        {/* lake glimmer */}
        <Layer p={0.4}><rect x={-1500} y={1180} width={4000} height={80} fill="#4a5a8a" /><rect x={-1500} y={1190} width={4000} height={6} fill="#ffcf8a" opacity={0.6} /></Layer>
        <Layer p={0.5}><Skyline y={G - 180} color="#4a3a5a" seed={53} windows={lights > 0.1 ? '#ffd27a' : undefined} smoke={0.5} t={t} x0={-1500} x1={2600} /></Layer>
        <Layer p={0.75}><Skyline y={G - 60} color="#3a2a44" seed={57} windows={lights > 0.3 ? '#ffcf70' : undefined} x0={-1500} x1={2600} /></Layer>
        <Hotel x={540} y={G} s={0.9} lift={0} t={t} lit={0.4 + lights * 0.5} jacks={false} night />
        <rect x={-2000} y={G} width={5000} height={1600} fill="#55555e" />
        {Array.from({ length: 50 }).map((_, i) => <rect key={i} x={-2000 + i * 100} y={G + 40 + (i % 2) * 30} width={90} height={24} rx={6} fill="#6a6a74" />)}
        <Planks x={-2000} y={G} w={5000} h={26} color="#8a7058" />
        {[-260, 160, 920, 1340].map((lx, i) => <Lamp key={i} x={lx} y={G + 10} lit={lights} />)}
        {[0, 1, 2].map((i) => {
          const px = -300 + ((t * 130 + i * 500) % 1700);
          return <Person key={i} frame={frame} x={px} y={G + 160 + i * 40} s={0.75} look={[CAST.lady, CAST.narratorMan, CAST.engineer][i]} blinkSeed={i} pose={walking(t, 1.6, i, { mouth: 'smile' })} />;
        })}
      </Camera>
      <div style={{ position: 'absolute', top: 220, width: '100%', textAlign: 'center', opacity: Math.min(1, end * 1.5), transform: `scale(${0.8 + 0.2 * end})` }}>
        <div style={{ fontFamily: 'Anton', fontSize: 92, color: '#fff', WebkitTextStroke: '10px #111', paintOrder: 'stroke fill', lineHeight: 1.05 }}>THE RAISING<br />OF CHICAGO</div>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 44, color: '#ffd23f', WebkitTextStroke: '8px #111', paintOrder: 'stroke fill', marginTop: 10 }}>1850s – 1860s</div>
      </div>
    </AbsoluteFill>
  );
};
