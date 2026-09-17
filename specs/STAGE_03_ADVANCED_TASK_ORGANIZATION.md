# Stage 3 Specification: Advanced Task Organization

- **Feature ID**: `STAGE-03`
- **Stage**: Stage 3 — Projects, Categories, Tags & Subtasks
- **Status**: `APPROVED`
- **Author**: Lead Software Architect
- **Created Date**: 2026-09-18
- **Target Completion**: Incremental Milestones (3.1 through 3.5)

---

## 1. Problem Statement
NextTask currently exists as a flat, single-list task tracker ("Inbox"). While individual tasks have titles, completion states, priorities, and due dates, users with growing workloads cannot categorize work into high-level initiatives (Projects), classify tasks across contexts (Tags/Categories), or decompose complex objectives into step-by-step checklists (Subtasks). 

To evolve toward a complete, scalable productivity platform, NextTask requires a robust, relational organization layer while maintaining the visual clarity, responsiveness, and speed established in Stage 2.

---

## 2. User Stories
- **Primary User Story (Projects)**: As a user managing multiple responsibilities, I want to organize my tasks into discrete Projects (e.g., "Work", "Personal", "Q3 Launch") with distinct color identifiers so that I can focus on one project at a time.
- **Secondary User Story (Subtasks)**: As a user tackling complex work, I want to break tasks down into actionable subtasks so that I can track granular progress.
- **Tertiary User Story (Tags)**: As a user navigating multiple tasks, I want to tag tasks (e.g., `#urgent`, `#reading`) across projects to filter tasks by context.

---

## 3. Scope Decomposition: Required, Optional, and Deferred

### A. Required Implementation
1. **Milestone 3.1 — Projects Foundation & Core Association** (FIRST MILESTONE):
   - `Project` data model with name, description, color, and timestamps.
   - `Task` schema extension with `projectId`, `tags`, and `subtasks` arrays.
   - Project CRUD API endpoints (`GET`, `POST`, `PUT /:id`, `DELETE /:id`).
   - Project frontend service layer (`projectService.js`).
   - Task project assignment in task creator and edit modal.
   - Project badge on task rows (subtle dot + name).
   - Project-based list filtering (Inbox vs. Project filter).
2. **Milestone 3.2 — Project Sidebar & Navigation**:
   - Collapsible project drawer / sidebar displaying active projects with item counts.
   - Dedicated project management modal (edit color, name, description).
3. **Milestone 3.3 — Tags & Context Labels**:
   - Freeform tag assignment on tasks.
   - Tag filtering in the utility toolbar.
4. **Milestone 3.4 — Subtasks & Checklist Engine**:
   - Subtasks array schema with embedded completion toggling.
   - Subtask checklist UI in `TaskEditModal` and expandable row checklist.
   - Automatic parent task progress calculation based on subtasks.

### B. Optional Improvements
- Project archiving (hide completed projects without deleting data).
- Drag-and-drop task reassignment between projects.

### C. Deferred Functionality (Explicit Non-Goals for Stage 3)
- Multi-user project sharing and permissions (deferred to Stage 8: Collaboration).
- User authentication requirements (deferred to Stage 6: Authentication).
- Kanban board columns by project (deferred to Stage 5: Productivity Workflows).
- AI automatic project categorization (deferred to Stage 9: AI Features).

---

## 4. Stage 3 Milestones Breakdown

| Milestone | Objective | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 3.1** | Projects Foundation & Core Association | Backend Project entity, Task schema extension, Project CRUD API, projectService, UI project assignment & filtering. | **COMPLETED** |
| **Milestone 3.2** | Project Sidebar & Management | Collapsible workspace sidebar with project item counts, focus views (Inbox, Today, All), project deletion/edit dialogs. | **COMPLETED** |
| **Milestone 3.3** | Tags & Categories | Tag schema, multi-tag task assignment, toolbar tag filtering. | **COMPLETED** |
| **Milestone 3.4** | Subtasks & Checklists | Subtask schema, inline and modal checklist management, completion progress. | **COMPLETED** |
| **Milestone 3.5** | Advanced Organization Polish | Reordering, bulk move between projects, project overview summaries. | **COMPLETED** |

