// "The building that turned" — Indianapolis, 1930. 63.2 s, cut to the user's voiceover (audio/voiceover.mp3).
// V3 white-headed style on the claude-3d-animated-shorts engine (stickrig + post), same look as chicago-v3.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeStickRig } from '/.claude/skills/claude-3d-animated-shorts/engine/stickrig.js';
import { makePost } from '/.claude/skills/claude-3d-animated-shorts/engine/post.js';
import { makeCast, poses, V, clamp, eio, seg, lerp, yawTo } from './cast.js';
import { buildExterior, buildInteriors, bldPose, BLD, BLD_H, PATH, tm, ctex } from './sets.js';

const ENG = '/.claude/skills/claude-3d-animated-shorts/engine';
const Q = new URLSearchParams(location.search);
const WW = +(Q.get('w') || 540), HH = +(Q.get('h') || 960);
const TL = await (await fetch('./timeline.json')).json(); const EV = TL.ev;
for (const [fam, url] of [['InterB', `${ENG}/film/Inter-Black.otf`], ['Anton', `${ENG}/film/Anton.ttf`]]) { const f = new FontFace(fam, `url(${url})`); await f.load(); document.fonts.add(f); }

/* ---------- renderer / light / grade ---------- */
const canvas = document.createElement('canvas'); canvas.width = WW; canvas.height = HH;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setSize(WW, HH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#dfe4e6', 80, 300);
const camera = new THREE.PerspectiveCamera(40, WW / HH, 0.05, 900);
const hemi = new THREE.HemisphereLight('#dfeaff', '#8a6a4c', 0.8); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d6', 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.45;
const post = makePost({ renderer, scene, camera, W: WW, H: HH }); const U = post.grade.uniforms;
post.bloomPass.threshold = 0.95; post.bloomPass.strength = 0.3;
await post.addAO({ intensity: 2.0, aoRadius: 0.7 });
const LOOK = { day: { exp: 0.72, sat: 1.15, con: 1.1, warm: 0.06, vig: 0.8, sun: '#fff0d6', si: 3.0, hemi: 0.85, dir: [0.5, 0.8, 0.55], e: 40 },
  map: { exp: 0.74, sat: 1.12, con: 1.08, warm: 0.04, vig: 0.7, sun: '#fff0d6', si: 3.0, hemi: 0.9, dir: [0.45, 0.9, 0.4], e: 60 },
  low: { exp: 0.76, sat: 1.12, con: 1.12, warm: 0.08, vig: 0.85, sun: '#ffe6c0', si: 3.0, hemi: 0.75, dir: [0.6, 0.7, 0.6], e: 22 },
  north: { exp: 0.76, sat: 1.12, con: 1.12, warm: 0.08, vig: 0.85, sun: '#ffe6c0', si: 3.0, hemi: 0.8, dir: [0.5, 0.6, -0.7], e: 26 },
  inside: { exp: 0.8, sat: 1.18, con: 1.1, warm: 0.08, vig: 0.8, sun: '#ffd9a8', si: 1.5, hemi: 0.55, dir: [0.3, 0.6, 0.8], e: 12 },
  dim: { exp: 0.55, sat: 0.9, con: 1.15, warm: -0.02, vig: 1.1, sun: '#b8c8e8', si: 0.6, hemi: 0.3, dir: [0.3, 0.6, 0.8], e: 12 },
  cut: { exp: 0.76, sat: 1.15, con: 1.1, warm: 0.06, vig: 0.75, sun: '#fff0d6', si: 2.4, hemi: 0.8, dir: [0.3, 0.7, 0.8], e: 18 } };
const setLook = (n, focus, mix) => { const l = LOOK[n]; const m = mix ? LOOK[mix[0]] : null, k = mix ? mix[1] : 0; const L = (a) => m ? lerp(l[a], m[a], k) : l[a];
  renderer.toneMappingExposure = L('exp'); U.uSat.value = L('sat'); U.uCon.value = L('con'); U.uWarm.value = L('warm'); U.uVig.value = L('vig');
  sun.color.set(l.sun); if (m) sun.color.lerp(new THREE.Color(m.sun), k); sun.intensity = L('si'); hemi.intensity = L('hemi'); const d = V(...l.dir).normalize(); sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(d, 80);
  const sc = sun.shadow.camera; sc.left = sc.bottom = -l.e; sc.right = sc.top = l.e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); };

/* ---------- world + cast ---------- */
const EXT = await buildExterior(scene); const INT = await buildInteriors(scene);
const SR = await makeStickRig(scene, `${ENG}/assets/rigs/Xbot.glb`); SR.setInkRes(WW, HH);
const { C, face } = await makeCast(SR);
const P = poses(SR); const { dirW, Lw, arm, leg, headC, place, idle, headTurn, crouch, walkPath, stroll, lie, pointAt } = P;
console.log('walk speed', P.calib(C.ruth).toFixed(2));
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const HX = 300, SX = 400;          // interior world offsets (cut-away building, architect's studio)
const { Y, RD } = INT;

/* ---------- props ---------- */
const props = new THREE.Group(); scene.add(props);
const blueTex = ctex(512, 320, (g, w, h) => { g.fillStyle = '#1f4a78'; g.fillRect(0, 0, w, h); g.strokeStyle = '#cfe6ff'; g.lineWidth = 4; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 3;
  g.strokeRect(190, 70, 130, 210); for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(190, 70 + i * 17.5); g.lineTo(320, 70 + i * 17.5); g.stroke(); } g.fillStyle = '#cfe6ff'; g.font = '26px InterB'; g.fillText('NEW HEADQUARTERS', 40, 50); });
