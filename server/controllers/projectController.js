import Project from "../models/Project.js";
import Task from "../models/Task.js";

export async function getProjects(req, res) {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error("Fetch projects error:", error);
        res.status(500).json({
            message: "Failed to fetch projects",
            error: error.message
        });
    }
}

export async function createProject(req, res) {
    try {
        const { name, description, color } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Project name is required"
            });
        }

        const project = await Project.create({
            name: name.trim(),
            description: description ? description.trim() : "",
            color: color || "#6366f1"
        });

        res.status(201).json(project);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({
            message: "Failed to create project",
            error: error.message
        });
    }
}

export async function updateProject(req, res) {
    try {
        const { id } = req.params;
        const { name, description, color, isArchived } = req.body;

        const updateData = {};
        if (name !== undefined) {
            if (name.trim() === "") {
                return res.status(400).json({
                    message: "Project name cannot be empty"
                });
            }
            const existing = await Project.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });
            if (existing) {
                return res.status(400).json({
                    message: "A project with this name already exists"
                });
            }
            updateData.name = name.trim();
        }
        if (description !== undefined) updateData.description = description.trim();
        if (color !== undefined) updateData.color = color;
        if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            updateData,
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!updatedProject) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.json(updatedProject);
    } catch (error) {
        console.error("Update project error:", error);
        res.status(500).json({
            message: "Failed to update project",
            error: error.message
        });
    }
}

export async function deleteProject(req, res) {
    try {
        const { id } = req.params;

        const deletedProject = await Project.findByIdAndDelete(id);

        if (!deletedProject) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Dissociate tasks that belonged to this project (move them to Inbox / null)
        await Task.updateMany({ projectId: id }, { projectId: null });

        return res.status(200).json({
            message: "Project deleted successfully",
            project: deletedProject
        });
    } catch (error) {
        console.error("Delete project error:", error);
        return res.status(500).json({
            message: "Failed to delete project",
            error: error.message
        });
    }
}
