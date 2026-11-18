# True Story Toons — locked engine style (kit v7)

Locked on 18 Nov 2026. This is the look of the three videos made with the Three.js engine:
`emperor_norton_v1.mp4`, `lemon_juice_robber_v1.mp4` and `railroad_gaps_v1.mp4` (frames in `reference_frames/`).
It replaces kit v6 (Blender plates + depth-warp camera, "Poyais v3"). For a new video change the story, keep everything else.

## What is in the kit

| Path | What it is |
|---|---|
| `web3d/eng/` | The engine (MIT, see `LICENSE`): toon characters, painted textures, two-tone shading, ink outlines, lens blur, grade. **Do not edit.** |
| `web3d/src/main.ts` | Renderer, lights, sky, shadows, camera path, per-frame update. Edit only the `ctx` hooks for story-specific moving objects (trains, cars, gaps…). |
| `web3d/src/world.ts` | **Per story.** The sets: ground, buildings, rooms, props, documents (newspapers, photos, charts) and moving objects. |
| `web3d/src/people.ts` | **Per story.** The cast: the `OUT` outfit table. Placement/drawing code below it stays. |
| `web3d/src/story.ts` | **Per story.** The shot list: camera keys, lens blur, light, who is where and what they do on each word. |
| `web3d/src/cues.json` | Written by `shots.py`: shot start times and word cues. |
| `web3d/render.py` | Renders frames in headless Chrome (software WebGL). `render_batch.py` = the full render in safe chunks. `chk.py` = test sheets. `strip.py` = a strip of finished frames. |
| `script.json` | **Per story.** About 17 short lines: `id`, `who` (`narrator` or a character), `text`. |
| `narrate.sh` + `tts_narrator.py` | Narrator in voice A. `tts_chars.py` = character lines (**per story:** its `V` table). |
| `align.py` | **Per story:** `gap` table (pause before each line) and `initial_prompt` (names). Builds `vo_full.wav` + `timing.json`. |
| `timing.py` | **Per story:** `REPL` (how spoken numbers show in captions, e.g. "nineteen ninety-five," → "1995,"). |
| `captions.py` | **Per story:** only `MARKUP`. Layout, fonts and colours stay. |
| `shots.py` | **Per story:** cue words, whip-pan cuts, labels, flash, music switch, sound effects. |
| `audio.py`, `finish_audio.py`, `assemble.py`, `cover.py` | Sound mix, loudness, final video, cover. Do not edit (cover takes its title as arguments). |
| `examples/` | Complete per-story files of all three videos: `norton` (city street, newspaper office, wharf), `lemon` (street, bank, flat, university office, four sets in one world), `railroad` (desert canyon, trains, buckling track). Start a new story by copying the closest one. |

## Build order

```
./setup.sh                                   # once per workspace (5-10 min)
# write script.json, then:
./narrate.sh && python3 tts_chars.py         # narrator + character lines -> vo/lNN.wav (narrator ~10 min on 2 cores)
python3 align.py                             # -> vo_full.wav, timing.json; check every printed line reads right
python3 shots.py                             # -> web3d/src/cues.json (edit block 1 first)
cd web3d && ./build.sh && python3 chk.py 0.5 # one test frame per shot -> out/chk/sheet_*.jpg; look at all of them
python3 chk.py 0.04,0.96                     # first and last frame of every shot (camera moves, things leaving frame)
python3 render_batch.py 560                  # repeat until "left 0" (full size, ~4-5 h for 60-67 s)
cd .. && python3 audio.py && python3 finish_audio.py
python3 assemble.py <story>_v1.mp4
python3 cover.py web3d/out/full/f_0345.jpg <story>_cover.jpg "Bold title line" "accent" "True story" "1995"
```

Narration first: every shot starts on a spoken word, so the picture is timed to the voice.

## Picture

- **Format:** 1080×1920, 30 fps, H.264 (crf 19) + AAC, 55–70 s. Rendered at full size (`render_batch.py` scale 1). Never render small and enlarge.
- **Sets:** real 3D scenes built in code from the engine's materials and painted textures, dressed with props (signs, crates, lamps, plants, furniture, vehicles, documents). Each location gets several camera positions. Sets in one world sit side by side at x offsets (`ox`), as in `examples/lemon`.
- **Characters:** the engine's flat 2D cards: round cream heads, thick dark-brown outlines, stick limbs, simple outfits, 14 expressions, poses (`armR`: salute/point/hold/up; `armL`: up), held props (`held`: gun, bag, polaroid, lemon, photo, cuffs, saw), `back: true` (seen from behind), `juice: true` (wet face). Feet on the 3D ground with a contact shadow; lit by the scene.
- **Look:** two-tone toon shading, ink outlines (fade out between 30 and 90 m so far buildings never flicker), lens blur for depth of field (`cInf`), bloom, neutral tone map, film grade. Light: `day` or `golden` (sunset, sun disc). Golden light turns shadows purple: close-ups of small props need `day` light.
- **No shaking backgrounds (user complaint, fixed):** full-size render; calm low-contrast textures with no fine patterns; the shadow box is fixed per shot (`shadow:`) and snapped to shadow-map texels; no camera wobble except shots marked `hand:`; whip pans only at scene changes.
- **Documents:** newspapers, photos, TV screens, charts are textured planes (`doc(key, pos, height, roll, yaw)` in a shot) drawn in `world.ts` `docTex`. A paper flying up into frame = "push in on the paper".

