# Chicago lifted a hotel — V3 style (54.6 s)

**Narration:** your voiceover (`audio/voiceover.mp3`, 54.6 s). The transcript and word timings come from a local Whisper model (`audio/transcript.json`). Every cut, caption and sound effect is timed to that transcript through `timeline.json`.

**Style:** the `viral-cartoon-3d-shorts` (V3) look, with white-headed pear-bodied characters, outlines and lit 3D sets. It is built on the installed `claude-3d-animated-shorts` engine (character builder, post chain, CC0 props) used as a library; nothing in that skill is modified. The cast, faces, hats, sets and staging are original.

## Cast (stable IDs)
| ID | Who | Look | Fixed detail |
|---|---|---|---|
| `walter` | The hotel guest | Purple striped nightshirt | Droopy nightcap with pompom |
| `gent` | The man in the mud | Blue suit, vest and tie | Top hat, moustache |
| `lady` | Townswoman / diner | Red coat | Cream bonnet |
| `eng` | The engineer | Dark coat, gold tie | Bowler, round glasses, moustache |
| `pullman` | The foreman | Navy suit, brown vest | Bowler, moustache, whistle |
| `clerk` | Hotel clerk | Green suit, white vest | Red bow tie, moustache |
| `driver` | Wagon driver | Brown coat | Olive flat cap |
| `w0`–`w11` | The crew | 12 different shirt colours, patterns, hats, builds and heights | — |
| `t0`–`t4` | Townsfolk | Coats, bonnets, top hat, bowler | — |

## Shot list
| # | Time | Narration | Picture | Shot / camera |
|---|---|---|---|---|
| 1 | 0–2.5 | "Imagine waking up in your hotel room," | Walter asleep (Z's), opens his eyes, sits up and yawns | Medium, slow push-in from the foot of the bed |
| 2 | 2.5–4.2 | "only to discover the entire building" | He turns to the window: the street outside slides down; the cup rattles; he is shocked | Wide-angle two-shot of him and the window |
| 3 | 4.2–7.2 | "is being lifted off the ground." | Looking down into the trench at the crew on their jacks, then crane up the rising hotel; townsfolk gasp | High angle, then crane up and back |
| 4 | 7.2–9.4 | "In 1861, Chicago" | Establishing shot of a low wooden street, mud and planks, people walking; CHICAGO · 1861 card | High wide, crane down |
| 5 | 9.4–11.5 | "was struggling with a serious problem." | The gentleman steps off the planks and sinks to his knees in the mud | Medium, push-in |
| 6 | 11.5–15.5 | "The city was so low and swampy that drainage was difficult." | Standing water everywhere; the driver shoves a stuck wagon; people pick their way along | High wide, slow pan |
| 7 | 15.5–17.3 | "To fix it, engineers" | The engineer turns to his plan and points; shovellers behind | Medium |
| 8 | 17.3–20.0 | "raised the streets sometimes by several feet." | Time-lapse: the fill rises past the shop doors while the crew shovels; + SEVERAL FEET card | Wide; camera rises with the street |
| 9 | 20.0–23.4 | "But one building presented an unbelievable challenge –" | Townsfolk on the new street look down at the hotel stuck in its pit, one pointing, one scratching his head | Over the shoulders, looking down |
| 10 | 23.4–26.2 | "the six-storey Tremont House Hotel." | Tilt up the facade to the roof sign; 6 STOREYS card | Low angle, tilt up |
| 11 | 26.2–28.0 | "Instead of demolishing it," | A worker swings a sledgehammer at the wall; Pullman runs in, grabs it and shakes his head | Side medium |
| 12 | 28.0–32.6 | "workers placed thousands of screwjacks beneath the massive brick structure." | A man pushes a jack under the sill; the camera pulls back down endless rows of jacks under the building; THOUSANDS OF JACKS card | Low insert, then dolly back |
| 13 | 32.6–36.4 | "Hundreds of men worked together, turning the mechanisms little by little," | Pullman blows the whistle and signals; the crew turn their bars in unison | Tracking along the row, then a low shot down the row |
| 14 | 36.4–40.0 | "lifting the entire hotel more than six feet." | Time-lapse lift with a 0–6 FT gauge, dust | Wide, slow crane |
| 15 | 40.0–43.9 | "And the most unbelievable part? The hotel stayed open." | A guest walks up to the lobby desk; the clerk rings the bell; the OPEN sign swings; STILL OPEN card | Medium push-in |
| 16 | 43.9–47.3 | "Guests continued sleeping, eating and conducting business" | Cut-away building: Walter snoring, a couple dining, two men shaking on a deal | Tilt down through the three floors |
| 17 | 47.3–50.0 | "while the building slowly rose beneath them." | The whole cut-away building rises on its jacks | Pull back to wide |
| 18 | 50.0–54.6 | "Chicago didn't just rebuild its streets, it literally lifted its city." | Golden hour: raised street, people strolling, the hotel at street level, the lake beyond; THE RAISING OF CHICAGO card | Crane up and back |

## Sound
`make_audio.py`: your voiceover, with sound effects at the animation's event times. These include snoring and a bed creak, the building groaning, a rattling cup, crew ratchets with creaks and settling thuds, footsteps, squelches as he sinks, the stuck wagon, frogs, shovels and the sped-up shovelling, the whistle, the hammer swing and the grab, the jack scrape and clank, the lift time-lapse rise, the lobby bell, snoring, cutlery, a handshake, and card whooshes. Under them sit a music bed (minor, turning to major at "the hotel stayed open") and room or street ambience, all ducked under your voice.

## Facts
This follows your script. The numbers it uses (1861, six storeys, thousands of jacks, hundreds of men, more than six feet, guests staying) match the sources checked for the earlier Chicago Short (`../chicago-hotel-lift/production/source-notes.md`). The "hundreds of men" figure varies between sources (about 500 in most, 1,200 in one).
