import { CODATA, degToRad, radToDeg, roundTo } from "./constants";

export type AtomicSubMode =
  | "photoelectric"
  | "compton"
  | "bohr_spectra"
  | "matter_waves"
  | "franck_hertz"
  | "decay_kinetics"
  | "nuclear_binding"
  | "radiation_attenuation";

export interface AtomicInput {
  subMode: AtomicSubMode;

  // Photoelectric effect
  photonWavelengthNm?: number; // lambda (nm)
  workFunctionEv?: number; // phi in eV (e.g. 2.28 for Na, 4.50 for W, 4.70 for Cu)
  lightIntensityW_M2?: number; // light intensity for saturation photocurrent

  // Compton scattering
  incidentPhotonEnergyKev?: number; // E in keV
  scatterAngleDeg?: number; // theta (degrees)

  // Bohr model & Atomic spectra
  atomicNumberZ?: number; // Z (1 for Hydrogen, 2 for He+, etc.)
  initialStateN1?: number; // n1 lower state (1=Lyman, 2=Balmer, 3=Paschen)
  finalStateN2?: number; // n2 upper state (n2 > n1)

  // Matter waves & Diffraction
  acceleratingVoltageV?: number; // V for electron gun
  particleType?: "electron" | "proton" | "neutron";
  crystalLatticeSpacingD_Nm?: number; // d for Davisson-Germer (e.g. 0.091 nm for Ni)
  diffractionOrder?: number;
  positionUncertaintyNm?: number; // Delta x

  // Franck-Hertz experiment
  vaporGas?: "mercury" | "neon";
  maxAnodeVoltageV?: number;

  // Radioactive decay kinetics
  halfLifeYears?: number; // T_1/2 in years (or seconds via halfLifeSeconds)
  halfLifeSeconds?: number;
  initialActivityBq?: number; // A0
  elapsedTimeYears?: number;
  elapsedTimeSeconds?: number;
  // Bateman sequential decay
  halfLifeParentS?: number;
  halfLifeDaughterS?: number;
  initialParentAtoms?: number;

  // Nuclear binding & mass defect
  massNumberA?: number; // A
  atomicNumberProtonsZ?: number; // Z
  measuredNuclideMassU?: number; // Experimental nuclide mass in u
  reactionType?: "fission_u235" | "fusion_dt" | "custom_weizsaecker";

  // Radiation attenuation & Geiger detection
  linearAttenuationCoeff_Cm1?: number; // mu in cm^-1 (e.g. 0.77 cm^-1 for Lead with 662 keV Cs-137)
  linearAttenuationCoeff_1_cm?: number;
  absorberThicknessCm?: number; // x in cm
  measuredCountRateCps?: number; // N_meas in counts/s
  counterDeadTimeMicroS?: number; // tau_dead in microseconds
}

export interface AtomicResult {
  subMode: AtomicSubMode;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
  series?: { label: string; points: { x: number; y: number }[] }[];
}

// Compton wavelength of electron: lambda_C = h / (m_e * c) = 2.42631023867e-12 m
const LAMBDA_COMPTON_M = CODATA.h / (CODATA.m_e * CODATA.c);

// Rydberg constant for infinite mass: R_inf = 1.0973731568508e7 m^-1
const RYDBERG_M = 1.0973731568508e7;

// Bohr radius: a0 = 5.29177210903e-11 m
const BOHR_RADIUS_M = 5.29177210903e-11;

// Rydberg energy in eV: 13.605693122994 eV
const RYDBERG_ENERGY_EV = 13.605693122994;

// Unified atomic mass unit: 1 u = 931.49410242 MeV / c^2
const U_TO_MEV = 931.49410242;

// Masses in u
const MASS_PROTON_U = 1.007276466621;
const MASS_NEUTRON_U = 1.00866491595;

export function simulateAtomic(input: AtomicInput): AtomicResult {
  switch (input.subMode) {
    case "photoelectric":
      return simulatePhotoelectric(input);
    case "compton":
      return simulateCompton(input);
    case "bohr_spectra":
      return simulateBohrSpectra(input);
    case "matter_waves":
      return simulateMatterWaves(input);
    case "franck_hertz":
      return simulateFranckHertz(input);
    case "decay_kinetics":
      return simulateDecayKinetics(input);
    case "nuclear_binding":
      return simulateNuclearBinding(input);
    case "radiation_attenuation":
      return simulateRadiationAttenuation(input);
    default:
      return simulatePhotoelectric(input);
  }
}

