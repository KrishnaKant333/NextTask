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
