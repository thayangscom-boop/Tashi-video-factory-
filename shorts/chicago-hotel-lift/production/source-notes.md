# Source notes

Research was done on 2026-11-27 using web search result summaries. Direct fetches of Wikipedia were blocked by the session's network policy, so I could not read the full articles. The claims below are checked only against the search summaries listed. Re-check them against the full pages before using this for anything high-stakes.

| Claim in script | Status | Sources |
|---|---|---|
| Chicago was built on low, flat, swampy ground near lake level; the streets were notorious mud | Consistent across sources | [Raising of Chicago – Wikipedia](https://en.wikipedia.org/wiki/Raising_of_Chicago); [Gapers Block: How Chicago raised itself out of the mud](https://gapersblock.com/airbags/archives/how_chicago_raised_itself_out_of_the_mud_and_astonished_the_world/) |
| Poor drainage; repeated cholera (1849, 1854) and dysentery epidemics | Consistent. The death tolls conflict between sources, so the script gives no numbers | [WTTW: Chicago's Historical Ingenuity in the Face of Disease](https://interactive.wttw.com/node/31148); [Raising of Chicago – Wikipedia](https://en.wikipedia.org/wiki/Raising_of_Chicago) |
| Ellis S. Chesbrough's plan: lay sewers on top of the existing streets, cover them with fill, and raise the street grade | Consistent | [Ellis S. Chesbrough – Wikipedia](https://en.wikipedia.org/wiki/Ellis_S._Chesbrough); [ASCE: Ellis Sylvester Chesbrough](https://www.asce.org/about-civil-engineering/history-and-heritage/notable-civil-engineers/ellis-sylvester-chesbrough) |
| Grade raised "up to 14 feet" | The 1855–56 ordinances raised grades by **4 to 14 feet**. Chesbrough had proposed 6–10 ft. The script says "up to," which matches the ordinances | [Raising of Chicago – Wikipedia](https://en.wikipedia.org/wiki/Raising_of_Chicago) (via search summary) |
| Buildings had to be raised to the new grade, at the owners' expense | Consistent | same as above |
| Tremont House: a six-story brick hotel | Consistent | [Tremont House (Chicago) – Wikipedia](https://en.wikipedia.org/wiki/Tremont_House_(Chicago)); [Classic Chicago Magazine – Pullman Portrait](https://classicchicagomagazine.com/?p=61737) |
| Raised in **1861** by Ely, Smith & Pullman (George Pullman's firm) | Most sources say 1861. **Conflict:** one Wikipedia summary mentions a Tremont raising in 1856, and zeugmatic.com gives a much earlier, implausible date. The script uses 1861 | [Tremont House (Chicago) – Wikipedia](https://en.wikipedia.org/wiki/Tremont_House_(Chicago)); [Classic Chicago Magazine](https://classicchicagomagazine.com/?p=61737); [The Tremont Hotel – zeugmatic.com](https://www.zeugmatic.com/travel/chicago/tremont.htm) |
| Raised about **six feet** | Consistent across the cited sources | same |
| About **500 men** and **5,000 jackscrews**; each man turned his screws a small amount on a signal | Classic Chicago: about 500 men, each turning 10 jackscrews a half-turn on a signal (≈5,000 screws). **Conflict:** zeugmatic.com says 1,200 men. The script says "about five hundred" | [Classic Chicago Magazine](https://classicchicagomagazine.com/?p=61737); [Cooter's History Thing blog](https://cootershistorything.blogspot.com/2016/03/raising-chicago-out-of-mud-part-4-how.html) |
| Guests stayed and the hotel kept operating during the lift | Reported by multiple popular-history sources. The "guests barely noticed" framing is a widely repeated anecdote, so the script says only that guests "kept eating, sleeping, and checking in" | same as above |
| Pullman was about 30 in 1861 (lower-third "age ~30") | Pullman was born March 3, 1831 | general biographical record; verify on the [Wikipedia: George Pullman](https://en.wikipedia.org/wiki/George_Pullman) page |

## Artistic licence (not factual claims)
- All characters, faces, costumes, and the Tremont House drawing are original stylized designs, not likenesses. The Pullman and Chesbrough characters are not portraits.
- The window close-up guest, the "STILL OPEN" sign, the "TWEEET!" whistle, and the "TURN #1–3" cards are dramatizations.
- In the cross-section diagram, the pipe, the fill, and the "14 FT" arrow are schematic and not to scale.

## Asset and licence notes
- **Voice:** generated locally with [Piper TTS](https://github.com/rhasspy/piper) using the `en_US-ryan-high` voice. Check that voice's model card on Hugging Face (rhasspy/piper-voices) for its dataset licence before any commercial use. The voice model is not committed to the repo; `production/README.md` explains how to download it.
- **Sound effects and music:** all procedurally synthesized from scratch by `tools/make_audio.py` (numpy). No samples or third-party recordings.
- **Fonts:** Anton and Fredoka via `@fontsource`, both under the SIL Open Font License.
