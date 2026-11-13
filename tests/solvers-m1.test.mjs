import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ============================================================================
// SUITE 1: 240-Scenario Modular Catalog Structural & Content Integrity
// ============================================================================

test("M1-Suite 1.1: Complete 240-Scenario Catalog validation", async () => {
  const catalogPath = path.join(PROJECT_ROOT, "src/lib/physics/catalog.ts");
  assert.ok(fs.existsSync(catalogPath), "catalog.ts must exist");

  const catalogContent = fs.readFileSync(catalogPath, "utf8");
  
  // Extract all scenario IDs
  const idMatches = [...catalogContent.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(idMatches.length, 240, "Catalog must contain exactly 240 scenarios");

  // Verify unique IDs
  const uniqueIds = new Set(idMatches);
  assert.equal(uniqueIds.size, 240, "All 240 scenario IDs must be strictly unique");

  // Verify chapter distribution (30 per chapter across all 8 chapters)
  const prefixCounts = {};
  for (const id of idMatches) {
    const prefix = id.split("-")[0];
    prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
  }

  const expectedPrefixes = {
    met: 30, // Metrology
    kin: 30, // Kinematics
    dyn: 30, // Dynamics
    sta: 30, // Statics
    em: 30,  // Electromagnetism
    opt: 30, // Optics
    the: 30, // Thermodynamics
    ato: 30, // Atomic & Nuclear
  };

  for (const [prefix, expectedCount] of Object.entries(expectedPrefixes)) {
    assert.equal(
      prefixCounts[prefix],
      expectedCount,
      `Prefix "${prefix}" must contain exactly ${expectedCount} scenarios, found ${prefixCounts[prefix]}`
    );
  }

  // Verify helper functions are exported
  assert.ok(catalogContent.includes("export function getScenariosByChapter"), "Must export getScenariosByChapter");
  assert.ok(catalogContent.includes("export function getScenarioById"), "Must export getScenarioById");
  assert.ok(catalogContent.includes("export const SCENARIO_CATALOG"), "Must export SCENARIO_CATALOG");
  assert.ok(catalogContent.includes("export const CHAPTER_NAMES_UZ"), "Must export CHAPTER_NAMES_UZ");
  assert.ok(catalogContent.includes("export const CHAPTER_NAMES_EN"), "Must export CHAPTER_NAMES_EN");
});

test("M1-Suite 1.2: Scenario schema field completeness", async () => {
  const catalogPath = path.join(PROJECT_ROOT, "src/lib/physics/catalog.ts");
  const content = fs.readFileSync(catalogPath, "utf8");

  // Verify core required keys exist across definitions
  assert.ok(content.includes('chapter: "metrology"'));
  assert.ok(content.includes('chapter: "kinematics"'));
  assert.ok(content.includes('chapter: "dynamics"'));
  assert.ok(content.includes('chapter: "statics"'));
  assert.ok(content.includes('chapter: "electromagnetism"'));
  assert.ok(content.includes('chapter: "optics"'));
  assert.ok(content.includes('chapter: "thermodynamics"'));
  assert.ok(content.includes('chapter: "atomic"'));

  // Verify orderIndex spans 1..30
  for (let i = 1; i <= 30; i++) {
    assert.ok(content.includes(`orderIndex: ${i}`), `orderIndex ${i} must be represented`);
  }
});

// ============================================================================
// SUITE 2: Formulas Catalog (>=100 formulas & Atomic Section Verification)
// ============================================================================

test("M1-Suite 2.1: Formula catalog verification (>= 100 formulas and Atomic section)", async () => {
  const formulasPath = path.join(PROJECT_ROOT, "src/lib/formulas.ts");
  assert.ok(fs.existsSync(formulasPath), "formulas.ts must exist");

  const content = fs.readFileSync(formulasPath, "utf8");

  // Extract all formula IDs
  const formulaIdMatches = [...content.matchAll(/id:\s*"([a-z]+-\d+)"/g)].map((m) => m[1]);
  assert.ok(
    formulaIdMatches.length >= 100,
    `Formulas catalog must have >= 100 formulas, found ${formulaIdMatches.length}`
  );

  // Verify atomic formulas exist (atom-1 to atom-16)
  const atomicIds = formulaIdMatches.filter((id) => id.startsWith("atom-"));
  assert.ok(atomicIds.length >= 16, `Atomic formulas must have >= 16 formulas, found ${atomicIds.length}`);
  for (let i = 1; i <= 16; i++) {
    assert.ok(atomicIds.includes(`atom-${i}`), `Must contain atom-${i}`);
  }

  // Verify section title
  assert.ok(
    content.includes("Atom va Yadro Fizikasi"),
    "Formula catalog must include 'Atom va Yadro Fizikasi' section"
  );
});

// ============================================================================
// SUITE 3: Thermodynamics Physical Solver Engine & Boundary Guards
// ============================================================================

test("M1-Suite 3.1: Thermodynamics solver source implementation and mathematical integrity", async () => {
  const thermoPath = path.join(PROJECT_ROOT, "src/lib/physics/thermodynamics.ts");
  assert.ok(fs.existsSync(thermoPath), "thermodynamics.ts must exist");
  const content = fs.readFileSync(thermoPath, "utf8");

  // 1. Gas Laws
  assert.ok(content.includes("function simulateGasLaws"), "Must implement simulateGasLaws");
  assert.ok(content.includes("CODATA.R"), "Must use CODATA Universal Gas Constant R");
  assert.ok(content.includes("isothermal") && content.includes("adiabatic"), "Must support processes");

  // 2. Maxwell-Boltzmann Speed Distribution
  assert.ok(content.includes("function simulateMktSpeeds"), "Must implement simulateMktSpeeds");
  assert.ok(content.includes("vMostProbableMs"), "Must compute most probable speed");
  assert.ok(content.includes("vAvgMs"), "Must compute average speed");
  assert.ok(content.includes("vRmsMs"), "Must compute root-mean-square speed");

  // 3. Thermodynamic Cycles (Carnot, Otto, Diesel, Stirling)
  assert.ok(content.includes("function simulateCycles"), "Must implement simulateCycles");
  assert.ok(content.includes("carnot") && content.includes("otto") && content.includes("diesel") && content.includes("stirling"));
  // Singularity guard: Carnot Tc >= Th
  assert.ok(content.includes("Math.min(Th - 1"), "Must clamp tCold < tHot to prevent negative or zero division");

  // 4. Van der Waals Real Gas & Critical Constants
  assert.ok(content.includes("function simulateRealGasVdw"), "Must implement simulateRealGasVdw");
  assert.ok(content.includes("vdwAPaM6Mol2") && content.includes("vdwBM3Mol"));
  assert.ok(content.includes("tCritK") && content.includes("pCritMPa") && content.includes("vCritLiters"));
  assert.ok(content.includes("zCrit"), "Must compute compressibility factor Zc = 3/8");
  // Singularity guard: V -> nb volume bound
  assert.ok(content.includes("1.05 * n * b"), "Must enforce volume strictly exceeds excluded volume nb");

  // 5. Thermal Transport (Fourier & Stefan-Boltzmann)
  assert.ok(content.includes("function simulateHeatTransfer"), "Must implement simulateHeatTransfer");
  assert.ok(content.includes("CODATA.sigma_SB"), "Must use Stefan-Boltzmann constant");
  assert.ok(content.includes("coolingCoeffK_S"), "Must implement Newton cooling law");

  // 6. Calorimetry & Thermal Expansion
  assert.ok(content.includes("function simulateCalorimetry"), "Must implement simulateCalorimetry");
  assert.ok(content.includes("equilibriumTempC"), "Must compute equilibrium temperature");
  assert.ok(content.includes("linearExpansionMm"), "Must compute thermal expansion");

  // 7. Fluid Viscosity & Surface Tension
  assert.ok(content.includes("function simulateFluidSurface"), "Must implement simulateFluidSurface");
  assert.ok(content.includes("capillaryRiseMm"), "Must compute Jurin capillary rise");
  assert.ok(content.includes("poiseuille"), "Must compute Poiseuille flow");
  assert.ok(content.includes("clementDesormesGamma"), "Must compute Clement-Desormes gamma ratio");
});

// ============================================================================
// SUITE 4: Atomic & Nuclear Physics Solver Engine & Singularity Guards
// ============================================================================

test("M1-Suite 4.1: Atomic & Nuclear solver source implementation and mathematical integrity", async () => {
  const atomicPath = path.join(PROJECT_ROOT, "src/lib/physics/atomic.ts");
  assert.ok(fs.existsSync(atomicPath), "atomic.ts must exist");
  const content = fs.readFileSync(atomicPath, "utf8");

  // 1. Photoelectric Effect
  assert.ok(content.includes("function simulatePhotoelectric"), "Must implement simulatePhotoelectric");
  assert.ok(content.includes("stoppingPotentialV"), "Must compute stopping potential V0");
  assert.ok(content.includes("workFunctionEv"), "Must compute work function");
  // Guard: f < f0 clamp stopping potential to 0
  assert.ok(content.includes("stoppingPotentialV = isEmission ? maxKineticEnergyEv : 0"), "Must guard sub-threshold stopping potential to 0");

  // 2. Compton Scattering
  assert.ok(content.includes("function simulateCompton"), "Must implement simulateCompton");
  assert.ok(content.includes("LAMBDA_COMPTON_M"), "Must use exact CODATA electron Compton wavelength");
  assert.ok(content.includes("recoilElectronKeKev"), "Must compute electron recoil kinetic energy");

  // 3. Bohr Hydrogen Spectra
  assert.ok(content.includes("function simulateBohrSpectra"), "Must implement simulateBohrSpectra");
  assert.ok(content.includes("RYDBERG_ENERGY_EV"), "Must use Rydberg constant in eV");
  assert.ok(content.includes("Balmer") && content.includes("Lyman") && content.includes("Paschen"));

  // 4. De Broglie Matter Waves & Davisson-Germer
  assert.ok(content.includes("function simulateMatterWaves"), "Must implement simulateMatterWaves");
  assert.ok(content.includes("deBroglieWavelengthPm"), "Must compute de Broglie wavelength");
  assert.ok(content.includes("braggAngleDeg"), "Must compute Bragg diffraction angle");

  // 5. Franck-Hertz Inelastic Collisions
  assert.ok(content.includes("function simulateFranckHertz"), "Must implement simulateFranckHertz");
  assert.ok(content.includes("excitationPotentialV"), "Must exhibit Mercury 4.9V resonance excitation peaks");
  assert.ok(content.includes("vapor === \"mercury\" ? 4.9 : 18.9"), "Must support Mercury 4.9V and Neon 18.9V");

  // 6. Radioactive Decay Kinetics & Bateman
  assert.ok(content.includes("function simulateDecayKinetics"), "Must implement simulateDecayKinetics");
  assert.ok(content.includes("batemanMaxDaughterTimeS"), "Must compute Bateman daughter growth peak");

  // 7. Nuclear Mass Defect & Binding Energy
  assert.ok(content.includes("function simulateNuclearBinding"), "Must implement simulateNuclearBinding");
  assert.ok(content.includes("ebWeizsackerMev"), "Must compute Weizsacker semi-empirical mass formula");
  assert.ok(content.includes("bindingEnergyPerNucleonMev"), "Must compute binding energy per nucleon");

  // 8. Radiation Attenuation & Geiger-Muller Dead-Time
  assert.ok(content.includes("function simulateRadiationAttenuation"), "Must implement simulateRadiationAttenuation");
  assert.ok(content.includes("halfValueLayerCm"), "Must compute HVL half-value thickness");
  // Guard: Dead-time saturation
  assert.ok(content.includes("deadTimeLossPct"), "Must compute non-paralyzable dead time correction");
});

// ============================================================================
// SUITE 5: Existing Solvers Singularity Guards & Enhancements Verification
// ============================================================================

test("M1-Suite 5.1: Metrology, Kinematics, Dynamics, Statics, EM & Optics Singularity Guards", async () => {
  // 1. Metrology
  const metrology = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/physics/metrology.ts"), "utf8");
  assert.ok(metrology.includes("Plano-flat"), "Metrology must guard h -> 0 spherometer singularity");
  assert.ok(metrology.includes("\"density\""), "Metrology must support density submode");
  assert.ok(metrology.includes("\"young_modulus\""), "Metrology must support young_modulus submode");
  assert.ok(metrology.includes("\"regression\""), "Metrology must support regression submode");

  // 2. Kinematics
  const kinematics = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/physics/kinematics.ts"), "utf8");
  assert.ok(kinematics.includes("v0 === 0 && y0 === 0"), "Kinematics must short-circuit instant ground impact");
  assert.ok(kinematics.includes("circular"), "Kinematics must support circular submode");
  assert.ok(kinematics.includes("relative"), "Kinematics must support relative submode");
  assert.ok(kinematics.includes("rocket"), "Kinematics must support rocket submode");

  // 3. Dynamics
  const dynamics = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/physics/dynamics.ts"), "utf8");
  assert.ok(dynamics.includes("179.5"), "Dynamics must clamp pendulum angle up to 179.5 deg");
  assert.ok(dynamics.includes("kater"), "Dynamics must support Kater reversible pendulum");
  assert.ok(dynamics.includes("rolling"), "Dynamics must support rolling motion");
  assert.ok(dynamics.includes("gyroscope"), "Dynamics must support gyroscope precession");

  // 4. Statics
  const statics = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/physics/statics.ts"), "utf8");
  assert.ok(statics.includes("buoyancy"), "Statics must support buoyancy submode");
  assert.ok(statics.includes("ladder_friction"), "Statics must support ladder_friction submode");
  assert.ok(statics.includes("truss"), "Statics must support truss submode");
  assert.ok(statics.includes("xB - xA"), "Statics must guard beam support span separation");

  // 5. Electromagnetism
  const em = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/physics/electromagnetism.ts"), "utf8");
  assert.ok(em.includes("hall_effect"), "Electromagnetism must support hall_effect submode");
  assert.ok(em.includes("thomson_em"), "Electromagnetism must support thomson_em submode");
  assert.ok(em.includes("transformer"), "Electromagnetism must support transformer submode");

  // 6. Optics
  const optics = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/physics/optics.ts"), "utf8");
  assert.ok(optics.includes("newton_rings"), "Optics must support newton_rings submode");
  assert.ok(optics.includes("polarization"), "Optics must support polarization submode");
  assert.ok(optics.includes("thin_film"), "Optics must support thin_film submode");
  assert.ok(optics.includes("causticDistanceCm"), "Optics must handle focal point caustic singularity");
});

// ============================================================================
// SUITE 6: Simulation Route Dispatch Across All 8 Chapters
// ============================================================================

test("M1-Suite 6.1: API Route simulate dispatch wiring for all 8 chapters", async () => {
  const routePath = path.join(PROJECT_ROOT, "src/app/api/physics/simulate/route.ts");
  const content = fs.readFileSync(routePath, "utf8");

  assert.ok(content.includes('"thermodynamics"'), "Route must accept thermodynamics labKey");
  assert.ok(content.includes('"atomic"'), "Route must accept atomic labKey");
  assert.ok(content.includes("simulateThermodynamics"), "Route must dispatch to simulateThermodynamics");
  assert.ok(content.includes("simulateAtomic"), "Route must dispatch to simulateAtomic");
});
