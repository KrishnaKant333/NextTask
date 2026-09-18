# Stage 5 Specification — Time Tracking & Pomodoro Focus Timer

- **Feature ID**: `STAGE-05`
- **Stage**: Stage 5 — Time Tracking & Pomodoro Focus Timer
- **Status**: `COMPLETED`
- **Author**: Lead Software Architect & Senior Full-Stack Engineer
- **Created Date**: 2026-09-18
- **Target Completion**: 2026-09-18

---

## 1. Problem Statement
While NextTask currently excels at task organization, project grouping, checklists, and calendar scheduling, users lack an integrated mechanism to execute focused work intervals and track time spent on individual commitments. Users are forced to rely on external timer utilities, breaking workflow continuity and preventing insight into actual effort versus initial estimates.
Stage 5 integrates an intentional **Pomodoro Focus Timer** and **Time Tracking Architecture** built directly into the Studio Slate environment without external audio or charting library bloat.

---

## 2. User Stories
- **Primary User Story**: As a focused knowledge worker, I want a distraction-free Pomodoro timer embedded in NextTask, so that I can maintain deep focus cycles (work, short break, long break) without context switching.
- **Secondary User Story**: As a project manager or student, I want to bind focus intervals to specific tasks and log completed cycles against target estimates, so that I can accurately gauge the time cost of complex deliverables.
- **Third User Story**: As a power user, I want subtle Web Audio API chimes and persistent timer state across browser refreshes and workspace navigation, so my focus sessions are never interrupted.

---

## 3. Milestones Breakdown

| Milestone | Objective | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 5.1** | Pomodoro Focus Timer Foundation | Global focus timer engine (Work 25m, Short Break 5m, Long Break 15m), floating/docked Studio Slate widget, Play/Pause/Skip/Reset controls, Web Audio API chime, local storage persistence. | **COMPLETED** |
| **Milestone 5.2** | Task-Bound Focus Sessions & Estimates | `Task.pomodorosCompleted` & `Task.estimatedPomodoros` schema extension, task row "Focus" trigger, in-place session progress counters, auto-increment on interval completion. | **NEXT MILESTONE** |
| **Milestone 5.3** | Time Tracking Log & Daily Focus Metrics | Daily focus duration logging, focus summary card in workbench header, project-level focus distribution. | PLANNED |

---

## 4. Functional Requirements (Milestone 5.1 Focused)

1. **Timer Engine Modes & Default Durations**:
   - **Work (Focus)**: 25 minutes (`1500` seconds).
   - **Short Break**: 5 minutes (`300` seconds).
   - **Long Break**: 15 minutes (`900` seconds).
   - **Long Break Interval**: Every 4 completed work sessions (`sessionsCompleted % 4 === 0`).

2. **Timestamp-Based Reconciliation Engine**:
   - Avoids timer drift in backgrounded tabs by storing and comparing epoch timestamps (`Date.now()`).
   - When running: sets `targetEndTime = Date.now() + remainingSeconds * 1000`.
   - On tick and on browser tab recovery (`visibilitychange` / `focus`):
     `remainingSeconds = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000))`.
   - When pausing: freezes `remainingSeconds`, clears `targetEndTime = null`, sets `isRunning = false`.

3. **Persistent State Schema (`localStorage` key `nexttask_pomodoro_state`)**:
   - `mode`: `"work" | "short_break" | "long_break"`
   - `isRunning`: `boolean`
   - `remainingSeconds`: `number` (remaining seconds in current mode)
   - `targetEndTime`: `number | null` (epoch milliseconds when session will hit zero)
   - `sessionsCompleted`: `number` (count of completed focus sessions)
   - `soundEnabled`: `boolean` (mute toggle, default `true`)
   - `lastCompletedTimestamp`: `number | null` (guard against duplicate completion triggers)

4. **Interval Completion & Zero-Reach Behavior**:
   - When timer reaches zero (`remainingSeconds <= 0`) while `isRunning`:
     - Sets `isRunning = false`, clears `targetEndTime = null`.
     - Validates against `lastCompletedTimestamp` to ensure chime and transition fire **strictly once**.
     - If `soundEnabled`: triggers native Web Audio two-tone harmonic chime.
     - If current mode is `"work"`:
       - Increments `sessionsCompleted += 1`.
       - If `sessionsCompleted % 4 === 0`: transitions mode to `"long_break"` (15m).
       - Else: transitions mode to `"short_break"` (5m).
     - If current mode is `"short_break"` or `"long_break"`:
       - Transitions mode to `"work"` (25m).
     - Resets `remainingSeconds` to the default duration of the new mode in a paused state, awaiting user start.
     - Flashes browser tab title: `"Session Complete! • NextTask"`.

5. **Controls & Interactions**:
   - **Start / Pause**: Single-click toggle.
   - **Reset**: Restores active mode's default duration without altering `sessionsCompleted`.
   - **Skip**: Advances immediately to the next mode in sequence without counting toward completed work sessions unless already complete.
   - **Mode Switch**: Manually clicking a mode pill switches mode and resets remaining time to that mode's default duration.
   - **Sound Toggle**: Toggles audio chime on/off with persistent preference.

6. **Studio Slate UI Architecture**:
   - **Docked Header Pill**: Sits non-intrusively in the header utility bar. Displays active mode dot, tabular `MM:SS`, and an instant play/pause toggle.
   - **Expanded Focus Drawer / Popover**: Displays mode segmented switcher, circular or linear progress track, large tabular countdown, primary controls (Play/Pause, Skip, Reset), cycle counter dots ("Session #X of 4"), and sound toggle.

