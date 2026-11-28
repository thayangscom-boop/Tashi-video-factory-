# Builds timeline.json (cuts, shot names, story events, word-timed captions) from audio/transcript.json.
import json, re
T = json.load(open('audio/transcript.json'))
W = [dict(w) for s in T for w in s['words']]
# merge split tokens ("eight" "-story", "11" ",000", "90" "-degree")
M = []
for w in W:
    if M and re.match(r'^[-,]', w['w']): M[-1]['w'] += w['w']; M[-1]['e'] = w['e']
    else: M.append(w)
HOT = {'ENTIRE', 'TURNED', '1930', 'EIGHT-STORY', 'SILENT', 'CRAZY', 'MOVE', '11,000', 'TONS', 'EIGHTEEN', '15', '52', 'SOUTH', '90-DEGREE', '100', 'WEST', '600', 'FLEXIBLE', 'MOVING', 'NEVER', 'NOVELIST', 'VONNEGUT', 'WILDEST'}
caps, cur = [], []
for i, w in enumerate(M):
    cur.append(w); end = re.search(r'[.,?!]$', w['w']); nxt = M[i + 1]['s'] if i + 1 < len(M) else w['e'] + 0.6
    if end or len(cur) >= 3 or nxt - w['e'] > 0.45:
        caps.append(cur); cur = []
if cur: caps.append(cur)
C = []
for k, c in enumerate(caps):
    t0 = c[0]['s']; t1 = caps[k + 1][0]['s'] if k + 1 < len(caps) else c[-1]['e'] + 0.8
    t1 = min(t1, c[-1]['e'] + 0.9)
    C.append({'t0': round(t0, 2), 't1': round(t1, 2), 'words': [{'w': x['w'].upper().replace('SR.', 'SR.'), 's': x['s'], 'hot': re.sub(r'[.,?!]', '', x['w'].upper()) in HOT} for x in c]})
cuts = [0, 3.1, 6.6, 9.9, 15.6, 20.9, 25.2, 27.2, 31.6, 36.8, 43.2, 48.6, 54.1, 56.2, 59.1]
shots = ['hook', 'deskShock', 'city1930', 'plans', 'switchboard', 'architect', 'moveIt', 'rollers', 'jacks', 'map', 'cutaway', 'pipes', 'bridge', 'call', 'son']
ev = {'slide': 3.9, 'shock': 4.75, 'stamp': 26.68, 'idea': 24.04, 'unroll': [10.6, 11.4], 'ghost': [12.4, 13.4], 'dark': [18.4, 20.3], 'ring': 57.0, 'answer': 57.9,
      'south': [37.0, 38.7], 'turn': [38.9, 41.2], 'west': [41.3, 43.1], 'lookUp': 61.3, 'endCard': 62.0}
json.dump({'dur': 63.2, 'cuts': cuts, 'shots': shots, 'ev': ev, 'captions': C}, open('timeline.json', 'w'), indent=1)
print(len(C), 'captions'); [print(c['t0'], c['t1'], ' '.join(w['w'] + ('*' if w['hot'] else '') for w in c['words'])) for c in C]
