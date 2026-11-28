// V3 test — "The Last Donut" (10 s). Original story, cast, faces, set layout and camera.
// Reuses the installed claude-3d-animated-shorts engine as a library (stickrig.js character builder on the Xbot
// rig, post.js grade/DOF/AO chain, CC0 Kenney props). None of that skill's files are modified.
// Protocol (same as that engine): index.html?w=&h= ; window.frame(t) -> jpeg dataURL ; window.DUR ; window.ready
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeStickRig } from '/.claude/skills/claude-3d-animated-shorts/engine/stickrig.js';
import { makePost } from '/.claude/skills/claude-3d-animated-shorts/engine/post.js';
import { FACES, withStache } from './v3faces.js';

const ENG = '/.claude/skills/claude-3d-animated-shorts/engine';
const Q = new URLSearchParams(location.search);
const WW = +(Q.get('w') || 540), HH = +(Q.get('h') || 960);
const TL = await (await fetch('./timeline.json')).json();
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eio = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => eio((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
for (const [fam, url] of [['InterB', `${ENG}/film/Inter-Black.otf`]]) { const f = new FontFace(fam, `url(${url})`); await f.load(); document.fonts.add(f); }

/* ---------------- renderer + grade ---------------- */
const canvas = document.createElement('canvas'); canvas.width = WW; canvas.height = HH;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setSize(WW, HH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9dcc4'); scene.fog = new THREE.Fog('#e9dcc4', 60, 200);
const camera = new THREE.PerspectiveCamera(40, WW / HH, 0.05, 200);
const hemi = new THREE.HemisphereLight('#fff1dc', '#9a7c5e', 0.62); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffd6a0', 2.7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
sun.position.set(-6, 7, -9); sun.target.position.set(0, 0.6, -1.5); const sc = sun.shadow.camera; sc.left = sc.bottom = -6; sc.right = sc.top = 6; sc.near = 1; sc.far = 40; scene.add(sun, sun.target);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
const post = makePost({ renderer, scene, camera, W: WW, H: HH }); const U = post.grade.uniforms;
renderer.toneMappingExposure = 0.7; U.uSat.value = 1.15; U.uCon.value = 1.1; U.uWarm.value = 0.06; U.uVig.value = 0.78; U.uTeal.value = 0.05;
post.bloomPass.threshold = 0.95; post.bloomPass.strength = 0.25;
await post.addAO({ intensity: 2.2, aoRadius: 0.6 });

/* ---------------- cast (original designs, stable IDs) ---------------- */
const SR = await makeStickRig(scene, `${ENG}/assets/rigs/Xbot.glb`); SR.setInkRes(WW, HH);
const base = { headCol: '#ffffff', headR: 0.3, bodyW: 0.82, headInk: 0.004, headInkClean: true, capBack: true, inkPx: 4.5, headLift: 0.78, headFwd: 0.55, flatHead: true, bodyInk: 0.02, headShape: 'rround',
  roundBottom: true, limbK: 0.6, head: 'ball', face: () => {}, rick: true, shoe: '#111', sole: '#111', armCol: '#3a2418', legCol: '#2b2230', shoeCol: '#3a2b26', flatCloth: true, noodle: true, mitten: true };
const CAST = {
  ben: SR.build({ ...base, jacket: '#e6b13a', jacket2: '#b88a22', style: 'tunic', pattern: ['pinstripe', '#2b3a6a'], details: ['collar', 'tie'], collarCol: '#ffffff', tieCol: '#22306a', knit: true }),
  maya: SR.build({ ...base, jacket: '#d8402f', jacket2: '#a42c20', details: ['hoodie'], hat: 'beret', hatCol: '#5f6b2e', legCol: '#24324a' }),
  gus: SR.build({ ...base, bodyW: 0.95, jacket: '#efe4cc', jacket2: '#cbbd9e', style: 'tunic', pattern: ['plaid', '#7aa36a'], details: ['buttons', 'belt'], btn: '#6a4a2a', beltCol: '#5a3a1e', legCol: '#3a3a44' }),
};
const SCALE = { ben: 0.82, maya: 0.78, gus: 0.86 };
for (const [id, c] of Object.entries(CAST)) { c.id = id; c.root.scale.setScalar(SCALE[id]); c.root.rotation.order = 'YXZ'; c.phase = { ben: 0, maya: 0.43, gus: 0.81 }[id]; }
const big = f => g => { g.translate(0, -24); g.scale(1.42, 1.22); f(g); };
const FT = {}, FTG = {};
const ALLF = { ...FACES, suspL: g => FACES.suspicious(g, -1), suspR: g => FACES.suspicious(g, 1) };
for (const k in ALLF) { FT[k] = SR.faceTex(big(ALLF[k]), false, true); FTG[k] = SR.faceTex(big(withStache(ALLF[k])), false, true); }
const face = (c, m) => { c.faceMesh.material.map = (c.id === 'gus' ? FTG : FT)[m] || FT.neutral; };

/* ---------------- pose helpers (built on stickrig's IK/limb API) ---------------- */
const UP = V(0, 1, 0);
const dirW = (c, x, y, z) => V(x, y, z).applyQuaternion(c.root.quaternion).normalize();
const Lw = (c, x, y, z) => { c.root.updateMatrixWorld(true); return c.root.localToWorld(V(x, y, z)); };
const arm = (c, s, target, hint) => SR.limb(c, s + 'Arm', s + 'ForeArm', s + 'Hand', target, hint || dirW(c, (s === 'Left' ? 1 : -1) * 0.7, -0.6, -0.3));
const leg = (c, s, target, hint) => SR.limb(c, s + 'UpLeg', s + 'Leg', s + 'Foot', target, hint || dirW(c, 0, 0.25, 1));
const headC = c => c.head.getWorldPosition(V(0, 0, 0));
const place = (c, x, z, ry) => { c.root.visible = true; c.root.rotation.set(0, ry, 0); c.root.position.set(x, 0, z); c.root.updateMatrixWorld(true); };
const yawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
function idle(c, t) { SR.clipAt(c, 'idle', t + c.phase * 3); const f = dirW(c, 0, 0, 1);
  SR.rotWorld(c.bone('LeftArm'), f, 0.5); SR.rotWorld(c.bone('RightArm'), f, -0.5); SR.rotWorld(c.bone('LeftForeArm'), f, -0.3); SR.rotWorld(c.bone('RightForeArm'), f, 0.3); }
function headTurn(c, yaw = 0, pitch = 0) { const hb = c.bone('Head'); if (yaw) SR.rotWorld(hb, UP, yaw); if (pitch) SR.rotWorld(hb, dirW(c, 1, 0, 0), pitch); }
/** crouch / lean: lower and push the hips, keep both feet planted with leg IK */
function crouch(c, dy, fwd, lean) { const fl = SR.wp(c.bone('LeftFoot')), fr = SR.wp(c.bone('RightFoot')); const h = c.bone('Hips');
  const p = SR.wp(h).add(V(0, -dy, 0)).add(dirW(c, 0, 0, 1).multiplyScalar(fwd)); h.position.copy(h.parent.worldToLocal(p)); h.updateMatrixWorld(true);
  if (lean) SR.rotWorld(c.bone('Spine1'), dirW(c, 1, 0, 0), lean); leg(c, 'Left', fl); leg(c, 'Right', fr); }
// walk speed matched to the clip's stride, so feet do not slide
const WALK = (() => { const c = CAST.ben; place(c, 0, 0, 0); const cl = SR.CLIPS.walk.duration; let zmin = 1e9, zmax = -1e9;
  for (let i = 0; i < 24; i++) { SR.clipAt(c, 'walk', (i / 24) * cl); c.root.updateMatrixWorld(true); const z = c.root.worldToLocal(SR.wp(c.bone('LeftFoot'))).z; zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
  return { dur: cl, speed: (2 * (zmax - zmin)) / cl }; })();   // local units per second; multiply by scale for metres
console.log('walk clip', WALK.dur.toFixed(2), 's, speed', WALK.speed.toFixed(2));
/** walk c from A to B between t0 and t1, phase-locked to distance; returns arrival 0..1 */
function walkTo(c, t, t0, t1, A, B) { const u = clamp((t - t0) / (t1 - t0)); const s = u < 0.15 ? u * u / 0.3 : u > 0.85 ? 1 - (1 - u) * (1 - u) / 0.3 : u - 0.075; const k = s / 0.85;
  const x = lerp(A[0], B[0], k), z = lerp(A[1], B[1], k); const ry = yawTo(A[0], A[1], B[0], B[1]); place(c, x, z, ry);
  const dist = Math.hypot(B[0] - A[0], B[1] - A[1]) * k / c.root.scale.x; SR.clipAt(c, 'walk', (dist / WALK.speed) % WALK.dur); return k; }

/* ---------------- the break room ---------------- */
const O = new THREE.Group(); scene.add(O);
const tm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.75, metalness: o.m ?? 0, map: o.map || null });
const box = (w, h, d, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(o.round ? new RoundedBoxGeometry(w, h, d, 3, o.round) : new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = o.cast ?? true; m.receiveShadow = true; O.add(m); return m; };
const ctex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
const RX = 4.2, ZB = -3.4, ZF = 4.5;
// floor: warm wood planks
box(RX * 2, 0.1, ZF - ZB, tm('#fff', { r: 0.5, map: ctex(512, 512, (g) => { for (let i = 0; i < 10; i++) { g.fillStyle = ['#b98552', '#a8754a', '#c08e5c', '#a36f43', '#b07c4e'][i % 5]; g.fillRect(0, i * 51.2, 512, 51.2); g.fillStyle = 'rgba(70,40,20,0.35)'; g.fillRect(0, i * 51.2, 512, 2); g.fillRect(((i * 197) % 512), i * 51.2, 2, 51.2); } }, [4, 6]) }), 0, -0.05, (ZB + ZF) / 2, { cast: false });
// walls: back wall cream with a real window opening, side walls sage, wainscot, skirting
const wallM = tm('#efe3c8'), sideM = tm('#9fb59a'), wainM = tm('#c9b089', { r: 0.6 });
const WX0 = -3.2, WX1 = -1.4, WY0 = 1.25, WY1 = 2.55;
box(WX0 + RX, 3.2, 0.15, wallM, (-RX + WX0) / 2, 1.6, ZB); box(RX - WX1, 3.2, 0.15, wallM, (WX1 + RX) / 2, 1.6, ZB);
box(WX1 - WX0, WY0, 0.15, wallM, (WX0 + WX1) / 2, WY0 / 2, ZB); box(WX1 - WX0, 3.2 - WY1, 0.15, wallM, (WX0 + WX1) / 2, (3.2 + WY1) / 2, ZB);
for (const sx of [-1, 1]) box(0.15, 3.2, ZF - ZB, sideM, sx * RX, 1.6, (ZB + ZF) / 2);
box(RX * 2, 0.12, 0.06, tm('#7a5a3a'), 0, 0.06, ZB + 0.1); for (const sx of [-1, 1]) box(0.06, 0.12, ZF - ZB, tm('#7a5a3a'), sx * (RX - 0.1), 0.06, (ZB + ZF) / 2);
box(RX * 2, 0.06, 0.08, wainM, 0, 0.95, ZB + 0.1);
box(RX * 2, 0.1, ZF - ZB, tm('#fbf7ee'), 0, 3.25, (ZB + ZF) / 2, { cast: false });
// window frame + view (sky, a building across the street) + sun shaft
const wf = tm('#f7f3ea'); box(WX1 - WX0 + 0.2, 0.1, 0.25, wf, (WX0 + WX1) / 2, WY0, ZB + 0.05); box(WX1 - WX0 + 0.2, 0.1, 0.25, wf, (WX0 + WX1) / 2, WY1, ZB + 0.05);
for (const x of [WX0, (WX0 + WX1) / 2, WX1]) box(0.08, WY1 - WY0, 0.2, wf, x, (WY0 + WY1) / 2, ZB + 0.05);
const view = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ map: ctex(512, 288, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb4e6'); gr.addColorStop(1, '#d9ecf6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c98a6a'; g.fillRect(40, 120, 260, 168); g.fillStyle = '#e6c9a8'; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) g.fillRect(56 + k * 40, 136 + r * 36, 22, 24); g.fillStyle = '#8ab06a'; g.beginPath(); g.arc(380, 260, 70, 0, 7); g.fill(); g.beginPath(); g.arc(450, 250, 55, 0, 7); g.fill(); }), fog: false }));
view.position.set(-2.3, 1.8, ZB - 3); O.add(view);
// wall clock, notice board with a sign, poster
const clock = new THREE.Group(); clock.position.set(2.9, 2.55, ZB + 0.1); O.add(clock);
{ const f = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 32), tm('#ffffff')); f.rotation.x = Math.PI / 2; clock.add(f); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 32), tm('#2a1a14')); clock.add(rim); }
const hands = [0.15, 0.2].map((l) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.018, l, 0.01), tm('#2a1a14')); h.geometry.translate(0, l / 2, 0); h.position.z = 0.035; clock.add(h); return h; });
const board = ctex(512, 384, (g, w, h) => { g.fillStyle = '#c69a62'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff8e0'; g.fillRect(40, 40, 260, 170); g.fillStyle = '#2a1a14'; g.font = '44px InterB'; g.fillText('PLEASE', 64, 106); g.fillText('SHARE', 64, 160);
  g.fillStyle = '#ffd84d'; g.fillRect(320, 60, 150, 120); g.fillStyle = '#9ad1f4'; g.fillRect(80, 240, 150, 110); g.fillStyle = '#f4a6c0'; g.fillRect(270, 220, 180, 130); g.fillStyle = '#d23a2a'; for (const [x, y] of [[70, 50], [290, 50], [395, 70], [155, 250], [360, 230]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); } });
