#!/bin/bash
# One-time setup in a fresh workspace. Run from the kit folder. Takes about 5-10 minutes (the narrator model is the big part).
set -e; cd "$(dirname "$0")"
pip install --break-system-packages -q -r requirements.txt
[ -d node_modules/three ] || npm install --silent
# headless browser for the frame renderer: use Google Chrome if present, else Playwright's own Chromium
[ -x /usr/bin/google-chrome ] || python3 -m playwright install --with-deps chromium
# narrator (voice A): Chatterbox in its own virtual environment, CPU build of torch
if [ ! -x cbenv/bin/python ]; then
  python3 -m venv cbenv
  cbenv/bin/pip install -q --extra-index-url https://download.pytorch.org/whl/cpu chatterbox-tts "setuptools<81"
fi
mkdir -p vo web3d/out
python3 -c "import skia, cv2, faster_whisper, pocket_tts, playwright; print('python ok')"
./cbenv/bin/python -c "import chatterbox; print('narrator ok')"
./web3d/build.sh
