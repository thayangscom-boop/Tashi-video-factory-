// Original expression set for the V3 test (drawn as canvas decals on the white head).
// Small black eyes, thin brows, tiny mouths, readable at phone size. Coordinates: 1024 px canvas, origin at the face centre.
const K = '#1b1414', TONGUE = '#e2463c', MOUTH = '#5a1414';
const eye = (g, x, y, rx = 30, ry = 38, px = 0, py = 0) => { g.fillStyle = K; g.beginPath(); g.ellipse(x + px * 8, y + py * 8, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + px * 8 + rx * 0.35, y + py * 8 - ry * 0.4, rx * 0.28, 0, 7); g.fill(); };
const eyes = (g, o = {}) => { const s = o.sep ?? 96, y = o.y ?? -20; for (const d of [-1, 1]) eye(g, d * s, y, o.rx, o.ry, o.px, o.py); };
const lids = (g, cover = 0.45, slant = 0, sep = 96, y = -20) => { g.fillStyle = '#ffffff'; for (const d of [-1, 1]) { g.save(); g.translate(d * sep, y); g.rotate(d * slant); g.fillRect(-60, -80, 120, 80 * cover * 2 - 10); g.restore(); }
  g.strokeStyle = K; g.lineWidth = 12; g.lineCap = 'round'; for (const d of [-1, 1]) { g.save(); g.translate(d * sep, y); g.rotate(d * slant); g.beginPath(); g.moveTo(-40, -80 + 80 * cover * 2 - 12); g.lineTo(40, -80 + 80 * cover * 2 - 12); g.stroke(); g.restore(); } };
const brow = (g, tilt = 0, lift = 0, w = 13, sep = 96) => { g.strokeStyle = K; g.lineWidth = w; g.lineCap = 'round'; for (const d of [-1, 1]) { const y = -105 - lift; g.beginPath(); g.moveTo(d * (sep - 42), y + tilt * 22); g.quadraticCurveTo(d * sep, y - 10, d * (sep + 42), y - tilt * 22); g.stroke(); } };
const line = (g, pts, w = 14) => { g.strokeStyle = K; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
const smile = (g, w = 52, d = 26, y = 95) => { g.strokeStyle = K; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + d * 2, w, y); g.stroke(); };
const frown = (g, w = 40, d = 18, y = 112) => { g.strokeStyle = K; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - d * 2, w, y); g.stroke(); };
const open = (g, w = 34, h = 46, y = 92) => { g.fillStyle = MOUTH; g.strokeStyle = K; g.lineWidth = 10; g.beginPath(); g.ellipse(0, y + h * 0.5, w, h * 0.6, 0, 0, 7); g.fill(); g.stroke(); g.save(); g.clip(); g.fillStyle = TONGUE; g.beginPath(); g.ellipse(0, y + h, w * 0.7, h * 0.35, 0, 0, 7); g.fill(); g.restore(); };
const blush = (g, a = 0.35) => { for (const d of [-1, 1]) { const r = g.createRadialGradient(d * 150, 60, 4, d * 150, 60, 60); r.addColorStop(0, `rgba(240,110,120,${a})`); r.addColorStop(1, 'rgba(240,110,120,0)'); g.fillStyle = r; g.beginPath(); g.arc(d * 150, 60, 60, 0, 7); g.fill(); } };
const sweat = g => { g.fillStyle = '#7cc8ff'; g.strokeStyle = K; g.lineWidth = 6; g.beginPath(); g.moveTo(210, -170); g.quadraticCurveTo(245, -95, 210, -82); g.quadraticCurveTo(175, -95, 210, -170); g.fill(); g.stroke(); };
const stache = g => { g.fillStyle = '#3a2418'; g.strokeStyle = K; g.lineWidth = 6; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 6, 52); g.quadraticCurveTo(d * 70, 30, d * 112, 78); g.quadraticCurveTo(d * 60, 74, d * 6, 80); g.closePath(); g.fill(); g.stroke(); } };

export const FACES = {
  neutral: g => { eyes(g); brow(g, 0); line(g, [[-26, 104], [26, 104]]); },
  curious: g => { eyes(g, { ry: 42, py: -0.3 }); brow(g, -0.35, 14); line(g, [[-14, 106], [14, 102]]); },
  suspicious: (g, side = 1) => { eyes(g, { px: side, ry: 30 }); lids(g, 0.5, 0.12); brow(g, 0.55, -2, 15); line(g, [[-30, 108], [10, 104], [30, 98]]); },
  happy: g => { for (const d of [-1, 1]) line(g, [[d * 96 - 34, -6], [d * 96, -38], [d * 96 + 34, -6]], 15); brow(g, -0.2, 10); smile(g, 58, 30); blush(g, 0.3); },
  annoyed: g => { eyes(g, { ry: 26 }); lids(g, 0.55, -0.1); brow(g, 0.75, -6, 16); frown(g, 34, 10); },
  worried: g => { eyes(g, { ry: 40, rx: 28 }); brow(g, -0.7, 18); line(g, [[-36, 112], [-12, 102], [12, 112], [36, 102]], 12); sweat(g); },
  shocked: g => { for (const d of [-1, 1]) { g.fillStyle = '#fff'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.ellipse(d * 96, -24, 52, 60, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = K; g.beginPath(); g.arc(d * 96, -20, 18, 0, 7); g.fill(); } brow(g, -0.4, 44); open(g, 30, 58, 84); },
  embarrassed: g => { eyes(g, { ry: 30, py: 0.6, px: -0.4 }); brow(g, -0.55, 8); line(g, [[-30, 108], [-10, 100], [10, 108], [30, 100]], 12); blush(g, 0.6); sweat(g); },
  smug: g => { eyes(g, { ry: 32 }); lids(g, 0.48, -0.06); brow(g, 0.2, 4); line(g, [[-40, 96], [0, 110], [44, 84]], 14); },
  chew0: g => { eyes(g); lids(g, 0.4); brow(g, 0.05, 0); g.fillStyle = '#ffffff'; for (const d of [-1, 1]) { g.beginPath(); g.arc(d * 70, 110, 34, 0, 7); g.fill(); } line(g, [[-20, 112], [20, 112]]); },
  chew1: g => { eyes(g); lids(g, 0.4); brow(g, 0.05, 0); line(g, [[-24, 104], [0, 112], [24, 104]]); },
  chomp: g => { eyes(g, { ry: 34 }); lids(g, 0.35); brow(g, 0.1, 6); open(g, 44, 60, 76); },
};
export const withStache = f => g => { f(g); stache(g); };
