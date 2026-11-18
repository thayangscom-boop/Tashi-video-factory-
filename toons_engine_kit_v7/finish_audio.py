"""Bring mix.wav up to the locked loudness (about -11.6 LUFS, peaks limited) -> mix_loud.wav"""
import subprocess, re, os
ROOT = os.path.dirname(os.path.abspath(__file__))
TARGET = -11.6
def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1])
src, out = f'{ROOT}/mix.wav', f'{ROOT}/mix_loud.wav'
gain = TARGET - lufs(src)
for _ in range(5):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.86:attack=5:release=60:level=false', out], check=True)
    got = lufs(out)
    if abs(got - TARGET) < 0.2:
        break
    gain += TARGET - got
print(f'mix_loud.wav at {got:.1f} LUFS (target {TARGET}), gain {gain:+.1f} dB')