box(1.1, 0.8, 0.04, tm('#fff', { map: board, r: 0.9 }), 0.25, 2.25, ZB + 0.1);
// glTF props: Kenney Furniture Kit (CC0); one scale for the kit, set from the cabinet so the counter is 0.9 m
const GL = new GLTFLoader(); const CACHE = {}; const load = (u) => (CACHE[u] ||= GL.loadAsync(u));
const kenney = n => `${ENG}/assets/props/kenney/${n}.glb`;
const ref = new THREE.Box3().setFromObject((await load(kenney('kitchenCabinet'))).scene); const KS = 0.9 / (ref.max.y - ref.min.y);
const put = async (name, x, z, ry = 0, y = 0, k = 1) => { const g = (await load(kenney(name))).scene.clone(true);
  g.traverse(m => { if (m.isMesh) { const s = m.material; m.material = new THREE.MeshStandardMaterial({ color: s.color ? s.color.clone() : new THREE.Color('#fff'), map: s.map || null, roughness: Math.max(0.42, s.roughness ?? 0.7), metalness: Math.min(0.25, s.metalness ?? 0) }); m.castShadow = m.receiveShadow = true; } });
  g.scale.setScalar(KS * k); g.rotation.y = ry; g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); const c = b.getCenter(V(0, 0, 0)); g.position.set(x - c.x, y - b.min.y, z - c.z); O.add(g); return g; };
