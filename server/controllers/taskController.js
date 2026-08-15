import Task from "../models/Task.js"

export async function getTasks(req, res) {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
}

export async function createTask(req, res) {
    try {
        const { title } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const existingTask = await Task.findOne({
            title: title.trim()
        });

        if (existingTask) {
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
}

export async function updateTask(req, res) {
    try {
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
                message: "Task not found"
            });
        }
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update Task"
        });
    }
}

export async function deleteTask(req, res) {
    try {
        const { id } = req.params;

        const deletedTask = await Task.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }
        return res.status(200).json({
            message: "Task deleted successfully",
            task: deletedTask
        });
    }
    catch (error) {
        console.log("Delete error : ", error);
        return res.status(500).json({
            message: "Failed to delete task",
            error: error.message
        });
    }
}