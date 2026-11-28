// Cast for "The building that turned" (Indianapolis, 1930). V3 white-headed style.
// Reuses the pose library + expression drawings of the locked chicago-v3 project (read-only import);
// the cast, 1930 wardrobe and hats here are new and original.
import * as THREE from 'three';
import { ALLFACES, poses, V, clamp, eio, seg, lerp, yawTo } from '../chicago-v3/cast.js';
import { withStache } from '../v3-test/v3faces.js';
export { poses, V, clamp, eio, seg, lerp, yawTo };

const K = '#1b1414';
const ln = (g, pts, w = 14) => { g.strokeStyle = K; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
const lashes = g => { for (const d of [-1, 1]) ln(g, [[d * 96 + d * 24, -50], [d * 96 + d * 40, -64]], 8); };   // small lash flick: reads as a woman's face at phone size
const lips = g => { g.fillStyle = '#c8384a'; g.beginPath(); g.ellipse(0, 108, 16, 7, 0, 0, 7); g.fill(); };
const EXTRA = {
  talk: g => { for (const d of [-1, 1]) { g.fillStyle = K; g.beginPath(); g.ellipse(d * 96, -20, 28, 36, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(d * 96 + 10, -34, 8, 0, 7); g.fill(); }
    for (const d of [-1, 1]) ln(g, [[d * 54, -110], [d * 96, -122], [d * 138, -112]], 13); g.fillStyle = '#5a1414'; g.strokeStyle = K; g.lineWidth = 9; g.beginPath(); g.ellipse(0, 108, 26, 20, 0, 0, 7); g.fill(); g.stroke(); },
  idea: g => { for (const d of [-1, 1]) { g.fillStyle = '#fff'; g.strokeStyle = K; g.lineWidth = 11; g.beginPath(); g.ellipse(d * 96, -24, 46, 54, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = K; g.beginPath(); g.arc(d * 96, -30, 17, 0, 7); g.fill(); }
    for (const d of [-1, 1]) ln(g, [[d * 54, -122], [d * 96, -140], [d * 138, -126]], 13); ln(g, [[-50, 92], [0, 128], [50, 92]], 14); },
  focused: g => { for (const d of [-1, 1]) { g.fillStyle = K; g.beginPath(); g.ellipse(d * 96, -10, 24, 22, 0, 0, 7); g.fill(); } for (const d of [-1, 1]) ln(g, [[d * 54, -84], [d * 96, -96], [d * 138, -92]], 13); ln(g, [[-22, 106], [22, 104]], 12); },
};

export async function makeCast(SR) {
  const base = { headCol: '#ffffff', headR: 0.3, bodyW: 0.82, headInk: 0.004, headInkClean: true, capBack: false, inkPx: 4.5, headLift: 0.78, headFwd: 0.55, flatHead: true, bodyInk: 0.02, headShape: 'rround',
    roundBottom: true, limbK: 0.6, head: 'ball', face: () => {}, rick: true, shoe: '#111', sole: '#111', armCol: '#3a2418', legCol: '#2b2230', shoeCol: '#3a2b26', flatCloth: true, noodle: true, mitten: true };
  const ink = new THREE.MeshBasicMaterial({ color: '#2a1612', side: THREE.BackSide });
  const T = c => SR.toon(c, { rim: 0.4 });
  const hatAdd = (c, parts) => { const r = 0.3, g = new THREE.Group(); parts(g, r); const ms = []; g.traverse(m => { if (m.isMesh) ms.push(m); }); ms.forEach(m => { m.castShadow = true; if (!m.userData.noInk) { const h = new THREE.Mesh(m.geometry, ink); h.scale.setScalar(1.06); m.add(h); } }); c.head.add(g); return g; };
  const HATS = {
    fedora: col => (g, r) => { const br = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.18, r * 1.18, 0.016, 32), T(col)); br.position.y = r * 0.72; br.rotation.x = -0.05;
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.74, r * 0.62, 28), T(col)); cr.position.y = r * 1.04; const dent = new THREE.Mesh(new THREE.SphereGeometry(r * 0.5, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), T(col)); dent.scale.set(1.2, 0.35, 0.9); dent.position.y = r * 1.33;
      const bd = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.745, r * 0.745, r * 0.15, 28), T('#1b1b1f')); bd.position.y = r * 0.83; g.add(br, cr, dent, bd); g.rotation.set(-0.12, 0, 0.06); },
    cloche: col => (g, r) => { const d = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), T(col)); d.position.y = r * 0.4; d.scale.y = 0.9;
      const br = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.2, r * 0.18, 28, 1, true), T(col)); br.material.side = THREE.DoubleSide; br.position.y = r * 0.36;
      const bd = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * 0.06, 6, 28), T('#2a2a3a')); bd.rotation.x = Math.PI / 2; bd.position.y = r * 0.52;
      const fl = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 10, 8), T('#f0d0dc')); fl.position.set(r * 0.78, r * 0.62, r * 0.45); g.add(d, br, bd, fl); g.rotation.x = -0.12; },
    flat: col => (g, r) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.98, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.35), T(col)); c.scale.y = 0.7; c.position.y = r * 0.42; const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.014, 20, 1, false, -Math.PI / 2, Math.PI), T(col)); v.position.set(0, r * 0.52, r * 0.5); v.rotation.x = 0.15; g.add(c, v); },
    bob: col => (g, r) => { const h = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), T(col)); h.rotation.x = -0.35; h.position.set(0, r * 0.05, -r * 0.06); g.add(h);
      for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.36, 14, 10), T(col)); c.scale.set(0.7, 1.1, 0.9); c.position.set(s * r * 0.86, -r * 0.25, -r * 0.1); g.add(c); } },
    headset: col => (g, r) => { const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, r * 0.05, 6, 24, Math.PI), T('#2a2a30')); band.rotation.z = 0; band.position.y = r * 0.05; band.rotation.y = Math.PI / 2; g.add(band);
      for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, r * 0.12, 14), T('#1b1b1f')); ear.rotation.z = Math.PI / 2; ear.position.set(s * r * 1.02, 0, 0); g.add(ear); }
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.03, r * 0.9, 6), T('#2a2a30')); arm.rotation.x = Math.PI / 2.4; arm.position.set(r * 0.62, -r * 0.42, r * 0.5); g.add(arm);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.14, r * 0.28, 12, 1, true), T('#1b1b1f')); horn.rotation.x = -Math.PI / 2; horn.position.set(r * 0.32, -r * 0.62, r * 0.95); g.add(horn);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), T(col)); hair.rotation.x = -0.35; hair.position.set(0, r * 0.03, -r * 0.06); g.add(hair); },
    bowler: col => (g, r) => { const br = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.016, 28), T(col)); br.position.y = r * 0.7; const d = new THREE.Mesh(new THREE.SphereGeometry(r * 0.74, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), T(col)); d.position.y = r * 0.7; g.add(br, d); g.rotation.x = -0.1; },
    newsboy: col => (g, r) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.38), T(col)); c.scale.set(1.08, 0.72, 1.08); c.position.y = r * 0.38; const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.014, 20, 1, false, -Math.PI / 2, Math.PI), T('#3a3a3a')); v.position.set(0, r * 0.5, r * 0.5); v.rotation.x = 0.18; const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 8, 6), T(col)); b.position.y = r * 1.12; g.add(c, v, b); },
  };
  const mk = (id, o, hat, scale, x = {}) => { const c = SR.build({ ...base, ...o }); c.id = id; c.root.scale.setScalar(scale); c.root.rotation.order = 'YXZ'; c.phase = (id.length * 0.37 + scale) % 2; c.stache = !!x.stache; c.fem = !!x.fem; if (hat) c.hat = hatAdd(c, HATS[hat[0]](hat[1])); return c; };
  const C = {
    ruth: mk('ruth', { jacket: '#3f6aa8', jacket2: '#2c4e80', style: 'coat', details: ['collar', 'buttons'], collarCol: '#ffffff', btn: '#ffffff', legCol: '#2b2230' }, ['cloche', '#c84a5a'], 0.76, { fem: true }),
    vonnegut: mk('vonnegut', { jacket: '#4a4038', jacket2: '#342c26', style: 'tunic', details: ['bow', 'vestBtn'], tieCol: '#1d3c8f', pattern: ['vest', '#8a7a5a'], glasses: true }, null, 0.84, { stache: true }),
    kurt: mk('kurt', { jacket: '#c9874a', jacket2: '#94602f', style: 'tunic', details: ['collar'], collarCol: '#ffffff', pattern: ['hstripes', '#e0b070'], legCol: '#3a3a44' }, ['newsboy', '#5a6a7a'], 0.56),
    exec1: mk('exec1', { jacket: '#2f3542', jacket2: '#1f2430', style: 'tunic', details: ['tie', 'vestBtn', 'hanky'], tieCol: '#c8352f', hankyCol: '#f2cf2c', pattern: ['pinstripe', '#4a5064'] }, ['fedora', '#3a3a40'], 0.85, { stache: true }),
    exec2: mk('exec2', { jacket: '#5a4a3a', jacket2: '#40342a', style: 'tunic', details: ['tie', 'buttons'], tieCol: '#2f6b3a' }, ['fedora', '#6a5a48'], 0.82),
    foreman: mk('foreman', { jacket: '#6a5a3a', jacket2: '#4a3e28', style: 'tunic', details: ['belt'], beltCol: '#2a1a10' }, ['bowler', '#2a2a32'], 0.84, { stache: true }),
  };
  const OPS = [['#e6dcc4', '#3a2416'], ['#9fc0d8', '#1a1210'], ['#f2c6d0', '#7a4a22'], ['#c8d8b8', '#2a1a10'], ['#e8d0a0', '#a0582a']];
  C.ops = OPS.map(([shirt, hair], i) => mk('op' + i, { jacket: shirt, jacket2: shirt, style: 'tunic', details: ['collar', 'bow'], collarCol: '#ffffff', tieCol: ['#c8352f', '#1d3c8f', '#2f6b3a', '#8a3a7a', '#1b1b1f'][i] }, ['headset', hair], 0.75 + (i % 2) * 0.02, { fem: true }));
  const WS = [['#3d5878', '#2c4058'], ['#6d4c35', '#4a3424'], ['#4a5d6e', '#34424e'], ['#7a6a3a', '#5a4e2a'], ['#5a6e4a', '#425236'], ['#8a5a4a', '#6a4034'], ['#3f4c5a', '#2c3640'], ['#9a8a6a', '#746848'], ['#2f4a5a', '#223844']];
  const HC = ['#4f5b45', '#6a4a2a', '#34343a', '#5a4a3a', '#3f4c5a', '#7a6a50'];
  C.workers = WS.map(([a, b], i) => mk('w' + i, { jacket: a, jacket2: b, style: 'tunic', details: i % 2 ? ['belt'] : ['buttons'], beltCol: '#2a1a10', btn: '#e6dcc4', pattern: i % 3 === 0 ? ['stripes', '#d6c6a4'] : undefined, bodyW: 0.8 + ((i * 37) % 7) * 0.025 },
    ['flat', HC[i % HC.length]], 0.78 + ((i * 53) % 9) * 0.012, { stache: i % 3 === 1 }));
  C.clerks = [mk('c0', { jacket: '#efe6d2', jacket2: '#cfc4ad', style: 'tunic', details: ['tie', 'vestBtn'], tieCol: '#7a2a26', pattern: ['vest', '#5a4a3a'] }, null, 0.82, { stache: true }),
    mk('c1', { jacket: '#b54a4a', jacket2: '#8a3232', style: 'coat', details: ['collar'], collarCol: '#ffffff' }, ['bob', '#2a1a10'], 0.76, { fem: true }),
    mk('c2', { jacket: '#dfe6ee', jacket2: '#b8c2cc', style: 'tunic', details: ['tie'], tieCol: '#1d3c8f' }, null, 0.8)];
  C.peds = [mk('p0', { jacket: '#5a4a6a', jacket2: '#40344e', style: 'coat', details: ['buttons'] }, ['fedora', '#2e2a30'], 0.83),
    mk('p1', { jacket: '#9a5a7a', jacket2: '#74405a', style: 'coat', details: ['collar'], collarCol: '#f4ead8' }, ['cloche', '#4a6a8a'], 0.74, { fem: true }),
    mk('p2', { jacket: '#4a5a44', jacket2: '#36422f', style: 'tunic', details: ['tie'], tieCol: '#c9a227' }, ['newsboy', '#4a3a2a'], 0.8),
    mk('p3', { jacket: '#c2a070', jacket2: '#9a7a50', style: 'coat', details: ['belt'] }, ['cloche', '#2f6b5a'], 0.75, { fem: true })];
  C.all = [...Object.values(C).filter(c => c && c.root), ...C.ops, ...C.workers, ...C.clerks, ...C.peds];

  const ALL2 = { ...ALLFACES, ...EXTRA };
  const big = f => g => { g.translate(0, -24); g.scale(1.42, 1.22); f(g); };
  const FT = {}, FTS = {}, FTF = {};
  for (const k in ALL2) { FT[k] = SR.faceTex(big(ALL2[k]), false, true); FTS[k] = SR.faceTex(big(withStache(ALL2[k])), false, true); FTF[k] = SR.faceTex(big(g => { ALL2[k](g); lashes(g); if (!['shocked', 'yawn', 'shout', 'talk', 'chomp'].includes(k)) lips(g); }), false, true); }
  const face = (c, m) => { c.faceMesh.material.map = (c.stache ? FTS : c.fem ? FTF : FT)[m] || FT.neutral; };
  return { C, face };
}
