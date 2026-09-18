import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/tasks";

export async function getTasks(filter = null) {
    try {
        const config = {};
        if (typeof filter === "string") {
            config.params = { projectId: filter };
        } else if (filter && typeof filter === "object") {
            config.params = filter;
        }
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch tasks";
        throw new Error(message);
    }
}

export async function createTask(title, priority = "medium", dueDate = null, projectId = null, tags = [], subtasks = []) {
    try {
        const payload = { title, priority, dueDate };
        if (projectId) payload.projectId = projectId;
        if (Array.isArray(tags) && tags.length > 0) payload.tags = tags;
        if (Array.isArray(subtasks) && subtasks.length > 0) payload.subtasks = subtasks;
        const response = await axios.post(API_URL, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to create task";
        throw new Error(message);
    }
}

export async function deleteTask(id) {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to delete task";
        throw new Error(message);
    }
}

export async function updateTask(id, updates) {
    try {
        const response = await axios.put(`${API_URL}/${id}`, updates);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to update task";
        throw new Error(message);
    }
}

export async function toggleSubtask(id, subtaskId) {
    try {
        const response = await axios.patch(`${API_URL}/${id}/subtasks/${subtaskId}/toggle`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to toggle subtask";
        throw new Error(message);
    }
}

export async function bulkUpdateTasks(ids, updates) {
    try {
        const response = await axios.post(`${API_URL}/bulk-update`, { ids, updates });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to bulk update tasks";
        throw new Error(message);
    }
}

export async function bulkDeleteTasks(ids) {
    try {
        const response = await axios.post(`${API_URL}/bulk-delete`, { ids });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to bulk delete tasks";
        throw new Error(message);
    }
}

export async function incrementTaskPomodoro(id) {
    try {
        const response = await axios.patch(`${API_URL}/${id}/pomodoro`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to increment pomodoro";
        throw new Error(message);
    }
}