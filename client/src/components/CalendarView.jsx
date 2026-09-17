import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  Plus,
  AlertCircle
} from "lucide-react";
import {
  getMonthMatrix,
  formatMonthYear,
  formatDateISO,
  WEEKDAY_NAMES
} from "../utils/dateUtils";

function CalendarView({
  tasks = [],
  onSelectTask,
  onInspectDay,
  onRescheduleTask
}) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  const todayIso = useMemo(() => formatDateISO(new Date()), []);

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  // Generate 7x5 or 7x6 month grid matrix
  const dayMatrix = useMemo(() => {
    return getMonthMatrix(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Index tasks by their YYYY-MM-DD due date
  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const iso = formatDateISO(task.dueDate);
      if (!iso) return;
      if (!map.has(iso)) {
        map.set(iso, []);
      }
      map.get(iso).push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div
      className="calendar-view-wrapper"
      role="region"
      aria-label="Calendar view"
    >
      {/* 1. Calendar Header Navigation */}
      <div className="calendar-nav-bar">
        <div className="calendar-title-wrap">
          <CalendarIcon
            size={16}
            className="calendar-title-icon"
            strokeWidth={2}
          />
          <h2 className="calendar-month-title">
            {formatMonthYear(currentYear, currentMonth)}
          </h2>
        </div>

        <div className="calendar-nav-actions">
          <button
            type="button"
            className="calendar-nav-btn today-btn"
            onClick={goToToday}
            title="Jump to current date"
          >
            Today
          </button>
          <div className="calendar-nav-stepper">
            <button
              type="button"
              className="calendar-nav-btn icon-btn"
              onClick={goToPrevMonth}
              title="Previous month"
              aria-label="Previous month"
            >
              <ChevronLeft size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="calendar-nav-btn icon-btn"
              onClick={goToNextMonth}
              title="Next month"
              aria-label="Next month"
            >
              <ChevronRight size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Weekday Header Labels */}
      <div className="calendar-weekdays-row" role="row">
        {WEEKDAY_NAMES.map((day) => (
          <div key={day} className="calendar-weekday-cell" role="columnheader">
            {day}
          </div>
        ))}
      </div>

      {/* 3. 7x5 or 7x6 Day Cells Grid */}
      <div className="calendar-grid" role="grid" aria-label="Month days">
        {dayMatrix.map((cell) => {
          const dayTasks = tasksByDate.get(cell.dateStr) || [];
          const visibleTasks = dayTasks.slice(0, 3);
          const extraCount = dayTasks.length - 3;
          const isPast = cell.dateStr < todayIso;
          const hasOverdue = isPast && dayTasks.some((t) => !t.completed);
          const isDragTarget = dragOverDate === cell.dateStr;

          return (
            <div
              key={cell.dateStr}
              className={`calendar-day-cell ${
                cell.isCurrentMonth ? "in-month" : "out-month"
              } ${cell.isToday ? "is-today" : ""} ${
                hasOverdue ? "has-overdue" : ""
              } ${isDragTarget ? "drag-over" : ""}`}
              onClick={() => onInspectDay?.(cell.dateStr)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverDate !== cell.dateStr) {
                  setDragOverDate(cell.dateStr);
                }
              }}
              onDragLeave={(e) => {
                // Avoid flicker when moving over children
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragOverDate(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedTaskId =
                  e.dataTransfer.getData("text/plain") || draggingTaskId;
                setDraggingTaskId(null);
                setDragOverDate(null);
                if (droppedTaskId) {
                  onRescheduleTask?.(droppedTaskId, cell.dateStr);
                }
              }}
              role="gridcell"
              tabIndex={0}
              aria-label={`${cell.dateStr}, ${dayTasks.length} tasks${
                hasOverdue ? ", has overdue tasks" : ""
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") onInspectDay?.(cell.dateStr);
              }}
            >
              {/* Day Header with Date Number */}
              <div className="day-cell-top">
                <div className="day-cell-label-group">
                  <span className="day-cell-number">{cell.dayNumber}</span>
                  {cell.isToday && <span className="today-badge">Today</span>}
                  {hasOverdue && (
                    <span
                      className="overdue-dot"
                      title="Overdue tasks on this date"
                    >
                      <AlertCircle size={10} strokeWidth={2.5} />
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="day-add-task-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectDay?.(cell.dateStr);
                  }}
                  title={`Inspect day and schedule task on ${cell.dateStr}`}
                  aria-label={`Inspect ${cell.dateStr}`}
                >
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>

              {/* Tasks Micro-chips (Draggable) */}
              <div className="day-cell-tasks">
                {visibleTasks.map((task) => {
                  const isTaskOverdue =
                    isPast && !task.completed;
                  return (
                    <button
                      key={task._id}
                      type="button"
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task._id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingTaskId(task._id);
                      }}
                      onDragEnd={() => {
                        setDraggingTaskId(null);
                        setDragOverDate(null);
                      }}
                      className={`calendar-task-chip priority-${
                        task.priority || "medium"
                      } ${task.completed ? "is-completed" : ""} ${
                        isTaskOverdue ? "is-overdue" : ""
                      } ${draggingTaskId === task._id ? "is-dragging" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask?.(task);
                      }}
                      title={`${task.title} (${
                        task.priority || "medium"
                      }) — Drag to reschedule or click to edit`}
                    >
                      {task.projectId && (
                        <span
                          className="chip-project-dot"
                          style={{
                            backgroundColor: task.projectId.color || "#6366f1"
                          }}
                        />
                      )}
                      {task.completed && (
                        <Check
                          size={10}
                          strokeWidth={3}
                          className="chip-check-icon"
                        />
                      )}
                      <span className="chip-task-title">{task.title}</span>
                    </button>
                  );
                })}

                {extraCount > 0 && (
                  <button
                    type="button"
                    className="day-extra-chip"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectDay?.(cell.dateStr);
                    }}
                    title={`View all ${dayTasks.length} tasks for this day`}
                  >
                    +{extraCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
