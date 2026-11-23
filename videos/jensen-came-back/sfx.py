# Synthesized sound design + music bed. usage: python3 sfx.py cues.json duration out.wav
import json, sys, numpy as np
from scipy.signal import butter, sosfilt
SR = 48000
rng = np.random.default_rng(3)
def T(d): return np.arange(int(SR * d)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(SR * d))
def env(n, a, d_):  # attack seconds, exp decay rate
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * d_); return e
def sweep(f0, f1, d, curve=1.0):
    t = T(d); f = f0 + (f1 - f0) * (t / d) ** curve; return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, p=1.0): return x / (np.max(np.abs(x)) + 1e-9) * p

def boom():
    d = 2.2; s = sweep(70, 32, d, .5) * env(int(SR * d), .005, 2.4)
    th = lp(noise(.25), 180) * env(int(SR * .25), .002, 18)
    s[:len(th)] += th * 1.2
    tail = lp(noise(d), 400) * env(int(SR * d), .01, 3.5) * .15
    return norm(s + tail, .95)
def hit():
    d = .7; s = sweep(140, 55, d, .4) * env(int(SR * d), .002, 9)
    c = hp(noise(.05), 2000) * env(int(SR * .05), .0005, 90)
    s[:len(c)] += c * .5; return norm(s, .8)
def whoosh(d=.55, lo=300, hi=5000):
    n = noise(d); t = T(d); out = np.zeros_like(n)
    seg = 32; L = len(n) // seg
    for i in range(seg):
        k = i / seg; f = lo * (hi / lo) ** np.sin(np.pi * k * .9)
        chunk = n[i * L:(i + 1) * L + 512]; y = bp(chunk, f * .7, min(f * 1.4, 20000))
        out[i * L:i * L + len(y)] += y[:len(out) - i * L] * np.hanning(len(y))[:len(out) - i * L]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return norm(out * e, .7)
def swish(): return whoosh(.28, 900, 9000) * .8
def riser():
    d = 2.0; t = T(d); n = bp(noise(d), 800, 6000) * (t / d) ** 2.2
    tone = sweep(110, 440, d, 1.5) * (t / d) ** 2 * .3
    return norm(n + tone, .5) * np.minimum(1, (d - t) / .05)
def stamp():
    d = .5; th = sweep(120, 45, d, .4) * env(int(SR * d), .001, 14)
    sl = bp(noise(.12), 600, 5000) * env(int(SR * .12), .0005, 45)
    th[:len(sl)] += sl * .9; return norm(th, .95)
def glitch():
    d = .45; t = T(d); sq = np.sign(np.sin(2 * np.pi * (300 + 900 * (rng.random(len(t)) > .995).cumsum() % 7 * 80) * t))
    gate = (np.floor(t * 40) % 2 == 0).astype(float); x = sq * gate * .4 + hp(noise(d), 3000) * .5 * (1 - gate)
    x = np.round(x * 6) / 6; return norm(x * env(len(x), .002, 5), .45)
def tick(): d = .04; return norm(hp(noise(d), 3000) * env(int(SR * d), .0002, 160), .45)
def check():
    a = np.sin(2 * np.pi * 880 * T(.09)) * env(int(SR * .09), .002, 30); b = np.sin(2 * np.pi * 1320 * T(.18)) * env(int(SR * .18), .002, 20)
    return norm(np.concatenate([a, b]), .45)
def pop(): d = .18; return norm(sweep(900, 300, d, .5) * env(int(SR * d), .001, 25), .5)
def count():
    d = 1.1; x = np.zeros(int(SR * d)); tk = tick()
    for k in np.arange(0, d - .05, .045): i = int(k * SR); x[i:i + len(tk)] += tk * (.5 + .5 * k / d)
    return x * .8
