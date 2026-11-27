import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Captions } from './components/Captions';
import { FilmLook } from './components/World';
import { SceneContext, TIMING, clamp, ease } from './lib/anim';
import { SceneHook } from './scenes/S1Hook';
import { SceneMud } from './scenes/S2Mud';
import { SceneDisease } from './scenes/S3Disease';
import { ScenePlan } from './scenes/S4Plan';
import { SceneSunken } from './scenes/S5Sunken';
import { SceneTremont } from './scenes/S6Tremont';
import { SceneJacks } from './scenes/S7Jacks';
import { SceneRise } from './scenes/S8Rise';
import { SceneOutro } from './scenes/S9Outro';

type Tr = 'none' | 'fade' | 'iris' | 'wipe' | 'slide' | 'zoom' | 'dip';
const SCENES: Record<string, { C: React.FC; tr: Tr }> = {
  hook: { C: SceneHook, tr: 'none' },
  mud: { C: SceneMud, tr: 'zoom' },
  disease: { C: SceneDisease, tr: 'dip' },
  plan: { C: ScenePlan, tr: 'iris' },
  sunken: { C: SceneSunken, tr: 'wipe' },
  tremont: { C: SceneTremont, tr: 'slide' },
  jacks: { C: SceneJacks, tr: 'iris' },
  rise: { C: SceneRise, tr: 'wipe' },
  outro: { C: SceneOutro, tr: 'zoom' },
};

const TR = 12; // transition frames
const PRE = 0.12; // scene visuals begin this long before its narration line

const Enter: React.FC<{ tr: Tr; children: React.ReactNode }> = ({ tr, children }) => {
  const f = useCurrentFrame();
  const p = ease(clamp(f / TR));
  if (tr === 'none' || p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  let style: React.CSSProperties = {};
  switch (tr) {
    case 'fade': style = { opacity: p }; break;
    case 'dip': style = { opacity: p, filter: `brightness(${0.2 + 0.8 * p})` }; break;
    case 'iris': style = { clipPath: `circle(${p * 125}% at 50% 45%)` }; break;
    case 'wipe': style = { clipPath: `inset(0 ${100 - p * 100}% 0 0)` }; break;
    case 'slide': style = { transform: `translateX(${(1 - p) * 100}%)` }; break;
    case 'zoom': style = { opacity: p, transform: `scale(${1.25 - 0.25 * p})` }; break;
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const Short: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const lines = TIMING.lines;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {lines.map((ln, i) => {
        const S = SCENES[ln.scene];
        const vStart = i === 0 ? 0 : ln.start - PRE;
        const vEnd = i === lines.length - 1 ? TIMING.totalFrames / fps : lines[i + 1].start - PRE;
        const from = Math.max(0, Math.round(vStart * fps));
        const dur = Math.round(vEnd * fps) - from + (i === lines.length - 1 ? 0 : TR);
        const lead = ln.start - from / fps;
        return (
          <Sequence key={ln.id} from={from} durationInFrames={dur} name={ln.scene}>
            <SceneContext.Provider value={{ line: ln, lead }}>
              <Enter tr={S.tr}><S.C /></Enter>
            </SceneContext.Provider>
          </Sequence>
        );
      })}
      <FilmLook frame={frame} />
      <Captions />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
