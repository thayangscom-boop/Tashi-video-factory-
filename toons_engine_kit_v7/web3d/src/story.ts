// Shot list for "The Lemon Juice Robber": where the camera is, who is on screen and what they do, frame by frame.
// Every shot starts on a spoken word (src/cues.json, written from the narration timing). The camera move of each shot is named.
import cues from "./cues.json";
import { TX, RX } from "./world";
import type { Who } from "./people";
import { hh } from "./people";
import type { Expr } from "@eng/toon";

export const TOTAL: number = cues.TOTAL;
const S = cues.S as Record<string, number>, W = cues.W as Record<string, number>;
type V3 = [number, number, number];
export type Key = { u: number; pos: V3; look: V3; fov: number; roll?: number; cInf?: number };
export type Ctx = {
  t: number; lt: number; d: number; u: number; f: number;
  put: (w: Who) => void;
  doc: (key: string, pos: V3, h: number, roll?: number, yaw?: number) => void;
  train: (k: number, z: number, shake?: number) => void; gap: (w: number) => void; snake: (a: number) => void; prop: (key: string, pos: V3, rot?: V3) => void;
};
export type Shot = {
  id: string; move: string; set: "street"; light: "day" | "golden"; sun?: [number, number]; fog?: [number, number];
  cam: Key[]; focus?: (c: Ctx) => V3; stage: (c: Ctx) => void; kick?: number; hand?: number; shadow?: number; t0: number; t1: number; ox: number;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const ph = (c: Ctx, v = 1.6, seed = 0) => ((c.t * v) / 1.6 + hh(seed, 3)) % 1;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const talk = (c: Ctx, a: Expr = "neutral", b: Expr = "whistle"): Expr => (Math.sin(c.t * 27) + 0.6 * Math.sin(c.t * 43 + 1) > 0.15 ? b : a);
const at = (c: Ctx, w: string, lead = 2 / 30) => c.t >= W[w] - lead;
const F = (w: string) => Math.round((W[w] - 2 / 30) * 30);
const rad = (d: number) => (d * Math.PI) / 180;
/** camera keys for a circle around a point (angle 0 = on the +z side) */
const orbit = (c: V3, r: number, camY: number, a0: number, a1: number, fov: number, cInf = 0, n = 17): Key[] =>
  Array.from({ length: n }, (_, i) => { const u = i / (n - 1), e = u * u * (3 - 2 * u), a = rad(a0 + (a1 - a0) * (0.25 * e + 0.75 * u)); return { u, pos: [c[0] + r * Math.sin(a), camY, c[2] + r * Math.cos(a)] as V3, look: c, fov, cInf }; });
/** dolly zoom: the camera backs away along +z while the lens tightens, so the subject keeps its size and the room closes in */
const dollyZoom = (c: V3, d0: number, d1: number, fov0: number, camY: number, cInf = 0, n = 9): Key[] =>
  Array.from({ length: n }, (_, i) => { const u = i / (n - 1), d = d0 + (d1 - d0) * u; return { u, pos: [c[0], camY, c[2] + d] as V3, look: c, fov: (2 * Math.atan((Math.tan(rad(fov0) / 2) * d0) / d) * 180) / Math.PI, cInf }; });

const KID = { i: 1, o: "kid" } as const, BOSS = { i: 2, o: "boss" } as const, RIV = { i: 3, o: "rival" } as const;
const NR = TX - 0.72;                        // the near rail of our line (the gap we watch is at z = 0)
const G: V3 = [NR, 0.2, 0];
const DAY: [number, number] = [160, 50], HOT: [number, number] = [160, 30];
const crew = (c: Ctx, x: number, zs: number[], o0 = 0, saw = false) => zs.forEach((z, k) => c.put({ i: 50 + k + o0, o: `w${(k + o0) % 3}`, x: x + 0.3 * Math.sin(k * 5), z, view: "front", expr: "neutral", armR: "hold", held: saw ? "saw" : undefined, wave: Math.sin(c.t * 9 + k) }));

const D: Omit<Shot, "t0" | "t1" | "ox">[] = [
  // ---------------------------------------------------------------- L1  A young engineer is sawing gaps into a brand new railroad. On purpose.
  { id: "s01", move: "low side tracking", set: "street", light: "day", sun: DAY, shadow: 22,
    cam: [{ u: 0, pos: [-2.2, 0.4, 5.6], look: [3.0, 0.9, -1.2], fov: 40, cInf: 4 }, { u: 1, pos: [0.3, 0.6, 2.4], look: [3.0, 0.95, -1.2], fov: 40, cInf: 5 }],
    focus: () => [3.0, 0.9, -1.2],
    stage: (c) => { c.put({ ...KID, x: 3.0, y: 0.12, z: -1.2, view: "front", expr: "smile", armR: "hold", held: "saw", tilt: 4 * Math.sin(c.t * 12) }); crew(c, 4.6, [-9, -14]); } },
  { id: "s02", move: "rack focus", set: "street", light: "day", sun: DAY, shadow: 14,
    cam: [{ u: 0, pos: [1.0, 0.5, 1.7], look: [2.75, 0.8, -0.7], fov: 40, cInf: 16 }, { u: 1, pos: [1.05, 0.5, 1.6], look: [2.75, 0.8, -0.7], fov: 40, cInf: 16 }],
    focus: (c) => { const k = sm((c.t - W.purpose + 0.25) / 0.4); return [lerp(NR, 3.0, k), 0.3, lerp(0, -1.2, k)]; },
    stage: (c) => { c.put({ ...KID, x: 3.0, y: 0.12, z: -1.2, view: "front", expr: "grin", armR: "hold", held: "saw" }); } },
  // ---------------------------------------------------------------- L2  Two companies are racing to build a line along the same desert canyon. First to finish wins every customer.
  { id: "s03", move: "aerial drone", set: "street", light: "day", sun: DAY, shadow: 95, fog: [260, 1400],
    cam: [{ u: 0, pos: [22, 34, 96], look: [-30, -12, -10], fov: 56 }, { u: 1, pos: [14, 28, 72], look: [-32, -14, -30], fov: 56 }],
    stage: (c) => { c.train(0, 46 - 5 * c.lt); c.train(1, -8 - 5 * c.lt); crew(c, 1.0, [20, 10, -4, -22, -40]); crew(c, RX + 2, [-30, -44, -58, -70], 1); } },
  { id: "s04", move: "low-angle dolly in", set: "street", light: "day", sun: DAY, shadow: 22,
    cam: [{ u: 0, pos: [-47.4, 0.5, -5.6], look: [-50, 1.35, -10], fov: 42, cInf: 4 }, { u: 1, pos: [-48.2, 0.6, -7.0], look: [-50, 1.4, -10], fov: 40, cInf: 5 }],
    focus: () => [-50, 1.4, -10],
    stage: (c) => { c.put({ ...RIV, x: -50, z: -10, view: "front", expr: "grin", armR: "point" }); crew(c, RX + 0.2, [-16, -21], 1); } },
  // ---------------------------------------------------------------- L3  His boss finds a gap between every rail, as wide as a finger.
  { id: "s05", move: "front tracking", set: "street", light: "day", sun: [200, 50], shadow: 22,
    cam: [{ u: 0, pos: [0.9, 1.3, 8.8], look: [1.2, 1.2, 12.6], fov: 42, cInf: 5 }, { u: 1, pos: [0.9, 1.3, 8.8 - 3.2], look: [1.2, 1.2, 12.6 - 3.2], fov: 42, cInf: 5 }],
    focus: (c) => [1.2, 1.2, 12.6 - 3.2 * c.u],
    stage: (c) => { c.put({ ...BOSS, x: 1.2, z: 12.6 - 3.2 * c.u, view: "front", mode: "march", phase: ph(c, 1.5, 2), expr: c.u > 0.6 ? "shock" : "stern", look: 1 }); } },
  { id: "s06", move: "macro orbit", set: "street", light: "day", sun: DAY, shadow: 12,
    cam: orbit(G, 0.95, 0.52, 232, 300, 34, 12, 9),
    focus: () => G, stage: () => { } },
  // ---------------------------------------------------------------- L4  "Are you trying to ruin me?"
  { id: "s07", move: "dolly zoom", set: "street", light: "day", sun: DAY, shadow: 22,
    cam: dollyZoom([1.2, 1.3, 2], 1.3, 2.5, 62, 1.34, 0),
    stage: (c) => { const sp = c.t > W.l4 - 0.05 && c.t < W.l4e; c.put({ i: 2, o: "bossmad", x: 1.2, z: 2, view: "front", expr: sp ? talk(c, "stern", "shock") : "stern", armR: "up", armL: "up" }); } },
  // ---------------------------------------------------------------- L5  The kid just keeps sawing.
  { id: "s08", move: "over the shoulder", set: "street", light: "day", sun: DAY, shadow: 22,
    cam: [{ u: 0, pos: [0.6, 1.75, 5.9], look: [2.7, 0.95, -1.2], fov: 42, cInf: 4 }, { u: 1, pos: [0.9, 1.7, 5.4], look: [2.7, 0.95, -1.2], fov: 41, cInf: 4 }],
    focus: () => [3, 1, -1.2],
    stage: (c) => { c.put({ i: 2, o: "bossmad", x: 0.35, z: 3.3, view: "front", back: true, armR: "up", armL: "up" }); c.put({ ...KID, x: 3.0, y: 0.12, z: -1.2, view: "front", expr: "smile_closed", armR: "hold", held: "saw", tilt: 5 * Math.sin(c.t * 13) }); } },
  // ---------------------------------------------------------------- L6  The rival lays its rails tight together, smooth as glass. And wins the race.
  { id: "s09", move: "macro product tracking", set: "street", light: "day", sun: [200, 45], shadow: 16,
    cam: [{ u: 0, pos: [RX - 1.5, 0.38, 14], look: [RX - 0.72, 0.2, 9], fov: 36, cInf: 9 }, { u: 1, pos: [RX - 1.5, 0.38, 6], look: [RX - 0.72, 0.2, 1], fov: 36, cInf: 9 }],
    focus: (c) => [RX - 0.72, 0.2, 10 - 8 * c.u],
    stage: (c) => { crew(c, RX + 1.6, [-3, -8], 1); } },
  { id: "s10", move: "crane up", set: "street", light: "day", sun: DAY, shadow: 40,
    cam: [{ u: 0, pos: [-46.6, 1.0, -6], look: [-51, 1.6, 6], fov: 46, cInf: 2 }, { u: 1, pos: [-46.4, 5.2, -9], look: [-51, 1.4, 6], fov: 46, cInf: 2 }],
    focus: () => [-50, 1.4, 2],
    stage: (c) => { c.train(1, 34 - 22 * sm(c.u * 1.1));
      c.put({ ...RIV, x: -49.4, z: 0.5, view: "front", expr: "laugh", armR: "up", armL: "up" });
      for (let k = 0; k < 5; k++) c.put({ i: 60 + k, o: `c${k}`, x: -48.6 - (k % 2) * 0.9, z: 3 + k * 1.3, view: "front", expr: k % 2 ? "grin" : "laugh", armR: "up", armL: k % 2 ? undefined : "up", y: 0.08 * Math.abs(Math.sin(c.t * 8 + k)) }); } },
  // ---------------------------------------------------------------- L7  Their trains whisper along the cliffs. His rattle over every single gap.
  { id: "s11", move: "aerial tracking", set: "street", light: "day", sun: DAY, shadow: 60, fog: [200, 1200],
    cam: [{ u: 0, pos: [-34, 13, 46], look: [-52, 1.5, 24], fov: 44 }, { u: 1, pos: [-34, 13, 16], look: [-52, 1.5, -6], fov: 44 }],
    stage: (c) => { c.train(1, 20 - 30 * c.u); } },
  { id: "s12", move: "handheld low angle", set: "street", light: "day", sun: [200, 45], shadow: 30, hand: 1.6,
    cam: [{ u: 0, pos: [0.3, 0.45, -4.5], look: [3, 1.5, 4], fov: 52 }, { u: 1, pos: [0.3, 0.45, -4.5], look: [3, 1.5, 2], fov: 52 }],
    stage: (c) => { c.train(0, 30 - 40 * c.u, 1); } },
  // ---------------------------------------------------------------- L8  People nickname his line the Rattler. And they all ride the quiet one.
  { id: "s13", move: "push in on the paper", set: "street", light: "day", sun: [170, 60], shadow: 14,
    cam: [{ u: 0, pos: [30, 1.5, 6.6], look: [30, 1.5, 4.0], fov: 35, cInf: 8 }, { u: 1, pos: [30, 1.5, 6.2], look: [30, 1.5, 4.0], fov: 34, cInf: 8 }],
    focus: () => [30, 1.5, 4.4],
    stage: (c) => { const k = 1 - (1 - clamp01(c.lt / 0.4)) ** 3; c.doc("paper", [30, lerp(0.9, 1.56, k), 4.4], 0.8, lerp(-9, -2.5, k) + 1.2 * Math.sin(c.t * 2.2)); } },
  { id: "s14", move: "slow dolly out", set: "street", light: "day", sun: DAY, shadow: 26,
    cam: [{ u: 0, pos: [-1.0, 1.4, 3.6], look: [0.3, 1.1, -2], fov: 40, cInf: 3 }, { u: 1, pos: [-1.6, 1.5, 5.0], look: [0.4, 1.1, -2], fov: 40, cInf: 3 }],
    focus: () => [0.2, 1.2, -2],
    stage: (c) => { c.train(0, -6); c.put({ ...KID, x: 0.8, z: -2.0, view: "front", expr: "neutral" }); c.put({ ...BOSS, x: -0.4, z: -1.7, view: "front", expr: "pained", headTilt: 5 }); } },
  // ---------------------------------------------------------------- L9  Then summer arrives. And his gaps begin to shrink.
  { id: "s15", move: "push in on the thermometer", set: "street", light: "day", sun: [170, 60], shadow: 14,
    cam: [{ u: 0, pos: [30, 1.5, 6.9], look: [30, 1.5, 4.0], fov: 35, cInf: 8 }, { u: 1, pos: [30, 1.5, 6.4], look: [30, 1.5, 4.0], fov: 34, cInf: 8 }],
    focus: () => [30, 1.5, 4.4],
    stage: (c) => { c.doc("thermo", [30, 1.55, 4.4], 1.0, 2 * Math.sin(c.t * 2)); } },
  { id: "s16", move: "macro dolly in", set: "street", light: "day", sun: DAY, shadow: 12,
    cam: [{ u: 0, pos: [1.2, 0.55, 1.0], look: G, fov: 32, cInf: 12 }, { u: 1, pos: [1.6, 0.42, 0.62], look: G, fov: 32, cInf: 12 }],
    focus: () => G, stage: (c) => { c.gap(lerp(0.06, 0.034, sm(c.u * 1.2))); } },
  // ---------------------------------------------------------------- L10  In spring, a coin fits inside. By July, not even a playing card.
  { id: "s17", move: "macro orbit", set: "street", light: "day", sun: DAY, shadow: 12,
    cam: orbit(G, 0.8, 0.5, 240, 275, 34, 12, 7),
    focus: () => G,
    stage: (c) => { c.gap(0.034); const k = sm((c.t - W.coin + 0.45) / 0.3); c.prop("coin", [NR, lerp(0.75, 0.215, k), 0]); } },
  { id: "s18", move: "macro push", set: "street", light: "day", sun: DAY, shadow: 12,
    cam: [{ u: 0, pos: [1.5, 0.5, 0.75], look: [NR, 0.3, 0], fov: 34, cInf: 12 }, { u: 1, pos: [1.62, 0.46, 0.66], look: [NR, 0.3, 0], fov: 34, cInf: 12 }],
    focus: () => G,
    stage: (c) => { c.gap(0.008); const k = clamp01((c.t - W.card + 0.5) / 0.25), b = Math.abs(Math.sin(Math.max(0, c.t - W.card + 0.25) * 9)) * 0.05 * Math.exp(-Math.max(0, c.t - W.card + 0.25) * 2);
      c.prop("card", [NR, lerp(0.9, 0.4, k) + (k >= 1 ? b : 0), 0], [0, 0, 0.12 * Math.sin(c.t * 7)]); } },
  // ---------------------------------------------------------------- L11  "Ha! Even the steel is fixing your mistake."
  { id: "s19", move: "360 orbit", set: "street", light: "golden", sun: HOT, shadow: 22,
    cam: orbit([1.5, 1.2, 1.4], 3.3, 1.45, 10, 250, 42, 3),
    focus: () => [1.5, 1.2, 1.4],
    stage: (c) => { const sp = c.t > W.l11 - 0.05 && c.t < W.l11e;
      c.put({ ...BOSS, x: 0.9, z: 1.5, view: "front", expr: sp ? talk(c, "grin", "laugh") : "grin", armR: "point", tilt: 3 * Math.sin(c.t * 10) }); c.put({ ...KID, x: 2.2, z: 1.2, view: "front", expr: "nervous", look: -1 }); } },
  // ---------------------------------------------------------------- L12  But across the canyon, the smooth rails start to creak. Steel grows in the heat. And theirs has nowhere to go.
  { id: "s20", move: "handheld macro tracking", set: "street", light: "golden", sun: [30, 22], shadow: 16, hand: 0.7,
    cam: [{ u: 0, pos: [RX - 1.6, 0.34, -13], look: [RX - 0.72, 0.2, -8], fov: 36, cInf: 9 }, { u: 1, pos: [RX - 1.5, 0.34, -9.5], look: [RX - 0.72, 0.2, -4.5], fov: 36, cInf: 9 }],
    focus: (c) => [RX - 0.72, 0.2, -9 + 3.5 * c.u],
    stage: (c) => { c.snake(0.05 * Math.sin(c.t * 31) * sm(c.u * 2)); } },
  { id: "s21", move: "low-angle dolly in", set: "street", light: "golden", sun: HOT, shadow: 22,
    cam: [{ u: 0, pos: [-48.3, 0.6, -6.8], look: [-50, 1.4, -10], fov: 42, cInf: 4 }, { u: 1, pos: [-48.9, 0.75, -8.0], look: [-50, 1.42, -10], fov: 40, cInf: 5 }],
    focus: () => [-50, 1.4, -10],
    stage: (c) => { c.put({ ...RIV, x: -50, z: -10, view: "front", expr: "nervous", tilt: 2 * Math.sin(c.t * 9) }); } },
  // ---------------------------------------------------------------- L13  On the hottest day of the year, his gaps close. Rail meets rail. A perfect fit.
  { id: "s22", move: "macro dolly in", set: "street", light: "day", sun: DAY, shadow: 12,
    cam: [{ u: 0, pos: [1.0, 0.7, 1.3], look: G, fov: 32, cInf: 12 }, { u: 1, pos: [1.62, 0.42, 0.6], look: G, fov: 32, cInf: 12 }],
    focus: () => G, stage: (c) => { c.gap(0.008 * (1 - sm((c.t - W.close + 0.5) / 0.6))); } },
  { id: "s23", move: "dolly in", set: "street", light: "golden", sun: [30, 16], shadow: 22,
    cam: [{ u: 0, pos: [2.2, 1.0, 2.6], look: [3.0, 0.95, -1.2], fov: 38, cInf: 6 }, { u: 1, pos: [2.5, 1.0, 1.7], look: [3.0, 0.97, -1.2], fov: 37, cInf: 7 }],
    focus: () => [3, 1, -1.2],
    stage: (c) => { c.gap(0); c.put({ ...KID, x: 3.0, y: 0.12, z: -1.2, view: "front", expr: "smile_closed", armR: "up" }); } },
  // ---------------------------------------------------------------- L14  On the other side, the track kicks sideways like a snake. Just as a train comes around the bend.
  { id: "s24", move: "low push", set: "street", light: "golden", sun: HOT, shadow: 40, kick: 0,
    cam: [{ u: 0, pos: [RX + 0.2, 0.7, -24], look: [RX, 0.2, 0], fov: 40 }, { u: 1, pos: [RX + 0.2, 1.3, -20], look: [RX, 0.2, 2], fov: 40 }],
    stage: (c) => { c.snake(1.5 * (1 - (1 - clamp01(c.lt / 0.9)) ** 3) + 0.06 * Math.sin(c.t * 40) * clamp01(1 - c.lt / 0.9)); } },
  { id: "s25", move: "front tracking", set: "street", light: "golden", sun: [200, 26], shadow: 34, hand: 0.5,
    cam: [{ u: 0, pos: [RX + 2.2, 1.7, 80 - 9.5], look: [RX, 2.0, 80], fov: 44 }, { u: 1, pos: [RX + 2.2, 1.7, 56 - 9.5], look: [RX, 2.0, 56], fov: 44 }],
    stage: (c) => { c.snake(1.5); c.train(1, 80 + 4.4 - 24 * c.u); } },
  // ---------------------------------------------------------------- L15  The driver slams the brakes, and stops a few feet short.
  { id: "s26", move: "side tracking", set: "street", light: "golden", sun: [150, 30], shadow: 40,
    cam: Array.from({ length: 9 }, (_, n) => { const u = n / 8, z = 56 - 30.5 * (1 - (1 - Math.min(1, u / 0.8)) ** 2.2); return { u, pos: [-63, 2.4, z - 2.5] as V3, look: [RX, 1.3, z - 3.5] as V3, fov: 62 }; }),
    stage: (c) => { c.snake(1.5); const k = 1 - (1 - clamp01(c.u / 0.8)) ** 2.2; c.train(1, 56 - 30.5 * k, c.u < 0.8 ? 1 : 0); } },
  { id: "s27", move: "dolly in", set: "street", light: "golden", sun: HOT, shadow: 26,
    cam: [{ u: 0, pos: [-46.9, 1.4, 21.6], look: [-49.3, 1.25, 18.4], fov: 42, cInf: 3 }, { u: 1, pos: [-47.3, 1.4, 21.0], look: [-49.3, 1.25, 18.4], fov: 41, cInf: 3 }],
    focus: () => [-49.3, 1.3, 18.4],
    stage: (c) => { c.snake(1.5); c.train(1, 25.5); c.put({ i: 9, o: "driver", x: -49.9, z: 18.6, view: "front", expr: "dazed" }); c.put({ ...RIV, x: -48.7, z: 18.2, view: "front", expr: "shock", armR: "up", armL: "up" }); } },
  // ---------------------------------------------------------------- L16  By autumn, the rival is sawing gaps into every mile.
  { id: "s28", move: "crane down", set: "street", light: "day", sun: DAY, shadow: 30,
    cam: [{ u: 0, pos: [-46.8, 5.5, -33], look: [-50.4, 1.0, -40], fov: 44, cInf: 2 }, { u: 1, pos: [-48.3, 1.4, -36.4], look: [-50.5, 1.0, -40], fov: 42, cInf: 4 }],
    focus: () => [-50.6, 1, -40],
    stage: (c) => { c.put({ ...RIV, x: -50.6, y: 0.0, z: -40, view: "front", expr: "pained", armR: "hold", held: "saw", tilt: 5 * Math.sin(c.t * 13) }); crew(c, RX + 0.6, [-46, -52, -58], 1, true); } },
  // ---------------------------------------------------------------- L17  And that clickety-clack on old railroads? That is the sound of room to grow.
  { id: "s29", move: "handheld macro", set: "street", light: "day", sun: [200, 45], shadow: 14, hand: 1.2,
    cam: [{ u: 0, pos: [1.1, 0.36, 1.2], look: [NR, 0.5, 0], fov: 44 }, { u: 1, pos: [1.1, 0.36, 1.2], look: [NR, 0.5, 0], fov: 44 }],
    stage: (c) => { c.gap(0.03); c.train(0, 26 - 46 * c.u, 1); } },
  { id: "s30", move: "crane up", set: "street", light: "golden", sun: [25, 14], shadow: 60, fog: [200, 1200],
    cam: [{ u: 0, pos: [-2.2, 1.5, 6.5], look: [0.8, 1.3, 1.5], fov: 42, cInf: 3 }, { u: 1, pos: [-5.2, 11, 20], look: [2, 1.5, -6], fov: 44 }],
    focus: () => [0.8, 1.3, 1.5],
    stage: (c) => { c.train(0, 40 - 9 * c.lt, 0.5); c.put({ ...KID, x: 0.8, z: 1.5, view: "front", expr: "smile_closed", armR: "up", wave: Math.sin(c.t * 8) }); c.put({ ...BOSS, x: -0.3, z: 2.0, view: "front", expr: "smile" }); } },
];
const ORDER = Object.keys(S);
export const SHOTS: Shot[] = D.map((s) => {
  const k = ORDER.indexOf(s.id); if (k < 0) throw new Error("no cue for " + s.id);
  return { ...s, t0: S[s.id], t1: k + 1 < ORDER.length ? S[ORDER[k + 1]] : TOTAL / 30, ox: 0 };
});
if (SHOTS.length !== ORDER.length) throw new Error("shots and cues differ");
export const shotAt = (t: number) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].t0 <= t + 1e-6) k = i; return SHOTS[k]; };
