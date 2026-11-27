import type { Pose } from '../components/Person';

/** Natural idle: subtle breathing + weight shift. */
export const idle = (t: number, seed = 0, extra: Pose = {}): Pose => ({
  squash: 1 + Math.sin(t * 2.2 + seed) * 0.012,
  lean: Math.sin(t * 0.9 + seed) * 1.5,
  headTilt: Math.sin(t * 0.7 + seed * 2) * 3,
  armL: 8 + Math.sin(t * 2.2 + seed) * 2,
  armR: 8 + Math.sin(t * 2.2 + seed + 1) * 2,
  elbowL: 12, elbowR: 12,
  ...extra,
});

/** Walk cycle. speed = steps per second. */
export const walking = (t: number, speed = 1.8, seed = 0, extra: Pose = {}): Pose => {
  const ph = t * speed * Math.PI + seed;
  return {
    walk: ph, stride: 24,
    bob: -Math.abs(Math.cos(ph)) * 6,
    armL: Math.sin(ph) * 22, armR: -Math.sin(ph) * 22, elbowL: 18, elbowR: 18,
    lean: 4, headTilt: Math.sin(ph * 2) * 1.5,
    ...extra,
  };
};

/** Worker cranking a jackscrew handle; crank = 0..1 progress of a turn. */
export const cranking = (crank: number, seed = 0, extra: Pose = {}): Pose => {
  const a = crank * Math.PI * 2;
  return {
    squash: 0.9 + Math.sin(a) * 0.03,
    lean: 16 + Math.sin(a) * 6,
    armR: 70 + Math.cos(a + seed) * 28, elbowR: 30 + Math.sin(a) * 20,
    armL: 55 + Math.cos(a + seed + 0.5) * 24, elbowL: 34 + Math.sin(a) * 16,
    headTilt: 6 + Math.sin(a) * 3,
    mouth: 'grimace', brows: -0.5,
    ...extra,
  };
};

/** talking mouth flap from time */
export const talk = (t: number, on = true) => (on ? Math.max(0, Math.sin(t * 17) * 0.6 + Math.sin(t * 7.3) * 0.4) : 0);
