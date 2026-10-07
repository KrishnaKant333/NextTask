import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

async function run() {
    console.log("=== Testing Milestone 7.2 Analytics Trends API ===");

    // 1. Unauthenticated request rejection
    console.log("1. Verifying unauthenticated request is rejected with 401...");
    const unauthRes = await fetch(`${BASE_URL}/analytics/trends?range=7d`);
    assert.strictEqual(unauthRes.status, 401, `Expected 401, got ${unauthRes.status}`);
    console.log("   Passed: 401 received.");

    // Helper to register a test user
    const timestamp = Date.now();
    async function createTestUser(suffix) {
        const email = `trends_test_${timestamp}_${suffix}@example.com`;
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

    // 2. Invalid range validation
    console.log("3. Verifying invalid range parameter returns 400...");
    const invalidRes = await fetch(`${BASE_URL}/analytics/trends?range=invalid`, { headers: headersA });
    assert.strictEqual(invalidRes.status, 400, `Expected 400, got ${invalidRes.status}`);
    const invalidJson = await invalidRes.json();
    assert.ok(invalidJson.message.includes("Invalid range parameter"), "Expected clear validation message");
    console.log("   Passed: 400 received with proper error message.");

    // 3. User A Empty Dataset across 7d, 30d, 90d
    console.log("4. Verifying User A empty state trends for 7d, 30d, and 90d windows...");
    for (const range of ["7d", "30d", "90d"]) {
        const expectedCount = range === "7d" ? 7 : (range === "30d" ? 30 : 90);
        const res = await fetch(`${BASE_URL}/analytics/trends?range=${range}&timezoneOffset=0`, { headers: headersA });
        assert.strictEqual(res.status, 200, `Expected 200 for range ${range}`);
        const data = await res.json();

        assert.strictEqual(data.range, range);
        assert.strictEqual(data.days.length, expectedCount, `Expected exactly ${expectedCount} day buckets for ${range}`);
        assert.strictEqual(data.summary.totalCompleted, 0);
        assert.strictEqual(data.summary.totalCreated, 0);
        assert.strictEqual(data.summary.totalFocusMinutes, 0);
        assert.strictEqual(data.summary.totalFocusSessions, 0);
        assert.strictEqual(data.summary.averageDailyCompletions, 0);
        assert.strictEqual(data.summary.averageDailyFocusMinutes, 0);
        assert.strictEqual(data.summary.completedOnTime, 0);
        assert.strictEqual(data.summary.completedOverdue, 0);

        // Check chronological continuity of date buckets
        for (let i = 0; i < data.days.length - 1; i++) {
            const current = new Date(data.days[i].date);
            const next = new Date(data.days[i + 1].date);
            const diffDays = Math.round((next - current) / (24 * 60 * 60 * 1000));
            assert.strictEqual(diffDays, 1, `Dates should be strictly consecutive: ${data.days[i].date} -> ${data.days[i + 1].date}`);
            assert.ok(typeof data.days[i].dayOfWeek === "string" && data.days[i].dayOfWeek.length === 3);
        }
    }
    console.log("   Passed: All empty ranges returned exact, continuous zero-filled day buckets.");

    // 4. Populate deterministic activity for User A
    console.log("5. Creating tasks and focus sessions with on-time and overdue completions...");
    
    // Task 1: Completed on time (due tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const task1Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task On-Time",
            dueDate: tomorrow.toISOString(),
            completed: true
        })
    });
    assert.strictEqual(task1Res.status, 201);

    // Task 2: Completed overdue (due 2 days ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const task2Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task Overdue",
            dueDate: pastDate.toISOString(),
            completed: true
        })
    });
    assert.strictEqual(task2Res.status, 201);

    // Task 3: Active task (not completed)
    const task3Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Task Incomplete",
            completed: false
        })
    });
    assert.strictEqual(task3Res.status, 201);

    // Focus Session 1: 25 minutes
    const focus1Res = await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 25,
            mode: "work"
        })
    });
    assert.strictEqual(focus1Res.status, 201);

    // Focus Session 2: 45 minutes
    const focus2Res = await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 45,
            mode: "work"
        })
    });
    assert.strictEqual(focus2Res.status, 201);
    console.log("   Passed: Test data created.");

    // 5. Verify User A 7d trends calculation
    console.log("6. Verifying User A 7d trends aggregation math...");
    const trendsResA = await fetch(`${BASE_URL}/analytics/trends?range=7d&timezoneOffset=0`, { headers: headersA });
    assert.strictEqual(trendsResA.status, 200);
    const trendsA = await trendsResA.json();

    assert.strictEqual(trendsA.summary.totalCompleted, 2);
    assert.strictEqual(trendsA.summary.totalCreated, 3);
    assert.strictEqual(trendsA.summary.totalFocusMinutes, 70);
    assert.strictEqual(trendsA.summary.totalFocusSessions, 2);
    assert.strictEqual(trendsA.summary.completedOnTime, 1);
    assert.strictEqual(trendsA.summary.completedOverdue, 1);
    assert.strictEqual(trendsA.summary.averageDailyCompletions, 0.3); // 2 / 7 = 0.2857 -> 0.3
    assert.strictEqual(trendsA.summary.averageDailyFocusMinutes, 10); // 70 / 7 = 10.0

    // Today's bucket should be the last item
    const todayBucket = trendsA.days[trendsA.days.length - 1];
    assert.strictEqual(todayBucket.completedTasks, 2);
    assert.strictEqual(todayBucket.createdTasks, 3);
    assert.strictEqual(todayBucket.focusMinutes, 70);
    assert.strictEqual(todayBucket.focusSessions, 2);
    assert.strictEqual(todayBucket.completedOnTime, 1);
    assert.strictEqual(todayBucket.completedOverdue, 1);
    console.log("   Passed: User A trends match exact mathematical expectations.");

    // 6. Verify User B multi-tenancy isolation
    console.log("7. Verifying User B multi-tenancy isolation...");
    const trendsResB = await fetch(`${BASE_URL}/analytics/trends?range=7d&timezoneOffset=0`, { headers: headersB });
    assert.strictEqual(trendsResB.status, 200);
    const trendsB = await trendsResB.json();

    assert.strictEqual(trendsB.summary.totalCompleted, 0);
    assert.strictEqual(trendsB.summary.totalCreated, 0);
    assert.strictEqual(trendsB.summary.totalFocusMinutes, 0);
    assert.strictEqual(trendsB.summary.totalFocusSessions, 0);
    assert.strictEqual(trendsB.summary.completedOnTime, 0);
    assert.strictEqual(trendsB.summary.completedOverdue, 0);
    const todayBucketB = trendsB.days[trendsB.days.length - 1];
    assert.strictEqual(todayBucketB.completedTasks, 0);
    assert.strictEqual(todayBucketB.focusMinutes, 0);
    console.log("   Passed: User B trends are completely isolated (all 0).");

    console.log("\nALL MILESTONE 7.2 TESTS PASSED SUCCESSFULLY!");
}

run().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
