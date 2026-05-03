import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

mount(App, { target });

/**
 * Fit the whole game area to the viewport without scrollbars.
 * Design reference dims: width 1360px (title bar + three cards + gaps),
 * height 980px (title + tallest card). Scale down if the viewport is
 * smaller than either dimension; never scale up past 1 so wide screens
 * see the native 1.37 board.
 */
const DESIGN_W = 1360;
const DESIGN_H = 980;

function applyGameScale(): void {
  const sw = window.innerWidth / DESIGN_W;
  const sh = window.innerHeight / DESIGN_H;
  const scale = Math.min(1, sw, sh);
  document.documentElement.style.setProperty('--game-scale', String(scale));
}

applyGameScale();
window.addEventListener('resize', applyGameScale);
