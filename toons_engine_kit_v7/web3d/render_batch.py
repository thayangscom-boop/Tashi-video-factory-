"""Full render, safe for command time limits: renders missing frames of out/full with two browsers for at most N seconds, then stops cleanly.
   Run it again and again (python3 render_batch.py 560) until it prints "left 0". Existing frames are kept."""
import os, subprocess, sys, json, time, glob
from PIL import Image
N = json.load(open('src/cues.json'))['TOTAL']; T = int(sys.argv[1]) if len(sys.argv) > 1 else 560
def ok(f):
    p = f'out/full/f_{f:04d}.jpg'; return os.path.exists(p) and os.path.getsize(p) > 20000
miss = [f for f in range(N) if not ok(f)][:400]
if miss:
    ps = [subprocess.Popen(['python3', 'render.py', 'out/full', ','.join(map(str, x)), '1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) for x in (miss[::2], miss[1::2]) if x]
    t0 = time.time()
    while time.time() - t0 < T and any(p.poll() is None for p in ps): time.sleep(2)
    for p in ps:
        if p.poll() is None: p.terminate()
    time.sleep(1); subprocess.run(['pkill', '-f', 'chrome'])
    for p in sorted(glob.glob('out/full/f_*.jpg'), key=os.path.getmtime)[-6:]:
        try: Image.open(p).load()
        except Exception: os.remove(p)
print('left', len([f for f in range(N) if not ok(f)]))
