import { Download, RefreshCw, BarChart2 } from "lucide-react";

/**
 * AnalyticsHeader — Top navigation & action toolbar for the Analytics view.
 * Contains timeframe selector and JSON export trigger.
 */
export default function AnalyticsHeader({
  activeRange,
  onRangeChange,
  onExportJSON,
  onRefresh,
  loading,
  exporting
}) {
  const RANGES = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
    { key: "year", label: "Full Year" }
  ];

  return (
    <div className="analytics-header-section">
      <div className="analytics-header-info">
        <div className="analytics-title-row">
          <div className="analytics-brand-icon">
            <BarChart2 size={18} strokeWidth={2.4} />
          </div>
          <h1 className="analytics-view-heading">Productivity Intelligence</h1>
        </div>
        <p className="analytics-view-desc">
          Temporal velocity, focus allocation, and habit consistency derived directly from your workspace history.
        </p>
      </div>

      <div className="analytics-header-controls">
        {/* Timeframe Range Segmented Tabs */}
        <div className="analytics-range-picker" role="tablist" aria-label="Select timeframe range">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`range-picker-btn ${activeRange === r.key ? "active" : ""}`}
              onClick={() => onRangeChange(r.key)}
              role="tab"
              aria-selected={activeRange === r.key}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Action Buttons: Refresh and Export */}
        <div className="analytics-action-buttons">
          <button
            type="button"
            className="analytics-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh analytics data"
            aria-label="Refresh analytics data"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            className="analytics-export-btn"
            onClick={onExportJSON}
            disabled={loading || exporting}
            title="Export complete analytics report as JSON"
          >
            <Download size={14} strokeWidth={2.2} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
