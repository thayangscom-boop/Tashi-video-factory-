// "Chicago lifted a hotel" — 54.6 s, cut to the user's voiceover (audio/voiceover.mp3).
// V3 white-headed style on the claude-3d-animated-shorts engine (stickrig + post), original cast/sets/story staging.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeStickRig } from '/.claude/skills/claude-3d-animated-shorts/engine/stickrig.js';
import { makePost } from '/.claude/skills/claude-3d-animated-shorts/engine/post.js';
import { makeCast, poses, V, clamp, eio, seg, lerp, yawTo } from './cast.js';
import { buildExterior, buildInterior, HOT, tm } from './sets.js';

const ENG = '/.claude/skills/claude-3d-animated-shorts/engine';
const Q = new URLSearchParams(location.search);
const WW = +(Q.get('w') || 540), HH = +(Q.get('h') || 960);
const TL = await (await fetch('./timeline.json')).json(); const EV = TL.ev;
for (const [fam, url] of [['InterB', `${ENG}/film/Inter-Black.otf`], ['Anton', `${ENG}/film/Anton.ttf`]]) { const f = new FontFace(fam, `url(${url})`); await f.load(); document.fonts.add(f); }

/* ---------- renderer / light / grade ---------- */
const canvas = document.createElement('canvas'); canvas.width = WW; canvas.height = HH;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setSize(WW, HH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#d9dfe2', 70, 260);
const camera = new THREE.PerspectiveCamera(40, WW / HH, 0.05, 700);
const hemi = new THREE.HemisphereLight('#dfeaff', '#8a6a4c', 0.8); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d6', 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.45;
const post = makePost({ renderer, scene, camera, W: WW, H: HH }); const U = post.grade.uniforms;
post.bloomPass.threshold = 0.95; post.bloomPass.strength = 0.3;
await post.addAO({ intensity: 2.0, aoRadius: 0.7 });
const LOOK = { day: { exp: 0.72, sat: 1.15, con: 1.1, warm: 0.05, vig: 0.8, sun: '#fff0d6', si: 3.0, hemi: 0.85, dir: [-0.45, 0.8, 0.5] },
  grey: { exp: 0.74, sat: 1.0, con: 1.08, warm: 0.0, vig: 0.75, sun: '#dfe6ee', si: 1.8, hemi: 1.1, dir: [-0.3, 0.9, 0.3] },
  pit: { exp: 0.8, sat: 1.1, con: 1.1, warm: 0.08, vig: 0.7, sun: '#ffe2b8', si: 2.2, hemi: 0.7, dir: [-0.2, 0.9, 0.4] },
  inside: { exp: 0.78, sat: 1.18, con: 1.1, warm: 0.08, vig: 0.8, sun: '#ffd9a8', si: 1.6, hemi: 0.55, dir: [-0.3, 0.6, 0.7] },
  gold: { exp: 0.72, sat: 1.2, con: 1.12, warm: 0.14, vig: 0.8, sun: '#ffb070', si: 3.0, hemi: 0.7, dir: [-0.7, 0.35, 0.6] } };
const setLook = (n, focus) => { const l = LOOK[n]; renderer.toneMappingExposure = l.exp; U.uSat.value = l.sat; U.uCon.value = l.con; U.uWarm.value = l.warm; U.uVig.value = l.vig;
  sun.color.set(l.sun); sun.intensity = l.si; hemi.intensity = l.hemi; const d = V(...l.dir).normalize(); sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(d, 60);
  const sc = sun.shadow.camera; const e = n === 'day' || n === 'gold' ? 26 : 12; sc.left = sc.bottom = -e; sc.right = sc.top = e; sc.near = 1; sc.far = 160; sc.updateProjectionMatrix(); };

/* ---------- world + cast ---------- */
const EXT = await buildExterior(scene); const INT = await buildInterior(scene);
const SR = await makeStickRig(scene, `${ENG}/assets/rigs/Xbot.glb`); SR.setInkRes(WW, HH);
const { C, face } = await makeCast(SR, scene);
const P = poses(SR); const { dirW, Lw, arm, headC, place, idle, headTurn, crouch, walkPath, stroll, lie, pointAt } = P;
console.log('walk speed', P.calib(C.gent).toFixed(2));
const { GRADE, PIT, HZ, TZ1 } = EXT.state; const W = HOT.W;
const BW = GRADE + 0.12;   // boardwalk top
const IX = 200;            // interior world x offset
const props = new THREE.Group(); scene.add(props);
const mkProp = (geo, col) => { const m = new THREE.Mesh(geo, tm(col)); m.castShadow = true; props.add(m); return m; };
const hammer = new THREE.Group(); { const h = mkProp(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), '#8a6238'); h.position.y = 0.45; hammer.add(h); const hd = mkProp(new THREE.BoxGeometry(0.28, 0.12, 0.12), '#3a3f46'); hd.position.y = 0.9; hammer.add(hd); } props.add(hammer);
const shovels = [0, 1].map(() => { const g = new THREE.Group(); const h = mkProp(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), '#9a7446'); h.position.y = 0.5; g.add(h); const b = mkProp(new THREE.BoxGeometry(0.22, 0.28, 0.02), '#5a6068'); b.position.y = 0.02; g.add(b); props.add(g); return g; });
const whistle = mkProp(new THREE.CylinderGeometry(0.014, 0.014, 0.07, 8), '#d9b44a');
const zs = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '100px Anton'; g.fillStyle = '#2a3a6a'; g.textAlign = 'center'; g.fillText('Z', 64, 104); const t = new THREE.CanvasTexture(c); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); scene.add(s); return s; });
const dust = Array.from({ length: 40 }).map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: '#e6cfae', transparent: true, opacity: 0.4, depthWrite: false })); scene.add(s); return s; });
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- camera ---------- */
let dof = 0, apt = 0;
const look = (p, tg, fov = 40, roll = 0) => { camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(tg); if (roll) camera.rotateZ(roll); camera.fov = fov; camera.aspect = WW / HH; camera.updateProjectionMatrix(); };
const mv = (t, t0, t1, a, b) => { const u = eio((t - t0) / (t1 - t0)); return a.clone().lerp(b, u); };

