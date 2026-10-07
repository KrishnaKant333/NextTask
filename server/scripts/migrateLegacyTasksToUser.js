import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";

/**
 * Migration Script: Safely assign unowned legacy tasks, projects, and focus sessions to a target user.
 * 
 * Usage:
 *   node scripts/migrateLegacyTasksToUser.js --dry-run
 *   node scripts/migrateLegacyTasksToUser.js --email user@example.com
 *   node scripts/migrateLegacyTasksToUser.js --create-dev-user
 */

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const createDevUser = args.includes("--create-dev-user");
const emailIndex = args.indexOf("--email");
const emailArg = emailIndex !== -1 && args[emailIndex + 1] ? args[emailIndex + 1].trim().toLowerCase() : null;

async function runMigration() {
  console.log("=== NextTask Legacy Data Migration ===");
  if (isDryRun) {
    console.log("[MODE] DRY RUN — No database modifications will be applied.");
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("FATAL: MONGO_URI is not set in environment.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  try {
    // 1. Scan for unowned documents
    const unownedFilter = { $or: [{ user: { $exists: false } }, { user: null }] };
    const unownedTasksCount = await db.collection("tasks").countDocuments(unownedFilter);
    const unownedProjectsCount = await db.collection("projects").countDocuments(unownedFilter);
    const unownedSessionsCount = await db.collection("focussessions").countDocuments(unownedFilter);

    console.log(`\nUnowned documents discovered:`);
    console.log(`  - Tasks:          ${unownedTasksCount}`);
    console.log(`  - Projects:       ${unownedProjectsCount}`);
    console.log(`  - Focus Sessions: ${unownedSessionsCount}`);

    const totalUnowned = unownedTasksCount + unownedProjectsCount + unownedSessionsCount;

    // Ensure development account is created if specifically requested
    if (createDevUser) {
      const devEmail = "dev@nexttask.local";
      let existingDevUser = await User.findOne({ email: devEmail });
      if (!existingDevUser) {
        console.log(`\n--create-dev-user specified. Creating default development account: ${devEmail}`);
        existingDevUser = await User.create({
          name: "Development User",
          email: devEmail,
          password: "DevPassword#2026",
        });
        console.log(`Created user ${existingDevUser.email} (ID: ${existingDevUser._id})`);
      } else {
        console.log(`\nDevelopment user ${devEmail} already exists (ID: ${existingDevUser._id})`);
      }
    }

    if (totalUnowned === 0) {
      console.log("\n[SUCCESS] No unowned documents found. Database is already fully multi-tenant!");
      return;
    }

    if (isDryRun) {
      console.log(`\n[DRY RUN] ${totalUnowned} documents require assignment to a user.`);
      console.log("Run with --create-dev-user or --email <email> to apply migration.");
      return;
    }

    // 2. Resolve Target User
    let targetUser = null;

    if (emailArg) {
      targetUser = await User.findOne({ email: emailArg });
      if (!targetUser) {
        console.error(`ERROR: User with email "${emailArg}" was not found.`);
        process.exit(1);
      }
    } else if (createDevUser || (await User.countDocuments()) === 0) {
      const devEmail = "dev@nexttask.local";
      targetUser = await User.findOne({ email: devEmail });
      if (!targetUser) {
        console.log(`\nNo users exist or --create-dev-user specified. Creating default development account: ${devEmail}`);
        targetUser = await User.create({
          name: "Development User",
          email: devEmail,
          password: "DevPassword#2026",
        });
        console.log(`Created user ${targetUser.email} (ID: ${targetUser._id})`);
      }
    } else {
      // Find the first user in the database as fallback
      targetUser = await User.findOne().sort({ createdAt: 1 });
      console.log(`\nNo email specified. Using existing user: ${targetUser.email} (ID: ${targetUser._id})`);
    }

    console.log(`\nAssigning ${totalUnowned} unowned documents to user: ${targetUser.email} (${targetUser._id})...`);

    // 3. Perform batch updates
    const taskResult = await db.collection("tasks").updateMany(unownedFilter, {
      $set: { user: targetUser._id },
    });

    const projectResult = await db.collection("projects").updateMany(unownedFilter, {
      $set: { user: targetUser._id },
    });

    const sessionResult = await db.collection("focussessions").updateMany(unownedFilter, {
      $set: { user: targetUser._id },
    });

    console.log("\nMigration Results:");
    console.log(`  - Tasks updated:          ${taskResult.modifiedCount}`);
    console.log(`  - Projects updated:       ${projectResult.modifiedCount}`);
    console.log(`  - Focus Sessions updated: ${sessionResult.modifiedCount}`);
    console.log(`\n[SUCCESS] Successfully migrated legacy data to ${targetUser.email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

runMigration().catch((err) => {
  console.error("Migration failed with error:", err);
  process.exit(1);
});
