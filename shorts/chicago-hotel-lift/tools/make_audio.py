"""Procedurally synthesize original sound effects + music bed and mix with narration.

All sounds are generated from scratch with numpy (no samples, no licensing issues).
Event times come from src/timing.json so the audio follows the narration.

Usage:  python3 -I tools/make_audio.py      (needs numpy)
Writes: public/audio/sfx.wav, public/audio/music.wav, public/audio/mix.wav
"""
import json, wave, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(7)
T = json.loads((ROOT / "src/timing.json").read_text())
TOTAL = T["totalFrames"] / T["fps"]
N = int(TOTAL * SR)
L = {l["id"]: l for l in T["lines"]}

def cap(i, k):  # absolute time of caption k in line i
    return L[i]["start"] + L[i]["captions"][k]["start"]

def tt(d): return np.arange(int(d * SR)) / SR

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    # vectorised-ish one-pole via cumulative trick is unstable; plain loop in chunks
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def lp_fast(x, fc, passes=2):
    # cheap FFT brick-ish lowpass with soft rolloff
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / fc) ** (2 * passes)); return np.fft.irfft(X, len(x))

def hp_fast(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / max(fc, 1)) ** 4); return np.fft.irfft(X, len(x))

def bp(x, lo, hi): return hp_fast(lp_fast(x, hi), lo)

def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4)); return e

def noise(d): return rng.standard_normal(int(d * SR))

sfx = np.zeros(N); mus = np.zeros(N)

def put(buf, t0, x, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[max(i, 0):j] += g * x[max(0, -i):j - i]

# ---------- sound designs ----------
def whoosh(d=0.7):
    n = noise(d); t = tt(d); e = np.sin(np.pi * t / d) ** 2
    lo = bp(n, 300, 2500) * e; return lo / np.abs(lo).max()

def boom(d=1.8):
    t = tt(d); f = 55 * np.exp(-t * 1.2) + 30
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    x += 0.4 * lp_fast(noise(d), 200) * np.exp(-t * 4); return x / np.abs(x).max()

def click():
    d = 0.035; t = tt(d)
    x = bp(noise(d), 1800, 6000) * np.exp(-t * 180) + 0.5 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 250)
    return x / np.abs(x).max()

def ratchet(count=6, rate=0.06):
    out = np.zeros(int((count * rate + 0.1) * SR))
    for k in range(count):
        c = click() * (0.7 + 0.3 * rng.random()); i = int(k * rate * SR + rng.normal(0, 0.003) * SR)
        i = max(i, 0); out[i:i + len(c)] += c
    return out / np.abs(out).max()

def crowd_ratchet(d=0.9, men=40):
    """Many workers turning screws at once: dense, slightly spread clicks."""
    out = np.zeros(int((d + 0.2) * SR))
    for m in range(men):
        st = rng.normal(0.05, 0.04)
        r = ratchet(3, 0.07 + rng.random() * 0.02)
        i = int(max(st, 0) * SR); out[i:i + len(r)] += r * rng.uniform(0.3, 1)
    return out / np.abs(out).max()

def creak(d=1.4, f0=90):
    t = tt(d); f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 0.7 * t) + 0.05 * rng.standard_normal(len(t)).cumsum() / 300)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.5 + np.sin(ph * 3) * 0.3
    x = bp(x, 150, 1800) * np.sin(np.pi * t / d) ** 1.5
    return x / np.abs(x).max()

def thunder(d=3.5):
    t = tt(d); n = lp_fast(noise(d), 350)
    e = np.exp(-t * 1.1) * (0.6 + 0.4 * np.abs(lp_fast(noise(d), 6)) * 4)
    x = n * e; x[: int(0.06 * SR)] *= np.linspace(0, 1, int(0.06 * SR)); return x / np.abs(x).max()

