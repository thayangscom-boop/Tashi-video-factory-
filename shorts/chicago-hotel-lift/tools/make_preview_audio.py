"""Sound for the lift preview. Every effect is placed from src/three/liftTimeline.json — the same
file the animation reads — so sounds land on the frames where the actions happen.

Usage: python3 -I tools/make_preview_audio.py   (numpy; then loudness-normalised with ffmpeg)
Writes: public/audio/preview_lift.wav
"""
import json, math, pathlib, subprocess, sys, wave
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import sfxlib as S
from sfxlib import SR, put

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src/three/liftTimeline.json").read_text())
DUR = TL["duration"]; N = int(DUR * SR)
cuts = TL["cuts"]; strokes = TL["strokes"]; pull = TL["pull"]; T0, T1 = TL["timelapse"]
sfx = np.zeros(N); amb = np.zeros(N); mus = np.zeros(N); vo = np.zeros(N)
rng = np.random.default_rng(5)

def read(p):
    with wave.open(str(p)) as w:
        sr = w.getframerate(); y = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    return np.interp(np.arange(int(len(y) * SR / sr)) * sr / SR, np.arange(len(y)), y)

# ---- narration ----
for v in TL["vo"]:
    x = read(ROOT / "public/audio" / v["file"])
    if "cut" in v:
        n = int(v["cut"] * SR); x = x[:n]; f = int(0.06 * SR); x[-f:] *= np.linspace(1, 0, f)
    put(vo, v["start"], x)
vo = vo / max(np.abs(vo).max(), 1e-6) * 0.89

# ---- ambience: open street by day, calmer at dusk ----
put(amb, 0, S.wind(DUR), 0.10)
put(amb, 0, S.murmur(DUR), 0.06)
for t in np.arange(0.4, 10.0, 0.9):                      # sparrows while it is daytime
    for k in range(rng.integers(1, 4)): put(amb, t + rng.uniform(0, 0.5) + k * 0.11, S.chirp(), 0.035)
for a, b in ((0, cuts[2]), (cuts[4], cuts[6])):           # handcart rumbling along the new street (shots that show it)
    put(amb, a, S.cart(b - a), 0.07)

# ---- shot 1: Pullman and partners walk the boardwalk ----
w = TL["walks"]["pullman"]; k = 1
while w["t0"] + k * w["step"] <= w["t1"] + 0.01:
    t = w["t0"] + k * w["step"]; put(sfx, t, S.footstep(), 0.30); put(sfx, t + 0.11, S.footstep(), 0.13); put(sfx, t + 0.2, S.footstep(), 0.10); k += 1
put(sfx, w["t1"] + 0.2, S.footstep(), 0.2)               # the half-step as he turns to the rail
# ---- shot 2: men come down the plank ramp with jacks and timber; one jack is pushed home ----
w = TL["walks"]["carriers"]
for i in range(7):
    k = 0
    while w["t0"] + i * 0.13 + k * w["step"] < w["t1"]:
        put(sfx, w["t0"] + i * 0.13 + k * w["step"], S.footstep(), 0.09 + 0.05 * (i < 3)); k += 1
for t in (2.6, 3.15, 3.55): put(sfx, t, S.clank(600 + rng.uniform(-80, 80)), 0.05)   # iron knocking on shoulders
put(sfx, 3.75, S.scrape(TL["jackSet"] - 3.75), 0.22)
put(sfx, TL["jackSet"], S.clank(330), 0.32); put(sfx, TL["jackSet"], S.thud(0.3), 0.3)
# ---- shot 3: the whistle, the whip-pan, the first turn ----
put(sfx, TL["whistle"], S.whistle(0.34), 0.36)
put(sfx, TL["whip"] - 0.17, S.whoosh(0.34), 0.25)
def stroke(t, close=False, g=1.0):
    if close:   # one jack, right in front of the lens
        put(sfx, t, S.ratchet(6, pull / 6), 0.5 * g); put(sfx, t + 0.02, S.creak(pull + 0.3, 110), 0.4 * g)
    else:       # the whole crew
        put(sfx, t, S.crew_ratchet(pull), 0.42 * g); put(sfx, t + 0.04, S.creak(pull + 0.5, 78), 0.34 * g)
    put(sfx, t + pull - 0.03, S.thud(0.35, 55), 0.22 * g)   # the building settles onto the screws
    put(sfx, t + 0.1, S.dust(1.0), 0.07 * g)
