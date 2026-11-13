import { roundTo } from "./constants";

export interface VernierInput {
  mode:
    | "vernier"
    | "micrometer"
    | "spherometer"
    | "density"
    | "young_modulus"
    | "regression";
  trueValueMm?: number;
  leastCountMm?: number; // 0.02, 0.05, 0.1 for vernier; 0.01 for micrometer/spherometer
  zeroErrorMm?: number;
  legSpacingMm?: number; // For spherometer (l)
  sampleCount?: number;
  noiseSigmaMm?: number;
  // Density and indirect measurement
  massG?: number;
  deltaMassG?: number;
  dim1Mm?: number;
  deltaDim1Mm?: number;
  dim2Mm?: number;
  deltaDim2Mm?: number;
  dim3Mm?: number;
  deltaDim3Mm?: number;
  shape?: "block" | "cylinder" | "sphere";
  // Young's modulus
  wireLengthM?: number;
  wireDiameterMm?: number;
  loadMassKg?: number;
  elongationMm?: number;
  // Regression
  points?: { x: number; y: number }[];
}

export interface MetrologyResult {
  mode: string;
  mainScaleReadingMm: number;
  secondaryDivision: number;
  leastCountMm: number;
  rawReadingMm: number;
  zeroErrorMm: number;
  correctedReadingMm: number;
  spherometerRadiusMm?: number;
  spherometerUncertaintyMm?: number;
  samples: number[];
  stats: StatisticalSummary;
  summary?: Record<string, number | string | boolean>;
  details?: Record<string, unknown>;
}

export interface StatisticalSummary {
  n: number;
  mean: number;
  variance: number;
  stdDev: number;
  stdError: number;
  min: number;
  max: number;
  relativeErrorPct: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  slopeUncertainty: number;
  interceptUncertainty: number;
  rSquared: number;
  fittedPoints: { x: number; y: number; yFit: number; residual: number }[];
}

export function computeStatistics(values: number[]): StatisticalSummary {
  const clean = values.filter((v) => Number.isFinite(v));
  const n = clean.length;
  if (n === 0) {
    return {
      n: 0,
      mean: 0,
      variance: 0,
      stdDev: 0,
      stdError: 0,
      min: 0,
      max: 0,
      relativeErrorPct: 0,
    };
  }
  const mean = clean.reduce((acc, v) => acc + v, 0) / n;
  const variance =
    n > 1
      ? clean.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  const stdError = n > 0 ? stdDev / Math.sqrt(n) : 0;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const relativeErrorPct =
    Math.abs(mean) > 1e-12 ? (stdError / Math.abs(mean)) * 100 : 0;

  return {
    n,
    mean: roundTo(mean, 6),
    variance: roundTo(variance, 8),
    stdDev: roundTo(stdDev, 6),
    stdError: roundTo(stdError, 6),
    min: roundTo(min, 6),
    max: roundTo(max, 6),
    relativeErrorPct: roundTo(relativeErrorPct, 4),
  };
}

export function computeLinearRegression(
  points: { x: number; y: number }[]
): LinearRegressionResult {
  const n = points.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: points[0]?.y ?? 0,
      slopeUncertainty: 0,
      interceptUncertainty: 0,
      rSquared: 1,
      fittedPoints: points.map((p) => ({ ...p, yFit: p.y, residual: 0 })),
    };
  }

  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  const slope = sxx > 1e-15 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;

  let sse = 0;
  const fittedPoints = points.map((p) => {
    const yFit = slope * p.x + intercept;
    const residual = p.y - yFit;
    sse += residual * residual;
    return {
      x: roundTo(p.x, 6),
      y: roundTo(p.y, 6),
      yFit: roundTo(yFit, 6),
      residual: roundTo(residual, 6),
    };
  });

  const s2 = n > 2 ? sse / (n - 2) : 0;
  const slopeUncertainty = sxx > 1e-15 ? Math.sqrt(s2 / sxx) : 0;
  const interceptUncertainty =
    sxx > 1e-15
      ? Math.sqrt(s2 * (1 / n + (meanX * meanX) / sxx))
      : 0;
  const rSquared = syy > 1e-15 ? Math.max(0, 1 - sse / syy) : 1;

  return {
    slope: roundTo(slope, 6),
    intercept: roundTo(intercept, 6),
    slopeUncertainty: roundTo(slopeUncertainty, 6),
    interceptUncertainty: roundTo(interceptUncertainty, 6),
    rSquared: roundTo(rSquared, 6),
    fittedPoints,
  };
}

/**
 * Deterministic Box-Muller pseudo-random normal sample using a seed so repeated requests
 * are reproducible when seeded or realistic when unseeded.
 */
