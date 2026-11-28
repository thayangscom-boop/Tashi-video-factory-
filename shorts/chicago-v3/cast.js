// Cast + pose library for "Chicago lifted a hotel" (V3 white-headed style).
// Built on the claude-3d-animated-shorts character builder (stickrig.js, MIT) as a library; all designs here are original.
import * as THREE from 'three';
import { FACES as F0, withStache } from '../v3-test/v3faces.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const eio = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const seg = (t, a, b) => eio((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const yawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

/* ---------- extra expressions (same drawing language as v3faces.js) ---------- */
const K = '#1b1414';
const ln = (g, pts, w = 14) => { g.strokeStyle = K; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
const closed = g => { for (const d of [-1, 1]) ln(g, [[d * 96 - 32, -16], [d * 96, 2], [d * 96 + 32, -16]], 13); };
const browsN = (g, tilt = 0, lift = 0) => { for (const d of [-1, 1]) ln(g, [[d * 54, -105 - lift + tilt * 22], [d * 96, -114 - lift], [d * 138, -105 - lift - tilt * 22]], 13); };
const EXTRA = {
  sleep: g => { closed(g); browsN(g, -0.1, -4); ln(g, [[-14, 106], [14, 106]], 12); },
  yawn: g => { closed(g); browsN(g, -0.3, 12); g.fillStyle = '#5a1414'; g.strokeStyle = K; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 112, 34, 52, 0, 0, 7); g.fill(); g.stroke(); },
  shout: g => { for (const d of [-1, 1]) { g.fillStyle = K; g.beginPath(); g.ellipse(d * 96, -14, 26, 30, 0, 0, 7); g.fill(); } browsN(g, 0.9, -4);
    g.fillStyle = '#5a1414'; g.strokeStyle = K; g.lineWidth = 10; g.beginPath(); g.moveTo(-52, 76); g.quadraticCurveTo(0, 66, 52, 76); g.quadraticCurveTo(40, 160, 0, 160); g.quadraticCurveTo(-40, 160, -52, 76); g.fill(); g.stroke(); },
  determined: g => { for (const d of [-1, 1]) { g.fillStyle = K; g.beginPath(); g.ellipse(d * 96, -14, 24, 30, 0, 0, 7); g.fill(); } browsN(g, 0.6, -2); ln(g, [[-34, 106], [34, 106]], 15); },
  proud: g => { closed(g); browsN(g, -0.2, 8); ln(g, [[-46, 92], [0, 118], [46, 92]], 14); },
};
export const ALLFACES = { ...F0, ...EXTRA, suspL: g => F0.suspicious(g, -1), suspR: g => F0.suspicious(g, 1) };

