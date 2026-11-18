"""Step the page frame by frame in headless Chrome (software WebGL) and save each frame.
   python3 render.py <outdir> <frames: "0,40,90" or "0-182"> [scale]"""
import asyncio, sys, base64, os, time
from playwright.async_api import async_playwright
out, spec = sys.argv[1], sys.argv[2]; scale = sys.argv[3] if len(sys.argv) > 3 else '1'
frames = []
for part in spec.split(','):
    if '-' in part:
        a, b = part.split('-'); frames += list(range(int(a), int(b) + 1))
    else:
        frames.append(int(part))
os.makedirs(out, exist_ok=True)
async def main():
    async with async_playwright() as p:
        exe = os.environ.get('CHROME') or next((c for c in ('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser') if os.path.exists(c)), None)
        b = await p.chromium.launch(executable_path=exe, headless=True,
                                    args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 2000})
        logs = []
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'[:400]))
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {str(e)[:600]}'))
        await pg.goto(f'file://{os.path.dirname(os.path.abspath(__file__))}/web/index.html?s={scale}' + os.environ.get('Q', ''))
        try:
            await pg.wait_for_function('window.READY === true', timeout=120000)
        except Exception as e:
            print('not ready:', str(e)[:200]); print('\n'.join(logs[:30])); await b.close(); return
        t0 = time.time()
        for i, f in enumerate(frames):
            path = f'{out}/f_{f:04d}.jpg'
            if os.environ.get('RESUME') and os.path.exists(path):
                continue
            t1 = time.time()
            await pg.evaluate(f'window.renderFrame({f})')
            data = await pg.evaluate('window.grab(0.96)')
            open(path, 'wb').write(base64.b64decode(data.split(',', 1)[1]))
            print(f, round(time.time() - t1, 1), 's', flush=True)
        print('total', round(time.time() - t0, 1), 's'); print('\n'.join([l for l in logs if 'error' in l.lower() or 'warn' in l.lower()][:20]))
        await b.close()
asyncio.run(main())
