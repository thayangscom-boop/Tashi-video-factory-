// Jensen Came Back — premium explainer. Deterministic: R(t) draws the frame at time t (seconds).
const W = window.WORDS;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const P = (t, a, d) => clamp((t - a) / d);
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  o2: p => 1 - (1 - p) * (1 - p), o3: p => 1 - Math.pow(1 - p, 3), o5: p => 1 - Math.pow(1 - p, 5),
  io: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  el: p => p === 0 || p === 1 ? p : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
// time of the n-th occurrence of a word
function at(word, n = 0, after = 0) {
  let k = 0;
  for (const x of W) { const s = x.w.toLowerCase().replace(/[^a-z0-9%,]/g, ''); if (x.s >= after && s.startsWith(word.toLowerCase().replace(/[^a-z0-9%,]/g, ''))) { if (k++ === n) return x.s; } }
  throw new Error('no word ' + word);
}
function mk(parent, html, style = '', cls = 'abs') {
  const d = document.createElement('div'); d.className = cls; d.style.cssText = style + (style.includes('left:50%') ? ';width:max-content' : ''); d.innerHTML = html; parent.appendChild(d); return d;
}
function tf(e, o) {
  const { x = 0, y = 0, s = 1, sx, sy, r = 0, rx = 0, ry = 0, z = 0, o: op, b = 0, cx = false, origin } = o;
  e.style.transform = ((rx || ry) ? 'perspective(1400px) ' : '') + (cx ? 'translateX(-50%) ' : '') + `translate3d(${x}px,${y}px,${z}px) rotate(${r}deg) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sx ?? s},${sy ?? s})`;
  if (op !== undefined) e.style.opacity = op;
  if (origin) e.style.transformOrigin = origin;
  const prev = e.dataset.f || '';
  e.style.filter = (b > 0.05 ? `blur(${b}px) ` : '') + prev;
}
// reveal helper: rise + unblur
function rise(e, t, a, d = .5, dist = 40, extra = {}) {
  const p = P(t, a, d), q = E.o5(p);
  tf(e, { y: (1 - q) * dist, o: p > 0 ? clamp(p * 2.2) : 0, b: (1 - q) * 10, ...extra });
  return p;
}
function pop(e, t, a, d = .45, extra = {}) {
  const p = P(t, a, d);
  tf(e, { s: lerp(1.6, 1, E.o5(p)), o: clamp(p * 3), b: (1 - E.o3(p)) * 14, ...extra });
  return p;
}
function slam(e, t, a, extra = {}) {
  const p = P(t, a, .28);
  tf(e, { s: lerp(2.6, 1, E.o5(p)), o: clamp(p * 4), b: (1 - E.o3(p)) * 8, ...extra });
  return p;
}
const fmt = n => Math.round(n).toLocaleString('en-US');
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// dot-matrix number: --d sets the dot pitch
function dmNum(parent, txt, size, style = '', glow = 'glow', color = '#f4f4f0') {
  const wrap = mk(parent, `<div class="dm" style="--d:${Math.max(4, Math.round(size / 42))}px;font-size:${size}px;color:${color}">${txt}</div>`, style, 'abs ' + glow);
  wrap.num = wrap.firstChild; return wrap;
}
function corners(parent, w, h, x, y, col = 'rgba(255,255,255,.85)') {
  const g = mk(parent, '', `left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
  [['0', '0', '3px 0 0 3px'], ['0', 'r', '3px 3px 0 0'], ['b', '0', '0 0 3px 3px'], ['b', 'r', '0 3px 3px 0']].forEach(([v, hh, bw]) => {
    mk(g, '', `${v === 'b' ? 'bottom' : 'top'}:-6px;${hh === 'r' ? 'right' : 'left'}:-6px;border-width:${bw};border-color:${col}`, 'corner');
  });
  return g;
}
const SC = document.getElementById('scenes');
const scenes = [];
function scene(a, b, build, upd, opt = {}) {
  const root = mk(SC, '', '', 'scene');
  const ctx = build(root) || {};
  scenes.push({ a, b, root, ctx, upd, opt });
}
// --------- global events
const SHAKE = [], FLASH = [], STREAK = [];
const sfx = []; // exported for the audio mixer
function cue(name, t, gain = 1) { sfx.push({ name, t: +t.toFixed(3), gain }); }

// ===================== HEADER
const H = document.getElementById('hdr');
const hl = mk(H, `<span id="dot" style="display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--g);margin-right:14px;vertical-align:2px;box-shadow:0 0 14px var(--g)"></span>TASHI DOCU`, 'left:56px;top:66px;font-family:Mono;font-weight:700;font-size:24px;letter-spacing:.3em', 'abs');
const hr = mk(H, `MARKETS · NVIDIA`, 'right:56px;top:66px;font-family:Mono;font-weight:700;font-size:20px;letter-spacing:.26em;color:#9a9a95;border:1.5px solid rgba(255,255,255,.25);padding:6px 12px 5px', 'abs');
const hq = mk(H, `<span style="color:#9a9a95">POLL</span>&nbsp;&nbsp;TRUST HIM AGAIN? &nbsp;<span style="color:var(--g)">YES</span> / <span style="color:var(--r)">NO</span>`, 'left:50%;top:128px;font-family:Mono;font-weight:700;font-size:19px;letter-spacing:.2em;white-space:nowrap;padding:8px 16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14)', 'abs');
const hline = mk(H, '', 'left:56px;right:56px;top:112px;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.05))', 'abs');

// ===================== SCENE 1 — HOOK: ≈$1T in one day
const T_back = at('came'), T_real = at('is');
scene(0, T_real - .15, r => {
  const c = {};
  c.cone = mk(r, '', '', 'cone');
  c.chart = mk(r, `<svg width="1080" height="700" viewBox="0 0 1080 700"><defs>
    <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76b900" stop-opacity=".45"/><stop offset="1" stop-color="#76b900" stop-opacity="0"/></linearGradient></defs>
    <path id="h1a" d="" fill="url(#gf)"/><path id="h1l" d="" fill="none" stroke="#9be22b" stroke-width="5" stroke-linejoin="round"/><circle id="h1c" r="11" fill="#d9ff9e"/></svg>`, 'left:0;top:560px;opacity:.9');
  c.logo = mk(r, `<img src="assets/nv_word.svg" style="height:44px">`, 'left:50%;top:300px', 'abs');
  c.l1 = mk(r, 'MARKET VALUE ADDED', 'left:50%;top:388px', 'abs lbl');
  c.alm = mk(r, 'ALMOST', 'left:50%;top:440px', 'abs tag');
  c.num = dmNum(r, '+$1T', 330, 'left:50%;top:520px', 'glowg', '#a6f03a');
  c.l2 = mk(r, `IN <span class="serif" style="font-size:44px;letter-spacing:0;text-transform:none;color:#fff">one</span> TRADING DAY`, 'left:50%;top:860px', 'abs lbl');
  c.jen = mk(r, `<img src="assets/jensen_cut.png" style="height:1050px;filter:grayscale(1) contrast(1.15) brightness(1.02)">`, 'left:50%;top:330px', 'abs');
  c.jtag = mk(r, `<div class="tag g">THE ONE MAN</div><div class="lbl" style="margin-top:14px;color:#fff">JENSEN HUANG</div><div class="lbl s" style="margin-top:6px">CO-FOUNDER · CEO</div>`, 'left:64px;top:1080px', 'abs');
  c.brk = corners(r, 470, 520, 305, 380, 'rgba(118,185,0,.9)');
  // build chart path
  const pts = []; const R = rnd(7);
  for (let i = 0; i <= 60; i++) { let v = 520 - i * 1.2 + (R() - .5) * 26; if (i > 42) v = 520 - 50 - (i - 42) * 20 + (R() - .5) * 18; pts.push([i * 18, v]); }
  c.pts = pts; return c;
}, (c, t) => {
  // chart draws 0..3.5
  const k = Math.floor(lerp(2, c.pts.length, E.io(P(t, 0, 3.2))));
  const pts = c.pts.slice(0, k);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const svg = c.chart.firstChild;
  svg.querySelector('#h1l').setAttribute('d', d);
  svg.querySelector('#h1a').setAttribute('d', d + ` L${pts[pts.length - 1][0]} 700 L0 700 Z`);
  const lp = pts[pts.length - 1]; const cc = svg.querySelector('#h1c'); cc.setAttribute('cx', lp[0]); cc.setAttribute('cy', lp[1]);
  const pj = P(t, T_back - .9, .9), out = E.io(pj);
  tf(c.chart, { o: .85 * (1 - out), y: out * 120 });
  rise(c.logo, t, .05, .5, 30, { cx: true }); c.logo.style.opacity = clamp(P(t, .05, .4)) * (1 - out);
  rise(c.l1, t, .15, .5, 30, { cx: true }); c.l1.style.opacity *= (1 - out);
  pop(c.alm, t, 1.0, .4, { cx: true }); c.alm.style.opacity *= (1 - out);
  // number: punches in at 0.12s, scales up subtly on "trillion"
  const pn = P(t, .12, .5), pt = P(t, at('trillion'), .35);
  tf(c.num, { cx: true, s: lerp(1.5, 1, E.o5(pn)) * (1 + .06 * Math.sin(Math.PI * pt)) * lerp(1, 1.25, out), y: -out * 60, o: clamp(pn * 3) * (1 - out), b: (1 - E.o3(pn)) * 16 + out * 24 });
  rise(c.l2, t, at('one'), .5, 30, { cx: true }); c.l2.style.opacity *= (1 - out);
  // Jensen rises from darkness on "one man came back"
  const pjn = P(t, at('one', 1), 1.0), qj = E.o5(pjn);
  tf(c.jen, { cx: true, y: (1 - qj) * 260, s: lerp(1.08, 1, qj) + P(t, T_back, 2) * .03, o: clamp(pjn * 1.6), b: (1 - qj) * 18 });
  c.cone.style.opacity = clamp(pjn * 1.5) * (.85 + .15 * Math.sin(t * 9));
  rise(c.jtag, t, T_back, .5, 30);
  const pb = P(t, T_back + .1, .35); tf(c.brk, { s: lerp(1.25, 1, E.o5(pb)), o: pb });
});
cue('boom', .1, 1); cue('riser', 0, .5); cue('whoosh', at('one', 1) - .15, .8); cue('hit', T_back, .7);
FLASH.push([.12, .35]); SHAKE.push([.12, 14]);

// ===================== SCENE 2 — "Is it real? I checked." (SEC 8-K)
const T_el = at('eleven');
scene(T_real - .15, T_el - .1, r => {
  const c = {};
  c.doc = mk(r, `
    <div style="width:700px;height:900px;background:linear-gradient(180deg,#e9e8e3,#d4d3cd);color:#111;padding:54px 56px;font-family:Mono;box-shadow:0 60px 160px rgba(0,0,0,.9)">
      <div style="font-weight:700;font-size:18px;letter-spacing:.2em;color:#555">UNITED STATES · SECURITIES AND EXCHANGE COMMISSION</div>
      <div style="font-family:Tight;font-weight:900;font-size:86px;margin-top:22px;letter-spacing:-.01em">FORM 8-K</div>
      <div style="font-weight:700;font-size:20px;letter-spacing:.14em;margin-top:6px">NVIDIA CORPORATION</div>
      <div style="height:2px;background:#111;margin:26px 0"></div>
      <div style="font-size:19px;line-height:1.75;font-weight:500">
        <div class="hl" style="background:rgba(118,185,0,0)">Board reinstates Jensen Huang as President</div>
        <div class="hl" style="background:rgba(118,185,0,0)">and Chief Executive Officer, effective</div>
        <div class="hl" style="background:rgba(118,185,0,0)">immediately. Unanimous vote of the Board.</div>
        ${'<div style="height:14px;background:#bdbcb6;margin:16px 0;width:VAR%"></div>'.repeat(7).replace(/VAR/g, (()=>{const R=rnd(3);return ()=>60+Math.floor(R()*38)})())}
      </div>
    </div>`, 'left:50%;top:330px;transform-style:preserve-3d', 'abs');
  c.beam = mk(r, '', 'left:150px;width:780px;top:400px;height:120px;background:linear-gradient(180deg,transparent,rgba(118,185,0,.35),rgba(200,255,150,.9) 50%,rgba(118,185,0,.35),transparent);mix-blend-mode:screen;filter:blur(1px)', 'abs');
  c.date = mk(r, `<span class="lbl" style="color:#fff">FILED</span>`, 'left:50%;top:1250px', 'abs');
  c.dn = dmNum(r, 'NOV 23 · 2026', 64, 'left:50%;top:1290px');
  c.st = mk(r, `<div class="stamp" style="color:var(--g);font-size:110px;background:rgba(5,15,0,.55)">VERIFIED</div>`, 'left:50%;top:760px', 'abs glowg');
  c.q = mk(r, `<span style="font-family:Tight;font-weight:900;font-size:150px">IS IT</span><br><span class="serif" style="font-size:190px;color:var(--g)">real?</span>`, 'left:50%;top:520px;text-align:center;line-height:.95', 'abs');
  return c;
}, (c, t, a) => {
  const pq = P(t, T_real, .35), qout = P(t, at('i') - .05, .3);
  tf(c.q, { cx: true, s: lerp(1.4, 1, E.o5(pq)) * lerp(1, 1.4, E.io(qout)), o: clamp(pq * 3) * (1 - qout), b: (1 - E.o3(pq)) * 12 + qout * 30 });
  const pd = P(t, at('i') - .15, .7), q = E.o5(pd);
  tf(c.doc, { cx: true, y: (1 - q) * 300, rx: lerp(38, 12, q) - P(t, at('i'), 2) * 6, ry: lerp(-14, -4, q), s: .9, o: clamp(pd * 2) });
  c.doc.style.perspective = '1400px';
  const pb = P(t, at('i'), .8);
  c.beam.style.top = lerp(430, 1010, E.io(pb)) + 'px'; c.beam.style.opacity = pb > 0 && pb < 1 ? 1 : 0;
  c.doc.querySelectorAll('.hl').forEach((h, i) => { const p = P(t, at('i') + .15 + i * .12, .2); h.style.background = `rgba(118,185,0,${.55 * p})`; });
  const ps = slam(c.st, t, at('checked') + .25, { cx: true, r: -8 });
  rise(c.date, t, at('i') + .3, .4, 20, { cx: true }); rise(c.dn, t, at('i') + .38, .4, 20, { cx: true });
});
cue('whoosh', T_real - .12, .6); cue('swish', at('i') - .1, .6); cue('scan', at('i'), .5); cue('stamp', at('checked') + .25, 1);
SHAKE.push([at('checked') + .27, 10]);

// ===================== SCENE 3 — 11 days ago, resigned, scandal
const T_rep = at('reports');
scene(T_el - .1, T_rep - .2, r => {
  const c = {};
  c.cal = mk(r, '', 'left:0;top:0;width:1080px;height:1920px');
  c.n = dmNum(c.cal, '11', 420, 'left:50%;top:330px');
  c.l = mk(c.cal, 'DAYS AGO', 'left:50%;top:720px;font-size:30px', 'abs lbl');
  c.d = mk(c.cal, `<span class="tag">NOV 12 · 2026</span>`, 'left:50%;top:780px', 'abs');
  c.ph = mk(r, `<div class="photo halftone" style="inset:0;background-image:url(assets/j_resign.jpg)"></div>`, 'left:150px;top:300px;width:780px;height:960px;overflow:hidden', 'frame');
  c.nm = mk(r, `<div class="lbl" style="color:#fff">JENSEN HUANG</div><div class="lbl s" style="margin-top:6px">CEO · SINCE 1993</div>`, 'left:180px;top:1190px', 'abs');
  c.st = mk(r, `<div class="stamp" style="color:var(--r);font-size:118px;background:rgba(40,0,0,.45)">RESIGNED</div>`, 'left:50%;top:690px', 'abs glowr');
  c.sc = mk(r, `<div style="position:relative;font-family:Tight;font-weight:900;font-size:200px;letter-spacing:-.02em">
     <span style="position:absolute;left:0;top:0;color:#ff0040;mix-blend-mode:screen" class="ca1">SCANDAL</span>
     <span style="position:absolute;left:0;top:0;color:#00e5ff;mix-blend-mode:screen" class="ca2">SCANDAL</span>
     <span style="position:relative;color:#fff;mix-blend-mode:screen">SCANDAL</span></div>`, 'left:50%;top:520px', 'abs');
  c.red = mk(r, '', 'inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(255,30,30,.5),rgba(120,0,0,.25) 50%,transparent 80%);mix-blend-mode:screen', 'abs');
  return c;
}, (c, t) => {
  const pn = P(t, T_el, .4);
  tf(c.n, { cx: true, s: lerp(1.6, 1, E.o5(pn)), o: clamp(pn * 3), b: (1 - E.o3(pn)) * 14 });
  rise(c.l, t, T_el + .15, .4, 20, { cx: true }); rise(c.d, t, at('ago') , .4, 20, { cx: true });
  const pout = P(t, at('ceo') - .2, .35);
  tf(c.cal, { o: 1 - pout, s: 1 + pout * .3, b: pout * 20 });
  const pp = P(t, at('ceo') - .2, .7), qp = E.o5(pp);
  const scOut = P(t, at('a', 0, 12) - .1, .3);
  tf(c.ph, { y: (1 - qp) * 120, s: lerp(1.12, 1, qp) + P(t, at('ceo'), 3) * .04, o: clamp(pp * 2) * (1 - scOut * .75), b: (1 - qp) * 14 + scOut * 10 });
  rise(c.nm, t, at('jensen'), .4, 20); c.nm.style.opacity *= (1 - scOut);
  slam(c.st, t, at('resigned'), { cx: true, r: -6 }); c.st.style.opacity *= (1 - scOut);
  const ps = P(t, at('a', 0, 12), .35);
  const jit = Math.sin(t * 90) * 10 * (1 - P(t, at('a', 0, 12) + .3, .8)), j2 = Math.cos(t * 70) * 8;
  tf(c.sc, { cx: true, s: lerp(1.8, 1, E.o5(ps)), o: clamp(ps * 3), b: (1 - E.o3(ps)) * 10 });
  c.sc.querySelector('.ca1').style.transform = `translate(${-6 - jit}px,${j2 * .3}px)`;
  c.sc.querySelector('.ca2').style.transform = `translate(${6 + jit}px,${-j2 * .3}px)`;
  c.red.style.opacity = ps * (.6 + .4 * Math.abs(Math.sin(t * 13)));
});
cue('whoosh', T_el - .1, .6); cue('boom', T_el, .7); cue('tick', at('ago'), .5); cue('swish', at('ceo') - .2, .5);
cue('stamp', at('resigned'), 1); cue('glitch', at('a', 0, 12), 1); cue('boom', at('a', 0, 12), .9);
SHAKE.push([at('resigned') + .02, 12], [at('a', 0, 12), 18]); FLASH.push([at('a', 0, 12), .5]);

// ===================== SCENE 4 — dossier: linked to a woman (identity withheld)
const T_six = at('six');
scene(T_rep - .2, T_six - .15, r => {
  const c = {};
  c.cls = mk(r, 'CLASSIFIED', 'left:50%;top:840px;font-family:Tight;font-weight:900;font-size:190px;color:rgba(255,59,48,.045);letter-spacing:.04em;transform:translateX(-50%) rotate(-12deg)', 'abs');
  c.a = mk(r, `<div class="photo halftone" style="inset:0;background-image:url(assets/j_dossier.jpg)"></div>`, 'left:90px;top:330px;width:420px;height:540px;overflow:hidden;background:#111', 'frame');
  c.at = mk(r, `<div class="tag">SUBJECT A</div><div class="lbl" style="margin-top:12px;color:#fff;font-size:20px">JENSEN HUANG</div>`, 'left:90px;top:895px', 'abs');
  c.b = mk(r, `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#2a2a2a,#0b0b0b 70%)"></div>
     <svg viewBox="0 0 400 500" style="position:absolute;left:10px;top:40px;width:400px;height:500px">
      <defs><pattern id="ht" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2" fill="#6a6a6a"/></pattern>
      <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#ff6a5f" stop-opacity="1"/></linearGradient></defs>
      <path d="M200 50 C140 50 108 98 110 160 C111 210 104 262 86 318 C80 336 72 352 60 362 C95 366 122 360 140 352 L144 372 C90 388 40 410 22 500 L378 500 C360 410 310 388 256 372 L260 352 C278 360 305 366 340 362 C328 352 320 336 314 318 C296 262 289 210 290 160 C292 98 260 50 200 50 Z" fill="#050505"/>
      <path d="M200 50 C140 50 108 98 110 160 C111 210 104 262 86 318 C80 336 72 352 60 362 C95 366 122 360 140 352 L144 372 C90 388 40 410 22 500 L378 500 C360 410 310 388 256 372 L260 352 C278 360 305 366 340 362 C328 352 320 336 314 318 C296 262 289 210 290 160 C292 98 260 50 200 50 Z" fill="url(#ht)"/>
      <path d="M200 50 C140 50 108 98 110 160 C111 210 104 262 86 318 C80 336 72 352 60 362 C95 366 122 360 140 352 L144 372 C90 388 40 410 22 500 L378 500 C360 410 310 388 256 372 L260 352 C278 360 305 366 340 362 C328 352 320 336 314 318 C296 262 289 210 290 160 C292 98 260 50 200 50 Z" fill="none" stroke="url(#rim)" stroke-width="6"/>
     </svg>
     <div class="redact" style="position:absolute;left:60px;top:205px;height:54px;width:300px;background:#000;border:1px solid rgba(255,255,255,.12)"></div>
     <div style="position:absolute;left:0;right:0;top:20px;text-align:center" class="lbl s">IDENTITY WITHHELD</div>`, 'left:570px;top:330px;width:420px;height:540px;overflow:hidden;background:#0b0b0b', 'frame');
  c.bt = mk(r, `<div class="tag r">SUBJECT B</div><div class="lbl" style="margin-top:12px;color:#fff;font-size:20px">UNNAMED WOMAN</div>`, 'left:570px;top:895px', 'abs');
  c.str = mk(r, `<svg width="1080" height="1920"><path id="sp" d="M300 600 C 450 520, 640 700, 780 600" fill="none" stroke="#ff3b30" stroke-width="5" stroke-dasharray="600" stroke-dashoffset="600"/>
     <circle id="p1" cx="300" cy="600" r="12" fill="#ff3b30"/><circle id="p2" cx="780" cy="600" r="12" fill="#ff3b30"/></svg>`, 'left:0;top:0', 'abs glowr');
  c.rep = mk(r, `<div class="tag">REPORTED</div>`, 'left:50%;top:520px', 'abs');
  c.card = mk(r, `<div style="background:rgba(12,12,12,.92);border:1.5px solid rgba(255,59,48,.6);padding:26px 34px;width:840px">
     <div class="lbl s" style="color:#ff8a80">U.S. INTELLIGENCE · ASSESSMENT (PER REPORTS)</div>
     <div style="font-family:Tight;font-weight:900;font-size:64px;margin-top:12px;line-height:1">BELIEVED TO BE A</div>
     <div class="serif" style="font-size:96px;color:var(--r);line-height:1">Chinese spy</div></div>`, 'left:50%;top:1010px', 'abs');
  c.note = mk(r, 'ILLUSTRATION · IDENTITY NOT SHOWN', 'left:570px;top:300px', 'abs lbl s');
  return c;
}, (c, t) => {
  const t0 = T_rep;
  const pa = P(t, t0 - .15, .6); tf(c.a, { x: (1 - E.o5(pa)) * -200, r: lerp(-10, -3, E.o5(pa)), o: clamp(pa * 2), b: (1 - E.o5(pa)) * 12 });
  rise(c.at, t, t0 + .2, .4, 20);
  const pb = P(t, at('woman') - .1, .6); tf(c.b, { x: (1 - E.o5(pb)) * 200, r: lerp(10, 3, E.o5(pb)), o: clamp(pb * 2), b: (1 - E.o5(pb)) * 12 });
  rise(c.bt, t, at('woman') + .1, .4, 20); rise(c.note, t, at('woman') + .2, .4, 10);
  const ps = P(t, at('linked'), .9);
  const sp = c.str.querySelector('#sp'); sp.setAttribute('stroke-dashoffset', 600 * (1 - E.io(ps)));
  c.str.querySelector('#p1').style.opacity = clamp(ps * 4); c.str.querySelector('#p2').style.opacity = ps >= 1 ? 1 : 0;
  pop(c.rep, t, at('linked') + .3, .4, { cx: true });
  const pc = P(t, at('us') - .1, .55); tf(c.card, { cx: true, y: (1 - E.o5(pc)) * 80, o: clamp(pc * 2), b: (1 - E.o5(pc)) * 10, rx: (1 - E.o5(pc)) * 30 });
  const spy = P(t, at('chinese'), .3); c.card.querySelector('.serif').style.transform = `scale(${lerp(1.3, 1, E.o5(spy))})`; c.card.querySelector('.serif').style.opacity = spy;
  c.cls.style.opacity = clamp(P(t, t0, 1)) * .9;
  // redaction bar flickers
  c.b.querySelector('.redact').style.width = (300 * (0.92 + .08 * Math.sin(t * 7))) + 'px';
});
cue('whoosh', T_rep - .2, .6); cue('slide', T_rep - .1, .5); cue('slide', at('woman') - .1, .5); cue('string', at('linked'), .6);
cue('hit', at('us') - .05, .6); cue('boom', at('chinese'), .8);
SHAKE.push([at('chinese') + .02, 9]);

// ===================== SCENE 5 — six days ago, board: not reinstating (HQ)
const T_then = at('then');
scene(T_six - .15, T_then - .15, r => {
  const c = {};
  c.bg = mk(r, `<div class="photo" style="inset:0;background-image:url(assets/hq.jpg);background-position:62% 50%;filter:grayscale(1) contrast(1.35) brightness(.6)"></div>
     <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,5,5,.9),rgba(5,5,5,.1) 30%,rgba(5,5,5,.2) 65%,rgba(5,5,5,.98))"></div>`, 'left:-60px;top:200px;width:1200px;height:1100px;overflow:hidden', 'abs');
  c.n = dmNum(r, '6', 300, 'left:50%;top:330px');
  c.l = mk(r, 'DAYS AGO', 'left:50%;top:620px;font-size:28px', 'abs lbl');
  c.d = mk(r, `<span class="tag">NOV 17 · 2026</span>`, 'left:50%;top:675px', 'abs');
  c.loc = mk(r, 'NVIDIA HQ · SANTA CLARA, CA', 'left:56px;top:1250px', 'abs lbl s');
  c.q = mk(r, `<div style="background:rgba(8,8,8,.86);border-left:6px solid var(--r);padding:30px 40px 30px 40px;width:900px;backdrop-filter:blur(6px)">
     <div class="lbl s">NVIDIA BOARD · EARNINGS CALL</div>
     <div style="font-family:Inter;font-weight:800;font-size:58px;line-height:1.08;margin-top:14px">“The board <span class="serif" style="font-size:72px;font-weight:400;color:var(--r)">does not intend</span> to reinstate Jensen as CEO.”</div></div>`, 'left:50%;top:770px', 'abs');
  return c;
}, (c, t) => {
  const pb = P(t, T_six - .15, 4.6);
  tf(c.bg, { s: lerp(1.15, 1.0, E.o2(pb)), x: lerp(-30, 30, pb), o: clamp(P(t, T_six - .1, .6)) });
  const pn = P(t, T_six, .4); tf(c.n, { cx: true, s: lerp(1.6, 1, E.o5(pn)), o: clamp(pn * 3), b: (1 - E.o3(pn)) * 14 });
  rise(c.l, t, T_six + .15, .4, 20, { cx: true }); rise(c.d, t, at('ago', 1), .4, 20, { cx: true });
  rise(c.loc, t, at('nvidia', 0, 18), .5, 10);
  const pq = P(t, at('said', 0, 19) - .1, .55); tf(c.q, { cx: true, y: (1 - E.o5(pq)) * 90, o: clamp(pq * 2), b: (1 - E.o5(pq)) * 10 });
  const pi = P(t, at('not', 0, 20), .3); const s = c.q.querySelector('.serif'); s.style.display = 'inline-block'; s.style.transform = `scale(${pi > 0 ? lerp(1.35, 1, E.o5(pi)) : 1})`; s.style.opacity = .25 + .75 * pi;
});
cue('whoosh', T_six - .15, .6); cue('boom', T_six, .6); cue('tick', at('ago', 1), .5); cue('slide', at('said', 0, 19) - .1, .5); cue('hit', at('not', 0, 20), .6);

