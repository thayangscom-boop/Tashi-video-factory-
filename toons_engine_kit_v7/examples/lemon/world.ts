// The four places of "The Lemon Juice Robber" (Pittsburgh, 1995): a street with two banks (origin), a bank hall (BX),
// Wheeler's flat (AX) and a university office (LX). Built from the engine's materials, painted textures and house builder.
import * as THREE from "three";
import { Batch, lam, boxGeo, V, house, quad } from "@eng/build";
import { stoneHD, planksHD, ctex } from "@eng/paint";
import { twoTone } from "@eng/shade";

export const SW = 4.6, KERB = 7.6, Z0 = 46, Z1 = -150;
export const BX = 600, AX = -600, LX = 1200;
const up = (x0: number, x1: number, z0: number, z1: number, y: number, tile = 4) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const FONT = "Georgia, 'DejaVu Serif', 'Liberation Serif', serif", SANS = "'DejaVu Sans', 'Liberation Sans', Arial, sans-serif";
const signTex = (key: string, text: string, w: number, h: number, bg: string, fg: string, sub?: string, font = FONT) => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = h * 0.045; g.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  let fs = h * (sub ? 0.4 : 0.5); g.font = `bold ${fs}px ${font}`;
  while (g.measureText(text).width > w * 0.84) { fs *= 0.95; g.font = `bold ${fs}px ${font}`; }
  g.fillText(text, w / 2, h * (sub ? 0.42 : 0.53));
  if (sub) { g.font = `italic ${h * 0.2}px ${font}`; g.fillText(sub, w / 2, h * 0.76); }
});
/** soft, low-contrast surface (no fine pattern, so it stays calm when the camera moves) */
const calm = (key: string, base: string, spots: string[], n = 260) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < n; i++) { g.globalAlpha = 0.05 + 0.06 * r(); g.fillStyle = spots[i % spots.length]; const x = r() * 512, y = r() * 512, s = 30 + r() * 70; for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { g.beginPath(); g.ellipse(x + dx, y + dy, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); g.fill(); } }
  g.globalAlpha = 1;
});
/** a cartoon face for the documents: round head, heavy brows, big grin, optional juice drips */
const mug = (g: CanvasRenderingContext2D, cx: number, cy: number, R: number, o: { skin?: string; ink?: string; juice?: boolean; grin?: boolean } = {}) => {
  const ink = o.ink ?? "#1b1410";
  g.fillStyle = "#6b7a3a"; g.beginPath(); g.ellipse(cx, cy + R * 1.95, R * 1.25, R * 1.1, 0, 0, 7); g.fill(); g.lineWidth = R * 0.09; g.strokeStyle = ink; g.stroke();
  g.fillStyle = o.skin ?? "#f6e3c8"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.stroke();
  g.lineWidth = R * 0.07; g.beginPath(); g.moveTo(cx - R * 0.3, cy + R * 0.18); g.quadraticCurveTo(cx, cy + R * 0.05, cx + R * 0.3, cy + R * 0.18); g.stroke(); g.lineWidth = R * 0.09;
  g.fillStyle = ink; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * R * 0.36, cy - R * 0.08, R * 0.08, R * 0.12, 0, 0, 7); g.fill(); }
  g.lineWidth = R * 0.1; g.lineCap = "round"; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * R * 0.2, cy - R * 0.36); g.lineTo(cx + s * R * 0.55, cy - R * 0.42); g.stroke(); }
  if (o.grin !== false) { g.fillStyle = "#fffaf0"; g.beginPath(); g.moveTo(cx - R * 0.5, cy + R * 0.3); g.quadraticCurveTo(cx, cy + R * 0.95, cx + R * 0.5, cy + R * 0.3); g.closePath(); g.fill(); g.lineWidth = R * 0.07; g.stroke(); }
  if (o.juice) for (const [dx, dy] of [[-0.55, -0.3], [0.5, -0.5], [0.66, 0.2], [-0.7, 0.3], [0.1, -0.72]]) { g.fillStyle = "#f4e25a"; g.beginPath(); g.ellipse(cx + dx * R, cy + dy * R, R * 0.07, R * 0.13, 0, 0, 7); g.fill(); g.lineWidth = R * 0.025; g.stroke(); }
};

export type World = { root: THREE.Group; car: THREE.Group; doc: (key: string) => THREE.Mesh; docs: Record<string, THREE.Mesh> };