/* ---------- overlay: captions + cards ---------- */
const out = document.createElement('canvas'); out.width = WW; out.height = HH; const og = out.getContext('2d'); document.body.appendChild(out);
const K = WW / 1080;
function captions(t) { const c = TL.captions.find(c => t >= c.t0 && t < c.t1); if (!c) return; const pop = 1 + 0.08 * Math.exp(-(t - c.t0) * 16);
  og.save(); og.translate(WW / 2, HH * 0.715); og.scale(pop, pop); og.textBaseline = 'middle'; og.lineJoin = 'round'; og.font = `${88 * K}px InterB`;
  const parts = c.words.map(w => w.w + ' '); const ws = parts.map(p => og.measureText(p).width); const total = ws.reduce((a, b) => a + b, 0); let x = -total / 2;
  c.words.forEach((w, i) => { const said = t >= w.s - 0.02; og.lineWidth = 15 * K; og.strokeStyle = '#111'; og.fillStyle = w.hot ? (said ? '#ffd23f' : '#fff3c4') : said ? '#ffffff' : '#e8e8e8';
    og.globalAlpha = said ? 1 : 0.72; og.textAlign = 'left'; og.strokeText(parts[i], x, 0); og.fillText(parts[i], x, 0); x += ws[i]; });
  og.restore(); }
function card(text, t, t0, t1, y = 0.17, size = 84, bg = '#b3261e') { if (t < t0 || t > t1) return; const a = Math.min(1, (t - t0) * 6, (t1 - t) * 6); const s = 0.85 + 0.15 * Math.min(1, (t - t0) * 5);
  og.save(); og.globalAlpha = a; og.translate(WW / 2, HH * y); og.scale(s, s); og.font = `${size * K}px Anton`; og.textAlign = 'center'; og.textBaseline = 'middle'; const w = og.measureText(text).width + 70 * K;
  og.fillStyle = bg; og.beginPath(); og.roundRect(-w / 2, -size * 0.75 * K, w, size * 1.5 * K, 18 * K); og.fill(); og.fillStyle = '#fff'; og.letterSpacing = `${4 * K}px`; og.fillText(text, 0, 4 * K); og.restore(); }
function gauge(t, ft, show) { if (!show) return; og.save(); og.translate(WW * 0.86, HH * 0.42); const h = 520 * K; og.fillStyle = 'rgba(20,20,24,0.55)'; og.fillRect(-46 * K, -h / 2 - 20 * K, 92 * K, h + 40 * K);
  for (let i = 0; i <= 6; i++) { const y = h / 2 - (i / 6) * h; og.fillStyle = '#fff'; og.fillRect(-30 * K, y - 2 * K, 26 * K, 4 * K); og.font = `${30 * K}px InterB`; og.fillText(String(i), 6 * K, y + 10 * K); }
  og.fillStyle = '#ffd23f'; const y = h / 2 - (ft / 6) * h; og.fillRect(-40 * K, y, 14 * K, h / 2 - y); og.font = `${58 * K}px Anton`; og.textAlign = 'center'; og.fillStyle = '#ffd23f'; og.strokeStyle = '#111'; og.lineWidth = 10 * K;
  const s = `${ft.toFixed(1)} FT`; og.strokeText(s, 0, -h / 2 - 60 * K); og.fillText(s, 0, -h / 2 - 60 * K); og.restore(); }

