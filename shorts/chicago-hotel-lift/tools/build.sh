#!/usr/bin/env bash
# Full pipeline: narration -> sfx/music mix -> loudness normalise -> render MP4.
# Usage: tools/build.sh [--skip-voice]   (env: PY = python with piper-tts+numpy, CHROME = chromium path)
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PY:-python3}
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
[ "${1:-}" = "--skip-voice" ] || "$PY" -I tools/make_voice.py
"$PY" -I tools/make_audio.py
ffmpeg -loglevel error -y -i public/audio/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 public/audio/mix_norm.wav
mv public/audio/mix_norm.wav public/audio/mix.wav
npx tsc --noEmit
npx remotion render src/index.ts Short output/short.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p \
  --audio-codec=aac --audio-bitrate=192k --browser-executable="$CHROME" --concurrency=4 --log=error
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact output/short.mp4
