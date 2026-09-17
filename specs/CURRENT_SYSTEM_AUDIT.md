# NextTask — Current System Audit

## 1. Audit Overview
- **Audit Date**: 2026-09-18
- **Audit Type**: Non-destructive Codebase & Architecture Inspection
- **Scope**: All files in `client/` and `server/`, configurations, dependencies, endpoints, data models, and styles.

---

## 2. Verified Existing Features

| Feature | Verified Files | Implementation Details |
| :--- | :--- | :--- |
| **Fetch All Tasks** | `client/src/App.jsx`<br>`client/src/services/taskService.js`<br>`server/controllers/taskController.js` | Invokes `GET /api/tasks`, fetches all task documents from MongoDB via `Task.find()`, stores them in React state, and renders them. |
| **Create Task** | `client/src/App.jsx`<br>`client/src/services/taskService.js`<br>`server/controllers/taskController.js` | Input box with `Enter` key or button submit; dropdown for priority (`low`, `medium`, `high`); HTML5 date picker for due date; persisted via `POST /api/tasks`. |
| **Toggle Task Completion** | `client/src/components/TaskItem.jsx`<br>`client/src/App.jsx`<br>`server/controllers/taskController.js` | Clicking checkbox/title sends `PUT /api/tasks/:id` with `{ completed: !task.completed }`. Updates UI state and applies strikethrough styling. |
| **Inline Title Edit** | `client/src/components/TaskItem.jsx`<br>`client/src/App.jsx`<br>`server/controllers/taskController.js` | Clicking pencil icon opens inline edit input with auto-focus. Saving sends `PUT /api/tasks/:id` with `{ title }`. `Escape` cancels without saving. |
| **Delete Task** | `client/src/components/TaskItem.jsx`<br>`client/src/App.jsx`<br>`server/controllers/taskController.js` | Clicking cross button sends `DELETE /api/tasks/:id`. Removes task document from database and filters it out of client state. |
| **Task Metric Counts** | `client/src/App.jsx` | Calculates `total`, `completed`, and `remaining` count badges in memory at top of app. |
| **Dark Theme & Responsive CSS** | `client/src/App.css`<br>`client/src/index.css` | Custom dark theme with color-coded priority tags (`low`: green, `medium`: yellow, `high`: red) and media query for mobile screens (`< 600px`). |

---

## 3. Existing Code Inventory

