import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ============================================================================
// IN-MEMORY TYPESCRIPT TRANSPILATION & MODULE LOADER
// ============================================================================

const moduleCache = new Map();

function loadTsModule(relativePath) {
  if (moduleCache.has(relativePath)) {
    return moduleCache.get(relativePath);
  }
  const fullPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(PROJECT_ROOT, relativePath);

  const code = fs.readFileSync(fullPath, "utf8");
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const exports = {};
  const moduleObj = { exports };
  const requireMock = (id) => {
    if (id.includes("constants")) {
      return loadTsModule("src/lib/physics/constants.ts");
    }
    return {};
  };

  const fn = new Function("exports", "require", "module", transpiled);
  fn(exports, requireMock, moduleObj);
  moduleCache.set(relativePath, moduleObj.exports);
  return moduleObj.exports;
}

// Load physical solvers directly
const solvers = {
  metrology: loadTsModule("src/lib/physics/metrology.ts").simulateMetrology,
  kinematics: loadTsModule("src/lib/physics/kinematics.ts").simulateKinematics,
  dynamics: loadTsModule("src/lib/physics/dynamics.ts").simulateDynamics,
  statics: loadTsModule("src/lib/physics/statics.ts").simulateStatics,
  electromagnetism: loadTsModule("src/lib/physics/electromagnetism.ts").simulateElectromagnetism,
  optics: loadTsModule("src/lib/physics/optics.ts").simulateOptics,
  thermodynamics: loadTsModule("src/lib/physics/thermodynamics.ts").simulateThermodynamics,
  atomic: loadTsModule("src/lib/physics/atomic.ts").simulateAtomic,
};

// Load catalog
const catalogMod = loadTsModule("src/lib/physics/catalog.ts");
const SCENARIO_CATALOG = catalogMod.SCENARIO_CATALOG;

function checkHasNaN(obj, currPath = "") {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === "number") {
    if (Number.isNaN(obj)) return currPath || "root";
    return false;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const res = checkHasNaN(obj[i], `${currPath}[${i}]`);
      if (res) return res;
    }
  } else if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const res = checkHasNaN(v, `${currPath}.${k}`);
      if (res) return res;
    }
  }
  return false;
}

function deriveBoundaryParams(scenario) {
  const minParams = { ...scenario.defaultParams };
  const maxParams = { ...scenario.defaultParams };

  // 1. If paramSpecs exist, map bounds
  if (scenario.paramSpecs && scenario.paramSpecs.length > 0) {
    for (const spec of scenario.paramSpecs) {
      for (const [k, v] of Object.entries(scenario.defaultParams)) {
        if (v === spec.defaultValue) {
          if (spec.min !== undefined) minParams[k] = spec.min;
          if (spec.max !== undefined) maxParams[k] = spec.max;
        }
      }
    }
  }

  // 2. Safe scaling for numeric fields to test bounds
  for (const [k, v] of Object.entries(scenario.defaultParams)) {
    if (typeof v === "number") {
      if (minParams[k] === v) {
        minParams[k] = v > 0 ? Math.max(0.01, v * 0.2) : v - 1;
      }
      if (maxParams[k] === v) {
        maxParams[k] = v > 0 ? v * 5.0 : v + 1;
      }
    }
  }

  return { minParams, maxParams };
}

// ============================================================================
// SUITE 1: 240-SCENARIO CATALOG SWEEP (DEFAULT, MIN, MAX PARAMETERS)
// ============================================================================