// ===================== SCENE 6 — petition 190,000
const T_this = at('this', 0, 27);
scene(T_then - .15, T_this - .1, r => {
  const c = {};
  c.l = mk(r, `<span class="tag g">STAND WITH JENSEN</span>`, 'left:50%;top:300px', 'abs');
  c.l2 = mk(r, 'PETITION · SIGNATURES', 'left:50%;top:380px', 'abs lbl');
  c.n = dmNum(r, '190,000', 210, 'left:50%;top:430px', 'glowg', '#b5f55a');
  c.plus = mk(r, 'MORE THAN', 'left:50%;top:660px', 'abs lbl s');
  c.cv = mk(r, `<canvas width="900" height="560" style="width:900px;height:560px"></canvas>`, 'left:90px;top:720px', 'abs');
  c.cvx = c.cv.firstChild.getContext('2d');
  const N = 50 * 31, R = rnd(42), order = [...Array(N).keys()];
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  c.rank = new Array(N); order.forEach((v, i) => c.rank[v] = i); c.N = N;
  return c;
}, (c, t) => {
  rise(c.l, t, T_then - .05, .45, 20, { cx: true }); rise(c.l2, t, T_then + .1, .45, 20, { cx: true });
  rise(c.plus, t, at('more', 0, 22), .4, 10, { cx: true });
  const pc = P(t, at('more', 0, 22), at('people') - at('more', 0, 22) + .1);
  const v = 190000 * E.o3(pc);
  c.n.num.textContent = fmt(Math.round(v / 10) * 10);
  tf(c.n, { cx: true, s: 1 + .08 * Math.sin(Math.PI * P(t, at('people'), .3)), o: clamp(P(t, T_then, .3) * 3) });
  const g = c.cvx; g.clearRect(0, 0, 900, 560);
  const lit = Math.floor(c.N * E.o3(pc));
  for (let i = 0; i < c.N; i++) {
    const x = (i % 50) * 18 + 9, y = Math.floor(i / 50) * 18 + 9, on = c.rank[i] < lit;
    const fresh = on && c.rank[i] > lit - 60;
    g.fillStyle = on ? (fresh ? '#eaffc8' : '#76b900') : 'rgba(255,255,255,.08)';
    g.beginPath(); g.arc(x, y, on ? 5.2 : 4, 0, 7); g.fill();
  }
  tf(c.cv, { o: clamp(P(t, T_then, .4)), y: (1 - E.o5(P(t, T_then, .6))) * 40 });
});
cue('whoosh', T_then - .15, .6); cue('count', at('more', 0, 22), .55); cue('hit', at('people'), .6); cue('hit', at('petition'), .4);