### The 15 camera moves (all used; name each shot's `move`)

| Move | How in `story.ts` |
|---|---|
| Dolly in / out | two keys on the same line of sight, nearer / farther |
| 360° orbit | `cam: orbit(centre, radius, camY, a0, a1, fov, cInf)`, e.g. 15→375° |
| Side tracking | camera and subject move together along z, camera off to the side |
| Front tracking | camera ahead of the subject looking back, both moving |
| Rear tracking | camera behind the subject (`back: true`), both moving |
| Low-angle tracking | camera y ≈ 0.35–0.6, looking up |
| Crane up / down | keys that change camera height a lot (1.5 → 12 m or reverse) |
| Aerial / drone tracking | camera 25–45 m up, moving with the subject; raise `shadow` and `fog` |
| Fly-through | several keys passing through a window or doorway into a room |
| Whip pan | look target jumps sideways between keys at u 0.74→0.86, plus the cut in `shots.WHIP_BLUR` |
| Dolly zoom | `cam: dollyZoom(subject, d0, d1, fov0, camY)`: camera backs off while the lens tightens |
| Over-the-shoulder (tracking) | a character in the near foreground with `back: true`, the subject beyond |
| Handheld | `hand: 0.5–1.6` on the shot (only these shots wobble) |
| Rack focus | `focus: (c) => …` moving from a near prop to a far face mid-shot, high `cInf` (16–18) |
| Macro product tracking | camera 0.3–1 m from a small prop, fov 28–36, `cInf` 9–16, slow slide |

Every shot moves. Shots last 1–3 s and start on a spoken word. Characters react on the word with `at(c, "word")` and switch pose with `swaps: [F("word")]`.

## Captions (unchanged from v6)

- Two centred lines. Line 1: Inter Display Bold 70 px. Line 2: Inter Display Bold 82 px with the last word or two as the accent in Instrument Serif Italic 126 px. Line 2 baseline y = 1470; max width 880 px; 2–5 words per line.
- No background, no box, no outline. Per shot, from the picture behind: near-black with a soft white glow on bright shots, otherwise white with a soft dark shadow (a stronger dark halo when white sits on a bright picture).
- Each group appears on its first spoken word with a 0.13 s rise. `MARKUP`: `line one | bold words *accent*`, captions split with ` / `, words must match what is spoken (the build stops if not).
- Keep faces above the caption zone (the magenta line on `chk.py` sheets).
- Labels: plain caption type, white, no card (bold place + italic year; bold first name + italic last name).

## Voice and sound

- **Narrator = voice A**, chosen by the user on 17 Nov 2026 because the old Kokoro blend sounded robotic: Chatterbox's own built-in voice (no reference audio, nothing cloned), `exaggeration 0.6`, `cfg_weight 0.4`, seed 3 (up to two retries at +11), **no speed-up**. Pace check 2.2–4.6 words/s.
- After `align.py`, read every transcribed line. If a word is mumbled, re-take that line with other seeds (21, 37, 58 worked) or reword the line, then align again.
- Characters: stock Pocket TTS voices (`tts_chars.py`), e.g. `javert` (boss), `charles` (robber).
- Never clone or imitate a real or licensed voice, even if asked.
- **Sound:** synthesised effects fired from `shots.py` (steps, pops, thuds, sparkles, ticks, train chugs, ka-ching, whistles, paper flutter, saw/creak), a whoosh on every cut, bigger on whip pans. **No background music** by default (the user dropped it with the railroad video); `MUSIC = True` in `shots.py` brings back the plucked-strings bed. Effects dip under the voice. Final loudness −11.6 LUFS with a limiter.

## Story rules

- A fast story in about 17 short lines with a twist ending. Fact-check true stories with web sources; show "True story <year>" only when verified. A story that cannot be verified is told without the label, year or place.
- If the user's script comes from another creator's video, retell it in new words (same idea, own script, own ending if it stops early).

## Practical notes

- Render speed on 2 cores: 13–17 s per full-size frame per browser, two browsers at once → 60 s of video ≈ 4–5 h. Background jobs stop when a reply ends, so run `render_batch.py 560` repeatedly in the foreground (each call stays under the 10-minute command limit and resumes where it stopped).
- `shots.py` warns about shots shorter than 0.5 s: usually a cue word that `at()` found in the wrong line.
- Before the full render: look at `chk.py` sheets (middle, first and last frame of every shot). After: check a one-frame-per-second sheet of the finished file.
- Motion and sound cannot be watched or heard here; report checks as measurements and stills.
