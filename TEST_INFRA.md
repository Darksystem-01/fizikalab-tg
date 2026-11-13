# Automated Test Infrastructure & 4-Tier Testing Philosophy

## 1. Overview & Test Architecture

The **Fizika-Lab** platform utilizes Node.js native test runner (`node:test`) and strict assertion library (`node:assert/strict`) for rapid, dependency-free, and high-fidelity end-to-end verification. Tests execute against the running Next.js HTTP production boundary, ensuring that server-side routing, cryptographic token validation, database operations, and physical numerical algorithms are verified exactly as deployed.

### Core Architecture Principles
1. **Opaque-Box Requirement Verification**: Tests interact strictly via public HTTP endpoints (`fetch`), valid session cookies, and standard API payloads. No internal state bypassing or mock facades are permitted.
2. **Deterministic Physical Benchmarks**: Simulation telemetry and solver computations are evaluated against authoritative analytical physics benchmarks (Irodov, Savelyev, Halliday & Resnick, CODATA 2022).
3. **Strict Concurrency Discipline**: The test runner enforces `--test-concurrency=1` sequentially across all test files. This eliminates `SQLITE_BUSY` file locking contention when running against file-backed SQLite (`data/fizika_lab.db`).
4. **Port Isolation**: Standalone test runners isolate production server instances across dedicated loopback ports:
   - `3197`: End-to-End 8-Chapter Verification (`tests/e2e-8chapters-verification.test.mjs`)
   - `3198`: Security Verification & Challenger (`tests/security-verification.test.mjs`, `tests/empirical-challenger-m1.mjs`)
   - `3199`: Physics & API Baseline, Stress Concurrency (`tests/physics-and-api.test.mjs`, `tests/stress-concurrency.test.mjs`)

---

## 2. The 4-Tier Testing Methodology

```
+--------------------------------------------------------------------------+
|                  TIER 4: Security & Adversarial Defense                  |
|  - AES-256-GCM token tampering     - Horizontal IDOR isolation           |
|  - Stealth 404 route concealment   - Context-bound session hijacking     |
+--------------------------------------------------------------------------+
                                    ^
+--------------------------------------------------------------------------+
|               TIER 3: Multi-Actor Educational Lifecycle                  |
|  - Student simulation & analysis   - Teacher inspection & grading        |
|  - Discrepancy comparison          - Formal protocol PDF generation      |
+--------------------------------------------------------------------------+
                                    ^
+--------------------------------------------------------------------------+
|          TIER 2: Precision Analytical Solvers & Boundary Limits          |
|  - 8-Chapter physical benchmarks   - Extreme boundary parameter inputs   |
|  - Zero calculation discrepancies  - Singularity & numerical guards      |
+--------------------------------------------------------------------------+
                                    ^
+--------------------------------------------------------------------------+
|                  TIER 1: Feature & Route Availability                    |
|  - All 8 chapter lab routes (200)  - `/api/physics/simulate` keys        |
|  - Student report recording        - PDF document generation HTTP 200    |
+--------------------------------------------------------------------------+
```

### Tier 1: Feature Journeys & Route Availability
- **Objective**: Ensure all user-facing interfaces, simulation APIs, reporting mechanisms, and document export services are accessible without unhandled runtime exceptions.
- **Scope**:
  - Verification of all 8 laboratory routes (`/labs/metrology`, `/labs/kinematics`, `/labs/dynamics`, `/labs/statics`, `/labs/electromagnetism`, `/labs/optics`, `/labs/thermodynamics`, `/labs/atomic` / `/labs/atomic-nuclear`) returning HTTP 200 for authenticated students.
  - Verification of simulation dispatch endpoint (`POST /api/physics/simulate`) accepting valid parameter payloads across all 8 chapter keys.
  - Verification of statistical analysis (`POST /api/physics/analyze`) and report submission (`POST /api/reports`).
  - Verification of PDF export endpoint returning HTTP 200 and binary `%PDF-` document structure.