// ===================== SCENE 7 — reinstated, effective immediately, unanimous
const T_stock = at('stock');
scene(T_this - .1, at('the', 0, 32.5) - .1, r => {
  const c = {};
  c.jen = mk(r, `<img src="assets/jensen_cut2.png" style="height:1080px;filter:grayscale(1) contrast(1.2) brightness(.95)">`, 'left:50%;top:410px', 'abs');
  c.rim = mk(r, '', 'left:0;right:0;top:250px;height:1200px;background:radial-gradient(ellipse 45% 55% at 50% 50%,rgba(118,185,0,.25),transparent 70%);mix-blend-mode:screen', 'abs');
  c.fade = mk(r, '', 'left:0;right:0;top:900px;height:600px;background:linear-gradient(180deg,transparent,#050505 75%)', 'abs');
  c.tm = mk(r, `<span class="lbl" style="color:#fff">THIS MORNING</span>`, 'left:50%;top:230px', 'abs');
  c.dt = dmNum(r, 'NOV 23', 110, 'left:50%;top:272px');
  c.rows = ['REINSTATED', 'EFFECTIVE IMMEDIATELY', 'UNANIMOUS VOTE'].map((s, i) => mk(r, `<div style="display:flex;align-items:center;gap:22px;background:rgba(8,8,8,.85);border:1.5px solid rgba(118,185,0,.55);padding:20px 30px;width:820px">
     <div class="ck" style="width:52px;height:52px;background:var(--g);display:flex;align-items:center;justify-content:center;color:#061000;font-weight:900;font-size:38px;font-family:Inter">✓</div>
     <div style="font-family:Tight;font-weight:900;font-size:54px;letter-spacing:.01em">${s}</div></div>`, `left:50%;top:${880 + i * 125}px`, 'abs'));
  return c;
}, (c, t) => {
  const pj = P(t, T_this - .1, 1.2);
  tf(c.jen, { cx: true, y: (1 - E.o5(pj)) * 120 - P(t, T_this, 5) * 30, s: lerp(1.1, 1, E.o5(pj)), o: clamp(pj * 1.5) * .9, b: (1 - E.o5(pj)) * 16 });
  c.rim.style.opacity = clamp(P(t, at('reinstated'), .6));
  rise(c.tm, t, T_this, .4, 20, { cx: true }); pop(c.dt, t, T_this + .15, .45, { cx: true });
  const ts = [at('reinstated'), at('effective'), at('unanimous')];
  c.rows.forEach((e, i) => { const p = P(t, ts[i] - .05, .4); tf(e, { cx: true, x: (1 - E.o5(p)) * 160, o: clamp(p * 2.5), b: (1 - E.o5(p)) * 10 }); e.querySelector('.ck').style.transform = `scale(${E.back(P(t, ts[i] + .1, .35))})`; });
});
cue('whoosh', T_this - .1, .6); cue('riser', T_this, .4); ['reinstated', 'effective', 'unanimous'].forEach(w => cue('check', at(w), .9)); cue('boom', at('reinstated'), .6);
FLASH.push([at('reinstated'), .25]);

