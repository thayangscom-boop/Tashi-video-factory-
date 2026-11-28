# V3 test — "The Last Donut" (10 s)

A 10-second test of the `viral-cartoon-3d-shorts` (V3) style. The characters, faces, set layout, story and camera work are all original. The character *builder* (`stickrig.js`), Xbot skeleton and post chain are reused from the installed `claude-3d-animated-shorts` engine, imported as modules; that skill's files are not modified.

## Story
**Hook (0–2 s):** one donut is left in the office break room, and two coworkers spot it at the same moment.
**Escalation:** they lock eyes and race for it.
**Reversal / payoff:** the boss, who was already at the counter, takes it and eats it in one bite.
**Button:** the boss offers them the empty plate.

Narration (local Piper TTS, en_US ryan):
1. "One donut left. Two people saw it."
2. "Neither of them saw Gus."

## Cast (stable IDs)
| ID | Name | Shape / build | Colours / outfit | Fixed detail | Personality | Signature gesture |
|---|---|---|---|---|---|---|
| `ben` | Ben | Standard pear, scale 0.82 | Mustard knit tunic with navy pinstripe and a navy tie | Navy tie | Smug planner | Rubs his hands |
| `maya` | Maya | Slimmer, scale 0.78 | Red hoodie, olive beret | Olive beret | Quick, competitive | Points |
| `gus` | Gus | Wider (bodyW 0.95), scale 0.86 | Cream shirt with brown belt and green plaid | Drawn walrus moustache | Calm boss, deadpan | Slow chew, offers the plate |

All three have a white flat-shaded head with a brown outline, small drawn features, a pear body, thin noodle limbs and mitten hands.

## Expression set (`v3faces.js`, original drawings)
neutral, curious, suspicious, happy, annoyed, worried, shocked, embarrassed, smug, plus `chew` (Gus's mouth cycle).

## Shot list (scene briefs)

| # | Time | Narration | Action | Characters | Shot / camera | Sound | Transition |
|---|---|---|---|---|---|---|---|
| 1 | 0.0–2.4 | "One donut left." | The plate with one donut sits on the counter, with Gus in the background at the coffee machine (his back to us). Ben walks in from the left, stops and his face turns smug. | ben, gus | Establishing wide from a high corner, crane down toward the counter | Room tone, Ben's footsteps, coffee machine hiss | Cut on Ben's stop |
| 2 | 2.4–4.6 | "Two people saw it." | Maya enters from the right and stops. Ben and Maya turn to each other, suspicious, then go into a crouch (anticipation). | ben, maya | Medium two-shot with the donut out of focus in the foreground, slow push-in | Maya's footsteps, a tense sting | Cut on the lunge |
| 3 | 4.6–6.3 | — | Both rush the counter and reach. Gus's hand comes in from the side, slides the plate away and lifts the donut. | ben, maya, gus | Low medium across the counter, tracking with the reach | Fast steps, plate slide, whoosh | Cut on the grab |
| 4 | 6.3–8.4 | "Neither of them saw Gus." | Gus bites and chews, unbothered. Ben and Maya go from shocked to annoyed. | all three | Medium three-shot, slight orbit | Bite crunch, gasps | Cut |
| 5 | 8.4–10.0 | — | Gus offers them the empty plate. Ben and Maya look at each other, embarrassed. | all three | Close two-shot of Ben and Maya, Gus's hand with the plate entering the foreground, gentle push-in | Plate clink, a soft "pfff" | End |

## Assets (`assets-manifest.json`)
Kenney Furniture Kit and KayKit Furniture Bits (CC0, bundled with the installed skill), Poly Haven props (CC0, fetched by that skill's cloud script), and the Xbot rig (three.js examples, Mixamo). The donut, plate, walls, floor and window are procedural.
