import { createContext, useContext } from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import timing from '../timing.json';

export type Caption = { text: string; start: number; end: number };
export type Line = { id: string; scene: string; start: number; dur: number; captions: Caption[] };
export const TIMING = timing as { fps: number; totalSeconds: number; totalFrames: number; lines: Line[] };

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.15, 0.7, 0.2, 1);
export const easeIn = Easing.bezier(0.6, 0, 0.9, 0.4);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Keyframe interpolation on seconds. keys: [time, value][] */
export const kf = (t: number, keys: [number, number][], e: (n: number) => number = ease) =>
  interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e,
  });

/** 0..1 progress between two times */
export const prog = (t: number, a: number, b: number, e: (n: number) => number = ease) =>
  e(clamp((t - a) / Math.max(b - a, 1e-6)));

/** Damped spring-ish overshoot pop 0..1 starting at t0 */
export const pop = (t: number, t0: number, dur = 0.45) => {
  const x = clamp((t - t0) / dur);
  if (x <= 0) return 0;
  return 1 - Math.exp(-6 * x) * Math.cos(x * 9);
};

/** deterministic pseudo random */
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type SceneCtx = { line: Line; lead: number };
export const SceneContext = createContext<SceneCtx | null>(null);

/** Seconds since the scene's narration started (negative during the incoming transition). */
export const useSceneTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctx = useContext(SceneContext)!;
  const t = frame / fps - ctx.lead;
  /** time (s, scene-relative) when caption k appears */
  const cue = (k: number) => ctx.line.captions[Math.min(k, ctx.line.captions.length - 1)].start;
  return { t, cue, line: ctx.line, frame };
};