/* ---------- cast ---------- */
export async function makeCast(SR, scene) {
  const base = { headCol: '#ffffff', headR: 0.3, bodyW: 0.82, headInk: 0.004, headInkClean: true, capBack: false, inkPx: 4.5, headLift: 0.78, headFwd: 0.55, flatHead: true, bodyInk: 0.02, headShape: 'rround',
    roundBottom: true, limbK: 0.6, head: 'ball', face: () => {}, rick: true, shoe: '#111', sole: '#111', armCol: '#3a2418', legCol: '#2b2230', shoeCol: '#3a2b26', flatCloth: true, noodle: true, mitten: true };
  const ink = new THREE.MeshBasicMaterial({ color: '#2a1612', side: THREE.BackSide });
  const hatAdd = (c, parts) => { const r = 0.3, g = new THREE.Group(); parts(g, r); const ms = []; g.traverse(m => { if (m.isMesh) ms.push(m); }); ms.forEach(m => { m.castShadow = true; const h = new THREE.Mesh(m.geometry, ink); h.scale.setScalar(1.06); m.add(h); }); c.head.add(g); return g; };
  const T = (col) => SR.toon(col, { rim: 0.4 });
  const HATS = {
    top: (col) => (g, r) => { const br = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.018, 28), T(col)); br.position.y = r * 0.74; const cr = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.68, r * 0.64, r * 1.05, 28), T(col)); cr.position.y = r * 1.27; const bd = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.655, r * 0.655, r * 0.2, 28), T('#7a2a22')); bd.position.y = r * 0.86; g.add(br, cr, bd); g.rotation.x = -0.12; },
    bowler: (col) => (g, r) => { const br = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.016, 28), T(col)); br.position.y = r * 0.7; const d = new THREE.Mesh(new THREE.SphereGeometry(r * 0.74, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), T(col)); d.position.y = r * 0.7; d.scale.y = 1.05; const bd = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.745, r * 0.745, r * 0.14, 24), T('#1b1b1f')); bd.position.y = r * 0.77; g.add(br, d, bd); g.rotation.x = -0.1; },
    night: (col) => (g, r) => { const band = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, r * 0.12, 8, 28), T('#ffffff')); band.rotation.x = Math.PI / 2; band.position.y = r * 0.58; g.add(band);
      let par = g, y = r * 0.58; [[0.9, 0.62, 0.5, 0.0], [0.62, 0.36, 0.55, -0.55], [0.36, 0.14, 0.5, -0.8]].forEach(([a, b, h, tilt]) => { const s = new THREE.Group(); s.position.y = y; s.rotation.z = tilt; par.add(s); const m = new THREE.Mesh(new THREE.CylinderGeometry(r * b, r * a, r * h, 20), T(col)); m.position.y = r * h / 2; s.add(m); par = s; y = r * h; });
      const pom = new THREE.Mesh(new THREE.SphereGeometry(r * 0.17, 12, 10), T('#ffffff')); pom.position.y = y; par.add(pom); },
    bonnet: (col) => (g, r) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r * 1.08, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), T(col)); b.rotation.x = -0.55; b.position.set(0, r * 0.12, -r * 0.1); g.add(b);
      const rib = new THREE.Mesh(new THREE.TorusGeometry(r * 0.12, r * 0.05, 6, 12), T('#c84a6a')); rib.position.set(r * 0.8, -r * 0.35, r * 0.3); g.add(rib); },
    flat: (col) => (g, r) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.98, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.35), T(col)); c.scale.y = 0.7; c.position.y = r * 0.42; const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.014, 20, 1, false, -Math.PI / 2, Math.PI), T(col)); v.position.set(0, r * 0.52, r * 0.5); v.rotation.x = 0.15; g.add(c, v); },
  };
  const mk = (id, o, hat, scale, extra = {}) => { const c = SR.build({ ...base, ...o }); c.id = id; c.root.scale.setScalar(scale); c.root.rotation.order = 'YXZ'; c.phase = (id.length * 0.37) % 2; c.stache = !!extra.stache;
    if (hat) c.hat = hatAdd(c, HATS[hat[0]](hat[1])); return c; };
  const C = {
    walter: mk('walter', { jacket: '#7a4f93', jacket2: '#5a3a70', style: 'tunic', details: ['collar', 'buttons'], collarCol: '#e9e2f2', btn: '#e9e2f2', pattern: ['hstripes', '#8f68a8'], legCol: '#5a3a70' }, ['night', '#cfdcf0'], 0.8),
    gent: mk('gent', { jacket: '#3d5878', jacket2: '#2c4058', style: 'tunic', details: ['tie', 'vestBtn'], tieCol: '#a8443a', pattern: ['vest', '#2a3a52'] }, ['top', '#26222a'], 0.82, { stache: true }),
    lady: mk('lady', { jacket: '#b54a4a', jacket2: '#8a3232', style: 'coat', details: ['collar', 'buttons'], collarCol: '#f1e6d0', btn: '#f1e6d0', legCol: '#5a2a2a' }, ['bonnet', '#efd9a4'], 0.76),
    eng: mk('eng', { jacket: '#2f3e46', jacket2: '#1f2a30', style: 'coat', details: ['tie', 'buttons'], tieCol: '#c9a227', btn: '#c9a227', glasses: true }, ['bowler', '#3a3028'], 0.83, { stache: true }),
    pullman: mk('pullman', { jacket: '#1f2c4a', jacket2: '#152038', style: 'tunic', details: ['tie', 'vestBtn'], tieCol: '#9d2f2f', pattern: ['vest', '#7c5a2a'] }, ['bowler', '#2a2a32'], 0.84, { stache: true }),
    clerk: mk('clerk', { jacket: '#2c4a3a', jacket2: '#1d3428', style: 'tunic', details: ['bow', 'vestBtn'], tieCol: '#a02020', pattern: ['vest', '#e0d8c4'] }, null, 0.8, { stache: true }),
    driver: mk('driver', { jacket: '#6a5a4a', jacket2: '#4a3e32', style: 'coat', details: ['belt'], beltCol: '#2a1a10' }, ['flat', '#4f5b45'], 0.82),
  };
  // workers: one design family, every man different (colours, pattern, hat, build, height)
  const WS = [['#b79a72', '#8a7050'], ['#8fa0a8', '#6a7a82'], ['#c0a070', '#90784e'], ['#6d4c35', '#4a3424'], ['#4a5d6e', '#34424e'], ['#7a6a3a', '#5a4e2a'], ['#a8443a', '#7e3028'], ['#93714e', '#6e5438'], ['#5a6e4a', '#425236'], ['#9a8a7a', '#746858'], ['#d6c6a4', '#a8987a'], ['#3f4c5a', '#2c3640']];
  const WP = [['stripes', '#e8dcc0'], ['plaid', '#5a4030'], [null], ['hstripes', '#d6c6a4'], ['pinstripe', '#c9d0cf'], [null], ['plaid', '#e8c8a0'], ['dots', '#efe6d0'], [null], ['stripes', '#3a3440'], ['hstripes', '#8a6a48'], ['plaid', '#a8b4b0']];
  const HC = ['#4f5b45', '#6a4a2a', '#34343a', '#5a4a3a', '#3f4c5a', '#7a6a50'];
  C.workers = WS.map(([a, b], i) => mk('w' + i, { jacket: a, jacket2: b, style: 'tunic', details: i % 3 === 0 ? ['belt'] : i % 3 === 1 ? ['buttons'] : ['collar'], beltCol: '#2a1a10', btn: '#e6dcc4', collarCol: '#efe6d0',
    pattern: WP[i][0] ? WP[i] : undefined, bodyW: 0.8 + ((i * 37) % 7) * 0.025, legCol: ['#2b2230', '#3b4a5c', '#4a3a2a', '#2f3b2f'][i % 4] }, i % 4 === 3 ? null : [i % 3 === 2 ? 'bowler' : 'flat', HC[i % HC.length]], 0.78 + ((i * 53) % 9) * 0.012, { stache: i % 3 === 0 }));
  C.towns = [mk('t0', { jacket: '#3f6a6a', jacket2: '#2c4e4e', style: 'coat', details: ['buttons'], btn: '#e6dcc4' }, ['bonnet', '#e6c9d0'], 0.76),
    mk('t1', { jacket: '#5a4a6a', jacket2: '#40344e', style: 'tunic', details: ['tie'], tieCol: '#c9a227' }, ['top', '#2e2a30'], 0.82, { stache: true }),
    mk('t2', { jacket: '#7a5a3a', jacket2: '#5a4028', style: 'tunic', details: ['belt'] }, ['flat', '#4a3a2a'], 0.8),
    mk('t3', { jacket: '#9a5a7a', jacket2: '#74405a', style: 'coat', details: ['collar'], collarCol: '#f4ead8' }, ['bonnet', '#f0e0b0'], 0.74),
    mk('t4', { jacket: '#4a5a44', jacket2: '#36422f', style: 'tunic', details: ['vestBtn', 'tie'], pattern: ['vest', '#2f3a2a'], tieCol: '#7a2a26' }, ['bowler', '#3a3028'], 0.84, { stache: true })];
  C.all = [...Object.values(C).filter(c => c && c.root), ...C.workers, ...C.towns];

  const big = f => g => { g.translate(0, -24); g.scale(1.42, 1.22); f(g); };
  const FT = {}, FTS = {}; for (const k in ALLFACES) { FT[k] = SR.faceTex(big(ALLFACES[k]), false, true); FTS[k] = SR.faceTex(big(withStache(ALLFACES[k])), false, true); }
  const face = (c, m) => { c.faceMesh.material.map = (c.stache ? FTS : FT)[m] || FT.neutral; };
  return { C, face };
}

