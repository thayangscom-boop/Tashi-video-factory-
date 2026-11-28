import '@fontsource/anton/400.css';
import '@fontsource/fredoka/700.css';
import React from 'react';
import { Composition, continueRender, delayRender } from 'remotion';
import { Short } from './Short';
import { PREVIEW_FRAMES, PreviewV2 } from './three/PreviewV2';
import { LIFT_FRAMES, PreviewLift } from './three/PreviewLift';
import { OPENING_FRAMES, PreviewOpening } from './three/PreviewOpening';
import { TIMING } from './lib/anim';

if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all([document.fonts.load('70px Anton'), document.fonts.load('700 80px Fredoka')])
    .then(() => document.fonts.ready).then(() => continueRender(h)).catch(() => continueRender(h));
}

export const Root: React.FC = () => (
  <>
    <Composition id="Short" component={Short} durationInFrames={TIMING.totalFrames} fps={TIMING.fps} width={1080} height={1920} />
    <Composition id="PreviewOpening" component={PreviewOpening} durationInFrames={OPENING_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PreviewLift" component={PreviewLift} durationInFrames={LIFT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PreviewV2" component={PreviewV2} durationInFrames={PREVIEW_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