// ===================== SCENE 8 — stock +30% at open, 35 at one point
const T_here = at("here's");
scene(at('the', 0, 32.5) - .1, T_here - .15, r => {
  const c = {};
  c.tk = mk(r, `<span class="tag" style="font-size:24px">NASDAQ: NVDA</span>`, 'left:50%;top:300px', 'abs');
  c.n = dmNum(r, '+30%', 300, 'left:50%;top:370px', 'glowg', '#b5f55a');
  c.l = mk(r, 'AT THE OPEN', 'left:50%;top:680px', 'abs lbl');
  c.ch = mk(r, `<svg width="940" height="520"><defs><linearGradient id="g8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76b900" stop-opacity=".4"/><stop offset="1" stop-color="#76b900" stop-opacity="0"/></linearGradient></defs>
     <line x1="0" y1="430" x2="940" y2="430" stroke="rgba(255,255,255,.25)" stroke-dasharray="6 8"/>
     <path id="a8" fill="url(#g8)"/><path id="l8" fill="none" stroke="#a6f03a" stroke-width="5" stroke-linejoin="round"/>
     <g id="pk"><line id="pkl" x1="0" y1="0" x2="0" y2="520" stroke="rgba(255,255,255,.5)" stroke-dasharray="4 6"/><circle id="pkc" r="12" fill="#fff"/></g></svg>`, 'left:70px;top:760px', 'abs');
  c.pk = mk(r, `<div class="tag" style="background:#fff;color:#000">AT ONE POINT</div>`, 'left:600px;top:760px', 'abs');
  c.pkn = dmNum(r, '+35%', 110, 'left:610px;top:820px', 'glow');
  // series: flat prev close, gap up, drift, peak, settle
  const R = rnd(11), pts = [];
  for (let i = 0; i <= 26; i++) pts.push([i * 13, 430 + (R() - .5) * 14]);
  let y = 430 - 30 * 7.5; // +30% (7.5px per %)
  for (let i = 27; i <= 72; i++) { const k = i - 27; let pct = 30 + Math.sin(k / 6) * 3 + (k > 18 && k < 30 ? (k - 18) * .45 * (k < 24 ? 1 : 0) + (k >= 24 ? (30 - k) * .45 : 0) : 0) + (R() - .5) * 2; if (k === 24) pct = 35; pts.push([i * 13, 430 - pct * 7.5]); }
  c.pts = pts; c.peak = pts[27 + 24]; return c;
}, (c, t) => {
  rise(c.tk, t, at('stock') - .05, .4, 20, { cx: true });
  const pn = P(t, at('up', 0, 33), .2), pc = P(t, at('30%'), .5);
  c.n.num.textContent = '+' + Math.round(30 * E.o3(pc)) + '%';
  tf(c.n, { cx: true, s: lerp(1.5, 1, E.o5(pn)) * (1 + .06 * Math.sin(Math.PI * P(t, at('30%'), .3))), o: clamp(pn * 3), b: (1 - E.o3(pn)) * 14 });
  rise(c.l, t, at('open'), .4, 20, { cx: true });
  const pd = P(t, at('up', 0, 33), at('35') - at('up', 0, 33) + .2);
  const k = Math.max(2, Math.floor(lerp(2, c.pts.length, E.io(pd))));
  const pts = c.pts.slice(0, k), d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const s = c.ch.firstChild; s.querySelector('#l8').setAttribute('d', d); s.querySelector('#a8').setAttribute('d', d + ` L${pts[pts.length - 1][0]} 520 L0 520 Z`);
  tf(c.ch, { o: clamp(P(t, at('stock'), .5)) });
  const pp = P(t, at('35') - .05, .4);
  s.querySelector('#pk').style.opacity = pp; s.querySelector('#pkl').setAttribute('x1', c.peak[0]); s.querySelector('#pkl').setAttribute('x2', c.peak[0]);
  s.querySelector('#pkc').setAttribute('cx', c.peak[0]); s.querySelector('#pkc').setAttribute('cy', c.peak[1]);
  c.pk.style.left = (70 + c.peak[0] - 260) + 'px'; c.pkn.style.left = (70 + c.peak[0] - 250) + 'px';
  c.pk.style.top = (760 + c.peak[1] - 210) + 'px'; c.pkn.style.top = (760 + c.peak[1] - 150) + 'px';
  pop(c.pk, t, at('one', 0, 35.5) - .1, .4); pop(c.pkn, t, at('35'), .4);
});
cue('whoosh', at('the', 0, 32.5) - .1, .6); cue('boom', at('up', 0, 33), .8); cue('count', at('30%') - .05, .4); cue('hit', at('35'), .7);
SHAKE.push([at('up', 0, 33), 12]); FLASH.push([at('up', 0, 33), .3]);