/* ---------- pose library ---------- */
export function poses(SR) {
  const UP = V(0, 1, 0);
  const dirW = (c, x, y, z) => V(x, y, z).applyQuaternion(c.root.quaternion).normalize();
  const Lw = (c, x, y, z) => { c.root.updateMatrixWorld(true); return c.root.localToWorld(V(x, y, z)); };
  const arm = (c, s, target, hint) => SR.limb(c, s + 'Arm', s + 'ForeArm', s + 'Hand', target, hint || dirW(c, (s === 'Left' ? 1 : -1) * 0.7, -0.6, -0.3));
  const leg = (c, s, target, hint) => SR.limb(c, s + 'UpLeg', s + 'Leg', s + 'Foot', target, hint || dirW(c, 0, 0.25, 1));
  const headC = c => c.head.getWorldPosition(V(0, 0, 0));
  const hand = (c, s) => SR.wp(c.bone(s + 'Hand'));
  const place = (c, x, y, z, ry = 0) => { c.root.visible = true; c.root.rotation.set(0, ry, 0); c.root.position.set(x, y, z); c.root.updateMatrixWorld(true); };
  const idle = (c, t, clip = 'idle') => { SR.clipAt(c, clip, t + c.phase * 3); if (clip !== 'idle') return; const f = dirW(c, 0, 0, 1);
    SR.rotWorld(c.bone('LeftArm'), f, 0.5); SR.rotWorld(c.bone('RightArm'), f, -0.5); SR.rotWorld(c.bone('LeftForeArm'), f, -0.3); SR.rotWorld(c.bone('RightForeArm'), f, 0.3); };
  const headTurn = (c, yaw = 0, pitch = 0) => { const hb = c.bone('Head'); if (yaw) SR.rotWorld(hb, UP, yaw); if (pitch) SR.rotWorld(hb, dirW(c, 1, 0, 0), pitch); };
  const crouch = (c, dy, fwd = 0, lean = 0) => { const fl = SR.wp(c.bone('LeftFoot')), fr = SR.wp(c.bone('RightFoot')); const h = c.bone('Hips');
    const p = SR.wp(h).add(V(0, -dy, 0)).add(dirW(c, 0, 0, 1).multiplyScalar(fwd)); h.position.copy(h.parent.worldToLocal(p)); h.updateMatrixWorld(true);
    if (lean) SR.rotWorld(c.bone('Spine1'), dirW(c, 1, 0, 0), lean); leg(c, 'Left', fl); leg(c, 'Right', fr); };
  const WALK = (() => { const cl = SR.CLIPS.walk.duration; return { dur: cl }; })();
  let walkSpeed = null;
  const calib = (c) => { place(c, 0, 0, 0, 0); let zmin = 1e9, zmax = -1e9; for (let i = 0; i < 24; i++) { SR.clipAt(c, 'walk', (i / 24) * WALK.dur); c.root.updateMatrixWorld(true); const z = c.root.worldToLocal(SR.wp(c.bone('LeftFoot'))).z; zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
    walkSpeed = (2 * (zmax - zmin)) / WALK.dur; return walkSpeed; };
  /** walk along A→B (on height y) between t0..t1 with ease-in/out; phase locked to distance (no foot sliding) */
  const walkPath = (c, t, t0, t1, A, B, y = 0) => { const u = clamp((t - t0) / (t1 - t0)); const s = u < 0.15 ? u * u / 0.3 : u > 0.85 ? 1 - (1 - u) * (1 - u) / 0.3 : u - 0.075; const k = s / 0.85;
    const x = lerp(A[0], B[0], k), z = lerp(A[1], B[1], k); place(c, x, y, z, yawTo(A[0], A[1], B[0], B[1]));
    const dist = Math.hypot(B[0] - A[0], B[1] - A[1]) * k / c.root.scale.x; SR.clipAt(c, 'walk', (dist / walkSpeed) % WALK.dur); return k; };
  /** loop walk across a span forever (background life) */
  const stroll = (c, t, x0, x1, z, y, speed, off = 0) => { const len = Math.abs(x1 - x0), d = ((t * speed + off) % len + len) % len; const dir = Math.sign(x1 - x0);
    place(c, x0 + dir * d, y, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2); SR.clipAt(c, 'walk', ((t * speed + off) / c.root.scale.x / walkSpeed) % WALK.dur); };
  /** lying on the back (pitch -π/2) .. sitting up (pitch ~ -0.15): hips stay at hipP */
  const lie = (c, hipP, yaw, pitch, t) => { idle(c, t); c.root.visible = true; c.root.rotation.set(pitch, yaw, 0, 'YXZ'); c.root.position.set(0, 0, 0); c.root.updateMatrixWorld(true);
    const hp = SR.wp(c.bone('Hips')); c.root.position.copy(hipP.clone().sub(hp)); c.root.updateMatrixWorld(true); };
  const pointAt = (c, P, s = 'Right') => { const sh = SR.wp(c.bone(s + 'Arm')); arm(c, s, sh.clone().add(P.clone().sub(sh).normalize().multiplyScalar(0.55)), dirW(c, s === 'Left' ? 1 : -1, -0.3, 0)); };
  return { UP, dirW, Lw, arm, leg, headC, hand, place, idle, headTurn, crouch, calib, walkPath, stroll, lie, pointAt };
}
