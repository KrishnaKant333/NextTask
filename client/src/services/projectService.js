import apiClient from "./apiClient";

export async function getProjects() {
    try {
        const response = await apiClient.get("/projects");
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch projects";
        throw new Error(message);
    }
}

export async function createProject(data) {
    try {
        const response = await apiClient.post("/projects", data);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to create project";
        throw new Error(message);
    }
}

export async function updateProject(id, updates) {
    try {
        const response = await apiClient.put(`/projects/${id}`, updates);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to update project";
        throw new Error(message);
    }
}

export async function deleteProject(id) {
    try {
        const response = await apiClient.delete(`/projects/${id}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to delete project";
        throw new Error(message);
    }
}
