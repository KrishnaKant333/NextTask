# NextTask — AI Agent Workflow Types & Execution Protocols

## 1. Universal Operating Principles for AI Agents

Every AI agent operating in this repository must adhere to the following mandatory execution rules before, during, and after making changes:

1. **Inspect Before Modifying**: Never edit or create code based on assumptions. Always view the relevant files, models, and tests first.
2. **Consult Context and Specifications**: Prior to taking action, read the relevant context document (`context/`) and the target feature specification (`specs/`).
3. **Preserve Working Code**: Do not rewrite existing code unless instructed or strictly required by an approved architectural change.
4. **Focused Scope**: Avoid making unrelated refactors or introducing drive-by changes. Keep every pull request or task execution strictly scoped.
5. **Verify and Prove**: Never claim an implementation or bugfix works without running automated verification or reproducing the behavior.
6. **Synchronize Documentation**: Whenever code, endpoints, or data models change, immediately update affected documentation (`context/PROGRESS_TRACKER.md`, `context/NEXT_TASK.md`, etc.).

---

## 2. Specialized AI Workflows

### 2.1 Repository Analysis Workflow
- **When to Use**: When onboarding to a new task, investigating an unfamiliar subsystem, or verifying claims.
- **Protocol**:
  1. Inspect directory structure and file listings using `list_dir`.
  2. Search for symbols, routes, or imports using `grep_search`.
  3. View file contents using `view_file`.
  4. Compare findings against `context/ARCHITECTURE.md` and `specs/CURRENT_SYSTEM_AUDIT.md`.
  5. Document any discrepancies found without altering source code.

### 2.2 Planning Workflow
- **When to Use**: Prior to implementing complex features, structural refactoring, or multi-file architectural changes.
- **Protocol**:
  1. Review `specs/MASTER_ROADMAP.md` to identify the stage and feature scope.
  2. Create or verify a dedicated feature spec using `specs/SPEC_TEMPLATE.md`.
  3. Outline the execution steps, affected files, risks, and verification strategy in `implementation_plan.md`.
  4. Submit the plan for user review. Await explicit approval before modifying code.

### 2.3 Feature Implementation Workflow
- **When to Use**: Executing an approved feature from the roadmap or feature specification.
- **Protocol**:
  1. Review the feature specification in `specs/`.
  2. Verify all prerequisite models, endpoints, and utility functions exist.
  3. Implement backend changes first (schema, routes, controllers) if applicable.
  4. Implement frontend services, components, and styling next.
  5. Test edge cases and validation error paths.
  6. Update `context/PROGRESS_TRACKER.md` and handoff documentation.

### 2.4 UI Development Workflow
- **When to Use**: Creating new visual components, enhancing layouts, or styling task views.
- **Protocol**:
  1. Review design tokens in `context/CODE_STANDARDS_UI_CONTEXT.md` and `client/src/index.css`.
  2. Verify component reuse: check if an existing atom or component in `components/` can be utilized.
  3. Build components using clean semantic HTML and modular CSS classes.
  4. Validate responsive behavior at desktop (`1200px`), tablet (`768px`), and mobile (`360px-480px`).
  5. Check accessibility: keyboard focus rings, `Tab` order, ARIA attributes for icon buttons.
  6. Verify dark theme contrast and visual clarity.

### 2.5 Backend Development Workflow
- **When to Use**: Adding or modifying Express routes, controllers, or middlewares.
- **Protocol**:
  1. Inspect current routes in `server/routes/` and controllers in `server/controllers/`.
  2. Define route handlers following RESTful design principles.
  3. Enforce request input validation before triggering database operations.
  4. Wrap async actions with error handling and dispatch standardized JSON error responses.
  5. Ensure proper HTTP status codes (`200`, `201`, `400`, `404`, `500`) are used consistently.

### 2.6 Database Changes Workflow
- **When to Use**: Modifying Mongoose schemas, adding indexes, or changing data models.
- **Protocol**:
  1. Review existing models in `server/models/`.
  2. Define new fields with explicit types, defaults, and validators.
  3. Ensure `{ timestamps: true }` is enabled for new schemas.
  4. Add indexes to query targets (e.g., `userId`, `dueDate`).
  5. Plan for backward compatibility with existing documents in MongoDB.
  6. Document the schema change in `context/TECHNICAL_DECISIONS.md`.

