# NextTask — Code Standards and UI Guidelines

## 1. Core Engineering Principles for AI Agents

When modifying or extending NextTask, every AI agent must strictly abide by these fundamental engineering directives:

1. **Do Not Rewrite Working Code Unnecessarily**: Enhance existing modules incrementally. Avoid wholesale rewrites of components or endpoints that already work reliably.
2. **Preserve Existing Functionality**: Ensure existing CRUD operations, completion toggling, editing, and due-date logic remain intact when introducing enhancements.
3. **No Unjustified Dependencies**: Never install a package if standard language capabilities or simple utility functions suffice. Any new dependency must have a clear architectural justification.
4. **Avoid Duplication**: Maintain DRY (Don't Repeat Yourself) discipline. Common helpers, formatters, and API primitives must be centralized.
5. **No Assumptions Without Verification**: Inspect the exact lines of code before proposing modifications. Never claim something works without testing.

---

## 2. JavaScript & React Conventions

### 2.1 React 19 Best Practices
- **Functional Components**: Write pure, functional components using modern hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **Hook Rules**: Keep hooks at the top level of components; never call hooks inside loops, conditions, or nested functions.
- **State Immutability**: Always update state immutably.
  ```javascript
  // Correct
  setTasks(prev => prev.map(t => t._id === id ? updatedTask : t));
  
  // Incorrect (mutation)
  task.completed = true;
  setTasks(tasks);
  ```
- **Controlled Inputs**: Form inputs must be explicitly bound to component state with `value` and `onChange` handlers.
- **Descriptive Props**: Explicitly destructure props in component signatures rather than passing generic `props` bags.

### 2.2 Naming Conventions
| Entity | Case Convention | Example |
| :--- | :--- | :--- |
| React Components | `PascalCase` | `TaskItem.jsx`, `TaskFilterBar.jsx` |
| JavaScript Files / Utilities | `camelCase` | `taskService.js`, `dateUtils.js` |
| CSS Files | `PascalCase` or match component | `App.css`, `TaskItem.css` |
| Functions & Methods | `camelCase` | `getTasks`, `toggleComplete`, `calculateRemaining` |
| State Variables | `camelCase` | `tasks`, `newPriority`, `isEditing` |
| Constants / Enums | `UPPER_SNAKE_CASE` | `DEFAULT_PRIORITY`, `API_TIMEOUT_MS` |
| Mongoose Models | `PascalCase` | `Task`, `User`, `Project` |
| Express Routes | `camelCase` | `taskRoutes.js`, `authRoutes.js` |

---

## 3. Component & File Organization

### 3.1 Directory Structure Standards
```
client/src/
├── assets/          # Static SVGs, images, fonts
├── components/      # Modular UI components (reusable & presentational)
│   ├── common/      # Shared atoms (buttons, badges, inputs, modals)
│   └── tasks/       # Domain-specific task components
├── context/         # React context providers (when needed for theme/auth)
├── hooks/           # Custom reusable hooks (useTasks, useDebounce)
├── services/        # Centralized HTTP API client modules
├── utils/           # Pure formatting and calculation utilities
├── App.css          # Application layout rules
├── App.jsx          # Top-level application orchestrator
├── index.css        # Global CSS variables, reset, typography
└── main.jsx         # Application entry mount
```

### 3.2 Component File Layout
Place component elements in the following predictable order:
1. External imports (React, libraries)
2. Internal imports (services, components, utilities, styles)
3. Constants & helpers local to the file
4. Component declaration with destructured props
5. State hooks (`useState`, `useReducer`)
6. Side-effect hooks (`useEffect`)
7. Event handlers and business logic functions
8. Render JSX (early returns for loading/error states first)
9. Default export

---

## 4. API Service & Backend Conventions

### 4.1 Frontend API Services
- All network calls must reside in `client/src/services/`. Components must **never** invoke `axios` or `fetch` directly.
- Base URLs must derive from environment variables with fallback defaults:
  ```javascript
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  ```
- Functions must return unwrapped data (`response.data`) and allow callers to catch or handle structured exceptions.

### 4.2 Backend Express Conventions
- **Clean Architecture**: Route definitions (`routes/`) must strictly delegate to controllers (`controllers/`). No heavy business logic inside route definition files.
- **Async Error Handling**: Wrap async controller actions in `try/catch` or use standard async-handler middleware to prevent unhandled promise rejections.
- **REST Status Codes**:
  - `200 OK`: Successful read, update, or delete.
  - `201 Created`: Successful creation of a new resource.
  - `400 Bad Request`: Client validation error (missing required fields, malformed input).
  - `401 Unauthorized`: Authentication required or token invalid.
  - `403 Forbidden`: Authenticated user lacks permission.
  - `404 Not Found`: Target resource does not exist.
  - `500 Internal Server Error`: Unexpected server-side failure.
- **Consistent Response Payload Shape**:
  ```json
  // Success
  {
    "success": true,
    "data": { ... }
  }

  // Failure
  {
    "success": false,
    "message": "Human-readable error explanation",
    "error": "OPTIONAL_ERROR_CODE_OR_DETAILS"
  }
  ```

---

## 5. Validation & Database Standards

### 5.1 Validation Standards
- Validate at the network boundary on the server before database interaction. Never trust client payloads.
- Sanitize strings (`trim()`, escape malicious HTML if rendering raw text).
- Check data types, lengths, and enum values explicitly.
- Provide descriptive, user-friendly error messages when validation fails.

### 5.2 Mongoose Schema Conventions
- Explicit field definitions with types, defaults, and validations.
- Include `{ timestamps: true }` on new schemas for auditability (`createdAt`, `updatedAt`).
- Specify `runValidators: true` (ensuring correct casing) on `findByIdAndUpdate` and `updateOne` queries.
- Create explicit indexes on frequently queried fields (`userId`, `dueDate`, `priority`).

---

## 6. CSS & UI Design System

NextTask must possess an **intentional, modern, product-oriented aesthetic**—tactile, sleek, and refined—comparable to professional productivity instruments like Linear, Things 3, and ShelfLife. It must **never** look like a generic AI-generated dashboard template.

### 6.1 Strict Anti-Patterns (What NOT to Do)
1. **No Excessive Floating Cards**: Do not place every section inside a separate rounded card. Use hairline borders, dividers, alignment, and background levels.
2. **No Neon Glowing Effects**: Avoid neon shadows, glowing borders, glowing buttons, radial background light meshes, and arbitrary gradients. Visual emphasis must come from typography, contrast, spacing, and hierarchy.
3. **No Unnecessary Capsule/Pill Elements**: Do not turn every label, filter, control, or stat into a pill. Use pills strictly when there is a semantic purpose (such as priority tags).
4. **No Emojis as Interface Icons**: Never use emojis (`✏️`, `❌`, `📅`, `✓`, `🟢`, `🟡`, `🔴`, `✨`) for interface controls. Always use `lucide-react` icons consistently (14px–16px with 1.5px–2px stroke).
5. **No Decorative Dashboard Junk**: Do not add fake productivity charts, decorative velocity bars without functionality, or empty hero sections that push the core task workflow down.

### 6.2 Design Tokens (Studio Slate Palette)
All visual properties must derive from standardized tokens in `index.css`:
```css
:root {
  /* Background Hierarchy */
  --bg-canvas: #090a0f;
  --bg-surface: #11131a;
  --bg-subtle: #171a23;
  --bg-hover: #1c202c;
  --bg-active: #222736;
  --bg-input: #0d0f15;
  
  /* Text & Hierarchy */
  --text-primary: #f4f5f8;
  --text-secondary: #9aa1b2;
  --text-tertiary: #60687b;
  
  /* Accent & Status */
  --accent-primary: #6366f1;
  --accent-hover: #4f46e5;
  --priority-high: #f87171;
  --priority-med: #fbbf24;
  --priority-low: #34d399;

  /* Borders & Dividers */
  --border-hairline: rgba(255, 255, 255, 0.07);
  --border-subtle: rgba(255, 255, 255, 0.12);
  --border-focus: #6366f1;

  /* Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### 6.3 Task List & Workflow Guidelines
- **Row-Based Architecture**: Render tasks in a structured list with 46px row heights and 1px hairline dividers, not heavy disjointed cards.
- **Micro-Interactions**: Row hover reveals action buttons smoothly (`opacity: 0` -> `opacity: 1`). Task completion applies a clean strikethrough with dimmed text.
- **Workflow First**: The single-line task capture and work items must be immediately visible without scrolling past decorative widgets.

---

## 7. Responsive Design & Accessibility (a11y)

### 7.1 Responsive Behavior
- **Mobile First or Fluid Breakpoints**: Ensure full usability at `360px`, `768px`, and desktop `1200px+`.
- On narrow viewports (`< 640px`):
  - Stack inputs vertically or use responsive flex wraps.
  - Expand touch targets to a minimum of `44px x 44px`.
  - Maintain legible typography (minimum 14px body text).

### 7.2 Accessibility Expectations
- **Keyboard Navigation**:
  - All interactive elements must be focusable via `Tab`.
  - In-place editing must support `Enter` to commit and `Escape` to discard.
  - Buttons and inputs must have visible focus rings (`outline: 2px solid var(--accent-primary)`).
- **Semantic HTML**: Use `<main>`, `<header>`, `<section>`, `<button>`, `<label>`, `<input>` instead of non-semantic nested `<div>` elements.
- **ARIA Labels**: Add `aria-label` to icon-only buttons (e.g., `aria-label="Delete task"`, `aria-label="Edit task"`).

---

## 8. Security & Performance Standards

### 8.1 Security Standards
- **Input Sanitization**: Strip dangerous HTML characters or use React's built-in JSX escaping. Never use `dangerouslySetInnerHTML` with un-sanitized user content.
- **CORS Protection**: Ensure the backend CORS configuration restricts allowed origins in production environments.
- **Environment Isolation**: Never commit API keys, database credentials, or secret tokens into version control.

### 8.2 Performance Standards
- **Component Rerenders**: Keep component trees modular so updating a single task item does not force an expensive re-render of unrelated DOM nodes.
- **Network Optimization**: Avoid duplicate network calls. Debounce rapid inputs when live search or auto-save is introduced.
- **Bundle Hygiene**: Periodically review client bundle sizes. Avoid large monolithic UI libraries when minimal targeted styles suffice.
