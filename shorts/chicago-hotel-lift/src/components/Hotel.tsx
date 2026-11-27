import React from 'react';
import { rand } from '../lib/anim';
import { Cribbing, Jackscrew } from './World';

export const HOTEL_W = 960;
export const HOTEL_H = 150 + 5 * 118 + 40; // ground floor + 5 floors + cornice

/**
 * The Tremont House (stylised, original drawing): grand brick hotel.
 * Origin: bottom-centre of the foundation at its ORIGINAL ground level y.
 * lift = how far the building has been raised (px). Gap is filled with cribbing + jackscrews.
 */
export const Hotel: React.FC<{
  x: number; y: number; s?: number; lift?: number; t?: number; turn?: number; lit?: number;
  jacks?: boolean; guests?: boolean; night?: boolean; sign?: boolean;
}> = ({ x, y, s = 1, lift = 0, t = 0, turn = 0, lit = 0.55, jacks = true, guests = true, night = false, sign = true }) => {
  const w = HOTEL_W;
  const brick = night ? '#7a3f34' : '#a5523f';
  const brickD = night ? '#5e2f27' : '#86412f';
  const stone = night ? '#a39b8a' : '#d9cfb8';
  const floors = 5;
  const fh = 118;
  const gh = 150;
  const top = -(gh + floors * fh);
  const cols = 9;
  const gap = w / cols;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* lifting gap contents (drawn behind building) */}
      {jacks && lift > 2 && (
        <g>
          <rect x={-w / 2 + 10} y={-lift} width={w - 20} height={lift} fill="#2a1d15" />
          {Array.from({ length: 9 }).map((_, i) => {
            const jx = -w / 2 + 60 + i * ((w - 120) / 8);
            return i % 2 === 0
              ? <Cribbing key={i} x={jx} y={0} h={lift} w={70} />
              : <Jackscrew key={i} x={jx} y={0} s={0.7} turn={turn + i * 0.13} ext={Math.max(0, lift / 0.7 - 112)} />;
          })}
        </g>
      )}
      <g transform={`translate(0 ${-lift})`}>
        {/* foundation */}
        <rect x={-w / 2} y={-40} width={w} height={40} fill={stone} />
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={-w / 2 + i * 80} x2={-w / 2 + i * 80} y1={-40} y2={0} stroke="rgba(0,0,0,0.18)" strokeWidth={2} />)}
        {/* main block */}
        <rect x={-w / 2} y={top - 40} width={w} height={-top} fill={brick} />
        {Array.from({ length: Math.floor(-top / 14) }).map((_, r) => <line key={r} x1={-w / 2} x2={w / 2} y1={top - 40 + r * 14} y2={top - 40 + r * 14} stroke="rgba(0,0,0,0.08)" strokeWidth={2} />)}
        {/* corner pilasters */}
        <rect x={-w / 2} y={top - 40} width={36} height={-top} fill={brickD} />
        <rect x={w / 2 - 36} y={top - 40} width={36} height={-top} fill={brickD} />
        {/* string courses */}
        {Array.from({ length: floors + 1 }).map((_, f) => <rect key={f} x={-w / 2 - 6} y={-40 - gh - f * fh - 6} width={w + 12} height={10} fill={stone} />)}
        {/* upper windows */}
        {Array.from({ length: floors }).map((_, f) =>
          Array.from({ length: cols }).map((__, c) => {
            const id = f * 13 + c * 7;
            const on = rand(id + 0.5) < lit;
            const wx = -w / 2 + c * gap + gap / 2 - 24;
            const wy = -40 - gh - (f + 1) * fh + 22;
            const guest = guests && on && rand(id + 9.1) > 0.45;
            const bobY = Math.sin(t * 2 + id) * 2;
            return (
              <g key={`${f}-${c}`}>
                <path d={`M${wx - 8} ${wy + 78} V${wy + 10} Q${wx + 24} ${wy - 22} ${wx + 56} ${wy + 10} V${wy + 78}Z`} fill={stone} />
                <path d={`M${wx} ${wy + 72} V${wy + 12} Q${wx + 24} ${wy - 12} ${wx + 48} ${wy + 12} V${wy + 72}Z`} fill={on ? '#ffcf70' : night ? '#1e2836' : '#3b4b5c'} />
                {guest && (
                  <g transform={`translate(${wx + 24} ${wy + 58 + bobY})`}>
                    <rect x={-14} y={0} width={28} height={16} rx={6} fill={['#6a4a8a', '#3a5a7a', '#8a3a3a'][id % 3]} />
                    <circle cx={0} cy={-8} r={11} fill="#f2c9a0" />
                    {rand(id + 3) > 0.5 && <path d="M-11 -12 Q0 -30 11 -12Z" fill="#e8eef6" />}
                  </g>
                )}
                {on && <path d={`M${wx} ${wy + 72} V${wy + 12} Q${wx + 24} ${wy - 12} ${wx + 48} ${wy + 12} V${wy + 72}Z`} fill="#fff6d0" opacity={0.18} />}
                <line x1={wx + 24} x2={wx + 24} y1={wy + 2} y2={wy + 72} stroke={stone} strokeWidth={3} />
                <line x1={wx} x2={wx + 48} y1={wy + 40} y2={wy + 40} stroke={stone} strokeWidth={3} />
                <rect x={wx - 10} y={wy + 74} width={68} height={8} fill={stone} />
              </g>
            );
          }))}
        {/* ground floor arcade */}
        {Array.from({ length: cols }).map((_, c) => {
          const ax = -w / 2 + c * gap + 10;
          const door = c === 4;
          return (
            <g key={`g${c}`}>
              <path d={`M${ax + 6} -40 V${-40 - gh + 50} Q${ax + gap / 2 - 4} ${-40 - gh + 4} ${ax + gap - 26} ${-40 - gh + 50} V-40Z`} fill={door ? '#3a2416' : lit > 0.2 ? '#ffd88a' : '#33404e'} />
              {door && <g><rect x={ax + 18} y={-40 - 96} width={gap - 56} height={96} fill="#5a3620" /><line x1={ax + gap / 2 - 9} x2={ax + gap / 2 - 9} y1={-136} y2={-40} stroke="#3a2416" strokeWidth={4} /></g>}
              <rect x={ax + gap - 24} y={-40 - gh} width={14} height={gh} fill={stone} />
            </g>
          );
        })}
        {/* cornice + sign */}
        <rect x={-w / 2 - 24} y={top - 60} width={w + 48} height={28} fill={stone} />
        {Array.from({ length: 24 }).map((_, i) => <rect key={i} x={-w / 2 - 14 + i * 41} y={top - 32} width={16} height={14} fill={stone} />)}
        <rect x={-w / 2 - 10} y={top - 74} width={w + 20} height={16} fill={brickD} />
        {sign && (
          <g>
            <rect x={-260} y={top - 150} width={520} height={82} fill="#1f2a3a" stroke="#d8b860" strokeWidth={6} rx={8} />
            <text x={0} y={top - 92} textAnchor="middle" fill="#f3d58a" fontFamily="Anton" fontSize={54} letterSpacing={6}>TREMONT HOUSE</text>
            <rect x={-200} y={-40 - gh - 2} width={400} height={0} />
          </g>
        )}
        {/* flagpole */}
        <line x1={380} x2={380} y1={top - 74} y2={top - 250} stroke="#333" strokeWidth={6} />
        <path d={`M383 ${top - 248} q60 ${8 + Math.sin(t * 5) * 8} 110 ${Math.sin(t * 5 + 1) * 10} l0 50 q-50 ${Math.sin(t * 5) * 10} -110 0Z`} fill="#c8362e" />
      </g>
    </g>
  );
};
