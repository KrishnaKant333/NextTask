# NextTask — AI Agent Handoff (Next Task)

## 1. Current Development Stage
- **Stage**: Stage 0 Completion & Handover to Stage 1 (Application Stabilization).
- **Current Milestone**: Repository Audit, Architectural Baseline & Specifications Finalization.

---

## 2. Current Objective
Establish a clean, rock-solid architectural baseline and comprehensive documentation suite (`context/`, `specs/`, and root `README.md`) before any new features or schema expansions are introduced.

---

## 3. Immediate Next Actionable Task (For Subsequent Agent)
Execute **Stage 1: Current Application Stabilization**, focusing on resolving existing code bugs, technical debt, and configuration hardcoding discovered during the Stage 0 audit:

1. **Fix `runValidators` typo in backend controller**:
   - File: `server/controllers/taskController.js:63`
   - Change `runvalidators: true` to `runValidators: true`.
2. **Make Server Port Configurable**:
   - File: `server/server.js:28`
   - Change hardcoded `5000` to `const PORT = process.env.PORT || 5000; app.listen(PORT, ...)`.
3. **Make Client API URL Configurable**:
   - File: `client/src/services/taskService.js:3`
   - Use `const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/tasks";`.
4. **Clean Server Dependencies**:
   - File: `server/package.json`
   - Remove unused frontend packages (`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, `vite`).
   - Add `"dev": "nodemon server.js"` to scripts.
5. **Add User Feedback for Duplicate Tasks & Errors**:
   - File: `client/src/App.jsx`
   - Provide a visual message or warning state when duplicate titles are submitted instead of silently failing.
6. **Harmonize CSS `#root` Selectors**:
   - Files: `client/src/index.css` and `client/src/App.css`
   - Reconcile clashing `#root` width and display definitions.

---

## 4. Relevant Files
- [server/controllers/taskController.js](file:///d:/KKS/1.%20AProject/NextTask/server/controllers/taskController.js)
- [server/server.js](file:///d:/KKS/1.%20AProject/NextTask/server/server.js)
- [server/package.json](file:///d:/KKS/1.%20AProject/NextTask/server/package.json)
- [client/src/services/taskService.js](file:///d:/KKS/1.%20AProject/NextTask/client/src/services/taskService.js)
- [client/src/App.jsx](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.jsx)
- [client/src/App.css](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.css)
- [client/src/index.css](file:///d:/KKS/1.%20AProject/NextTask/client/src/index.css)

---

## 5. Dependencies
- Node.js runtime and npm.
- Running MongoDB instance on `mongodb://127.0.0.1:27017/NextTask` (or as defined in `server/.env`).

---

## 6. Constraints
- **Zero Regression**: Existing task creation, deletion, in-place edit, completion toggles, and count statistics must remain 100% functional.
- **No Unnecessary Rewrites**: Fix bugs surgically. Do not replace entire files when modifying specific lines.
- **Do Not Change UI Layout Radically**: Keep the current dark aesthetic intact while resolving layout collisions and adding feedback elements.
- **No Unapproved Dependencies**: Do not install new third-party state managers or UI component libraries during this stabilization pass.

---

## 7. Expected Result
- Server runs smoothly with `npm run dev` using `nodemon server.js` or `npm run start` on a configurable port.
- Client runs via `npm run dev` and connects to backend using configurable `VITE_API_URL`.
- Server validates updates with Mongoose schema rules enabled.
- User is notified when task submission is rejected (e.g., duplicate title).
- CSS is clean without competing `#root` properties.

---

## 8. Verification & Testing Requirements
1. Start MongoDB, server (`npm run dev`), and client (`npm run dev`).
2. Verify `GET /api/tasks` loads existing tasks.
3. Attempt to create a task with an empty title; verify `400 Bad Request` is handled gracefully.
4. Attempt to create duplicate task; verify user is alerted in the UI.
5. Create a new task with high priority and future due date; verify persistence in MongoDB.
6. Toggle completion, perform inline edit, and delete task; verify instant UI update and database sync.
7. Run `oxlint` on `client/` to verify zero linting errors.

---

## 9. Documentation That Must Be Updated Upon Completion
- [context/PROGRESS_TRACKER.md](file:///d:/KKS/1.%20AProject/NextTask/context/PROGRESS_TRACKER.md): Mark Stage 1 items as `COMPLETED` and close resolved items in the Technical Debt log.
- [context/NEXT_TASK.md](file:///d:/KKS/1.%20AProject/NextTask/context/NEXT_TASK.md): Advance the stage to Stage 2 (Enhanced Task Operations).

---

## 10. Unresolved Decisions Requiring User Approval
1. **Title Uniqueness Constraint**: Should task titles continue to be strictly unique across the entire database, or should users be allowed to create multiple tasks with the same title (or scoped per project/user)?
2. **Edit Scope in TaskItem**: Should in-place editing allow changing priority and due date alongside title, or should full editing open in a dedicated modal/drawer?
