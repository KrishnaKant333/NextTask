import apiClient from "./apiClient";

export async function logFocusSession(sessionData) {
    try {
        const response = await apiClient.post("/focus-sessions", sessionData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to log focus session";
        throw new Error(message);
    }
}

export async function getTodayFocusMetrics(dateStr = null) {
    try {
        const config = {};
        if (dateStr) {
            config.params = { date: dateStr };
        }
        const response = await apiClient.get("/focus-sessions/today", config);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch focus metrics";
        throw new Error(message);
    }
}

export async function getFocusHistory(limit = 20) {
    try {
        const response = await apiClient.get("/focus-sessions", { params: { limit } });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch focus history";
        throw new Error(message);
    }
}
