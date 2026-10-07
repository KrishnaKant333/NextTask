import { Folder, Flag } from "lucide-react";

/**
 * ProjectAllocation — Displays focus time and task distribution by project and priority.
 * Treats "Inbox / Unassigned" as a first-class category.
 */
export default function ProjectAllocation({ projectData }) {
  const projects = projectData?.projects || [];
  const summary = projectData?.summary || {};
  const priorityDist = projectData?.priorityDistribution || {
    completedInWindow: { high: 0, medium: 0, low: 0 },
    currentActive: { high: 0, medium: 0, low: 0 },
    focusMinutesInWindow: { high: 0, medium: 0, low: 0, unassigned: 0 }
  };

  const totalFocusMinutes = summary.totalFocusMinutes || 0;
  const hasProjects = projects.length > 0;

  // Total completed across priorities
  const totalCompletedPrio =
    (priorityDist.completedInWindow?.high || 0) +
    (priorityDist.completedInWindow?.medium || 0) +
    (priorityDist.completedInWindow?.low || 0);

  // Total active across priorities
  const totalActivePrio =
    (priorityDist.currentActive?.high || 0) +
    (priorityDist.currentActive?.medium || 0) +
    (priorityDist.currentActive?.low || 0);

  return (
    <div className="analytics-split-grid">
      {/* 1. Project Focus Allocation Panel */}
      <div className="analytics-card project-allocation-card">
        <div className="analytics-card-header">
          <div className="card-title-group">
            <div className="card-title-row">
              <Folder size={16} strokeWidth={2.2} className="card-header-icon" />
              <h2 className="card-title">Project Time Allocation</h2>
            </div>
            <p className="card-subtitle">
              Distribution of focus sessions and task check-offs across projects & Inbox.
            </p>
          </div>
        </div>

        {!hasProjects ? (
          <div className="card-empty-state">
            <p className="empty-text">No projects created yet.</p>
            <p className="empty-hint">Create projects to categorize your focus time and tasks.</p>
          </div>
        ) : (
          <div className="project-allocation-list">
            {projects.map((proj) => {
              const isInbox = proj.projectId === null;
              const focusPct = proj.focusPercentage || 0;

              return (
                <div key={proj.projectId || "inbox"} className="project-alloc-item">
                  <div className="alloc-item-top">
                    <div className="alloc-project-label">
                      <span
                        className="project-dot"
                        style={{ backgroundColor: proj.color || "#64748b" }}
                      />
                      <span className={`project-name ${isInbox ? "inbox-label" : ""}`}>
                        {proj.name}
                      </span>
                    </div>

                    <div className="alloc-meta-stats">
                      <span className="alloc-focus-time">
                        <strong>{proj.focusMinutes}m</strong>
                        <span className="alloc-pct">({focusPct}%)</span>
                      </span>
                      <span className="alloc-tasks-done">
                        <strong>{proj.completedTasks}</strong> done
                      </span>
                      <span className="alloc-tasks-active">
                        {proj.activeTasks} active
                      </span>
                    </div>
                  </div>

                  {/* Proportional Progress Track */}
                  <div className="alloc-progress-track">
                    <div
                      className="alloc-progress-fill"
                      style={{
                        width: `${Math.max(focusPct, proj.focusMinutes > 0 ? 3 : 0)}%`,
                        backgroundColor: proj.color || "#64748b"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Priority Distribution Panel */}
      <div className="analytics-card priority-distribution-card">
        <div className="analytics-card-header">
          <div className="card-title-group">
            <div className="card-title-row">
              <Flag size={16} strokeWidth={2.2} className="card-header-icon" />
              <h2 className="card-title">Priority Distribution</h2>
            </div>
            <p className="card-subtitle">
              Effort and commitment balance across high, medium, and low urgency.
            </p>
          </div>
        </div>

        <div className="priority-bands-list">
          {[
            {
              key: "high",
              label: "High Priority",
              color: "var(--priority-high)",
              completed: priorityDist.completedInWindow?.high || 0,
              active: priorityDist.currentActive?.high || 0,
              focusMinutes: priorityDist.focusMinutesInWindow?.high || 0
            },
            {
              key: "medium",
              label: "Medium Priority",
              color: "var(--priority-med)",
              completed: priorityDist.completedInWindow?.medium || 0,
              active: priorityDist.currentActive?.medium || 0,
              focusMinutes: priorityDist.focusMinutesInWindow?.medium || 0
            },
            {
              key: "low",
              label: "Low Priority",
              color: "var(--priority-low)",
              completed: priorityDist.completedInWindow?.low || 0,
              active: priorityDist.currentActive?.low || 0,
              focusMinutes: priorityDist.focusMinutesInWindow?.low || 0
            }
          ].map((band) => {
            const completedPct = totalCompletedPrio > 0 ? Math.round((band.completed / totalCompletedPrio) * 100) : 0;
            const activePct = totalActivePrio > 0 ? Math.round((band.active / totalActivePrio) * 100) : 0;
            const focusPct = totalFocusMinutes > 0 ? Math.round((band.focusMinutes / totalFocusMinutes) * 100) : 0;

            return (
              <div key={band.key} className="priority-band-item">
                <div className="priority-band-header">
                  <div className="priority-band-title">
                    <span className="priority-indicator" style={{ backgroundColor: band.color }} />
                    <span className="priority-label">{band.label}</span>
                  </div>
                  <span className="priority-focus-badge">
                    <strong>{band.focusMinutes}m</strong> focus ({focusPct}%)
                  </span>
                </div>

                <div className="priority-metrics-row">
                  <div className="priority-metric-stat">
                    <span className="metric-num">{band.completed}</span>
                    <span className="metric-tag">completed ({completedPct}%)</span>
                  </div>
                  <div className="priority-metric-stat">
                    <span className="metric-num">{band.active}</span>
                    <span className="metric-tag">active backlog ({activePct}%)</span>
                  </div>
                </div>

                <div className="priority-bar-track">
                  <div
                    className="priority-bar-fill"
                    style={{
                      width: `${Math.max(focusPct, band.focusMinutes > 0 ? 3 : 0)}%`,
                      backgroundColor: band.color
                    }}
                  />
                </div>
              </div>
            );
          })}

          {(priorityDist.focusMinutesInWindow?.unassigned || 0) > 0 && (
            <div className="priority-unassigned-note">
              <span>+ {priorityDist.focusMinutesInWindow.unassigned}m focus logged without a specific task binding</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
