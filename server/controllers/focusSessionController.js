import FocusSession from "../models/FocusSession.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

// Ensure Project is registered for populate
void Project;

export async function logFocusSession(req, res) {
    try {
        const { taskId, projectId, durationMinutes, mode, completedAt } = req.body;

        let resolvedProjectId = projectId || null;

        // If taskId is provided but projectId is not, inherit projectId from the task
        if (taskId && !resolvedProjectId) {
            const task = await Task.findById(taskId);
            if (task && task.projectId) {
                resolvedProjectId = task.projectId;
            }
        }

        const validDuration = typeof durationMinutes === "number" && !isNaN(durationMinutes) && durationMinutes > 0
            ? Math.round(durationMinutes)
            : 25;

        const session = await FocusSession.create({
            taskId: taskId || null,
            projectId: resolvedProjectId,
            durationMinutes: validDuration,
            mode: mode || "work",
            completedAt: completedAt ? new Date(completedAt) : new Date()
        });

        const populated = await FocusSession.findById(session._id)
            .populate("taskId", "title completed priority")
            .populate("projectId", "name color");

        res.status(201).json(populated);
    } catch (error) {
        console.error("Log focus session error:", error);
        res.status(500).json({
            message: "Failed to log focus session",
            error: error.message
        });
    }
}

export async function getTodayFocusMetrics(req, res) {
    try {
        // Allow client to pass specific date or use server local date
        let targetDate = new Date();
        if (req.query.date) {
            const parsed = new Date(req.query.date);
            if (!isNaN(parsed.getTime())) {
                targetDate = parsed;
            }
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch today's work sessions
        const todaySessions = await FocusSession.find({
            completedAt: { $gte: startOfDay, $lte: endOfDay },
            mode: "work"
        })
            .populate("taskId", "title completed priority")
            .populate("projectId", "name color")
            .sort({ completedAt: -1 });

        const totalFocusMinutesToday = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        const sessionsCompletedToday = todaySessions.length;

        // Group by project distribution
        const projectMap = new Map();
        todaySessions.forEach((s) => {
            const projId = s.projectId?._id ? String(s.projectId._id) : "inbox";
            const projName = s.projectId?.name || "Inbox / No Project";
            const projColor = s.projectId?.color || "#6366f1";

            if (!projectMap.has(projId)) {
                projectMap.set(projId, {
                    projectId: projId,
                    name: projName,
                    color: projColor,
                    minutes: 0,
                    sessionsCount: 0
                });
            }

            const item = projectMap.get(projId);
            item.minutes += s.durationMinutes || 0;
            item.sessionsCount += 1;
        });

        const projectDistribution = Array.from(projectMap.values()).sort((a, b) => b.minutes - a.minutes);

        // Compute Daily Streak (consecutive days with at least 1 completed work session)
        // Fetch sessions over the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        ninetyDaysAgo.setHours(0, 0, 0, 0);

        const pastSessions = await FocusSession.find({
            completedAt: { $gte: ninetyDaysAgo },
            mode: "work"
        }).select("completedAt");

        // Format unique dates as YYYY-MM-DD
        const activeDatesSet = new Set(
            pastSessions.map((s) => {
                const d = new Date(s.completedAt);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            })
        );

        const todayStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

        let dailyStreak = 0;
        const checkDate = new Date(targetDate);

        // If today has sessions, start counting from today.
        // If today has no sessions yet, start checking from yesterday so streak doesn't immediately reset to 0 in morning.
        if (activeDatesSet.has(todayStr)) {
            dailyStreak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
            if (activeDatesSet.has(dateStr)) {
                dailyStreak += 1;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        res.json({
            date: todayStr,
            totalFocusMinutesToday,
            sessionsCompletedToday,
            dailyStreak,
            projectDistribution,
            recentSessions: todaySessions.slice(0, 5)
        });
    } catch (error) {
        console.error("Get today focus metrics error:", error);
        res.status(500).json({
            message: "Failed to fetch focus metrics",
            error: error.message
        });
    }
}

export async function getFocusHistory(req, res) {
    try {
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const history = await FocusSession.find({ mode: "work" })
            .populate("taskId", "title completed priority")
            .populate("projectId", "name color")
            .sort({ completedAt: -1 })
            .limit(limit);

        res.json(history);
    } catch (error) {
        console.error("Get focus history error:", error);
        res.status(500).json({
            message: "Failed to fetch focus history",
            error: error.message
        });
    }
}