def scan(): d = .8; return norm(sweep(400, 2400, d) * np.sin(np.pi * T(d) / d) ** 2, .18) + whoosh(.8, 2000, 8000) * .15
def slide(): return lp(whoosh(.35, 200, 2500), 3000) * .8
def string(): d = 1.0; t = T(d); return norm(sweep(55, 82, d) * np.sin(np.pi * t / d) + .3 * sweep(110, 165, d) * np.sin(np.pi * t / d), .35)
def draw(): d = 2.0; t = T(d); return norm(sweep(220, 330, d) * np.sin(np.pi * t / d) ** 2, .15)
def down(): d = 1.0; return norm(sweep(700, 70, d, .6) * env(int(SR * d), .01, 2.5), .5) + np.pad(whoosh(.8, 3000, 300) * .3, (0, int(SR * .2)))
def doors(): d = .7; return norm(lp(noise(d), 250) * np.sin(np.pi * T(d) / d) + sweep(60, 40, d) * .4, .6)
LIB = dict(boom=boom, hit=hit, whoosh=whoosh, swish=swish, riser=riser, stamp=stamp, glitch=glitch, tick=tick, check=check, pop=pop,
           count=count, scan=scan, slide=slide, string=string, draw=draw, down=down, doors=doors)

def bed(dur):
    # dark cinematic pulse: sub drone + pulsing low synth at 96 bpm + airy pad, minor key, swells into the twist.
    t = np.arange(int(SR * dur)) / SR; bpm = 96; beat = 60 / bpm
    roots = [(0, 36.71), (16, 34.65), (32, 41.20), (46, 36.71), (54, 32.70)]  # D1, C#1, E1, D1, C1 (Hz) changes at seconds
    f = np.zeros_like(t)
    for s, hz in roots: f[t >= s] = hz
    f = lp(f, 2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * .5 + np.sin(2 * ph) * .25
    # pulsing 8th-note saw an octave up, filtered
    saw = ((ph * 2 / (2 * np.pi)) % 1) * 2 - 1
    pos = (t % (beat / 2)) / (beat / 2); pulse = np.exp(-pos * 6)
    syn = lp(saw * pulse, 700) * .35
    # pad: fifth + minor third, slow LFO
    pad = (np.sin(ph * 4) + .6 * np.sin(ph * 6) + .5 * np.sin(ph * 4 * 1.189)) * (.5 + .5 * np.sin(2 * np.pi * t / 8)) * .07
    # soft kick every beat after 0s, muted in 59.5..61.5 for the question
    k = np.zeros_like(t); kick = sweep(110, 40, .25, .3) * env(int(SR * .25), .001, 18)
    for bt in np.arange(0, dur, beat):
        i = int(bt * SR); k[i:i + len(kick)] += kick[:len(k) - i]
    hat = np.zeros_like(t); h = hp(noise(.03), 7000) * env(int(SR * .03), .0002, 200)
    for bt in np.arange(beat / 2, dur, beat):
        i = int(bt * SR); hat[i:i + len(h)] += h[:len(hat) - i]
    inten = np.interp(t, [0, 6, 8.8, 13, 22.5, 27.5, 32.5, 37.6, 46.4, 52, 54.9, 59.4, 60, 62.4, 64.4],
                         [.9, .9, .55, .8, .8, 1, 1, .7, .9, 1, 1, .4, .35, .6, 0])
    mix = sub * .55 + syn + pad + k * .55 * inten + hat * .18 * inten
    fade = np.minimum(1, t / .3) * np.minimum(1, (dur - t) / 1.0)
    return mix * inten * fade

if __name__ == '__main__':
    cues = json.load(open(sys.argv[1])); dur = float(sys.argv[2])
    out = np.zeros((int(SR * (dur + 3)), 2)); cache = {}
    for c in cues:
        x = cache.setdefault(c['name'], LIB[c['name']]())
        i = max(0, int(c['t'] * SR)); j = min(len(out), i + len(x))
        pan = (hash(c['name'] + str(c['t'])) % 100 / 100 - .5) * .5
        out[i:j, 0] += x[:j - i] * c['gain'] * (1 - pan) * .5
        out[i:j, 1] += x[:j - i] * c['gain'] * (1 + pan) * .5
    b = bed(dur); out[:len(b), 0] += b * .9; out[:len(b), 1] += b * .9
    out = out[:int(SR * dur)]
    out = out / (np.max(np.abs(out)) + 1e-9) * .9
    import wave
    w = wave.open(sys.argv[3], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes()); w.close(); print('wrote', sys.argv[3])
