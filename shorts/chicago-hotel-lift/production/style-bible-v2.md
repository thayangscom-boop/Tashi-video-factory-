# Style bible and quality gate — V2 (3D) look

This is the look for Shorts made with the `viral-animated-shorts-studio` skill. The V2 engine lives in `src/three/` and renders real 3D (Three.js inside Remotion). The original flat 2D version of the Chicago Short (`src/scenes/`, `output/short.mp4`) is unchanged.

## Look
- **Characters:** chunky stylized 3D figures with big heads and short legs. Each has a full body: head, neck, torso, upper and lower arms, hands, upper and lower legs, shoes, hair, hat and clothing layers (collar, lapels, belt, suspenders, apron, rolled sleeves). Faces have eyes with pupils and highlights, brows, cheeks, a nose, and a mouth that can smile, frown or open. The cast is defined in `CAST3` in `src/three/Character3D.tsx`.
- **Movement:** arms and legs are solved with two-bone IK, so hands stay locked to what they hold (the jack bar, the teacup) and feet stay planted. Actions have anticipation, the action itself, and a settle. Each worker's timing is offset slightly so the crew does not move like one machine.
- **Palette and light:** golden-hour exteriors with a warm low sun, a cool sky fill and a cool back rim light. Interiors are lit by warm lamps against cool window light. Lit windows and lamps get a soft glow.
- **Sets:** the hotel is modelled in 3D (brick texture, stone trim, recessed windows with curtains and silhouettes, cornice, roof sign, flag, chimney smoke). The street has neighbouring storefronts, a far skyline, lamps, a wagon, barrels, crates, a ladder and timber. The room has wallpaper, wainscot, a window with curtains, a bed, a nightstand lamp, a hanging lamp, a rug, a tea table and a view outside.
- **Camera:** a real perspective camera. Each shot has one motivated move (track, crane or push-in) and a small shake when the building jolts.
- **Captions:** unchanged from V1 (Fredoka, white with a yellow keyword, placed in the lower-middle safe area).

## Rendering rules found in this container
- Render 3D compositions with `--gl=angle --concurrency=1`. Rendering frames in parallel corrupted some frames (smeared strips); one at a time was clean.
- Load fonts before the 3D canvas mounts (`useFontsReady`), otherwise text textures such as the roof sign are missing.
- Speed: the 171-frame preview took about 2.6 minutes at 1080×1920, so a 60-second Short should take roughly 30 minutes.

## Quality gate for `output/preview_v2.mp4` (5.7 s, 3 shots)
Checked on every frame at thumbnail size and on 11 frames at larger size.

| Item | Result | Notes |
|---|---|---|
| Characters have designed anatomy and silhouettes | PASS | Still built from simple shapes, so they read as toy-like figures. |
| Characters act with story-relevant movement | PASS | Workers haul the bars, the guest sips, startles, glances at the window and toasts. |
| Environment has depth and detail | PASS | The wide shot and the room are well dressed. The close shot has a plain wall filling the top of the frame. |
| Lighting, shadows and materials add dimension | PASS | Real cast shadows, warm and cool contrast, glow on lamps. |
| Camera and shot variety | PASS | Close action shot, wide establishing shot, interior medium shot. |
| A visual beat every 2–4 s | PASS | Three shots in 5.7 s, plus actions inside each. |
| Props and characters interact convincingly | PASS | Hands stay on the bar and the cup. |
| Text legible and in safe margins | PASS | In the wide shot the caption overlaps the street below the hotel, not the hotel itself. |
| Consistent style | PASS | |
| No corrupted frames | PASS | After switching to one frame at a time. |

## Known gaps
- Only the hook (the first narration line) exists in 3D. The other eight scenes are still the 2D version.
- No depth-of-field or motion blur.
- Faces have no lip-sync.
- The preview reuses the existing audio mix, so the sound effects are timed to the old 2D action, not the new 3D turns.
