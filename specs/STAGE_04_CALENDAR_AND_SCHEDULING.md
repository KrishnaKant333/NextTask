# Stage 4 Specification — Calendar & Scheduling

- **Feature ID**: `STAGE-04`
- **Stage**: Stage 4 — Calendar & Scheduling
- **Status**: `COMPLETED`
- **Author**: Lead Software Architect & Senior Full-Stack Engineer
- **Created Date**: 2026-09-18
- **Target Completion**: 2026-09-18

---

## 1. Problem Statement
Currently, NextTask organizes tasks strictly in vertical list views with due-date badges and sorting. While effective for linear backlog processing, users cannot visually perceive task density across time, cannot anticipate upcoming deadline bottlenecks, and lack an intuitive temporal view to plan weeks or months ahead.
Stage 4 introduces dedicated **Temporal Productivity Views**, starting with an interactive Calendar View and View Switcher architecture, enabling users to schedule, visualize, and reschedule tasks over time with zero external legacy library bloat.

---

## 2. User Stories
- **Primary User Story**: As a professional managing multiple deadlines, I want an interactive Calendar view with monthly and weekly scheduling, so that I can immediately visualize workload distribution, prevent deadline collisions, and plan my schedule with clarity.
- **Secondary User Story**: As a project lead, I want to toggle smoothly between List view and Calendar view while retaining project, tag, and status filters, so that I can analyze tasks from whatever perspective best suits the moment.
- **Third User Story**: As a busy user, I want to reschedule tasks by clicking dates or moving due dates directly on the calendar grid, without having to open multiple dialog forms.

---

## 3. Milestones Breakdown

| Milestone | Objective | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 4.1** | View Switcher Foundation & Interactive Month Calendar | Header view toggle (List vs Calendar), 7x5 month grid calendar with custom date math, task chip rendering by due date with project colors, month navigation (prev/next/today), click-to-schedule modal trigger. | **COMPLETED** |
| **Milestone 4.2** | Calendar Day Detail & Interactive Task Rescheduling | Date cell detail popover/drawer, HTML5 drag-and-drop task date rescheduling, quick date assignment presets (+1d, +7d, custom), overdue highlight indicators. | **COMPLETED** |
| **Milestone 4.3** | "Upcoming" & Smart Timeline View | Sidebar "Upcoming" focus view (next 7 days timeline breakdown), week agenda layout, timeline metrics. | **COMPLETED** |

---

## 4. Functional Requirements (Milestone 4.1 Focused)
1. **View Switcher in Workbench Header**:
   - Clean Studio Slate view toggle button group: `List` (`List` icon) and `Calendar` (`Calendar` icon).
   - Preserves all existing filters (active project, tags, search query) when switching views.
   - Defaults to `list` view or remembers last selected view in local storage.
2. **Interactive Month Calendar Grid**:
   - Accurate 7-column month grid (Sunday to Saturday or Monday to Sunday, standard starting Sunday).
   - Calculates leading and trailing padding days from adjacent months so grid is always complete.
   - Header with current month name, year, `Previous Month` (`ChevronLeft`), `Next Month` (`ChevronRight`), and `Today` quick jump button.
   - Indicates current today cell with subtle highlight ring/dot (`.calendar-cell.is-today`).
3. **Calendar Task Chip Rendering**:
   - Each calendar day cell displays tasks whose `dueDate` falls on that date.
   - Task chip shows: completion checkbox/dot, project color swatch, task title (truncated), priority indicator.
   - Completed tasks in calendar show strikethrough and muted styling.
   - When more than 3 tasks exist on a single day, displays a `+X more` count indicator.
4. **Day Interaction & Task Creation**:
   - Clicking an empty date cell opens task capture pre-filled with that date.
   - Clicking a task chip opens `TaskEditModal` for immediate editing or inspection.
5. **Zero External Bloat**:
   - Built with native JavaScript `Date` math utilities (`client/src/utils/dateUtils.js`)—zero heavy dependencies (no Moment.js, no fullcalendar bundle).

---

## 5. Non-Functional Requirements
- **Performance**: Instant month navigation (< 16ms render time, 60fps).
- **Bundle Efficiency**: Lightweight native date helpers (~1.5 KB), keeping production bundle compact.
- **Design System Fidelity**: Full adherence to the **Studio Slate** design language:
  - `--bg-surface` for cell backgrounds, `--border-hairline` grid lines.
  - No harsh glowing neon colors or generic card float.
  - Tabular typography for date numerals.
