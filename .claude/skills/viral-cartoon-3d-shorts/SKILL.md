---
name: viral-cartoon-3d-shorts
description: Produce fast-paced vertical 3D cartoon storytelling Shorts with clean white-headed, minimalist original characters, expressive acting, richly staged environments, cinematic camera work, captions, narration, sound, and quality review. Use when the user asks for animated Shorts, cartoon storytelling videos, or a Ricks Clips-inspired style.
---

# Viral Cartoon 3D Shorts Studio — V3

## Creative target
Create original, fast, visually clear animated stories in the broad style of viral minimalist 3D cartoon Shorts: clean light-colored rounded heads, tiny readable facial features, compact pear/bean-shaped bodies, simple limbs, expressive posing, bold clothing silhouettes, and detailed 3D locations. **Use original character designs; do not copy a specific channel's exact character assets, logo, or proprietary designs.** Aim for the style principles—not exact replication.

The video must feel like a directed short, not a slideshow, game walkthrough, static storyboard, or collection of random shots.

## Start by inspecting the project
1. Inspect the repo, existing scripts, available rendering tools, assets, and skills. Preserve existing work.
2. Identify the current engine and reuse it when sound. Prefer the project's established 3D renderer (Three.js/WebGL or Blender) and its existing video compositor (Remotion/FFmpeg) rather than switching engines without a clear reason.
3. Check actual capabilities in the current environment (Node, Python, FFmpeg, browser/WebGL, Blender, network and asset permissions). Never claim a render, dependency, asset, or inspection succeeded unless it actually did.
4. For a new short, first produce a compact story outline and shot list, then implement. Do not ask for approval for every routine step; stop only for an essential blocker or when the user requests a preview checkpoint.

## Story format
- Default length: 45–65 seconds; vertical 9:16; 24 or 30 fps; default 1080x1920 if render resources allow. Reduce resolution for previews.
- Hook in first 1–2 seconds: specific, surprising, visual, and understandable with audio off.
- A clear setup, escalation, reversal/payoff, and final button/loop when natural.
- Usually 8–14 story beats. Each beat must add information, action, stakes, or a visual gag.
- Narration should be conversational and punchy, not a lecture. Avoid overcrowded captions.
- Captions: concise, correctly timed, mobile-legible, with safe margins; emphasize only key phrases.

## Original character design system
Build a reusable cast, not one-off random figures.
- Character proportions: simple rounded light head, small eyes and mouth, compact torso, readable arms/legs. Use a consistent stylized family while varying height, build, skin/head finish, hairstyle, facial detail, clothing, accessories, and silhouette so characters are not clones.
- Avoid extreme head/body mismatch, floating heads, disconnected neck/head seams, broken elbows, twisted limbs, foot sliding, or generic duplicate crowd characters.
- Give each named character a stable ID and design sheet/definition (shape, colors, outfit, personality, signature gesture, voice/narration role, and 1 fixed recognizable detail). Reuse IDs across scenes; don't redraw or change the character identity.
- Facial acting: implement a small reliable expression set (neutral, curious, suspicious, happy, annoyed, worried, shocked, embarrassed, smug) with eyes, brows if supported, and mouth shape. Facial changes must be visible at phone size.
- Performance variations are allowed: pose, expression, action, camera view, and props. Identity changes are not allowed without story/design approval.

## Environments and assets
- Create occupied, layered environments with a foreground, action plane, and background. Add useful props that support the story, not decorative clutter.
- Favor reusable environment kits: office, apartment, street, shop, restaurant, warehouse, school, hospital, historical location, exterior/interior.
- Use real 3D geometry, materials, lighting, shadows, and spatial depth. Avoid flat SVG/shape-only scenes as the final visual unless the story deliberately calls for it.
- Use free licensed assets from sources such as Poly Haven only when the network is permitted. Check license/attribution requirements and save a small asset manifest. Don't download blindly; pick assets that fit the scene and render budget.
- Procedural models are fine for hero props, but add bevels, material variation, scale, surface detail, and correct silhouettes; do not default to primitive-only rooms.
- Keep assets lightweight and cache downloads. Optimize polygon counts, textures, lights, and render settings for the available environment.

