# Opening preview — shot list and review

`output/preview_opening.mp4` is the first 13.9 s of the Short at 1080×1920: narration lines 1 and 2. Composition: `PreviewOpening` (`src/three/PreviewOpening.tsx`).

## What changed in this pass
- **Character proportions:** legs and arms are longer, the head is smaller and limbs are slimmer. Figures are now about five heads tall instead of under four.
- **Movement:** a full walk cycle (pelvis sway, shoulders counter-rotating, bent arms swinging, head bob). The bar crew step into each pull and walk the bar back instead of standing planted.
- **Hotel scale:** the hotel is 30 m wide and seven storeys (it was 20 m and six). The front has 25 jacks with a man on each, more along the side, and three more rows of jacks under the building.
- **Captions:** chunk times are now anchored to the real pauses in the narration audio (`tools/align_captions.py`) instead of being estimated from character counts. The first line moved by up to 0.8 s.
- **Sound:** a new mix built from `src/three/openTimeline.json`, the same file the animation reads.

## Shots

| # | Time (s) | Narration | Size | New story information | Camera | Action |
|---|---|---|---|---|---|---|
| 1 | 0.0–2.3 | "In 1861, Chicago lifted an ENTIRE hotel" | Wide | How big the hotel is, and that men are lifting it | Low in the work trench at the corner, wide lens, slow crane up | A row of 25 men recedes along a wall that runs out of the top of the frame. They heave their bars together twice; the building jolts and dust falls. A timber gang walks through and a man stacks cribbing. |
| 2 | 2.3–3.8 | "into the air…" | Medium | How the work is done | Slow track along the crew | The men lean in, haul the bars to their chests and walk them back. The jacks and the gap under the sill are visible beside them. |
| 3 | 3.8–5.6 | "with the guests STILL INSIDE." | Medium | The hotel is occupied | Slow push-in | A guest sips tea. The room jolts on the next turn: the lamp swings, the china rattles, he glances at the window, then raises his cup. |
| 4 | 5.6–10.0 | "Chicago was built on flat, swampy ground, barely above Lake Michigan." | Wide (aerial) | Why: the town is low and wet | One continuous crane from high over the lake down to water level | A low wooden town on marsh, with sloughs, reeds, a pier and schooner, smoke, a wagon and walkers on the shore road, gulls. The camera ends at the waterline, where the land sits just above the lake. Weather rolls in. |
| 5 | 10.0–13.9 | "When it rained, the streets turned into deep, sucking MUD." | Medium, pushing in | The consequence | Slow push-in on the gentleman | Lightning. A gentleman steps off the plank sidewalk and sinks deeper with each stride until he is stuck to the knees. He heaves, the mud holds, he slumps. Behind him a driver throws his weight at a bogged wagon; passers-by keep to the planks. |

Transitions: shots 1→2→3 are cuts on the turns. Shot 3→4 is a 0.3 s dissolve, because the story steps back in time. Shot 4→5 cuts on a lightning flash after the weather has been building in shot 4.

There are no close-ups of body parts or objects in this cut.

## Sound events
- each of the three turns outside: ratchet clicks for the length of the pull, a timber creak, a settling thud, dust
- the fourth turn heard from inside the room: the same, muffled, plus china and the lamp
- over the town: wind, water lapping that grows as the camera descends, gulls, distant thunder
- in the street: rain, a thunderclap on the cut, a squelch on each of his steps (louder as he sinks), a long squelch on the heave, creaks from the wagon

## Known limits
- The older lift-sequence preview (`PreviewLift`) has not been retuned for the new character proportions. Some of its hand poses (whistle, hat tip) will be off until that is done for the full production.
- Characters have no lip-sync. No depth-of-field or motion blur.
- The audio is checked by event timing and loudness only; it has not been listened to.
