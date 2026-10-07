import assert from "node:assert";
import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";

const BASE_URL = process.env.API_URL || "http://localhost:5000/api";

async function runProfileTests() {
  console.log("=== STARTING MILESTONE 6.4 PROFILE & PASSWORD TESTS ===\n");

  const mongoUri = process.env.MONGO_URI;
  assert(mongoUri, "MONGO_URI must be configured");
  await mongoose.connect(mongoUri);

  const testEmail = `profile_test_${Date.now()}@nexttask.test`;
  const initialPassword = "InitialPassword#123";
  const updatedPassword = "UpdatedPassword#456";
  let token = null;
  let testUserId = null;

  try {
    // ----------------------------------------------------
    // Scenario 1: Unauthorized access to profile & password
    // ----------------------------------------------------
    console.log("[Test 1] Unauthorized access without JWT");
    const unauthProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacker" }),
    });
    assert.strictEqual(unauthProfileRes.status, 401, "PUT /profile without token must return 401");
    console.log("  [PASS] PUT /api/auth/profile rejected without token (got 401)");

    const unauthPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "foo", newPassword: "bar" }),
    });
    assert.strictEqual(unauthPasswordRes.status, 401, "PUT /password without token must return 401");
    console.log("  [PASS] PUT /api/auth/password rejected without token (got 401)");

    // ----------------------------------------------------
    // Scenario 2: Register test user
    // ----------------------------------------------------
    console.log("\n[Test 2] Register test user for profile customization");
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Profile Tester",
        email: testEmail,
        password: initialPassword,
      }),
    });
    assert.strictEqual(registerRes.status, 201, "Registration should succeed with 201");
    const registerData = await registerRes.json();
    token = registerData.token;
    testUserId = registerData._id;
    assert(token, "Token should be issued");
    assert.strictEqual(registerData.avatarColor, "#38bdf8", "Default avatar color should be #38bdf8");
    assert(registerData.preferences, "Preferences object should exist");
    assert.strictEqual(registerData.preferences.pomodoroMinutes, 25, "Default pomodoro should be 25m");
    assert.strictEqual(registerData.preferences.soundEnabled, true, "Default soundEnabled should be true");
    assert(!registerData.password, "Security: Password hash must NOT be in registration response");
    console.log("  [PASS] Test user registered with default avatar color and preferences");

    // ----------------------------------------------------
    // Scenario 3: Update profile details & preferences
    // ----------------------------------------------------
    console.log("\n[Test 3] Update user profile and Pomodoro preferences");
    const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Custom Name",
        avatarColor: "#818cf8",
        preferences: {
          pomodoroMinutes: 30,
          shortBreakMinutes: 5,
          longBreakMinutes: 20,
          soundEnabled: false,
        },
      }),
    });

    assert.strictEqual(updateRes.status, 200, "Profile update should succeed with 200");
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.name, "Custom Name", "Name should be updated");
    assert.strictEqual(updateData.avatarColor, "#818cf8", "Avatar color should be updated");
    assert.strictEqual(updateData.preferences.pomodoroMinutes, 30, "Pomodoro minutes should be 30");
    assert.strictEqual(updateData.preferences.shortBreakMinutes, 5, "Short break minutes should be 5");
    assert.strictEqual(updateData.preferences.longBreakMinutes, 20, "Long break minutes should be 20");
    assert.strictEqual(updateData.preferences.soundEnabled, false, "soundEnabled should be false");
    assert(!updateData.password, "Security: Password hash must NOT be in update response");
    console.log("  [PASS] Name, avatarColor, and pomodoro preferences updated successfully");

    // ----------------------------------------------------
    // Scenario 4: Profile validation edge cases
    // ----------------------------------------------------
    console.log("\n[Test 4] Profile validation guards");
    const shortNameRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "A" }),
    });
    assert.strictEqual(shortNameRes.status, 400, "Short name (<2 chars) must return 400");
    console.log("  [PASS] Short name rejected with 400");

    const badColorRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatarColor: "not-a-color" }),
    });
    assert.strictEqual(badColorRes.status, 400, "Invalid hex color must return 400");
    console.log("  [PASS] Invalid hex color format rejected with 400");

    const badPomoRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ preferences: { pomodoroMinutes: 120 } }),
    });
    assert.strictEqual(badPomoRes.status, 400, "Pomodoro duration >60 must return 400");
    console.log("  [PASS] Pomodoro duration > 60 rejected with 400");

    // ----------------------------------------------------
    // Scenario 5: Password change validation guards
    // ----------------------------------------------------
    console.log("\n[Test 5] Password change validation guards");
    const missingFieldsRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: "some" }),
    });
    assert.strictEqual(missingFieldsRes.status, 400, "Missing newPassword must return 400");
    console.log("  [PASS] Missing newPassword rejected with 400");

    const weakPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: initialPassword, newPassword: "123" }),
    });
    assert.strictEqual(weakPasswordRes.status, 400, "Weak password (<6 chars) must return 400");
    console.log("  [PASS] Weak password (< 6 chars) rejected with 400");

    const samePasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: initialPassword, newPassword: initialPassword }),
    });
    assert.strictEqual(samePasswordRes.status, 400, "Identical password must return 400");
    console.log("  [PASS] Reusing exact current password rejected with 400");

    const wrongCurrentPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: "WrongCurrentPassword#999", newPassword: updatedPassword }),
    });
    assert.strictEqual(wrongCurrentPasswordRes.status, 400, "Incorrect current password must return 400");
    const wrongCurrentData = await wrongCurrentPasswordRes.json();
    assert.strictEqual(wrongCurrentData.message, "Current password is incorrect");
    console.log("  [PASS] Incorrect current password rejected with 400");

    // ----------------------------------------------------
    // Scenario 6: Successful password change & fresh token
    // ----------------------------------------------------
    console.log("\n[Test 6] Successful password change and token issuance");
    const changePasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: initialPassword, newPassword: updatedPassword }),
    });

    assert.strictEqual(changePasswordRes.status, 200, "Valid password change must return 200");
    const changePasswordData = await changePasswordRes.json();
    assert(changePasswordData.token, "Response must include fresh JWT token");
    assert.strictEqual(changePasswordData.message, "Password updated successfully");
    assert(!changePasswordData.user.password, "Security: Password hash must NOT be in changePassword response");
    console.log("  [PASS] Password changed successfully, fresh JWT token issued");

    // ----------------------------------------------------
    // Scenario 7: Verify login with old vs new password
    // ----------------------------------------------------
    console.log("\n[Test 7] Verify old password rejection and new password authentication");
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    assert.strictEqual(oldLoginRes.status, 401, "Login with old password must return 401");
    console.log("  [PASS] Old password rejected with 401 Unauthorized");

    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: updatedPassword }),
    });
    assert.strictEqual(newLoginRes.status, 200, "Login with new password must return 200");
    const newLoginData = await newLoginRes.json();
    assert.strictEqual(newLoginData.name, "Custom Name", "Login profile should reflect updated name");
    assert.strictEqual(newLoginData.avatarColor, "#818cf8", "Login profile should reflect updated avatarColor");
    assert.strictEqual(newLoginData.preferences.pomodoroMinutes, 30, "Login profile should reflect updated pomodoro");
    console.log("  [PASS] New password authenticated successfully with updated profile state");

    console.log("\n=== ALL PROFILE & PASSWORD TESTS PASSED (100%) ===\n");
  } finally {
    if (testUserId) {
      console.log("[Cleanup] Removing test user from database...");
      await User.deleteOne({ _id: testUserId });
      console.log("  [PASS] Test user cleaned up.");
    }
    await mongoose.disconnect();
  }
}

runProfileTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
