// audio.js — tiny synthesized sounds: no audio files, no network.
// Every sound is a short WebAudio oscillator phrase, created on first use
// (browsers only allow audio after a gesture). All calls are safe to make
// before any gesture: they simply do nothing until the context exists.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, startAt, dur, type = 'sine', volume = 0.16) {
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ac.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + startAt);
    osc.stop(ac.currentTime + startAt + dur + 0.05);
  }

  return {
    unlock() { ensure(); },
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
    // A bright two-note chime when a difference is found.
    found() { tone(660, 0, 0.12); tone(990, 0.09, 0.18); },
    // A low thud for a wrong click.
    wrong() { tone(160, 0, 0.18, 'triangle', 0.2); },
    // A soft blip when a hint is spent.
    hint() { tone(520, 0, 0.1, 'sine', 0.12); tone(780, 0.08, 0.12, 'sine', 0.12); },
    // A rising arpeggio when a level is cleared.
    win() { tone(523, 0, 0.14); tone(659, 0.12, 0.14); tone(784, 0.24, 0.22); },
    // A short click for buttons.
    click() { tone(440, 0, 0.06, 'square', 0.06); },
  };
}