function seededGaussian(seed: number): number {
  const s1 = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const s2 = Math.sin((seed + 1) * 93.9898 + 19.133) * 24634.6345;
  const u1 = Math.max(1e-7, s1 - Math.floor(s1));
  const u2 = s2 - Math.floor(s2);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function simulateMetrology(input: MetrologyInputCompat): MetrologyResult {
  const mode = input.mode;

  // Extended Mode 1: Density & Error Propagation
  if (mode === "density") {
    const shape = input.shape ?? "cylinder";
    const massG = Math.max(0.01, input.massG ?? 85.4);
    const dMassG = Math.max(0.001, input.deltaMassG ?? 0.05);

    let volumeCm3 = 1;
    let relVolUncertainty = 0;
    if (shape === "cylinder") {
      const dMm = Math.max(0.1, input.dim1Mm ?? 20.0);
      const hMm = Math.max(0.1, input.dim2Mm ?? 35.0);
      const dDMm = Math.max(0.005, input.deltaDim1Mm ?? 0.02);
      const dHMm = Math.max(0.005, input.deltaDim2Mm ?? 0.02);
      // V = pi/4 * d^2 * h (in cm^3, so / 1000)
      volumeCm3 = (Math.PI / 4) * Math.pow(dMm / 10, 2) * (hMm / 10);
      relVolUncertainty = Math.sqrt(4 * Math.pow(dDMm / dMm, 2) + Math.pow(dHMm / hMm, 2));
    } else if (shape === "sphere") {
      const dMm = Math.max(0.1, input.dim1Mm ?? 25.0);
      const dDMm = Math.max(0.005, input.deltaDim1Mm ?? 0.01);
      volumeCm3 = (Math.PI / 6) * Math.pow(dMm / 10, 3);
      relVolUncertainty = 3 * (dDMm / dMm);
    } else {
      // block: a * b * c
      const aMm = Math.max(0.1, input.dim1Mm ?? 20);
      const bMm = Math.max(0.1, input.dim2Mm ?? 30);
      const cMm = Math.max(0.1, input.dim3Mm ?? 40);
      const da = Math.max(0.005, input.deltaDim1Mm ?? 0.02);
      const db = Math.max(0.005, input.deltaDim2Mm ?? 0.02);
      const dc = Math.max(0.005, input.deltaDim3Mm ?? 0.02);
      volumeCm3 = (aMm / 10) * (bMm / 10) * (cMm / 10);
      relVolUncertainty = Math.sqrt(Math.pow(da / aMm, 2) + Math.pow(db / bMm, 2) + Math.pow(dc / cMm, 2));
    }

    const densityG_Cm3 = massG / volumeCm3;
    const relMassUncertainty = dMassG / massG;
    const totalRelUncertainty = Math.sqrt(Math.pow(relMassUncertainty, 2) + Math.pow(relVolUncertainty, 2));
    const absDensityUncertainty = densityG_Cm3 * totalRelUncertainty;

    return {
      mode,
      mainScaleReadingMm: 0,
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: roundTo(densityG_Cm3, 4),
      zeroErrorMm: 0,
      correctedReadingMm: roundTo(densityG_Cm3, 4),
      samples: [roundTo(densityG_Cm3, 4)],
      stats: computeStatistics([densityG_Cm3]),
      summary: {
        shape,
        massG: roundTo(massG, 3),
        volumeCm3: roundTo(volumeCm3, 4),
        densityG_Cm3: roundTo(densityG_Cm3, 4),
        densityKg_M3: roundTo(densityG_Cm3 * 1000, 1),
        relativeUncertaintyPct: roundTo(totalRelUncertainty * 100, 3),
        absoluteUncertaintyG_Cm3: roundTo(absDensityUncertainty, 4),
      },
    };
  }

  // Extended Mode 2: Young's Modulus
  if (mode === "young_modulus") {
    const L = Math.max(0.1, input.wireLengthM ?? 2.0); // 2 m
    const dMm = Math.max(0.05, input.wireDiameterMm ?? 0.5); // 0.5 mm
    const M = Math.max(0.1, input.loadMassKg ?? 5.0); // 5 kg
    const deltaLMm = Math.max(0.001, input.elongationMm ?? 1.25); // 1.25 mm
    const g = 9.80665;

    const rM = (dMm / 2) * 1e-3;
    const areaM2 = Math.PI * rM * rM;
    const forceN = M * g;
    const deltaLM = deltaLMm * 1e-3;
    const E = (forceN * L) / (areaM2 * deltaLM); // Pa

    return {
      mode,
      mainScaleReadingMm: 0,
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: roundTo(E / 1e9, 3),
      zeroErrorMm: 0,
      correctedReadingMm: roundTo(E / 1e9, 3),
      samples: [roundTo(E / 1e9, 3)],
      stats: computeStatistics([E / 1e9]),
      summary: {
        youngModulusGPa: roundTo(E / 1e9, 2),
        appliedForceN: roundTo(forceN, 2),
        crossSectionAreaMm2: roundTo(areaM2 * 1e6, 4),
        stressMPa: roundTo((forceN / areaM2) / 1e6, 2),
        strain: roundTo(deltaLM / L, 6),
      },
    };
  }

  // Extended Mode 3: Regression
  if (mode === "regression" && input.points && input.points.length >= 2) {
    const reg = computeLinearRegression(input.points);
    return {
      mode,
      mainScaleReadingMm: roundTo(reg.slope, 4),
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: roundTo(reg.slope, 4),
      zeroErrorMm: 0,
      correctedReadingMm: roundTo(reg.slope, 4),
      samples: input.points.map((p) => p.y),
      stats: computeStatistics(input.points.map((p) => p.y)),
      summary: {
        slope: reg.slope,
        intercept: reg.intercept,
        rSquared: reg.rSquared,
        slopeUncertainty: reg.slopeUncertainty,
      },
      details: { reg },
    };
  }

  const leastCountMm =
    mode === "vernier" ? input.leastCountMm ?? 0.02 : 0.01;
  const zeroErrorMm = input.zeroErrorMm ?? 0;
  const trueVal = input.trueValueMm ?? 24.64;
  const rawTrue = Math.max(0, trueVal + zeroErrorMm);

  let mainScaleReadingMm = 0;
  let secondaryDivision = 0;

  if (mode === "vernier") {
    mainScaleReadingMm = Math.floor(rawTrue + 1e-9);
    const remainder = Math.max(0, rawTrue - mainScaleReadingMm);
    secondaryDivision = Math.round(remainder / leastCountMm);
    const maxDiv = Math.round(1 / leastCountMm);
    if (secondaryDivision >= maxDiv) {
      mainScaleReadingMm += 1;
      secondaryDivision = 0;
    }
  } else {
    // Micrometer & Spherometer: 0.5 mm pitch, 50 divisions -> 0.01 mm LC
    mainScaleReadingMm = Math.floor(rawTrue / 0.5 + 1e-9) * 0.5;
    const remainder = Math.max(0, rawTrue - mainScaleReadingMm);
    secondaryDivision = Math.round(remainder / 0.01);
    if (secondaryDivision >= 50) {
      mainScaleReadingMm += 0.5;
      secondaryDivision = 0;
    }
  }

  const rawReadingMm = roundTo(
    mainScaleReadingMm + secondaryDivision * leastCountMm,
    4
  );
  const correctedReadingMm = roundTo(rawReadingMm - zeroErrorMm, 4);

  const count = Math.min(30, Math.max(3, input.sampleCount ?? 5));
  const sigma = input.noiseSigmaMm ?? leastCountMm * 0.8;
  const samples: number[] = [];
  for (let i = 0; i < count; i++) {
    const noise = seededGaussian(trueVal * 100 + i * 7.3) * sigma;
    const quantized =
      Math.round((trueVal + noise) / leastCountMm) * leastCountMm;
    samples.push(roundTo(Math.max(0, quantized), 4));
  }

  const stats = computeStatistics(samples);

  let spherometerRadiusMm: number | undefined;
  let spherometerUncertaintyMm: number | undefined;
  if (mode === "spherometer") {
    const l = Math.max(5, input.legSpacingMm ?? 40);
    // Plano-flat guard: if h is very close to 0, clamp to 0.001 and calculate
    const h = Math.max(0.001, correctedReadingMm);
    spherometerRadiusMm = roundTo((l * l) / (6 * h) + h / 2, 4);
    // Error propagation: dR/dh = -l^2/(6h^2) + 1/2
    const dRdh = Math.abs(-(l * l) / (6 * h * h) + 0.5);
    const dh = Math.max(leastCountMm, stats.stdError);
    spherometerUncertaintyMm = roundTo(dRdh * dh, 4);
  }

  return {
    mode,
    mainScaleReadingMm: roundTo(mainScaleReadingMm, 3),
    secondaryDivision,
    leastCountMm,
    rawReadingMm,
    zeroErrorMm: roundTo(zeroErrorMm, 4),
    correctedReadingMm,
    spherometerRadiusMm,
    spherometerUncertaintyMm,
    samples,
    stats,
  };
}

export type MetrologyInputCompat = VernierInput;

export function studentsTPrime(
  meanA: number,
  errA: number,
  meanB: number,
  errB: number
): { tPrime: number; consistent: boolean } {
  const denom = Math.sqrt(errA * errA + errB * errB);
  if (denom < 1e-12) {
    return { tPrime: 0, consistent: Math.abs(meanA - meanB) < 1e-9 };
  }
  const tPrime = Math.abs(meanA - meanB) / denom;
  return { tPrime: roundTo(tPrime, 4), consistent: tPrime <= 2.0 };
}
