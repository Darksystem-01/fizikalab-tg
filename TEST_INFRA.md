# Test Infrastructure & Methodology: fizika-lab Security Verification

## 1. Philosophy & Testing Principles

The testing infrastructure for `fizika-lab` is built upon strict automated security verification principles:

1. **Opaque-Box & Network-Boundary Testing**:
   - Tests execute against a running production instance of the Next.js server via standard HTTP requests (`fetch`), cookies, and headers.
   - Tests do not mock internal module methods, do not inspect private database tables, and do not access internal crypto keys.
   - All assertions evaluate purely observable network contracts: HTTP status codes, response headers, `Set-Cookie` directives, response bodies, and stateful side-effects.

2. **Requirement-Driven Assertions**:
   - Every assertion is grounded in the security requirements defined in `ORIGINAL_REQUEST.md` (R1: Session Security & Replay Prevention, R2: Access Control & Privilege Escalation, R3: Vulnerability Hardening & Rate Limiting, R4: Automated Security Verification).
   - Authoritative specifications discovered in `handoff.md` and `PROJECT.md` define the exact contract boundaries and expected error responses.

3. **Zero Coupling with Implementation Internals**:
   - Tests remain agnostic of database engine choice (SQLite fallback vs PostgreSQL), crypto implementation libraries, or internal folder refactorings.
   - Any compliant implementation that satisfies the HTTP interface contracts passes the test suite.

4. **Progressive Red-Team Baseline**:
   - Before security hardening milestones (M1–M3) are implemented, certain Tier 4 tests (such as Burp Suite proxy replay detection, rotated token reuse rejection, and rate limit enforcement) objectively demonstrate existing vulnerabilities (red-team baseline).
   - As builders complete implementation milestones, tests transition from failing to passing, providing objective evidence of hardening.

---

## 2. Feature Inventory & 4-Tier Test Breakdown

The test suite in `tests/security-verification.test.mjs` is structured into 4 distinct testing tiers:

