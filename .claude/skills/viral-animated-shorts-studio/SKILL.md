---
name: viral-animated-shorts-studio
description: Create cinematic, high-quality animated documentary Shorts with expressive stylized characters, richly layered environments, purposeful acting, dynamic camera work, narration, sound design, captions, and rendered vertical video. Use when asked to create an animated Short or documentary animation.
---

# Viral Animated Shorts Studio — Visual Quality V2

## Mission
Create compelling 45–65 second vertical animated story videos. Aim for the polished, dimensional, expressive storytelling quality of successful animated Shorts, while developing an original visual identity. Do NOT imitate any creator's exact characters, designs, scenes, or branding.

Never accept a flat, bare, slide-show-like output as the finished product unless the user explicitly requests a minimalist style. A working render is not automatically a good render.

## Mobile/cloud session rule
Assume this skill may be invoked from Claude Code mobile using a cloud coding session and a connected repository. Work within the current repository and available tools. Do not require a user's phone to run local commands. Inspect the repository and available rendering stack first; choose a supported workflow and explain any hard limitation. Do not claim a render succeeded unless the file was actually produced and checked.

## Production workflow — follow in order
1. Inspect repository, existing scripts, dependencies, render commands, and output conventions. Preserve existing work; do not replace project structure unnecessarily.
2. Research/outline story beats if factual history is involved. Separate verified facts from dramatized scenes. Avoid fabricating quotations or presenting invented dialogue as historical fact.
3. Write a hook-forward script (45–65 sec), then a shot list with one clear visual action per shot. Target a visual change every 2–4 seconds, not just subtitle changes.
4. Create a style bible: character shapes/proportions, palette, materials, lighting, environment, camera language, and continuity rules. Reuse character designs and props consistently.
5. Build a scene/asset system with reusable components. Prefer the repository's existing technology. If starting from scratch and a browser-rendered animation is practical, use Three.js for actual dimensional scenes and Remotion for timeline/video composition; if these are unavailable, use an appropriate available renderer and be transparent about the tradeoff.
6. Produce a small preview/test render first. Inspect representative frames and motion. Fix visual issues before the full render.
7. Render final vertical video, check the actual MP4, audio, captions, duration, resolution, and frame pacing. Provide the file and a concise summary of what was validated.

## Art direction: dimensional stylized animation
The target is polished stylized animation with a cinematic, handcrafted feel—not flat infographic animation.

### Characters — minimum standards
- Create a character design with a readable silhouette and intentional proportions; avoid default circles, stick limbs, emoji faces, or generic primitive-only people.
- Give characters head, torso, neck when appropriate, shoulders, arms, forearms, hands, legs, feet/shoes, hair/headwear, clothing layers, and simple but designed facial features.
- Use materials/shading/lighting or layered illustrated rendering to create dimension and volume. Characters should feel cohesive, not disconnected body parts.
- Include facial states (neutral, surprised, concerned, excited, frightened, etc.) appropriate to the story.
- Make characters act with anticipation, reaction, pose changes, eye/head direction, gestures, and body weight. Avoid idle characters standing still while narration explains everything.
- Keep the design achievable and consistent across shots. Reuse rig/character assets instead of rebuilding inconsistently.

### Environments — minimum standards
- Every shot must have intentional foreground, midground, and background layers where the scene allows.
- Populate scenes with relevant architecture, furniture, signage, vehicles, tools, props, and small contextual details. Avoid empty color backgrounds.
- Use depth, shadows, highlights, perspective, atmospheric effects, and parallax. Avoid repeating the same composition across scenes.
- Include ambient movement when appropriate: weather, smoke, steam, fire flicker, water, dust, foliage, crowds, machinery, or moving light.
- Design each scene to establish location and period. Props must support the narrative action rather than serve as random decoration.

### Lighting and materials
- Use a key/fill/rim or equivalent intentional lighting plan, plus contact shadows and directional shadows when supported.
- Choose a mood-specific palette. Use contrast between warm and cool areas, motivated practical lights, fog/atmosphere where appropriate, and material variation.
- Avoid flat uniform lighting, single-color backdrops, and unshaded geometry unless stylistically intentional.

