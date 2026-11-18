// The cast of "Emperor of the United States" as engine cards, and the helpers that place them each frame.
import * as THREE from "three";
import { Pool, Actor, Fx } from "@eng/cast";
import { Pen, bodyFront, bodySide, INK, SKIN, fxShadow, fxContact } from "@eng/toon";
import type { Outfit, FrontOpts, SideOpts, Expr } from "@eng/toon";

export const FPS = 30;
const GOLD = "#e8c45a";
const A = (jacket: string, pants: string, x: Partial<Outfit> = {}): Outfit => ({ jacket, pants, boots: INK, hat: null, skin: SKIN, buttons: "#d9dde0", ...x });
export const OUT: Record<string, Outfit> = {
  wheeler: A("#6b7a3a", "#3b3f52", { build: "stout", moustache: "#3a2a20", buttons: "#c9c29a" }),
  friend: A("#8a3b34", "#2e3140", { hat: "cap", cap: "#2f4a7a", hair: "#3a2a20" }),
  teller: A("#f1efe6", "#2e3140", { hat: "hair", hair: "#7a4a2a", buttons: "#27407e", skin: "#f5c9a0" }),
  teller2: A("#cfe0ee", "#2e3140", { hat: "hair", hair: "#2a201a", buttons: "#27407e", skin: "#ecd0b6" }),
  cop: A("#232c47", "#232c47", { hat: "cap", cap: "#1b2238", hair: "#3a2a20", star: GOLD, skin: "#ecd0b6" }),
  cop2: A("#232c47", "#232c47", { hat: "cap", cap: "#1b2238", hair: "#6a5a4a", star: GOLD, moustache: "#6a5a4a", skin: "#f5c9a0" }),
  dunning: A("#7a6a4a", "#3b3f52", { hat: "hair", hair: "#5a4a3a", buttons: "#d9c27a", skin: "#f5c9a0" }),
  kruger: A("#4a5a6a", "#2e3140", { hat: "hair", hair: "#2a201a", moustache: "#2a201a", skin: "#ecd0b6" }),
  c0: A("#b5653f", "#3b3f52", { hat: "cap", cap: "#5d7a3a", hair: "#3a2a20" }), c1: A("#7b5ac9", "#2e3140", { hat: "hair", hair: "#c9a04a", skin: "#f5c9a0" }),
  c2: A("#3f8f8a", "#3b3f52", { hat: "cap", cap: "#c0453a", hair: "#2a201a", skin: "#ecd0b6" }), c3: A("#c9a04a", "#4a3426", { hat: "hair", hair: "#8a8a8a", build: "stout" }),
  c4: A("#d9708a", "#2e3140", { hat: "hair", hair: "#5a3b2a", skin: "#f5c9a0" }), c5: A("#4a6aa8", "#3b3f52", { hat: "cap", cap: "#e0b84a", hair: "#3a2a20" }),
};

export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const qn = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? qn(v) : v));
const tier = (d: number): [number, number, number] => (d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4]);
const LID = [0.5, 1, 1, 0.5];
/** eyelid 0 open .. 1 shut: a 4-frame blink every 0.5-2.3 s, plus one across every expression change */
export const lidAt = (f: number, i: number, swaps: number[] = []) => {
  for (const fs of swaps) { const k = f - fs + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
  return 0;
};

export type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; mirror: boolean; size: [number, number, number]; scale: number; roll: number };
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; rot: number };
export type Stage = { places: Place[]; fx: FxPlace[] };
export type Who = {
  i: number; o: string; x: number; z: number; y?: number; dir?: [number, number]; view?: "front" | "side"; mirror?: boolean; scale?: number; roll?: number; shadow?: boolean;
  phase?: number; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; expr?: Expr; look?: number; tilt?: number; headTilt?: number; wave?: number;
  armR?: "salute" | "point" | "hold" | "up"; armL?: "up"; paper?: string; prop?: "shako" | null; stride?: number; lift?: number; swaps?: number[];
  back?: boolean; juice?: boolean; held?: FrontOpts["held"];
};

