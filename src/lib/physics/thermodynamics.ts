import { CODATA, roundTo } from "./constants";

export type ThermoSubMode =
  | "gas_laws"
  | "ideal_gas"
  | "mkt_speeds"
  | "cycles"
  | "real_gas_vdw"
  | "real_gas"
  | "heat_transfer"
  | "calorimetry"
  | "fluid_surface"
  | "rankine_cycle"
  | "peng_robinson_eos"
  | "blackbody_planck_radiation"
  | "transient_conduction_1d";

export interface ThermodynamicsInput {
  subMode: ThermoSubMode;
  // Gas laws & processes
  processType?: "isothermal" | "isobaric" | "isochoric" | "adiabatic" | "polytropic";
  gasType?: "Air" | "He" | "N2" | "CO2" | "H2O" | string;
  p1Pa?: number;
  v1M3?: number;
  t1K?: number;
  v2M3?: number;
  p2Pa?: number;
  t2K?: number;
  moles?: number;
  gasDof?: number; // i: 3 for monoatomic, 5 for diatomic, 6 for polyatomic
  polytropicN?: number; // for polytropic PV^n = const
  // Frontend component aliases
  temperatureK?: number;
  volumeL?: number;
  pressureKPa?: number;
  heatInputJ?: number;
  transferType?: "conduction" | "radiation";
  thermalConductivity?: number;
  tHotC?: number;
  tColdC?: number;

  // MKT speeds & distribution
  molarMassKgMol?: number; // e.g. 0.028 for N2, 0.032 for O2, 0.004 for He
  molecularDiameterM?: number; // e.g. 3.7e-10 m

  // Thermodynamic cycles
  cycleType?: "carnot" | "otto" | "diesel" | "stirling";
  tHotK?: number;
  tColdK?: number;
  compressionRatio?: number; // r = V1 / V2
  cutoffRatio?: number; // rc = V3 / V2 for Diesel

  // Rankine steam cycle
  boilerPressureMpa?: number;
  condenserPressureKpa?: number;
  turbineInletTempC?: number;
  turbineIsentropicEfficiency?: number;
  pumpIsentropicEfficiency?: number;
  netPowerOutputMw?: number;

  // Peng-Robinson Cubic EOS
  criticalTempK?: number;
  criticalPressureMpa?: number;
  acentricFactor?: number;
  fluidCompound?: "methane" | "ethane" | "propane" | "co2" | "water" | "nitrogen" | "custom";

  // Planck radiation & Radiative exchange
  emitterTempK?: number;
  absorberTempK?: number;
  emitterEmissivity?: number;
  absorberEmissivity?: number;
  surfaceAreaM2?: number;

  // Transient 1D Conduction PDE
  slabThicknessM?: number;
  thermalDiffusivityM2_S?: number;
  convectionCoeffW_M2K?: number;
  initialTempC?: number;
  ambientFluidTempC?: number;
  simulationTimeS?: number;
  gridNodesCount?: number;

  // Real Gas Van der Waals
  gasPreset?: "custom" | "helium" | "nitrogen" | "co2" | "water_vapor" | "argon";
  vdwAPaM6Mol2?: number; // a parameter
  vdwBM3Mol?: number; // b parameter

  // Thermal transport & cooling
  thermalConductivityW_MK?: number; // k
  areaM2?: number;
  thicknessM?: number;
  emissivity?: number; // epsilon (0..1)
  ambientTempK?: number;
  coolingCoeffK_S?: number; // k in Newton cooling
  timeSpanS?: number;

  // Calorimetry & expansion
  substanceMassKg?: number;
  specificHeatJ_KgK?: number;
  initialTempK?: number;
  waterMassKg?: number;
  waterInitialTempK?: number;
  latentHeatFusionJ_Kg?: number;
  latentHeatVaporJ_Kg?: number;
  linearExpCoeff_1K?: number;
  originalLengthM?: number;

  // Fluid transport & surface tension
  surfaceTensionN_M?: number; // sigma
  contactAngleDeg?: number; // theta
  tubeRadiusM?: number; // r
  fluidDensityKg_M3?: number; // rho
  fluidViscosityPaS?: number; // eta
  sphereRadiusM?: number; // r for Stokes
  sphereDensityKg_M3?: number; // rho_s
  pressureDropPa?: number; // Delta P for Poiseuille
  tubeLengthM?: number; // L
  clementH1Mm?: number; // manometric height h1
  clementH2Mm?: number; // manometric height h2
}

export interface ThermodynamicsResult {
  subMode: ThermoSubMode;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
  series?: { label: string; points: { x: number; y: number }[] }[];
}

export const VDW_PRESETS: Record<string, { a: number; b: number; M: number; nameUz: string }> = {
  helium: { a: 0.00346, b: 0.0000237, M: 0.004003, nameUz: "Geliy (He)" },
  argon: { a: 0.1355, b: 0.0000320, M: 0.03995, nameUz: "Argon (Ar)" },
  nitrogen: { a: 0.1370, b: 0.0000387, M: 0.028014, nameUz: "Azot (N2)" },
  co2: { a: 0.3640, b: 0.0000427, M: 0.04401, nameUz: "Karbonat angidrid (CO2)" },
  water_vapor: { a: 0.5536, b: 0.0000305, M: 0.018015, nameUz: "Suv bug'i (H2O)" },
};

export function simulateThermodynamics(input: ThermodynamicsInput): ThermodynamicsResult {
  switch (input.subMode) {
    case "ideal_gas":
    case "gas_laws": {
      const rawV1 = input.v1M3 ?? ((input as any).vInitialL !== undefined ? (input as any).vInitialL / 1000 : input.volumeL !== undefined ? input.volumeL / 1000 : undefined);
      const rawV2 = input.v2M3 ?? ((input as any).vFinalL !== undefined ? (input as any).vFinalL / 1000 : undefined);
      const rawT1 = input.t1K ?? (input as any).tKelvin ?? input.temperatureK;
      const normalized: ThermodynamicsInput = {
        ...input,
        t1K: rawT1,
        v1M3: rawV1,
        v2M3: rawV2,
        p1Pa: input.p1Pa ?? (input.pressureKPa !== undefined ? input.pressureKPa * 1000 : undefined),
      };
      return simulateGasLaws(normalized);
    }
    case "mkt_speeds":
    case "maxwell_boltzmann" as any:
      return simulateMktSpeeds(input);
    case "cycles":
      return simulateCycles(input);
    case "real_gas":
    case "real_gas_vdw": {
      const rawPreset = input.gasPreset ?? ((input as any).gasType ? String((input as any).gasType).toLowerCase() : undefined);
      const gasPreset = rawPreset === "co2" || rawPreset === "carbon_dioxide" ? "co2" : rawPreset;
      const rawV = input.v1M3 ?? (input.volumeL !== undefined ? input.volumeL / 1000 : (input as any).vInitialL !== undefined ? (input as any).vInitialL / 1000 : undefined);
      const rawT = input.t1K ?? (input as any).temperatureK ?? (input as any).tKelvin;
      const normalized: ThermodynamicsInput = {
        ...input,
        gasPreset: gasPreset as any,
        t1K: rawT,
        v1M3: rawV,
        p1Pa: input.p1Pa ?? (input.pressureKPa !== undefined ? input.pressureKPa * 1000 : undefined),
      };
      return simulateRealGasVdw(normalized);
    }
    case "heat_transfer":
      return simulateHeatTransfer(input);
    case "calorimetry":
      return simulateCalorimetry(input);
    case "fluid_surface":
    case "viscosity_transport" as any:
    case "surface_tension" as any:
      return simulateFluidSurface(input);
    case "rankine_cycle":
      return simulateRankineCycle(input);
    case "peng_robinson_eos":
      return simulatePengRobinsonEos(input);
    case "blackbody_planck_radiation":
      return simulateBlackbodyPlanck(input);
    case "transient_conduction_1d":
      return simulateTransientConduction1D(input);
    default:
      return simulateGasLaws(input);
  }
}

/**
 * 1. Gas Laws & Thermodynamic Processes
 */