// ===================== SCENE 9 — the strange part: US gov input, no national security risk
const T_but = at('but');
scene(T_here - .15, T_but - .15, r => {
  const c = {};
  c.bg = mk(r, `<div class="photo" style="inset:0;background-image:url(assets/capitol.jpg);filter:grayscale(1) contrast(1.25) brightness(.5)"></div>
     <div style="position:absolute;inset:0;background:linear-gradient(180deg,#050505,rgba(5,5,5,.15) 30%,rgba(5,5,5,.3) 60%,#050505)"></div>`, 'left:-60px;top:260px;width:1200px;height:1150px;overflow:hidden', 'abs');
  c.ti = mk(r, `<div style="font-family:Tight;font-weight:900;font-size:120px;line-height:.95;text-align:center">HERE'S THE<br><span class="serif" style="font-weight:400;font-size:170px;color:#ffd23f">strange</span> PART</div>`, 'left:50%;top:560px', 'abs');
  c.flow = mk(r, `
    <div class="nd n1" style="position:absolute;left:0;top:0;width:820px"><div class="tag" style="display:inline-block">INPUT FROM</div>
       <div style="font-family:Tight;font-weight:900;font-size:62px;margin-top:14px;line-height:1">SENIOR LEVELS OF THE</div><div class="serif" style="font-size:90px;line-height:1">U.S. government</div></div>
    <svg class="ar" width="40" height="120" style="position:absolute;left:390px;top:250px"><line x1="20" y1="0" x2="20" y2="100" stroke="#fff" stroke-width="3" stroke-dasharray="100" stroke-dashoffset="100"/><path d="M8 92 L20 112 L32 92" fill="none" stroke="#fff" stroke-width="3" opacity="0"/></svg>
    <div class="nd n2" style="position:absolute;left:0;top:400px;width:820px;background:rgba(6,14,2,.9);border:2px solid var(--g);padding:28px 34px">
       <div class="lbl s" style="color:#b9e57a">NVIDIA BOARD · STATEMENT</div>
       <div style="display:flex;align-items:center;gap:26px;margin-top:14px">
       <svg width="96" height="112" viewBox="0 0 96 112"><path d="M48 4 L90 20 V56 C90 82 70 100 48 108 C26 100 6 82 6 56 V20 Z" fill="none" stroke="#76b900" stroke-width="6"/><path class="ck" d="M28 56 L43 71 L70 42" fill="none" stroke="#a6f03a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="70" stroke-dashoffset="70"/></svg>
       <div style="font-family:Tight;font-weight:900;font-size:56px;line-height:1.02">NO NATIONAL<br>SECURITY RISK</div></div></div>`, 'left:130px;top:330px;width:820px;height:900px', 'abs');
  return c;
}, (c, t) => {
  const pt = P(t, T_here, .4), pto = P(t, at('the', 0, 39) - .2, .35);
  tf(c.ti, { cx: true, s: lerp(1.5, 1, E.o5(pt)) * lerp(1, 1.3, pto), o: clamp(pt * 3) * (1 - pto), b: (1 - E.o3(pt)) * 14 + pto * 24, r: Math.sin(t * 40) * 1.2 * (1 - P(t, T_here + .3, .5)) });
  const pb = P(t, at('the', 0, 39) - .3, 7);
  tf(c.bg, { s: lerp(1.18, 1.02, E.o2(pb)), y: lerp(30, -20, pb), o: clamp(P(t, at('input') - .4, .8)) });
  const n1 = c.flow.querySelector('.n1'), n2 = c.flow.querySelector('.n2'), ar = c.flow.querySelector('.ar');
  const p1 = rise(n1, t, at('took') - .1, .5, 40);
  const pg = P(t, at('us', 0, 42), .35); n1.querySelector('.serif').style.color = `rgb(${lerp(242, 255, pg)},${lerp(242, 210, pg)},${lerp(240, 63, pg)})`;
  const pa = P(t, at('and', 0, 42.5), .5); ar.querySelector('line').setAttribute('stroke-dashoffset', 100 * (1 - pa)); ar.querySelector('path').setAttribute('opacity', pa >= 1 ? 1 : 0);
  rise(n2, t, at('poses') - .1, .5, 40);
  n2.querySelector('.ck').setAttribute('stroke-dashoffset', 70 * (1 - E.o3(P(t, at('risk'), .4))));
});
cue('whoosh', T_here - .15, .6); cue('glitch', T_here, .5); cue('hit', T_here + .05, .6); cue('swish', at('took') - .1, .5); cue('hit', at('us', 0, 42), .4);
cue('slide', at('poses') - .1, .5); cue('check', at('risk'), .9);

