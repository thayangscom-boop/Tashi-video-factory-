# Lift-sequence preview — shot list and review

`output/preview_lift.mp4` is 14.2 s at 1080×1920. It covers narration line 7 and the first sentence of line 8: the part of the story where the hotel is actually lifted. Composition: `PreviewLift` (`src/three/PreviewLift.tsx`).

## The set
The hotel sits in a timber-shored work trench, below the **new** street, which runs on fill with a boardwalk and rail along the trench edge and a plank ramp down into it. During the sequence the building rises about 1.8 m (roughly six feet), and the lift ends when its ground floor is level with the new street. A striped surveyor's staff (one stripe per foot) with a NEW GRADE board stands at the corner, and a pointer fixed to the building rides up it.

## Shots

| # | Time (s) | Narration | Purpose | Camera | Action |
|---|---|---|---|---|---|
| 1 | 0.0–2.25 | "So a young George Pullman and his partners" | Introduce the man in charge and reveal the problem | Medium tracking shot walking backwards ahead of him, then swings over his shoulder and tilts down into the trench | Pullman strides along the boardwalk with rolled plans, two partners behind him. He stops at the rail, turns and points down. One partner holds his hat and looks up at the hotel, the other studies a plan. The crew below look up at him. |
| 2 | 2.25–4.75 | "brought in about five hundred men and five thousand jackscrews" | Show the men and equipment arriving | Crane shot: starts high looking along the ramp, descends to ground level in the trench | Men walk down the plank ramp carrying timber, buckets and jacks on their shoulders. At the bottom a worker crouches and pushes a jack home under the sill beam. |
| 3 | 4.75–7.0 | "On a signal, every man gave…" | The signal and the first coordinated turn | Close-up on Pullman, then a whip-pan down to the crew and a slow track along the row | Pullman raises a brass whistle and blows. The crew's heads snap from him to their bars and they heave together; each man leans in, hauls the bar to his chest and walks it back. |
| 4 | 7.0–8.05 | "…his screws a small turn." | Show what one turn does | Low close-up on a single jack | The bar sweeps through, the screw thread turns and extends, and the sill beam lifts off the cribbing beside it. Dust falls. |
| 5 | 8.05–10.15 | "Then again. And again." | Show the whole operation in unison | High angle over Pullman's shoulder, slowly rising | Pullman lifts his arm and chops it down twice; on each chop the crew below haul together. Onlookers lean on the rail, pedestrians pass, a man pushes a handcart. |
| 6 | 10.15–12.05 | "Inch by inch, the hotel rose" | Compress the rest of the lift | Wide establishing shot from across the new street, slow crane up | Time-lapse: the hotel climbs out of the trench until its ground floor is level with the street. The sun drops to dusk, shadows swing, clouds race, lamps come on, pedestrians streak past, the crew work on raised staging. |
| 7 | 12.05–14.2 | "about six feet." | Payoff: the hotel now meets the street | Medium shot through the gap in the rail, slow push-in | Two workers run a gangplank across to the open door and step aside. A guest waiting in the doorway looks up, strolls out onto the new street and tips his hat. A woman on the boardwalk applauds. |

Transitions: shots 1→2 cut on Pullman's pointing gesture to what he points at. Shot 3 joins the signal to the result with a whip-pan instead of a cut. Shots 3→4→5 cut on the pulls. Shot 5→6 is a 0.3 s dissolve, because time passes. Shot 6→7 is a cut on "six feet".

## Sound
`tools/make_preview_audio.py` builds the mix from `src/three/liftTimeline.json`, the same file the animation reads, so each effect sits on the frame of the action:

- footsteps on the boardwalk, timed to Pullman's and the guest's foot contacts
- footsteps of the men on the ramp, a scrape as the jack is pushed in and a clank when it seats
- the whistle at the frame he blows, and a whoosh on the whip-pan
- for each of the four turns: ratchet clicks for the length of the pull, a timber creak, a settling thud and a dust trickle (a closer, single-jack version for the close-up)
- rapid clicks and a rising tone during the time-lapse, with a thud when the hotel reaches grade
- a scrape and a wooden knock when the gangplank lands, hand-claps on the frames the woman's hands meet, and a soft bell on the hat tip
- street ambience (wind, murmur, sparrows by day, the handcart) and a music bed that turns from minor to major at the time-lapse

The old `mix.wav` is not used by this preview.

## Known limits
- The trench floor is 3.35 m below the new street so that the crew and jacks are easy to see. The building itself rises about 1.8 m, matching "about six feet"; the depth of the trench is staging, not a historical claim.
- Characters are still built from simple shapes and have no lip-sync.
- The time-lapse crew repeat one fast cycle.
- No depth-of-field or motion blur.
- The audio was checked by measurement and by event timing only; it has not been listened to.
