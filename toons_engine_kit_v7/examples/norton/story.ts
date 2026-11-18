// Shot list for "Emperor of the United States": where the camera is, who is on screen and what they do, frame by frame.
// Every shot starts on a spoken word (src/cues.json, written from the narration timing).
import cues from "./cues.json";
import { WX, OX } from "./world";
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
  tram: (z: number) => void; fleet: (k: number) => void; bridge: () => void; relics: (x: number, z: number) => void;
};
export type Shot = {
  id: string; set: "street" | "wharf" | "office"; light: "day" | "golden"; sun?: [number, number]; fog?: [number, number];
  cam: Key[]; focus?: (c: Ctx) => V3; stage: (c: Ctx) => void; kick?: number; t0: number; t1: number; ox: number;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const ph = (c: Ctx, v = 1.6, seed = 0) => ((c.t * v) / 1.6 + hh(seed, 3)) % 1;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** speaking: mouth open / closed on a syllable rhythm */
const talk = (c: Ctx, a: Expr = "neutral", b: Expr = "whistle"): Expr => (Math.sin(c.t * 27) + 0.6 * Math.sin(c.t * 43 + 1) > 0.15 ? b : a);
const at = (c: Ctx, w: string, lead = 2 / 30) => c.t >= W[w] - lead;
const F = (w: string) => Math.round((W[w] - 2 / 30) * 30);
/** people strolling along the pavements and the roadway */
const walkers = (c: Ctx, list: [number, number, number, 1 | -1, number][], o0 = 0) => {
  for (const [i, x, z0, dir, v] of list) c.put({ i, o: `f${(i + o0) % 6}`, x, z: z0 + dir * v * c.t, dir: [0, dir], mode: "stroll", phase: ph(c, v, i), stride: v / 1.6, expr: i % 3 ? "neutral" : "smile_closed" });
};
const STREET_FOLK: [number, number, number, 1 | -1, number][] = [[11, -6.0, -40, 1, 1.25], [12, 6.2, -2, -1, 1.3], [13, 5.7, -62, 1, 1.3], [14, -6.3, -8, -1, 1.2], [15, -5.6, -88, 1, 1.3], [16, 6.1, -30, -1, 1.25],
  [17, -2.9, -100, 1, 1.35], [18, 3.4, -20, -1, 1.3], [19, -6.1, -120, 1, 1.2], [20, 6.3, -95, 1, 1.25]];

const D: Omit<Shot, "t0" | "t1" | "ox">[] = [
  // ---------------------------------------------------------------- L1  In 1859, a bankrupt man walks into a San Francisco newspaper...
  { id: "s01", set: "street", light: "day", sun: [150, 56],
    cam: [{ u: 0, pos: [3.2, 11.5, 34], look: [-1.5, 0.5, -22], fov: 45 }, { u: 0.55, pos: [1.2, 5.2, 14], look: [-4.6, 1.6, -6], fov: 43 }, { u: 1, pos: [-0.6, 2.3, 4.2], look: [-7.0, 2.3, -7.5], fov: 41, cInf: 3 }],
    stage: (c) => {
      const u = c.lt / 2.6;
      c.put({ i: 1, o: "plain", x: lerp(-1.6, -6.4, u), z: lerp(7.0, -5.6, u), dir: [-4.8, -12.6], mode: "march", phase: ph(c, 1.6, 1), expr: "stern", paper: "#f4efe2" });
      walkers(c, STREET_FOLK);
    } },
  { id: "s02", set: "office", light: "day", sun: [165, 58],
    cam: [{ u: 0, pos: [-2.2, 1.75, 9.2], look: [-2.6, 1.3, 0.5], fov: 44 }, { u: 1, pos: [0.2, 1.65, 7.4], look: [0.9, 1.3, -1.2], fov: 41, cInf: 3 }],
    stage: (c) => {
      const u = sm(c.lt / (c.d - 0.25));
      c.put({ i: 1, o: "plain", x: lerp(-6.2, 0.2, u), z: lerp(4.0, 0.5, u), dir: [6.4, -3.5], view: "side", mode: u < 1 ? "march" : "stand", phase: ph(c, 1.6, 1), expr: "stern" });
      c.put({ i: 2, o: "editor", x: 2.3, z: -2.9, expr: c.u > 0.55 ? "nervous" : "neutral", look: c.u > 0.55 ? -1 : 0, swaps: [Math.round((S.s02 + c.d * 0.55) * 30)] });
    } },
  // ---------------------------------------------------------------- L2  "I declare myself Emperor of these United States."
  { id: "s03", set: "office", light: "day", sun: [165, 58],
    cam: [{ u: 0, pos: [-0.25, 1.5, 3.9], look: [0.2, 1.3, 0.5], fov: 39, cInf: 11 }, { u: 1, pos: [0.1, 1.48, 3.15], look: [0.2, 1.3, 0.5], fov: 37, roll: -1.5, cInf: 12 }],
    focus: () => [0.2, 1.5, 0.5],
    stage: (c) => {
      const up = at(c, "emperor");
      c.put({ i: 1, o: "plain", x: 0.2, z: 0.5, expr: talk(c), armR: up ? "up" : "hold", paper: up ? undefined : "#f4efe2", swaps: [F("emperor")] });
      c.put({ i: 2, o: "editor", x: 2.3, z: -2.9, expr: up ? "shock" : "nervous", look: -1, swaps: [F("emperor")] });
    } },
  { id: "s04", set: "office", light: "day", sun: [165, 58], kick: 0,
    cam: [{ u: 0, pos: [0.9, 1.85, 1.9], look: [2.3, 1.42, -2.9], fov: 38, roll: 2, cInf: 9 }, { u: 1, pos: [1.2, 1.8, 1.3], look: [2.3, 1.42, -2.9], fov: 36, roll: 3, cInf: 10 }],
    focus: () => [2.3, 1.5, -2.9],
    stage: (c) => { c.put({ i: 2, o: "editor", x: 2.3, z: -2.9, expr: at(c, "states") ? "smile" : "shock", swaps: [F("states")] }); } },
  // ---------------------------------------------------------------- L3  The editor prints it as a joke. But the whole city decides to play along.
  { id: "s05", set: "office", light: "day", sun: [170, 60],
    cam: [{ u: 0, pos: [-0.6, 1.62, 4.3], look: [-0.6, 1.62, 1.6], fov: 35, cInf: 9 }, { u: 1, pos: [-0.6, 1.66, 3.75], look: [-0.6, 1.66, 1.6], fov: 34, roll: -1, cInf: 9 }],
    focus: () => [-0.6, 1.6, 2.0],
    stage: (c) => {
      const k = 1 - (1 - clamp01(c.lt / 0.4)) ** 3;
      c.doc("paper1", [-0.6, lerp(0.9, 1.72, k), 2.0], 0.72, lerp(-9, -2.5, k) + 1.2 * Math.sin(c.t * 2.2));
      c.put({ i: 2, o: "editor", x: 0.75, z: 0.2, expr: at(c, "joke") ? "laugh" : "grin", swaps: [F("joke")], tilt: at(c, "joke") ? 3 * Math.sin(c.t * 18) : 0 });
    } },
  { id: "s06", set: "street", light: "day", sun: [150, 56],
    cam: [{ u: 0, pos: [0.7, 1.2, -11.3], look: [0, 1.38, -16], fov: 42, cInf: 6 }, { u: 1, pos: [0.4, 1.3, -7.7], look: [0, 1.42, -12.4], fov: 41, cInf: 7 }],
    focus: (c) => [0, 1.5, -16 + 1.6 * c.lt],
    stage: (c) => {
      const nz = -16 + 1.6 * c.lt;
      c.put({ i: 1, o: "norton", x: 0, z: nz, mode: "march", phase: ph(c, 1.6, 1), expr: "smile_closed" });
      for (let k = 0; k < 12; k++) {
        const s = k % 2 ? 1 : -1, z = -10.2 - Math.floor(k / 2) * 1.3 - hh(k, 2) * 0.4, x = s * (1.75 + hh(k) * 0.75), bow = sm((nz - z + 1.4) / 1.0);
        c.put({ i: 30 + k, o: `f${k % 6}`, x, z, dir: [-s, 0.25], view: "front", expr: bow > 0.5 ? "smile_closed" : "smile", tilt: 15 * bow, headTilt: 8 * bow, look: -s, wave: k % 4 === 1 && bow < 0.5 ? 0.5 + 0.5 * Math.sin(c.t * 9 + k) : undefined });
      }
    } },
  // ---------------------------------------------------------------- L4  His name is Joshua Norton. He was rich once, until he bet everything on a shipload of rice...
  { id: "s07", set: "street", light: "day", sun: [150, 56],
    cam: [{ u: 0, pos: [-1.0, 1.42, -9.2], look: [0, 1.36, -12], fov: 37, roll: -2, cInf: 13 }, { u: 1, pos: [-0.75, 1.46, -9.6], look: [0, 1.36, -12], fov: 36, roll: -2.6, cInf: 13 }],
    focus: () => [0, 1.5, -12],
    stage: (c) => {
      c.put({ i: 1, o: "norton", x: 0, z: -12, expr: at(c, "norton") ? "grin" : "smile_closed", swaps: [F("norton")] });
      walkers(c, STREET_FOLK);
    } },
  { id: "s08", set: "wharf", light: "day", sun: [140, 50],
    cam: [{ u: 0, pos: [4.6, 5.4, 6.5], look: [-1.2, 1.1, -8], fov: 44 }, { u: 1, pos: [3.4, 3.0, 3.4], look: [-0.6, 0.9, -6.5], fov: 43 }],
    stage: (c) => {
      c.put({ i: 1, o: "rich", x: 1.2, z: -3.4, expr: "grin", armR: "up", armL: "up", y: Math.abs(Math.sin(c.t * 9)) * 0.1 });
      c.put({ i: 41, o: "f0", x: -3.6, z: -9.5, dir: [1, 0.4], expr: "smile" }); c.put({ i: 42, o: "f2", x: 3.9, z: -15, dir: [-1, 0.6], expr: "neutral" });
    } },
  { id: "s09", set: "wharf", light: "day", sun: [140, 50],
    cam: [{ u: 0, pos: [-2.6, 1.6, 3.0], look: [-2.2, 1.0, -5.7], fov: 44, cInf: 3 }, { u: 1, pos: [-2.55, 1.62, 2.3], look: [-2.2, 1.0, -5.7], fov: 43, cInf: 3 }],
    focus: () => [-2.6, 1.4, -2.5],
    stage: (c) => {
      c.put({ i: 1, o: "rich", x: -2.9, z: -1.42, view: "front", expr: "grin", armR: "point", look: 1 });
    } },
  { id: "s10", set: "wharf", light: "day", sun: [140, 50],
    cam: [{ u: 0, pos: [3.9, 1.65, 6.4], look: [6.5, 2.2, -30], fov: 45, cInf: 0 }, { u: 1, pos: [3.6, 1.7, 5.9], look: [6.5, 2.4, -30], fov: 43, cInf: 0 }],
    stage: (c) => {
      c.fleet(c.u);
      const gone = at(c, "lost");
      c.put({ i: 1, o: "rich", x: 3.62, z: 2.9, expr: gone ? "dazed" : "shock", swaps: [F("lost")], tilt: gone ? 4 : 0, headTilt: gone ? 6 : 0 });
    } },
  // ---------------------------------------------------------------- L5  Now he walks the streets in a blue uniform, with a sword and a feathered hat.
  { id: "s11", set: "street", light: "day", sun: [150, 56],
    cam: [{ u: 0, pos: [0.5, 0.45, -24.2], look: [0, 1.05, -29.6], fov: 42 }, { u: 1, pos: [0.3, 0.9, -22.6], look: [0, 1.15, -26.5], fov: 40, cInf: 6 }],
    focus: (c) => [0, 1.5, -29.6 + 1.6 * c.lt],
    stage: (c) => { c.put({ i: 1, o: "norton", x: 0, z: -29.6 + 1.6 * c.lt, mode: "march", phase: ph(c, 1.6, 1), expr: "smile_closed" }); walkers(c, STREET_FOLK); } },
  { id: "s12", set: "street", light: "day", sun: [120, 52],
    cam: [{ u: 0, pos: [3.7, 1.35, -25.4], look: [0, 1.2, -26.6], fov: 35, cInf: 10 }, { u: 1, pos: [3.3, 1.35, -22.2], look: [0, 1.22, -23.5], fov: 34, cInf: 10 }],
    focus: (c) => [0, 1.5, -26.6 + 1.6 * c.lt],
    stage: (c) => {
      c.put({ i: 1, o: "norton", x: 0, z: -26.6 + 1.6 * c.lt, dir: [0, 1], view: "side", mode: "march", phase: ph(c, 1.6, 1), expr: "smile_closed" });
      for (let k = 0; k < 5; k++) c.put({ i: 50 + k, o: `f${(k + 2) % 6}`, x: -5.6 - hh(k) * 0.7, z: -27.5 + k * 1.7, dir: [1, 0], view: "front", expr: "smile", tilt: 10 * sm((-26.6 + 1.6 * c.lt) - (-27.5 + k * 1.7) + 1), look: 1 });
    } },
  // ---------------------------------------------------------------- L6  Every day, he inspects his city. The sidewalks. The streetcars. The police.
  { id: "s13", set: "street", light: "day", sun: [200, 54],
    cam: [{ u: 0, pos: [0.6, 6.4, -12.5], look: [5.6, 1.0, -27.5], fov: 43 }, { u: 1, pos: [1.4, 5.2, -14.8], look: [5.8, 1.1, -26], fov: 42 }],
    stage: (c) => {
      c.tram(-78 + 9 * c.lt);
      c.put({ i: 1, o: "norton", x: 6.0, y: 0.16, z: -26.9 + 1.6 * c.lt, dir: [0, 1], mode: "march", phase: ph(c, 1.6, 1), expr: "stern", look: Math.sin(c.t * 3) > 0 ? 1 : -1 });
      c.put({ i: 3, o: "grocer", x: 7.1, z: -18, dir: [-1, 0.3], view: "front", expr: "smile" });
      walkers(c, [[11, -6.0, -58, 1, 1.25], [14, -6.3, 12, -1, 1.2], [18, -2.6, 16, -1, 1.3], [13, 6.2, -80, 1, 1.3], [17, -3.2, -70, 1, 1.35]]);
    } },
  { id: "s14", set: "street", light: "day", sun: [200, 54],
    cam: [{ u: 0, pos: [3.9, 0.45, -21.0], look: [6.0, 0.8, -24], fov: 39, cInf: 7 }, { u: 1, pos: [4.2, 0.5, -21.4], look: [6.0, 0.85, -24], fov: 38, cInf: 7 }],
    focus: () => [6.0, 1.2, -24],
    stage: (c) => { c.put({ i: 1, o: "norton", x: 6.0, z: -24, dir: [-0.6, 1], view: "front", expr: "stern", tilt: 18 + 2 * Math.sin(c.t * 5), headTilt: 12, look: -1 }); } },
  { id: "s15", set: "street", light: "day", sun: [150, 54],
    cam: [{ u: 0, pos: [-3.0, 1.5, -18.2], look: [0.9, 1.55, -24], fov: 42, cInf: 4 }, { u: 1, pos: [-2.8, 1.5, -18.6], look: [0.9, 1.55, -24], fov: 41, cInf: 4 }],
    focus: () => [-1.3, 1.5, -21.6],
    stage: (c) => {
      c.tram(-33 + 11 * c.lt);
      c.put({ i: 1, o: "norton", x: -1.3, z: -21.6, dir: [0.4, 1], view: "front", expr: "stern", look: 1, headTilt: 5 * Math.sin(c.lt * 9) });
    } },
  { id: "s16", set: "street", light: "day", sun: [150, 54],
    cam: [{ u: 0, pos: [5.0, 1.5, -27.3], look: [5.3, 1.42, -31.1], fov: 35, cInf: 9 }, { u: 1, pos: [5.2, 1.5, -27.7], look: [5.3, 1.42, -31.1], fov: 34, cInf: 9 }],
    focus: () => [5.3, 1.5, -31.1],
    stage: (c) => {
      c.put({ i: 4, o: "cop", x: 5.78, z: -31.2, y: 0.16, dir: [-1, 0], view: "side", expr: "nervous" });
      c.put({ i: 1, o: "norton", x: 4.86, z: -31.1, y: 0.16, dir: [1, 0], view: "side", expr: "stern" });
    } },
  // ---------------------------------------------------------------- L7  "Congress is hereby abolished."
  { id: "s17", set: "street", light: "day", sun: [150, 50],
    cam: [{ u: 0, pos: [0.9, 0.65, -36.9], look: [0, 1.1, -40], fov: 43, roll: -3, cInf: 5 }, { u: 1, pos: [0.55, 0.8, -37.5], look: [0, 1.2, -40], fov: 41, roll: -4.5, cInf: 6 }],
    focus: () => [0, 1.6, -40],
    stage: (c) => {
      const boom = at(c, "abolished");
      c.put({ i: 1, o: "norton", x: 0, z: -40, expr: c.t > W.l7 - 0.05 && c.t < W.l7e ? talk(c) : "stern", armR: boom ? "up" : "point", armL: boom ? "up" : undefined, swaps: [F("abolished")] });
      for (let k = 0; k < 4; k++) c.put({ i: 60 + k, o: `f${(k * 2 + 1) % 6}`, x: (k % 2 ? 1 : -1) * (2.6 + k * 0.5), z: -43.5 - k * 0.8, expr: boom ? "shock" : "neutral", swaps: [F("abolished")] });
    } },
  // ---------------------------------------------------------------- L8  The newspapers print every order.
  { id: "s18", set: "street", light: "day", sun: [170, 56],
    cam: [{ u: 0, pos: [-0.5, 1.2, -39.6], look: [-1.0, 1.08, -44], fov: 39, cInf: 7 }, { u: 1, pos: [-0.8, 1.22, -40.4], look: [-1.0, 1.12, -44], fov: 37, cInf: 8 }],
    focus: () => [-1.0, 1.2, -43.9],
    stage: (c) => {
      const k = 1 - (1 - clamp01(c.lt / 0.35)) ** 3;
      c.put({ i: 5, o: "boy", x: -1.0, z: -44.0, expr: "laugh", armR: "up", armL: "up" });
      c.doc("paper2", [-1.0, lerp(1.2, 1.72, k), -43.9], 0.78, -3 + 1.5 * Math.sin(c.t * 2.4));
      c.put({ i: 61, o: "f1", x: -1.95, z: -44.5, expr: "laugh", look: 1, tilt: 3 * Math.sin(c.t * 16) }); c.put({ i: 62, o: "f4", x: -0.05, z: -44.6, expr: "grin", look: -1 });
      c.put({ i: 63, o: "f2", x: 1.9, z: -45.9, expr: "smile", look: -1 });
    } },
  // ---------------------------------------------------------------- L9  He prints his own money, and some shops accept it.
  { id: "s19", set: "street", light: "day", sun: [185, 58],
    cam: [{ u: 0, pos: [3.4, 1.42, -14.2], look: [4.6, 1.42, -16.6], fov: 36, cInf: 10 }, { u: 1, pos: [3.65, 1.44, -14.7], look: [4.6, 1.44, -16.6], fov: 35, roll: 1.5, cInf: 10 }],
    focus: () => [4.6, 1.42, -16.6],
    stage: (c) => {
      const k = 1 - (1 - clamp01(c.lt / 0.3)) ** 3;
      c.doc("note", [4.6, lerp(1.1, 1.5, k), -16.6], 0.4, 4 + 1.5 * Math.sin(c.t * 3));
      c.put({ i: 3, o: "grocer", x: 7.1, z: -18, dir: [-1, 0.3], view: "front", expr: "neutral" });
    } },
  { id: "s20", set: "street", light: "day", sun: [185, 58],
    cam: [{ u: 0, pos: [1.4, 1.56, -15.4], look: [5.3, 1.4, -18.1], fov: 45, cInf: 4 }, { u: 1, pos: [1.8, 1.55, -15.8], look: [5.3, 1.4, -18.1], fov: 44, cInf: 5 }],
    focus: () => [5.2, 1.4, -18],
    stage: (c) => {
      const ok = at(c, "accept");
      c.put({ i: 3, o: "grocer", x: 5.2, z: -17.5, y: 0.16, dir: [0, -1], view: "side", expr: ok ? "grin" : "neutral", swaps: [F("accept")] });
      c.put({ i: 1, o: "norton", x: 5.2, z: -18.6, y: 0.16, dir: [0, 1], view: "side", expr: "smile_closed" });
    } },
  // ---------------------------------------------------------------- L10  Even the census lists his job as Emperor.
  { id: "s21", set: "street", light: "day", sun: [150, 56],
    cam: [{ u: 0, pos: [-1.0, 1.5, -25.3], look: [-5.6, 1.42, -25.5], fov: 43, cInf: 6 }, { u: 1, pos: [-1.5, 1.5, -25.4], look: [-5.6, 1.42, -25.5], fov: 42, cInf: 6 }],
    focus: () => [-5.6, 1.5, -25.5],
    stage: (c) => {
      c.put({ i: 6, o: "clerk", x: -5.6, z: -26.02, y: 0.16, dir: [0, 1], view: "side", expr: "neutral" });
      c.put({ i: 1, o: "norton", x: -5.6, z: -25.0, y: 0.16, dir: [0, -1], view: "side", expr: "smile_closed" });
    } },
  { id: "s22", set: "street", light: "day", sun: [175, 58],
    cam: [{ u: 0, pos: [-6.2, 1.5, -22.6], look: [-6.2, 1.5, -25.4], fov: 35, cInf: 9 }, { u: 1, pos: [-6.14, 1.5, -23.15], look: [-6.14, 1.5, -25.4], fov: 34, roll: -1.5, cInf: 9 }],
    focus: () => [-6.2, 1.5, -25.4],
    stage: (c) => {
      c.doc("census", [-6.2, 1.56, -25.4], 0.8, -2 + Math.sin(c.t * 2));
      c.put({ i: 6, o: "clerk", x: -6.3, z: -20.6, expr: "neutral" });
    } },
  // ---------------------------------------------------------------- L11  Then, in 1867, a policeman arrests him, calling him insane.
  { id: "s23", set: "street", light: "day", sun: [150, 56],
    cam: [{ u: 0, pos: [-0.6, 1.5, -45.6], look: [-0.2, 1.4, -51.5], fov: 41, cInf: 5 }, { u: 1, pos: [-0.3, 1.5, -46.4], look: [0, 1.4, -51], fov: 39, cInf: 6 }],
    focus: (c) => [-0.5, 1.5, -52.6 + 1.6 * c.lt],
    stage: (c) => {
      c.put({ i: 1, o: "norton", x: -0.5, z: -52.6 + 1.6 * c.lt, mode: "march", phase: ph(c, 1.6, 1), expr: "smile_closed" });
      c.put({ i: 7, o: "cop2", x: lerp(2.6, 0.55, c.u), z: lerp(-60.5, -51.9 + 1.6 * c.lt, c.u), dir: [-0.3, 1], view: "front", mode: "march", phase: ph(c, 2.6, 7), expr: "stern", lift: 70 });
      walkers(c, [[13, 6.2, -122, 1, 1.3], [15, -5.6, -140, 1, 1.3], [16, 6.1, 6, -1, 1.25]]);
    } },
  { id: "s24", set: "street", light: "day", sun: [150, 56], kick: 0,
    cam: [{ u: 0, pos: [0.3, 1.5, -46.8], look: [0.3, 1.45, -50.4], fov: 36, roll: 3, cInf: 9 }, { u: 1, pos: [0.3, 1.5, -47.2], look: [0.3, 1.45, -50.4], fov: 35, roll: 4, cInf: 9 }],
    focus: () => [0.2, 1.5, -50.4],
    stage: (c) => {
      c.put({ i: 1, o: "norton", x: -0.12, z: -50.4, dir: [1, 0], view: "side", expr: "shock" });
      c.put({ i: 7, o: "cop2", x: 0.76, z: -50.45, dir: [-1, 0], view: "side", expr: "stern" });
    } },
  { id: "s25", set: "street", light: "day", sun: [150, 52],
    cam: [{ u: 0, pos: [0.3, 1.0, -32.0], look: [7.6, 1.75, -34.5], fov: 45 }, { u: 1, pos: [0.8, 1.0, -32.3], look: [7.6, 1.75, -34.5], fov: 44 }],
    stage: (c) => {
      const u = c.u;
      c.put({ i: 1, o: "norton", x: lerp(5.35, 5.55, u), z: lerp(-34.05, -33.47, u), y: 0.16, dir: [0.3, 0.95], view: "side", mode: "march", phase: ph(c, 0.6, 1), expr: "nervous", stride: 0.4 });
      c.put({ i: 7, o: "cop2", x: lerp(5.08, 5.28, u), z: lerp(-34.9, -34.32, u), y: 0.16, dir: [0.3, 0.95], view: "side", mode: "march", phase: ph(c, 0.6, 7), expr: "stern", stride: 0.4 });
      c.put({ i: 70, o: "f2", x: 7.0, z: -32.85, y: 0.16, view: "front", expr: "shock", look: -1 });
    } },
  // ---------------------------------------------------------------- L12  The city is furious. The police chief frees him, and apologizes.
  { id: "s26", set: "street", light: "day", sun: [10, 55],
    cam: [{ u: 0, pos: [7.0, 2.9, -34.6], look: [0, 1.25, -35.6], fov: 46 }, { u: 1, pos: [6.6, 3.5, -34.6], look: [0, 1.15, -35.6], fov: 44 }],
    stage: (c) => {
      for (let k = 0; k < 44; k++) {
        const x = 4.4 - Math.floor(k / 6) * 1.05 - hh(k) * 0.5, z = -39.3 + (k % 6) * 1.55 + hh(k, 4) * 0.7, j = Math.max(0, Math.sin(c.t * 10 + k * 1.7));
        c.put({ i: 100 + k, o: `f${k % 6}`, x, z, dir: [1, 0], view: "front", expr: k % 3 === 0 ? "shock" : "stern", armR: k % 2 ? "up" : undefined, armL: k % 3 === 1 ? "up" : undefined, y: 0.12 * j * (k % 2 ? 1 : 0.4) });
      }
    } },
  { id: "s27", set: "street", light: "day", sun: [150, 52],
    cam: [{ u: 0, pos: [4.0, 1.6, -29.6], look: [5.68, 1.36, -34.7], fov: 43, cInf: 5 }, { u: 1, pos: [4.3, 1.58, -30.4], look: [5.68, 1.36, -34.7], fov: 42, cInf: 6 }],
    focus: () => [5.5, 1.5, -34.7],
    stage: (c) => {
      const bow = sm((c.t - W.apologizes + 0.15) / 0.3), u = sm(c.lt / 1.0);
      c.put({ i: 8, o: "chief", x: 6.2, z: -34.9, y: 0.16, dir: [-1, 0.5], view: "front", expr: bow > 0.4 ? "pained" : "nervous", tilt: -18 * bow, headTilt: -8 * bow, prop: bow > 0.2 ? "shako" : null, look: -1, swaps: [Math.round((W.apologizes - 0.12) * 30)] });
      c.put({ i: 1, o: "norton", x: lerp(4.2, 5.0, u), z: lerp(-34.4, -34.55, u), y: 0.16, dir: [1, 0], view: "side", mode: u < 1 ? "march" : "stand", phase: ph(c, 1.0, 1), expr: bow > 0.4 ? "smile_closed" : "stern" });
      c.put({ i: 7, o: "cop2", x: 6.95, z: -36.6, y: 0.16, dir: [-1, 0.5], view: "front", expr: "nervous" });
    } },
  // ---------------------------------------------------------------- L13  After that, policemen salute him in the street.
  { id: "s28", set: "street", light: "day", sun: [215, 54],
    cam: [{ u: 0, pos: [2.0, 1.6, -61.6], look: [5.55, 1.5, -66.2], fov: 42, cInf: 4 }, { u: 1, pos: [2.4, 1.6, -57.0], look: [5.6, 1.5, -61.6], fov: 41, cInf: 5 }],
    focus: (c) => [5.0, 1.6, -66.1 + 1.9 * c.lt],
    stage: (c) => {
      const nz = -66.1 + 1.9 * c.lt;
      c.put({ i: 1, o: "norton", x: 4.95, z: nz, y: 0.16, dir: [0, 1], mode: "march", phase: ph(c, 1.6, 1), expr: "smile_closed" });
      for (let k = 0; k < 6; k++) { const z = -66.4 + k * 1.35, near = nz > z - 1.6; c.put({ i: 80 + k, o: k % 2 ? "cop2" : "cop", x: 6.25, z, y: 0.16, dir: [-1, 0.4], view: "front", expr: "stern", armR: near ? "salute" : undefined, look: -1 }); }
    } },
  // ---------------------------------------------------------------- L14  In 1872, he orders a bridge built across the bay. Nobody listens.
  { id: "s29", set: "wharf", light: "day", sun: [165, 52],
    cam: [{ u: 0, pos: [1.6, 2.6, -31.0], look: [0, 1.45, -38], fov: 42, cInf: 3 }, { u: 1, pos: [0.9, 1.6, -34.4], look: [0, 1.38, -38], fov: 38, cInf: 8 }],
    focus: () => [0, 1.5, -38],
    stage: (c) => { c.put({ i: 1, o: "norton", x: 0, z: -38, expr: "stern", armR: at(c, "bridge") ? "point" : "hold", paper: at(c, "bridge") ? undefined : "#f4efe2" }); } },
  { id: "s29b", set: "wharf", light: "day", sun: [150, 50],
    cam: [{ u: 0, pos: [5.4, 1.6, -30.5], look: [-14, 2.3, -70], fov: 44 }, { u: 1, pos: [6.2, 1.9, -29.0], look: [-16, 2.5, -80], fov: 43 }],
    stage: (c) => {
      c.doc("decree", [3.25, 2.5 + 0.03 * Math.sin(c.t * 2), -34.0], 1.25, 5, 0.5);
      c.put({ i: 1, o: "norton", x: 2.0, z: -38.6, dir: [-1, -0.9], view: "side", mirror: true, expr: "stern" });
    } },
  { id: "s30", set: "wharf", light: "day", sun: [150, 50],
    cam: [{ u: 0, pos: [1.9, 1.5, 30.6], look: [0.4, 1.5, 12], fov: 41, cInf: 4 }, { u: 1, pos: [1.7, 1.5, 30.1], look: [0.4, 1.5, 12], fov: 40, cInf: 4 }],
    focus: () => [0.9, 1.5, 23.2],
    stage: (c) => {
      c.put({ i: 1, o: "norton", x: 0.9, z: 23.2, view: "front", expr: talk(c), armR: "hold", armL: "up", paper: "#f3ead2" });
      const cross: [number, number, number, number, string][] = [[90, -1.6, 21.4, 1.5, "f0"], [91, 3.3, 20.4, -1.4, "f3"], [92, 1.95, 26.6, 1.7, "f4"], [93, 3.75, 27.2, -1.5, "f1"]];
      for (const [i, x0, z, v, o] of cross) c.put({ i, o, x: x0 + v * c.lt, z, dir: [Math.sign(v), 0], view: "side", mode: "march", phase: ph(c, Math.abs(v), i), expr: "neutral", stride: Math.abs(v) / 1.6 });
    } },
  // ---------------------------------------------------------------- L15  In 1880, he dies with almost nothing.
  { id: "s31", set: "street", light: "golden", sun: [160, 30],
    cam: [{ u: 0, pos: [-3.0, 1.05, 2.4], look: [-5.3, 0.78, -2.0], fov: 38, cInf: 9 }, { u: 1, pos: [-3.5, 0.95, 1.3], look: [-5.3, 0.78, -2.0], fov: 36, cInf: 10 }],
    focus: () => [-5.3, 0.8, -2.0],
    stage: (c) => { c.relics(-5.3, -2.0); } },
  // ---------------------------------------------------------------- L16  Ten thousand people come to say goodbye.
  { id: "s32", set: "street", light: "golden", sun: [5, 8],
    cam: [{ u: 0, pos: [0, 2.0, -3.5], look: [0, 1.5, -30], fov: 44 }, { u: 1, pos: [0.5, 12.5, 9], look: [0, 0.5, -42], fov: 45 }],
    stage: (c) => {
      for (let k = 0; k < 330; k++) {
        const row = Math.floor(k / 11), col = k % 11, x = -7.0 + col * 1.4 + (hh(k) - 0.5) * 0.7, z = -8.5 - row * 1.5 - hh(k, 2) * 0.8;
        c.put({ i: 200 + k, o: k % 13 === 5 ? "cop" : `f${k % 6}`, x, z, y: Math.abs(x) > 4.6 ? 0.16 : 0, expr: k % 5 === 0 ? "nervous" : "neutral", headTilt: 6, shadow: false });
      }
    } },
  // ---------------------------------------------------------------- L17  And that bridge he ordered? It opened in 1936.
  { id: "s33", set: "wharf", light: "golden", sun: [20, 8],
    cam: [{ u: 0, pos: [3.0, 2.2, -26], look: [-14, 5, -200], fov: 46 }, { u: 1, pos: [3.4, 2.4, -25], look: [-14, 6, -200], fov: 45 }],
    stage: () => { } },
  { id: "s34", set: "wharf", light: "golden", sun: [20, 8],
    cam: [{ u: 0, pos: [3.4, 2.4, -25], look: [-14, 9, -200], fov: 46 }, { u: 1, pos: [5.0, 9.0, 1], look: [2, 13, -200], fov: 48 }],
    stage: (c) => { c.bridge(); } },
];
const ORDER = Object.keys(S);
export const SHOTS: Shot[] = D.map((s) => {
  const k = ORDER.indexOf(s.id); if (k < 0) throw new Error("no cue for " + s.id);
  return { ...s, t0: S[s.id], t1: k + 1 < ORDER.length ? S[ORDER[k + 1]] : TOTAL / 30, ox: s.set === "wharf" ? WX : s.set === "office" ? OX : 0 };
});
if (SHOTS.length !== ORDER.length) throw new Error("shots and cues differ");
export const shotAt = (t: number) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].t0 <= t + 1e-6) k = i; return SHOTS[k]; };

