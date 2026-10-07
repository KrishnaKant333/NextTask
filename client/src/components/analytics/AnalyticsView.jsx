import { useState, useEffect, useCallback } from "react";
import AnalyticsHeader from "./AnalyticsHeader";
import AnalyticsKPIs from "./AnalyticsKPIs";
import TrendsChart from "./TrendsChart";
import ProjectAllocation from "./ProjectAllocation";
import ConsistencyHeatmap from "./ConsistencyHeatmap";
import {
  getAnalyticsSummary,
  getAnalyticsTrends,
  getProjectAnalytics,
  getAnalyticsHeatmap
} from "../../services/analyticsService";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * AnalyticsView — Root analytics dashboard view component for NextTask.
 * Integrates summary metrics, time-series velocity trends, project allocation,
 * and consistency heatmaps with parallel fetching and native JSON report export.
 */
export default function AnalyticsView({ onToast }) {
  const [timeframe, setTimeframe] = useState("30d"); // '7d' | '30d' | '90d' | 'year'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [summaryData, setSummaryData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);

  // Map user-selected timeframe into backend endpoint range arguments
  const mapRanges = useCallback((selectedTf) => {
    switch (selectedTf) {
      case "7d":
        return {
          trendsRange: "7d",
          projectsRange: "7d",
          heatmapRange: "30d" // 30d baseline for consistency
        };
      case "90d":
        return {
          trendsRange: "90d",
          projectsRange: "90d",
          heatmapRange: "90d"
        };
      case "year":
        return {
          trendsRange: "90d", // trends max window
          projectsRange: "all",
          heatmapRange: "365d"
        };
      case "30d":
      default:
        return {
          trendsRange: "30d",
          projectsRange: "30d",
          heatmapRange: "30d"
        };
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { trendsRange, projectsRange, heatmapRange } = mapRanges(timeframe);
      const timezoneOffset = new Date().getTimezoneOffset();

      // Parallel fetch across all 4 analytics endpoints
      const [sumRes, trendsRes, projRes, heatRes] = await Promise.all([
        getAnalyticsSummary({ timezoneOffset }),
        getAnalyticsTrends({ range: trendsRange, timezoneOffset }),
        getProjectAnalytics({ range: projectsRange, timezoneOffset }),
        getAnalyticsHeatmap({ range: heatmapRange, timezoneOffset })
      ]);

      setSummaryData(sumRes);
      setTrendsData(trendsRes);
      setProjectData(projRes);
      setHeatmapData(heatRes);
    } catch (err) {
      console.error("Failed to load analytics dashboard:", err);
      setError(err.message || "Failed to load analytics data");
      if (onToast) onToast("Unable to fetch analytics data", "error");
    } finally {
      setLoading(false);
    }
  }, [timeframe, mapRanges, onToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Handle native JSON Report Export
  function handleExportJSON() {
    try {
      setExporting(true);
      const dateStr = new Date().toISOString().split("T")[0];

      const reportPayload = {
        meta: {
          app: "NextTask",
          version: "0.1.0",
          reportType: "Productivity Analytics & Consistency Report",
          exportedAt: new Date().toISOString(),
          timeframe,
          timezoneOffsetMinutes: new Date().getTimezoneOffset()
        },
        summary: summaryData,
        trends: trendsData,
        projects: projectData,
        heatmap: heatmapData
      };

      const jsonStr = JSON.stringify(reportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `nexttask-analytics-${timeframe}-${dateStr}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      if (onToast) {
        onToast(`Analytics report exported (nexttask-analytics-${timeframe}-${dateStr}.json)`, "success");
      }
    } catch (err) {
      console.error("Export report error:", err);
      if (onToast) onToast("Failed to export analytics report", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="analytics-workbench" aria-label="Analytics Workspace">
      {/* 1. Header Toolbar */}
      <AnalyticsHeader
        activeRange={timeframe}
        onRangeChange={(r) => setTimeframe(r)}
        onExportJSON={handleExportJSON}
        onRefresh={loadAnalytics}
        loading={loading}
        exporting={exporting}
      />

      {error ? (
        <div className="analytics-error-card">
          <AlertCircle size={24} className="error-icon" strokeWidth={2} />
          <h3 className="error-title">Failed to load analytics</h3>
          <p className="error-desc">{error}</p>
          <button
            type="button"
            className="analytics-retry-btn"
            onClick={loadAnalytics}
          >
            <RefreshCw size={14} strokeWidth={2} />
            <span>Retry</span>
          </button>
        </div>
      ) : loading && !summaryData ? (
        <div className="analytics-loading-viewport">
          <div className="analytics-loading-spinner" />
          <p className="loading-label">Aggregating workspace intelligence...</p>
        </div>
      ) : (
        <div className="analytics-content-stack">
          {/* 2. KPI Summary Ribbon */}
          <AnalyticsKPIs
            summaryData={summaryData}
            trendsData={trendsData}
            heatmapData={heatmapData}
          />

          {/* 3. Completion Velocity & Focus Trends Chart */}
          <TrendsChart trendsData={trendsData} />

          {/* 4. Project Time Allocation & Priority Distribution */}
          <ProjectAllocation projectData={projectData} />

          {/* 5. Productivity Consistency Heatmap */}
          <ConsistencyHeatmap heatmapData={heatmapData} />
        </div>
      )}
    </main>
  );
}
