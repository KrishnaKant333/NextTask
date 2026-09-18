import express from "express";
import {
    logFocusSession,
    getTodayFocusMetrics,
    getFocusHistory
} from "../controllers/focusSessionController.js";

const router = express.Router();

router.post("/", logFocusSession);
router.get("/today", getTodayFocusMetrics);
router.get("/", getFocusHistory);

export default router;
