"""Audio for the V3 test: narration (local Piper TTS) + sound effects placed on the animation's own event
times from timeline.json + a light comic music bed ducked under the voice. Everything is synthesized; no samples.
Footsteps are computed with the same walk formula as v3.js (phase-locked to distance travelled).

Usage: python3 make_audio.py   (numpy + scipy)  -> audio/mix.wav (48 kHz stereo, loudness-normalised to -14 LUFS)
"""
import json, math, os, subprocess, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../.claude/skills/claude-3d-animated-shorts/upstream-2d/templates/audio'))
sys.path.insert(0, os.path.join(HERE, '../chicago-hotel-lift/tools'))
import sfx_gen as G          # the 3D-shorts skill's own generators (creak, whoosh, whoa, clink, ...)
import sfxlib as S           # this repo's generators (footsteps, ratchet, bell, ...)
from dsp import SR as GSR

TL = json.load(open(os.path.join(HERE, 'timeline.json')))
SR = 48000; DUR = TL['dur']; N = int(DUR * SR)
assert GSR == SR
r = np.random.default_rng(11)
vo, sfx, amb, mus = (np.zeros(N) for _ in range(4))
def rs(x, sr):  # resample to 48 kHz
    return np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x) if sr != SR else x
def put(buf, t, x, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if j > i and i >= 0: buf[i:j] += g * x[:j - i]
def S48(x): return rs(x, S.SR)   # sfxlib runs at 44.1 kHz
def read(p):
    with wave.open(p) as w:
        return rs(np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768, w.getframerate())

# ---- narration ----
for v in TL['vo']:
    x = read(os.path.join(HERE, v['file'])); a, b = int(v['from'] * SR), int(v['to'] * SR); x = x[a:b].copy(); f = int(0.03 * SR); x[-f:] *= np.linspace(1, 0, f)
    put(vo, v['at'], x)
vo = vo / max(np.abs(vo).max(), 1e-6) * 0.9

# ---- room: tone, fridge hum, wall clock ticking (the second hand turns in the shot) ----
t = np.arange(N) / SR
amb += S48(S.fade(S.lp(S.noise(DUR / 0.918 * 0.918 + 0.1), 260), 0.3, 0.4))[:N] * 0.10
amb += np.sin(2 * np.pi * 120 * t) * 0.006 + np.sin(2 * np.pi * 240 * t) * 0.003
for k in range(int(DUR)): put(amb, k + 0.05, S48(S.wood_knock(1900))[:int(0.05 * SR)], 0.03)
put(amb, 0, S48(S.fade(S.bp(S.noise(4.6), 2500, 7000), 0.2, 0.6))[:int(4.6 * SR)], 0.012)   # coffee machine hiss (steam is on screen)

# ---- footsteps, phase-locked to the walk exactly like walkTo() in v3.js ----
WALK_DUR, WALK_SPEED = 0.97, 1.62   # logged by v3.js ("walk clip 0.97 s, speed 1.62")
def steps(t0, t1, A, B, scale):
    out, last = [], -1
    for i in range(int((t1 - t0) * 200) + 1):
        tt_ = t0 + i / 200; u = min(1, max(0, (tt_ - t0) / (t1 - t0)))
        s = u * u / 0.3 if u < 0.15 else 1 - (1 - u) * (1 - u) / 0.3 if u > 0.85 else u - 0.075
        k = s / 0.85; dist = math.hypot(B[0] - A[0], B[1] - A[1]) * k / scale; ph = int((dist / WALK_SPEED) / (WALK_DUR / 2))
        if ph != last and i: out.append(tt_)
        last = ph
    return out
BZ = 0.1 - 0.5 - 0.42   # IZ - CD/2 - 0.42 (CD ~1.0 for the Kenney cabinet at counter scale)
for tt_ in steps(*TL['ben']['walk'], (-3.5, -1.7), (-0.46, BZ), 0.82): put(sfx, tt_, S48(S.footstep()), 0.16)
for tt_ in steps(*TL['maya']['walk'], (3.6, -1.5), (0.46, BZ), 0.78): put(sfx, tt_, S48(S.footstep()), 0.13)
# Gus turns a page of his paper while they arrive
put(sfx, 1.2, S48(S.paper(0.45)) if hasattr(S, 'paper') else S48(S.scrape(0.4)), 0.05)

# ---- beats ----
put(sfx, TL['ben']['smug'], G.whoosh(0.3, r, peak=0.15, f_lo=900, f_hi=2600, width=0.5), 0.06)          # smug look
for k in range(14): put(sfx, 2.0 + k * 0.045, S48(S.click()), 0.03)                                        # hand rub
put(sfx, TL['eyes'], np.concatenate([S48(S.note(S.hz(n), 0.5, 'pluck')) for n in (64, 63)]), 0.14)     # the stare-down sting
put(sfx, TL['crouch'][0], S48(S.creak(0.4, 160)), 0.06)
put(sfx, TL['lunge'][0] - 0.05, G.whoosh(0.5, r, peak=0.2, f_lo=500, f_hi=3000, width=0.9), 0.32)        # the lunge
for k in range(5): put(sfx, TL['lunge'][0] + 0.05 + k * 0.13, S48(S.footstep()), 0.2)                   # fast steps
put(sfx, TL['gusTurn'][0], S48(S.scrape(0.3)), 0.12)                                                         # paper dropped on the island
put(sfx, TL['slide'][0], S48(S.scrape(TL['slide'][1] - TL['slide'][0])), 0.28)                             # plate slides away
put(sfx, TL['slide'][1] - 0.02, G.clink(r, f0=2600), 0.08)
put(sfx, TL['lift'][0], G.whoosh(0.35, r, peak=0.12, f_lo=1200, f_hi=3500, width=0.6), 0.15)              # donut lifted
put(sfx, TL['slide'][1] + 0.05, G.whoa(r, base=150, dur=0.4), 0.22); put(sfx, TL['slide'][1] + 0.12, G.whoa(r, base=220, dur=0.38), 0.18)   # two gasps
crunch = lambda: S48(S.bp(S.noise(0.12), 900, 5000) * np.exp(-S.tt(0.12) * 30))
put(sfx, TL['bite'], crunch(), 0.5); put(sfx, TL['bite'] + 0.03, S48(S.thud(0.15, 90)), 0.15)            # the bite
k = 0
while TL['chew'][0] + k / 6 < TL['chew'][1]:
    put(sfx, TL['chew'][0] + k / 6, S48(S.lp(S.noise(0.09), 700) * np.exp(-S.tt(0.09) * 25)), 0.12); k += 1   # chewing, in time with the face cycle
put(sfx, TL['annoyed'], S48(S.creak(0.35, 220)), 0.04)
put(sfx, TL['offer'][1], G.clink(r, f0=3100), 0.12)                                                         # empty plate held out
pf = S48(S.fade(S.bp(S.noise(0.45), 500, 2500), 0.05, 0.3)); put(sfx, TL['glance'] + 0.1, pf, 0.08)        # deflated "pfff"

# ---- music: light pizzicato bed in F major, stops dead on the grab, returns for the button ----
beat = 60 / 112; prog = [[53, 57, 60], [58, 62, 65], [60, 64, 67], [53, 57, 60]]
tb, i = 0.0, 0
while tb < DUR:
    ch = prog[(i // 4) % 4]; n = ch[i % 3] + (12 if i % 2 else 0)
    if not (TL['lunge'][0] <= tb < TL['offer'][0]): put(mus, tb, S48(S.note(S.hz(n), 0.4, 'pluck')), 0.05)
    if i % 4 == 0 and not (TL['lunge'][0] <= tb < TL['offer'][0]): put(mus, tb, S48(S.note(S.hz(ch[0] - 12), 0.5, 'pluck')), 0.06)
    tb += beat / 2; i += 1
mus[int((DUR - 0.5) * SR):] *= np.linspace(1, 0, N - int((DUR - 0.5) * SR))

env = np.convolve(np.abs(vo), np.ones(int(0.2 * SR)) / int(0.2 * SR), 'same'); duck = 1 - 0.5 * np.clip(env / 0.04, 0, 1)
mix = vo + sfx * (0.7 + 0.3 * duck) + amb + mus * duck
mix /= max(np.abs(mix).max() / 0.95, 1)
raw = os.path.join(HERE, 'audio/_raw.wav')
with wave.open(raw, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', os.path.join(HERE, 'audio/mix.wav')], check=True)
os.remove(raw); print('audio/mix.wav', DUR, 's')
