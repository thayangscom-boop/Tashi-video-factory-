"""Narration with Chatterbox's built-in voice (voice A the user picked). Run with ./narrate.sh (uses the cbenv/ virtual environment that setup.sh makes). No reference audio: nothing is cloned."""
import json, sys, os
os.environ['TQDM_DISABLE'] = '1'
import torch, numpy as np, soundfile as sf
from chatterbox.tts import ChatterboxTTS
m = ChatterboxTTS.from_pretrained(device='cpu')
only = [int(x) for x in sys.argv[1:]]
def tidy(a, sr):
    e = np.abs(a); thr = 0.012 * e.max(); idx = np.where(e > thr)[0]
    a = a[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.08 * sr)].copy()
    f = int(0.01 * sr); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f); return a
for L in json.load(open('script.json')):
    if L['who'] != 'narrator' or (only and L['id'] not in only): continue
    for k in range(3):                                    # up to three tries, keep the first with a sane pace
        torch.manual_seed(3 + 11 * k)
        w = m.generate(L['text'], exaggeration=0.6, cfg_weight=0.4).squeeze().numpy().astype(np.float32)
        a = tidy(w, m.sr); wps = len(L['text'].split()) / (len(a) / m.sr)
        if 2.2 < wps < 4.6: break
    sf.write(f"vo/l{L['id']:02d}.wav", a, m.sr); print(L['id'], round(len(a) / m.sr, 2), 's', round(wps, 2), 'wps', 'try', k, 'sr', m.sr, flush=True)
