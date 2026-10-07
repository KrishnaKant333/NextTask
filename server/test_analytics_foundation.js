import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

async function run() {
    console.log("=== Testing Milestone 7.1 Analytics Foundation ===");

    // 1. Unauthenticated request rejection
    console.log("1. Verifying unauthenticated request is rejected with 401...");
    const unauthRes = await fetch(`${BASE_URL}/analytics/summary`);
    assert.strictEqual(unauthRes.status, 401, `Expected 401, got ${unauthRes.status}`);
    console.log("   Passed: 401 received.");

    // Helper to register a test user
    const timestamp = Date.now();
    async function createTestUser(suffix) {
        const email = `analytics_test_${timestamp}_${suffix}@example.com`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `User ${suffix}`,
                email,
                password: "Password123!"
            })
        });
        const data = await regRes.json();
        assert.strictEqual(regRes.status, 201, `Failed to register user: ${JSON.stringify(data)}`);
        return { token: data.token, user: data.user };
    }

    console.log("2. Creating Test Users A and B...");
    const userA = await createTestUser("A");
    const userB = await createTestUser("B");
    console.log("   Passed: Users created.");

    const headersA = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userA.token}`
    };
    const headersB = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userB.token}`
    };

    // 3. User A Empty Dataset
    console.log("3. Verifying User A empty state analytics...");
    const emptyRes = await fetch(`${BASE_URL}/analytics/summary?timezoneOffset=0`, { headers: headersA });
    assert.strictEqual(emptyRes.status, 200);
    const emptyData = await emptyRes.json();
    assert.strictEqual(emptyData.taskMetrics.totalTasks, 0);
    assert.strictEqual(emptyData.taskMetrics.completedTasks, 0);
    assert.strictEqual(emptyData.taskMetrics.activeTasks, 0);
    assert.strictEqual(emptyData.taskMetrics.completionRate, 0);
    assert.strictEqual(emptyData.taskMetrics.overdueTasks, 0);
    assert.strictEqual(emptyData.focusMetrics.totalFocusMinutes, 0);
    assert.strictEqual(emptyData.focusMetrics.totalFocusSessions, 0);
    assert.strictEqual(emptyData.todayStats.tasksCompletedToday, 0);
    assert.strictEqual(emptyData.todayStats.focusMinutesToday, 0);
    assert.strictEqual(emptyData.streakDays, 0);
    console.log("   Passed: Empty state metrics all 0.");

    // 4. User A creates task and verifies completedAt is null
    console.log("4. Creating task and verifying completedAt lifecycle...");
    const task1Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 1",
            priority: "high"
        })
    });
    assert.strictEqual(task1Res.status, 201);
    const task1 = await task1Res.json();
    assert.strictEqual(task1.completed, false);
    assert.strictEqual(task1.completedAt, null);

    // 5. User A completes task 1
    const updateRes = await fetch(`${BASE_URL}/tasks/${task1._id}`, {
        method: "PUT",
        headers: headersA,
        body: JSON.stringify({ completed: true })
    });
    assert.strictEqual(updateRes.status, 200);
    const updatedTask1 = await updateRes.json();
    assert.strictEqual(updatedTask1.completed, true);
    assert.ok(updatedTask1.completedAt !== null, "completedAt should be populated");
    console.log("   Passed: completedAt timestamp populated on task completion.");

    // 6. User A logs a 25-minute focus session
    console.log("5. Logging focus session...");
    const focusRes = await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 25,
            mode: "work",
            taskId: task1._id
        })
    });
    assert.strictEqual(focusRes.status, 201);

    // 7. User A creates an overdue active task (due yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const task2Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 2 Overdue",
            dueDate: yesterday.toISOString()
        })
    });
    assert.strictEqual(task2Res.status, 201);

    // 8. User A creates a future active task (due tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const task3Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 3 Future",
            dueDate: tomorrow.toISOString()
        })
    });
    assert.strictEqual(task3Res.status, 201);

    // 9. Verify User A analytics math
    console.log("6. Verifying User A aggregated analytics...");
    const metricsResA = await fetch(`${BASE_URL}/analytics/summary?timezoneOffset=0`, { headers: headersA });
    assert.strictEqual(metricsResA.status, 200);
    const metricsA = await metricsResA.json();

    assert.strictEqual(metricsA.taskMetrics.totalTasks, 3);
    assert.strictEqual(metricsA.taskMetrics.completedTasks, 1);
    assert.strictEqual(metricsA.taskMetrics.activeTasks, 2);
    assert.strictEqual(metricsA.taskMetrics.completionRate, 33);
    assert.strictEqual(metricsA.taskMetrics.overdueTasks, 1);
    assert.strictEqual(metricsA.focusMetrics.totalFocusMinutes, 25);
    assert.strictEqual(metricsA.focusMetrics.totalFocusHours, 0.4);
    assert.strictEqual(metricsA.focusMetrics.totalFocusSessions, 1);
    assert.strictEqual(metricsA.todayStats.tasksCompletedToday, 1);
    assert.strictEqual(metricsA.todayStats.focusMinutesToday, 25);
    assert.strictEqual(metricsA.todayStats.focusSessionsToday, 1);
    assert.strictEqual(metricsA.streakDays, 1);
    console.log("   Passed: User A metrics match exact mathematical expectations.");

    // 10. Multi-tenancy check: User B has 0 metrics
    console.log("7. Verifying multi-tenancy isolation for User B...");
    const metricsResB = await fetch(`${BASE_URL}/analytics/summary?timezoneOffset=0`, { headers: headersB });
    assert.strictEqual(metricsResB.status, 200);
    const metricsB = await metricsResB.json();

    assert.strictEqual(metricsB.taskMetrics.totalTasks, 0);
    assert.strictEqual(metricsB.taskMetrics.completedTasks, 0);
    assert.strictEqual(metricsB.taskMetrics.activeTasks, 0);
    assert.strictEqual(metricsB.taskMetrics.completionRate, 0);
    assert.strictEqual(metricsB.taskMetrics.overdueTasks, 0);
    assert.strictEqual(metricsB.focusMetrics.totalFocusMinutes, 0);
    assert.strictEqual(metricsB.streakDays, 0);
    console.log("   Passed: User B metrics are completely isolated (all 0).");

    // 11. Unchecking task: completed: false resets completedAt to null
    console.log("8. Verifying unchecking task resets completedAt...");
    const uncheckRes = await fetch(`${BASE_URL}/tasks/${task1._id}`, {
        method: "PUT",
        headers: headersA,
        body: JSON.stringify({ completed: false })
    });
    assert.strictEqual(uncheckRes.status, 200);
    const uncheckedTask = await uncheckRes.json();
    assert.strictEqual(uncheckedTask.completed, false);
    assert.strictEqual(uncheckedTask.completedAt, null);

    const recheckMetricsRes = await fetch(`${BASE_URL}/analytics/summary?timezoneOffset=0`, { headers: headersA });
    const recheckMetrics = await recheckMetricsRes.json();
    assert.strictEqual(recheckMetrics.taskMetrics.completedTasks, 0);
    assert.strictEqual(recheckMetrics.todayStats.tasksCompletedToday, 0);
    console.log("   Passed: Unchecking task correctly decrements completions and clears completedAt.");

    // 12. Bulk update tasks completed: true sets completedAt
    console.log("9. Verifying bulk update completedAt handling...");
    const bulkRes = await fetch(`${BASE_URL}/tasks/bulk-update`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            ids: [task1._id, (await task2Res.json())._id],
            updates: { completed: true }
        })
    });
    assert.strictEqual(bulkRes.status, 200);
    const bulkData = await bulkRes.json();
    assert.strictEqual(bulkData.tasks.length, 2);
    bulkData.tasks.forEach(t => {
        assert.strictEqual(t.completed, true);
        assert.ok(t.completedAt !== null, "bulk updated completedAt should not be null");
    });
    console.log("   Passed: Bulk update sets completedAt timestamps.");

    console.log("\nALL MILESTONE 7.1 TESTS PASSED SUCCESSFULLY!");
}

run().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