### Camera and editing
- Build a mix of wide establishing shots, medium action shots, close-ups, reaction shots, inserts, and occasional overhead/low-angle shots.
- Use motivated camera motion: push-ins, tracking, pans, tilt, orbit, rack-focus-like depth changes, parallax, and controlled handheld energy only when appropriate.
- Use purposeful cuts and transitions. A camera should not remain locked for the whole Short unless the shot intentionally requires it.
- Make each shot communicate one readable idea/action. Vary shot size and composition; avoid repetitive centered framing.
- Target a visual beat every 2–4 seconds. This can be a cut, character action, camera move, reveal, prop interaction, or environment change.

### Animation and acting
- Use anticipation, action, follow-through, easing, overlapping movement, and settling. Avoid robotic linear movement.
- Animate gestures and interactions: walking cycles, turning, looking, pointing, lifting/carrying, opening doors, reacting, falling/slipping, or other story-relevant actions.
- Give actions readable start, middle, and end poses. Avoid teleporting between poses.
- Add secondary motion sparingly but consistently: clothing, hair, loose objects, bouncing, rain, smoke, flags, water, and environmental motion.
- Make object interactions visibly connected (hand reaches, object moves, hand releases), not object teleportation.
- Keep timing clear and movement physically plausible for the stylized world.

## Story and retention
- 0–2 sec: strong curiosity hook with a visual surprise, danger, contradiction, or question.
- 2–8 sec: quickly establish who/where/what and the stakes.
- Middle: escalate with visual evidence, actions, or complications; avoid narration over unrelated filler.
- Final 10–15 sec: payoff, reveal, consequence, or memorable fact.
- Keep narration conversational and concise; do not overload every second with words.
- Use captions for accessibility and emphasis, not as a substitute for animation.
- Do not add fake “Breaking” labels or false urgency unless accurate and requested.

## Shot planning template
For each shot, define:
- Duration and narration line
- Location/time of day
- Shot size and camera angle
- Camera motion
- Character(s), emotion, pose, and action
- Environment/props and their movement
- Lighting and color mood
- Transition into next shot

Ensure each shot has a visual purpose and continuity with the previous one.

## Audio and subtitles
- Include voice-over timing and a separate sound-effect/ambience cue list.
- Use sound effects to support action, location, scale, and emotional beats—not randomly.
- Music should be optional, copyright-safe, and mixed under narration.
- Captions should be accurately synchronized, readable on a phone, within safe margins, and not cover essential action. Emphasize only a few key words; avoid excessive bouncing text.
- If narration/audio generation is unavailable, create a clear narration script and timed audio plan, and state that audio is not yet rendered.

## Visual Quality Gate — mandatory before final render
Render a test sample (at least a few representative frames or a short preview) and inspect it. Score each item PASS/FAIL:
- Characters have intentional designs and readable anatomy/silhouettes; not primitive-only figures.
- Characters are acting with natural, story-relevant movement.
- Environment has meaningful depth and enough details; no empty/flat scenes.
- Lighting, shadows, and materials add dimension.
- Camera angles/movement and shot variety support the story.
- Visual beats change every 2–4 seconds on average.
- Props and characters interact convincingly.
- Text is legible, correctly spelled, and within vertical safe margins.
- Visual style is consistent from scene to scene.
If any major item fails, improve the scene and re-preview. Do not silently lower the quality bar to make the render finish.

## Technical and delivery checks
- Target 1080x1920, 9:16, 30 fps unless project constraints/user specify otherwise.
- Keep the intended 45–65 second duration; confirm the actual duration after render.
- Verify MP4 exists and can be opened. Check video frames and audio stream if audio is expected.
- Ensure transitions, subtitles, and sound are not clipped; check title and caption safe areas.
- Use efficient assets and rendering settings suitable for the cloud/mobile session. If rendering is too resource-intensive, make a smaller preview first and clearly report the limitation.
- Never claim “cinematic,” “3D,” “lip-sync,” “sound,” or “rendered” unless the output actually demonstrates it.

## Final response
Provide: (1) playable rendered video if successfully generated, (2) duration/resolution, (3) what was actually implemented, (4) known limitations, and (5) the next improvement. If only code/storyboard exists, label it clearly as unfinished—not a completed video.
