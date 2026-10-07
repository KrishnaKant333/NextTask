import apiClient from "./apiClient";

/**
 * Fetch analytics summary metrics for the authenticated user.
 * Automatically supplies local browser timezoneOffset in minutes.
 * @param {Object} options
 * @param {number} [options.timezoneOffset] - Optional override for timezone offset in minutes.
 * @returns {Promise<Object>} Summary metrics containing taskMetrics, focusMetrics, todayStats, streakDays.
 */
export async function getAnalyticsSummary(options = {}) {
    try {
        const timezoneOffset = options.timezoneOffset !== undefined
            ? options.timezoneOffset
            : new Date().getTimezoneOffset();

        const response = await apiClient.get("/analytics/summary", {
            params: { timezoneOffset }
        });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch analytics summary";
        throw new Error(message);
    }
}

/**
 * Fetch productivity completion velocity & focus trends for the authenticated user.
 * @param {Object} options
 * @param {string} [options.range="7d"] - Time range: '7d', '30d', or '90d'
 * @param {number} [options.timezoneOffset] - Optional override for timezone offset in minutes.
 * @returns {Promise<Object>} Trends data containing summary and continuous days array.
 */
export async function getAnalyticsTrends(options = {}) {
    try {
        const range = options.range || "7d";
        const timezoneOffset = options.timezoneOffset !== undefined
            ? options.timezoneOffset
            : new Date().getTimezoneOffset();

        const response = await apiClient.get("/analytics/trends", {
            params: { range, timezoneOffset }
        });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch analytics trends";
        throw new Error(message);
    }
}

/**
 * Fetch project time allocation and priority distribution metrics for the authenticated user.
 * @param {Object} options
 * @param {string} [options.range="7d"] - Time range: '7d', '30d', '90d', or 'all'
 * @param {number} [options.timezoneOffset] - Optional override for timezone offset in minutes.
 * @returns {Promise<Object>} Project analytics data containing summary, projects array, and priority distribution.
 */
export async function getProjectAnalytics(options = {}) {
    try {
        const range = options.range || "7d";
        const timezoneOffset = options.timezoneOffset !== undefined
            ? options.timezoneOffset
            : new Date().getTimezoneOffset();

        const response = await apiClient.get("/analytics/projects", {
            params: { range, timezoneOffset }
        });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch project analytics";
        throw new Error(message);
    }
}

/**
 * Fetch productivity consistency heatmap metrics for the authenticated user.
 * Returns both hourlyGrid (168 cells) and dailyMatrix (continuous days) along with summary metrics.
 * @param {Object} options
 * @param {string} [options.range="30d"] - Time range: '30d', '90d', or '365d'
 * @param {number} [options.timezoneOffset] - Optional override for timezone offset in minutes.
 * @returns {Promise<Object>} Heatmap data containing hourlyGrid, dailyMatrix, and summary.
 */
export async function getAnalyticsHeatmap(options = {}) {
    try {
        const range = options.range || "30d";
        const timezoneOffset = options.timezoneOffset !== undefined
            ? options.timezoneOffset
            : new Date().getTimezoneOffset();

        const response = await apiClient.get("/analytics/heatmap", {
            params: { range, timezoneOffset }
        });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch heatmap analytics";
        throw new Error(message);
    }
}

