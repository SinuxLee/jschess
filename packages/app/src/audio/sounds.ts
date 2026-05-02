import { WAV, type WavId } from '@jschess/engine';

export const SOUND_URLS: Record<WavId, string> = {
  [WAV.MOVE]: new URL('/sounds/move.wav', import.meta.url).href,
  [WAV.CAPTURE]: new URL('/sounds/capture.wav', import.meta.url).href,
  [WAV.CHECK]: new URL('/sounds/check.wav', import.meta.url).href,
  [WAV.MATE]: new URL('/sounds/win.wav', import.meta.url).href,
  [WAV.ILLEGAL]: new URL('/sounds/illegal.wav', import.meta.url).href,
  [WAV.CLICK]: new URL('/sounds/click.wav', import.meta.url).href,
  [WAV.NEWGAME]: new URL('/sounds/newgame.wav', import.meta.url).href,
  [WAV.LOSS]: new URL('/sounds/loss.wav', import.meta.url).href,
  [WAV.DRAW]: new URL('/sounds/draw.wav', import.meta.url).href,
};
