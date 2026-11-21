// main.js — Double Take: the boot, the loop and the state machine.
// Screens: title → play ⇄ paused → levelComplete → (next level | results)
// → gameComplete, or play → levelFailed → retry. The clock only runs on
// the play screen. ?shot=start|cover|mid|complete stages a scene for a
// screenshot instead of running the loop, paints it twice and sets
// window.__shotReady. window.__game exposes the live state for testing.

import { PANEL_W, PANEL_H, SCENES } from './scenes.js';
import {
  POINTS_PER_FIND, POINTS_PER_SECOND_LEFT, WRONG_CLICK_PENALTY_SECONDS,
  clickAt, createLevelState, foundCount, isLevelComplete, levelCount,
  remainingCount, tickClock, totalCount, useHint,
} from './differences.js';
import { LEFT_X, PANEL_Y, RIGHT_X, drawGame } from './render.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';

const BEST_KEY = 'doubletake-best';
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const shotLevel = Number.parseInt(params.get('level') ?? '0', 10) || 0;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const audio = createAudio();

const game = {
  screen: 'title',
  level: createLevelState(0),
  score: 0,
  scoreAtLevelStart: 0,
  best: readBest(),
  muted: false,
  keyboardMode: false,
  crosshair: { x: LEFT_X + PANEL_W / 2, y: PANEL_Y + PANEL_H / 2 },
  message: '',
  messageColor: '#f4ead8',
  messageUntil: 0,
};
window.__game = game;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function say(message, color) {
  game.message = message;
  game.messageColor = color || '#f4ead8';
  game.messageUntil = performance.now() + 2600;
  if (status) status.textContent = message;
}

function startLevel(index) {
  game.level = createLevelState(index);
  game.scoreAtLevelStart = game.score;
  game.screen = 'play';
  game.crosshair = { x: LEFT_X + PANEL_W / 2, y: PANEL_Y + PANEL_H / 2 };
  say(`Level ${index + 1}: ${SCENES[index].title} — find ${totalCount(game.level)} differences.`);
}

function startGame() {
  game.score = 0;
  startLevel(0);
  audio.unlock();
  audio.click();
}

function finishLevel() {
  const bonus = Math.ceil(game.level.timeLeft) * POINTS_PER_SECOND_LEFT;
  game.score += bonus;
  audio.win();
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.best);
  }
  game.screen = 'levelComplete';
  say(`Level complete! Time bonus +${bonus}.`);
}

function failLevel() {
  game.screen = 'levelFailed';
  say(`Out of time — ${foundCount(game.level)} of ${totalCount(game.level)} found.`, '#ef476f');
}

function panelCoords(x, y) {
  if (y < PANEL_Y || y > PANEL_Y + PANEL_H) return null;
  if (x >= LEFT_X && x <= LEFT_X + PANEL_W) return { x: x - LEFT_X, y: y - PANEL_Y, canvasX: x, canvasY: y };
  if (x >= RIGHT_X && x <= RIGHT_X + PANEL_W) return { x: x - RIGHT_X, y: y - PANEL_Y, canvasX: x, canvasY: y };
  return null;
}

function handlePoint(x, y, zone) {
  audio.unlock();
  if (zone) {
    handleButton(zone.id);
    return;
  }
  if (game.screen !== 'play') return;
  const spot = panelCoords(x, y);
  if (!spot) return;
  const outcome = clickAt(game.level, spot.x, spot.y);
  if (outcome.result === 'found') {
    game.score += POINTS_PER_FIND;
    game.level.wrongAt = null;
    audio.found();
    say(`Found it — ${outcome.diff.label}! ${remainingCount(game.level)} left.`, '#22c55e');
    if (isLevelComplete(game.level)) finishLevel();
  } else if (outcome.result === 'already') {
    say('You already found that one.');
  } else {
    game.level.timeLeft = Math.max(0, game.level.timeLeft - WRONG_CLICK_PENALTY_SECONDS);
    game.level.wrongFlash = 30;
    game.level.wrongAt = [spot.canvasX, spot.canvasY];
    audio.wrong();
    say(`Not a difference — ${WRONG_CLICK_PENALTY_SECONDS} seconds lost.`, '#ef476f');
    if (game.level.timeLeft === 0) failLevel();
  }
}