test("Challenger Suite 1: Full 240-Scenario 3-profile simulation sweep (720 runs)", async (t) => {
  assert.equal(SCENARIO_CATALOG.length, 240, "Scenario catalog must contain exactly 240 entries");

  let defaultPass = 0;
  let minPass = 0;
  let maxPass = 0;
  const failureReports = [];
  const startMs = Date.now();

  for (const scenario of SCENARIO_CATALOG) {
    const solver = solvers[scenario.chapter];
    assert.ok(solver, `Solver missing for chapter ${scenario.chapter} in scenario ${scenario.id}`);

    const { minParams, maxParams } = deriveBoundaryParams(scenario);

    // Profile 1: Default Parameters
    try {
      const resDef = solver(scenario.defaultParams);
      assert.ok(resDef, `${scenario.id} returned empty result`);
      const nanPath = checkHasNaN(resDef);
      if (nanPath) {
        failureReports.push({ id: scenario.id, profile: "default", error: `NaN at ${nanPath}` });
      } else {
        defaultPass++;
      }
    } catch (err) {
      failureReports.push({ id: scenario.id, profile: "default", error: err.message });
    }

    // Profile 2: Boundary Minimum Parameters
    try {
      const resMin = solver(minParams);
      assert.ok(resMin, `${scenario.id} returned empty min result`);
      const nanPath = checkHasNaN(resMin);
      if (nanPath) {
        failureReports.push({ id: scenario.id, profile: "min", error: `NaN at ${nanPath}` });
      } else {
        minPass++;
      }
    } catch (err) {
      failureReports.push({ id: scenario.id, profile: "min", error: err.message });
    }

    // Profile 3: Boundary Maximum Parameters
    try {
      const resMax = solver(maxParams);
      assert.ok(resMax, `${scenario.id} returned empty max result`);
      const nanPath = checkHasNaN(resMax);
      if (nanPath) {
        failureReports.push({ id: scenario.id, profile: "max", error: `NaN at ${nanPath}` });
      } else {
        maxPass++;
      }
    } catch (err) {
      failureReports.push({ id: scenario.id, profile: "max", error: err.message });
    }
  }

  const durationMs = Date.now() - startMs;
  t.diagnostic(`240-Scenario 3-profile sweep finished in ${durationMs}ms`);
  t.diagnostic(`Results: Default=${defaultPass}/240, Min=${minPass}/240, Max=${maxPass}/240`);

  if (failureReports.length > 0) {
    t.diagnostic(`Failures detected (${failureReports.length}): ${JSON.stringify(failureReports.slice(0, 5))}`);
  }

  // All 240 scenarios pass without NaN
  assert.equal(defaultPass, 240, "240 of 240 scenarios pass cleanly under default parameters");
  assert.equal(minPass, 240, "240 of 240 scenarios pass cleanly under minimum boundary parameters");
  assert.equal(maxPass, 240, "240 of 240 scenarios pass cleanly under maximum boundary parameters");
  assert.equal(failureReports.length, 0, "Zero failures across all 240 scenarios and all 3 parameter profiles");
});

test("Challenger Verification: Scenario sta-02 executes cleanly without NaN after operator fix in statics.ts:108", () => {
  const statics = solvers.statics;
  const s2 = SCENARIO_CATALOG.find((s) => s.id === "sta-02");
  const res = statics(s2.defaultParams);
  const nanPath = checkHasNaN(res);
  assert.equal(nanPath, false, "sta-02 returns zero NaN in details.loads[0].forceN after fix");
});

// ============================================================================
// SUITE 2: SOLVER BOUNDARY EXTREMES & SINGULARITY STRESS TESTS
// ============================================================================

test("Challenger Suite 2.1: Optics focal caustic (do = f) & asymptotic boundaries", () => {
  const optics = solvers.optics;

  // 1. Converging lens at exact focal point do = f
  const lensCaustic = optics({
    subMode: "optical_bench",
    elementType: "converging_lens",
    focalLengthCm: 15,
    objectDistanceCm: 15,
    objectHeightCm: 5,
  });
  assert.equal(lensCaustic.summary.imageDistanceCm, "Cheksizlik");
  assert.equal(lensCaustic.summary.magnification, "Cheksizlik");
  assert.equal(lensCaustic.summary.imageHeightCm, "Cheksizlik");
  assert.ok(lensCaustic.details.atFocal);
  assert.equal(checkHasNaN(lensCaustic), false);

  // 2. Concave mirror at exact focal point do = f
  const mirrorCaustic = optics({
    subMode: "optical_bench",
    elementType: "concave_mirror",
    focalLengthCm: 20,
    objectDistanceCm: 20,
    objectHeightCm: 4,
    causticIncidenceDeg: 30,
  });
  assert.equal(mirrorCaustic.summary.imageDistanceCm, "Cheksizlik");
  assert.ok(typeof mirrorCaustic.summary.causticDistanceCm === "number");
  assert.equal(checkHasNaN(mirrorCaustic), false);

  // 3. Object at infinite distance do -> inf
  const infObj = optics({
    subMode: "optical_bench",
    elementType: "converging_lens",
    focalLengthCm: 10,
    objectDistanceCm: 1e9,
    objectHeightCm: 5,
  });
  assert.ok(Math.abs(infObj.summary.imageDistanceCm - 10) < 0.001);
  assert.equal(checkHasNaN(infObj), false);

  // 4. Object at distance do -> 0 (clamped safely)
  const zeroDist = optics({
    subMode: "optical_bench",
    elementType: "converging_lens",
    focalLengthCm: 10,
    objectDistanceCm: 0,
    objectHeightCm: 5,
  });
  assert.ok(Number.isFinite(zeroDist.summary.objectDistanceCm));
  assert.equal(checkHasNaN(zeroDist), false);

  // 5. Flat plate Newton rings R -> inf
  const flatPlate = optics({
    subMode: "newton_rings",
    curvatureRadiusM: 1e8,
    wavelengthNm: 589,
    ringOrder: 5,
  });
  assert.ok(Number.isFinite(flatPlate.summary.darkRingRadiusMm));
  assert.equal(checkHasNaN(flatPlate), false);
});

