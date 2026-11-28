#!/usr/bin/env bash
# QC stills for a 3D composition: tools/stills3d.sh <CompositionId> <frame> [frame...]
set -e
cd "$(dirname "$0")/.."
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
COMP=$1; shift
mkdir -p output/qc3d; rm -f output/qc3d/f*.png
npx remotion bundle src/index.ts --out-dir=output/bundle >/dev/null 2>&1
for f in "$@"; do
  npx remotion still output/bundle "$COMP" output/qc3d/f$(printf %04d $f).png --frame=$f --scale=${SCALE:-0.5} --gl=angle --browser-executable=$CHROME --log=error &
  while [ $(jobs -r | wc -l) -ge 3 ]; do sleep 0.3; done
done
wait
ffmpeg -loglevel error -y -pattern_type glob -i 'output/qc3d/f*.png' -vf "tile=${TILE:-3x1}:padding=6" -frames:v 1 output/qc3d/sheet.png
