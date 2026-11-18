"""Character lines (any `who` other than narrator) with stock Pocket TTS voices. No reference audio: nothing is cloned.
   python3 tts_chars.py            -> vo/lNN.wav for every character line in script.json
   Stock voices: alba marius javert jean fantine cosette eponine azelma (and others in pocket_tts). Pick by ear from the samples."""
import json, numpy as np, soundfile as sf
from pocket_tts import TTSModel
V = {"boss": "javert", "wheeler": "charles"}          # who -> stock voice. Edit per story.
m = TTSModel.load_model(); states = {}
for L in json.load(open('script.json')):
    if L['who'] == 'narrator': continue
    v = V.get(L['who'], 'jean')
    if v not in states: states[v] = m.get_state_for_audio_prompt(v)
    a = m.generate_audio(states[v], L['text']).numpy(); e = np.abs(a); i = np.where(e > 0.012 * e.max())[0]
    a = a[max(0, i[0] - 480): i[-1] + 1900]
    if m.sample_rate != 24000:
        from scipy.signal import resample_poly; a = resample_poly(a, 24000, m.sample_rate)
    sf.write(f"vo/l{L['id']:02d}.wav", a.astype(np.float32), 24000); print(L['id'], L['who'], v, round(len(a) / 24000, 2), 's')