/* ---------- helpers ---------- */
const ALL = C.all;
const hideAll = () => { ALL.forEach(c => { c.root.visible = false; c.root.rotation.set(0, 0, 0); }); hammer.visible = false; shovels.forEach(s => (s.visible = false)); whistle.visible = false; zs.forEach(z => (z.visible = false)); dust.forEach(d => (d.visible = false)); };
const W8 = C.workers;
// a man on a jack bar in the front trench row: kneels, both mittens on the bar end that sweeps around the jack
const jackXs = Array.from({ length: 24 }).map((_, i) => -W / 2 + 0.6 + i * ((W - 1.2) / 23));
function barMan(c, t, i, ang, turning) { const x = jackXs[i], z = HZ + 0.25; const pos = [x - 0.15, PIT, z + 0.95];
  place(c, pos[0], pos[1], pos[2], Math.PI + 0.15 * Math.sin(i)); idle(c, t);
  const a = ang + i * 0.37; const bar = (d) => V(x + Math.sin(a) * d, PIT + Math.max(0.05, EXT.state.hotelLift - 0.3 - 1.0) + 0.42 + 0.0, z + Math.cos(a) * d);
  const bt = bar(0.48); bt.z = Math.max(bt.z, z + 0.25);
  crouch(c, 0.24 + (turning ? Math.sin(t * 6 + i) * 0.03 : 0), 0.1, 0.45);
  arm(c, 'Left', bt.clone().add(dirW(c, 0.08, 0, 0))); arm(c, 'Right', bt.clone().add(dirW(c, -0.08, 0, 0))); }
const turnAngle = (t) => { let a = 0; for (const s of EV.turns) a += eio((t - s) / 0.55) * 1.2; return a + Math.max(0, t - EV.liftLapse[0]) * 6 * (t < EV.liftLapse[1] ? 1 : 0); };
const liftAt = (t) => t < EV.liftLapse[0] ? 0.06 * EV.turns.filter(s => t > s + 0.5).length + EV.turns.reduce((a, s) => a + 0.06 * eio((t - s) / 0.55) * (t <= s + 0.5 ? 1 : 0), 0) : lerp(0.18, GRADE, seg(t, EV.liftLapse[0], EV.liftLapse[1]));