stroke(strokes[0])
stroke(strokes[1], close=True)                            # shot 4: screw close-up
stroke(strokes[2]); stroke(strokes[3])                    # shot 5: high angle, twice
# ---- time-lapse: rapid turns, the building climbing ----
put(sfx, cuts[5] - 0.6, S.swell(0.9), 0.14)
k = 0
while T0 + (k + 0.25) / 3.2 < T1:
    put(sfx, T0 + (k + 0.25) / 3.2, S.ratchet(3, 0.05), 0.17); k += 1
t = S.tt(T1 - T0); rise = np.sin(2 * np.pi * np.cumsum(90 + 110 * (t / (T1 - T0)) ** 1.5) / SR) * np.sin(np.pi * t / (T1 - T0)) ** 0.7
put(sfx, T0, S.lp(rise, 900), 0.12); put(sfx, T0, S.creak(T1 - T0, 70), 0.16)
put(sfx, T1, S.thud(0.6, 48), 0.4)                        # arrives at grade
# ---- payoff: gangplank, guest steps out, applause, hat tip ----
put(sfx, 12.03, S.scrape(TL["plank"] - 12.03), 0.3)
put(sfx, TL["plank"], S.wood_knock(110), 0.55); put(sfx, TL["plank"], S.thud(0.4, 60), 0.4); put(sfx, TL["plank"] + 0.09, S.wood_knock(140), 0.2)
w = TL["walks"]["guest"]; k = 1
while w["t0"] + k * w["step"] <= w["t1"] + 0.01:
    put(sfx, w["t0"] + k * w["step"], S.footstep(), 0.36); k += 1
k = math.ceil((TL["plank"] + 0.3) * 13 / math.pi)
while k * math.pi / 13 < DUR - 0.25:
    put(sfx, k * math.pi / 13, S.clap(), 0.16); k += 1    # the lady's hands meet every pi/13 s in the animation
put(sfx, TL["hatTip"], S.bell(), 0.14)

# ---- music: tense pulse while they work, resolves to major as the hotel reaches the street ----
beat = 60 / 96; bar = 4 * beat
tense = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]
bright = [[50, 57, 62, 66], [55, 59, 62, 67], [52, 57, 61, 64], [50, 57, 62, 66]]
t0, i = 0.0, 0
while t0 < DUR:
    major = t0 >= cuts[5] - 0.05; ch = (bright if major else tense)[i % 4]; d = min(bar, DUR - t0) + 0.5
    for n in ch: put(mus, t0, S.note(S.hz(n), d), 0.045)
    put(mus, t0, S.note(S.hz(ch[0] - 12), d), 0.06)
    dens = 2 if (t0 >= cuts[2] or major) else 1
    for b in range(4 * dens):
        tb = t0 + b * beat / dens
        if tb < DUR: put(mus, tb, S.note(S.hz(ch[(b % 3) + 1] + 12), 0.5, "pluck"), 0.04 + 0.015 * (dens - 1))
    t0 += bar; i += 1
    if (not major) and t0 > cuts[5] - 0.05: t0 = cuts[5] - 0.05; i = 0
fade = np.ones(N); fi = int(0.4 * SR); fo = int(0.9 * SR); fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
mus *= fade; amb *= fade

env = np.convolve(np.abs(vo), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
duck = 1 - 0.4 * np.clip(env / 0.05, 0, 1)
mix = vo + sfx * (0.75 + 0.25 * duck) + amb + mus * 0.7 * duck
mix /= max(np.abs(mix).max() / 0.95, 1)
tmp = ROOT / "public/audio/_preview_lift_raw.wav"
with wave.open(str(tmp), "wb") as wv:
    wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-t", str(DUR), str(ROOT / "public/audio/preview_lift.wav")], check=True)
tmp.unlink()
print("wrote preview_lift.wav", DUR, "s")
