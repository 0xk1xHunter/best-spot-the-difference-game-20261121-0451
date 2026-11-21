// render.js — every pixel the player sees: the header, the two panels, the
// markers on found differences, the counter, the timer, the buttons and
// the title / pause / level-complete / game-complete / out-of-time cards.
// One canvas, one fixed 1280x800 coordinate space; the page scales it.

import { PANEL_W, PANEL_H } from './scenes.js';
import { formatTime, foundCount, remainingCount, totalCount } from './differences.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const PANEL_Y = 88;
export const LEFT_X = 40;
export const RIGHT_X = 680;

const INK = '#f4ead8';
const DIM = '#9aa5b1';
const GREEN = '#22c55e';
const RED = '#ef476f';
const YELLOW = '#ffd166';
const CARD = '#1d2733';

function text(ctx, str, x, y, size, fill, align = 'center', weight = 'bold') {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawButton(ctx, zone, label, enabled) {
  ctx.fillStyle = enabled ? '#2a9d8f' : '#3a4552';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, zone.x + zone.w / 2, zone.y + zone.h / 2 + 1, 20, enabled ? '#ffffff' : DIM);
}

// The clickable zones of the current screen, so input can hit-test them.
// Each zone: { id, x, y, w, h, enabled }.
export function hitZones(game) {
  const zones = [];
  if (game.screen === 'play') {
    zones.push({ id: 'hint', x: 40, y: 724, w: 150, h: 52, enabled: game.level.hintsLeft > 0 });
    zones.push({ id: 'restart', x: 206, y: 724, w: 150, h: 52, enabled: true });
    zones.push({ id: 'sound', x: 372, y: 724, w: 150, h: 52, enabled: true });
  }
  if (game.screen === 'title') {
    zones.push({ id: 'start', x: 490, y: cardGeometry(8, true).buttonY, w: 300, h: 60, enabled: true });
  }
  if (game.screen === 'levelComplete') {
    zones.push({ id: 'next', x: 490, y: cardGeometry(3, true).buttonY, w: 300, h: 60, enabled: true });
  }
  if (game.screen === 'gameComplete' || game.screen === 'levelFailed') {
    zones.push({ id: 'again', x: 490, y: cardGeometry(2, true).buttonY, w: 300, h: 60, enabled: true });
  }
  if (game.screen === 'paused') {
    zones.push({ id: 'resume', x: 490, y: cardGeometry(2, true).buttonY, w: 300, h: 60, enabled: true });
  }
  return zones;
}

function drawHeader(ctx, game) {
  ctx.fillStyle = '#14181f';
  ctx.fillRect(0, 0, VIEW_W, 64);
  text(ctx, 'DOUBLE TAKE', 40, 33, 30, YELLOW, 'left');
  text(ctx, 'spot the difference', 282, 34, 16, DIM, 'left', 'normal');
  if (game.screen === 'play' || game.screen === 'paused') {
    const scene = game.level.scene;
    text(ctx, `Level ${game.level.levelIndex + 1} of 3 · ${scene.title}`, 640, 33, 22, INK);
  }
  text(ctx, `Score ${game.score}`, 1240, 33, 22, INK, 'right');
}

function drawPanelFrame(ctx, x, label) {
  ctx.strokeStyle = '#f4ead8';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, PANEL_Y, PANEL_W, PANEL_H);
  text(ctx, label, x + PANEL_W / 2, PANEL_Y - 16, 16, DIM);
}

function drawFoundMarkers(ctx, level, x0) {
  for (const diff of level.scene.differences) {
    if (!level.found.has(diff.id)) continue;
    const cx = x0 + diff.x;
    const cy = PANEL_Y + diff.y;
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, diff.r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx - 2, cy + 8);
    ctx.lineTo(cx + 11, cy - 8);
    ctx.stroke();
  }
}

