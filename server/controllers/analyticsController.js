import Task from "../models/Task.js";
import FocusSession from "../models/FocusSession.js";
import Project from "../models/Project.js";

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

const VALID_RANGES = {
    "7d": 7,
    "30d": 30,
    "90d": 90
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * GET /api/analytics/trends
 * Scoped strictly to req.user._id
 * Accepts ?range=7d|30d|90d and ?timezoneOffset=<minutes>
 */
export async function getTrendsMetrics(req, res) {
    try {
        const userId = req.user._id;
        const rangeParam = (req.query.range || "7d").toLowerCase();

        if (!VALID_RANGES[rangeParam]) {
            return res.status(400).json({
                message: "Invalid range parameter. Supported ranges are '7d', '30d', '90d'."
            });
        }

        const numDays = VALID_RANGES[rangeParam];
        const timezoneOffset = req.query.timezoneOffset !== undefined ? Number(req.query.timezoneOffset) : 0;
        const offsetNum = isNaN(timezoneOffset) ? 0 : timezoneOffset;
        const offsetMs = offsetNum * 60 * 1000;

        // Local clock representation
        const now = new Date();
        const clientLocalTimeMs = now.getTime() - offsetMs;
        const clientLocalDate = new Date(clientLocalTimeMs);

        const currentYear = clientLocalDate.getUTCFullYear();
        const currentMonth = clientLocalDate.getUTCMonth();
        const currentDay = clientLocalDate.getUTCDate();

        // Build continuous sequence of local calendar date strings (YYYY-MM-DD)
        const dateBuckets = [];
        const dateMap = new Map();

        for (let i = numDays - 1; i >= 0; i--) {
            const bucketDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - i, 12, 0, 0, 0));
            const y = bucketDate.getUTCFullYear();
            const m = String(bucketDate.getUTCMonth() + 1).padStart(2, "0");
            const d = String(bucketDate.getUTCDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;
            const dayOfWeek = DAY_NAMES[bucketDate.getUTCDay()];

            const bucket = {
                date: dateStr,
                dayOfWeek,
                completedTasks: 0,
                createdTasks: 0,
                focusMinutes: 0,
                focusSessions: 0,
                completedOnTime: 0,
                completedOverdue: 0
            };
            dateBuckets.push(bucket);
            dateMap.set(dateStr, bucket);
        }

        // Compute overall UTC bounds for the query window
        // Start of the first day (00:00:00.000 local)
        const firstDayDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - (numDays - 1), 0, 0, 0, 0));
        const rangeStartUtc = new Date(firstDayDate.getTime() + offsetMs);

        // End of the last day (23:59:59.999 local)
        const lastDayDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 23, 59, 59, 999));
        const rangeEndUtc = new Date(lastDayDate.getTime() + offsetMs);

        // Execute parallel queries scoped strictly to authenticated user
        const [completedTasks, createdTasks, focusSessions] = await Promise.all([
            Task.find({
                user: userId,
                completed: true,
                completedAt: { $gte: rangeStartUtc, $lte: rangeEndUtc }
            }).select("completedAt dueDate"),
            Task.find({
                user: userId,
                createdAt: { $gte: rangeStartUtc, $lte: rangeEndUtc }
            }).select("createdAt"),
            FocusSession.find({
                user: userId,
                mode: "work",
                completedAt: { $gte: rangeStartUtc, $lte: rangeEndUtc }
            }).select("completedAt durationMinutes")
        ]);

        // Aggregate completed tasks
        for (const task of completedTasks) {
            const dateKey = formatLocalDateString(task.completedAt, offsetNum);
            const bucket = dateMap.get(dateKey);
            if (bucket) {
                bucket.completedTasks += 1;
                if (task.dueDate) {
                    if (task.completedAt > task.dueDate) {
                        bucket.completedOverdue += 1;
                    } else {
                        bucket.completedOnTime += 1;
                    }
                } else {
                    bucket.completedOnTime += 1;
                }
            }
        }

        // Aggregate created tasks
        for (const task of createdTasks) {
            const dateKey = formatLocalDateString(task.createdAt, offsetNum);
            const bucket = dateMap.get(dateKey);
            if (bucket) {
                bucket.createdTasks += 1;
            }
        }

        // Aggregate focus sessions
        for (const session of focusSessions) {
            const dateKey = formatLocalDateString(session.completedAt, offsetNum);
            const bucket = dateMap.get(dateKey);
            if (bucket) {
                bucket.focusMinutes += session.durationMinutes || 0;
                bucket.focusSessions += 1;
            }
        }

        // Calculate totals and daily averages
        const totalCompleted = dateBuckets.reduce((acc, b) => acc + b.completedTasks, 0);
        const totalCreated = dateBuckets.reduce((acc, b) => acc + b.createdTasks, 0);
        const totalFocusMinutes = dateBuckets.reduce((acc, b) => acc + b.focusMinutes, 0);
        const totalFocusSessions = dateBuckets.reduce((acc, b) => acc + b.focusSessions, 0);
        const completedOnTime = dateBuckets.reduce((acc, b) => acc + b.completedOnTime, 0);
        const completedOverdue = dateBuckets.reduce((acc, b) => acc + b.completedOverdue, 0);

        const averageDailyCompletions = Math.round((totalCompleted / numDays) * 10) / 10;
        const averageDailyFocusMinutes = Math.round((totalFocusMinutes / numDays) * 10) / 10;

        res.json({
            range: rangeParam,
            startDate: dateBuckets[0].date,
            endDate: dateBuckets[dateBuckets.length - 1].date,
            timezoneOffset: offsetNum,
            summary: {
                totalCompleted,
                totalCreated,
                totalFocusMinutes,
                totalFocusSessions,
                averageDailyCompletions,
                averageDailyFocusMinutes,
                completedOnTime,
                completedOverdue
            },
            days: dateBuckets
        });
    } catch (error) {
        console.error("Analytics trends error:", error);
        res.status(500).json({
            message: "Failed to generate analytics trends",
            error: error.message
        });
    }
}

