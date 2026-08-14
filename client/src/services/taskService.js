import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

export async function getTasks(){
    const response = await axios.get(API_URL);
    return response.data;
}