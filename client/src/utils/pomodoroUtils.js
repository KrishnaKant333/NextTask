// client/src/utils/pomodoroUtils.js
// Native Pomodoro math, timestamp reconciliation engine, and Web Audio synthesizer

export const POMODORO_MODES = {
  WORK: "work",
  SHORT_BREAK: "short_break",
  LONG_BREAK: "long_break"
};

export const DEFAULT_DURATIONS = {
  [POMODORO_MODES.WORK]: 25 * 60, // 1500s
  [POMODORO_MODES.SHORT_BREAK]: 5 * 60, // 300s
  [POMODORO_MODES.LONG_BREAK]: 15 * 60 // 900s
};

export const MODE_META = {
  [POMODORO_MODES.WORK]: {
    id: POMODORO_MODES.WORK,
    label: "Focus",
    accent: "#f43f5e",
    dotClass: "mode-work"
  },
  [POMODORO_MODES.SHORT_BREAK]: {
    id: POMODORO_MODES.SHORT_BREAK,
    label: "Short Break",
    accent: "#10b981",
    dotClass: "mode-short-break"
  },
  [POMODORO_MODES.LONG_BREAK]: {
    id: POMODORO_MODES.LONG_BREAK,
    label: "Long Break",
    accent: "#6366f1",
    dotClass: "mode-long-break"
  }
};

export const STORAGE_KEY = "nexttask_pomodoro_state";

/**
 * Format raw seconds into tabular MM:SS string.
 */
export function formatTimerSeconds(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Calculate remaining seconds from an epoch target timestamp using Date.now().
 */
export function calculateRemainingFromTarget(targetEndTime) {
  if (!targetEndTime || typeof targetEndTime !== "number") return 0;
  const now = Date.now();
  const diffMs = targetEndTime - now;
  return Math.max(0, Math.ceil(diffMs / 1000));
}

/**
 * Determine the next mode following standard Pomodoro cadence.
 * Work 1 -> Short Break
 * Work 2 -> Short Break
 * Work 3 -> Short Break
 * Work 4 -> Long Break
 * Any Break -> Work
 */
export function getNextMode(currentMode, sessionsCompleted) {
  if (currentMode === POMODORO_MODES.WORK) {
    const nextCount = sessionsCompleted + 1;
    return nextCount % 4 === 0
      ? POMODORO_MODES.LONG_BREAK
      : POMODORO_MODES.SHORT_BREAK;
  }
  return POMODORO_MODES.WORK;
}

let sharedAudioCtx = null;

export function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Synthesize a soft, Studio Slate two-tone harmonic chime via Web Audio API.
 * Zero external audio assets required.
 */
export function playPomodoroChime(type = "work_complete") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freq1 = type === "work_complete" ? 587.33 : 659.25; // D5 vs E5
    const freq2 = type === "work_complete" ? 880 : 523.25; // A5 vs C5

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq1, now);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq2, now + 0.16);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.18);

    osc2.start(now + 0.16);
    osc2.stop(now + 0.85);
  } catch {
    // Gracefully handle environments without audio permissions
  }
}

/**
 * Load persisted timer state from localStorage.
 */
export function loadPomodoroState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist timer state to localStorage.
 */
export function savePomodoroState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or privacy mode errors
  }
}

/**
 * Format minutes into friendly display (e.g. 25m, 1h 15m, 2h).
 */
export function formatFocusMinutes(minutes) {
  if (typeof minutes !== "number" || isNaN(minutes) || minutes <= 0) {
    return "0m";
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
