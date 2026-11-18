"""Sound mix: narration (EQ + levelling) + synthesised effects from shots.py, optional plucked-strings bed (shots.MUSIC), ducked under the voice -> mix.wav"""
import os, sys, numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
import shots as render
stage = render
from timing import at

SR = 44100
vo, vsr = sf.read(f'{ROOT}/vo_full.wav')
vo = resample_poly(vo, 147, 80)
N = len(vo)
rng = np.random.default_rng(3)

def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)

def whoosh(dur=0.32, lo=400, hi=2600):
    n = int(dur * SR); x = rng.normal(0, 1, n)
    out = np.zeros(n); low = band = 0.0; q = 0.6
    for i in range(n):
        f = lo + (hi - lo) * np.sin(np.pi * i / n)
        fc = 2 * np.sin(np.pi * f / SR)
        low += fc * band; high = x[i] - low - q * band; band += fc * high
        out[i] = band
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * 0.5
def sparkle(n_notes=5):
    n = int(0.9 * SR); out = np.zeros(n); t = np.arange(n) / SR
    for k in range(n_notes):
        f = rng.choice([2093, 2349, 2637, 3136, 3520, 4186]); off = int(k * 0.06 * SR); tt = t[:n - off]
        out[off:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * 0.25 + np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * 14) * 0.08
    return out
def pop(f0=620, f1=180, dur=0.12):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.6
def thud():
    n = int(0.6 * SR); t = np.arange(n) / SR
    f = 110 * (45 / 110) ** (t / 0.3)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + hp(rng.normal(0, 1, n), 1500) * np.exp(-t * 60) * 0.4) * 0.8
def chaching():
    n = int(1.1 * SR); t = np.arange(n) / SR
    out = bp(rng.normal(0, 1, n), 800, 4000) * np.exp(-t * 40) * 0.5
    for (start, fs) in [(0.08, [2350, 3410, 5120]), (0.16, [2780, 4030, 6050])]:
        o = int(start * SR); tt = t[:n - o]
        for i, f in enumerate(fs):
            out[o:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * (5 + i * 3)) * (0.22 / (i + 1))
    return out
def whistle(f0=1300, f1=260, dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur) * (1 + 0.015 * np.sin(2 * np.pi * 7 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 0.5 * 0.25
def clop():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (bp(rng.normal(0, 1, n), 600, 2500) * np.exp(-t * 80) + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 60) * 0.5) * 0.6
def step():
    n = int(0.09 * SR); t = np.arange(n) / SR
    return (lp(rng.normal(0, 1, n), 700) * np.exp(-t * 60) * 1.4 + np.sin(2 * np.pi * 150 * t) * np.exp(-t * 50) * 0.5) * 0.5
def chug():
    n = int(0.14 * SR); t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 250, 1400) * np.exp(-t * 28) * 0.6
def dig():
    n = int(0.3 * SR); t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 900, 5000) * np.sin(np.pi * np.clip(t / 0.22, 0, 1)) ** 2 * 0.4 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 20) * 0.5
def flutter(dur=1.9):
    n = int(dur * SR); x = bp(rng.normal(0, 1, n), 1500, 6000)
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 23 * np.arange(n) / SR + rng.normal(0, 0.4, n).cumsum() * 0.01)) ** 3
    return x * am * np.sin(np.pi * np.linspace(0, 1, n)) * 0.25
def tick():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 2500) * np.exp(-t * 200) * 0.5
GEN = dict(whoosh=whoosh, sparkle=sparkle, pop=pop, thud=thud, chaching=chaching, whistle=whistle, clop=clop, step=step, chug=chug, dig=dig, flutter=flutter, tick=tick)

def ks(freq, dur, bright=0.5, amp=0.5):
    n = int(dur * SR); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    buf = lp(np.concatenate([buf, buf]), 2000 + 6000 * bright)[:p]
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.994
    return out * amp

sfx = np.zeros(N + SR * 3)
def put(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * gain
for sh in render.SHOTS[1:]:
    put(sfx, whoosh(0.36, 300, 3400) if sh.trans != 'cut' else whoosh(), sh.t0 - (0.2 if sh.trans != 'cut' else 0.15), 0.5 if sh.trans != 'cut' else 0.2)   # whoosh on cuts, bigger on whips
for kind, t, gain in stage.SFX:
    put(sfx, GEN[kind](), t, gain)

# ---------------------------------------------------------------- music: sneaky pizzicato in D minor
bpm = 104; beat = 60 / bpm
mus = np.zeros(N + SR * 4)
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(50, [62, 65, 69]), (55, [62, 67, 70]), (57, [61, 64, 67]), (50, [62, 65, 69])]
end_music = render.END_MUSIC
cache = {}
def pl(m, dur, bright, amp):
    key = (m, round(dur, 2), bright, amp)
    if key not in cache: cache[key] = ks(NOTE(m), dur, bright, amp)
    return cache[key]