/**
 * 1. Photoelectric Effect
 */
function simulatePhotoelectric(input: AtomicInput): AtomicResult {
  const lambdaNm = Math.max(50, Math.min(1200, input.photonWavelengthNm ?? 350));
  const lambdaM = lambdaNm * 1e-9;
  const phiEv = Math.max(0.5, Math.min(8.0, input.workFunctionEv ?? 2.28)); // Na default 2.28 eV
  const phiJ = phiEv * CODATA.e;

  // Photon frequency and energy
  const freqHz = CODATA.c / lambdaM;
  const photonEnergyJ = CODATA.h * freqHz;
  const photonEnergyEv = photonEnergyJ / CODATA.e;

  // Threshold / Cut-off limits
  const thresholdFreqHz = phiJ / CODATA.h;
  const thresholdLambdaNm = (CODATA.c / thresholdFreqHz) * 1e9;

  // Max Kinetic Energy and Stopping Potential (with non-negative guard)
  const isEmission = photonEnergyEv >= phiEv;
  const maxKineticEnergyEv = isEmission ? photonEnergyEv - phiEv : 0;
  const stoppingPotentialV = isEmission ? maxKineticEnergyEv : 0;
  const maxVelocityMs = isEmission
    ? Math.sqrt((2 * (maxKineticEnergyEv * CODATA.e)) / CODATA.m_e)
    : 0;

  // Photocurrent estimate: I_sat proportional to light intensity
  const intensity = Math.max(1, input.lightIntensityW_M2 ?? 50);
  const photocurrentMicroA = isEmission ? roundTo(intensity * 0.42 * (lambdaNm / 400), 2) : 0;

  // Frequency vs Stopping Potential linear series (Planck constant slope h/e)
  const stopPoints: { x: number; y: number }[] = [];
  const minF = thresholdFreqHz * 0.8;
  const maxF = thresholdFreqHz * 2.5;
  const df = (maxF - minF) / 40;

  for (let s = 0; s <= 40; s++) {
    const f = minF + s * df;
    const vStop = f >= thresholdFreqHz ? (CODATA.h * f - phiJ) / CODATA.e : 0;
    stopPoints.push({
      x: roundTo(f / 1e14, 3), // 10^14 Hz
      y: roundTo(vStop, 3), // Volts
    });
  }

  return {
    subMode: "photoelectric",
    summary: {
      isEmission,
      photonEnergyEv: roundTo(photonEnergyEv, 3),
      workFunctionEv: roundTo(phiEv, 3),
      thresholdFreq_10_14_Hz: roundTo(thresholdFreqHz / 1e14, 3),
      thresholdWavelengthNm: roundTo(thresholdLambdaNm, 1),
      stoppingPotentialV: roundTo(stoppingPotentialV, 3),
      maxKineticEnergyEv: roundTo(maxKineticEnergyEv, 3),
      maxElectronVelocityKmS: roundTo(maxVelocityMs / 1000, 1),
      photocurrentMicroA,
      planckSlope_h_over_e_10_15: roundTo((CODATA.h / CODATA.e) * 1e15, 4), // ~4.1357e-15 V*s
    },
    details: {
      wavelengthNm: lambdaNm,
      frequencyHz: freqHz,
      thresholdWavelengthNm: thresholdLambdaNm,
    },
    series: [
      {
        label: "Ushlab qoluvchi potensial V_stop(f) (Plank nishabi h/e)",
        points: stopPoints,
      },
    ],
  };
}

/**
 * 2. Compton Scattering
 */
