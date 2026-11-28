"""Procedural sound-effect building blocks (numpy only, no samples)."""
import numpy as np
SR = 44100
rng = np.random.default_rng(11)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, fc, p=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / fc) ** (2 * p)); return np.fft.irfft(X, len(x))
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / max(fc, 1)) ** 4); return np.fft.irfft(X, len(x))
def bp(x, lo, hi): return hp(lp(x, hi), lo)
def norm(x): return x / max(np.abs(x).max(), 1e-9)
def put(buf, t0, x, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[max(i, 0):j] += g * x[max(0, -i):j - i]

def click():
    d = 0.035; t = tt(d)
    return norm(bp(noise(d), 1800, 6000) * np.exp(-t * 180) + 0.5 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 250))
def ratchet(count=5, rate=0.07):
    out = np.zeros(int((count * rate + 0.1) * SR))
    for k in range(count):
        c = click() * (0.7 + 0.3 * rng.random()); i = max(int((k * rate + rng.normal(0, 0.004)) * SR), 0); out[i:i + len(c)] += c
    return norm(out)
def crew_ratchet(d=0.42, men=30):
    """Many men hauling at once: a dense run of iron clicks lasting the length of the pull."""
    out = np.zeros(int((d + 0.3) * SR))
    for m in range(men):
        r = ratchet(max(2, int(d / 0.075)), 0.07 + rng.random() * 0.012); i = int(max(rng.normal(0.03, 0.03), 0) * SR)
        out[i:i + len(r)] += r[:len(out) - i] * rng.uniform(0.3, 1)
    return norm(out)
def creak(d=1.0, f0=85):
    t = tt(d); f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 0.9 * t) + 0.05 * rng.standard_normal(len(t)).cumsum() / 300)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(bp(np.sign(np.sin(ph)) * 0.5 + np.sin(ph * 3) * 0.3, 150, 1800) * np.sin(np.pi * t / d) ** 1.5)
def thud(d=0.45, f=70):
    t = tt(d); return norm(np.sin(2 * np.pi * (f + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 10) + 0.6 * lp(noise(d), 600) * np.exp(-t * 18))
def wood_knock(f=180):
    d = 0.16; t = tt(d); return norm(np.sin(2 * np.pi * f * t) * np.exp(-t * 38) + 0.35 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t * 60) + 0.5 * bp(noise(d), 400, 3000) * np.exp(-t * 90))
def footstep(wood=True):
    return wood_knock(150 + rng.uniform(-20, 20)) if wood else norm(lp(noise(0.12), 500) * np.exp(-tt(0.12) * 40))
def clank(f=420):
    d = 0.8; t = tt(d)
    x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (7 + 3 * k)) for k, m in enumerate((1, 2.76, 5.4, 8.9)))
    return norm(x + 0.5 * bp(noise(d), 1000, 5000) * np.exp(-t * 60))
def scrape(d=0.5):
    t = tt(d); return norm(bp(noise(d), 300, 2500) * (0.5 + 0.5 * np.abs(lp(noise(d), 25)) * 6) * np.sin(np.pi * t / d))
def whistle(d=0.34):
    t = tt(d); f = 2350 + 110 * np.sin(2 * np.pi * 30 * t) * (t > 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05)
    return norm(x + 0.15 * bp(noise(d), 1800, 4000) * np.minimum(1, (d - t) / 0.05))
def whoosh(d=0.35):
    t = tt(d); return norm(bp(noise(d), 300, 2500) * np.sin(np.pi * t / d) ** 2)
def dust(d=0.9):
    t = tt(d); return norm(bp(noise(d), 1500, 7000) * np.exp(-t * 4) * (0.5 + 0.5 * np.abs(lp(noise(d), 20)) * 5))
def murmur(d):
    am = np.abs(lp(noise(d), 8)); x = bp(noise(d), 250, 1800) * (0.35 + 0.65 * am / am.max())
    return norm(x) * np.minimum(1, np.minimum(tt(d) / 0.6, (d - tt(d)) / 0.6))
def wind(d):
    x = bp(noise(d), 120, 900) * (0.5 + 0.5 * np.abs(lp(noise(d), 0.7)) * 6); return norm(x) * np.minimum(1, np.minimum(tt(d) / 0.8, (d - tt(d)) / 0.8))
def chirp():
    d = 0.09; t = tt(d); f = 3200 + 1500 * np.sin(np.pi * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2
def cart(d):
    t = tt(d); x = lp(noise(d), 180) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t)) + 0.2 * bp(noise(d), 800, 2000) * (np.sin(2 * np.pi * 3.1 * t) > 0.9)
    return norm(x) * np.minimum(1, np.minimum(t / 0.5, (d - t) / 0.5))
def swell(d=1.6):
    t = tt(d); return norm(bp(noise(d), 200, 5000) * (t / d) ** 2.5)
def bell():
    d = 1.4; t = tt(d); return norm(sum(a * np.sin(2 * np.pi * 1320 * m * t) * np.exp(-t * k) for a, m, k in ((1, 1, 3), (0.5, 2.0, 4.5), (0.35, 2.76, 6))))
def clap():
    d = 0.06; t = tt(d); return norm(bp(noise(d), 900, 4500) * np.exp(-t * 70))
def note(f, d, kind="pad"):
    t = tt(d)
    if kind == "pad":
        x = sum(np.sin(2 * np.pi * f * m * t + rng.random() * 6) / (m ** 1.3) for m in (1, 2, 3, 4, 5)) + 0.6 * sum(np.sin(2 * np.pi * f * 1.003 * m * t) / (m ** 1.6) for m in (1, 2, 3))
        return x * np.minimum(1, t / 0.7) * np.minimum(1, (d - t) / 0.7)
    x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (5 + 3 * m)) / m for m in (1, 2, 3, 4)); return x * np.minimum(1, t / 0.004)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
