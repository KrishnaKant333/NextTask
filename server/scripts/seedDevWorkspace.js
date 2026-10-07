import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import FocusSession from "../models/FocusSession.js";

/**
 * Idempotent Development Workspace Seeding Utility
 * 
 * Usage:
 *   node scripts/seedDevWorkspace.js
 *   node scripts/seedDevWorkspace.js --reset (wipes dev user's tasks/projects and reseeds fresh)
 *   node scripts/seedDevWorkspace.js --reset-password (resets dev user's password)
 */

const DEV_EMAIL = "dev@nexttask.local";
const DEV_PASSWORD = "DevPassword#2026";
const DEV_NAME = "Development User";

const args = process.argv.slice(2);
const shouldReset = args.includes("--reset");
const shouldResetPassword = args.includes("--reset-password");

export async function seedDevWorkspace() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("FATAL: MONGO_URI is not set in environment.");
  }

  const isAlreadyConnected = mongoose.connection.readyState === 1;
  if (!isAlreadyConnected) {
    await mongoose.connect(mongoUri);
  }

  try {
    console.log("=== NextTask Development Workspace Seeding ===");

    // 1. Find or create Dev User
    let devUser = await User.findOne({ email: DEV_EMAIL });

    if (!devUser) {
      console.log(`[SEED] Creating development user: ${DEV_EMAIL}`);
      devUser = await User.create({
        name: DEV_NAME,
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        avatarColor: "#38bdf8",
      });
      console.log(`  -> Created user ID: ${devUser._id}`);
    } else {
      const isPasswordValid = await devUser.matchPassword(DEV_PASSWORD);
      if (!isPasswordValid || shouldResetPassword) {
        console.log(`[SEED] Resetting password for ${DEV_EMAIL} to match development credentials`);
        devUser.password = DEV_PASSWORD;
        await devUser.save();
        console.log("  -> Password reset successfully.");
      } else {
        console.log(`[SEED] Development user exists and password is verified (${DEV_EMAIL})`);
      }
    }

    const userId = devUser._id;

    // Optional Reset
    if (shouldReset) {
      console.log(`[SEED --reset] Cleaning existing workspace data for ${DEV_EMAIL}...`);
      await FocusSession.deleteMany({ user: userId });
      await Task.deleteMany({ user: userId });
      await Project.deleteMany({ user: userId });
      console.log("  -> Existing dev tasks, projects, and focus sessions cleared.");
    }

    // 2. Ensure Projects
    const existingProjects = await Project.find({ user: userId });
    let projectMap = {};

    if (existingProjects.length === 0) {
      console.log("[SEED] Creating 3 core development projects...");
      const projectsToCreate = [
        {
          name: "Product Launch",
          description: "Q4 Core product release milestones and architecture",
          color: "#38bdf8",
          user: userId,
        },
        {
          name: "Client Portal",
          description: "Frontend deliverables and customer dashboard",
          color: "#818cf8",
          user: userId,
        },
        {
          name: "Personal",
          description: "Personal development, routine, and reading",
          color: "#34d399",
          user: userId,
        },
      ];

      const created = await Project.insertMany(projectsToCreate);
      created.forEach((p) => {
        projectMap[p.name] = p._id;
        console.log(`  -> Project: "${p.name}" (${p._id})`);
      });
    } else {
      console.log(`[SEED] ${existingProjects.length} projects already exist for development user.`);
      existingProjects.forEach((p) => {
        projectMap[p.name] = p._id;
      });
    }

    // 3. Ensure Tasks
    const existingTasks = await Task.find({ user: userId });
    const todayISO = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0];

    if (existingTasks.length === 0) {
      console.log("[SEED] Creating 8 representative development tasks...");
      const tasksToCreate = [
        {
          title: "Finalize Q4 product launch architecture",
          completed: false,
          priority: "HIGH",
          dueDate: todayISO,
          projectId: projectMap["Product Launch"] || null,
          tags: ["roadmap", "backend"],
          estimatedPomodoros: 4,
          pomodorosCompleted: 2,
          subtasks: [
            { title: "Define multi-tenant database indexing strategy", completed: true },
            { title: "Review stateless JWT token expiration policy", completed: true },
            { title: "Draft cross-tab storage synchronization spec", completed: false },
          ],
          user: userId,
        },
        {
          title: "Review API authentication security & JWT policies",
          completed: false,
          priority: "HIGH",
          dueDate: tomorrowISO,
          projectId: projectMap["Product Launch"] || null,
          tags: ["security", "audit"],
          estimatedPomodoros: 2,
          pomodorosCompleted: 1,
          subtasks: [
            { title: "Audit bcrypt work factor and timing defense", completed: true },
            { title: "Verify fail-fast startup guard on missing secret", completed: false },
          ],
          user: userId,
        },
        {
          title: "Refactor task list row styling to Studio Slate",
          completed: true,
          priority: "MEDIUM",
          dueDate: todayISO,
          projectId: projectMap["Client Portal"] || null,
          tags: ["frontend", "ui"],
          estimatedPomodoros: 3,
          pomodorosCompleted: 3,
          subtasks: [
            { title: "Eliminate neon borders and floating card clutter", completed: true },
            { title: "Apply hairline borders and tabular numbers", completed: true },
          ],
          user: userId,
        },
        {
          title: "Implement real-time search and filter toolbar",
          completed: true,
          priority: "MEDIUM",
          dueDate: null,
          projectId: projectMap["Client Portal"] || null,
          tags: ["frontend"],
          estimatedPomodoros: 2,
          pomodorosCompleted: 2,
          subtasks: [],
          user: userId,
        },
        {
          title: "Configure production Docker build & environment variables",
          completed: false,
          priority: "HIGH",
          dueDate: null,
          projectId: projectMap["Client Portal"] || null,
          tags: ["devops"],
          estimatedPomodoros: 3,
          pomodorosCompleted: 0,
          subtasks: [],
          user: userId,
        },
        {
          title: "Morning deep focus & inbox zero review",
          completed: true,
          priority: "LOW",
          dueDate: todayISO,
          projectId: projectMap["Personal"] || null,
          tags: ["routine"],
          estimatedPomodoros: 1,
          pomodorosCompleted: 1,
          subtasks: [],
          user: userId,
        },
        {
          title: "Read 30 minutes of High Performance Browser Networking",
          completed: false,
          priority: "LOW",
          dueDate: todayISO,
          projectId: projectMap["Personal"] || null,
          tags: ["learning"],
          estimatedPomodoros: 1,
          pomodorosCompleted: 0,
          subtasks: [],
          user: userId,
        },
        {
          title: "Plan next week focus sessions and sprint priorities",
          completed: false,
          priority: "MEDIUM",
          dueDate: tomorrowISO,
          projectId: null, // Inbox
          tags: ["planning"],
          estimatedPomodoros: 2,
          pomodorosCompleted: 0,
          subtasks: [],
          user: userId,
        },
      ];

      const createdTasks = await Task.insertMany(tasksToCreate);
      console.log(`  -> Created ${createdTasks.length} tasks.`);
    } else {
      console.log(`[SEED] ${existingTasks.length} tasks already exist for development user.`);
    }

    // 4. Ensure Focus Sessions for Today
    const existingSessions = await FocusSession.find({ user: userId });
    if (existingSessions.length === 0) {
      console.log("[SEED] Creating sample focus sessions for today's metrics...");
      const tasks = await Task.find({ user: userId });
      const firstTask = tasks[0] || null;
      const secondTask = tasks[1] || null;

      const sessionsToCreate = [
        {
          taskId: firstTask?._id || null,
          projectId: firstTask?.projectId || null,
          durationMinutes: 25,
          mode: "work",
          completedAt: new Date(Date.now() - 3600 * 1000 * 2), // 2h ago
          user: userId,
        },
        {
          taskId: secondTask?._id || null,
          projectId: secondTask?.projectId || null,
          durationMinutes: 25,
          mode: "work",
          completedAt: new Date(Date.now() - 3600 * 1000 * 1), // 1h ago
          user: userId,
        },
      ];

      await FocusSession.insertMany(sessionsToCreate);
      console.log("  -> Created 2 focus sessions (50m total focus time today).");
    } else {
      console.log(`[SEED] ${existingSessions.length} focus sessions already exist.`);
    }

    // Verification summary
    const finalProjects = await Project.countDocuments({ user: userId });
    const finalTasks = await Task.countDocuments({ user: userId });
    const finalSessions = await FocusSession.countDocuments({ user: userId });

    console.log("\n=== SEED SUMMARY ===");
    console.log(`User:     ${devUser.email} (${devUser.name})`);
    console.log(`Password: ${DEV_PASSWORD}`);
    console.log(`Projects: ${finalProjects}`);
    console.log(`Tasks:    ${finalTasks}`);
    console.log(`Sessions: ${finalSessions}`);
    console.log("====================\n");

    return {
      userId: devUser._id,
      email: devUser.email,
      projects: finalProjects,
      tasks: finalTasks,
      sessions: finalSessions,
    };
  } finally {
    if (!isAlreadyConnected) {
      await mongoose.disconnect();
    }
  }
}

// Direct execution from CLI
if (process.argv[1]?.endsWith("seedDevWorkspace.js")) {
  seedDevWorkspace()
    .then(() => {
      console.log("[SUCCESS] Development workspace seed completed cleanly.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[FATAL] Seed error:", err);
      process.exit(1);
    });
}
