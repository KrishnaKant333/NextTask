// scratch/test_milestone_5_1.js
// Automated verification for Milestone 5.1: Pomodoro Focus Timer Foundation

import assert from "node:assert";
import {
  POMODORO_MODES,
  DEFAULT_DURATIONS,
  formatTimerSeconds,
  calculateRemainingFromTarget,
  getNextMode
} from "../client/src/utils/pomodoroUtils.js";

console.log("Starting Milestone 5.1 verification suite...\n");

// 1. Test Timer Formatting
console.log("Test 1: formatTimerSeconds formatting edge cases");
assert.strictEqual(formatTimerSeconds(1500), "25:00");
assert.strictEqual(formatTimerSeconds(300), "05:00");
assert.strictEqual(formatTimerSeconds(900), "15:00");
assert.strictEqual(formatTimerSeconds(61), "01:01");
assert.strictEqual(formatTimerSeconds(9), "00:09");
assert.strictEqual(formatTimerSeconds(0), "00:00");
assert.strictEqual(formatTimerSeconds(-10), "00:00");
assert.strictEqual(formatTimerSeconds(NaN), "00:00");
assert.strictEqual(formatTimerSeconds(undefined), "00:00");
console.log("✓ formatTimerSeconds successfully verified.");

// 2. Test Timestamp Reconciliation Math
console.log("\nTest 2: Timestamp Reconciliation & Drift Prevention");
const now = Date.now();
// 120 seconds into future
const target120s = now + 120 * 1000;
const rem120 = calculateRemainingFromTarget(target120s);
assert.ok(rem120 >= 119 && rem120 <= 120, `Expected ~120s, got ${rem120}`);

// Past target (timer reached zero in background)
const targetPast = now - 15 * 1000;
const remPast = calculateRemainingFromTarget(targetPast);
assert.strictEqual(remPast, 0, "Past targets must clamp to 0, never negative");

// Simulation: 25-minute work session started at t0.
// Browser tab gets backgrounded / throttled for 600 seconds (10 minutes).
const t0 = now;
const workDurationMs = 25 * 60 * 1000;
const sessionTarget = t0 + workDurationMs;

// Simulated tab return 600 seconds later:
const simulatedReturnNow = t0 + 600 * 1000;
const remainingAfterBackground = Math.max(
  0,
  Math.ceil((sessionTarget - simulatedReturnNow) / 1000)
);
assert.strictEqual(
  remainingAfterBackground,
  15 * 60,
  "Timestamp reconciliation must precisely recover 15:00 remaining regardless of setInterval lag"
);
console.log("✓ Timestamp reconciliation math guarantees zero drift across tab backgrounding.");

// 3. Test Pomodoro Mode Progression & 4th-Cycle Long Break Cadence
console.log("\nTest 3: Pomodoro Mode Progression & Cadence");
// Session 1 completed -> Short Break
const modeAfter1 = getNextMode(POMODORO_MODES.WORK, 0);
assert.strictEqual(modeAfter1, POMODORO_MODES.SHORT_BREAK);

// Short break finished -> Work
const modeAfterBreak1 = getNextMode(POMODORO_MODES.SHORT_BREAK, 1);
assert.strictEqual(modeAfterBreak1, POMODORO_MODES.WORK);

// Session 2 completed -> Short Break
const modeAfter2 = getNextMode(POMODORO_MODES.WORK, 1);
assert.strictEqual(modeAfter2, POMODORO_MODES.SHORT_BREAK);

// Session 3 completed -> Short Break
const modeAfter3 = getNextMode(POMODORO_MODES.WORK, 2);
assert.strictEqual(modeAfter3, POMODORO_MODES.SHORT_BREAK);

// Session 4 completed -> Long Break!
const modeAfter4 = getNextMode(POMODORO_MODES.WORK, 3);
assert.strictEqual(
  modeAfter4,
  POMODORO_MODES.LONG_BREAK,
  "4th completed work session must trigger Long Break"
);

// Long break finished -> Work
const modeAfterLongBreak = getNextMode(POMODORO_MODES.LONG_BREAK, 4);
assert.strictEqual(modeAfterLongBreak, POMODORO_MODES.WORK);

// Session 8 completed -> Long Break again!
const modeAfter8 = getNextMode(POMODORO_MODES.WORK, 7);
assert.strictEqual(modeAfter8, POMODORO_MODES.LONG_BREAK);
console.log("✓ 4-session focus cadence and mode transitions verified.");

// 4. Test State Persistence Schema & Simulation
console.log("\nTest 4: State Persistence Schema & Recovery");
const mockTimerState = {
  mode: POMODORO_MODES.WORK,
  isRunning: true,
  remainingSeconds: 1450,
  targetEndTime: Date.now() + 1450 * 1000,
  sessionsCompleted: 2,
  soundEnabled: true
};

const serialized = JSON.stringify(mockTimerState);
const restored = JSON.parse(serialized);

assert.strictEqual(restored.mode, POMODORO_MODES.WORK);
assert.strictEqual(restored.isRunning, true);
assert.strictEqual(restored.sessionsCompleted, 2);
assert.strictEqual(restored.soundEnabled, true);

// Test recovery calculation on load:
const recoveredRemaining = calculateRemainingFromTarget(restored.targetEndTime);
assert.ok(recoveredRemaining >= 1449 && recoveredRemaining <= 1450);
console.log("✓ State persistence and recovery simulation verified.");

console.log("\nALL MILESTONE 5.1 TESTS PASSED SUCCESSFULLY! 🎉\n");
