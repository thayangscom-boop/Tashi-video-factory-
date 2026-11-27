import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hotel } from '../components/Hotel';
import { CAST, Person } from '../components/Person';
import { Camera, Clouds, Jackscrew, Layer, Sky, Skyline } from '../components/World';
import { clamp, kf, pop, prog, rand, useSceneTime } from '../lib/anim';
import { cranking, idle, talk, walking } from '../lib/poses';
import { LowerThird } from './S4Plan';

const Counter: React.FC<{ t: number; t0: number; to: number; label: string; y: number }> = ({ t, t0, to, label, y }) => {
  const p = pop(t, t0, 0.4);
  const n = Math.round(to * clamp((t - t0) / 0.7));
  return (
    <div style={{ position: 'absolute', top: y, width: '100%', textAlign: 'center', opacity: clamp(p * 2), transform: `scale(${0.6 + 0.4 * p})` }}>
      <span style={{ fontFamily: 'Anton', fontSize: 120, color: '#ffd23f', WebkitTextStroke: '10px #111', paintOrder: 'stroke fill', letterSpacing: 2 }}>{n.toLocaleString('en-US')}</span>
      <span style={{ fontFamily: 'Anton', fontSize: 64, color: '#fff', WebkitTextStroke: '8px #111', paintOrder: 'stroke fill', marginLeft: 18 }}>{label}</span>
    </div>
  );
};

/** Shot A: young Pullman arrives with partners. */
const Arrival: React.FC<{ t: number; frame: number; cue: (k: number) => number }> = ({ t, frame, cue }) => {
  const G = 1500;
  const cam = { x: kf(t, [[-0.4, 380], [cue(2) + 0.6, 520]]), y: kf(t, [[-0.4, 1300], [cue(2) + 0.6, 1200]]), z: kf(t, [[-0.4, 1.45], [cue(2) + 0.6, 1.1]]) };
  const walkEnd = cue(1) + 0.3;
  const px = kf(t, [[-0.4, -40], [walkEnd, 380]], (n) => n);
  const point = prog(t, walkEnd, walkEnd + 0.3);
  return (
    <Camera cam={cam} t={t}>
      <Sky id="s7" top="#5d86b3" mid="#a9c4d8" bottom="#efe3c6" />
      <Layer p={0.3}><Clouds t={t} y={240} color="#ffffff" n={6} seed={31} /></Layer>
      <Layer p={0.6}><Skyline y={G - 160} color="#a1a9b4" seed={33} /></Layer>
      <Hotel x={760} y={G} s={0.95} lift={0} t={t} lit={0.5} jacks={false} />
      <rect x={-1500} y={G} width={4000} height={1500} fill="#7a5d40" />
      {[0, 1].map((i) => (
        <Person key={i} frame={frame} x={px - 170 - i * 150} y={G + 120 + i * 20} s={0.95} look={i ? { ...CAST.owner, hat: 'bowler', hatColor: '#3a3030', coat: '#4a4a3a' } : { ...CAST.narratorMan, coat: '#5a4a6a' }} blinkSeed={i + 4}
          pose={t < walkEnd ? walking(t, 1.8, i + 1, { mouth: 'smile' }) : idle(t, i, { mouth: 'smile', look: 1 })} />
      ))}
      <Person frame={frame} x={px} y={G + 140} s={1.05} look={CAST.pullman} blinkSeed={1}
        pose={t < walkEnd ? walking(t, 1.8, 0, { mouth: 'grin' }) : idle(t, 0, { armR: 30 + point * 110, elbowR: 10, mouth: 'grin', talk: talk(t) * 0.6, brows: 0.5, look: 1, lookY: -0.6, headTilt: -6 })} />
    </Camera>
  );
};