function simulateCompton(input: AtomicInput): AtomicResult {
  const eKev = Math.max(1, input.incidentPhotonEnergyKev ?? 100); // 100 keV X-ray default
  const thetaDeg = Math.min(180, Math.max(0, input.scatterAngleDeg ?? 90));
  const thetaRad = degToRad(thetaDeg);

  const eJ = eKev * 1000 * CODATA.e;
  const lambdaIncidentM = (CODATA.h * CODATA.c) / eJ;
  const lambdaIncidentPm = lambdaIncidentM * 1e12; // in picometers

  // Compton wavelength shift: Delta lambda = lambda_C * (1 - cos(theta))
  const deltaLambdaM = LAMBDA_COMPTON_M * (1 - Math.cos(thetaRad));
  const deltaLambdaPm = deltaLambdaM * 1e12;
  const lambdaScatteredPm = lambdaIncidentPm + deltaLambdaPm;

  // Scattered photon energy: E' = E / (1 + (E / (m_e c^2)) * (1 - cos(theta)))
  const m_e_c2_Kev = (CODATA.m_e * CODATA.c * CODATA.c) / (CODATA.e * 1000); // 510.9989 keV
  const alpha = eKev / m_e_c2_Kev;
  const scatteredEnergyKev = eKev / (1 + alpha * (1 - Math.cos(thetaRad)));

  // Recoil electron kinetic energy: K_e = E - E'
  const recoilElectronKeKev = eKev - scatteredEnergyKev;

  // Recoil electron scattering angle phi: cot(phi) = (1 + alpha) * tan(theta / 2)
  let electronAngleDeg = 0;
  if (thetaDeg === 0) {
    electronAngleDeg = 90;
  } else if (thetaDeg === 180) {
    electronAngleDeg = 0;
  } else {
    const cotPhi = (1 + alpha) * Math.tan(thetaRad / 2);
    electronAngleDeg = radToDeg(Math.atan(1 / cotPhi));
  }

  // Polar / Angular cross section profile: Delta lambda vs theta
  const angularPoints: { x: number; y: number }[] = [];
  for (let deg = 0; deg <= 180; deg += 5) {
    const rad = degToRad(deg);
    const dLam = LAMBDA_COMPTON_M * (1 - Math.cos(rad)) * 1e12;
    angularPoints.push({ x: deg, y: roundTo(dLam, 4) });
  }

  return {
    subMode: "compton",
    summary: {
      incidentEnergyKev: roundTo(eKev, 2),
      scatterAngleDeg: roundTo(thetaDeg, 1),
      comptonShiftPm: roundTo(deltaLambdaPm, 4),
      incidentWavelengthPm: roundTo(lambdaIncidentPm, 4),
      scatteredWavelengthPm: roundTo(lambdaScatteredPm, 4),
      scatteredEnergyKev: roundTo(scatteredEnergyKev, 3),
      recoilElectronKeKev: roundTo(recoilElectronKeKev, 3),
      recoilElectronAngleDeg: roundTo(electronAngleDeg, 2),
      electronRestMassKev: roundTo(m_e_c2_Kev, 2),
    },
    details: {
      comptonWavelengthPm: roundTo(LAMBDA_COMPTON_M * 1e12, 4),
      energyTransferredPct: roundTo((recoilElectronKeKev / eKev) * 100, 2),
    },
    series: [
      {
        label: "Kompton siljishi Delta lambda(theta) [pm]",
        points: angularPoints,
      },
    ],
  };
}

/**
 * 3. Bohr Model & Atomic Spectra
 */