### Tier 2: Analytical Benchmarks & Boundary Conditions
- **Objective**: Mathematically prove that physical simulation outputs match university-level analytical equations with zero numerical error across normal and extreme parameter ranges.
- **Scope**:
  - **Metrology**: Vernier caliper and micrometer least-count resolution, error propagation, sample mean, standard error, and Student's t-distribution confidence intervals.
  - **Kinematics**: 2D ballistic trajectory range $R = \frac{v_0^2 \sin 2\theta}{g}$, flight time, apex height, and RK4 aerodynamic drag convergence.
  - **Dynamics**: Inclined plane acceleration $a = g(\sin\theta - \mu\cos\theta)$, nonlinear pendulum period vs small-angle approximation $T_0 = 2\pi\sqrt{L/g}$, damped oscillator critical damping factor, 1D momentum & energy conservation.
  - **Statics**: Vector force table equilibrium $\sum \vec{F} = \vec{0}$, simply supported beam torque balance $\sum \tau = 0$, mechanical advantage of compound pulleys.
  - **Electromagnetism**: Wheatstone bridge null balance $R_x = R_3 \frac{R_2}{R_1}$, series RLC resonant frequency $\omega_0 = 1/\sqrt{LC}$, RC transient charging $V(t) = V_0(1 - e^{-t/RC})$.
  - **Optics**: Thin lens formula $\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}$, linear magnification $M = -d_i/d_o$, Snell's law, Cauchy dispersion across spectral lines, total internal reflection (TIR) critical angle.
  - **Thermodynamics**: Ideal gas law $PV = \nu RT$, Carnot engine efficiency $\eta = 1 - \frac{T_C}{T_H}$, Van der Waals real gas equation $(P + \frac{an^2}{V^2})(V - nb) = nRT$, Maxwell-Boltzmann characteristic molecular speeds ($v_{\text{mp}}, v_{\text{avg}}, v_{\text{rms}}$), adiabatic Poisson expansion $PV^\gamma = \text{const}$.
  - **Atomic & Nuclear**: Photoelectric stopping potential $V_s = \frac{hf - \phi}{e}$, de Broglie wavelength $\lambda = \frac{h}{p}$, Rydberg hydrogen spectral series $\frac{1}{\lambda} = R_H(\frac{1}{n_1^2} - \frac{1}{n_2^2})$, radioactive decay $N(t) = N_0 e^{-\lambda t}$, nuclear binding energy mass defect $\Delta m c^2$, gamma radiation attenuation $I = I_0 e^{-\mu x}$.
  - **Boundary Edge Cases**: Zero velocities, grazing angles (0°, 90°), minimal masses, focal point singularity guards ($d_o \to f$), critical damping factor transitions, total internal reflection boundary.

### Tier 3: Multi-Actor Educational Lifecycle
- **Objective**: Validate the full interactive lifecycle across student and teacher roles.
- **Scope**:
  1. Student authenticates and executes laboratory experiments.
  2. Student records experimental measurements and runs statistical regression / error propagation.
  3. Student submits formal laboratory report to assigned teacher/group.
  4. Teacher authenticates, inspects submitted measurements, views analytical discrepancy against theoretical benchmarks.
  5. Teacher submits grade (0–100) and qualitative feedback.
  6. Student verifies updated grade status and triggers PDF export of the evaluated report.

### Tier 4: Security Verification & Non-Regression
- **Objective**: Guarantee defense-in-depth, zero security regressions, and stealth concealment.
- **Scope**:
  - Unauthenticated access to `/labs/*`, `/api/reports`, `/api/physics/simulate` strictly redirects or rejects (HTTP 401/307).
  - Stealth 404 concealment on darksystem endpoints (`/darksystem`, `/api/darksystem/*`, `/admin`, `/api/admin/*`) for unauthorized actors.
  - Horizontal IDOR prevention across teacher group and evaluation entities.
  - Cryptographic token tampering rejection: AES-256-GCM ciphertext, IV, or authentication tag manipulation immediately rejected.
  - Role escalation prevention: Client-supplied headers (e.g. `X-User-Role: admin`) completely ignored.

---

## 3. Test Suites Inventory & Execution

| Suite File | Primary Focus | Port | Cases |
|------------|---------------|------|-------|
| `tests/e2e-8chapters-verification.test.mjs` | 4-Tier 8-Chapter Comprehensive Verification | 3197 | 15+ |
| `tests/physics-and-api.test.mjs` | Baseline Physics Solvers & API Regression | 3199 | 4 |
| `tests/security-verification.test.mjs` | Multi-tier RBAC, Session Security, Auth Defense | 3198 | 21 |
| `tests/stress-concurrency.test.mjs` | High-Concurrency Races, SQLite Resilience | 3199 | 4 |
| `tests/empirical-challenger-m1.mjs` | Token Tampering, Subnet Roaming, Replay Defense | 3198 | 38 |

### Execution Commands

```bash
# Execute entire test suite sequentially (mandatory --test-concurrency=1)
npm test

# Run individual targeted suites
npm run test:e2e          # Comprehensive 8-Chapter 4-Tier verification
npm run test:regression   # Baseline physics & API regression
npm run test:security     # Security verification suite
npm run test:stress       # Concurrency & session stress
npm run test:challenger   # Empirical token tampering & replay challenger
```

---

## 4. Coverage Thresholds & Quality Gates

To achieve passing quality status, all automated tests must satisfy:
- **Test Pass Rate**: 100% (zero failures, zero unhandled rejections).
- **Physical Accuracy**: Analytical benchmarks must match within $\le 0.1\%$ relative tolerance (pure analytical equations $< 10^{-5}$).
- **Boundary Handling**: No unhandled `NaN`, `Infinity`, division-by-zero crashes, or internal server errors (500) under edge-case inputs.
- **Database Cleanliness**: Zero `SQLITE_BUSY` errors during sequential test execution.
- **Document Export**: PDF generator must produce valid `%PDF-` document structure with non-empty payload.