// ===================== SCENE 10 — the twist: still below pre-scandal level; crashed 40%
const T_and = at('and', 0, 54.8);
scene(T_but - .15, T_and - .1, r => {
  const c = {};
  c.ti = mk(r, `<div style="font-family:Tight;font-weight:900;font-size:130px;text-align:center;line-height:.95">BUT HERE'S<br>THE <span class="serif" style="font-weight:400;font-size:180px;color:var(--r)">twist</span></div>`, 'left:50%;top:560px', 'abs');
  c.ch = mk(r, `<svg width="960" height="760" viewBox="0 0 960 760"><defs>
     <linearGradient id="g10" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
     <line id="base" x1="0" y1="140" x2="960" y2="140" stroke="#fff" stroke-width="2.5" stroke-dasharray="12 10"/>
     <rect id="gap" x="800" y="140" width="160" height="0" fill="rgba(255,59,48,.18)" stroke="none"/>
     <path id="a10" fill="url(#g10)"/><path id="l10" fill="none" stroke="#f2f2f0" stroke-width="5" stroke-linejoin="round"/>
     <path id="lr" fill="none" stroke="#ff3b30" stroke-width="7" stroke-linejoin="round" opacity="0"/>
     <path id="lg" fill="none" stroke="#a6f03a" stroke-width="7" stroke-linejoin="round" opacity="0"/>
     <circle id="dt" r="13" fill="#a6f03a"/></svg>`, 'left:60px;top:470px', 'abs');
  c.bl = mk(r, `<span class="tag" style="background:#fff;color:#000">BEFORE THE SCANDAL</span>`, 'left:80px;top:540px', 'abs');
  c.sb = mk(r, `<div class="tag r" style="font-size:24px">STILL BELOW</div>`, 'left:720px;top:700px', 'abs');
  c.cr = mk(r, `<div class="lbl s" style="color:#ff8a80">CRASHED IN A MONTH</div>`, 'left:330px;top:1270px', 'abs');
  c.cn = dmNum(r, '-40%', 220, 'left:300px;top:1030px', 'glowr', '#ff5a4f');
  c.hd = mk(r, `<span class="lbl">NVDA · PRICE</span>`, 'left:80px;top:330px', 'abs');
  // series: 100 → 60 over a month → jump +30% to 78
  const R = rnd(5), pts = []; const Y = v => 140 + (100 - v) * 13; let v = 100;
  for (let i = 0; i <= 8; i++) pts.push([i * 15, Y(100 + (R() - .5) * 3)]);
  for (let i = 9; i <= 50; i++) { const k = (i - 9) / 41; v = 100 - 40 * (k * .9 + .1 * Math.sin(k * 9)) + (R() - .5) * 3; if (i === 50) v = 60; pts.push([i * 15, Y(v)]); }
  for (let i = 51; i <= 53; i++) pts.push([i * 15, Y(60 + (i - 50) * 6)]);
  for (let i = 54; i <= 63; i++) pts.push([i * 15, Y(78 + (R() - .5) * 2.4)]);
  c.pts = pts; c.Y = Y; return c;
}, (c, t) => {
  const pt = P(t, T_but, .35), pto = P(t, at('even') - .25, .35);
  tf(c.ti, { cx: true, s: lerp(1.6, 1, E.o5(pt)) * lerp(1, .8, pto), o: clamp(pt * 3) * (1 - pto), b: (1 - E.o3(pt)) * 14 + pto * 20 });
  const pd = P(t, at('even') - .1, 2.0), k = Math.max(2, Math.floor(lerp(2, c.pts.length, E.io(pd))));
  const pts = c.pts.slice(0, k), path = a => a.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const s = c.ch.firstChild; s.querySelector('#l10').setAttribute('d', path(pts)); s.querySelector('#a10').setAttribute('d', path(pts) + ` L${pts[pts.length - 1][0]} 760 L0 760 Z`);
  const lp = pts[pts.length - 1]; s.querySelector('#dt').setAttribute('cx', lp[0]); s.querySelector('#dt').setAttribute('cy', lp[1]);
  tf(c.ch, { o: clamp(P(t, at('even') - .2, .4)) });
  rise(c.hd, t, at('even') - .1, .4, 10); rise(c.bl, t, at('before', 0, 50), .4, 20);
  s.querySelector('#base').style.opacity = clamp(P(t, at('even'), .4));
  const pg = P(t, at('below') - .05, .5); const gy = c.Y(78); s.querySelector('#gap').setAttribute('height', (gy - 140) * E.o3(pg));
  pop(c.sb, t, at('below'), .4);
  // crash segment highlight
  const pc = P(t, at('crashed') - .05, .7);
  const crash = c.pts.slice(8, 51); s.querySelector('#lr').setAttribute('d', path(crash)); s.querySelector('#lr').setAttribute('opacity', pc);
  s.querySelector('#lr').style.strokeDasharray = 2000; s.querySelector('#lr').style.strokeDashoffset = 2000 * (1 - E.io(pc));
  const jump = c.pts.slice(50, 54); s.querySelector('#lg').setAttribute('d', path(jump)); s.querySelector('#lg').setAttribute('opacity', P(t, at('jump'), .3));
  slam(c.cn, t, at('40%') - .05); rise(c.cr, t, at('month') - .2, .4, 10);
  const lw = P(t, T_and - .4, .3); c.ch.style.opacity *= 1;
});
cue('whoosh', T_but - .15, .6); cue('boom', T_but + .3, .7); cue('draw', at('even') - .1, .5); cue('hit', at('jump'), .4); cue('hit', at('below'), .7);
cue('down', at('crashed') - .05, .8); cue('stamp', at('40%') - .05, .9); SHAKE.push([at('40%'), 14]);