const PROJECT_ANALYTICS_RANGES = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "all": null
};

/**
 * GET /api/analytics/projects
 * Scoped strictly to req.user._id
 * Accepts ?range=7d|30d|90d|all and ?timezoneOffset=<minutes>
 */
export async function getProjectAnalytics(req, res) {
    try {
        const userId = req.user._id;
        const rangeParam = (req.query.range || "7d").toLowerCase();

        if (PROJECT_ANALYTICS_RANGES[rangeParam] === undefined) {
            return res.status(400).json({
                message: "Invalid range parameter. Supported ranges are '7d', '30d', '90d', 'all'."
            });
        }

        const numDays = PROJECT_ANALYTICS_RANGES[rangeParam];
        const timezoneOffset = req.query.timezoneOffset !== undefined ? Number(req.query.timezoneOffset) : 0;
        const offsetNum = isNaN(timezoneOffset) ? 0 : timezoneOffset;
        const offsetMs = offsetNum * 60 * 1000;

        // Local clock representation
        const now = new Date();
        const clientLocalTimeMs = now.getTime() - offsetMs;
        const clientLocalDate = new Date(clientLocalTimeMs);

        const currentYear = clientLocalDate.getUTCFullYear();
        const currentMonth = clientLocalDate.getUTCMonth();
        const currentDay = clientLocalDate.getUTCDate();

        let rangeStartUtc = null;
        let rangeEndUtc = null;
        let startDateStr = null;
        let endDateStr = null;

        if (numDays !== null) {
            const firstDayDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - (numDays - 1), 0, 0, 0, 0));
            rangeStartUtc = new Date(firstDayDate.getTime() + offsetMs);

            const lastDayDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 23, 59, 59, 999));
            rangeEndUtc = new Date(lastDayDate.getTime() + offsetMs);

            startDateStr = formatLocalDateString(rangeStartUtc, offsetNum);
            endDateStr = formatLocalDateString(rangeEndUtc, offsetNum);
        }

        // Build filter queries scoped strictly to user
        const completedTaskFilter = { user: userId, completed: true };
        const focusSessionFilter = { user: userId, mode: "work" };

        if (rangeStartUtc && rangeEndUtc) {
            completedTaskFilter.completedAt = { $gte: rangeStartUtc, $lte: rangeEndUtc };
            focusSessionFilter.completedAt = { $gte: rangeStartUtc, $lte: rangeEndUtc };
        }

        // Fetch user projects, tasks, and focus sessions in parallel
        const [projects, completedTasks, activeTasks, focusSessions] = await Promise.all([
            Project.find({ user: userId }).select("name color isArchived"),
            Task.find(completedTaskFilter).select("projectId priority completedAt"),
            Task.find({ user: userId, completed: false }).select("projectId priority"),
            FocusSession.find(focusSessionFilter).select("projectId taskId durationMinutes completedAt").populate("taskId", "priority")
        ]);

        // Map projects initialized with zeroes
        const projectStatsMap = new Map();

        for (const p of projects) {
            projectStatsMap.set(p._id.toString(), {
                projectId: p._id,
                name: p.name,
                color: p.color || "#6366f1",
                isArchived: Boolean(p.isArchived),
                focusMinutes: 0,
                focusSessions: 0,
                completedTasks: 0,
                activeTasks: 0,
                focusPercentage: 0,
                completionPercentage: 0
            });
        }

        // Add pseudo-project for unassigned / Inbox tasks
        const inboxStats = {
            projectId: null,
            name: "Inbox / Unassigned",
            color: "#64748b",
            isArchived: false,
            focusMinutes: 0,
            focusSessions: 0,
            completedTasks: 0,
            activeTasks: 0,
            focusPercentage: 0,
            completionPercentage: 0
        };
        projectStatsMap.set("inbox", inboxStats);

        // Aggregate completed tasks
        for (const task of completedTasks) {
            const key = task.projectId ? task.projectId.toString() : "inbox";
            const stat = projectStatsMap.get(key);
            if (stat) {
                stat.completedTasks += 1;
            }
        }

        // Aggregate active tasks
        for (const task of activeTasks) {
            const key = task.projectId ? task.projectId.toString() : "inbox";
            const stat = projectStatsMap.get(key);
            if (stat) {
                stat.activeTasks += 1;
            }
        }

        // Aggregate focus sessions
        for (const session of focusSessions) {
            const key = session.projectId ? session.projectId.toString() : "inbox";
            const stat = projectStatsMap.get(key);
            if (stat) {
                stat.focusMinutes += session.durationMinutes || 0;
                stat.focusSessions += 1;
            }
        }

        // Aggregate priority breakdown
        const priorityDistribution = {
            completedInWindow: { high: 0, medium: 0, low: 0 },
            currentActive: { high: 0, medium: 0, low: 0 },
            focusMinutesInWindow: { high: 0, medium: 0, low: 0, unassigned: 0 }
        };

        for (const task of completedTasks) {
            const prio = task.priority || "medium";
            if (priorityDistribution.completedInWindow[prio] !== undefined) {
                priorityDistribution.completedInWindow[prio] += 1;
            }
        }

        for (const task of activeTasks) {
            const prio = task.priority || "medium";
            if (priorityDistribution.currentActive[prio] !== undefined) {
                priorityDistribution.currentActive[prio] += 1;
            }
        }

        for (const session of focusSessions) {
            const mins = session.durationMinutes || 0;
            const prio = session.taskId?.priority;
            if (prio && priorityDistribution.focusMinutesInWindow[prio] !== undefined) {
                priorityDistribution.focusMinutesInWindow[prio] += mins;
            } else {
                priorityDistribution.focusMinutesInWindow.unassigned += mins;
            }
        }

        // Convert Map to array and compute totals & percentages
        const allProjectList = Array.from(projectStatsMap.values());
        const totalFocusMinutes = allProjectList.reduce((acc, p) => acc + p.focusMinutes, 0);
        const totalFocusSessions = allProjectList.reduce((acc, p) => acc + p.focusSessions, 0);
        const totalCompletedTasks = allProjectList.reduce((acc, p) => acc + p.completedTasks, 0);

        for (const p of allProjectList) {
            p.focusPercentage = totalFocusMinutes > 0 ? Math.round((p.focusMinutes / totalFocusMinutes) * 100) : 0;
            p.completionPercentage = totalCompletedTasks > 0 ? Math.round((p.completedTasks / totalCompletedTasks) * 100) : 0;
        }

        // Sort: projects with highest focus time first, then completed tasks, then active tasks
        allProjectList.sort((a, b) => {
            if (b.focusMinutes !== a.focusMinutes) return b.focusMinutes - a.focusMinutes;
            if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
            return b.activeTasks - a.activeTasks;
        });

        const activeProjectsCount = allProjectList.filter(p => p.focusMinutes > 0 || p.completedTasks > 0).length;

        res.json({
            range: rangeParam,
            startDate: startDateStr,
            endDate: endDateStr,
            timezoneOffset: offsetNum,
            summary: {
                totalFocusMinutes,
                totalFocusSessions,
                totalCompletedTasks,
                activeProjectsCount
            },
            projects: allProjectList,
            priorityDistribution
        });
    } catch (error) {
        console.error("Project analytics error:", error);
        res.status(500).json({
            message: "Failed to generate project analytics",
            error: error.message
        });
    }
}

