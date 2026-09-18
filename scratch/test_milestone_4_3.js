// scratch/test_milestone_4_3.js
// Automated verification for Milestone 4.3: Timeline Buckets & Chronological Classification

import assert from "node:assert";
import {
  getTimelineBucket,
  TIMELINE_BUCKET_META,
  TIMELINE_BUCKETS_ORDER,
  addDaysToDateISO,
  formatDateISO
} from "../client/src/utils/dateUtils.js";

console.log("Starting Milestone 4.3 verification suite...\n");

const todayIso = formatDateISO(new Date());

// 1. Test getTimelineBucket with individual dates
console.log("Test 1: Individual Date Bucket Classification");

// Past date uncompleted -> overdue
const pastDate = addDaysToDateISO(todayIso, -3);
assert.strictEqual(getTimelineBucket(pastDate, false), "overdue");

// Past date completed -> earlier
assert.strictEqual(getTimelineBucket(pastDate, true), "earlier");

// Today
assert.strictEqual(getTimelineBucket(todayIso, false), "today");
assert.strictEqual(getTimelineBucket(todayIso, true), "today");

// Tomorrow (+1)
const tomorrowDate = addDaysToDateISO(todayIso, 1);
assert.strictEqual(getTimelineBucket(tomorrowDate, false), "tomorrow");

// This Week (+2 to +7)
const day4Date = addDaysToDateISO(todayIso, 4);
assert.strictEqual(getTimelineBucket(day4Date, false), "this_week");
const day7Date = addDaysToDateISO(todayIso, 7);
assert.strictEqual(getTimelineBucket(day7Date, false), "this_week");

// Next Week (+8 to +14)
const day8Date = addDaysToDateISO(todayIso, 8);
assert.strictEqual(getTimelineBucket(day8Date, false), "next_week");
const day14Date = addDaysToDateISO(todayIso, 14);
assert.strictEqual(getTimelineBucket(day14Date, false), "next_week");

// Later (> +14)
const day21Date = addDaysToDateISO(todayIso, 21);
assert.strictEqual(getTimelineBucket(day21Date, false), "later");

console.log("✓ All date ranges correctly mapped to their chronological buckets.");

// 2. Test Timeline Buckets Metadata and Ordering
console.log("\nTest 2: Timeline Bucket Metadata and Sequence");
assert.strictEqual(TIMELINE_BUCKETS_ORDER.length, 7);
assert.strictEqual(TIMELINE_BUCKETS_ORDER[0], "overdue");
assert.strictEqual(TIMELINE_BUCKETS_ORDER[1], "today");
assert.strictEqual(TIMELINE_BUCKETS_ORDER[2], "tomorrow");
assert.strictEqual(TIMELINE_BUCKETS_ORDER[3], "this_week");
assert.strictEqual(TIMELINE_BUCKETS_ORDER[4], "next_week");
assert.strictEqual(TIMELINE_BUCKETS_ORDER[5], "later");
assert.strictEqual(TIMELINE_BUCKETS_ORDER[6], "earlier");

TIMELINE_BUCKETS_ORDER.forEach((key) => {
  assert.ok(TIMELINE_BUCKET_META[key], `Meta definition exists for ${key}`);
  assert.ok(TIMELINE_BUCKET_META[key].label, `Label exists for ${key}`);
});
console.log("✓ Bucket ordering and metadata definitions verified.");

// 3. Test Multi-Task Timeline Bucketing Simulation
console.log("\nTest 3: Multi-Task Timeline Bucketing Simulation");
const mockTasks = [
  { _id: "t1", title: "Overdue review", dueDate: addDaysToDateISO(todayIso, -2), completed: false },
  { _id: "t2", title: "Finished report", dueDate: addDaysToDateISO(todayIso, -4), completed: true },
  { _id: "t3", title: "Deploy to staging", dueDate: todayIso, completed: false },
  { _id: "t4", title: "Team sync", dueDate: addDaysToDateISO(todayIso, 1), completed: false },
  { _id: "t5", title: "Client demo", dueDate: addDaysToDateISO(todayIso, 5), completed: false },
  { _id: "t6", title: "Next sprint kickoff", dueDate: addDaysToDateISO(todayIso, 10), completed: false },
  { _id: "t7", title: "Quarterly review", dueDate: addDaysToDateISO(todayIso, 30), completed: false }
];

const bucketed = {};
TIMELINE_BUCKETS_ORDER.forEach((k) => {
  bucketed[k] = [];
});

mockTasks.forEach((t) => {
  const b = getTimelineBucket(t.dueDate, t.completed);
  bucketed[b].push(t);
});

assert.strictEqual(bucketed.overdue.length, 1);
assert.strictEqual(bucketed.overdue[0]._id, "t1");

assert.strictEqual(bucketed.earlier.length, 1);
assert.strictEqual(bucketed.earlier[0]._id, "t2");

assert.strictEqual(bucketed.today.length, 1);
assert.strictEqual(bucketed.today[0]._id, "t3");

assert.strictEqual(bucketed.tomorrow.length, 1);
assert.strictEqual(bucketed.tomorrow[0]._id, "t4");

assert.strictEqual(bucketed.this_week.length, 1);
assert.strictEqual(bucketed.this_week[0]._id, "t5");

assert.strictEqual(bucketed.next_week.length, 1);
assert.strictEqual(bucketed.next_week[0]._id, "t6");

assert.strictEqual(bucketed.later.length, 1);
assert.strictEqual(bucketed.later[0]._id, "t7");

console.log("✓ Multi-task timeline bucketing simulation perfectly matched all items.");

console.log("\nALL MILESTONE 4.3 TESTS PASSED SUCCESSFULLY! 🎉\n");
