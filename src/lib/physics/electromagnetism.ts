import { CODATA, degToRad, radToDeg, roundTo } from "./constants";

export type EmSubMode =
  | "wheatstone_meter_bridge"
  | "potentiometer"
  | "rlc_oscilloscope"
  | "rc_rl_transient"
  | "em_fields_faraday"
  | "hall_effect"
  | "thomson_em"
  | "transformer"
  | "ac_bridges"
  | "magnetic_hysteresis_loop"
  | "cyclotron_lorentz_3d"
  | "helmholtz_coils";

export interface PointCharge {
  qMicroC: number;
  x: number;
  y: number;
}

export interface EmInput {
  subMode: EmSubMode;
  // Wheatstone & Meter bridge
  bridgeType?: "wheatstone" | "meter_bridge";
  supplyV?: number;
  rKnownOhm?: number;
  rUnknownOhm?: number;
  rP?: number;
  rQ?: number;
  jockeyCm?: number; // 0..100 for meter bridge
  galvResistanceOhm?: number;

  // Potentiometer
  driverEmfV?: number;
  testEmfV?: number;
  internalResOhm?: number;
  shuntResOhm?: number;
  shuntClosed?: boolean;
  sliderCm?: number; // 0..100

  // AC RLC & KRO Oscilloscope
  vPeakV?: number;
  freqHz?: number;
  resistanceOhm?: number;
  inductanceMh?: number;
  capacitanceUf?: number;

  // RC / RL transient
  transientType?: "rc_charge" | "rc_discharge" | "rl_rise";

  // Fields & Faraday
  charges?: PointCharge[];
  coilTurns?: number;
  coilRadiusM?: number;
  magnetMomentAm2?: number;
  magnetVelocityMs?: number;
  solenoidCurrentA?: number;
  solenoidTurnsPerM?: number;

  // Hall effect
  hallCurrentA?: number;
  magneticFieldT?: number;
  carrierDensityM3?: number;
  slabThicknessM?: number;

  // Thomson e/m
  accelVoltageV?: number;
  trajectoryRadiusM?: number;

  // Transformer
  primaryVoltageV?: number;
  primaryTurns?: number;
  secondaryTurns?: number;
  loadResistanceOhm?: number;

  // AC Bridges (Maxwell, Schering, Wien)
  acBridgeType?: "maxwell_wien" | "schering" | "wien_frequency";
  r1Ohm?: number;
  r2Ohm?: number;
  r3Ohm?: number;
  r4Ohm?: number;
  c1Uf?: number;
  c2Uf?: number;
  c3Uf?: number;
  c4Uf?: number;
  bridgeFreqHz?: number;

  // Ferromagnetic Hysteresis Loop
  coercivityHc_A_M?: number; // Hc (A/m)
  remanenceBr_T?: number; // Br (Tesla)
  saturationBs_T?: number; // Bs (Tesla)
  driveFieldHmax_A_M?: number; // Hmax (A/m)
  coreVolumeCm3?: number;

  // 3D Cyclotron & Lorentz force
  particleChargeC?: number; // q (C)
  particleMassKg?: number; // m (kg)
  electricFieldV_M?: number; // E (V/m)
  magneticFieldBz_T?: number; // B (Tesla)
  initialSpeedMs?: number; // v0 (m/s)
  massSpectrometerIsotope?: "Ne20" | "Ne22" | "U235" | "U238" | "custom";

  // Helmholtz Coils
  helmholtzTurns?: number;
  helmholtzRadiusM?: number;
  helmholtzCurrentA?: number;
  coilSeparationM?: number;
}

export interface EmResult {
  subMode: EmSubMode;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
  series?: { label: string; points: { x: number; y: number }[] }[];
  curves?: { label: string; points: { x: number; y: number }[] }[];
}

