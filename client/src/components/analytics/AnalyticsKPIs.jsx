import { CheckCircle2, Clock, Flame, Calendar } from "lucide-react";

/**
 * AnalyticsKPIs — High-craft Studio Slate overview metric cards.
 * Displays completed tasks, focus volume, habit consistency/streak, and today's output.
 */
export default function AnalyticsKPIs({ summaryData, trendsData, heatmapData }) {
  const taskMetrics = summaryData?.taskMetrics || {};
  const focusMetrics = summaryData?.focusMetrics || {};
  const todayStats = summaryData?.todayStats || {};
  const streakDays = summaryData?.streakDays ?? 0;
  const consistencyRate = heatmapData?.summary?.consistencyRate ?? 0;
  const totalActiveDays = heatmapData?.summary?.totalActiveDays ?? 0;
  const totalDaysInRange = heatmapData?.summary?.totalDaysInRange ?? 30;

  const totalCompleted = trendsData?.summary?.totalCompleted ?? taskMetrics.completedTasks ?? 0;
  const completedOnTime = trendsData?.summary?.completedOnTime ?? 0;
  const completedOverdue = trendsData?.summary?.completedOverdue ?? 0;

  const totalFocusMinutes = trendsData?.summary?.totalFocusMinutes ?? focusMetrics.totalFocusMinutes ?? 0;
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;
  const totalFocusSessions = trendsData?.summary?.totalFocusSessions ?? focusMetrics.totalFocusSessions ?? 0;

  return (
    <section className="analytics-kpi-grid" aria-label="Key Performance Indicators">
      {/* 1. Tasks Output */}
      <div className="analytics-kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Completed Tasks</span>
          <div className="kpi-icon-wrap task-accent">
            <CheckCircle2 size={16} strokeWidth={2.2} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-main-value">{totalCompleted}</span>
          <span className="kpi-sub-badge">
            {taskMetrics.completionRate ?? 0}% velocity
          </span>
        </div>
        <div className="kpi-footer-meta">
          <span className="kpi-meta-detail">
            <strong>{completedOnTime}</strong> on time
          </span>
          <span className="kpi-meta-divider">•</span>
          <span className="kpi-meta-detail overdue">
            <strong>{completedOverdue}</strong> overdue
          </span>
        </div>
      </div>

      {/* 2. Focus Time */}
      <div className="analytics-kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Focus Time</span>
          <div className="kpi-icon-wrap focus-accent">
            <Clock size={16} strokeWidth={2.2} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-main-value">{totalFocusHours}h</span>
          <span className="kpi-sub-text">({totalFocusMinutes}m)</span>
        </div>
        <div className="kpi-footer-meta">
          <span className="kpi-meta-detail">
            <strong>{totalFocusSessions}</strong> {totalFocusSessions === 1 ? "session" : "sessions"} completed
          </span>
        </div>
      </div>

      {/* 3. Consistency & Streak */}
      <div className="analytics-kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Habit Consistency</span>
          <div className="kpi-icon-wrap streak-accent">
            <Flame size={16} strokeWidth={2.2} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-main-value">{streakDays}</span>
          <span className="kpi-sub-text">{streakDays === 1 ? "day streak" : "days streak"}</span>
        </div>
        <div className="kpi-footer-meta">
          <span className="kpi-meta-detail">
            <strong>{consistencyRate}%</strong> consistency ({totalActiveDays}/{totalDaysInRange} days)
          </span>
        </div>
      </div>

      {/* 4. Today's Output */}
      <div className="analytics-kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Today's Output</span>
          <div className="kpi-icon-wrap today-accent">
            <Calendar size={16} strokeWidth={2.2} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-main-value">{todayStats.tasksCompletedToday ?? 0}</span>
          <span className="kpi-sub-text">{todayStats.tasksCompletedToday === 1 ? "task done" : "tasks done"}</span>
        </div>
        <div className="kpi-footer-meta">
          <span className="kpi-meta-detail">
            <strong>{todayStats.focusMinutesToday ?? 0}m</strong> focused ({todayStats.focusSessionsToday ?? 0} sessions)
          </span>
        </div>
      </div>
    </section>
  );
}
