// "Emperor of the United States": frame-stepped renderer. Engine modules (./eng, MIT, from claude-animated-shorts) do the
// shading, ink, lens blur, grade and character drawing; world.ts / people.ts / story.ts are this video.
import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode, BlendFunction } from "postprocessing";
import { InkPass, NOINK, noInkFallback } from "@eng/ink";
import { LensBlur } from "@eng/lensblur";
import { GradeEffect, GRADES, gradeFor } from "@eng/grade";
import { LIGHTS, LOOK } from "@eng/lights";
import { TONE, CHAR, untone } from "@eng/shade";
import { lam } from "@eng/build";
import { cloudHD, ctex } from "@eng/paint";
import { Pen, bodyFront, bodySide } from "@eng/toon";
import type { Expr } from "@eng/toon";
import { buildWorld } from "./world";
import { Cast, OUT, FPS } from "./people";
import type { Stage, Who } from "./people";
import { SHOTS, TOTAL, shotAt, EXTRA } from "./story";
import type { Shot, Ctx, Key } from "./story";

const q = new URLSearchParams(location.search);
const SCALE = parseFloat(q.get("s") ?? "1"), SHADOW = parseInt(q.get("sm") ?? "4096");
const W = Math.round(parseFloat(q.get("w") ?? "1080") * SCALE), H = Math.round(parseFloat(q.get("h") ?? "1920") * SCALE);
const canvas = document.getElementById("c") as HTMLCanvasElement;
canvas.width = W; canvas.height = H;

// ---------------------------------------------------------------- character / expression sheet (2D only): ?sheet=1
if (q.get("sheet")) {
  const g = canvas.getContext("2d")!; canvas.width = 2400; canvas.height = 2000; g.fillStyle = "#cfe0ee"; g.fillRect(0, 0, 2400, 2000);
  const cell = (ix: number, iy: number, draw: (p: Pen) => void, label: string) => {
    g.save(); g.translate(ix * 300, iy * 500); g.scale(0.5, 0.5); draw(new Pen(g)); g.restore();
    g.fillStyle = "#222"; g.font = "22px sans-serif"; g.fillText(label, ix * 300 + 8, iy * 500 + 24);
  };
  const names = Object.keys(OUT);
  names.slice(0, 8).forEach((n, i) => cell(i, 0, (p) => bodyFront(p, OUT[n], { mode: "stand", expr: "neutral", seed: 2 }), n));
  names.slice(8, 16).forEach((n, i) => cell(i, 1, (p) => bodyFront(p, OUT[n], { mode: "stand", expr: "smile", seed: 3 }), n));
  (["neutral", "stern", "grin", "laugh", "whistle", "nervous", "shock", "relief"] as Expr[]).forEach((e, i) => cell(i, 2, (p) => bodyFront(p, OUT.norton, { mode: "stand", expr: e, seed: 2, armR: (["salute", "point", "hold", "up"] as const)[i % 4], paper: "#f4efe2", armL: i > 5 ? "up" : undefined }), e));
  (["relief_open", "dazed", "pained", "smile", "smile_closed", "lick"] as Expr[]).forEach((e, i) => cell(i, 3, (p) => bodyFront(p, OUT.norton, { mode: i % 2 ? "march" : "stand", phase: 0.2, expr: e, seed: 2, tilt: i === 2 ? 16 : 0, headTilt: i === 2 ? 8 : 0 }), e));
  cell(6, 3, (p) => bodySide(p, OUT.norton, { mode: "march", phase: 0.15, expr: "smile_closed", seed: 2 }), "side");
  cell(7, 3, (p) => bodySide(p, OUT.cop, { mode: "stand", expr: "nervous", seed: 4 }), "side cop");
  (window as any).grab = (quality = 0.92) => canvas.toDataURL("image/jpeg", quality);
  (window as any).renderFrame = () => true; (window as any).TOTAL = 1; (window as any).READY = true;
  throw new Error("sheet mode (not an error)");
}