function simulateBohrSpectra(input: AtomicInput): AtomicResult {
  const Z = Math.max(1, Math.min(10, input.atomicNumberZ ?? 1)); // Default Hydrogen (Z=1)
  const n1 = Math.max(1, Math.min(8, input.initialStateN1 ?? 2)); // Default Balmer series (n1=2)
  let n2 = Math.max(n1 + 1, Math.min(15, input.finalStateN2 ?? 3)); // Default H_alpha (3 -> 2)

  // Guard: strictly n2 > n1
  if (n2 <= n1) {
    n2 = n1 + 1;
  }

  // Energy levels: E_n = -13.60569 * Z^2 / n^2 eV
  const e1 = (-RYDBERG_ENERGY_EV * Z * Z) / (n1 * n1);
  const e2 = (-RYDBERG_ENERGY_EV * Z * Z) / (n2 * n2);
  const deltaE_Ev = Math.abs(e2 - e1);

  // Orbital radii: r_n = n^2 * a0 / Z
  const r1_Pm = ((n1 * n1 * BOHR_RADIUS_M) / Z) * 1e12;
  const r2_Pm = ((n2 * n2 * BOHR_RADIUS_M) / Z) * 1e12;

  // Orbital velocities: v_n = Z * e^2 / (2 * eps0 * n * h) = (Z / n) * alpha * c
  const fineStructureAlpha = 1 / 137.035999;
  const v1_KmS = ((Z / n1) * fineStructureAlpha * CODATA.c) / 1000;
  const v2_KmS = ((Z / n2) * fineStructureAlpha * CODATA.c) / 1000;

  // Wavelength from generalized Rydberg formula: 1/lambda = R_inf * Z^2 * (1/n1^2 - 1/n2^2)
  const invLambda = RYDBERG_M * Z * Z * (1 / (n1 * n1) - 1 / (n2 * n2));
  const wavelengthM = 1 / invLambda;
  const wavelengthNm = wavelengthM * 1e9;
  const freqHz = CODATA.c / wavelengthM;

  // Series identification
  let seriesNameUz = "Ixtiyoriy kvant o'tishi";
  if (n1 === 1) seriesNameUz = "Layman seriyasi (UV / Ultrabinafsha)";
  else if (n1 === 2) seriesNameUz = "Balmer seriyasi (Ko'rinuvchi soha)";
  else if (n1 === 3) seriesNameUz = "Pashen seriyasi (Infraqizil)";
  else if (n1 === 4) seriesNameUz = "Breket seriyasi (IR)";
  else if (n1 === 5) seriesNameUz = "Pfund seriyasi (Uzoq IR)";

  // Compute all transitions in this series from n2 = n1+1 to n1+6
  const transitionsInSeries: { transition: string; wavelengthNm: number; energyEv: number }[] = [];
  for (let upper = n1 + 1; upper <= n1 + 6; upper++) {
    const invL = RYDBERG_M * Z * Z * (1 / (n1 * n1) - 1 / (upper * upper));
    const lamNm = (1 / invL) * 1e9;
    const eEv = (CODATA.h * (CODATA.c / (lamNm * 1e-9))) / CODATA.e;
    transitionsInSeries.push({
      transition: `${upper} -> ${n1}`,
      wavelengthNm: roundTo(lamNm, 2),
      energyEv: roundTo(eEv, 3),
    });
  }

  return {
    subMode: "bohr_spectra",
    summary: {
      atomicNumberZ: Z,
      seriesName: seriesNameUz,
      lowerStateN1: n1,
      upperStateN2: n2,
      wavelengthNm: roundTo(wavelengthNm, 2),
      photonEnergyEv: roundTo(deltaE_Ev, 3),
      frequencyTHz: roundTo(freqHz / 1e12, 2),
      radiusLowerPm: roundTo(r1_Pm, 2),
      radiusUpperPm: roundTo(r2_Pm, 2),
      orbitalSpeedLowerKmS: roundTo(v1_KmS, 1),
      orbitalSpeedUpperKmS: roundTo(v2_KmS, 1),
    },
    details: {
      energyLevel1Ev: roundTo(e1, 3),
      energyLevel2Ev: roundTo(e2, 3),
      transitionsInSeries,
    },
  };
}

/**
 * 4. Matter Waves & Electron Diffraction (de Broglie)
 */
function simulateMatterWaves(input: AtomicInput): AtomicResult {
  const vAcc = Math.max(1, input.acceleratingVoltageV ?? 100); // 100 V default
  const particle = input.particleType ?? "electron";

  let massKg: number = CODATA.m_e;
  if (particle === "proton") massKg = CODATA.m_p;
  else if (particle === "neutron") massKg = 1.67492749804e-27;

  // Kinetic energy in Joules and eV
  const charge = particle === "neutron" ? 0 : CODATA.e;
  const kineticEnergyJ = particle === "neutron" ? 0.025 * CODATA.e : charge * vAcc;
  const kineticEnergyEv = kineticEnergyJ / CODATA.e;

  // Momentum: p = sqrt(2 * m * K)
  const momentum = Math.sqrt(2 * massKg * kineticEnergyJ);

  // de Broglie wavelength: lambda = h / p
  const deBroglieLambdaM = CODATA.h / momentum;
  const deBroglieLambdaPm = deBroglieLambdaM * 1e12;

  // Relativistic correction factor
  const restEnergyJ = massKg * CODATA.c * CODATA.c;
  const gamma = 1 + kineticEnergyJ / restEnergyJ;
  const speed = CODATA.c * Math.sqrt(1 - 1 / (gamma * gamma));

  // Davisson-Germer diffraction on crystal lattice d (e.g. 0.091 nm for Nickel):
  // 2 * d * sin(theta) = n * lambda -> sin(theta) = n * lambda / (2 * d)
  const dM = Math.max(1e-11, (input.crystalLatticeSpacingD_Nm ?? 0.091) * 1e-9);
  const order = Math.max(1, input.diffractionOrder ?? 1);
  const sinTheta = (order * deBroglieLambdaM) / (2 * dM);
  const canDiffract = sinTheta <= 1.0;
  const diffractionBraggAngleDeg = canDiffract ? radToDeg(Math.asin(sinTheta)) : 0;

  // Heisenberg uncertainty: Delta x * Delta p >= hbar / 2
  const deltaX_M = Math.max(1e-12, (input.positionUncertaintyNm ?? 0.1) * 1e-9);
  const hBar = CODATA.h / (2 * Math.PI);
  const minDeltaP = hBar / (2 * deltaX_M);
  const minDeltaVMs = minDeltaP / massKg;

  return {
    subMode: "matter_waves",
    summary: {
      particleType: particle,
      acceleratingVoltageV: roundTo(vAcc, 1),
      deBroglieWavelengthPm: roundTo(deBroglieLambdaPm, 2),
      particleSpeedKmS: roundTo(speed / 1000, 1),
      speedOfLightFractionPct: roundTo((speed / CODATA.c) * 100, 3),
      braggAngleDeg: roundTo(diffractionBraggAngleDeg, 2),
      canDiffract,
      heisenbergMinVelocityUncertaintyKmS: roundTo(minDeltaVMs / 1000, 3),
    },
    details: {
      momentumKgMs: momentum,
      kineticEnergyEv: kineticEnergyEv,
      latticeSpacingNm: dM * 1e9,
    },
  };
}

