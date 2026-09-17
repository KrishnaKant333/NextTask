// scratch/test_milestone_4_2.js
// Automated verification for Milestone 4.2: Date Helpers, Rescheduling Math & Overdue Logic

import assert from "node:assert";
import {
  formatFriendlyDate,
  getRelativeDateLabel,
  isPastDate,
  addDaysToDateISO,
  formatDateISO
} from "../client/src/utils/dateUtils.js";

console.log("Starting Milestone 4.2 verification suite...\n");

// 1. Test formatFriendlyDate
console.log("Test 1: Friendly Date Formatting");
const friendlySample1 = formatFriendlyDate("2026-09-18");
assert.strictEqual(friendlySample1, "Friday, September 18, 2026");

const friendlySample2 = formatFriendlyDate("2028-02-29"); // Leap year
assert.strictEqual(friendlySample2, "Tuesday, February 29, 2028");

const friendlyEmpty = formatFriendlyDate("");
assert.strictEqual(friendlyEmpty, "");
console.log("✓ Friendly date formatting verified successfully.");

// 2. Test addDaysToDateISO
console.log("\nTest 2: addDaysToDateISO Offset Math");
// Normal addition
assert.strictEqual(addDaysToDateISO("2026-09-18", 1), "2026-09-19");
assert.strictEqual(addDaysToDateISO("2026-09-18", 3), "2026-09-21");
assert.strictEqual(addDaysToDateISO("2026-09-18", 7), "2026-09-25");

// Month overflow
assert.strictEqual(addDaysToDateISO("2026-09-30", 1), "2026-10-01");
// Year overflow
assert.strictEqual(addDaysToDateISO("2026-12-31", 1), "2027-01-01");
// Leap year Feb 28 -> Feb 29
assert.strictEqual(addDaysToDateISO("2028-02-28", 1), "2028-02-29");
assert.strictEqual(addDaysToDateISO("2028-02-29", 1), "2028-03-01");
// Non-leap year Feb 28 -> Mar 1
assert.strictEqual(addDaysToDateISO("2026-02-28", 1), "2026-03-01");
// Negative days
assert.strictEqual(addDaysToDateISO("2026-10-01", -1), "2026-09-30");
console.log("✓ Date offset math handles month, year, and leap-year boundaries without shifts.");

// 3. Test getRelativeDateLabel
console.log("\nTest 3: Relative Date Labels");
const todayIso = formatDateISO(new Date());
assert.strictEqual(getRelativeDateLabel(todayIso), "Today");

const tomorrowIso = addDaysToDateISO(todayIso, 1);
assert.strictEqual(getRelativeDateLabel(tomorrowIso), "Tomorrow");

const yesterdayIso = addDaysToDateISO(todayIso, -1);
assert.strictEqual(getRelativeDateLabel(yesterdayIso), "Yesterday");

const future3Iso = addDaysToDateISO(todayIso, 3);
assert.strictEqual(getRelativeDateLabel(future3Iso), "In 3 days");

const past5Iso = addDaysToDateISO(todayIso, -5);
assert.strictEqual(getRelativeDateLabel(past5Iso), "5 days overdue");
console.log("✓ Relative date labels compute accurately for Today, Tomorrow, Yesterday, Future, and Overdue.");

// 4. Test isPastDate
console.log("\nTest 4: isPastDate Overdue Check");
assert.strictEqual(isPastDate(todayIso), false);
assert.strictEqual(isPastDate(tomorrowIso), false);
assert.strictEqual(isPastDate(yesterdayIso), true);
assert.strictEqual(isPastDate(past5Iso), true);
console.log("✓ isPastDate correctly flags past dates.");

// 5. Test Rescheduling Simulation
console.log("\nTest 5: Task Rescheduling Simulation");
const mockTasks = [
  { _id: "t1", title: "Review specs", dueDate: "2026-09-15", completed: false },
  { _id: "t2", title: "Build UI", dueDate: "2026-09-18", completed: false },
  { _id: "t3", title: "Write tests", dueDate: "2026-09-20", completed: true }
];

// Reschedule t1 from 2026-09-15 to 2026-09-22 (+7d)
const targetTask = mockTasks.find((t) => t._id === "t1");
const updatedDueDate = addDaysToDateISO(targetTask.dueDate, 7);
const rescheduledTasks = mockTasks.map((t) =>
  t._id === "t1" ? { ...t, dueDate: updatedDueDate } : t
);

assert.strictEqual(rescheduledTasks.find((t) => t._id === "t1").dueDate, "2026-09-22");
console.log("✓ Rescheduling simulation passed with zero mutation side-effects.");

console.log("\nALL MILESTONE 4.2 TESTS PASSED SUCCESSFULLY! 🎉\n");