- **Accessibility**: Keyboard navigable month controls, clear ARIA roles (`role="grid"`, `role="gridcell"`).

---

## 6. Technical Implementation Details

### 6.1 Frontend Architecture
- **New Utility ([`client/src/utils/dateUtils.js`](file:///d:/KKS/1.%20AProject/NextTask/client/src/utils/dateUtils.js))**:
  - `getMonthDays(year, month)`: Returns 35–42 date objects with `{ date, dateStr, isCurrentMonth, isToday }`.
  - `formatMonthYear(year, month)`: e.g. "September 2026".
  - `isSameDay(d1, d2)`: Fast ISO comparison.
- **New Component ([`client/src/components/CalendarView.jsx`](file:///d:/KKS/1.%20AProject/NextTask/client/src/components/CalendarView.jsx))**:
  - Calendar header navigation.
  - 7 weekday headers (Sun, Mon, Tue, Wed, Thu, Fri, Sat).
  - 35 or 42 grid cells.
  - Task chips mapped by `task.dueDate` matching `cell.dateStr`.
  - Day click handler: opens capture or invokes task creation with pre-filled date.
- **Component Updates ([`client/src/App.jsx`](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.jsx))**:
  - State: `const [activeViewMode, setActiveViewMode] = useState("list"); // 'list' | 'calendar'`
  - View switcher buttons in header utility section.
  - Conditional rendering: renders `.task-list-rows` when `activeViewMode === "list"`, or `<CalendarView>` when `activeViewMode === "calendar"`.
- **CSS Additions ([`client/src/App.css`](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.css))**:
  - View toggle button styles.
  - Full calendar container, day header, grid cells, task chips, and today indicator styles.

---

## 7. Definition of Done
### Milestone 4.1 (COMPLETED)
- [x] `dateUtils.js` implemented and verified.
- [x] View Switcher toggle (`List` / `Calendar`) added to header.
- [x] Month calendar grid renders correctly for any month/year with accurate day-of-week alignment.
- [x] Tasks mapped accurately to their due dates with project colored dot and priority badge.
- [x] Month navigation (`Prev`, `Next`, `Today`) operates smoothly.
- [x] Task click opens edit modal; date click triggers new task with date preset.
- [x] `npx oxlint src` passes with 0 warnings/errors.
- [x] `npm run build` succeeds cleanly.
- [x] Documentation updated in `context/` and `walkthrough.md`.

### Milestone 4.2 (COMPLETED)
- [x] Extended `dateUtils.js` with `formatFriendlyDate`, `getRelativeDateLabel`, `isPastDate`, and `addDaysToDateISO`.
- [x] `CalendarDayModal.jsx` day agenda inspector component created with relative label badges, completion toggling, quick rescheduling popover, and inline task scheduling.
- [x] HTML5 drag-and-drop task rescheduling integrated into `CalendarView.jsx` (`draggable` chips, drop highlight on day cells, reactive backend update).
- [x] Overdue visual indicators (cell top hairline highlight, overdue dot, task chip warning badge) for past uncompleted tasks.
- [x] Automated test script `scratch/test_milestone_4_2.js` executed and passed.
- [x] Clean oxlint linting (0 warnings, 0 errors across 13 files).
- [x] Production build clean in 1.55s.

### Milestone 4.3 (COMPLETED)
- [x] Added `getTimelineBucket`, `TIMELINE_BUCKET_META`, and `TIMELINE_BUCKETS_ORDER` to `dateUtils.js`.
- [x] Added "Upcoming" navigation button with `CalendarDays` icon and live badge count to `Sidebar.jsx`.
- [x] Built `TimelineView.jsx` component rendering chronologically grouped buckets (Overdue, Today, Tomorrow, This Week, Next Week, Later, Earlier).
- [x] Integrated `selectedView === "upcoming"` in `App.jsx`, computing `taskCounts.upcoming` and rendering `<TimelineView>`.
- [x] Styled timeline sections, indicator nodes, hairline tracks, and overdue warning badges in `App.css`.
- [x] Automated test script `scratch/test_milestone_4_3.js` passed with 100% assertions satisfied.
- [x] `oxlint` clean (0 warnings, 0 errors across 14 files).
- [x] Production build clean in 2.42s.
