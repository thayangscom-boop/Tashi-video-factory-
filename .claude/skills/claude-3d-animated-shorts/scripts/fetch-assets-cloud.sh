#!/usr/bin/env bash
# Cloud-session variant of fetch-assets.sh (added when this skill was installed into Tashi-video-factory).
# Same files and licences as the original. The original fetches the fonts through github.com/.../raw/...,
# which the cloud network proxy refuses; here they come from raw.githubusercontent.com, the same
# host the original already uses for Xbot/Horse. Skips files that are already present, so it is cheap to re-run.
# Poly Haven needs api.polyhaven.com + dl.polyhaven.org on the environment's allowlist.
set -euo pipefail
cd "$(dirname "$0")/../engine"
mkdir -p assets/rigs assets/horse film
get() { [ -s "$2" ] || curl -fsSL --retry 3 -o "$2" "$1"; }
TJ=https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/models/gltf
get "$TJ/Xbot.glb" assets/rigs/Xbot.glb
get "$TJ/Horse.glb" assets/horse/Horse.glb
get https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf film/Anton.ttf
get https://raw.githubusercontent.com/rsms/inter/v3.19/docs/font-files/Inter-Black.otf film/Inter-Black.otf
echo "rig, horse, fonts ok"
# Poly Haven block: identical to the one in fetch-assets.sh, plus skip-if-present
python3 - <<'PY'
import json, os, urllib.request
UA = {'User-Agent': 'claude-3d-animated-shorts/1.0'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
ids = ['metal_office_desk','modern_arm_chair_01','classic_laptop','office_notepads','clipboard','desk_lamp_arm_01','potted_plant_01','potted_plant_02','potted_plant_04','pachira_aquatica_01','drawer_cabinet','Shelf_01','book_encyclopedia_set_01','hanging_picture_frame_01','hanging_picture_frame_02','CoffeeCart_01','mounted_fluorescent_lights','modern_ceiling_lamp_01','sofa_02','modern_coffee_table_01','side_table_01','mid_century_lounge_chair','ceiling_fan','fire_alarm','projector_screen','alarm_clock_01','ceramic_vase_01','painted_wooden_shelves']
base = 'assets/props/polyhaven'
for i in ids:
    if os.path.exists(f'{base}/{i}/{i}.gltf'): continue
    g = json.loads(get(f'https://api.polyhaven.com/files/{i}'))['gltf']['1k']['gltf']; os.makedirs(f'{base}/{i}', exist_ok=True)
    for rel, v in g.get('include', {}).items():
        p = os.path.join(base, i, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(get(v['url']))
    open(f'{base}/{i}/{i}.gltf', 'wb').write(get(g['url']))   # written last, so a half-finished prop is retried next time
print('poly haven ok')
PY