/* ================= shots ================= */
const SHOT = {
  // 1 — waking up in the hotel room
  wake(t, u) { setLook('inside', V(IX, INT.Y3 + 1, -2)); INT.update(0, 0); const w = C.walter;
    const sit = seg(t, ...EV.sitUp); const hip = V(IX - 0.9, INT.Y3 + 0.62 + sit * 0.05, -INT.RD + 1.45 + sit * 0.05);
    lie(w, hip, 0, lerp(-Math.PI / 2 + 0.12, -0.08, sit), t); const yawn = seg(t, 1.3, 1.6) * (1 - seg(t, 2.0, 2.3));
    if (sit > 0.3) { const r = sit; arm(w, 'Left', Lw(w, 0.35, 1.35 + yawn * 0.5, 0.05)); arm(w, 'Right', Lw(w, -0.35, 1.35 + yawn * 0.5, 0.05)); }
    face(w, t < EV.eyesOpen ? 'sleep' : yawn > 0.3 ? 'yawn' : 'neutral');
    if (t < EV.eyesOpen + 0.4) zs.forEach((z, k) => { const ph = (t * 0.8 + k / 3) % 1; z.visible = true; z.position.copy(headC(w)).add(V(0.15 + ph * 0.35, 0.2 + ph * 0.5, 0)); z.scale.setScalar(0.12 + ph * 0.14); z.material.opacity = 1 - ph; });
    look(mv(t, 0, 2.5, V(IX + 1.3, INT.Y3 + 1.55, 0.9), V(IX + 0.9, INT.Y3 + 1.35, 0.3)), V(IX - 0.75, INT.Y3 + 0.95, -INT.RD + 1.4), 46); },
  // 2 — he looks out of the window: the street is sinking
  window(t, u) { setLook('inside', V(IX, INT.Y3 + 1, -2)); const lift = 0.35 * seg(t, 2.6, 4.2); INT.update(lift, 0); const w = C.walter;
    const hip = V(IX - 0.9, INT.Y3 + 0.67 + lift, -INT.RD + 1.5); lie(w, hip, 0, -0.08, t);
    const lk = seg(t, EV.lookWindow - 0.2, EV.lookWindow + 0.2); headTurn(w, 1.05 * lk, -0.12 * lk); const sh = seg(t, EV.shock, EV.shock + 0.15);
    arm(w, 'Left', Lw(w, 0.3, 1.05 + sh * 0.35, 0.25)); arm(w, 'Right', Lw(w, -0.3, 1.05 + sh * 0.45, 0.25));
    face(w, t < EV.shock ? 'curious' : 'shocked');
    INT.cup.position.x = IX + 0.62 + Math.sin(t * 60) * 0.006 * (t > 2.8 ? 1 : 0);
    look(mv(t, 2.5, 4.2, V(IX - 0.1, INT.Y3 + lift + 1.35, 1.2), V(IX - 0.05, INT.Y3 + lift + 1.4, 0.8)), V(IX + 0.35, INT.Y3 + lift + 1.35, -INT.RD + 0.3), 58); },
  // 3 — outside: the whole hotel is going up
  hookExt(t, u) { setLook('day', V(0, 4, HZ)); const lift = lerp(0.55, 0.95, u); EXT.update({ westFillH: GRADE, hotelLift: lift, jackAng: t * 3 });
    for (let i = 0; i < 9; i++) barMan(W8[i], t, 2 + i * 2, t * 3, true);
    const pm = C.pullman; place(pm, -3.8, BW, TZ1 + 0.9, Math.PI); idle(pm, t); const ch = Math.max(0, Math.sin(t * 5)); arm(pm, 'Right', Lw(pm, -0.25, 1.4 + ch * 0.35, 0.3)); face(pm, 'shout');
    [[C.towns[0], -10.5, 'shocked'], [C.towns[1], -11.4, 'curious'], [C.towns[2], 5.5, 'shocked']].forEach(([c, x, f], k) => { place(c, x, BW, TZ1 + 1.0, Math.PI + (k - 1) * 0.2); idle(c, t); headTurn(c, 0, -0.35); face(c, f); if (k === 0) arm(c, 'Right', Lw(c, -0.2, 1.35, 0.35)); });
    look(mv(t, 4.2, 7.2, V(-6.0, GRADE + 5.0, TZ1 + 0.9), V(-12.5, GRADE + 5.8, TZ1 + 10)), mv(t, 4.2, 7.2, V(-3.5, -1.2, HZ + 1.0), V(-2.5, 8.0, HZ - 3)), 58); },
  // 4 — Chicago, 1861: an establishing wide of the low muddy street
  chicago1861(t, u) { setLook('grey', V(-32, 2, 1)); EXT.update({ westFillH: 0, hotelLift: 0 });
    [[C.towns[0], -24, -44, -3.7, 0.2, 1.1], [C.towns[1], -46, -22, 6.2, 0.2, 1.25], [C.towns[3], -40, -20, -3.7, 0.2, 1.0], [C.towns[4], -21, -40, 6.2, 0.2, 1.15]].forEach(([c, a, b, z, y, sp], k) => { stroll(c, t, a, b, z, y, sp, k * 3.1); face(c, 'neutral'); });
    driverPush(t); look(mv(t, 7.2, 9.4, V(-17, 7.5, 9.5), V(-18, 4.5, 8.0)), mv(t, 7.2, 9.4, V(-34, 0.5, 0.5), V(-33, 1.0, 1)), 50); },
  // 5 — a gentleman steps off the planks and sinks
  mudGent(t, u) { setLook('grey', V(-28, 1, 0)); EXT.update({ westFillH: 0 }); const g = C.gent;
    const A = [-26.5, -3.6], B = [-26.9, -1.6];
    let sink = seg(t, ...EV.sink) * 0.42; const tug = Math.max(0, Math.sin((t - EV.tug[0]) * 9)) * (t > EV.tug[0] ? 1 : 0);
    if (t < EV.mudStep) { walkPath(g, t, 9.0, EV.mudStep + 0.45, [-26.4, -4.6], A, 0.2); }
    else { place(g, lerp(A[0], B[0], seg(t, EV.mudStep, EV.sink[1])), 0.2 - Math.min(0.2, (t - EV.mudStep) * 2) - sink, lerp(A[1], B[1], seg(t, EV.mudStep, EV.sink[1])), 0.15); idle(g, t);
      arm(g, 'Left', Lw(g, 0.45, 1.25 + tug * 0.2, 0.1)); arm(g, 'Right', Lw(g, -0.45, 1.3 - tug * 0.1, 0.1)); SR.rotWorld(g.bone('Spine1'), dirW(g, 1, 0, 0), -0.25 * tug); }
    face(g, t < EV.mudStep ? 'neutral' : t < EV.sink[1] ? 'shocked' : 'annoyed');
    const lady = C.lady; stroll(lady, t, -31, -22, -3.7, 0.2, 0.9, 2); face(lady, 'curious');
    look(mv(t, 9.4, 11.5, V(-25.6, 1.2, 1.6), V(-26.0, 1.05, 0.9)), mv(t, 9.4, 11.5, V(-26.5, 0.9, -3.4), V(-26.9, 0.55, -1.7)), 48); dof = camera.position.distanceTo(V(-26.8, 0.8, -2)); apt = 0.01; },
  // 6 — low and swampy: standing water everywhere, a stuck wagon
  swamp(t, u) { setLook('grey', V(-32, 1, 1)); EXT.update({ westFillH: 0 }); driverPush(t);
    const g = C.gent; place(g, -26.9, -0.42, -1.6, 0.15); idle(g, t); face(g, 'annoyed'); arm(g, 'Left', Lw(g, 0.45, 1.1, 0.1));
    [[C.towns[3], -34, -24, -3.7, 0.2, 1.0], [C.towns[1], -44, -26, 6.2, 0.2, 1.2]].forEach(([c, a, b, z, y, sp], k) => { stroll(c, t, a, b, z, y, sp, k * 2.3); face(c, 'worried'); });
    look(mv(t, 11.5, 15.5, V(-22.5, 6.2, 2.4), V(-24.0, 4.6, 3.6)), mv(t, 11.5, 15.5, V(-36, 0.0, 0.6), V(-32.5, 0.4, 2.6)), 50); },
  // 7a — the engineer and his plan
  engineer(t, u) { setLook('grey', V(-23, 1, 3)); EXT.update({ westFillH: 0 }); const e = C.eng;
    place(e, -22.4, 0, 4.4, 0.35); idle(e, t); const pt = seg(t, EV.pointPlan - 0.25, EV.pointPlan); if (pt > 0) pointAt(e, EXT.easel.localToWorld(V(0.2, 1.4, 0.05)), 'Right');
    headTurn(e, -0.35 * (1 - pt), 0); face(e, t < EV.pointPlan ? 'curious' : 'determined');
    shovelMan(W8[0], t, -26.2, -0.6, 0.6); shovelMan(W8[1], t + 0.4, -27.8, -0.9, -0.5); EXT.pile.scale.setScalar(1);
    look(mv(t, 15.5, 17.3, V(-20.6, 1.5, 7.0), V(-21.0, 1.42, 6.5)), V(-23.0, 1.2, 3.9), 46); },
  // 7b — time-lapse: the street is raised past the shop doors
  raiseLapse(t, u) { setLook('day', V(-30, 2, 1)); const f = GRADE * seg(t, 17.5, 19.6); EXT.update({ westFillH: f });
    shovelMan(W8[0], t * 3, -27, -0.2, f, 3); shovelMan(W8[1], t * 3 + 0.5, -31, 1.2, f, 3); shovelMan(W8[2], t * 3 + 0.2, -35, -0.6, f, 3);
    look(mv(t, 17.3, 20.0, V(-21.5, 0.8, 7.5), V(-21.5, 0.8 + GRADE + 1.2, 7.5)), mv(t, 17.3, 20.0, V(-30, 0.8, -3.2), V(-30, GRADE + 1.0, -3.2)), 52); },
  // 8 — but one building: the hotel left down in its pit
  lowHotel(t, u) { setLook('day', V(0, 2, HZ)); EXT.update({ westFillH: GRADE, hotelLift: 0 });
    [[C.towns[1], -1.5, 'suspicious'], [C.towns[0], -0.4, 'worried'], [C.towns[2], 0.9, 'curious']].forEach(([c, x, f], k) => { place(c, x, BW, TZ1 + 0.75 + (k % 2) * 0.25, Math.PI + (k - 1) * 0.15); idle(c, t + k); headTurn(c, 0, 0.4); face(c, f);
      if (k === 2) arm(c, 'Right', headC(c).add(V(0.05, 0.18, 0.05))); if (k === 0) pointAt(c, V(0, 1, HZ), 'Left'); });
    look(mv(t, 20.0, 23.4, V(0.2, GRADE + 2.5, TZ1 + 4.4), V(-0.3, GRADE + 3.2, TZ1 + 4.0)), mv(t, 20.0, 23.4, V(-0.2, 1.0, HZ), V(-0.2, 1.8, HZ - 1)), 52); },
  // 9 — the six-storey Tremont House: tilt up the facade
  tiltUp(t, u) { setLook('day', V(0, 8, HZ)); EXT.update({ westFillH: GRADE, hotelLift: 0 });
    look(V(-4.5, PIT + 0.9, TZ1 - 0.4), mv(t, 23.4, 26.2, V(-1.5, 2.5, HZ), V(0, HOT.gh + 5 * HOT.fh + 3.2, HZ - 0.5)), 66);
    floorsCard = t; },
  // 10 — instead of demolishing it
  hammer(t, u) { setLook('pit', V(-3, 0, HZ + 1)); EXT.update({ westFillH: GRADE, hotelLift: 0 }); const w = W8[3], p = C.pullman;
    place(w, -3.0, PIT, HZ + 1.25, Math.PI); idle(w, t); const up = seg(t, ...EV.hammerUp), stop = seg(t, EV.stopHammer - 0.1, EV.stopHammer + 0.15);
    const hp = Lw(w, -0.05, lerp(0.95, 1.9, up) - stop * 0.15, lerp(0.25, -0.05, up)); arm(w, 'Right', hp); arm(w, 'Left', hp.clone().add(dirW(w, 0.12, -0.1, 0)));
    hammer.visible = true; hammer.position.copy(hp); hammer.rotation.set(0, w.root.rotation.y, 0); hammer.rotateX(lerp(-0.3, -2.6, up));
    face(w, t < EV.stopHammer ? 'determined' : 'shocked');
    const run = seg(t, 26.4, EV.stopHammer); place(p, lerp(-6.0, -3.6, run), PIT, lerp(HZ + 2.3, HZ + 1.5, run), lerp(Math.PI / 2 + 0.6, Math.PI / 2 + 0.2, run));
    if (run < 1) SR.clipAt(p, 'run', t * 1.3); else { idle(p, t, 'headShake'); arm(p, 'Right', hp.clone().add(V(0.05, -0.12, 0.05))); arm(p, 'Left', Lw(p, 0.3, 1.45, 0.35)); }
    face(p, t < EV.stopHammer ? 'shout' : 'determined');
    look(mv(t, 26.2, 28.0, V(-1.3, PIT + 1.45, HZ + 2.6), V(-1.6, PIT + 1.4, HZ + 2.45)), V(-3.4, PIT + 1.3, HZ + 1.3), 52); },
  // 11 — thousands of screwjacks beneath the building
  jacksPlace(t, u) { setLook('pit', V(0, PIT, HZ - 4)); EXT.update({ westFillH: GRADE, hotelLift: 0, jackAng: 0 }); const w = W8[4];
    const push = seg(t, ...EV.jackPush); place(w, -1.2, PIT, HZ + 1.1 - push * 0.5, Math.PI); idle(w, t); crouch(w, 0.32, 0.12, 0.6);
    const jp = V(-1.25, PIT + 0.45, HZ + 0.25 - push * 0.0); arm(w, 'Left', jp.clone().add(V(0.1, 0, 0.18))); arm(w, 'Right', jp.clone().add(V(-0.1, 0, 0.18))); face(w, 'determined');
    for (let i = 0; i < 4; i++) barMan(W8[6 + i], t, 4 + i * 3, 0, false);
    const back = seg(t, 29.3, 32.6);
    look(V(lerp(0.4, 1.5, back), PIT + lerp(0.85, 0.85, back), HZ + lerp(0.95, 2.6, back)), V(lerp(-1.25, -1.5, back), PIT + lerp(0.5, 0.75, back), HZ + lerp(0.5, -9, back)), lerp(50, 58, back)); },
  // 12 — hundreds of men, turning together, little by little
  crewTurn(t, u) { setLook('pit', V(-2, PIT, HZ + 1)); const ang = turnAngle(t); EXT.update({ westFillH: GRADE, hotelLift: liftAt(t), jackAng: ang });
    for (let i = 0; i < 12; i++) barMan(W8[i % 12], t, 1 + i * 2, ang, EV.turns.some(s => t > s - 0.1 && t < s + 0.6));
    const pm = C.pullman; place(pm, -6.2, BW, TZ1 + 0.85, Math.PI - 0.3); idle(pm, t); const wh = seg(t, EV.whistle - 0.3, EV.whistle) * (1 - seg(t, EV.whistle + 0.5, EV.whistle + 0.7));
    if (wh > 0) { const mp = headC(pm).add(dirW(pm, 0, -0.08, 0.2)); arm(pm, 'Right', mp); whistle.visible = true; whistle.position.copy(mp); whistle.rotation.set(Math.PI / 2, pm.root.rotation.y, 0); }
    else { const chop = EV.turns.reduce((m, s) => Math.max(m, seg(t, s - 0.4, s - 0.1) * (1 - seg(t, s, s + 0.25))), 0); arm(pm, 'Right', Lw(pm, -0.28, lerp(1.0, 1.65, chop), 0.3)); }
    face(pm, wh > 0.5 ? 'chomp' : 'shout');
    W8.forEach((c, i) => face(c, EV.turns.some(s => t > s - 0.1 && t < s + 0.6) ? 'determined' : 'neutral'));
    if (t < 35.0) look(mv(t, 32.6, 35.0, V(-10.2, PIT + 1.5, TZ1 - 0.35), V(-6.5, PIT + 1.45, TZ1 - 0.4)), mv(t, 32.6, 35.0, V(-4, PIT + 0.6, HZ + 0.6), V(2, PIT + 0.6, HZ + 0.6)), 50);
    else look(mv(t, 35.0, 36.4, V(W / 2 + 0.9, PIT + 0.8, HZ + 2.1), V(W / 2 + 0.7, PIT + 0.75, HZ + 1.95)), V(-5, PIT + 0.55, HZ + 0.9), 40); },
  // 13 — lifting the entire hotel more than six feet
  liftWide(t, u) { setLook('day', V(0, 6, HZ)); const ang = turnAngle(t), lift = liftAt(t); EXT.update({ westFillH: GRADE, hotelLift: lift, jackAng: ang });
    for (let i = 0; i < 9; i++) barMan(W8[i], t, 2 + i * 2, ang, true);
    [[C.towns[0], -7, 'shocked'], [C.towns[4], 6.5, 'happy']].forEach(([c, x, f], k) => { place(c, x, BW, TZ1 + 1.0, Math.PI); idle(c, t); headTurn(c, 0, -0.3); face(c, f); });
    dust.forEach((d, i) => { const ph = (t * 0.7 + rnd(i)) % 1; d.visible = true; d.position.set(-W / 2 + rnd(i * 3) * W, lift - 0.1 - ph * 1.5, HZ + 0.3 + ph * 1.2); d.scale.setScalar(0.6 + ph * 2.5); d.material.opacity = (1 - ph) * 0.35; });
    gaugeFt = clamp(lift / GRADE) * 6.2;
    look(mv(t, 36.4, 40.0, V(-11, GRADE + 1.2, TZ1 + 14), V(-9, GRADE + 2.4, TZ1 + 12.5)), V(0, 7, HZ - 2), 54); },
  // 14 — the hotel stayed open
  lobbyOpen(t, u) { setLook('inside', V(IX, 1, -2)); INT.update(0.4, 0); const cl = C.clerk, gst = C.towns[1];
    place(cl, IX + 0.6, 0.4, -2.85, 0); idle(cl, t); face(cl, 'happy'); const ding = seg(t, EV.bell - 0.2, EV.bell) * (1 - seg(t, EV.bell + 0.1, EV.bell + 0.3));
    arm(cl, 'Right', V(IX + 0.15, 0.4 + 0.97 + (1 - ding) * 0.12, -1.98));
    INT.bell.scale.setScalar(1 + 0.15 * Math.exp(-(t - EV.bell) * 12) * (t > EV.bell ? 1 : 0));
    if (t < EV.walkIn[1]) walkPath(gst, t, ...EV.walkIn, [IX - 2.6, 0.6], [IX + 0.45, -1.25], 0.4); else { place(gst, IX + 0.45, 0.4, -1.25, Math.PI); idle(gst, t); }
    face(gst, t < EV.walkIn[1] ? 'neutral' : 'happy');
    INT.openSign.rotation.y = Math.sin(seg(t, 41.6, 42.6) * Math.PI) * 0.5;
    look(mv(t, 40.0, 43.9, V(IX - 0.4, 0.4 + 1.6, 3.2), V(IX - 0.2, 0.4 + 1.45, 2.3)), V(IX + 0.1, 0.4 + 1.15, -1.9), 50); },
  // 15 — sleeping, eating, doing business (cut-away, tilt down through the floors)
  dollhouse(t, u) { setLook('inside', V(IX, 4, -2)); const lift = 0.4 + 0.25 * seg(t, 43.9, 47.3); INT.update(lift, t * 2); roomsLife(t, lift);
    const y = t < 45.15 ? lerp(INT.Y3 + 1.5, INT.Y3 + 1.2, seg(t, 43.9, 45.1)) : t < 45.95 ? lerp(INT.Y3 + 1.2, INT.Y2 + 1.3, seg(t, 45.15, 45.45)) : lerp(INT.Y2 + 1.3, 1.35, seg(t, 45.95, 46.25));
    look(V(IX + 0.2, y + lift, 3.4), V(IX - 0.1, y + lift - 0.25, -1.9), 48); },
  // 16 — while the building slowly rose beneath them
  riseBeneath(t, u) { setLook('inside', V(IX, 4, -2)); const lift = lerp(0.65, 1.9, seg(t, ...EV.riseB)); INT.update(lift, t * 4); roomsLife(t, lift);
    dust.forEach((d, i) => { const ph = (t * 0.7 + rnd(i)) % 1; d.visible = true; d.position.set(IX - 3 + rnd(i * 3) * 6, -2 + lift * 0.9 - ph * 1.2, -0.2 + ph * 0.8); d.scale.setScalar(0.4 + ph * 1.5); d.material.opacity = (1 - ph) * 0.3; });
    look(mv(t, 47.3, 50.0, V(IX + 0.3, 4.5, 6.0), V(IX + 1.8, 5.8, 14.5)), mv(t, 47.3, 50.0, V(IX, 4.2, -2), V(IX, 4.2, -2.2)), 50); },
  // 17 — Chicago lifted its city (golden hour, crane up and back)
  finale(t, u) { setLook('gold', V(0, 4, TZ1)); EXT.update({ westFillH: GRADE, hotelLift: GRADE, jackAng: 0, lampsOn: 1.2 });
    [[C.towns[0], -12, 10, TZ1 + 2.4, 1.0], [C.towns[1], 11, -12, TZ1 + 3.0, 1.2], [C.lady, -9, 12, TZ1 + 3.6, 0.9], [C.gent, 13, -8, TZ1 + 2.2, 1.1], [C.walter, -4, 10, TZ1 + 1.8, 0.8]].forEach(([c, a, b, z, sp], k) => { stroll(c, t, a, b, z, BW, sp, k * 2.7); face(c, k === 4 ? 'happy' : 'neutral'); });
    look(mv(t, 50.0, 54.6, V(8, GRADE + 1.6, TZ1 + 8), V(13, GRADE + 11, TZ1 + 10.5)), mv(t, 50.0, 54.6, V(-2, GRADE + 3, HZ + 1), V(-16, 4, HZ + 2)), 54); },
};
let floorsCard = -1, gaugeFt = -1;
function driverPush(t) { const d = C.driver; place(d, -32.6, -0.2, 3.3, 1.2); idle(d, t); crouch(d, 0.2, 0.1, 0.5); const h = Math.max(0, Math.sin(t * 2.4));
  const wp = EXT.wheels[0].getWorldPosition(V(0, 0, 0)); arm(d, 'Left', wp.clone().add(V(0.1, 0.2 + h * 0.05, 0))); arm(d, 'Right', wp.clone().add(V(-0.1, 0.35 + h * 0.05, 0))); face(d, 'annoyed'); EXT.wheels.forEach(w => (w.rotation.z = Math.sin(t * 2.4) * 0.05)); }