const blue = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), new THREE.MeshStandardMaterial({ map: blueTex, side: THREE.DoubleSide, roughness: 0.9 })); props.add(blue);
const rollerP = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 14), tm('#5a646e', { m: 0.8, r: 0.35 })); rollerP.castShadow = true; props.add(rollerP);
const rollerP2 = rollerP.clone(); props.add(rollerP2);
const receiver = INT.desk.receiver;
const book = INT.book;
const bulb = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(256, 256, (g) => { const gr = g.createRadialGradient(128, 110, 10, 128, 110, 120); gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(0.35, 'rgba(255,214,80,0.55)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#fff6c8'; g.strokeStyle = '#2a1a10'; g.lineWidth = 8; g.beginPath(); g.arc(128, 100, 46, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(150, 172); g.lineTo(106, 172); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#8a8a8a'; g.fillRect(104, 176, 48, 26); g.strokeRect(104, 176, 48, 26); }), transparent: true, depthWrite: false })); scene.add(bulb);
// the move path drawn on the ground for the map shot (grows as the building travels)
const pathMat = new THREE.MeshBasicMaterial({ color: '#ffd23f' });
const pathS = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1), pathMat), pathW = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.9), pathMat); scene.add(pathS, pathW);
const ghostFoot = new THREE.Mesh(new THREE.PlaneGeometry(BLD.D, BLD.W), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })); ghostFoot.rotation.x = -Math.PI / 2; ghostFoot.position.set(PATH.P0.x, 0.36, PATH.P0.z); scene.add(ghostFoot);

/* ---------- camera ---------- */
let dof = 0, apt = 0;
const look = (p, tg, fov = 40, roll = 0, up) => { camera.position.copy(p); up ? camera.up.copy(up) : camera.up.set(0, 1, 0); camera.lookAt(tg); if (roll) camera.rotateZ(roll); camera.fov = fov; camera.aspect = WW / HH; camera.updateProjectionMatrix(); };
const mv = (t, t0, t1, a, b) => { const u = eio(clamp((t - t0) / (t1 - t0))); return a.clone().lerp(b, u); };
const shake = (t, amt) => V(Math.sin(t * 37) * amt, Math.sin(t * 29 + 1) * amt, 0);

/* ---------- overlay: captions + cards ---------- */
const out = document.createElement('canvas'); out.width = WW; out.height = HH; const og = out.getContext('2d'); document.body.appendChild(out);
const K = WW / 1080;
function captions(t) { const c = TL.captions.find(c => t >= c.t0 && t < c.t1); if (!c) return; const pop = 1 + 0.08 * Math.exp(-(t - c.t0) * 16);
  og.save(); og.translate(WW / 2, HH * 0.715); og.scale(pop, pop); og.textBaseline = 'middle'; og.lineJoin = 'round'; og.font = `${84 * K}px InterB`;
  const parts = c.words.map(w => w.w + ' '); const ws = parts.map(p => og.measureText(p).width); const total = ws.reduce((a, b) => a + b, 0); const sc = Math.min(1, (WW * 0.9) / total); og.scale(sc, sc); let x = -total / 2;
  c.words.forEach((w, i) => { const said = t >= w.s - 0.02; og.lineWidth = 15 * K; og.strokeStyle = '#111'; og.fillStyle = w.hot ? (said ? '#ffd23f' : '#fff3c4') : said ? '#ffffff' : '#e8e8e8';
    og.globalAlpha = said ? 1 : 0.72; og.textAlign = 'left'; og.strokeText(parts[i], x, 0); og.fillText(parts[i], x, 0); x += ws[i]; });
  og.restore(); }
function card(text, t, t0, t1, y = 0.17, size = 84, bg = '#b3261e', x = 0.5) { if (t < t0 || t > t1) return; const a = Math.min(1, (t - t0) * 6, (t1 - t) * 6); const s = 0.85 + 0.15 * Math.min(1, (t - t0) * 5);
  og.save(); og.globalAlpha = a; og.translate(WW * x, HH * y); og.scale(s, s); og.font = `${size * K}px Anton`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.letterSpacing = `${4 * K}px`; const w = og.measureText(text).width + 70 * K;
  og.fillStyle = bg; og.beginPath(); og.roundRect(-w / 2, -size * 0.75 * K, w, size * 1.5 * K, 18 * K); og.fill(); og.fillStyle = '#fff'; og.fillText(text, 0, 4 * K); og.restore(); }
function lowerThird(t, t0, t1, name, role, y = 0.6) { if (t < t0 || t > t1) return; const a = Math.min(1, (t - t0) * 5, (t1 - t) * 5), sl = eio(clamp((t - t0) * 3));
  og.save(); og.globalAlpha = a; og.translate(lerp(-WW * 0.4, 0, sl), 0); og.font = `${58 * K}px Anton`; og.letterSpacing = `${2 * K}px`; const w = Math.max(og.measureText(name).width, 300 * K) + 70 * K;
  og.fillStyle = '#ffd23f'; og.fillRect(40 * K, HH * y - 70 * K, 12 * K, 130 * K); og.fillStyle = 'rgba(18,22,32,0.88)'; og.fillRect(52 * K, HH * y - 70 * K, w, 82 * K);
  og.fillStyle = '#fff'; og.textBaseline = 'middle'; og.fillText(name, 80 * K, HH * y - 28 * K); og.fillStyle = '#b3261e'; og.fillRect(52 * K, HH * y + 12 * K, w * 0.7, 48 * K);
  og.font = `${32 * K}px InterB`; og.fillStyle = '#fff'; og.letterSpacing = `${3 * K}px`; og.fillText(role, 80 * K, HH * y + 37 * K); og.restore(); }
function clock(t, t0, t1, speed) { if (t < t0 || t > t1) return; const a = Math.min(1, (t - t0) * 5, (t1 - t) * 5); og.save(); og.globalAlpha = a; og.translate(WW * 0.8, HH * 0.3); const r = 78 * K;
  og.fillStyle = '#f4efe4'; og.strokeStyle = '#1b1414'; og.lineWidth = 9 * K; og.beginPath(); og.arc(0, 0, r, 0, 7); og.fill(); og.stroke();
  for (let i = 0; i < 12; i++) { const a2 = i / 12 * Math.PI * 2; og.lineWidth = 5 * K; og.beginPath(); og.moveTo(Math.sin(a2) * r * 0.78, -Math.cos(a2) * r * 0.78); og.lineTo(Math.sin(a2) * r * 0.9, -Math.cos(a2) * r * 0.9); og.stroke(); }
  const m = (t - t0) * speed, hh = m / 12; for (const [ang, len, lw] of [[m, 0.72, 6], [hh, 0.48, 9]]) { og.lineWidth = lw * K; og.beginPath(); og.moveTo(0, 0); og.lineTo(Math.sin(ang) * r * len, -Math.cos(ang) * r * len); og.stroke(); }
  og.restore(); }
