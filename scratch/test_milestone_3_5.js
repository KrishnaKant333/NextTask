// scratch/test_milestone_3_5.js
// Automated verification for Milestone 3.5: Advanced Organization Polish (Bulk Operations)

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== Testing Milestone 3.5: Advanced Organization Polish ===");

  try {
    // 1. Create a temporary project
    console.log("\n1. Creating test project...");
    const projRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Batch Polish Project ${Date.now()}`,
        description: "Project for batch task operation tests",
        color: "#6366f1"
      })
    });
    if (!projRes.ok) {
      throw new Error(`Failed to create test project: ${projRes.status}`);
    }
    const project = await projRes.json();
    console.log(`✓ Project created: ${project._id} (${project.name})`);

    // 2. Create 3 test tasks in Inbox
    console.log("\n2. Creating 3 tasks in Inbox...");
    const taskIds = [];
    for (let i = 1; i <= 3; i++) {
      const tRes = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Batch Task ${i}`,
          priority: "medium"
        })
      });
      if (!tRes.ok) throw new Error(`Failed to create task ${i}`);
      const t = await tRes.json();
      taskIds.push(t._id);
    }
    console.log(`✓ Created 3 tasks with IDs: ${taskIds.join(", ")}`);

    // 3. Test Bulk Move: Move all 3 tasks to project
    console.log("\n3. Testing Bulk Move to Project...");
    const moveRes = await fetch(`${BASE_URL}/tasks/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: taskIds,
        updates: { projectId: project._id }
      })
    });
    if (!moveRes.ok) throw new Error(`Bulk move failed: ${moveRes.status} ${await moveRes.text()}`);
    const moveData = await moveRes.json();
    console.log(`✓ Bulk move result: ${moveData.message}`);
    if (moveData.tasks.length !== 3) {
      throw new Error(`Expected 3 tasks updated, got ${moveData.tasks.length}`);
    }
    const allAssigned = moveData.tasks.every(
      (t) => t.projectId && (t.projectId._id === project._id || t.projectId === project._id)
    );
    if (!allAssigned) {
      throw new Error("Not all tasks were assigned to the project!");
    }
    console.log("✓ All 3 tasks verified assigned to project");

    // 4. Test Bulk Complete & Add Tag
    console.log("\n4. Testing Bulk Completion & Tagging...");
    const completeRes = await fetch(`${BASE_URL}/tasks/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: taskIds,
        updates: { completed: true, addTag: "milestone-complete" }
      })
    });
    if (!completeRes.ok) throw new Error(`Bulk complete failed: ${completeRes.status}`);
    const completeData = await completeRes.json();
    console.log(`✓ Bulk complete result: ${completeData.message}`);
    const allDone = completeData.tasks.every((t) => t.completed === true);
    const allTagged = completeData.tasks.every(
      (t) => Array.isArray(t.tags) && t.tags.includes("milestone-complete")
    );
    if (!allDone || !allTagged) {
      throw new Error(`Expected all completed and tagged: allDone=${allDone}, allTagged=${allTagged}`);
    }
    console.log("✓ All 3 tasks verified completed and tagged");

    // 5. Test Bulk Delete
    console.log("\n5. Testing Bulk Delete...");
    const deleteRes = await fetch(`${BASE_URL}/tasks/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: taskIds })
    });
    if (!deleteRes.ok) throw new Error(`Bulk delete failed: ${deleteRes.status}`);
    const deleteData = await deleteRes.json();
    console.log(`✓ Bulk delete result: ${deleteData.message} (deleted: ${deleteData.deletedCount})`);
    if (deleteData.deletedCount !== 3) {
      throw new Error(`Expected 3 tasks deleted, got ${deleteData.deletedCount}`);
    }

    // 6. Cleanup project
    console.log("\n6. Cleaning up test project...");
    const cleanupRes = await fetch(`${BASE_URL}/projects/${project._id}`, { method: "DELETE" });
    if (!cleanupRes.ok) throw new Error("Failed to delete test project");
    console.log("✓ Test project cleaned up successfully");

    console.log("\n==========================================");
    console.log("ALL MILESTONE 3.5 VERIFICATION TESTS PASSED!");
    console.log("==========================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
  }
}

runTests();