// ---------------------------------------------------------------- renderer + post chain (the engine's order)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, depth: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(40, W / H, 0.2, 2500);
const root = new THREE.Group(); scene.add(root);
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = (b as any).mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const composer = new EffectComposer(renderer, { multisampling: parseInt(q.get("ms") ?? "4"), frameBufferType: THREE.HalfFloatType });
const fx = { ink: new InkPass(scene, cam), lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }), bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, 1) };
const lensPre = new EffectPass(cam, fx.lens.pre), lensMain = new EffectPass(cam, fx.lens.main);
composer.addPass(new RenderPass(scene, cam)); composer.addPass(fx.ink); composer.addPass(lensPre); composer.addPass(lensMain);
composer.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.grade));
composer.setSize(W, H);

// ---------------------------------------------------------------- sky, sun, clouds
const skyMat = new THREE.ShaderMaterial({
  uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
  vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
    void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
      vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
      c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), skyMat);
sky.renderOrder = -1; sky.frustumCulled = false; sky.layers.set(NOINK); root.add(sky);
const discTex = ctex("sunDisc", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const haloTex = ctex("sunHalo", 256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,.85)"); gr.addColorStop(0.3, "rgba(255,255,255,.4)"); gr.addColorStop(0.7, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex, color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
sunDisc.renderOrder = -0.5; sunHalo.renderOrder = 5;
for (const m of [sunDisc, sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); root.add(m); }
const hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1), sun = new THREE.DirectionalLight("#fff0d6", 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(SHADOW, SHADOW); root.add(hemi, sun, sun.target);
const fog = new THREE.Fog("#bccbec", 25, 420);
const cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
const clouds: THREE.Mesh[] = [];
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2 + 0.3, d = 1150 + (i % 3) * 110;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
  const w = 250 + (i % 4) * 55; m.userData = { a, d, h: 220 + (i % 4) * 70 }; m.scale.set(w, w / 2, 1); m.layers.set(NOINK); clouds.push(m); root.add(m);
}

// ---------------------------------------------------------------- world, cast, the emperor's hat and sword
const world = buildWorld(root), cast = new Cast(root, cam);
{ const felt = lam("relicFelt", () => ({ color: "#2e2a36" })), gold = lam("relicGold", () => ({ color: "#e8c45a" })), steel = lam("relicSteel", () => ({ color: "#c9d0d8" })), plume = lam("relicPlume", () => ({ color: "#f6f1e4" })), wood = lam("relicWood", () => ({ color: "#9a6a42" }));
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; world.relics.add(o); };
  add(new THREE.BoxGeometry(0.9, 0.62, 0.9).translate(0, 0.31, 0), wood);
  add(new THREE.CylinderGeometry(0.2, 0.185, 0.36, 18).translate(0.05, 0.82, 0), felt); add(new THREE.CylinderGeometry(0.33, 0.33, 0.035, 18).translate(0.05, 0.64, 0), felt);
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 18).translate(0.05, 0.7, 0), lam("relicBand", () => ({ color: "#27407e" })));
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.16, 0.24, 0.1, 0.56, -0.3, 0.7); sh.bezierCurveTo(-0.18, 0.5, -0.17, 0.22, 0, 0);
    add(new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false, curveSegments: 14 }).translate(-0.02, 0.72, 0.19), plume);
    add(new THREE.SphereGeometry(0.045, 12, 8).translate(-0.02, 0.75, 0.215), gold); }
  { const sw = (g: THREE.BufferGeometry, m: THREE.Material) => add(g.rotateZ(0.42).translate(0.74, 0.02, 0.22), m), dark = lam("relicGrip", () => ({ color: "#3a2a22" }));
    sw(new THREE.BoxGeometry(0.05, 1.0, 0.016).translate(0, 0.5, 0), steel); sw(new THREE.BoxGeometry(0.2, 0.04, 0.05).translate(0, 1.02, 0), gold);
    sw(new THREE.CylinderGeometry(0.024, 0.024, 0.17, 10).translate(0, 1.125, 0), dark); sw(new THREE.SphereGeometry(0.036, 10, 8).translate(0, 1.23, 0), gold); }
}

