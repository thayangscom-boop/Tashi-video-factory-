"""Mix for "The building that turned" (Indiana Bell, 1930): the user's voiceover (audio/voiceover.mp3) + sound effects placed on the
animation's own event times (timeline.json) + a light swing-flavoured music bed ducked under the voice. All effects synthesized.
Usage: python3 make_audio.py  (numpy + scipy) -> audio/mix.wav (48 kHz stereo, -14 LUFS)
"""
import json, os, subprocess, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../.claude/skills/claude-3d-animated-shorts/upstream-2d/templates/audio'))
sys.path.insert(0, os.path.join(HERE, '../chicago-hotel-lift/tools'))
import sfx_gen as G
import sfxlib as S

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); EV = TL['ev']; CUT = TL['cuts'] + [TL['dur']]
SR = 48000; DUR = TL['dur']; N = int(DUR * SR); r = np.random.default_rng(11)
vo, sfx, amb, mus = (np.zeros(N) for _ in range(4))
def rs(x, sr): return np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x) if sr != SR else x
def S48(x): return rs(np.asarray(x, float), S.SR)
def hump(x, p=1): x = np.asarray(x); return x * np.sin(np.linspace(0, np.pi, len(x))) ** p
def tt(d): return np.arange(int(d * SR)) / SR
def put(buf, t, x, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if j > i and i >= 0: buf[i:j] += g * np.asarray(x)[:j - i]
def bed(a, b, x, g, fi=0.25, fo=0.3):
    x = np.asarray(x)[:int((b - a) * SR)]; n = np.arange(len(x)); put(amb, a, x * np.minimum(1, np.minimum(n / (fi * SR), (len(x) - n) / (fo * SR))), g)
def env(d, a=0.005, rel=0.1): x = tt(d); return np.minimum(1, x / a) * np.exp(-x / rel)

# ---- voiceover ----
raw = os.path.join(HERE, 'audio/_vo.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(HERE, 'audio/voiceover.mp3'), '-ar', str(SR), '-ac', '1', raw], check=True)
with wave.open(raw) as w: x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
os.remove(raw); put(vo, 0, x); vo /= max(np.abs(vo).max(), 1e-6); vo *= 0.9

# ---- synthesized one-shots ----
def ahooga():   # 1920s klaxon: rising buzzy sweep then falling
    d = 0.7; x = tt(d); f = np.where(x < 0.3, 220 + 500 * x / 0.3, 370 - 120 * (x - 0.3) / 0.4); ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.3) * np.sin(np.pi * x / d) ** 0.5; return S48(S.lp(np.interp(np.arange(int(d * S.SR)) * SR / S.SR, np.arange(len(s)), s), 2500))
def tbell(f=1350):  # streetcar / desk bell
    x = tt(1.2); return sum(np.sin(2 * np.pi * f * k * x) * np.exp(-x * (2.5 + k)) / k for k in (1, 2.76, 5.4)) * 0.6
def ring(d=0.9):    # 1930 desk phone bell: two-tone hammered at 20 Hz
    x = tt(d); return (np.sin(2 * np.pi * 1100 * x) + 0.6 * np.sin(2 * np.pi * 1650 * x)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 20 * x))) * np.minimum(1, (d - x) / 0.05) * 0.4
def tclick(): x = tt(0.05); return r.standard_normal(len(x)) * np.exp(-x * 160) * 0.8 + np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 120) * 0.3
def plug(): x = tt(0.12); return (r.standard_normal(len(x)) * np.exp(-x * 90) * 0.5 + np.sin(2 * np.pi * 700 * x) * np.exp(-x * 60)) * 0.7
def buzz(d=0.35, f=420): x = tt(d); return np.sign(np.sin(2 * np.pi * f * x)) * 0.25 * np.minimum(1, np.minimum(x / 0.01, (d - x) / 0.03))
def powerdown(d=1.6): x = tt(d); f = 120 * np.exp(-x * 1.4) + 25; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.2) * 0.8
def scribble(d): n = r.standard_normal(int(d * SR)); a = (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt(d) + r.uniform(0, 6))) ** 2; return S48(S.bp(np.interp(np.arange(int(d * S.SR)) * SR / S.SR, np.arange(len(n)), n * a), 1500, 6000)) * 0.5
def tick(): x = tt(0.03); return np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 220)
def ding(): x = tt(1.4); return (np.sin(2 * np.pi * 1568 * x) + 0.5 * np.sin(2 * np.pi * 2349 * x)) * np.exp(-x * 3) * 0.5

# ---- ambience beds per location ----
LOC = {'out': [0, 2, 8, 9, 11, 12], 'office': [1], 'switch': [4], 'studio': [5, 6, 14], 'cut': [10]}
for loc, idx in LOC.items():
    for i in idx:
        a, b = CUT[i], CUT[i + 1]
        if loc == 'out': bed(a, b, S48(S.wind(b - a + 0.5)), 0.06); bed(a, b, S48(S.murmur(b - a + 0.5)), 0.05)
        else: bed(a, b, S48(S.lp(S.noise(b - a + 0.5), 280)), 0.06)
        if loc in ('switch', 'cut', 'office'): bed(a, b, S48(S.murmur(b - a + 0.5)), 0.035)
