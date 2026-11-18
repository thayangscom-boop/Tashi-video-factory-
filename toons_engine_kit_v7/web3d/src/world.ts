// "The Rattler": one desert canyon, a railroad on each rim. Our line runs along x = TX, the rival's along x = RX.
// Things that move (trains, the rail gap, the buckling track, small props) are separate objects the story drives.
import * as THREE from "three";
import { Batch, lam, boxGeo, V, quad } from "@eng/build";
import { ctex } from "@eng/paint";
import { twoTone } from "@eng/shade";

export const TX = 3, RX = -52, EDGE = -6, FAR = -46, RH = 0.72, SEG = 11.9;
const up = (x0: number, x1: number, z0: number, z1: number, y: number, tile = 4) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
const FONT = "Georgia, 'DejaVu Serif', 'Liberation Serif', serif", SANS = "'DejaVu Sans', 'Liberation Sans', Arial, sans-serif";
const calm = (key: string, base: string, spots: string[], n = 260) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < n; i++) { g.globalAlpha = 0.05 + 0.06 * r(); g.fillStyle = spots[i % spots.length]; const x = r() * 512, y = r() * 512, s = 30 + r() * 70; for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { g.beginPath(); g.ellipse(x + dx, y + dy, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); g.fill(); } }
  g.globalAlpha = 1;
});
const signTex = (key: string, text: string, w: number, h: number, bg: string, fg: string) => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = h * 0.05; g.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; let fs = h * 0.5; g.font = `bold ${fs}px ${SANS}`;
  while (g.measureText(text).width > w * 0.84) { fs *= 0.95; g.font = `bold ${fs}px ${SANS}`; }
  g.fillText(text, w / 2, h * 0.53);
});

export type World = {
  root: THREE.Group; trains: THREE.Group[]; props: Record<string, THREE.Object3D>;
  setGap: (w: number) => void; setSnake: (a: number) => void; doc: (key: string) => THREE.Mesh; docs: Record<string, THREE.Mesh>;
};

