import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/tasks$/, "/focus-sessions")
  : "http://localhost:5000/api/focus-sessions";

export async function logFocusSession(sessionData) {
    try {
        const response = await axios.post(API_BASE, sessionData);
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
        const response = await axios.get(`${API_BASE}/today`, config);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch focus metrics";
        throw new Error(message);
    }
}

export async function getFocusHistory(limit = 20) {
    try {
        const response = await axios.get(API_BASE, { params: { limit } });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch focus history";
        throw new Error(message);
    }
}