---

## 5. Milestone 3.1 Technical Specification (Detailed)

### 5.1 Backend Changes
- **New Model ([`server/models/Project.js`](file:///d:/KKS/1.%20AProject/NextTask/server/models/Project.js))**:
  ```javascript
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    color: { type: String, default: "#6366f1" },
    isArchived: { type: Boolean, default: false }
  }, { timestamps: true }
  ```
- **Extended Model ([`server/models/Task.js`](file:///d:/KKS/1.%20AProject/NextTask/server/models/Task.js))**:
  - Add `projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null }`
  - Add `tags: [{ type: String, trim: true }]` (default `[]`)
  - Add `subtasks: [{ title: { type: String, required: true }, completed: { type: Boolean, default: false } }]` (default `[]`)
- **New Controller ([`server/controllers/projectController.js`](file:///d:/KKS/1.%20AProject/NextTask/server/controllers/projectController.js))**:
  - `getProjects`: Returns all projects sorted by `createdAt: -1`.
  - `createProject`: Validates `name`, creates document, returns `201`.
  - `updateProject`: Updates name, description, color, returns `200`.
  - `deleteProject`: Deletes project document and unlinks associated tasks by updating `Task.updateMany({ projectId: id }, { projectId: null })`.
- **New Routes ([`server/routes/projectRoutes.js`](file:///d:/KKS/1.%20AProject/NextTask/server/routes/projectRoutes.js))**:
  - Mount at `/api/projects` in `server.js`.
- **Updated Controller ([`server/controllers/taskController.js`](file:///d:/KKS/1.%20AProject/NextTask/server/controllers/taskController.js))**:
  - Populate `projectId` in `getTasks` (`Task.find().populate("projectId", "name color").sort({ createdAt: -1 })`).
  - Accept `projectId` in `createTask` and `updateTask`. Support querying `?projectId=...`.

### 5.2 Frontend Changes
- **New Service ([`client/src/services/projectService.js`](file:///d:/KKS/1.%20AProject/NextTask/client/src/services/projectService.js))**:
  - `getProjects()`
  - `createProject(data)`
  - `updateProject(id, data)`
  - `deleteProject(id)`
- **Updated Components**:
  - [`TaskItem.jsx`](file:///d:/KKS/1.%20AProject/NextTask/client/src/components/TaskItem.jsx): Displays subtle project indicator (colored dot + project name) if assigned.
  - [`TaskEditModal.jsx`](file:///d:/KKS/1.%20AProject/NextTask/client/src/components/TaskEditModal.jsx): Project select dropdown to reassign task to any project or "No Project (Inbox)".
  - [`App.jsx`](file:///d:/KKS/1.%20AProject/NextTask/client/src/App.jsx):
    - Load projects on mount alongside tasks.
    - Project selector in capture bar (assign project on quick add).
    - Project view filter in toolbar (view "All", "Inbox / No Project", or a specific Project).
    - Modal or inline prompt to quickly create a new project.

---

## 6. Validation Rules & Error States
| Input / Condition | Validation Rule | HTTP Status | Client Feedback |
| :--- | :--- | :--- | :--- |
| Project Name | Required, 1-100 characters, trimmed | 400 Bad Request | "Project name is required" |
| Project Color | Hex color format (`^#([0-9a-fA-F]{3}\|[0-9a-fA-F]{6})$`) | 400 Bad Request | "Invalid color format" |
| Project ID on Task | Valid Mongo ObjectId or null | 400 Bad Request | "Invalid project reference" |
| Missing Project | Target ID does not exist | 404 Not Found | "Project not found" |

---

## 7. Testing Requirements
1. **API Endpoints**:
   - Create project with name and color.
   - List projects.
   - Update project name and color.
   - Assign task to project and verify population.
   - Delete project and verify tasks are safely dissociated (set to `null`, not deleted).
2. **Client Verification**:
   - `npm run lint` (`oxlint`): 0 warnings, 0 errors.
   - `npm run build` (`vite build`): Clean production asset generation.
   - Visual test of project tags and filter switching.
