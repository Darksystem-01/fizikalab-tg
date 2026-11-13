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
  | "fluid_surface";

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
