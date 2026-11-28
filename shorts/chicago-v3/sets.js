// Sets for "Chicago lifted a hotel": one exterior street world (state-driven: mud era -> raised street -> hotel lift)
// and one cut-away hotel interior. Procedural geometry + canvas textures; Kenney / KayKit CC0 props from the installed skill.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { V, lerp, clamp } from './cast.js';

const ENG = '/.claude/skills/claude-3d-animated-shorts/engine';
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const tm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.8, metalness: o.m ?? 0, map: o.map || null, emissive: o.e || '#000', emissiveIntensity: o.ei ?? 1, emissiveMap: o.emap || null, transparent: !!o.op, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide });
export const ctex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return `#${c.getHexString()}`; };
function boxIn(G, w, h, d, mat, x, y, z, o = {}) { const m = new THREE.Mesh(o.round ? new RoundedBoxGeometry(w, h, d, 2, o.round) : new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; m.castShadow = o.cast ?? true; m.receiveShadow = true; G.add(m); return m; }

/* ---------------- textures ---------------- */
const TX = {};
function textures() {
  TX.mud = ctex(512, 512, (g, w, h) => { g.fillStyle = '#5d4632'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = rnd(i) > 0.5 ? `rgba(30,18,10,${0.05 + rnd(i * 2) * 0.12})` : `rgba(140,110,80,${0.04 + rnd(i * 3) * 0.08})`; g.beginPath(); g.ellipse(rnd(i * 5) * w, rnd(i * 7) * h, 3 + rnd(i * 9) * 22, 2 + rnd(i * 11) * 9, rnd(i) * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 10; i++) { g.strokeStyle = 'rgba(25,15,8,0.3)'; g.lineWidth = 7; g.beginPath(); const y = rnd(i * 13) * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + 20, 2 * w / 3, y - 20, w, y); g.stroke(); } }, [18, 6]);
  TX.fill = ctex(512, 512, (g, w, h) => { g.fillStyle = '#8a6c4e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '60,40,25' : '180,150,110'},${0.06 + rnd(i * 3) * 0.1})`; g.beginPath(); g.arc(rnd(i * 5) * w, rnd(i * 7) * h, 2 + rnd(i * 9) * 10, 0, 7); g.fill(); } }, [14, 4]);
  TX.cobble = ctex(512, 512, (g, w, h) => { g.fillStyle = '#5e5a58'; g.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = 0; c < 12; c++) { g.fillStyle = shade('#8a8480', 0.85 + rnd(r * 17 + c) * 0.3); g.beginPath(); g.ellipse(c * 44 + (r % 2) * 22 + 20, r * 32 + 16, 19, 13, 0, 0, 7); g.fill(); } }, [20, 4]);
  TX.plank = ctex(512, 128, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = shade('#9a7550', 0.8 + rnd(i * 3) * 0.35); g.fillRect(i * 32, 0, 32, h); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(i * 32, 0, 2, h); } }, [12, 1]);
  TX.brick = ctex(512, 512, (g, w, h) => { g.fillStyle = '#6f4638'; g.fillRect(0, 0, w, h); for (let r = 0; r < 24; r++) for (let c = -1; c < 9; c++) { g.fillStyle = shade('#a5523f', 0.8 + rnd(r * 31 + c) * 0.35); g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 21.3 + 2, 60, 17); } }, [6, 10]);
  TX.wood = ctex(256, 512, (g, w, h) => { for (let y = 0; y < h; y += 22) { g.fillStyle = shade('#8c6a4a', 0.8 + rnd(y) * 0.35); g.fillRect(0, y, w, 22); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, w, 2); } }, [3, 3]);
  TX.wallpaper = ctex(256, 256, (g, w, h) => { g.fillStyle = '#c9a98a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = '#d4b696'; g.fillRect(i * 64 + 8, 0, 26, h); } for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = 'rgba(160,80,70,0.45)'; g.beginPath(); g.arc(x * 64 + 21, y * 64 + 32 + (x % 2) * 20, 6, 0, 7); g.fill(); } }, [4, 2]);
  TX.wall2 = ctex(256, 256, (g, w, h) => { g.fillStyle = '#9fb3a2'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(i * 44, 0, 18, h); } }, [4, 2]);
  TX.wall3 = ctex(256, 256, (g, w, h) => { g.fillStyle = '#b9898a'; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) { g.fillStyle = 'rgba(255,240,220,0.12)'; g.fillRect(x * 32 + 8, y * 32 + 8, 16, 16); } }, [4, 2]);
  TX.floorIn = ctex(512, 512, (g, w, h) => { for (let i = 0; i < 10; i++) { g.fillStyle = shade('#8a5a34', 0.8 + rnd(i * 3) * 0.35); g.fillRect(0, i * 51, w, 51); g.fillStyle = 'rgba(40,20,10,0.4)'; g.fillRect(0, i * 51, w, 2); } }, [3, 3]);
  TX.rug = ctex(256, 256, (g, w) => { g.fillStyle = '#7a2f33'; g.fillRect(0, 0, w, w); [[118, '#d9b56a'], [104, '#2f4a5a'], [84, '#c98a4a'], [60, '#7a2f33'], [36, '#e3c98a']].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.ellipse(w / 2, w / 2, r, r * 0.7, 0, 0, 7); g.fill(); }); });
}

