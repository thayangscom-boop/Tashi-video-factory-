# Opening preview — shot list and review

`output/preview_opening.mp4` is the first 13.9 s of the Short at 1080×1920: narration lines 1 and 2. Composition: `PreviewOpening` (`src/three/PreviewOpening.tsx`).

## What changed in this pass
- **Character proportions:** legs and arms are longer, the head is smaller and limbs are slimmer. Figures are now about five heads tall instead of under four.
- **Movement:** a full walk cycle (pelvis sway, shoulders counter-rotating, bent arms swinging, head bob). The bar crew step into each pull and walk the bar back instead of standing planted.
- **Hotel scale:** the hotel is 30 m wide and seven storeys (it was 20 m and six). The front has 25 jacks with a man on each, more along the side, and three more rows of jacks under the building.
- **Captions:** chunk times are now anchored to the real pauses in the narration audio (`tools/align_captions.py`) instead of being estimated from character counts. The first line moved by up to 0.8 s.
- **Sound:** a new mix built from `src/three/openTimeline.json`, the same file the animation reads.

## Shots (after the cinematic polish pass)

| # | Time (s) | Narration | Size | New story information | Camera | Action |
|---|---|---|---|---|---|---|
| 1 | 0.0–1.85 | "In 1861, Chicago" | Wide establishing | Where we are and how big the hotel is | Low on the new street, far back, slow push-in | The hotel fills the frame above tiny figures. A horse-drawn wagon crosses the foreground and a second passes further back. Bystanders stop, point and hold their hats. On the first turn the building jolts and dust boils up out of the trench at its foot. |
| 2 | 1.85–3.8 | "lifted an ENTIRE hotel into the air…" | Wide, low | What is causing it | Low in the work trench at the corner, wide lens, slow crane up | The reveal: a row of 25 men recedes along a wall that runs out of the top of the frame. They heave together twice. No two men match in build, height, clothes or hat; every sixth is a spotter kneeling at his jack, watching the screw and signalling. A timber gang walks through and a man stacks cribbing. |
| 3 | 3.8–5.6 | "with the guests STILL INSIDE." | Medium | The hotel is occupied | Slow push-in | A guest sips tea. The room jolts on the next turn: the lamp swings, the china rattles, he glances at the window, then raises his cup. |
| 4 | 5.6–10.0 | "Chicago was built on flat, swampy ground, barely above Lake Michigan." | Wide (aerial) | Why: the town is low and wet | One continuous crane from high over the lake down to water level | A low wooden town on marsh, with sloughs, reeds, a pier and schooner, smoke, two horse-drawn wagons and walkers on the shore road, gulls. The camera ends at the waterline behind mooring posts and reeds. Weather rolls in. |
| 5 | 10.0–13.9 | "When it rained, the streets turned into deep, sucking MUD." | Medium, pushing in | The consequence | Slow push-in on the gentleman | Lightning. A gentleman steps off the plank sidewalk and sinks deeper with each stride until he is stuck to the knees. Behind him a horse strains in its collar at a bogged wagon while the driver shoves the wheel; passers-by keep to the porch planks. |

Transitions: shot 1→2 is a cut from the mystery (dust, a jolting building) to its cause. Shot 2→3 cuts on a turn. Shot 3→4 is a 0.3 s dissolve, because the story steps back in time. Shot 4→5 cuts on a lightning flash after the weather has been building in shot 4.

There are no close-ups of body parts or objects in this cut.

## What the polish pass changed
- **No cloned workers:** each crew member gets his own skin tone, shirt, waistcoat, trousers, hat, facial hair, braces/apron/belt, build and height from a seeded generator (`crewLook` in `src/three/life.tsx`). Timing offsets are wider, hand spacing and lean differ per man, and heads turn between pulls. Spotters add a second job.
- **Horses:** a walking draught horse whose legs are driven by distance travelled, and a horse-drawn wagon with turning wheels, a load and a seated driver (`Horse`, `HorseWagon`).
- **Establishing shot:** new shot 1. The earlier crew medium shot was folded into shot 2.
- **Lighting:** a higher sun now reaches into the trench, and the mud street has more fill, so detail is no longer lost in shadow.
- **Buildings:** storefronts have period porches on posts with plank roofs, hanging signs and goods by the door.

## Sound events
- hoofbeats and wagon rumble as the wagon crosses in shot 1
- each of the three turns outside: ratchet clicks for the length of the pull, a timber creak, a settling thud, dust (the first is quieter, heard from across the street)
- the fourth turn heard from inside the room: the same, muffled, plus china and the lamp
- over the town: wind, water lapping that grows as the camera descends, gulls, distant thunder
- in the street: rain, a thunderclap on the cut, a squelch on each of his steps (louder as he sinks), a long squelch on the heave, creaks from the wagon and a snort from the horse each time it throws itself forward

## Known limits
- The older lift-sequence preview (`PreviewLift`) has not been retuned for the new character proportions. Some of its hand poses (whistle, hat tip) will be off until that is done for the full production.
- Characters have no lip-sync. No depth-of-field or motion blur.
- The audio is checked by event timing and loudness only; it has not been listened to.