def rain(d):
    n = bp(noise(d), 1200, 9000) * 0.5
    drops = np.zeros(len(n)); idx = rng.integers(0, len(n) - 400, int(d * 120))
    for i in idx: drops[i:i + 300] += np.exp(-np.arange(300) / 40) * rng.uniform(0.2, 1)
    x = n + 0.6 * hp_fast(drops * rng.standard_normal(len(drops)), 2000)
    f = np.minimum(1, np.minimum(tt(d) / 0.6, (d - tt(d)) / 0.8)); return x / np.abs(x).max() * f

def squelch(d=0.45):
    t = tt(d); f = 180 + 500 * (t / d) ** 0.6
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * lp_fast(noise(d), 40) * 5)
    x = lp_fast(x + 0.5 * lp_fast(noise(d), 900), 1200) * np.sin(np.pi * t / d)
    return x / np.abs(x).max()

def drip():
    d = 0.25; t = tt(d); f = 900 + 1400 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25); return x

def drone(d, f=55):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * h * t + h) / h for h in (1, 2, 3.01, 4.02))
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t); x *= np.minimum(1, np.minimum(t / 1.0, (d - t) / 1.0))
    return x / np.abs(x).max()

def paper(d=0.6):
    t = tt(d); x = bp(noise(d), 2000, 8000) * (0.4 + 0.6 * np.abs(lp_fast(noise(d), 30)) * 6) * np.sin(np.pi * t / d)
    return x / np.abs(x).max()

def clank(f=420):
    d = 1.0; t = tt(d)
    x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (6 + 3 * k)) for k, m in enumerate((1, 2.76, 5.4, 8.9)))
    x += 0.5 * bp(noise(d), 1000, 5000) * np.exp(-t * 60); return x / np.abs(x).max()

def thud(d=0.5):
    t = tt(d); x = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 10)
    x += 0.6 * lp_fast(noise(d), 600) * np.exp(-t * 18); return x / np.abs(x).max()

def dirt_pour(d=1.6):
    t = tt(d); x = bp(noise(d), 200, 3000) * (0.5 + 0.5 * np.abs(lp_fast(noise(d), 15)) * 5)
    return x / np.abs(x).max() * np.sin(np.pi * t / d)

def rumble(d=2.0):
    t = tt(d); x = lp_fast(noise(d), 120) * np.sin(np.pi * t / d); return x / np.abs(x).max()

def bell():
    d = 1.6; t = tt(d)
    x = sum(a * np.sin(2 * np.pi * 1320 * m * t) * np.exp(-t * dcy) for a, m, dcy in
            ((1, 1, 2.5), (0.5, 2.0, 4), (0.35, 2.76, 5), (0.2, 5.4, 8)))
    return x / np.abs(x).max()

def murmur(d):
    """Crowd chatter: many band-passed noise 'syllables' with random pitch."""
    out = np.zeros(int(d * SR)); base = bp(noise(d), 250, 1800)
    am = np.abs(lp_fast(noise(d), 8)); am = am / am.max()
    x = base * (0.35 + 0.65 * am)
    f = np.minimum(1, np.minimum(tt(d) / 0.8, (d - tt(d)) / 0.8))
    return x / np.abs(x).max() * f

def whistle(d=0.9):
    t = tt(d); f = 2100 + 120 * np.sin(2 * np.pi * 28 * t) * (t > 0.15)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.08)
    x += 0.15 * bp(noise(d), 1800, 4000) * np.minimum(1, (d - t) / 0.08)
    return x / np.abs(x).max()

def clink():
    d = 0.6; t = tt(d)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in ((3100, 9), (4870, 12), (6300, 16)))
    return x / np.abs(x).max()

def snore(d=1.6):
    t = tt(d); x = lp_fast(noise(d), 300) * np.sin(np.pi * t / d) ** 2 * (1 + np.sin(2 * np.pi * 28 * t))
    return x / np.abs(x).max()

def cheer(d=2.6):
    t = tt(d); x = bp(noise(d), 400, 3500) * (np.minimum(1, t / 0.4) * np.exp(-np.maximum(t - 1.0, 0) * 1.3))
    x *= 0.7 + 0.3 * np.abs(lp_fast(noise(d), 12)) * 5; return x / np.abs(x).max()