function simulateGasLaws(input: ThermodynamicsInput): ThermodynamicsResult {
  const pType = input.processType ?? "isothermal";
  const i = Math.max(3, Math.min(6, input.gasDof ?? 3));
  const gamma = (i + 2) / i;
  const Cv = (i / 2) * CODATA.R;
  const Cp = ((i + 2) / 2) * CODATA.R;

  const n = Math.max(0.001, input.moles ?? 1);
  const P1 = Math.max(100, input.p1Pa ?? 101325);
  let V1 = Math.max(1e-6, input.v1M3 ?? 0.024);
  let T1 = Math.max(1, input.t1K ?? (P1 * V1) / (n * CODATA.R));

  // Re-sync Mendeleev-Clapeyron if T1 or n was provided explicitly
  if (input.t1K !== undefined && input.p1Pa !== undefined && input.v1M3 === undefined) {
    V1 = (n * CODATA.R * T1) / P1;
  } else if (input.p1Pa !== undefined && input.v1M3 !== undefined && input.t1K === undefined) {
    T1 = (P1 * V1) / (n * CODATA.R);
  }

  let P2 = P1;
  let V2 = V1;
  let T2 = T1;
  let workW = 0;
  let heatQ = 0;
  let deltaU = 0;
  let deltaS = 0;

  const targetV2 = input.v2M3 !== undefined ? Math.max(1e-6, input.v2M3) : undefined;
  const targetP2 = input.p2Pa !== undefined ? Math.max(100, input.p2Pa) : undefined;
  const targetT2 = input.t2K !== undefined ? Math.max(1, input.t2K) : undefined;

  if (pType === "isothermal") {
    T2 = T1;
    if (targetV2 !== undefined) {
      V2 = targetV2;
      P2 = (P1 * V1) / V2;
    } else if (targetP2 !== undefined) {
      P2 = targetP2;
      V2 = (P1 * V1) / P2;
    } else {
      V2 = V1 * 2;
      P2 = P1 / 2;
    }
    if (Math.abs(V2 - V1) < 1e-9) {
      workW = 0;
      heatQ = 0;
      deltaU = 0;
      deltaS = 0;
    } else {
      workW = n * CODATA.R * T1 * Math.log(V2 / V1);
      heatQ = workW;
      deltaU = 0;
      deltaS = n * CODATA.R * Math.log(V2 / V1);
    }
  } else if (pType === "isobaric") {
    P2 = P1;
    if (targetV2 !== undefined) {
      V2 = targetV2;
      T2 = (P2 * V2) / (n * CODATA.R);
    } else if (targetT2 !== undefined) {
      T2 = targetT2;
      V2 = (n * CODATA.R * T2) / P2;
    } else {
      V2 = V1 * 1.5;
      T2 = T1 * 1.5;
    }
    workW = P1 * (V2 - V1);
    deltaU = n * Cv * (T2 - T1);
    heatQ = n * Cp * (T2 - T1);
    deltaS = n * Cp * Math.log(T2 / T1);
  } else if (pType === "isochoric") {
    V2 = V1;
    if (targetP2 !== undefined) {
      P2 = targetP2;
      T2 = (P2 * V2) / (n * CODATA.R);
    } else if (targetT2 !== undefined) {
      T2 = targetT2;
      P2 = (n * CODATA.R * T2) / V2;
    } else {
      P2 = P1 * 1.5;
      T2 = T1 * 1.5;
    }
    workW = 0;
    deltaU = n * Cv * (T2 - T1);
    heatQ = deltaU;
    deltaS = n * Cv * Math.log(T2 / T1);
  } else if (pType === "adiabatic") {
    if (targetV2 !== undefined) {
      V2 = targetV2;
      P2 = P1 * Math.pow(V1 / V2, gamma);
      T2 = T1 * Math.pow(V1 / V2, gamma - 1);
    } else if (targetP2 !== undefined) {
      P2 = targetP2;
      V2 = V1 * Math.pow(P1 / P2, 1 / gamma);
      T2 = T1 * Math.pow(P2 / P1, (gamma - 1) / gamma);
    } else {
      V2 = V1 * 1.5;
      P2 = P1 * Math.pow(V1 / V2, gamma);
      T2 = T1 * Math.pow(V1 / V2, gamma - 1);
    }
    heatQ = 0;
    deltaS = 0;
    workW = (P1 * V1 - P2 * V2) / (gamma - 1);
    deltaU = -workW;
  } else {
    // Polytropic PV^n = const
    const polyN = Math.max(0.1, input.polytropicN ?? 1.25);
    if (targetV2 !== undefined) {
      V2 = targetV2;
    } else {
      V2 = V1 * 1.5;
    }
    P2 = P1 * Math.pow(V1 / V2, polyN);
    T2 = (P2 * V2) / (n * CODATA.R);
    workW = Math.abs(polyN - 1) > 1e-4 ? (P1 * V1 - P2 * V2) / (polyN - 1) : n * CODATA.R * T1 * Math.log(V2 / V1);
    deltaU = n * Cv * (T2 - T1);
    const Cn = Cv * ((polyN - gamma) / (polyN - 1));
    heatQ = n * Cn * (T2 - T1);
    deltaS = n * Cn * Math.log(T2 / T1);
  }

  // Generate PV curve points
  const steps = 60;
  const minV = Math.min(V1, V2);
  const maxV = Math.max(V1, V2);
  const vStep = (maxV - minV) / steps;
  const pvPoints: { x: number; y: number }[] = [];

  for (let s = 0; s <= steps; s++) {
    const v = minV + s * vStep;
    let p = P1;
    if (pType === "isothermal") {
      p = (n * CODATA.R * T1) / v;
    } else if (pType === "isobaric") {
      p = P1;
    } else if (pType === "isochoric") {
      // vertical line from min P to max P
      p = Math.min(P1, P2) + s * ((Math.max(P1, P2) - Math.min(P1, P2)) / steps);
    } else if (pType === "adiabatic") {
      p = P1 * Math.pow(V1 / v, gamma);
    } else {
      const polyN = input.polytropicN ?? 1.25;
      p = P1 * Math.pow(V1 / v, polyN);
    }
    pvPoints.push({ x: roundTo(v * 1e3, 4), y: roundTo(p / 1e3, 3) }); // Liters vs kPa
  }

  return {
    subMode: "gas_laws",
    summary: {
      processType: pType,
      p1KPa: roundTo(P1 / 1e3, 3),
      v1Liters: roundTo(V1 * 1e3, 3),
      t1K: roundTo(T1, 2),
      p2KPa: roundTo(P2 / 1e3, 3),
      v2Liters: roundTo(V2 * 1e3, 3),
      t2K: roundTo(T2, 2),
      workJ: roundTo(workW, 2),
      heatJ: roundTo(heatQ, 2),
      deltaU_J: roundTo(deltaU, 2),
      deltaS_J_K: roundTo(deltaS, 4),
      gamma: roundTo(gamma, 3),
    },
    details: {
      moles: n,
      gasDof: i,
      molarHeatCapacityCv: roundTo(Cv, 3),
      molarHeatCapacityCp: roundTo(Cp, 3),
    },
    series: [{ label: `${pType.toUpperCase()} (P-V)`, points: pvPoints }],
  };
}

/**
 * 2. MKT Molecular Speeds & Maxwell-Boltzmann Distribution
 */