### 2.7 Refactoring Workflow
- **When to Use**: Improving code readability, eliminating duplication, or cleaning technical debt.
- **Protocol**:
  1. Identify the specific technical debt item in `context/PROGRESS_TRACKER.md`.
  2. Verify current functionality is covered by tests or verified behavior.
  3. Make minimal, surgical edits using code replacement tools.
  4. Ensure existing public interfaces, prop signatures, and API contracts do not break.
  5. Verify that no regressions were introduced.

### 2.8 Debugging Workflow
- **When to Use**: Investigating an unexpected error, failed API call, or broken UI behavior.
- **Protocol**:
  1. Reproduce the bug and examine server logs or browser console errors.
  2. Locate the originating code path (controller, service, or component).
  3. Identify root cause (e.g., typos, missing null checks, uncaught promises).
  4. Formulate the minimal fix required to resolve the issue.
  5. Test both the failing condition and the positive path to confirm the fix.
  6. Document the resolution in `context/PROGRESS_TRACKER.md`.

### 2.9 Testing Workflow
- **When to Use**: Verifying code quality, validating features, or preparing for releases.
- **Protocol**:
  1. Verify linting passes (`npm run lint` or `oxlint`).
  2. Execute unit and integration tests when test runners are configured.
  3. Perform manual end-to-end verification of user flows in the browser or via API calls.
  4. Document test cases and results in the task walkthrough.

### 2.10 Code Review Workflow
- **When to Use**: Evaluating a pull request or inspecting code before finalizing a milestone.
- **Protocol**:
  1. Check compliance with `context/CODE_STANDARDS_UI_CONTEXT.md`.
  2. Scan for anti-patterns: unused imports, hardcoded secrets, duplicate logic, unhandled promises.
  3. Ensure no unnecessary external dependencies were added.
  4. Verify all modified files are accounted for in the commit or handoff report.

### 2.11 Performance Optimization Workflow
- **When to Use**: Addressing slow render cycles, memory leaks, or sluggish database queries.
- **Protocol**:
  1. Measure baseline performance before optimizing.
  2. Identify bottlenecks (e.g., missing MongoDB indexes, unnecessary React re-renders).
  3. Apply targeted optimizations (indexing, memoization, query projections).
  4. Re-measure to verify measurable improvement without compromising readability.

### 2.12 Security Review Workflow
- **When to Use**: Touching authentication, user inputs, database queries, or external endpoints.
- **Protocol**:
  1. Check for injection vectors (NoSQL injection, XSS).
  2. Ensure sensitive values are confined to `.env` and never leaked to client or git.
  3. Validate CORS and authorization boundaries.
  4. Confirm that user-controlled IDs cannot access unauthorized tenant records.

### 2.13 Documentation Updates Workflow
- **When to Use**: Concluding any task, architectural change, or milestone.
- **Protocol**:
  1. Update `context/PROGRESS_TRACKER.md` status flags.
  2. Refresh `context/NEXT_TASK.md` with the next agent's immediate objectives and constraints.
  3. Record significant architectural shifts in `context/TECHNICAL_DECISIONS.md`.
  4. Ensure `README.md` accurately reflects current repository instructions.

### 2.14 Deployment Preparation Workflow
- **When to Use**: Preparing NextTask for staging or production containerization.
- **Protocol**:
  1. Verify all environment variables are parameterized via `.env.example`.
  2. Confirm production build executes cleanly (`npm run build`).
  3. Check process management, logging, graceful shutdown, and container configs.
  4. Document deployment steps and operational runbooks.

---

## 3. Mandatory Agent Handoff Checklist
Before completing any task, an AI agent must report:
- [ ] **Files Created**: Full paths of all new files.
- [ ] **Files Modified**: Full paths of all updated files with rationale.
- [ ] **Completed Tests**: Verification steps and output evidence.
- [ ] **Known Limitations**: Any edge cases or deferred requirements.
- [ ] **Next Actionable Step**: Direct pointer to `context/NEXT_TASK.md`.
