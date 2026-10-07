import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";
import Task from "./models/Task.js";
import Project from "./models/Project.js";
import FocusSession from "./models/FocusSession.js";

const BASE_URL = "http://localhost:5000/api";

async function runMultiTenancyTests() {
  console.log("=== STARTING MILESTONE 6.2 MULTI-TENANCY & ISOLATION TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@example.com`;
  const userBEmail = `user_b_${timestamp}@example.com`;
  const password = "TenantPassword#2026";

  let tokenA = null;
  let userAId = null;
  let tokenB = null;
  let userBId = null;

  let projectAId = null;
  let projectBId = null;
  let taskAId = null;
  let taskBId = null;
  let subtaskBId = null;

  try {
    // -------------------------------------------------------------
    // Group 1: Unauthenticated Route Protection (401 Rejection)
    // -------------------------------------------------------------
    console.log("\n[Group 1] Route Protection without Bearer Token");
    const endpoints = [
      { method: "GET", path: "/tasks" },
      { method: "POST", path: "/tasks", body: { title: "No Auth Task" } },
      { method: "GET", path: "/projects" },
      { method: "POST", path: "/projects", body: { name: "No Auth Project" } },
      { method: "GET", path: "/focus-sessions" },
      { method: "GET", path: "/focus-sessions/today" },
      { method: "POST", path: "/focus-sessions", body: { durationMinutes: 25 } },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert(res.status === 401, `${ep.method} ${ep.path} rejected with 401 Unauthorized`);
    }

    // -------------------------------------------------------------
    // Group 2: Register Two Distinct Users
    // -------------------------------------------------------------
    console.log("\n[Group 2] Register User A and User B");
    const regA = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User A", email: userAEmail, password }),
    });
    const dataA = await regA.json();
    assert(regA.status === 201, `User A registered successfully`);
    tokenA = dataA.token;
    userAId = dataA._id;

    const regB = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User B", email: userBEmail, password }),
    });
    const dataB = await regB.json();
    assert(regB.status === 201, `User B registered successfully`);
    tokenB = dataB.token;
    userBId = dataB._id;

    const headersA = { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` };
    const headersB = { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` };

    // -------------------------------------------------------------
    // Group 3: Project Isolation & Per-User Uniqueness
    // -------------------------------------------------------------
    console.log("\n[Group 3] Project Scoping & Isolation");
    // User A creates Project A
    const resProjA = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ name: "Project Alpha", color: "#10b981" }),
    });
    const dataProjA = await resProjA.json();
    assert(resProjA.status === 201, `User A created Project Alpha`);
    projectAId = dataProjA._id;

    // User B creates Project B
    const resProjB = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify({ name: "Project Beta", color: "#6366f1" }),
    });
    const dataProjB = await resProjB.json();
    assert(resProjB.status === 201, `User B created Project Beta`);
    projectBId = dataProjB._id;

    // Both users create a project with the same name "Shared Workspace"
    const resSharedA = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ name: "Shared Workspace" }),
    });
    assert(resSharedA.status === 201, `User A created 'Shared Workspace'`);

    const resSharedB = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify({ name: "Shared Workspace" }),
    });
    assert(resSharedB.status === 201, `User B created 'Shared Workspace' without global naming collision`);

    // User A should NOT see Project Beta
    const getProjA = await fetch(`${BASE_URL}/projects`, { headers: headersA });
    const listProjA = await getProjA.json();
    const projANames = listProjA.map((p) => p.name);
    assert(projANames.includes("Project Alpha"), `User A sees Project Alpha`);
    assert(!projANames.includes("Project Beta"), `User A CANNOT see User B's Project Beta`);

    // User B should NOT see Project Alpha
    const getProjB = await fetch(`${BASE_URL}/projects`, { headers: headersB });
    const listProjB = await getProjB.json();
    const projBNames = listProjB.map((p) => p.name);
    assert(projBNames.includes("Project Beta"), `User B sees Project Beta`);
    assert(!projBNames.includes("Project Alpha"), `User B CANNOT see User A's Project Alpha`);

    // User A cross-tenant mutation attempts on Project B
    const resCrossUpdateProj = await fetch(`${BASE_URL}/projects/${projectBId}`, {
      method: "PUT",
      headers: headersA,
      body: JSON.stringify({ name: "Hacked Project" }),
    });
    assert(resCrossUpdateProj.status === 404, `User A cannot update User B's project (returns 404)`);

    const resCrossDeleteProj = await fetch(`${BASE_URL}/projects/${projectBId}`, {
      method: "DELETE",
      headers: headersA,
    });
    assert(resCrossDeleteProj.status === 404, `User A cannot delete User B's project (returns 404)`);

    // Verify Project B is untouched
    const verifyProjB = await fetch(`${BASE_URL}/projects`, { headers: headersB });
    const checkProjB = await verifyProjB.json();
    const foundB = checkProjB.find((p) => p._id === projectBId);
    assert(foundB && foundB.name === "Project Beta", `User B's Project Beta remained safe and intact`);

    // -------------------------------------------------------------
    // Group 4: Task Isolation & Mutation Guards
    // -------------------------------------------------------------
    console.log("\n[Group 4] Task Scoping & Isolation");
    // User A creates Task A
    const resTaskA = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        title: "Task Owned By User A",
        projectId: projectAId,
        priority: "high",
        subtasks: [{ title: "Subtask A1" }],
      }),
    });
    const dataTaskA = await resTaskA.json();
    assert(resTaskA.status === 201, `User A created Task A`);
    taskAId = dataTaskA._id;

    // User B creates Task B
    const resTaskB = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify({
        title: "Task Owned By User B",
        projectId: projectBId,
        priority: "medium",
        subtasks: [{ title: "Subtask B1" }],
      }),
    });
    const dataTaskB = await resTaskB.json();
    assert(resTaskB.status === 201, `User B created Task B`);
    taskBId = dataTaskB._id;
    subtaskBId = dataTaskB.subtasks[0]._id;

    // User A fetches tasks -> receives only Task A
    const getTasksA = await fetch(`${BASE_URL}/tasks`, { headers: headersA });
    const listTasksA = await getTasksA.json();
    const taskAIds = listTasksA.map((t) => t._id);
    assert(taskAIds.includes(taskAId), `User A sees Task A`);
    assert(!taskAIds.includes(taskBId), `User A CANNOT see User B's Task B`);

    // User B fetches tasks -> receives only Task B
    const getTasksB = await fetch(`${BASE_URL}/tasks`, { headers: headersB });
    const listTasksB = await getTasksB.json();
    const taskBIds = listTasksB.map((t) => t._id);
    assert(taskBIds.includes(taskBId), `User B sees Task B`);
    assert(!taskBIds.includes(taskAId), `User B CANNOT see User A's Task A`);

    // Cross-tenant Task Mutations:
    // 1. User A tries to edit Task B
    const editTaskB = await fetch(`${BASE_URL}/tasks/${taskBId}`, {
      method: "PUT",
      headers: headersA,
      body: JSON.stringify({ title: "Infiltrated Task Title" }),
    });
    assert(editTaskB.status === 404, `User A cannot update Task B (returns 404)`);

    // 2. User A tries to increment pomodoro on Task B
    const incTaskB = await fetch(`${BASE_URL}/tasks/${taskBId}/pomodoro`, {
      method: "PATCH",
      headers: headersA,
    });
    assert(incTaskB.status === 404, `User A cannot increment pomodoro on Task B (returns 404)`);

    // 3. User A tries to toggle subtask on Task B
    const toggleSubB = await fetch(`${BASE_URL}/tasks/${taskBId}/subtasks/${subtaskBId}/toggle`, {
      method: "PATCH",
      headers: headersA,
    });
    assert(toggleSubB.status === 404, `User A cannot toggle subtask on Task B (returns 404)`);

    // 4. User A tries bulk update on Task B
    const bulkUpdate = await fetch(`${BASE_URL}/tasks/bulk-update`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ ids: [taskBId], updates: { completed: true } }),
    });
    const bulkUpdateData = await bulkUpdate.json();
    assert(bulkUpdateData.tasks.length === 0, `User A bulk update did NOT affect User B's task`);

    // 5. User A tries bulk delete on Task B
    const bulkDelete = await fetch(`${BASE_URL}/tasks/bulk-delete`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ ids: [taskBId] }),
    });
    const bulkDeleteData = await bulkDelete.json();
    assert(bulkDeleteData.deletedCount === 0, `User A bulk delete deleted 0 of User B's tasks`);

    // 6. User A tries single DELETE on Task B
    const delTaskB = await fetch(`${BASE_URL}/tasks/${taskBId}`, {
      method: "DELETE",
      headers: headersA,
    });
    assert(delTaskB.status === 404, `User A cannot delete Task B (returns 404)`);

    // Verify User B's Task B remains intact and unmutated
    const verifyTasksB = await fetch(`${BASE_URL}/tasks`, { headers: headersB });
    const checkTasksB = await verifyTasksB.json();
    const verifiedB = checkTasksB.find((t) => t._id === taskBId);
    assert(verifiedB && verifiedB.title === "Task Owned By User B", `Task B remained intact`);
    assert(verifiedB && verifiedB.pomodorosCompleted === 0, `Task B pomodoros unchanged (0)`);
    assert(verifiedB && verifiedB.subtasks[0].completed === false, `Task B subtask completed unchanged (false)`);

    // -------------------------------------------------------------
    // Group 5: Focus Session Isolation & Metrics Scoping
    // -------------------------------------------------------------
    console.log("\n[Group 5] Focus Session Scoping & Metrics Isolation");
    // User A logs 25m session on Task A
    const logSessA = await fetch(`${BASE_URL}/focus-sessions`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ taskId: taskAId, durationMinutes: 25, mode: "work" }),
    });
    assert(logSessA.status === 201, `User A logged 25m focus session`);

    // User B logs 45m session on Task B
    const logSessB = await fetch(`${BASE_URL}/focus-sessions`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify({ taskId: taskBId, durationMinutes: 45, mode: "work" }),
    });
    assert(logSessB.status === 201, `User B logged 45m focus session`);

    // Check User A's today metrics
    const metricsA = await (await fetch(`${BASE_URL}/focus-sessions/today`, { headers: headersA })).json();
    assert(metricsA.totalFocusMinutesToday === 25, `User A sees exactly 25m focus time (not User B's 45m)`);
    assert(metricsA.sessionsCompletedToday === 1, `User A sees 1 session completed today`);
    assert(metricsA.recentSessions[0].taskId._id === taskAId, `User A recent session is Task A`);

    // Check User B's today metrics
    const metricsB = await (await fetch(`${BASE_URL}/focus-sessions/today`, { headers: headersB })).json();
    assert(metricsB.totalFocusMinutesToday === 45, `User B sees exactly 45m focus time (not User A's 25m)`);
    assert(metricsB.sessionsCompletedToday === 1, `User B sees 1 session completed today`);
    assert(metricsB.recentSessions[0].taskId._id === taskBId, `User B recent session is Task B`);

    // Check Focus History
    const historyA = await (await fetch(`${BASE_URL}/focus-sessions`, { headers: headersA })).json();
    const historyB = await (await fetch(`${BASE_URL}/focus-sessions`, { headers: headersB })).json();
    assert(historyA.length === 1 && historyA[0].taskId._id === taskAId, `User A history isolated`);
    assert(historyB.length === 1 && historyB[0].taskId._id === taskBId, `User B history isolated`);

  } finally {
    // -------------------------------------------------------------
    // Cleanup test artifacts
    // -------------------------------------------------------------
    console.log("\n[Cleanup] Cleaning up multi-tenant test data...");
    await mongoose.connect(process.env.MONGO_URI);
    if (userAId) {
      await Task.deleteMany({ user: userAId });
      await Project.deleteMany({ user: userAId });
      await FocusSession.deleteMany({ user: userAId });
      await User.findByIdAndDelete(userAId);
    }
    if (userBId) {
      await Task.deleteMany({ user: userBId });
      await Project.deleteMany({ user: userBId });
      await FocusSession.deleteMany({ user: userBId });
      await User.findByIdAndDelete(userBId);
    }
    console.log("  Cleaned up test users and their scoped documents.");
    await mongoose.disconnect();
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runMultiTenancyTests().catch((err) => {
  console.error("Test threw unexpected error:", err);
  process.exit(1);
});
