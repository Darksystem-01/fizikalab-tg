import { roundTo } from "./constants";

export interface VernierInput {
  mode:
    | "vernier"
    | "micrometer"
    | "spherometer"
    | "density"
    | "young_modulus"
    | "regression"
    | "gum_advanced"
    | "monte_carlo_gum"
    | "york_regression";
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

  // GUM Uncertainty Budget
  typeAValues?: number[]; // series of repeated observations
  typeBUncertainties?: { name: string; halfWidth: number; distribution: "rectangular" | "triangular" | "normal" | "u_shaped" }[];
  confidenceLevelPct?: number; // 95% or 99%

  // Monte Carlo GUM
  mcSampleCount?: number; // e.g. 10000
  mcModel?: "sum" | "product" | "pendulum_g" | "density";

  // York Regression (Errors in both x and y)
  yorkPoints?: { x: number; y: number; sx: number; sy: number; rxy?: number }[];
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
  curves?: { label: string; points: { x: number; y: number }[] }[];
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
    mean: roundTo(mean, 5),
    variance: roundTo(variance, 6),
    stdDev: roundTo(stdDev, 5),
    stdError: roundTo(stdError, 5),
    min: roundTo(min, 5),
    max: roundTo(max, 5),
    relativeErrorPct: roundTo(relativeErrorPct, 3),
  };
}

export function computeLinearRegression(points: { x: number; y: number }[]): LinearRegressionResult {
  const n = points.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: 0,
      slopeUncertainty: 0,
      interceptUncertainty: 0,
      rSquared: 0,
      fittedPoints: [],
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) {
    return {
      slope: 0,
      intercept: sumY / n,
      slopeUncertainty: 0,
      interceptUncertainty: 0,
      rSquared: 0,
      fittedPoints: points.map((p) => ({ ...p, yFit: sumY / n, residual: p.y - sumY / n })),
    };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // Residual variance and uncertainties
  let ssRes = 0;
  let ssTot = 0;
  const meanY = sumY / n;
  const fittedPoints = points.map((p) => {
    const yFit = slope * p.x + intercept;
    const residual = p.y - yFit;
    ssRes += residual * residual;
    ssTot += (p.y - meanY) * (p.y - meanY);
    return {
      x: roundTo(p.x, 4),
      y: roundTo(p.y, 4),
      yFit: roundTo(yFit, 4),
      residual: roundTo(residual, 4),
    };
  });

  const s2 = n > 2 ? ssRes / (n - 2) : 0;
  const slopeUncertainty = Math.sqrt((n * s2) / denom);
  const interceptUncertainty = Math.sqrt((s2 * sumXX) / denom);
  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

  return {
    slope: roundTo(slope, 5),
    intercept: roundTo(intercept, 5),
    slopeUncertainty: roundTo(slopeUncertainty, 5),
    interceptUncertainty: roundTo(interceptUncertainty, 5),
    rSquared: roundTo(rSquared, 4),
    fittedPoints,
  };
}

