import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CAST, Person } from '../components/Person';
import { Building, Camera } from '../components/World';
import { kf, pop, prog, rand, useSceneTime } from '../lib/anim';
import { idle, talk } from '../lib/poses';

export const LowerThird: React.FC<{ t: number; t0: number; t1: number; title: string; sub: string }> = ({ t, t0, t1, title, sub }) => {
  const p = prog(t, t0, t0 + 0.4) * (1 - prog(t, t1, t1 + 0.3));
  return (
    <div style={{ position: 'absolute', left: 60, top: 300, transform: `translateX(${(1 - p) * -700}px)`, opacity: p }}>
      <div style={{ fontFamily: 'Anton', fontSize: 64, color: '#fff', background: '#b3261e', padding: '6px 26px', letterSpacing: 2, display: 'inline-block' }}>{title}</div>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 38, color: '#1a1a1a', background: '#f3e7c9', padding: '6px 26px', display: 'table' }}>{sub}</div>
    </div>
  );
};

const Office: React.FC<{ t: number; cue: (k: number) => number; frame: number }> = ({ t, cue, frame }) => {
  const unroll = prog(t, cue(2) - 0.1, cue(2) + 0.5);
  const turnToUs = prog(t, cue(1) - 0.2, cue(1) + 0.2);
  const cam = { x: kf(t, [[-0.3, 560], [2.8, 520]]), y: kf(t, [[-0.3, 1100], [2.8, 1060]]), z: kf(t, [[-0.3, 1.0], [2.8, 1.22]]) };
  const idea = pop(t, cue(2) + 0.3, 0.4);
  return (
    <Camera cam={cam} t={t}>
      <rect x={-1000} y={-1000} width={3200} height={4000} fill="#4a3a30" />
      {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-1000 + i * 110} y={-1000} width={50} height={4000} fill="#54423a" />)}
      <rect x={-1000} y={1500} width={3200} height={1200} fill="#2e2018" />
      {/* window with rain */}
      <rect x={640} y={420} width={360} height={520} fill="#5c6c80" stroke="#2a1d15" strokeWidth={20} />
      <line x1={820} x2={820} y1={420} y2={940} stroke="#2a1d15" strokeWidth={12} />
      {Array.from({ length: 16 }).map((_, i) => <line key={i} x1={660 + rand(i) * 320} x2={655 + rand(i) * 320} y1={430 + ((t * 600 + rand(i * 3) * 500) % 500)} y2={460 + ((t * 600 + rand(i * 3) * 500) % 500)} stroke="#c8d8e8" strokeWidth={3} />)}
      {/* lamp glow */}
      <circle cx={260} cy={900} r={360} fill="#ffcf73" opacity={0.22} />
      <path d="M200 860 L320 860 L290 780 L230 780Z" fill="#2f6a4a" />
      <rect x={252} y={860} width={14} height={240} fill="#2a1d15" />
      {/* engineer */}
      <Person frame={frame} x={500} y={1500} s={1.75} look={CAST.engineer} blinkSeed={1}
        pose={idle(t, 0, {
          armR: 70 + unroll * 30 + idea * 60, elbowR: 40 - idea * 30, armL: 60, elbowL: 30,
          look: 0.6 - turnToUs * 0.6, headTilt: -5 + idea * 6, mouth: idea > 0.5 ? 'grin' : 'smile', talk: t < cue(2) ? talk(t) * 0.7 : 0, brows: idea * 0.8,
        })}
        handR={idea > 0.5 ? <rect x={-4} y={-40} width={8} height={50} fill="#d8b04a" /> : undefined} />
      {/* drafting table */}
      <path d="M40 1260 L1000 1180 L1020 1230 L60 1320Z" fill="#7a5030" />
      <rect x={120} y={1300} width={30} height={260} fill="#5a3a20" /><rect x={900} y={1230} width={30} height={320} fill="#5a3a20" />
      <g transform="translate(220 1210) rotate(-5)">
        <rect x={0} y={0} width={620 * unroll} height={90} fill="#2a5a8a" />
        {unroll > 0.2 && <path d={`M30 60 H${560 * unroll} M60 20 V80 M${300 * unroll} 30 a20 20 0 1 0 1 0`} stroke="#cfe6ff" strokeWidth={3} fill="none" />}
        <ellipse cx={620 * unroll} cy={45} rx={16} ry={48} fill="#3a6a9a" />
      </g>
      {/* idea spark */}
      <g transform={`translate(760 640) scale(${idea})`} opacity={1 - prog(t, cue(3) - 0.5, cue(3))}>
        {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={0} y1={0} x2={Math.cos(i * 0.785) * 70} y2={Math.sin(i * 0.785) * 70} stroke="#ffd23f" strokeWidth={10} strokeLinecap="round" transform={`translate(${Math.cos(i * 0.785) * 30} ${Math.sin(i * 0.785) * 30})`} />)}
      </g>
    </Camera>
  );
};

