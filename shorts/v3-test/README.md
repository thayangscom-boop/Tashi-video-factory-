# V3 test — "The Last Donut" (10 s)

A 10-second test of the `viral-cartoon-3d-shorts` skill. The characters (Ben, Maya, Gus), faces, story, set layout, camera, sound and captions are original. Brief, cast sheet and shot list: `production/brief.md`.

It reuses the installed `claude-3d-animated-shorts` engine as a library: the character builder on the Xbot rig, the post chain (grade, ambient occlusion, depth of field), Kenney CC0 props and the font. It imports those files from the skill folder and changes nothing there. Assets: `production/assets-manifest.json`.

## Files
| File | What it is |
|---|---|
| `timeline.json` | One timeline for everything: shot cuts, narration placement, captions and every action time. `v3.js` and `make_audio.py` both read it. |
| `v3.js`, `index.html` | The scene: room, cast, acting, cameras, captions (drawn into the frame). |
| `v3faces.js` | Original expression set: neutral, curious, suspicious, happy, annoyed, worried, shocked, embarrassed, smug, chewing. |
| `make_audio.py` | Narration placement, synthesized sound effects on the animation's event times, music bed, ducking, loudness normalisation. |
| `render.cjs`, `stills.sh` | Renderer (headless Chromium) and QC stills / contact sheet. |
| `out/v3-test.mp4` | The rendered test (1080×1920, 30 fps, 10 s, with audio). |

## Build
Needs the skill's engine set up first (`cd .claude/skills/claude-3d-animated-shorts/engine && npm ci && bash ../scripts/fetch-assets-cloud.sh`). The environment setup script does this automatically.

```bash
cd shorts/v3-test
export CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
export CHROME_ARGS="--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist"
./stills.sh 1 3 5 7 9                        # QC stills -> out/sheet.jpg
python3 make_audio.py                        # audio/mix.wav (numpy + scipy); narration in audio/vo*.wav (Piper)
node render.cjs out/video.mp4 1080 1920 30   # video
ffmpeg -i out/video.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/v3-test.mp4
```
