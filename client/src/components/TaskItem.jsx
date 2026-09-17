import { useState } from "react";
import { Check, Calendar, Pencil, Trash2, ListChecks, ChevronDown, ChevronRight } from "lucide-react";

function formatDueDate(dueDate, completed) {
  if (!dueDate) return null;
  const target = new Date(dueDate);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

  if (!completed && diffDays < 0) {
    return {
      label: diffDays === -1 ? "Overdue (yesterday)" : `Overdue (${Math.abs(diffDays)}d)`,
      isOverdue: true
    };
  }
  if (diffDays === 0) {
    return { label: "Today", isToday: true };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", isTomorrow: true };
  }

  return {
    label: target.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: target.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  };
}

function TaskItem({
  task,
  deleteTask,
  toggleComplete,
  openEditModal,
  onSelectTag,
  onToggleSubtask,
  isSelected = false,
  onToggleSelect,
  selectionMode = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const dueInfo = formatDueDate(task.dueDate, task.completed);
  const priority = task.priority || "medium";

  const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
  const completedSubtasks = hasSubtasks
    ? task.subtasks.filter((s) => s.completed).length
    : 0;
  const totalSubtasks = hasSubtasks ? task.subtasks.length : 0;
  const allSubtasksDone = hasSubtasks && completedSubtasks === totalSubtasks;

  return (
    <div className={`task-item-wrapper ${isExpanded ? "expanded" : ""}`}>
      <div className={`task-row ${task.completed ? "is-completed" : ""} ${isSelected ? "is-selected" : ""}`}>
        {/* Row Selection Checkbox */}
        <button
          type="button"
          className={`task-select-box ${isSelected ? "selected" : ""} ${selectionMode ? "visible" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(task._id);
          }}
          aria-label={isSelected ? "Deselect task" : "Select task for bulk actions"}
          title={isSelected ? "Deselect task" : "Select task"}
        >
          {isSelected && <Check size={10} strokeWidth={3} />}
        </button>

        {/* Completion Toggle */}
        <button
          type="button"
          className={`task-checkbox ${task.completed ? "checked" : ""}`}
          onClick={() => toggleComplete(task._id)}
          aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Task Content */}
        <div className="task-content" onClick={() => toggleComplete(task._id)}>
          <span className="task-title">{task.title}</span>
        </div>

        {/* Task Metadata (Due Date, Priority, Project, Tags, Subtasks Badge) */}
        <div className="task-meta">
          {task.projectId && (
            <span 
              className="meta-project-tag"
              title={`Project: ${task.projectId.name}`}
            >
              <span 
                className="project-dot" 
                style={{ backgroundColor: task.projectId.color || "#6366f1" }} 
              />
              {task.projectId.name}
            </span>
          )}

          {Array.isArray(task.tags) && task.tags.length > 0 && (
            <div className="task-tags-group">
              {task.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="meta-tag-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  title={`Filter by tag #${tag}`}
                >
                  <span className="tag-hash">#</span>{tag}
                </button>
              ))}
            </div>
          )}

          {hasSubtasks && (
            <button
              type="button"
              className={`meta-subtask-badge ${allSubtasksDone ? "all-done" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={`${completedSubtasks} of ${totalSubtasks} subtasks completed. Click to ${isExpanded ? "collapse" : "expand"}.`}
            >
              <ListChecks size={12} strokeWidth={2} />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
              {isExpanded ? (
                <ChevronDown size={11} strokeWidth={2} />
              ) : (
                <ChevronRight size={11} strokeWidth={2} />
              )}
            </button>
          )}

          {dueInfo && (
            <span 
              className={`meta-due-date ${dueInfo.isOverdue ? "overdue" : ""} ${dueInfo.isToday ? "today" : ""} ${dueInfo.isTomorrow ? "tomorrow" : ""}`}
              title={`Due: ${dueInfo.label}`}
            >
              <Calendar size={12} strokeWidth={2} />
              {dueInfo.label}
            </span>
          )}

          <span className={`priority-tag priority-${priority}`}>
            {priority}
          </span>
        </div>

        {/* Row Hover Actions */}
        <div className="task-actions">
          <button
            type="button"
            className="row-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(task);
            }}
            aria-label="Edit task"
            title="Edit task"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>

          <button
            type="button"
            className="row-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task._id);
            }}
            aria-label="Delete task"
            title="Delete task"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Inline Subtasks Checklist (renders when expanded) */}
      {hasSubtasks && isExpanded && (
        <div className="inline-subtask-list" role="list" aria-label={`Subtasks for ${task.title}`}>
          {task.subtasks.map((st) => (
            <div
              key={st._id}
              className={`inline-subtask-row ${st.completed ? "is-subtask-completed" : ""}`}
            >
              <button
                type="button"
                className={`subtask-inline-checkbox ${st.completed ? "checked" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubtask?.(task._id, st._id);
                }}
                aria-label={st.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
              >
                {st.completed && <Check size={10} strokeWidth={3} />}
              </button>
              <span
                className="inline-subtask-title"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubtask?.(task._id, st._id);
                }}
              >
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskItem;