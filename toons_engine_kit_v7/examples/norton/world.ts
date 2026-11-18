// The three places of "Emperor of the United States": a San Francisco street (origin), a wharf on the bay (WX)
// and the newspaper office (OX). Built from the engine's materials, painted textures and house builder.
import * as THREE from "three";
import { Batch, lam, boxGeo, V, house, quad } from "@eng/build";
import { cobbleHD, stoneHD, planksHD, ctex, rep, water } from "@eng/paint";
import { twoTone } from "@eng/shade";

export const SW = 4.6, KERB = 7.6, Z0 = 46, Z1 = -150;
export const WX = 600, OX = -600;                       // wharf and office live far from the street
const up = (x0: number, x1: number, z0: number, z1: number, y: number, tile = 4) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
const beam = (a: THREE.Vector3, b: THREE.Vector3, th: number) => {
  const g = new THREE.BoxGeometry(th, a.distanceTo(b), th);
  return g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1)));
};
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const FONT = "Georgia, 'DejaVu Serif', 'Liberation Serif', serif";
/** painted signboard: text on a framed board */
const signTex = (key: string, text: string, w: number, h: number, bg: string, fg: string, sub?: string) => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = h * 0.045; g.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  let fs = h * (sub ? 0.4 : 0.5); g.font = `bold ${fs}px ${FONT}`;
  while (g.measureText(text).width > w * 0.84) { fs *= 0.95; g.font = `bold ${fs}px ${FONT}`; }
  g.fillText(text, w / 2, h * (sub ? 0.42 : 0.53));
  if (sub) { g.font = `italic ${h * 0.2}px ${FONT}`; g.fillText(sub, w / 2, h * 0.76); }
});

export type World = {
  root: THREE.Group; tram: THREE.Group; bridge: THREE.Group; fleet: THREE.Group[]; relics: THREE.Group;
  doc: (key: string) => THREE.Mesh; docs: Record<string, THREE.Mesh>;
};