function seededGaussian(seed: number): number {
  const x = Math.sin(seed) * 10000;
  const u1 = Math.max(1e-6, x - Math.floor(x));
  const y = Math.sin(seed + 1.618) * 10000;
  const u2 = y - Math.floor(y);
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function simulateMetrology(input: VernierInput): MetrologyResult {
  const mode = input.mode ?? "vernier";

  // =========================================================================
  // GUM ADVANCED COMBINED UNCERTAINTY EVALUATION
  // =========================================================================
  if (mode === "gum_advanced") {
    const rawObs = input.typeAValues && input.typeAValues.length > 0 ? input.typeAValues : [24.62, 24.65, 24.64, 24.63, 24.66, 24.64];
    const statsA = computeStatistics(rawObs);
    const uA = statsA.stdError; // Type A standard uncertainty
    const nuA = Math.max(1, statsA.n - 1);

    // Type B components
    const defaultTypeB = [
      { name: "Asbob xatoligi (Linear kalibrlash)", halfWidth: 0.02, distribution: "rectangular" as const },
      { name: "Harorat effekti (Delta T = 2K)", halfWidth: 0.015, distribution: "triangular" as const },
      { name: "Operator ko'rish xatoligi (Parallaks)", halfWidth: 0.01, distribution: "rectangular" as const },
    ];
    const typeBList = input.typeBUncertainties && input.typeBUncertainties.length > 0 ? input.typeBUncertainties : defaultTypeB;

    let sumU2B = 0;
    const typeBBudget = typeBList.map((tb) => {
      let div = Math.sqrt(3); // rectangular
      if (tb.distribution === "triangular") div = Math.sqrt(6);
      else if (tb.distribution === "normal") div = 2.0; // k=2
      else if (tb.distribution === "u_shaped") div = Math.sqrt(2);
      const uVal = tb.halfWidth / div;
      sumU2B += uVal * uVal;
      return {
        name: tb.name,
        distribution: tb.distribution,
        halfWidthMm: tb.halfWidth,
        standardUncertaintyMm: roundTo(uVal, 5),
      };
    });

    // Combined uncertainty
    const uC = Math.sqrt(uA * uA + sumU2B);

    // Welch-Satterthwaite effective degrees of freedom:
    // nu_eff = u_c^4 / (u_A^4 / nu_A + sum(u_B_i^4 / nu_B_i)) where nu_B -> inf for reliable bounds
    const nuEff = Math.round(Math.pow(uC, 4) / (Math.pow(uA, 4) / nuA));

    // Coverage factor k for 95.45% (approx 2.0, or Student t adjustment)
    const kFactor = nuEff > 30 ? 2.0 : nuEff > 10 ? 2.23 : 2.57;
    const UExpanded = kFactor * uC;
    const relativeExpandedPct = (UExpanded / Math.abs(statsA.mean)) * 100;

    return {
      mode,
      mainScaleReadingMm: Math.floor(statsA.mean),
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: statsA.mean,
      zeroErrorMm: 0,
      correctedReadingMm: statsA.mean,
      samples: rawObs,
      stats: statsA,
      summary: {
        meanValueMm: statsA.mean,
        typeAUncertaintyMm: roundTo(uA, 5),
        typeBCombinedUncertaintyMm: roundTo(Math.sqrt(sumU2B), 5),
        combinedStandardUncertaintyMm: roundTo(uC, 5),
        effectiveDegreesOfFreedomNuEff: nuEff,
        coverageFactorK: roundTo(kFactor, 2),
        expandedUncertaintyUMm: roundTo(UExpanded, 5),
        relativeExpandedUncertaintyPct: roundTo(relativeExpandedPct, 3),
        confidenceIntervalFormatted: `(${statsA.mean} ± ${roundTo(UExpanded, 4)}) mm (P=95%)`,
      },
      details: { typeBBudget },
    };
  }

  // =========================================================================
  // MONTE CARLO GUM SUPPLEMENT 1 EVALUATION
  // =========================================================================
  if (mode === "monte_carlo_gum") {
    const N_trials = Math.min(20000, Math.max(1000, input.mcSampleCount ?? 10000));
    const meanX = input.trueValueMm ?? 25.0;
    const sigmaA = input.noiseSigmaMm ?? 0.025;
    const halfWidthB = 0.015;

    const trialResults: number[] = [];
    for (let i = 0; i < N_trials; i++) {
      // Gaussian Type A + Rectangular Type B
      const drawA = meanX + seededGaussian(i * 1.337) * sigmaA;
      const drawB = (Math.sin(i * 3.71) * 2 - 1) * halfWidthB;
      trialResults.push(drawA + drawB);
    }

    trialResults.sort((a, b) => a - b);
    const mcMean = trialResults.reduce((a, b) => a + b, 0) / N_trials;
    const mcVariance = trialResults.reduce((a, b) => a + (b - mcMean) ** 2, 0) / (N_trials - 1);
    const mcStdDev = Math.sqrt(mcVariance);

    // 95% Coverage interval: [2.5% quantile, 97.5% quantile]
    const idxLow = Math.floor(N_trials * 0.025);
    const idxHigh = Math.floor(N_trials * 0.975);
    const lowBound = trialResults[idxLow];
    const highBound = trialResults[idxHigh];
    const halfWidth95 = (highBound - lowBound) / 2;

    // Empirical Histogram (25 bins)
    const numBins = 25;
    const binWidth = (highBound - lowBound) / numBins;
    const histPoints: { x: number; y: number }[] = [];
    for (let b = 0; b < numBins; b++) {
      const binMid = lowBound + (b + 0.5) * binWidth;
      const count = trialResults.filter((v) => v >= lowBound + b * binWidth && v < lowBound + (b + 1) * binWidth).length;
      histPoints.push({ x: roundTo(binMid, 4), y: count });
    }

    return {
      mode,
      mainScaleReadingMm: Math.floor(mcMean),
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: roundTo(mcMean, 4),
      zeroErrorMm: 0,
      correctedReadingMm: roundTo(mcMean, 4),
      samples: trialResults.slice(0, 10),
      stats: computeStatistics(trialResults.slice(0, 50)),
      summary: {
        monteCarloTrials: N_trials,
        mcMeanMm: roundTo(mcMean, 5),
        mcStandardDeviationMm: roundTo(mcStdDev, 5),
        coverageInterval95LowMm: roundTo(lowBound, 5),
        coverageInterval95HighMm: roundTo(highBound, 5),
        coverageIntervalHalfWidthMm: roundTo(halfWidth95, 5),
        relativeCoverageIntervalPct: roundTo((halfWidth95 / mcMean) * 100, 3),
      },
      details: {},
      curves: [{ label: "Monte-Karlo Taqsirlanish Gistogrammasi", points: histPoints }],
    };
  }

  // =========================================================================
  // YORK WEIGHTED TOTAL LEAST SQUARES REGRESSION
  // =========================================================================
  if (mode === "york_regression") {
    const rawPts = input.yorkPoints && input.yorkPoints.length >= 3 ? input.yorkPoints : [
      { x: 1.0, y: 2.15, sx: 0.05, sy: 0.08 },
      { x: 2.0, y: 4.10, sx: 0.05, sy: 0.09 },
      { x: 3.0, y: 6.02, sx: 0.06, sy: 0.11 },
      { x: 4.0, y: 8.12, sx: 0.07, sy: 0.12 },
      { x: 5.0, y: 9.95, sx: 0.08, sy: 0.15 },
    ];

    // Iterative York 1968 algorithm:
    // Initial guess from ordinary least squares:
    const ols = computeLinearRegression(rawPts.map((p) => ({ x: p.x, y: p.y })));
    let bSlope = ols.slope;
    let aIntercept = ols.intercept;

    for (let iter = 0; iter < 15; iter++) {
      let sumW = 0;
      let sumWX = 0;
      let sumWY = 0;

      const weights = rawPts.map((p) => {
        const wx = 1 / Math.max(1e-8, p.sx * p.sx);
        const wy = 1 / Math.max(1e-8, p.sy * p.sy);
        const r = p.rxy ?? 0;
        const W_i = (wx * wy) / (wx + bSlope * bSlope * wy - 2 * bSlope * r * Math.sqrt(wx * wy));
        sumW += W_i;
        sumWX += W_i * p.x;
        sumWY += W_i * p.y;
        return { ...p, W_i };
      });

      const xBar = sumWX / sumW;
      const yBar = sumWY / sumW;

      let top = 0;
      let bot = 0;
      for (const p of weights) {
        const u = p.x - xBar;
        const v = p.y - yBar;
        const wx = 1 / Math.max(1e-8, p.sx * p.sx);
        const wy = 1 / Math.max(1e-8, p.sy * p.sy);
        const r = p.rxy ?? 0;
        const alpha = (2 * p.W_i * p.W_i) / (wx * wy);
        top += p.W_i * p.W_i * (u * (v / wy - r * u / Math.sqrt(wx * wy)));
        bot += p.W_i * p.W_i * (u * (u / wx - r * v / Math.sqrt(wx * wy)));
      }

      const nextB = top / (bot || 1e-6);
      aIntercept = yBar - nextB * xBar;
      if (Math.abs(nextB - bSlope) < 1e-6) {
        bSlope = nextB;
        break;
      }
      bSlope = nextB;
    }

    // Goodness of fit Chi^2
    let chi2 = 0;
    for (const p of rawPts) {
      const res = p.y - (bSlope * p.x + aIntercept);
      const varTotal = p.sy * p.sy + bSlope * bSlope * p.sx * p.sx;
      chi2 += (res * res) / varTotal;
    }
    const degFreedom = rawPts.length - 2;
    const mswd = chi2 / Math.max(1, degFreedom);

    return {
      mode,
      mainScaleReadingMm: roundTo(bSlope, 4),
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: roundTo(bSlope, 4),
      zeroErrorMm: 0,
      correctedReadingMm: roundTo(bSlope, 4),
      samples: rawPts.map((p) => p.y),
      stats: computeStatistics(rawPts.map((p) => p.y)),
      summary: {
        yorkBestFitSlope: roundTo(bSlope, 5),
        yorkBestFitIntercept: roundTo(aIntercept, 5),
        chiSquared: roundTo(chi2, 3),
        degreesOfFreedom: degFreedom,
        mswdReducedChi2: roundTo(mswd, 3),
        goodFitQuality: mswd >= 0.5 && mswd <= 2.0,
      },
      details: {},
    };
  }

  // =========================================================================
  // DENSITY OF SOLIDS
  // =========================================================================
  if (mode === "density") {
    const mass = Math.max(0.1, input.massG ?? 85.4);
    const dMass = Math.max(0.001, input.deltaMassG ?? 0.05);
    const shape = input.shape ?? "cylinder";

    let vol = 0;
    let relVolUncert = 0;

    if (shape === "block") {
      const a = Math.max(1, input.dim1Mm ?? 30);
      const da = Math.max(0.01, input.deltaDim1Mm ?? 0.02);
      const b = Math.max(1, input.dim2Mm ?? 20);
      const db = Math.max(0.01, input.deltaDim2Mm ?? 0.02);
      const c = Math.max(1, input.dim3Mm ?? 15);
      const dc = Math.max(0.01, input.deltaDim3Mm ?? 0.02);
      vol = a * b * c;
      relVolUncert = Math.sqrt((da / a) ** 2 + (db / b) ** 2 + (dc / c) ** 2);
    } else if (shape === "cylinder") {
      const d = Math.max(1, input.dim1Mm ?? 20);
      const dd = Math.max(0.01, input.deltaDim1Mm ?? 0.02);
      const h = Math.max(1, input.dim2Mm ?? 35);
      const dh = Math.max(0.01, input.deltaDim2Mm ?? 0.02);
      const r = d / 2;
      vol = Math.PI * r * r * h;
      relVolUncert = Math.sqrt((2 * (dd / d)) ** 2 + (dh / h) ** 2);
    } else {
      const d = Math.max(1, input.dim1Mm ?? 25);
      const dd = Math.max(0.01, input.deltaDim1Mm ?? 0.02);
      const r = d / 2;
      vol = (4 / 3) * Math.PI * r * r * r;
      relVolUncert = 3 * (dd / d);
    }

    const volCm3 = vol / 1000;
    const density = mass / volCm3;
    const relMassUncert = dMass / mass;
    const relDensityUncert = Math.sqrt(relMassUncert ** 2 + relVolUncert ** 2);
    const absDensityUncert = density * relDensityUncert;

    return {
      mode,
      mainScaleReadingMm: 0,
      secondaryDivision: 0,
      leastCountMm: 0.01,
      rawReadingMm: roundTo(density, 4),
      zeroErrorMm: 0,
      correctedReadingMm: roundTo(density, 4),
      samples: [roundTo(density, 4)],
      stats: computeStatistics([density]),
      summary: {
        densityG_Cm3: roundTo(density, 3),
        densityKg_M3: roundTo(density * 1000, 1),
        uncertaintyG_Cm3: roundTo(absDensityUncert, 4),
        relativeUncertaintyPct: roundTo(relDensityUncert * 100, 2),
        volumeCm3: roundTo(volCm3, 3),
        shape,
      },
    };
  }

  // =========================================================================
  // YOUNG'S MODULUS
  // =========================================================================
  if (mode === "young_modulus") {
    const L = Math.max(0.1, input.wireLengthM ?? 2.0);
    const dMm = Math.max(0.05, input.wireDiameterMm ?? 0.5);
    const M = Math.max(0.1, input.loadMassKg ?? 5.0);
    const deltaLMm = Math.max(0.001, input.elongationMm ?? 1.25);
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

  // =========================================================================
  // REGRESSION
  // =========================================================================
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

  // =========================================================================
  // VERNIER CALIPER, MICROMETER, SPHEROMETER CORE SIMULATION
  // =========================================================================
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
    const h = correctedReadingMm;
    if (h > 1e-4) {
      const R = (l * l) / (6 * h) + h / 2;
      spherometerRadiusMm = roundTo(R, 2);
      const dl = 0.1;
      const dh = leastCountMm;
      const dR = Math.sqrt(
        ((l / (3 * h)) * dl) ** 2 +
          ((-((l * l) / (6 * h * h)) + 0.5) * dh) ** 2
      );
      spherometerUncertaintyMm = roundTo(dR, 2);
    } else {
      // Plano-flat surface guard: when h -> 0, curvature radius R -> infinity
      spherometerRadiusMm = 1e6;
      spherometerUncertaintyMm = 0;
    }
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
    summary: {
      measuredValueMm: correctedReadingMm,
      sampleMeanMm: stats.mean,
      sampleStdDevMm: stats.stdDev,
      standardErrorMm: stats.stdError,
      relativeErrorPct: stats.relativeErrorPct,
      ...(spherometerRadiusMm !== undefined && {
        radiusOfCurvatureMm: spherometerRadiusMm,
        radiusUncertaintyMm: spherometerUncertaintyMm ?? 0,
      }),
    },
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
  return { tPrime: roundTo(tPrime, 4), consistent: tPrime < 2.0 };
}