function shovelMan(c, t, x, z, y, speed = 1) { place(c, x, y, z, 0.6); idle(c, t); const ph = (t * 1.2 * speed) % 1; const dig = Math.sin(ph * Math.PI * 2);
  crouch(c, 0.12 + 0.08 * Math.max(0, dig), 0.08, 0.35 + 0.15 * dig); const sh = shovels[c === W8[0] ? 0 : 1]; if (c !== W8[2]) { sh.visible = true;
  const hp = Lw(c, -0.05, 0.85 + 0.25 * dig, 0.45); arm(c, 'Right', hp); arm(c, 'Left', hp.clone().add(dirW(c, 0.05, 0.3, -0.25))); sh.position.copy(hp).add(dirW(c, 0, -0.55, 0.2)); sh.rotation.set(0.6 - dig * 0.4, c.root.rotation.y, 0); }
  face(c, 'determined'); }
function roomsLife(t, lift) { const w = C.walter, ly = C.lady, gt = C.gent, a = C.towns[4], b = C.clerk;
  lie(w, V(IX - 0.9, INT.Y3 + 0.62 + lift, -INT.RD + 1.45), 0, -Math.PI / 2 + 0.12, t); face(w, 'sleep');
  zs.forEach((z, k) => { const ph = (t * 0.8 + k / 3) % 1; z.visible = true; z.position.copy(headC(w)).add(V(0.15 + ph * 0.35, 0.25 + ph * 0.5, 0.1)); z.scale.setScalar(0.14 + ph * 0.14); z.material.opacity = 1 - ph; });
  const eat = Math.max(0, Math.sin(t * 3.2));
  place(ly, IX - 1.1, INT.Y2 + lift, -2.0, Math.PI / 2); idle(ly, t); crouch(ly, 0.3, 0.05, 0.1); arm(ly, 'Right', Lw(ly, -0.1, lerp(0.95, 1.4, eat), 0.4)); face(ly, eat > 0.7 ? 'chew1' : 'happy');
  place(gt, IX + 0.5, INT.Y2 + lift, -2.0, -Math.PI / 2); idle(gt, t); crouch(gt, 0.3, 0.05, 0.1); arm(gt, 'Left', Lw(gt, 0.15, 1.0, 0.45)); face(gt, 'happy');
  const sh = Math.sin(t * 9) * 0.04 * (t > EV.shake ? 1 : 0);
  place(a, IX - 0.2, lift + 0.0, -1.45, Math.PI / 2 + 0.4); idle(a, t); place(b, IX + 1.0, lift, -1.45, -Math.PI / 2 - 0.4); idle(b, t);
  const mid = V(IX + 0.4, lift + 1.0 + sh, -1.35); arm(a, 'Right', mid.clone().add(V(-0.04, 0, 0))); arm(b, 'Right', mid.clone().add(V(0.04, 0, 0))); face(a, 'happy'); face(b, 'smug'); }