function compass(show) { if (!show) return; og.save(); og.translate(WW * 0.86, HH * 0.11); og.fillStyle = 'rgba(18,22,32,0.7)'; og.beginPath(); og.arc(0, 0, 58 * K, 0, 7); og.fill();
  og.fillStyle = '#ffd23f'; og.beginPath(); og.moveTo(0, -42 * K); og.lineTo(18 * K, 10 * K); og.lineTo(-18 * K, 10 * K); og.fill(); og.fillStyle = '#fff'; og.font = `${36 * K}px Anton`; og.textAlign = 'center'; og.fillText('N', 0, 44 * K); og.restore(); }
const proj = (p) => { const v = p.clone().project(camera); return [(v.x * 0.5 + 0.5) * WW, (-v.y * 0.5 + 0.5) * HH, v.z < 1]; };
function tag(text, p, t, t0, col = '#1b1b1f', size = 44) { if (t < t0) return; const [x, y, ok] = proj(p); if (!ok) return; const a = Math.min(1, (t - t0) * 6), s = 0.7 + 0.3 * eio(clamp((t - t0) * 5));
  og.save(); og.globalAlpha = a; og.translate(x, y); og.scale(s, s); og.font = `${size * K}px Anton`; og.letterSpacing = `${3 * K}px`; og.textAlign = 'center'; og.textBaseline = 'middle'; const w = og.measureText(text).width + 40 * K;
  og.fillStyle = col; og.beginPath(); og.roundRect(-w / 2, -size * 0.7 * K, w, size * 1.4 * K, 12 * K); og.fill(); og.strokeStyle = '#fff'; og.lineWidth = 4 * K; og.stroke(); og.fillStyle = '#fff'; og.fillText(text, 0, 3 * K); og.restore(); }
function flash(t, t0, d = 0.25, col = '255,255,255') { if (t < t0 || t > t0 + d) return; og.fillStyle = `rgba(${col},${0.6 * (1 - (t - t0) / d)})`; og.fillRect(0, 0, WW, HH); }
function letterFade(t, t0, t1) { const a = clamp((t - t0) / (t1 - t0)); if (a <= 0) return; og.fillStyle = `rgba(0,0,0,${a})`; og.fillRect(0, 0, WW, HH); }

/* ---------- helpers ---------- */
const ALL = C.all;
const hideAll = () => { ALL.forEach(c => { c.root.visible = false; c.root.rotation.set(0, 0, 0); }); [blue, rollerP, rollerP2, bulb, pathS, pathW, ghostFoot].forEach(m => (m.visible = false)); book.visible = false; };
/** sit on a seat at hipP, facing yaw; feet planted forward on the floor at floorY */
function sit(c, hipP, yaw, t, floorY, lean = -0.08, spread = 0.13) { lie(c, hipP, yaw, lean, t); const s = c.root.scale.x, f = V(Math.sin(yaw), 0, Math.cos(yaw)), r = V(Math.cos(yaw), 0, -Math.sin(yaw));
  for (const [side, k] of [['Left', 1], ['Right', -1]]) leg(c, side, hipP.clone().addScaledVector(f, 0.5 * s).addScaledVector(r, k * spread * s).setY(floorY + 0.07 * s), V(0, 0.4, 0).addScaledVector(f, 1)); }
/** walk across the bridge (or any A->B at a height); y may be a function of progress */
const bridgeY = () => EXT.bridge.position.y + 0.07;
// traffic on the east street (northbound lane x=31, southbound x=25) and south street
function traffic(t, rate = 1) { EXT.cars.forEach((cr, i) => { const lane = i % 2 ? 25.2 : 31; const dir = i % 2 ? 1 : -1; const len = 140, sp = (7 + i) * rate;
    const z = ((((t * sp + i * 37) % len) + len) % len) - 70; cr.g.position.set(lane, 0, dir * z); cr.g.rotation.y = dir > 0 ? 0 : Math.PI; cr.wheels.forEach(w => (w.rotation.x = t * sp / 0.42 * dir)); }); }
function pedLife(t, list = C.peds, set = 0) { list.forEach((c, k) => { const side = k % 2 ? 37.5 : 18.6; const dir = (k + set) % 2 ? 1 : -1; stroll(c, t, dir > 0 ? -40 : 40, dir > 0 ? 40 : -40, side, 0.15, 1.1 + 0.1 * k, k * 9);
    // stroll moves along x — rotate the path to run along z (N-S sidewalk)
    const p = c.root.position.clone(); c.root.position.set(side, 0.15, p.x); c.root.rotation.y = dir > 0 ? 0 : Math.PI; face(c, 'neutral'); }); }
// operators at the switchboard: seated, plugging cords, heads turning
const OPX = [-2.4, -0.8, 0.8, 2.4];
function operators(t, dark = 0, plug = -1) { C.ops.slice(0, 4).forEach((o, i) => { const x = HX + OPX[i] + (INT.D.position.x), ys = Y.switch;
    sit(o, V(x, ys + 0.66, -RD + 1.6), Math.PI, t + i, ys); const ph = (t * 0.9 + i * 0.37) % 1, reach = Math.sin(ph * Math.PI);
    const jack = V(x + (rnd(i * 5 + Math.floor(t * 0.9 + i * 0.37)) - 0.5) * 1.2, ys + 1.0 + rnd(i * 3 + Math.floor(t * 0.9)) * 0.9, -RD + 0.66);
    const busy = dark < 0.5 ? 1 : 1 - seg(dark, 0.5, 0.8); const plugT = i === 1 && plug >= 0 ? seg(t, plug - 0.5, plug) : 0;
    const hR = plugT > 0 ? V(x - 0.25, ys + 1.25, -RD + 0.68).lerp(Lw(o, -0.25, 1.05, 0.35), 1 - plugT) : Lw(o, -0.22, 1.0, 0.38).lerp(jack, reach * 0.9 * busy);
    arm(o, 'Right', hR); arm(o, 'Left', Lw(o, 0.22, 0.95, 0.32));
    INT.setCord(i, V(x + 0.3, ys + 0.84, -RD + 1.0), SR.wp(o.bone('RightHand')), 0.25);
    headTurn(o, dark > 0.6 ? (i % 2 ? 0.6 : -0.6) * seg(dark, 0.6, 0.9) : 0.1 * Math.sin(t + i), 0);
    face(o, dark > 0.6 ? 'worried' : plugT > 0.9 ? 'happy' : 'focused'); });
  INT.cords.slice(4).forEach((m, k) => { const a = V(HX + -2.8 + k * 1.1 + INT.D.position.x, Y.switch + 0.84, -RD + 1.0), b = V(HX + -2.6 + k * 1.05 + INT.D.position.x, Y.switch + 1.2 + (k % 3) * 0.25, -RD + 0.66); if (dark < 0.7 - k * 0.1) INT.setCord(4 + k, a, b, 0.2); else m.visible = false; }); }
