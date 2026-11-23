// usage: node render.js snap t1,t2,... outdir   |   node render.js frames start end out.mp4 [fps]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
(async () => {
  const mode = process.argv[2];
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  await p.evaluate(() => window.ready); await p.waitForTimeout(300);
  if (errs.length) console.error('PAGE ERRORS:', errs.slice(0, 10).join('\n'));
  if (mode === 'snap') {
    const ts = process.argv[3].split(',').map(Number); const out = process.argv[4]; fs.mkdirSync(out, { recursive: true });
    for (const t of ts) { await p.evaluate(t => R(t), t); await p.screenshot({ path: `${out}/t${t.toFixed(2)}.jpg`, type: 'jpeg', quality: 85 }); }
  } else if (mode === 'sfx') {
    fs.writeFileSync(process.argv[3], JSON.stringify(await p.evaluate(() => window.SFX), null, 0));
  } else {
    const [s, e, out] = [+process.argv[3], +process.argv[4], process.argv[5]]; const fps = +(process.argv[6] || 60);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const f0 = Math.round(s * fps), f1 = Math.round(e * fps);
    for (let f = f0; f < f1; f++) {
      await p.evaluate(t => R(t), f / fps);
      const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 120 === 0) console.log(out, f, '/', f1);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