### 3.1 Frontend Files (`client/`)
| File Path | Lines | Bytes | Role / Responsibility |
| :--- | :--- | :--- | :--- |
| [client/package.json](file:///d:/KKS/1.%20AProject/NextTask/client/package.json) | 25 | 483 | Declares client dependencies: `react`, `react-dom`, `axios`, `vite`, `oxlint`. |
| [client/vite.config.js](file:///d:/KKS/1.%20AProject/NextTask/client/vite.config.js) | 8 | 161 | Configures Vite with React plugin. |
| [client/index.html](file:///d:/KKS/1.%20AProject/NextTask/client/index.html) | 14 | 360 | HTML shell loading `/src/main.jsx` and `favicon.svg`. |
| [client/src/main.jsx](file:///d:/KKS/1.%20AProject/NextTask/client/src/main.jsx) | 11 | 229 | React 19 root entry with `StrictMode` rendering `<App />`. |
| [client/src/App.jsx](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.jsx) | 132 | 3315 | Core state container (tasks, newTask, newPriority, newDueDate) and CRUD handlers. |
| [client/src/components/TaskItem.jsx](file:///d:/KKS/1.%20AProject/NextTask/client/src/components/TaskItem.jsx) | 92 | 2673 | Row component rendering task title, checkbox, badges, and inline edit input. |
| [client/src/services/taskService.js](file:///d:/KKS/1.%20AProject/NextTask/client/src/services/taskService.js) | 25 | 671 | Axios wrapper functions: `getTasks`, `createTask`, `deleteTask`, `updateTask`. |
| [client/src/App.css](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.css) | 320 | 4252 | Primary application styles, layout, priority badges, and mobile responsiveness. |
| [client/src/index.css](file:///d:/KKS/1.%20AProject/NextTask/client/src/index.css) | 112 | 2169 | Root CSS variables and default Vite styles. |
| [client/.oxlintrc.json](file:///d:/KKS/1.%20AProject/NextTask/client/.oxlintrc.json) | 11 | 231 | Configuration for Oxlint. |
| [client/public/favicon.svg](file:///d:/KKS/1.%20AProject/NextTask/client/public/favicon.svg) | - | 9522 | Favicon asset. |
| [client/public/icons.svg](file:///d:/KKS/1.%20AProject/NextTask/client/public/icons.svg) | - | 5031 | SVG icon set asset. |

### 3.2 Backend Files (`server/`)
| File Path | Lines | Bytes | Role / Responsibility |
| :--- | :--- | :--- | :--- |
| [server/package.json](file:///d:/KKS/1.%20AProject/NextTask/server/package.json) | 35 | 712 | Declares backend dependencies: `express`, `mongoose`, `dotenv`, `cors`, `nodemon`. *(Also contains extraneous React/Vite dependencies)*. |
| [server/server.js](file:///d:/KKS/1.%20AProject/NextTask/server/server.js) | 30 | 659 | Server entry point: sets up Express, CORS, JSON parser, routes, and MongoDB connection. |
| [server/.env](file:///d:/KKS/1.%20AProject/NextTask/server/.env) | 1 | 44 | Defines `MONGO_URI=mongodb://127.0.0.1:27017/NextTask`. |
| [server/routes/taskRoutes.js](file:///d:/KKS/1.%20AProject/NextTask/server/routes/taskRoutes.js) | 17 | 343 | Maps `/api/tasks` routes (`GET`, `POST`, `PUT /:id`, `DELETE /:id`) to controller methods. |
| [server/controllers/taskController.js](file:///d:/KKS/1.%20AProject/NextTask/server/controllers/taskController.js) | 103 | 2578 | Controller functions: `getTasks`, `createTask`, `updateTask`, `deleteTask`. |
| [server/models/Task.js](file:///d:/KKS/1.%20AProject/NextTask/server/models/Task.js) | 25 | 480 | Mongoose schema and model definition for Task entity. |

---

## 4. Existing API Endpoints

| Method | Endpoint | Handler | Request Body / Params | Success Response | Error Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `server.js` | None | `"NextTask API is Running!"` (200) | N/A |
| `GET` | `/api/tasks` | `taskController.getTasks` | None | Array of Task objects (200) | `500 { message: "Failed to fetch tasks" }` |
| `POST` | `/api/tasks` | `taskController.createTask` | `{ title, priority, dueDate }` | Created Task document (201) | `400 { message: "Task title is required" }`<br>`400 { message: "Task already exists" }`<br>`500 { message: "Failed to create Task" }` |
| `PUT` | `/api/tasks/:id` | `taskController.updateTask` | Params: `:id`<br>Body: `{ title, completed, priority, dueDate }` | Updated Task document (200) | `404 { message: "Task not found" }`<br>`500 { message: "Failed to update Task" }` |
| `DELETE` | `/api/tasks/:id` | `taskController.deleteTask` | Params: `:id` | `{ message: "Task deleted successfully", task: deletedTask }` (200) | `404 { message: "Task not found" }`<br>`500 { message: "Failed to delete task", error: error.message }` |

---

## 5. Existing Database Model Schema

Model: `Task` in `server/models/Task.js`  
Collection: `tasks` in MongoDB

```javascript
{
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  dueDate: {
    type: Date,
    default: null
  }
}
```

---

## 6. Current Strengths & Weaknesses

### Strengths
1. **Clean Separation of Concerns**: Frontend and backend are cleanly partitioned; the UI does not mix database logic or make direct unstructured calls.
2. **Dedicated Service Abstraction**: `taskService.js` prevents raw HTTP logic from scattering across components.
3. **Responsive Dark UI**: Layout is customized with sleek dark tones, priority badges, and mobile viewport adaptations.
4. **Keyboard Ergonomics**: Task capture and in-place editing both support intuitive keyboard commands (`Enter` and `Escape`).
5. **Modern Tech Foundations**: React 19, Vite 8, Express 5, and native ES modules provide an up-to-date modern baseline.

### Weaknesses & Risks Discovered
1. **Typo in Mongoose Validator Option**:
   - In `server/controllers/taskController.js` line 63:
     ```javascript
     {
       returnDocument: "after",
       runvalidators: true  // BUG: Must be runValidators: true (capital V)
     }
     ```
   - *Impact*: When tasks are updated, Mongoose schema validations (such as enum checks on `priority`) are bypassed.
2. **Hardcoded Ports and URLs**:
   - `server/server.js`: `app.listen(5000)` ignores `process.env.PORT`.
   - `client/src/services/taskService.js`: `const API_URL = "http://localhost:5000/api/tasks"` ignores `import.meta.env.VITE_API_URL`.
   - *Impact*: Inability to run on variable development ports or deploy to production without editing source code.
3. **Mismatched Server Dependencies**:
   - `server/package.json` contains `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, and `vite`.
   - *Impact*: Bloats backend `node_modules` with frontend packages and creates script confusion (`"dev": "vite"` in backend package).
4. **Silent Failure on Duplicate Submission**:
   - In `client/src/App.jsx` lines 19-24:
     ```javascript
     if (tasks.some(t => t.title.toLowerCase() === task.toLowerCase())) return;
     ```
   - *Impact*: The UI silently drops user submissions without explaining why nothing happened.
5. **Global Unique Title Bottleneck**:
   - In `server/controllers/taskController.js` lines 25-33:
     ```javascript
     const existingTask = await Task.findOne({ title: title.trim() });
     if (existingTask) return res.status(400).json({ message: "Task already exists" });
     ```
   - *Impact*: Prevents identical task titles across different dates or future users.
6. **Incomplete Edit Scope**:
   - `TaskItem.jsx` only allows editing `title`. Users cannot change priority or due date after task creation.
7. **CSS Class & Selector Conflict**:
   - `#root` is defined in both `index.css` (width 1126px, flex column) and `App.css` (width 100%, max-width 900px).
8. **Missing Error Notification Layer**:
   - If an API call fails (network drop or 500 error), the UI exhibits no toast, alert, or retry mechanism.
9. **Missing Automated Tests**:
   - No unit tests or integration tests exist in either `client/` or `server/`.

---

## 7. Recommended Stabilization Work (Stage 1 Scope)

Before implementing Stage 2 features (search, filtering, sorting, or subtasks), execute the following surgical stabilization actions:

1. **Fix `runValidators` Typo**: Correct `runvalidators: true` to `runValidators: true` in `taskController.js`.
2. **Parameterize Ports & Endpoints**:
   - Update `server/server.js` to read `process.env.PORT || 5000`.
   - Update `client/src/services/taskService.js` to read `import.meta.env.VITE_API_URL || "http://localhost:5000/api/tasks"`.
   - Provide `.env.example` in both directories.
3. **Clean Backend `package.json`**:
   - Remove `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, and `vite` from `server/package.json`.
   - Add `"dev": "nodemon server.js"` to server scripts.
4. **Add UI Feedback for Duplicates & Errors**:
   - Add a subtle feedback state in `App.jsx` so users know when a task was not created due to duplicate title or network failure.
5. **Harmonize CSS Architecture**:
   - Remove conflicting `#root` declarations in `index.css` to allow `App.css` layout rules to govern the app cleanly.