---

## 5. Non-Functional Requirements
- **Precision**: Maximum drift tolerance `< 1s` regardless of browser throttling or tab suspension.
- **Bundle Efficiency**: 0 external audio files, 0 heavy packages. Uses native Web Audio API (`AudioContext`).
- **Design System Fidelity**: Calm Studio Slate dark surfaces (`--bg-surface`, `--bg-elevated`, `--border-hairline`), subdued status colors (coral `#f43f5e` for work, emerald `#10b981` for short break, indigo `#6366f1` for long break), tabular numbers.
- **Accessibility**: ARIA labels on all control buttons, live region announcements.

---

## 6. Definition of Done for Milestone 5.1
- [x] `client/src/utils/pomodoroUtils.js`: Implements formatting, timestamp reconciliation math, Web Audio chimes, and persistent storage handlers.
- [x] `client/src/components/PomodoroTimer.jsx`: Implements header dock pill and expandable control popover.
- [x] Timestamp-based reconciliation verified during active run, pause, tab backgrounding, and page reload.
- [x] Zero-reach transition behavior verified (single chime, mode switch, session count increment, 4th cycle long break).
- [x] Browser tab title synchronized with countdown and completion alerts.
- [x] Automated test suite in `scratch/test_milestone_5_1.js` passing.
- [x] `oxlint` clean with 0 warnings/errors.
- [x] `npm run build` succeeds cleanly.

---

## 7. Milestone 5.2 — Task-Bound Focus Sessions & Target Pomodoros

### Overview
Integrate the Pomodoro Focus Timer directly with tasks. Users can specify estimated Pomodoro sessions per task, trigger an active focus session on any task with 1-click, see active task focus progress in the docked header and expanded popover, and automatically increment completed Pomodoros atomically on work session completion.

### Schema Extensions (`server/models/Task.js`)
- `estimatedPomodoros`: Number, default `1`, min `1`, max `20`.
- `pomodorosCompleted`: Number, default `0`, min `0`.

### REST Endpoints
- `PATCH /api/tasks/:id/pomodoro`: Atomic increment of `pomodorosCompleted` using `$inc: { pomodorosCompleted: 1 }`. Returns populated task.
- `PUT /api/tasks/:id`: Updated to validate and allow updating `estimatedPomodoros` and `pomodorosCompleted`.

### Definition of Done for Milestone 5.2
- [x] Task schema extended with `estimatedPomodoros` and `pomodorosCompleted`.
- [x] `PATCH /api/tasks/:id/pomodoro` route and controller implemented and tested with MongoDB.
- [x] `client/src/services/taskService.js` updated with `incrementTaskPomodoro(id)`.
- [x] `TaskItem.jsx` renders `.meta-pomodoro-pill` when target/completed > 0 and 1-click Focus action button.
- [x] `TaskItem.jsx` visually highlights active focused task (`.is-focus-active`).
- [x] `TaskEditModal.jsx` includes number input for `estimatedPomodoros` (1–20) with responsive `.form-row-3`.
- [x] `PomodoroTimer.jsx` displays active task name in docked header pill and `.pomodoro-bound-task-banner` in popover.
- [x] Work session completion triggers `onCompletePomodoroForTask(activeTaskId)` and displays celebratory toasts.
- [x] Automated integration test in `scratch/test_milestone_5_2.js` passes.
- [x] `oxlint` clean with 0 warnings/errors across all 16 client files.
- [x] `npm run build` cleanly builds in 1.18s.

---

## 8. Milestone 5.3 — Time Tracking Log & Daily Focus Metrics

### Overview
Record completed focus intervals and compute real-time daily metrics, project time distribution, and consecutive daily focus streaks.

### Models & Schema (`server/models/FocusSession.js`)
- `taskId`: `ObjectId` referencing `Task`, default `null`.
- `projectId`: `ObjectId` referencing `Project`, default `null`.
- `durationMinutes`: Number, default `25`, min `1`.
- `mode`: String enum `["work", "short_break", "long_break"]`, default `"work"`.
- `completedAt`: Date, default `Date.now`.

### REST Endpoints
- `POST /api/focus-sessions`: Log a completed focus session with automatic project inheritance from task.
- `GET /api/focus-sessions/today`: Compute total focus minutes today, sessions completed today, project-level time breakdown, and consecutive daily streaks.
- `GET /api/focus-sessions`: Retrieve chronological focus history.

### Definition of Done for Milestone 5.3
- [x] `FocusSession` model created with indexes on `completedAt`, `taskId`, `projectId`.
- [x] `focusSessionController.js` and `focusSessionRoutes.js` implemented and mounted in `server.js`.
- [x] `focusSessionService.js` implemented with `logFocusSession`, `getTodayFocusMetrics`, and `getFocusHistory`.
- [x] `PomodoroTimer.jsx` updated with View Switcher (`BarChart2` toggle), 3-card KPI summary, project breakdown bars, and recent sessions list.
- [x] Work session zero-reach triggers `handleLogFocusSession` and automatically refreshes daily metrics.
- [x] `App.css` styled with Studio Slate design tokens for the stats view.
- [x] Automated integration test suite in `scratch/test_milestone_5_3.js` passes cleanly.
- [x] `oxlint` passes with 0 warnings and 0 errors across all 17 client files.
- [x] Production build passes cleanly in 1.07s.

