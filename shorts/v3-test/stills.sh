#!/usr/bin/env bash
# QC: render stills at the given seconds (540x960) and a contact sheet -> out/sheet.jpg
set -e; cd "$(dirname "$0")"
export CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome} CHROME_ARGS=${CHROME_ARGS:---no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist}
rm -f out/still-*.jpg; node render.cjs out/x.mp4 ${W:-540} ${H:-960} 30 "$@"
python3 ../../.claude/skills/claude-3d-animated-shorts/tools/sheet.py out out/sheet.jpg ${COLS:-6}