/* storefront facade texture with painted sign + emissive windows */
function facadeTex(seed, wall, sign, wood) {
  const paint = (em) => ctex(512, 512, (g, w, h) => { g.fillStyle = em ? '#000' : wall; g.fillRect(0, 0, w, h);
    if (!em) for (let y = 0; y < h; y += wood ? 20 : 12) { g.fillStyle = `rgba(0,0,0,${0.06 + rnd(y + seed) * 0.08})`; g.fillRect(0, y, w, 2); }
    const cols = 3, rows = 2, cw = w / cols, rh = h * 0.27;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * 0.24, y = 26 + r * (rh + 14), ww = cw * 0.52, hh = rh * 0.78, lit = rnd(seed * 7 + r * 3 + c) > 0.55;
      if (em) { if (lit) { g.fillStyle = '#ffb858'; g.fillRect(x, y, ww, hh); } continue; }
      g.fillStyle = '#e6dcc4'; g.fillRect(x - 7, y - 7, ww + 14, hh + 18); g.fillStyle = lit ? '#e8b468' : '#3a4a5e'; g.fillRect(x, y, ww, hh); g.fillStyle = '#e6dcc4'; g.fillRect(x + ww / 2 - 3, y, 6, hh); g.fillRect(x, y + hh / 2 - 3, ww, 6); }
    const sy = h * 0.62;
    if (em) { g.fillStyle = '#ffb04a'; g.fillRect(36, sy + 56, w * 0.3, h - sy - 70); g.fillRect(w * 0.62, sy + 56, w * 0.3, h - sy - 70); return; }
    g.fillStyle = '#2a1d16'; g.fillRect(0, sy, w, 48); g.fillStyle = '#f0d58c'; g.font = '36px InterB'; g.textAlign = 'center'; g.fillText(sign, w / 2, sy + 37);
    g.fillStyle = '#e8c078'; g.fillRect(36, sy + 56, w * 0.3, h - sy - 70); g.fillRect(w * 0.62, sy + 56, w * 0.3, h - sy - 70); g.fillStyle = '#4a2c1a'; g.fillRect(w * 0.41, sy + 56, w * 0.18, h - sy - 56); });
  return { map: paint(false), emap: paint(true) };
}
function storefront(G, x, z, w, h, d, wall, sign, seed, o = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); if (o.ry) g.rotation.y = o.ry; G.add(g);
  boxIn(g, w, h, d, tm(shade(wall, 0.8)), 0, h / 2, -d / 2);
  const t = facadeTex(seed, wall, sign, o.wood); const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tm('#fff', { map: t.map, emap: t.emap, e: '#ffffff', ei: 0.35 })); f.position.set(0, h / 2, 0.02); f.receiveShadow = true; g.add(f);
  boxIn(g, w + 0.4, 0.3, d + 0.4, tm(shade(wall, 0.6)), 0, h + 0.1, -d / 2); boxIn(g, w + 0.2, 0.5, 0.25, tm(shade(wall, 1.15)), 0, h - 0.4, 0.1);
  if (o.awning) { boxIn(g, w * 0.92, 0.1, 1.9, tm(o.awning), 0, h * 0.42, 0.95, {}).rotation.x = 0.16; for (const f2 of [-0.44, 0.44]) boxIn(g, 0.12, h * 0.42, 0.12, tm('#e6dcc4'), w * f2, h * 0.21, 1.8); }
  boxIn(g, 0.6, 1.2, 0.6, tm('#6a4034'), w * 0.25, h + 0.7, -d * 0.3);
  return g;
}