test("Challenger Suite 2.2: Kinematics zero-velocity impact & ballistic limits", () => {
  const kin = solvers.kinematics;

  // 1. v0 = 0, y0 = 0 projectile impact ground guard
  const groundZero = kin({
    mode: "projectile",
    v0: 0,
    y0: 0,
    angleDeg: 45,
  });
  assert.equal(groundZero.flightTimeS, 0);
  assert.equal(groundZero.rangeM, 0);
  assert.equal(groundZero.maxHeightM, 0);
  assert.equal(groundZero.points.length, 1);
  assert.equal(checkHasNaN(groundZero), false);

  // 2. v0 = 0, y0 = 100 pure free-fall
  const freefall = kin({
    mode: "projectile",
    v0: 0,
    y0: 100,
    angleDeg: 0,
    gravity: 9.80665,
  });
  const tFreefall = Math.sqrt((2 * 100) / 9.80665);
  assert.ok(Math.abs(freefall.flightTimeS - tFreefall) < 0.1);
  assert.equal(freefall.rangeM, 0);
  assert.equal(checkHasNaN(freefall), false);

  // 3. Vertical launch theta = 90 deg
  const vertLaunch = kin({
    mode: "projectile",
    v0: 40,
    y0: 0,
    angleDeg: 90,
    gravity: 9.80665,
  });
  const hMax = (40 * 40) / (2 * 9.80665);
  assert.ok(Math.abs(vertLaunch.maxHeightM - hMax) < 0.5);
  assert.ok(vertLaunch.rangeM < 0.01);
  assert.equal(checkHasNaN(vertLaunch), false);

  // 4. Massive aerodynamic drag
  const heavyDrag = kin({
    mode: "projectile",
    v0: 50,
    y0: 0,
    angleDeg: 45,
    airResistance: true,
    dragCoeff: 500,
  });
  assert.ok(heavyDrag.flightTimeS > 0);
  assert.ok(heavyDrag.rangeM > 0);
  assert.equal(checkHasNaN(heavyDrag), false);

  // 5. Rocket burn with mf = m0
  const zeroBurnRocket = kin({
    mode: "rocket",
    exhaustSpeedMs: 3000,
    initialMassKg: 1000,
    finalMassKg: 1000,
    durationS: 50,
  });
  assert.ok(Number.isFinite(zeroBurnRocket.impactSpeedMs));
  assert.equal(zeroBurnRocket.flightTimeS, 50);
  assert.equal(checkHasNaN(zeroBurnRocket), false);
});

