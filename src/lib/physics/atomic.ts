import { CODATA, degToRad, radToDeg, roundTo } from "./constants";

export type AtomicSubMode =
  | "photoelectric"
  | "compton"
  | "bohr_spectra"
  | "matter_waves"
  | "franck_hertz"
  | "decay_kinetics"
  | "nuclear_binding"
  | "radiation_attenuation"
  | "moseley_xray"
  | "stern_gerlach"
  | "general_bateman_decay"
  | "alpha_decay_geiger_nuttall";

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

  // Moseley X-ray characteristic lines
  anodeMaterialZ?: number;
  anodeVoltageKv?: number;
  targetElement?: "Cu" | "Mo" | "W" | "Fe" | "Ag" | string;

  // Stern-Gerlach spatial quantization
  bFieldGradientT_M?: number;
  magnetLengthM?: number;
  driftDistanceM?: number;
  ovenTempK?: number;
  atomMassAmu?: number;

  // General Bateman decay chain
  decayChainPreset?: "u238_series" | "radon_progeny" | "mo99_tc99m" | "custom";
  decaySimulationTimeS?: number;
  initialParentQuantity?: number;

  // Alpha decay & Geiger-Nuttall
  parentZ?: number;
  parentA?: number;
  alphaEnergyMev?: number;

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
    case "bohr_model" as any:
      return simulateBohrSpectra(input);
    case "matter_waves":
    case "de_broglie" as any:
      return simulateMatterWaves(input);
    case "franck_hertz":
      return simulateFranckHertz(input);
    case "decay_kinetics":
    case "radioactive_decay" as any:
      return simulateDecayKinetics(input);
    case "nuclear_binding":
      return simulateNuclearBinding(input);
    case "radiation_attenuation":
    case "attenuation" as any:
      return simulateRadiationAttenuation(input);
    case "moseley_xray":
      return simulateMoseleyXray(input);
    case "stern_gerlach":
      return simulateSternGerlach(input);
    case "general_bateman_decay":
      return simulateGeneralBatemanDecay(input);
    case "alpha_decay_geiger_nuttall":
      return simulateAlphaDecayGeigerNuttall(input);
    default:
      return simulatePhotoelectric(input);
  }
}

/**
 * 1. Photoelectric Effect
 */