/* ---------------- the Tremont House (original stylised design) ---------------- */
export const HOT = { W: 20, D: 14, floors: 6, fh: 3.1, gh: 4.0 };
function hotel(G) {
  const { W, D, floors, fh, gh } = HOT; const g = new THREE.Group(); G.add(g); const H = gh + (floors - 1) * fh;
  const brick = tm('#fff', { map: TX.brick }); const stone = tm('#e2d6bd', { r: 0.85 }); const glassLit = tm('#f0b060', { e: '#ff9c38', ei: 0.55, r: 0.5 }), glassDark = tm('#4d6078', { e: '#1c2a3c', ei: 0.5, r: 0.25, m: 0.3 });
  boxIn(g, W, H, D, brick, 0, H / 2 + 0.6, -D / 2); boxIn(g, W + 0.3, 0.6, D + 0.3, stone, 0, 0.3, -D / 2);
  for (let f = 0; f <= floors; f++) boxIn(g, W + 0.3, 0.2, D + 0.3, stone, 0, 0.6 + gh + (f - 1) * fh + (f === 0 ? -gh + 0.1 : 0), -D / 2);
  // windows: instanced for speed (front + sides)
  const winG = new THREE.BoxGeometry(1.05, 1.75, 0.08), surG = new THREE.BoxGeometry(1.35, 2.1, 0.12), sillG = new THREE.BoxGeometry(1.55, 0.12, 0.3), capG = new THREE.BoxGeometry(1.6, 0.22, 0.25);
  const slots = []; const cols = 9;
  for (let f = 1; f < floors; f++) for (let c = 0; c < cols; c++) slots.push([-W / 2 + (c + 0.5) * (W / cols), 0.6 + gh + (f - 1) * fh + 1.35, 0.01, 0, rnd(f * 17 + c) < 0.55]);
  for (const s of [-1, 1]) for (let f = 1; f < floors; f++) for (let c = 0; c < 6; c++) slots.push([s * (W / 2 + 0.01), 0.6 + gh + (f - 1) * fh + 1.35, -D / 2 + (c + 0.5) * (D / 6) - D / 2 + D / 2, s * Math.PI / 2, rnd(f * 23 + c + s) < 0.5]);
  const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = false; m.receiveShadow = true; g.add(m); return m; };
  const nL = slots.filter(s => s[4]).length, nD = slots.length - nL; const IL = mk(winG, glassLit, nL), ID = mk(winG, glassDark, nD), IS = mk(surG, stone, slots.length), IC = mk(capG, stone, slots.length), IT = mk(sillG, stone, slots.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1); let li = 0, di = 0;
  slots.forEach(([x, y, z, ry, lit], i) => { q.setFromAxisAngle(V(0, 1, 0), ry); const off = V(0, 0, 0.05).applyQuaternion(q);
    M.compose(V(x, y, z), q, sc); IS.setMatrixAt(i, M); M.compose(V(x, y, z).add(off), q, sc); (lit ? IL : ID).setMatrixAt(lit ? li++ : di++, M);
    M.compose(V(x, y + 1.15, z).add(off.clone().multiplyScalar(1.5)), q, sc); IC.setMatrixAt(i, M); M.compose(V(x, y - 1.05, z).add(off.clone().multiplyScalar(2)), q, sc); IT.setMatrixAt(i, M); });
  // ground floor arcade with lit shopfronts and the entrance
  for (let c = 0; c <= cols; c++) boxIn(g, 0.55, gh - 0.4, 0.45, stone, -W / 2 + c * (W / cols), 0.6 + (gh - 0.4) / 2, 0.2);
  for (let c = 0; c < cols; c++) { const door = c === 4; const x = -W / 2 + (c + 0.5) * (W / cols); boxIn(g, W / cols - 0.6, gh - 1.0, 0.06, door ? tm('#5a341c') : glassLit, x, 0.6 + (gh - 1.0) / 2 + 0.05, 0.04, { cast: false }); if (!door) boxIn(g, W / cols - 0.6, 0.12, 0.12, tm('#3a2618'), x, 0.6 + gh * 0.55, 0.1, { cast: false }); }
  boxIn(g, W + 0.4, 0.45, 0.5, stone, 0, 0.6 + gh - 0.35, 0.25);
  // cornice, roof, chimneys, rooftop sign
  boxIn(g, W + 0.9, 0.35, D + 0.9, stone, 0, H + 0.75, -D / 2); boxIn(g, W + 1.4, 0.3, D + 1.4, tm('#d8cbb0'), 0, H + 1.05, -D / 2); boxIn(g, W + 0.2, 0.8, D + 0.2, tm('#7e4034'), 0, H + 1.55, -D / 2);
  for (const [cx, cz] of [[-7, -3], [-2, -9], [3, -4], [7.5, -10]]) boxIn(g, 0.9, 2, 0.9, tm('#7e3f32'), cx, H + 2.6, cz);
  const sign = ctex(1024, 170, (gg, w, h) => { gg.fillStyle = '#1b2740'; gg.fillRect(0, 0, w, h); gg.strokeStyle = '#d9b44a'; gg.lineWidth = 12; gg.strokeRect(10, 10, w - 20, h - 20); gg.fillStyle = '#f5d98c'; gg.font = '104px InterB'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText('TREMONT HOUSE', w / 2, h / 2 + 6); });
  const sg = new THREE.Mesh(new THREE.BoxGeometry(12, 2.0, 0.15), tm('#fff', { map: sign, emap: sign, e: '#ffffff', ei: 0.25 })); sg.position.set(0, H + 3.3, -0.8); sg.castShadow = true; g.add(sg);
  // underside: needle beams + timber sill the jacks push on
  for (let i = 0; i < 11; i++) boxIn(g, 0.32, 0.3, D + 1.2, tm('#7a5632'), -W / 2 + 0.8 + i * ((W - 1.6) / 10), -0.15, -D / 2);
  boxIn(g, W + 0.8, 0.32, 0.4, tm('#8a6238'), 0, -0.15, 0.1);
  return g;
}

