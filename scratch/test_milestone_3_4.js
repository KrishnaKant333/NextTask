// scratch/test_milestone_3_4.js
// Automated verification for Milestone 3.4: Subtasks & Checklist Engine

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== Testing Milestone 3.4: Subtasks & Checklist Engine ===");

  try {
    // 1. Create a task with initial subtasks
    console.log("\n1. Creating task with subtasks...");
    const createRes = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Task with Subtasks",
        priority: "high",
        subtasks: [
          { title: "Define schema" },
          { title: "Write endpoints" }
        ]
      })
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create task: ${createRes.status} ${await createRes.text()}`);
    }

    const task = await createRes.json();
    console.log(`✓ Task created with ID: ${task._id}`);
    console.log(`✓ Subtasks count: ${task.subtasks.length}`);
    if (task.subtasks.length !== 2) {
      throw new Error(`Expected 2 subtasks, got ${task.subtasks.length}`);
    }

    const firstSubtask = task.subtasks[0];
    console.log(`✓ Subtask 1: ID=${firstSubtask._id}, title="${firstSubtask.title}", completed=${firstSubtask.completed}`);
    if (firstSubtask.completed !== false) {
      throw new Error("Expected initial subtask completed to be false");
    }

    // 2. Atomic Toggle: Mark first subtask as completed
    console.log("\n2. Toggling first subtask to completed...");
    const toggle1Res = await fetch(`${BASE_URL}/tasks/${task._id}/subtasks/${firstSubtask._id}/toggle`, {
      method: "PATCH"
    });

    if (!toggle1Res.ok) {
      throw new Error(`Failed to toggle subtask: ${toggle1Res.status} ${await toggle1Res.text()}`);
    }

    const toggledTask1 = await toggle1Res.json();
    const stAfterToggle1 = toggledTask1.subtasks.find((s) => s._id === firstSubtask._id);
    console.log(`✓ Subtask 1 completed status after toggle 1: ${stAfterToggle1.completed}`);
    if (stAfterToggle1.completed !== true) {
      throw new Error("Expected subtask completed to be true after toggle 1");
    }

    // 3. Atomic Toggle: Mark first subtask as incomplete
    console.log("\n3. Toggling first subtask back to incomplete...");
    const toggle2Res = await fetch(`${BASE_URL}/tasks/${task._id}/subtasks/${firstSubtask._id}/toggle`, {
      method: "PATCH"
    });

    if (!toggle2Res.ok) {
      throw new Error(`Failed to toggle subtask back: ${toggle2Res.status} ${await toggle2Res.text()}`);
    }

    const toggledTask2 = await toggle2Res.json();
    const stAfterToggle2 = toggledTask2.subtasks.find((s) => s._id === firstSubtask._id);
    console.log(`✓ Subtask 1 completed status after toggle 2: ${stAfterToggle2.completed}`);
    if (stAfterToggle2.completed !== false) {
      throw new Error("Expected subtask completed to be false after toggle 2");
    }

    // 4. Update task with modified subtask list (e.g., adding a third subtask)
    console.log("\n4. Updating task with an additional subtask via PUT...");
    const updateRes = await fetch(`${BASE_URL}/tasks/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subtasks: [
          { _id: firstSubtask._id, title: "Define schema", completed: true },
          { _id: task.subtasks[1]._id, title: "Write endpoints", completed: true },
          { title: "Run end-to-end verification", completed: false }
        ]
      })
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update task: ${updateRes.status} ${await updateRes.text()}`);
    }

    const updatedTask = await updateRes.json();
    console.log(`✓ Updated task subtasks count: ${updatedTask.subtasks.length}`);
    const completedCount = updatedTask.subtasks.filter((s) => s.completed).length;
    console.log(`✓ Completed subtasks: ${completedCount} of ${updatedTask.subtasks.length}`);
    if (updatedTask.subtasks.length !== 3 || completedCount !== 2) {
      throw new Error(`Unexpected subtasks state: length=${updatedTask.subtasks.length}, completed=${completedCount}`);
    }

    // 5. Clean up
    console.log("\n5. Cleaning up test task...");
    const delRes = await fetch(`${BASE_URL}/tasks/${task._id}`, { method: "DELETE" });
    if (!delRes.ok) {
      throw new Error(`Failed to delete test task: ${delRes.status}`);
    }
    console.log("✓ Test task cleaned up successfully");

    console.log("\n==========================================");
    console.log("ALL MILESTONE 3.4 VERIFICATION TESTS PASSED!");
    console.log("==========================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
  }
}

runTests();
