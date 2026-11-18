"""python3 chk.py "0.5" [shot ids...]  -> out/chk/sheet_N.jpg with one frame per shot and u (magenta line = top of the caption zone)"""
import json, math, sys, subprocess, os, shutil
from PIL import Image, ImageDraw
c = json.load(open('src/cues.json')); S = c['S']; ks = list(S); T = c['TOTAL']
cut = {k: math.ceil(S[k] * 30 - 1e-4) for k in ks}
us = [float(x) for x in sys.argv[1].split(',')]; ids = sys.argv[2:] or ks
def fr(k, u):
    i = ks.index(k); a = cut[k]; b = (cut[ks[i + 1]] if i + 1 < len(ks) else T) - 1; return round(a + u * (b - a))
want = [(k, u, fr(k, u)) for k in ids for u in us]
shutil.rmtree('out/chk', ignore_errors=True)
r = subprocess.run(['python3', 'render.py', 'out/chk', ','.join(str(f) for _, _, f in want), os.environ.get('SC', '0.4')], capture_output=True, text=True)
print('\n'.join(l for l in r.stdout.splitlines() if 'total' in l or 'rror' in l or 'not ready' in l or 'pageerror' in l)[:1500])
W, H, cols = 270, 480, 8
for n in range(0, len(want), 16):
    part = want[n:n + 16]; sh = Image.new('RGB', (W * cols, H * ((len(part) + cols - 1) // cols)))
    for i, (k, u, f) in enumerate(part):
        p = f'out/chk/f_{f:04d}.jpg'
        if not os.path.exists(p): continue
        im = Image.open(p).resize((W, H)); d = ImageDraw.Draw(im); d.rectangle((0, 0, 70, 14), fill=(0, 0, 0)); d.text((3, 2), f'{k} {u}', fill=(255, 255, 0)); d.line((0, H * .672, W, H * .672), fill=(255, 0, 255))
        sh.paste(im, ((i % cols) * W, (i // cols) * H))
    sh.save(f'out/chk/sheet_{n // 16}.jpg', quality=84)
