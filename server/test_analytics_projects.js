import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

async function run() {
    console.log("=== Testing Milestone 7.3 Project Time Allocation & Priority Distribution API ===");

    // 1. Unauthenticated request rejection
    console.log("1. Verifying unauthenticated request is rejected with 401...");
    const unauthRes = await fetch(`${BASE_URL}/analytics/projects?range=7d`);
    assert.strictEqual(unauthRes.status, 401, `Expected 401, got ${unauthRes.status}`);
    console.log("   Passed: 401 received.");

    // Helper to register a test user
    const timestamp = Date.now();
    async function createTestUser(suffix) {
        const email = `projects_test_${timestamp}_${suffix}@example.com`;
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

    // 2. Invalid range parameter validation
    console.log("3. Verifying invalid range parameter returns 400...");
    const invalidRes = await fetch(`${BASE_URL}/analytics/projects?range=invalid`, { headers: headersA });
    assert.strictEqual(invalidRes.status, 400, `Expected 400, got ${invalidRes.status}`);
    const invalidJson = await invalidRes.json();
    assert.ok(invalidJson.message.includes("Invalid range parameter"), "Expected clear validation message");
    console.log("   Passed: 400 received with proper error message.");

    // 3. User A Empty Dataset across 7d, 30d, 90d, all
    console.log("4. Verifying User A empty state across ranges (7d, 30d, 90d, all)...");
    for (const range of ["7d", "30d", "90d", "all"]) {
        const res = await fetch(`${BASE_URL}/analytics/projects?range=${range}&timezoneOffset=0`, { headers: headersA });
        assert.strictEqual(res.status, 200);
        const data = await res.json();

        assert.strictEqual(data.range, range);
        assert.strictEqual(data.summary.totalFocusMinutes, 0);
        assert.strictEqual(data.summary.totalFocusSessions, 0);
        assert.strictEqual(data.summary.totalCompletedTasks, 0);
        assert.strictEqual(data.summary.activeProjectsCount, 0);

        // Even with no projects created, Inbox / Unassigned exists with 0s
        assert.strictEqual(data.projects.length, 1);
        assert.strictEqual(data.projects[0].name, "Inbox / Unassigned");
        assert.strictEqual(data.projects[0].focusMinutes, 0);
        assert.strictEqual(data.projects[0].focusPercentage, 0);
        assert.strictEqual(data.projects[0].completionPercentage, 0);

        assert.strictEqual(data.priorityDistribution.completedInWindow.high, 0);
        assert.strictEqual(data.priorityDistribution.currentActive.medium, 0);
        assert.strictEqual(data.priorityDistribution.focusMinutesInWindow.unassigned, 0);

        if (range === "all") {
            assert.strictEqual(data.startDate, null);
            assert.strictEqual(data.endDate, null);
        } else {
            assert.ok(typeof data.startDate === "string" && data.startDate.length === 10);
            assert.ok(typeof data.endDate === "string" && data.endDate.length === 10);
        }
    }
    console.log("   Passed: Empty states return clean structures with no NaNs.");

    // 4. Create projects and activity for User A
    console.log("5. Creating projects, tasks, and focus sessions for User A...");

    // Create Project Alpha
    const pAlphaRes = await fetch(`${BASE_URL}/projects`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({ name: "Project Alpha", color: "#3b82f6" })
    });
    assert.strictEqual(pAlphaRes.status, 201);
    const pAlpha = await pAlphaRes.json();

    // Create Project Beta
    const pBetaRes = await fetch(`${BASE_URL}/projects`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({ name: "Project Beta", color: "#10b981" })
    });
    assert.strictEqual(pBetaRes.status, 201);
    const pBeta = await pBetaRes.json();

    // Task 1: in Alpha, completed, high priority
    const t1Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 1 Alpha",
            projectId: pAlpha._id,
            priority: "high",
            completed: true
        })
    });
    assert.strictEqual(t1Res.status, 201);
    const t1 = await t1Res.json();

    // Task 2: in Alpha, active, medium priority
    const t2Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 2 Alpha Active",
            projectId: pAlpha._id,
            priority: "medium",
            completed: false
        })
    });
    assert.strictEqual(t2Res.status, 201);

    // Task 3: in Beta, completed, low priority
    const t3Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 3 Beta",
            projectId: pBeta._id,
            priority: "low",
            completed: true
        })
    });
    assert.strictEqual(t3Res.status, 201);
    const t3 = await t3Res.json();

    // Task 4: Inbox (no project), completed, high priority
    const t4Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task 4 Inbox",
            priority: "high",
            completed: true
        })
    });
    assert.strictEqual(t4Res.status, 201);

    // Focus Session 1: Project Alpha, task 1, 30m
    await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            projectId: pAlpha._id,
            taskId: t1._id,
            durationMinutes: 30,
            mode: "work"
        })
    });

    // Focus Session 2: Project Alpha, task 1, 20m
    await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            projectId: pAlpha._id,
            taskId: t1._id,
            durationMinutes: 20,
            mode: "work"
        })
    });

    // Focus Session 3: Project Beta, task 3, 50m
    await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            projectId: pBeta._id,
            taskId: t3._id,
            durationMinutes: 50,
            mode: "work"
        })
    });

    // Focus Session 4: Inbox / Unassigned (no project, no task), 20m
    await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 20,
            mode: "work"
        })
    });
    console.log("   Passed: Data created.");

    // 5. Verify User A Project Analytics Calculations
    console.log("6. Verifying User A 7d project analytics aggregations...");
    const projResA = await fetch(`${BASE_URL}/analytics/projects?range=7d&timezoneOffset=0`, { headers: headersA });
    assert.strictEqual(projResA.status, 200);
    const projDataA = await projResA.json();

    // Summary verification: total minutes = 30 + 20 + 50 + 20 = 120
    assert.strictEqual(projDataA.summary.totalFocusMinutes, 120);
    assert.strictEqual(projDataA.summary.totalFocusSessions, 4);
    assert.strictEqual(projDataA.summary.totalCompletedTasks, 3);
    assert.strictEqual(projDataA.summary.activeProjectsCount, 3);

    // Find each project in the array
    const alphaStat = projDataA.projects.find(p => p.name === "Project Alpha");
    const betaStat = projDataA.projects.find(p => p.name === "Project Beta");
    const inboxStat = projDataA.projects.find(p => p.name === "Inbox / Unassigned");

    assert.ok(alphaStat, "Project Alpha should be present");
    assert.ok(betaStat, "Project Beta should be present");
    assert.ok(inboxStat, "Inbox / Unassigned should be present");

    // Project Alpha assertions
    assert.strictEqual(alphaStat.focusMinutes, 50);
    assert.strictEqual(alphaStat.focusSessions, 2);
    assert.strictEqual(alphaStat.completedTasks, 1);
    assert.strictEqual(alphaStat.activeTasks, 1);
    assert.strictEqual(alphaStat.focusPercentage, 42); // 50 / 120 = 41.67% -> 42%
    assert.strictEqual(alphaStat.completionPercentage, 33); // 1 / 3 = 33.33% -> 33%

    // Project Beta assertions
    assert.strictEqual(betaStat.focusMinutes, 50);
    assert.strictEqual(betaStat.focusSessions, 1);
    assert.strictEqual(betaStat.completedTasks, 1);
    assert.strictEqual(betaStat.activeTasks, 0);
    assert.strictEqual(betaStat.focusPercentage, 42);
    assert.strictEqual(betaStat.completionPercentage, 33);

    // Inbox assertions
    assert.strictEqual(inboxStat.focusMinutes, 20);
    assert.strictEqual(inboxStat.focusSessions, 1);
    assert.strictEqual(inboxStat.completedTasks, 1);
    assert.strictEqual(inboxStat.activeTasks, 0);
    assert.strictEqual(inboxStat.focusPercentage, 17); // 20 / 120 = 16.67% -> 17%
    assert.strictEqual(inboxStat.completionPercentage, 33);

    // Priority Distribution assertions
    // Completed in window: Task 1 (high), Task 4 (high), Task 3 (low)
    assert.strictEqual(projDataA.priorityDistribution.completedInWindow.high, 2);
    assert.strictEqual(projDataA.priorityDistribution.completedInWindow.medium, 0);
    assert.strictEqual(projDataA.priorityDistribution.completedInWindow.low, 1);

    // Current active: Task 2 (medium)
    assert.strictEqual(projDataA.priorityDistribution.currentActive.high, 0);
    assert.strictEqual(projDataA.priorityDistribution.currentActive.medium, 1);
    assert.strictEqual(projDataA.priorityDistribution.currentActive.low, 0);

    // Focus minutes by priority: Task 1 (high, 50m), Task 3 (low, 50m), Unassigned (20m)
    assert.strictEqual(projDataA.priorityDistribution.focusMinutesInWindow.high, 50);
    assert.strictEqual(projDataA.priorityDistribution.focusMinutesInWindow.medium, 0);
    assert.strictEqual(projDataA.priorityDistribution.focusMinutesInWindow.low, 50);
    assert.strictEqual(projDataA.priorityDistribution.focusMinutesInWindow.unassigned, 20);
    console.log("   Passed: Project analytics calculations match exact mathematical values.");

    // 6. Verify User B Multi-Tenancy Isolation
    console.log("7. Verifying User B multi-tenancy isolation...");
    const projResB = await fetch(`${BASE_URL}/analytics/projects?range=7d&timezoneOffset=0`, { headers: headersB });
    assert.strictEqual(projResB.status, 200);
    const projDataB = await projResB.json();

    assert.strictEqual(projDataB.summary.totalFocusMinutes, 0);
    assert.strictEqual(projDataB.summary.totalCompletedTasks, 0);
    assert.strictEqual(projDataB.summary.activeProjectsCount, 0);
    assert.strictEqual(projDataB.projects.length, 1); // Only Inbox
    assert.strictEqual(projDataB.projects[0].focusMinutes, 0);
    assert.strictEqual(projDataB.priorityDistribution.completedInWindow.high, 0);
    console.log("   Passed: User B data is completely isolated (all 0s).");

    console.log("\nALL MILESTONE 7.3 TESTS PASSED SUCCESSFULLY!");
}

run().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
