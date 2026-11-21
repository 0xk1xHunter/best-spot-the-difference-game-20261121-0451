// input.js — mouse and keyboard, turned into game actions.
// Pointer clicks arrive in CSS pixels and are scaled into the game's
// 1280x800 space. Arrow keys move a crosshair (Enter/Space clicks where
// it stands); H hints, R restarts the level, M toggles sound, P/Esc pauses.

import { VIEW_W, VIEW_H, hitZones } from './render.js';

export function createInput(canvas, game, actions) {
  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  function zoneAt(x, y) {
    for (const zone of hitZones(game)) {
      if (zone.enabled && x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
        return zone;
      }
    }
    return null;
  }

  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = toGameCoords(event);
    actions.point(x, y, zoneAt(x, y));
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat && !event.key.startsWith('Arrow')) return;
    const step = event.shiftKey ? 4 : 16;
    switch (event.key) {
      case 'ArrowLeft':
        game.keyboardMode = true;
        game.crosshair.x = Math.max(0, game.crosshair.x - step);
        event.preventDefault();
        break;
      case 'ArrowRight':
        game.keyboardMode = true;
        game.crosshair.x = Math.min(VIEW_W, game.crosshair.x + step);
        event.preventDefault();
        break;
      case 'ArrowUp':
        game.keyboardMode = true;
        game.crosshair.y = Math.max(0, game.crosshair.y - step);
        event.preventDefault();
        break;
      case 'ArrowDown':
        game.keyboardMode = true;
        game.crosshair.y = Math.min(VIEW_H, game.crosshair.y + step);
        event.preventDefault();
        break;
      case 'Enter':
      case ' ':
        actions.confirm();
        event.preventDefault();
        break;
      case 'h':
      case 'H':
        actions.hint();
        break;
      case 'r':
      case 'R':
        actions.restart();
        break;
      case 'm':
      case 'M':
        actions.toggleSound();
        break;
      case 'p':
      case 'P':
      case 'Escape':
        actions.pause();
        break;
      default:
        break;
    }
  });
}