function simulateMktSpeeds(input: ThermodynamicsInput): ThermodynamicsResult {
  const T = Math.max(1, input.t1K ?? 300);
  const M = Math.max(0.001, input.molarMassKgMol ?? 0.028); // Default N2 (28 g/mol)
  const P = Math.max(10, input.p1Pa ?? 101325);
  const d = Math.max(1e-11, input.molecularDiameterM ?? 3.7e-10); // 0.37 nm

  // Characteristic velocities
  const vRms = Math.sqrt((3 * CODATA.R * T) / M);
  const vAvg = Math.sqrt((8 * CODATA.R * T) / (Math.PI * M));
  const vMp = Math.sqrt((2 * CODATA.R * T) / M);

  // Mean kinetic energy of single molecule
  const meanKineticEnergyJ = 1.5 * CODATA.k_B * T;

  // Molecular concentration n0 = P / (k_B * T)
  const n0 = P / (CODATA.k_B * T);

  // Mean free path: lambda = 1 / (sqrt(2) * pi * d^2 * n0)
  const meanFreePathM = 1 / (Math.SQRT2 * Math.PI * d * d * n0);

  // Collision frequency: z = vAvg / lambda
  const collisionFrequencyHz = vAvg / meanFreePathM;

  // Generate Maxwell-Boltzmann speed distribution curve:
  // f(v) = 4 * pi * (M / (2 * pi * R * T))^(3/2) * v^2 * exp(-M * v^2 / (2 * R * T))
  const factor = 4 * Math.PI * Math.pow(M / (2 * Math.PI * CODATA.R * T), 1.5);
  const maxV = Math.max(1500, vRms * 3);
  const numPoints = 80;
  const dv = maxV / numPoints;
  const distributionPoints: { x: number; y: number }[] = [];

  for (let s = 0; s <= numPoints; s++) {
    const v = s * dv;
    const f_v = factor * v * v * Math.exp((-M * v * v) / (2 * CODATA.R * T));
    distributionPoints.push({
      x: roundTo(v, 1),
      y: roundTo(f_v * 1e3, 6), // per (km/s)
    });
  }

  return {
    subMode: input.subMode || "mkt_speeds",
    summary: {
      temperatureK: roundTo(T, 2),
      molarMassG_Mol: roundTo(M * 1000, 2),
      vRmsMs: roundTo(vRms, 2),
      vAvgMs: roundTo(vAvg, 2),
      vMostProbableMs: roundTo(vMp, 2),
      meanKineticEnergyEv: roundTo(meanKineticEnergyJ / CODATA.e, 4),
      meanFreePathNm: roundTo(meanFreePathM * 1e9, 2),
      collisionFreqGHz: roundTo(collisionFrequencyHz / 1e9, 3),
      concentrationM3: roundTo(n0, 2),
    },
    details: {
      molecularDiameterNm: roundTo(d * 1e9, 3),
      pressureKPa: roundTo(P / 1e3, 3),
    },
    series: [{ label: "Maksvell-Bolsman tezliklar taqsimoti f(v)", points: distributionPoints }],
  };
}

/**
 * 3. Thermodynamic Cycles (Carnot, Otto, Diesel, Stirling)
 */
