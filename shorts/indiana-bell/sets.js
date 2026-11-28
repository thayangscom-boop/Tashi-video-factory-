// Sets for "The building that turned" (Indianapolis, 1930): a downtown block with the eight-story telephone building
// on its moving rig (timber track, steel rollers, horizontal screw jacks, flexible utility lines, a walkway bridge),
// period cars and storefronts, plus three interiors. Procedural + CC0 Kenney/KayKit props from the installed skill.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { tm, ctex } from '../chicago-v3/sets.js';
import { V, lerp, clamp } from './cast.js';
export { tm, ctex };

const ENG = '/.claude/skills/claude-3d-animated-shorts/engine';
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return `#${c.getHexString()}`; };
export function box(G, w, h, d, mat, x, y, z, o = {}) { const m = new THREE.Mesh(o.round ? new RoundedBoxGeometry(w, h, d, 2, o.round) : new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; m.castShadow = o.cast ?? true; m.receiveShadow = true; G.add(m); return m; }
const cyl = (G, rt, rb, h, mat, x, y, z, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; G.add(m); return m; };

/* ---------------- textures ---------------- */
const TX = {};
function textures() {
  TX.asphalt = ctex(512, 512, (g, w, h) => { g.fillStyle = '#4a4a50'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + rnd(i * 3) * 0.05})`; g.fillRect(rnd(i * 5) * w, rnd(i * 7) * h, 2 + rnd(i) * 4, 2 + rnd(i * 2) * 4); } }, [10, 10]);
  TX.walk = ctex(256, 256, (g, w, h) => { g.fillStyle = '#c9c2b4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,70,60,0.35)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i) * 0.05})`; g.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 6, 6); } }, [8, 8]);
  TX.gravel = ctex(512, 512, (g, w, h) => { g.fillStyle = '#8a7a64'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { g.fillStyle = shade(['#a8987e', '#6e604e', '#9a8c74', '#5a4e40'][i % 4], 0.85 + rnd(i) * 0.3); g.beginPath(); g.arc(rnd(i * 5) * w, rnd(i * 7) * h, 1.5 + rnd(i * 9) * 4, 0, 7); g.fill(); } }, [12, 12]);
  TX.brick = ctex(512, 512, (g, w, h) => { g.fillStyle = '#7a5040'; g.fillRect(0, 0, w, h); for (let r = 0; r < 24; r++) for (let c = -1; c < 9; c++) { g.fillStyle = shade('#a8603f', 0.8 + rnd(r * 31 + c) * 0.32); g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 21.3 + 2, 60, 17); } }, [5, 12]);
  TX.timber = ctex(256, 64, (g, w, h) => { g.fillStyle = '#8a6440'; g.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(40,24,10,${0.1 + rnd(i) * 0.15})`; g.fillRect(0, rnd(i * 3) * h, w, 2); } }, [4, 1]);
  TX.wallOffice = ctex(256, 256, (g, w, h) => { g.fillStyle = '#d8c8a2'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i * 32, 0, 12, h); } }, [4, 2]);
  TX.wallSwitch = ctex(256, 256, (g, w, h) => { g.fillStyle = '#a9bfb0'; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, y * 32, w, 3); } }, [4, 2]);
  TX.wallLobby = ctex(256, 256, (g, w, h) => { g.fillStyle = '#c8a88a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,80,50,0.35)'; g.lineWidth = 6; for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 128, h); g.stroke(); } }, [4, 2]);
  TX.wallStudio = ctex(256, 256, (g, w, h) => { g.fillStyle = '#5f7a8a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(i * 64 + 20, 0, 24, h); } }, [4, 2]);
  TX.floorIn = ctex(512, 512, (g, w, h) => { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { g.fillStyle = (r + c) % 2 ? '#2c2a30' : '#d9d2c2'; g.fillRect(c * 64, r * 64, 64, 64); } }, [3, 3]);
  TX.floorWood = ctex(512, 512, (g, w, h) => { for (let i = 0; i < 10; i++) { g.fillStyle = shade('#8a5a34', 0.8 + rnd(i * 3) * 0.35); g.fillRect(0, i * 51, w, 51); g.fillStyle = 'rgba(40,20,10,0.4)'; g.fillRect(0, i * 51, w, 2); } }, [3, 3]);
}

/* ---------------- the telephone building (original stylised design) ---------------- */
export const BLD = { W: 16, D: 14, gh: 4.4, fh: 3.4, floors: 8 };
export const BLD_H = BLD.gh + (BLD.floors - 1) * BLD.fh;
function bellBuilding(G, night = 0) {
  const { W, D, gh, fh, floors } = BLD; const g = new THREE.Group(); G.add(g); const H = BLD_H;
  const brick = tm('#fff', { map: TX.brick, r: 0.9 }); const stone = tm('#e4dcc8', { r: 0.85 }), granite = tm('#9a9488', { r: 0.7 });
  const lit = tm('#f2c070', { e: '#ffa040', ei: 0.45 }), dark = tm('#56708a', { e: '#1c2a3c', ei: 0.4, r: 0.25, m: 0.3 });
  box(g, W, H, D, brick, 0, H / 2 + 0.5, 0); box(g, W + 0.3, 0.5, D + 0.3, granite, 0, 0.25, 0);
  box(g, W + 0.25, gh - 0.3, D + 0.25, stone, 0, 0.5 + (gh - 0.3) / 2, 0);                         // stone base (ground floor)
  for (let f = 1; f <= floors; f++) box(g, W + 0.3, 0.18, D + 0.3, stone, 0, 0.5 + gh + (f - 1) * fh - 0.09, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.7, H - gh, 0.7, stone, sx * (W / 2 - 0.2), 0.5 + gh + (H - gh) / 2, sz * (D / 2 - 0.2));   // corner piers
  // windows, instanced, on all four sides
  const slots = []; const winG = new THREE.BoxGeometry(1.05, 1.9, 0.08), surG = new THREE.BoxGeometry(1.3, 2.2, 0.1), sillG = new THREE.BoxGeometry(1.45, 0.12, 0.25);
  const sides = [[0, D / 2, 0, 7, W], [Math.PI, -D / 2, 0, 7, W], [Math.PI / 2, W / 2, 1, 6, D], [-Math.PI / 2, -W / 2, 1, 6, D]];
  sides.forEach(([ry, off, axis, n, span], si) => { for (let f = 1; f < floors; f++) for (let c = 0; c < n; c++) { const u = -span / 2 + (c + 0.5) * (span / n); const y = 0.5 + gh + (f - 1) * fh + 1.45;
    const p = axis === 0 ? V(ry === 0 ? u : -u, y, off) : V(off, y, ry > 0 ? -u : u); slots.push([p, ry, rnd(si * 97 + f * 17 + c) < 0.58]); } });
  const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.receiveShadow = true; g.add(m); return m; };
  const nL = slots.filter(s => s[2]).length; const IL = mk(winG, lit, nL), ID = mk(winG, dark, slots.length - nL), IS = mk(surG, stone, slots.length), IT = mk(sillG, stone, slots.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V(1, 1, 1); let li = 0, di = 0;
  slots.forEach(([p, ry, isLit], i) => { q.setFromAxisAngle(V(0, 1, 0), ry); const out = V(0, 0, 1).applyQuaternion(q);
    M.compose(p.clone().addScaledVector(out, 0.02), q, one); IS.setMatrixAt(i, M); M.compose(p.clone().addScaledVector(out, 0.06), q, one); (isLit ? IL : ID).setMatrixAt(isLit ? li++ : di++, M);
    M.compose(p.clone().addScaledVector(out, 0.12).add(V(0, -1.12, 0)), q, one); IT.setMatrixAt(i, M); });
  // ground floor: arched windows + the main entrance on the +z front
  for (let c = 0; c < 5; c++) { const x = -W / 2 + (c + 0.5) * (W / 5); const door = c === 2;
    box(g, 2.2, 2.9, 0.1, door ? tm('#4a2c1a') : lit, x, 0.5 + 1.75, D / 2 + 0.14, { cast: false });
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 20, 1, false, -Math.PI / 2, Math.PI), door ? tm('#4a2c1a') : lit); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI / 2 * 0; arch.position.set(x, 0.5 + 3.2, D / 2 + 0.14); arch.rotation.set(Math.PI / 2, 0, 0); g.add(arch); }
  for (const [ry, off, span, n] of [[Math.PI, -D / 2, W, 5], [Math.PI / 2, W / 2, D, 4], [-Math.PI / 2, -W / 2, D, 4]]) for (let c = 0; c < n; c++) { const u = -span / 2 + (c + 0.5) * (span / n);
    const q2 = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry); const o2 = V(0, 0, 1).applyQuaternion(q2); const p2 = Math.abs(o2.z) > 0.5 ? V(u, 0, off) : V(off, 0, u);
    const wdw = box(g, 2.0, 2.5, 0.1, lit, p2.x + o2.x * 0.14, 0.5 + 1.75, p2.z + o2.z * 0.14, { cast: false }); wdw.rotation.y = ry; const fr2 = box(g, 2.3, 2.8, 0.08, stone, p2.x + o2.x * 0.1, 0.5 + 1.75, p2.z + o2.z * 0.1, { cast: false }); fr2.rotation.y = ry; }
  box(g, 3.6, 0.6, 1.6, granite, 0, 0.3, D / 2 + 0.8);                                   // steps
  // the name over the door + rooftop sign
  const name = ctex(1024, 128, (gg, w, h) => { gg.fillStyle = '#e4dcc8'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#3a3026'; gg.font = '70px InterB'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText('INDIANA BELL TELEPHONE', w / 2, h / 2 + 4); });
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.25), tm('#fff', { map: name })); nm.position.set(0, 0.5 + gh - 0.55, D / 2 + 0.14); g.add(nm);
  box(g, W + 0.9, 0.5, D + 0.9, stone, 0, H + 0.75, 0); box(g, W + 0.3, 0.9, D + 0.3, tm('#8a4a3a'), 0, H + 1.45, 0);
  for (let i = 0; i < 40; i++) box(g, 0.22, 0.24, 0.24, stone, -W / 2 - 0.2 + i * ((W + 0.4) / 39), H + 0.38, D / 2 + 0.36, { cast: false });
  const sign = ctex(1024, 220, (gg, w, h) => { gg.fillStyle = '#16233a'; gg.fillRect(0, 0, w, h); gg.strokeStyle = '#d9b44a'; gg.lineWidth = 10; gg.strokeRect(8, 8, w - 16, h - 16); gg.fillStyle = '#f5d98c'; gg.font = '120px InterB'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText('INDIANA BELL', w / 2, h / 2 + 6);
    gg.beginPath(); gg.fillStyle = '#3a78c8'; gg.arc(110, h / 2, 62, 0, 7); gg.fill(); gg.fillStyle = '#fff'; gg.beginPath(); gg.arc(110, h / 2 - 6, 26, Math.PI, 0); gg.lineTo(140, h / 2 + 22); gg.lineTo(80, h / 2 + 22); gg.fill(); gg.beginPath(); gg.arc(110, h / 2 + 28, 8, 0, 7); gg.fill(); });
  const sg = new THREE.Mesh(new THREE.BoxGeometry(11, 2.4, 0.2), tm('#fff', { map: sign, emap: sign, e: '#ffffff', ei: 0.3 })); sg.position.set(0, H + 3.2, D / 2 - 1.0); sg.castShadow = true; g.add(sg);
  for (const x of [-4.5, 4.5]) box(g, 0.12, 1.6, 0.12, tm('#2a2a2e', { m: 0.6 }), x, H + 2.1, D / 2 - 1.1);
  box(g, 2.2, 2.4, 2.2, tm('#7e4034'), -4, H + 3.1, -3); const tank = cyl(g, 1.1, 1.1, 2.0, tm('#6a5040'), 4.5, H + 3.4, -3.5, 16); cyl(g, 0.0, 1.25, 0.9, tm('#4a3828'), 4.5, H + 4.85, -3.5, 16);
  return g;
}

/* period sedan (~1929): rounded body, separate fenders, running boards, spoked wheels */
export function car(G, col) { const g = new THREE.Group(); G.add(g); const body = tm(col, { r: 0.35, m: 0.35 }), blk = tm('#151518', { r: 0.4, m: 0.3 }), chrome = tm('#d8dde2', { r: 0.2, m: 0.9 });
  box(g, 1.6, 0.7, 3.6, body, 0, 0.95, 0, { round: 0.15 }); box(g, 1.5, 0.8, 1.9, body, 0, 1.68, -0.3, { round: 0.15 }); box(g, 1.38, 0.55, 1.8, tm('#2a3440', { r: 0.1, m: 0.5 }), 0, 1.72, -0.3, {});
  box(g, 1.2, 0.62, 0.9, body, 0, 1.05, 1.6, { round: 0.12 }); box(g, 1.0, 0.7, 0.08, chrome, 0, 1.1, 2.06);
  for (const s of [-1, 1]) { box(g, 0.3, 0.06, 2.4, blk, s * 0.92, 0.5, -0.1); for (const z of [1.25, -1.25]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 18, 1, false, 0, Math.PI), blk); f.rotation.z = Math.PI / 2; f.position.set(s * 0.86, 0.56, z); f.castShadow = true; g.add(f); }
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), tm('#fff6d8', { e: '#fff0c0', ei: 0.6 })); hl.position.set(s * 0.5, 1.15, 2.1); g.add(hl); }
  const wheels = []; for (const s of [-1, 1]) for (const z of [1.25, -1.25]) { const w = new THREE.Group(); w.position.set(s * 0.82, 0.42, z); g.add(w); const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 8, 20), blk); tire.rotation.y = Math.PI / 2; tire.castShadow = true; w.add(tire);
    for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.03), tm('#d9c9a0')); sp.rotation.x = k * Math.PI / 6; w.add(sp); } wheels.push(w); }
  const spare = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 8, 20), blk); spare.position.set(0, 1.1, -1.95); g.add(spare);
  return { g, wheels }; }

/* storefront / commercial block facade for the neighbours */
function facade(seed, wall, sign, floors) { const paint = em => ctex(512, 512, (g, w, h) => { g.fillStyle = em ? '#000' : wall; g.fillRect(0, 0, w, h);
    if (!em) for (let y = 0; y < h; y += 10) { g.fillStyle = `rgba(0,0,0,${0.04 + rnd(y + seed) * 0.05})`; g.fillRect(0, y, w, 2); }
    const rows = Math.max(1, floors - 1), cols = 4, rh = (h * 0.78) / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * 0.2, y = 14 + r * rh, ww = cw * 0.6, hh = rh * 0.62, l = rnd(seed * 7 + r * 3 + c) > 0.6;
      if (em) { if (l) { g.fillStyle = '#ffb858'; g.fillRect(x, y, ww, hh); } continue; } g.fillStyle = '#efe6d2'; g.fillRect(x - 5, y - 5, ww + 10, hh + 12); g.fillStyle = l ? '#e8b468' : '#3d4e62'; g.fillRect(x, y, ww, hh); }
    const sy = h * 0.8; if (em) { g.fillStyle = '#ffb04a'; g.fillRect(20, sy + 40, w * 0.38, h - sy - 50); g.fillRect(w * 0.58, sy + 40, w * 0.38, h - sy - 50); return; }
    g.fillStyle = '#1e2230'; g.fillRect(0, sy, w, 38); g.fillStyle = '#f0d58c'; g.font = '30px InterB'; g.textAlign = 'center'; g.fillText(sign, w / 2, sy + 29);
    g.fillStyle = '#e8c078'; g.fillRect(20, sy + 40, w * 0.38, h - sy - 50); g.fillRect(w * 0.58, sy + 40, w * 0.38, h - sy - 50); });
  return { map: paint(false), emap: paint(true) }; }
function block(G, x, z, w, d, floors, wall, sign, seed, ry = 0, awning) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); const h = floors * 3.2 + 1;
  box(g, w, h, d, tm(shade(wall, 0.85)), 0, h / 2, -d / 2); const t = facade(seed, wall, sign, floors); const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tm('#fff', { map: t.map, emap: t.emap, e: '#ffffff', ei: 0.3 })); f.position.set(0, h / 2, 0.02); g.add(f);
  box(g, w + 0.4, 0.4, d + 0.3, tm(shade(wall, 0.65)), 0, h + 0.2, -d / 2); box(g, w + 0.1, 0.35, 0.3, tm(shade(wall, 1.15)), 0, h - 0.6, 0.12);
  if (awning) { const a = box(g, w * 0.9, 0.08, 1.6, tm(awning), 0, 3.05, 0.8); a.rotation.x = 0.22; }
  return g; }

/* ---------------- exterior world ---------------- */
// Coordinates: north = -z, south = +z, east = +x. Lot centre (0, 0); the building starts at P0 facing east (+x).
export const PATH = { P0: V(0, 0, -6), S: 15.85, Wd: 30.48, ry0: Math.PI / 2, ry1: 0 };   // 52 ft south, 90° turn, 100 ft west
export function bldPose(k) {   // k: 0 -> 1 over the whole move (south 0..0.3, turn 0.3..0.55, west 0.55..1)
  const a = clamp(k / 0.3), b = clamp((k - 0.3) / 0.25), c = clamp((k - 0.55) / 0.45);
  return { x: PATH.P0.x - PATH.Wd * c, z: PATH.P0.z + PATH.S * a, ry: lerp(PATH.ry0, PATH.ry1, b), phase: k < 0.3 ? 'south' : k < 0.55 ? 'turn' : 'west' };
}
export async function buildExterior(scene) {
  textures();
  const G = new THREE.Group(); scene.add(G);
  // ground: construction lot (gravel), streets, sidewalks with curbs
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(70, 42), tm('#fff', { map: TX.gravel, r: 0.95 })); lot.rotation.x = -Math.PI / 2; lot.position.set(-15, 0, -2); lot.receiveShadow = true; G.add(lot);
  const road = tm('#fff', { map: TX.asphalt, r: 0.85 }), walk = tm('#fff', { map: TX.walk, r: 0.9 }), curb = tm('#b8b0a2');
  const pl = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; G.add(m); return m; };
  pl(14, 160, road, 28, 0.01, 0); pl(200, 12, road, -15, 0.011, 31);                                  // east street (N-S) and south street (E-W)
  pl(4, 160, walk, 19, 0.15, 0); pl(4, 160, walk, 37, 0.15, 0); pl(200, 4, walk, -15, 0.15, 23); pl(200, 4, walk, -15, 0.15, 39);
  for (const x of [21, 35]) box(G, 0.2, 0.2, 160, curb, x, 0.08, 0, { cast: false }); for (const z of [25, 37]) box(G, 200, 0.2, 0.2, curb, -15, 0.08, z, { cast: false });
  for (const [x0, z0, w, d] of [[19, 0, 4, 160], [37, 0, 4, 160], [-15, 23, 200, 4], [-15, 39, 200, 4]]) box(G, w, 0.14, d, tm('#a8a296'), x0, 0.07, z0, { cast: false });
  for (let i = 0; i < 20; i++) { box(G, 0.2, 0.012, 2.2, tm('#e8e2c8'), 28, 0.02, -60 + i * 6.5, { cast: false }); box(G, 2.2, 0.012, 0.2, tm('#e8e2c8'), -90 + i * 9, 0.02, 31, { cast: false }); }
  // streetcar rails on the east street
  for (const x of [27.3, 28.7]) box(G, 0.08, 0.03, 160, tm('#8a8e94', { m: 0.8, r: 0.3 }), x, 0.03, 0, { cast: false });
  // timber track along the whole move (south leg + west leg), with cross ties
  const tim = tm('#fff', { map: TX.timber, r: 0.95 });
  const track = new THREE.Group(); G.add(track);
  for (const x of [-5, -1.7, 1.7, 5]) box(track, 0.45, 0.3, 32, tim, x, 0.15, 2);
  for (const z of [3.5, 6.8, 10.2, 13.5, 16.6]) box(track, 48, 0.3, 0.45, tim, -18, 0.15, z);
  for (let i = 0; i < 26; i++) box(track, 11.5, 0.12, 0.35, tim, 0, 0.06, -13 + i * 1.25, { cast: false });
  // the building (group pivots about its footprint centre) + its rig
  const B = new THREE.Group(); G.add(B); const bld = bellBuilding(B); bld.position.y = 0.0;
  const RIG = new THREE.Group(); B.add(RIG);   // rollers + cribbing + beams sit between the track and the building
  const rollers = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 14), tm('#5a646e', { m: 0.8, r: 0.35 }), 120); rollers.castShadow = true; RIG.add(rollers);
  const RP = []; for (let i = 0; i < 12; i++) for (let j = 0; j < 10; j++) RP.push(V(-BLD.W / 2 + 0.8 + i * ((BLD.W - 1.6) / 11), 0.46, -BLD.D / 2 + 0.7 + j * ((BLD.D - 1.4) / 9)));
  for (let j = 0; j < 4; j++) box(RIG, BLD.W + 0.6, 0.32, 0.5, tm('#6a7078', { m: 0.7, r: 0.4 }), 0, 0.78, -BLD.D / 2 + 1.5 + j * ((BLD.D - 3) / 3));
  // the horizontal screw jacks: on the trailing side, between an abutment block and the building's sill
  const jackG = new THREE.Group(); RIG.add(jackG); jackG.rotation.y = -Math.PI / 2;   const jacks = [];   // trailing side for both legs (north while going south, east while going west)
  for (let i = 0; i < 9; i++) { const j = new THREE.Group(); j.position.set(-BLD.D / 2 + 1 + i * ((BLD.D - 2) / 8), 0.75, -BLD.W / 2 - 1.2); jackG.add(j);
    box(j, 0.7, 0.6, 0.7, tim, 0, -0.15, -0.65); const body = cyl(j, 0.16, 0.2, 0.55, tm('#3f464e', { m: 0.6, r: 0.45 }), 0, 0, -0.15); body.rotation.x = Math.PI / 2;
    const screw = cyl(j, 0.06, 0.06, 0.9, tm('#9aa3ab', { m: 0.85, r: 0.3 }), 0, 0, 0.45); screw.rotation.x = Math.PI / 2; const bar = new THREE.Group(); bar.position.z = -0.05; j.add(bar);
    const b = cyl(bar, 0.025, 0.025, 1.1, tm('#b08a5a'), 0, 0, 0, 8); b.rotation.z = Math.PI / 2; jacks.push({ j, bar, screw }); }
  // new-HQ ghost (S4): a glowing wireframe tower over the old building's site
  const ghost = new THREE.Group(); G.add(ghost); { const gg = new THREE.BoxGeometry(22, 50, 18); const e = new THREE.LineSegments(new THREE.EdgesGeometry(gg), new THREE.LineBasicMaterial({ color: '#7fe0ff', transparent: true, opacity: 0.9 })); e.position.y = 25; ghost.add(e);
    const f = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: '#7fd8ff', transparent: true, opacity: 0.12, depthWrite: false })); f.position.y = 25; ghost.add(f);
    for (let k = 1; k < 14; k++) { const r = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(22, 18)), new THREE.LineBasicMaterial({ color: '#7fe0ff', transparent: true, opacity: 0.45 })); r.rotation.x = -Math.PI / 2; r.position.y = k * 3.6; ghost.add(r); } }
  ghost.position.set(PATH.P0.x + 2, 0, PATH.P0.z - 4); ghost.visible = false;
  // flexible utility lines: from a fixed manifold at the east curb to the building's east wall (recomputed each frame)
  const lines = [['#c83a2a', 0.22, 'GAS'], ['#3a78c8', 0.2, 'WATER'], ['#2a2a2e', 0.12, 'POWER'], ['#6a4a2a', 0.16, 'PHONE']].map(([c, r, name], i) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), tm(c, { r: 0.55 })); m.castShadow = true; G.add(m); return { m, r, name, i, col: c }; });
  const manifold = box(G, 1.2, 1.0, 4.4, tm('#5a5e64', { m: 0.6, r: 0.5 }), 16.2, 0.5, -11);
  const setLines = (k) => { B.updateMatrixWorld(true); lines.forEach(L => { const a = V(15.6, 0.5 + L.i * 0.02, -12.6 + L.i * 1.05); const b = B.localToWorld(V(BLD.W / 2 * 0 + (L.i - 1.5) * 1.1, 1.0, -BLD.D / 2 + 0.2).applyAxisAngle(V(0, 1, 0), 0));
      const bb = B.localToWorld(V(3.4 + L.i * 1.05, 0.9, BLD.D / 2 + 0.05)); const mid = a.clone().lerp(bb, 0.5).add(V(0, -0.2 + Math.sin(k * 40 + L.i) * 0.05, 0));
      const out = B.localToWorld(V(3.4 + L.i * 1.05, 0.9, BLD.D / 2 + 1.2)); const curve = new THREE.CatmullRomCurve3([a, a.clone().add(V(-1.2, 0.2, 0)), mid, out, bb]); L.m.geometry.dispose(); L.m.geometry = new THREE.TubeGeometry(curve, 40, L.r, 10, false); L.ends = [a, bb]; }); };
  // the moving walkway bridge: from the east sidewalk to the front door
  const bridge = new THREE.Group(); G.add(bridge); box(bridge, 1.6, 0.12, 1, tim, 0, 0, 0); for (const s of [-1, 1]) box(bridge, 0.05, 0.05, 1, tm('#e8dcc0'), s * 0.76, 0.72, 0);
  const bposts = new THREE.Group(); G.add(bposts); const postM = tm('#e8dcc0'); const posts = Array.from({ length: 22 }).map((_, i) => box(bposts, 0.06, 0.72, 0.06, postM, (i % 2 ? 1 : -1) * 0.76, 0.36, 0));
  const setBridge = () => { B.updateMatrixWorld(true); const door = B.localToWorld(V(0, 0.5, BLD.D / 2 + 1.6)); const curbP = V(17.4, 0.3, door.z); const L = door.distanceTo(curbP);
    bridge.position.copy(door.clone().lerp(curbP, 0.5)).add(V(0, 0.1, 0)); bridge.rotation.set(0, Math.atan2(curbP.x - door.x, curbP.z - door.z), 0); bridge.scale.set(1, 1, L); bposts.position.copy(bridge.position); bposts.rotation.copy(bridge.rotation); posts.forEach((p, i) => (p.position.z = (Math.floor(i / 2) / 10 - 0.5) * L)); bridge.rotateX(Math.atan2(curbP.y - door.y, L) * 0); bridge.userData = { door, curbP }; };
  // neighbours: 1930 commercial blocks along both streets and the north edge of the lot
  const NB = [['#9a7a5a', 'DRUG STORE', 4], ['#7a6a7a', 'HOTEL ANTLERS', 9], ['#b08a6a', 'CAFE', 3], ['#6a7a8a', 'BANK', 6], ['#a86a5a', 'THEATER', 5], ['#8a8a6a', 'HARDWARE', 4], ['#7a5a4a', 'DEPT. STORE', 7]];
  NB.forEach(([c, s, f], i) => block(G, 38.5, -50 + i * 13.5, 12.5, 10, f, c, s, i + 3, -Math.PI / 2, i % 2 ? '#2f6a5a' : '#8a2f2a'));
  NB.forEach(([c, s, f], i) => block(G, -70 + i * 12.5, 41, 12, 10, f + (i % 3), c, s, i + 13, Math.PI, i % 2 ? '#2f4a7a' : null));
  NB.forEach(([c, s, f], i) => block(G, -60 + i * 12.5, -24, 12, 10, f + 2, c, s, i + 23, 0, null));
  block(G, 14.5, -28, 9, 8, 10, '#8a8a8a', 'OFFICES', 51, -Math.PI / 2);
  // street furniture: lamps, a hydrant, a mailbox, a newsstand
  const lamps = []; for (const [x, z] of [[20.5, -18], [20.5, 0], [20.5, 18], [-6, 24.5], [-28, 24.5]]) { const lg = new THREE.Group(); lg.position.set(x, 0.15, z); G.add(lg); box(lg, 0.12, 4.2, 0.12, tm('#22262b', { m: 0.6 }), 0, 2.1, 0); box(lg, 0.9, 0.06, 0.06, tm('#22262b'), -0.4, 4.15, 0);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), tm('#fff2d0', { e: '#ffd890', ei: 0.3 })); gl.position.set(-0.8, 3.95, 0); lg.add(gl); lamps.push(gl); }
  cyl(G, 0.16, 0.2, 0.7, tm('#c8302a'), 20.6, 0.5, 6); box(G, 0.5, 1.1, 0.4, tm('#2a4a8a'), 20.4, 0.7, -10, { round: 0.06 });
  const stand = box(G, 1.4, 1.2, 0.6, tm('#3a5a3a'), 18.4, 0.75, 12); stand.rotation.y = Math.PI / 2;
  // traffic: four sedans
  const cars = [car(G, '#1b2a44'), car(G, '#5a1e1e'), car(G, '#1f3a2a'), car(G, '#2a2a2e')];
  // far skyline
  for (let i = 0; i < 26; i++) { const x = -120 + i * 10 + rnd(i) * 4, h = 14 + rnd(i * 2.3) * 30, z = -70 - rnd(i * 4.1) * 30; box(G, 8 + rnd(i * 6) * 6, h, 9, tm(['#8a8090', '#9a8a88', '#7a7888'][i % 3], { r: 1 }), x, h / 2, z, { cast: false }); }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: ctex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); [[0, '#3a6ab0'], [0.32, '#86b0dc'], [0.46, '#dce8ee'], [0.5, '#f2ead8'], [0.56, '#b8a890'], [1, '#6a5a4a']].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
  G.add(sky);

  const state = { k: 0, lift: 0, rolling: 0, rig: true };
  const update = (s) => { Object.assign(state, s); const p = bldPose(state.k); B.position.set(p.x, state.rig ? 0.95 : 0, p.z); track.visible = state.rig; B.rotation.y = p.ry; RIG.visible = state.rig; RIG.position.y = -0.95;
    // rollers turn with distance travelled; jack bars turn
    const dist = state.k * (PATH.S + PATH.Wd + 12); const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), Qr = new THREE.Quaternion();
    RP.forEach((p2, i) => { Qr.setFromEuler(new THREE.Euler(dist / 0.16, 0, Math.PI / 2, 'ZXY')); M.compose(p2, Qr, V(1, 1, 1)); rollers.setMatrixAt(i, M); }); rollers.instanceMatrix.needsUpdate = true;
    jacks.forEach((J, i) => { J.bar.rotation.z = state.jackAng + i * 0.4; J.screw.position.z = 0.45 + Math.sin(state.jackAng * 0.05) * 0.0; });
    ghost.visible = !!state.ghost; if (state.ghost) ghost.children.forEach((c, i) => { c.material.opacity = (i === 1 ? 0.12 : i === 0 ? 0.9 : 0.45) * state.ghost; });
    if (state.rig) { setLines(state.k); setBridge(); } lines.forEach(L => (L.m.visible = state.rig)); manifold.visible = state.rig; bridge.visible = bposts.visible = state.rig;
    lamps.forEach(l => (l.material.emissiveIntensity = state.lamps ?? 0.3)); };
  update({ jackAng: 0 });
  return { G, B, bld, update, state, cars, lines, bridge, jacks, ghost, sky, track };
}

/* ---------------- interiors ---------------- */
export async function buildInteriors(scene) {
  const GL = new GLTFLoader(); const CACHE = {}; const load = u => (CACHE[u] ||= GL.loadAsync(u));
  const kenRef = new THREE.Box3().setFromObject((await load(`${ENG}/assets/props/kenney/desk.glb`)).scene); const KS = 0.76 / (kenRef.max.y - kenRef.min.y);
  const kayRef = new THREE.Box3().setFromObject((await load(`${ENG}/assets/props/kaykit/table_medium.gltf`)).scene); const KK = 0.76 / (kayRef.max.y - kayRef.min.y);
  const put = async (G, kit, name, x, y, z, ry = 0, k = 1) => { const g = (await load(`${ENG}/assets/props/${kit}/${name}.${kit === 'kenney' ? 'glb' : 'gltf'}`)).scene.clone(true);
    g.traverse(m => { if (m.isMesh) { const s = m.material; m.material = new THREE.MeshStandardMaterial({ color: s.color ? s.color.clone() : new THREE.Color('#fff'), map: s.map || null, roughness: Math.max(0.45, s.roughness ?? 0.7), metalness: Math.min(0.2, s.metalness ?? 0) }); m.castShadow = m.receiveShadow = true; } });
    g.scale.setScalar((kit === 'kenney' ? KS : KK) * k); g.rotation.y = ry; g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); const c = b.getCenter(V(0, 0, 0)); g.position.set(x - c.x, y - b.min.y, z - c.z); G.add(g); return g; };

  /* the cut-away building: top = office, middle = switchboard room, bottom = lobby. Origin under the lobby floor. */
  const H = new THREE.Group(); scene.add(H); H.position.set(300, 0, 0);
  const D = new THREE.Group(); H.add(D);   // moves (the building)
  const RW = 7, RD = 4.6, RH = 3.2; const Y = { lobby: 0.9, switch: 0.9 + RH, office: 0.9 + 2 * RH };
  const brick = tm('#fff', { map: TX.brick }); const walls = { office: TX.wallOffice, switch: TX.wallSwitch, lobby: TX.wallLobby };
  box(D, RW + 0.6, 3 * RH + 0.6, 0.3, brick, 0, 0.9 + 1.5 * RH, -RD - 0.15); for (const s of [-1, 1]) box(D, 0.3, 3 * RH + 0.6, RD + 0.3, brick, s * (RW / 2 + 0.15), 0.9 + 1.5 * RH, -RD / 2);
  box(D, RW + 1.2, 0.45, RD + 1.0, tm('#e4dcc8'), 0, 0.9 + 3 * RH + 0.2, -RD / 2); box(D, RW + 0.6, 0.9, RD + 0.6, tm('#9a9488'), 0, 0.45, -RD / 2);
  for (const [n, y] of Object.entries(Y)) { const fl = n === 'office' ? TX.floorWood : TX.floorIn; box(D, RW, 0.2, RD, tm('#fff', { map: fl, r: 0.5 }), 0, y - 0.1, -RD / 2); box(D, RW + 0.6, 0.24, 0.2, tm('#e4dcc8'), 0, y - 0.12, 0.05);
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), tm('#fff', { map: walls[n] })); wl.position.set(0, y + RH / 2, -RD + 0.01); wl.receiveShadow = true; D.add(wl);
    for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), tm('#fff', { map: walls[n] })); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * (RW / 2 - 0.01), y + RH / 2, -RD / 2); D.add(sw); }
    const l = new THREE.PointLight('#ffe2b8', 7, 8, 1.7); l.position.set(0, y + RH - 0.4, -1.8); D.add(l); for (const x of [-1.6, 1.6]) { const fx = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), tm('#fff3d0', { e: '#ffd890', ei: 2 })); fx.position.set(x, y + RH - 0.2, -1.8); D.add(fx); } }
  // windows: the outside world slides past (offset driven by the building's motion)
  const outside = ctex(1024, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#86b0dc'); gr.addColorStop(1, '#e8e4d8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { const x = i * 74 + rnd(i) * 10, bh = 90 + rnd(i * 3) * 120; g.fillStyle = ['#9a7a5a', '#7a6a7a', '#b08a6a', '#6a7a8a', '#a86a5a'][i % 5]; g.fillRect(x, h - bh, 70, bh); g.fillStyle = '#e8c070';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) if (rnd(i * 13 + r * 3 + c) > 0.5) g.fillRect(x + 8 + c * 21, h - bh + 10 + r * 26, 12, 16); }
    g.fillStyle = '#4a4a50'; g.fillRect(0, h - 22, w, 22); });
  outside.wrapS = THREE.RepeatWrapping;
  const panes = [];
  for (const [n, y] of Object.entries(Y)) for (const x of [-2.1, 2.1]) { const fr = new THREE.Group(); fr.position.set(x, y + 1.75, -RD + 0.03); D.add(fr);
    box(fr, 1.5, 0.1, 0.12, tm('#efe6d2'), 0, 0.85, 0.03); box(fr, 1.5, 0.1, 0.18, tm('#efe6d2'), 0, -0.85, 0.05); for (const s of [-1, 1]) box(fr, 0.1, 1.8, 0.12, tm('#efe6d2'), s * 0.7, 0, 0.03); box(fr, 0.05, 1.7, 0.06, tm('#efe6d2'), 0, 0, 0.03);
    const t = outside.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(0.16, 1); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({ map: t })); p.position.z = 0.01; p.userData.x = x; fr.add(p); panes.push(p); }
  // --- office (Ruth's desk by the left window) ---
  const yo = Y.office;
  await put(D, 'kenney', 'desk', -1.6, yo, -RD + 1.2, 0, 1.15); await put(D, 'kenney', 'chairDesk', -0.35, yo, -RD + 1.1, -0.7, 1.1);
  await put(D, 'kenney', 'desk', 1.4, yo, -2.3, 0, 1.15); await put(D, 'kenney', 'chairDesk', 1.4, yo, -1.5, Math.PI, 1.1);
  await put(D, 'kenney', 'bookcaseClosed', 3.0, yo, -RD + 0.4, 0, 1.3); await put(D, 'kenney', 'pottedPlant', -3.1, yo, -0.8, 0, 1.4); await put(D, 'kenney', 'coatRackStanding', -3.1, yo, -RD + 0.5, 0, 1.2);
  const typer = new THREE.Group(); D.add(typer); typer.position.set(-1.45, yo + 0.88, -RD + 1.2); box(typer, 0.42, 0.14, 0.32, tm('#1b1b1f', { r: 0.3, m: 0.4 }), 0, 0, 0, { round: 0.03 }); cyl(typer, 0.04, 0.04, 0.46, tm('#2a2a2e'), 0, 0.11, -0.12).rotation.z = Math.PI / 2;
  const paperT = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.3), tm('#f4efe4')); paperT.position.set(0, 0.24, -0.14); paperT.rotation.x = -0.2; typer.add(paperT);
  const phone = new THREE.Group(); D.add(phone); phone.position.set(-1.95, yo + 0.82, -RD + 1.05); cyl(phone, 0.07, 0.09, 0.05, tm('#151518', { m: 0.3, r: 0.3 }), 0, 0, 0); cyl(phone, 0.02, 0.02, 0.3, tm('#151518'), 0, 0.17, 0);
  const mouthpiece = cyl(phone, 0.05, 0.03, 0.06, tm('#151518'), 0, 0.33, 0.03); const receiver = new THREE.Group(); phone.add(receiver); receiver.position.set(0.09, 0.2, 0); cyl(receiver, 0.025, 0.035, 0.1, tm('#151518'), 0, 0, 0);
  const mug = cyl(D, 0.05, 0.045, 0.1, tm('#f2f4f6', { r: 0.25 }), -1.15, yo + 0.85, -RD + 1.0, 14);
  const lamp = new THREE.Group(); D.add(lamp); lamp.position.set(-2.1, yo + 0.8, -RD + 1.3); cyl(lamp, 0.02, 0.02, 0.4, tm('#2a5a3a'), 0, 0.2, 0); const sh = cyl(lamp, 0.06, 0.14, 0.12, tm('#2f6a4a', { e: '#204a30', ei: 0.3 }), 0.05, 0.42, 0.05); sh.rotation.z = -0.4;
  // --- switchboard room: a long board along the back wall with jack fields, lamps and cords ---
  const ys = Y.switch; const lampsB = [];
  const boardTex = ctex(1024, 512, (g, w, h) => { g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, w, h); for (let p = 0; p < 4; p++) { g.fillStyle = '#2a1e14'; g.fillRect(p * 256 + 12, 12, 232, 380); for (let r = 0; r < 16; r++) for (let c = 0; c < 18; c++) { g.fillStyle = '#0e0c0a'; g.beginPath(); g.arc(p * 256 + 26 + c * 12.4, 30 + r * 22, 3.5, 0, 7); g.fill(); } g.fillStyle = '#e8dcc0'; g.fillRect(p * 256 + 14, 396, 228, 24); }
    g.fillStyle = '#5a3e28'; g.fillRect(0, 430, w, 82); });
  box(D, RW - 0.6, 2.2, 0.5, tm('#fff', { map: boardTex, r: 0.6 }), 0, ys + 1.25, -RD + 0.35);
  box(D, RW - 0.6, 0.08, 0.8, tm('#6a4a2c', { r: 0.5 }), 0, ys + 0.78, -RD + 0.8);
  const LG = new THREE.SphereGeometry(0.025, 8, 6); const lampsIM = new THREE.InstancedMesh(LG, new THREE.MeshBasicMaterial({ color: '#ffffff' }), 64); D.add(lampsIM); const lampP = [];
  for (let i = 0; i < 64; i++) { lampP.push(V(-RW / 2 + 0.6 + (i % 16) * ((RW - 1.2) / 15), ys + 1.95 - Math.floor(i / 16) * 0.32, -RD + 0.62)); }
  const cordsG = new THREE.Group(); D.add(cordsG); const cords = Array.from({ length: 10 }).map((_, i) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), tm(['#c8302a', '#2a5a9a', '#2a2a2e'][i % 3], { r: 0.6 })); cordsG.add(m); return m; });
  for (let i = 0; i < 4; i++) await put(D, 'kaykit', 'chair_stool_wood', -2.4 + i * 1.6, ys, -RD + 1.55, 0, 1.15);
  // --- lobby ---
  const yl = Y.lobby; await put(D, 'kenney', 'desk', 0.8, yl, -2.0, 0, 1.3); await put(D, 'kenney', 'pottedPlant', -3.0, yl, -RD + 0.5, 0, 1.6); await put(D, 'kenney', 'bench', -1.8, yl, -RD + 0.6, 0, 1.2);
  const doorL = box(D, 1.4, 2.4, 0.08, tm('#4a2c1a'), -3.48, yl + 1.2, -1.6); doorL.rotation.y = Math.PI / 2;
  // pipes + cables in the cut-away floor slab (flexible section shows)
  // --- under the building: rollers on track + a ground plane (for the pull-back) ---
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 50), tm('#fff', { map: TX.gravel, r: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; H.add(ground); ground.position.set(0, 0, -6);
  for (const z of [-0.6, -2.3, -4.0]) box(H, 70, 0.25, 0.4, tm('#fff', { map: TX.timber }), 0, 0.12, z);
  const rollIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 12), tm('#5a646e', { m: 0.8, r: 0.35 }), 36); rollIM.castShadow = true; H.add(rollIM);
  const skyI = new THREE.Mesh(new THREE.SphereGeometry(160, 16, 12), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, color: '#a8c8e8' })); H.add(skyI);
  for (let i = 0; i < 10; i++) { const h = 8 + rnd(i) * 14; box(H, 7, h, 6, tm(['#9a7a5a', '#7a6a7a', '#b08a6a'][i % 3]), -40 + i * 9, h / 2, -22, { cast: false }); }
  const updDoll = (x, t) => { D.position.x = x; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(); let i = 0;
    for (const z of [-0.6, -2.3, -4.0]) for (let k = 0; k < 12; k++) { const px = x - RW / 2 + 0.3 + k * ((RW - 0.6) / 11); Q.setFromEuler(new THREE.Euler(x / 0.15 * -1, 0, 0)); Q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))); M.compose(V(px, 0.4, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(x / 0.15, 0, Math.PI / 2, 'XYZ')), V(1, 1, 1)); rollIM.setMatrixAt(i++, M); }
    rollIM.instanceMatrix.needsUpdate = true; panes.forEach(p => { p.material.map.offset.x = (p.userData.x + 3) / 40 - x * 0.04; }); };
  const updBoard = (t, dark = 0) => { const M = new THREE.Matrix4(), c = new THREE.Color(); lampP.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); lampsIM.setMatrixAt(i, M);
      const on = rnd(i * 7 + Math.floor(t * 2 + rnd(i) * 3)) > 0.45 && rnd(i * 3.3) > dark; c.set(on ? (i % 5 ? '#ffd860' : '#ff6a4a') : '#2a2218'); lampsIM.setColorAt(i, c); });
    lampsIM.instanceMatrix.needsUpdate = true; if (lampsIM.instanceColor) lampsIM.instanceColor.needsUpdate = true; };
  const setCord = (i, a, b, sag = 0.35) => { const mid = a.clone().lerp(b, 0.5).add(V(0, -sag, 0.15)); const crv = new THREE.QuadraticBezierCurve3(a, mid, b); cords[i].geometry.dispose(); cords[i].geometry = new THREE.TubeGeometry(crv, 16, 0.012, 6, false); cords[i].visible = true; };
  updDoll(0, 0); updBoard(0);

  /* the architect's studio (separate room) */
  const S = new THREE.Group(); scene.add(S); S.position.set(400, 0, 0); const SW = 6.4, SD = 5;
  box(S, SW, 0.2, SD, tm('#fff', { map: TX.floorWood, r: 0.55 }), 0, -0.1, -SD / 2);
  const sw1 = new THREE.Mesh(new THREE.PlaneGeometry(SW, 3.4), tm('#fff', { map: TX.wallStudio })); sw1.position.set(0, 1.7, -SD); S.add(sw1);
  for (const s of [-1, 1]) { const w2 = new THREE.Mesh(new THREE.PlaneGeometry(SD, 3.4), tm('#fff', { map: TX.wallStudio })); w2.rotation.y = -s * Math.PI / 2; w2.position.set(s * SW / 2, 1.7, -SD / 2); S.add(w2); }
  box(S, SW, 0.1, 0.06, tm('#3a2a1e'), 0, 0.05, -SD + 0.03);
  // tall window with the city and warm light
  const wv = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshBasicMaterial({ map: outside.clone() })); wv.material.map.needsUpdate = true; wv.material.map.repeat.set(0.3, 1); wv.position.set(1.6, 1.8, -SD + 0.02); S.add(wv);
  for (const s of [-1, 1]) box(S, 0.12, 2.4, 0.14, tm('#efe6d2'), 1.6 + s * 0.95, 1.8, -SD + 0.05); box(S, 2.0, 0.12, 0.14, tm('#efe6d2'), 1.6, 3.0, -SD + 0.05); box(S, 2.1, 0.1, 0.3, tm('#efe6d2'), 1.6, 0.66, -SD + 0.12); box(S, 0.06, 2.2, 0.1, tm('#efe6d2'), 1.6, 1.8, -SD + 0.05);
  // drafting table: legs + tilted board with the plan
  const DT = new THREE.Group(); S.add(DT); DT.position.set(-0.6, 0, -2.6);
  for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) box(DT, 0.06, 0.95, 0.06, tm('#5a3a22'), x, 0.47, z);
  const boardG = new THREE.Group(); boardG.position.set(0, 0.86, 0); boardG.rotation.x = 0.32; DT.add(boardG); box(boardG, 1.7, 0.05, 1.1, tm('#c9a26a'), 0, 0, 0);
  const planTex = ctex(1024, 660, (g, w, h) => { g.fillStyle = '#1f4a78'; g.fillRect(0, 0, w, h); g.strokeStyle = '#cfe6ff'; g.lineWidth = 5; g.strokeRect(24, 24, w - 48, h - 48); g.fillStyle = '#cfe6ff'; g.font = '40px InterB'; g.fillText('INDIANA BELL · SITE PLAN', 60, 90);
    g.lineWidth = 6; g.strokeRect(470, 170, 200, 170); g.setLineDash([16, 12]); g.strokeRect(470, 380, 200, 170); g.strokeRect(160, 420, 170, 200); g.setLineDash([]); g.font = '28px InterB'; g.fillText('OLD', 535, 265); g.fillText('NEW HQ', 760, 200); g.strokeRect(720, 120, 240, 420); });
  const planM = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.0), tm('#fff', { map: planTex, r: 0.8 })); planM.rotation.x = -Math.PI / 2; planM.position.y = 0.03; boardG.add(planM);
  const stampTex = ctex(512, 220, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#d23a2a'; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28); g.fillStyle = '#d23a2a'; g.font = '128px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MOVE IT', w / 2, h / 2 + 8); });
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.27), new THREE.MeshBasicMaterial({ map: stampTex, transparent: true, depthWrite: false })); stamp.rotation.x = -Math.PI / 2; stamp.rotation.z = 0.15; stamp.position.set(0.1, 0.04, 0.05); boardG.add(stamp);
  const arrowT = ctex(512, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ffd23f'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, 40); g.lineTo(60, 150); g.quadraticCurveTo(60, 210, 120, 210); g.lineTo(440, 210); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(470, 210); g.lineTo(420, 180); g.lineTo(420, 240); g.fill(); });
  const arrowM = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: arrowT, transparent: true, depthWrite: false })); arrowM.rotation.x = -Math.PI / 2; arrowM.rotation.z = Math.PI; arrowM.position.set(-0.2, 0.035, -0.15); boardG.add(arrowM);
  const bulbP = V(-0.6 + 0.6, 2.2, -2.6);
  await put(S, 'kaykit', 'shelf_B_large_decorated', -2.6, 0, -SD + 0.4, 0, 1.0); await put(S, 'kaykit', 'armchair', 2.2, 0, -1.6, -0.9, 1.0); await put(S, 'kaykit', 'lamp_standing', 2.85, 0, -2.6, 0, 1.1);
  await put(S, 'kaykit', 'rug_rectangle_B', 0.2, 0.005, -1.8, 0, 2.0); await put(S, 'kaykit', 'pictureframe_large_B', -0.8, 2.1, -SD + 0.06, 0, 1.0);
  const kidDesk = await put(S, 'kaykit', 'table_small', 1.9, 0, -0.9, 0, 0.75);
  const book = new THREE.Group(); S.add(book); box(book, 0.24, 0.02, 0.17, tm('#f4efe4'), 0, 0, 0); box(book, 0.25, 0.012, 0.18, tm('#8a2a2a'), 0, -0.012, 0);
  const lS = new THREE.PointLight('#ffd9a8', 7, 8, 1.6); lS.position.set(0.2, 2.8, -1.8); S.add(lS); const lW = new THREE.PointLight('#bcd8ff', 3, 6, 1.6); lW.position.set(1.6, 1.8, -SD + 1); S.add(lW);
  const desk = { lamp: lamp, typer, paperT, phone, receiver, mug };
  return { H, D, Y, RW, RD, RH, updDoll, updBoard, setCord, cords, lampP, desk, S, boardG, stamp, arrowM, book, bulbP, kidDesk };
}
