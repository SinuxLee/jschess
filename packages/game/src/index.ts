/**
 * @jschess/game — match orchestration layer.
 * Depends only on @jschess/engine. The AI search runs out-of-process;
 * this package talks to it through the AITransport interface.
 * No DOM, no Svelte.
 */
export * from './errors';
export * from './state';
export * from './events';
export * from './game-store';
export * from './ai-client';