### Tier 1: Feature Coverage (Core User Journeys & Baseline Regression)
Validates that fundamental application workflows continue to operate seamlessly under production configurations:
- **T1.1: Health Probe & Security Headers**: Non-leakage health check (`GET /api/health`), verification of `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- **T1.2: Student Lifecycle**: Registration with accredited university catalog validation, session cookie acquisition, execution of 6 physics simulation engines, and lab report submission.
- **T1.3: Teacher Lifecycle**: Provisioning by administrator, academic group creation, lab assignment publication, and student report grading.
- **T1.4: Sole Administrator Lifecycle**: Configured credential login against `ADMIN_SECRET` / HMAC, darksystem access, stealth route verification, student banning, and account deletion.
- **T1.5: Google OAuth Student Onboarding**: Multi-step student registration workflow requiring university and faculty completion.

### Tier 2: Boundary & Negative Testing
Validates error handling, input validation, and resilience against edge cases:
- **T2.1: Authentication Input Boundaries**: Empty fields, short passwords (<6 characters), fake/unregistered universities, mismatched faculty-university pairings, disposable email domains (`tempmail.com`), and CRLF injection payloads in email headers.
- **T2.2: Physics Simulation Extremes**: Zero velocities, boundary angles (0°, 90°), empty statistical arrays (`values: []`), single data point regressions, and zero-error vernier measurements.
- **T2.3: Malformed Payloads & Non-Numeric Identifiers**: Invalid JSON bodies and non-numeric route parameters (`/api/teacher/reports/abc`) returning graceful 400 Bad Request responses without unhandled 500 server crashes.

### Tier 3: Cross-Feature State & Concurrency Interactions
Validates state synchronization, multi-actor collaboration, and session revocation:
- **T3.1: Mid-Session Account Banning & Instant Revocation**: Real-time invalidation of active session tokens when an administrator bans a user, immediately rejecting subsequent calls with HTTP 401.
- **T3.2: Multi-Actor Collaborative Workflow**: Student submits report $\rightarrow$ Teacher inspects and grades report $\rightarrow$ Student verifies score and feedback in their own dashboard.
- **T3.3: Automatic Token Rotation Handoff**: Token rotation trigger on `/api/auth/me` when token age exceeds 30 seconds, verifying the client can seamlessly continue requests with the refreshed token.
- **T3.4: Teacher Horizontal Group Isolation**: Multi-tenant isolation ensuring Teacher B cannot inspect, alter, or delete groups owned by Teacher A (HTTP 403 Forbidden).

### Tier 4: Real-World Security & Attack Scenarios
Simulates realistic adversarial attack vectors matching OWASP Top 10 and enterprise penetration testing standards:
- **T4.1: Burp Suite Session Replay Simulation**: Interception and replay of legitimate session cookies from mismatched client contexts (altered `User-Agent` and `X-Forwarded-For` network IP), asserting strict HTTP 401 Unauthorized rejection.
- **T4.2: Cookie Tampering & Cryptographic Integrity**: Bit-flipping and byte tampering of AES-256-GCM ciphertext, initialization vector (IV), and authentication tag, asserting strict decryption rejection (HTTP 401).
- **T4.3: Token Rotation Reuse Attack**: Capturing an initial token (`token_v1`), completing rotation to `token_v2`, and attempting to replay superseded `token_v1`, asserting rejection with HTTP 401.
- **T4.4: Role Header Injection & Privilege Escalation**: Submitting spoofed role headers (`X-User-Role: admin`, `X-Role: darksystem`, `Role: admin`, `X-Forwarded-User: admin`) from a student session against protected `/darksystem` endpoints, asserting stealth HTTP 404 concealment.
- **T4.5: Anti-Admin OAuth Hijacking Defense**: Attempting to authenticate the administrator identity via Google OAuth, asserting HTTP 403 Forbidden.
- **T4.6: Credential Stuffing & Brute Force Rate Limiting**: Burst of rapid failed login attempts triggering HTTP 429 Too Many Requests with exponential backoff / retry headers.
- **T4.7: Stored & Reflected XSS Payload Defense**: Submitting malicious script tags (`<script>alert('XSS')</script>`, `<img src=x onerror=...>`) in report titles, student names, and group names, asserting HTML escaping or sanitization.
- **T4.8: Information Disclosure Reconnaissance Defense**: Probing non-existent and administrative endpoints to ensure zero leakage of stack traces, internal database details, or admin credentials.

---

## 3. Test Runner Commands & Lifecycle Management

### Test Architecture & Server Management
Tests use the Node.js native test runner (`node:test`) and strict assertions (`node:assert/strict`).
The test files manage the Next.js server lifecycle independently:
- **Port Allocation**:
  - `tests/physics-and-api.test.mjs` runs on port **3199**.
  - `tests/security-verification.test.mjs` runs on port **3198** (configurable via `TEST_BASE_URL`).
- **Server Spawning**:
  - `test.before`: Spawns `npx next start -p <port> -H 127.0.0.1` in production mode (`NODE_ENV=production`) with configured test secrets.
  - Health probe: Polls `GET /api/health` with exponential backoff until the server responds with 200 OK before executing test cases.
- **Teardown**:
  - `test.after`: Gracefully terminates the child process with `SIGTERM` and cleans up temporary resources.

### Execution Commands

1. **Run Baseline Physics & API Regression Suite**:
   ```bash
   node --test tests/physics-and-api.test.mjs
   ```
   *Expected Result*: 4/4 passing (100% pass rate, ~2.2s execution time).

2. **Run E2E Security Verification Test Suite**:
   ```bash
   node --test tests/security-verification.test.mjs
   ```
   *Pass/Fail Semantics*:
   - Tiers 1, 2, and 3 pass against baseline behavior.
   - Tier 4 tests define objective target criteria; tests exercising unhardened capabilities (e.g., client context replay rejection, rotated token reuse rejection) document red-team baseline failures until M1-M3 builders apply hardening.

3. **Run Both Suites**:
   ```bash
   node --test tests/physics-and-api.test.mjs tests/security-verification.test.mjs
   ```

---

## 4. Pass / Fail Semantics

- **Pass (Exit Code 0)**:
  - All test assertions succeed.
  - No uncaught exceptions or timeouts occur.
  - Zero regression in core laboratory simulations, catalog queries, and existing authentication lifecycles.
- **Fail (Exit Code $\neq$ 0)**:
  - An assertion fails (e.g., replayed cookie is accepted instead of rejected with 401; unhandled server crash returns 500 instead of 400).
  - The server fails to start or respond within the 20-second health check timeout.
  - Memory or process leak prevents clean child process shutdown.
