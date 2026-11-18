"""Engine frames (web3d/out/full) -> labels + locked captions (no background) + whip blur + flash -> x264 -> add mix_loud.wav.
   python3 assemble.py out.mp4 [first last]   (a frame range makes a silent test clip)"""
import sys, os, json, subprocess, numpy as np, cv2, skia
ROOT = os.path.dirname(os.path.abspath(__file__)); os.chdir(ROOT); sys.path.insert(0, ROOT)
import captions, shots as nshots
FPS = 30; N = nshots.C['TOTAL']; FRD = f'{ROOT}/web3d/out/full'
out = sys.argv[1]; A, B = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (0, N - 1)
CUTF = [round(s.t0 * FPS) for s in nshots.SHOTS] + [N]; NAMES = [s.name for s in nshots.SHOTS]
def load(f, small=False):
    im = cv2.imread(f'{FRD}/f_{f:04d}.jpg', cv2.IMREAD_COLOR)
    if im is None: raise SystemExit(f'missing or broken frame {f}')
    if small: return cv2.cvtColor(cv2.resize(im, (270, 480), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    if im.shape[1] != 1080:
        im = cv2.resize(im, (1080, 1920), interpolation=cv2.INTER_LANCZOS4)
        im = cv2.addWeighted(im, 1.3, cv2.GaussianBlur(im, (0, 0), 1.1), -0.3, 0)        # give back the edge lost in the enlargement
    return cv2.cvtColor(im, cv2.COLOR_BGR2RGBA)
# caption colour per shot, by the locked rule: black only if the caption zone is bright in all three samples
def zone_lum(rgb):
    h, w = rgb.shape[:2]; reg = rgb[int(h * 0.672):int(h * 0.802), int(w * 0.11):int(w * 0.89), :3].astype(np.float32) / 255
    return float((0.2126 * reg[..., 0] + 0.7152 * reg[..., 1] + 0.0722 * reg[..., 2]).mean())
BRIGHT = {}
def shot_tone(k):
    a, b = CUTF[k], CUTF[k + 1] - 1
    fr = [load(min(B, max(A, round(a + (b - a) * u))), True) for u in (0.2, 0.5, 0.85)]
    v = [captions.tone_of(x) for x in fr]; BRIGHT[k] = max(zone_lum(x) for x in fr) > 0.42
    return 'ink' if v.count('ink') == 3 else 'white'
def shot_of(f):
    k = 0
    for i in range(len(NAMES)):
        if CUTF[i] <= f: k = i
    return k
live = sorted({shot_of(f) for f in range(A, B + 1)})
TONE = {k: shot_tone(k) for k in live}
print('caption colour per shot:', ' '.join(f"{NAMES[k]}:{'B' if TONE[k] == 'ink' else 'W' if BRIGHT[k] else 'w'}" for k in live))
# labels: (shot, parts, start after the cut, x, baseline y, scale)
c_ = nshots.CUT
LABELS = nshots.LABELS
def label_tone(k):
    a, b = CUTF[k], CUTF[k + 1] - 1; v = []
    for u in (0.2, 0.5, 0.85):
        rgb = load(min(B, max(A, round(a + (b - a) * u))), True); reg = rgb[int(480 * 0.062):int(480 * 0.115), 8:int(270 * 0.62)].astype(np.float32) / 255
        lum = 0.2126 * reg[..., 0] + 0.7152 * reg[..., 1] + 0.0722 * reg[..., 2]; v.append(lum.mean() > 0.58 and np.percentile(lum, 25) > 0.42)
    return 'ink' if all(v) else 'white'
LT = {name: label_tone(NAMES.index(name)) for name, *_ in LABELS if NAMES.index(name) in live}
LT = {k: 'white' for k in LT}           # labels: white with the stronger halo reads over sky, roofs and walls alike
FLASH = round(nshots.FLASH_AT * FPS) if nshots.FLASH_AT is not None else -99; FL = [0.95, 0.7, 0.42, 0.2, 0.08]
WHIP = {}                                            # whip pans: sideways motion blur (px) on the frames around these cuts
for nm in nshots.WHIP_BLUR:
    _c = CUTF[NAMES.index(nm)]
    for k, w in enumerate([18, 40, 70, 110]): WHIP[_c - 4 + k] = w; WHIP[_c + 3 - k] = w
tmp = out.replace('.mp4', '_v.mp4') if len(sys.argv) <= 3 else out
enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1080x1920', '-r', str(FPS), '-i', '-',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-movflags', '+faststart', tmp], stdin=subprocess.PIPE)
for f in range(A, B + 1):
    arr = load(f); gt = f / FPS; k = shot_of(f)
    if f in WHIP: arr = cv2.blur(arr, (WHIP[f] | 1, 1))
    if 0 <= f - FLASH < len(FL):
        a = FL[f - FLASH]; arr[..., :3] = (arr[..., :3].astype(np.float32) * (1 - a) + 255 * a).astype(np.uint8)
    arr = np.ascontiguousarray(arr); surf = skia.Surface(arr); c = surf.getCanvas()
    for name, parts, delay, x, y, sc in LABELS:
        j = NAMES.index(name)
        if j == k:
            t0, t1 = CUTF[j] / FPS, CUTF[j + 1] / FPS
            captions.BOOST = LT[name] == 'white'
            captions.chip(c, parts, x, y, gt - t0 - delay, align='left' if x < 300 else 'center', scale=sc, out=gt - (t1 - 0.2) if j + 1 < len(NAMES) else None, tone=LT[name])
    captions.TONE = TONE[k]; captions.BOOST = TONE[k] == 'white' and BRIGHT[k]; captions.draw_caption(c, gt, arr); surf.flushAndSubmit()
    enc.stdin.write(arr.tobytes())
enc.stdin.close(); enc.wait()
if len(sys.argv) <= 3:
    dur = N / FPS
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-i', f'{ROOT}/mix_loud.wav', '-map', '0:v', '-map', '1:a', '-t', f'{dur:.3f}',
                    '-af', f'afade=t=out:st={dur - 0.45:.3f}:d=0.45', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], check=True)
    os.remove(tmp)
print('wrote', out)
