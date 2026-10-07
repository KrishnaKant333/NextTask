import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

async function run() {
    console.log("=== Testing Milestone 7.4 Analytics Consistency Heatmap API ===");

    // 1. Unauthenticated request rejection
    console.log("1. Verifying unauthenticated request is rejected with 401...");
    const unauthRes = await fetch(`${BASE_URL}/analytics/heatmap?range=30d`);
    assert.strictEqual(unauthRes.status, 401, `Expected 401, got ${unauthRes.status}`);
    console.log("   Passed: 401 received.");

    // Helper to register a test user
    const timestamp = Date.now();
    async function createTestUser(suffix) {
        const email = `heatmap_test_${timestamp}_${suffix}@example.com`;
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
    console.log("3. Verifying invalid range parameters (e.g. 7d, 14d, random) return 400...");
    for (const badRange of ["7d", "14d", "all", "invalid"]) {
        const invalidRes = await fetch(`${BASE_URL}/analytics/heatmap?range=${badRange}`, { headers: headersA });
        assert.strictEqual(invalidRes.status, 400, `Expected 400 for range '${badRange}', got ${invalidRes.status}`);
        const invalidJson = await invalidRes.json();
        assert.ok(invalidJson.message.includes("Invalid range parameter"), "Expected clear validation message");
    }
    console.log("   Passed: 400 received for unsupported range parameters.");

    // 3. User A Empty Dataset across 30d, 90d, 365d
    console.log("4. Verifying empty state heatmap across 30d, 90d, and 365d windows...");
    for (const range of ["30d", "90d", "365d"]) {
        const expectedDays = range === "30d" ? 30 : (range === "90d" ? 90 : 365);
        const res = await fetch(`${BASE_URL}/analytics/heatmap?range=${range}&timezoneOffset=0`, { headers: headersA });
        assert.strictEqual(res.status, 200, `Expected 200 for range ${range}`);
        const data = await res.json();

        assert.strictEqual(data.range, range);
        assert.strictEqual(data.hourlyGrid.length, 168, "Expected exactly 168 cells (7 days x 24 hours)");
        assert.strictEqual(data.dailyMatrix.length, expectedDays, `Expected exactly ${expectedDays} daily entries`);

        // Verify summary has zero values, no NaN, no undefined
        assert.strictEqual(data.summary.totalActiveDays, 0);
        assert.strictEqual(data.summary.totalDaysInRange, expectedDays);
        assert.strictEqual(data.summary.consistencyRate, 0);
        assert.strictEqual(data.summary.totalCompletedTasks, 0);
        assert.strictEqual(data.summary.totalFocusMinutes, 0);
        assert.strictEqual(data.summary.totalFocusSessions, 0);
        assert.strictEqual(data.summary.mostActiveDayOfWeek.dayOfWeek, null);
        assert.strictEqual(data.summary.mostActiveHour.hour, null);
        assert.strictEqual(data.summary.peakFocusHour.hour, null);

        // Check hourly grid structure and zero values
        for (const cell of data.hourlyGrid) {
            assert.ok(cell.dayOfWeek >= 0 && cell.dayOfWeek <= 6);
            assert.ok(cell.hour >= 0 && cell.hour <= 23);
            assert.strictEqual(cell.completedTasks, 0);
            assert.strictEqual(cell.focusMinutes, 0);
            assert.strictEqual(cell.focusSessions, 0);
            assert.strictEqual(cell.totalEvents, 0);
            assert.ok(!Number.isNaN(cell.totalEvents), "No NaN allowed");
        }

        // Check daily matrix continuity and zero values
        for (let i = 0; i < data.dailyMatrix.length; i++) {
            const entry = data.dailyMatrix[i];
            assert.strictEqual(entry.completedTasks, 0);
            assert.strictEqual(entry.focusMinutes, 0);
            assert.strictEqual(entry.focusSessions, 0);
            assert.strictEqual(entry.totalEvents, 0);
            assert.strictEqual(entry.intensityLevel, 0);
            assert.ok(!Number.isNaN(entry.intensityLevel), "No NaN in intensityLevel");

            if (i < data.dailyMatrix.length - 1) {
                const current = new Date(entry.date);
                const next = new Date(data.dailyMatrix[i + 1].date);
                const diffDays = Math.round((next - current) / (24 * 60 * 60 * 1000));
                assert.strictEqual(diffDays, 1, `Dates must be consecutive: ${entry.date} -> ${data.dailyMatrix[i + 1].date}`);
            }
        }
    }
    console.log("   Passed: All empty ranges return exactly 168 hourly cells, continuous daily matrices, and zero-filled metrics.");

    // 4. Test deterministic activity aggregation for User A
    console.log("5. Creating deterministic tasks and focus sessions for User A...");

    // Create Task 1 (completed now)
    const task1Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Heatmap Task 1",
            completed: true
        })
    });
    assert.strictEqual(task1Res.status, 201);

    // Create Task 2 (completed now - multiple activities in same bucket!)
    const task2Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Heatmap Task 2",
            completed: true
        })
    });
    assert.strictEqual(task2Res.status, 201);

    // Create Task 3 (uncompleted - should NOT count towards completed heatmap activity)
    const task3Res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            title: "Heatmap Task 3 - Uncompleted",
            completed: false
        })
    });
    assert.strictEqual(task3Res.status, 201);

    // Create Focus Session 1: 50 minutes work
    const focus1Res = await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 50,
            mode: "work"
        })
    });
    assert.strictEqual(focus1Res.status, 201);

    // Create Focus Session 2: 25 minutes work (same day/bucket!)
    const focus2Res = await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 25,
            mode: "work"
        })
    });
    assert.strictEqual(focus2Res.status, 201);

    // Create Focus Session 3: 15 minutes break (mode: short_break - should NOT count towards work heatmap)
    const focus3Res = await fetch(`${BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify({
            durationMinutes: 15,
            mode: "short_break"
        })
    });
    assert.strictEqual(focus3Res.status, 201);
    console.log("   Passed: Deterministic test records created.");

    // 5. Query heatmap with UTC offset 0
    console.log("6. Verifying User A heatmap with timezoneOffset=0...");
    const heatmapResA = await fetch(`${BASE_URL}/analytics/heatmap?range=30d&timezoneOffset=0`, { headers: headersA });
    assert.strictEqual(heatmapResA.status, 200);
    const heatmapA = await heatmapResA.json();

    assert.strictEqual(heatmapA.summary.totalCompletedTasks, 2, "Expected exactly 2 completed tasks");
    assert.strictEqual(heatmapA.summary.totalFocusMinutes, 75, "Expected 50 + 25 = 75 work focus minutes (excluding break)");
    assert.strictEqual(heatmapA.summary.totalFocusSessions, 2, "Expected 2 work focus sessions");
    assert.strictEqual(heatmapA.summary.totalActiveDays, 1, "Expected 1 active day");
    assert.strictEqual(heatmapA.summary.consistencyRate, 3, "1 / 30 = 3.33% -> 3%");

    // Verify today's cell in dailyMatrix
    const todayMatrixEntry = heatmapA.dailyMatrix[heatmapA.dailyMatrix.length - 1];
    assert.strictEqual(todayMatrixEntry.completedTasks, 2);
    assert.strictEqual(todayMatrixEntry.focusMinutes, 75);
    assert.strictEqual(todayMatrixEntry.focusSessions, 2);
    assert.strictEqual(todayMatrixEntry.totalEvents, 4); // 2 tasks + 2 sessions
    // Intensity formula: focusMinutes >= 51 -> intensity 3
    assert.strictEqual(todayMatrixEntry.intensityLevel, 3, "Expected intensityLevel 3 (75 focus minutes)");

    // Verify summary peak hours and most active day
    assert.ok(heatmapA.summary.mostActiveDayOfWeek.dayOfWeek !== null);
    assert.strictEqual(heatmapA.summary.mostActiveDayOfWeek.totalEvents, 4);
    assert.strictEqual(heatmapA.summary.mostActiveDayOfWeek.focusMinutes, 75);
    assert.ok(heatmapA.summary.mostActiveHour.hour !== null);
    assert.strictEqual(heatmapA.summary.mostActiveHour.totalEvents, 4);
    assert.ok(heatmapA.summary.peakFocusHour.hour !== null);
    assert.strictEqual(heatmapA.summary.peakFocusHour.focusMinutes, 75);
    console.log("   Passed: Activity math, intensity calculation, and peak summaries match exact expectations.");

    // 6. Test Timezone Translation & Shifting
    console.log("7. Testing timezone shift behavior...");
    const nowUtc = new Date();
    const utcHour = nowUtc.getUTCHours();

    // Check with offset = -330 (IST: UTC + 5h30m)
    const istOffset = -330;
    const istLocalMs = nowUtc.getTime() - (istOffset * 60 * 1000);
    const istLocalDate = new Date(istLocalMs);
    const expectedIstHour = istLocalDate.getUTCHours();
    const expectedIstDay = istLocalDate.getUTCDay();

    const heatmapResIST = await fetch(`${BASE_URL}/analytics/heatmap?range=30d&timezoneOffset=${istOffset}`, { headers: headersA });
    assert.strictEqual(heatmapResIST.status, 200);
    const heatmapIST = await heatmapResIST.json();

    // Find the cell in hourlyGrid matching (expectedIstDay, expectedIstHour)
    const istCell = heatmapIST.hourlyGrid.find(c => c.dayOfWeek === expectedIstDay && c.hour === expectedIstHour);
    assert.ok(istCell, `Cell for IST day ${expectedIstDay} and hour ${expectedIstHour} should exist`);
    assert.strictEqual(istCell.completedTasks, 2, "Tasks should map to localized hour");
    assert.strictEqual(istCell.focusMinutes, 75, "Focus minutes should map to localized hour");

    console.log(`   Passed: UTC hour ${utcHour} correctly localized to IST hour ${expectedIstHour}.`);

    // 7. Verify Multi-Tenancy Isolation
    console.log("8. Verifying User B multi-tenancy isolation (all zeroes)...");
    const heatmapResB = await fetch(`${BASE_URL}/analytics/heatmap?range=30d&timezoneOffset=0`, { headers: headersB });
    assert.strictEqual(heatmapResB.status, 200);
    const heatmapB = await heatmapResB.json();

    assert.strictEqual(heatmapB.summary.totalCompletedTasks, 0);
    assert.strictEqual(heatmapB.summary.totalFocusMinutes, 0);
    assert.strictEqual(heatmapB.summary.totalFocusSessions, 0);
    assert.strictEqual(heatmapB.summary.totalActiveDays, 0);
    assert.strictEqual(heatmapB.summary.consistencyRate, 0);
    assert.strictEqual(heatmapB.summary.mostActiveDayOfWeek.dayOfWeek, null);

    // Verify all 168 cells are 0 for User B
    const bNonZeroCell = heatmapB.hourlyGrid.find(c => c.totalEvents > 0 || c.focusMinutes > 0);
    assert.strictEqual(bNonZeroCell, undefined, "User B should have zero activity in all hourly cells");

    // Verify all days are 0 for User B
    const bNonZeroDay = heatmapB.dailyMatrix.find(d => d.totalEvents > 0 || d.intensityLevel > 0);
    assert.strictEqual(bNonZeroDay, undefined, "User B should have zero activity in all daily matrix entries");
    console.log("   Passed: User B is completely isolated from User A's data.");

    // 8. Regression Verification of Existing Analytics Endpoints
    console.log("9. Verifying existing analytics endpoints remain functional...");
    const [summaryRes, trendsRes, projectsRes] = await Promise.all([
        fetch(`${BASE_URL}/analytics/summary?timezoneOffset=0`, { headers: headersA }),
        fetch(`${BASE_URL}/analytics/trends?range=7d&timezoneOffset=0`, { headers: headersA }),
        fetch(`${BASE_URL}/analytics/projects?range=7d&timezoneOffset=0`, { headers: headersA })
    ]);

    assert.strictEqual(summaryRes.status, 200, "GET /api/analytics/summary should return 200");
    assert.strictEqual(trendsRes.status, 200, "GET /api/analytics/trends should return 200");
    assert.strictEqual(projectsRes.status, 200, "GET /api/analytics/projects should return 200");

    const summaryJson = await summaryRes.json();
    const trendsJson = await trendsRes.json();
    const projectsJson = await projectsRes.json();

    assert.strictEqual(summaryJson.taskMetrics.completedTasks, 2);
    assert.strictEqual(summaryJson.focusMetrics.totalFocusMinutes, 75);
    assert.strictEqual(trendsJson.summary.totalCompleted, 2);
    assert.strictEqual(trendsJson.summary.totalFocusMinutes, 75);
    assert.strictEqual(projectsJson.summary.totalCompletedTasks, 2);
    assert.strictEqual(projectsJson.summary.totalFocusMinutes, 75);

    console.log("   Passed: All previous analytics endpoints functional with matching data.");

    console.log("\nALL MILESTONE 7.4 TESTS PASSED SUCCESSFULLY!");
}

run().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