function drawHintPulse(ctx, level, x0, now) {
  const hinted = level.hinted;
  if (!hinted) return;
  const pulse = 1 + 0.18 * Math.sin(now / 180);
  const cx = x0 + hinted.x;
  const cy = PANEL_Y + hinted.y;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, (hinted.r + 12) * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPanels(ctx, game, now) {
  const level = game.level;
  const scene = level.scene;
  // Left panel: the base picture. Right panel: base + every difference.
  ctx.save();
  ctx.beginPath();
  ctx.rect(LEFT_X, PANEL_Y, PANEL_W, PANEL_H);
  ctx.clip();
  ctx.translate(LEFT_X, PANEL_Y);
  scene.drawBase(ctx);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(RIGHT_X, PANEL_Y, PANEL_W, PANEL_H);
  ctx.clip();
  ctx.translate(RIGHT_X, PANEL_Y);
  scene.drawBase(ctx);
  for (const diff of scene.differences) diff.drawRight(ctx);
  ctx.restore();
  drawPanelFrame(ctx, LEFT_X, 'LEFT');
  drawPanelFrame(ctx, RIGHT_X, 'RIGHT');
  drawFoundMarkers(ctx, level, LEFT_X);
  drawFoundMarkers(ctx, level, RIGHT_X);
  drawHintPulse(ctx, level, LEFT_X, now);
  drawHintPulse(ctx, level, RIGHT_X, now);
  if (game.screen === 'play' && level.wrongFlash > 0 && level.wrongAt) {
    const [wx, wy] = level.wrongAt;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(wx - 12, wy - 12);
    ctx.lineTo(wx + 12, wy + 12);
    ctx.moveTo(wx + 12, wy - 12);
    ctx.lineTo(wx - 12, wy + 12);
    ctx.stroke();
  }
}

function drawBottomBar(ctx, game) {
  const level = game.level;
  // Counter.
  const found = foundCount(level);
  const total = totalCount(level);
  const left = remainingCount(level);
  text(ctx, `Found ${found} / ${total}  ·  ${left} left`, 40, 692, 30, INK, 'left');
  // Timer bar + digits.
  const ratio = level.timeLeft / level.scene.timeLimit;
  const barX = 560;
  const barW = 300;
  ctx.fillStyle = '#3a4552';
  roundRect(ctx, barX, 676, barW, 26, 13);
  ctx.fill();
  ctx.fillStyle = ratio < 0.2 ? RED : ratio < 0.45 ? YELLOW : GREEN;
  if (ratio > 0) {
    roundRect(ctx, barX, 676, Math.max(26, barW * ratio), 26, 13);
    ctx.fill();
  }
  text(ctx, formatTime(level.timeLeft), barX + barW + 16, 689, 22, INK, 'left');
  text(ctx, 'TIME', barX - 16, 689, 16, DIM, 'right');
  // Message line.
  if (game.message && game.messageUntil > performance.now()) {
    text(ctx, game.message, 640, 712, 18, game.messageColor || INK, 'center', 'normal');
  }
  // Buttons.
  for (const zone of hitZones(game)) {
    if (zone.id === 'hint') drawButton(ctx, zone, `Hint (${level.hintsLeft})`, zone.enabled);
    else if (zone.id === 'restart') drawButton(ctx, zone, 'Restart', true);
    else if (zone.id === 'sound') drawButton(ctx, zone, game.muted ? 'Sound off' : 'Sound on', true);
  }
}

function drawCrosshair(ctx, game) {
  if (!game.keyboardMode) return;
  const { x, y } = game.crosshair;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 24, y);
  ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 24, y);
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x, y + 24);
  ctx.stroke();
}

// Card geometry, shared by the painter and the hit-tester so the button
// the player sees is the button the player can click.
export function cardGeometry(lineCount, hasButton) {
  const top = 150;
  const height = 110 + lineCount * 40 + (hasButton ? 110 : 40);
  return { top, height, buttonY: top + height - 80 };
}

function drawCard(ctx, title, lines, buttonLabel, buttonId) {
  const { top, height, buttonY } = cardGeometry(lines.length, Boolean(buttonLabel));
  ctx.fillStyle = 'rgba(10, 14, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = CARD;
  roundRect(ctx, 340, top, 600, height, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, title, 640, top + 70, 44, YELLOW);
  let y = top + 140;
  for (const line of lines) {
    text(ctx, line, 640, y, 22, INK, 'center', 'normal');
    y += 40;
  }
  if (buttonLabel) {
    drawButton(ctx, { id: buttonId, x: 490, y: buttonY, w: 300, h: 60 }, buttonLabel, true);
  }
}

function drawTitle(ctx, game) {
  // The first scene's panels, dimmed, behind the card.
  const scene = game.level.scene;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.rect(LEFT_X, PANEL_Y, PANEL_W, PANEL_H);
  ctx.clip();
  ctx.translate(LEFT_X, PANEL_Y);
  scene.drawBase(ctx);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.rect(RIGHT_X, PANEL_Y, PANEL_W, PANEL_H);
  ctx.clip();
  ctx.translate(RIGHT_X, PANEL_Y);
  scene.drawBase(ctx);
  for (const diff of scene.differences) diff.drawRight(ctx);
  ctx.restore();
  drawCard(ctx, 'DOUBLE TAKE', [
    'Two pictures. A few quiet differences. Find them all.',
    'Click a difference on either picture — or move the',
    'crosshair with the arrow keys and press Enter.',
    'Wrong clicks cost 5 seconds. Hints are limited.',
    '',
    'Level 1 · Night Market — 7 differences, 2:00',
    'Level 2 · Garden at Dusk — 9 differences, 2:30',
    'Level 3 · Harbor Morning — 12 differences, 3:00',
  ], game.best > 0 ? `Play  ·  best ${game.best}` : 'Play', 'start');
}

export function drawGame(ctx, game, now) {
  ctx.fillStyle = '#0e1218';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawHeader(ctx, game);
  if (game.screen === 'title') {
    drawTitle(ctx, game);
    return;
  }
  drawPanels(ctx, game, now);
  drawBottomBar(ctx, game);
  drawCrosshair(ctx, game);
  if (game.screen === 'levelComplete') {
    const bonus = Math.ceil(game.level.timeLeft) * 5;
    drawCard(ctx, 'Level complete!', [
      `${game.level.scene.title} — all ${totalCount(game.level)} differences found.`,
      `Time bonus: ${bonus} points.`,
      `Score: ${game.score}`,
    ], game.level.levelIndex < 2 ? 'Next level' : 'See results', 'next');
  } else if (game.screen === 'gameComplete') {
    drawCard(ctx, 'You found them all!', [
      `All three scenes cleared. Final score: ${game.score}`,
      game.score > game.best ? 'A new best score!' : `Best score: ${game.best}`,
    ], 'Play again', 'again');
  } else if (game.screen === 'levelFailed') {
    drawCard(ctx, 'Out of time!', [
      `${game.level.scene.title} — you found ${foundCount(game.level)} of ${totalCount(game.level)}.`,
      'The differences are still there. Try the level again.',
    ], 'Try again', 'again');
  } else if (game.screen === 'paused') {
    drawCard(ctx, 'Paused', [
      'Take a breath. The clock is stopped.',
      'Press P, Esc or Resume to keep hunting.',
    ], 'Resume', 'resume');
  }
}