export const buildWorld = (root: THREE.Group): World => {
  const b = new Batch();
  const M = {
    road: lam("asphalt", () => ({ map: calm("asphalt", "#5b5e68", ["#4e515b", "#666a75", "#565963"]) })),
    walk: lam("sidewalk", () => ({ map: calm("sidewalk", "#c9c5bb", ["#bcb8ae", "#d4d0c7", "#c2beb3"]) })),
    cope: lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") })),
    planks: lam("planksHD", () => ({ map: planksHD() })),
    tile: lam("bankFloor", () => ({ map: ctex("bankFloor", 512, 512, (g) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#d9d2c2" : "#b9c1c4"; g.fillRect(i * 256, j * 256, 256, 256); } }) })),
    lino: lam("lino", () => ({ map: calm("lino", "#c9b48c", ["#bfa97f", "#d3bf98"]) })),
    carpet: lam("carpet", () => ({ map: calm("carpet", "#7d8a9a", ["#72808f", "#8794a3"]) })),
    wood: lam("woodDark", () => ({ color: "#7a5236" })), woodL: lam("woodLight", () => ({ color: "#b98a58" })),
    iron: twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15),
    steel: twoTone(new THREE.MeshPhongMaterial({ color: "#aab2bd", specular: "#c8c8c8", shininess: 40 }), 0.15),
    lampG: lam("lampGlass", () => ({ color: "#f3efd6" })),
    white: lam("white", () => ({ color: "#f1efe8" })), cream: lam("cream", () => ({ color: "#ece2c6" })), paper: lam("paperWhite", () => ({ color: "#f4efe2" })),
    marble: lam("marble", () => ({ map: calm("marble", "#e4dfd4", ["#d3cec2", "#efebe2", "#c9c4b8"], 120) })),
    bankWall: lam("bankWall", () => ({ color: "#3f6a5d" })), bankWall2: lam("bankWall2", () => ({ color: "#e8dfc8" })),
    aptWall: lam("aptWall", () => ({ color: "#d9b77e" })), aptWall2: lam("aptWall2", () => ({ color: "#c98f62" })),
    labWall: lam("labWall", () => ({ color: "#b7c7d3" })), labWall2: lam("labWall2", () => ({ color: "#e9e4d6" })),
    pane: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.75, 1.9) }),
    red: lam("red", () => ({ color: "#c0453a" })), blue: lam("blue", () => ({ color: "#3d5fa8" })), navy: lam("navy", () => ({ color: "#27324d" })), teal: lam("teal", () => ({ color: "#3f8f8a" })),
    green: lam("leaf", () => ({ color: "#4f8f4a" })), pot: lam("pot", () => ({ color: "#b0603c" })), gold: lam("gold", () => ({ color: "#e0b84a" })), black: lam("black", () => ({ color: "#26262c" })),
    lemon: lam("lemon", () => ({ color: "#f3d53c" })), lemonIn: lam("lemonIn", () => ({ map: ctex("lemonIn", 256, 256, (g) => { g.fillStyle = "#f3d53c"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#fbf3c4"; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); g.fillStyle = "#f7e36a"; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 98, k * Math.PI / 4 + 0.07, (k + 1) * Math.PI / 4 - 0.07); g.closePath(); g.fill(); } }) })),
    juice: lam("juice", () => ({ color: "#f6e88a" })), glass: lam("glassBowl", () => ({ color: "#cfe3ea" })),
    sofa: lam("sofa", () => ({ color: "#8a4f5e" })), fridge: lam("fridge", () => ({ color: "#e7e9e6" })),
    hill: lam("hill", () => ({ color: "#8fae6a" })), tower: lam("tower", () => ({ color: "#9aa7b8" })), tower2: lam("tower2", () => ({ color: "#b9a892" })),
    yellow: lam("laneYellow", () => ({ color: "#e3c04a" })),
  };
  const carInto = (bb: Batch, body: THREE.Material) => {       // boxy 1990s saloon, nose toward -z, wheels on y = 0
    bb.add(boxGeo(V(-0.85, 0.32, -2.15), V(0.85, 0.9, 2.15)), body); bb.add(boxGeo(V(-0.76, 0.9, -0.75), V(0.76, 1.42, 1.25)), M.navy);
    bb.add(boxGeo(V(-0.8, 1.42, -0.8), V(0.8, 1.5, 1.3)), body);
    bb.add(boxGeo(V(-0.9, 0.3, -2.25), V(0.9, 0.5, -2.1)), M.steel); bb.add(boxGeo(V(-0.9, 0.3, 2.1), V(0.9, 0.5, 2.25)), M.steel);
    for (const x of [-0.6, 0.6]) { bb.add(boxGeo(V(x - 0.18, 0.62, -2.17), V(x + 0.18, 0.8, -2.14)), M.lampG); bb.add(boxGeo(V(x - 0.18, 0.62, 2.14), V(x + 0.18, 0.8, 2.17)), M.red); }
    for (const x of [-0.86, 0.86]) for (const z of [-1.35, 1.35]) bb.add(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16).rotateZ(Math.PI / 2).translate(x, 0.34, z), M.black);
  };
  const parked = (x: number, z: number, m: THREE.Material, yaw = 0) => { const bb = new Batch(), g = new THREE.Group(); carInto(bb, m); bb.build(g); g.position.set(x, 0, z); g.rotation.y = yaw; root.add(g); };
  const lamp = (x: number, z: number, s: number) => {
    b.add(new THREE.CylinderGeometry(0.07, 0.1, 5.2, 8).translate(x, 2.76, z), M.iron);
    b.add(boxGeo(V(Math.min(x, x - s * 1.5), 5.25, z - 0.05), V(Math.max(x, x - s * 1.5), 5.35, z + 0.05)), M.iron);
    b.add(boxGeo(V(x - s * 1.5 - 0.3, 5.12, z - 0.14), V(x - s * 1.5 + 0.3, 5.26, z + 0.14)), M.lampG);
  };
  const sign = (key: string, text: string, side: -1 | 1, zc: number, len: number, y0: number, bg: string, fg: string, hgt = 0.9) => {
    const m = lam("sign" + key, () => ({ map: signTex(key, text, Math.round(256 * len / hgt), 256, bg, fg, undefined, SANS) }));
    const x0 = side < 0 ? -KERB - 0.02 : KERB - 0.2;
    b.add(boxGeo(V(x0, y0, zc - len / 2), V(x0 + 0.22, y0 + hgt, zc + len / 2)), m);
  };
  /** bank front on the kerb line: steps, two columns, a lintel and glass doors */
  const bankFront = (side: -1 | 1, zc: number) => {
    const x = side * KERB, xi = side * (KERB - 1.0);
    for (const dz of [-1.5, 1.5]) b.add(new THREE.CylinderGeometry(0.24, 0.27, 3.2, 14).translate(xi, 1.76, zc + dz), M.marble);
    b.add(boxGeo(V(Math.min(x, xi) - 0.35, 3.36, zc - 2.1), V(Math.max(x, xi) + 0.35, 3.8, zc + 2.1)), M.marble);
    b.add(boxGeo(V(Math.min(x, xi) - 0.3, 0.16, zc - 2.0), V(Math.max(x, xi) + 0.3, 0.28, zc + 2.0)), M.marble);
    b.add(boxGeo(V(x - side * 0.12 - 0.04, 0.28, zc - 1.0), V(x - side * 0.12 + 0.04, 2.7, zc + 1.0)), M.navy);
    b.add(boxGeo(V(x - side * 0.14 - 0.05, 0.28, zc - 0.03), V(x - side * 0.14 + 0.05, 2.7, zc + 0.03)), M.steel);
  };

  // ================================================================ STREET
  b.add(up(-300, 300, -260, 120, -0.02, 8), M.walk);
  b.add(up(-SW, SW, Z1 - 100, Z0, 0, 8), M.road);
  for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -KERB : SW, 0, Z1), V(s < 0 ? -SW : KERB, 0.16, Z0), 4), M.walk);
  for (let z = Z0 - 2; z > Z1; z -= 6) b.add(boxGeo(V(-0.07, 0, z - 2.6), V(0.07, 0.012, z)), M.yellow);
  const STY = [0, 7, 1, 6, 2, 4, 5, 7, 0, 6], WID = [7.0, 8.0, 6.6], HGT = [8.4, 9.8, 7.0, 9.8, 8.4, 7.0];
  for (const s of [-1, 1]) {
    let z = Z0, k = s < 0 ? 0 : 4;
    while (z > Z1 + 8) {
      const w = WID[k % 3], h = HGT[(k * 2 + (s > 0 ? 1 : 0)) % 6];
      house(b, s * (KERB + 4.0), z - w / 2, s < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8.0, h, STY[k % STY.length], 0.14);
      z -= w; k++;
    }
  }
  sign("bank1", "SWISSVALE BANK", 1, -18, 6.2, 3.95, "#1f3f66", "#f3ead2"); bankFront(1, -18);
  sign("bank2", "SAVINGS BANK", -1, -92, 5.6, 3.95, "#7a2f2a", "#f3ead2"); bankFront(-1, -92);
  sign("diner", "DINER", -1, -6, 3.0, 3.3, "#c0453a", "#fff6dc", 0.8); sign("video", "VIDEO RENTAL", 1, -44, 4.6, 3.3, "#2f2f66", "#ffe36a", 0.8);
  for (let z = 30; z > Z1 + 10; z -= 22) for (const s of [-1, 1]) lamp(s * (SW + 0.5), z + (s > 0 ? -11 : 0), s);
  parked(-3.6, -8, M.red); parked(3.6, -30, M.teal, Math.PI); parked(-3.6, -52, M.cream); parked(3.6, -70, M.navy, Math.PI); parked(3.6, 8, M.blue, Math.PI); parked(-3.6, -110, M.teal);
  for (const [x, z] of [[6.9, -13.6], [-6.9, -22], [6.9, -40], [-6.9, -87.5]] as const) { b.add(new THREE.CylinderGeometry(0.3, 0.26, 0.9, 12).translate(x, 0.61, z), M.iron); }
  // downtown towers and hills far down the street
  for (const [x, z, w, h, m] of [[-60, -330, 26, 120, M.tower], [-20, -360, 22, 170, M.tower2], [22, -340, 30, 140, M.tower], [70, -350, 24, 100, M.tower2], [-110, -340, 28, 90, M.tower2], [120, -360, 30, 125, M.tower]] as const)
    b.add(boxGeo(V(x - w / 2, 0, z - w / 2), V(x + w / 2, h, z + w / 2)), m);
  for (const [x, z, r] of [[-520, -900, 260], [0, -1000, 320], [520, -900, 260]] as const) b.add(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.7, 0.3, 1).translate(x, -2, z), M.hill);
  b.build(root);
  // the getaway car (placed by the story)
  const car = new THREE.Group(); { const bb = new Batch(); carInto(bb, M.gold); bb.build(car); car.visible = false; root.add(car); }

  /** three walls and a floor around (ox, 0, 0); the camera stays inside. hole = a window opening in the back wall */
  const room = (ox: number, floor: THREE.Material, back: THREE.Material, sides: THREE.Material, hole?: [number, number, number, number]) => {
    const o = new Batch(), OM = T(ox, 0, 0);
    o.add(up(-7, 7, -5, 9, 0, 4), floor, OM);
    if (hole) { const [x0, x1, y0, y1] = hole;
      o.add(boxGeo(V(-7, 0, -5.3), V(x0, 5.2, -5)), back, OM); o.add(boxGeo(V(x1, 0, -5.3), V(7, 5.2, -5)), back, OM);
      o.add(boxGeo(V(x0, 0, -5.3), V(x1, y0, -5)), back, OM); o.add(boxGeo(V(x0, y1, -5.3), V(x1, 5.2, -5)), back, OM);
      o.add(boxGeo(V(x0 - 0.1, y0 - 0.1, -5.36), V(x1 + 0.1, y0, -4.9)), M.white, OM); o.add(boxGeo(V(x0 - 0.1, y1, -5.36), V(x1 + 0.1, y1 + 0.1, -4.9)), M.white, OM);
      for (const x of [x0 - 0.1, x1]) o.add(boxGeo(V(x, y0, -5.36), V(x + 0.1, y1, -4.9)), M.white, OM);
    } else o.add(boxGeo(V(-7, 0, -5.3), V(7, 5.2, -5)), back, OM);
    o.add(boxGeo(V(7, 0, -5), V(7.3, 5.2, 9)), sides, OM); o.add(boxGeo(V(-7.3, 0, -5), V(-7, 5.2, 9)), sides, OM);
    o.add(boxGeo(V(-7, 0, -5.02), V(7, 0.14, -4.94)), M.white, OM);
    o.add(boxGeo(V(-7.3, 0, 9), V(7.3, 5.2, 9.3)), sides, OM); o.add(boxGeo(V(-7, 0, 8.94), V(7, 0.14, 9.0)), M.white, OM);     // the fourth wall, behind the lens
    return { o, OM };
  };
  const win = (o: Batch, OM: THREE.Matrix4, x: number, w = 1.7, y = 2.75, h = 2.3) => {
    o.add(new THREE.PlaneGeometry(w, h).translate(x, y, -4.985), M.pane, OM);
    o.add(boxGeo(V(x - w / 2 - 0.1, y - h / 2 - 0.1, -5.0), V(x + w / 2 + 0.1, y - h / 2, -4.86)), M.white, OM); o.add(boxGeo(V(x - w / 2 - 0.1, y + h / 2, -5.0), V(x + w / 2 + 0.1, y + h / 2 + 0.1, -4.9)), M.white, OM);
    for (const dx of [-w / 2 - 0.05, 0, w / 2 + 0.05]) o.add(boxGeo(V(x + dx - 0.045, y - h / 2, -5.0), V(x + dx + 0.045, y + h / 2, -4.93)), M.white, OM);
  };
  const plant = (o: Batch, OM: THREE.Matrix4, x: number, z: number) => {
    o.add(new THREE.CylinderGeometry(0.32, 0.24, 0.6, 12).translate(x, 0.3, z), M.pot, OM);
    for (const [dx, dy, dz, r] of [[0, 1.25, 0, 0.5], [-0.3, 0.95, 0.1, 0.36], [0.32, 1.0, -0.1, 0.38], [0.05, 1.65, 0.05, 0.3]] as const) o.add(new THREE.SphereGeometry(r, 10, 8).translate(x + dx, dy, z + dz), M.green, OM);
  };

  // ================================================================ BANK HALL
  { const { o, OM } = room(BX, M.tile, M.bankWall, M.bankWall2);
    o.add(boxGeo(V(-7, 0, -5.02), V(7, 1.2, -4.9), 2), M.wood, OM);
    o.add(boxGeo(V(-5.2, 0, -2.9), V(5.2, 1.08, -2.2), 2), M.wood, OM); o.add(boxGeo(V(-5.3, 1.08, -3.0), V(5.3, 1.16, -2.1)), M.marble, OM);     // teller counter
    for (const x of [-5.2, -1.75, 1.75, 5.2]) o.add(boxGeo(V(x - 0.06, 1.16, -2.62), V(x + 0.06, 2.6, -2.5)), M.gold, OM);
    o.add(boxGeo(V(-5.26, 2.6, -2.64), V(5.26, 2.74, -2.48)), M.gold, OM);
    const tl = lam("signTeller", () => ({ map: signTex("teller", "TELLER", 512, 128, "#1f3f66", "#f3ead2", undefined, SANS) }));
    for (const x of [-3.45, 0, 3.45]) o.add(boxGeo(V(x - 0.8, 2.74, -2.6), V(x + 0.8, 3.14, -2.52)), tl, OM);
    const bs = lam("signBankIn", () => ({ map: signTex("bankin", "SWISSVALE BANK", 1536, 256, "#f3ead2", "#1f3f66", "Since 1902", FONT) }));
    o.add(boxGeo(V(-3.4, 3.7, -4.99), V(0.6, 4.6, -4.9)), bs, OM);
    // security camera high on the back wall, looking down the hall
    o.add(boxGeo(V(3.55, 4.05, -4.98), V(3.75, 4.25, -4.5)), M.iron, OM); o.add(boxGeo(V(3.35, 3.72, -4.7), V(3.95, 4.08, -3.95)), M.white, OM);
    o.add(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 16).rotateX(Math.PI / 2).translate(3.65, 3.9, -3.85), M.black, OM); o.add(new THREE.SphereGeometry(0.045, 8, 6).translate(3.86, 4.02, -3.94), M.red, OM);
    // clock, vault door, queue posts, plants, a bench
    o.add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24).rotateX(Math.PI / 2).translate(5.3, 3.9, -4.93), M.white, OM); o.add(new THREE.TorusGeometry(0.42, 0.045, 6, 24).translate(5.3, 3.9, -4.9), M.gold, OM);
    o.add(boxGeo(V(5.28, 3.88, -4.89), V(5.32, 4.2, -4.87)), M.black, OM); o.add(boxGeo(V(5.3, 3.88, -4.89), V(5.52, 3.92, -4.87)), M.black, OM);
    o.add(new THREE.CylinderGeometry(1.15, 1.15, 0.2, 28).rotateX(Math.PI / 2).translate(-5.3, 2.5, -4.9), M.steel, OM); o.add(new THREE.TorusGeometry(0.5, 0.06, 6, 20).translate(-5.3, 2.5, -4.74), M.iron, OM);
    for (let k = 0; k < 4; k++) o.add(boxGeo(V(-5.34, 2.46, -4.78), V(-5.26, 3.02, -4.72)), M.iron, new THREE.Matrix4().makeTranslation(BX - 5.3, 2.5, 0).multiply(new THREE.Matrix4().makeRotationZ(k * Math.PI / 2)).multiply(new THREE.Matrix4().makeTranslation(5.3, -2.5, 0)));
    for (const [x, z] of [[-1.6, 1.2], [1.6, 1.2], [-1.6, 4.2], [1.6, 4.2]] as const) { o.add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8).translate(x, 0.5, z), M.gold, OM); o.add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12).translate(x, 0.025, z), M.gold, OM); o.add(new THREE.SphereGeometry(0.08, 8, 6).translate(x, 1.03, z), M.gold, OM); }
    for (const x of [-1.6, 1.6]) o.add(boxGeo(V(x - 0.03, 0.86, 1.2), V(x + 0.03, 0.93, 4.2)), M.red, OM);
    plant(o, OM, -6.2, -4.1); plant(o, OM, 6.2, 5.5);
    o.add(new THREE.PlaneGeometry(2.6, 2.9).rotateY(Math.PI).translate(0, 1.6, 8.93), M.pane, OM); for (const x of [-1.35, 0, 1.35]) o.add(boxGeo(V(x - 0.06, 0.14, 8.86), V(x + 0.06, 3.1, 8.94)), M.steel, OM); o.add(boxGeo(V(-1.41, 3.05, 8.86), V(1.41, 3.17, 8.94)), M.steel, OM);   // glass street doors
    o.add(boxGeo(V(-6.8, 0.42, 1.5), V(-6.1, 0.52, 4.5)), M.wood, OM); for (const z of [1.7, 4.3]) o.add(boxGeo(V(-6.75, 0, z - 0.06), V(-6.15, 0.42, z + 0.06)), M.iron, OM);
    o.build(root); }

  // ================================================================ WHEELER'S FLAT: kitchen table with the lemons, a window to fly in by, TV corner, front door
  { const { o, OM } = room(AX, M.lino, M.aptWall, M.aptWall2, [-1.3, 1.3, 1.25, 3.45]);
    o.add(boxGeo(V(-1.3, 2.3, -5.2), V(1.3, 2.36, -5.12)), M.white, OM); o.add(boxGeo(V(-0.03, 1.25, -5.2), V(0.03, 3.45, -5.12)), M.white, OM);
    // kitchen run on the left of the back wall: cupboards, worktop, wall cupboards, fridge
    o.add(boxGeo(V(-6.9, 0, -4.95), V(-2.0, 0.95, -4.1), 2), M.teal, OM); o.add(boxGeo(V(-6.95, 0.95, -4.98), V(-1.95, 1.03, -4.05)), M.marble, OM);
    for (let k = 0; k < 4; k++) o.add(new THREE.SphereGeometry(0.045, 8, 6).translate(-6.3 + k * 1.2, 0.62, -4.08), M.steel, OM);
    o.add(boxGeo(V(-5.6, 2.6, -4.98), V(-2.0, 3.7, -4.5)), M.teal, OM);
    o.add(boxGeo(V(-6.95, 0, -4.9), V(-5.85, 2.5, -3.9)), M.fridge, OM); o.add(boxGeo(V(-5.92, 1.3, -3.9), V(-5.86, 2.2, -3.84)), M.steel, OM);
    // the table
    o.add(boxGeo(V(-1.3, 0.9, -2.0), V(1.3, 0.98, -0.5)), M.woodL, OM); for (const x of [-1.15, 1.15]) for (const z of [-1.85, -0.65]) o.add(boxGeo(V(x - 0.06, 0, z - 0.06), V(x + 0.06, 0.9, z + 0.06)), M.wood, OM);
    const lemonAt = (x: number, y: number, z: number, yaw = 0, s = 1) => {
      const mm = new THREE.Matrix4().compose(V(AX + x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0.15)), V(s, s, s));
      o.add(new THREE.SphereGeometry(0.075, 20, 14).scale(1.28, 1, 1), M.lemon, mm);
      for (const k of [-1, 1]) o.add(new THREE.ConeGeometry(0.022, 0.035, 10).rotateZ(-k * Math.PI / 2).translate(k * 0.104, 0, 0), M.lemon, mm);
    };
    const halfAt = (x: number, z: number, yaw: number) => {
      const mm = new THREE.Matrix4().compose(V(AX + x, 0.98, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), V(1, 1, 1));
      o.add(new THREE.SphereGeometry(0.075, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1, 1.2, 1).translate(0, 0.09, 0), M.lemon, mm);
      o.add(new THREE.CircleGeometry(0.075, 24).rotateX(-Math.PI / 2).translate(0, 0.091, 0), M.lemonIn, mm);
    };
    o.add(boxGeo(V(-0.75, 0.98, -1.6), V(0.05, 1.01, -1.0)), M.wood, OM);                                          // chopping board
    halfAt(-0.5, -1.25, 0.3); halfAt(-0.2, -1.42, 1.2); lemonAt(-0.56, 1.085, -1.47, 0.6);
    o.add(new THREE.CylinderGeometry(0.2, 0.13, 0.12, 20, 1, true).translate(0.5, 1.04, -1.3), M.glass, OM); o.add(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 20).translate(0.5, 0.99, -1.3), M.glass, OM);
    for (const [dx, dz, dy] of [[0, 0, 0.1], [0.11, 0.05, 0.08], [-0.1, 0.06, 0.08], [0.02, -0.1, 0.085], [0.03, 0.02, 0.2]] as const) lemonAt(0.5 + dx, 1.0 + dy, -1.3 + dz, dx * 9 + dz * 5);
    o.add(new THREE.CylinderGeometry(0.11, 0.09, 0.13, 18).translate(-0.05, 1.045, -0.82), M.glass, OM); o.add(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 18).translate(-0.05, 1.085, -0.82), M.juice, OM);   // a glass of juice
    lemonAt(0.95, 1.055, -0.8, 2.1); lemonAt(-1.0, 1.055, -0.75, 0.2);
    // chairs, TV corner on the right, sofa, front door on the left wall
    for (const x of [-0.7, 0.7]) { o.add(boxGeo(V(x - 0.25, 0.5, -0.2), V(x + 0.25, 0.56, 0.3)), M.wood, OM); o.add(boxGeo(V(x - 0.25, 0.56, 0.24), V(x + 0.25, 1.2, 0.3)), M.wood, OM); for (const dx of [-0.21, 0.21]) for (const dz of [-0.16, 0.26]) o.add(boxGeo(V(x + dx - 0.03, 0, dz - 0.03), V(x + dx + 0.03, 0.5, dz + 0.03)), M.wood, OM); }
    o.add(boxGeo(V(3.6, 0, -4.7), V(5.8, 0.7, -3.9)), M.wood, OM);                                                 // TV stand
    o.add(boxGeo(V(3.85, 0.7, -4.75), V(5.55, 2.0, -3.95)), M.black, OM); o.add(boxGeo(V(4.0, 2.0, -4.4), V(4.04, 2.5, -4.36)), M.steel, OM); o.add(boxGeo(V(5.36, 2.0, -4.4), V(5.4, 2.42, -4.36)), M.steel, OM);
    for (const k of [0, 1]) o.add(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10).rotateX(Math.PI / 2).translate(5.42, 1.0 + k * 0.2, -3.94), M.steel, OM);
    o.add(boxGeo(V(3.3, 0, 1.6), V(6.1, 0.5, 2.7)), M.sofa, OM); o.add(boxGeo(V(3.3, 0.5, 2.4), V(6.1, 1.15, 2.7)), M.sofa, OM); for (const x of [3.3, 5.8]) o.add(boxGeo(V(x, 0.5, 1.6), V(x + 0.3, 0.8, 2.4)), M.sofa, OM);
    o.add(boxGeo(V(-6.98, 0, 2.6), V(-6.9, 2.7, 4.2)), M.wood, OM); o.add(new THREE.SphereGeometry(0.06, 8, 6).translate(-6.86, 1.25, 4.0), M.gold, OM);
    plant(o, OM, 6.3, -4.2);
    o.build(root); }

  // ================================================================ UNIVERSITY OFFICE: chalkboard wall, desk, bookshelves
  { const { o, OM } = room(LX, M.carpet, M.labWall, M.labWall2);
    win(o, OM, 4.6);
    o.add(boxGeo(V(-4.4, 1.25, -5.0), V(1.6, 4.05, -4.9)), M.wood, OM);                                             // board frame (the chart is a document)
    o.add(boxGeo(V(-4.3, 1.18, -4.98), V(1.5, 1.26, -4.78)), M.woodL, OM);
    o.add(boxGeo(V(1.4, 0, -1.9), V(4.4, 0.95, -0.7), 1.6), M.planks, OM); o.add(boxGeo(V(1.3, 0.95, -2.0), V(4.5, 1.03, -0.6)), M.wood, OM);
    for (const [x, z, n] of [[1.8, -1.5, 6], [4.0, -1.1, 4]] as const) for (let k = 0; k < n; k++) o.add(boxGeo(V(x - 0.24, 1.03 + k * 0.035, z - 0.17), V(x + 0.24, 1.06 + k * 0.035, z + 0.17)), M.paper, OM);
    for (let k = 0; k < 4; k++) { o.add(boxGeo(V(-6.9, 0.7 + k * 0.9, -4.6), V(-5.2, 0.76 + k * 0.9, -1.4)), M.wood, OM);
      for (let j = 0; j < 9; j++) o.add(boxGeo(V(-6.8, 0.76 + k * 0.9, -4.45 + j * 0.33), V(-5.5 - ((j + k) % 3) * 0.12, 1.36 + k * 0.9 + ((j * 3 + k) % 4) * 0.05, -4.2 + j * 0.33)), [M.red, M.blue, M.teal, M.gold, M.navy][(j + k * 2) % 5], OM); }
    o.add(boxGeo(V(-5.2, 0, -4.7), V(-5.1, 4.3, -1.3)), M.wood, OM);
    plant(o, OM, 6.2, -4.1);
    o.build(root); }

  // ================================================================ documents shown to the lens
  const docTex: Record<string, [number, number, (g: CanvasRenderingContext2D) => void]> = {
    polaroid: [820, 1000, (g) => {            // the test photo: an empty wall, no face
      g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, 820, 1000); g.fillStyle = "#c9b48c"; g.fillRect(60, 60, 700, 700);
      g.fillStyle = "#bfa97f"; g.fillRect(60, 560, 700, 200); g.fillStyle = "#d8c7a2"; g.fillRect(520, 60, 240, 150);
      g.strokeStyle = "#8a8172"; g.lineWidth = 3; g.strokeRect(60, 60, 700, 700);
      g.fillStyle = "#3a3440"; g.font = `italic 64px ${FONT}`; g.textAlign = "center"; g.fillText("Test #1", 410, 890);
    }],
    cctv: [1024, 1280, (g) => {               // what the bank camera really recorded
      g.fillStyle = "#9fb3a6"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#8ea396"; g.fillRect(0, 820, 1024, 460); g.fillStyle = "#b5c6ba"; g.fillRect(0, 760, 1024, 70);
      mug(g, 512, 520, 260, { skin: "#dfe6dc", ink: "#1d2622", juice: true });
      g.fillStyle = "rgba(20,30,26,0.10)"; for (let y = 0; y < 1280; y += 8) g.fillRect(0, y, 1024, 3);
      g.fillStyle = "#f4f7f2"; g.font = `bold 54px ${SANS}`; g.textAlign = "left"; g.fillText("CAM 02", 50, 90); g.fillText("JAN 06 1995  14:47", 50, 1220);
      g.fillStyle = "#e23b32"; g.beginPath(); g.arc(880, 72, 22, 0, 7); g.fill(); g.fillStyle = "#f4f7f2"; g.fillText("REC", 912, 92);
    }],
    tvnews: [1280, 960, (g) => {              // the evening news
      g.fillStyle = "#27406e"; g.fillRect(0, 0, 1280, 960); g.fillStyle = "#35548c"; g.fillRect(0, 0, 1280, 130);
      g.fillStyle = "#ffffff"; g.font = `bold 78px ${SANS}`; g.textAlign = "left"; g.fillText("EVENING NEWS", 50, 95); g.textAlign = "right"; g.font = `bold 60px ${SANS}`; g.fillText("11:00", 1230, 92);
      g.fillStyle = "#9fb3a6"; g.fillRect(360, 170, 560, 560); mug(g, 640, 400, 170, { skin: "#dfe6dc", ink: "#1d2622", juice: true }); g.strokeStyle = "#ffffff"; g.lineWidth = 8; g.strokeRect(360, 170, 560, 560);
      g.fillStyle = "#c8322c"; g.fillRect(0, 770, 1280, 190); g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = `bold 92px ${SANS}`; g.fillText("DO YOU KNOW THIS MAN?", 640, 900);
    }],
    study: [1024, 1280, (g) => {
      g.fillStyle = "#f6f2e6"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#231f2a"; g.textAlign = "center";
      g.font = `italic 34px ${FONT}`; g.fillText("Journal of Personality and Social Psychology, 1999", 512, 110); g.fillRect(80, 140, 864, 4);
      g.font = `bold 92px ${FONT}`; g.fillText("Unskilled and", 512, 300); g.fillText("Unaware of It", 512, 410);
      g.font = `italic 50px ${FONT}`; g.fillText("Justin Kruger and David Dunning", 512, 520); g.fillRect(80, 570, 864, 3);
      for (let c = 0; c < 2; c++) for (let r = 0; r < 20; r++) { g.fillStyle = "#6a6470"; g.fillRect(90 + c * 440, 630 + r * 30, 400 - ((r * 7 + c * 3) % 5) * 28, 10); }
    }],
    curve: [1600, 760, (g) => {               // confidence against skill, chalk on a green board
      g.fillStyle = "#2f5a4a"; g.fillRect(0, 0, 1600, 760); g.strokeStyle = "#f2efe2"; g.fillStyle = "#f2efe2"; g.lineWidth = 9; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(170, 80); g.lineTo(170, 640); g.lineTo(1500, 640); g.stroke();
      g.font = `bold 50px ${SANS}`; g.textAlign = "center"; g.fillText("how much they know", 835, 715); g.save(); g.translate(95, 360); g.rotate(-Math.PI / 2); g.fillText("confidence", 0, 0); g.restore();
      g.strokeStyle = "#ffe36a"; g.lineWidth = 13; g.beginPath(); g.moveTo(190, 610); g.bezierCurveTo(250, 20, 420, 60, 560, 380); g.bezierCurveTo(680, 620, 900, 560, 1480, 230); g.stroke();
      g.fillStyle = "#ffe36a"; g.beginPath(); g.arc(352, 150, 20, 0, 7); g.fill(); g.font = `bold 46px ${SANS}`; g.textAlign = "left"; g.fillText("knows a little,", 420, 120); g.fillText("feels like an expert", 420, 175);
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
  return { root, car, doc, docs };
};