# map (time-lapse): a low drone rising
a, b = CUT[9], CUT[10]; x = tt(b - a); bed(a, b, np.sin(2 * np.pi * np.cumsum(55 + 25 * x / (b - a)) / SR) * 0.5, 0.12)
# traffic: cars, horns, a streetcar bell
for t in (1.1, 7.2, 8.9, 13.0, 49.6, 55.2): put(sfx, t, S48(S.cart(1.4)), 0.05)
put(sfx, 7.6, ahooga(), 0.11); put(sfx, 52.2, ahooga(), 0.06); put(sfx, 9.1, tbell(1200), 0.07); put(sfx, 14.6, tbell(1200), 0.05)

# ---- 1 hook: footsteps on planks, the building groans on its rollers ----
for k in range(7): put(sfx, 0.15 + k * 0.42, S48(S.footstep(True)), 0.16)
put(sfx, 0.0, G.creak(2.8, r, rate0=50, rate1=35), 0.16); put(sfx, 0.2, S48(S.lp(S.noise(2.8), 120)), 0.12)
for t in np.arange(0.3, 3.0, 0.5): put(sfx, t, S48(S.ratchet(2, 0.06)), 0.08)
# ---- 2 office: typewriter, sip, the view slides, the double take ----
for t in np.arange(3.15, EV['slide'] - 0.1, 0.11): put(sfx, t + r.uniform(0, .03), tclick(), 0.05)
put(sfx, 3.3, hump(S48(S.lp(S.noise(0.3), 1200))), 0.04)
put(sfx, EV['slide'], G.creak(1.8, r, rate0=45, rate1=30), 0.2)
k = 0
while EV['slide'] + 0.1 + k * 0.08 < 6.4: put(sfx, EV['slide'] + 0.1 + k * 0.08, G.clink(r, f0=2800 + r.uniform(-200, 200)), 0.04); k += 1
put(sfx, EV['shock'] - 0.05, G.whoosh(0.35, r, peak=0.12, f_lo=900, f_hi=3000, width=0.6), 0.14)
# ---- 3-4 city, plans unroll, ghost tower ----
put(sfx, CUT[2] - 0.25, G.whoosh(0.5, r, peak=0.25, f_lo=300, f_hi=2000), 0.15)
put(sfx, EV['unroll'][0], scribble(0.6) * 0.8, 0.3)                                   # paper unrolling
put(sfx, EV['ghost'][0], S48(S.swell(1.4)), 0.16); put(sfx, EV['ghost'][0] + 0.9, ding(), 0.05)
# ---- 5 switchboard: buzzers, plug clicks, then everything goes dark ----
for t in np.arange(15.7, EV['dark'][0], 0.27): put(sfx, t + r.uniform(0, .1), plug() if r.random() < 0.6 else buzz(0.2, r.choice([380, 440, 520])), 0.08)
for k, t in enumerate(np.linspace(EV['dark'][0], EV['dark'][1], 6)): put(sfx, t, plug(), 0.06 - k * 0.008)
put(sfx, EV['dark'][0] + 0.3, powerdown(1.6), 0.3)
# ---- 6-7 architect: pencil, the idea, the arrow, the stamp ----
put(sfx, 21.0, scribble(2.9), 0.22); put(sfx, EV['idea'], ding(), 0.2)
put(sfx, 25.4, scribble(0.9), 0.28); put(sfx, EV['stamp'] - 0.15, G.whoosh(0.2, r, peak=0.15, f_lo=500, f_hi=2500), 0.1)
put(sfx, EV['stamp'], S48(S.thud(0.4, 90)), 0.45); put(sfx, EV['stamp'] + 0.01, S48(S.wood_knock(160)), 0.25)
# ---- 8 rollers: steel rolling on timber, foreman ----
for t0 in (27.5, 28.2): put(sfx, t0, hump(S48(S.lp(S.noise(1.6), 260))), 0.2); put(sfx, t0 + 1.6, S48(S.clank(260)), 0.18)
put(sfx, 27.9, S48(S.whistle(0.3)), 0.12)
put(sfx, 29.5, G.whoosh(0.9, r, peak=0.5, f_lo=200, f_hi=1500, width=0.9), 0.14); put(sfx, 29.6, G.creak(2.0, r, rate0=40, rate1=28), 0.22); put(sfx, 30.78, S48(S.thud(0.7, 45)), 0.3)
# ---- 9 jacks: ratchets in rhythm, clock ticking ----
for t in np.arange(31.7, 36.8, 0.98): put(sfx, t, S48(S.crew_ratchet(0.4, 12)), 0.2); put(sfx, t + 0.1, G.creak(0.5, r, rate0=70, rate1=55), 0.08)
for t in np.arange(34.4, 36.8, 0.25): put(sfx, t, tick(), 0.08)
# ---- 10 map: whooshes on each leg ----
for t in (EV['south'][0], EV['turn'][0], EV['west'][0]): put(sfx, t - 0.1, G.whoosh(0.7, r, peak=0.4, f_lo=300, f_hi=2000, width=0.8), 0.16)
put(sfx, EV['turn'][0] + 0.2, G.creak(2.0, r, rate0=45, rate1=32), 0.16)
for t in (37.34, 39.68, 42.14): put(sfx, t, S48(S.clank(520)), 0.05)
# ---- 11 cut-away: office life (typing, plugs, a desk bell) while the building rolls ----
for t in np.arange(43.3, 48.5, 0.13): put(sfx, t + r.uniform(0, .04), tclick(), 0.025)
for t in np.arange(43.6, 48.5, 0.6): put(sfx, t + r.uniform(0, .2), plug(), 0.04)
put(sfx, 46.2, tbell(1700), 0.06); bed(CUT[10], CUT[11], S48(S.lp(S.noise(CUT[11] - CUT[10] + .5), 110)), 0.1)
# ---- 12 pipes: creaks/stretch, the name pops ----
for t in (48.92, 49.54, 50.2, 50.7): put(sfx, t, G.whoosh(0.22, r, peak=0.08, f_lo=1200, f_hi=3600, width=0.5), 0.06)
for t in (49.0, 50.6, 52.2): put(sfx, t, G.creak(1.2, r, rate0=90, rate1=60), 0.09)
# ---- 13 bridge: footsteps on boards ----
for t in np.arange(54.2, 56.2, 0.21): put(sfx, t + r.uniform(0, .05), S48(S.footstep(True)), 0.12)
# ---- 14 the call: plug in, the phone rings, the pickup ----
put(sfx, 56.95, plug(), 0.25); put(sfx, 57.0, ring(0.85), 0.2); put(sfx, EV['answer'] - 0.05, S48(S.wood_knock(300)), 0.12)
# ---- 15 son: page turn, final chord ----
put(sfx, 59.3, hump(S48(S.lp(S.noise(0.35), 3000))), 0.06); put(sfx, EV['lookUp'], ding(), 0.08)
# cards / lower-thirds pop
for t in (6.75, 13.4, 19.9, 22.35, 29.8, 34.5, 44.95, 57.6, 61.75): put(sfx, t, G.whoosh(0.25, r, peak=0.08, f_lo=1200, f_hi=3600, width=0.5), 0.06)
# cut transitions: a soft air whoosh on location changes
for t in (CUT[1], CUT[4], CUT[5], CUT[10], CUT[13], CUT[14]): put(sfx, t - 0.12, G.whoosh(0.35, r, peak=0.2, f_lo=500, f_hi=2500, width=0.6), 0.06)