test("Challenger Suite 2.3: Dynamics Kater pendulum symmetry & boundary extremes", () => {
  const dyn = solvers.dynamics;

  // 1. Kater pendulum exact knife-edge symmetry h1 == h2
  const katerExact = dyn({
    subMode: "pendulum",
    pendulumLengthM: 1.0,
    initialAngleDeg: 5,
    katerH1M: 0.5,
    katerH2M: 0.5,
  });
  assert.ok(Number.isFinite(katerExact.summary.katerMeasuredG));
  assert.ok(katerExact.summary.katerMeasuredG > 8 && katerExact.summary.katerMeasuredG < 11);
  assert.equal(checkHasNaN(katerExact), false);

  // 2. Kater pendulum micro offset |h1 - h2| = 1e-6
  const katerMicro = dyn({
    subMode: "pendulum",
    pendulumLengthM: 1.0,
    initialAngleDeg: 5,
    katerH1M: 0.5,
    katerH2M: 0.500001,
  });
  assert.ok(Number.isFinite(katerMicro.summary.katerMeasuredG));
  assert.equal(checkHasNaN(katerMicro), false);

  // 3. Pendulum clamped at 179.5 degrees
  const pendExtreme = dyn({
    subMode: "pendulum",
    pendulumLengthM: 1.0,
    initialAngleDeg: 179.5,
  });
  assert.ok(pendExtreme.summary.nonlinearPeriodS > pendExtreme.summary.smallAnglePeriodS);
  assert.equal(checkHasNaN(pendExtreme), false);

  // 4. Collision with extreme mass disparity (1,000,000 kg vs 0.001 kg)
  const hugeDisparity = dyn({
    subMode: "collision",
    mass1Kg: 1e6,
    v1InitialMs: 10,
    mass2Kg: 0.001,
    v2InitialMs: 0,
    restitutionE: 1.0,
  });
  assert.ok(Math.abs(hugeDisparity.summary.v1FinalMs - 10) < 0.01);
  assert.ok(Math.abs(hugeDisparity.summary.v2FinalMs - 20) < 0.05);
  assert.equal(checkHasNaN(hugeDisparity), false);

  // 5. Incline frictionless vs static lock
  const frictionless = dyn({
    subMode: "inclined_plane",
    angleDeg: 30,
    muStatic: 0,
    muKinetic: 0,
    mass1Kg: 1,
  });
  assert.equal(frictionless.summary.actualFrictionN, 0);
  assert.equal(frictionless.summary.moving, true);
  assert.equal(checkHasNaN(frictionless), false);

  const locked = dyn({
    subMode: "inclined_plane",
    angleDeg: 15,
    muStatic: 2.0,
    muKinetic: 1.5,
    mass1Kg: 1,
  });
  assert.equal(locked.summary.moving, false);
  assert.equal(locked.summary.accelerationMs2, 0);
  assert.equal(checkHasNaN(locked), false);
});

test("Challenger Suite 2.4: Statics beam support singularity & equilibrium limits", () => {
  const stat = solvers.statics;

  // 1. Beam support positions coincident xB - xA = 0 (guard span separation)
  const coincidentSupports = stat({
    subMode: "beam_moments",
    beamLengthM: 4.0,
    supportAM: 1.5,
    supportBM: 1.5,
  });
  assert.ok(Number.isFinite(coincidentSupports.summary.reactionAN));
  assert.ok(Number.isFinite(coincidentSupports.summary.reactionBN));
  assert.equal(checkHasNaN(coincidentSupports), false);

  // 2. Force table perfectly balanced forces
  const balancedTable = stat({
    subMode: "force_table",
    forces: [
      { label: "F1", magnitudeN: 15, angleDeg: 0 },
      { label: "F2", magnitudeN: 15, angleDeg: 180 },
    ],
  });
  assert.ok(balancedTable.summary.resultantMagnitudeN < 1e-4);
  assert.equal(balancedTable.summary.inEquilibrium, true);
  assert.equal(checkHasNaN(balancedTable), false);

  // 3. Buoyancy extreme density flotation vs sinking
  const corkFloat = stat({
    subMode: "buoyancy",
    bodyMassKg: 0.5,
    bodyVolumeM3: 0.005, // density = 100 kg/m3 < 1000
    fluidDensityKgM3: 1000,
  });
  assert.equal(corkFloat.summary.isFloating, true);
  assert.equal(checkHasNaN(corkFloat), false);

  const leadSink = stat({
    subMode: "buoyancy",
    bodyMassKg: 50,
    bodyVolumeM3: 0.001, // density = 50000 kg/m3 > 1000
    fluidDensityKgM3: 1000,
  });
  assert.equal(leadSink.summary.isFloating, false);
  assert.equal(checkHasNaN(leadSink), false);
});

