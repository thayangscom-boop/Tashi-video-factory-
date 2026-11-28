"""Align caption chunks to the real pauses in the narration audio.

timing.json estimates caption times from character counts alone. This script builds a word-level
map from text position to time, anchored at every punctuation mark that has a real silence in the
voice file near where the estimate expects it. Caption chunks then start where their first word does.

Usage: python3 -I tools/align_captions.py s1:0.15 s2:5.66   ->  src/three/openCaptions.json
"""
import json, pathlib, sys, wave
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
TIMING = json.loads((ROOT / "src/timing.json").read_text())

def find_pauses(path, min_len=0.05):
    with wave.open(str(path)) as w:
        sr = w.getframerate(); y = np.abs(np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768)
    win = int(0.02 * sr); env = np.convolve(y, np.ones(win) / win, "same")
    on = np.where(env > 0.012)[0]; first, last = on[0], on[-1]
    quiet = env < 0.012; found = []; i = first
    while i < last:
        if quiet[i]:
            j = i
            while j < last and quiet[j]: j += 1
            if (j - i) / sr >= min_len: found.append(((i - first) / sr, (j - first) / sr))
            i = j
        else:
            i += 1
    return found, (last - first) / sr

def align(line):
    caps = [c["text"] for c in line["captions"]]
    words = " ".join(caps).split()
    ps, dur = find_pauses(ROOT / "public/audio" / f"vo_{line['id']}.wav")
    cum = np.cumsum([0] + [len(w) + 1 for w in words]); total = cum[-1]
    pts = [(0.0, 0.0)]; used = -1                      # (character position, time)
    for i, w in enumerate(words[:-1]):
        if not w.rstrip().endswith((",", ".", "...")): continue
        est = dur * cum[i + 1] / total
        cand = [(abs((a + b) / 2 - est), k) for k, (a, b) in enumerate(ps) if k > used]
        if not cand: continue
        d, k = min(cand)
        if d > 0.75: continue
        used = k; pts.append((cum[i + 1] - 1.0, ps[k][0])); pts.append((float(cum[i + 1]), ps[k][1] - 0.03))
    pts.append((float(total), dur))
    xs, ts = zip(*pts)
    starts = []; wi = 0
    for c in caps:
        starts.append(float(np.interp(cum[wi], xs, ts))); wi += len(c.split())
    starts.append(dur)
    return [{"text": c, "start": round(starts[k], 3), "end": round(starts[k + 1], 3)} for k, c in enumerate(caps)], dur, ps

result = []
for arg in sys.argv[1:]:
    lid, st = arg.split(":"); line = next(l for l in TIMING["lines"] if l["id"] == lid)
    caps, dur, ps = align(line)
    result.append({"id": lid, "scene": line["scene"], "start": float(st), "dur": round(dur, 3), "captions": caps})
    print("pauses:", [(round(float(st) + a, 2), round(b - a, 2)) for a, b in ps])
    for c in caps: print(f"{float(st) + c['start']:6.2f}  {c['text']}")
    print(f"{float(st) + dur:6.2f}  (end {lid})")
(ROOT / "src/three/openCaptions.json").write_text(json.dumps(result, indent=1))
