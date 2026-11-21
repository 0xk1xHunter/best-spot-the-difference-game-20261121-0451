// differences.js — the hunt itself: per-level state, hit testing, hints.
// A level's state holds the scene, which differences are found, how many
// hints remain and the seconds left. Clicks are tested against each
// difference's circle in panel coordinates; either panel counts.

import { SCENES } from './scenes.js';

export const WRONG_CLICK_PENALTY_SECONDS = 5;
export const POINTS_PER_FIND = 100;
export const POINTS_PER_SECOND_LEFT = 5;

export function levelCount() {
  return SCENES.length;
}

export function levelScene(levelIndex) {
  return SCENES[levelIndex];
}

// Fresh state for one level: nothing found, full clock, full hints.
export function createLevelState(levelIndex) {
  const scene = SCENES[levelIndex];
  return {
    levelIndex,
    scene,
    found: new Set(),
    hintsLeft: scene.hints,
    timeLeft: scene.timeLimit,
    hinted: null, // the difference a hint is currently circling, or null
    wrongFlash: 0, // counts down while the screen flashes after a wrong click
    wrongAt: null, // panel coordinates of the last wrong click
  };
}

export function foundCount(state) {
  return state.found.size;
}

export function totalCount(state) {
  return state.scene.differences.length;
}

export function remainingCount(state) {
  return totalCount(state) - foundCount(state);
}

export function isLevelComplete(state) {
  return remainingCount(state) === 0;
}

// The difference whose circle holds (x, y), or null. Panel coordinates.
export function differenceAt(state, x, y) {
  for (const diff of state.scene.differences) {
    const dx = x - diff.x;
    const dy = y - diff.y;
    if (dx * dx + dy * dy <= diff.r * diff.r) return diff;
  }
  return null;
}

// Register a click at panel coordinates. Returns 'found' with the
// difference, 'already' when that difference was found before, or 'miss'.
export function clickAt(state, x, y) {
  const diff = differenceAt(state, x, y);
  if (!diff) return { result: 'miss' };
  if (state.found.has(diff.id)) return { result: 'already', diff };
  state.found.add(diff.id);
  if (state.hinted && state.hinted.id === diff.id) state.hinted = null;
  return { result: 'found', diff };
}

// Spend one hint: circle the first difference still unfound, or null when
// no hints remain or nothing is left to find.
export function useHint(state) {
  if (state.hintsLeft <= 0) return null;
  const next = state.scene.differences.find((d) => !state.found.has(d.id));
  if (!next) return null;
  state.hintsLeft -= 1;
  state.hinted = next;
  return next;
}

// Tick the clock down by dt seconds (only while playing). Returns true
// when the clock just hit zero.
export function tickClock(state, dt) {
  if (state.timeLeft <= 0) return true;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  return state.timeLeft === 0;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