function officeLife(t, ox) { const r = C.ruth, c0 = C.clerks[0], yo = Y.office;
  place(r, HX + ox - 1.45, yo, -RD + 0.5 + 0.12, 0); idle(r, t); const ty = Math.abs(Math.sin(t * 9)) * 0.03; arm(r, 'Left', V(HX + ox - 1.33, yo + 0.98 + ty, -RD + 1.08)); arm(r, 'Right', V(HX + ox - 1.57, yo + 0.98 + (0.03 - ty), -RD + 1.08)); headTurn(r, 0, 0.25); face(r, 'focused');
  place(c0, HX + ox + 1.4, yo, -2.3 - 0.75, 0); idle(c0, t); arm(c0, 'Right', V(HX + ox + 1.3, yo + 0.95 + Math.abs(Math.sin(t * 3)) * 0.05, -2.3 + 0.1)); headTurn(c0, 0, 0.3); face(c0, 'focused'); }
function lobbyLife(t, ox) { const a = C.clerks[1], b = C.clerks[2], yl = Y.lobby;
  place(a, HX + ox + 0.8, yl, -2.0 - 0.8, 0); idle(a, t); face(a, 'happy'); arm(a, 'Right', Lw(a, -0.2, 1.3, 0.45));
  walkPath(b, (t % 4), 0, 4, [HX + ox - 2.8, -1.2], [HX + ox - 0.3, -1.3], yl); face(b, 'neutral'); }

