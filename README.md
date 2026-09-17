# NextTask

NextTask is a modern, responsive, full-stack productivity and task management platform built on the MERN stack (MongoDB, Express.js, React, Node.js). 

Originating as a high-velocity task tracker with priority tagging, due-date assignment, and inline editing, NextTask is designed to evolve into an intelligent, multi-dimensional productivity ecosystem featuring projects, workspaces, Kanban boards, temporal scheduling, time tracking, and AI-augmented workflows.

---

## 1. Project Status

- **Current Version**: `0.1.0-alpha` (Stage 0: Pre-stabilization Baseline)
- **Current Architecture**: Decoupled React 19 single-page client and Node.js / Express 5 REST API server.
- **Immediate Milestone**: Stage 1 Application Stabilization (resolving configuration parameters, validation typos, and dependency cleanup).

---

## 2. Current Features (Verified in Codebase)

The following capabilities are actively implemented and functional:

- **Task Creation**: Fast task capture supporting title, priority levels (`low`, `medium`, `high`), and optional due dates.
- **Task Retrieval**: Loads all tasks from MongoDB upon initialization with computed metric summaries (Total, Completed, Remaining).
- **Completion Toggling**: Immediate completion state toggle with dynamic strikethrough styling.
- **In-Place Title Editing**: Keyboard-accessible inline editing (`Enter` to save, `Escape` to cancel, or UI buttons).
- **Task Deletion**: Instant deletion of task records with synchronized database removal.
- **Dark Aesthetic**: Custom dark theme interface with priority badges, hover micro-interactions, and mobile responsive adaptations.

---

## 3. Planned Product Direction

NextTask is architected to scale into an extensive productivity platform across sequential development phases:

- **Phase 1**: Search, dynamic sorting, filter tabs (`All`, `Active`, `Completed`), and comprehensive edit modals.
- **Phase 2**: Project organization, color-coded tags/categories, and hierarchical subtasks.
- **Phase 3**: Interactive calendar scheduling, recurring task rules, and Kanban boards.
- **Phase 4**: Integrated Pomodoro focus timers, time-tracking logs, and productivity analytics.
- **Phase 5**: Multi-tenant user authentication (JWT), personal dashboards, and team collaboration workspaces.
- **Phase 6**: AI copilot for natural language task parsing, automated subtask breakdown, and intelligent prioritization.

---

## 4. Technology Stack

### Frontend (`client/`)
- **Framework**: React `^19.2.7`
- **Build Tool / Dev Server**: Vite `^8.1.1`
- **HTTP Client**: Axios `^1.19.0`
- **Linter**: Oxlint `^1.71.0`
- **Styling**: Vanilla CSS with tokenized custom properties

### Backend (`server/`)
- **Runtime**: Node.js (`v18+` / `v20+` with ECMAScript Modules `"type": "module"`)
- **Web Framework**: Express.js `^5.2.1`
- **Database ODM**: Mongoose `^9.9.2`
- **Persistence**: MongoDB (Local or Atlas)
- **Middleware**: CORS `^2.8.6`, Dotenv `^17.4.2`

---

## 5. Repository Structure

```
NextTask/
├── client/              # React single-page application
│   ├── public/          # Static assets (favicons, SVGs)
│   ├── src/
│   │   ├── components/  # Reusable UI components (TaskItem.jsx)
│   │   ├── services/    # API abstraction layer (taskService.js)
│   │   ├── App.css      # Component and layout styling
│   │   ├── App.jsx      # Main application state orchestrator
│   │   ├── index.css    # Global typography and theme variables
│   │   └── main.jsx     # React entry point
│   ├── index.html       # Vite HTML template
│   ├── package.json     # Client scripts and dependencies
│   └── vite.config.js   # Vite configuration
├── server/              # Express REST API backend
│   ├── controllers/     # Business logic handlers (taskController.js)
│   ├── models/          # Mongoose data schemas (Task.js)
│   ├── routes/          # Express route declarations (taskRoutes.js)
│   ├── .env             # Server environment configuration (local)
│   ├── package.json     # Server scripts and dependencies
│   └── server.js        # Express app and MongoDB connection
├── context/             # Engineering guidelines, architecture, and memory
├── specs/               # Master roadmap, system audits, and feature specs
└── README.md            # Root project documentation
```

---

## 6. Local Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (`v18` or later)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` or a MongoDB Atlas connection string.