def swell(d=1.2):
    t = tt(d); x = bp(noise(d), 200, 6000) * (t / d) ** 3; return x / np.abs(x).max()

# ---------- timeline ----------
starts = [L[k]["start"] for k in L]
for s in starts[1:]:
    put(sfx, s - 0.35, whoosh(), 0.22)                    # scene transitions
put(sfx, 0.0, boom(), 0.55)
put(sfx, 0.05, whoosh(0.9), 0.25)
# s1 hook: crank clicks + hotel creaks as it rises
for k in np.arange(0.4, L["s2"]["start"] - 0.4, 0.55): put(sfx, k, ratchet(4, 0.06), 0.16)
put(sfx, 0.9, creak(1.8, 85), 0.25); put(sfx, 3.0, creak(1.6, 105), 0.22)
put(sfx, cap("s1", 4), crowd_ratchet(), 0.22)
# s2 mud & rain
s = L["s2"]["start"]; d2 = L["s3"]["start"] - s
put(sfx, s - 0.2, rain(d2 + 0.6), 0.22); put(sfx, s + 0.5, thunder(), 0.45)
for k, g in ((cap("s2", 4) + 0.2, .5), (cap("s2", 5), .55), (cap("s2", 5) + 0.6, .55), (cap("s2", 6), .7), (cap("s2", 6) + 0.7, .8)):
    put(sfx, k, squelch(), g * 0.55)
put(sfx, cap("s2", 2), creak(1.2, 140), 0.12)
# s3 disease: drips + drone
s = L["s3"]["start"]; d3 = L["s4"]["start"] - s
put(sfx, s - 0.2, drone(d3 + 0.4, 49), 0.20)
for k in np.arange(s + 0.2, s + d3, 0.62): put(sfx, k + rng.uniform(0, .15), drip(), 0.18)
# s4 plan
put(sfx, cap("s4", 2), paper(), 0.35)
put(sfx, cap("s4", 3) + 0.2, clank(380), 0.28); put(sfx, cap("s4", 4) + 0.3, clank(450), 0.25)
for k in (0, .45, .9): put(sfx, cap("s4", 5) + k, thud(), 0.35); put(sfx, cap("s4", 5) + k + .05, dirt_pour(0.4), 0.15)
put(sfx, cap("s4", 6), rumble(2.2), 0.45); put(sfx, cap("s4", 7) + 0.5, boom(1.0), 0.3)
# s5 sunken buildings
put(sfx, cap("s5", 0) + 0.3, dirt_pour(1.4), 0.2)
put(sfx, cap("s5", 2), creak(0.7, 220), 0.25); put(sfx, cap("s5", 4) + 0.1, thud(), 0.55)
put(sfx, cap("s5", 4) + 0.3, dirt_pour(0.9), 0.25)
# s6 tremont
s = L["s6"]["start"]; d6 = L["s7"]["start"] - s
put(sfx, s, murmur(d6 + 0.3), 0.13); put(sfx, cap("s6", 0) + 0.4, bell(), 0.25)
put(sfx, cap("s6", 2), rumble(1.8), 0.4); put(sfx, cap("s6", 2) + .2, creak(1.6, 70), 0.22)
put(sfx, cap("s6", 5) + 0.6, thud(0.4), 0.3)
# s7 jackscrews
s = L["s7"]["start"]; d7 = L["s8"]["start"] - s
put(sfx, s, murmur(d7), 0.10)
for k in (cap("s7", 3), cap("s7", 3) + .4, cap("s7", 4), cap("s7", 4) + .35): put(sfx, k, clank(520 + rng.uniform(-60, 60)), 0.12)
put(sfx, cap("s7", 5) + 0.1, whistle(), 0.33)
for k in (cap("s7", 7) + 0.3, cap("s7", 8) + 0.1, cap("s7", 9) + 0.1):
    put(sfx, k, crowd_ratchet(), 0.4); put(sfx, k + .1, creak(0.9, 80), 0.25)
