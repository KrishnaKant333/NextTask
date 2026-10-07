import express from "express";

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    bulkUpdateTasks,
    bulkDeleteTasks,
    incrementTaskPomodoro
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guard all task endpoints with JWT authentication
router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.post("/bulk-update", bulkUpdateTasks);
router.post("/bulk-delete", bulkDeleteTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/subtasks/:subtaskId/toggle", toggleSubtask);
router.patch("/:id/pomodoro", incrementTaskPomodoro);

export default router;