/**
 * 5. Franck-Hertz Experiment
 */
function simulateFranckHertz(input: AtomicInput): AtomicResult {
  const vapor = input.vaporGas ?? "mercury";
  const excitationPotentialV = vapor === "mercury" ? 4.9 : 18.9; // 4.9 V for Hg, 18.9 V for Ne
  const maxV = Math.max(15, Math.min(60, input.maxAnodeVoltageV ?? 30));

  // Generate Franck-Hertz current curve: anode current with periodic drops every excitationPotentialV
  const points: { x: number; y: number }[] = [];
  const steps = 120;
  const dv = maxV / steps;

  for (let s = 0; s <= steps; s++) {
    const v = s * dv;
    // Base space-charge Child-Langmuir current: I ~ V^(3/2)
    const baseCurrent = 0.15 * Math.pow(v, 1.3);

    // Periodic inelastic scattering attenuation
    const phase = (v / excitationPotentialV) % 1.0;
    // Sharp drop just after crossing integer multiples of excitation potential
    const dropFactor = 1 - 0.55 * Math.exp(-Math.pow((phase - 0.05) / 0.18, 2));

    const currentMicroA = Math.max(0, baseCurrent * dropFactor);
    points.push({ x: roundTo(v, 2), y: roundTo(currentMicroA, 3) });
  }

  const numPeaks = Math.floor(maxV / excitationPotentialV);

  return {
    subMode: "franck_hertz",
    summary: {
      vaporGas: vapor,
      excitationPotentialV: roundTo(excitationPotentialV, 2),
      excitationEnergyEv: roundTo(excitationPotentialV, 2),
      maxAnodeVoltageV: roundTo(maxV, 1),
      observedPeaksCount: numPeaks,
      meanPeakSeparationV: roundTo(excitationPotentialV, 2),
    },
    details: {
      gasNameUz: vapor === "mercury" ? "Simob bug'i (Hg)" : "Neon gazi (Ne)",
    },
    series: [
      {
        label: `Frank-Gers anod toki I_a(V_a) [uA] (${vapor.toUpperCase()})`,
        points,
      },
    ],
  };
}

/**
 * 6. Radioactive Decay Kinetics & Bateman Equations
 */
