# The building that turned — production brief

**Format:** 9:16, 1080×1920, 30 fps, 63.2 s, cut to the user's voiceover (`audio/voiceover.mp3`).
**Style:** same as `shorts/chicago-v3` (V3 white-headed cast on the claude-3d-animated-shorts engine, toon + rim, AO, bloom, warm grade, word-timed captions with yellow hot words).
**Facts:** see `production/script.md` (fact table with sources).

## Shots (cuts from `timeline.json`)
| # | Time | Shot | What happens |
|---|------|------|--------------|
| 1 | 0–3.1 | hook | Ruth walks into work over a plank bridge; crane up reveals the whole building turning on rollers, men at jacks |
| 2 | 3.1–6.6 | deskShock | Ruth with her coffee; the street outside her window slides past; double take, shock |
| 3 | 6.6–9.9 | city1930 | 1930 Indianapolis street: sedans, pedestrians, the eight-storey Indiana Bell building. Card INDIANAPOLIS · 1930 |
| 4 | 9.9–15.6 | plans | Two executives unroll the new-HQ blueprint; a glowing wireframe tower rises over the old building. Card 8 STORIES |
| 5 | 15.6–20.9 | switchboard | Operators plugging cords; at "shut it down" the board goes dark lamp by lamp, music drops out. Card CALLS: SILENT |
| 6 | 20.9–25.2 | architect | Kurt Vonnegut Sr. at his drafting table (lower third); light-bulb idea; his boy reading in the armchair |
| 7 | 25.2–27.2 | moveIt | Overhead on the site plan: an arrow is drawn, MOVE IT is stamped |
| 8 | 27.2–31.6 | rollers | Men roll steel rollers in along the timber track; low wide tilt up the building. Card 11,000 TONS |
| 9 | 31.6–36.8 | jacks | The row of screw jacks, men pumping the bars, foreman; card 15 IN / HOUR with a running clock |
| 10 | 36.8–43.2 | map | Overhead time-lapse with north arrow: 52 ft south, 90° turn, 100 ft west; the path is drawn on the ground |
| 11 | 43.2–48.6 | cutaway | Cut-away of the building rolling along with office, switchboard and lobby all working. Card 600 EMPLOYEES |
| 12 | 48.6–54.1 | pipes | The four flexible lines (GAS / WATER / POWER / PHONE) stretching to the moving building, tags pop on each word |
| 13 | 54.1–56.2 | bridge | People walk in over the moving bridge |
| 14 | 56.2–59.1 | call | An operator connects; Ruth's desk phone rings, she answers. Card SERVICE NEVER STOPPED |
| 15 | 59.1–63.2 | son | The boy looks up from his book; lower third KURT VONNEGUT · NOVELIST · HIS SON |

## Build
```
python3 make_timeline.py            # timeline.json from audio/transcript.json
/home/user/.venv-tts/bin/python make_audio.py   # audio/mix.wav
./stills.sh 1.5 5.5 ...             # QC stills + out/sheet.jpg
node render.cjs out/silent.mp4 1080 1920 30     # full render (CHROME / CHROME_ARGS as in stills.sh)
```
