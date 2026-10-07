import { useState } from "react";
import { Flame, Clock, Calendar } from "lucide-react";

const INTENSITY_COLORS = [
  "var(--bg-subtle)",                    // 0: None
  "rgba(99, 102, 241, 0.28)",           // 1: Low
  "rgba(99, 102, 241, 0.52)",           // 2: Moderate
  "rgba(99, 102, 241, 0.78)",           // 3: High
  "var(--accent-primary)"                // 4: Peak (#6366f1)
];

const INTENSITY_DESCRIPTIONS = [
  "0 activity",
  "1 task or 1–25m focus",
  "2–3 tasks or 26–50m focus",
  "4–5 tasks or 51–100m focus",
  "6+ tasks or >100m focus"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * ConsistencyHeatmap — Dual-mode temporal productivity rhythm visualizer.
 * Supports Continuous Calendar Activity Matrix and Circadian 7x24 Hourly Grid.
 */
export default function ConsistencyHeatmap({ heatmapData }) {
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' | 'hourly'
  const [hoveredCell, setHoveredCell] = useState(null);

  const summary = heatmapData?.summary || {};
  const hourlyGrid = heatmapData?.hourlyGrid || [];
  const dailyMatrix = heatmapData?.dailyMatrix || [];

  return (
    <div className="analytics-card heatmap-card">
      <div className="analytics-card-header">
        <div className="card-title-group">
          <div className="card-title-row">
            <Flame size={16} strokeWidth={2.2} className="card-header-icon" />
            <h2 className="card-title">Productivity Consistency Heatmap</h2>
          </div>
          <p className="card-subtitle">
            Temporal activity rhythms and habit consistency across days and times.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="heatmap-mode-switcher" role="group" aria-label="Heatmap view mode">
          <button
            type="button"
            className={`mode-switch-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => setViewMode("calendar")}
            title="Daily calendar matrix view"
          >
            <Calendar size={13} strokeWidth={2} />
            <span>Daily Matrix</span>
          </button>
          <button
            type="button"
            className={`mode-switch-btn ${viewMode === "hourly" ? "active" : ""}`}
            onClick={() => setViewMode("hourly")}
            title="7x24 circadian hourly grid"
          >
            <Clock size={13} strokeWidth={2} />
            <span>Circadian (7×24)</span>
          </button>
        </div>
      </div>

      {/* Consistency Rhythm Summary Strip */}
      <div className="heatmap-summary-ribbon">
        <div className="rhythm-stat-item">
          <span className="rhythm-stat-label">Consistency Rate</span>
          <span className="rhythm-stat-val highlight">
            <strong>{summary.consistencyRate ?? 0}%</strong>
          </span>
          <span className="rhythm-stat-sub">
            {summary.totalActiveDays ?? 0} of {summary.totalDaysInRange ?? 30} days active
          </span>
        </div>

        <div className="rhythm-stat-item">
          <span className="rhythm-stat-label">Most Active Day</span>
          <span className="rhythm-stat-val">
            {summary.mostActiveDayOfWeek?.dayName || "—"}
          </span>
          <span className="rhythm-stat-sub">
            {summary.mostActiveDayOfWeek?.totalEvents
              ? `${summary.mostActiveDayOfWeek.totalEvents} events (${summary.mostActiveDayOfWeek.focusMinutes}m)`
              : "No activity yet"}
          </span>
        </div>

        <div className="rhythm-stat-item">
          <span className="rhythm-stat-label">Most Active Hour</span>
          <span className="rhythm-stat-val">
            {summary.mostActiveHour?.formattedHour || "—"}
          </span>
          <span className="rhythm-stat-sub">
            {summary.mostActiveHour?.totalEvents
              ? `${summary.mostActiveHour.totalEvents} events logged`
              : "No activity yet"}
          </span>
        </div>

        <div className="rhythm-stat-item">
          <span className="rhythm-stat-label">Peak Focus Block</span>
          <span className="rhythm-stat-val">
            {summary.peakFocusHour?.formattedHour || "—"}
          </span>
          <span className="rhythm-stat-sub">
            {summary.peakFocusHour?.focusMinutes
              ? `${summary.peakFocusHour.focusMinutes} minutes focused`
              : "No focus logged"}
          </span>
        </div>
      </div>

      {/* Heatmap Matrix Display */}
      <div className="heatmap-viewport">
        {viewMode === "calendar" ? (
          /* Mode A: Continuous Calendar Daily Matrix */
          <div className="calendar-heatmap-wrap">
            <div className="calendar-cells-matrix">
              {dailyMatrix.map((day) => {
                const color = INTENSITY_COLORS[day.intensityLevel] || INTENSITY_COLORS[0];
                const isHovered = hoveredCell === day.date;

                return (
                  <div
                    key={day.date}
                    className={`calendar-heat-cell level-${day.intensityLevel} ${isHovered ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onMouseEnter={() => setHoveredCell(day.date)}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={`${day.date} (${day.dayName}): ${day.completedTasks} tasks, ${day.focusMinutes}m focus`}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`${day.date}: ${day.completedTasks} tasks, ${day.focusMinutes} focus minutes, intensity level ${day.intensityLevel}`}
                  >
                    {/* Tooltip on cell hover */}
                    {isHovered && (
                      <div className="cell-hover-tooltip">
                        <div className="cell-tooltip-header">
                          <strong>{day.dayName}</strong>, {day.date}
                        </div>
                        <div className="cell-tooltip-row">
                          <span>Tasks Completed:</span>
                          <strong>{day.completedTasks}</strong>
                        </div>
                        <div className="cell-tooltip-row">
                          <span>Focus Time:</span>
                          <strong>{day.focusMinutes}m</strong> ({day.focusSessions} sessions)
                        </div>
                        <div className="cell-tooltip-footer">
                          <span>Intensity Level {day.intensityLevel}</span>
                          <span className="cell-tooltip-hint">({INTENSITY_DESCRIPTIONS[day.intensityLevel]})</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Mode B: 7x24 Circadian Hourly Matrix */
          <div className="hourly-heatmap-wrap">
            <div className="hourly-grid-container">
              {/* Hour Header Row */}
              <div className="hourly-grid-header-row">
                <span className="hourly-row-corner" />
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="hourly-col-header">
                    {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
                  </span>
                ))}
              </div>

              {/* 7 Weekday Rows */}
              {WEEKDAY_NAMES.map((dayName, dIdx) => (
                <div key={dayName} className="hourly-grid-row">
                  <span className="hourly-row-label">{dayName}</span>

                  <div className="hourly-row-cells">
                    {Array.from({ length: 24 }, (_, hIdx) => {
                      const cellKey = `${dIdx}-${hIdx}`;
                      const cell = hourlyGrid.find((c) => c.dayOfWeek === dIdx && c.hour === hIdx) || {
                        completedTasks: 0,
                        focusMinutes: 0,
                        focusSessions: 0,
                        totalEvents: 0
                      };

                      // Map intensity (0..4) based on totalEvents or focus
                      let level = 0;
                      if (cell.totalEvents > 0 || cell.focusMinutes > 0) {
                        if (cell.totalEvents >= 4 || cell.focusMinutes >= 60) level = 4;
                        else if (cell.totalEvents >= 3 || cell.focusMinutes >= 40) level = 3;
                        else if (cell.totalEvents >= 2 || cell.focusMinutes >= 25) level = 2;
                        else level = 1;
                      }

                      const color = INTENSITY_COLORS[level];
                      const isHovered = hoveredCell === cellKey;

                      return (
                        <div
                          key={hIdx}
                          className={`hourly-heat-cell level-${level} ${isHovered ? "active" : ""}`}
                          style={{ backgroundColor: color }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={`${dayName} at ${String(hIdx).padStart(2, "0")}:00: ${cell.completedTasks} tasks, ${cell.focusMinutes} focus minutes`}
                        >
                          {isHovered && (
                            <div className="cell-hover-tooltip">
                              <div className="cell-tooltip-header">
                                <strong>{dayName}</strong> at {String(hIdx).padStart(2, "0")}:00
                              </div>
                              <div className="cell-tooltip-row">
                                <span>Completed Tasks:</span>
                                <strong>{cell.completedTasks}</strong>
                              </div>
                              <div className="cell-tooltip-row">
                                <span>Focus Time:</span>
                                <strong>{cell.focusMinutes}m</strong> ({cell.focusSessions} sessions)
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Intensity Legend & Explanation */}
      <div className="heatmap-legend-footer">
        <span className="legend-title">Activity Intensity:</span>
        <div className="legend-scale-strip">
          <span className="legend-edge-label">Less</span>
          {INTENSITY_COLORS.map((col, idx) => (
            <div
              key={idx}
              className="legend-scale-box"
              style={{ backgroundColor: col }}
              title={`Level ${idx}: ${INTENSITY_DESCRIPTIONS[idx]}`}
            />
          ))}
          <span className="legend-edge-label">More</span>
        </div>
        <span className="legend-explainer">
          Scale reflects completed tasks and focus minutes (0 = none, 4 = 6+ tasks or &gt;100m).
        </span>
      </div>
    </div>
  );
}
