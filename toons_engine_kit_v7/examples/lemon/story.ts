// Shot list for "The Lemon Juice Robber": where the camera is, who is on screen and what they do, frame by frame.
// Every shot starts on a spoken word (src/cues.json, written from the narration timing). The camera move of each shot is named.
import cues from "./cues.json";
import { BX, AX, LX } from "./world";
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
  car: (x: number, z: number, yaw?: number) => void;
};
export type Shot = {
  id: string; move: string; set: "street" | "bank" | "apt" | "lab"; light: "day" | "golden"; sun?: [number, number]; fog?: [number, number];
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
const WH = { i: 1, o: "wheeler" } as const, FR = { i: 2, o: "friend" } as const;

const D: Omit<Shot, "t0" | "t1" | "ox">[] = [
  // ---------------------------------------------------------------- L1  In 1995, a man walks into a Pittsburgh bank. No mask. Just a gun.
  { id: "s01", move: "crane down", set: "street", light: "day", sun: [200, 50], shadow: 40,
    cam: [{ u: 0, pos: [-3.5, 15, 6], look: [5.5, 2.5, -17], fov: 44, cInf: 2 }, { u: 0.6, pos: [-1.5, 5.5, -5.5], look: [6.2, 2.2, -17.5], fov: 43, cInf: 2.5 }, { u: 1, pos: [0.6, 1.9, -10.5], look: [6.6, 1.9, -17.8], fov: 42, cInf: 3 }],
    focus: (c) => [6.2, 1.4, -11.6 - 3.0 * c.lt],
    stage: (c) => {
      c.put({ ...WH, x: 6.0, z: -11.6 - 3.0 * c.lt, y: 0.16, dir: [0, -1], view: "side", mode: "march", phase: ph(c, 1.5, 1), expr: "grin", juice: true });
      c.put({ ...FR, x: 5.5, z: -9.9 - 3.0 * c.lt, y: 0.16, dir: [0, -1], view: "side", mode: "march", phase: ph(c, 1.5, 2), expr: "smile_closed" });
      c.put({ i: 30, o: "c1", x: -6.2, z: -14 + 1.2 * c.lt, y: 0.16, dir: [0, 1], view: "side", mode: "march", phase: ph(c, 1.2, 30), expr: "neutral" });
      c.put({ i: 31, o: "c2", x: 6.4, z: -27 + 1.2 * c.lt, y: 0.16, dir: [0, 1], view: "side", mode: "march", phase: ph(c, 1.2, 31), expr: "neutral" });
    } },
  { id: "s02", move: "rear tracking", set: "bank", light: "day", sun: [170, 62],
    cam: [{ u: 0, pos: [0.35, 1.75, 9.0 - 0.2], look: [0, 1.25, 1.0], fov: 46, cInf: 3 }, { u: 1, pos: [0.25, 1.7, 6.3], look: [0, 1.25, -2.0], fov: 46, cInf: 3 }],
    focus: (c) => [0, 1.3, 6.0 - 2.0 * c.lt],
    stage: (c) => {
      c.put({ ...WH, x: 0, z: 6.0 - 2.0 * c.lt, view: "front", back: true, mode: "march", phase: ph(c, 1.4, 1) });
      c.put({ i: 10, o: "teller", x: 0, z: -3.6, view: "front", expr: "smile" }); c.put({ i: 11, o: "teller2", x: 3.45, z: -3.6, view: "front", expr: "neutral" });
      c.put({ i: 32, o: "c3", x: 3.4, z: -1.3, view: "front", back: true }); c.put({ i: 33, o: "c4", x: -3.3, z: 1.6, view: "front", expr: "neutral", look: 1 });
    } },
  { id: "s03", move: "front tracking", set: "bank", light: "day", sun: [170, 62],
    cam: [{ u: 0, pos: [-0.25, 1.36, 0.1], look: [0, 1.3, 3.3], fov: 40, cInf: 7 }, { u: 1, pos: [-0.25, 1.36, -1.3], look: [0, 1.3, 1.9], fov: 40, cInf: 7 }],
    focus: (c) => [0, 1.3, 3.3 - 1.9 * c.lt],
    stage: (c) => {
      c.put({ ...WH, x: 0, z: 3.3 - 1.9 * c.lt, view: "front", mode: "march", phase: ph(c, 1.4, 1), expr: "grin", juice: true });
      c.put({ i: 33, o: "c4", x: -2.6, z: 5.6, view: "front", expr: "shock", look: 1 }); c.put({ i: 34, o: "c0", x: 2.7, z: 6.4, view: "front", expr: "neutral", look: -1 });
    } },
  { id: "s04", move: "over the shoulder", set: "bank", light: "day", sun: [10, 62], kick: 0,
    cam: [{ u: 0, pos: [1.9, 1.95, -4.8], look: [-0.45, 1.15, -1.2], fov: 58, cInf: 4 }, { u: 1, pos: [1.6, 1.92, -4.8], look: [-0.45, 1.15, -1.2], fov: 56, cInf: 4 }],
    focus: () => [0, 1.3, -1.3],
    stage: (c) => {
      const g = at(c, "gun", 0.2);
      c.put({ ...WH, x: -0.15, z: -1.25, view: "front", expr: g ? "grin" : "stern", armR: "point", held: "gun", juice: true, swaps: [F("gun")] });
      c.put({ i: 10, o: "teller", x: 1.45, z: -3.25, view: "front", back: true, armR: "up", armL: "up" });
      c.put({ i: 33, o: "c4", x: -2.6, z: 2.6, view: "front", expr: "shock", armR: "up", armL: "up" }); c.put({ i: 34, o: "c0", x: 2.2, z: 3.4, view: "front", expr: "shock", armR: "up", armL: "up" });
    } },
  // ---------------------------------------------------------------- L2  He even smiles at the security camera.
  { id: "s05", move: "dolly in", set: "bank", light: "day", sun: [170, 62],
    cam: [{ u: 0, pos: [3.0, 3.9, 1.9], look: [-0.1, 1.2, -1.25], fov: 46, cInf: 3 }, { u: 1, pos: [1.15, 2.35, 0.5], look: [-0.12, 1.22, -1.25], fov: 44, cInf: 5 }],
    focus: () => [-0.15, 1.35, -1.25],
    stage: (c) => {
      const g = at(c, "smiles");
      c.put({ ...WH, x: -0.15, z: -1.25, view: "front", expr: g ? "laugh" : "grin", armR: g ? "up" : "point", held: "gun", juice: true, wave: g ? Math.sin(c.t * 14) : 0, swaps: [F("smiles")] });
      c.put({ i: 33, o: "c4", x: -2.6, z: 2.6, view: "front", expr: "shock", armR: "up", armL: "up" }); c.put({ i: 34, o: "c0", x: 2.2, z: 3.4, view: "front", expr: "shock", armR: "up", armL: "up" });
    } },
  { id: "s06", move: "push in on the monitor", set: "bank", light: "day", sun: [170, 62],
    cam: [{ u: 0, pos: [0, 1.6, 6.6], look: [0, 1.6, 3.6], fov: 35 }, { u: 1, pos: [0, 1.6, 6.2], look: [0, 1.6, 3.6], fov: 34 }],
    stage: (c) => { c.doc("cctv", [0, 1.62 + 0.006 * Math.sin(c.t * 40), 3.6], 0.98, 0.4 * Math.sin(c.t * 2)); } },
  // ---------------------------------------------------------------- L3  Then he robs a second bank, the very same afternoon.
  { id: "s07", move: "side tracking", set: "street", light: "day", sun: [200, 50], shadow: 30,
    cam: [{ u: 0, pos: [-4.3, 1.3, -22.6], look: [1.9, 0.75, -24], fov: 60, cInf: 3 }, { u: 1, pos: [-4.3, 1.3, -34.6], look: [1.9, 0.75, -36], fov: 60, cInf: 3 }],
    focus: (c) => [1.9, 0.9, -24 - 15 * c.lt],
    stage: (c) => { c.car(1.9, -24 - 15 * c.lt, 0); } },
  { id: "s07b", move: "aerial drone tracking", set: "street", light: "day", sun: [200, 50], shadow: 60, fog: [200, 900],
    cam: [{ u: 0, pos: [0.5, 30, -40], look: [1.2, 0, -56], fov: 40 }, { u: 1, pos: [-0.5, 26, -70], look: [-1.5, 0, -86], fov: 40 }],
    stage: (c) => { const k = sm(c.u * 1.15); c.car(lerp(1.9, -1.9, sm((c.u - 0.45) / 0.5)), lerp(-56, -88, k), 0.22 * Math.sin(Math.PI * clamp01((c.u - 0.45) / 0.5)));
      c.put({ i: 30, o: "c1", x: -6.2, z: -80, y: 0.16, dir: [0, 1], view: "side", expr: "neutral" }); c.put({ i: 31, o: "c2", x: 6.4, z: -66, y: 0.16, dir: [0, 1], view: "side", expr: "neutral" }); } },
  { id: "s08", move: "low-angle tracking", set: "street", light: "day", sun: [150, 50], shadow: 26,
    cam: [{ u: 0, pos: [-2.9, 0.35, -90.0], look: [-6.2, 0.8, -91.9], fov: 52, cInf: 3 }, { u: 1, pos: [-2.9, 0.35, -86.0], look: [-6.2, 0.8, -87.9], fov: 52, cInf: 3 }],
    focus: (c) => [-6.2, 1.4, -91.6 + 2.7 * c.lt],
    stage: (c) => {
      c.car(-1.9, -84.0, 0);
      c.put({ ...WH, x: -6.2, z: -91.6 + 2.7 * c.lt, y: 0.16, dir: [0, 1], view: "side", mode: "march", phase: ph(c, 2.2, 1), expr: "laugh", juice: true, stride: 1.25 });
      c.put({ ...FR, x: -6.7, z: -93.2 + 2.7 * c.lt, y: 0.16, dir: [0, 1], view: "side", mode: "march", phase: ph(c, 2.2, 2), expr: "grin", stride: 1.25 });
    } },
  // ---------------------------------------------------------------- L4  His name is McArthur Wheeler. And he has a secret weapon.
  { id: "s09", move: "dolly in", set: "street", light: "day", sun: [150, 50], shadow: 24,
    cam: [{ u: 0, pos: [0.5, 0.95, -55.2], look: [0, 1.32, -60], fov: 40, cInf: 5 }, { u: 1, pos: [0.3, 1.05, -57.2], look: [0, 1.34, -60], fov: 38, cInf: 7 }],
    focus: () => [0, 1.3, -60],
    stage: (c) => { c.put({ ...WH, x: 0, z: -60, view: "front", expr: "smile_closed", armR: "hold", held: "bag", juice: true }); } },
  { id: "s10", move: "fly-through", set: "apt", light: "day", sun: [160, 58],
    cam: [{ u: 0, pos: [2.4, 3.6, -10.5], look: [0.5, 1.2, -1.3], fov: 44 }, { u: 0.45, pos: [0.95, 2.1, -6.6], look: [0.5, 1.1, -1.3], fov: 44 }, { u: 0.62, pos: [0.68, 1.8, -5.15], look: [0.5, 1.07, -1.3], fov: 44 }, { u: 1, pos: [0.52, 1.36, -2.45], look: [0.5, 1.03, -1.3], fov: 42, cInf: 6 }],
    focus: () => [0.5, 1.05, -1.3],
    stage: () => { } },
  // ---------------------------------------------------------------- L5  Lemon juice.
  { id: "s11", move: "macro product tracking", set: "apt", light: "day", sun: [150, 50],
    cam: [{ u: 0, pos: [-1.0, 1.2, -0.7], look: [-0.38, 1.04, -1.33], fov: 30, cInf: 14 }, { u: 1, pos: [0.15, 1.17, -0.6], look: [-0.3, 1.04, -1.33], fov: 30, cInf: 14 }],
    focus: () => [-0.38, 1.05, -1.33],
    stage: () => { } },
  // ---------------------------------------------------------------- L6  A friend told him it works as invisible ink. So if you rub it on your face, cameras can't see you.
  { id: "s12", move: "dolly out", set: "apt", light: "day", sun: [160, 58],
    cam: [{ u: 0, pos: [-0.75, 1.34, -1.35], look: [-0.8, 1.3, -2.7], fov: 44, cInf: 5 }, { u: 1, pos: [0, 1.5, 1.9], look: [0, 1.2, -2.7], fov: 42, cInf: 3 }],
    focus: () => [0, 1.3, -2.7],
    stage: (c) => {
      c.put({ ...FR, x: -0.8, z: -2.7, view: "front", expr: talk(c, "smile", "grin"), armR: "hold", held: "lemon", look: 1 });
      c.put({ ...WH, x: 0.8, z: -2.7, view: "front", expr: at(c, "ink") ? "shock" : "neutral", look: -1, swaps: [F("ink")] });
    } },
  { id: "s13", move: "slow push", set: "apt", light: "day", sun: [160, 58],
    cam: [{ u: 0, pos: [0.55, 1.34, 0.5], look: [0.8, 1.3, -2.7], fov: 34, cInf: 6 }, { u: 1, pos: [0.7, 1.33, -0.3], look: [0.8, 1.3, -2.7], fov: 33, cInf: 7 }],
    focus: () => [0.8, 1.3, -2.7],
    stage: (c) => {
      const j = at(c, "face"), h = at(c, "cameras");
      c.put({ ...WH, x: 0.8, z: -2.7, view: "front", expr: h ? "laugh" : j ? "grin" : "smile", armR: j ? "up" : "hold", held: "lemon", juice: j, wave: j && !h ? Math.sin(c.t * 16) : 0, swaps: [F("face"), F("cameras")] });
    } },
  // ---------------------------------------------------------------- L7  He even tests it. He covers his face in juice, and takes a Polaroid.
  { id: "s14", move: "rack focus", set: "apt", light: "day", sun: [160, 58],
    cam: [{ u: 0, pos: [0.15, 1.13, -0.3], look: [0.62, 1.2, -2.7], fov: 38, cInf: 18 }, { u: 1, pos: [0.2, 1.13, -0.34], look: [0.62, 1.2, -2.7], fov: 38, cInf: 18 }],
    focus: (c) => { const k = sm((c.u - 0.3) / 0.4); return [lerp(0.5, 0.8, k), 1.15, lerp(-1.3, -2.7, k)]; },
    stage: (c) => { c.put({ ...WH, x: 0.8, z: -2.7, view: "front", expr: "grin", armR: "hold", held: "polaroid", juice: true }); } },
  { id: "s15", move: "dolly in", set: "apt", light: "day", sun: [160, 58],
    cam: [{ u: 0, pos: [0.8, 1.36, 0.1], look: [0.8, 1.27, -2.7], fov: 38, cInf: 6 }, { u: 1, pos: [0.8, 1.33, -0.75], look: [0.8, 1.27, -2.7], fov: 36, cInf: 7 }],
    focus: () => [0.8, 1.3, -2.7],
    stage: (c) => { const k = at(c, "takes"); c.put({ ...WH, x: 0.8, z: -2.7, view: "front", expr: k ? "laugh" : "grin", armR: "hold", held: "polaroid", juice: true, tilt: k ? 3 : 0, swaps: [F("takes")] }); } },
  // ---------------------------------------------------------------- L8  The photo comes out blank. He probably just missed.
  { id: "s16", move: "push in on the photo", set: "apt", light: "day", sun: [170, 60],
    cam: [{ u: 0, pos: [3.2, 1.5, 6.6], look: [3.2, 1.5, 4.0], fov: 35, cInf: 8 }, { u: 1, pos: [3.2, 1.5, 6.2], look: [3.2, 1.5, 4.0], fov: 34, cInf: 8 }],
    focus: () => [3.2, 1.5, 4.4],
    stage: (c) => { const k = 1 - (1 - clamp01(c.lt / 0.4)) ** 3; c.doc("polaroid", [3.2, lerp(0.9, 1.5, k), 4.4], 0.72, lerp(-10, -3, k) + 1.2 * Math.sin(c.t * 2.2)); } },
  { id: "s17", move: "dolly out", set: "apt", light: "day", sun: [160, 58],
    cam: [{ u: 0, pos: [0.8, 1.32, -0.9], look: [0.8, 1.27, -2.7], fov: 40, cInf: 6 }, { u: 1, pos: [0.5, 1.5, 1.5], look: [0.7, 1.2, -2.7], fov: 40, cInf: 3 }],
    focus: () => [0.8, 1.3, -2.7],
    stage: (c) => { c.put({ ...WH, x: 0.8, z: -2.7, view: "front", expr: at(c, "missed") ? "grin" : "smile", armR: "hold", held: "photo", armL: at(c, "missed") ? "up" : undefined, juice: true, swaps: [F("missed")] }); } },
  // ---------------------------------------------------------------- L9  The juice burns his eyes. He can barely see. But the plan feels perfect.
  { id: "s18", move: "360 orbit", set: "apt", light: "day", sun: [160, 60], shadow: 16,
    cam: orbit([-3.6, 1.27, 1.2], 2.45, 1.4, 15, 375, 44, 4),
    focus: () => [-3.6, 1.3, 1.2],
    stage: (c) => {
      const ok = at(c, "perfect", 0.9), hurt = !ok;
      c.put({ ...WH, x: -3.6 + (hurt ? 0.12 * Math.sin(c.t * 5) : 0), z: 1.2, view: "front", expr: ok ? "grin" : "pained", juice: true, tilt: hurt ? 6 * Math.sin(c.t * 5) : 0, headTilt: hurt ? 5 * Math.sin(c.t * 7 + 1) : 0,
        armR: ok ? "up" : undefined, armL: ok ? "up" : undefined, swaps: [Math.round((W.perfect - 0.9) * 30)] });
    } },
  // ---------------------------------------------------------------- L10  Three months later, police put the bank footage on the evening news.
  { id: "s20", move: "over-the-shoulder tracking", set: "apt", light: "day", sun: [170, 55],
    cam: [{ u: 0, pos: [2.9, 1.6, 1.3], look: [4.75, 1.36, -3.9], fov: 40, cInf: 4 }, { u: 1, pos: [4.5, 1.56, 0.9], look: [4.95, 1.36, -3.9], fov: 39, cInf: 4 }],
    focus: () => [4.7, 1.4, -3.9],
    stage: (c) => {
      c.doc("tvnews", [4.7, 1.36, -3.93], 1.22, 0, 0);
      c.put({ ...WH, x: 3.75, z: -0.75, view: "front", back: true });
    } },
  // ---------------------------------------------------------------- L11  And there he is. Crystal clear.
  { id: "s21", move: "dolly zoom", set: "apt", light: "day", sun: [170, 55],
    cam: dollyZoom([4.25, 1.3, -0.75], 1.15, 2.3, 64, 1.34, 0),
    stage: (c) => { c.doc("tvnews", [4.7, 1.36, -3.93], 1.22, 0, 0); c.put({ ...WH, x: 4.25, z: -0.75, view: "front", expr: "shock" }); } },
  { id: "s21b", move: "push in on the screen", set: "apt", light: "day", sun: [170, 55],
    cam: [{ u: 0, pos: [4.7, 1.4, -0.5], look: [4.7, 1.37, -3.93], fov: 46 }, { u: 1, pos: [4.7, 1.4, -1.3], look: [4.7, 1.37, -3.93], fov: 46 }],
    stage: (c) => { c.doc("tvnews", [4.7, 1.36, -3.93], 1.22, 0, 0); } },
  // ---------------------------------------------------------------- L12  Within an hour, he is under arrest. And he cannot believe it.
  { id: "s22", move: "handheld", set: "apt", light: "day", sun: [170, 58], hand: 1,
    cam: [{ u: 0, pos: [-4.4, 1.5, 7.6], look: [-4.25, 1.2, 3.5], fov: 54, cInf: 2 }, { u: 1, pos: [-4.4, 1.5, 7.1], look: [-4.25, 1.2, 3.5], fov: 53, cInf: 2 }],
    focus: () => [-4.3, 1.3, 3.5],
    stage: (c) => {
      const k = sm(c.lt / 0.7);
      c.put({ ...WH, x: -3.6, z: 3.4, view: "front", expr: "shock", armR: "up", armL: "up", look: -1 });
      c.put({ i: 20, o: "cop", x: lerp(-6.6, -4.65, k), z: 3.6, view: "front", mode: k < 1 ? "march" : "stand", phase: ph(c, 1.4, 20), expr: "stern", armR: "hold", held: "cuffs", look: 1 });
      c.put({ i: 21, o: "cop2", x: lerp(-6.9, -5.5, k), z: 4.3, view: "front", mode: k < 1 ? "march" : "stand", phase: ph(c, 1.4, 21), expr: "stern", armR: "point", look: 1 });
    } },
  { id: "s23", move: "dolly in", set: "apt", light: "day", sun: [170, 58],
    cam: [{ u: 0, pos: [-3.3, 1.36, 6.3], look: [-3.3, 1.3, 3.4], fov: 38, cInf: 6 }, { u: 1, pos: [-3.3, 1.34, 5.3], look: [-3.3, 1.3, 3.4], fov: 37, cInf: 7 }],
    focus: () => [-3.3, 1.3, 3.4],
    stage: (c) => { c.put({ ...WH, x: -3.3, z: 3.4, view: "front", expr: at(c, "believe") ? "dazed" : "shock", armR: "up", armL: "up", swaps: [F("believe")] }); c.put({ i: 20, o: "cop", x: -4.75, z: 3.6, view: "front", expr: "stern", look: 1 }); } },
  // ---------------------------------------------------------------- L13  But I wore the lemon juice!
  { id: "s24", move: "whip pan", set: "apt", light: "day", sun: [170, 58],
    cam: [{ u: 0, pos: [-4.2, 1.4, 7.9], look: [-3.3, 1.3, 3.4], fov: 40, cInf: 4 }, { u: 0.74, pos: [-4.2, 1.4, 7.8], look: [-3.3, 1.3, 3.4], fov: 40, cInf: 4 }, { u: 0.86, pos: [-4.2, 1.4, 7.8], look: [-5.2, 1.3, 3.9], fov: 40, cInf: 4 }, { u: 1, pos: [-4.2, 1.4, 7.8], look: [-5.2, 1.3, 3.9], fov: 40, cInf: 4 }],
    focus: () => [-4.3, 1.3, 3.6],
    stage: (c) => {
      const sp = c.t > W.l13 - 0.05 && c.t < W.l13e;
      c.put({ ...WH, x: -3.3, z: 3.4, view: "front", expr: sp ? talk(c, "pained", "shock") : "pained", armR: "up", armL: "up" });
      c.put({ i: 20, o: "cop", x: -4.72, z: 3.6, view: "front", expr: "nervous", look: -1 }); c.put({ i: 21, o: "cop2", x: -5.62, z: 4.0, view: "front", expr: "dazed", look: 1 });
    } },
  // ---------------------------------------------------------------- L14  The story reaches two psychologists, Dunning and Kruger.
  { id: "s25", move: "crane down", set: "lab", light: "day", sun: [165, 60],
    cam: [{ u: 0, pos: [1.2, 4.6, 6.4], look: [-0.9, 1.6, -3.4], fov: 44, cInf: 2 }, { u: 1, pos: [0.2, 1.75, 2.4], look: [-0.9, 1.4, -3.4], fov: 42, cInf: 3 }],
    focus: () => [-0.9, 1.3, -3.2],
    stage: (c) => {
      c.doc("curve", [-1.4, 2.65, -4.86], 2.7, 0, 0);
      c.put({ i: 40, o: "dunning", x: -1.6, z: -3.2, view: "front", expr: "neutral", armR: "hold", paper: "#f4efe2", look: 1 });
      c.put({ i: 41, o: "kruger", x: -0.3, z: -3.0, view: "front", expr: "smile", look: -1 });
    } },
  { id: "s26", move: "slow push", set: "lab", light: "day", sun: [165, 60],
    cam: [{ u: 0, pos: [-0.95, 1.42, 1.5], look: [-0.95, 1.3, -3.1], fov: 38, cInf: 5 }, { u: 1, pos: [-0.95, 1.4, 1.0], look: [-0.95, 1.3, -3.1], fov: 37, cInf: 5 }],
    focus: () => [-0.95, 1.3, -3.1],
    stage: (c) => {
      c.doc("curve", [-1.4, 2.65, -4.86], 2.7, 0, 0);
      c.put({ i: 40, o: "dunning", x: -1.5, z: -3.2, view: "front", expr: "grin", armR: "hold", paper: "#f4efe2" });
      c.put({ i: 41, o: "kruger", x: -0.4, z: -3.0, view: "front", expr: at(c, "kruger") ? "laugh" : "smile", swaps: [F("kruger")] });
    } },
  // ---------------------------------------------------------------- L15  They wonder. Can someone be too clueless to know they are clueless?
  { id: "s27", move: "side tracking", set: "lab", light: "day", sun: [165, 60],
    cam: [{ u: 0, pos: [-3.4, 1.75, 1.6], look: [-3.3, 2.05, -4.86], fov: 42, cInf: 2 }, { u: 1, pos: [-0.9, 1.75, 1.6], look: [-1.0, 2.05, -4.86], fov: 42, cInf: 2 }],
    focus: () => [-2, 2, -4.6],
    stage: (c) => {
      c.doc("curve", [-1.4, 2.65, -4.86], 2.7, 0, 0);
      c.put({ i: 40, o: "dunning", x: -3.9, z: -3.9, view: "front", expr: talk(c, "neutral", "smile"), armR: "point", mirror: true });
      c.put({ i: 41, o: "kruger", x: 0.3, z: -3.7, view: "front", expr: at(c, "clueless") ? "shock" : "nervous", look: -1, swaps: [F("clueless")] });
    } },
  // ---------------------------------------------------------------- L16  Their study becomes famous, as the Dunning-Kruger effect.
  { id: "s29", move: "push in on the paper", set: "lab", light: "day", sun: [170, 60],
    cam: [{ u: 0, pos: [2.9, 1.5, 7.2], look: [2.9, 1.5, 4.4], fov: 35, cInf: 8 }, { u: 1, pos: [2.9, 1.5, 6.8], look: [2.9, 1.5, 4.4], fov: 34, cInf: 8 }],
    focus: () => [2.9, 1.5, 4.8],
    stage: (c) => { const k = 1 - (1 - clamp01(c.lt / 0.4)) ** 3; c.doc("study", [2.9, lerp(0.9, 1.6, k), 4.8], 0.86, lerp(-9, -2.5, k) + 1.2 * Math.sin(c.t * 2.2)); } },
  { id: "s30", move: "dolly in", set: "lab", light: "day", sun: [165, 60],
    cam: [{ u: 0, pos: [-2.5, 2.3, 3.4], look: [-2.5, 2.72, -4.86], fov: 44 }, { u: 1, pos: [-2.6, 2.4, 1.6], look: [-2.6, 2.75, -4.86], fov: 44 }],
    stage: (c) => { c.doc("curve", [-1.4, 2.65, -4.86], 2.7, 0, 0); } },
  // ---------------------------------------------------------------- L17  All thanks to one man, and a lemon.
  { id: "s31", move: "crane up", set: "street", light: "day", sun: [176, 30], shadow: 44,
    cam: [{ u: 0, pos: [0.55, 1.7, -57.9], look: [0.05, 1.5, -60], fov: 40, cInf: 5 }, { u: 0.35, pos: [0.8, 2.0, -56.6], look: [0, 1.45, -60], fov: 40, cInf: 4 }, { u: 1, pos: [2.2, 12.5, -44], look: [0, 1.6, -61], fov: 42, cInf: 2 }],
    focus: () => [0, 1.4, -60],
    stage: (c) => { c.put({ ...WH, x: 0, z: -60, view: "front", expr: "smile_closed", armR: "up", held: "lemon", juice: true }); } },
];
const ORDER = Object.keys(S);
export const SHOTS: Shot[] = D.map((s) => {
  const k = ORDER.indexOf(s.id); if (k < 0) throw new Error("no cue for " + s.id);
  return { ...s, t0: S[s.id], t1: k + 1 < ORDER.length ? S[ORDER[k + 1]] : TOTAL / 30, ox: s.set === "bank" ? BX : s.set === "apt" ? AX : s.set === "lab" ? LX : 0 };
});
if (SHOTS.length !== ORDER.length) throw new Error("shots and cues differ");
export const shotAt = (t: number) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].t0 <= t + 1e-6) k = i; return SHOTS[k]; };