function simulateDecayKinetics(input: AtomicInput): AtomicResult {
  let tHalfS = 0;
  if (input.halfLifeSeconds !== undefined) {
    tHalfS = Math.max(0.001, input.halfLifeSeconds);
  } else {
    const tHalfYrs = Math.max(1e-9, input.halfLifeYears ?? 5730); // Carbon-14 default 5730 yr
    tHalfS = tHalfYrs * 365.25 * 86400;
  }

  let elapsedS = 0;
  if (input.elapsedTimeSeconds !== undefined) {
    elapsedS = Math.max(0, input.elapsedTimeSeconds);
  } else {
    const elapsedYrs = Math.max(0, input.elapsedTimeYears ?? 5730);
    elapsedS = elapsedYrs * 365.25 * 86400;
  }

  const lambda = Math.LN2 / tHalfS;
  const meanLifetimeS = 1 / lambda;
  const initialActivityBq = Math.max(1, input.initialActivityBq ?? 10000);

  // N(t) = N0 * exp(-lambda * t), A(t) = A0 * exp(-lambda * t)
  const remainingFraction = Math.exp(-lambda * elapsedS);
  const currentActivityBq = initialActivityBq * remainingFraction;
  const halfLivesElapsed = elapsedS / tHalfS;

  // Bateman two-stage sequential decay: A -> B -> C
  const tHalfParentS = Math.max(1, input.halfLifeParentS ?? 3600); // 1 hour
  const tHalfDaughterS = Math.max(1, input.halfLifeDaughterS ?? 7200); // 2 hours
  const lambda1 = Math.LN2 / tHalfParentS;
  const lambda2 = Math.LN2 / tHalfDaughterS;

  // Time series for 1-stage decay
  const steps = 60;
  const maxPlotTimeS = Math.max(elapsedS * 1.5, tHalfS * 4);
  const dt = maxPlotTimeS / steps;
  const decayPoints: { x: number; y: number }[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = s * dt;
    const act = initialActivityBq * Math.exp(-lambda * t);
    decayPoints.push({
      x: roundTo(t / (365.25 * 86400), 2), // in years
      y: roundTo(act, 1),
    });
  }

  // Bateman maximum daughter activity time
  const tMaxDaughterS =
    Math.abs(lambda2 - lambda1) > 1e-12
      ? Math.log(lambda2 / lambda1) / (lambda2 - lambda1)
      : tHalfParentS;

  return {
    subMode: "decay_kinetics",
    summary: {
      halfLifeYears: roundTo(tHalfS / (365.25 * 86400), 2),
      decayConstant_1_s: lambda,
      meanLifetimeYears: roundTo(meanLifetimeS / (365.25 * 86400), 2),
      initialActivityBq: roundTo(initialActivityBq, 1),
      currentActivityBq: roundTo(currentActivityBq, 2),
      remainingFractionPct: roundTo(remainingFraction * 100, 3),
      halfLivesElapsed: roundTo(halfLivesElapsed, 3),
      batemanMaxDaughterTimeS: roundTo(tMaxDaughterS, 1),
    },
    details: {
      elapsedYears: roundTo(elapsedS / (365.25 * 86400), 2),
      elapsedSeconds: elapsedS,
    },
    series: [
      {
        label: "Eksponensial radioaktiv yemirilish A(t) [Bq]",
        points: decayPoints,
      },
    ],
  };
}

/**
 * 7. Nuclear Mass Defect & Binding Energy
 */
function simulateNuclearBinding(input: AtomicInput): AtomicResult {
  const Z = Math.max(1, Math.min(100, input.atomicNumberProtonsZ ?? 26)); // Iron-56 default
  const A = Math.max(Z, Math.min(260, input.massNumberA ?? 56));
  const N = A - Z;

  // Weizsacker Semi-Empirical Mass Formula (SEMF):
  // Eb = av*A - as*A^(2/3) - ac*Z*(Z-1)/A^(1/3) - aa*(A-2Z)^2/A + delta
  const av = 15.8; // Volume
  const as = 18.3; // Surface
  const ac = 0.714; // Coulomb
  const aa = 23.2; // Asymmetry

  let delta = 0; // Pairing
  const isZeven = Z % 2 === 0;
  const isNeven = N % 2 === 0;
  if (isZeven && isNeven) {
    delta = 12.0 / Math.sqrt(A); // Even-Even (most stable)
  } else if (!isZeven && !isNeven) {
    delta = -12.0 / Math.sqrt(A); // Odd-Odd
  } else {
    delta = 0; // Odd-Even
  }

  const ebWeizsackerMev =
    av * A -
    as * Math.pow(A, 2 / 3) -
    (ac * Z * (Z - 1)) / Math.cbrt(A) -
    (aa * Math.pow(A - 2 * Z, 2)) / A +
    delta;

  // Mass defect: Delta m = Z * m_p + N * m_n - M_nuclide
  // If measured mass provided:
  let measuredMassU = input.measuredNuclideMassU;
  if (measuredMassU === undefined) {
    // Derive from SEMF: M = Z*m_p + N*m_n - Eb / 931.494
    measuredMassU = Z * MASS_PROTON_U + N * MASS_NEUTRON_U - ebWeizsackerMev / U_TO_MEV;
  }

  const constituentsMassU = Z * MASS_PROTON_U + N * MASS_NEUTRON_U;
  const massDefectU = Math.max(0, constituentsMassU - measuredMassU);
  const massDefectKg = massDefectU * 1.6605390666e-27;
  const totalBindingEnergyMev = massDefectU * U_TO_MEV;
  const bindingEnergyPerNucleonMev = totalBindingEnergyMev / A;

  // Fission / Fusion benchmarks:
  // U-235 fission: ~200 MeV
  // D-T fusion: 17.59 MeV
  const u235FissionQMev = 200.0;
  const dtFusionQMev = 17.59;

  return {
    subMode: "nuclear_binding",
    summary: {
      massNumberA: A,
      protonsZ: Z,
      neutronsN: N,
      massDefectU: roundTo(massDefectU, 6),
      massDefectKg: massDefectKg,
      totalBindingEnergyMev: roundTo(totalBindingEnergyMev, 3),
      bindingEnergyPerNucleonMev: roundTo(bindingEnergyPerNucleonMev, 4),
      weizsackerEstimateMev: roundTo(ebWeizsackerMev, 3),
      u235FissionBenchmarkMev: u235FissionQMev,
      dtFusionBenchmarkMev: dtFusionQMev,
    },
    details: {
      nuclideMassU: roundTo(measuredMassU, 6),
      constituentsMassU: roundTo(constituentsMassU, 6),
      pairingTermMev: roundTo(delta, 3),
    },
  };
}

