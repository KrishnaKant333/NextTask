import express from "express";
import {
    getSummaryMetrics,
    getTrendsMetrics,
    getProjectAnalytics,
    getHeatmapAnalytics
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guard all analytics endpoints with JWT authentication
router.use(protect);

router.get("/summary", getSummaryMetrics);
router.get("/trends", getTrendsMetrics);
router.get("/projects", getProjectAnalytics);
router.get("/heatmap", getHeatmapAnalytics);

export default router;
