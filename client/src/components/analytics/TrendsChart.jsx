import { useState, useMemo } from "react";
import { TrendingUp, CheckCircle2, Clock } from "lucide-react";

/**
 * TrendsChart — Zero-dependency native SVG time-series visualizer.
 * Renders daily completed tasks (bars) and focus minutes (line & area) with interactive tooltips.
 */
export default function TrendsChart({ trendsData }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const days = useMemo(() => trendsData?.days || [], [trendsData?.days]);
  const summary = trendsData?.summary || {};

  // Find max values for sensible SVG coordinate scaling
  const { maxTasks, maxMinutes } = useMemo(() => {
    let mt = 1;
    let mm = 30;
    days.forEach((d) => {
      if (d.completedTasks > mt) mt = d.completedTasks;
      if (d.focusMinutes > mm) mm = d.focusMinutes;
    });
    // Add headroom
    return {
      maxTasks: Math.max(mt + 1, 4),
      maxMinutes: Math.max(Math.ceil(mm / 30) * 30, 60)
    };
  }, [days]);

  // Chart SVG dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute point positions
  const columnWidth = days.length > 0 ? plotWidth / days.length : 0;

  const points = useMemo(() => {
    return days.map((d, i) => {
      const x = padding.left + i * columnWidth + columnWidth / 2;
      const taskHeight = (d.completedTasks / maxTasks) * plotHeight;
      const taskY = padding.top + plotHeight - taskHeight;
      const minutesHeight = (d.focusMinutes / maxMinutes) * plotHeight;
      const minutesY = padding.top + plotHeight - minutesHeight;

      return {
        ...d,
        x,
        taskY,
        taskHeight,
        minutesY,
        barX: padding.left + i * columnWidth + Math.max(2, columnWidth * 0.15),
        barWidth: Math.max(4, columnWidth * 0.7)
      };
    });
  }, [days, columnWidth, maxTasks, maxMinutes, plotHeight, padding.left, padding.top]);

  // Construct SVG path for focus minutes line
  const focusLinePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((path, pt, idx) => {
      return `${path} ${idx === 0 ? "M" : "L"} ${pt.x} ${pt.minutesY}`;
    }, "");
  }, [points]);

  // Construct SVG path for focus minutes fill area
  const focusAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baseY = padding.top + plotHeight;
    return `${focusLinePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [focusLinePath, points, padding.top, plotHeight]);

  // Date label filtering so axis is legible
  const labelInterval = days.length > 30 ? Math.ceil(days.length / 10) : (days.length > 14 ? 3 : 1);

  // Active hover tooltip data
  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  const hasActivity = summary.totalCompleted > 0 || summary.totalFocusMinutes > 0;

  return (
    <div className="analytics-card trends-card">
      <div className="analytics-card-header">
        <div className="card-title-group">
          <div className="card-title-row">
            <TrendingUp size={16} strokeWidth={2.2} className="card-header-icon" />
            <h2 className="card-title">Completion Velocity & Focus Trends</h2>
          </div>
          <p className="card-subtitle">
            Daily task completions against logged focus volume over the selected timeframe.
          </p>
        </div>

        <div className="trends-legend">
          <div className="legend-item">
            <span className="legend-color-box task-bar-legend" />
            <span className="legend-label">Completed Tasks</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-line focus-line-legend" />
            <span className="legend-label">Focus Minutes</span>
          </div>
        </div>
      </div>

      <div className="trends-summary-strip">
        <div className="trends-stat-pill">
          <CheckCircle2 size={13} strokeWidth={2.2} className="stat-pill-icon task-color" />
          <span>Avg <strong>{summary.averageDailyCompletions ?? 0}</strong> tasks/day</span>
        </div>
        <div className="trends-stat-pill">
          <Clock size={13} strokeWidth={2.2} className="stat-pill-icon focus-color" />
          <span>Avg <strong>{summary.averageDailyFocusMinutes ?? 0}</strong> focus min/day</span>
        </div>
        <div className="trends-stat-pill">
          <span><strong>{summary.completedOnTime ?? 0}</strong> on-time • <strong>{summary.completedOverdue ?? 0}</strong> overdue</span>
        </div>
      </div>

      <div className="trends-chart-viewport" onMouseLeave={() => setHoveredIndex(null)}>
        {!hasActivity && (
          <div className="chart-empty-overlay">
            <span>No task completions or focus sessions recorded in this timeframe.</span>
          </div>
        )}

        <svg
          className="trends-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Productivity trends chart"
        >
          {/* Horizontal Gridlines & Left Y-Axis (Tasks) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + plotHeight * (1 - pct);
            const taskVal = Math.round(maxTasks * pct);
            return (
              <g key={idx} className="chart-gridline-group">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  className="chart-gridline"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  className="chart-axis-text text-right"
                >
                  {taskVal}
                </text>
              </g>
            );
          })}

          {/* Right Y-Axis (Focus Minutes) */}
          {[0, 0.5, 1].map((pct, idx) => {
            const y = padding.top + plotHeight * (1 - pct);
            const minVal = Math.round(maxMinutes * pct);
            return (
              <text
                key={idx}
                x={svgWidth - padding.right + 8}
                y={y + 3}
                className="chart-axis-text text-left focus-axis"
              >
                {minVal}m
              </text>
            );
          })}

          {/* Focus Minutes Area Fill */}
          {focusAreaPath && (
            <path
              d={focusAreaPath}
              className="chart-focus-area"
            />
          )}

          {/* Focus Minutes Line */}
          {focusLinePath && (
            <path
              d={focusLinePath}
              className="chart-focus-line"
            />
          )}

          {/* Task Completion Bars */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={pt.date}
                className={`chart-bar-group ${isHovered ? "active" : ""}`}
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                {/* Invisible hover trigger column */}
                <rect
                  x={padding.left + idx * columnWidth}
                  y={padding.top}
                  width={columnWidth}
                  height={plotHeight}
                  className="chart-column-trigger"
                />

                {/* Vertical guide cursor on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + plotHeight}
                    className="chart-hover-cursor"
                  />
                )}

                {/* Completed Task Bar */}
                {pt.completedTasks > 0 && (
                  <rect
                    x={pt.barX}
                    y={pt.taskY}
                    width={pt.barWidth}
                    height={pt.taskHeight}
                    rx={2}
                    className={`chart-task-bar ${pt.completedOverdue > 0 ? "has-overdue" : ""}`}
                  />
                )}

                {/* Focus Line Point Marker */}
                {pt.focusMinutes > 0 && (
                  <circle
                    cx={pt.x}
                    cy={pt.minutesY}
                    r={isHovered ? 4 : 2.5}
                    className="chart-focus-point"
                  />
                )}

                {/* X-Axis Date Labels */}
                {idx % labelInterval === 0 && (
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    className="chart-axis-text chart-date-label"
                  >
                    {pt.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {activePoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(Math.max((activePoint.x / svgWidth) * 100, 12), 88)}%`
            }}
          >
            <div className="tooltip-date-header">
              <span className="tooltip-day">{activePoint.dayOfWeek}</span>
              <span className="tooltip-date">{activePoint.date}</span>
            </div>
            <div className="tooltip-data-row">
              <span className="tooltip-indicator task-bg" />
              <span className="tooltip-label">Completed:</span>
              <span className="tooltip-value">
                <strong>{activePoint.completedTasks}</strong> tasks
                {activePoint.completedTasks > 0 && (
                  <span className="tooltip-sub">
                    ({activePoint.completedOnTime} on time, {activePoint.completedOverdue} overdue)
                  </span>
                )}
              </span>
            </div>
            <div className="tooltip-data-row">
              <span className="tooltip-indicator focus-bg" />
              <span className="tooltip-label">Focus Time:</span>
              <span className="tooltip-value">
                <strong>{activePoint.focusMinutes}</strong> min ({activePoint.focusSessions} sessions)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