# s8 rise
s = L["s8"]["start"]
put(sfx, s, creak(3.0, 75), 0.25)
for k in np.arange(s + 0.2, L["s9"]["start"] - 0.3, 0.9): put(sfx, k, crowd_ratchet(0.6, 25), 0.18)
put(sfx, cap("s8", 4) + 0.2, clink(), 0.3); put(sfx, cap("s8", 4) + 0.45, clink(), 0.2)
put(sfx, cap("s8", 5), snore(), 0.22); put(sfx, cap("s8", 6) + 0.3, bell(), 0.28)
# s9 outro
put(sfx, cap("s9", 2) - 1.1, swell(), 0.25); put(sfx, cap("s9", 2), boom(1.4), 0.3)
put(sfx, cap("s9", 2) + 0.1, cheer(), 0.22)

# ---------- original music bed ----------
def note(f, d, kind="pad"):
    t = tt(d)
    if kind == "pad":
        x = sum(np.sin(2 * np.pi * f * m * t + rng.random() * 6) / (m ** 1.3) for m in (1, 2, 3, 4, 5))
        x += sum(np.sin(2 * np.pi * f * 1.003 * m * t) / (m ** 1.6) for m in (1, 2, 3)) * 0.6
        e = np.minimum(1, t / 0.9) * np.minimum(1, (d - t) / 0.9)
    else:  # pluck
        x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (5 + 3 * m)) / m for m in (1, 2, 3, 4))
        e = np.minimum(1, t / 0.004)
    return x * e

def hz(n): return 440 * 2 ** ((n - 69) / 12)
BPM = 96; beat = 60 / BPM; bar = 4 * beat
prog_tense = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]   # Dm Bb C A
prog_up = [[50, 57, 62, 66], [55, 59, 62, 67], [52, 57, 61, 64], [50, 57, 62, 66]]   # D G A D (major)
outro_t = L["s9"]["start"] - 0.3
t0, i = 0.0, 0
while t0 < TOTAL:
    prog = prog_up if t0 >= outro_t - 0.01 else prog_tense
    ch = prog[i % 4]; d = min(bar, TOTAL - t0) + 0.6
    for n in ch: put(mus, t0, note(hz(n), d), 0.05)
    put(mus, t0, note(hz(ch[0] - 12), d), 0.07)
    # pulse: plucked arpeggio, builds in jackscrew scenes
    dens = 2 if L["s7"]["start"] <= t0 < outro_t else 1
    for b in range(4 * dens):
        tb = t0 + b * beat / dens
        if tb < TOTAL: put(mus, tb, note(hz(ch[(b % 3) + 1] + 12), 0.5, "pluck"), 0.045 + 0.02 * (dens - 1))
    t0 += bar; i += 1
    if t0 > outro_t and prog is prog_tense: t0 = outro_t; i = 0
# fades
fade = np.ones(N); fi = int(0.6 * SR); fo = int(1.4 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo); mus *= fade

def write(p, x, ch=1):
    x = np.clip(x, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def read(p):
    with wave.open(str(p)) as w:
        sr = w.getframerate(); y = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    xi = np.arange(int(len(y) * SR / sr)) * sr / SR  # resample to 44.1k
    return np.interp(xi, np.arange(len(y)), y)

vo = np.zeros(N); v = read(ROOT / "public/audio/narration.wav"); vo[:min(N, len(v))] = v[:N]
# duck music + sfx under narration
venv = np.convolve(np.abs(vo), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
duck = 1 - 0.45 * np.clip(venv / 0.05, 0, 1)
mix = vo * 1.0 + sfx * (0.6 + 0.4 * duck) + mus * 0.7 * duck
mix /= max(np.abs(mix).max() / 0.95, 1)
out = ROOT / "public/audio"
write(out / "sfx.wav", sfx / max(np.abs(sfx).max(), 1)); write(out / "music.wav", mus)
write(out / "mix.wav", mix)
print("audio written", TOTAL, "s; peak", np.abs(mix).max())