const CW = (ref.max.x - ref.min.x) * KS, CD = (ref.max.z - ref.min.z) * KS, CZ = ZB + 0.08 + CD / 2;
for (let i = -2; i <= 1; i++) await put('kitchenCabinet', i * CW + CW / 2, CZ);
await put('kitchenSink', 2 * CW + CW / 2, CZ);
await put('kitchenFridgeLarge', 3 * CW + CW / 2 + 0.05, CZ - 0.02);
for (let i = -2; i <= 2; i++) await put('kitchenCabinetUpper', i * CW + CW / 2, ZB + 0.25, 0, 1.75);
await put('kitchenCoffeeMachine', 1.25, CZ - 0.08, 0, 0.9);
await put('kitchenMicrowave', -1.45, CZ - 0.05, 0, 0.9);
await put('toaster', -0.85, CZ - 0.1, 0.3, 0.9);
await put('tableRound', -1.0, 2.6); for (const [a, x, z] of [[0.6, -1.7, 3.2], [-2.4, -0.2, 2.2], [2.6, -0.4, 3.4]]) await put('chairCushion', x, z, a);
await put('pottedPlant', -3.7, ZB + 0.6, 0, 0, 1.6); await put('trashcan', 3.7, 1.6); await put('plantSmall2', 0.25, CZ - 0.15, 0, 0.9);
await put('books', -2.1, 2.55, 0.4, 0.72, 1.0);
// procedural hero props: the plate and the donut (pink icing, sprinkles); mugs
const plate = new THREE.Group(); O.add(plate);
{ const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.022, 40), tm('#fbfbf8', { r: 0.25 })); p.castShadow = p.receiveShadow = true; plate.add(p);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.008, 6, 40), tm('#5aa6c8', { r: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.012; plate.add(rim); }
const donut = new THREE.Group();
const dough = tm('#d79a52', { r: 0.6 }), icing = tm('#f28bb4', { r: 0.32 });
const mkDonut = (arc) => { const g = new THREE.Group(); const d = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.04, 16, 40, arc), dough); d.rotation.x = Math.PI / 2; d.castShadow = true; g.add(d);
  const ic = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.041, 12, 40, arc), icing); ic.rotation.x = Math.PI / 2; ic.scale.set(1.02, 1.02, 0.62); ic.position.y = 0.012; g.add(ic);
  for (let i = 0; i < 26; i++) { const a = (i / 26) * arc; if (a > arc - 0.15) continue; const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.0035, 0.012, 2, 4), tm(['#ffffff', '#ffd84d', '#6ad0ff', '#7be07b'][i % 4], { r: 0.4 }));
    const rr = 0.075 + Math.sin(i * 7.3) * 0.022; s.position.set(Math.cos(a) * rr, 0.045, -Math.sin(a) * rr); s.rotation.set(Math.PI / 2, 0, i); g.add(s); } return g; };