/* screw jack: instanced parts are cheap enough for 'thousands' */
function jackField(G, xs, zs) {
  const n = xs.length * zs.length;
  const geos = { base: new THREE.CylinderGeometry(0.11, 0.19, 0.34, 10), screw: new THREE.CylinderGeometry(0.045, 0.045, 1, 8), cap: new THREE.CylinderGeometry(0.13, 0.13, 0.06, 10), bar: new THREE.CylinderGeometry(0.022, 0.022, 1.0, 6), crib: new THREE.BoxGeometry(0.6, 1, 0.6) };
  const mats = { base: tm('#3f464e', { m: 0.6, r: 0.45 }), screw: tm('#9aa3ab', { m: 0.8, r: 0.3 }), cap: tm('#2b3036', { m: 0.6, r: 0.5 }), bar: tm('#b08a5a', { r: 0.7 }), crib: tm('#9c7044', { r: 0.95 }) };
  const I = Object.fromEntries(Object.keys(geos).map(k => { const m = new THREE.InstancedMesh(geos[k], mats[k], n); m.castShadow = k !== 'bar'; m.receiveShadow = true; G.add(m); return [k, m]; }));
  const pts = []; xs.forEach(x => zs.forEach(z => pts.push([x + (rnd(x * 7 + z) - 0.5) * 0.25, z + (rnd(x + z * 3) - 0.5) * 0.25])));
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const update = (floorY, topY, ang) => { const cribH = Math.max(0.05, (topY - floorY) - 1.0);
    pts.forEach(([x, z], i) => { const y0 = floorY + cribH; Q.identity();
      M.compose(V(x, floorY + cribH / 2, z), Q, V(1, cribH, 1)); I.crib.setMatrixAt(i, M);
      M.compose(V(x, y0 + 0.17, z), Q, V(1, 1, 1)); I.base.setMatrixAt(i, M);
      const sl = Math.max(0.05, topY - y0 - 0.37); M.compose(V(x, y0 + 0.34 + sl / 2, z), Q, V(1, sl, 1)); I.screw.setMatrixAt(i, M);
      M.compose(V(x, topY - 0.03, z), Q, V(1, 1, 1)); I.cap.setMatrixAt(i, M);
      E.set(Math.PI / 2, ang + i * 0.37, 0, 'YXZ'); Q.setFromEuler(E); M.compose(V(x, y0 + 0.42, z), Q, V(1, 1, 1)); I.bar.setMatrixAt(i, M); });
    Object.values(I).forEach(m => (m.instanceMatrix.needsUpdate = true)); };
  return { update, count: n, pts };
}

