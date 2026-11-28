import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { TIMING, clamp, pop } from '../lib/anim';

/** Phone-safe, high-contrast captions synced to narration timing. */
export const Captions: React.FC<{ lines?: typeof TIMING.lines }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let active: { text: string; t0: number } | null = null;
  for (const ln of lines ?? TIMING.lines) {
    for (let k = 0; k < ln.captions.length; k++) {
      const c = ln.captions[k];
      const a = ln.start + c.start;
      const isLast = k === ln.captions.length - 1;
      const b = ln.start + (isLast ? c.end + 0.25 : ln.captions[k + 1].start);
      if (t >= a && t < b) active = { text: c.text, t0: a };
    }
  }
  if (!active) return null;
  const p = pop(t, active.t0, 0.35);
  const words = active.text.split(' ');
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: 70, right: 70, top: 1290, display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
        transform: `scale(${0.7 + 0.3 * p}) translateY(${(1 - clamp(p)) * 30}px)`, opacity: clamp(p * 2),
        fontFamily: 'Fredoka', fontWeight: 700, fontSize: 84, lineHeight: 1.08, textAlign: 'center', gap: '0 22px',
      }}>
        {words.map((w, i) => {
          const hot = w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w);
          return (
            <span key={i} style={{
              color: hot ? '#ffd23f' : '#ffffff',
              WebkitTextStroke: '14px #111', paintOrder: 'stroke fill',
              textShadow: '0 8px 18px rgba(0,0,0,0.55)',
              fontSize: hot ? 96 : 84,
            }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
