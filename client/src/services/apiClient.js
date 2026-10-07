import axios from "axios";

// Derive base API URL (e.g. "http://localhost:5000/api")
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/tasks";
export const API_BASE = rawApiUrl.replace(/\/tasks\/?$/, "");

export const TOKEN_STORAGE_KEY = "nexttask_token";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Inject Bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Dispatch custom event on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(
        new CustomEvent("nexttask:unauthorized", {
          detail: error.response?.data || {},
        })
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