function simulateCycles(input: ThermodynamicsInput): ThermodynamicsResult {
  const cycle = input.cycleType ?? "carnot";
  const Th = Math.max(10, input.tHotK ?? 600);
  const Tc = Math.min(Th - 1, Math.max(1, input.tColdK ?? 300));
  const r = Math.max(1.1, input.compressionRatio ?? 8);
  const rc = Math.max(1.05, Math.min(r * 0.9, input.cutoffRatio ?? 2.0));
  const i = Math.max(3, Math.min(6, input.gasDof ?? 5)); // Default diatomic air
  const gamma = (i + 2) / i;
  const Cv = (i / 2) * CODATA.R;
  const Cp = ((i + 2) / 2) * CODATA.R;
  const n = Math.max(0.01, input.moles ?? 1);

  let thermalEfficiency = 0;
  let copRefrigerator = 0;
  let copHeatPump = 0;
  let workNetJ = 0;
  let heatInJ = 0;
  let heatOutJ = 0;

  const cycleCoordinates: { state: number; pKPa: number; vLiters: number; tK: number }[] = [];

  if (cycle === "carnot") {
    // Carnot: 1-2 Isothermal Exp (Th), 2-3 Adiabatic Exp (Th->Tc), 3-4 Isothermal Comp (Tc), 4-1 Adiabatic Comp (Tc->Th)
    thermalEfficiency = 1 - Tc / Th;
    copRefrigerator = Tc / (Th - Tc);
    copHeatPump = Th / (Th - Tc);

    // Initial state 1
    const V1 = 0.005;
    const P1 = (n * CODATA.R * Th) / V1;
    const V2 = V1 * 2; // Isothermal expansion to 2*V1
    const P2 = (n * CODATA.R * Th) / V2;
    // 2-3 Adiabatic expansion to Tc: T * V^(gamma-1) = const -> V3 = V2 * (Th/Tc)^(1/(gamma-1))
    const V3 = V2 * Math.pow(Th / Tc, 1 / (gamma - 1));
    const P3 = (n * CODATA.R * Tc) / V3;
    // 4-1 Adiabatic compression from Tc to Th: V4 = V1 * (Th/Tc)^(1/(gamma-1))
    const V4 = V1 * Math.pow(Th / Tc, 1 / (gamma - 1));
    const P4 = (n * CODATA.R * Tc) / V4;

    heatInJ = n * CODATA.R * Th * Math.log(V2 / V1);
    heatOutJ = n * CODATA.R * Tc * Math.log(V3 / V4);
    workNetJ = heatInJ - heatOutJ;

    cycleCoordinates.push(
      { state: 1, pKPa: roundTo(P1 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(Th, 1) },
      { state: 2, pKPa: roundTo(P2 / 1e3, 1), vLiters: roundTo(V2 * 1e3, 2), tK: roundTo(Th, 1) },
      { state: 3, pKPa: roundTo(P3 / 1e3, 1), vLiters: roundTo(V3 * 1e3, 2), tK: roundTo(Tc, 1) },
      { state: 4, pKPa: roundTo(P4 / 1e3, 1), vLiters: roundTo(V4 * 1e3, 2), tK: roundTo(Tc, 1) }
    );
  } else if (cycle === "otto") {
    // Otto: 1-2 isentropic comp (r), 2-3 isochoric heat addition, 3-4 isentropic exp, 4-1 isochoric heat rejection
    thermalEfficiency = 1 - 1 / Math.pow(r, gamma - 1);
    copRefrigerator = thermalEfficiency > 0 ? (1 - thermalEfficiency) / thermalEfficiency : 0;
    copHeatPump = 1 + copRefrigerator;

    const V1 = 0.02;
    const V2 = V1 / r;
    const T1 = Tc;
    const P1 = (n * CODATA.R * T1) / V1;
    // 1-2 Isentropic: T2 = T1 * r^(gamma-1), P2 = P1 * r^gamma
    const T2 = T1 * Math.pow(r, gamma - 1);
    const P2 = P1 * Math.pow(r, gamma);
    // 2-3 Isochoric heat add to Th: V3 = V2, T3 = Math.max(T2 + 200, Th)
    const T3 = Math.max(T2 + 200, Th);
    const P3 = (n * CODATA.R * T3) / V2;
    // 3-4 Isentropic expansion: V4 = V1, T4 = T3 / r^(gamma-1)
    const T4 = T3 / Math.pow(r, gamma - 1);
    const P4 = P3 / Math.pow(r, gamma);

    heatInJ = n * Cv * (T3 - T2);
    heatOutJ = n * Cv * (T4 - T1);
    workNetJ = heatInJ - heatOutJ;

    cycleCoordinates.push(
      { state: 1, pKPa: roundTo(P1 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(T1, 1) },
      { state: 2, pKPa: roundTo(P2 / 1e3, 1), vLiters: roundTo(V2 * 1e3, 2), tK: roundTo(T2, 1) },
      { state: 3, pKPa: roundTo(P3 / 1e3, 1), vLiters: roundTo(V2 * 1e3, 2), tK: roundTo(T3, 1) },
      { state: 4, pKPa: roundTo(P4 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(T4, 1) }
    );
  } else if (cycle === "diesel") {
    // Diesel: 1-2 isentropic comp (r), 2-3 isobaric heat addition (cutoff rc), 3-4 isentropic exp, 4-1 isochoric heat rejection
    const term = (Math.pow(rc, gamma) - 1) / (gamma * (rc - 1));
    thermalEfficiency = 1 - (1 / Math.pow(r, gamma - 1)) * term;
    copRefrigerator = thermalEfficiency > 0 ? (1 - thermalEfficiency) / thermalEfficiency : 0;
    copHeatPump = 1 + copRefrigerator;

    const V1 = 0.02;
    const V2 = V1 / r;
    const T1 = Tc;
    const P1 = (n * CODATA.R * T1) / V1;
    const T2 = T1 * Math.pow(r, gamma - 1);
    const P2 = P1 * Math.pow(r, gamma);
    // 2-3 Isobaric expansion: V3 = V2 * rc, P3 = P2, T3 = T2 * rc
    const V3 = V2 * rc;
    const P3 = P2;
    const T3 = T2 * rc;
    // 3-4 Isentropic expansion: V4 = V1, T4 = T3 * (V3/V1)^(gamma-1)
    const T4 = T3 * Math.pow(V3 / V1, gamma - 1);
    const P4 = P3 * Math.pow(V3 / V1, gamma);

    heatInJ = n * Cp * (T3 - T2);
    heatOutJ = n * Cv * (T4 - T1);
    workNetJ = heatInJ - heatOutJ;

    cycleCoordinates.push(
      { state: 1, pKPa: roundTo(P1 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(T1, 1) },
      { state: 2, pKPa: roundTo(P2 / 1e3, 1), vLiters: roundTo(V2 * 1e3, 2), tK: roundTo(T2, 1) },
      { state: 3, pKPa: roundTo(P3 / 1e3, 1), vLiters: roundTo(V3 * 1e3, 2), tK: roundTo(T3, 1) },
      { state: 4, pKPa: roundTo(P4 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(T4, 1) }
    );
  } else {
    // Stirling: 2 isochores + 2 isothermals with regeneration
    // With ideal regenerator: eta = 1 - Tc / Th (Carnot efficiency)
    thermalEfficiency = 1 - Tc / Th;
    copRefrigerator = Tc / (Th - Tc);
    copHeatPump = Th / (Th - Tc);

    const V2 = 0.005;
    const V1 = V2 * r;
    const P1 = (n * CODATA.R * Th) / V2;
    const P2 = (n * CODATA.R * Th) / V1;
    const P3 = (n * CODATA.R * Tc) / V1;
    const P4 = (n * CODATA.R * Tc) / V2;

    heatInJ = n * CODATA.R * Th * Math.log(r);
    heatOutJ = n * CODATA.R * Tc * Math.log(r);
    workNetJ = heatInJ - heatOutJ;

    cycleCoordinates.push(
      { state: 1, pKPa: roundTo(P1 / 1e3, 1), vLiters: roundTo(V2 * 1e3, 2), tK: roundTo(Th, 1) },
      { state: 2, pKPa: roundTo(P2 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(Th, 1) },
      { state: 3, pKPa: roundTo(P3 / 1e3, 1), vLiters: roundTo(V1 * 1e3, 2), tK: roundTo(Tc, 1) },
      { state: 4, pKPa: roundTo(P4 / 1e3, 1), vLiters: roundTo(V2 * 1e3, 2), tK: roundTo(Tc, 1) }
    );
  }

  const cyclePts = cycleCoordinates.map((c) => ({ x: c.vLiters, y: c.pKPa }));
  // Close the loop
  if (cyclePts.length > 0) {
    cyclePts.push(cyclePts[0]);
  }

  return {
    subMode: "cycles",
    summary: {
      cycleType: cycle,
      thermalEfficiencyPct: roundTo(thermalEfficiency * 100, 2),
      efficiencyPct: roundTo(thermalEfficiency * 100, 2),
      copRefrigerator: roundTo(copRefrigerator, 3),
      copHeatPump: roundTo(copHeatPump, 3),
      workNetJ: roundTo(workNetJ, 2),
      heatInJ: roundTo(heatInJ, 2),
      heatOutJ: roundTo(heatOutJ, 2),
      compressionRatio: roundTo(r, 2),
    },
    details: {
      cycleCoordinates,
      tHotK: Th,
      tColdK: Tc,
    },
    series: [{ label: `${cycle.toUpperCase()} Sikli (P-V)`, points: cyclePts }],
  };
}

/**
 * 4. Real Gas Van der Waals Solver
 */
function simulateRealGasVdw(input: ThermodynamicsInput): ThermodynamicsResult {
  const preset = input.gasPreset ?? "nitrogen";
  const defaultConsts = VDW_PRESETS[preset] ?? VDW_PRESETS.nitrogen;
  const a = Math.max(0.0001, input.vdwAPaM6Mol2 ?? defaultConsts.a);
  const b = Math.max(1e-6, input.vdwBM3Mol ?? defaultConsts.b);
  const n = Math.max(0.01, input.moles ?? 1);
  const T = Math.max(1, input.t1K ?? 300);

  // Critical Constants: Tc = 8a / (27 R b), Pc = a / (27 b^2), Vc = 3 n b, Zc = 3/8 = 0.375
  const Tc = (8 * a) / (27 * CODATA.R * b);
  const Pc = a / (27 * b * b);
  const Vc = 3 * n * b;
  const Zc = 0.375;

  // Boyle temperature: TB = a / (R * b)
  const T_Boyle = a / (CODATA.R * b);
  // Maximum inversion temperature for Joule-Thomson: Ti_max = 2a / (R * b)
  const T_Inversion = (2 * a) / (CODATA.R * b);

  // Operating volume with strict singularity guard: V >= 1.05 * n * b
  const minAllowedV = 1.05 * n * b;
  const V = Math.max(minAllowedV, input.v1M3 ?? Vc);

  // Pressure from Van der Waals: P = n R T / (V - n b) - a n^2 / V^2
  let pVdw = (n * CODATA.R * T) / (V - n * b) - (a * n * n) / (V * V);
  if (pVdw <= 0) {
    pVdw = Math.max(100, ((n * CODATA.R * T) / (V - n * b)) * 0.1);
  }
  const pIdeal = (n * CODATA.R * T) / V;
  const compressibilityZ = (pVdw * V) / (n * CODATA.R * T);

  // Generate 3 Isotherms: Subcritical (0.8 Tc), Critical (Tc), Supercritical (1.3 Tc)
  const steps = 70;
  const vRangeMin = 1.1 * n * b;
  const vRangeMax = 5 * Vc;
  const dv = (vRangeMax - vRangeMin) / steps;

  const isothermSub: { x: number; y: number }[] = [];
  const isothermCrit: { x: number; y: number }[] = [];
  const isothermSuper: { x: number; y: number }[] = [];

  for (let s = 0; s <= steps; s++) {
    const vol = vRangeMin + s * dv;
    const pSub = (n * CODATA.R * (0.85 * Tc)) / (vol - n * b) - (a * n * n) / (vol * vol);
    const pCrit = (n * CODATA.R * Tc) / (vol - n * b) - (a * n * n) / (vol * vol);
    const pSup = (n * CODATA.R * (1.3 * Tc)) / (vol - n * b) - (a * n * n) / (vol * vol);

    isothermSub.push({ x: roundTo(vol * 1e3, 3), y: roundTo(pSub / 1e6, 3) }); // Liters vs MPa
    isothermCrit.push({ x: roundTo(vol * 1e3, 3), y: roundTo(pCrit / 1e6, 3) });
    isothermSuper.push({ x: roundTo(vol * 1e3, 3), y: roundTo(pSup / 1e6, 3) });
  }

  return {
    subMode: "real_gas_vdw",
    summary: {
      gasName: defaultConsts.nameUz,
      pVdwMPa: roundTo(pVdw / 1e6, 4),
      vdwPressureKPa: roundTo(pVdw / 1e3, 3),
      pIdealMPa: roundTo(pIdeal / 1e6, 4),
      compressibilityZ: roundTo(compressibilityZ, 4),
      tCritK: roundTo(Tc, 2),
      pCritMPa: roundTo(Pc / 1e6, 3),
      vCritLiters: roundTo(Vc * 1e3, 4),
      zCrit: roundTo(Zc, 3),
      tBoyleK: roundTo(T_Boyle, 1),
      tInversionMaxK: roundTo(T_Inversion, 1),
    },
    details: {
      aCoeff: a,
      bCoeff: b,
      reducedTemp: roundTo(T / Tc, 4),
      reducedPressure: roundTo(pVdw / Pc, 4),
      reducedVolume: roundTo(V / Vc, 4),
    },
    series: [
      { label: "Subkritik Izoterma (0.85 Tc)", points: isothermSub },
      { label: "Kritik Izoterma (Tc)", points: isothermCrit },
      { label: "O'ta Kritik Izoterma (1.3 Tc)", points: isothermSuper },
    ],
  };
}

/**
 * 5. Thermal Transport (Conduction, Radiation, Cooling)
 */
function simulateHeatTransfer(input: ThermodynamicsInput): ThermodynamicsResult {
  const k = Math.max(0.001, input.thermalConductivityW_MK ?? 0.8); // Glass ~0.8 W/(m*K)
  const A = Math.max(0.001, input.areaM2 ?? 1.5);
  const L = Math.max(0.0001, input.thicknessM ?? 0.05);
  const T1 = Math.max(1, input.t1K ?? 350);
  const T_env = Math.max(1, input.ambientTempK ?? 295);
  const eps = Math.min(1.0, Math.max(0.01, input.emissivity ?? 0.9));

  // Fourier heat conduction rate: Q_dot = k * A * (T1 - T_env) / L
  const conductionWatts = (k * A * (T1 - T_env)) / L;
  const thermalResistanceK_W = L / (k * A);

  // Stefan-Boltzmann net radiation: P = eps * sigma * A * (T1^4 - T_env^4)
  const radiationWatts = eps * CODATA.sigma_SB * A * (Math.pow(T1, 4) - Math.pow(T_env, 4));

  // Wien's displacement: lambda_max = 2.89777e-3 / T1
  const wienPeakLambdaNm = (2.897771955e-3 / T1) * 1e9;

  // Newton's law of cooling: T(t) = T_env + (T1 - T_env) * exp(-k_cool * t)
  const kCool = Math.max(0.0001, input.coolingCoeffK_S ?? 0.005);
  const durationS = Math.max(10, input.timeSpanS ?? 600);
  const coolingPoints: { x: number; y: number }[] = [];
  const steps = 60;
  const dt = durationS / steps;

  for (let s = 0; s <= steps; s++) {
    const t = s * dt;
    const temp = T_env + (T1 - T_env) * Math.exp(-kCool * t);
    coolingPoints.push({ x: roundTo(t, 1), y: roundTo(temp, 2) });
  }

  return {
    subMode: "heat_transfer",
    summary: {
      conductionPowerW: roundTo(conductionWatts, 2),
      radiationNetPowerW: roundTo(radiationWatts, 2),
      totalHeatLossPowerW: roundTo(conductionWatts + radiationWatts, 2),
      thermalResistanceK_W: roundTo(thermalResistanceK_W, 4),
      wienWavelengthNm: roundTo(wienPeakLambdaNm, 1),
      finalCoolingTempK: roundTo(coolingPoints[coolingPoints.length - 1].y, 2),
    },
    details: {
      emissivity: eps,
      ambientTempK: T_env,
      surfaceTempK: T1,
      thicknessMm: roundTo(L * 1000, 2),
    },
    series: [{ label: "Nyuton sovish egri chizig'i T(t)", points: coolingPoints }],
  };
}

/**
 * 6. Calorimetry & Thermal Expansion
 */
function simulateCalorimetry(input: ThermodynamicsInput): ThermodynamicsResult {
  const m1 = Math.max(0.001, input.substanceMassKg ?? 0.5); // e.g. metal block
  const c1 = Math.max(10, input.specificHeatJ_KgK ?? 385); // Copper 385 J/(kg*K)
  const T1 = Math.max(1, input.initialTempK ?? 373.15); // 100 C

  const m2 = Math.max(0.001, input.waterMassKg ?? 1.0); // Water
  const c2 = 4186; // J/(kg*K)
  const T2 = Math.max(1, input.waterInitialTempK ?? 293.15); // 20 C

  // Heat exchange without phase change: m1*c1*(T1 - Tf) = m2*c2*(Tf - T2)
  // Tf = (m1*c1*T1 + m2*c2*T2) / (m1*c1 + m2*c2)
  const Tf = (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2);
  const heatExchangedJ = m1 * c1 * (T1 - Tf);

  // Linear & volumetric thermal expansion
  const alpha = Math.max(1e-7, input.linearExpCoeff_1K ?? 1.65e-5); // Copper ~16.5e-6 1/K
  const L0 = Math.max(0.01, input.originalLengthM ?? 1.0);
  const deltaT = T1 - T2;
  const deltaL = alpha * L0 * deltaT;
  const deltaV = 3 * alpha * Math.pow(L0, 3) * deltaT;

  return {
    subMode: "calorimetry",
    summary: {
      equilibriumTempK: roundTo(Tf, 2),
      equilibriumTempC: roundTo(Tf - 273.15, 2),
      heatTransferredJ: roundTo(heatExchangedJ, 2),
      metalHeatCapacityJ_K: roundTo(m1 * c1, 2),
      waterHeatCapacityJ_K: roundTo(m2 * c2, 2),
      linearExpansionMm: roundTo(deltaL * 1000, 4),
      relativeExpansionPct: roundTo((deltaL / L0) * 100, 4),
      volumetricExpansionCm3: roundTo(deltaV * 1e6, 4),
    },
    details: {
      substanceMassKg: m1,
      waterMassKg: m2,
      tempDropSubstanceK: roundTo(T1 - Tf, 2),
      tempRiseWaterK: roundTo(Tf - T2, 2),
    },
  };
}

/**
 * 7. Fluid Viscosity & Surface Tension
 */
function simulateFluidSurface(input: ThermodynamicsInput): ThermodynamicsResult {
  const sigma = Math.max(0.001, input.surfaceTensionN_M ?? 0.0728); // Water 0.0728 N/m
  const theta = (Math.max(0, Math.min(89, input.contactAngleDeg ?? 0)) * Math.PI) / 180;
  const rTube = Math.max(1e-6, input.tubeRadiusM ?? 0.0005); // 0.5 mm capillary
  const rhoFluid = Math.max(10, input.fluidDensityKg_M3 ?? 1000); // 1000 kg/m^3

  // Capillary rise: Jurin's Law: h = 2 * sigma * cos(theta) / (rho * g * r)
  const capillaryHeightM = (2 * sigma * Math.cos(theta)) / (rhoFluid * CODATA.g * rTube);
  // Laplace excess pressure inside bubble: Delta P = 2 * sigma / r
  const laplacePressurePa = (2 * sigma) / rTube;

  // Poiseuille flow: Q_vol = pi * r^4 * Delta P / (8 * eta * L)
  const eta = Math.max(1e-5, input.fluidViscosityPaS ?? 0.001002); // Water 1.002 mPa*s
  const deltaP = Math.max(1, input.pressureDropPa ?? 500); // 500 Pa
  const lengthTube = Math.max(0.01, input.tubeLengthM ?? 0.2); // 20 cm
  const flowRateM3_S = (Math.PI * Math.pow(rTube, 4) * deltaP) / (8 * eta * lengthTube);

  // Stokes Falling Ball: v_term = 2 * r^2 * (rho_s - rho_f) * g / (9 * eta)
  const rSphere = Math.max(1e-4, input.sphereRadiusM ?? 0.002); // 2 mm
  const rhoSphere = Math.max(rhoFluid + 1, input.sphereDensityKg_M3 ?? 7800); // Steel
  const vTerminal = (2 * rSphere * rSphere * (rhoSphere - rhoFluid) * CODATA.g) / (9 * eta);

  // Clement-Desormes adiabatic index solver
  const h1 = Math.max(1, input.clementH1Mm ?? 100);
  const h2Raw = input.clementH2Mm ?? 28;
  // Singularity guard: h1 - h2 >= 0.5 mm
  const h2 = Math.min(h1 - 0.5, Math.max(0, h2Raw));
  const clementGamma = h1 / (h1 - h2);

  return {
    subMode: input.subMode || "fluid_surface",
    summary: {
      capillaryRiseMm: roundTo(capillaryHeightM * 1000, 2),
      laplacePressurePa: roundTo(laplacePressurePa, 2),
      poiseuilleFlowRateMl_S: roundTo(flowRateM3_S * 1e6, 4),
      stokesTerminalSpeedMs: roundTo(vTerminal, 4),
      clementDesormesGamma: roundTo(clementGamma, 3),
      viscosityMpaS: roundTo(eta * 1000, 3),
      surfaceTensionMn_M: roundTo(sigma * 1000, 2),
    },
    details: {
      capillaryRadiusMm: roundTo(rTube * 1000, 3),
      contactAngleDeg: roundTo((theta * 180) / Math.PI, 1),
      fluidDensityKgM3: rhoFluid,
      sphereRadiusMm: roundTo(rSphere * 1000, 2),
    },
  };
}

/**
 * 8. Rankine Steam Power Cycle with Superheat & Isentropic Efficiencies
 */
function simulateRankineCycle(input: ThermodynamicsInput): ThermodynamicsResult {
  const pBoilerMpa = Math.max(0.5, Math.min(22.0, input.boilerPressureMpa ?? 4.0));
  const pCondKpa = Math.max(2.0, Math.min(100.0, input.condenserPressureKpa ?? 10.0));
  const tTurbineC = Math.max(250, Math.min(650, input.turbineInletTempC ?? 500));
  const etaTurbine = Math.max(0.5, Math.min(1.0, input.turbineIsentropicEfficiency ?? 0.88));
  const etaPump = Math.max(0.5, Math.min(1.0, input.pumpIsentropicEfficiency ?? 0.85));
  const powerMw = Math.max(1.0, input.netPowerOutputMw ?? 100.0);

  // Approximate steam thermodynamic properties based on IAPWS correlations
  // Condenser saturation state (P in kPa)
  const tSatCondC = 99.63 * Math.pow(pCondKpa / 101.325, 0.28);
  const hfCondKj = 4.184 * tSatCondC; // Enthalpy of saturated liquid
  const hfgCondKj = 2501.3 - 2.36 * tSatCondC; // Latent heat of vaporization
  const hgCondKj = hfCondKj + hfgCondKj;
  const sfCondKj = (4.184 * Math.log((tSatCondC + 273.15) / 273.15));
  const sfgCondKj = hfgCondKj / (tSatCondC + 273.15);

  // Boiler saturation state (P in MPa)
  const pBoilerKpa = pBoilerMpa * 1000;
  const tSatBoilerC = 99.63 * Math.pow(pBoilerKpa / 101.325, 0.28);
  const hfBoilerKj = 4.184 * tSatBoilerC;
  const hfgBoilerKj = 2501.3 - 2.36 * tSatBoilerC;
  const hgBoilerKj = hfBoilerKj + hfgBoilerKj;
  const sgBoilerKj = (4.184 * Math.log((tSatBoilerC + 273.15) / 273.15)) + (hfgBoilerKj / (tSatBoilerC + 273.15));

  // State 1: Saturated liquid entering pump
  const h1 = hfCondKj;
  const s1 = sfCondKj;
  const vf = 0.00101; // m^3/kg

  // State 2: Compressed liquid leaving pump
  const wPumpIsentropicKj = vf * (pBoilerKpa - pCondKpa); // kJ/kg
  const wPumpActualKj = wPumpIsentropicKj / etaPump;
  const h2 = h1 + wPumpActualKj;
  const s2 = s1; // approx

  // State 3: Superheated steam entering turbine
  const cpSuperheat = 2.15; // kJ/(kg*K)
  const superheatDt = Math.max(0, tTurbineC - tSatBoilerC);
  const h3 = hgBoilerKj + cpSuperheat * superheatDt;
  const s3 = sgBoilerKj + cpSuperheat * Math.log((tTurbineC + 273.15) / (tSatBoilerC + 273.15));

  // State 4: Exhaust steam entering condenser
  // Isentropic expansion: s4s = s3
  const x4s = Math.max(0, Math.min(1.0, (s3 - sfCondKj) / sfgCondKj));
  const h4s = hfCondKj + x4s * hfgCondKj;
  const wTurbineIsentropicKj = h3 - h4s;
  const wTurbineActualKj = wTurbineIsentropicKj * etaTurbine;
  const h4 = h3 - wTurbineActualKj;
  const x4Actual = Math.max(0, Math.min(1.0, (h4 - hfCondKj) / hfgCondKj));

  // Performance metrics
  const qInKj = h3 - h2;
  const qOutKj = h4 - h1;
  const wNetKj = wTurbineActualKj - wPumpActualKj;
  const thermalEfficiency = wNetKj / qInKj;
  const backWorkRatio = wPumpActualKj / wTurbineActualKj;
  const massFlowKgS = (powerMw * 1000) / wNetKj;
  const sscKgKwh = 3600 / wNetKj; // Specific Steam Consumption

  // Carnot efficiency between extreme temperatures
  const carnotEfficiency = 1 - (tSatCondC + 273.15) / (tTurbineC + 273.15);

  // Generate T-s diagram points
  const tsPoints: { x: number; y: number }[] = [
    { x: roundTo(s1, 3), y: roundTo(tSatCondC, 1) }, // 1
    { x: roundTo(s2, 3), y: roundTo(tSatCondC + 1.5, 1) }, // 2
    { x: roundTo(sfCondKj + 0.5, 3), y: roundTo(tSatBoilerC, 1) }, // boiling onset
    { x: roundTo(sgBoilerKj, 3), y: roundTo(tSatBoilerC, 1) }, // dry saturated
    { x: roundTo(s3, 3), y: roundTo(tTurbineC, 1) }, // 3 superheat
    { x: roundTo(s3 + 0.25, 3), y: roundTo(tSatCondC, 1) }, // 4 actual
    { x: roundTo(s1, 3), y: roundTo(tSatCondC, 1) }, // back to 1
  ];

  return {
    subMode: "rankine_cycle",
    summary: {
      thermalEfficiencyPct: roundTo(thermalEfficiency * 100, 2),
      carnotEfficiencyPct: roundTo(carnotEfficiency * 100, 2),
      netWorkOutputKj_Kg: roundTo(wNetKj, 2),
      turbineWorkKj_Kg: roundTo(wTurbineActualKj, 2),
      pumpWorkKj_Kg: roundTo(wPumpActualKj, 3),
      heatInputKj_Kg: roundTo(qInKj, 2),
      steamMassFlowRateKg_S: roundTo(massFlowKgS, 2),
      specificSteamConsumptionKg_Kwh: roundTo(sscKgKwh, 3),
      exhaustVaporQualityPct: roundTo(x4Actual * 100, 1),
      backWorkRatioPct: roundTo(backWorkRatio * 100, 3),
    },
    details: {
      boilerPressureMpa: pBoilerMpa,
      condenserPressureKpa: pCondKpa,
      turbineInletTempC: tTurbineC,
      condenserSaturationTempC: roundTo(tSatCondC, 1),
      boilerSaturationTempC: roundTo(tSatBoilerC, 1),
      h1_kJ_kg: roundTo(h1, 1),
      h2_kJ_kg: roundTo(h2, 1),
      h3_kJ_kg: roundTo(h3, 1),
      h4_kJ_kg: roundTo(h4, 1),
    },
    series: [
      { label: "Rankine T-s sikli", points: tsPoints },
    ],
  };
}

/**
 * 9. Peng-Robinson Modern Cubic Equation of State & Fugacity
 */
export const PR_COMPOUNDS: Record<string, { Tc: number; Pc: number; omega: number; M: number; nameUz: string }> = {
  methane: { Tc: 190.56, Pc: 4.599, omega: 0.0115, M: 0.01604, nameUz: "Metan (CH4)" },
  ethane: { Tc: 305.32, Pc: 4.872, omega: 0.0995, M: 0.03007, nameUz: "Etan (C2H6)" },
  propane: { Tc: 369.83, Pc: 4.248, omega: 0.1523, M: 0.04410, nameUz: "Propan (C3H8)" },
  co2: { Tc: 304.13, Pc: 7.377, omega: 0.2239, M: 0.04401, nameUz: "Karbonat angidrid (CO2)" },
  water: { Tc: 647.10, Pc: 22.064, omega: 0.3443, M: 0.01802, nameUz: "Suv (H2O)" },
  nitrogen: { Tc: 126.20, Pc: 3.396, omega: 0.0372, M: 0.02801, nameUz: "Azot (N2)" },
};

function simulatePengRobinsonEos(input: ThermodynamicsInput): ThermodynamicsResult {
  const compoundKey = input.fluidCompound ?? "methane";
  const compound = PR_COMPOUNDS[compoundKey] ?? PR_COMPOUNDS.methane;
  const Tc = input.criticalTempK ?? compound.Tc;
  const PcMpa = input.criticalPressureMpa ?? compound.Pc;
  const omega = input.acentricFactor ?? compound.omega;
  const PcPa = PcMpa * 1e6;

  const T = Math.max(50, input.t1K ?? input.temperatureK ?? Tc * 0.95);
  const PPa = Math.max(1e4, input.p1Pa ?? (input.pressureKPa ? input.pressureKPa * 1000 : PcPa * 0.5));
  const R = CODATA.R;

  // PR EOS parameters
  const Tr = T / Tc;
  const Pr = PPa / PcPa;
  const aTc = 0.45724 * (R * R * Tc * Tc) / PcPa;
  const b = 0.07780 * (R * Tc) / PcPa;
  const kappa = 0.37464 + 1.54226 * omega - 0.26992 * omega * omega;
  const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(Tr)), 2);
  const a = aTc * alpha;

  // Dimensionless cubic coefficients: Z^3 + c2*Z^2 + c1*Z + c0 = 0
  const A = (a * PPa) / (R * R * T * T);
  const B = (b * PPa) / (R * T);
  const c2 = -(1 - B);
  const c1 = A - 3 * B * B - 2 * B;
  const c0 = -(A * B - B * B - B * B * B);

  // Analytical cubic root solver
  const Q = (3 * c1 - c2 * c2) / 9;
  const R_param = (9 * c2 * c1 - 27 * c0 - 2 * c2 * c2 * c2) / 54;
  const D = Q * Q * Q + R_param * R_param; // Discriminant

  let zRoots: number[] = [];
  if (D < 0) {
    // 3 real roots
    const theta = Math.acos(Math.max(-1, Math.min(1, R_param / Math.sqrt(-Q * Q * Q))));
    const sqrtNegQ = 2 * Math.sqrt(-Q);
    const z1 = sqrtNegQ * Math.cos(theta / 3) - c2 / 3;
    const z2 = sqrtNegQ * Math.cos((theta + 2 * Math.PI) / 3) - c2 / 3;
    const z3 = sqrtNegQ * Math.cos((theta + 4 * Math.PI) / 3) - c2 / 3;
    zRoots = [z1, z2, z3].filter(z => z > B).sort((x, y) => x - y);
  } else {
    // 1 real root
    const S = Math.cbrt(R_param + Math.sqrt(D));
    const T_cubic = Math.cbrt(R_param - Math.sqrt(D));
    const z1 = S + T_cubic - c2 / 3;
    if (z1 > B) zRoots = [z1];
  }

  const zVapor = zRoots.length > 0 ? zRoots[zRoots.length - 1] : 1.0;
  const zLiquid = zRoots.length > 1 ? zRoots[0] : zVapor;
  const hasPhaseCoexistence = zRoots.length >= 3;

  // Fugacity coefficients
  const calcLnPhi = (Z: number) => {
    if (Z <= B) return 0;
    const term1 = Z - 1;
    const term2 = -Math.log(Z - B);
    const term3 = -(A / (2 * Math.SQRT2 * B)) * Math.log((Z + (1 + Math.SQRT2) * B) / (Z + (1 - Math.SQRT2) * B));
    return term1 + term2 + term3;
  };

  const lnPhiVapor = calcLnPhi(zVapor);
  const phiVapor = Math.exp(lnPhiVapor);
  const lnPhiLiquid = hasPhaseCoexistence ? calcLnPhi(zLiquid) : lnPhiVapor;
  const phiLiquid = Math.exp(lnPhiLiquid);

  const molarVolumeM3Mol = (zVapor * R * T) / PPa;
  const molarVolumeLiquidM3Mol = (zLiquid * R * T) / PPa;

  // Generate P-v isotherm points
  const isothermPoints: { x: number; y: number }[] = [];
  const idealPoints: { x: number; y: number }[] = [];
  const vMin = b * 1.15;
  const vMax = Math.max(vMin * 20, molarVolumeM3Mol * 4);
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const v = vMin * Math.pow(vMax / vMin, i / steps);
    const pPR = (R * T) / (v - b) - a / (v * (v + b) + b * (v - b));
    const pIdeal = (R * T) / v;
    if (pPR > 0 && pPR < PcPa * 4) {
      isothermPoints.push({ x: roundTo(v * 1e3, 3), y: roundTo(pPR / 1e6, 3) });
    }
    if (pIdeal > 0 && pIdeal < PcPa * 4) {
      idealPoints.push({ x: roundTo(v * 1e3, 3), y: roundTo(pIdeal / 1e6, 3) });
    }
  }

  return {
    subMode: "peng_robinson_eos",
    summary: {
      compressibilityZ_Vapor: roundTo(zVapor, 4),
      compressibilityZ_Liquid: roundTo(zLiquid, 4),
      fugacityCoefficientVapor: roundTo(phiVapor, 4),
      fugacityCoefficientLiquid: roundTo(phiLiquid, 4),
      molarVolumeVaporL_Mol: roundTo(molarVolumeM3Mol * 1000, 3),
      molarVolumeLiquidL_Mol: roundTo(molarVolumeLiquidM3Mol * 1000, 3),
      phaseState: hasPhaseCoexistence ? "Ikki fazali (Suyuqlik + Bug')" : Tr > 1.0 ? "Superkritik flyuid" : "Bir fazali gaz",
      reducedTemperatureTr: roundTo(Tr, 3),
      reducedPressurePr: roundTo(Pr, 3),
    },
    details: {
      compoundName: compound.nameUz,
      criticalTempK: Tc,
      criticalPressureMpa: PcMpa,
      acentricFactor: omega,
      parameterA_Pa_M6_Mol2: roundTo(a, 4),
      parameterB_M3_Mol: roundTo(b, 7),
    },
    series: [
      { label: "Peng-Robinson P-v izotermasi (MPa)", points: isothermPoints },
      { label: "Ideal gaz P-v izotermasi (MPa)", points: idealPoints },
    ],
  };
}

/**
 * 10. Planck Blackbody Spectral Radiance & Radiative Exchange
 */
function simulateBlackbodyPlanck(input: ThermodynamicsInput): ThermodynamicsResult {
  const T1 = Math.max(10, Math.min(6000, input.emitterTempK ?? (input.temperatureK ?? 1200))); // K
  const T2 = Math.max(5, Math.min(5000, input.absorberTempK ?? (input.ambientTempK ?? 300))); // K
  const eps1 = Math.max(0.01, Math.min(1.0, input.emitterEmissivity ?? (input.emissivity ?? 0.85)));
  const eps2 = Math.max(0.01, Math.min(1.0, input.absorberEmissivity ?? 0.80));
  const area = Math.max(1e-4, input.surfaceAreaM2 ?? (input.areaM2 ?? 1.0));

  // Wien's Displacement Law: lambda_max * T = b_wien = 2.897771955e-3 m*K
  const bWien = 2.897771955e-3;
  const lambdaMaxM = bWien / T1;
  const lambdaMaxUm = lambdaMaxM * 1e6;

  // Stefan-Boltzmann Law: E_b = sigma * T^4
  const sigmaSB = CODATA.sigma_SB; // 5.670374419e-8 W/(m^2*K^4)
  const emissivePowerBlackbodyW_M2 = sigmaSB * Math.pow(T1, 4);
  const actualEmissivePowerW_M2 = eps1 * emissivePowerBlackbodyW_M2;
  const totalEmittedPowerW = actualEmissivePowerW_M2 * area;

  // Radiative exchange between two grey surfaces
  const epsEffective = 1 / (1 / eps1 + 1 / eps2 - 1);
  const netRadiativeFluxW_M2 = epsEffective * sigmaSB * (Math.pow(T1, 4) - Math.pow(T2, 4));
  const netRadiativeHeatFlowW = netRadiativeFluxW_M2 * area;

  // Linearized radiation heat transfer coefficient
  const hrLinearW_M2K = epsEffective * sigmaSB * (T1 + T2) * (T1 * T1 + T2 * T2);

  // Planck Spectral Radiance curve: B_lambda(lambda, T) = (2hc^2 / lambda^5) / (exp(hc/(lambda*k*T)) - 1)
  const h = CODATA.h;
  const c = CODATA.c;
  const kB = CODATA.k_B;
  const c1 = 2 * h * c * c; // 1.19104e-16 W*m^2/sr
  const c2Const = (h * c) / kB; // 0.0143877 m*K

  const planckPoints: { x: number; y: number }[] = [];
  const planckPointsCold: { x: number; y: number }[] = [];
  const minLamUm = Math.max(0.1, lambdaMaxUm * 0.1);
  const maxLamUm = Math.max(5.0, lambdaMaxUm * 8.0);
  const stepCount = 80;

  let visibleFluxIntegral = 0;
  for (let i = 0; i <= stepCount; i++) {
    const lamUm = minLamUm + (i / stepCount) * (maxLamUm - minLamUm);
    const lamM = lamUm * 1e-6;
    const exponent = c2Const / (lamM * T1);
    const expCold = c2Const / (lamM * T2);

    const bLam = exponent < 70 ? (c1 / Math.pow(lamM, 5)) / (Math.exp(exponent) - 1) : 0;
    const bLamCold = expCold < 70 ? (c1 / Math.pow(lamM, 5)) / (Math.exp(expCold) - 1) : 0;

    // Convert to kW / (m^2 * sr * um)
    const bLamKwUm = (bLam * 1e-6) / 1000;
    const bLamColdKwUm = (bLamCold * 1e-6) / 1000;
    planckPoints.push({ x: roundTo(lamUm, 3), y: roundTo(bLamKwUm, 3) });
    planckPointsCold.push({ x: roundTo(lamUm, 3), y: roundTo(bLamColdKwUm, 3) });

    // Integrate visible spectrum (0.38 - 0.75 um)
    if (lamUm >= 0.38 && lamUm <= 0.75) {
      visibleFluxIntegral += Math.PI * bLam * ((maxLamUm - minLamUm) / stepCount) * 1e-6;
    }
  }

  const visibleFractionPct = Math.min(100, (visibleFluxIntegral / Math.max(1, emissivePowerBlackbodyW_M2)) * 100);

  return {
    subMode: "blackbody_planck_radiation",
    summary: {
      wienPeakWavelengthUm: roundTo(lambdaMaxUm, 3),
      blackbodyEmissivePowerKw_M2: roundTo(emissivePowerBlackbodyW_M2 / 1000, 2),
      actualEmissivePowerKw_M2: roundTo(actualEmissivePowerW_M2 / 1000, 2),
      totalEmittedPowerKw: roundTo(totalEmittedPowerW / 1000, 2),
      netRadiativeFluxKw_M2: roundTo(netRadiativeFluxW_M2 / 1000, 2),
      netRadiativeHeatFlowKw: roundTo(netRadiativeHeatFlowW / 1000, 2),
      linearRadiationCoeffW_M2K: roundTo(hrLinearW_M2K, 2),
      visibleEmissionFractionPct: roundTo(visibleFractionPct, 2),
    },
    details: {
      emitterTempK: T1,
      absorberTempK: T2,
      emitterEmissivity: eps1,
      absorberEmissivity: eps2,
      effectiveEmissivity: roundTo(epsEffective, 4),
      surfaceAreaM2: area,
    },
    series: [
      { label: `Plank nurlanishi T=${T1} K (kW/(m²·sr·µm))`, points: planckPoints },
      { label: `Yutiluvchi T=${T2} K (kW/(m²·sr·µm))`, points: planckPointsCold },
    ],
  };
}

/**
 * 11. 1D Transient Heat Conduction (Fourier PDE Finite Difference Solver)
 */
function simulateTransientConduction1D(input: ThermodynamicsInput): ThermodynamicsResult {
  const L = Math.max(0.005, Math.min(0.5, input.slabThicknessM ?? (input.thicknessM ?? 0.05))); // 5 cm slab
  const alpha = Math.max(1e-7, Math.min(1e-3, input.thermalDiffusivityM2_S ?? 1.2e-5)); // Steel ~ 1.2e-5 m^2/s
  const k = Math.max(0.1, input.thermalConductivityW_MK ?? (input.thermalConductivity ?? 45.0)); // Steel 45 W/mK
  const h = Math.max(1.0, input.convectionCoeffW_M2K ?? 150.0); // Convection 150 W/m^2K
  const T0 = input.initialTempC ?? 300.0; // Initial temperature °C
  const Tinf = input.ambientFluidTempC ?? 25.0; // Cooling fluid °C
  const tFinal = Math.max(1.0, input.simulationTimeS ?? 120.0); // 120 s

  // Dimensionless numbers
  const Bi = (h * L) / k; // Biot number
  const Fo = (alpha * tFinal) / (L * L); // Fourier number

  // Spatial discretization (N nodes from centerline x=0 to surface x=L)
  const N = Math.max(10, Math.min(50, input.gridNodesCount ?? 25));
  const dx = L / (N - 1);

  // Stability criterion for explicit FTCS: dt <= dx^2 / (2 * alpha * (1 + Bi*dx/L))
  const dtMax = (dx * dx) / (2.2 * alpha * (1 + (Bi * dx) / L));
  const numSteps = Math.min(2000, Math.max(50, Math.ceil(tFinal / dtMax)));
  const dt = tFinal / numSteps;
  const F_coeff = (alpha * dt) / (dx * dx);

  let T = new Float64Array(N);
  for (let i = 0; i < N; i++) T[i] = T0;

  // Record profile snapshots at 0%, 20%, 50%, 100% time
  const snapshotFractions = [0.0, 0.2, 0.5, 1.0];
  const snapshotSteps = snapshotFractions.map(f => Math.round(f * numSteps));
  const profiles: { label: string; points: { x: number; y: number }[] }[] = [];
  const centerlineHistory: { x: number; y: number }[] = [];

  for (let step = 0; step <= numSteps; step++) {
    const currentTime = step * dt;

    if (step % Math.max(1, Math.floor(numSteps / 40)) === 0) {
      centerlineHistory.push({ x: roundTo(currentTime, 1), y: roundTo(T[0], 2) });
    }

    const snapIdx = snapshotSteps.indexOf(step);
    if (snapIdx !== -1) {
      const snapPoints = Array.from(T).map((val, idx) => ({
        x: roundTo((idx * dx) * 100, 2), // cm
        y: roundTo(val, 2), // °C
      }));
      profiles.push({
        label: `T(x) t=${roundTo(currentTime, 1)} s (${Math.round(snapshotFractions[snapIdx] * 100)}%)`,
        points: snapPoints,
      });
    }

    // Time-stepping FTCS update
    const T_next = new Float64Array(N);
    // Symmetry boundary at centerline x=0: dT/dx = 0 -> T[-1] = T[1]
    T_next[0] = T[0] + 2 * F_coeff * (T[1] - T[0]);

    // Interior nodes
    for (let i = 1; i < N - 1; i++) {
      T_next[i] = T[i] + F_coeff * (T[i + 1] - 2 * T[i] + T[i - 1]);
    }

    // Convection boundary at surface x=L: -k dT/dx = h(T_N - Tinf)
    // T_N = (2*F*T_{N-1} + (1 - 2*F - 2*F*Bi*(dx/L))*T_N + 2*F*Bi*(dx/L)*Tinf)
    const gamma = (h * dx) / k;
    T_next[N - 1] = T[N - 1] + 2 * F_coeff * (T[N - 2] - T[N - 1] - gamma * (T[N - 1] - Tinf));

    T = T_next;
  }

  const surfaceTempFinal = T[N - 1];
  const centerTempFinal = T[0];

  return {
    subMode: "transient_conduction_1d",
    summary: {
      biotNumber: roundTo(Bi, 4),
      fourierNumber: roundTo(Fo, 4),
      lumpedCapacitanceValid: Bi < 0.1,
      centerlineTempFinalC: roundTo(centerTempFinal, 2),
      surfaceTempFinalC: roundTo(surfaceTempFinal, 2),
      slabThicknessMm: roundTo(L * 1000, 1),
      coolingSpanS: tFinal,
      convectionCoeffW_M2K: h,
    },
    details: {
      thermalConductivityW_MK: k,
      thermalDiffusivityM2_S: alpha,
      initialTempC: T0,
      ambientTempC: Tinf,
      gridNodes: N,
      timeStepS: roundTo(dt, 5),
    },
    series: [
      ...profiles,
      { label: "Markaziy nuqta harorati T(t) (°C)", points: centerlineHistory },
    ],
  };
}