function simulatePhotoelectric(input: AtomicInput): AtomicResult {
  const rawLambda = (input as any).wavelengthNm ?? input.photonWavelengthNm ?? 350;
  const lambdaNm = Math.max(10, Math.min(50000, rawLambda));
  const lambdaM = lambdaNm * 1e-9;
  const rawPhi = (input as any).workFunctionEv ?? input.workFunctionEv ?? 2.28;
  const phiEv = Math.max(0.1, Math.min(20.0, rawPhi)); // Na default 2.28 eV
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
      emissionObserved: isEmission,
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
  const thetaDeg = Math.min(180, Math.max(0, input.scatterAngleDeg ?? (input as any).scatteringAngleDeg ?? 90));
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
    subMode: input.subMode || "bohr_spectra",
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
    subMode: input.subMode || "matter_waves",
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
    subMode: input.subMode || "decay_kinetics",
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
  const Z = Math.max(1, Math.min(100, input.atomicNumberProtonsZ ?? (input as any).atomicNumberZ ?? 26)); // Iron-56 default
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
  const rawDeadTime = (input as any).deadTimeMicroS ?? input.counterDeadTimeMicroS ?? 120;
  const tauDeadS = Math.max(1e-7, rawDeadTime * 1e-6); // microseconds to seconds
  const nMeas = Math.max(0, (input as any).initialCountRateCps ?? input.measuredCountRateCps ?? 1500);

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
    subMode: input.subMode || "radiation_attenuation",
    summary: {
      linearAttenuationCoeffCm1: roundTo(mu, 3),
      halfValueLayerCm: roundTo(halfValueLayerCm, 3),
      absorberThicknessCm: roundTo(x, 2),
      transmissionPct: roundTo(transmissionFraction * 100, 2),
      absorbedPct: roundTo(absorptionFractionPct, 2),
      measuredCountRateCps: roundTo(nMeas, 1),
      correctedTrueCountRateCps: roundTo(nTrue, 1),
      trueCountRateCps: roundTo(nTrue, 1),
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

/**
 * 9. Moseley's Law & Characteristic X-ray Spectrometry
 */
export const XRAY_TARGETS: Record<string, { Z: number; nameUz: string; KalphaKev: number; KbetaKev: number }> = {
  Cu: { Z: 29, nameUz: "Mis (Cu, Z=29)", KalphaKev: 8.048, KbetaKev: 8.905 },
  Mo: { Z: 42, nameUz: "Molibden (Mo, Z=42)", KalphaKev: 17.479, KbetaKev: 19.608 },
  W: { Z: 74, nameUz: "Volfram (W, Z=74)", KalphaKev: 59.318, KbetaKev: 67.244 },
  Fe: { Z: 26, nameUz: "Temir (Fe, Z=26)", KalphaKev: 6.404, KbetaKev: 7.058 },
  Ag: { Z: 47, nameUz: "Kumush (Ag, Z=47)", KalphaKev: 22.163, KbetaKev: 24.942 },
};

function simulateMoseleyXray(input: AtomicInput): AtomicResult {
  const targetKey = input.targetElement ?? "Cu";
  const target = XRAY_TARGETS[targetKey] ?? XRAY_TARGETS.Cu;
  const Z = input.anodeMaterialZ ?? target.Z;
  const vKv = Math.max(5.0, Math.min(150.0, input.anodeVoltageKv ?? 30.0));
  const vVolts = vKv * 1000;

  // Duane-Hunt law: lambda_min = hc / (e * V)
  const lambdaMinM = (CODATA.h * CODATA.c) / (CODATA.e * vVolts);
  const lambdaMinNm = lambdaMinM * 1e9;
  const maxPhotonEnergyKev = vKv;

  // Moseley's Law: nu = R_inf * c * (Z - sigma)^2 * (1/n1^2 - 1/n2^2)
  // For K_alpha (n=2 -> n=1), sigma_K = 1.0: nu_Kalpha = (3/4) * R_inf * c * (Z - 1)^2
  const sigmaK = 1.0;
  const nuKalpha = (3 / 4) * RYDBERG_M * CODATA.c * Math.pow(Z - sigmaK, 2);
  const lambdaKalphaNm = (CODATA.c / nuKalpha) * 1e9;
  const energyKalphaEv = (CODATA.h * nuKalpha) / CODATA.e;
  const energyKalphaKev = energyKalphaEv / 1000;

  // K_beta (n=3 -> n=1): nu_Kbeta = (8/9) * R_inf * c * (Z - 1)^2
  const nuKbeta = (8 / 9) * RYDBERG_M * CODATA.c * Math.pow(Z - sigmaK, 2);
  const lambdaKbetaNm = (CODATA.c / nuKbeta) * 1e9;
  const energyKbetaKev = ((CODATA.h * nuKbeta) / CODATA.e) / 1000;

  // L_alpha (n=3 -> n=2), sigma_L = 7.4: nu_Lalpha = (5/36) * R_inf * c * (Z - 7.4)^2
  const sigmaL = 7.4;
  const nuLalpha = (5 / 36) * RYDBERG_M * CODATA.c * Math.pow(Math.max(1, Z - sigmaL), 2);
  const lambdaLalphaNm = (CODATA.c / nuLalpha) * 1e9;
  const energyLalphaKev = ((CODATA.h * nuLalpha) / CODATA.e) / 1000;

  // Characteristic line excitation threshold: V_tube must exceed excitation potential
  const isKExcited = maxPhotonEnergyKev >= energyKalphaKev;

  // Continuous bremsstrahlung spectrum + characteristic peaks
  const spectrumPoints: { x: number; y: number }[] = [];
  const maxWavelengthNm = Math.max(lambdaMinNm * 6, lambdaKalphaNm * 1.5);
  const steps = 80;
  const dLam = (maxWavelengthNm - lambdaMinNm) / steps;

  for (let i = 0; i <= steps; i++) {
    const lam = lambdaMinNm + i * dLam;
    // Kramers continuous bremsstrahlung intensity: I(lambda) ~ (lambda/lambda_min - 1) / lambda^2
    const ratio = lam / lambdaMinNm;
    let intensity = ratio > 1 ? (ratio - 1) / (lam * lam) : 0;

    // Superimpose sharp Gaussian peaks if excited
    if (isKExcited) {
      const peakKalpha = 15.0 * Math.exp(-Math.pow((lam - lambdaKalphaNm) / 0.005, 2));
      const peakKbeta = 5.0 * Math.exp(-Math.pow((lam - lambdaKbetaNm) / 0.005, 2));
      intensity += peakKalpha + peakKbeta;
    }

    spectrumPoints.push({ x: roundTo(lam, 4), y: roundTo(intensity, 2) });
  }

  // Moseley linear graph: sqrt(nu) vs Z across nearby elements
  const moseleyPoints: { x: number; y: number }[] = [];
  for (let zVal = 20; zVal <= 80; zVal += 5) {
    const nuVal = (3 / 4) * RYDBERG_M * CODATA.c * Math.pow(zVal - sigmaK, 2);
    moseleyPoints.push({ x: zVal, y: roundTo(Math.sqrt(nuVal) / 1e8, 3) });
  }

  return {
    subMode: "moseley_xray",
    summary: {
      targetElement: target.nameUz,
      atomicNumberZ: Z,
      tubeVoltageKv: vKv,
      duaneHuntCutoffNm: roundTo(lambdaMinNm, 5),
      kAlphaWavelengthNm: roundTo(lambdaKalphaNm, 5),
      kAlphaEnergyKev: roundTo(energyKalphaKev, 3),
      kBetaWavelengthNm: roundTo(lambdaKbetaNm, 5),
      kBetaEnergyKev: roundTo(energyKbetaKev, 3),
      lAlphaEnergyKev: roundTo(energyLalphaKev, 3),
      isKSeriesExcited: isKExcited,
      moseleySlopeFactor: roundTo(Math.sqrt((3 / 4) * RYDBERG_M * CODATA.c), 2),
    },
    details: {
      screeningConstantSigmaK: sigmaK,
      screeningConstantSigmaL: sigmaL,
      maxContinuousPhotonEnergyKev: maxPhotonEnergyKev,
    },
    series: [
      { label: `Rentgen nurlanish spektri I(λ) [${target.nameUz}, ${vKv} kV]`, points: spectrumPoints },
      { label: "Mozli qonuni: √ν vs Z (×10⁸ s⁻¹/²)", points: moseleyPoints },
    ],
  };
}

/**
 * 10. Stern-Gerlach Quantum Spatial Quantization
 */
function simulateSternGerlach(input: AtomicInput): AtomicResult {
  const bGrad = Math.max(0.1, Math.min(100.0, input.bFieldGradientT_M ?? 12.0)); // T/m
  const L1 = Math.max(0.01, Math.min(0.5, input.magnetLengthM ?? 0.05)); // 5 cm
  const L2 = Math.max(0.01, Math.min(1.0, input.driftDistanceM ?? 0.20)); // 20 cm
  const T = Math.max(100, Math.min(1500, input.ovenTempK ?? 400)); // 400 K for Silver oven
  const amuMass = Math.max(1.0, input.atomMassAmu ?? 107.868); // Silver 107.87 u
  const massKg = amuMass * 1.6605390666e-27;

  // Mean thermal atom velocity from Maxwell-Boltzmann oven beam
  const vThermal = Math.sqrt((3 * CODATA.k_B * T) / massKg);

  // Bohr magneton: mu_B = e * hbar / (2 * m_e) = 9.2740100783e-24 J/T
  const muB = (CODATA.e * (CODATA.h / (2 * Math.PI))) / (2 * CODATA.m_e);
  // Electron spin g-factor: g_s approx 2.0023193
  const gs = 2.0023193;
  // Effective magnetic moment along z: mu_z = +/- (1/2) * g_s * mu_B
  const muZ = 0.5 * gs * muB;

  // Force in magnetic field gradient: F_z = mu_z * (dB_z / dz)
  const forceZ = muZ * bGrad;
  const accelZ = forceZ / massKg;

  // Time in magnet and drift region
  const t1 = L1 / vThermal;
  const t2 = L2 / vThermal;

  // Deflection at exit of magnet: z1 = 0.5 * a * t1^2
  const z1 = 0.5 * accelZ * t1 * t1;
  // Transverse velocity at exit: v_z = a * t1
  const vZ = accelZ * t1;
  // Deflection during drift: z2 = v_z * t2
  const z2 = vZ * t2;

  // Total deflection for spin-up / spin-down component
  const zTotalM = z1 + z2;
  const zTotalMm = zTotalM * 1000;
  const totalBeamSeparationMm = 2 * zTotalMm;

  // Quantum vs Classical beam profiles at detector
  const quantumPoints: { x: number; y: number }[] = [];
  const classicalPoints: { x: number; y: number }[] = [];
  const rangeMm = Math.max(3.0, zTotalMm * 2.5);
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const zPos = -rangeMm + (2 * rangeMm * i) / steps;
    // Quantum: two sharp peaks at +/- zTotalMm
    const peakUp = Math.exp(-Math.pow((zPos - zTotalMm) / (zTotalMm * 0.15), 2));
    const peakDown = Math.exp(-Math.pow((zPos + zTotalMm) / (zTotalMm * 0.15), 2));
    const qIntensity = peakUp + peakDown;

    // Classical: continuous smear between -zTotalMm and +zTotalMm
    const cIntensity = Math.abs(zPos) <= zTotalMm ? 1.0 / (Math.PI * Math.sqrt(Math.max(0.001, Math.pow(zTotalMm, 2) - Math.pow(zPos, 2)))) : 0;

    quantumPoints.push({ x: roundTo(zPos, 3), y: roundTo(qIntensity, 3) });
    classicalPoints.push({ x: roundTo(zPos, 3), y: roundTo(Math.min(3.0, cIntensity * zTotalMm), 3) });
  }

  return {
    subMode: "stern_gerlach",
    summary: {
      atomThermalVelocityMs: roundTo(vThermal, 1),
      beamSeparationMm: roundTo(totalBeamSeparationMm, 3),
      spinUpDeflectionMm: roundTo(zTotalMm, 3),
      spinDownDeflectionMm: roundTo(-zTotalMm, 3),
      magneticFieldGradientT_M: bGrad,
      magneticForceN: roundTo(forceZ * 1e23, 3) + "e-23 N",
      atomMassAmu: amuMass,
      ovenTemperatureK: T,
      spatialQuantizationDemonstrated: true,
    },
    details: {
      magnetLengthCm: L1 * 100,
      driftDistanceCm: L2 * 100,
      magnetTransitTimeMicroS: roundTo(t1 * 1e6, 2),
      driftTransitTimeMicroS: roundTo(t2 * 1e6, 2),
      bohrMagnetonJ_T: muB,
    },
    series: [
      { label: "Kvant fazoviy ajralish (Ikki cho'qqi)", points: quantumPoints },
      { label: "Klassik uzluksiz tarqalish gipotezasi", points: classicalPoints },
    ],
  };
}

/**
 * 11. Generalized Bateman Equations for Multi-Stage Decay Chains
 */
export const BATEMAN_PRESETS: Record<string, { title: string; nuclides: { name: string; halfLifeS: number }[] }> = {
  radon_progeny: {
    title: "Radon va uning qisqa umrli mahsulotlari (Rn-222 -> Po-218 -> Pb-214 -> Bi-214)",
    nuclides: [
      { name: "²²²Rn", halfLifeS: 3.8235 * 86400 }, // 3.82 days
      { name: "²¹⁸Po", halfLifeS: 183.0 }, // 3.05 min
      { name: "²¹⁴Pb", halfLifeS: 1608.0 }, // 26.8 min
      { name: "²¹⁴Bi", halfLifeS: 1194.0 }, // 19.9 min
    ],
  },
  mo99_tc99m: {
    title: "Tibbiy radioizotop generatori: Mo-99 -> Tc-99m -> Tc-99",
    nuclides: [
      { name: "⁹⁹Mo", halfLifeS: 65.94 * 3600 }, // 65.94 hours
      { name: "⁹⁹ᵐTc", halfLifeS: 6.007 * 3600 }, // 6.01 hours
      { name: "⁹⁹Tc", halfLifeS: 2.111e5 * 365.25 * 86400 }, // 211,100 years
    ],
  },
  u238_series: {
    title: "Uran-238 zanjirining dastlabki bo'g'inlari: U-238 -> Th-234 -> Pa-234m -> U-234",
    nuclides: [
      { name: "²³⁸U", halfLifeS: 4.468e9 * 365.25 * 86400 }, // 4.468e9 years
      { name: "²³⁴Th", halfLifeS: 24.1 * 86400 }, // 24.1 days
      { name: "²³⁴ᵐPa", halfLifeS: 70.2 }, // 1.17 min
      { name: "²³⁴U", halfLifeS: 2.455e5 * 365.25 * 86400 }, // 2.455e5 years
    ],
  },
};

function simulateGeneralBatemanDecay(input: AtomicInput): AtomicResult {
  const presetKey = input.decayChainPreset ?? "mo99_tc99m";
  const preset = BATEMAN_PRESETS[presetKey] ?? BATEMAN_PRESETS.mo99_tc99m;
  const nuclides = preset.nuclides;
  const n = nuclides.length;

  const N0 = Math.max(1e6, input.initialParentQuantity ?? 1e12); // Initial parent nuclei
  const lambdas = nuclides.map(nc => Math.LN2 / nc.halfLifeS);

  // Time span: scale to ~ 4 * half-life of 2nd or slowest relevant nuclide
  const scaleT = Math.min(nuclides[0].halfLifeS * 4, (nuclides[1]?.halfLifeS ?? 3600) * 8);
  const tTotal = Math.max(60, input.decaySimulationTimeS ?? scaleT);

  // Time of maximum daughter activity (for 2-stage Bateman): t_max = ln(lambda2/lambda1) / (lambda2 - lambda1)
  const l1 = lambdas[0];
  const l2 = lambdas[1];
  let tMaxDaughterS = 0;
  if (l2 && Math.abs(l1 - l2) > 1e-18) {
    tMaxDaughterS = Math.log(l2 / l1) / (l2 - l1);
  }

  // Equilibrium characterization
  let equilibriumType = "Muvozanatsiz";
  if (l1 < l2 * 1e-4) {
    equilibriumType = "Asriy muvozanat (Secular Equilibrium: T1 >> T2)";
  } else if (l1 < l2) {
    equilibriumType = "O'tkinchi muvozanat (Transient Equilibrium: T1 > T2)";
  } else {
    equilibriumType = "Muvozanat mavjud emas (T1 < T2)";
  }

  // Exact Bateman multi-stage solver
  // N_i(t) = N0 * sum_{j=1}^i [ prod_{k=1}^{i-1} lambda_k * exp(-lambda_j * t) / prod_{p=1, p!=j}^i (lambda_p - lambda_j) ]
  const steps = 60;
  const series: { label: string; points: { x: number; y: number }[] }[] = nuclides.map(nc => ({
    label: `${nc.name} faolligi A(t) [Bq]`,
    points: [],
  }));

  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * tTotal;
    const tHours = t / 3600;

    for (let i = 0; i < n; i++) {
      let Ni = 0;
      if (i === 0) {
        Ni = N0 * Math.exp(-lambdas[0] * t);
      } else {
        // Multi-stage Bateman sum
        let sum = 0;
        for (let j = 0; j <= i; j++) {
          let denom = 1;
          for (let p = 0; p <= i; p++) {
            if (p !== j) {
              denom *= (lambdas[p] - lambdas[j]);
            }
          }
          if (denom !== 0) {
            sum += Math.exp(-lambdas[j] * t) / denom;
          }
        }
        let prodL = 1;
        for (let k = 0; k < i; k++) {
          prodL *= lambdas[k];
        }
        Ni = N0 * prodL * sum;
      }
      const activityBq = Math.max(0, lambdas[i] * Ni);
      series[i].points.push({ x: roundTo(tHours, 2), y: roundTo(activityBq, 2) });
    }
  }

  return {
    subMode: "general_bateman_decay",
    summary: {
      chainTitle: preset.title,
      parentNuclide: nuclides[0].name,
      daughterNuclide: nuclides[1]?.name ?? "N/A",
      equilibriumType,
      daughterPeakActivityTimeHours: roundTo(tMaxDaughterS / 3600, 2),
      daughterPeakActivityTimeS: roundTo(tMaxDaughterS, 1),
      initialParentActivityBq: roundTo(lambdas[0] * N0, 2),
      parentHalfLifeHours: roundTo(nuclides[0].halfLifeS / 3600, 2),
      daughterHalfLifeHours: roundTo((nuclides[1]?.halfLifeS ?? 0) / 3600, 2),
      nuclideCountInChain: n,
    },
    details: {
      nuclides: nuclides.map(nc => ({ name: nc.name, halfLifeS: nc.halfLifeS, lambda_s1: Math.LN2 / nc.halfLifeS })),
      simulationSpanHours: roundTo(tTotal / 3600, 2),
      initialAtoms: N0,
    },
    series,
  };
}