/**
 * Exact Gaussian elimination with partial pivoting for Ax = b.
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > maxVal) {
        maxVal = Math.abs(M[r][col]);
        pivotRow = r;
      }
    }
    if (pivotRow !== col) {
      [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
    }
    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-14) continue;

    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / pivot;
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) {
      s -= M[r][c] * x[c];
    }
    const diag = M[r][r];
    x[r] = Math.abs(diag) > 1e-14 ? s / diag : 0;
  }
  return x;
}

export function simulateElectromagnetism(input: EmInput): EmResult {
  // =========================================================================
  // 1. WHEATSTONE & METER BRIDGE
  // =========================================================================
  if (input.subMode === "wheatstone_meter_bridge") {
    const isMeter = input.bridgeType === "meter_bridge";
    const Vs = Math.max(0.1, input.supplyV ?? 5.0);
    const Rg = Math.max(1, input.galvResistanceOhm ?? 50);

    let R1 = 100;
    let R2 = 100;
    let R3 = 100;
    let R4 = 100;

    if (isMeter) {
      const L1 = Math.min(99.9, Math.max(0.1, input.jockeyCm ?? 40));
      const L2 = 100 - L1;
      const wireResPerCm = 0.05; // 5 ohm / 1 m wire
      R1 = L1 * wireResPerCm;
      R2 = L2 * wireResPerCm;
      R3 = Math.max(0.1, input.rKnownOhm ?? 10);
      R4 = Math.max(0.1, input.rUnknownOhm ?? 15);
    } else {
      R1 = Math.max(0.1, input.rP ?? 100);
      R2 = Math.max(0.1, input.rQ ?? 100);
      R3 = Math.max(0.1, input.rKnownOhm ?? 150);
      R4 = Math.max(0.1, input.rUnknownOhm ?? 150);
    }

    // Mesh analysis for galvanometer current:
    // Loop 1 (top): (R1 + R2 + Rg)*i1 - Rg*i2 - R2*i3 = 0
    // Loop 2 (bottom): -Rg*i1 + (R3 + R4 + Rg)*i2 - R4*i3 = 0
    // Loop 3 (outer with Vs): -R2*i1 - R4*i2 + (R2 + R4)*i3 = Vs
    const A = [
      [R1 + R2 + Rg, -Rg, -R2],
      [-Rg, R3 + R4 + Rg, -R4],
      [-R2, -R4, R2 + R4],
    ];
    const b = [0, 0, Vs];
    const [i1, i2] = solveLinearSystem(A, b);
    const iGalv = i1 - i2;
    const vGalv = iGalv * Rg;

    const rUnknownCalc = isMeter
      ? R3 * ((100 - (input.jockeyCm ?? 40)) / Math.max(0.1, input.jockeyCm ?? 40))
      : (R2 * R3) / R1;

    const balanced = Math.abs(iGalv) < 1e-6;
    const nodeBVoltageV = R1 + R2 > 0 ? (Vs * R2) / (R1 + R2) : Vs / 2;
    const nodeCVoltageV = R3 + R4 > 0 ? (Vs * R4) / (R3 + R4) : Vs / 2;
    const galvanometerCurrentMa = iGalv * 1000;

    return {
      subMode: "wheatstone_meter_bridge",
      summary: {
        bridgeType: input.bridgeType ?? "wheatstone",
        galvanometerCurrentMicroA: roundTo(iGalv * 1e6, 3),
        galvanometerCurrentMa: roundTo(galvanometerCurrentMa, 5),
        galvanometerVoltageMv: roundTo(vGalv * 1000, 3),
        nodeBVoltageV: roundTo(nodeBVoltageV, 4),
        nodeCVoltageV: roundTo(nodeCVoltageV, 4),
        rUnknownCalculatedOhm: roundTo(rUnknownCalc, 3),
        balanced,
        balanceRatio: roundTo((R1 * R4) / (R2 * R3), 5),
      },
      details: { R1, R2, R3, R4, iGalvA: iGalv, nodeBVoltageV, nodeCVoltageV },
    };
  }

  // =========================================================================
  // 2. POTENTIOMETER
  // =========================================================================
  if (input.subMode === "potentiometer") {
    const driverE = Math.max(0.1, input.driverEmfV ?? 4.0);
    const testE = Math.max(0.1, input.testEmfV ?? 1.5);
    const rInt = Math.max(0, input.internalResOhm ?? 2.0);
    const rWireTotal = 10.0; // 10 ohm total wire resistance across 100 cm
    const kPot = driverE / 100; // V per cm potential gradient

    const balanceLenCm = (testE / driverE) * 100;
    const curJockey = Math.min(100, Math.max(0, input.sliderCm ?? 37.5));
    const wirePotentialAtJockey = kPot * curJockey;
    const netGalvV = wirePotentialAtJockey - testE;

    return {
      subMode: "potentiometer",
      summary: {
        driverEmfV: roundTo(driverE, 3),
        testEmfV: roundTo(testE, 3),
        potentialGradientV_Cm: roundTo(kPot, 5),
        balanceLengthCm: roundTo(balanceLenCm, 2),
        currentJockeyCm: roundTo(curJockey, 2),
        galvanometerVoltageV: roundTo(netGalvV, 5),
        isBalanced: Math.abs(netGalvV) < 0.005,
      },
      details: {},
    };
  }

  // =========================================================================
  // 3. AC RLC CIRCUIT & OSCILLOSCOPE LISSAJOUS
  // =========================================================================
  if (input.subMode === "rlc_oscilloscope") {
    const Vp = Math.max(0.1, input.vPeakV ?? 10);
    const f = Math.max(1, input.freqHz ?? 50);
    const R = Math.max(0.1, input.resistanceOhm ?? 100);
    const L = Math.max(0.001, (input.inductanceMh ?? 150) * 1e-3); // H
    const C = Math.max(1e-9, (input.capacitanceUf ?? 10) * 1e-6); // F

    const omega = 2 * Math.PI * f;
    const XL = omega * L;
    const XC = 1 / (omega * C);
    const Z = Math.hypot(R, XL - XC);
    const phaseRad = Math.atan2(XL - XC, R);
    const phaseDeg = radToDeg(phaseRad);

    const fResonanceHz = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const currentPeakA = Vp / Z;
    const qFactor = (1 / R) * Math.sqrt(L / C);

    // Waveform points for oscilloscope
    const periodS = 1 / f;
    const steps = 80;
    const vSourcePts: { x: number; y: number }[] = [];
    const iCircuitPts: { x: number; y: number }[] = [];
    const lissajousPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (periodS * i) / steps;
      const vInst = Vp * Math.sin(omega * t);
      const iInst = currentPeakA * Math.sin(omega * t - phaseRad);
      vSourcePts.push({ x: roundTo(t * 1000, 3), y: roundTo(vInst, 3) });
      iCircuitPts.push({ x: roundTo(t * 1000, 3), y: roundTo(iInst * 1000, 3) }); // mA
      lissajousPts.push({ x: roundTo(vInst, 3), y: roundTo(iInst * 1000, 3) });
    }

    return {
      subMode: "rlc_oscilloscope",
      summary: {
        impedanceZ_Ohm: roundTo(Z, 2),
        inductiveReactanceXL_Ohm: roundTo(XL, 2),
        capacitiveReactanceXC_Ohm: roundTo(XC, 2),
        phaseAngleDeg: roundTo(phaseDeg, 2),
        currentPeakA: roundTo(currentPeakA, 4),
        resonantFrequencyHz: roundTo(fResonanceHz, 2),
        qualityFactorQ: roundTo(qFactor, 3),
        powerFactorCosPhi: roundTo(Math.cos(phaseRad), 4),
      },
      details: { vSourcePts, iCircuitPts },
      series: [
        { label: "Manba kuchlanishi u(t) [V]", points: vSourcePts },
        { label: "Zanjir toki i(t) [mA]", points: iCircuitPts },
      ],
    };
  }

  // =========================================================================
  // 4. RC / RL TRANSIENT PROCESSES
  // =========================================================================
  if (input.subMode === "rc_rl_transient") {
    const trType = input.transientType ?? "rc_charge";
    const Vs = Math.max(0.1, input.supplyV ?? 10);
    const R = Math.max(1, input.resistanceOhm ?? 1000);
    const C = Math.max(1e-9, (input.capacitanceUf ?? 100) * 1e-6);
    const L = Math.max(1e-4, (input.inductanceMh ?? 500) * 1e-3);

    const tauS = trType.startsWith("rc") ? R * C : L / R;
    const totalTimeS = tauS * 5.0;
    const steps = 60;
    const vPts: { x: number; y: number }[] = [];
    const iPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (totalTimeS * i) / steps;
      let v = 0;
      let cur = 0;

      if (trType === "rc_charge") {
        v = Vs * (1 - Math.exp(-t / tauS));
        cur = (Vs / R) * Math.exp(-t / tauS);
      } else if (trType === "rc_discharge") {
        v = Vs * Math.exp(-t / tauS);
        cur = -(Vs / R) * Math.exp(-t / tauS);
      } else {
        // rl_rise
        cur = (Vs / R) * (1 - Math.exp(-t / tauS));
        v = Vs * Math.exp(-t / tauS);
      }
      vPts.push({ x: roundTo(t * 1000, 3), y: roundTo(v, 4) });
      iPts.push({ x: roundTo(t * 1000, 3), y: roundTo(cur * 1000, 4) });
    }

    return {
      subMode: "rc_rl_transient",
      summary: {
        transientType: trType,
        timeConstantTauMs: roundTo(tauS * 1000, 3),
        steadyStateVoltageV: roundTo(Vs, 2),
        initialCurrentMa: roundTo((Vs / R) * 1000, 3),
        energyStoredFinalJ: roundTo(trType.startsWith("rc") ? 0.5 * C * Vs * Vs : 0.5 * L * Math.pow(Vs / R, 2), 6),
      },
      details: {},
      series: [
        { label: "Kuchlanish u(t) [V]", points: vPts },
        { label: "Tok kuchi i(t) [mA]", points: iPts },
      ],
    };
  }

  // =========================================================================
  // 5. AC BRIDGES (MAXWELL, SCHERING, WIEN)
  // =========================================================================
  if (input.subMode === "ac_bridges") {
    const bridgeType = input.acBridgeType ?? "maxwell_wien";
    const R1 = Math.max(0.1, input.r1Ohm ?? 100);
    const R2 = Math.max(0.1, input.r2Ohm ?? 200);
    const R3 = Math.max(0.1, input.r3Ohm ?? 500);
    const R4 = Math.max(0.1, input.r4Ohm ?? 1000);
    const C4 = Math.max(1e-12, (input.c4Uf ?? 0.5) * 1e-6);
    const fBridge = Math.max(10, input.bridgeFreqHz ?? 1000);
    const omega = 2 * Math.PI * fBridge;

    let measuredL_H = 0;
    let measuredR_Ohm = 0;
    let measuredC_F = 0;
    let measuredFreqHz = 0;
    let qFactor = 0;
    let dissipationFactor = 0;

    if (bridgeType === "maxwell_wien") {
      // Lx = R2 * R3 * C4, Rx = (R2 * R3) / R4
      measuredL_H = R2 * R3 * C4;
      measuredR_Ohm = (R2 * R3) / R4;
      qFactor = (omega * measuredL_H) / measuredR_Ohm;
    } else if (bridgeType === "schering") {
      // Cx = C3 * (R4 / R2), Rx = R2 * (C4 / C3)
      const C3 = Math.max(1e-12, (input.c3Uf ?? 0.1) * 1e-6);
      measuredC_F = C3 * (R4 / R2);
      measuredR_Ohm = R2 * (C4 / C3);
      dissipationFactor = omega * C4 * R4;
    } else {
      // Wien bridge frequency: f = 1 / (2*pi * sqrt(R1 * R2 * C1 * C2))
      const C1 = Math.max(1e-12, (input.c1Uf ?? 0.1) * 1e-6);
      const C2 = Math.max(1e-12, (input.c2Uf ?? 0.1) * 1e-6);
      measuredFreqHz = 1 / (2 * Math.PI * Math.sqrt(R1 * R2 * C1 * C2));
    }

    return {
      subMode: "ac_bridges",
      summary: {
        acBridgeType: bridgeType,
        excitationFreqHz: fBridge,
        ...(bridgeType === "maxwell_wien" && {
          measuredInductanceMh: roundTo(measuredL_H * 1000, 3),
          seriesResistanceOhm: roundTo(measuredR_Ohm, 2),
          qualityFactorQ: roundTo(qFactor, 2),
        }),
        ...(bridgeType === "schering" && {
          measuredCapacitanceNf: roundTo(measuredC_F * 1e9, 3),
          dielectricLossFactorTanDelta: roundTo(dissipationFactor, 5),
          parallelResistanceOhm: roundTo(measuredR_Ohm, 2),
        }),
        ...(bridgeType === "wien_frequency" && {
          calculatedFrequencyHz: roundTo(measuredFreqHz, 2),
          balanceRatioR3ToR4: roundTo(R3 / R4, 3),
        }),
      },
      details: {},
    };
  }

  // =========================================================================
  // 6. FERROMAGNETIC HYSTERESIS LOOP (B-H CURVE)
  // =========================================================================
  if (input.subMode === "magnetic_hysteresis_loop") {
    const Hc = Math.max(10, input.coercivityHc_A_M ?? 80); // A/m
    const Br = Math.max(0.1, input.remanenceBr_T ?? 1.1); // Tesla
    const Bs = Math.max(Br * 1.05, input.saturationBs_T ?? 1.5); // Tesla
    const Hmax = Math.max(Hc * 2, input.driveFieldHmax_A_M ?? 400); // A/m

    // Energy loss per unit volume per cycle: W_h = oint H dB approx 4 * Hc * Br
    const energyLossPerCycleJ_M3 = 4 * Hc * Br * 0.88;
    const fDrive = input.freqHz ?? 50;
    const volumeM3 = (input.coreVolumeCm3 ?? 250) * 1e-6;
    const corePowerLossW = energyLossPerCycleJ_M3 * fDrive * volumeM3;

    // Generate upper and lower branches of the B(H) curve
    const steps = 60;
    const upperBranch: { x: number; y: number }[] = [];
    const lowerBranch: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const H = -Hmax + (2 * Hmax * i) / steps;
      // Ascending branch: B_asc(H) = -Br + (Bs - Br) * tanh((H - Hc) / (Hc * 0.8))
      // Descending branch: B_desc(H) = Br + (Bs - Br) * tanh((H + Hc) / (Hc * 0.8))
      const bAsc = -Br + (Bs + Br) * (0.5 + 0.5 * Math.tanh((H - Hc) / (Hc * 0.75)));
      const bDesc = Br - (Bs + Br) * (0.5 - 0.5 * Math.tanh((H + Hc) / (Hc * 0.75)));

      lowerBranch.push({ x: roundTo(H, 1), y: roundTo(bAsc, 4) });
      upperBranch.push({ x: roundTo(H, 1), y: roundTo(bDesc, 4) });
    }

    return {
      subMode: "magnetic_hysteresis_loop",
      summary: {
        coercivityHc_A_M: roundTo(Hc, 1),
        remanenceBr_T: roundTo(Br, 3),
        saturationBs_T: roundTo(Bs, 3),
        driveFieldHmax_A_M: roundTo(Hmax, 1),
        hysteresisLossPerCycleJ_M3: roundTo(energyLossPerCycleJ_M3, 1),
        corePowerLossW: roundTo(corePowerLossW, 3),
      },
      details: {},
      curves: [
        { label: "Pasayuvchi tarmoq B_tushish(H)", points: upperBranch },
        { label: "O'suvchi tarmoq B_ko'tarilish(H)", points: lowerBranch },
      ],
    };
  }

  // =========================================================================
  // 7. 3D CYCLOTRON & BAINBRIDGE MASS SPECTROMETER
  // =========================================================================
  if (input.subMode === "cyclotron_lorentz_3d") {
    const q = input.particleChargeC ?? CODATA.e;
    const mPart = input.particleMassKg ?? CODATA.m_e;
    const Bz = Math.max(0.001, input.magneticFieldBz_T ?? 0.5);
    const E_v_m = input.electricFieldV_M ?? 0;
    const v0 = Math.max(100, input.initialSpeedMs ?? 2e6);

    // Cyclotron frequency and Larmor radius
    const omegaC = (q * Bz) / mPart;
    const periodC = (2 * Math.PI) / omegaC;
    const rLarmor = (mPart * v0) / (q * Bz);
    const kineticEnergyEv = (0.5 * mPart * v0 * v0) / CODATA.e;

    // Velocity selector condition: v_filter = E / B
    const vFilter = E_v_m > 0 ? E_v_m / Bz : v0;

    // Generate circular / spiral orbit trajectory
    const steps = 80;
    const orbitPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const phi = (2 * Math.PI * i) / steps;
      const x = rLarmor * Math.sin(phi);
      const y = rLarmor * (1 - Math.cos(phi));
      orbitPts.push({ x: roundTo(x * 1000, 3), y: roundTo(y * 1000, 3) }); // mm
    }

    return {
      subMode: "cyclotron_lorentz_3d",
      summary: {
        cyclotronFreqMhz: roundTo((omegaC / (2 * Math.PI)) / 1e6, 3),
        cyclotronPeriodNs: roundTo(periodC * 1e9, 3),
        larmorRadiusMm: roundTo(rLarmor * 1000, 3),
        kineticEnergyEv: roundTo(kineticEnergyEv, 2),
        velocitySelectorSpeedMs: roundTo(vFilter, 1),
      },
      details: {},
      curves: [{ label: "Zarracha siklotron orbitasi y(x) [mm]", points: orbitPts }],
    };
  }

  // =========================================================================
  // 8. HELMHOLTZ COILS SPATIAL MAGNETIC FIELD
  // =========================================================================
  if (input.subMode === "helmholtz_coils") {
    const N = Math.max(1, Math.round(input.helmholtzTurns ?? 150));
    const R = Math.max(0.02, input.helmholtzRadiusM ?? 0.15); // 15 cm radius
    const I = Math.max(0.01, input.helmholtzCurrentA ?? 2.0); // 2 A current
    const s = input.coilSeparationM ?? R; // Helmholtz condition: s = R

    // Central magnetic field B(0) = (4/5)^(3/2) * (mu0 * N * I / R)
    const bCenterT = Math.pow(4 / 5, 1.5) * ((CODATA.mu0 * N * I) / R);

    // On-axis magnetic field B(z):
    // B(z) = (mu0 * N * I * R^2 / 2) * [1 / (R^2 + (z - s/2)^2)^(3/2) + 1 / (R^2 + (z + s/2)^2)^(3/2)]
    const zRange = 2.0 * R;
    const steps = 80;
    const bFieldProfile: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const z = -zRange + (2 * zRange * i) / steps;
      const d1 = R * R + Math.pow(z - s / 2, 2);
      const d2 = R * R + Math.pow(z + s / 2, 2);
      const B_z = (CODATA.mu0 * N * I * R * R * 0.5) * (1 / Math.pow(d1, 1.5) + 1 / Math.pow(d2, 1.5));
      bFieldProfile.push({ x: roundTo(z * 100, 2), y: roundTo(B_z * 1000, 4) }); // z in cm, B in mT
    }

    return {
      subMode: "helmholtz_coils",
      summary: {
        coilRadiusCm: roundTo(R * 100, 1),
        coilSeparationCm: roundTo(s * 100, 1),
        turnsPerCoil: N,
        currentA: roundTo(I, 2),
        centralFieldMt: roundTo(bCenterT * 1000, 4),
        isHelmholtzSpacing: Math.abs(s - R) < 0.001,
      },
      details: {},
      curves: [{ label: "O'q bo'ylab magnit maydoni B(z) [mT]", points: bFieldProfile }],
    };
  }

  // =========================================================================
  // 9. HALL EFFECT
  // =========================================================================
  if (input.subMode === "hall_effect") {
    const I = Math.max(0.001, input.hallCurrentA ?? 0.05); // 50 mA
    const B = Math.max(0.001, input.magneticFieldT ?? 0.8); // 0.8 T
    const n = Math.max(1e18, input.carrierDensityM3 ?? 1.5e22); // semiconductor or metal
    const t = Math.max(1e-6, input.slabThicknessM ?? 0.0005); // 0.5 mm

    const Rh = 1 / (n * CODATA.e); // Hall coefficient (m^3 / C)
    const Vh = (Rh * I * B) / t; // Hall voltage (V)

    return {
      subMode: "hall_effect",
      summary: {
        hallVoltageMv: roundTo(Vh * 1000, 4),
        hallCoefficientM3_C: roundTo(Rh, 8),
        carrierDensityM3: roundTo(n, 2),
        magneticFieldT: roundTo(B, 3),
        sampleThicknessMm: roundTo(t * 1000, 2),
      },
      details: {},
    };
  }

  // =========================================================================
  // 10. THOMSON E/M SPECIFIC CHARGE
  // =========================================================================
  if (input.subMode === "thomson_em") {
    const V = Math.max(10, input.accelVoltageV ?? 250); // 250 V
    const r = Math.max(0.005, input.trajectoryRadiusM ?? 0.04); // 4 cm
    const B = Math.max(0.0001, input.magneticFieldT ?? 0.0012); // 1.2 mT

    // e / m = 2 * V / (B^2 * r^2)
    const e_over_m = (2 * V) / (B * B * r * r);
    const codataEm = CODATA.e / CODATA.m_e;
    const errorPct = (Math.abs(e_over_m - codataEm) / codataEm) * 100;

    return {
      subMode: "thomson_em",
      summary: {
        measuredSpecificChargeC_Kg: roundTo(e_over_m, 2),
        standardCodataC_Kg: roundTo(codataEm, 2),
        discrepancyPct: roundTo(errorPct, 3),
        acceleratingVoltageV: roundTo(V, 1),
        orbitalRadiusCm: roundTo(r * 100, 2),
        magneticFieldMt: roundTo(B * 1000, 3),
      },
      details: {},
    };
  }

  // =========================================================================
  // 11. TRANSFORMER
  // =========================================================================
  if (input.subMode === "transformer") {
    const V1 = Math.max(0.1, input.primaryVoltageV ?? 220);
    const N1 = Math.max(1, Math.round(input.primaryTurns ?? 500));
    const N2 = Math.max(1, Math.round(input.secondaryTurns ?? 50));
    const RLoad = Math.max(0.1, input.loadResistanceOhm ?? 10);

    const ratioK = N2 / N1;
    const V2 = V1 * ratioK;
    const I2 = V2 / RLoad;
    const P2 = V2 * I2;
    const efficiency = 0.94;
    const P1 = P2 / efficiency;
    const I1 = P1 / V1;

    return {
      subMode: "transformer",
      summary: {
        turnsRatio: roundTo(ratioK, 4),
        secondaryVoltageV: roundTo(V2, 2),
        secondaryCurrentA: roundTo(I2, 3),
        primaryCurrentA: roundTo(I1, 3),
        secondaryPowerW: roundTo(P2, 2),
        primaryPowerW: roundTo(P1, 2),
        transformerType: ratioK > 1 ? "Kuchsizlantiruvchi (Step-up)" : "Pasaytiruvchi (Step-down)",
      },
      details: {},
    };
  }

  // =========================================================================
  // 12. DEFAULT: FIELDS & FARADAY INDUCTION
  // =========================================================================
  const charges = input.charges ?? [
    { qMicroC: 5, x: -0.5, y: 0 },
    { qMicroC: -5, x: 0.5, y: 0 },
  ];

  const fieldGrid: {
    x: number;
    y: number;
    ex: number;
    ey: number;
    eMag: number;
    potentialV: number;
  }[] = [];

  for (let iy = 0; iy <= 10; iy++) {
    const y = -1.0 + iy * 0.2;
    for (let ix = 0; ix <= 14; ix++) {
      const x = -1.5 + ix * (3.0 / 14);
      let ex = 0;
      let ey = 0;
      let pot = 0;
      for (const ch of charges) {
        const dx = x - ch.x;
        const dy = y - ch.y;
        const r2 = Math.max(0.04, dx * dx + dy * dy);
        const r = Math.sqrt(r2);
        const q = ch.qMicroC * 1e-6;
        const E = (CODATA.k_e * q) / r2;
        ex += E * (dx / r);
        ey += E * (dy / r);
        pot += (CODATA.k_e * q) / r;
      }
      fieldGrid.push({
        x: roundTo(x, 3),
        y: roundTo(y, 3),
        ex: roundTo(ex, 1),
        ey: roundTo(ey, 1),
        eMag: roundTo(Math.hypot(ex, ey), 1),
        potentialV: roundTo(pot, 1),
      });
    }
  }

  const N = Math.max(1, Math.round(input.coilTurns ?? 200));
  const R = Math.max(0.01, input.coilRadiusM ?? 0.05);
  const mDip = Math.max(0.05, input.magnetMomentAm2 ?? 1.5);
  const vMag = Math.max(0.05, input.magnetVelocityMs ?? 0.8);
  const faradayCurve: { tMs: number; zM: number; fluxMwb: number; emfV: number }[] = [];

  const zSpan = 0.35;
  const totalT = (2 * zSpan) / vMag;
  let maxEmf = 0;
  for (let i = 0; i <= 100; i++) {
    const t = (totalT * i) / 100;
    const z = -zSpan + vMag * t;
    const denom = R * R + z * z;
    const flux = (CODATA.mu0 * mDip * R * R) / (2 * Math.pow(denom, 1.5));
    const dPhidz = (-3 * CODATA.mu0 * mDip * R * R * z) / (2 * Math.pow(denom, 2.5));
    const emf = -N * dPhidz * vMag;
    if (Math.abs(emf) > maxEmf) maxEmf = Math.abs(emf);
    faradayCurve.push({
      tMs: roundTo(t * 1000, 2),
      zM: roundTo(z, 4),
      fluxMwb: roundTo(flux * 1000, 5),
      emfV: roundTo(emf, 5),
    });
  }

  const I_sol = input.solenoidCurrentA ?? 2.0;
  const n_sol = input.solenoidTurnsPerM ?? 1000;
  const bSolenoidMt = CODATA.mu0 * n_sol * I_sol * 1000;

  return {
    subMode: "em_fields_faraday",
    summary: {
      peakInducedEmfV: roundTo(maxEmf, 5),
      solenoidCenterFieldMt: roundTo(bSolenoidMt, 4),
      chargeCount: charges.length,
    },
    details: { fieldGrid, charges, faradayCurve },
  };
}