const toSrgb = (v: number) => { const c = Math.max(0, Math.min(1, v)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: number[], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const tmp = new THREE.Vector3();

export class Cast {
  pool = new Pool(); actors: Actor[] = []; fxs: Fx[] = [];
  sun = new THREE.Vector3(0.5, 0.8, 0.4).normalize(); right = new THREE.Vector3(1, 0, 0); golden = false;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v3 = new THREE.Vector3();
  constructor(private root: THREE.Object3D, private cam: THREE.PerspectiveCamera) {}

  /** one character this frame */
  put(out: Stage, f: number, w: Who) {
    const cam = this.cam, o = OUT[w.o], y = w.y ?? 0, sc = w.scale ?? 1, [dx, dz] = w.dir ?? [0, 1];
    const tx = cam.position.x - w.x, tz = cam.position.z - w.z, tl = Math.hypot(tx, tz) || 1, c = (tx * dx + tz * dz) / (tl * (Math.hypot(dx, dz) || 1));
    const side = w.view ? w.view === "side" : c < 0.57;
    const mirror = w.mirror ?? (side && dx * this.right.x + dz * this.right.z < 0);
    const fs = Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20;
    const d = cam.position.distanceTo(tmp.set(w.x, y + 1.2, w.z)) / sc, size = tier(d), seed = ((w.i * 5 + 3) % 7) + 1;
    const light = Math.round(Math.atan2(-this.sun.y, this.sun.dot(this.right) * (mirror ? -1 : 1)) / (Math.PI / 4)) * (Math.PI / 4);
    const blink = w.expr === "whistle" ? 0 : lidAt(f, w.i, w.swaps);
    const mode = w.mode ?? "stand", expr = w.expr ?? "neutral";
    const fo: FrontOpts = { phase: w.phase ?? 0, expr, mode, look: w.look ?? 0, blink, lift: w.lift ?? 52, tilt: w.tilt ?? 0, headTilt: w.headTilt ?? 0, wave: w.wave, armR: w.armR, armL: w.armL, paper: w.paper, prop: w.prop ?? null, light, seed, back: w.back, juice: w.juice, held: w.held };
    const so: SideOpts = { phase: w.phase ?? 0, expr, mode: mode === "march" || mode === "stroll" ? "march" : "stand", blink, stride: (w.stride ?? 1) * (w.view === "side" ? 1 : fs), light, seed };
    out.places.push({ key: side ? `S|${w.o}|${fkey(so)}` : `F|${w.o}|${fkey(fo)}`, x: w.x, y, z: w.z, mirror, size, scale: sc, roll: w.roll ?? 0, draw: (p) => (side ? bodySide(p, o, so) : bodyFront(p, o, fo)) });
    if (w.shadow === false) return;
    // contact pool under the feet; by day also a soft tail away from the sun (golden: the cards cast real shadows)
    const hl = Math.hypot(this.sun.x, this.sun.z) || 1, ox = -this.sun.x / hl, oz = -this.sun.z / hl, rot = Math.atan2(-ox, -oz);
    if (!this.golden) {
      const el = Math.asin(Math.min(0.99, Math.max(0.1, this.sun.y))), len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, cc = 0.3 * h, tc = hexOf([0.42, 0.44, 0.62], 1);
      out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: w.x + ox * cc, y: y + 0.018, z: w.z + oz * cc, w: 0.72 * sc, h, rot });
    }
    const kc = hexOf(this.golden ? [0.24, 0.2, 0.33] : [0.2, 0.21, 0.33], 1);
    out.fx.push({ key: `blob|contact|${kc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, kc), x: w.x + ox * 0.03 * sc, y: y + 0.022, z: w.z + oz * 0.03 * sc, w: 0.52 * sc, h: 0.4 * sc, rot });
  }

  /** bind this frame's cards to meshes */
  apply(st: Stage, castShadow: boolean) {
    const cam = this.cam;
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v3.set(p.x, p.y + 1.1 * p.scale, p.z), 3.5))) continue;
      while (this.actors.length <= ai) this.actors.push(new Actor(this.root));
      const a = this.actors[ai++], [w, h, k] = p.size;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll);
      a.mesh.scale.set(p.mirror ? -p.scale : p.scale, p.scale, p.scale); a.mesh.castShadow = castShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v3.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      while (this.fxs.length <= fi) this.fxs.push(new Fx(this.root));
      const e = this.fxs[fi++];
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); e.use(false);
      e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z); e.mesh.rotation.set(-Math.PI / 2, 0, p.rot); e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
  }
}