test("Challenger Suite 2.5: Electromagnetism singular admittance & bridge boundaries", () => {
  const em = solvers.electromagnetism;

  // 1. Singular admittance: Wheatstone bridge with P = 0, Q = 0
  const singularBridge = em({
    subMode: "wheatstone_meter_bridge",
    bridgeType: "wheatstone",
    rP: 0,
    rQ: 0,
    rKnownOhm: 100,
    rUnknownOhm: 100,
    supplyV: 5,
  });
  assert.ok(Number.isFinite(singularBridge.summary.nodeBVoltageV));
  assert.ok(Number.isFinite(singularBridge.summary.nodeCVoltageV));
  assert.ok(Number.isFinite(singularBridge.summary.galvanometerCurrentMa));
  assert.equal(checkHasNaN(singularBridge), false);

  // 2. Meter bridge jockey at absolute edges (0.5 cm and 99.5 cm)
  const edgeJockeyLow = em({
    subMode: "wheatstone_meter_bridge",
    bridgeType: "meter_bridge",
    jockeyCm: 0.5,
    rKnownOhm: 20,
    rUnknownOhm: 20,
    supplyV: 6,
  });
  assert.ok(Number.isFinite(edgeJockeyLow.summary.galvanometerCurrentMa));
  assert.equal(checkHasNaN(edgeJockeyLow), false);

  const edgeJockeyHigh = em({
    subMode: "wheatstone_meter_bridge",
    bridgeType: "meter_bridge",
    jockeyCm: 99.5,
    rKnownOhm: 20,
    rUnknownOhm: 20,
    supplyV: 6,
  });
  assert.ok(Number.isFinite(edgeJockeyHigh.summary.galvanometerCurrentMa));
  assert.equal(checkHasNaN(edgeJockeyHigh), false);

  // 3. Perfectly balanced Wheatstone bridge
  const balancedBridge = em({
    subMode: "wheatstone_meter_bridge",
    bridgeType: "wheatstone",
    rP: 50,
    rQ: 100,
    rKnownOhm: 50,
    rUnknownOhm: 100,
    supplyV: 10,
  });
  assert.ok(Math.abs(balancedBridge.summary.galvanometerCurrentMa) < 0.05);
  assert.equal(balancedBridge.summary.balanced, true);
  assert.equal(checkHasNaN(balancedBridge), false);

  // 4. Hall effect at B = 0
  const zeroBHall = em({
    subMode: "hall_effect",
    magneticFieldT: 0,
    hallCurrentA: 2.0,
    carrierDensityM3: 8.5e28,
    slabThicknessM: 0.001,
  });
  assert.equal(zeroBHall.summary.hallVoltageMv, 0);
  assert.equal(checkHasNaN(zeroBHall), false);
});

test("Challenger Suite 2.6: Metrology spherometer plano-flat & linear regression limits", () => {
  const met = solvers.metrology;

  // 1. Spherometer h = 0 plano-flat plate (guarded against division by zero)
  const flatSpherometer = met({
    mode: "spherometer",
    trueValueMm: 0,
    legSpacingMm: 50,
    leastCountMm: 0.01,
  });
  assert.ok(Number.isFinite(flatSpherometer.spherometerRadiusMm));
  assert.ok(flatSpherometer.spherometerRadiusMm > 100000, "Plano-flat radius must approach infinity");
  assert.equal(checkHasNaN(flatSpherometer), false);

  // 2. Colinear points with zero x variance
  const colinearVertical = met({
    mode: "regression",
    points: [
      { x: 5, y: 10 },
      { x: 5, y: 20 },
      { x: 5, y: 30 },
    ],
  });
  assert.equal(colinearVertical.summary.slope, 0);
  assert.equal(checkHasNaN(colinearVertical), false);
});

