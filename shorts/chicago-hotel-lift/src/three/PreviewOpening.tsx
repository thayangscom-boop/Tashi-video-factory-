import { ThreeCanvas } from '@remotion/three';
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Captions } from '../components/Captions';
import { FilmLook } from '../components/World';
import { HookShot, LakeTownShot, MudStreetShot, OT } from './OpeningShots';
import { RoomShot } from './RoomShot';
import { clamp, useFontsReady } from './kit';
import caps from './openCaptions.json';

export const OPENING_FRAMES = Math.round(OT.duration * OT.fps);
const GL = { antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 };
const Shot: React.FC<{ k: number; t: number; frame: number }> = ({ k, t, frame }) =>
  k === 0 ? <HookShot t={t} frame={frame} shot="wide" />
    : k === 1 ? <HookShot t={t} frame={frame} shot="crew" />
      : k === 2 ? <RoomShot t={t - OT.cuts[2]} frame={frame} joltT={OT.roomJolt - OT.cuts[2]} />
        : k === 3 ? <LakeTownShot t={t} frame={frame} /> : <MudStreetShot t={t} frame={frame} />;

/** The first 13.9 s of the Short: the hook (three shots) and the reason Chicago had to be raised (two shots). */
export const PreviewOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const fonts = useFontsReady(['118px Anton', '44px Anton', '34px Anton', '700 30px Fredoka']);
  let shot = 0; OT.cuts.forEach((c, i) => { if (t >= c) shot = i; });
  const dz = OT.cuts[3]; const half = OT.dissolve / 2; const mixing = t > dz - half && t < dz + half;
  const base = mixing ? 2 : shot;
  const th = OT.thunder; const white = clamp(1 - Math.abs(t - th) / 0.07) * 0.85; // lightning carries the cut into the storm
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <ThreeCanvas key={`a${base}`} width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} gl={GL}>
        {fonts && <Shot k={base} t={t} frame={frame} />}
      </ThreeCanvas>
      {mixing && <AbsoluteFill style={{ opacity: clamp((t - (dz - half)) / OT.dissolve) }}>
        <ThreeCanvas key="b3" width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} gl={GL}>
          {fonts && <Shot k={3} t={t} frame={frame} />}
        </ThreeCanvas>
      </AbsoluteFill>}
      {white > 0 && <AbsoluteFill style={{ background: '#eef4ff', opacity: white }} />}
      <FilmLook frame={frame} vignette={0.5} />
      <Captions lines={caps as never} />
      <Audio src={staticFile('audio/preview_opening.wav')} />
    </AbsoluteFill>
  );
};