/**
 * 8. Radiation Attenuation & Geiger-Müller Detection
 */
function simulateRadiationAttenuation(input: AtomicInput): AtomicResult {
  const mu = Math.max(0.01, input.linearAttenuationCoeff_1_cm ?? 0.77); // Lead at 662 keV ~0.77 cm^-1
  const x = Math.max(0, input.absorberThicknessCm ?? 2.0); // 2 cm

  // Half-Value Layer: HVL = ln(2) / mu
  const halfValueLayerCm = Math.LN2 / mu;

  // Beer-Lambert attenuation: I(x) = I0 * exp(-mu * x)
  const transmissionFraction = Math.exp(-mu * x);
  const absorptionFractionPct = (1 - transmissionFraction) * 100;

  // Geiger-Müller counter dead-time correction:
  // N_true = N_meas / (1 - N_meas * tau_dead)
  const tauDeadS = Math.max(1e-7, (input.counterDeadTimeMicroS ?? 120) * 1e-6); // 120 microseconds
  const nMeas = Math.max(0, input.measuredCountRateCps ?? 1500);

  // Saturation guard: N_meas * tau_dead < 1.0 (clamp at 0.95 to avoid negative or infinite true rate)
  const product = nMeas * tauDeadS;
  const isSaturated = product >= 0.95;
  const safeProduct = Math.min(0.95, product);
  const nTrue = nMeas / (1 - safeProduct);
  const deadTimeLossPct = ((nTrue - nMeas) / nTrue) * 100;

  // Attenuation curve points
  const points: { x: number; y: number }[] = [];
  const maxX = Math.max(x * 2, halfValueLayerCm * 5);
  const steps = 50;
  const dx = maxX / steps;

  for (let s = 0; s <= steps; s++) {
    const thick = s * dx;
    const trans = Math.exp(-mu * thick);
    points.push({ x: roundTo(thick, 2), y: roundTo(trans * 100, 2) });
  }

  return {
    subMode: "radiation_attenuation",
    summary: {
      linearAttenuationCoeffCm1: roundTo(mu, 3),
      halfValueLayerCm: roundTo(halfValueLayerCm, 3),
      absorberThicknessCm: roundTo(x, 2),
      transmissionPct: roundTo(transmissionFraction * 100, 2),
      absorbedPct: roundTo(absorptionFractionPct, 2),
      measuredCountRateCps: roundTo(nMeas, 1),
      correctedTrueCountRateCps: roundTo(nTrue, 1),
      deadTimeLossPct: roundTo(deadTimeLossPct, 2),
      isCounterSaturated: isSaturated,
    },
    details: {
      deadTimeMicroSeconds: tauDeadS * 1e6,
    },
    series: [
      {
        label: "Gamma nurlanishning zaiflashuv egri chizig'i I(x)/I_0 [%]",
        points,
      },
    ],
  };
}