function handleButton(id) {
  audio.click();
  if (id === 'start') startGame();
  else if (id === 'next') {
    if (game.level.levelIndex + 1 >= levelCount()) {
      game.screen = 'gameComplete';
      if (game.score > game.best) {
        game.best = game.score;
        saveBest(game.best);
      }
    } else {
      startLevel(game.level.levelIndex + 1);
    }
  } else if (id === 'again') startGame();
  else if (id === 'resume') {
    game.screen = 'play';
    say('Back to the hunt.');
  } else if (id === 'restart') {
    game.score = game.scoreAtLevelStart;
    startLevel(game.level.levelIndex);
  } else if (id === 'hint') {
    if (game.screen !== 'play') return;
    const hinted = useHint(game.level);
    if (hinted) {
      audio.hint();
      say(`Hint: look near ${hinted.label}. ${game.level.hintsLeft} left.`, '#ffd166');
    } else {
      say('No hints left on this level.', '#ef476f');
    }
  } else if (id === 'sound') {
    game.muted = !game.muted;
    audio.setMuted(game.muted);
    say(game.muted ? 'Sound off.' : 'Sound on.');
  }
}

function handleConfirm() {
  audio.unlock();
  if (game.screen === 'title') startGame();
  else if (game.screen === 'levelComplete') handleButton('next');
  else if (game.screen === 'gameComplete' || game.screen === 'levelFailed') startGame();
  else if (game.screen === 'paused') handleButton('resume');
  else if (game.screen === 'play') {
    const { x, y } = game.crosshair;
    handlePoint(x, y, null);
  }
}

function handlePause() {
  if (game.screen === 'play') {
    game.screen = 'paused';
    say('Paused.');
  } else if (game.screen === 'paused') {
    game.screen = 'play';
    say('Back to the hunt.');
  }
}

createInput(canvas, game, {
  point: handlePoint,
  confirm: handleConfirm,
  hint: () => handleButton('hint'),
  restart: () => { if (game.screen === 'play') handleButton('restart'); },
  toggleSound: () => handleButton('sound'),
  pause: handlePause,
});

// ---- screenshot staging: paint a fixed scene, no loop ----
function stageShot(name) {
  if (name === 'start') {
    game.screen = 'title';
  } else if (name === 'cover') {
    game.level = createLevelState(0);
    game.screen = 'play';
    game.score = 400;
    for (const diff of game.level.scene.differences.slice(0, 4)) game.level.found.add(diff.id);
    game.level.timeLeft = 92;
    say('Four found — three more hiding in plain sight.', '#22c55e');
  } else if (name === 'mid') {
    game.level = createLevelState(1);
    game.screen = 'play';
    game.score = 1150;
    for (const diff of game.level.scene.differences.slice(0, 3)) game.level.found.add(diff.id);
    game.level.timeLeft = 101;
    game.level.hintsLeft = 1;
    useHint(game.level);
    say('A hint is circling one difference.', '#ffd166');
  } else if (name === 'complete') {
    game.level = createLevelState(0);
    game.screen = 'levelComplete';
    game.score = 700 + Math.ceil(92) * POINTS_PER_SECOND_LEFT;
    game.level.timeLeft = 92;
    for (const diff of game.level.scene.differences) game.level.found.add(diff.id);
  } else {
    game.screen = 'title';
  }
  let painted = 0;
  function paint() {
    drawGame(ctx, game, performance.now());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (game.screen === 'play') {
      if (game.level.wrongFlash > 0) game.level.wrongFlash -= 1;
      if (tickClock(game.level, dt)) failLevel();
    }
    drawGame(ctx, game, now);
  }
  say('Double Take. Click or press Space to start.');
  requestAnimationFrame(frame);
}

if (shot) stageShot(shot);
else runGame();
