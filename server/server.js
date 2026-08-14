import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import Task from "./models/Task.js"
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected!");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });


app.get("/", (req, res) => {
    res.send("NextTask API is Running!");
});

app.get("/api/tasks", async (req, res) => {
    try{
        const tasks = await Task.find();
        res.json(tasks);
    }
    catch(error){
        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});

app.post("/api/tasks", async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const existingTask = await Task.findOne({
            title : title.trim()
        });

        if(existingTask){
            return res.status(400).json({
                message: "Task already exists"
            });
        }

        const task = await Task.create({
            title: title.trim()
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create Task"
        });
    }
});

app.put("/api/tasks/:id", async (req, res)=>{
    try{
        const { id } = req.params;
        const { title, completed } = req.body;

        const updatedTask = await Task.findByIdAndUpdate(
            id,
            {
                title,
                completed
            },
            {
                returnDocument: "after",
                runvalidators: true
            }
        );
        if (!updatedTask) {
            return res.status(404).json({
                message : "Task not found"
            });
        }
        res.json(updatedTask);
    }
    catch(error){
        res.status(500).json({
            message : "Failed to update Task"
        });
    }
});

app.delete("/api/tasks/:id", async (req, res)=>{
    try{
        const { id } = req.params;

        const deletedTask = await Task.findByIdAndDelete(id);

        if(!deletedTask){
            return res.status(404).json({
                message: "Task not found"
            });
        }
        return res.status(200).json({
            message : "Task deleted successfully",
            task: deletedTask
        });
    }
    catch(error){
        console.log("Delete error : ", error);
        return res.status(500).json({
            message: "Failed to delete task",
            error : error.message
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});