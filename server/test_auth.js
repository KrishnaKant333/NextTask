import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";
import { getJwtSecret } from "./middleware/authMiddleware.js";

const BASE_URL = "http://localhost:5000/api/auth";

async function runTests() {
  console.log("=== STARTING MILESTONE 6.1 AUTHENTICATION TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const uniqueSuffix = Date.now();
  const testEmail = `test_auth_${uniqueSuffix}@example.com`;
  const testPassword = "StrongPassword#2026";
  const testName = "Test Auth User";
  let createdUserId = null;
  let authToken = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Fail-fast when JWT_SECRET is missing
    // -------------------------------------------------------------
    console.log("\n[Test 1] JWT Secret missing configuration failure");
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    let caughtSecretError = false;
    try {
      getJwtSecret();
    } catch (err) {
      caughtSecretError = true;
      assert(
        err.message.includes("FATAL: JWT_SECRET environment variable is not defined"),
        "getJwtSecret() throws fatal error when JWT_SECRET is missing"
      );
    }
    assert(caughtSecretError, "Missing JWT_SECRET fails fast with exception");
    process.env.JWT_SECRET = originalSecret; // Restore

    // -------------------------------------------------------------
    // Test 2: Invalid registration (Missing fields)
    // -------------------------------------------------------------
    console.log("\n[Test 2] Registration missing fields");
    const resMissing = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const dataMissing = await resMissing.json();
    assert(resMissing.status === 400, `Missing fields returns 400 (got ${resMissing.status})`);
    assert(dataMissing.message.includes("required fields"), "Missing fields returns helpful message");

    // -------------------------------------------------------------
    // Test 3: Invalid registration (Invalid email format)
    // -------------------------------------------------------------
    console.log("\n[Test 3] Registration invalid email format");
    const resInvalidEmail = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: testName, email: "invalid-email-address", password: testPassword }),
    });
    const dataInvalidEmail = await resInvalidEmail.json();
    assert(resInvalidEmail.status === 400, `Invalid email returns 400 (got ${resInvalidEmail.status})`);
    assert(dataInvalidEmail.message.includes("valid email address"), "Invalid email returns proper error");

    // -------------------------------------------------------------
    // Test 4: Invalid registration (Weak password < 6 chars)
    // -------------------------------------------------------------
    console.log("\n[Test 4] Registration weak password");
    const resWeakPass = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: testName, email: testEmail, password: "123" }),
    });
    const dataWeakPass = await resWeakPass.json();
    assert(resWeakPass.status === 400, `Weak password returns 400 (got ${resWeakPass.status})`);
    assert(dataWeakPass.message.includes("at least 6 characters"), "Weak password returns length requirement");

    // -------------------------------------------------------------
    // Test 5: Valid registration
    // -------------------------------------------------------------
    console.log("\n[Test 5] Valid registration");
    const resValidReg = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const dataValidReg = await resValidReg.json();
    assert(resValidReg.status === 201, `Valid registration returns 201 (got ${resValidReg.status})`);
    assert(!!dataValidReg._id, "Response contains user _id");
    assert(dataValidReg.name === testName, "Response contains correct user name");
    assert(dataValidReg.email === testEmail.toLowerCase(), "Response contains normalized email");
    assert(typeof dataValidReg.token === "string" && dataValidReg.token.length > 20, "Response contains valid JWT string");
    assert(dataValidReg.password === undefined, "Security: Password field is omitted from registration response");

    createdUserId = dataValidReg._id;
    authToken = dataValidReg.token;

    // -------------------------------------------------------------
    // Test 6: Duplicate registration
    // -------------------------------------------------------------
    console.log("\n[Test 6] Duplicate registration rejection");
    const resDup = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: testName, email: testEmail.toUpperCase(), password: testPassword }),
    });
    const dataDup = await resDup.json();
    assert(resDup.status === 400, `Duplicate email registration returns 400 (got ${resDup.status})`);
    assert(dataDup.message.includes("already exists"), "Duplicate registration returns user already exists message");

    // -------------------------------------------------------------
    // Test 7: Valid login
    // -------------------------------------------------------------
    console.log("\n[Test 7] Valid login");
    const resLogin = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const dataLogin = await resLogin.json();
    assert(resLogin.status === 200, `Valid login returns 200 (got ${resLogin.status})`);
    assert(dataLogin._id === createdUserId, "Login returns matching user ID");
    assert(typeof dataLogin.token === "string" && dataLogin.token.length > 20, "Login returns valid JWT");
    assert(dataLogin.password === undefined, "Security: Password field is omitted from login response");

    // -------------------------------------------------------------
    // Test 8: Invalid login credentials (Wrong password)
    // -------------------------------------------------------------
    console.log("\n[Test 8] Invalid login credentials (Wrong password)");
    const resWrongPass = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "wrongpassword123" }),
    });
    const dataWrongPass = await resWrongPass.json();
    assert(resWrongPass.status === 401, `Wrong password returns 401 (got ${resWrongPass.status})`);
    assert(dataWrongPass.message === "Invalid email or password", "Returns generic non-enumerating error message");

    // -------------------------------------------------------------
    // Test 9: Invalid login credentials (Non-existent email)
    // -------------------------------------------------------------
    console.log("\n[Test 9] Invalid login credentials (Non-existent email)");
    const resNonExist = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "doesnotexist_random@example.com", password: testPassword }),
    });
    const dataNonExist = await resNonExist.json();
    assert(resNonExist.status === 401, `Non-existent email returns 401 (got ${resNonExist.status})`);
    assert(dataNonExist.message === "Invalid email or password", "Consistent error message prevents email enumeration");

    // -------------------------------------------------------------
    // Test 10: Protected endpoint without token
    // -------------------------------------------------------------
    console.log("\n[Test 10] Protected /api/auth/me without token");
    const resNoToken = await fetch(`${BASE_URL}/me`);
    const dataNoToken = await resNoToken.json();
    assert(resNoToken.status === 401, `Request without token returns 401 (got ${resNoToken.status})`);
    assert(dataNoToken.message.includes("token missing"), "Error specifies token is missing");

    // -------------------------------------------------------------
    // Test 11: Protected endpoint with invalid token
    // -------------------------------------------------------------
    console.log("\n[Test 11] Protected /api/auth/me with invalid token");
    const resInvalidToken = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: "Bearer this-is-a-garbage-invalid-token" },
    });
    const dataInvalidToken = await resInvalidToken.json();
    assert(resInvalidToken.status === 401, `Invalid token returns 401 (got ${resInvalidToken.status})`);
    assert(dataInvalidToken.message.includes("token invalid"), "Error specifies token is invalid");

    // -------------------------------------------------------------
    // Test 12: Protected endpoint with expired token
    // -------------------------------------------------------------
    console.log("\n[Test 12] Protected /api/auth/me with expired token");
    const expiredToken = jwt.sign({ id: createdUserId }, process.env.JWT_SECRET, {
      expiresIn: "1ms",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const resExpired = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const dataExpired = await resExpired.json();
    assert(resExpired.status === 401, `Expired token returns 401 (got ${resExpired.status})`);
    assert(dataExpired.message.includes("token expired"), "Error message mentions token expired");
    assert(dataExpired.code === "TOKEN_EXPIRED", "Error code is TOKEN_EXPIRED");

    // -------------------------------------------------------------
    // Test 13: Protected endpoint with valid token
    // -------------------------------------------------------------
    console.log("\n[Test 13] Protected /api/auth/me with valid token");
    const resMe = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const dataMe = await resMe.json();
    assert(resMe.status === 200, `Valid token returns 200 (got ${resMe.status})`);
    assert(dataMe._id === createdUserId, "Identity endpoint returns correct user _id");
    assert(dataMe.email === testEmail.toLowerCase(), "Identity endpoint returns correct email");
    assert(dataMe.name === testName, "Identity endpoint returns correct name");
    assert(dataMe.password === undefined, "Security: Password field is omitted from /me response");
    assert(!!dataMe.createdAt, "Response contains timestamps");

  } finally {
    // -------------------------------------------------------------
    // Cleanup: Remove test user from database
    // -------------------------------------------------------------
    console.log("\n[Cleanup] Cleaning up test data from database...");
    await mongoose.connect(process.env.MONGO_URI);
    if (createdUserId) {
      const deleteResult = await User.findByIdAndDelete(createdUserId);
      console.log(`  Cleaned up user ${createdUserId}: ${deleteResult ? "SUCCESS" : "NOT FOUND"}`);
    }
    await mongoose.disconnect();
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution threw unhandled exception:", err);
  process.exit(1);
});