// ---------------------------------------------------------------- stills outside the video (channel banner): ?shot=<id>&w=&h=
const BANNER_STAGE = (c: Ctx) => {
  // left group (outer to inner)
  c.put({ i: 5, o: "boy", x: -3.32, z: -22.3, expr: "laugh", armR: "up", armL: "up" });
  c.doc("paper2", [-3.32, 1.47, -22.2], 0.46, -5);
  c.put({ i: 2, o: "editor", x: -2.66, z: -21.75, expr: "grin", look: 1 });
  c.put({ i: 61, o: "f1", x: -2.0, z: -22.15, expr: "smile", look: 1 });
  // right group (inner to outer): Norton points at the title
  c.put({ i: 1, o: "norton", x: 2.06, z: -22.0, expr: "smile_closed", armR: "point", mirror: true });
  c.put({ i: 7, o: "cop2", x: 2.74, z: -22.35, expr: "stern", armR: "salute", look: -1 });
  c.put({ i: 3, o: "grocer", x: 3.4, z: -21.7, expr: "grin", look: -1 });
  // a few people far down the street, small, behind the title
};
const BX: Omit<Shot, "t0" | "t1" | "ox">[] = [
  { id: "banner", set: "street", light: "day", sun: [150, 46],
    cam: [{ u: 0, pos: [0, 1.42, -14.5], look: [0, 1.36, -40], fov: 30, cInf: 3 }, { u: 1, pos: [0, 1.42, -14.5], look: [0, 1.36, -40], fov: 30, cInf: 3 }],
    focus: () => [0, 1.4, -22], stage: BANNER_STAGE },
  { id: "banner_g", set: "street", light: "golden", sun: [160, 20],
    cam: [{ u: 0, pos: [0, 1.42, -14.5], look: [0, 1.36, -40], fov: 30, cInf: 3 }, { u: 1, pos: [0, 1.42, -14.5], look: [0, 1.36, -40], fov: 30, cInf: 3 }],
    focus: () => [0, 1.4, -22], stage: BANNER_STAGE },
];
export const EXTRA: Record<string, Shot> = Object.fromEntries(BX.map((s) => [s.id, { ...s, t0: 0, t1: 1, ox: 0 } as Shot]));
