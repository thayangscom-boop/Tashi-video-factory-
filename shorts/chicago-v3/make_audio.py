"""Mix for "Chicago lifted a hotel": the user's voiceover (audio/voiceover.mp3) + sound effects on the animation's
own event times (timeline.json) + a light documentary music bed ducked under the voice. All effects synthesized.
Usage: python3 make_audio.py  (numpy + scipy) -> audio/mix.wav (48 kHz stereo, -14 LUFS)
"""
import json, math, os, subprocess, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../.claude/skills/claude-3d-animated-shorts/upstream-2d/templates/audio'))
sys.path.insert(0, os.path.join(HERE, '../chicago-hotel-lift/tools'))
import sfx_gen as G
import sfxlib as S

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); EV = TL['ev']; CUT = TL['cuts']
SR = 48000; DUR = TL['dur']; N = int(DUR * SR); r = np.random.default_rng(5)
vo, sfx, amb, mus = (np.zeros(N) for _ in range(4))
def rs(x, sr): return np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x) if sr != SR else x
def S48(x): return rs(np.asarray(x, float), S.SR)
def hump(x, p=1): x = np.asarray(x); return x * np.sin(np.linspace(0, np.pi, len(x))) ** p
def put(buf, t, x, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if j > i and i >= 0: buf[i:j] += g * np.asarray(x)[:j - i]
def bed(a, b, x, g, fi=0.3, fo=0.4):
    x = np.asarray(x)[:int((b - a) * SR)]; n = np.arange(len(x)); put(amb, a, x * np.minimum(1, np.minimum(n / (fi * SR), (len(x) - n) / (fo * SR))), g)

# ---- voiceover ----
raw = os.path.join(HERE, 'audio/_vo.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(HERE, 'audio/voiceover.mp3'), '-ar', str(SR), '-ac', '1', raw], check=True)
with wave.open(raw) as w: x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
os.remove(raw); put(vo, 0, x); vo /= max(np.abs(vo).max(), 1e-6); vo *= 0.9

def n48(d): return r.standard_normal(int(d * SR))
def lp48(x, fc): return S48(S.lp(np.interp(np.arange(int(len(x) * S.SR / SR)) * SR / S.SR, np.arange(len(x)), x), fc))
# ---- ambience beds per location ----
inside = [(0, CUT[3]), (CUT[14], CUT[17])]; street = [(CUT[3], CUT[8])]; hotelblock = [(CUT[8], CUT[14]), (CUT[17], DUR)]
for a, b in inside: bed(a, b, S48(S.lp(S.noise(b - a + 0.5), 300)), 0.07)
for a, b in street + hotelblock: bed(a, b, S48(S.wind(b - a + 0.5)), 0.09); bed(a, b, S48(S.murmur(b - a + 0.5)), 0.05)
for t in np.arange(0.3, 2.5, 0.7): put(amb, t + r.uniform(0, 0.3), S48(S.chirp()), 0.04)                       # birds at the window
for t in np.arange(CUT[17] + 0.2, DUR, 0.9): put(amb, t + r.uniform(0, 0.3), S48(S.chirp()), 0.035)

# ---- 1-2 hotel room ----
for k in range(2): put(sfx, 0.05 + k * 0.9, hump(S48(S.lp(S.noise(0.7), 300))), 0.05)
put(sfx, EV['sitUp'][0], G.creak(0.8, r, rate0=140, rate1=90), 0.12)                                             # bed creak as he sits up
put(sfx, 2.6, G.creak(1.6, r, rate0=60, rate1=35), 0.22)                                                         # the building groans
k = 0
while 2.8 + k * 0.07 < 4.2: put(sfx, 2.8 + k * 0.07, G.clink(r, f0=2600 + r.uniform(-200, 200)), 0.05); k += 1  # cup rattling on the saucer
put(sfx, EV['shock'], G.whoosh(0.35, r, peak=0.12, f_lo=900, f_hi=3000, width=0.6), 0.12)
# ---- 3 hook exterior: the crew turning, the building rising ----
for t in np.arange(4.3, 7.1, 0.6): put(sfx, t, S48(S.crew_ratchet(0.4, 30)), 0.22); put(sfx, t + 0.05, G.creak(0.6, r, rate0=70, rate1=50), 0.12)
# ---- 4-6 the muddy 1861 street ----
put(sfx, CUT[3] - 0.25, G.whoosh(0.5, r, peak=0.25, f_lo=300, f_hi=2000), 0.18)
for t in np.arange(CUT[3], CUT[6], 0.5): put(sfx, t + r.uniform(0, 0.2), S48(S.hoof(True)) if hasattr(S, 'hoof') else S48(S.footstep(False)), 0.03)
k = 1
while 9.0 + k * 0.42 < EV['mudStep']: put(sfx, 9.0 + k * 0.42, S48(S.footstep()), 0.18); k += 1                    # his steps on the planks
put(sfx, EV['mudStep'], S48(S.squelch(0.35)), 0.35); put(sfx, EV['sink'][0], S48(S.squelch(0.7)), 0.4)           # off the planks, into the mud
put(sfx, EV['tug'][0], S48(S.squelch(0.45)), 0.45); put(sfx, EV['tug'][0] + 0.45, S48(S.squelch(0.3)), 0.3)
for t in np.arange(11.6, 15.4, 0.75): put(sfx, t + r.uniform(0, .2), S48(S.squelch(0.25)), 0.08)                 # the stuck wagon rocking
for t in (12.2, 13.4, 14.6): put(sfx, t, G.creak(0.7, r, rate0=120, rate1=80), 0.1)
for t in np.arange(11.8, 15.4, 0.9):                                                                              # frogs in the standing water
    f = r.uniform(180, 260); tt_ = np.arange(int(0.18 * SR)) / SR; put(amb, t + r.uniform(0, .3), np.sin(2 * np.pi * f * tt_) * (np.sin(2 * np.pi * 28 * tt_) > 0) * np.sin(np.pi * tt_ / 0.18), 0.03)
# ---- 7 engineer + time-lapse fill ----
put(sfx, EV['pointPlan'] - 0.1, S48(S.scrape(0.3)), 0.06)
for t in np.arange(15.6, 17.3, 0.83): put(sfx, t, S48(S.thud(0.3, 110)), 0.12)                                  # shovel
put(sfx, 17.3, S48(S.swell(2.3)), 0.12)
for t in np.arange(17.4, 19.6, 0.18): put(sfx, t + r.uniform(0, .05), S48(S.thud(0.2, 100 + r.uniform(-20, 20))), 0.07)   # sped-up shovelling
put(sfx, 19.6, S48(S.thud(0.5, 60)), 0.25)
# ---- 8-10 the hotel below the street; the hammer ----
put(sfx, CUT[9] - 0.2, G.whoosh(0.8, r, peak=0.5, f_lo=300, f_hi=1800, width=0.9), 0.14)                         # the tilt up the facade
put(sfx, EV['hammerUp'][0], G.whoosh(0.6, r, peak=0.5, f_lo=400, f_hi=1500), 0.16)
put(sfx, EV['stopHammer'], S48(S.thud(0.3, 140)), 0.3); put(sfx, EV['stopHammer'] + 0.02, G.oof(r, kind='oh'), 0.18)
for t in np.arange(26.4, EV['stopHammer'], 0.22): put(sfx, t, S48(S.footstep(False)), 0.12)                    # the foreman running in
# ---- 11-13 jacks, the crew, the lift ----
put(sfx, EV['jackPush'][0], S48(S.scrape(EV['jackPush'][1] - EV['jackPush'][0])), 0.25); put(sfx, EV['jackPush'][1], S48(S.clank(330)), 0.3)
bed(CUT[11], CUT[13], S48(S.lp(S.noise(CUT[13] - CUT[11] + .5), 200)), 0.08)                                     # the pit's low room tone
put(sfx, EV['whistle'], S48(S.whistle(0.4)), 0.32)
for s in EV['turns']: put(sfx, s, S48(S.crew_ratchet(0.5, 45)), 0.42); put(sfx, s + 0.05, G.creak(0.9, r, rate0=75, rate1=55), 0.3); put(sfx, s + 0.48, S48(S.thud(0.4, 52)), 0.22)
k = 0
while EV['liftLapse'][0] + k * 0.28 < EV['liftLapse'][1]: put(sfx, EV['liftLapse'][0] + k * 0.28, S48(S.ratchet(3, 0.05)), 0.2); k += 1
L = EV['liftLapse'][1] - EV['liftLapse'][0]; tt_ = np.arange(int(L * SR)) / SR; put(sfx, EV['liftLapse'][0], np.sin(2 * np.pi * np.cumsum(70 + 90 * (tt_ / L) ** 1.5) / SR) * np.sin(np.pi * tt_ / L) * 0.6, 0.12)
put(sfx, EV['liftLapse'][1], S48(S.thud(0.6, 48)), 0.35)
# ---- 14-16 the hotel stays open ----
w0, w1 = EV['walkIn']; k = 1
while w0 + k * 0.4 < w1: put(sfx, w0 + k * 0.4, S48(S.footstep()), 0.16); k += 1
put(sfx, EV['bell'], S48(S.bell()), 0.3)
for k in range(3): put(sfx, EV['snore'] + k * 0.0, hump(S48(S.lp(S.noise(0.8), 260)), 2), 0.12)
for t in (EV['eat'], EV['eat'] + 0.4): put(sfx, t, G.clink(r, f0=3200), 0.12)
for t in (EV['shake'], EV['shake'] + 0.14, EV['shake'] + 0.28): put(sfx, t, S48(S.clap()), 0.08)
for t in np.arange(EV['riseB'][0], EV['riseB'][1], 0.45): put(sfx, t, S48(S.ratchet(3, 0.05)), 0.12)
put(sfx, EV['riseB'][0], G.creak(2.4, r, rate0=55, rate1=40), 0.2)
# ---- 17 finale ----
put(sfx, CUT[17] - 0.4, S48(S.swell(1.0)), 0.14)
put(sfx, EV['finalCard'], S48(S.bell()), 0.12)
# card pops
for t in (7.3, 18.4, 24.0, 29.3, 42.4, 53.7): put(sfx, t, G.whoosh(0.25, r, peak=0.08, f_lo=1200, f_hi=3600, width=0.5), 0.07)

# ---- music: documentary pulse (D minor), lifts to major for the payoff ----
beat = 60 / 100; bar = beat * 4
minor = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]
major = [[50, 57, 62, 66], [55, 59, 62, 67], [52, 57, 61, 64], [50, 57, 62, 66]]
t0, i = 0.0, 0
while t0 < DUR:
    up = t0 >= CUT[14] - 0.1; ch = (major if up else minor)[i % 4]; d = min(bar, DUR - t0) + 0.5
    for n in ch: put(mus, t0, S48(S.note(S.hz(n), d)), 0.04)
    put(mus, t0, S48(S.note(S.hz(ch[0] - 12), d)), 0.05)
    dens = 2 if CUT[11] <= t0 < CUT[14] or t0 >= CUT[17] else 1
    for b in range(4 * dens):
        tb = t0 + b * beat / dens
        if tb < DUR: put(mus, tb, S48(S.note(S.hz(ch[(b % 3) + 1] + 12), 0.45, 'pluck')), 0.035 + 0.012 * (dens - 1))
    t0 += bar; i += 1
    if not up and t0 > CUT[14] - 0.1: t0 = CUT[14] - 0.1; i = 0
fo = int(1.2 * SR); mus[-fo:] *= np.linspace(1, 0, fo); amb[-fo:] *= np.linspace(1, 0.3, fo)

env = np.convolve(np.abs(vo), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.45 * np.clip(env / 0.05, 0, 1)
mix = vo + sfx * (0.7 + 0.3 * duck) + amb * (0.8 + 0.2 * duck) + mus * duck
mix /= max(np.abs(mix).max() / 0.95, 1)
tmp = os.path.join(HERE, 'audio/_mix.wav')
with wave.open(tmp, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '2', os.path.join(HERE, 'audio/mix.wav')], check=True)
os.remove(tmp); print('audio/mix.wav', DUR)