### 1. Clone Repository & Install Dependencies
Open two terminal windows (or use terminal tabs) for client and server:

**Install Client Dependencies:**
```bash
cd client
npm install
```

**Install Server Dependencies:**
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Inside the `server/` directory, verify or create a `.env` file:
```ini
MONGO_URI=mongodb://127.0.0.1:27017/NextTask
PORT=5000
```
*(Note: Never commit `.env` containing sensitive credentials into version control).*

### 3. Run the Backend Server
From the `server/` directory:
```bash
npm run start
```
The server will start on `http://localhost:5000` and connect to MongoDB.

### 4. Run the Frontend Client
From the `client/` directory:
```bash
npm run dev
```
Vite will launch the client application at `http://localhost:5173`. Open this URL in any modern browser.

---

## 7. API Overview

All task operations are served under the `/api/tasks` prefix:

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API health check | None |
| `GET` | `/api/tasks` | Fetch all tasks | None |
| `POST` | `/api/tasks` | Create a new task | `{ "title": "string", "priority": "low"\|"medium"\|"high", "dueDate": "YYYY-MM-DD" }` |
| `PUT` | `/api/tasks/:id` | Update task fields | `{ "title": "string", "completed": boolean, "priority": "string", "dueDate": "string" }` |
| `DELETE` | `/api/tasks/:id` | Delete task by ID | None |

---

## 8. Documentation Architecture

Comprehensive architectural guides and specifications reside in two root documentation directories:

### Context Folder (`context/`)
- [PROJECT_OVERVIEW.md](file:///d:/KKS/1.%20AProject/NextTask/context/PROJECT_OVERVIEW.md): Vision, status, target users, principles, and technology roadmap.
- [ARCHITECTURE.md](file:///d:/KKS/1.%20AProject/NextTask/context/ARCHITECTURE.md): Current technical architecture, component flow, and future evolution.
- [CODE_STANDARDS_UI_CONTEXT.md](file:///d:/KKS/1.%20AProject/NextTask/context/CODE_STANDARDS_UI_CONTEXT.md): JavaScript, React 19, CSS tokens, and accessibility standards.
- [PROGRESS_TRACKER.md](file:///d:/KKS/1.%20AProject/NextTask/context/PROGRESS_TRACKER.md): Status taxonomy, technical debt tracker, and bug logs.
- [AI_WORKFLOW_TYPES.md](file:///d:/KKS/1.%20AProject/NextTask/context/AI_WORKFLOW_TYPES.md): Operating protocols and checklists for AI agent collaboration.
- [NEXT_TASK.md](file:///d:/KKS/1.%20AProject/NextTask/context/NEXT_TASK.md): Immediate handoff document for the next development phase.
- [TECHNICAL_DECISIONS.md](file:///d:/KKS/1.%20AProject/NextTask/context/TECHNICAL_DECISIONS.md): Architectural Decision Records (ADRs).

### Specifications Folder (`specs/`)
- [MASTER_ROADMAP.md](file:///d:/KKS/1.%20AProject/NextTask/specs/MASTER_ROADMAP.md): Staged engineering plan spanning Stage 0 through Stage 12.
- [SPEC_TEMPLATE.md](file:///d:/KKS/1.%20AProject/NextTask/specs/SPEC_TEMPLATE.md): Reusable blueprint for drafting structured feature specifications.
- [CURRENT_SYSTEM_AUDIT.md](file:///d:/KKS/1.%20AProject/NextTask/specs/CURRENT_SYSTEM_AUDIT.md): Detailed code audit, strengths, weaknesses, and debt analysis.

---

## 9. Development Guidelines for Contributors and AI Agents

1. **Verify Before Coding**: Always inspect the relevant codebase files before suggesting modifications.
2. **Follow Staged Roadmaps**: Do not implement features out of sequence without consulting [MASTER_ROADMAP.md](file:///d:/KKS/1.%20AProject/NextTask/specs/MASTER_ROADMAP.md).
3. **Preserve Functionality**: Ensure existing CRUD behavior remains regression-free.
4. **Update Documentation**: When code or endpoints change, immediately update [PROGRESS_TRACKER.md](file:///d:/KKS/1.%20AProject/NextTask/context/PROGRESS_TRACKER.md) and [NEXT_TASK.md](file:///d:/KKS/1.%20AProject/NextTask/context/NEXT_TASK.md).
