import express from "express";
import { getSummaryMetrics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guard all analytics endpoints with JWT authentication
router.use(protect);

router.get("/summary", getSummaryMetrics);

export default router;