# ---- music: light swing in F (major), minor through the shutdown, major again; walking bass + offbeat comp ----
bpm = 112; beat = 60 / bpm; bar = 4 * beat
MAJ = [[53, 57, 60, 64], [50, 57, 60, 65], [55, 58, 62, 65], [48, 55, 58, 64]]   # F maj7, Dm7, Gm7, C7
MIN = [[50, 53, 57, 60], [46, 50, 53, 57], [43, 50, 53, 58], [45, 49, 52, 55]]   # Dm, Bb, Gm, A
t0, i = 0.0, 0
while t0 < DUR:
    dark = CUT[4] - 0.2 <= t0 < CUT[5] + 0.3; ch = (MIN if dark else MAJ)[i % 4]; d = min(bar, DUR - t0) + 0.3
    for n in ch[1:]: put(mus, t0, S48(S.note(S.hz(n), d)), 0.025)
    for b in range(4):   # walking bass (swung)
        tb = t0 + b * beat; n = ch[0] - 12 + [0, 4, 7, 9][b] - (3 if dark and b == 1 else 0)
        if tb < DUR: put(mus, tb, S48(S.note(S.hz(n), beat * 0.9, 'pluck')), 0.07)
        if not dark and tb + beat * 0.66 < DUR: put(mus, tb + beat * 0.66, S48(S.note(S.hz(ch[2] + 12), 0.18, 'pluck')), 0.025)
    if not dark:
        for b in (1, 3):   # brush on 2 and 4
            if t0 + b * beat < DUR: put(mus, t0 + b * beat, hump(S48(S.hp(S.noise(0.12), 3000))), 0.02)
    t0 += bar; i += 1
fo = int(1.5 * SR); mus[-fo:] *= np.linspace(1, 0, fo); amb[-fo:] *= np.linspace(1, 0.3, fo)
# silence the music bed for the "silent" beat
s0, s1 = int(19.9 * SR), int(21.1 * SR); mus[s0:s1] *= np.concatenate([np.linspace(1, 0.15, (s1 - s0) // 2), np.linspace(0.15, 1, s1 - s0 - (s1 - s0) // 2)])

envv = np.convolve(np.abs(vo), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.45 * np.clip(envv / 0.05, 0, 1)
mix = vo + sfx * (0.7 + 0.3 * duck) + amb * (0.8 + 0.2 * duck) + mus * duck
mix /= max(np.abs(mix).max() / 0.95, 1)
tmp = os.path.join(HERE, 'audio/_mix.wav')
with wave.open(tmp, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '2', os.path.join(HERE, 'audio/mix.wav')], check=True)
os.remove(tmp); print('audio/mix.wav', DUR)
