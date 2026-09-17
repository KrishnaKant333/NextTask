// scratch/test_milestone_4_1.js
// Automated verification for Milestone 4.1: View Switcher & Month Calendar Engine

import {
  getMonthMatrix,
  formatDateISO,
  isToday,
  formatMonthYear,
  MONTH_NAMES,
  WEEKDAY_NAMES
} from "../client/src/utils/dateUtils.js";

function runDateUtilsTests() {
  console.log("=== Testing Milestone 4.1: View Switcher & Month Calendar Math ===");

  // Test 1: September 2026 (Month index 8)
  // Sep 1, 2026 is Tuesday (day 2 in Sun=0, Mon=1, Tue=2...)
  // Days in Sep = 30.
  // Leading days needed = 2 (Sun Aug 30, Mon Aug 31).
  // Total month days = 2 + 30 = 32 -> padded to 35.
  console.log("\n1. Testing September 2026 grid calculation...");
  const sepMatrix = getMonthMatrix(2026, 8);
  console.log(`✓ Total cells generated: ${sepMatrix.length}`);
  if (sepMatrix.length !== 35) {
    throw new Error(`Expected 35 cells for Sep 2026, got ${sepMatrix.length}`);
  }

  // First cell must be Aug 30, 2026
  console.log(`✓ First cell: ${sepMatrix[0].dateStr}, isCurrentMonth=${sepMatrix[0].isCurrentMonth}`);
  if (sepMatrix[0].dateStr !== "2026-08-30" || sepMatrix[0].isCurrentMonth !== false) {
    throw new Error(`Unexpected first cell: ${JSON.stringify(sepMatrix[0])}`);
  }

  // Cell index 2 must be Sep 1, 2026
  console.log(`✓ Sep 1 cell (index 2): ${sepMatrix[2].dateStr}, isCurrentMonth=${sepMatrix[2].isCurrentMonth}`);
  if (sepMatrix[2].dateStr !== "2026-09-01" || sepMatrix[2].isCurrentMonth !== true) {
    throw new Error(`Unexpected Sep 1 cell: ${JSON.stringify(sepMatrix[2])}`);
  }

  // Cell index 31 must be Sep 30, 2026
  console.log(`✓ Sep 30 cell (index 31): ${sepMatrix[31].dateStr}, isCurrentMonth=${sepMatrix[31].isCurrentMonth}`);
  if (sepMatrix[31].dateStr !== "2026-09-30" || sepMatrix[31].isCurrentMonth !== true) {
    throw new Error(`Unexpected Sep 30 cell: ${JSON.stringify(sepMatrix[31])}`);
  }

  // Test 2: August 2026 (Month index 7) - 6-row month (needs 42 cells)
  // Aug 1, 2026 is Saturday (index 6).
  // Leading days = 6. Days in Aug = 31. 6 + 31 = 37 -> exceeds 35, needs 42 cells.
  console.log("\n2. Testing August 2026 6-row grid calculation (42 cells)...");
  const augMatrix = getMonthMatrix(2026, 7);
  console.log(`✓ Total cells for Aug 2026: ${augMatrix.length}`);
  if (augMatrix.length !== 42) {
    throw new Error(`Expected 42 cells for Aug 2026, got ${augMatrix.length}`);
  }

  // Test 3: Leap Year February 2028 (29 days)
  console.log("\n3. Testing Leap Year February 2028 (29 days)...");
  const feb2028 = getMonthMatrix(2028, 1);
  const febCurrentDays = feb2028.filter((c) => c.isCurrentMonth);
  console.log(`✓ Days in Feb 2028: ${febCurrentDays.length}`);
  if (febCurrentDays.length !== 29) {
    throw new Error(`Expected 29 days in Feb 2028, got ${febCurrentDays.length}`);
  }

  // Test 4: formatMonthYear and formatting
  console.log("\n4. Testing formatMonthYear and string formatting...");
  const title = formatMonthYear(2026, 8);
  console.log(`✓ Formatted title: "${title}"`);
  if (title !== "September 2026") {
    throw new Error(`Expected "September 2026", got "${title}"`);
  }

  // Test 5: Task date mapping
  console.log("\n5. Testing task due date matching against calendar cells...");
  const mockTasks = [
    { _id: "t1", title: "Task 1", dueDate: "2026-09-01T00:00:00.000Z" },
    { _id: "t2", title: "Task 2", dueDate: "2026-09-15" },
    { _id: "t3", title: "Task 3 (no due date)", dueDate: null }
  ];

  const map = new Map();
  mockTasks.forEach((t) => {
    if (!t.dueDate) return;
    const iso = formatDateISO(t.dueDate);
    if (!map.has(iso)) map.set(iso, []);
    map.get(iso).push(t);
  });

  console.log(`✓ Tasks mapped to 2026-09-01: ${map.get("2026-09-01")?.length || 0}`);
  console.log(`✓ Tasks mapped to 2026-09-15: ${map.get("2026-09-15")?.length || 0}`);
  if (!map.has("2026-09-01") || !map.has("2026-09-15")) {
    throw new Error("Task date mapping failed!");
  }

  console.log("\n==========================================");
  console.log("ALL MILESTONE 4.1 VERIFICATION TESTS PASSED!");
  console.log("==========================================");
}

runDateUtilsTests();