bar = 0; t = 0.0
while t < end_music - 0.05:
    root, chord = prog[(bar // 2) % 4]
    for b in range(4):
        tb = t + b * beat
        if tb >= end_music - 0.05: break
        if b in (0, 2):
            put(mus, pl(root - 12 + (7 if b == 2 else 0), 0.5, 0.2, 0.9), tb, 0.55)
        else:
            for k, m in enumerate(chord):
                put(mus, pl(m, 0.25, 0.6, 0.4), tb + k * 0.012, 0.32)
        for h in (0, 0.5):
            n = int(0.05 * SR); shk = hp(rng.normal(0, 1, n), 5000) * np.exp(-np.arange(n) / SR * 70)
            put(mus, shk, tb + h * beat, 0.10 if h else 0.06)
        if b == 3 and bar % 2 == 1:
            for k, m in enumerate([root + 2, root + 3, root + 5]):
                put(mus, pl(m, 0.2, 0.4, 0.5), tb + k * beat / 3, 0.3)
    t += 4 * beat; bar += 1
for k, m in enumerate([50, 57, 62, 66, 69, 74]):            # bright button chord on "bank"
    put(mus, ks(NOTE(m), 2.2, 0.8, 0.5), end_music + k * 0.03, 0.55)

def norm_peak(x, p): return x / (np.max(np.abs(x)) + 1e-9) * p
def level(x, thr_db=-22.0, ratio=2.6):
    """Gentle voice levelling: quiet words come up, loud ones are held, so the voice sits louder without sounding squashed."""
    hopn = int(0.01 * SR); n = len(x) // hopn + 1
    rms = np.array([np.sqrt(np.mean(x[i * hopn:(i + 1) * hopn] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9)
    gr = np.where(db > thr_db, (db - thr_db) * (1 - 1 / ratio), 0.0)           # dB of reduction above threshold
    k = 9; gr = np.convolve(np.pad(gr, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')   # ~190 ms smoothing
    g = np.interp(np.arange(len(x)), np.arange(n) * hopn + hopn / 2, 10 ** (-gr / 20))
    return x * g
from scipy.signal import welch
EDGES = [0, 120, 300, 1000, 3000, 6000, 11000]
REF_BANDS = [-11.7, -2.8, -4.8, -13.6, -16.2, -18.5]        # reference clip: band level relative to total, dB
def bands(x):
    f, pxx = welch(x, fs=SR, nperseg=4096)
    tot = pxx[f < 11000].sum()
    return [10 * np.log10(pxx[(f >= lo) & (f < hi)].sum() / tot + 1e-12) for lo, hi in zip(EDGES[:-1], EDGES[1:])]
def match_tone(x, strength=0.8, lim=4.5):
    """Tilt the voice toward the reference's tonal balance (less boom, more presence) with a smooth EQ curve."""
    g = np.clip((np.array(REF_BANDS) - np.array(bands(x))) * strength, -lim, lim)
    centers = np.array([60, 190, 550, 1730, 4240, 8100.0])
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR)
    curve = np.interp(np.log10(np.maximum(fr, 20)), np.log10(centers), g)
    return np.fft.irfft(X * 10 ** (curve / 20), n=len(x)), g
vo_eq, eq_gain = match_tone(hp(vo, 85))
print('voice EQ toward reference (dB per band):', np.round(eq_gain, 1), '| bands after:', np.round(bands(vo_eq), 1))
vo_n = norm_peak(level(norm_peak(vo_eq, 0.9)), 0.92)
mus = norm_peak(lp(mus[:N], 7000), 0.125) if render.MUSIC else np.zeros(N)     # music bed only when shots.MUSIC is True
sfx = norm_peak(sfx[:N], 0.30)
env = np.abs(vo_n); w = int(0.08 * SR); env = np.convolve(env, np.ones(w) / w, mode='same')
duck = 1 - 0.3 * np.clip(env / 0.12, 0, 1)                   # music and effects dip under the voice
mix = vo_n + (mus + sfx) * duck
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
fade = int(0.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
sf.write(f'{ROOT}/mix.wav', np.stack([mix, mix], 1).astype(np.float32), SR)
print('mix', round(len(mix) / SR, 2), 's peak', round(float(np.max(np.abs(mix))), 3), 'events', len(stage.SFX))
