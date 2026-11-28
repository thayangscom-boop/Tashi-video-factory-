"""Generate narration with Piper TTS (local, offline) and write scene timing.

Usage:  /path/to/venv/bin/python -I tools/make_voice.py
Needs:  pip install piper-tts numpy ; voice model in tools/voices/ (see production/README.md)
Writes: public/audio/vo_<id>.wav, public/audio/narration.wav, src/timing.json
"""
import json, subprocess, sys, wave, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIPER = str(pathlib.Path(sys.executable).parent / "piper")
VOICE = ROOT / "tools/voices/en_US-ryan-high.onnx"
FPS = 30
LEAD_IN = 0.15   # seconds before first line
GAP = 0.30       # pause between lines
TAIL = 1.6       # hold after last line
SR = 22050

lines = json.loads((ROOT / "production/lines.json").read_text())
out = ROOT / "public/audio"
out.mkdir(parents=True, exist_ok=True)

def read(p):
    with wave.open(str(p)) as w:
        assert w.getframerate() == SR
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

def trim(x, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    return x[max(idx[0] - 200, 0): idx[-1] + 600] if len(idx) else x

timing, t, chunks = [], LEAD_IN, []
for ln in lines:
    p = out / f"vo_{ln['id']}.wav"
    subprocess.run([PIPER, "-m", str(VOICE), "-f", str(p), "--length-scale", "0.92",
                    "--sentence-silence", "0.18"], input=ln.get("tts", ln["text"]).encode(), check=True,
                   capture_output=True)
    x = trim(read(p))
    dur = len(x) / SR
    # Approximate caption timing: split line duration by character weight,
    # adding weight for punctuation pauses.
    w = [len(c) + (7 if c.rstrip().endswith(('.', '...')) else 3 if c.rstrip().endswith(',') else 0)
         for c in ln["captions"]]
    acc, caps = 0.0, []
    for c, wi in zip(ln["captions"], w):
        s = acc / sum(w) * dur; acc += wi
        caps.append({"text": c, "start": round(s, 3), "end": round(acc / sum(w) * dur, 3)})
    timing.append({"id": ln["id"], "scene": ln["scene"], "start": round(t, 3), "dur": round(dur, 3),
                   "captions": caps})
    chunks.append((t, x))
    t += dur + GAP
total = t - GAP + TAIL
mix = np.zeros(int(total * SR) + 1, dtype=np.float32)
for st, x in chunks:
    i = int(st * SR); mix[i:i + len(x)] += x
mix = mix / max(np.abs(mix).max(), 1e-6) * 0.89
with wave.open(str(out / "narration.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())

frames = int(round(total * FPS))
(ROOT / "src/timing.json").write_text(json.dumps({"fps": FPS, "totalSeconds": round(total, 3),
                                                   "totalFrames": frames, "lines": timing}, indent=1))
print(f"total {total:.2f}s ({frames} frames)")
for l in timing: print(l["id"], l["start"], l["dur"])