/**
 * 12. Alpha Decay & Gamow Tunneling / Geiger-Nuttall Law
 */
export const ALPHA_EMITTERS: Record<string, { name: string; Z: number; A: number; EalphaMev: number; halfLifeS: number }> = {
  U238: { name: "Uran-238 (²³⁸U)", Z: 92, A: 238, EalphaMev: 4.198, halfLifeS: 1.41e17 },
  U235: { name: "Uran-235 (²³⁵U)", Z: 92, A: 235, EalphaMev: 4.678, halfLifeS: 2.22e16 },
  Ra226: { name: "Radiy-226 (²²⁶Ra)", Z: 88, A: 226, EalphaMev: 4.784, halfLifeS: 5.05e10 },
  Rn222: { name: "Radon-222 (²²²Rn)", Z: 86, A: 222, EalphaMev: 5.489, halfLifeS: 3.30e5 },
  Po218: { name: "Poloniy-218 (²¹⁸Po)", Z: 84, A: 218, EalphaMev: 6.002, halfLifeS: 183.0 },
  Po214: { name: "Poloniy-214 (²¹⁴Po)", Z: 84, A: 214, EalphaMev: 7.687, halfLifeS: 1.64e-4 },
  Po212: { name: "Poloniy-212 (²¹²Po)", Z: 84, A: 212, EalphaMev: 8.784, halfLifeS: 2.99e-7 },
};

