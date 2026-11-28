"""Sound-effect bed for the bundled 10 s office skit ("Reply all"), built with this skill's own
generators in upstream-2d/templates/audio (numpy + scipy, no samples).

Added when the skill was installed into Tashi-video-factory: the repo's render.cjs writes video only,
and the skit has no voice in the repo. Event times are copied from the skit in engine/main.js
(T2=3.19, CLICK=5.0, T3=5.6, coworkers +0.18 s each, whip 6.55, T4=7.9), so each sound lands on its action.

Usage (from the skill folder):  python3 tools/demo_skit_sfx.py engine/out/skit.mp4 engine/out/skit_sfx.mp4
Needs numpy + scipy. Writes a 48 kHz mix next to the video and muxes it in, loudness-normalised to -14 LUFS.
"""
import os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'upstream-2d', 'templates', 'audio'))
from dsp import SR, ns, tt, lp, hp, bp, write_wav, fades  # noqa: E402
import sfx_gen as G  # noqa: E402

DUR = 10.0
T2, CLICK, T3, WHIP, T4 = 3.19, 5.0, 5.6, 6.55, 7.9
CUTS = [1.7, T2, 4.6, 5.45, T4]
r = np.random.default_rng(7)
mix = np.zeros(ns(DUR))
def put(t, x, g=1.0):
    i = ns(t); j = min(len(mix), i + len(x))
    if j > i: mix[i:j] += g * x[:j - i]

def key(soft=1.0):   # one keyboard key: plastic tick + low thock
    d = 0.06; t = tt(d); nz = r.standard_normal(len(t))
    return (bp(nz, 1800, 7000, 1) * np.exp(-t / 0.004) * 0.6 + np.sin(2 * np.pi * r.uniform(180, 260) * t) * np.exp(-t / 0.012) * 0.5) * soft
def ping():          # mail-notification chime
    d = 0.7; t = tt(d)
    return fades((np.sin(2 * np.pi * 1318 * t) * np.exp(-t / 0.18) + 0.6 * np.sin(2 * np.pi * 1760 * t) * np.exp(-np.maximum(t - 0.09, 0) / 0.2) * (t > 0.09)), 0.002, 0.05)
def room(d):         # office air: HVAC hum + distant traffic
    t = tt(d); nz = r.standard_normal(len(t))
    return lp(nz, 300, 2) * 0.25 + np.sin(2 * np.pi * 60 * t) * 0.01

put(0, fades(room(DUR), 0.3, 0.5), 0.18)
put(0, fades(G.babble(DUR, r, 120, 1.0), 0.5, 0.5), 0.05)                    # far-off office chatter
# his typing until he reaches for the mouse; coworkers type until their screens flash
t = 0.15
while t < 3.55:
    put(t, key(0.9 if 1.7 <= t < T2 else 0.6), 0.22); t += r.uniform(0.07, 0.16)
for i, x in enumerate([0, 1, 2]):
    t = 0.3 + i * 0.05
    while t < T3 + i * 0.18:
        put(t, key(0.35), 0.12); t += r.uniform(0.09, 0.2)
# cursor drift, then the click (big in the ECU snap-zoom)
put(4.6, G.whoosh(0.35, r, peak=0.2, f_lo=900, f_hi=3000, width=0.5), 0.08)
put(CLICK, key(1.6), 0.6); put(CLICK + 0.06, key(0.8), 0.3)
put(CLICK - 0.02, G.whoosh(0.25, r, peak=0.08, f_lo=1500, f_hi=4000), 0.18)  # snap-zoom
# three notifications, one per coworker screen flash, then the "!" reactions
for i in range(3):
    put(T3 + i * 0.18, ping(), 0.32)
    put(T3 + i * 0.18 + 0.35, G.whoa(r, dur=0.42), 0.22)
# whip pan between reactions
put(WHIP - 0.06, G.whoosh(0.4, r, peak=0.14, f_lo=500, f_hi=3200, width=0.9), 0.4)
# "oh no": low swell under the dolly-zoom, chair creak as he sinks
t = tt(DUR - T4); sw = lp(r.standard_normal(len(t)), 220, 2) * (t / (DUR - T4)) ** 1.6 + np.sin(2 * np.pi * (55 - 12 * t / (DUR - T4)) * t) * 0.4 * (t / (DUR - T4)) ** 2
put(T4, fades(sw, 0.05, 0.3), 0.5)
put(T4 + 0.1, G.creak(1.2, r, rate0=90, rate1=40), 0.25)
put(T4 + 0.05, G.oof(r, kind='oh'), 0.3)
# soft cut accents
for c in CUTS[:3]: put(c - 0.05, G.whoosh(0.18, r, peak=0.07, f_lo=800, f_hi=2400), 0.06)

mix /= max(np.abs(mix).max() / 0.9, 1)
vid, out = sys.argv[1], sys.argv[2]
wav = os.path.splitext(out)[0] + '_sfx.wav'
write_wav(wav, mix)   # dsp.st() turns mono into the stereo shape write_wav expects
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], check=True)
print('wrote', out)