/* ================= frame ================= */
function frame(t) {
  hideAll(); dof = 0; apt = 0; floorsCard = -1; gaugeFt = -1;
  let k = 0; TL.cuts.forEach((c, i) => { if (t >= c) k = i; }); const name = TL.shots[k], t0 = TL.cuts[k], t1 = TL.cuts[k + 1] ?? TL.dur;
  SHOT[name](t, (t - t0) / (t1 - t0));
  ALL.forEach(c => { if (c.root.visible) SR.updateLimbs(c); });
  post.bokeh.enabled = dof > 0; if (dof > 0) { post.bokeh.uniforms.focus.value = dof; post.bokeh.uniforms.aperture.value = apt; }
  SR.RIM.dir.value.set(-0.6, 0.6, -0.4).normalize(); U.uTime.value = t; post.render();
  og.drawImage(canvas, 0, 0);
  card('CHICAGO · 1861', t, 7.3, 9.3, 0.16);
  card('+ SEVERAL FEET', t, 18.4, 19.95, 0.2, 76, '#1f4a78');
  card('6 STOREYS', t, 24.0, 26.1, 0.16, 80, '#1b2740');
  card('THOUSANDS OF JACKS', t, 29.3, 32.5, 0.15, 70, '#3a2a1e');
  card('STILL OPEN', t, 42.4, 43.85, 0.16, 84, '#1f6a3a');
  card('THE RAISING OF CHICAGO', t, 53.7, 54.6, 0.18, 64, '#b3261e');
  gauge(t, Math.max(0, gaugeFt), gaugeFt >= 0);
  captions(t);
  return out.toDataURL('image/jpeg', 0.92);
}
window.frame = frame; window.DUR = TL.dur; window.ready = true;
