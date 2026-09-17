import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/tasks$/, "/projects")
  : "http://localhost:5000/api/projects";

export async function getProjects() {
    try {
        const response = await axios.get(API_BASE);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch projects";
        throw new Error(message);
    }
}

export async function createProject(data) {
    try {
        const response = await axios.post(API_BASE, data);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to create project";
        throw new Error(message);
    }
}

export async function updateProject(id, updates) {
    try {
        const response = await axios.put(`${API_BASE}/${id}`, updates);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to update project";
        throw new Error(message);
    }
}

export async function deleteProject(id) {
    try {
        const response = await axios.delete(`${API_BASE}/${id}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || "Failed to delete project";
        throw new Error(message);
    }
}