// ---------------------------------------------------------------- camera path per shot
const pchip = (xs: number[], ys: number[]) => {
  const n = xs.length; if (n === 1) return () => ys[0];
  const h: number[] = [], d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); d.push((ys[i + 1] - ys[i]) / h[i]); }
  m[0] = d[0] * 0.9; m[n - 1] = d[n - 2] * 0.55;                                 // already moving at the cut, easing toward the next one
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (h[i - 1] + h[i])) / ((2 * h[i] + h[i - 1]) / d[i - 1] + (h[i] + 2 * h[i - 1]) / d[i]);
  return (x: number) => {
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const u = Math.max(0, Math.min(1, (x - xs[i]) / h[i])), u2 = u * u, u3 = u2 * u;
    return ys[i] * (2 * u3 - 3 * u2 + 1) + h[i] * m[i] * (u3 - 2 * u2 + u) + ys[i + 1] * (-2 * u3 + 3 * u2) + h[i] * m[i + 1] * (u3 - u2);
  };
};
type Path = Record<string, (u: number) => number> & { sunDir: THREE.Vector3 };
const paths = new Map<string, Path>();
const pathOf = (s: Shot): Path => {
  let p = paths.get(s.id); if (p) return p;
  const us = s.cam.map((k) => k.u), ch = (get: (k: Key) => number) => pchip(us, s.cam.map(get));
  p = { px: ch((k) => k.pos[0]), py: ch((k) => k.pos[1]), pz: ch((k) => k.pos[2]), lx: ch((k) => k.look[0]), ly: ch((k) => k.look[1]), lz: ch((k) => k.look[2]),
    fov: ch((k) => k.fov), roll: ch((k) => k.roll ?? 0), cInf: ch((k) => k.cInf ?? 0), sunDir: new THREE.Vector3() } as Path;
  // sun: camera-relative azimuth / elevation, frozen per shot (az 0 = straight ahead, +90 = screen right, 180 = behind the lens)
  let fxx = 0, fz = 0;
  for (const k of s.cam) { const x = k.look[0] - k.pos[0], z = k.look[2] - k.pos[2], n = Math.hypot(x, z) || 1; fxx += x / n; fz += z / n; }
  const n = Math.hypot(fxx, fz) || 1; fxx /= n; fz /= n;
  const L = LIGHTS[s.light], az = THREE.MathUtils.degToRad(s.sun ? s.sun[0] : L.az), el = THREE.MathUtils.degToRad(s.sun ? s.sun[1] : L.el);
  const hx = fxx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fxx * Math.sin(az);
  p.sunDir.set(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
  paths.set(s.id, p); return p;
};

// ---------------------------------------------------------------- per frame
const fwd = new THREE.Vector3(), focusPt = new THREE.Vector3(), v3 = new THREE.Vector3();
const update = (f: number) => {
  const t = f / FPS, s = (q.get("shot") && EXTRA[q.get("shot")!]) || shotAt(t), lt = t - s.t0, d = s.t1 - s.t0, u = Math.max(0, Math.min(1, lt / d)), P = pathOf(s), L = LIGHTS[s.light], K = LOOK[s.light], ox = s.ox;
  cam.position.set(P.px(u) + ox, P.py(u), P.pz(u)); cam.up.set(0, 1, 0);
  if (s.kick !== undefined) { const k = f - Math.round(s.t0 * FPS); if (k >= 0 && k < 7) { const a = 0.05 * (1 - k / 7) * (k % 2 ? -1 : 1); cam.position.x += a; cam.position.y += a * 0.7; } }
  focusPt.set(P.lx(u) + ox, P.ly(u), P.lz(u));
  cam.lookAt(focusPt); cam.rotateZ(THREE.MathUtils.degToRad(P.roll(u)));
  cam.fov = P.fov(u); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
  const dist = cam.position.distanceTo(focusPt), sunDir = P.sunDir, golden = s.light === "golden";
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemiI; sun.color.set(L.sunCol); sun.intensity = L.sunI;
  let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95); if (golden) Rr = Math.max(Rr, 34);
  sun.position.copy(focusPt).addScaledVector(sunDir, 220); sun.target.position.copy(focusPt);
  const sc = sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
  sun.shadow.bias = L.bias; sun.shadow.normalBias = L.normalBias * (Rr / 12);
  TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
  TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
  CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
  const su = skyMat.uniforms; K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
  const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]); sky.position.copy(cam.position);
  const fg = s.fog ?? (s.set === "office" ? [60, 500] : [L.fogNear, s.set === "wharf" ? 900 : 340]);
  untone(L.fog, fog.color); fog.near = fg[0]; fog.far = fg[1]; scene.fog = fog; scene.background = null;
  sunDisc.visible = sunHalo.visible = golden;
  if (golden) {
    sunDisc.position.copy(cam.position).addScaledVector(sunDir, 1800); sunDisc.scale.setScalar(2 * 1800 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    sunHalo.position.copy(sunDisc.position); sunHalo.scale.setScalar(2 * 1800 * Math.tan(THREE.MathUtils.degToRad(24))); (sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
  }
  clouds.forEach((m, i) => { const { a, d: dd, h } = m.userData; m.position.set(cam.position.x + Math.cos(a) * dd, h, cam.position.z + Math.sin(a) * dd); m.lookAt(cam.position.x, h, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = cloudMaps[s.light][i % 4]; m.visible = s.set !== "office"; });
  // ---- things the story switches on per shot
  for (const k in world.docs) world.docs[k].visible = false;
  world.tram.position.z = -400; world.bridge.visible = false; world.relics.visible = false; for (const g of world.fleet) g.visible = false;
  cast.sun.copy(sunDir); cast.right.setFromMatrixColumn(cam.matrixWorld, 0); cast.golden = golden;
  const st: Stage = { places: [], fx: [] };
  const ctx: Ctx = {
    t, lt, d, u, f,
    put: (w: Who) => cast.put(st, f, { ...w, x: w.x + ox }),
    doc: (key, pos, h, roll = 0, yaw) => {
      const m = world.doc(key); m.visible = true; m.position.set(pos[0] + ox, pos[1], pos[2]); m.scale.setScalar(h);
      if (yaw === undefined) m.quaternion.copy(cam.quaternion); else m.rotation.set(0, yaw, 0);
      m.rotateZ(THREE.MathUtils.degToRad(roll));
    },
    tram: (z) => { world.tram.position.z = z; },
    fleet: (k) => world.fleet.forEach((g, i) => { g.visible = true; g.position.z = -520 + 330 * k - i * 55; g.position.y = -2.0 + 0.15 * Math.sin(t * 2 + i); }),
    bridge: () => { world.bridge.visible = true; },
    relics: (x, z) => { world.relics.visible = true; world.relics.position.set(x + ox, 0.16, z); world.relics.rotation.y = 0.5; },
  };
  s.stage(ctx);
  cast.apply(st, L.actorShadow);
  noInkFallback(root);
  cam.getWorldDirection(fwd);
  const fp = s.focus ? s.focus(ctx) : null;
  if (fp) v3.set(fp[0] + ox, fp[1], fp[2]); else v3.copy(focusPt);
  const cInf = Math.max(0, P.cInf(u));
  fx.lens.focus = Math.max(0.3, v3.sub(cam.position).dot(fwd)); fx.lens.cInf = cInf;
  lensPre.enabled = lensMain.enabled = cInf > 0.05;
  gradeFor(fx.grade, s.light);
};

(window as any).TOTAL = TOTAL; (window as any).SHOTS = SHOTS.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1 }));
(window as any).renderFrame = (f: number) => { update(f); composer.render(); return true; };
(window as any).grab = (quality = 0.96) => canvas.toDataURL("image/jpeg", quality);
(window as any).READY = true;
