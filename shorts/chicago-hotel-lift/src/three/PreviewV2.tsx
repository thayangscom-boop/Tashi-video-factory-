import { ThreeCanvas } from '@remotion/three';
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Captions } from '../components/Captions';
import { FilmLook } from '../components/World';
import { ExteriorShot } from './ExteriorShot';
import { useFontsReady } from './kit';
import { RoomShot } from './RoomShot';

export const PREVIEW_FRAMES = 171;
const CUT1 = 1.9, CUT2 = 3.5;

/** V2 look-dev preview: the hook (first narration line) re-staged in real 3D. */
export const PreviewV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const fonts = useFontsReady(['118px Anton', '34px Anton', '700 40px Fredoka']);
  const shot = t < CUT1 ? 'hero' : t < CUT2 ? 'wide' : 'room';
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}>
        {fonts && shot !== 'room' && <ExteriorShot t={t} frame={frame} shot={shot === 'hero' ? 'hero' : 'wide'} />}
        {fonts && shot === 'room' && <RoomShot t={t - CUT2} frame={frame} />}
      </ThreeCanvas>
      <FilmLook frame={frame} vignette={0.5} />
      <Captions />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
