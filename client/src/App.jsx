import { useEffect, useState, useMemo } from "react";
import "./App.css";
import TaskItem from "./components/TaskItem";
import TaskEditModal from "./components/TaskEditModal";
import ProjectCreateModal from "./components/ProjectCreateModal";
import ProjectEditModal from "./components/ProjectEditModal";
import Sidebar from "./components/Sidebar";
import BulkActionBar from "./components/BulkActionBar";
import CalendarView from "./components/CalendarView";
import CalendarDayModal from "./components/CalendarDayModal";
import { formatDateISO } from "./utils/dateUtils";
import {
  getTasks,
  createTask,
  deleteTask as deleteTaskAPI,
  updateTask as updateTaskAPI,
  toggleSubtask as toggleSubtaskAPI,
  bulkUpdateTasks as bulkUpdateTasksAPI,
  bulkDeleteTasks as bulkDeleteTasksAPI
} from "./services/taskService";
import {
  getProjects,
  createProject as createProjectAPI,
  updateProject as updateProjectAPI,
  deleteProject as deleteProjectAPI
} from "./services/projectService";
import {
  Plus,
  Search,
  X,
  ArrowUpDown,
  CheckCircle2,
  CheckSquare,
  Calendar,
  Flag,
  Folder,
  FolderEdit,
  Trash2,
  Tag,
  List
} from "lucide-react";

const PRIORITY_WEIGHTS = { high: 3, medium: 2, low: 1 };