function simulateAlphaDecayGeigerNuttall(input: AtomicInput): AtomicResult {
  const Z = Math.max(80, Math.min(100, input.parentZ ?? 92)); // e.g. Uranium
  const A = Math.max(200, Math.min(250, input.parentA ?? 238));
  const EalphaMev = Math.max(3.5, Math.min(10.0, input.alphaEnergyMev ?? 4.2));

  // Nuclear radius: R = r0 * A^(1/3)
  const r0 = 1.25e-15; // 1.25 fm
  const R = r0 * Math.cbrt(A); // m

  // Daughter nucleus: Z_d = Z - 2
  const Zd = Z - 2;
  const mAlphaKg = 6.64465723e-27; // kg (4.0015 u)
  const eCharge = CODATA.e;
  const eps0 = 8.8541878128e-12;

  // Coulomb barrier height at nuclear surface: V_C = 2 * Zd * e^2 / (4 * pi * eps0 * R)
  const VC_Joules = (2 * Zd * Math.pow(eCharge, 2)) / (4 * Math.PI * eps0 * R);
  const VC_Mev = VC_Joules / (1e6 * eCharge);

  // Kinetic energy of alpha particle in Joules
  const EalphaJ = EalphaMev * 1e6 * eCharge;
  const vAlpha = Math.sqrt((2 * EalphaJ) / mAlphaKg);

  // Outer classical turning point: b0 = 2 * Zd * e^2 / (4 * pi * eps0 * E_alpha)
  const b0 = (2 * Zd * Math.pow(eCharge, 2)) / (4 * Math.PI * eps0 * EalphaJ);
  const x0 = Math.min(0.999, R / b0);

  // Gamow factor G via WKB approximation:
  // G = (2*Zd*e^2 / (4*pi*eps0*hbar*v_alpha)) * [ arccos(sqrt(x0)) - sqrt(x0*(1-x0)) ]
  const hbar = CODATA.h / (2 * Math.PI);
  const prefactor = (2 * Zd * Math.pow(eCharge, 2)) / (4 * Math.PI * eps0 * hbar * vAlpha);
  const bracket = Math.acos(Math.sqrt(x0)) - Math.sqrt(x0 * (1 - x0));
  const gamowFactorG = prefactor * bracket;

  // Barrier penetration probability P = exp(-2 * G)
  const log10P = -2 * gamowFactorG * Math.LOG10E;
  const P = Math.exp(-2 * Math.min(300, gamowFactorG));

  // Assault frequency inside nuclear potential well: nu_0 = v_inside / (2 * R) ~ 1e21 s^-1
  const nuAssault = 1.0e21; // s^-1
  const decayConstantLambda = nuAssault * P;
  const log10HalfLifeS = Math.log10(Math.LN2 / nuAssault) - log10P;
  const halfLifeS = Math.pow(10, Math.min(25, Math.max(-10, log10HalfLifeS)));

  // Geiger-Nuttall empirical line: log10(T1/2) vs 1/sqrt(E) across known alpha emitters
  const gnPoints: { x: number; y: number }[] = [];
  const modelCurvePoints: { x: number; y: number }[] = [];

  Object.values(ALPHA_EMITTERS).forEach(emitter => {
    const invSqrtE = 1 / Math.sqrt(emitter.EalphaMev);
    gnPoints.push({ x: roundTo(invSqrtE, 4), y: roundTo(Math.log10(emitter.halfLifeS), 2) });
  });

  for (let eVal = 4.0; eVal <= 9.0; eVal += 0.5) {
    const invE = 1 / Math.sqrt(eVal);
    // Geiger-Nuttall empirical linear fit: log10(T1/2) ~ 1.61 * Zd / sqrt(E) - 28.9
    const logT = 1.61 * (Zd / Math.sqrt(eVal)) - 48.0;
    modelCurvePoints.push({ x: roundTo(invE, 4), y: roundTo(logT, 2) });
  }

  return {
    subMode: "alpha_decay_geiger_nuttall",
    summary: {
      parentNuclide: `Z=${Z}, A=${A}`,
      alphaEnergyMev: roundTo(EalphaMev, 3),
      coulombBarrierHeightMev: roundTo(VC_Mev, 2),
      gamowFactorG: roundTo(gamowFactorG, 2),
      barrierTunnelingProbability: `10^(${roundTo(log10P, 1)})`,
      calculatedHalfLifeLog10S: roundTo(log10HalfLifeS, 2),
      calculatedHalfLifeS: halfLifeS > 1e10 ? halfLifeS.toExponential(2) : roundTo(halfLifeS, 3),
      nuclearRadiusFm: roundTo(R * 1e15, 2),
      outerTurningPointFm: roundTo(b0 * 1e15, 1),
      alphaVelocityMs: roundTo(vAlpha, 1),
    },
    details: {
      parentAtomicNumberZ: Z,
      daughterAtomicNumberZd: Zd,
      assaultFrequencyHz: nuAssault,
      wkbPrefactor: roundTo(prefactor, 2),
    },
    series: [
      { label: "Geyger-Nettoll qonuni (Tajriba ma'lumotlari: log₁₀(T₁/₂) vs 1/√E)", points: gnPoints },
      { label: "Gamov kvant tunnel modeli nazariyasi", points: modelCurvePoints },
    ],
  };
}

