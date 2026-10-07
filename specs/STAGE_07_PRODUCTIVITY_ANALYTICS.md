# Stage 7 Specification — Personal Dashboards & Productivity Analytics

- **Feature ID**: `STAGE-07`
- **Stage**: Stage 7 — Personal Dashboards & Productivity Analytics
- **Status**: `IN PROGRESS`
- **Author**: Lead Software Architect & Senior Full-Stack Engineer
- **Created Date**: 2026-09-23
- **Target Completion**: 2026-09-24

---

## 1. Problem Statement
Through Stage 6, NextTask enables users to capture tasks, organize them by projects and tags, decompose them into subtask checklists, schedule them temporally on calendars and timelines, and track focused work sessions using the Pomodoro timer.
However, users currently lack visibility into their historical output, completion velocity, and time expenditure. They cannot answer fundamental productivity questions:
- *How many tasks have I actually completed this week compared to last week?*
- *How much focus time have I spent across different projects?*
- *Am I consistently maintaining my focus habits over time?*
- *What is my overdue rate and completion efficiency?*

Furthermore, our system audit reveals that the current `Task` model lacks a dedicated `completedAt` timestamp—making accurate completion velocity calculation impossible without extending the data model. Stage 7 delivers the data foundations, aggregation pipelines, and high-craft Studio Slate analytics visualization needed to provide truthful, actionable productivity metrics.

---

## 2. User Stories
- **Primary User Story**: As a focused professional, I want to review my productivity summary and completion velocity over defined timeframes, so that I can evaluate my output and optimize my work habits.
- **Secondary User Story**: As a project manager or freelancer, I want to see time allocation across projects, so that I can understand where my effort is concentrated and spot neglected commitments.
- **Habit User Story**: As a continuous learner, I want to track my daily focus streaks and activity consistency, so that I can stay motivated without relying on superficial gamification.

---

## 3. Milestones Breakdown

| Milestone | Objective | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 7.1** | Analytics Data Foundation & Summary Metrics | Add `completedAt` to `Task` model; update task completion handlers; implement `GET /api/analytics/summary`; client `analyticsService`; automated tests. | `COMPLETED` |
| **Milestone 7.2** | Completion Velocity & Focus Trends Engine | Daily time-series aggregation pipeline (`GET /api/analytics/velocity`); zero-dependency SVG velocity bar chart; date range filters (7d, 30d, 90d). | `PLANNED` |
| **Milestone 7.3** | Project Time Allocation & Priority Distribution | Project breakdown pipeline (`GET /api/analytics/projects`); horizontal proportional distribution meters; priority distribution metrics. | `PLANNED` |
| **Milestone 7.4** | Productivity Activity Heatmap | Year/quarter activity matrix (`GET /api/analytics/heatmap`); daily intensity calculation combining focus blocks and completed tasks. | `PLANNED` |
| **Milestone 7.5** | Dedicated Analytics Dashboard & Reporting UX | Full "Analytics" view in Sidebar; Studio Slate KPI summary grid; chart layouts; export data capability (JSON). | `PLANNED` |

---

## 4. Functional Requirements (Milestone 7.1 Focused)

1. **Task Model Schema Extension (`server/models/Task.js`)**:
   - Add `completedAt`: Date, default `null`.
   - Add compound index: `{ user: 1, completedAt: -1 }`.
   - Preserve existing timestamps (`createdAt`, `updatedAt`).

2. **Task Completion Controller Updates (`server/controllers/taskController.js`)**:
   - `createTask`: If task is created with `completed: true`, set `completedAt = new Date()`; otherwise `completedAt = null`.
   - `updateTask`: If `completed` transitions from `false` to `true`, set `completedAt = new Date()`. If `completed` transitions to `false`, set `completedAt = null`. If `completed` is not modified, preserve existing `completedAt`.
   - `bulkUpdateTasks`: If `updates.completed === true`, set `completedAt = new Date()`. If `false`, set `completedAt = null`.

3. **Analytics API Endpoint (`GET /api/analytics/summary`)**:
   - Protected route requiring valid Bearer JWT.
   - Strictly scoped to `req.user._id`.
   - Calculates and returns:
     - `totalTasks`: Total tasks created by user.
     - `completedTasks`: Total tasks with `completed: true`.
     - `activeTasks`: Total tasks with `completed: false`.
     - `completionRate`: Integer percentage (`Math.round((completedTasks / totalTasks) * 100)` or `0` if no tasks exist).
     - `overdueTasks`: Active tasks where `dueDate < startOfToday`.
     - `totalFocusMinutes`: Sum of `durationMinutes` across all `FocusSession` work records.
     - `totalFocusSessions`: Total count of `FocusSession` work records.
     - `dailyStreak`: Multi-day consecutive streak of completed tasks or focus sessions.
     - `todayStats`:
       - `tasksCompletedToday`: Count of tasks where `completedAt` is within user's local today.
       - `focusMinutesToday`: Sum of focus minutes where `completedAt` is within user's local today.

4. **Timezone Support**:
   - Client passes optional `?timezoneOffset=<minutes>` (e.g. `new Date().getTimezoneOffset()`) to allow the server aggregation to align day boundaries with the user's local clock.

5. **Client Analytics Service (`client/src/services/analyticsService.js`)**:
   - `getAnalyticsSummary(params)` using centralized `apiClient`.

---

## 5. Non-Functional Requirements
- **Query Performance**: Database aggregation must execute in `< 30ms` using targeted compound indexes (`{ user: 1, completedAt: -1 }`, `{ user: 1, completed: 1 }`).
- **Data Integrity**: Zero fabricated metrics. If a metric cannot be derived from real stored data, it must not be displayed.
- **Security & Multi-Tenancy**: 100% database query scoping to `req.user._id`. Unauthenticated requests return `401 Unauthorized`.
- **Zero Third-Party Chart Bloat**: All charts in subsequent milestones will use native SVG/CSS primitives, keeping bundle impact to 0 KB.

---

## 6. Definition of Done for Milestone 7.1
- [ ] `Task` model updated with `completedAt` and compound index `{ user: 1, completedAt: -1 }`.
- [ ] `taskController.js` sets and unsets `completedAt` atomically on task creation, individual update, and bulk update.
- [ ] `analyticsController.js` and `analyticsRoutes.js` implemented with `GET /api/analytics/summary`.
- [ ] Endpoints mounted under `/api/analytics` in `server/server.js` and guarded by `protect`.
- [ ] Client service `analyticsService.js` created.
- [ ] Automated test suite `server/test_analytics_foundation.js` verifies:
  - Unauthenticated access returns 401.
  - Multi-tenant isolation (User A cannot see User B's metrics).
  - `completedAt` set when task completed, cleared when toggled back.
  - Accurate calculation of total, completed, active, overdue, completion rate, and focus metrics.
  - Empty dataset handling (graceful zeros, no NaNs or division-by-zero crashes).
- [ ] Existing task, project, pomodoro, and auth test suites pass with zero regressions.