function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation & Workspace view state: 'inbox' | 'today' | 'all' | projectId
  const [selectedView, setSelectedView] = useState("inbox");
  const [activeViewMode, setActiveViewMode] = useState("list"); // 'list' | 'calendar'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("nexttask_sidebar_collapsed") === "true";
  });

  // Tag filter state
  const [selectedTagFilter, setSelectedTagFilter] = useState("");

  // New task form state
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newProjectId, setNewProjectId] = useState("");

  // Filter, search & sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'active' | 'completed'
  const [sortBy, setSortBy] = useState("dueDate"); // 'dueDate' | 'priority' | 'newest' | 'alphabetical'

  // Multi-selection state for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());

  // Modal & Toast states
  const [editingTask, setEditingTask] = useState(null);
  const [inspectingDayDate, setInspectingDayDate] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, type = "info") {
    setToast({ message, type });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial fetch: tasks and projects in parallel
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [tasksData, projectsData] = await Promise.all([
          getTasks(),
          getProjects()
        ]);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err) {
        showToast(err.message || "Failed to load workspace data", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Update newProjectId and reset selection when switching views
  function handleSelectView(viewKey) {
    setSelectedView(viewKey);
    setSelectedTaskIds(new Set());
    if (viewKey !== "inbox" && viewKey !== "today" && viewKey !== "all") {
      setNewProjectId(viewKey);
    } else {
      setNewProjectId("");
    }
  }

  function handleToggleSelectTask(id) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleSelectAll() {
    if (selectedTaskIds.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredAndSortedTasks.map((t) => t._id)));
    }
  }

  // Reschedule task to a different due date (from drag-drop or day modal)
  async function handleRescheduleTask(taskId, newDateStr) {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    try {
      const updated = await updateTaskAPI(taskId, { dueDate: newDateStr });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      showToast(`Rescheduled "${task.title}" to ${newDateStr}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to reschedule task", "error");
    }
  }

  // Quick create task for a specific date from Day Detail modal
  async function handleCreateTaskForDate({ title, priority, projectId, dueDate }) {
    try {
      const created = await createTask(
        title,
        priority || "medium",
        dueDate,
        projectId || null,
        []
      );
      setTasks((prev) => [created, ...prev]);
      showToast(`Scheduled task for ${dueDate}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to schedule task", "error");
    }
  }

  function handleToggleSidebar() {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("nexttask_sidebar_collapsed", String(next));
      return next;
    });
  }

  // Compute all unique tags currently in use across tasks
  const allUniqueTags = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          if (tag) set.add(tag.toLowerCase());
        });
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Active task counts for views and projects
  const taskCounts = useMemo(() => {
    const counts = {
      inbox: 0,
      all: 0,
      today: 0,
      projects: {}
    };

    const todayStr = new Date().toISOString().split("T")[0];

    tasks.forEach((t) => {
      if (t.completed) return; // Only count incomplete / active tasks

      counts.all += 1;

      if (!t.projectId) {
        counts.inbox += 1;
      } else {
        const pid = t.projectId._id || t.projectId;
        counts.projects[pid] = (counts.projects[pid] || 0) + 1;
      }

      if (t.dueDate) {
        const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
        if (dueStr <= todayStr) {
          counts.today += 1;
        }
      }
    });

    return counts;
  }, [tasks]);

  // Add task handler with hashtag extraction support
  async function handleAddTask(e) {
    if (e) e.preventDefault();
    const rawInput = newTask.trim();
    if (!rawInput) {
      showToast("Task title is required", "warning");
      return;
    }

    // Extract hashtags if present in title (e.g., "Refactor API #backend #urgent")
    const hashtagMatches = rawInput.match(/#([a-zA-Z0-9_-]+)/g);
    const extractedTags = hashtagMatches
      ? Array.from(new Set(hashtagMatches.map((t) => t.replace(/^#/, "").toLowerCase())))
      : [];

    const cleanedTitle = rawInput.replace(/#([a-zA-Z0-9_-]+)/g, "").trim() || rawInput;

    try {
      const created = await createTask(
        cleanedTitle,
        newPriority,
        newDueDate || null,
        newProjectId || null,
        extractedTags
      );
      setTasks((prev) => [created, ...prev]);
      setNewTask("");
      setNewPriority("medium");
      setNewDueDate("");
      showToast("Task created", "success");
    } catch (err) {
      showToast(err.message || "Error creating task", "error");
    }
  }

  // Delete task handler
  async function handleDeleteTask(id) {
    try {
      await deleteTaskAPI(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      showToast("Task deleted", "info");
    } catch (err) {
      showToast(err.message || "Failed to delete task", "error");
    }
  }

  // Toggle completion handler
  async function handleToggleComplete(id) {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;

    try {
      const updated = await updateTaskAPI(id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      showToast(err.message || "Failed to update task", "error");
    }
  }

  // Toggle subtask completion handler with optimistic update
  async function handleToggleSubtask(taskId, subtaskId) {
    // Optimistically toggle in local state
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id !== taskId) return t;
        const updatedSubtasks = (t.subtasks || []).map((st) =>
          st._id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      })
    );

    try {
      const updated = await toggleSubtaskAPI(taskId, subtaskId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      showToast(err.message || "Failed to toggle subtask", "error");
      // Revert optimistic update on failure
      setTasks((prev) =>
        prev.map((t) => {
          if (t._id !== taskId) return t;
          const revertedSubtasks = (t.subtasks || []).map((st) =>
            st._id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: revertedSubtasks };
        })
      );
    }
  }

  // Save edit from task modal
  async function handleSaveEdit(id, updates) {
    try {
      const updated = await updateTaskAPI(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      showToast("Task updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to save changes", "error");
    }
  }

  // Create new project
  async function handleCreateProject(data) {
    try {
      const created = await createProjectAPI(data);
      setProjects((prev) => [created, ...prev]);
      setSelectedView(created._id); // Auto-focus the newly created project
      setNewProjectId(created._id);
      showToast(`Project "${created.name}" created`, "success");
    } catch (err) {
      showToast(err.message || "Failed to create project", "error");
    }
  }

  // Update existing project
  async function handleUpdateProject(id, updates) {
    try {
      const updated = await updateProjectAPI(id, updates);
      setProjects((prev) => prev.map((p) => (p._id === id ? updated : p)));
      // Update populated projectId references in tasks state
      setTasks((prev) =>
        prev.map((t) => {
          if (t.projectId?._id === id) {
            return {
              ...t,
              projectId: {
                ...t.projectId,
                name: updated.name,
                color: updated.color
              }
            };
          }
          return t;
        })
      );
      showToast(`Project "${updated.name}" updated`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update project", "error");
    }
  }

  // Delete project
  async function handleDeleteProject(id, name) {
    try {
      await deleteProjectAPI(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      // Safe dissociation: reset tasks assigned to this project to null
      setTasks((prev) =>
        prev.map((t) =>
          t.projectId?._id === id ? { ...t, projectId: null } : t
        )
      );
      if (selectedView === id) setSelectedView("inbox");
      if (newProjectId === id) setNewProjectId("");
      showToast(`Project "${name}" deleted; tasks preserved in Inbox`, "info");
    } catch (err) {
      showToast(err.message || "Failed to delete project", "error");
    }
  }

  // Bulk: Mark all as done
  async function handleMarkAllDone() {
    const uncompleted = tasks.filter((t) => !t.completed);
    if (uncompleted.length === 0) return;

    try {
      const updatedPromises = uncompleted.map((t) =>
        updateTaskAPI(t._id, { completed: true })
      );
      const updatedTasks = await Promise.all(updatedPromises);
      const updatedMap = new Map(updatedTasks.map((t) => [t._id, t]));
      setTasks((prev) => prev.map((t) => updatedMap.get(t._id) || t));
      showToast("Marked all active tasks as complete", "success");
    } catch (err) {
      showToast(err.message || "Failed to complete tasks", "error");
    }
  }

  // Bulk: Clear completed tasks
  async function handleClearCompleted() {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    try {
      await Promise.all(completedTasks.map((t) => deleteTaskAPI(t._id)));
      setTasks((prev) => prev.filter((t) => !t.completed));
      showToast("Cleared completed tasks", "info");
    } catch (err) {
      showToast(err.message || "Failed to clear tasks", "error");
    }
  }

  // Bulk Action Handlers (for selected tasks)
  async function handleBulkComplete(isComplete) {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    try {
      await bulkUpdateTasksAPI(ids, { completed: isComplete });
      setTasks((prev) =>
        prev.map((t) => (selectedTaskIds.has(t._id) ? { ...t, completed: isComplete } : t))
      );
      setSelectedTaskIds(new Set());
      showToast(`Marked ${ids.length} tasks as ${isComplete ? "complete" : "active"}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update tasks", "error");
    }
  }

  async function handleBulkMoveProject(targetProjectId) {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    try {
      const targetProj = projects.find((p) => p._id === targetProjectId);
      await bulkUpdateTasksAPI(ids, { projectId: targetProjectId });
      setTasks((prev) =>
        prev.map((t) => {
          if (!selectedTaskIds.has(t._id)) return t;
          return {
            ...t,
            projectId: targetProj
              ? { _id: targetProj._id, name: targetProj.name, color: targetProj.color }
              : null
          };
        })
      );
      setSelectedTaskIds(new Set());
      const destinationName = targetProj ? `"${targetProj.name}"` : "Inbox";
      showToast(`Moved ${ids.length} tasks to ${destinationName}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to move tasks", "error");
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    try {
      await bulkDeleteTasksAPI(ids);
      setTasks((prev) => prev.filter((t) => !selectedTaskIds.has(t._id)));
      setSelectedTaskIds(new Set());
      showToast(`Deleted ${ids.length} tasks`, "info");
    } catch (err) {
      showToast(err.message || "Failed to delete tasks", "error");
    }
  }

  async function handleBulkAddTag(tag) {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    try {
      await bulkUpdateTasksAPI(ids, { addTag: tag });
      setTasks((prev) =>
        prev.map((t) => {
          if (!selectedTaskIds.has(t._id)) return t;
          const currentTags = Array.isArray(t.tags) ? t.tags : [];
          if (!currentTags.includes(tag)) {
            return { ...t, tags: [...currentTags, tag] };
          }
          return t;
        })
      );
      setSelectedTaskIds(new Set());
      showToast(`Added tag #${tag} to ${ids.length} tasks`, "success");
    } catch (err) {
      showToast(err.message || "Failed to add tag", "error");
    }
  }

  // Active view information
  const activeViewInfo = useMemo(() => {
    if (selectedView === "inbox") {
      return { title: "Inbox", subtitle: "Tasks without an assigned project", color: null };
    }
    if (selectedView === "today") {
      return { title: "Today", subtitle: "Tasks scheduled for today and overdue", color: "#fbbf24" };
    }
    if (selectedView === "all") {
      return { title: "All Tasks", subtitle: "Comprehensive workspace overview", color: null };
    }
    const proj = projects.find((p) => p._id === selectedView);
    if (proj) {
      return {
        title: proj.name,
        subtitle: proj.description || "Project workspace",
        color: proj.color,
        project: proj
      };
    }
    return { title: "Tasks", subtitle: "", color: null };
  }, [selectedView, projects]);

  const activeProject = activeViewInfo.project;

  // Progress computation for active project overview
  const projectProgress = useMemo(() => {
    if (!activeProject) return { total: 0, completed: 0, percentage: 0 };
    const projectTasks = tasks.filter(
      (t) => (t.projectId?._id || t.projectId) === activeProject._id
    );
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [tasks, activeProject]);

  // Filter and sort tasks for workbench
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Navigation View Filter
    if (selectedView === "inbox") {
      result = result.filter((t) => !t.projectId);
    } else if (selectedView === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      result = result.filter((t) => {
        if (!t.dueDate) return false;
        const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
        return dueStr <= todayStr;
      });
    } else if (selectedView !== "all") {
      // Specific project ID
      result = result.filter((t) => {
        const pid = t.projectId?._id || t.projectId;
        return pid === selectedView;
      });
    }

    // 2. Tag Filter
    if (selectedTagFilter) {
      result = result.filter(
        (t) => Array.isArray(t.tags) && t.tags.includes(selectedTagFilter)
      );
    }

    // 3. Status Tab Filter
    if (filterTab === "active") {
      result = result.filter((t) => !t.completed);
    } else if (filterTab === "completed") {
      result = result.filter((t) => t.completed);
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((t) => t.title.toLowerCase().includes(query));
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === "priority") {
        const weightA = PRIORITY_WEIGHTS[a.priority || "medium"] || 2;
        const weightB = PRIORITY_WEIGHTS[b.priority || "medium"] || 2;
        return weightB - weightA;
      }
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === "newest") {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      }
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [tasks, selectedView, selectedTagFilter, filterTab, searchQuery, sortBy]);

  // Derived counts for current view
  const total = filteredAndSortedTasks.length;
  const completedCount = filteredAndSortedTasks.filter((t) => t.completed).length;
  const activeCount = total - completedCount;

  return (
    <div className="workspace-app">
      {/* Sidebar Navigation */}
      <Sidebar
        projects={projects}
        selectedView={selectedView}
        onSelectView={handleSelectView}
        taskCounts={taskCounts}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
        onEditProject={(project) => setEditingProject(project)}
        onDeleteProject={handleDeleteProject}
      />

      {/* Main Workbench Viewport */}
      <div className="workspace-main">
        <div className="workspace-content">
          {/* 1. Sleek Viewport Header */}
          <header className="workspace-header">
            <div className="header-brand">
              {activeViewInfo.color && (
                <span
                  className="header-project-dot"
                  style={{ backgroundColor: activeViewInfo.color }}
                />
              )}
              <h1 className="current-view-title">{activeViewInfo.title}</h1>
              {selectedTagFilter && (
                <span className="header-active-tag">
                  <span className="tag-hash">#</span>{selectedTagFilter}
                  <button
                    type="button"
                    className="tag-clear-icon-btn"
                    onClick={() => setSelectedTagFilter("")}
                    title="Remove tag filter"
                    aria-label="Remove tag filter"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              )}
              {activeProject && (
                <div className="header-project-actions">
                  <button
                    type="button"
                    className="header-action-btn"
                    onClick={() => setEditingProject(activeProject)}
                    title={`Edit ${activeProject.name}`}
                    aria-label={`Edit ${activeProject.name}`}
                  >
                    <FolderEdit size={14} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="header-action-btn danger"
                    onClick={() => handleDeleteProject(activeProject._id, activeProject.name)}
                    title={`Delete ${activeProject.name}`}
                    aria-label={`Delete ${activeProject.name}`}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>

            <div className="header-status">
              {/* View Mode Switcher (List vs Calendar) */}
              <div className="view-mode-switcher" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`view-mode-btn ${activeViewMode === "list" ? "active" : ""}`}
                  onClick={() => setActiveViewMode("list")}
                  title="List view"
                  aria-label="List view"
                >
                  <List size={13} strokeWidth={2} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${activeViewMode === "calendar" ? "active" : ""}`}
                  onClick={() => setActiveViewMode("calendar")}
                  title="Calendar view"
                  aria-label="Calendar view"
                >
                  <Calendar size={13} strokeWidth={2} />
                  <span>Calendar</span>
                </button>
              </div>

              <span className="status-metric">
                <strong>{activeCount}</strong> {activeCount === 1 ? "task" : "tasks"} remaining
              </span>
            </div>
          </header>

          {/* Project Overview Card (shown in project view) */}
          {activeProject && (
            <div className="project-overview-card">
              <div className="project-overview-top">
                <p className="project-overview-desc">
                  {activeProject.description || "Project workspace overview and task tracking."}
                </p>
                <span className="project-overview-stat">
                  {projectProgress.completed} of {projectProgress.total} completed ({projectProgress.percentage}%)
                </span>
              </div>
              <div className="project-progress-track">
                <div
                  className="project-progress-bar"
                  style={{
                    width: `${projectProgress.percentage}%`,
                    backgroundColor: activeProject.color || "#6366f1"
                  }}
                />
              </div>
            </div>
          )}

          {/* 2. Streamlined Task Capture Bar */}
          <section className="capture-section" aria-label="Create task">
            <form onSubmit={handleAddTask} className="capture-bar">
              <div className="capture-main">
                <Plus size={16} className="capture-icon" strokeWidth={2} />
                <input
                  type="text"
                  className="capture-input"
                  placeholder={`Add task to ${activeViewInfo.title}... (use #tag for tags, press Enter)`}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
              </div>

              <div className="capture-controls">
                {/* Project Selector */}
                <div className="capture-control-group" title="Assign Project">
                  <Folder size={13} className="control-icon" strokeWidth={2} />
                  <select
                    className="capture-select"
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    aria-label="Assign to project"
                  >
                    <option value="">Inbox</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="capture-control-group" title="Set Priority">
                  <Flag size={13} className="control-icon" strokeWidth={2} />
                  <select
                    className="capture-select"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    aria-label="Select priority"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Due Date Input */}
                <div className="capture-control-group" title="Set Due Date">
                  <Calendar size={13} className="control-icon" strokeWidth={2} />
                  <input
                    type="date"
                    className="capture-date-input"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    aria-label="Select due date"
                  />
                </div>

                <button type="submit" className="capture-submit-btn">
                  Add
                </button>
              </div>
            </form>
          </section>

          {/* 3. Utility Toolbar (Filter Tabs, Tag Filter, Search, Sort) */}
          <section className="utility-bar" aria-label="Task controls">
            <div className="tab-group" role="tablist">
              <button
                type="button"
                className={`tab-btn ${filterTab === "all" ? "active" : ""}`}
                onClick={() => setFilterTab("all")}
              >
                All
                <span className="tab-count">{total}</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${filterTab === "active" ? "active" : ""}`}
                onClick={() => setFilterTab("active")}
              >
                Active
                <span className="tab-count">{activeCount}</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${filterTab === "completed" ? "active" : ""}`}
                onClick={() => setFilterTab("completed")}
              >
                Completed
                <span className="tab-count">{completedCount}</span>
              </button>
              <button
                type="button"
                className={`tab-btn select-all-toggle-btn ${selectedTaskIds.size > 0 ? "active" : ""}`}
                onClick={handleToggleSelectAll}
                title={
                  selectedTaskIds.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0
                    ? "Deselect all"
                    : "Select all tasks in view"
                }
              >
                <CheckSquare size={13} strokeWidth={2} />
                <span>{selectedTaskIds.size > 0 ? `${selectedTaskIds.size} selected` : "Select"}</span>
              </button>
            </div>

            <div className="utility-actions">
              {/* Tag Filter Dropdown */}
              {allUniqueTags.length > 0 && (
                <div className="tag-filter-wrap">
                  <Tag size={13} className="sort-icon" strokeWidth={2} />
                  <select
                    className="tag-filter-select"
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    aria-label="Filter by tag"
                  >
                    <option value="">All Tags</option>
                    {allUniqueTags.map((tag) => (
                      <option key={tag} value={tag}>
                        #{tag}
                      </option>
                    ))}
                  </select>
                  {selectedTagFilter && (
                    <button
                      type="button"
                      className="tag-filter-clear-btn"
                      onClick={() => setSelectedTagFilter("")}
                      title="Clear tag filter"
                      aria-label="Clear tag filter"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}

              {/* Quick Search */}
              <div className="search-field">
                <Search size={14} className="search-icon" strokeWidth={2} />
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="sort-field">
                <ArrowUpDown size={13} className="sort-icon" strokeWidth={2} />
                <select
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort tasks by"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="newest">Newest</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 4. Structured Task List or Calendar Container */}
          {activeViewMode === "calendar" ? (
            <CalendarView
              tasks={filteredAndSortedTasks}
              onSelectTask={(t) => setEditingTask(t)}
              onInspectDay={(dateStr) => setInspectingDayDate(dateStr)}
              onRescheduleTask={handleRescheduleTask}
            />
          ) : (
            <main className="task-container" aria-label="Tasks">
              {loading ? (
                <div className="list-empty-state">
                  <p className="empty-title">Loading tasks...</p>
                </div>
              ) : filteredAndSortedTasks.length === 0 ? (
                <div className="list-empty-state">
                  <CheckCircle2 size={32} strokeWidth={1.5} className="empty-icon" />
                  <p className="empty-title">
                    {searchQuery
                      ? "No matching tasks found"
                      : selectedTagFilter
                      ? `No tasks with tag #${selectedTagFilter}`
                      : filterTab === "completed"
                      ? "No completed tasks yet"
                      : "No active tasks in this view"}
                  </p>
                  <p className="empty-subtitle">
                    {searchQuery
                      ? `No tasks match the search query "${searchQuery}".`
                      : selectedTagFilter
                      ? `Try removing the #${selectedTagFilter} tag filter or tagging tasks.`
                      : filterTab === "completed"
                      ? "Tasks checked off as complete will appear here."
                      : `Capture a task above to start organizing your work in ${activeViewInfo.title}.`}
                  </p>
                </div>
              ) : (
                <div className="task-list-rows">
                  {filteredAndSortedTasks.map((task) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      deleteTask={handleDeleteTask}
                      toggleComplete={handleToggleComplete}
                      onToggleSubtask={handleToggleSubtask}
                      openEditModal={(t) => setEditingTask(t)}
                      onSelectTag={(tag) =>
                        setSelectedTagFilter((prev) => (prev === tag ? "" : tag))
                      }
                      isSelected={selectedTaskIds.has(task._id)}
                      onToggleSelect={handleToggleSelectTask}
                      selectionMode={selectedTaskIds.size > 0}
                    />
                  ))}
                </div>
              )}
            </main>
          )}

          {/* 5. Minimalist Footer Bar */}
          <footer className="workspace-footer">
            <span className="footer-meta">
              {completedCount} of {total} {total === 1 ? "task" : "tasks"} completed
            </span>

            <div className="footer-actions">
              {activeCount > 0 && (
                <button
                  type="button"
                  className="footer-btn"
                  onClick={handleMarkAllDone}
                >
                  Mark all done
                </button>
              )}
              {completedCount > 0 && (
                <button
                  type="button"
                  className="footer-btn danger"
                  onClick={handleClearCompleted}
                >
                  Clear completed
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* 6. Edit Task Dialog */}
      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
        projects={projects}
      />

      {/* 7. New Project Dialog */}
      <ProjectCreateModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* 8. Edit Project Dialog */}
      <ProjectEditModal
        project={editingProject}
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onSave={handleUpdateProject}
      />

      {/* 9. Calendar Day Detail & Agenda Modal */}
      <CalendarDayModal
        isOpen={Boolean(inspectingDayDate)}
        onClose={() => setInspectingDayDate(null)}
        dateStr={inspectingDayDate}
        tasks={
          inspectingDayDate
            ? tasks.filter(
                (t) =>
                  t.dueDate && formatDateISO(t.dueDate) === inspectingDayDate
              )
            : []
        }
        onToggleComplete={handleToggleComplete}
        onEditTask={(t) => setEditingTask(t)}
        onRescheduleTask={handleRescheduleTask}
        onCreateTask={handleCreateTaskForDate}
        projects={projects}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTaskIds.size}
        projects={projects}
        onClearSelection={() => setSelectedTaskIds(new Set())}
        onBulkComplete={handleBulkComplete}
        onBulkMoveProject={handleBulkMoveProject}
        onBulkDelete={handleBulkDelete}
        onBulkAddTag={handleBulkAddTag}
      />

      {/* 9. Toast Notification */}
      {toast && (
        <div className={`toast-chip ${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
