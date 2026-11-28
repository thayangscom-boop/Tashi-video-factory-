import TLjson from './liftTimeline.json';
import { clamp, lerp, rnd, seg } from './kit';
import { HOTEL } from './sets';

/** Single source of truth for the lift sequence. tools/make_preview_audio.py reads the same JSON,
 *  so every sound effect lands on the frame where the action happens. */
export const TL = TLjson;
export const STREET = 3.35; // height of the new street grade above the old one
export const LIFT0 = 0.66; // building already resting on jacks + cribbing
const STEP = 0.06; // rise per coordinated turn
export const LIFT_END = STREET - HOTEL.base; // ground floor level with the new street
export const PULL = TL.pull;
export const STROKES = TL.strokes;
const [T0, T1] = TL.timelapse;

export const pulls = (t: number) => STROKES.reduce((a, s) => a + seg(t, s, s + PULL), 0);
export const liftAt = (t: number) => LIFT0 + pulls(t) * STEP + (LIFT_END - LIFT0 - STROKES.length * STEP) * seg(t, T0, T1);
/** 0 = working daylight, 1 = dusk (time passes during the time-lapse) */
export const todAt = (t: number) => seg(t, T0 - 0.05, T1);
export const inLapse = (t: number) => t > T0 - 0.05 && t < T1 + 0.05;
/** bar angle: reach (0.25) -> hauled (-0.75) -> re-set */
export const barAngle = (t: number, off = 0) => {
  if (inLapse(t)) return lerp(0.25, -0.75, 0.5 - 0.5 * Math.cos((t - T0) * Math.PI * 2 * 3.2 + off * 30));
  let a = 0.2;
  for (const s0 of STROKES) {
    const s = s0 + off;
    if (t >= s - 0.2) a = lerp(0.2, 0.3, seg(t, s - 0.2, s)); // anticipation
    if (t >= s) a = lerp(0.3, -0.75, seg(t, s, s + PULL)); // heave
    if (t >= s + PULL + 0.14) a = lerp(-0.75, 0.2, seg(t, s + PULL + 0.14, s + PULL + 0.5)); // walk the bar back
  }
  return a;
};
export const effort = (t: number, off = 0) => inLapse(t) ? 0.6
  : STROKES.reduce((m, s) => Math.max(m, seg(t, s + off - 0.1, s + off + 0.1) * (1 - seg(t, s + off + PULL, s + off + PULL + 0.25))), 0);
export const joltAt = (t: number) => STROKES.reduce((m, s) => Math.max(m, seg(t, s + 0.05, s + 0.14) * (1 - seg(t, s + 0.16, s + PULL + 0.1))), 0);
/** per-man timing offset so the crew is in unison but not robotic */
export const manOff = (i: number) => (rnd(i * 3.7 + 1) - 0.5) * 0.08;
export const shotAt = (t: number) => { let k = 0; TL.cuts.forEach((c, i) => { if (t >= c) k = i; }); return k; };
export { clamp };