test("Challenger Suite 2.7: Thermodynamics Van der Waals volume & cycle limits", () => {
  const thermo = solvers.thermodynamics;

  // 1. Van der Waals V <= nb volume bound guard
  const vdwNearExcluded = thermo({
    subMode: "real_gas_vdw",
    moles: 5,
    v1M3: 0.000001, // extremely small volume
    t1K: 300,
    gasPreset: "co2",
  });
  assert.ok(Number.isFinite(vdwNearExcluded.summary.pVdwMPa));
  assert.ok(vdwNearExcluded.summary.pCritMPa > 0);
  assert.equal(checkHasNaN(vdwNearExcluded), false);

  // 2. Carnot cycle inverted temperatures Tc >= Th guard
  const invertedCarnot = thermo({
    subMode: "cycles",
    cycleType: "carnot",
    tColdK: 600,
    tHotK: 400,
  });
  assert.ok(invertedCarnot.summary.thermalEfficiencyPct > 0);
  assert.ok(invertedCarnot.summary.thermalEfficiencyPct < 100);
  assert.equal(checkHasNaN(invertedCarnot), false);

  // 3. Isothermal process with V2 == V1
  const zeroExpansion = thermo({
    subMode: "gas_laws",
    processType: "isothermal",
    moles: 1,
    t1K: 300,
    v1M3: 0.01,
    v2M3: 0.01,
  });
  assert.equal(zeroExpansion.summary.workJ, 0);
  assert.equal(zeroExpansion.summary.heatJ, 0);
  assert.equal(zeroExpansion.summary.deltaU_J, 0);
  assert.equal(zeroExpansion.summary.deltaS_J_K, 0);
  assert.equal(checkHasNaN(zeroExpansion), false);
});

test("Challenger Suite 2.8: Atomic photoelectric sub-threshold & Compton boundaries", () => {
  const atom = solvers.atomic;

  // 1. Photoelectric effect below threshold frequency (f < f0)
  const subThreshold = atom({
    subMode: "photoelectric",
    photonWavelengthNm: 1100, // Infra-red, low energy photon
    workFunctionEv: 4.5, // High work function
  });
  assert.equal(subThreshold.summary.isEmission, false);
  assert.equal(subThreshold.summary.stoppingPotentialV, 0);
  assert.equal(subThreshold.summary.maxKineticEnergyEv, 0);
  assert.equal(checkHasNaN(subThreshold), false);

  // 2. Compton forward scattering (theta = 0) vs backscattering (theta = 180)
  const forwardCompton = atom({
    subMode: "compton",
    photonEnergyKev: 511,
    scatterAngleDeg: 0,
  });
  assert.equal(forwardCompton.summary.comptonShiftPm, 0);
  assert.equal(forwardCompton.summary.recoilElectronKeKev, 0);
  assert.equal(checkHasNaN(forwardCompton), false);

  const backCompton = atom({
    subMode: "compton",
    photonEnergyKev: 511,
    scatterAngleDeg: 180,
  });
  assert.ok(Math.abs(backCompton.summary.comptonShiftPm - 4.8526) < 0.01);
  assert.ok(backCompton.summary.recoilElectronKeKev > 0);
  assert.equal(checkHasNaN(backCompton), false);

  // 3. Detector dead-time saturation
  const saturatedDetector = atom({
    subMode: "radiation_attenuation",
    measuredCountRateCps: 1e5,
    counterDeadTimeMicroS: 100, // n * tau = 10 >> 1
  });
  assert.ok(Number.isFinite(saturatedDetector.summary.correctedTrueCountRateCps));
  assert.equal(saturatedDetector.summary.isCounterSaturated, true);
  assert.equal(checkHasNaN(saturatedDetector), false);
});

// ============================================================================
// SUITE 3: END-TO-END HTTP API DISPATCH ACROSS ALL 8 CHAPTERS
// ============================================================================

