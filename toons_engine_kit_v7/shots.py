"""THE PER-STORY PYTHON FILE. Edit the four marked blocks for each new video.
   python3 shots.py   -> writes web3d/src/cues.json (shot start times + word cues) from the narration timing.
   audio.py and assemble.py import this file for the cut list, sound effects, whip pans, labels and the flash."""
import json, math, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
FPS = 30
CUES = f'{ROOT}/web3d/src/cues.json'

# ============================================================ 1. CUES: when each shot starts, and the word moments the scene reacts to
def make_cues():
    import timing
    from timing import at, ls
    le = lambda i: timing.LINE[i]['end']
    p = 0.1                                   # cut this long before a line starts
    S = dict(s01=0.0, s02=at(1,'On')-.05, s03=ls(2)-p, s04=at(2,'First')-.05, s05=ls(3)-p, s06=at(3,'as')-.05, s07=ls(4)-p, s08=ls(5)-p, s09=ls(6)-p, s10=at(6,'And')-.05,
             s11=ls(7)-p, s12=at(7,'His')-.05, s13=ls(8)-p, s14=at(8,'And')-.05, s15=ls(9)-p, s16=at(9,'And')-.05, s17=ls(10)-p, s18=at(10,'By')-.05, s19=ls(11)-p,
             s20=ls(12)-p, s21=at(12,'Steel')-.05, s22=ls(13)-p, s23=at(13,'A')-.05, s24=ls(14)-p, s25=at(14,'Just')-.05, s26=ls(15)-p, s27=at(15,'and')-.05, s28=ls(16)-p, s29=ls(17)-p, s30=at(17,'That',1)-.05)
    W = dict(purpose=at(1,'purpose.'), finger=at(3,'finger.'), l4=ls(4), l4e=le(4), wins=at(6,'wins'), rattle=at(7,'rattle'), rattler=at(8,'Rattler.'), shrink=at(9,'shrink.'), coin=at(10,'coin'), card=at(10,'card.'),
             l11=ls(11), l11e=le(11), creak=at(12,'creak.'), close=at(13,'close.'), fit=at(13,'fit.'), snake=at(14,'snake.'), bend=at(14,'bend.'), brakes=at(15,'brakes,'), short=at(15,'short.'), clack=at(17,'clickety-clack'), grow=at(17,'grow.'), meets=at(13,'meets'))
    ks = list(S); bad = [(ks[i], ks[i + 1]) for i in range(len(ks) - 1) if S[ks[i + 1]] - S[ks[i]] < 0.5]
    if bad: print('WARNING: shots shorter than 0.5 s (a cue word is probably found in the wrong line):', bad)
    TOTAL = round((le(max(timing.LINE)) + 0.9) * FPS)
    json.dump(dict(TOTAL=TOTAL, S={k: round(max(0, v), 3) for k, v in S.items()}, W={k: round(v, 3) for k, v in W.items()}), open(CUES, 'w'), indent=1)
    print('cues.json:', len(S), 'shots,', TOTAL, 'frames')

if __name__ == '__main__':
    make_cues(); sys.exit()

C = json.load(open(CUES)); S, W = C['S'], C['W']
CUT = {k: math.ceil(v * FPS - 1e-4) / FPS for k, v in S.items()}     # the picture cuts on the next whole frame
class Shot:
    def __init__(s, name, t0, trans): s.name, s.t0, s.trans = name, t0, trans

# ============================================================ 2. BIG CUTS: scene changes get a whip pan (motion blur + big whoosh); other cuts are straight
BIG = {'s03', 's09', 's15', 's24', 's28'}
WHIP_BLUR = ['s03', 's09', 's24', 's28']            # cuts that get the sideways motion blur in assemble.py

# ============================================================ 3. LABELS and FLASH (assemble.py). Label: (shot, [(text, 'l2'|'acc'), ...], delay s, x, baseline y, scale)
LABELS = []                                          # e.g. [('s01', [('Pittsburgh', 'l2'), ('1995', 'acc')], 0.35, 40, 200, 0.7)]
FLASH_AT = None                                      # a time in seconds for a camera-flash white frame, or None
MUSIC = False                                        # background music bed: off (the user's choice since the railroad video). True brings it back.

# ============================================================ 4. SOUND EFFECTS fired on cuts and words. Kinds: step pop thud sparkle tick chug chaching whistle flutter dig
SHOTS = [Shot(k, CUT[k], 'whip' if k in BIG else 'cut') for k in S]
SFX = []
def sfx(kind, t, gain=1.0): SFX.append((kind, t, gain))
def saw(t0, t1, gain=0.4):
    t = t0
    while t < t1 - 0.05: sfx('dig', t, gain); t += 0.28
def clack(t0, t1, every=0.42, gain=0.6):          # clickety-clack: two quick ticks per rail joint
    t = t0
    while t < t1 - 0.1: sfx('tick', t, gain); sfx('tick', t + 0.09, gain * 0.8); t += every
c = CUT
saw(c['s01'] + 0.2, c['s02'] - 0.1); sfx('pop', W['purpose'], 0.6)
sfx('chug', c['s03'] + 0.2, 0.4); sfx('sparkle', c['s04'] + 0.3, 0.5)
sfx('pop', W['finger'], 0.7); sfx('thud', c['s07'] + 0.05, 0.9); saw(c['s08'] + 0.1, c['s09'] - 0.1)
sfx('sparkle', c['s09'] + 0.6, 0.5); sfx('chug', c['s10'] + 0.1, 0.6); sfx('chaching', W['wins'] + 0.3, 0.7)
sfx('whistle', c['s11'] + 0.2, 0.3); sfx('chug', c['s12'], 0.7); clack(c['s12'] + 0.15, c['s13'] - 0.05, 0.3, 0.8)
sfx('flutter', c['s13'], 0.4); sfx('pop', W['rattler'], 0.6); sfx('whistle', c['s14'] + 0.6, 0.35)
sfx('pop', c['s15'] + 0.2, 0.5); sfx('tick', W['shrink'], 0.5)
sfx('chaching', W['coin'] - 0.1, 0.6); sfx('pop', W['card'] - 0.15, 0.6); sfx('pop', W['card'] + 0.15, 0.4)
sfx('dig', W['creak'] - 0.2, 0.7); sfx('dig', W['creak'] + 0.2, 0.7); sfx('whistle', W['creak'] + 0.5, 0.3); sfx('dig', c['s21'] + 0.5, 0.6)
sfx('thud', W['close'] + 0.1, 0.7); sfx('tick', W['meets'] + 0.3, 0.7); sfx('sparkle', W['fit'], 0.8)
sfx('thud', c['s24'] + 0.08, 1.0); sfx('dig', c['s24'] + 0.3, 0.8); sfx('whistle', W['snake'], 0.5); sfx('chug', c['s25'] + 0.05, 0.8); sfx('chug', c['s25'] + 0.9, 0.8)
sfx('whistle', W['brakes'] - 0.1, 0.9); sfx('dig', W['brakes'] + 0.3, 0.8); sfx('dig', W['brakes'] + 0.6, 0.7); sfx('thud', W['short'] - 0.3, 0.6); sfx('pop', W['short'] + 0.2, 0.5)
saw(c['s28'] + 0.3, c['s29'] - 0.2)
clack(c['s29'] + 0.1, c['s30'] - 0.05, 0.36, 0.9); clack(c['s30'] + 0.2, c['s30'] + 2.4, 0.5, 0.45); sfx('sparkle', W['grow'], 0.9)
END_MUSIC = W['grow']