export const buildWorld = (root: THREE.Group): World => {
  const b = new Batch();
  const M = {
    sand: lam("sand", () => ({ map: calm("sand", "#dcae72", ["#d2a266", "#e4b97f", "#cf9d62"]) })),
    rock: lam("rock", () => ({ color: "#c0683f" })), rock2: lam("rock2", () => ({ color: "#a9532f" })), rock3: lam("rock3", () => ({ color: "#d58a55" })),
    mesa: lam("mesa", () => ({ color: "#cf7f52" })), mesa2: lam("mesa2", () => ({ color: "#b96a48" })),
    river: lam("river", () => ({ color: "#4f9fb5" })),
    ballast: lam("ballast", () => ({ map: calm("ballast", "#9c9388", ["#8d857b", "#a8a096"]) })),
    tie: lam("tie", () => ({ color: "#6b4a34" })), wood: lam("woodDark", () => ({ color: "#7a5236" })), woodL: lam("woodLight", () => ({ color: "#b98a58" })),
    steel: twoTone(new THREE.MeshPhongMaterial({ color: "#77818f", specular: "#d8d8d8", shininess: 50 }), 0.15),
    iron: twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15),
    black: lam("black", () => ({ color: "#26262c" })), red: lam("red", () => ({ color: "#b8443a" })), green: lam("locoGreen", () => ({ color: "#2f6f5a" })),
    blue: lam("blue", () => ({ color: "#3d5fa8" })), cream: lam("cream", () => ({ color: "#ece2c6" })), gold: lam("gold", () => ({ color: "#e0b84a" })),
    cactus: lam("cactus", () => ({ color: "#5f9a57" })), white: lam("white", () => ({ color: "#f4f1e8" })), smoke: lam("smoke", () => ({ color: "#f1f1f1" })),
    canvas: lam("canvas", () => ({ color: "#e9dfc4" })),
  };
  // ================================================================ the land: two rims, a deep canyon between them, mesas on the horizon
  b.add(up(EDGE, 500, -500, 300, 0, 10), M.sand); b.add(up(-600, FAR, -500, 300, 0, 10), M.sand);
  const wall = (x: number, s: 1 | -1) => {         // s = +1: the wall of our rim (faces -x); stepped ledges going down
    const L = [[0, -7, 0, M.rock3], [-7, -30, 1.6, M.rock], [-30, -62, 3.6, M.rock2], [-62, -110, 6.5, M.rock], [-110, -170, 10, M.rock2]] as const;
    for (const [y1, y0, inset, m] of L) b.add(boxGeo(V(s > 0 ? x - inset - 14 : x - 600, y0, -500), V(s > 0 ? x + 600 : x + inset + 14, y1, 300)), m);
    // top slab over the stack so the rim is one clean edge
  };
  wall(EDGE + 14, 1); wall(FAR - 14, -1);
  b.add(up(-60, 10, -500, 300, -170, 20), M.rock2); b.add(up(-30, -22, -500, 300, -169.5, 20), M.river);
  for (const [x, z, w, d, h, m] of [[160, -330, 90, 70, 60, M.mesa], [260, -200, 70, 90, 44, M.mesa2], [120, -420, 60, 50, 80, M.mesa2], [-200, -340, 100, 80, 66, M.mesa], [-300, -180, 80, 70, 40, M.mesa2], [-140, -430, 60, 60, 90, M.mesa],
    [330, 40, 80, 100, 50, M.mesa], [-330, 60, 90, 90, 56, M.mesa], [200, 190, 80, 60, 46, M.mesa2], [-210, 200, 70, 70, 60, M.mesa2]] as const) {
    b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, h, z + d / 2)), m); b.add(boxGeo(V(x - w / 2 - 6, 0, z - d / 2 - 6), V(x + w / 2 + 6, h * 0.35, z + d / 2 + 6)), m === M.mesa ? M.mesa2 : M.mesa);
  }
  const cactus = (x: number, z: number, h = 2.2) => {
    b.add(new THREE.CapsuleGeometry(0.22, h, 6, 10).translate(x, h / 2 + 0.2, z), M.cactus);
    b.add(new THREE.CapsuleGeometry(0.14, 0.7, 6, 8).translate(x + 0.5, h * 0.62, z), M.cactus); b.add(new THREE.CapsuleGeometry(0.14, 0.3, 6, 8).rotateZ(Math.PI / 2).translate(x + 0.3, h * 0.45, z), M.cactus);
    b.add(new THREE.CapsuleGeometry(0.13, 0.5, 6, 8).translate(x - 0.45, h * 0.5, z), M.cactus); b.add(new THREE.CapsuleGeometry(0.13, 0.25, 6, 8).rotateZ(Math.PI / 2).translate(x - 0.28, h * 0.36, z), M.cactus);
  };
  for (const [x, z, h] of [[9, -6, 2.4], [14, 10, 1.8], [8, -30, 2.0], [20, -18, 2.6], [11, 26, 2.2], [-58, -8, 2.4], [-62, 14, 2.0], [-57, -34, 2.2], [-66, -20, 2.6], [16, -52, 2.2], [-60, 40, 2.3], [7.5, 48, 2.0]] as const) cactus(x, z, h);
  for (const [x, z, s] of [[7, 3, 0.5], [-1.5, -9, 0.4], [6.5, -14, 0.7], [-56, 4, 0.6], [-48.5, -16, 0.4], [12, 18, 0.8], [-2, 12, 0.35]] as const) b.add(new THREE.DodecahedronGeometry(s, 0).scale(1, 0.6, 1).translate(x, s * 0.3, z), M.rock2);

  // ================================================================ the two lines
  const RW = 0.09, RY0 = 0.12, RY1 = 0.26;
  const railBox = (z0: number, z1: number) => boxGeo(V(-RW / 2, RY0, z0), V(RW / 2, RY1, z1));
  const line = (cx: number, skip: [number, number]) => {
    b.add(boxGeo(V(cx - 1.5, 0, -480), V(cx + 1.5, 0.05, 280), 3), M.ballast);
    for (let z = -479.6; z < 280; z += 0.7) if (z < skip[0] || z > skip[1]) b.add(boxGeo(V(cx - 1.15, 0.04, z - 0.12), V(cx + 1.15, 0.12, z + 0.12)), M.tie);
    for (let z = -470; z < 270; z += 40) for (const s of [1]) {   // telegraph poles on the land side
      const px = cx + (cx > -20 ? 3.2 : -3.2) * s; b.add(boxGeo(V(px - 0.09, 0, z - 0.09), V(px + 0.09, 6, z + 0.09)), M.wood); b.add(boxGeo(V(px - 0.9, 5.3, z - 0.06), V(px + 0.9, 5.45, z + 0.06)), M.wood);
    }
  };
  line(TX, [9e9, -9e9]); line(RX, [-30.2, 30.2]);
  // our rails: 39-foot lengths with a small gap; the pair of lengths that meet at z = 0 are separate so their gap can change
  for (const x of [TX - RH, TX + RH]) for (let k = -40; k < 24; k++) { if (k === -1 || k === 0) continue; b.add(railBox(k * SEG + 0.02, (k + 1) * SEG - 0.02).translate(x, 0, 0), M.steel); }
  // the rival's rails: one unbroken ribbon, except the stretch that will buckle
  for (const x of [RX - RH, RX + RH]) { b.add(railBox(-476, -30).translate(x, 0, 0), M.steel); b.add(railBox(30, 276).translate(x, 0, 0), M.steel); }
  // water tower and a work camp by our line; a finish arch on the rival's
  const tower = (x: number, z: number) => { for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) b.add(boxGeo(V(x + dx * 1.2 - 0.1, 0, z + dz * 1.2 - 0.1), V(x + dx * 1.2 + 0.1, 4.2, z + dz * 1.2 + 0.1)), M.wood);
    b.add(new THREE.CylinderGeometry(1.9, 1.9, 2.6, 18).translate(x, 5.5, z), M.woodL); b.add(new THREE.ConeGeometry(2.2, 1.1, 18).translate(x, 7.35, z), M.red); for (const y of [4.6, 6.4]) b.add(new THREE.CylinderGeometry(1.93, 1.93, 0.12, 18).translate(x, y, z), M.iron); };
  tower(8.5, -22); tower(-58, 46);
  const tent = (x: number, z: number) => { const sh = new THREE.Shape(); sh.moveTo(-1.6, 0); sh.lineTo(1.6, 0); sh.lineTo(0, 2.1); sh.closePath(); b.add(new THREE.ExtrudeGeometry(sh, { depth: 3.2, bevelEnabled: false }).translate(x, 0, z - 1.6), M.canvas); };
  tent(9, 9); tent(13.5, 4); tent(-58.5, -20);
  for (const [x, z] of [[6.4, 5], [6.6, 6.2], [-55.6, -26]] as const) b.add(boxGeo(V(x - 0.45, 0, z - 0.45), V(x + 0.45, 0.9, z + 0.45)), M.woodL);
  for (let k = 0; k < 6; k++) b.add(railBox(-5, 5).translate(6.2 + (k % 3) * 0.16, -0.1 + Math.floor(k / 3) * 0.15, -8), M.steel);     // a stack of spare rails
  const sgn = (key: string, text: string, x: number, z: number, bg: string, fg: string, yaw: number) => {
    const m = lam("sign" + key, () => ({ map: signTex(key, text, 1024, 256, bg, fg) })), mm = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
    b.add(boxGeo(V(-2.0, 2.3, -0.06), V(2.0, 3.3, 0.06)), m, mm); for (const dx of [-1.7, 1.7]) b.add(boxGeo(V(dx - 0.07, 0, -0.07), V(dx + 0.07, 2.3, 0.07)), M.wood, mm);
  };
  sgn("ours", "CANYON RAIL CO.", 7.2, -3.5, "#f3ead2", "#7a2f2a", -Math.PI / 2 + 0.25); sgn("rival", "SILVER SMOOTH LINE", -56.5, 2, "#1f3f66", "#f3ead2", Math.PI / 2 - 0.25);
  b.build(root);

  // ---- our gap: four rail lengths that slide apart / together
  const gapRails: THREE.Mesh[] = [];
  for (const x of [TX - RH, TX + RH]) for (const s of [-1, 1]) { const m = new THREE.Mesh(s < 0 ? railBox(-SEG + 0.02, 0) : railBox(0, SEG - 0.02), M.steel); m.position.x = x; m.castShadow = true; m.receiveShadow = true; m.userData.s = s; root.add(m); gapRails.push(m); }
  const setGap = (w: number) => { for (const m of gapRails) m.position.z = (m.userData.s * w) / 2; };
  // ---- the rival's stretch that buckles: short rail pieces and ties that follow a growing wave
  const sn: { m: THREE.Object3D; z: number; dx: number }[] = [];
  for (let z = -30; z < 30; z += 1) { for (const dx of [-RH, RH]) { const m = new THREE.Mesh(boxGeo(V(-RW / 2, RY0, -0.52), V(RW / 2, RY1, 0.52)), M.steel); m.castShadow = true; root.add(m); sn.push({ m, z: z + 0.5, dx }); } }
  for (let z = -29.9; z < 30; z += 0.7) { const m = new THREE.Mesh(boxGeo(V(-1.15, 0.04, -0.12), V(1.15, 0.12, 0.12)), M.tie); m.receiveShadow = true; root.add(m); sn.push({ m, z, dx: 0 }); }
  const setSnake = (a: number) => { for (const p of sn) { const e = Math.exp(-((p.z / 13) ** 2)), k = (2 * Math.PI) / 15, x = a * e * Math.sin(k * p.z), d = a * e * (k * Math.cos(k * p.z) - ((2 * p.z) / 169) * Math.sin(k * p.z)), th = Math.atan(d);
    p.m.position.set(RX + x + p.dx * Math.cos(th), 0, p.z - p.dx * Math.sin(th)); p.m.rotation.y = th; } };
  setGap(0.06); setSnake(0);

  // ---- trains: a small steam engine and two coaches, nose toward -z, wheels on the rail tops (group origin at rail top, track centre)
  const train = (body: THREE.Material, trim: THREE.Material, coach: THREE.Material) => {
    const g = new THREE.Group(), t = new Batch();
    const wheels = (z: number, r: number) => { for (const x of [-RH, RH]) { t.add(new THREE.CylinderGeometry(r, r, 0.14, 18).rotateZ(Math.PI / 2).translate(x, r, z), M.black); t.add(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.16, 12).rotateZ(Math.PI / 2).translate(x, r, z), trim); } };
    t.add(boxGeo(V(-1.0, 0.55, -3.4), V(1.0, 0.95, 3.4)), M.black);
    t.add(new THREE.CylinderGeometry(0.85, 0.85, 4.2, 20).rotateX(Math.PI / 2).translate(0, 1.8, -1.2), body); t.add(new THREE.CylinderGeometry(0.88, 0.88, 0.16, 20).rotateX(Math.PI / 2).translate(0, 1.8, -3.25), trim);
    for (const z of [-2.0, -0.4]) t.add(new THREE.CylinderGeometry(0.87, 0.87, 0.12, 20).rotateX(Math.PI / 2).translate(0, 1.8, z), trim);
    t.add(new THREE.CylinderGeometry(0.3, 0.22, 1.2, 14).translate(0, 3.1, -2.5), M.black); t.add(new THREE.CylinderGeometry(0.42, 0.3, 0.3, 14).translate(0, 3.8, -2.5), M.black);
    t.add(new THREE.SphereGeometry(0.34, 12, 8).translate(0, 2.75, -0.9), trim);
    t.add(boxGeo(V(-1.05, 0.95, 0.9), V(1.05, 3.1, 3.3)), body); t.add(boxGeo(V(-1.2, 3.1, 0.7), V(1.2, 3.25, 3.5)), M.black); for (const x of [-1.06, 1.06]) t.add(boxGeo(V(x - 0.02, 1.9, 1.4), V(x + 0.02, 2.8, 2.8)), M.cream);
    { const sh = new THREE.Shape(); sh.moveTo(-1.0, 0); sh.lineTo(1.0, 0); sh.lineTo(0, 0.9); sh.closePath(); t.add(new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.9, -4.3).scale(1, 1, 1), M.red); }
    t.add(new THREE.SphereGeometry(0.2, 10, 8).translate(0, 2.2, -3.35), M.gold);
    wheels(-2.6, 0.42); wheels(-1.4, 0.42); wheels(0.6, 0.72); wheels(2.3, 0.72);
    for (const [y, z, r] of [[4.6, -2.2, 0.5], [5.4, -1.3, 0.75], [6.4, 0, 1.0], [7.6, 1.8, 1.25]] as const) t.add(new THREE.SphereGeometry(r, 10, 8).translate(0, y, z), M.smoke);
    for (const z0 of [4.2, 12.2]) { t.add(boxGeo(V(-1.05, 0.6, z0), V(1.05, 3.0, z0 + 7.2)), coach); t.add(boxGeo(V(-1.15, 3.0, z0 - 0.1), V(1.15, 3.2, z0 + 7.3)), M.black); t.add(boxGeo(V(-0.3, 0.7, z0 - 0.8), V(0.3, 0.9, z0)), M.black);
      for (let k = 0; k < 5; k++) for (const x of [-1.06, 1.06]) t.add(boxGeo(V(x - 0.02, 1.7, z0 + 0.6 + k * 1.3), V(x + 0.02, 2.6, z0 + 1.4 + k * 1.3)), M.cream);
      wheels(z0 + 1.2, 0.42); wheels(z0 + 6.0, 0.42); }
    t.build(g); g.visible = false; root.add(g); return g;
  };
  const trains = [train(M.red, M.gold, M.woodL), train(M.blue, M.steel, M.cream)];

  // ---- small props for the close-ups
  const props: Record<string, THREE.Object3D> = {};
  { const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.014, 28).rotateX(Math.PI / 2), M.gold); coin.castShadow = true; props.coin = coin;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), lam("card", () => ({ side: THREE.DoubleSide, map: ctex("card", 200, 280, (g) => { g.fillStyle = "#fbf8ee"; g.fillRect(0, 0, 200, 280); g.strokeStyle = "#231f2a"; g.lineWidth = 6; g.strokeRect(3, 3, 194, 274); g.fillStyle = "#c0352c"; g.font = `bold 60px ${FONT}`; g.textAlign = "center"; g.fillText("A", 40, 70);
      g.beginPath(); g.moveTo(100, 80); g.lineTo(150, 150); g.lineTo(100, 220); g.lineTo(50, 150); g.closePath(); g.fill(); }) }))); card.castShadow = true; props.card = card;
    for (const k in props) { props[k].visible = false; root.add(props[k]); } }

  // ================================================================ documents shown to the lens
  const docTex: Record<string, [number, number, (g: CanvasRenderingContext2D) => void]> = {
    paper: [1024, 1280, (g) => {
      g.fillStyle = "#f1e8d0"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#231f2a"; g.textAlign = "center";
      g.font = `bold 88px ${FONT}`; g.fillText("CANYON GAZETTE", 512, 130); g.fillRect(60, 160, 904, 8); g.fillRect(60, 176, 904, 3);
      g.font = `bold 124px ${FONT}`; g.fillText("ALL ABOARD", 512, 350); g.font = `bold 170px ${FONT}`; g.fillText("THE", 512, 520); g.fillText("RATTLER", 512, 690);
      g.fillRect(60, 740, 904, 4);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 16; r++) { g.fillStyle = "#6a6470"; g.fillRect(70 + c * 304, 790 + r * 27, 270 - ((r * 5 + c * 2) % 5) * 22, 9); }
    }],
    thermo: [640, 1280, (g) => {
      g.fillStyle = "#f6f2e6"; g.fillRect(0, 0, 640, 1280); g.strokeStyle = "#231f2a"; g.lineWidth = 10; g.strokeRect(20, 20, 600, 1240);
      g.fillStyle = "#e9e4d6"; g.beginPath(); g.roundRect(270, 120, 100, 880, 50); g.fill(); g.stroke(); g.beginPath(); g.arc(320, 1060, 110, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#d8362c"; g.beginPath(); g.arc(320, 1060, 84, 0, 7); g.fill(); g.fillRect(292, 260, 56, 760); g.beginPath(); g.arc(320, 260, 28, 0, 7); g.fill();
      g.fillStyle = "#231f2a"; g.font = `bold 44px ${SANS}`; g.textAlign = "left"; for (let k = 0; k < 9; k++) { g.fillRect(390, 200 + k * 90, k % 2 ? 40 : 70, 8); if (k % 2 === 0) g.fillText(String(110 - k * 10) + "°", 475, 216 + k * 90); }
    }],
  };
  const docs: Record<string, THREE.Mesh> = {};
  const doc = (key: string) => {
    if (!docs[key]) {
      const [tw, th, draw] = docTex[key];
      const m = new THREE.Mesh(new THREE.PlaneGeometry(tw / th, 1), lam("doc" + key, () => ({ map: ctex("doc" + key, tw, th, (g) => draw(g)), side: THREE.DoubleSide })));
      m.castShadow = true; m.receiveShadow = true; m.visible = false; root.add(m); docs[key] = m;
    }
    return docs[key];
  };
  return { root, trains, props, setGap, setSnake, doc, docs };
};