// ===================== SCENE 11 — next week: Congress, closed doors
const T_realv = at('real', 0, 59);
scene(T_and - .1, T_realv - .1, r => {
  const c = {};
  c.bg = mk(r, `<div class="photo" style="inset:0;background-image:url(assets/capitol.jpg);filter:grayscale(1) contrast(1.35) brightness(.7)"></div>
     <div style="position:absolute;inset:0;background:linear-gradient(180deg,#050505,rgba(5,5,5,.0) 30%,rgba(5,5,5,.1) 70%,#050505)"></div>`, 'left:90px;top:520px;width:900px;height:760px;overflow:hidden', 'frame');
  c.dl = mk(r, `<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,#141414 0 70px,#0c0c0c 70px 74px);border-right:3px solid #333"></div>`, 'left:90px;top:520px;width:450px;height:760px;overflow:hidden', 'abs');
  c.dr = mk(r, `<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,#141414 0 70px,#0c0c0c 70px 74px);border-left:3px solid #333"></div>`, 'left:540px;top:520px;width:450px;height:760px;overflow:hidden', 'abs');
  c.cd = mk(r, `<span class="tag r" style="font-size:28px">CLOSED-DOOR SESSION</span>`, 'left:50%;top:870px', 'abs');
  c.nw = mk(r, `<span class="lbl" style="color:#fff">NEXT WEEK</span>`, 'left:50%;top:300px', 'abs');
  c.cg = mk(r, `<div style="font-family:Tight;font-weight:900;font-size:120px;letter-spacing:.02em">CONGRESS</div>`, 'left:50%;top:345px', 'abs');
  c.q = mk(r, `<span class="lbl s">QUESTIONS FOR JENSEN HUANG</span>`, 'left:50%;top:480px', 'abs');
  return c;
}, (c, t) => {
  rise(c.nw, t, at('next'), .4, 20, { cx: true }); pop(c.cg, t, at('congress') - .15, .45, { cx: true }); rise(c.q, t, at('questions'), .4, 10, { cx: true });
  const pb = P(t, T_and - .1, 4.5); tf(c.bg, { s: lerp(1.12, 1, E.o2(pb)), o: clamp(P(t, T_and, .6)) });
  const pc = P(t, at('closed') - .25, .55), q = E.io(pc);
  tf(c.dl, { x: lerp(-470, 0, q), o: pc > 0 ? 1 : 0 }); tf(c.dr, { x: lerp(470, 0, q), o: pc > 0 ? 1 : 0 });
  slam(c.cd, t, at('doors'), { cx: true });
});
cue('whoosh', T_and - .1, .6); cue('hit', at('congress') - .1, .6); cue('doors', at('closed') - .25, 1); cue('boom', at('closed') + .3, .9); cue('stamp', at('doors'), .5);
SHAKE.push([at('closed') + .32, 16]);

// ===================== SCENE 12 — verdict + question
const T_fol = at('follow');
scene(T_realv - .1, T_fol - .12, r => {
  const c = {};
  c.v = mk(r, `<div class="lbl" style="text-align:center;margin-bottom:12px">VERDICT</div><div class="stamp" style="color:var(--g);font-size:170px;background:rgba(5,15,0,.5)">REAL</div>`, 'left:50%;top:420px', 'abs glowg');
  c.q = mk(r, `<div style="font-family:Tight;font-weight:900;font-size:96px;text-align:center;line-height:1">WOULD YOU<br><span class="serif" style="font-weight:400;font-size:140px">trust him</span><br>AGAIN?</div>`, 'left:50%;top:360px', 'abs');
  c.y = mk(r, `<div style="width:400px;height:150px;background:var(--g);color:#061000;display:flex;align-items:center;justify-content:center;font-family:Tight;font-weight:900;font-size:84px">YES</div>`, 'left:110px;top:800px', 'abs');
  c.n = mk(r, `<div style="width:400px;height:150px;background:var(--r);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Tight;font-weight:900;font-size:84px">NO</div>`, 'left:570px;top:800px', 'abs');
  c.tb = mk(r, `<span class="lbl" style="color:#fff">TELL ME BELOW ↓</span>`, 'left:50%;top:1010px', 'abs');
  return c;
}, (c, t) => {
  const pv = slam(c.v, t, T_realv, { cx: true, r: -5 }); const pvo = P(t, at('would') - .15, .25);
  c.v.style.opacity = clamp(pv * 4) * (1 - pvo);
  const pq = P(t, at('would') - .1, .45); tf(c.q, { cx: true, s: lerp(1.4, 1, E.o5(pq)), o: clamp(pq * 3), b: (1 - E.o3(pq)) * 12 });
  const py = P(t, at('trust') - .05, .4), pn = P(t, at('again') - .05, .4);
  tf(c.y, { y: (1 - E.back(py)) * 100, o: clamp(py * 3) }); tf(c.n, { y: (1 - E.back(pn)) * 100, o: clamp(pn * 3) });
  rise(c.tb, t, at('tell'), .4, 20, { cx: true });
  const bob = Math.sin((t - at('tell')) * 7) * 8 * P(t, at('tell'), .3); c.tb.style.transform += ` translateY(${bob}px)`;
});
cue('stamp', T_realv, 1); cue('boom', T_realv, .7); cue('whoosh', at('would') - .15, .5); cue('pop', at('trust') - .05, .7); cue('pop', at('again') - .05, .7); cue('hit', at('tell'), .4);
SHAKE.push([T_realv + .03, 12]);

// ===================== SCENE 13 — end card
scene(T_fol - .12, 99, r => {
  const c = {};
  c.bg = mk(r, `<img src="assets/jensen_cut.png" style="height:1100px;filter:grayscale(1) brightness(.45) contrast(1.1)">`, 'left:50%;top:300px', 'abs');
  c.fd = mk(r, '', 'left:0;right:0;top:700px;height:800px;background:linear-gradient(180deg,transparent,#050505 70%)', 'abs');
  c.logo = mk(r, `<div style="width:170px;height:170px;border-radius:50%;border:2px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;background:#0b0b0b;box-shadow:0 0 60px rgba(118,185,0,.35)"><span style="font-family:Tight;font-weight:900;font-size:64px;color:var(--g)">TD</span></div>`, 'left:50%;top:780px', 'abs');
  c.nm = mk(r, `<div style="font-family:Tight;font-weight:900;font-size:84px;letter-spacing:.06em;text-align:center">TASHI DOCU</div><div class="serif" style="text-align:center;font-size:40px;color:#bbb">tomorrow's claim, checked</div>`, 'left:50%;top:975px', 'abs');
  c.btn = mk(r, `<div class="b1" style="font-family:Mono;font-weight:700;font-size:30px;letter-spacing:.2em;padding:18px 40px;border:2px solid #fff;border-radius:40px;text-align:center;white-space:nowrap">FOLLOW</div>`, 'left:50%;top:1140px', 'abs');
  return c;
}, (c, t) => {
  const p = P(t, T_fol - .1, .8); tf(c.bg, { cx: true, o: clamp(p * 1.4), s: lerp(1.1, 1.02, E.o5(p)) + P(t, T_fol, 3) * .02 });
  pop(c.logo, t, T_fol, .45, { cx: true }); rise(c.nm, t, T_fol + .15, .45, 20, { cx: true }); rise(c.btn, t, T_fol + .3, .45, 20, { cx: true });
  const pf = P(t, at('claim') - .2, .25), b = c.btn.firstChild;
  if (pf > .5) { b.textContent = 'FOLLOWING ✓'; b.style.background = '#76b900'; b.style.color = '#061000'; b.style.borderColor = '#76b900'; }
  else { b.textContent = 'FOLLOW'; b.style.background = 'transparent'; b.style.color = '#fff'; b.style.borderColor = '#fff'; }
  b.style.transform = `scale(${1 + .12 * Math.sin(Math.PI * pf)})`;
});
cue('whoosh', T_fol - .12, .5); cue('pop', at('claim') - .1, .8);

