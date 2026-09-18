# Stage 6 Specification — User Authentication & Multi-Tenancy

- **Feature ID**: `STAGE-06`
- **Stage**: Stage 6 — User Authentication & Multi-Tenancy
- **Status**: `IN PROGRESS`
- **Author**: Lead Software Architect & Senior Full-Stack Engineer
- **Created Date**: 2026-09-18
- **Target Completion**: 2026-09-18

---

## 1. Problem Statement
Up through Stage 5, NextTask operates as a single-workspace application without user accounts. All tasks, projects, checklists, and focus sessions belong to a global unauthenticated scope.
To scale NextTask into a secure, multi-tenant productivity platform, users must have individual accounts, hashed password credentials, stateless JWT session tokens, and strict data isolation across all database operations. Furthermore, users should be able to authenticate seamlessly through a polished Studio Slate authentication modal, manage their user profile, and securely log out without data leakage.

---

## 2. User Stories
- **As a knowledge worker**, I want to register a personal NextTask account with my email and a secure password, so that my personal tasks, projects, and focus analytics are private and isolated from other users.
- **As a returning user**, I want to sign in to my account and receive a persistent authentication session, so that I do not need to re-login on every browser refresh.
- **As a privacy-conscious user**, I want my passwords to be securely salted and hashed with `bcrypt`, and all API requests to be verified via signed JWT tokens so that unauthorized actors cannot inspect or modify my data.
- **As a user**, I want to see my profile (display name, email, initials avatar) in the sidebar/header and be able to log out securely with 1-click.

---

## 3. Milestones Breakdown

| Milestone | Objective | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 6.1** | User Model, Password Security & JWT Auth API | `User` Mongoose model, `bcryptjs` password hashing, `jsonwebtoken` issuance, auth middleware (`protect`), `/api/auth/register`, `/api/auth/login`, `/api/auth/me`. | **COMPLETED** |
| **Milestone 6.2** | Multi-Tenant Scoping & Database Isolation | Add `userId` to `Task`, `Project`, and `FocusSession` models; scope all CRUD and aggregations to `req.user._id`; legacy data migration script; multi-tenant security verification tests. | **NEXT MILESTONE** |
| **Milestone 6.3** | Client Auth Context & Studio Slate Auth Modal | React AuthContext, Axios auth interceptors, Sign In / Sign Up modal, user profile dropdown, secure session logout, guest mode migration. | PLANNED |

---

## 4. Functional Requirements (Milestone 6.1 Focused)

1. **User Schema (`server/models/User.js`)**:
   - `name`: String, required, trimmed (min 2, max 50 chars).
   - `email`: String, required, unique, lowercase, trimmed, validated format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
   - `password`: String, required (min 6 chars, hashed before save via `bcryptjs` with salt work factor `10`).
   - Schema options: `timestamps: true` (`createdAt`, `updatedAt`).
   - `toJSON` transform: Explicitly deletes `password` and `__v` from any document serialization, preventing sensitive hash leakage.
   - Method `matchPassword(enteredPassword)` comparing plaintext password against hashed password using `bcryptjs.compare`.

2. **JWT Secret & Expiration Policy**:
   - **No Hardcoded Fallbacks**: `process.env.JWT_SECRET` is strictly mandatory. If `JWT_SECRET` is undefined or empty during server initialization or token generation/verification, the system fails fast with a clear, descriptive fatal error.
   - **Token Payload**: Minimal, non-sensitive identifier: `{ id: user._id }`.
   - **Expiration**: Standard 7-day session duration (`7d`), configurable via `process.env.JWT_EXPIRES_IN || "7d"`.
   - **Verification Behavior**:
     - Missing header -> `401 Unauthorized` with `{ message: "Not authorized. No authentication token provided." }`.
     - Expired token (`TokenExpiredError`) -> `401 Unauthorized` with `{ message: "Session expired. Please sign in again.", code: "TOKEN_EXPIRED" }`.
     - Invalid token or corrupted signature -> `401 Unauthorized` with `{ message: "Invalid authentication token.", code: "TOKEN_INVALID" }`.
     - Non-existent user -> `401 Unauthorized` with `{ message: "User session no longer valid." }`.

3. **Authentication Middleware (`server/middleware/authMiddleware.js`)**:
   - `protect`: Strict guard for authenticated endpoints (`req.headers.authorization`). Verifies token against `JWT_SECRET`, queries `User.findById(decoded.id).select("-password")`, attaches `req.user`, and calls `next()`.
   - **No `optionalAuth` for Private User Data**: Private resources must never permit unauthenticated bypass. Task routes remain unauthenticated in Milestone 6.1, and will transition to strict `protect` with `userId` query scoping in Milestone 6.2.

4. **REST Endpoints (`server/routes/authRoutes.js`)**:
   - `POST /api/auth/register`: Accepts `{ name, email, password }`. Validates non-empty fields, email regex format, and minimum 6-character password. Checks for existing user (returns `400 Bad Request` if duplicate). Creates user, generates JWT, and returns `201 Created` with `{ _id, name, email, token }`.
   - `POST /api/auth/login`: Accepts `{ email, password }`. Validates presence. Normalizes email. Compares credentials (returns unified `401 Unauthorized` with `"Invalid email or password"` on mismatch to prevent user enumeration). Returns `200 OK` with `{ _id, name, email, token }`.
   - `GET /api/auth/me`: Protected route guarded by `protect`. Returns `200 OK` with `{ _id, name, email, createdAt }` of the authenticated user.

5. **Existing Task Ownership & Migration Strategy**:
   - **Analysis**: Currently, existing `Task`, `Project`, and `FocusSession` documents do not contain a `userId` field.
   - **Boundary**: Milestone 6.1 introduces ONLY the authentication endpoints (`/api/auth/*`) and leaves existing task routes unchanged.
   - **Milestone 6.2 Migration Strategy**: When `userId` is added to task models in Milestone 6.2, we will implement a safe migration script (`server/scripts/migrateLegacyTasksToUser.js`) that allows claiming or associating all orphaned records to a chosen developer user ID, ensuring no silent deletions or unintentional data loss occur.

---

## 5. Non-Functional Requirements
- **Security**: Passwords hashed with `bcryptjs` (cost factor 10). Sensitive fields stripped from all responses. Uniform error messages for credential failures.
- **Environment Integrity**: Strict validation of required secrets (`JWT_SECRET`). Clear instructions in `.env.example` without publishing actual credentials.
- **Performance**: Database-level unique index on `email`. Sub-millisecond JWT verification.

---

## 6. Definition of Done for Milestone 6.1
- [ ] `bcryptjs` and `jsonwebtoken` added to `server/package.json`.
- [ ] `server/models/User.js` implemented with `pre("save")` hashing, `matchPassword`, and password stripping on serialization.
- [ ] `server/middleware/authMiddleware.js` implemented with strict `protect` middleware and clear token failure handling.
- [ ] `server/controllers/authController.js` implemented with `registerUser`, `loginUser`, `getMe`.
- [ ] `server/routes/authRoutes.js` mounted at `/api/auth` in `server/server.js`.
- [ ] `server/.env.example` updated with `JWT_SECRET` and `JWT_EXPIRES_IN`.
- [ ] `server/.env` configured with development `JWT_SECRET`.
- [ ] Comprehensive automated test suite in `scratch/test_milestone_6_1.js` verifies all 12 test conditions (registration, duplicate check, password strength, login, invalid credentials, token verification, token expiration, secret failure, password omission).
- [ ] Existing task, project, and focus session endpoints verified functional.