/* ---------------- exterior world ---------------- */
export async function buildExterior(scene) {
  textures();
  const G = new THREE.Group(); scene.add(G);
  const { W, D } = HOT; const HZ = -6;   // hotel front wall
  const GRADE = 1.9, PIT = -2.1;
  // ground: west block mud street (rises in the time-lapse), hotel block raised street, trench in front of the hotel
  const mudMat = tm('#fff', { map: TX.mud, r: 0.35, m: 0.1 }), fillMat = tm('#fff', { map: TX.fill, r: 0.95 }), cobMat = tm('#fff', { map: TX.cobble, r: 0.8 });
  const westFill = boxIn(G, 60, 1, 30, fillMat, -45, 0, 6); const westTop = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), mudMat); westTop.rotation.x = -Math.PI / 2; westTop.position.set(-45, 0.01, 1); westTop.receiveShadow = true; G.add(westTop);
  // hotel block: everything except the trench is at GRADE (built as boxes around the trench)
  const TZ0 = HZ + 0.1, TZ1 = HZ + 3.0;   // trench strip in front of the hotel
  boxIn(G, 30, GRADE - PIT, 30, fillMat, 0, (GRADE + PIT) / 2, TZ1 + 15, { cast: false });                       // street side
  for (const s of [-1, 1]) boxIn(G, 8, GRADE - PIT, 30, fillMat, s * (W / 2 + 1.5 + 4), (GRADE + PIT) / 2, HZ - 10, { cast: false });   // beside the hotel
  boxIn(G, W + 3, 0.2, D + 6, tm('#4a3828', { r: 1 }), 0, PIT - 0.1, HZ - D / 2 + 1.4, { cast: false });   // pit floor (under + in front of the hotel)
  const street = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), cobMat); street.rotation.x = -Math.PI / 2; street.position.set(0, GRADE + 0.01, TZ1 + 6); street.receiveShadow = true; G.add(street);
  // timber retaining wall + boardwalk + rail along the trench
  boxIn(G, W + 3, GRADE - PIT, 0.15, tm('#fff', { map: TX.wood }), 0, (GRADE + PIT) / 2, TZ1, {});
  for (let i = 0; i < 12; i++) boxIn(G, 0.2, GRADE - PIT + 0.3, 0.2, tm('#6a4a2c'), -W / 2 - 1 + i * ((W + 2) / 11), (GRADE + PIT) / 2 + 0.1, TZ1 - 0.15);
  const bw = boxIn(G, 32, 0.12, 2.6, tm('#fff', { map: TX.plank }), 0, GRADE + 0.06, TZ1 + 1.3); bw.castShadow = false;
  for (let i = 0; i < 22; i++) boxIn(G, 0.09, 0.95, 0.09, tm('#5a3c22'), -W / 2 - 1 + i * ((W + 2) / 21), GRADE + 0.55, TZ1 + 0.1);
  for (const y of [0.6, 1.0]) boxIn(G, W + 2, 0.07, 0.07, tm('#6a4a2c'), 0, GRADE + y, TZ1 + 0.1);
  // the hotel + its jacks
  const hotelG = new THREE.Group(); G.add(hotelG); hotel(hotelG); hotelG.position.set(0, 0, HZ);
  const jx = Array.from({ length: 24 }).map((_, i) => -W / 2 + 0.6 + i * ((W - 1.2) / 23)), jz = Array.from({ length: 14 }).map((_, i) => HZ - 0.4 - i * ((D - 0.8) / 13));
  const jacks = jackField(G, jx, jz);
  const frontJacks = jackField(G, jx, [HZ + 0.25]);
  // lanterns in the pit (lights the crawl space)
  const lanterns = []; for (const [x, z] of [[-7, HZ - 2], [0, HZ - 5], [7, HZ - 3], [-3, HZ - 9], [5, HZ - 11]]) { const l = new THREE.PointLight('#ffb060', 6, 9, 1.8); l.position.set(x, PIT + 1.2, z); G.add(l); lanterns.push(l);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8), tm('#ffd98a', { e: '#ffb347', ei: 2.5 })); b.position.set(x, PIT + 1.2, z); G.add(b); }
  // storefront rows: west block (mud era), and neighbours of the hotel on the raised grade
  const SF = [['#8c6a4a', 'DRY GOODS', true, '#6a2f2a'], ['#7a5a5a', 'HARDWARE', false, null], ['#9a6a4c', 'BOOTS & SHOES', false, '#2f4a5a'], ['#86745a', 'SALOON', true, null], ['#7d6a58', 'GROCER', true, '#4a5a2a'], ['#8a5a4a', 'BAKERY', false, '#6a2f2a'], ['#6a6a7a', 'BANK', false, null]];
  const west = new THREE.Group(); G.add(west);
  for (let i = 0; i < 6; i++) { const s = SF[i]; storefront(west, -24 - i * 7.2, -4.5, 6.8, 6 + rnd(i) * 3, 8, s[0], s[1], i + 3, { wood: s[2], awning: s[3] }); }
  for (let i = 0; i < 6; i++) { const s = SF[(i + 3) % 7]; storefront(west, -24 - i * 7.4, 7.0, 7.0, 5.5 + rnd(i + 9) * 3, 8, s[0], s[1], i + 13, { wood: s[2], awning: s[3], ry: Math.PI }); }
  const westWalk = []; for (const z of [-3.7, 6.2]) { const w2 = boxIn(west, 46, 0.14, 1.6, tm('#fff', { map: TX.plank }), -37, 0.2, z); westWalk.push(w2); }
  for (const s of [-1, 1]) { storefront(G, s * (W / 2 + 5), HZ + 0.5, 8, 9.5, 9, SF[s > 0 ? 5 : 2][0], SF[s > 0 ? 5 : 2][1], s > 0 ? 31 : 32, { awning: '#6a2f2a' }).position.y = GRADE; }
  for (let i = 0; i < 5; i++) { const s = SF[i]; storefront(G, -12 + i * 7.4, TZ1 + 13, 7, 7 + rnd(i * 4) * 3, 8, s[0], s[1], i + 41, { wood: s[2], awning: s[3], ry: Math.PI }).position.y = GRADE; }
  // far city + lake glimpse at the end of the west street
  for (let i = 0; i < 30; i++) { const x = -110 + i * 8 + rnd(i) * 3, h = 6 + rnd(i * 2.3) * 12, z = -40 - rnd(i * 4.1) * 30; boxIn(G, 6 + rnd(i * 6) * 4, h, 8, tm(['#7d6a78', '#8a7478', '#6f6074'][i % 3], { r: 1 }), x, h / 2, z, { cast: false }); }
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(90, 80), tm('#5f96b8', { r: 0.25, m: 0.2 })); lake.rotation.x = -Math.PI / 2; lake.position.set(-125, 0.02, 1); G.add(lake);
  // puddles (mud era)
  const puddles = []; for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.7 + rnd(i * 2) * 1.4, 22), tm('#9aa6b4', { r: 0.06, m: 0.7 })); p.rotation.x = -Math.PI / 2; p.scale.y = 0.55; p.position.set(-21 - rnd(i * 3.1) * 38, 0.03, -2 + rnd(i * 5.7) * 7); G.add(p); puddles.push(p); }
  // a stuck wagon (procedural), barrels, crates, lamps
  const wagon = new THREE.Group(); G.add(wagon); wagon.position.set(-31, 0, 2.2); wagon.rotation.y = 0.25;
  boxIn(wagon, 3.2, 0.16, 1.5, tm('#fff', { map: TX.plank }), 0, 1.0, 0); for (const s of [-1, 1]) boxIn(wagon, 3.2, 0.45, 0.07, tm('#8a6238'), 0, 1.28, s * 0.72);
  const wheels = []; for (const [x, z] of [[-1.05, 0.85], [1.05, 0.85], [-1.05, -0.85], [1.05, -0.85]]) { const wh = new THREE.Group(); wh.position.set(x, 0.58, z); wagon.add(wh); const tr = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 22), tm('#3a2516')); tr.castShadow = true; wh.add(tr); for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.05, 0.05), tm('#5a3a22')); sp.rotation.z = k * Math.PI / 4; wh.add(sp); } wheels.push(wh); }
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12), tm('#8a5c34')); b.position.set(-0.5 + i * 0.5, 1.48, (i % 2) * 0.3 - 0.15); b.castShadow = true; wagon.add(b); }
  boxIn(wagon, 1.6, 0.08, 0.08, tm('#5a3a22'), -2.3, 0.85, 0, {}).rotation.z = -0.25;
  const lamps = []; for (const [x, y, z] of [[-24, 0.2, -3.2], [-40, 0.2, -3.2], [-12, GRADE, TZ1 + 2.4], [12, GRADE, TZ1 + 2.4]]) { const lg = new THREE.Group(); lg.position.set(x, y, z); G.add(lg); boxIn(lg, 0.1, 3.2, 0.1, tm('#1e2226', { m: 0.6 }), 0, 1.6, 0); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.4, 4), tm('#ffd98a', { e: '#ffb347', ei: 0.4 })); gl.position.y = 3.4; lg.add(gl); lamps.push(gl); }
  // engineer's easel with the plan (west block), a dirt pile, shovels
  const easel = new THREE.Group(); easel.position.set(-23.5, 0, 3.6); easel.rotation.y = -0.6; G.add(easel);
  for (const s of [-1, 1]) boxIn(easel, 0.05, 1.7, 0.05, tm('#6a4a2c'), s * 0.4, 0.85, 0, {}).rotation.z = s * 0.08;
  const plan = ctex(512, 384, (g, w, h) => { g.fillStyle = '#1f4a78'; g.fillRect(0, 0, w, h); g.strokeStyle = '#cfe6ff'; g.lineWidth = 4; g.strokeRect(20, 20, w - 40, h - 40); g.fillStyle = '#cfe6ff'; g.font = '30px InterB'; g.fillText('NEW GRADE', 40, 70);
    g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.beginPath(); g.moveTo(40, 300); g.lineTo(470, 300); g.stroke(); g.strokeStyle = '#cfe6ff'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 340); g.lineTo(470, 340); g.stroke(); g.setLineDash([12, 10]); g.beginPath(); g.moveTo(256, 340); g.lineTo(256, 300); g.stroke();
    g.setLineDash([]); g.beginPath(); g.arc(256, 340, 28, 0, 7); g.stroke(); g.font = '24px InterB'; g.fillText('SEWER', 300, 370); g.fillText('+ FEET', 380, 290); });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), tm('#fff', { map: plan })); pl.position.set(0, 1.35, 0.04); pl.rotation.x = -0.15; easel.add(pl);
  const pile = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), fillMat); pile.scale.y = 0.55; pile.position.set(-37, 0, -2.6); pile.castShadow = true; G.add(pile);
  // sky dome + far haze
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: ctex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); [[0, '#2f62ad'], [0.32, '#79a6d8'], [0.46, '#d7e4ea'], [0.5, '#efe6d2'], [0.56, '#b9a58c'], [1, '#6a5a4a']].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
  G.add(sky);
  const state = { GRADE, PIT, HZ, TZ1, westFillH: 0, hotelLift: 0, jackAng: 0 };
  const update = (s) => { Object.assign(state, s);
    const wf = state.westFillH; westFill.scale.y = Math.max(0.001, wf + 0.4); westFill.position.y = (wf - 0.4) / 2; westTop.position.y = wf + 0.01; westTop.material = wf > 0.3 ? fillMat : mudMat;
    puddles.forEach(p => { p.position.y = wf + 0.03; p.visible = wf < 0.3; }); westWalk.forEach(w2 => (w2.position.y = 0.2 + wf)); wagon.position.y = wf < 0.3 ? -0.32 : wf;
    hotelG.position.y = state.hotelLift; jacks.update(PIT, state.hotelLift - 0.3, state.jackAng); frontJacks.update(PIT, state.hotelLift - 0.3, state.jackAng);
    lamps.forEach(l => (l.material.emissiveIntensity = state.lampsOn ?? 0.4)); };
  update({});
  return { G, update, state, wheels, easel, pile, jacks, hotelG, sky };
}

