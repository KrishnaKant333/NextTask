import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

export async function getTasks(){
    const response = await axios.get(API_URL);
    return response.data;
}

export async function createTask(title){
    const response = await axios.post(API_URL, { title });
    return response.data;
}

export async function deleteTask(id){
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
}
export async function updateTask(id, updates){
    const response = await axios.put(
        `${API_URL}/${id}`,
        updates
    );
    return response.data;
}