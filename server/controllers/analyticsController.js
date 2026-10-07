import Task from "../models/Task.js";
import FocusSession from "../models/FocusSession.js";

/**
 * Computes localized start-of-day and end-of-day UTC dates based on client timezoneOffset (minutes).
 */
export function getLocalDayBounds(date = new Date(), timezoneOffsetMinutes = 0) {
    const offsetNum = Number(timezoneOffsetMinutes) || 0;
    const offsetMs = offsetNum * 60 * 1000;
    const clientLocalTimeMs = date.getTime() - offsetMs;
    const clientLocalDate = new Date(clientLocalTimeMs);

    const year = clientLocalDate.getUTCFullYear();
    const month = clientLocalDate.getUTCMonth();
    const day = clientLocalDate.getUTCDate();

    const localStartOfDayMs = Date.UTC(year, month, day, 0, 0, 0, 0);
    const localEndOfDayMs = Date.UTC(year, month, day, 23, 59, 59, 999);

    const utcStartOfDay = new Date(localStartOfDayMs + offsetMs);
    const utcEndOfDay = new Date(localEndOfDayMs + offsetMs);

    return {
        utcStartOfDay,
        utcEndOfDay,
        localDateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    };
}

/**
 * Format a UTC Date into local YYYY-MM-DD string given timezoneOffsetMinutes
 */
export function formatLocalDateString(date, timezoneOffsetMinutes = 0) {
    const offsetMs = (Number(timezoneOffsetMinutes) || 0) * 60 * 1000;
    const clientLocalDate = new Date(date.getTime() - offsetMs);
    const year = clientLocalDate.getUTCFullYear();
    const month = String(clientLocalDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(clientLocalDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * GET /api/analytics/summary
 * Scoped strictly to req.user._id
 */
export async function getSummaryMetrics(req, res) {
    try {
        const userId = req.user._id;
        const timezoneOffset = req.query.timezoneOffset !== undefined ? Number(req.query.timezoneOffset) : 0;
        const { utcStartOfDay, utcEndOfDay, localDateString: todayLocalStr } = getLocalDayBounds(new Date(), timezoneOffset);

        // Run queries in parallel for efficiency
        const [
            totalTasks,
            completedTasks,
            overdueTasks,
            tasksCompletedToday,
            focusSessionAgg,
            todayFocusAgg,
            recentCompletedTasks,
            recentFocusSessions
        ] = await Promise.all([
            Task.countDocuments({ user: userId }),
            Task.countDocuments({ user: userId, completed: true }),
            Task.countDocuments({
                user: userId,
                completed: false,
                dueDate: { $ne: null, $lt: utcStartOfDay }
            }),
            Task.countDocuments({
                user: userId,
                completed: true,
                $or: [
                    { completedAt: { $gte: utcStartOfDay, $lte: utcEndOfDay } },
                    { completedAt: null, updatedAt: { $gte: utcStartOfDay, $lte: utcEndOfDay } }
                ]
            }),
            FocusSession.aggregate([
                { $match: { user: userId, mode: "work" } },
                {
                    $group: {
                        _id: null,
                        totalMinutes: { $sum: "$durationMinutes" },
                        totalSessions: { $sum: 1 }
                    }
                }
            ]),
            FocusSession.aggregate([
                {
                    $match: {
                        user: userId,
                        mode: "work",
                        completedAt: { $gte: utcStartOfDay, $lte: utcEndOfDay }
                    }
                },
                {
                    $group: {
                        _id: null,
                        todayMinutes: { $sum: "$durationMinutes" },
                        todaySessions: { $sum: 1 }
                    }
                }
            ]),
            // For streak calculation: fetch dates of activity in the last 60 days
            Task.find({
                user: userId,
                completed: true,
                $or: [
                    { completedAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
                    { completedAt: null, updatedAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } }
                ]
            }).select("completedAt updatedAt"),
            FocusSession.find({
                user: userId,
                mode: "work",
                completedAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
            }).select("completedAt")
        ]);

        const activeTasks = Math.max(0, totalTasks - completedTasks);
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalFocusMinutes = focusSessionAgg[0]?.totalMinutes || 0;
        const totalFocusSessions = focusSessionAgg[0]?.totalSessions || 0;
        const focusMinutesToday = todayFocusAgg[0]?.todayMinutes || 0;
        const focusSessionsToday = todayFocusAgg[0]?.todaySessions || 0;

        // Calculate Daily Streak
        const activeDatesSet = new Set();
        recentCompletedTasks.forEach(t => {
            const date = t.completedAt || t.updatedAt;
            if (date) {
                activeDatesSet.add(formatLocalDateString(date, timezoneOffset));
            }
        });
        recentFocusSessions.forEach(s => {
            if (s.completedAt) {
                activeDatesSet.add(formatLocalDateString(s.completedAt, timezoneOffset));
            }
        });

        // Compute streak starting from today or yesterday
        let streak = 0;
        const checkDate = new Date();
        const checkDateLocalStr = formatLocalDateString(checkDate, timezoneOffset);

        let anchorDate = new Date();
        if (!activeDatesSet.has(checkDateLocalStr)) {
            // If nothing done today, check if yesterday was active to keep streak alive
            anchorDate.setDate(anchorDate.getDate() - 1);
            const yesterdayLocalStr = formatLocalDateString(anchorDate, timezoneOffset);
            if (!activeDatesSet.has(yesterdayLocalStr)) {
                streak = 0;
            } else {
                // Streak is active from yesterday
                while (activeDatesSet.has(formatLocalDateString(anchorDate, timezoneOffset))) {
                    streak++;
                    anchorDate.setDate(anchorDate.getDate() - 1);
                }
            }
        } else {
            // Active today! Count backwards
            while (activeDatesSet.has(formatLocalDateString(anchorDate, timezoneOffset))) {
                streak++;
                anchorDate.setDate(anchorDate.getDate() - 1);
            }
        }

        res.json({
            taskMetrics: {
                totalTasks,
                completedTasks,
                activeTasks,
                completionRate,
                overdueTasks
            },
            focusMetrics: {
                totalFocusMinutes,
                totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
                totalFocusSessions
            },
            todayStats: {
                tasksCompletedToday,
                focusMinutesToday,
                focusSessionsToday,
                localDate: todayLocalStr
            },
            streakDays: streak
        });
    } catch (error) {
        console.error("Analytics summary error:", error);
        res.status(500).json({
            message: "Failed to generate analytics summary",
            error: error.message
        });
    }
}
