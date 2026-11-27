---
name: mobile-viral-animated-shorts
description: Build short, story-driven animated vertical videos from a Claude Code cloud/mobile session using repository-based, portable tools.
---

# Mobile Viral Animated Shorts Studio

Use this skill when the user asks to create an animated YouTube Short, TikTok, Reel, cartoon story, narrated explainer, or asks for a video in a viral simple-character animation style.


## Mobile/cloud-first constraints
- Assume Claude Code is running in a cloud session started from the Claude mobile app. Work only inside the checked-out repository; do not require the user's phone to run terminal commands or access a local Mac folder.
- Make every artifact portable and commit-ready. Use relative paths. Do not assume local fonts, assets, credentials, or installed apps.
- First inspect the repository, its README, package files, existing scripts, and conventions. Preserve existing work; do not replace or restructure the project without a reason.
- If a GitHub repository is not connected or the project is empty, explain the one prerequisite briefly and ask the user to connect/select a repo or create one. If the session can create files but cannot render due to missing dependencies or environment limits, still finish the source, configuration, and a clear next-step command.
- Prefer a cloud-compatible browser-rendered animation/video pipeline that works without a desktop GUI. Use Remotion with React for timed scene composition and Three.js when real 3D depth is helpful. If the repository already has a working stack, use it instead of introducing a new one.
- Never claim the video was rendered, previewed, tested, or exported unless the relevant command actually succeeded and the output was verified.

## Originality and style
Create an original visual identity. Use the general ingredients of concise viral storytelling—simple expressive characters, readable staging, visual surprises, strong pacing, cinematic framing, clear narration—but do not copy a specific creator's characters, scenes, scripts, exact assets, branding, or distinctive designs.

Default visual direction: clean stylized 3D/cartoon characters in richly composed environments; appealing silhouettes; expressive face and body poses; warm/cool cinematic lighting; subtle depth, shadows, props, and purposeful camera motion. Avoid uncanny robot/zombie movement, floating feet, disconnected heads, stiff arms, or motionless scenes.

## Workflow
### 1) Clarify only essential information
If the user provides a topic, proceed. Defaults: 50–65 seconds, 9:16 vertical, 1080x1920 target, one narrator, captions, family-friendly unless specified. Ask at most one essential question if topic or factual premise is unclear.

### 2) Research and factual accuracy
For documentary/history/science topics, identify factual claims and verify them using available sources/tools if research is requested or web access is available. Keep a source notes file with URLs and dates for factual claims. If web access is unavailable, mark unverified claims and do not fabricate facts, citations, dates, or quotes.

### 3) Write a retention-focused script
Create a strong curiosity hook in the first 1–2 seconds. Avoid slow greetings or channel intros. Structure: hook → context → escalating details/visual beats → surprising reveal/payoff → concise closing. Aim for spoken language and short sentences. Write voiceover and captions in sync; avoid dense caption blocks.

### 4) Scene plan before production
Create `production/scene-plan.md` with a scene table containing: scene number, time range, voiceover, visual action, character emotions/poses, environment/props, camera framing/movement, transition, sound cue, caption text, and asset needs. Keep a visual change or action beat every ~2–4 seconds; use timing as a pacing guide, not an arbitrary cut requirement.

### 5) Build an efficient animation
- Build a reusable scene/character system; avoid one-off hard-coded scenes when a reusable component is practical.
- Characters need readable facial expressions, gestures, weight shifts, foot contact, anticipation, follow-through, and reactions. Do not overanimate every frame; movement should support story meaning.
- Use camera choices intentionally: wide establishing shot, medium action, close-up reaction, insert/detail, motivated pan/dolly/orbit/zoom. Avoid random camera movement.
- Use backgrounds, foreground elements, props, lighting changes, depth/parallax, and atmospheric details to make scenes feel alive.
- Prioritize stable render performance in the cloud. Use procedural geometry, vector/2D elements, CSS/Canvas/Three.js, or repository assets as appropriate. Avoid heavyweight dependencies unless justified.
- Use original or licensed assets only. Do not download or reuse copyrighted creator assets, character designs, video clips, or music without permission.

### 6) Narration, captions, and sound
- Produce a narration script with timing and pronunciation notes where needed.
- If speech generation is available through a configured tool or service, use it only with authorized access. Otherwise provide a clean voiceover script and do not invent a generated audio file.
- Captions must be legible on phone screens, concise, high contrast, safely positioned away from UI edges, and synchronized to the narration.
- Use only original, properly licensed, or user-provided sound/music. If no audio tool/asset exists, create a sound cue sheet rather than claiming to have audio.

### 7) Render and quality-check
- Run the available lint, typecheck, and render/build scripts.
- Render a low-resolution or short test first when practical; check duration, aspect ratio, scene transitions, subtitle timing, and obvious visual bugs.
- If image/video inspection is available, inspect the actual output. Fix errors and render again.
- Final export target: MP4, vertical 9:16, H.264 if supported. Default output location: `output/short.mp4`.
- If render fails, report the exact blocker and leave the project runnable with documented commands.

### 8) Deliverables
Keep the project organized and provide:
- `production/script.md` — final voiceover, hook, and CTA
- `production/scene-plan.md` — storyboard/scene breakdown
- `production/source-notes.md` — factual source URLs and research notes when applicable
- editable project code and assets
- `output/short.mp4` only if render completed successfully
- `README.md` or `production/README.md` with run/build/render steps

Summarize what was created, what was actually tested/rendered, any limitations, and the exact repository paths. Do not overpromise.


## Invocation
When the user says “make a Short,” “create an animated video,” “use the viral animation skill,” or gives a topic plus asks for video, automatically follow this skill. Start by inspecting the repository, then do the work—not merely provide a plan. If the user wants just a script or storyboard, deliver only that requested stage.