/* ================= shots ================= */
const SHOT = {
  // 1 (0-3.1) — hook: Ruth walks into work over a plank bridge... the whole building is turning on rollers
  hook(t, u) { const k = lerp(0.36, 0.42, u); EXT.update({ k, rig: true, jackAng: t * 4 }); traffic(t); setLook('day', V(4, 4, 4));
    const r = C.ruth, br = EXT.bridge.userData; const A = br.curbP.clone().add(V(0.6, 0, 0)), Bp = br.door.clone().lerp(br.curbP, 0.15);
    const pr = walkPath(r, t, -0.2, 3.4, [A.x, A.z], [Bp.x, Bp.z], bridgeY()); face(r, t < 2.2 ? 'happy' : 'curious');
    C.workers.slice(0, 5).forEach((w, i) => { const J = EXT.jacks[i * 2]; jackMan(w, t, J, i); });
    const fc = r.root.position.clone();
    const e = eio(seg(t, 0.6, 3.1)); look(fc.clone().add(V(-2.6, 1.25, 2.6)).lerp(V(30, 11, 30), e), fc.clone().add(V(0, 0.95, 0)).lerp(V(1, 9, 9), e), lerp(44, 56, e)); },
  // 2 (3.1-6.6) — inside: Ruth with her morning coffee... the street outside slides past the window. Double take.
  deskShock(t, u) { setLook('inside', V(HX, Y.office + 1, -2)); // the window view drifts sideways (the building is turning): offset the panes, not the room
    INT.updDoll(0, t); INT.cords.forEach(c => (c.visible = false)); panesDrift(Math.max(0, t - EV.slide) * 0.06);
    const r = C.ruth, yo = Y.office; place(r, HX - 1.25, yo, -RD + 0.5, 0); idle(r, t);
    const lk = seg(t, EV.slide + 0.1, EV.slide + 0.4) * (1 - seg(t, EV.shock - 0.15, EV.shock)); const sh = seg(t, EV.shock, EV.shock + 0.12);
    headTurn(r, 1.15 * lk + 0.15 * (1 - lk) * (1 - sh), 0.05);
    const sip = seg(t, 3.2, 3.6) * (1 - seg(t, EV.slide, EV.slide + 0.3));
    const mugP = sh > 0 ? Lw(r, -0.32, 1.25 + sh * 0.3, 0.3) : Lw(r, -0.2, lerp(1.05, 1.42, sip), lerp(0.32, 0.22, sip));
    arm(r, 'Right', mugP); INT.desk.mug.position.copy(mugP.clone().add(V(0, 0.06, 0.04)).sub(INT.D.position)); INT.desk.mug.position.x -= HX;
    arm(r, 'Left', sh > 0 ? Lw(r, 0.32, 1.3 + sh * 0.3, 0.3) : Lw(r, 0.25, 0.92, 0.25));
    face(r, t < EV.slide + 0.2 ? 'happy' : t < EV.shock ? 'curious' : 'shocked');
    officeExtras(t);
    const cp = mv(t, 3.1, 6.6, V(HX + 0.2, yo + 1.55, -0.6), V(HX - 0.3, yo + 1.5, -1.5)); look(cp.add(shake(t, t > EV.shock ? 0.012 : 0)), V(HX - 1.45, yo + 1.2, -RD + 0.3), 50);
    dof = camera.position.distanceTo(headC(r)); apt = 0.012; },
  // 3 (6.6-9.9) — Indianapolis, 1930: the street, the old eight-storey telephone building
  city1930(t, u) { setLook('day', V(4, 6, -6)); EXT.update({ k: 0, rig: false, jackAng: 0 }); traffic(t); pedLife(t);
    look(mv(t, 6.6, 9.9, V(36.2, 1.7, 22), V(35.6, 3.2, 17)), mv(t, 6.6, 9.9, V(10, 12, -6), V(6, 15, -7)), 54); },
  // 4 (9.9-15.6) — Indiana Bell wanted a bigger headquarters, right where the old building stood
  plans(t, u) { setLook('day', V(14, 2, -4)); EXT.update({ k: 0, rig: false, ghost: seg(t, ...EV.ghost) }); traffic(t); pedLife(t, C.peds.slice(0, 2));
    const e1 = C.exec1, e2 = C.exec2; const cx = 19.2, cz = 1.5;
    place(e1, cx, 0.15, cz - 0.55, -Math.PI / 2 - 0.25); place(e2, cx, 0.15, cz + 0.55, -Math.PI / 2 + 0.25); idle(e1, t); idle(e2, t + 1);
    const un = seg(t, ...EV.unroll); const mid = V(cx - 0.55, 1.18, cz); blue.visible = true; blue.position.copy(mid); blue.rotation.set(-0.5, -Math.PI / 2, 0); blue.scale.set(lerp(0.15, 1, un), 1, 1);
    arm(e1, 'Left', mid.clone().add(V(0.02, 0, -0.5 * lerp(0.15, 1, un)))); arm(e2, 'Right', mid.clone().add(V(0.02, 0, 0.5 * lerp(0.15, 1, un))));
    arm(e1, 'Right', Lw(e1, -0.22, 0.95, 0.15)); arm(e2, 'Left', t > 11.6 ? pointAtP(e2, V(0, 20, -8)) : Lw(e2, 0.22, 0.95, 0.15));
    const up = seg(t, 11.8, 12.6); headTurn(e1, 0, -0.35 * up); headTurn(e2, 0, -0.4 * up); face(e1, t < 11.4 ? 'talk' : up > 0.5 ? 'smug' : 'neutral'); face(e2, t < 11.6 ? 'neutral' : 'happy');
    if (t < 12.4) { look(mv(t, 9.9, 12.4, V(22.6, 1.55, 3.6), V(22.2, 1.45, 3.1)), V(19.0, 1.3, 1.5), 44); dof = camera.position.distanceTo(V(19, 1.3, 1.5)); apt = 0.01; }
    else look(mv(t, 12.4, 15.6, V(27, 1.6, 9), V(36, 3.5, 22)), mv(t, 12.4, 15.6, V(14, 14, -4), V(2, 24, -8)), mv(t, 12.4, 15.6, V(52, 0, 0), V(62, 0, 0)).x); },
  // 5 (15.6-20.9) — but that building ran the city's phone lines: shut it down and the calls go silent
  switchboard(t, u) { const dark = seg(t, ...EV.dark); setLook('inside', V(HX, Y.switch + 1, -2), dark > 0 ? ['dim', dark] : null); INT.updDoll(0, t); INT.updBoard(t, dark);
    operators(t, dark); const ys = Y.switch;
    if (t < 18.3) look(mv(t, 15.6, 18.3, V(HX + 3.3, ys + 2.3, 0.2), V(HX + 2.9, ys + 2.1, -0.4)), V(HX - 0.6, ys + 1.0, -RD + 1.1), 50);
    else look(mv(t, 18.3, 20.9, V(HX + 0.3, ys + 1.9, 1.2), V(HX + 0.2, ys + 1.8, 0.4)), V(HX, ys + 1.15, -RD + 0.8), 50);
    ruthHidden(); },
  // 6 (20.9-25.2) — so the architect, Kurt Vonnegut Sr., had a crazy idea
  architect(t, u) { setLook('inside', V(SX, 1.5, -2.5)); const v = C.vonnegut, k = C.kurt; studioKid(t, false);
    place(v, SX - 0.6, 0, -2.6 - 0.85, 0); idle(v, t); const draw = Math.sin(t * 5) * 0.06 * (t < EV.idea ? 1 : 0);
    const idea = seg(t, EV.idea - 0.05, EV.idea + 0.15);
    const hb = INT.boardG.localToWorld(V(0.15 + draw, 0.05, -0.1)); arm(v, 'Right', idea > 0 ? hb.clone().lerp(Lw(v, -0.3, 1.75, 0.25), idea) : hb); arm(v, 'Left', INT.boardG.localToWorld(V(-0.4, 0.05, -0.25)));
    headTurn(v, 0, 0.35 * (1 - idea) - 0.1 * idea); face(v, t < EV.idea ? 'focused' : 'idea');
    if (t > EV.idea) { bulb.visible = true; const p = headC(v).add(V(0, 0.5 + 0.05 * Math.sin(t * 8), 0)); bulb.position.copy(p); const s = 0.42 * eio(clamp((t - EV.idea) * 6)) * (1 + 0.06 * Math.sin(t * 20)); bulb.scale.set(s, s, s); }
    look(mv(t, 20.9, 25.2, V(SX + 0.9, 1.9, 1.2), V(SX + 0.1, 1.85, -0.6)), mv(t, 20.9, 25.2, V(SX + 0.2, 1.15, -2.9), V(SX - 0.55, 1.35, -3.3)), 46);
    dof = camera.position.distanceTo(headC(v)); apt = 0.01; },
  // 7 (25.2-27.2) — "Don't tear it down. Move it."  The arrow on the plan, then the stamp.
  moveIt(t, u) { setLook('inside', V(SX, 1.5, -2.5)); const v = C.vonnegut; studioKid(t, false);
    place(v, SX - 0.6, 0, -2.6 - 0.85, 0); idle(v, t); face(v, t < EV.stamp ? 'determined' : 'proud');
    const ar = seg(t, 25.4, 26.3); INT.arrowM.scale.set(Math.max(0.01, ar), 1, 1); INT.arrowM.visible = ar > 0;
    const st = seg(t, EV.stamp - 0.25, EV.stamp); INT.stamp.visible = t > EV.stamp - 0.02; INT.stamp.scale.setScalar(1 + 0.6 * (1 - seg(t, EV.stamp, EV.stamp + 0.08)));
    const hp = t < EV.stamp - 0.3 ? INT.boardG.localToWorld(V(-0.2 + ar * 0.5, 0.05, -0.15 + ar * 0.1)) : INT.boardG.localToWorld(V(0.1, lerp(0.35, 0.06, st), 0.05));
    arm(v, 'Right', hp); arm(v, 'Left', INT.boardG.localToWorld(V(-0.55, 0.05, -0.3)));
    const c = INT.boardG.localToWorld(V(0, 0, 0)); const n = V(0, 1, 0).applyQuaternion(INT.boardG.getWorldQuaternion(new THREE.Quaternion()));
    look(c.clone().addScaledVector(n, 1.7).add(V(0, 0.2, 0.2)).add(shake(t, t > EV.stamp && t < EV.stamp + 0.25 ? 0.02 : 0)), c, mv(t, 25.2, 27.2, V(46, 0, 0), V(40, 0, 0)).x, 0, V(0, 0, -1).applyQuaternion(INT.boardG.getWorldQuaternion(new THREE.Quaternion())));
    INT.stamp.material.opacity = 1; },
  // 8 (27.2-31.6) — workers slid rollers under all 11,000 tons
  rollers(t, u) { const wide = t >= 29.5; setLook(wide ? 'north' : 'low', V(0, 1, wide ? -12 : 3)); EXT.update({ k: 0, rig: true, jackAng: 0 }); traffic(t);
    // the south face (local -x) is at world z = 2: two men roll a fresh steel roller in along the timber track
    const ws = C.workers; const push = (i, x, t0) => { const p = seg(t, t0, t0 + 1.6); const w = ws[i]; const rz = lerp(5.2, 2.2, p);
      const roll = i === 0 ? rollerP : rollerP2; roll.visible = true; roll.position.set(x, 0.46, rz); roll.rotation.set(0, 0, Math.PI / 2); roll.rotateY(-rz / 0.16);
      place(w, x, 0, rz + 0.75, Math.PI); idle(w, t); crouch(w, p > 0 && p < 1 ? 0.32 : 0.22, 0.1, 0.55);
      arm(w, 'Left', V(x - 0.35, 0.52, rz + 0.17)); arm(w, 'Right', V(x + 0.35, 0.52, rz + 0.17)); face(w, p > 0 && p < 1 ? 'determined' : 'neutral'); };
    push(0, -1.7, 27.5); push(1, 1.7, 28.2);
    [2, 3].forEach((i, k) => { const w = ws[i]; place(w, -4.6 + k * 0.8, 0, 4.6 + k * 0.5, Math.PI - 0.5); idle(w, t + k); face(w, 'neutral'); headTurn(w, 0, -0.3); });
    const f = C.foreman; place(f, 4.6, 0, 4.2, -Math.PI / 2 - 0.4); idle(f, t); face(f, 'shout'); arm(f, 'Right', Lw(f, -0.25, 1.45 + 0.2 * Math.max(0, Math.sin(t * 4)), 0.35));
    if (!wide) { look(mv(t, 27.2, 29.5, V(6.8, 2.0, 7.8), V(6.0, 1.8, 6.9)), V(0, 0.8, 3.6), 48); dof = camera.position.distanceTo(V(0, 0.6, 3)); apt = 0.006; }
    else { ws.slice(2, 4).forEach(w => (w.root.visible = false)); look(mv(t, 29.5, 31.6, V(10, 0.6, -22), V(16, 1.0, -27)), mv(t, 29.5, 31.6, V(0, 6, -12), V(0, 17, -8)), 62); } },
  // 9 (31.6-36.8) — eighteen men worked the jacks, inching it along about 15 inches an hour
  jacks(t, u) { setLook('north', V(-2, 1, -16)); const k = 0.004 * seg(t, 31.6, 36.8); EXT.update({ k, rig: true, jackAng: 0 }); traffic(t);
    C.workers.forEach((w, i) => jackMan(w, t, EXT.jacks[i % 9], i)); const f = C.foreman; place(f, -9.5, 0, -19.5, 0.9); idle(f, t); face(f, 'determined'); arm(f, 'Right', Lw(f, -0.25, 1.4 + 0.15 * Math.max(0, Math.sin(t * 3)), 0.35));
    if (t < 34.2) { const J = EXT.jacks[4].j.getWorldPosition(V()); look(mv(t, 31.6, 34.2, V(5.6, 1.7, -19.4), V(4.9, 1.55, -18.6)), V(0.3, 0.9, -15.4), 48); dof = camera.position.distanceTo(J); apt = 0.01; }
    else look(mv(t, 34.2, 36.8, V(13, 2.2, -26), V(14, 3.5, -28)), V(0, 2.6, -13), 50); },
  // 10 (36.8-43.2) — first 52 ft south, then a full 90° turn, then 100 ft west  (overhead time-lapse)
  map(t, u) { setLook('map', V(-12, 0, 4)); const k = t < EV.south[0] ? 0 : t < EV.south[1] ? 0.3 * seg(t, ...EV.south) : t < EV.turn[0] ? 0.3 : t < EV.turn[1] ? lerp(0.3, 0.55, seg(t, ...EV.turn)) : t < EV.west[0] ? 0.55 : lerp(0.55, 1, seg(t, ...EV.west));
    EXT.update({ k, rig: true, jackAng: t * 8 }); traffic(t, 1.6); const p = bldPose(k);
    ghostFoot.visible = true; pathS.visible = pathW.visible = true; const sLen = Math.max(0.01, p.z - PATH.P0.z); pathS.scale.z = sLen; pathS.position.set(PATH.P0.x, 0.4, PATH.P0.z + sLen / 2);
    const wLen = Math.max(0.01, PATH.P0.x - p.x); pathW.visible = wLen > 0.05; pathW.scale.x = wLen; pathW.position.set(PATH.P0.x - wLen / 2, 0.4, p.z);
    C.workers.slice(0, 6).forEach((w, i) => jackMan(w, t, EXT.jacks[i + 1], i));
    const tg = V(lerp(-2, -18, seg(t, 40.5, 43.2)), 0, lerp(-1, 7, seg(t, 36.8, 39.5)));
    look(tg.clone().add(V(0, 92, 20)), tg, 40, 0, V(0, 0, -1)); mapK = k; },
  // 11 (43.2-48.6) — the wildest part: 600 employees kept working inside the whole time
  cutaway(t, u) { setLook('cut', V(HX, 5, -2)); const ox = -0.35 * (t - 43.2); INT.updDoll(ox, t); INT.updBoard(t, 0);
    officeLife(t, ox); operators(t, 0); lobbyLife(t, ox);
    const cx = HX + ox; look(mv(t, 43.2, 48.6, V(cx + 2.6, 5.8, 16.5), V(cx + 0.6, 6.4, 11.5)), mv(t, 43.2, 48.6, V(cx, 5.6, -2), V(cx, 6.0, -2.2)), 44); },
  // 12 (48.6-54.1) — gas, water, power and phone lines stayed connected through flexible pipes and cables
  pipes(t, u) { setLook('day', V(12, 1, -10)); const k = lerp(0.04, 0.09, u); EXT.update({ k, rig: true, jackAng: t * 4 }); traffic(t); pedLife(t, C.peds.slice(2));
    if (t < 51.3) look(mv(t, 48.6, 51.3, V(17.5, 4.6, -1.0), V(16.8, 4.0, -2.2)), mv(t, 48.6, 51.3, V(11, 0.8, -10.5), V(10.8, 0.9, -10.4)), 50);
    else look(mv(t, 51.3, 54.1, V(17, 4.0, -2.4), V(24, 11, 6)), mv(t, 51.3, 54.1, V(10.8, 0.9, -10.4), V(4, 7, -8)), 52);
    pipeTags = t; },
  // 13 (54.1-56.2) — and people walked in over a moving bridge
  bridge(t, u) { setLook('day', V(12, 1, 0)); const k = lerp(0.15, 0.16, u); EXT.update({ k, rig: true, jackAng: t * 4 }); traffic(t); const br = EXT.bridge.userData;
    [C.peds[0], C.peds[1], C.clerks[2], C.peds[3]].forEach((c, i) => { const A = br.curbP.clone().add(V(1.5 + i * 0.1, 0, 0)), Bp = br.door.clone().lerp(br.curbP, 0.1); const t0 = 53.4 + i * 0.75;
      walkPath(c, t, t0, t0 + 3.2, [A.x, A.z + (i % 2 ? 0.25 : -0.25)], [Bp.x, Bp.z + (i % 2 ? 0.25 : -0.25)], bridgeY()); face(c, i === 1 ? 'happy' : 'neutral'); });
    const m = EXT.bridge.position; look(mv(t, 54.1, 56.2, V(m.x + 4.5, 2.6, m.z + 9.5), V(m.x + 1.5, 2.9, m.z + 9.8)), V(m.x - 0.5, 1.6, m.z), 50); },
  // 14 (56.2-59.1) — the phone service never stopped: an operator connects, Ruth's phone rings, she answers
  call(t, u) { if (t < 57.45) { setLook('inside', V(HX, Y.switch + 1, -2)); INT.updDoll(0, t); INT.updBoard(t, 0); operators(t, 0, 56.95);
      const o = C.ops[1]; const x = HX + OPX[1]; look(mv(t, 56.2, 57.45, V(x + 2.4, Y.switch + 2.0, -0.2), V(x + 2.0, Y.switch + 1.9, -0.7)), V(x - 0.2, Y.switch + 1.15, -RD + 0.8), 46); dof = camera.position.distanceTo(headC(o)); apt = 0.01; ruthHidden(); return; }
    setLook('inside', V(HX, Y.office + 1, -2)); INT.updDoll(0, t); INT.cords.forEach(c => (c.visible = false)); panesDrift(0.4);
    const r = C.ruth, yo = Y.office; place(r, HX - 1.25, yo, -RD + 0.5, 0); idle(r, t); const ans = seg(t, EV.answer - 0.25, EV.answer + 0.1);
    const ring = t < EV.answer ? Math.sin(t * 70) * 0.02 : 0; INT.desk.phone.rotation.z = ring;
    const base = INT.desk.phone.localToWorld(V(0.09, 0.2, 0)); const ear = headC(r).add(dirW(r, -1, -0.15, 0.7).multiplyScalar(0.24)); const hp = base.clone().lerp(ear, ans);
    arm(r, 'Right', hp); receiver.position.copy(INT.desk.phone.worldToLocal(hp.clone())); receiver.rotation.z = ans * 0.9; receiver.scale.setScalar(1.8);
    arm(r, 'Left', Lw(r, 0.25, 0.92, 0.25)); headTurn(r, -0.2 * ans, 0.15 * (1 - ans)); face(r, ans > 0.5 ? 'happy' : 'curious');
    INT.desk.mug.position.set(-1.15, Y.office + 0.85, -RD + 1.0);
    officeExtras(t);
    look(mv(t, 57.45, 59.1, V(HX - 0.6, yo + 1.4, -1.6), V(HX - 0.85, yo + 1.38, -2.3)), V(HX - 1.4, yo + 1.3, -RD + 0.4), 44); dof = camera.position.distanceTo(headC(r)); apt = 0.012; },
  // 15 (59.1-63.2) — and the architect's son? He grew up to be the novelist Kurt Vonnegut.
  son(t, u) { setLook('inside', V(SX, 1.5, -2.5)); const v = C.vonnegut; studioKid(t, true);
    place(v, SX - 0.6, 0, -2.6 - 0.85, 0); idle(v, t); arm(v, 'Right', INT.boardG.localToWorld(V(0.15 + Math.sin(t * 4) * 0.05, 0.05, -0.1))); arm(v, 'Left', INT.boardG.localToWorld(V(-0.4, 0.05, -0.25))); headTurn(v, 0, 0.35); face(v, 'focused');
    const kc = headC(C.kurt);
    look(mv(t, 59.1, 63.2, V(SX + 0.7, 1.55, 0.5), V(SX + 1.15, 1.1, -0.75)), mv(t, 59.1, 63.2, V(SX + 1.9, 0.9, -1.7), kc.clone().add(V(0, -0.1, 0))), mv(t, 59.1, 63.2, V(48, 0, 0), V(40, 0, 0)).x);
    dof = camera.position.distanceTo(kc); apt = t > 60.5 ? 0.014 : 0.006; },
};
let mapK = -1, pipeTags = -1;
function pointAtP(c, P2) { const sh = SR.wp(c.bone('LeftArm')); return sh.clone().add(P2.clone().sub(sh).normalize().multiplyScalar(0.55)); }
function ruthHidden() {}
function panesDrift(d) { INT.D.traverse(m => { if (m.isMesh && m.material.map && m.userData.x !== undefined) m.material.map.offset.x = (m.userData.x + 3) / 40 + d; }); }
function officeExtras(t) { const c0 = C.clerks[0], yo = Y.office; place(c0, HX + 1.4, yo, -2.3 - 0.75, 0); idle(c0, t); arm(c0, 'Right', V(HX + 1.3, yo + 0.95 + Math.abs(Math.sin(t * 3)) * 0.05, -2.2)); headTurn(c0, 0, 0.3); face(c0, 'focused'); }
function studioKid(t, payoff) { const k = C.kurt; const seatY = 0.42; const ap = V(SX + 2.2, seatY, -1.6); const yaw = -0.9;
  sit(k, ap.clone().add(V(Math.sin(yaw) * 0.05, 0, Math.cos(yaw) * 0.05)), yaw, t, 0, -0.12, 0.1); book.visible = true;
  const lookUp = payoff ? seg(t, EV.lookUp - 0.3, EV.lookUp + 0.1) : 0; INT.kidDesk.visible = false; const bk = Lw(k, 0, lerp(1.42, 1.12, lookUp), 0.62);
  arm(k, 'Left', bk.clone().add(dirW(k, 1, 0, 0).multiplyScalar(0.09))); arm(k, 'Right', bk.clone().add(dirW(k, -1, 0, 0).multiplyScalar(0.09))); book.position.copy(bk.clone().add(V(-SX, 0.03, 0))); book.scale.setScalar(1.6); book.rotation.set(-0.7, yaw, 0, 'YXZ');
  headTurn(k, lookUp * 0.35, 0.45 * (1 - lookUp) - 0.05 * lookUp); face(k, payoff ? (lookUp > 0.5 ? 'happy' : 'focused') : 'focused'); }