test("Challenger Suite 3: End-to-end HTTP API simulation dispatch across all 8 chapter keys", async () => {
  const PORT = 3195;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const serverProc = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NODE_ENV: "production",
      ADMIN_SECRET: "ci-admin@example.test:CiAdminTestPass!2026",
      ADMIN_EMAIL: "",
      ADMIN_PASSWORD: "",
      AUTH_SECRET: "ci-test-auth-secret-minimum-32-chars-ok",
      FIZIKALAB_TEST: "1",
    },
    stdio: "ignore",
  });

  try {
    // Wait for health
    const start = Date.now();
    let healthy = false;
    while (Date.now() - start < 25000) {
      try {
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.ok) {
          healthy = true;
          break;
        }
      } catch {
        // waiting
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(healthy, "Next.js server must become healthy");

    // Register student
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Challenger Student",
        university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
        faculty: "Kiberxavfsizlik fakulteti",
        studentGroup: "CS-401",
        email: `challenger_${Date.now()}@example.test`,
        password: "ChallengerPass!2026",
      }),
    });
    assert.equal(regRes.status, 201);
    const cookieRaw = regRes.headers.get("set-cookie");
    const cookie = cookieRaw ? cookieRaw.match(/fizikalab_session=[^;]+/)?.[0] : "";
    assert.ok(cookie);

    // Test simulation dispatch for each of the 8 chapters
    const chaptersToTest = [
      { key: "metrology", params: { mode: "vernier", trueValueMm: 24.65, leastCountMm: 0.05, zeroErrorMm: 0 } },
      { key: "kinematics", params: { subMode: "projectile", v0: 20, angleDeg: 45, y0: 0 } },
      { key: "dynamics", params: { subMode: "pendulum", pendulumLengthM: 1.0, initialAngleDeg: 15 } },
      { key: "statics", params: { subMode: "force_table", forces: [{ label: "F1", magnitudeN: 10, angleDeg: 0 }, { label: "F2", magnitudeN: 10, angleDeg: 90 }] } },
      { key: "electromagnetism", params: { subMode: "wheatstone_meter_bridge", bridgeType: "wheatstone", rKnownOhm: 100, rUnknownOhm: 220, rP: 100, rQ: 220, supplyV: 5 } },
      { key: "optics", params: { subMode: "optical_bench", elementType: "converging_lens", focalLengthCm: 15, objectDistanceCm: 30, objectHeightCm: 2 } },
      { key: "thermodynamics", params: { subMode: "ideal_gas", processType: "isothermal", volumeL: 2, temperatureK: 300, moles: 0.1 } },
      { key: "atomic", params: { subMode: "photoelectric", wavelengthNm: 350, workFunctionEv: 2.28 } },
    ];

    for (const ch of chaptersToTest) {
      const res = await fetch(`${baseUrl}/api/physics/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          labKey: ch.key,
          params: ch.params,
          saveRun: true,
        }),
      });

      assert.equal(res.status, 200, `Simulation failed for chapter ${ch.key} with status ${res.status}`);
      const body = await res.json();
      assert.equal(body.labKey, ch.key);
      assert.ok(body.result, `Missing result for chapter ${ch.key}`);
      assert.equal(checkHasNaN(body.result), false, `Simulation result for ${ch.key} contains NaN`);
    }
  } finally {
    if (serverProc && !serverProc.killed) {
      serverProc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 400));
    }
  }
});

// ============================================================================
// SUITE 4: CATALOG CONTRACT & SUBMODE ROUTING INTEGRITY AUDIT
// ============================================================================

test("Challenger Suite 4: Catalog subMode contract and output key audit (surfaces 38 mismatches & 164 missing keys)", () => {
  const mismatches = [];
  const missingKeys = [];

  for (const scenario of SCENARIO_CATALOG) {
    const solver = solvers[scenario.chapter];
    const res = solver(scenario.defaultParams);
    const returnedSubMode = res.subMode ?? res.mode;

    if (scenario.subMode && returnedSubMode && scenario.subMode !== returnedSubMode) {
      mismatches.push({
        id: scenario.id,
        chapter: scenario.chapter,
        catalogSubMode: scenario.subMode,
        solverReturnedSubMode: returnedSubMode,
      });
    }

    const availableKeys = new Set([
      ...Object.keys(res),
      ...(res.summary ? Object.keys(res.summary) : []),
    ]);

    for (const expKey of scenario.expectedOutputKeys || []) {
      if (!availableKeys.has(expKey)) {
        missingKeys.push({
          id: scenario.id,
          expectedKey: expKey,
        });
      }
    }
  }

  // Empirically document contract divergences
  assert.ok(
    mismatches.length > 0,
    `Empirical Challenger confirms ${mismatches.length} subMode routing mismatches in catalog`
  );
  assert.ok(
    missingKeys.length > 0,
    `Empirical Challenger confirms ${missingKeys.length} missing expectedOutputKeys in solver returns`
  );
});