/* ---------------- interior: one cut-away building with three stacked rooms ---------------- */
export async function buildInterior(scene) {
  const GL = new GLTFLoader(); const CACHE = {}; const load = u => (CACHE[u] ||= GL.loadAsync(u));
  const put = async (G, kit, name, x, y, z, ry = 0, k = 1) => { const g = (await load(`${ENG}/assets/props/${kit}/${name}.${kit === 'kenney' ? 'glb' : 'gltf'}`)).scene.clone(true);
    g.traverse(m => { if (m.isMesh) { const s = m.material; m.material = new THREE.MeshStandardMaterial({ color: s.color ? s.color.clone() : new THREE.Color('#fff'), map: s.map || null, roughness: Math.max(0.45, s.roughness ?? 0.7), metalness: Math.min(0.2, s.metalness ?? 0) }); m.castShadow = m.receiveShadow = true; } });
    const kref = { kenney: KS, kaykit: KK }[kit]; g.scale.setScalar(kref * k); g.rotation.y = ry; g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); const c = b.getCenter(V(0, 0, 0)); g.position.set(x - c.x, y - b.min.y, z - c.z); G.add(g); return g; };
  const kenRef = new THREE.Box3().setFromObject((await load(`${ENG}/assets/props/kenney/desk.glb`)).scene); const KS = 0.74 / (kenRef.max.y - kenRef.min.y);
  const kayRef = new THREE.Box3().setFromObject((await load(`${ENG}/assets/props/kaykit/table_medium.gltf`)).scene); const KK = 0.74 / (kayRef.max.y - kayRef.min.y);
  const G = new THREE.Group(); scene.add(G); G.position.set(200, 0, 0);
  const B = new THREE.Group(); G.add(B);   // the building (rises)
  const RW = 6, RD = 4.2, RH = 3.0;   // room size
  const rooms = [{ y: 2 * RH, wall: TX.wallpaper, name: 'bed' }, { y: RH, wall: TX.wall2, name: 'dining' }, { y: 0, wall: TX.wall3, name: 'lobby' }];
  const brick = tm('#fff', { map: TX.brick });
  boxIn(B, RW + 0.6, 3 * RH + 0.4, 0.3, brick, 0, (3 * RH) / 2, -RD - 0.15); for (const s of [-1, 1]) boxIn(B, 0.3, 3 * RH + 0.4, RD + 0.3, brick, s * (RW / 2 + 0.15), (3 * RH) / 2, -RD / 2);
  boxIn(B, RW + 1.2, 0.4, RD + 1.0, tm('#e2d6bd'), 0, 3 * RH + 0.2, -RD / 2);
  // exposed front: cut edges in stone colour so the cut-away reads as intentional
  for (const r of rooms) { boxIn(B, RW, 0.22, RD, tm('#fff', { map: TX.floorIn, r: 0.55 }), 0, r.y - 0.11, -RD / 2); boxIn(B, RW + 0.6, 0.26, 0.2, tm('#e2d6bd'), 0, r.y - 0.13, 0.05);
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), tm('#fff', { map: r.wall })); wl.position.set(0, r.y + RH / 2, -RD + 0.01); wl.receiveShadow = true; B.add(wl);
    for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), tm('#fff', { map: r.wall })); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * (RW / 2 - 0.01), r.y + RH / 2, -RD / 2); sw.receiveShadow = true; B.add(sw); }
    boxIn(B, RW, 0.12, 0.05, tm('#6a4a2c'), 0, r.y + 0.06, -RD + 0.04); }
  // windows on the back wall: show the outside world (which slides down as the building rises)
  const outside = ctex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h * 0.6); gr.addColorStop(0, '#79a6d8'); gr.addColorStop(1, '#e7e2d2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a6a5a'; for (let i = 0; i < 6; i++) g.fillRect(i * 90 + 6, h * 0.42 - (i % 2) * 30, 76, h); g.fillStyle = '#e8c070'; for (let i = 0; i < 6; i++) for (let r = 0; r < 5; r++) if (rnd(i * 7 + r) > 0.5) g.fillRect(i * 90 + 18 + (r % 2) * 30, h * 0.46 + r * 46 - (i % 2) * 30, 18, 24);
    g.fillStyle = '#6a5040'; g.fillRect(0, h * 0.85, w, h * 0.15); });
  outside.wrapT = THREE.RepeatWrapping;
  const view = new THREE.Mesh(new THREE.PlaneGeometry(RW * 1.6, 3 * RH * 1.2), new THREE.MeshBasicMaterial({ map: outside })); view.position.set(0, 1.5 * RH, -RD - 2.5); G.add(view);
  for (const r of rooms) for (const x of [-1.6, 1.6]) { const fr = new THREE.Group(); fr.position.set(x, r.y + 1.7, -RD + 0.03); B.add(fr);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ colorWrite: false })); hole.renderOrder = -1; fr.add(hole);   // (visual hole is faked below)
    boxIn(fr, 1.2, 0.08, 0.12, tm('#efe6d2'), 0, 0.74, 0.03); boxIn(fr, 1.2, 0.08, 0.16, tm('#efe6d2'), 0, -0.74, 0.04); for (const s of [-1, 1]) boxIn(fr, 0.08, 1.56, 0.12, tm('#efe6d2'), s * 0.56, 0, 0.03); boxIn(fr, 0.05, 1.4, 0.06, tm('#efe6d2'), 0, 0, 0.03);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.44), new THREE.MeshBasicMaterial({ map: outside.clone() })); pane.position.z = 0.012; pane.userData.ox = x; pane.userData.oy = r.y + 1.7; fr.add(pane); fr.userData.pane = pane;
    for (const s of [-1, 1]) { const cu = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.9, 0.08), tm(r.name === 'bed' ? '#8e2f33' : r.name === 'dining' ? '#2f5a48' : '#6a2a5a')); cu.position.set(s * 0.72, 0.05, 0.12); cu.castShadow = true; fr.add(cu); } }
  const panes = []; B.traverse(o => { if (o.userData && o.userData.pane) panes.push(o.userData.pane); });
  panes.forEach(p => { p.material.map.wrapS = p.material.map.wrapT = THREE.RepeatWrapping; p.material.map.repeat.set(0.18, 0.2); p.material.map.needsUpdate = true; });
  // bedroom (top)
  const Y3 = 2 * RH, Y2 = RH;
  await put(B, 'kaykit', 'bed_double_A', -0.9, Y3, -RD + 1.3, 0, 1.0); await put(B, 'kaykit', 'cabinet_small', 0.75, Y3, -RD + 0.4, 0, 0.9); await put(B, 'kaykit', 'lamp_table', 0.75, Y3 + 0.62, -RD + 0.4, 0, 0.9);
  await put(B, 'kaykit', 'rug_oval_A', 0.6, Y3 + 0.005, -1.4, 0, 1.6); await put(B, 'kaykit', 'pictureframe_large_A', -0.9, Y3 + 1.9, -RD + 0.08, 0, 0.9); await put(B, 'kaykit', 'armchair', 2.2, Y3, -1.9, -0.6, 0.95);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 14), tm('#f2f4f6', { r: 0.25 })); cup.castShadow = true; B.add(cup); cup.position.set(0.62, Y3 + 0.67, -RD + 0.48);
  // dining (middle)
  await put(B, 'kaykit', 'table_medium_long', -0.3, Y2, -2.0, 0, 1.0); for (const [x, z, a] of [[-1.25, -2.0, Math.PI / 2], [0.65, -2.0, -Math.PI / 2]]) await put(B, 'kaykit', 'chair_A_wood', x, Y2, z, a, 1.0);
  await put(B, 'kaykit', 'shelf_B_large_decorated', 2.2, Y2, -RD + 0.35, 0, 0.9); await put(B, 'kaykit', 'pictureframe_medium', -1.6, Y2 + 2.0, -RD + 0.08, 0, 1);
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.02, 0.95), tm('#f4efe4', { r: 1 })); cloth.position.set(-0.3, Y2 + 0.75, -2.0); cloth.receiveShadow = true; B.add(cloth);
  const plates = []; for (const x of [-0.95, 0.35]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.02, 24), tm('#ffffff', { r: 0.25 })); p.position.set(x, Y2 + 0.77, -2.0); B.add(p); plates.push(p);
    const food = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), tm(x < 0 ? '#c8742e' : '#7a9a3a')); food.scale.y = 0.5; food.position.set(x, Y2 + 0.8, -2.0); B.add(food); }
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 10), tm('#f4efe0', { e: '#ffcf80', ei: 0.4 })); candle.position.set(-0.3, Y2 + 0.88, -2.0); B.add(candle);
  // lobby (bottom): desk, bell, ledger, palm, the OPEN sign
  await put(B, 'kenney', 'desk', 0.6, 0, -2.2, 0, 1.25); await put(B, 'kenney', 'pottedPlant', -2.5, 0, -RD + 0.5, 0, 1.6); await put(B, 'kenney', 'coatRackStanding', 2.6, 0, -RD + 0.5, 0, 1.2);
  await put(B, 'kenney', 'chairCushion', -1.6, 0, -1.4, 0.7, 1.1);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), tm('#d9b44a', { m: 0.8, r: 0.3 })); bell.position.set(0.15, 0.93, -2.0); B.add(bell);
  const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), tm('#7a2a26')); ledger.position.set(0.75, 0.94, -2.0); B.add(ledger);
  const openSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), tm('#fff', { map: ctex(256, 102, (g, w, h) => { g.fillStyle = '#f1e6c8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1f6a3a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#1f6a3a'; g.font = '64px InterB'; g.textAlign = 'center'; g.fillText('OPEN', w / 2, 76); }), e: '#ffffff', ei: 0.15 }));
  openSign.position.set(-1.6, 2.1, -RD + 0.06); B.add(openSign);
  // lights per room
  for (const r of rooms) { const l = new THREE.PointLight('#ffd9a8', 7, 7, 1.7); l.position.set(0, r.y + 2.6, -1.4); B.add(l); const fx = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), tm('#fff3d0', { e: '#ffd890', ei: 2 })); fx.position.set(0, r.y + 2.85, -1.6); B.add(fx); }
  // exterior around the cut-away (for the pull-back): ground, trench, jacks under the building, a sky
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), tm('#fff', { map: TX.fill, r: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -2.1, -8); ground.receiveShadow = true; G.add(ground);
  const ijx = Array.from({ length: 7 }).map((_, i) => -RW / 2 + 0.2 + i * (RW - 0.4) / 6), ijz = [-0.3, -1.4, -2.5, -3.6];
  const iJacks = jackField(G, ijx, ijz);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 16, 12), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, color: '#9cc0e4' })); G.add(sky);
  const update = (lift, ang) => { B.position.y = lift; iJacks.update(-2.1, lift - 0.25, ang); panes.forEach(p => { p.material.map.offset.set((p.userData.ox + 3) / 12, (p.userData.oy + lift * 1.0) / 14 * 0.6 + lift * 0.09); }); };
  update(0, 0);
  return { G, B, update, RW, RD, RH, Y3, Y2, cup, plates, bell, openSign, rooms };
}
