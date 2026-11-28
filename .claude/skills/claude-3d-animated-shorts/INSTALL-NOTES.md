# Installed in Tashi-video-factory

This is a separate skill. It sits next to `viral-animated-shorts-studio` and does not touch it or the Remotion project in `shorts/`.

- **Source:** https://github.com/thuann-vn/claude-3d-animated-shorts, MIT licence. The commit is recorded in `UPSTREAM_COMMIT`.
- **Skill name:** `claude-3d-animated-shorts`. In Claude Code, type `/claude-3d-animated-shorts`, or ask for "a 3D animated short in the RicksClips style".

## Changes made to the upstream files
1. `engine/render.cjs`: the Chromium launch flags can now be overridden with the `CHROME_ARGS` environment variable. The default is unchanged (macOS Metal flags). On Linux and cloud sessions use:
   `CHROME_ARGS="--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist"`
   (Chromium will not start as root without `--no-sandbox`, and there is no GPU, so WebGL runs on SwiftShader.)

## Files added
- `scripts/fetch-assets-cloud.sh`: fetches the same assets as `scripts/fetch-assets.sh`. The fonts come from `raw.githubusercontent.com`, because the cloud proxy refuses the `github.com/.../raw/` URLs the original uses. It skips files that are already present.
- `tools/demo_skit_sfx.py`: a sound-effect bed for the bundled office skit, made with the skill's own generators (`upstream-2d/templates/audio`). Upstream `render.cjs` writes video only.
- `INSTALL-NOTES.md`: this file.

## What is not committed (re-created per session)
`engine/node_modules`, the Xbot rig, the horse, the fonts and the Poly Haven props (about 53 MB) are git-ignored by the upstream `.gitignore`. A fresh cloud session needs:

```bash
cd .claude/skills/claude-3d-animated-shorts/engine && npm ci && bash ../scripts/fetch-assets-cloud.sh
```

The repository's cloud environment allows `api.polyhaven.com` and `dl.polyhaven.org` for the props.

## Render in a cloud session
```bash
cd .claude/skills/claude-3d-animated-shorts/engine
export CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
export CHROME_ARGS="--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist"
XQ="&viewer=1&skit=1" node render.cjs out/skit.mp4 540 960 30 1 3 5 7 9   # stills first
XQ="&viewer=1&skit=1" node render.cjs out/skit.mp4 1080 1920 30            # full 10 s skit
cd .. && python3 tools/demo_skit_sfx.py engine/out/skit.mp4 engine/out/skit_sfx.mp4   # needs numpy + scipy
```

## Limits in this environment
- **Voice:** `tools/tts.mjs` calls ElevenLabs. It needs an `ELEVENLABS_API_KEY` and defaults to a Vietnamese voice and `language_code: vi`. No key is configured here. The repo's existing local Piper voice (`shorts/chicago-hotel-lift/tools/make_voice.py`) can stand in, but Piper gives no word timings, which `captions.py` needs for word-by-word captions.
- **Language:** the bundled skit, the cast names, the viewer UI and the sample timings are all in Vietnamese.
- **Speed:** rendering is CPU-only (SwiftShader).
