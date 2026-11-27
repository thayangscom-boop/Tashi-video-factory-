import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hotel } from '../components/Hotel';
import { CAST, Person } from '../components/Person';
import { Camera, Clouds, Lamp, Layer, Planks, Sky, Skyline } from '../components/World';
import { kf, pop, prog, useSceneTime } from '../lib/anim';
import { idle, talk, walking } from '../lib/poses';

/** The Tremont House: grand, busy, and suddenly below the new street. */
export const SceneTremont: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const G = 1500;
  const rise = prog(t, cue(2) - 0.1, cue(3) + 0.8); // new street climbs around the hotel
  const streetY = G - rise * 230;
  const owners = cue(4) - 0.15;
  const cam = t < owners
    ? { x: kf(t, [[-0.4, 540], [cue(2), 540], [owners, 540]]), y: kf(t, [[-0.4, 640], [cue(1) + 0.4, 900], [cue(2) + 0.2, 1060], [owners, 1100]]), z: kf(t, [[-0.4, 1.5], [cue(1) + 0.4, 1.0], [cue(2) + 0.2, 0.86], [owners, 0.9]]) }
    : { x: kf(t, [[owners, 480], [6.5, 520]]), y: kf(t, [[owners, 1300], [6.5, 1260]]), z: kf(t, [[owners, 1.6], [6.5, 1.8]]) };
  const shake = kf(t, [[cue(2) - 0.1, 0], [cue(2) + 0.2, 4], [cue(3) + 0.8, 0]]);
  const sign = pop(t, cue(5) + 0.2, 0.4);
  const nod = Math.sin(t * 9) * (t > cue(5) ? 1 : 0);
  return (
    <AbsoluteFill>
      <Camera cam={cam} t={t} shake={shake}>
        <Sky id="s6" top="#5d86b3" mid="#a9c4d8" bottom="#efe3c6" glow="#fff2c8" glowX={900} glowY={500} />
        <Layer p={0.3}><Clouds t={t} y={240} color="#ffffff" n={6} seed={21} /></Layer>
        <Layer p={0.6}><Skyline y={G - 160} color="#a1a9b4" seed={23} smoke={0.6} t={t} /></Layer>
        <Hotel x={540} y={G} s={0.95} lift={0} t={t} lit={0.5} jacks={false} />
        {/* guests streaming in */}
        {[0, 1, 2, 3].map((i) => {
          const px = kf(t, [[-0.4 + i * 0.5, -120 - i * 80], [3 + i * 0.5, 470 + (i % 2) * 40]], (n) => n);
          return <Person key={i} frame={frame} x={px} y={G + 40} s={0.6} look={[CAST.lady, CAST.narratorMan, CAST.pullman, CAST.guest][i] === CAST.guest ? { ...CAST.guest, hat: 'bowler', hatColor: '#4a3a2a' } : [CAST.lady, CAST.narratorMan, CAST.pullman][i]}
            blinkSeed={i} pose={walking(t, 1.7, i, { mouth: 'smile' })} />;
        })}
        {/* new raised street rising in front, swallowing the ground floor */}
        <rect x={-1500} y={streetY} width={4000} height={2000} fill="#8a6a44" />
        <rect x={-1500} y={streetY - 14} width={4000} height={18} fill="#7a7a80" />
        <Planks x={-1500} y={streetY} w={4000} h={22} color="#a08060" />
        {rise > 0.05 && <g transform={`translate(540 ${streetY + 120}) scale(${Math.min(1, rise * 2)})`}>
          <rect x={-250} y={-50} width={500} height={70} rx={14} fill="#0e2a3d" opacity={0.85} />
          <text x={0} y={2} textAnchor="middle" fill="#fff" fontFamily="Anton" fontSize={42}>▲ NEW STREET LEVEL ▲</text>
        </g>}
        <Lamp x={-80} y={streetY} /><Lamp x={1160} y={streetY} />
        {/* owners: arms crossed, not closing */}
        {t > owners - 0.3 && (
          <g>
            <Person frame={frame} x={360} y={streetY + 6} s={0.9} look={CAST.owner} blinkSeed={3}
              pose={idle(t, 1, { armR: 105, elbowR: 110, armL: 105, elbowL: 110, mouth: 'frown', brows: -1, headTilt: nod * 8, talk: t > cue(5) ? talk(t) : 0 })} />
            <Person frame={frame} x={640} y={streetY + 6} s={0.9} face={-1} look={{ ...CAST.owner, coat: '#2e3a5a', hair: '#8a5a30', hatColor: '#222', vest: '#c04a3a' }} blinkSeed={8}
              pose={idle(t, 3, { armR: 110, elbowR: 110, armL: 110, elbowL: 110, mouth: 'flat', brows: -1, headTilt: -nod * 8 })} />
            <g transform={`translate(500 ${streetY - 260}) rotate(${(1 - sign) * 40}) scale(${sign})`}>
              <line x1={0} y1={0} x2={0} y2={160} stroke="#4a3020" strokeWidth={10} />
              <rect x={-170} y={-70} width={340} height={110} rx={10} fill="#f3e7c9" stroke="#4a3020" strokeWidth={8} />
              <text x={0} y={10} textAnchor="middle" fontFamily="Anton" fontSize={64} fill="#1f6a3a">STILL OPEN</text>
            </g>
          </g>
        )}
      </Camera>
    </AbsoluteFill>
  );
};
