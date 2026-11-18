"""Script-token timings: at(line, 'word') -> time the word is spoken."""
import json, re, difflib, os
ROOT = os.path.dirname(os.path.abspath(__file__))
TIM = json.load(open(f'{ROOT}/timing.json'))
LINE = {L['id']: L for L in TIM}
SCRIPT = {L['id']: L['text'] for L in json.load(open(f'{ROOT}/script.json'))}
REPL = {}
def norm(s):
    return re.sub(r"[^a-z0-9$]", "", s.lower().replace("’", "'"))
TOK = {}
for L in TIM:
    txt = SCRIPT[L['id']].replace('— ', '')
    for a, b in REPL.get(L['id'], []):
        txt = txt.replace(a, b)
    toks = txt.split(); ww = L['words']
    A = [norm(t) for t in toks]; B = [norm(x['w']) for x in ww]
    times = [None] * len(toks)
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(a=A, b=B, autojunk=False).get_opcodes():
        if op == 'equal':
            for k in range(i2 - i1): times[i1 + k] = ww[j1 + k]['s']
        elif op == 'replace':
            for k in range(i2 - i1): times[i1 + k] = ww[j1 + (k * (j2 - j1)) // (i2 - i1)]['s']
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j] for j in range(i - 1, -1, -1) if times[j] is not None), L['start'] - 0.02)
            times[i] = prev + 0.02
    for i in range(1, len(times)):
        times[i] = max(times[i], times[i - 1] + 0.02)
    TOK[L['id']] = list(zip(toks, times))
def at(line, word, nth=0, off=0.0):
    key = norm(word)
    m = [t for tok, t in TOK[line] if norm(tok) == key]
    assert m, (line, word, [t for t, _ in TOK[line]])
    return m[nth] + off
def ls(line): return LINE[line]['start']
def le(line): return LINE[line]['end']
if __name__ == '__main__':
    for i in sorted(TOK):
        print(i, LINE[i]['who'], f"{ls(i):.2f}-{le(i):.2f}", ' '.join(f"{t}@{s:.2f}" for t, s in TOK[i]))
