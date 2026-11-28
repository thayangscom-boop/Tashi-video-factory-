"""Sound for the opening preview. Effects are placed from src/three/openTimeline.json — the same
file the animation reads — so each sound lands on the frame of its action.

Usage: python3 -I tools/make_opening_audio.py     Writes: public/audio/preview_opening.wav
"""
import json, pathlib, subprocess, sys, wave
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import sfxlib as S
from sfxlib import SR, put

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src/three/openTimeline.json").read_text())
DUR = TL["duration"]; N = int(DUR * SR); cuts = TL["cuts"]; strokes = TL["strokes"]; pull = TL["pull"]
sfx = np.zeros(N); amb = np.zeros(N); mus = np.zeros(N); vo = np.zeros(N)
rng = np.random.default_rng(3)

def read(p):
    with wave.open(str(p)) as w:
        sr = w.getframerate(); y = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    return np.interp(np.arange(int(len(y) * SR / sr)) * sr / SR, np.arange(len(y)), y)
def trim(x, thr=0.012):   # same leading-silence trim the caption aligner assumes
    env = np.convolve(np.abs(x), np.ones(int(0.02 * SR)) / int(0.02 * SR), "same"); on = np.where(env > thr)[0]
    return x[on[0]:on[-1] + int(0.05 * SR)]
for v in TL["vo"]: put(vo, v["start"], trim(read(ROOT / "public/audio" / v["file"])))
vo = vo / max(np.abs(vo).max(), 1e-6) * 0.89

def seg_amb(a, b, x, g): put(amb, a, S.fade(x[:int((b - a) * SR)], 0.25, 0.3), g)

# ---- shots 1-2: the crew turning the screws under the hotel ----
seg_amb(0, cuts[2], S.wind(cuts[2] + 0.2), 0.10); seg_amb(0, cuts[2], S.murmur(cuts[2] + 0.2), 0.07)
def stroke(t, g=1.0, inside=False):
    if inside:   # heard from a room upstairs: muffled, plus the room's own rattle
        put(sfx, t, S.lp(S.crew_ratchet(pull), 700), 0.3 * g); put(sfx, t + 0.04, S.lp(S.creak(pull + 0.6, 70), 900), 0.4 * g)
        put(sfx, t + 0.08, S.clink(), 0.22); put(sfx, t + 0.2, S.clink(), 0.12); put(sfx, t + 0.1, S.creak(1.2, 180), 0.1)   # china, then the hanging lamp
        return
    put(sfx, t, S.crew_ratchet(pull, 45), 0.44 * g); put(sfx, t + 0.04, S.creak(pull + 0.5, 78), 0.36 * g)
    put(sfx, t + pull - 0.03, S.thud(0.4, 52), 0.26 * g); put(sfx, t + 0.1, S.dust(1.0), 0.07 * g)
put(sfx, 0.0, S.thud(0.7, 45), 0.35)                       # opens on a low hit
stroke(strokes[0], 0.75); stroke(strokes[1]); stroke(strokes[2], 1.1)   # the first is heard from across the street
hv = TL["hooves"]; k = 0
while hv["t0"] + k * hv["step"] < cuts[1] - 0.05:              # the wagon horse walking past the camera (two hooves land per beat)
    put(sfx, hv["t0"] + k * hv["step"], S.hoof(True), 0.30); put(sfx, hv["t0"] + k * hv["step"] + 0.13, S.hoof(True), 0.22); k += 1
put(amb, 0, S.fade(S.cart(cuts[1] + 0.1), 0.2, 0.25), 0.14)
k = 0
while cuts[1] + 0.2 + k * 0.4 < cuts[2] - 0.2:                        # the timber gang's boots in the trench
    put(sfx, cuts[1] + 0.2 + k * 0.4, S.footstep(False), 0.10); k += 1
# ---- shot 3: inside, with the guests ----
seg_amb(cuts[2], cuts[3], S.lp(S.murmur(cuts[3] - cuts[2] + 0.2), 500), 0.04)
put(sfx, cuts[2] + 0.45, S.clink(), 0.07)                  # cup lifted from its saucer
stroke(strokes[3], 1.0, inside=True)
# ---- shot 4: the lakeside town from the air ----
put(sfx, cuts[3] - 0.5, S.swell(0.8), 0.12)
seg_amb(cuts[3], cuts[4], S.wind(cuts[4] - cuts[3] + 0.2), 0.16)
lap = S.lapping(cuts[4] - cuts[3]); t = S.tt(cuts[4] - cuts[3]); lap = lap[:len(t)] * np.clip((t - 1.2) / 2.0, 0, 1)   # water grows as the camera comes down to it
put(amb, cuts[3], S.fade(lap, 0.1, 0.3), 0.22)
for tg in (6.1, 6.9, 7.7, 8.5, 9.1): put(sfx, tg + rng.uniform(0, 0.2), S.gull(), 0.06 + 0.03 * (tg > 8))
put(sfx, TL["rainFrom"] - 0.6, S.lp(S.thunder(2.5), 250), 0.2)     # far-off thunder as the weather rolls in
# ---- shot 5: rain and mud ----
rn = S.rain(DUR - TL["rainFrom"]); put(amb, TL["rainFrom"], S.fade(rn, 0.7, 0.6), 0.24)
put(sfx, TL["thunder"], S.thunder(3.4), 0.6)
w = TL["mudWalk"]; k = 0
while w["t0"] + k * w["step"] <= w["t1"] + 0.01:
    put(sfx, w["t0"] + k * w["step"], S.squelch(0.34), 0.34 + 0.08 * k); k += 1     # each step sinks deeper and sounds it
put(sfx, TL["tug"] - 0.25, S.squelch(0.5), 0.6); put(sfx, TL["tug"] + 0.05, S.squelch(0.3), 0.3)   # he heaves; the mud holds
put(sfx, TL["slump"], S.squelch(0.3), 0.2)
for h in TL["wagonHeave"]: put(sfx, h - 0.25, S.creak(0.7, 130), 0.14); put(sfx, h, S.squelch(0.3), 0.1); put(sfx, h - 0.1, S.snort(), 0.13)   # the horse throws itself into the collar

# ---- music: driving for the hook, open for the town, uneasy in the rain ----
beat = 60 / 96; bar = 4 * beat
prog = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]
t0, i = 0.0, 0
while t0 < DUR:
    ch = prog[i % 4]; d = min(bar, DUR - t0) + 0.5
    for n in ch: put(mus, t0, S.note(S.hz(n), d), 0.045)
    put(mus, t0, S.note(S.hz(ch[0] - 12), d), 0.06)
    dens = 2 if t0 < cuts[3] - 0.1 else 1
    for b in range(4 * dens):
        tb = t0 + b * beat / dens
        if tb < DUR: put(mus, tb, S.note(S.hz(ch[(b % 3) + 1] + 12), 0.5, "pluck"), 0.04 + 0.015 * (dens - 1))
    t0 += bar; i += 1
mus = S.fade(mus, 0.3, 0.9)

env = np.convolve(np.abs(vo), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
duck = 1 - 0.4 * np.clip(env / 0.05, 0, 1)
mix = vo + sfx * (0.75 + 0.25 * duck) + amb + mus * 0.7 * duck
mix[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
mix /= max(np.abs(mix).max() / 0.95, 1)
tmp = ROOT / "public/audio/_open_raw.wav"
with wave.open(str(tmp), "wb") as wv:
    wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-t", str(DUR), str(ROOT / "public/audio/preview_opening.wav")], check=True)
tmp.unlink(); print("wrote preview_opening.wav", DUR)