// a man on a horizontal screw jack: stands beside it and pumps the ratchet bar up and down
function jackMan(w, t, J, i) { const ph = Math.sin(t * 3.2 + i * 0.9); J.bar.rotation.z = ph * 0.55; J.j.updateMatrixWorld(true);
  const end = J.bar.localToWorld(V(0.5, 0, 0)); const side = J.j.localToWorld(V(0.95, 0, 0)); const back = J.j.localToWorld(V(0, 0, -1));
  const yaw = Math.atan2(end.x - side.x, end.z - side.z); place(w, side.x, 0, side.z, yaw); idle(w, t); crouch(w, 0.16 + 0.06 * Math.max(0, -ph), 0.05, 0.3 + 0.1 * Math.max(0, -ph));
  arm(w, 'Left', end.clone().add(V(0, 0.02, 0))); arm(w, 'Right', J.bar.localToWorld(V(0.32, 0, 0))); face(w, i % 3 ? 'determined' : 'focused'); }

/* ================= frame ================= */
function frame(t) {
  hideAll(); dof = 0; apt = 0; mapK = -1; pipeTags = -1; INT.arrowM.visible = false; INT.stamp.visible = false; INT.D.position.x = 0; INT.desk.phone.rotation.z = 0; receiver.position.set(0.09, 0.2, 0); receiver.rotation.z = 0; receiver.scale.setScalar(1);
  let k = 0; TL.cuts.forEach((c, i) => { if (t >= c) k = i; }); const name = TL.shots[k], t0 = TL.cuts[k], t1 = TL.cuts[k + 1] ?? TL.dur;
  SHOT[name](t, (t - t0) / (t1 - t0));
  ALL.forEach(c => { if (c.root.visible) SR.updateLimbs(c); });
  post.bokeh.enabled = dof > 0; if (dof > 0) { post.bokeh.uniforms.focus.value = dof; post.bokeh.uniforms.aperture.value = apt; }
  SR.RIM.dir.value.set(-0.6, 0.6, -0.4).normalize(); U.uTime.value = t; post.render();
  og.drawImage(canvas, 0, 0);
  // story graphics
  card('INDIANAPOLIS · 1930', t, 6.75, 9.8, 0.16, 74, '#1b2740');
  card('8 STORIES', t, 13.4, 15.5, 0.16, 84, '#1f4a78');
  if (t > 18.4 && t < 20.9) card('CALLS: SILENT', t, 19.9, 20.85, 0.16, 70, '#2a2a30');
  lowerThird(t, 22.35, 24.0, 'KURT VONNEGUT SR.', 'ARCHITECT', 0.6);
  card('11,000 TONS', t, 29.8, 31.55, 0.16, 92, '#3a2a1e');
  card('15 IN / HOUR', t, 34.5, 36.75, 0.16, 80, '#1f4a78'); clock(t, 34.4, 36.75, 9);
  if (mapK >= 0) { compass(true); card('52 FT SOUTH', t, 37.3, 38.85, 0.2, 76, '#b3261e'); card('90° TURN', t, 39.6, 41.3, 0.2, 76, '#b3261e'); card('100 FT WEST', t, 42.1, 43.2, 0.2, 76, '#b3261e'); }
  card('600 EMPLOYEES', t, 44.95, 48.5, 0.16, 84, '#1f6a3a');
  if (pipeTags >= 0) EXT.lines.forEach((L, i) => { const tt = [48.92, 49.54, 50.2, 50.7][i]; const c = L.m.geometry.parameters?.path; if (c) tag(L.name, c.getPoint(0.18 + i * 0.2).add(V(0, 0.7, 0)), t, tt, L.col, 56); });
  if (name === 'bridge') tag('MOVING BRIDGE', EXT.bridge.position.clone().add(V(0, 2.4, 0)), t, 55.6, '#b3261e', 46);
  card('SERVICE NEVER STOPPED', t, 57.6, 59.05, 0.16, 66, '#1f6a3a');
  lowerThird(t, 61.75, 63.2, 'KURT VONNEGUT', 'NOVELIST · HIS SON', 0.6);
  flash(t, EV.stamp, 0.2); flash(t, EV.shock, 0.15);
  captions(t);
  return out.toDataURL('image/jpeg', 0.92);
}
window.frame = frame; window.DUR = TL.dur; window.ready = true;
