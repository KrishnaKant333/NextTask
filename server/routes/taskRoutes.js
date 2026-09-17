import express from "express";

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    bulkUpdateTasks,
    bulkDeleteTasks
} from "../controllers/taskController.js";

const router = express.Router();

router.get("/", getTasks);
router.post("/", createTask);
router.post("/bulk-update", bulkUpdateTasks);
router.post("/bulk-delete", bulkDeleteTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/subtasks/:subtaskId/toggle", toggleSubtask);

export default router;