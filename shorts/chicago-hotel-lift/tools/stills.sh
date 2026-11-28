#!/usr/bin/env bash
# Render QC stills at given frame numbers into output/qc/ (half resolution) and a contact sheet.
set -e
cd "$(dirname "$0")/.."
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
mkdir -p output/qc; rm -f output/qc/*.png
npx remotion bundle src/index.ts --out-dir=output/bundle >/dev/null 2>&1 || true
for f in "$@"; do
  npx remotion still output/bundle Short output/qc/f$(printf %04d $f).png --frame=$f --scale=0.5 --browser-executable=$CHROME --log=error &
  while [ $(jobs -r | wc -l) -ge 4 ]; do sleep 0.3; done
done
wait
ffmpeg -loglevel error -y -pattern_type glob -i 'output/qc/f*.png' -vf "scale=270:-1,tile=6x2:padding=6" -frames:v 1 output/qc/sheet.png