const Diagram: React.FC<{ t: number; cue: (k: number) => number; frame: number }> = ({ t, cue, frame }) => {
  const OLD = 1340;
  const FT = 24; // px per foot
  const pipeDrop = prog(t, cue(3) - 0.05, cue(3) + 0.35, (n) => n * n);
  const fill = prog(t, cue(5) - 0.2, cue(7) + 0.2);
  const newY = OLD - fill * 14 * FT;
  const label = pop(t, cue(7), 0.45);
  const onTop = pop(t, cue(4), 0.4);
  const shovel = Math.sin(t * 6);
  const cam = { x: kf(t, [[cue(3) - 0.4, 540], [cue(7) + 1, 560]]), y: kf(t, [[cue(3) - 0.4, 1150], [cue(6), 1080], [cue(7) + 1, 1060]]), z: kf(t, [[cue(3) - 0.4, 1.15], [cue(7) + 1, 1.0]]) };
  return (
    <Camera cam={cam} t={t}>
      <rect x={-1000} y={-1000} width={3200} height={4000} fill="#123456" />
      {Array.from({ length: 60 }).map((_, i) => <line key={i} x1={-1000 + i * 60} x2={-1000 + i * 60} y1={-1000} y2={3000} stroke="#2a5a86" strokeWidth={2} />)}
      {Array.from({ length: 60 }).map((_, i) => <line key={`h${i}`} x1={-1000} x2={2200} y1={-1000 + i * 60} y2={-1000 + i * 60} stroke="#2a5a86" strokeWidth={2} />)}
      <text x={540} y={560} textAnchor="middle" fill="#cfe6ff" fontFamily="Anton" fontSize={58} letterSpacing={4}>THE PLAN · CROSS-SECTION</text>
      {/* buildings stay at the old level */}
      <Building x={-420} y={OLD} w={400} floors={3} fh={120} wall="#8a6a4a" roof="#3a2a20" lit={0.4} seed={31} />
      <Building x={1100} y={OLD} w={400} floors={3} fh={120} wall="#7a5d44" roof="#3a2a20" lit={0.4} seed={32} />
      {/* old ground */}
      <rect x={-1000} y={OLD} width={3200} height={1400} fill="#5b4330" />
      <rect x={-1000} y={OLD} width={3200} height={8} fill="#3a2a1e" />
      {/* fill dirt */}
      <rect x={0} y={newY} width={1080} height={OLD - newY} fill="#8a6a44" />
      {Array.from({ length: 24 }).map((_, i) => <circle key={i} cx={30 + rand(i) * 1020} cy={OLD - rand(i * 3) * (OLD - newY)} r={5 + rand(i * 7) * 7} fill="#6f5434" />)}
      {fill > 0.02 && <rect x={0} y={newY - 14} width={1080} height={16} fill="#6e6e72" />}
      {fill > 0.02 && Array.from({ length: 18 }).map((_, i) => <rect key={`c${i}`} x={i * 60 + 4} y={newY - 12} width={52} height={12} rx={4} fill="#8a8a90" />)}
      {/* sewer pipe laid ON the old street */}
      <g transform={`translate(540 ${-500 + pipeDrop * (OLD - 95 + 500)})`} opacity={pipeDrop > 0 ? 1 : 0}>
        <circle r={95} fill="#b0553a" stroke="#7a3422" strokeWidth={10} />
        <circle r={64} fill="#2a1a12" />
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={Math.cos(i * 0.52) * 66} y1={Math.sin(i * 0.52) * 66} x2={Math.cos(i * 0.52) * 92} y2={Math.sin(i * 0.52) * 92} stroke="#7a3422" strokeWidth={4} />)}
      </g>
      <g transform={`translate(540 ${OLD - 250}) scale(${onTop})`} opacity={1 - fill}>
        <rect x={-190} y={-60} width={380} height={70} rx={14} fill="#ffd23f" />
        <text x={0} y={-8} textAnchor="middle" fontFamily="Anton" fontSize={46} fill="#1a1a1a">SEWER ON TOP</text>
        <path d="M0 10 L-20 40 L20 40Z" fill="#ffd23f" transform="rotate(180 0 25)" />
      </g>
      {/* shovelling workers ride up with the fill */}
      {[220, 860].map((wx, i) => (
        <Person key={wx} frame={frame} x={wx} y={newY - 6} s={0.8} face={i ? -1 : 1} look={i ? CAST.worker1 : CAST.worker3} blinkSeed={i + 2}
          pose={{ ...idle(t, i), lean: 18 + shovel * 10, armR: 70 + shovel * 40, elbowR: 30, armL: 60 + shovel * 30, elbowL: 40, mouth: 'grimace', squash: 0.94 }}
          handR={<g><line x1={0} y1={0} x2={110} y2={0} stroke="#7a5a30" strokeWidth={8} /><path d="M100 -18 L150 -22 L150 22 L100 18Z" fill="#888" /></g>} />
      ))}
      {/* measuring arrow */}
      <g opacity={Math.min(1, fill * 3)}>
        <line x1={1030} x2={1030} y1={OLD} y2={newY} stroke="#fff" strokeWidth={6} />
        <path d={`M1010 ${newY + 26} L1030 ${newY} L1050 ${newY + 26}`} stroke="#fff" strokeWidth={6} fill="none" />
        <line x1={1000} x2={1060} y1={OLD} y2={OLD} stroke="#fff" strokeWidth={6} />
      </g>
      <g transform={`translate(800 ${newY - 120}) scale(${label})`}>
        <rect x={-210} y={-70} width={420} height={110} rx={18} fill="#b3261e" />
        <text x={0} y={18} textAnchor="middle" fontFamily="Anton" fontSize={84} fill="#fff">UP TO 14 FT</text>
      </g>
      <text x={-240} y={OLD + 70} fill="#f3e7c9" fontFamily="Anton" fontSize={40} opacity={pipeDrop}>OLD STREET</text>
      {fill > 0.3 && <text x={60} y={newY - 40} fill="#fff" fontFamily="Anton" fontSize={40}>NEW STREET</text>}
    </Camera>
  );
};

export const ScenePlan: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const cut = cue(3) - 0.35;
  const iris = prog(t, cut, cut + 0.35);
  return (
    <AbsoluteFill>
      <Office t={t} cue={cue} frame={frame} />
      {t > cut && <AbsoluteFill style={{ clipPath: `circle(${iris * 120}% at 70% 40%)` }}><Diagram t={t} cue={cue} frame={frame} /></AbsoluteFill>}
      <LowerThird t={t} t0={cue(1) - 0.1} t1={cue(3) - 0.6} title="ELLIS S. CHESBROUGH" sub="Engineer, Chicago sewer board" />
    </AbsoluteFill>
  );
};
