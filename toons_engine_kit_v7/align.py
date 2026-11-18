import json, numpy as np, soundfile as sf
from faster_whisper import WhisperModel
lines=json.load(open('script.json'))
gap={2:0.42,3:0.42,4:0.3,5:0.34,6:0.44,7:0.4,8:0.4,9:0.5,10:0.4,11:0.32,12:0.42,13:0.46,14:0.4,15:0.36,16:0.46,17:0.46}
sr=24000; parts=[np.zeros(int(0.2*sr))]; t=0.2; info=[]
m=WhisperModel('medium.en',device='cpu',compute_type='int8')
for L in lines:
    a,_=sf.read(f"vo/l{L['id']:02d}.wav")
    g=gap.get(L["id"],0.2) if L['id']>1 else 0
    parts.append(np.zeros(int(g*sr))); t+=g
    segs,_=m.transcribe(a.astype(np.float32) if sr==16000 else __import__('scipy.signal',fromlist=['x']).resample_poly(a,2,3).astype(np.float32),word_timestamps=True,temperature=0,condition_on_previous_text=False,initial_prompt="A railroad story: rails, gaps, the Rattler, a canyon, clickety-clack.")
    words=[]
    for s in segs:
        for w in s.words: words.append(dict(w=w.word.strip(),s=round(t+w.start,3),e=round(t+w.end,3)))
    info.append(dict(id=L['id'],who=L['who'],start=round(t,3),end=round(t+len(a)/sr,3),text=L['text'],words=words))
    print(L['id'], ' '.join(x['w'] for x in words))
    parts.append(a); t+=len(a)/sr
parts.append(np.zeros(int(1.5*sr)))
full=np.concatenate(parts); sf.write('vo_full.wav',full,sr)
# refine word starts to the real voice onset (whisper starts can sit inside the pause before a word)
fa = full / (np.abs(full).max() + 1e-9); win = int(0.005 * sr)
env = np.array([np.abs(fa[i:i + win]).max() for i in range(0, len(fa), win)]); moved = 0
for L in info:
    for w in L['words']:
        i0 = int(w['s'] / 0.005); i1 = max(i0 + 1, int(w['e'] / 0.005))
        idx = np.where(env[i0:i1] > 0.035)[0]
        if len(idx):
            ns = round(max(w['s'], (i0 + idx[0]) * 0.005 - 0.03), 3)
            moved += ns - w['s'] > 0.06; w['s'] = ns
print('refined onsets', moved)
json.dump(info,open('timing.json','w'),indent=1)
print('dur',len(full)/sr)