/** Shot B: the crawlspace under the hotel — rows of men and jackscrews receding into the dark. */
const Underneath: React.FC<{ t: number; frame: number; cue: (k: number) => number }> = ({ t, frame, cue }) => {
  // each signal = one coordinated small turn
  const signals = [cue(7) + 0.3, cue(8) + 0.1, cue(9) + 0.1];
  let crank = 0;
  signals.forEach((s) => { crank += prog(t, s, s + 0.6); });
  const lift = crank * 10;
  const dust = signals.map((s) => prog(t, s + 0.2, s + 1.4, (n) => n)).reduce((a, b) => Math.max(a, b > 0 && b < 1 ? 1 - b : 0), 0);
  const whistle = prog(t, cue(5) - 0.1, cue(5) + 0.1) * (1 - prog(t, cue(5) + 0.9, cue(5) + 1.1));
  const rows = [0.34, 0.44, 0.57, 0.74];
  const reveal = cue(6) - 0.2;
  const cam = t < cue(5) - 0.3
    ? { x: kf(t, [[cue(3) - 0.5, 540], [cue(5) - 0.3, 540]]), y: kf(t, [[cue(3) - 0.5, 1000], [cue(5) - 0.3, 1060]]), z: kf(t, [[cue(3) - 0.5, 1.0], [cue(5) - 0.3, 1.06]]) }
    : t < reveal
      ? { x: 300, y: 1060, z: 2.1 } // whistle close-up on Pullman
      : { x: kf(t, [[reveal, 560], [cue(7) + 0.4, 560], [cue(9) + 1, 540]]), y: kf(t, [[reveal, 1340], [cue(7) + 0.4, 1200], [cue(9) + 1, 1060]]), z: kf(t, [[reveal, 2.4], [cue(7) + 0.4, 1.3], [cue(9) + 1, 1.0]]) };
  return (
    <Camera cam={cam} t={t} shake={crank % 1 > 0.05 && crank % 1 < 0.95 ? 2.5 : 0}>
      {/* the underside of the hotel = a heavy ceiling of beams */}
      <rect x={-1000} y={-1000} width={3200} height={4000} fill="#1c140f" />
      <g transform={`translate(0 ${-lift})`}>
        <rect x={-1000} y={-1000} width={3200} height={1640} fill="#a5523f" />
        {Array.from({ length: 40 }).map((_, r) => <line key={r} x1={-1000} x2={2200} y1={-1000 + r * 41} y2={-1000 + r * 41} stroke="rgba(0,0,0,0.1)" strokeWidth={3} />)}
        <rect x={-1000} y={600} width={3200} height={60} fill="#d9cfb8" />
        {Array.from({ length: 16 }).map((_, i) => <rect key={i} x={-1000 + i * 210} y={650} width={150} height={60} fill="#6a4a2a" stroke="#3a2416" strokeWidth={4} />)}
      </g>
      {/* lanterns */}
      {[120, 540, 960].map((lx, i) => (
        <g key={i}><circle cx={lx} cy={800 - lift} r={160} fill="#ffb347" opacity={0.16 + Math.sin(t * 6 + i) * 0.02} /><rect x={lx - 14} y={770 - lift} width={28} height={40} rx={6} fill="#ffcf73" /></g>
      ))}
      {/* ground */}
      <path d="M-1000 900 L2200 900 L2200 3000 L-1000 3000Z" fill="#3a2a1e" />
      {/* receding rows of jackscrews + workers (far to near) */}
      {rows.map((sc, r) => {
        const y = 800 + sc * 640;
        const count = Math.round(5.2 / sc);
        const spacing = 1400 / count;
        const dim = 0.35 + sc * 0.6;
        return (
          <g key={r} opacity={Math.min(1, dim + 0.1)}>
            {Array.from({ length: count + 2 }).map((_, i) => {
              const x = -160 + i * spacing + (r % 2) * spacing * 0.5;
              const own = crank + rand(r * 50 + i) * 0.04;
              return (
                <g key={i}>
                  <line x1={x} x2={x} y1={y - 150 * sc - 20} y2={700 - lift} stroke="#5a3a22" strokeWidth={9 * sc} opacity={0.8} />
                  <Jackscrew x={x} y={y} s={sc * 1.2} turn={own} ext={20 + lift * 2} />
                  <Person frame={frame} blinkSeed={r * 9 + i} x={x - 70 * sc} y={y + 18 * sc} s={sc * 0.95}
                    look={[CAST.worker1, CAST.worker2, CAST.worker3][(i + r) % 3]} pose={cranking(own + 0.1, i, { mouth: crank % 1 > 0.05 && crank % 1 < 0.95 ? 'grimace' : 'flat' })} />
                </g>
              );
            })}
          </g>
        );
      })}
      {/* falling dust */}
      {dust > 0 && Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={rand(i) * 1100} cy={720 + (1 - dust) * 500 * rand(i * 3)} r={3 + rand(i * 2) * 4} fill="#d8c8a8" opacity={dust * 0.8} />
      ))}
      {/* Pullman with whistle */}
      <rect x={150} y={1250} width={200} height={110} fill="#6a4a2a" stroke="#3a2416" strokeWidth={6} />
      <Person frame={frame} x={250} y={1252} s={1.05} look={CAST.pullman} blinkSeed={2}
        pose={idle(t, 0, { armR: 40 + whistle * 120, elbowR: 30 + whistle * 70, armL: 120 * (t > reveal ? 1 : 0), elbowL: 20, mouth: whistle > 0.5 ? 'o' : 'grin', brows: whistle, eyes: whistle > 0.5 ? 0.3 : 1 })}
        handR={whistle > 0.2 ? <rect x={-20} y={-10} width={30} height={14} rx={6} fill="#c9a227" /> : undefined} />
      {whistle > 0.5 && [0, 1, 2].map((k) => <path key={k} d={`M${330 + k * 26} ${930 - k * 8} q 20 -20 40 0`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.8} transform={`translate(${(t * 80) % 30} 0)`} />)}
    </Camera>
  );
};

export const SceneJacks: React.FC = () => {
  const { t, cue, frame } = useSceneTime();
  const cut = cue(3) - 0.25;
  return (
    <AbsoluteFill>
      {t < cut ? <Arrival t={t} frame={frame} cue={cue} /> : <Underneath t={t} frame={frame} cue={cue} />}
      <LowerThird t={t} t0={cue(1) - 0.1} t1={cut - 0.2} title="GEORGE PULLMAN" sub="Building raiser, age ~30" />
      {t > cut && t < cue(5) - 0.2 && <>
        <Counter t={t} t0={cue(3)} to={500} label="MEN" y={250} />
        <Counter t={t} t0={cue(4)} to={5000} label="JACKSCREWS" y={420} />
      </>}
      {t > cue(5) - 0.15 && t < cue(5) + 1.0 && (
        <div style={{ position: 'absolute', top: 360, width: '100%', textAlign: 'center', transform: `scale(${pop(t, cue(5) - 0.1, 0.3)})` }}>
          <span style={{ fontFamily: 'Anton', fontSize: 110, color: '#fff', background: '#b3261e', padding: '4px 30px', borderRadius: 16 }}>TWEEET!</span>
        </div>
      )}
      {[7, 8, 9].map((k, i) => (t > cue(k) + 0.25 && t < cue(k) + 1.0) ? (
        <div key={k} style={{ position: 'absolute', top: 300, width: '100%', textAlign: 'center', transform: `scale(${pop(t, cue(k) + 0.25, 0.3)})` }}>
          <span style={{ fontFamily: 'Anton', fontSize: 92, color: '#ffd23f', WebkitTextStroke: '8px #111', paintOrder: 'stroke fill' }}>TURN #{i + 1}</span>
        </div>
      ) : null)}
    </AbsoluteFill>
  );
};
