# NextTask — Technical Architecture Decisions (ADR)

This document records the foundational architectural decisions verified directly from the existing NextTask repository and established during the architectural baseline analysis.

---

## ADR-001: Decoupled Multi-Folder Repository Structure (Client & Server Separation)
- **Date**: Pre-existing (Verified in repository baseline)
- **Status**: ACCEPTED

### Context
NextTask requires a clear separation of concerns between its user-facing single-page interface and its data-persistence API backend.

### Decision
Structure the repository into two distinct, isolated root folders: `client/` for frontend assets and build scripts, and `server/` for the Node.js API runtime, each maintaining its own `package.json` and dependency tree.

### Reasoning
- Decouples client build cycles from server execution.
- Enables independent deployment, horizontal scaling, and framework upgrades.
- Provides clean isolation of frontend and backend concerns.

### Alternatives Considered
- *Monolithic single-package Express server serving static React builds*: Limits independent development workflows and hot-reloading speed.
- *Full monorepo workspace (Turborepo / Nx / npm workspaces)*: Unnecessary overhead at the initial project scale, though viable in later phases.

### Consequences
- Requires starting two distinct processes during development (`client` and `server`).
- Requires configuring CORS and managing network endpoints across origins.

---

## ADR-002: Vite as Frontend Development Server and Bundler
- **Date**: Pre-existing (Verified in `client/package.json`)
- **Status**: ACCEPTED

### Context
Fast developer feedback, modern JavaScript module bundling, and rapid Hot Module Replacement (HMR) are critical for client velocity.

### Decision
Use Vite (`^8.1.1`) with `@vitejs/plugin-react` (`^6.0.3`) as the client build tool.

### Reasoning
- Extremely fast cold starts using native browser ES modules.
- Modern defaults with zero complex configuration required.
- Superior performance and active ecosystem compared to legacy Create React App or Webpack setups.

### Alternatives Considered
- *Create React App / Webpack*: Deprecated, sluggish build cycles, and heavy configuration overhead.
- *Next.js (Fullstack)*: The project architecture intentionally separates the client SPA from an Express/MongoDB backend service.

### Consequences
- Environment variables must follow the `VITE_` prefix convention (`import.meta.env.VITE_*`).
- Client files execute in a strict browser-first ESM environment.

---

## ADR-003: Native ECMAScript Modules (ESM) Across Entire Stack
- **Date**: Pre-existing (Verified in `client/package.json` and `server/package.json`)
- **Status**: ACCEPTED

### Context
Node.js historically relied on CommonJS (`require` / `module.exports`). Modern JavaScript standards utilize native ECMAScript modules (`import` / `export`).

### Decision
Configure `"type": "module"` in both `client/package.json` and `server/package.json`.

### Reasoning
- Unifies syntax across frontend and backend codebases.
- Enables native tree-shaking and modern package compatibility.
- Aligns with modern Node.js and browser runtime specifications.

### Alternatives Considered
- *CommonJS for backend (`require`)*: Creates cognitive context-switching between frontend and backend files and complicates sharing code or utilities in the future.

### Consequences
- Backend imports of local files must explicitly include the `.js` file extension (e.g., `import Task from "./models/Task.js"`).
- Traditional `__dirname` and `__filename` require `import.meta.url` if needed.

---

## ADR-004: Centralized Axios API Service Layer on Frontend
- **Date**: Pre-existing (Verified in `client/src/services/taskService.js`)
- **Status**: ACCEPTED

### Context
Directly invoking HTTP requests inside React UI components leads to duplicated network logic, inconsistent error handling, and tight coupling between UI presentation and API routes.

### Decision
Abstract all network communication behind dedicated service functions in `client/src/services/` (starting with `taskService.js`).

### Reasoning
- Decouples React presentation from HTTP client implementation.
- Simplifies mocking and automated testing.
- Establishes a single location for base URL configuration, auth headers, and response interceptors.

### Alternatives Considered
- *Native `fetch` inside `useEffect` in components*: Leads to repetitive boilerplate, manual JSON parsing, and fragmented error handling.
- *TanStack Query (React Query) immediately*: Excellent future enhancement, but a thin Axios service layer provides the prerequisite foundation first.

### Consequences
- Components must import and invoke service functions rather than calling HTTP endpoints directly.

---

## ADR-005: Task Data Model Schema (Mongoose / MongoDB)
- **Date**: Pre-existing (Verified in `server/models/Task.js`)
- **Status**: ACCEPTED (With pending enhancements)

### Context
Tasks represent the core domain entity of NextTask and require flexible attributes for state, urgency, and deadlines.

### Decision
Define a Mongoose schema on the `tasks` collection with fields:
- `title` (String, required)
- `completed` (Boolean, default `false`)
- `priority` (String, enum `["low", "medium", "high"]`, default `"medium"`)
- `dueDate` (Date, default `null`)

### Reasoning
- Covers the foundational attributes required for productive task tracking.
- Provides native schema validation and default value assignment.
- Maps directly to the document model in MongoDB.

### Alternatives Considered
- *Unstructured documents without Mongoose schema*: Prone to inconsistent data types and runtime crashes.
- *Relational database (PostgreSQL)*: MongoDB was selected to support rapid iteration, schema evolution, and flexible document hierarchies.

### Consequences
- Need to ensure Mongoose `runValidators: true` is properly passed on updates.
- Future phases will add `{ timestamps: true }`, `userId`, `projectId`, and `tags`.

---

## ADR-006: Server-Side Global Unique Title Validation
- **Date**: Pre-existing (Verified in `server/controllers/taskController.js:25-33`)
- **Status**: UNDER REVIEW (Flagged for Refinement in Stage 1)

