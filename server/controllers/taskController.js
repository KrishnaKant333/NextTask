import Task from "../models/Task.js"

export async function getTasks(req, res) {
    try {
        const filter = {};
        if (req.query.projectId) {
            if (req.query.projectId === "inbox") {
                filter.projectId = null;
            } else {
                filter.projectId = req.query.projectId;
            }
        }
        if (req.query.tag) {
            filter.tags = req.query.tag.trim().replace(/^#/, "").toLowerCase();
        }

        const tasks = await Task.find(filter)
            .populate("projectId", "name color")
            .sort({ createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        console.error("Fetch tasks error:", error);
        res.status(500).json({
            message: "Failed to fetch tasks",
            error: error.message
        });
    }
}

export async function createTask(req, res) {
    try {
        const { title, priority, dueDate, projectId, tags, subtasks } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const formattedTags = Array.isArray(tags)
            ? Array.from(new Set(tags.map(t => typeof t === "string" ? t.trim().replace(/^#/, "").toLowerCase() : "").filter(Boolean)))
            : [];

        const formattedSubtasks = Array.isArray(subtasks)
            ? subtasks
                .map(s => ({
                    title: typeof s === "string" ? s.trim() : (s?.title ? String(s.title).trim() : ""),
                    completed: Boolean(s?.completed)
                }))
                .filter(s => s.title.length > 0)
            : [];

        const task = await Task.create({
            title: title.trim(),
            priority: priority || "medium",
            dueDate: dueDate || null,
            projectId: projectId || null,
            tags: formattedTags,
            subtasks: formattedSubtasks
        });

        const populatedTask = await Task.findById(task._id).populate("projectId", "name color");
        res.status(201).json(populatedTask);
    } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({
            message: "Failed to create task",
            error: error.message
        });
    }
}

export async function updateTask(req, res) {
    try {
        const { id } = req.params;
        const { title, completed, priority, dueDate, projectId, tags, subtasks } = req.body;

        const updateData = {};
        if (title !== undefined) {
            if (title.trim() === "") {
                return res.status(400).json({
                    message: "Task title cannot be empty"
                });
            }
            updateData.title = title.trim();
        }
        if (completed !== undefined) updateData.completed = Boolean(completed);
        if (priority !== undefined) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (projectId !== undefined) updateData.projectId = projectId || null;
        if (tags !== undefined) {
            updateData.tags = Array.isArray(tags)
                ? Array.from(new Set(tags.map(t => typeof t === "string" ? t.trim().replace(/^#/, "").toLowerCase() : "").filter(Boolean)))
                : [];
        }
        if (subtasks !== undefined) {
            updateData.subtasks = Array.isArray(subtasks)
                ? subtasks
                    .map(s => ({
                        ...(s._id ? { _id: s._id } : {}),
                        title: typeof s === "string" ? s.trim() : (s?.title ? String(s.title).trim() : ""),
                        completed: Boolean(s?.completed)
                    }))
                    .filter(s => s.title.length > 0)
                : [];
        }

        const updatedTask = await Task.findByIdAndUpdate(
            id,
            updateData,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).populate("projectId", "name color");

        if (!updatedTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }
        res.json(updatedTask);
    }
    catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({
            message: "Failed to update task",
            error: error.message
        });
    }
}

export async function toggleSubtask(req, res) {
    try {
        const { id, subtaskId } = req.params;
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const subtask = task.subtasks.id(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }
        subtask.completed = !subtask.completed;
        await task.save();

        const populated = await Task.findById(id).populate("projectId", "name color");
        res.json(populated);
    } catch (error) {
        console.error("Toggle subtask error:", error);
        res.status(500).json({
            message: "Failed to toggle subtask",
            error: error.message
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
        console.error("Delete task error:", error);
        return res.status(500).json({
            message: "Failed to delete task",
            error: error.message
        });
    }
}

export async function bulkUpdateTasks(req, res) {
    try {
        const { ids, updates } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Task IDs array is required" });
        }
        if (!updates || typeof updates !== "object") {
            return res.status(400).json({ message: "Updates object is required" });
        }

        const allowedFields = {};
        if (typeof updates.completed === "boolean") {
            allowedFields.completed = updates.completed;
        }
        if (updates.projectId !== undefined) {
            allowedFields.projectId = updates.projectId || null;
        }

        const mongoUpdate = {};
        if (Object.keys(allowedFields).length > 0) {
            mongoUpdate.$set = allowedFields;
        }
        if (updates.addTag && typeof updates.addTag === "string") {
            const cleanTag = updates.addTag.trim().replace(/^#/, "").toLowerCase();
            if (cleanTag) {
                mongoUpdate.$addToSet = { tags: cleanTag };
            }
        }

        if (Object.keys(mongoUpdate).length === 0) {
            return res.status(400).json({ message: "No valid updates specified" });
        }

        await Task.updateMany({ _id: { $in: ids } }, mongoUpdate);

        const updatedTasks = await Task.find({ _id: { $in: ids } }).populate("projectId", "name color");
        res.json({
            message: `Successfully updated ${updatedTasks.length} tasks`,
            tasks: updatedTasks
        });
    } catch (error) {
        console.error("Bulk update tasks error:", error);
        res.status(500).json({
            message: "Failed to bulk update tasks",
            error: error.message
        });
    }
}

export async function bulkDeleteTasks(req, res) {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Task IDs array is required" });
        }

        const result = await Task.deleteMany({ _id: { $in: ids } });
        res.json({
            message: `Successfully deleted ${result.deletedCount} tasks`,
            deletedCount: result.deletedCount,
            ids
        });
    } catch (error) {
        console.error("Bulk delete tasks error:", error);
        res.status(500).json({
            message: "Failed to bulk delete tasks",
            error: error.message
        });
    }
}