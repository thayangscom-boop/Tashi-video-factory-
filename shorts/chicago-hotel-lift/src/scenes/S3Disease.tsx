import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CAST, Person } from '../components/Person';
import { Building, Camera, Sky } from '../components/World';
import { kf, pop, rand, useSceneTime } from '../lib/anim';
import { idle } from '../lib/poses';

const Poster: React.FC<{ x: number; y: number; p: number; rot: number; big?: boolean }> = ({ x, y, p, rot, big }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + (1 - Math.min(1, p)) * 25}) scale(${p})`}>
    <rect x={-130} y={-170} width={260} height={340} fill="#efe3c2" stroke="#8a7a5a" strokeWidth={4} />
    <text x={0} y={-90} textAnchor="middle" fontFamily="Anton" fontSize={big ? 64 : 58} fill="#7a1a14">CHOLERA</text>
    <rect x={-100} y={-70} width={200} height={6} fill="#7a1a14" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-100} y={-40 + i * 34} width={200 - (i % 2) * 50} height={12} fill="#6a5a44" opacity={0.6} />)}
    <circle cx={0} cy={-168} r={8} fill="#555" />
  </g>
);

/** Waste with nowhere to go; cholera returns again and again. */
export const SceneDisease: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const G = 1400;
  const cam = {
    x: kf(t, [[-0.3, 460], [cue(2), 520], [3.9, 560]]),
    y: kf(t, [[-0.3, 1560], [cue(1) + 0.5, 1460], [cue(2) + 0.2, 1080], [3.9, 1040]]),
    z: kf(t, [[-0.3, 1.7], [cue(1) + 0.5, 1.5], [cue(2) + 0.2, 1.0], [3.9, 1.08]]),
  };
  const cough = Math.max(0, Math.sin(t * 7)) * (t > cue(1) ? 1 : 0);
  return (
    <AbsoluteFill>
      <Camera cam={cam} t={t}>
        <Sky id="s3" top="#1e2a26" mid="#3b4a3a" bottom="#5f6b4a" />
        <Building x={-400} y={G} w={560} floors={4} fh={130} wall="#5a4a3a" roof="#2a2018" lit={0.15} seed={21} wood />
        <Building x={720} y={G} w={600} floors={4} fh={130} wall="#4e4436" roof="#2a2018" lit={0.1} seed={22} wood />
        <rect x={160} y={G - 900} width={560} height={900} fill="#2a2a22" />
        <rect x={-800} y={G} width={2800} height={1000} fill="#3d3a2a" />
        {/* stagnant gutter */}
        <path d={`M-600 ${G + 140} Q540 ${G + 110} 1700 ${G + 160} L1700 ${G + 260} Q540 ${G + 240} -600 ${G + 270}Z`} fill="#5d6b2a" />
        <path d={`M-600 ${G + 150} Q540 ${G + 120} 1700 ${G + 170}`} stroke="#8a9a3a" strokeWidth={6} fill="none" opacity={0.6} />
        {Array.from({ length: 14 }).map((_, i) => {
          const bx = rand(i * 3.1) * 1300 - 100, ph = (t * 0.6 + rand(i)) % 1;
          return <circle key={i} cx={bx} cy={G + 190 + rand(i) * 40} r={4 + ph * 10} fill="none" stroke="#a6b44a" strokeWidth={3} opacity={1 - ph} />;
        })}
        {/* debris */}
        <rect x={250} y={G + 160} width={90} height={22} fill="#6a4a2a" transform={`rotate(-12 295 ${G + 170})`} />
        <circle cx={620} cy={G + 190} r={22} fill="#7a6a4a" />
        {/* flies */}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={470 + Math.sin(t * (5 + i) + i) * 80} cy={G + 120 + Math.cos(t * (6 + i) + i * 2) * 40} r={4} fill="#111" />
        ))}
        {/* sick man on a step */}
        <rect x={340} y={G - 40} width={340} height={40} fill="#5a5040" />
        <Person frame={frame} x={510} y={G - 40} s={1.15} look={CAST.sick} blinkSeed={6}
          pose={idle(t, 2, { squash: 0.86, lean: 14 + cough * 8, headTilt: 10 + cough * 6, armR: 120 - cough * 10, elbowR: 100, armL: 30, elbowL: 50, mouth: cough > 0.5 ? 'o' : 'frown', brows: 1, eyes: 0.55 })}
          handR={<rect x={-14} y={-6} width={30} height={24} fill="#eee" rx={4} />} />
        <Poster x={220} y={G - 640} p={pop(t, cue(2), 0.4)} rot={-4} big />
        <Poster x={820} y={G - 700} p={pop(t, cue(3), 0.4)} rot={5} />
        <Poster x={-60} y={G - 760} p={pop(t, cue(3) + 0.45, 0.4)} rot={-8} />
        <Poster x={1080} y={G - 520} p={pop(t, cue(3) + 0.8, 0.4)} rot={7} />
      </Camera>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(20,40,10,0.55))' }} />
    </AbsoluteFill>
  );
};
