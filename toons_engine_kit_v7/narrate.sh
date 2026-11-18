#!/bin/bash
# Narrator lines in voice A (Chatterbox's own built-in voice, picked by the user on 17 Nov 2026). Optional args: line ids to redo, e.g. ./narrate.sh 3 7
set -e; cd "$(dirname "$0")"
TQDM_DISABLE=1 ./cbenv/bin/python tts_narrator.py "$@" 2>&1 | grep -E "wps|Error|error"