## Shot direction
Use deliberate shot variety and storytelling composition:
- Establishing wide shots to orient the viewer and show scale.
- Medium shots to show interaction.
- Close-ups for reactions or important details only.
- Over-the-shoulder, low-angle, high-angle, insert, tracking, and reveal shots as story-appropriate.
- Camera changes should be motivated. No repetitive framing, unnecessary zooms, or disorienting cuts.
- Use depth cues: foreground framing, parallax, lighting contrast, haze only if render-friendly, and meaningful background activity.
- Each 2–4 seconds should include a meaningful story/action/visual change; not every beat needs a cut.

## Character acting and animation
Characters must perform clear actions instead of standing while the camera moves.
Implement or reuse reliable animation primitives:
- idle breathing/weight shift, blinking, look-at, head turn, reaction timing;
- walk/run cycles with planted feet and arm swing;
- sit/stand, point, wave, shrug, hold/use object, push/pull, carry, fall safely, turn, laugh, argue, recoil, celebrate;
- synchronized interaction with props and other characters;
- secondary movement: doors, screens, lamps, paper, rain, smoke, vehicles, or machinery as appropriate.
Use ease-in/ease-out and clear anticipation, action, and follow-through. Keep movement grounded; prevent foot sliding, clipping, floating, abrupt teleporting, and unnatural joint rotations. Background characters need subtle but varied activity, not frozen clones.

## Camera, lighting, and composition
- Use soft key/fill/rim or environment lighting as appropriate, contact shadows, and controlled contrast. Keep faces and story details visible on mobile; don't crush shadows.
- Make the location and scale clear. Use cinematic focal length choices and depth of field sparingly; prioritize readability.
- Use camera motion sparingly but intentionally: dolly, tracking, pan, tilt, orbit, crane/reveal, rack focus if supported.
- Maintain continuity of screen direction, character positions, prop locations, lighting, and environment between shots.
- Keep subjects and captions inside vertical safe areas; avoid tiny text.

## Scene construction workflow
For each scene, create a scene brief with: beat/time, narration, visual action, characters/IDs, environment/props, shot size/angle, camera movement, lighting, sound cue, caption, and transition. Then build and render.

Use a single reusable scene/character system and explicit timeline. Avoid duplicated scenes with only camera changes unless the narration and visual purpose warrant it.

## Audio and caption timing
- Keep narration synchronized with visual beats. If using TTS, check availability and voice/license constraints.
- Use sound effects that correspond to visible actions (footsteps, door, impact, machinery, ambience). Avoid random effects.
- Mix narration above music and effects; duck music beneath narration. Do not reuse a prior mix blindly if the visuals changed.
- When audio cannot be listened to in the environment, state that it was not ear-checked and use waveform/timing checks only; never claim auditory QA.

## Quality gate — do not skip
Before final export:
1. Render a low-resolution preview or contact sheet with representative frames from every scene.
2. Review character consistency, readable faces, anatomy, scale, scene depth, lighting, framing, action, continuity, captions, and repetitive shots.
3. Verify that every shot has a visual purpose and meaningful movement; flag frozen or clone-like characters.
4. Verify audio track existence, duration, timing, clipping/peaks where tools permit, subtitle timing, and correct mix structure. Report any audio limits honestly.
5. Fix the most visible issues and render a second preview if needed.
6. Only then render the full-resolution video. For a mobile/cloud session with limited resources, use staged rendering and report time/resource limits; do not pretend full rendering completed.
7. Deliver the MP4 and source project/assets where available, plus a short summary of verified output, issues, and next steps.

## Defaults for user requests
- If topic is given but no duration: 60 seconds.
- If no platform: YouTube Shorts/Reels/TikTok vertical 9:16.
- If no style details: this skill's original minimalist 3D cartoon style.
- If no explicit preview request: build and inspect a short preview, then continue if environment supports it. If output quality is poor, revise instead of accepting it.
- If rendering isn't possible, deliver a working project and a precise, honest render command; never substitute a storyboard and call it a video.

## Command
When activated, run this workflow end-to-end with the user's topic. The skill can be invoked as `/viral-cartoon-3d-shorts` if Claude Code exposes the skill command.
