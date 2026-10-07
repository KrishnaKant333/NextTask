import express from "express";
import {
    logFocusSession,
    getTodayFocusMetrics,
    getFocusHistory
} from "../controllers/focusSessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guard all focus session endpoints with JWT authentication
router.use(protect);

router.post("/", logFocusSession);
router.get("/today", getTodayFocusMetrics);
router.get("/", getFocusHistory);

export default router;
