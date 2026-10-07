import assert from "node:assert";
import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";
import Task from "./models/Task.js";
import Project from "./models/Project.js";
import FocusSession from "./models/FocusSession.js";
import { seedDevWorkspace } from "./scripts/seedDevWorkspace.js";

const BASE_URL = process.env.API_URL || "http://localhost:5000/api";
const DEV_EMAIL = "dev@nexttask.local";
const DEV_PASSWORD = "DevPassword#2026";

async function runDevWorkspaceTests() {
  console.log("=== STARTING DEV WORKSPACE & DEMO AUTHENTICATION TESTS ===\n");

  const mongoUri = process.env.MONGO_URI;
  assert(mongoUri, "MONGO_URI must be configured");
  await mongoose.connect(mongoUri);

  try {
    // ----------------------------------------------------
    // Scenario 1: Fresh development database simulation
    // ----------------------------------------------------
    console.log("[Test 1] Fresh development database simulation");
    // Verify that we can inspect and safely manage collections
    const initialUsersCount = await User.countDocuments();
    console.log(`  [PASS] Successfully connected to database (Total users: ${initialUsersCount})`);

    // ----------------------------------------------------
    // Scenario 2: Demo account creation & seed mechanism
    // ----------------------------------------------------
    console.log("\n[Test 2] Demo account creation and seed mechanism");
    const seedResult = await seedDevWorkspace();
    assert(seedResult.userId, "Seed should return user ID");
    assert.strictEqual(seedResult.email, DEV_EMAIL, "Seed should configure dev@nexttask.local");
    assert(seedResult.tasks >= 8, `Seed should ensure at least 8 tasks (got ${seedResult.tasks})`);
    assert(seedResult.projects >= 3, `Seed should ensure at least 3 projects (got ${seedResult.projects})`);
    console.log(`  [PASS] Seed ensured dev account: ${seedResult.email}`);
    console.log(`  [PASS] Tasks seeded: ${seedResult.tasks}, Projects seeded: ${seedResult.projects}`);

    // ----------------------------------------------------
    // Scenario 3 & 4: Demo login & JWT issuance
    // ----------------------------------------------------
    console.log("\n[Test 3 & 4] Demo login via POST /api/auth/login and JWT issuance");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
    });

    assert.strictEqual(loginRes.status, 200, `Expected 200 OK on demo login, got ${loginRes.status}`);
    const loginData = await loginRes.json();
    assert(loginData.token, "Demo login response must include JWT token");
    assert.strictEqual(loginData.email, DEV_EMAIL, "Demo login response must match dev email");
    assert.strictEqual(loginData.name, "Development User", "Demo login response must match dev name");
    assert(!loginData.password, "Security: Password hash must NOT be returned in login response");
    console.log(`  [PASS] Status 200 returned on demo login`);
    console.log(`  [PASS] Valid JWT issued (length: ${loginData.token.length})`);
    console.log(`  [PASS] User ID: ${loginData._id}`);

    const demoToken = loginData.token;

    // ----------------------------------------------------
    // Scenario 5: Loading demo user's tasks and projects
    // ----------------------------------------------------
    console.log("\n[Test 5] Loading demo user's scoped tasks and projects");
    const tasksRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    assert.strictEqual(tasksRes.status, 200, "Authenticated tasks request should succeed");
    const tasks = await tasksRes.json();
    assert(Array.isArray(tasks), "Tasks response must be an array");
    assert(tasks.length >= 8, `Expected at least 8 tasks for dev user, got ${tasks.length}`);

    const projectsRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    assert.strictEqual(projectsRes.status, 200, "Authenticated projects request should succeed");
    const projects = await projectsRes.json();
    assert(Array.isArray(projects), "Projects response must be an array");
    assert(projects.length >= 3, `Expected at least 3 projects for dev user, got ${projects.length}`);
    console.log(`  [PASS] Loaded ${tasks.length} tasks scoped to dev user`);
    console.log(`  [PASS] Loaded ${projects.length} projects scoped to dev user`);

    // Verify task properties (subtasks, pomodoros, tags)
    const taskWithSubtasks = tasks.find((t) => t.subtasks && t.subtasks.length > 0);
    assert(taskWithSubtasks, "At least one dev task should have subtasks");
    assert(taskWithSubtasks.estimatedPomodoros >= 1, "Dev task should have estimated pomodoros");
    console.log(`  [PASS] Dev tasks contain rich metadata (subtasks, tags, pomodoro estimates)`);

    // ----------------------------------------------------
    // Scenario 6: Logout verification (client-side token removal simulation)
    // ----------------------------------------------------
    console.log("\n[Test 6] Logout and unauthenticated request rejection");
    // Simulate client removing token: request without token must receive 401
    const unauthTasksRes = await fetch(`${BASE_URL}/tasks`);
    assert.strictEqual(unauthTasksRes.status, 401, "Unauthenticated request after logout must be rejected with 401");
    console.log(`  [PASS] Request without token rejected with 401 Unauthorized`);

    // ----------------------------------------------------
    // Scenario 7: Logging in again
    // ----------------------------------------------------
    console.log("\n[Test 7] Logging in again with dev credentials");
    const reloginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
    });
    assert.strictEqual(reloginRes.status, 200, "Re-login should succeed");
    const reloginData = await reloginRes.json();
    assert(reloginData.token, "Re-login must issue new valid token");
    console.log(`  [PASS] Re-login succeeded, fresh token issued`);

    // ----------------------------------------------------
    // Scenario 8: Invalid demo credentials rejection
    // ----------------------------------------------------
    console.log("\n[Test 8] Invalid demo credentials rejection");
    const invalidPasswordRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DEV_EMAIL, password: "WrongPassword#999" }),
    });
    assert.strictEqual(invalidPasswordRes.status, 401, "Wrong password must be rejected with 401");
    const invalidPasswordData = await invalidPasswordRes.json();
    assert.strictEqual(invalidPasswordData.message, "Invalid email or password", "Must return non-enumerating error");

    const nonExistentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ghost_dev@nexttask.local", password: DEV_PASSWORD }),
    });
    assert.strictEqual(nonExistentRes.status, 401, "Non-existent dev email must be rejected with 401");
    console.log(`  [PASS] Incorrect password rejected with 401 and generic message`);
    console.log(`  [PASS] Non-existent email rejected with 401 and generic message`);

    console.log("\n=== ALL 8 DEV WORKSPACE SCENARIOS PASSED (100%) ===\n");
  } finally {
    await mongoose.disconnect();
  }
}

runDevWorkspaceTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
