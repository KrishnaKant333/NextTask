import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Check,
  Flag,
  Tag,
  ListChecks,
  Edit2,
  CalendarDays,
  Plus,
  AlertCircle,
  Timer
} from "lucide-react";
import {
  formatFriendlyDate,
  getRelativeDateLabel,
  isPastDate,
  addDaysToDateISO
} from "../utils/dateUtils";

function CalendarDayModal({
  isOpen,
  onClose,
  dateStr,
  tasks = [],
  onToggleComplete,
  onEditTask,
  onRescheduleTask,
  onCreateTask,
  projects = []
}) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("medium");
  const [quickProjectId, setQuickProjectId] = useState("");
  const [activeRescheduleTaskId, setActiveRescheduleTaskId] = useState(null);
  const [customDateValue, setCustomDateValue] = useState("");
  const quickInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuickTitle("");
      setQuickPriority("medium");
      setQuickProjectId("");
      setActiveRescheduleTaskId(null);
      setCustomDateValue("");
    }
  }, [isOpen, dateStr]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (activeRescheduleTaskId) {
          setActiveRescheduleTaskId(null);
        } else {
          onClose();
        }
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeRescheduleTaskId, onClose]);

  if (!isOpen || !dateStr) return null;

  const friendlyTitle = formatFriendlyDate(dateStr);
  const relativeLabel = getRelativeDateLabel(dateStr);
  const isPast = isPastDate(dateStr);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const uncompletedTasks = totalTasks - completedTasks;
  const hasOverdue = isPast && uncompletedTasks > 0;

  function handleQuickSubmit(e) {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    onCreateTask?.({
      title: trimmed,
      priority: quickPriority,
      projectId: quickProjectId || undefined,
      dueDate: dateStr
    });

    setQuickTitle("");
  }

  function handleRescheduleQuick(taskId, daysToAdd) {
    const newDate = addDaysToDateISO(dateStr, daysToAdd);
    if (newDate) {
      onRescheduleTask?.(taskId, newDate);
      setActiveRescheduleTaskId(null);
    }
  }

  function handleRescheduleCustom(taskId) {
    if (customDateValue) {
      onRescheduleTask?.(taskId, customDateValue);
      setActiveRescheduleTaskId(null);
      setCustomDateValue("");
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
    >
      <div
        className="modal-card day-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="day-modal-title-wrap">
            <div className="day-modal-title-row">
              <Calendar size={18} className="modal-header-icon" strokeWidth={2} />
              <h2 id="day-modal-title" className="modal-title">
                {friendlyTitle}
              </h2>
            </div>
            <div className="day-modal-meta-row">
              {relativeLabel && (
                <span
                  className={`day-relative-badge ${
                    hasOverdue ? "is-overdue" : ""
                  }`}
                >
                  {hasOverdue ? (
                    <>
                      <AlertCircle size={11} strokeWidth={2.5} />
                      <span>{relativeLabel}</span>
                    </>
                  ) : (
                    relativeLabel
                  )}
                </span>
              )}
              <span className="day-task-count-label">
                {totalTasks === 0
                  ? "No tasks scheduled"
                  : `${totalTasks} ${totalTasks === 1 ? "task" : "tasks"} (${completedTasks} completed)`}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Body: Task List */}
        <div className="day-modal-agenda-body">
          {totalTasks === 0 ? (
            <div className="day-agenda-empty">
              <CalendarDays size={28} strokeWidth={1.5} className="empty-day-icon" />
              <p className="day-agenda-empty-title">Clear schedule</p>
              <p className="day-agenda-empty-subtitle">
                No tasks are scheduled for this day. Capture a commitment below.
              </p>
            </div>
          ) : (
            <div className="day-agenda-list" role="list">
              {tasks.map((task) => {
                const subtasksCount = task.subtasks?.length || 0;
                const completedSubtasks =
                  task.subtasks?.filter((s) => s.completed).length || 0;
                const isRescheduleOpen = activeRescheduleTaskId === task._id;

                return (
                  <div
                    key={task._id}
                    className={`day-agenda-item priority-${task.priority || "medium"} ${
                      task.completed ? "is-completed" : ""
                    }`}
                    role="listitem"
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      className={`task-checkbox day-task-checkbox ${
                        task.completed ? "checked" : ""
                      }`}
                      onClick={() => onToggleComplete?.(task._id, task.completed)}
                      aria-label={`Mark task ${task.title} as ${
                        task.completed ? "uncompleted" : "completed"
                      }`}
                    >
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </button>

                    {/* Task Info Content */}
                    <div className="day-task-main">
                      <div className="day-task-headline">
                        <span className="day-task-title">{task.title}</span>
                      </div>

                      <div className="day-task-badges">
                        {/* Project badge */}
                        {task.projectId && (
                          <span className="task-pill project-pill">
                            <span
                              className="project-dot"
                              style={{
                                backgroundColor:
                                  task.projectId.color || "#6366f1"
                              }}
                            />
                            {task.projectId.name}
                          </span>
                        )}

                        {/* Priority Badge */}
                        <span
                          className={`task-pill priority-pill priority-${
                            task.priority || "medium"
                          }`}
                        >
                          <Flag size={10} strokeWidth={2} />
                          {task.priority || "medium"}
                        </span>

                        {/* Subtasks Count */}
                        {subtasksCount > 0 && (
                          <span className="task-pill subtasks-pill">
                            <ListChecks size={10} strokeWidth={2} />
                            {completedSubtasks}/{subtasksCount}
                          </span>
                        )}

                        {/* Pomodoro Count */}
                        {(task.estimatedPomodoros > 1 || task.pomodorosCompleted > 0) && (
                          <span className="task-pill pomodoro-pill">
                            <Timer size={10} strokeWidth={2} />
                            {task.pomodorosCompleted || 0}/{task.estimatedPomodoros || 1}
                          </span>
                        )}

                        {/* Context Tags */}
                        {Array.isArray(task.tags) &&
                          task.tags.map((tag) => (
                            <span key={tag} className="task-pill tag-pill">
                              <Tag size={9} strokeWidth={2} />#{tag}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Actions: Reschedule & Edit */}
                    <div className="day-task-actions">
                      <div className="reschedule-trigger-wrap">
                        <button
                          type="button"
                          className={`day-task-action-btn ${
                            isRescheduleOpen ? "active" : ""
                          }`}
                          onClick={() => {
                            setActiveRescheduleTaskId(
                              isRescheduleOpen ? null : task._id
                            );
                            setCustomDateValue("");
                          }}
                          title="Reschedule task"
                          aria-label="Reschedule task"
                        >
                          <CalendarDays size={13} strokeWidth={2} />
                        </button>

                        {/* Quick Reschedule Popover */}
                        {isRescheduleOpen && (
                          <div
                            className="reschedule-popover"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="reschedule-popover-title">
                              Reschedule to
                            </div>
                            <button
                              type="button"
                              className="reschedule-preset-btn"
                              onClick={() => handleRescheduleQuick(task._id, 1)}
                            >
                              Tomorrow (+1d)
                            </button>
                            <button
                              type="button"
                              className="reschedule-preset-btn"
                              onClick={() => handleRescheduleQuick(task._id, 3)}
                            >
                              In 3 Days (+3d)
                            </button>
                            <button
                              type="button"
                              className="reschedule-preset-btn"
                              onClick={() => handleRescheduleQuick(task._id, 7)}
                            >
                              Next Week (+7d)
                            </button>
                            <div className="reschedule-custom-wrap">
                              <input
                                type="date"
                                className="reschedule-date-input"
                                value={customDateValue}
                                onChange={(e) => setCustomDateValue(e.target.value)}
                              />
                              <button
                                type="button"
                                className="reschedule-apply-btn"
                                disabled={!customDateValue}
                                onClick={() => handleRescheduleCustom(task._id)}
                              >
                                Move
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="day-task-action-btn"
                        onClick={() => {
                          onClose();
                          onEditTask?.(task);
                        }}
                        title="Edit task details"
                        aria-label="Edit task details"
                      >
                        <Edit2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer: Inline Quick Add for this date */}
        <form className="day-modal-quick-add" onSubmit={handleQuickSubmit}>
          <div className="quick-add-input-wrap">
            <input
              ref={quickInputRef}
              type="text"
              className="quick-add-input"
              placeholder={`Add task for ${friendlyTitle.split(",")[0]}...`}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
          </div>

          <div className="quick-add-controls">
            {/* Priority Selector */}
            <select
              className="quick-add-select"
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value)}
              aria-label="Task priority"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {/* Project Selector */}
            {projects.length > 0 && (
              <select
                className="quick-add-select project-select"
                value={quickProjectId}
                onChange={(e) => setQuickProjectId(e.target.value)}
                aria-label="Assign to project"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="quick-add-submit-btn"
              disabled={!quickTitle.trim()}
              title="Schedule task"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarDayModal;
