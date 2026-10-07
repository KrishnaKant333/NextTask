import express from "express";
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guard all project endpoints with JWT authentication
router.use(protect);

router.get("/", getProjects);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