### Context
`taskController.js` currently queries `Task.findOne({ title: title.trim() })` on task creation and rejects duplicate titles with HTTP `400`.

### Decision (Current State)
Disallow duplicate task titles globally across the database.

### Reasoning Behind Original Implementation
- Prevents accidental double-submission of identical tasks in a single-user prototype.

### Consequences & Known Flaws
- In a multi-user environment or long-term productivity platform, multiple users or even a single user will legitimately have duplicate tasks (e.g., "Weekly Review", "Buy milk", "Deploy release").
- Global uniqueness constraint without user scoping will cause collisions between unrelated users.

### Action Plan
During Stage 1 stabilization, consult with product direction to either scope uniqueness to active/uncompleted tasks or remove the strict uniqueness check in favor of user-level scoping.

---

## ADR-007: Plain Vanilla CSS with Tokenized Design System
- **Date**: Pre-existing (Verified in `client/src/index.css` and `client/src/App.css`)
- **Status**: ACCEPTED

### Context
NextTask requires an intentional, highly responsive dark theme interface with custom typography, rounded card layouts, and subtle micro-interactions.

### Decision
Use Vanilla CSS leveraging native CSS custom properties (variables) for tokens, flexbox/grid for layouts, and media queries for responsiveness, without third-party CSS utility frameworks like Tailwind unless requested.

### Reasoning
- Zero build overhead, zero CSS-in-JS runtime performance penalty.
- Maximum flexibility and full control over every pixel, transition, and theme token.
- Avoids external dependencies that lock styling to proprietary utility classes.

### Alternatives Considered
- *TailwindCSS*: Adds build configuration and utility clutter without user request.
- *Styled-components / Emotion*: Runtime CSS-in-JS performance penalty and extra dependencies.

### Consequences
- Requires disciplined naming conventions and central maintenance of tokens in `index.css`.
- Must resolve the existing `#root` style conflict between `index.css` and `App.css`.

---

## ADR-008: Timestamp-Based Reconciliation & Native Web Audio for Pomodoro Engine
- **Date**: 2026-09-18 (Milestone 5.1)
- **Status**: ACCEPTED

### Context
Browser timers based exclusively on `setInterval` suffer from heavy background tab throttling, leading to multi-minute clock drift when users work in other applications. Additionally, external audio files (`.mp3` / `.wav`) introduce network overhead, potential 404s, and autoplay permission issues.

### Decision
1. Drive the countdown engine using epoch timestamps (`Date.now()` vs `targetEndTime`) rather than naive interval decrements, reconciling remaining time on every sub-second tick and on `visibilitychange` / `window.onfocus` events.
2. Synthesize audio alerts directly using the browser-native Web Audio API (`AudioContext` with sine wave oscillator and exponential gain decay), requiring zero external audio assets.
3. Persist active running target, remaining duration, mode, cycle counts, and sound preference to `localStorage`.

### Reasoning
- Eliminates clock drift completely: returning to a backgrounded tab immediately recalculates remaining seconds to exact real-world time.
- Guarantees zero asset failure for audio cues with an ultra-lightweight footprint (~1.5 KB).
- Ensures seamless state recovery on browser reload or view switching.

### Consequences
- Requires guarding zero-reach logic against duplicate triggers when a timer completes while backgrounded.
- Web Audio `AudioContext` must be initialized upon user gesture (Start click) to adhere to browser autoplay policies.

---

## ADR-009: Stateless JWT Authentication with Bcryptjs and Mandatory Environment Secret
- **Date**: 2026-09-18 (Milestone 6.1)
- **Status**: ACCEPTED

### Context
Stage 6 introduces multi-tenancy and user authentication. Securing user accounts requires resistant password hashing and an authentication token mechanism that is both performant and compatible across varied deployment platforms (e.g. Windows dev environments without C++ compiler toolchains). Additionally, insecure fallback secrets (e.g. `process.env.JWT_SECRET || "default_dev_secret"`) create critical security vulnerabilities if deployed accidentally.

### Decision
1. **Password Hashing**: Use `bcryptjs` with salt round work factor 10. `bcryptjs` is pure JavaScript, eliminating native build dependencies (`node-gyp`, Python, MSVC C++ tools on Windows) while maintaining cryptographically secure blowfish key stretching.
2. **Stateless JWT**: Issue signed JSON Web Tokens (`jsonwebtoken`) containing `{ id: user._id }` with an explicit expiration (`7d` default, configurable via `JWT_EXPIRES_IN`).
3. **Fail-Fast Environment Security**: Require `process.env.JWT_SECRET`. Both server boot (`server.js`) and authentication middleware (`authMiddleware.js`) strictly validate the presence of `JWT_SECRET`. If missing or empty, execution halts immediately with a fatal error. Never permit hardcoded fallback secrets.
4. **Password Exclusion**: Enforce password stripping via Mongoose `userSchema.set("toJSON", { transform: ... delete ret.password })` and controller projections (`.select("-password")`), guaranteeing password hashes are never leaked in API payloads.
5. **Unified Credential Responses**: On failed authentication, return a single generic response (`"Invalid email or password"`) with status 401 to prevent user enumeration.

### Alternatives Considered
- *Native `bcrypt`*: Requires C++ node-gyp build tools which frequently fail during installation on Windows environments.
- *Session cookies with express-session / Redis*: Adds stateful storage dependencies and complicates decoupled API deployments across mobile or third-party clients.
- *Hardcoded fallback secret*: Catastrophic security vulnerability if left active in staging/production.

### Consequences
- All subsequent protected routes must extract `req.headers.authorization` Bearer tokens.
- Tasks, Projects, and FocusSessions must be scoped to `req.user._id` in Milestone 6.2.