export const buildWorld = (root: THREE.Group): World => {
  const b = new Batch();
  const M = {
    cobble: lam("cobbleHD", () => ({ map: cobbleHD() })),
    cope: lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") })),
    stone: lam("towerHD", () => ({ map: stoneHD("towerHD") })),
    planks: lam("planksHD", () => ({ map: planksHD() })),
    wood: lam("woodDark", () => ({ color: "#7a5236" })),
    woodL: lam("woodLight", () => ({ color: "#b98a58" })),
    hull: lam("hull", () => ({ color: "#5a3d2c" })),
    hull2: lam("hull2", () => ({ color: "#2f3340" })),
    sail: lam("sail", () => ({ color: "#f1e8d2", side: THREE.DoubleSide })),
    iron: twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15),
    steel: twoTone(new THREE.MeshPhongMaterial({ color: "#aab2bd", specular: "#c8c8c8", shininess: 40 }), 0.15),
    glass: lam("lampGlass", () => ({ color: "#f3e3a6" })),
    blue: lam("lampBlue", () => ({ color: "#5a86d6" })),
    sack: lam("sack", () => ({ color: "#e9dcbb" })),
    barrel: lam("barrel", () => ({ color: "#9a6a42" })),
    hoop: lam("hoop", () => ({ color: "#4a4d57" })),
    sea: lam("sea", () => ({ map: rep(water(), 90, 90) })),
    hill: lam("hill", () => ({ color: "#8fae6a" })),
    hill2: lam("hill2", () => ({ color: "#b9b58a" })),
    sand: lam("sand", () => ({ color: "#d9c79a" })),
    wall: lam("officeWall", () => ({ color: "#6f8f7c" })),
    wall2: lam("officeWall2", () => ({ color: "#e6dcc4" })),
    pane: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.75, 1.9) }),
    paper: lam("paperWhite", () => ({ color: "#f4efe2" })),
    red: lam("tramRed", () => ({ color: "#b8443a" })),
    cream: lam("tramCream", () => ({ color: "#f0e2bd" })),
    awn: lam("awning", () => ({ map: ctex("awning", 256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4efe2" : "#c0453a"; g.fillRect(i * 32, 0, 32, 64); } }), side: THREE.DoubleSide })),
    green: lam("greens", () => ({ color: "#6aa24a" })), orange: lam("oranges", () => ({ color: "#e2903a" })), redA: lam("apples", () => ({ color: "#c8463c" })),
  };
  const crate = (x: number, z: number, s: number, yaw = 0, y = 0.16) => b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s, s / 2), 1.2), M.planks, new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z));
  const barrel = (x: number, z: number, y = 0.16) => {
    b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14).translate(x, y + 0.45, z), M.barrel);
    for (const h of [0.16, 0.74]) b.add(new THREE.CylinderGeometry(0.315, 0.315, 0.07, 14).translate(x, y + h, z), M.hoop);
  };
  const sack = (x: number, y: number, z: number, yaw = 0, s = 1) => b.add(new THREE.SphereGeometry(0.5, 12, 8), M.sack, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), V(0.95 * s, 0.5 * s, 0.62 * s)));
  const lamp = (x: number, z: number, y = 0.16, glass: THREE.Material = M.glass) => {
    b.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8).translate(x, y + 0.25, z), M.iron);
    b.add(new THREE.CylinderGeometry(0.055, 0.08, 3.1, 8).translate(x, y + 2.05, z), M.iron);
    b.add(boxGeo(V(x - 0.3, y + 3.15, z - 0.035), V(x + 0.3, y + 3.22, z + 0.035)), M.iron);
    b.add(new THREE.CylinderGeometry(0.2, 0.13, 0.5, 4).rotateY(Math.PI / 4).translate(x, y + 3.85, z), glass);
    b.add(new THREE.ConeGeometry(0.3, 0.26, 4).rotateY(Math.PI / 4).translate(x, y + 4.23, z), M.iron);
  };
  const sign = (key: string, text: string, side: -1 | 1, zc: number, len: number, y0: number, bg: string, fg: string, sub?: string) => {
    const m = lam("sign" + key, () => ({ map: signTex(key, text, Math.round(256 * len / 0.8), 256, bg, fg, sub) }));
    const x0 = side < 0 ? -KERB - 0.02 : KERB - 0.16;
    b.add(boxGeo(V(x0, y0, zc - len / 2), V(x0 + 0.18, y0 + 0.8, zc + len / 2)), m);
  };
  /** three-masted ship, bow toward -z; sails set or furled */
  const ship = (bb: Batch, mat: THREE.Material, s = 1, set = false) => {
    const sh = new THREE.Shape();
    sh.moveTo(-2.3, -10); sh.lineTo(2.3, -10); sh.lineTo(2.7, 3); sh.quadraticCurveTo(2.2, 10.5, 0, 13.5); sh.quadraticCurveTo(-2.2, 10.5, -2.7, 3); sh.closePath();
    const S = new THREE.Matrix4().makeScale(s, s, s);
    bb.add(new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -0.8, 0), mat, S);
    bb.add(new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false }).rotateX(-Math.PI / 2).scale(1.04, 1, 1.02).translate(0, 2.6, 0), M.woodL, S);
    bb.add(boxGeo(V(-1.6, 2.85, 4.5), V(1.6, 4.3, 9.4)), M.woodL, S);
    for (const [z, h] of [[-8.5, 15], [-1.5, 18], [6, 14]] as const) {
      bb.add(new THREE.CylinderGeometry(0.13, 0.2, h, 8).translate(0, 2.8 + h / 2, z), M.wood, S);
      for (const [k, w] of [[0.42, 7.2], [0.72, 5.4]] as const) {
        bb.add(new THREE.CylinderGeometry(0.08, 0.08, w, 6).rotateZ(Math.PI / 2).translate(0, 2.8 + h * k, z), M.wood, S);
        if (set) bb.add(new THREE.PlaneGeometry(w * 0.92, h * 0.27).translate(0, 2.8 + h * k - h * 0.145, z - 0.12), M.sail, S);
        else bb.add(new THREE.CylinderGeometry(0.22, 0.22, w * 0.86, 8).rotateZ(Math.PI / 2).translate(0, 2.8 + h * k - 0.26, z), M.sail, S);
      }
    }
    bb.add(beam(V(0, 2.9, -13.2), V(0, 5.6, -19), 0.16), M.wood, S);
  };

  // ================================================================ STREET (San Francisco)
  b.add(up(-260, 260, -158, 120, -0.02), M.cobble);
  b.add(up(-SW, SW, Z1, Z0, 0), M.cobble);
  for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -KERB : SW, 0, Z1), V(s < 0 ? -SW : KERB, 0.16, Z0), 2), M.cope);
  for (const x of [1.25, 2.65]) b.add(boxGeo(V(x - 0.045, 0, Z1), V(x + 0.045, 0.035, Z0)), M.iron);                     // streetcar rails
  const STY = [0, 7, 1, 6, 2, 4, 5, 7, 0, 6], WID = [7.0, 8.0, 6.6], HGT = [8.4, 9.8, 7.0, 9.8, 8.4, 7.0];
  for (const s of [-1, 1]) {
    let z = Z0, k = s < 0 ? 0 : 4;
    while (z > Z1 + 8) {
      const w = WID[k % 3], h = HGT[(k * 2 + (s > 0 ? 1 : 0)) % 6];
      house(b, s * (KERB + 4.0), z - w / 2, s < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8.0, h, STY[k % STY.length], 0.14);
      z -= w; k++;
    }
  }
  sign("bulletin", "EVENING BULLETIN", -1, -7.5, 5.6, 3.2, "#f3ead2", "#2a2430");
  sign("provisions", "PROVISIONS", 1, -18, 4.4, 3.55, "#2f5f4a", "#f3ead2");
  sign("police", "POLICE", 1, -34.5, 3.4, 3.2, "#232c47", "#f3ead2");
  // grocer's stall under a striped awning
  b.add(quad(V(KERB - 0.05, 3.45, -15.4), V(KERB - 0.05, 3.45, -20.6), V(5.5, 2.62, -20.6), V(5.5, 2.62, -15.4), 2, 1), M.awn);
  for (const z of [-15.5, -20.5]) b.add(new THREE.CylinderGeometry(0.045, 0.045, 2.5, 6).translate(5.55, 1.41, z), M.wood);
  b.add(boxGeo(V(5.7, 0.16, -20.2), V(6.6, 1.12, -15.8), 1.5), M.planks);
  for (let i = 0; i < 4; i++) {
    b.add(boxGeo(V(5.78, 1.12, -19.9 + i * 1.05), V(6.5, 1.34, -19.1 + i * 1.05)), M.woodL);
    const fm = [M.redA, M.orange, M.green, M.redA][i];
    for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(0.11, 8, 6).translate(5.95 + (k % 2) * 0.32, 1.44, -19.75 + i * 1.05 + Math.floor(k / 2) * 0.24), fm);
  }
  for (let z = 34; z > Z1 + 10; z -= 17) for (const s of [-1, 1]) lamp(s * (SW + 0.45), z + (s > 0 ? -8 : 0));
  lamp(SW + 0.45, -37.2, 0.16, M.blue);
  crate(-7.0, -13.2, 0.85, 0.2); crate(-6.95, -14.3, 0.7, -0.15); crate(-7.0, -13.3, 0.55, 0.5, 1.01); barrel(-6.9, -12.1);
  barrel(7.0, -24.4); barrel(6.6, -25.1); crate(7.0, -26.3, 0.8, 0.1); crate(-7.0, -27, 0.8, 0.3); barrel(7.0, 3.5); crate(6.95, 4.6, 0.75, -0.2);
  // the street runs down to the bay: quay, water, ships at anchor, hills on the far shore
  b.add(boxGeo(V(-260, -3, -160), V(260, -0.02, -156), 2), M.stone);
  b.add(up(-1200, 1200, -1500, -158, -1.6, 200), M.sea);
  for (const [x, z, r, m] of [[-240, -640, 150, M.hill], [60, -700, 200, M.hill2], [330, -620, 140, M.hill], [-520, -600, 170, M.hill2], [620, -680, 190, M.hill]] as const)
    b.add(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.6, 0.34, 1).translate(x, -1.6, z), m);
  b.build(root);
  for (const [x, z, s, yaw, mat] of [[-22, -205, 1.5, 0.5, M.hull], [26, -250, 1.3, -0.7, M.hull2]] as const) {
    const g = new THREE.Group(), bb = new Batch(); ship(bb, mat, s, false); bb.build(g); g.position.set(x, -1.6, z); g.rotation.y = yaw; root.add(g);
  }

  // streetcar (moves along the rails)
  const tram = new THREE.Group();
  { const bb = new Batch();
    const winTex = ctex("tramWin", 512, 128, (g) => { g.fillStyle = "#b8443a"; g.fillRect(0, 0, 512, 128); for (let i = 0; i < 6; i++) { g.fillStyle = "#28303f"; g.fillRect(18 + i * 82, 22, 64, 62); g.strokeStyle = "#f0e2bd"; g.lineWidth = 6; g.strokeRect(18 + i * 82, 22, 64, 62); } g.fillStyle = "#f0e2bd"; g.fillRect(0, 98, 512, 10); });
    const side = lam("tramSide", () => ({ map: winTex }));
    bb.add(boxGeo(V(-1.05, 0.55, -2.7), V(1.05, 2.75, 2.7)), side);
    bb.add(boxGeo(V(-1.2, 2.75, -3.3), V(1.2, 2.93, 3.3)), M.cream);
    bb.add(boxGeo(V(-1.05, 0.4, -3.3), V(1.05, 0.58, 3.3)), M.wood);
    for (const z of [-3.2, 3.2]) for (const x of [-0.95, 0.95]) bb.add(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6).translate(x, 1.65, z), M.iron);
    for (const z of [-1.7, 1.7]) for (const x of [-0.72, 0.72]) bb.add(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14).rotateZ(Math.PI / 2).translate(x, 0.36, z), M.iron);
    bb.build(tram); tram.position.set(1.95, 0, -60); root.add(tram); }

  // ================================================================ WHARF on the bay
  const w = new Batch(), WM = T(WX, 0, 0);
  w.add(up(-900, 900, -1600, 60, -2.0, 200), M.sea, WM);
  w.add(up(-200, 200, 26, 160, 0, 4), M.cobble, WM);                                    // the quay behind the pier
  w.add(boxGeo(V(-200, -3, 24), V(200, 0, 26.5), 2), M.stone, WM);
  w.add(boxGeo(V(-5.5, -0.3, -46), V(5.5, 0, 26), 4), M.planks, WM);                    // the pier
  for (let z = -45; z <= 24; z += 6) for (const x of [-5.2, 5.2]) w.add(new THREE.CylinderGeometry(0.22, 0.24, 3.6, 8).translate(x, -1.2, z), M.wood, WM);
  for (let z = -45; z <= 20; z += 6) for (const x of [-5.2, 5.2]) w.add(new THREE.CylinderGeometry(0.2, 0.22, 1.1, 8).translate(x, 0.55, z), M.wood, WM);
  house(w, WX - 36, 38, 0, 12, 8, 8.4, 7, 0); house(w, WX + 34, 38, 0, 12, 8, 7.0, 1, 0); house(w, WX, 40, 0, 14, 8, 9.8, 6, 0);
  // rice: sacks piled on the pier, with a stencilled crate
  const PILE: [number, number, number, number][] = [[-2.6, 0.26, -6.0, 0.1], [-1.7, 0.26, -6.2, -0.2], [-0.8, 0.26, -5.9, 0.15], [-2.2, 0.26, -5.2, 0.4], [-1.2, 0.26, -5.1, -0.1], [-2.1, 0.72, -6.0, 0.2], [-1.3, 0.72, -5.9, -0.15], [-1.7, 0.72, -5.3, 0.3], [-1.7, 1.16, -5.8, 0.05],
    [2.4, 0.26, -9.0, 0.3], [3.3, 0.26, -9.2, -0.1], [2.8, 0.26, -8.3, 0.2], [2.9, 0.72, -8.9, 0.1]];
  for (const [x, y, z, yaw] of PILE) w.add(new THREE.SphereGeometry(0.5, 12, 8), M.sack, new THREE.Matrix4().compose(V(WX + x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), V(0.95, 0.5, 0.62)));
  const riceM = lam("riceSign", () => ({ map: signTex("rice", "RICE", 256, 256, "#c9a06a", "#3a2a1c") }));
  w.add(boxGeo(V(-0.5, 0, -0.5), V(0.5, 1, 0.5)), riceM, new THREE.Matrix4().makeRotationY(0.18).setPosition(WX - 1.4, 0, -4.3));
  w.add(boxGeo(V(-0.4, 0, -0.4), V(0.4, 0.8, 0.4), 1.2), M.planks, new THREE.Matrix4().makeRotationY(-0.2).setPosition(WX + 3.6, 0, -4.2));
  for (const [x, z] of [[4.2, -12.5], [-4.1, -1.5], [-4.3, -14]] as const) { w.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14).translate(WX + x, 0.45, z), M.barrel); for (const h of [0.16, 0.74]) w.add(new THREE.CylinderGeometry(0.315, 0.315, 0.07, 14).translate(WX + x, h, z), M.hoop); }
  // the bay: island and the far shore
  w.add(new THREE.SphereGeometry(120, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.5, 0.42, 1).translate(WX - 60, -2, -520), M.hill);
  for (const [x, z, r, m] of [[-520, -1050, 240, M.hill2], [-80, -1150, 300, M.hill], [420, -1050, 260, M.hill2], [900, -1000, 220, M.hill], [-950, -1000, 240, M.hill]] as const)
    w.add(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.7, 0.3, 1).translate(WX + x, -2, z), m);
  w.build(root);
  { const g = new THREE.Group(), bb = new Batch(); ship(bb, M.hull, 1.25, false); bb.build(g); g.position.set(WX - 10.6, -2.0, -14); root.add(g); }   // docked alongside
  const fleet: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(), bb = new Batch(); ship(bb, i % 2 ? M.hull2 : M.hull, 1.2, true); bb.build(g); g.position.set(WX + 30 + i * 26, -2.0, -700); g.rotation.y = Math.PI + 0.25; g.visible = false; root.add(g); fleet.push(g); }
  // the bridge he ordered (hidden until the last shot): four towers, two cables, a long deck out to the island
  const bridge = new THREE.Group();
  { const bb = new Batch(), L = 520, N = 4, TH = 62, DY = 17, span = L / (N + 1);
    bb.add(boxGeo(V(-4.5, DY - 1.4, -L - 30), V(4.5, DY, 40), 6), M.steel);
    for (let i = 1; i <= N; i++) {
      const z = -i * span;
      for (const x of [-4.2, 4.2]) bb.add(boxGeo(V(x - 1.0, -4, z - 1.4), V(x + 1.0, TH, z + 1.4)), M.steel);
      for (const y of [DY + 9, DY + 22, TH - 3]) bb.add(boxGeo(V(-4.2, y, z - 0.9), V(4.2, y + 1.6, z + 0.9)), M.steel);
    }
    for (const x of [-4.2, 4.2]) for (let i = 0; i <= N; i++) {
      const za = -i * span, zb = -(i + 1) * span, ya = i === 0 ? DY + 1 : TH, yb = i === N ? DY + 1 : TH, K = 14;
      let prev = V(x, ya, za);
      for (let k = 1; k <= K; k++) {
        const u = k / K, sag = (i === 0 || i === N ? 10 : 34) * 4 * u * (1 - u), cur = V(x, ya + (yb - ya) * u - sag, za + (zb - za) * u);
        bb.add(beam(prev, cur, 0.5), M.steel);
        if (k < K && k % 2 === 0) bb.add(beam(cur, V(x, DY, cur.z), 0.14), M.steel);
        prev = cur;
      }
    }
    bb.build(bridge); bridge.position.set(WX + 46, -2, 22); bridge.rotation.y = 0.2; bridge.visible = false; root.add(bridge); }

  // ================================================================ NEWSPAPER OFFICE (three walls, no ceiling: the camera stays inside)
  const o = new Batch(), OM = T(OX, 0, 0);
  o.add(up(-7, 7, -5, 9, 0, 4), M.planks, OM);
  o.add(boxGeo(V(-7, 0, -5.3), V(7, 5.2, -5)), M.wall, OM);                                // back wall
  o.add(boxGeo(V(-7, 0, -5.02), V(7, 1.1, -4.9), 2), M.wood, OM);                          // wainscot
  o.add(boxGeo(V(7, 0, -5), V(7.3, 5.2, 9)), M.wall2, OM); o.add(boxGeo(V(-7.3, 0, -5), V(-7, 5.2, 9)), M.wall2, OM);
  for (const x of [-3.9, 3.3]) {                                                           // tall windows: bright sky panes with glazing bars
    o.add(new THREE.PlaneGeometry(1.7, 2.5).translate(x, 2.75, -4.985), M.pane, OM);
    o.add(boxGeo(V(x - 1.0, 1.38, -5.0), V(x + 1.0, 1.5, -4.84)), M.cope, OM); o.add(boxGeo(V(x - 0.95, 4.0, -5.0), V(x + 0.95, 4.12, -4.9)), M.cope, OM);
    for (const dx of [-0.9, 0, 0.9]) o.add(boxGeo(V(x + dx - 0.045, 1.5, -5.0), V(x + dx + 0.045, 4.0, -4.93)), M.cope, OM);
    o.add(boxGeo(V(x - 0.9, 2.7, -5.0), V(x + 0.9, 2.78, -4.93)), M.cope, OM);
  }
  const banner = lam("signOffice", () => ({ map: signTex("office", "EVENING BULLETIN", 1536, 256, "#f3ead2", "#2a2430", "San Francisco — est. 1855") }));
  o.add(boxGeo(V(-2.6, 3.9, -4.99), V(2.2, 4.7, -4.9)), banner, OM);
  // editor's desk, with paper stacks; printing press; shelves of paper
  o.add(boxGeo(V(0.9, 0, -1.9), V(3.5, 0.95, -0.6), 1.6), M.planks, OM); o.add(boxGeo(V(0.8, 0.95, -2.0), V(3.6, 1.03, -0.5)), M.wood, OM);
  for (const [x, z, n] of [[1.3, -1.5, 5], [3.1, -1.0, 3], [2.7, -1.7, 7]] as const) for (let k = 0; k < n; k++) o.add(boxGeo(V(x - 0.24, 1.03 + k * 0.035, z - 0.17), V(x + 0.24, 1.06 + k * 0.035, z + 0.17)), M.paper, OM);
  o.add(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 8).translate(2.1, 1.09, -0.85), M.iron, OM);
  o.add(boxGeo(V(-4.6, 0, -4.2), V(-2.2, 1.0, -2.6), 1.6), M.iron, OM); o.add(boxGeo(V(-4.3, 1.0, -4.0), V(-2.5, 1.25, -2.8)), M.wood, OM);     // the press
  for (const x of [-4.4, -2.4]) o.add(boxGeo(V(x - 0.1, 1.0, -3.5), V(x + 0.1, 2.9, -3.3)), M.iron, OM);
  o.add(boxGeo(V(-4.5, 2.7, -3.55), V(-2.3, 2.95, -3.25)), M.iron, OM); o.add(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 8).translate(-3.4, 2.0, -3.4), M.steel, OM);
  o.add(new THREE.TorusGeometry(0.62, 0.06, 6, 20).rotateY(Math.PI / 2).translate(-2.05, 1.7, -3.4), M.iron, OM);
  for (let k = 0; k < 4; k++) { o.add(boxGeo(V(5.0, 0.9 + k * 0.85, -4.6), V(6.9, 0.96 + k * 0.85, -1.4)), M.wood, OM); for (let j = 0; j < 4; j++) o.add(boxGeo(V(5.2, 0.96 + k * 0.85, -4.4 + j * 0.76), V(6.7, 1.1 + k * 0.85 + ((j + k) % 3) * 0.12, -3.9 + j * 0.76)), M.paper, OM); }
  o.add(boxGeo(V(4.9, 0, -4.7), V(5.0, 4.3, -1.3)), M.wood, OM);
  o.add(boxGeo(V(-6.98, 0, 3.2), V(-6.9, 2.6, 4.7)), M.wood, OM);                           // the door he came in by
  o.build(root);

  // ================================================================ relics for the farewell (hat and sword on a kerb crate): placed by the story
  const relics = new THREE.Group(); relics.visible = false; root.add(relics);

  // ================================================================ documents shown to the lens (newspaper, banknote, census page)
  const docTex: Record<string, [number, number, (g: CanvasRenderingContext2D) => void]> = {
    paper1: [1024, 1280, (g) => {
      g.fillStyle = "#f1e8d0"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#231f2a"; g.textAlign = "center";
      g.font = `bold 92px ${FONT}`; g.fillText("EVENING BULLETIN", 512, 130); g.fillRect(60, 160, 904, 8); g.fillRect(60, 176, 904, 3);
      g.font = `italic 34px ${FONT}`; g.fillText("San Francisco, September 17, 1859", 512, 226);
      g.font = `bold 96px ${FONT}`; g.fillText("HAVE WE AN", 512, 380); g.fillText("EMPEROR", 512, 490); g.fillText("AMONG US?", 512, 600);
      g.fillRect(60, 650, 904, 4);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 20; r++) { g.fillStyle = "#6a6470"; g.fillRect(70 + c * 304, 700 + r * 27, 270 - ((r * 7 + c * 3) % 5) * 22, 9); }
    }],
    paper2: [1024, 1280, (g) => {
      g.fillStyle = "#f1e8d0"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#231f2a"; g.textAlign = "center";
      g.font = `bold 92px ${FONT}`; g.fillText("EVENING BULLETIN", 512, 130); g.fillRect(60, 160, 904, 8); g.fillRect(60, 176, 904, 3);
      g.font = `bold 120px ${FONT}`; g.fillText("EMPEROR", 512, 380); g.fillText("ABOLISHES", 512, 510); g.fillText("CONGRESS", 512, 640);
      g.fillRect(60, 690, 904, 4);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 18; r++) { g.fillStyle = "#6a6470"; g.fillRect(70 + c * 304, 740 + r * 27, 270 - ((r * 5 + c * 2) % 5) * 22, 9); }
    }],
    note: [1280, 640, (g) => {
      g.fillStyle = "#e9e2c4"; g.fillRect(0, 0, 1280, 640); g.strokeStyle = "#2f5a3a"; g.lineWidth = 14; g.strokeRect(26, 26, 1228, 588); g.lineWidth = 4; g.strokeRect(50, 50, 1180, 540);
      g.fillStyle = "#2f5a3a"; g.textAlign = "center"; g.font = `bold 70px ${FONT}`; g.fillText("IMPERIAL TREASURY", 640, 150);
      g.font = `bold 150px ${FONT}`; g.fillText("50 CENTS", 640, 330);
      g.font = `italic 46px ${FONT}`; g.fillStyle = "#231f2a"; g.fillText("payable by Norton I, Emperor of the United States", 640, 430);
      g.font = `italic 64px ${FONT}`; g.fillStyle = "#1a2a5a"; g.fillText("Norton I.", 930, 540);
      for (const x of [150, 1130]) { g.fillStyle = "#2f5a3a"; g.beginPath(); g.arc(x, 300, 70, 0, 7); g.fill(); g.fillStyle = "#e9e2c4"; g.font = `bold 60px ${FONT}`; g.fillText("50", x, 322); }
    }],
    census: [1024, 1280, (g) => {
      g.fillStyle = "#efe6cf"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#231f2a"; g.textAlign = "center";
      g.font = `bold 50px ${FONT}`; g.fillText("CENSUS OF THE UNITED STATES", 512, 110); g.font = `italic 40px ${FONT}`; g.fillText("San Francisco, 1870", 512, 170);
      g.strokeStyle = "#231f2a"; g.lineWidth = 3;
      for (let r = 0; r < 9; r++) { g.beginPath(); g.moveTo(60, 250 + r * 110); g.lineTo(964, 250 + r * 110); g.stroke(); }
      for (const x of [60, 470, 620, 964]) { g.beginPath(); g.moveTo(x, 250); g.lineTo(x, 1130); g.stroke(); }
      g.textAlign = "left"; g.font = `bold 34px ${FONT}`; g.fillText("Name", 80, 320); g.fillText("Age", 490, 320); g.fillText("Occupation", 640, 320);
      const rows = [["Brown, Thomas", "34", "Carpenter"], ["Lee, Mary", "29", "Seamstress"], ["Norton, Joshua", "50", "Emperor"], ["Walsh, Peter", "41", "Baker"], ["Diaz, Ana", "38", "Teacher"]];
      rows.forEach((rw, i) => { const y = 430 + i * 110, hot = i === 2; g.font = `${hot ? "bold " : "italic "}${hot ? 46 : 40}px ${FONT}`; g.fillStyle = hot ? "#b3262c" : "#3a3440"; g.fillText(rw[0], 80, y); g.fillText(rw[1], 490, y); g.fillText(rw[2], 640, y); });
      g.strokeStyle = "#b3262c"; g.lineWidth = 7; g.beginPath(); g.ellipse(790, 635, 170, 52, -0.05, 0, 7); g.stroke();
    }],
    decree: [1024, 1280, (g) => {
      g.fillStyle = "#f1e8d0"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#231f2a"; g.textAlign = "center";
      g.font = `bold 110px ${FONT}`; g.fillText("PROCLAMATION", 512, 180); g.fillRect(120, 220, 784, 6);
      g.font = `italic 58px ${FONT}`; ["We order a bridge", "to be built across", "the bay to Oakland."].forEach((t, i) => g.fillText(t, 512, 400 + i * 100));
      g.font = `italic 80px ${FONT}`; g.fillStyle = "#1a2a5a"; g.fillText("Norton I.", 680, 900);
      g.fillStyle = "#b3262c"; g.beginPath(); g.arc(250, 960, 90, 0, 7); g.fill();
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
  void crate; void sack; void M.sand;
  return { root, tram, bridge, fleet, relics, doc, docs };
};
