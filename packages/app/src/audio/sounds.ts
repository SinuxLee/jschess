import { WAV, type WavId } from '@jschess/engine';

export const SOUND_URLS: Record<WavId, string> = {
  [WAV.MOVE]: new URL('/sounds/move.wav', import.meta.url).href,
  [WAV.CAPTURE]: new URL('/sounds/capture.wav', import.meta.url).href,
  [WAV.CHECK]: new URL('/sounds/check.wav', import.meta.url).href,
  [WAV.MATE]: new URL('/sounds/win.wav', import.meta.url).href,
  [WAV.ILLEGAL]: new URL('/sounds/illegal.wav', import.meta.url).href,
};
