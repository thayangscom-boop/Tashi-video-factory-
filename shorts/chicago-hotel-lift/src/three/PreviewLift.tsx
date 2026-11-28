import { ThreeCanvas } from '@remotion/three';
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Captions } from '../components/Captions';
import { FilmLook } from '../components/World';
import { TIMING } from '../lib/anim';
import { LiftShot } from './LiftShots';
import { clamp, useFontsReady } from './kit';
import { TL, shotAt } from './liftWorld';

export const LIFT_FRAMES = Math.round(TL.duration * TL.fps);
/** caption lines for this cut, re-timed from the narration timing file */
const LINES = TL.vo.map((v) => {
  const ln = TIMING.lines.find((l) => l.id === v.line)!;
  const caps = 'captions' in v && v.captions ? ln.captions.slice(0, v.captions as number) : ln.captions;
  return { ...ln, start: v.start, captions: caps };
});
const GL = { antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 };

/** Look-dev cut #2: the lifting process, staged as seven distinct shots (14.2 s). */
export const PreviewLift: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const fonts = useFontsReady(['118px Anton', '44px Anton', '34px Anton', '700 40px Fredoka']);
  const shot = shotAt(t);
  // time-passing dissolve from the high-angle shot into the time-lapse
  const dz = TL.cuts[5]; const half = TL.dissolve / 2;
  const mixing = t > dz - half && t < dz + half;
  const base = mixing ? 4 : shot;
  const fadeOut = clamp((t - (TL.duration - 0.5)) / 0.5);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ opacity: 1 - fadeOut * 0.0 }}>
        <ThreeCanvas key={`a${base}`} width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} gl={GL}>
          {fonts && <LiftShot t={t} frame={frame} shot={base} />}
        </ThreeCanvas>
      </AbsoluteFill>
      {mixing && <AbsoluteFill style={{ opacity: clamp((t - (dz - half)) / TL.dissolve) }}>
        <ThreeCanvas key="b5" width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} gl={GL}>
          {fonts && <LiftShot t={t} frame={frame} shot={5} />}
        </ThreeCanvas>
      </AbsoluteFill>}
      <FilmLook frame={frame} vignette={0.5} />
      <Captions lines={LINES} />
      <Audio src={staticFile('audio/preview_lift.wav')} />
    </AbsoluteFill>
  );
};
