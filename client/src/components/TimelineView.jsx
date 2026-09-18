import { useMemo } from "react";
import TaskItem from "./TaskItem";
import {
  CalendarDays,
  AlertCircle,
  Clock,
  CalendarCheck2
} from "lucide-react";
import {
  getTimelineBucket,
  TIMELINE_BUCKET_META,
  TIMELINE_BUCKETS_ORDER
} from "../utils/dateUtils";

function TimelineView({
  tasks = [],
  deleteTask,
  toggleComplete,
  onToggleSubtask,
  openEditModal,
  onSelectTag,
  selectedTaskIds = new Set(),
  onToggleSelect,
  selectionMode = false,
  onStartFocus,
  focusedTaskId = null
}) {
  // Group tasks into ordered chronological buckets
  const bucketedTasks = useMemo(() => {
    const buckets = {};
    TIMELINE_BUCKETS_ORDER.forEach((key) => {
      buckets[key] = [];
    });

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const bucketKey = getTimelineBucket(task.dueDate, task.completed);
      if (buckets[bucketKey]) {
        buckets[bucketKey].push(task);
      } else {
        buckets.later.push(task);
      }
    });

    return buckets;
  }, [tasks]);

  const totalScheduled = tasks.filter((t) => t.dueDate).length;

  if (totalScheduled === 0) {
    return (
      <main className="task-container timeline-container" aria-label="Upcoming Timeline">
        <div className="list-empty-state">
          <CalendarDays size={32} strokeWidth={1.5} className="empty-icon" />
          <p className="empty-title">No upcoming commitments</p>
          <p className="empty-subtitle">
            Assign due dates to your tasks to see a clear chronological timeline of your schedule.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="task-container timeline-container" aria-label="Upcoming Timeline">
      <div className="timeline-track">
        {TIMELINE_BUCKETS_ORDER.map((bucketKey) => {
          const groupTasks = bucketedTasks[bucketKey] || [];
          if (groupTasks.length === 0) return null;

          const meta = TIMELINE_BUCKET_META[bucketKey] || {
            label: bucketKey,
            description: ""
          };
          const isOverdue = bucketKey === "overdue";
          const isToday = bucketKey === "today";

          return (
            <section
              key={bucketKey}
              className={`timeline-bucket ${bucketKey} ${
                isOverdue ? "is-overdue" : ""
              }`}
              aria-labelledby={`bucket-title-${bucketKey}`}
            >
              {/* Bucket Header Row */}
              <div className="timeline-bucket-header">
                <div className="bucket-header-left">
                  <div
                    className={`bucket-indicator-node ${
                      isOverdue
                        ? "node-overdue"
                        : isToday
                        ? "node-today"
                        : "node-future"
                    }`}
                  >
                    {isOverdue ? (
                      <AlertCircle size={12} strokeWidth={2.5} />
                    ) : isToday ? (
                      <Clock size={12} strokeWidth={2.5} />
                    ) : bucketKey === "earlier" ? (
                      <CalendarCheck2 size={12} strokeWidth={2} />
                    ) : (
                      <span className="node-dot" />
                    )}
                  </div>

                  <div className="bucket-titles-wrap">
                    <h3
                      id={`bucket-title-${bucketKey}`}
                      className="timeline-bucket-title"
                    >
                      {meta.label}
                    </h3>
                    {meta.description && (
                      <span className="timeline-bucket-desc">
                        {meta.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bucket-header-right">
                  <span
                    className={`bucket-count-badge ${
                      isOverdue ? "badge-overdue" : ""
                    }`}
                  >
                    {groupTasks.length} {groupTasks.length === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </div>

              {/* Bucket Task Items */}
              <div className="timeline-bucket-items task-list-rows">
                {groupTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    deleteTask={deleteTask}
                    toggleComplete={toggleComplete}
                    onToggleSubtask={onToggleSubtask}
                    openEditModal={openEditModal}
                    onSelectTag={onSelectTag}
                    isSelected={selectedTaskIds.has(task._id)}
                    onToggleSelect={onToggleSelect}
                    selectionMode={selectionMode}
                    onStartFocus={onStartFocus}
                    isFocusedTask={task._id === focusedTaskId}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

export default TimelineView;