export const HEATMAP_RANGES = {
    "30d": 30,
    "90d": 90,
    "365d": 365
};

/**
 * Calculates a transparent activity intensity level (0..4) based on real completed tasks and focus minutes.
 * 0: No activity
 * 1: Low (1 task completed OR 1-25 focus minutes)
 * 2: Moderate (2-3 tasks completed OR 26-50 focus minutes)
 * 3: High (4-5 tasks completed OR 51-100 focus minutes)
 * 4: Peak (6+ tasks completed OR >100 focus minutes)
 */
export function calculateHeatmapIntensity(completedTasks = 0, focusMinutes = 0) {
    if (completedTasks === 0 && focusMinutes === 0) return 0;
    if (completedTasks >= 6 || focusMinutes > 100) return 4;
    if (completedTasks >= 4 || focusMinutes >= 51) return 3;
    if (completedTasks >= 2 || focusMinutes >= 26) return 2;
    return 1;
}

/**
 * GET /api/analytics/heatmap
 * Scoped strictly to req.user._id
 * Accepts ?range=30d|90d|365d and ?timezoneOffset=<minutes>
 */
export async function getHeatmapAnalytics(req, res) {
    try {
        const userId = req.user._id;
        const rangeParam = (req.query.range || "30d").toLowerCase();

        if (!HEATMAP_RANGES[rangeParam]) {
            return res.status(400).json({
                message: "Invalid range parameter. Supported ranges are '30d', '90d', '365d'."
            });
        }

        const numDays = HEATMAP_RANGES[rangeParam];
        const timezoneOffset = req.query.timezoneOffset !== undefined ? Number(req.query.timezoneOffset) : 0;
        const offsetNum = isNaN(timezoneOffset) ? 0 : timezoneOffset;
        const offsetMs = offsetNum * 60 * 1000;

        // Local clock representation
        const now = new Date();
        const clientLocalTimeMs = now.getTime() - offsetMs;
        const clientLocalDate = new Date(clientLocalTimeMs);

        const currentYear = clientLocalDate.getUTCFullYear();
        const currentMonth = clientLocalDate.getUTCMonth();
        const currentDay = clientLocalDate.getUTCDate();

        // 1. Initialize Hourly Grid (7 days x 24 hours = 168 cells)
        const hourlyGrid = [];
        const hourlyGridMap = new Map();

        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                const cell = {
                    dayOfWeek: d,
                    dayName: DAY_NAMES[d],
                    hour: h,
                    formattedHour: `${String(h).padStart(2, "0")}:00`,
                    completedTasks: 0,
                    focusMinutes: 0,
                    focusSessions: 0,
                    totalEvents: 0
                };
                hourlyGrid.push(cell);
                hourlyGridMap.set(`${d}-${h}`, cell);
            }
        }

        // 2. Initialize Continuous Daily Matrix for selected range
        const dailyMatrix = [];
        const dailyMatrixMap = new Map();

        for (let i = numDays - 1; i >= 0; i--) {
            const bucketDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - i, 12, 0, 0, 0));
            const y = bucketDate.getUTCFullYear();
            const m = String(bucketDate.getUTCMonth() + 1).padStart(2, "0");
            const d = String(bucketDate.getUTCDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;
            const dayOfWeek = bucketDate.getUTCDay();

            const dayEntry = {
                date: dateStr,
                dayOfWeek,
                dayName: DAY_NAMES[dayOfWeek],
                completedTasks: 0,
                focusMinutes: 0,
                focusSessions: 0,
                totalEvents: 0,
                intensityLevel: 0
            };
            dailyMatrix.push(dayEntry);
            dailyMatrixMap.set(dateStr, dayEntry);
        }

        // 3. Compute overall UTC bounds for query window
        const firstDayDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - (numDays - 1), 0, 0, 0, 0));
        const rangeStartUtc = new Date(firstDayDate.getTime() + offsetMs);

        const lastDayDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 23, 59, 59, 999));
        const rangeEndUtc = new Date(lastDayDate.getTime() + offsetMs);

        // 4. Fetch authenticated user's completed tasks and work focus sessions in parallel
        const [completedTasks, focusSessions] = await Promise.all([
            Task.find({
                user: userId,
                completed: true,
                $or: [
                    { completedAt: { $gte: rangeStartUtc, $lte: rangeEndUtc } },
                    { completedAt: null, updatedAt: { $gte: rangeStartUtc, $lte: rangeEndUtc } }
                ]
            }).select("completedAt updatedAt"),
            FocusSession.find({
                user: userId,
                mode: "work",
                completedAt: { $gte: rangeStartUtc, $lte: rangeEndUtc }
            }).select("completedAt durationMinutes")
        ]);

        // 5. Populate Completed Tasks into hourlyGrid and dailyMatrix
        for (const task of completedTasks) {
            const taskDate = task.completedAt || task.updatedAt;
            if (!taskDate) continue;

            const localTimeMs = taskDate.getTime() - offsetMs;
            const localDate = new Date(localTimeMs);
            const dOfWeek = localDate.getUTCDay();
            const hour = localDate.getUTCHours();
            const dateStr = formatLocalDateString(taskDate, offsetNum);

            const hourlyCell = hourlyGridMap.get(`${dOfWeek}-${hour}`);
            if (hourlyCell) {
                hourlyCell.completedTasks += 1;
                hourlyCell.totalEvents += 1;
            }

            const dailyEntry = dailyMatrixMap.get(dateStr);
            if (dailyEntry) {
                dailyEntry.completedTasks += 1;
                dailyEntry.totalEvents += 1;
            }
        }

        // 6. Populate Focus Sessions into hourlyGrid and dailyMatrix
        for (const session of focusSessions) {
            if (!session.completedAt) continue;

            const sessDate = session.completedAt;
            const localTimeMs = sessDate.getTime() - offsetMs;
            const localDate = new Date(localTimeMs);
            const dOfWeek = localDate.getUTCDay();
            const hour = localDate.getUTCHours();
            const dateStr = formatLocalDateString(sessDate, offsetNum);
            const duration = session.durationMinutes || 0;

            const hourlyCell = hourlyGridMap.get(`${dOfWeek}-${hour}`);
            if (hourlyCell) {
                hourlyCell.focusMinutes += duration;
                hourlyCell.focusSessions += 1;
                hourlyCell.totalEvents += 1;
            }

            const dailyEntry = dailyMatrixMap.get(dateStr);
            if (dailyEntry) {
                dailyEntry.focusMinutes += duration;
                dailyEntry.focusSessions += 1;
                dailyEntry.totalEvents += 1;
            }
        }

        // 7. Calculate intensityLevel for each day in dailyMatrix
        for (const entry of dailyMatrix) {
            entry.intensityLevel = calculateHeatmapIntensity(entry.completedTasks, entry.focusMinutes);
        }

        // 8. Compute Summary Metrics
        let totalActiveDays = 0;
        let totalCompletedTasks = 0;
        let totalFocusMinutes = 0;
        let totalFocusSessions = 0;

        for (const entry of dailyMatrix) {
            if (entry.totalEvents > 0) {
                totalActiveDays += 1;
            }
            totalCompletedTasks += entry.completedTasks;
            totalFocusMinutes += entry.focusMinutes;
            totalFocusSessions += entry.focusSessions;
        }

        const consistencyRate = Math.round((totalActiveDays / numDays) * 100);

        // Day of week totals (0 to 6)
        const dayTotals = Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            dayName: DAY_NAMES[i],
            totalEvents: 0,
            focusMinutes: 0
        }));

        for (const cell of hourlyGrid) {
            dayTotals[cell.dayOfWeek].totalEvents += cell.totalEvents;
            dayTotals[cell.dayOfWeek].focusMinutes += cell.focusMinutes;
        }

        let mostActiveDayOfWeek = {
            dayOfWeek: null,
            dayName: null,
            totalEvents: 0,
            focusMinutes: 0
        };

        if (totalActiveDays > 0) {
            const sortedDays = [...dayTotals].sort((a, b) => {
                if (b.totalEvents !== a.totalEvents) return b.totalEvents - a.totalEvents;
                return b.focusMinutes - a.focusMinutes;
            });
            if (sortedDays[0].totalEvents > 0 || sortedDays[0].focusMinutes > 0) {
                mostActiveDayOfWeek = sortedDays[0];
            }
        }

        // Hour of day totals (0 to 23)
        const hourTotals = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            formattedHour: `${String(i).padStart(2, "0")}:00`,
            totalEvents: 0,
            focusMinutes: 0
        }));

        for (const cell of hourlyGrid) {
            hourTotals[cell.hour].totalEvents += cell.totalEvents;
            hourTotals[cell.hour].focusMinutes += cell.focusMinutes;
        }

        let mostActiveHour = {
            hour: null,
            formattedHour: null,
            totalEvents: 0
        };

        let peakFocusHour = {
            hour: null,
            formattedHour: null,
            focusMinutes: 0
        };

        if (totalActiveDays > 0) {
            const sortedHoursByEvents = [...hourTotals].sort((a, b) => b.totalEvents - a.totalEvents);
            if (sortedHoursByEvents[0].totalEvents > 0) {
                mostActiveHour = {
                    hour: sortedHoursByEvents[0].hour,
                    formattedHour: sortedHoursByEvents[0].formattedHour,
                    totalEvents: sortedHoursByEvents[0].totalEvents
                };
            }

            const sortedHoursByFocus = [...hourTotals].sort((a, b) => b.focusMinutes - a.focusMinutes);
            if (sortedHoursByFocus[0].focusMinutes > 0) {
                peakFocusHour = {
                    hour: sortedHoursByFocus[0].hour,
                    formattedHour: sortedHoursByFocus[0].formattedHour,
                    focusMinutes: sortedHoursByFocus[0].focusMinutes
                };
            }
        }

        res.json({
            range: rangeParam,
            startDate: dailyMatrix[0].date,
            endDate: dailyMatrix[dailyMatrix.length - 1].date,
            timezoneOffset: offsetNum,
            summary: {
                totalActiveDays,
                totalDaysInRange: numDays,
                consistencyRate,
                totalCompletedTasks,
                totalFocusMinutes,
                totalFocusSessions,
                mostActiveDayOfWeek,
                mostActiveHour,
                peakFocusHour
            },
            hourlyGrid,
            dailyMatrix
        });
    } catch (error) {
        console.error("Heatmap analytics error:", error);
        res.status(500).json({
            message: "Failed to generate heatmap analytics",
            error: error.message
        });
    }
}