// ===================== CAPTIONS
const CAPS = [
  'Nvidia just gained | almost a *trillion* dollars', 'in *one* day,', 'all because | *one* *man* came back.', 'Is it *real?*', 'I *checked.*',
  'Eleven days ago, | CEO Jensen Huang', '*resigned.*', 'A *scandal.*', 'Reports linked him | to a woman', 'US intelligence believes | was a *Chinese* *spy.*',
  'Six days ago, | Nvidia\'s board said', 'it did *not* *intend* | to bring him back.', 'Then, more than | *190,000* people', 'signed a *petition* | to bring him back.',
  'This morning,', '*reinstated,*', 'effective | *immediately,*', '*unanimous* vote.', 'The *stock?*', 'Up about *30%* | at the open,', 'at one point *35.*',
  'Here\'s the | *strange* part.', 'The board says it took input | from senior levels', 'of the *US* *government*', 'and that his return poses | no *national* *security* risk.',
  'But here\'s the *twist.*', 'Even after this jump, | the stock is still', '*below* where it was | before the scandal.', 'It had *crashed* | more than 40% in a month.',
  'And next week, | he answers questions', 'from *Congress* | behind closed doors.', '*Real.*', 'Would you | *trust* *him* again?', 'Tell me *below.*', 'Follow for | tomorrow\'s *claim.*'];
const CAPEL = document.getElementById('caps');
const capChunks = []; { let wi = 0;
  for (const s of CAPS) {
    const lines = s.split('|').map(l => l.trim().split(/\s+/)); const ch = { lines: [], el: mk(CAPEL, '', 'left:0;right:0;top:0', 'abs') };
    for (const ln of lines) { const L = mk(ch.el, '', '', 'ln'); const arr = [];
      ln.forEach((tok, k) => { const acc = tok.startsWith('*'); const txt = tok.replace(/\*/g, ''); const w = W[wi++];
        const norm = x => x.toLowerCase().replace(/[^a-z0-9]/g, ''); if (!w || norm(w.w) !== norm(txt)) console.error('caption mismatch', txt, w && w.w);
        const sp = document.createElement('span'); sp.textContent = txt; if (acc) sp.className = 'a'; L.appendChild(sp); if (k < ln.length - 1) L.appendChild(document.createTextNode(' '));
        arr.push({ sp, w, acc }); });
      ch.lines.push(arr); }
    ch.words = ch.lines.flat(); ch.s = ch.words[0].w.s; capChunks.push(ch);
  }
  capChunks.forEach((c, i) => c.e = i < capChunks.length - 1 ? Math.min(capChunks[i + 1].s, c.words[c.words.length - 1].w.e + 1.2) : 64.5);
}
const REDW = ['scandal','resigned','chinese','spy','not','intend','twist','below','crashed','strange','congress','trust','him'];
const ACCENTCOL = (w, t) => (t > 61 && /below/i.test(w)) ? '#b5f55a' : REDW.includes(w.toLowerCase().replace(/[^a-z]/g,'')) ? (w.toLowerCase().startsWith('strange') ? '#ffd23f' : '#ff5a4f') : '#b5f55a';
function drawCaps(t) {
  for (const c of capChunks) {
    const vis = t >= c.s - .08 && t < c.e;
    c.el.style.display = vis ? 'block' : 'none'; if (!vis) continue;
    const out = P(t, c.e - .12, .12);
    c.el.style.opacity = 1 - out;
    for (const { sp, w, acc } of c.words) {
      const p = P(t, w.s - .08, .22), q = E.o3(p);
      sp.style.opacity = .0 + clamp(p * 1.6);
      sp.style.transform = `translateY(${(1 - q) * 22}px) scale(${acc ? lerp(1.25, 1, E.o5(p)) : 1})`;
      sp.style.filter = p < 1 ? `blur(${(1 - q) * 8}px)` : 'none';
      if (acc) sp.style.color = ACCENTCOL(w.w, w.s);
    }
  }
}

// ===================== GLOBAL FX
const grain = document.getElementById('grain').getContext('2d'); const gimg = grain.createImageData(540, 960);
function drawGrain(f) { const R = rnd(f * 7919 + 13); const d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = R() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } grain.putImageData(gimg, 0, 0); }
const CAM = document.getElementById('cam'), FL = document.getElementById('flash'), ST = document.getElementById('streak'), BG = document.getElementById('bggrid');
// cut moments = scene starts
scenes.forEach(s => { if (s.a > 0) STREAK.push(s.a + .05); });

window.R = function (t) {
  const f = Math.round(t * 60);
  for (const s of scenes) {
    const vis = t >= s.a && t < s.b + .35;
    s.root.style.display = vis ? 'block' : 'none'; if (!vis) continue;
    const pi = P(t, s.a, .35), po = P(t, s.b - .05, .32), qi = E.o5(pi), qo = E.io(po);
    // transition: in from below w/ blur, out up + scale + blur (whip)
    s.root.style.transform = `translateY(${(1 - qi) * 70 - qo * 90}px) scale(${lerp(.965, 1, qi) * (1 + qo * .06)})`;
    s.root.style.opacity = clamp(pi * 2) * (1 - qo);
    const bl = (1 - qi) * 16 + qo * 22; s.root.style.filter = bl > .1 ? `blur(${bl}px)` : 'none';
    s.upd(s.ctx, t);
  }
  // camera: slow drift + breathing zoom + shakes
  let sx = 0, sy = 0, rot = 0;
  for (const [ts, amp] of SHAKE) { const k = t - ts; if (k >= 0 && k < .5) { const d = Math.exp(-k * 9) * amp; sx += Math.sin(k * 95) * d; sy += Math.cos(k * 83) * d; rot += Math.sin(k * 60) * d * .04; } }
  const zoom = 1.015 + .015 * Math.sin(t * .35);
  CAM.style.transform = `translate(${Math.sin(t * .5) * 6 + sx}px,${Math.cos(t * .4) * 5 + sy}px) rotate(${rot}deg) scale(${zoom})`;
  BG.style.transform = `translate(${(t * 6) % 60}px,${(t * 4) % 60}px)`;
  let fl = 0; for (const [ts, a] of FLASH) { const k = t - ts; if (k >= 0 && k < .4) fl = Math.max(fl, a * Math.exp(-k * 10)); }
  FL.style.opacity = fl;
  let sk = 0, sp = 0; for (const ts of STREAK) { const k = t - ts; if (k >= -0.05 && k < .3) { sk = Math.max(sk, 1 - Math.abs(k - .07) / .23); sp = k; } }
  ST.style.opacity = clamp(sk) * .9; ST.style.transform = `translateX(${lerp(-500, 500, clamp((sp + .05) / .35))}px) scaleY(${1 + sk * 2})`;
  // header
  hl.style.opacity = hr.style.opacity = hline.style.opacity = clamp(P(t, 0, .4));
  tf(hq, { cx: true, o: clamp(P(t, .3, .4)) * (t > T_realv - .2 ? 1 - P(t, T_realv - .2, .3) : 1) });
  document.getElementById('dot').style.opacity = .5 + .5 * Math.abs(Math.sin(t * 2.4));
  drawCaps(t);
  drawGrain(f);
};
window.SFX = sfx;
window.DUR = 64.4;
window.ready = Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))]);