const DFULL = mkDonut(Math.PI * 2), DBIT = mkDonut(Math.PI * 1.35); DBIT.rotation.y = 2.2; donut.add(DFULL, DBIT); O.add(donut);
const steam = Array.from({ length: 5 }).map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false })); O.add(s); return s; });
for (const [x, c] of [[1.55, '#3d7be0'], [1.65, '#e8442a']]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16), tm(c, { r: 0.35 })); m.position.set(x, 0.945, CZ + 0.05); m.castShadow = true; O.add(m); }
// light fixtures + practical lights
for (const x of [-1.6, 1.6]) { box(1.2, 0.05, 0.3, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.45, 1.3) }), x, 3.18, 0, { cast: false }); const pl = new THREE.PointLight('#ffe2b8', 5, 7, 1.6); pl.position.set(x, 2.9, 0); scene.add(pl); }
const fill = new THREE.PointLight('#ffd9a8', 3.5, 6, 1.8); fill.position.set(0.5, 1.9, -1.2); scene.add(fill);
// kitchen island in the middle of the room (two cabinets back to back + a butcher-block top)
const IZ = 0.1, COUNTER_Y = 0.94;
for (const x of [-CW / 2, CW / 2]) { await put('kitchenCabinet', x, IZ - CD / 4, Math.PI, 0, 1); await put('kitchenCabinet', x, IZ + CD / 4, 0, 0, 1); }
box(CW * 2 + 0.16, 0.05, CD * 1.0 + 0.16, tm('#fff', { r: 0.55, map: ctex(256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#c08e5c', '#b07c4e', '#c89a68', '#a8754a'][i % 4]; g.fillRect(i * 32, 0, 32, 256); g.fillStyle = 'rgba(60,35,15,0.3)'; g.fillRect(i * 32, 0, 2, 256); } }) }), 0, 0.915, IZ, { round: 0.015 });
const PLATE0 = V(0, COUNTER_Y + 0.012, IZ);
const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: ctex(256, 184, (g, w, h) => { g.fillStyle = '#eee6d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = '30px InterB'; g.fillText('DAILY', 70, 34); g.fillRect(10, 44, w - 20, 3);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 12; r++) g.fillRect(12 + c * 82, 56 + r * 10, 66 - (r % 3) * 8, 4); }) })); paper.castShadow = true; O.add(paper);

/* ---------------- staging ---------------- */
const BZ = IZ - CD / 2 - 0.42; const P = { ben: { A: [-3.5, -1.7], B: [-0.46, BZ] }, maya: { A: [3.6, -1.5], B: [0.46, BZ] }, gus: [0.92, IZ + CD / 2 + 0.4] };
const Fo = (c) => dirW(c, 0, 0, 1);
let focus = V(0, 1, 0);
function look(p, tg, fov = 40, roll = 0) { camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(tg); if (roll) camera.rotateZ(roll); camera.fov = fov; camera.aspect = WW / HH; camera.updateProjectionMatrix(); focus = tg.clone(); }

/* ---------------- captions (drawn into the output frame) ---------------- */
const out = document.createElement('canvas'); out.width = WW; out.height = HH; const og = out.getContext('2d'); document.body.appendChild(out);
function caption(t) { const c = TL.captions.find(c => t >= c.t0 && t < c.t1); if (!c) return; const k = WW / 1080, pop = 1 + 0.12 * Math.exp(-(t - c.t0) * 14) * Math.cos((t - c.t0) * 30);
  og.save(); og.translate(WW / 2, HH * 0.7); og.scale(pop, pop); og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const words = c.text.split(' '); let size = 92 * k; og.font = `${size}px InterB`; const tw = w => og.measureText(w + ' ').width; const total = words.reduce((a, w) => a + tw(w), 0); let x = -total / 2;
  for (const w of words) { const hot = w.replace(/[^A-Z]/g, '').length > 1 && w === w.toUpperCase(); og.lineWidth = 16 * k; og.strokeStyle = '#111'; og.fillStyle = hot ? '#ffd23f' : '#ffffff'; og.textAlign = 'left'; og.strokeText(w, x, 0); og.fillText(w, x, 0); x += tw(w); }
  og.restore(); }

/* ---------------- the performance ---------------- */
const B = TL.ben, M = TL.maya;
function frame(t) {
  const { ben, maya, gus } = CAST;
  // --- Ben: walks in, stops, sees the donut, smug, rubs his hands ---
  if (t < B.stop) walkTo(ben, t, B.walk[0], B.walk[1], P.ben.A, P.ben.B);
  else { place(ben, P.ben.B[0], P.ben.B[1], lerp(yawTo(...P.ben.A, ...P.ben.B), yawTo(P.ben.B[0], P.ben.B[1], PLATE0.x, PLATE0.z), seg(t, B.stop, B.stop + 0.35))); idle(ben, t); }
  // --- Maya: walks in from the right ---
  if (t < M.walk[0]) place(maya, ...P.maya.A, -Math.PI / 2), maya.root.visible = false;
  else if (t < M.stop) walkTo(maya, t, M.walk[0], M.walk[1], P.maya.A, P.maya.B);
  else { place(maya, P.maya.B[0], P.maya.B[1], lerp(yawTo(...P.maya.A, ...P.maya.B), yawTo(P.maya.B[0], P.maya.B[1], PLATE0.x, PLATE0.z), seg(t, M.stop, M.stop + 0.35))); idle(maya, t); }
  // --- the stare-down, the crouch, the lunge, the reach ---
  const lunge = seg(t, ...TL.lunge), reach = seg(t, ...TL.reach), cr = seg(t, ...TL.crouch) * (1 - seg(t, TL.lunge[0], TL.lunge[0] + 0.25));
  const stand = seg(t, TL.annoyed - 0.4, TL.annoyed + 0.2);
  for (const [c, side] of [[ben, 1], [maya, -1]]) {
    if (t < B.stop && c === ben) continue; if (t < M.stop && c === maya) continue;
    const home = c === ben ? P.ben.B : P.maya.B; const tgt = [lerp(home[0], PLATE0.x + side * -0.3, 0.5), BZ + 0.12];
    if (t >= TL.lunge[0]) { const k = lunge * (1 - stand * 0.6); const x = lerp(home[0], tgt[0], k), z = lerp(home[1], tgt[1], k); const gz = CAST.gus.root.position; place(c, x, z, lerp(yawTo(x, z, PLATE0.x, PLATE0.z), yawTo(x, z, gz.x, gz.z), stand));
      if (lunge < 1) SR.clipAt(c, 'run', (t - TL.lunge[0]) * 1.4 + c.phase); else idle(c, t); }
    const eyesOn = seg(t, TL.eyes, TL.eyes + 0.25) * (1 - seg(t, TL.lunge[0] - 0.1, TL.lunge[0] + 0.1));
    headTurn(c, side * -0.75 * eyesOn);   // Ben looks right at Maya, Maya looks left at Ben
    if (cr > 0) crouch(c, 0.13 * cr, 0.06 * cr, 0.18 * cr);
    if (cr > 0) { arm(c, 'Left', Lw(c, 0.3, 1.0 - cr * 0.12, 0.35)); arm(c, 'Right', Lw(c, -0.3, 1.0 - cr * 0.12, 0.35)); }
    if (reach > 0 && stand < 1) { const hand = PLATE0.clone().add(V(side * -0.05, 0.08 - reach * 0.06, 0.02)); const r0 = Lw(c, side * -0.25, 1.05, 0.3); arm(c, side > 0 ? 'Left' : 'Right', r0.lerp(hand, reach * (1 - stand))); if (t > TL.reach[1]) crouch(c, 0.05, 0.08, 0.25 * (1 - stand)); }
    if (c === ben && t > B.smug && t < 3.4 && cr === 0) { const rub = Math.sin(t * 22) * 0.025; arm(c, 'Left', Lw(c, 0.07 + rub, 1.05, 0.33)); arm(c, 'Right', Lw(c, -0.07 + rub, 1.05, 0.33)); }   // rubs his hands
    if (c === maya && t > 3.6 && t < 4.05) { const p = seg(t, 3.6, 3.75); arm(c, 'Right', Lw(c, -0.25, lerp(1.0, 1.32, p), lerp(0.3, 0.55, p))); }   // points at the donut
  }
  if (t >= TL.offer[0]) for (const [c, side] of [[ben, 1], [maya, -1]]) { const gk = seg(t, TL.glance, TL.glance + 0.3); headTurn(c, side * 0.42 * gk, 0.12 * gk);
    arm(c, side > 0 ? 'Right' : 'Left', Lw(c, side * -0.2, lerp(1.0, 1.35, gk), 0.28)); }   // embarrassed: a hand goes up to the back of the head
  if (t > TL.annoyed + 0.2 && t < TL.offer[0]) { idle(ben, t); idle(maya, t); for (const c of [ben, maya]) { const g2 = CAST.gus.root.position; c.root.rotation.y = yawTo(c.root.position.x, c.root.position.z, g2.x, g2.z); c.root.updateMatrixWorld(true); } for (const c of [ben, maya]) arm(c, 'Left', Lw(c, 0.32, 1.12, 0.05)), arm(c, 'Right', Lw(c, -0.32, 1.12, 0.05)); }   // hands on hips
  // --- Gus: at the coffee machine, turns, slides the plate, lifts the donut, bites, chews, offers the plate ---
  const turn = seg(t, ...TL.gusTurn), slide = seg(t, ...TL.slide), lift = seg(t, ...TL.lift), offer = seg(t, ...TL.offer);
  const toCam = seg(t, TL.bite - 0.55, TL.bite - 0.1), toThem = seg(t, TL.offer[0] - 0.35, TL.offer[0]);
  const yawThem = yawTo(P.gus[0], P.gus[1], 0, BZ);
  place(gus, P.gus[0], P.gus[1], lerp(lerp(lerp(Math.PI, Math.PI - 0.55, turn), Math.PI * 2 - 0.55, toCam), yawThem + Math.PI * 2, toThem)); idle(gus, t);
  const gp0 = gus.root.position.clone();
  const plateP = PLATE0.clone().lerp(V(0.42, PLATE0.y, PLATE0.z + 0.16), slide);
  const pp = Lw(gus, 0, 1.12, 0.36);   // newspaper held in both hands, then dropped on the island when he turns
  if (t < TL.gusTurn[0]) { arm(gus, 'Left', pp.clone().add(dirW(gus, 0.17, 0, 0))); arm(gus, 'Right', pp.clone().add(dirW(gus, -0.17, 0, 0))); paper.position.copy(pp).add(V(0, 0.02, 0)); paper.rotation.set(0, gus.root.rotation.y, 0); paper.rotateX(-0.35); }
  else { const k = seg(t, TL.gusTurn[0], TL.gusTurn[0] + 0.3); paper.position.lerpVectors(pp, V(0.95, COUNTER_Y + 0.004, IZ + 0.22), k); paper.rotation.set(-Math.PI / 2 * k, 0, 0.4 * k); }
  if (t >= TL.gusTurn[0] && t < TL.lift[0]) arm(gus, 'Left', plateP.clone().add(V(0.1, 0.05, 0.05)));
  const mouth = headC(gus).add(Fo(gus).multiplyScalar(0.22)).add(V(0, -0.08, 0));
  const hold = Lw(gus, 0.18, 1.15, 0.36);
  let donutP = plateP.clone().add(V(0, 0.032, 0));
  if (t >= TL.lift[0]) { const biteK = seg(t, TL.bite - 0.25, TL.bite) * (1 - seg(t, TL.bite + 0.05, TL.bite + 0.35)); const hp = plateP.clone().add(V(0.02, 0.1, 0)).lerp(hold, lift).lerp(mouth, biteK); arm(gus, 'Left', hp); donutP = SR.wp(gus.bone('LeftHand')).add(V(0, 0.04, 0)); }
  if (offer > 0) { const reachP = gp0.clone().add(V(-0.3, 1.1, -0.42)); const tp = Lw(gus, -0.14, 1.0, 0.25).lerp(reachP, offer); arm(gus, 'Right', tp); plateP.copy(SR.wp(gus.bone('RightHand')).add(V(0, 0.05, 0))); }
  else if (t > TL.lift[1]) { const pick = seg(t, TL.chew[1] - 0.3, TL.offer[0]); if (pick > 0) { arm(gus, 'Right', plateP.clone().add(V(-0.05, 0.05, 0.05))); } }
  plate.position.copy(plateP); plate.rotation.set(offer * 0.25, 0, 0);
  donut.position.copy(donutP); donut.rotation.set(lift * 0.9, 0, 0); donut.visible = t < TL.chew[1] + 0.2; DFULL.visible = t < TL.bite; DBIT.visible = t >= TL.bite;
  if (t > TL.chew[0]) donut.scale.setScalar(lerp(1, 0.6, seg(t, TL.chew[0], TL.chew[1])));
  // --- faces ---
  face(ben, t < 1.2 ? 'neutral' : t < B.smug ? 'curious' : t < TL.eyes ? 'smug' : t < TL.slide[1] ? 'suspR' : t < TL.annoyed ? 'shocked' : t < TL.glance ? 'annoyed' : 'embarrassed');
  face(maya, t < M.stop + 0.1 ? 'curious' : t < TL.eyes ? 'happy' : t < TL.slide[1] ? 'suspL' : t < TL.annoyed ? 'shocked' : t < TL.glance ? 'annoyed' : 'embarrassed');
  face(gus, t < TL.lift[1] ? 'neutral' : t < TL.bite ? 'chomp' : t < TL.chew[1] ? (Math.floor((t - TL.bite) * 6) % 2 ? 'chew0' : 'chew1') : 'happy');
  for (const c of Object.values(CAST)) SR.updateLimbs(c);
  // --- set life ---
  hands[0].rotation.z = -t * 0.6; hands[1].rotation.z = -t * 0.05 - 1.2;
  steam.forEach((s, i) => { const ph = (t * 0.6 + i / 5) % 1; s.position.set(1.25 + Math.sin(ph * 6 + i) * 0.04, 1.32 + ph * 0.5, CZ - 0.05); s.scale.setScalar(0.5 + ph * 1.5); s.material.opacity = (1 - ph) * 0.35 * (t < 5 ? 1 : 0.4); });

  /* --- shots --- */
  const C = TL.cuts; let dof = 0, apt = 0;
  const bh = headC(ben), mh = headC(maya), mid = bh.clone().lerp(mh, 0.5);
  const gp = gus.root.position, island = V(0, 1.0, IZ);
  if (t < C[1]) { const u = eio(t / C[1]); look(V(lerp(-2.2, -1.5, u), lerp(2.5, 1.9, u), lerp(4.4, 3.5, u)), V(lerp(0.0, 0.25, u), lerp(0.85, 0.95, u), lerp(-0.1, 0.1, u)), 54); }   // 1 establishing: high front corner, crane down; Gus's back in the foreground
  else if (t < C[2]) { const u = eio((t - C[1]) / (C[2] - C[1])); look(V(lerp(-0.05, 0.0, u), COUNTER_Y + 0.42, lerp(IZ + 1.6, IZ + 1.35, u)), V(0.0, lerp(1.02, 1.06, u), BZ + 0.1), lerp(56, 52, u)); dof = camera.position.distanceTo(V(0, 1.12, BZ)); apt = 0.022; }   // 2 the donut in the foreground, both arrive behind it and stare each other down
  else if (t < C[3]) { const u = eio((t - C[2]) / (C[3] - C[2])); look(V(lerp(-1.0, -0.8, u), 1.1, lerp(IZ + 2.6, IZ + 2.35, u)), V(lerp(0.05, 0.3, u), 1.0, IZ - 0.1), 50); }   // 3 front-left medium, tracking with the grab
  else if (t < C[4]) { const u = eio((t - C[3]) / (C[4] - C[3])); look(V(lerp(0.05, 0.2, u), 1.3, lerp(IZ + 3.6, IZ + 3.25, u)), V(0.55, 1.1, IZ), 50); }   // 4 three-shot: Gus faces us and chews, they react behind him
  else { const u = eio((t - C[4]) / (10 - C[4])); const tg = mid.clone().lerp(plate.position, 0.4).add(V(0, -0.05, 0)); look(tg.clone().add(V(-0.35, 0.18, lerp(2.4, 2.1, u))), tg, lerp(56, 52, u)); dof = camera.position.distanceTo(mid); apt = 0.012; }   // 5 over Gus's shoulder: the empty plate, two faces
  post.bokeh.enabled = dof > 0; if (dof > 0) { post.bokeh.uniforms.focus.value = dof; post.bokeh.uniforms.aperture.value = apt; }
  SR.RIM.dir.value.set(-0.6, 0.6, -0.4).normalize();
  U.uTime.value = t; post.render();
  og.drawImage(canvas, 0, 0); caption(t);
  return out.toDataURL('image/jpeg', 0.92);
}
window.frame = frame; window.DUR = TL.dur; window.ready = true;
