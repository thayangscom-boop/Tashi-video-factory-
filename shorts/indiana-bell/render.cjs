// node render.cjs out.mp4 W H fps [still-seconds...]  — same frame protocol as the claude-3d-animated-shorts engine,
// but serves the repository root so this page can import that engine's modules without copying or modifying them.
// Env: CHROME (browser path), CHROME_ARGS (Linux/cloud: --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader)
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), ENG = path.join(ROOT, '.claude/skills/claude-3d-animated-shorts/engine');
const puppeteer = require(path.join(ENG, 'node_modules/puppeteer-core'));
const [, , OUT = 'out/preview.mp4', w = '540', h = '960', fps = '30', ...stills] = process.argv;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise(res => srv.listen(0, '127.0.0.1', res));
  const port = srv.address().port;
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: true, args: (process.env.CHROME_ARGS || '').split(' ').filter(Boolean) });
  const page = await browser.newPage(); page.on('pageerror', e => console.log('PAGE ERROR', e.message)); page.on('console', m => { const s = m.text(); if (!/THREE\.|404/.test(s)) console.log('console:', s); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) console.log('HTTP', r.status(), r.url()); });
  await page.goto(`http://127.0.0.1:${port}/shorts/indiana-bell/index.html?w=${w}&h=${h}`); await page.waitForFunction('window.ready', { timeout: 300000 });
  const dir = path.join(__dirname, path.dirname(OUT)); fs.mkdirSync(dir, { recursive: true });
  if (stills.length) { for (const s of stills) { const d = await page.evaluate(t => window.frame(t), +s); fs.writeFileSync(path.join(dir, `still-${s}.jpg`), Buffer.from(d.split(',')[1], 'base64')); } }
  else { const dur = await page.evaluate(() => window.DUR), n = Math.round(dur * +fps), t0 = Date.now();
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', fps, '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', path.join(__dirname, OUT)]);
    const done = new Promise(r => ff.on('close', r));
    for (let f = 0; f < n; f++) { const d = await page.evaluate(t => window.frame(t), f / +fps); if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if (f % 30 === 0) console.log(`${f}/${n}`); }
    ff.stdin.end(); await done; console.log(`${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${OUT}`); }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
