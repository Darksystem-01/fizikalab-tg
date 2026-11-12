import { roundTo } from "./constants";

export interface VernierInput {
  mode: "vernier" | "micrometer" | "spherometer";
  trueValueMm: number;
  leastCountMm?: number; // 0.02, 0.05, 0.1 for vernier; 0.01 for micrometer/spherometer
  zeroErrorMm?: number;
  legSpacingMm?: number; // For spherometer (l)
  sampleCount?: number;
  noiseSigmaMm?: number;
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
  const leastCountMm =
    mode === "vernier" ? input.leastCountMm ?? 0.02 : 0.01;
  const zeroErrorMm = input.zeroErrorMm ?? 0;
  const rawTrue = Math.max(0, input.trueValueMm + zeroErrorMm);

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
    const noise = seededGaussian(input.trueValueMm * 100 + i * 7.3) * sigma;
    const quantized =
      Math.round((input.trueValueMm + noise) / leastCountMm) * leastCountMm;
    samples.push(roundTo(Math.max(0, quantized), 4));
  }

  const stats = computeStatistics(samples);

  let spherometerRadiusMm: number | undefined;
  let spherometerUncertaintyMm: number | undefined;
  if (mode === "spherometer") {
    const l = Math.max(5, input.legSpacingMm ?? 40);
    const h = Math.max(0.01, correctedReadingMm);
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
