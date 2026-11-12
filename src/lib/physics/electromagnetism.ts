import { CODATA, roundTo } from "./constants";

export type EmSubMode =
  | "wheatstone_meter_bridge"
  | "potentiometer"
  | "rlc_oscilloscope"
  | "rc_rl_transient"
  | "em_fields_faraday";

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
}

export interface EmResult {
  subMode: EmSubMode;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
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
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = Math.abs(M[i][i]) > 1e-14 ? sum / M[i][i] : 0;
  }
  return x;
}

export function simulateElectromagnetism(input: EmInput): EmResult {
  if (input.subMode === "wheatstone_meter_bridge") {
    const Vs = Math.max(0.5, input.supplyV ?? 6.0);
    const Rk = Math.max(0.5, input.rKnownOhm ?? 100);
    const Rx = Math.max(0.5, input.rUnknownOhm ?? 150);
    const Rg = Math.max(1, input.galvResistanceOhm ?? 50);
    const isMeter = (input.bridgeType ?? "meter_bridge") === "meter_bridge";

    let P = Math.max(0.5, input.rP ?? 100);
    let Q = Math.max(0.5, input.rQ ?? 100);
    const jockeyCm = Math.min(99.5, Math.max(0.5, input.jockeyCm ?? 40));

    if (isMeter) {
      const wireTotalOhm = 10; // standard constantan/manganin 1m wire
      P = wireTotalOhm * (jockeyCm / 100);
      Q = wireTotalOhm * ((100 - jockeyCm) / 100);
    }

    // MNA nodal equations for nodes B (between P & Q) and C (between Rk & Rx)
    // Node A fixed at Vs, Node D fixed at 0
    // At B: (V_B - Vs)/P + V_B/Q + (V_B - V_C)/Rg = 0
    // At C: (V_C - Vs)/Rk + V_C/Rx + (V_C - V_B)/Rg = 0
    const gP = 1 / P;
    const gQ = 1 / Q;
    const gRk = 1 / Rk;
    const gRx = 1 / Rx;
    const gG = 1 / Rg;

    const [vB, vC] = solveLinearSystem(
      [
        [gP + gQ + gG, -gG],
        [-gG, gRk + gRx + gG],
      ],
      [Vs * gP, Vs * gRk]
    );

    const igA = (vB - vC) / Rg; // Galvanometer current
    const igMa = igA * 1000;
    const iTotalA = (Vs - vB) / P + (Vs - vC) / Rk;
    const nullJockeyCm = (100 * Rk) / (Rk + Rx);
    const measuredRxAtJockey = Rk * ((100 - jockeyCm) / jockeyCm);
    const balanced = Math.abs(igMa) < 0.15;

    // Sweep jockey curve for plotting Ig(l)
    const sweepCurve: { x: number; y: number }[] = [];
    for (let l = 2; l <= 98; l += 2) {
      const pSweep = 10 * (l / 100);
      const qSweep = 10 * ((100 - l) / 100);
      const [vbS, vcS] = solveLinearSystem(
        [
          [1 / pSweep + 1 / qSweep + gG, -gG],
          [-gG, gRk + gRx + gG],
        ],
        [Vs / pSweep, Vs / Rk]
      );
      sweepCurve.push({ x: l, y: roundTo(((vbS - vcS) / Rg) * 1000, 4) });
    }

    return {
      subMode: "wheatstone_meter_bridge",
      summary: {
        bridgeType: isMeter ? "meter_bridge" : "wheatstone",
        nodeBVoltageV: roundTo(vB, 5),
        nodeCVoltageV: roundTo(vC, 5),
        galvanometerCurrentMa: roundTo(igMa, 4),
        totalSupplyCurrentMa: roundTo(iTotalA * 1000, 3),
        nullPointCm: roundTo(nullJockeyCm, 3),
        estimatedRxAtJockeyOhm: roundTo(measuredRxAtJockey, 3),
        trueRxOhm: roundTo(Rx, 3),
        balanced,
      },
      details: { sweepCurve },
    };
  }

  if (input.subMode === "potentiometer") {
    const E0 = Math.max(1, input.driverEmfV ?? 4.0);
    const Ex = Math.min(E0 * 0.95, Math.max(0.1, input.testEmfV ?? 1.5));
    const rInt = Math.max(0.05, input.internalResOhm ?? 1.2);
    const Rshunt = Math.max(0.5, input.shuntResOhm ?? 5.0);
    const shuntClosed = input.shuntClosed ?? false;
    const sliderCm = Math.min(100, Math.max(0, input.sliderCm ?? 37.5));
    const L = 100; // 100 cm wire
    const kGrad = E0 / L; // V/cm

    const nullL1Cm = Ex / kGrad;
    const terminalV = Ex * (Rshunt / (Rshunt + rInt));
    const nullL2Cm = terminalV / kGrad;
    const activeNullCm = shuntClosed ? nullL2Cm : nullL1Cm;
    const vSlider = kGrad * sliderCm;
    const targetV = shuntClosed ? terminalV : Ex;
    const rEff = shuntClosed ? (rInt * Rshunt) / (rInt + Rshunt) : rInt;
    const igMa = ((targetV - vSlider) / (50 + rEff)) * 1000;
    const calculatedR = Rshunt * (nullL1Cm / Math.max(1e-6, nullL2Cm) - 1);

    return {
      subMode: "potentiometer",
      summary: {
        potentialGradientVCm: roundTo(kGrad, 5),
        openCircuitNullL1Cm: roundTo(nullL1Cm, 3),
        closedShuntNullL2Cm: roundTo(nullL2Cm, 3),
        galvanometerCurrentMa: roundTo(igMa, 4),
        computedInternalResOhm: roundTo(calculatedR, 4),
        balanced: Math.abs(sliderCm - activeNullCm) < 0.3,
      },
      details: {},
    };
  }

  if (input.subMode === "rlc_oscilloscope") {
    const V0 = Math.max(0.5, input.vPeakV ?? 10);
    const f = Math.max(1, input.freqHz ?? 159.15);
    const R = Math.max(1, input.resistanceOhm ?? 100);
    const L = Math.max(0.01, input.inductanceMh ?? 100) * 1e-3;
    const C = Math.max(0.01, input.capacitanceUf ?? 10) * 1e-6;

    const omega = 2 * Math.PI * f;
    const XL = omega * L;
    const XC = 1 / (omega * C);
    const Xnet = XL - XC;
    const Z = Math.hypot(R, Xnet);
    const phiRad = Math.atan2(Xnet, R);
    const phiDeg = (phiRad * 180) / Math.PI;
    const iPeak = V0 / Z;
    const vRms = V0 / Math.SQRT2;
    const iRms = iPeak / Math.SQRT2;
    const pAvg = vRms * iRms * Math.cos(phiRad);
    const fRes = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const qFactor = (1 / R) * Math.sqrt(L / C);

    const period = 1 / f;
    const cycles = 2.5;
    const steps = 150;
    const waveforms: {
      tMs: number;
      vSource: number;
      vResistor: number;
      vInductor: number;
      vCapacitor: number;
      iMa: number;
    }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (cycles * period * i) / steps;
      const wt = omega * t;
      const vS = V0 * Math.sin(wt);
      const curr = iPeak * Math.sin(wt - phiRad);
      const vR = iPeak * R * Math.sin(wt - phiRad);
      const vL = iPeak * XL * Math.sin(wt - phiRad + Math.PI / 2);
      const vC = iPeak * XC * Math.sin(wt - phiRad - Math.PI / 2);
      waveforms.push({
        tMs: roundTo(t * 1000, 4),
        vSource: roundTo(vS, 4),
        vResistor: roundTo(vR, 4),
        vInductor: roundTo(vL, 4),
        vCapacitor: roundTo(vC, 4),
        iMa: roundTo(curr * 1000, 4),
      });
    }

    // Frequency resonance sweep
    const sweep: { freqHz: number; iPeakMa: number; impedanceOhm: number }[] = [];
    const fMin = Math.max(10, fRes * 0.25);
    const fMax = fRes * 2.5;
    for (let k = 0; k <= 60; k++) {
      const fk = fMin + ((fMax - fMin) * k) / 60;
      const wk = 2 * Math.PI * fk;
      const zk = Math.hypot(R, wk * L - 1 / (wk * C));
      sweep.push({
        freqHz: roundTo(fk, 2),
        iPeakMa: roundTo((V0 / zk) * 1000, 3),
        impedanceOhm: roundTo(zk, 2),
      });
    }

    return {
      subMode: "rlc_oscilloscope",
      summary: {
        xlOhm: roundTo(XL, 3),
        xcOhm: roundTo(XC, 3),
        impedanceOhm: roundTo(Z, 3),
        phaseDeg: roundTo(phiDeg, 3),
        iPeakMa: roundTo(iPeak * 1000, 3),
        iRmsMa: roundTo(iRms * 1000, 3),
        avgPowerW: roundTo(pAvg, 4),
        resonanceFreqHz: roundTo(fRes, 3),
        qualityFactorQ: roundTo(qFactor, 3),
        regime: Math.abs(phiDeg) < 1 ? "Rezonans" : phiDeg > 0 ? "Induktiv" : "Sig‘imli",
      },
      details: { waveforms, sweep },
    };
  }

  if (input.subMode === "rc_rl_transient") {
    const V0 = Math.max(0.5, input.supplyV ?? 12);
    const R = Math.max(1, input.resistanceOhm ?? 1000);
    const C = Math.max(0.01, input.capacitanceUf ?? 100) * 1e-6;
    const L = Math.max(0.1, input.inductanceMh ?? 250) * 1e-3;
    const tType = input.transientType ?? "rc_charge";

    const tau = tType === "rl_rise" ? L / R : R * C;
    const tMax = tau * 5;
    const steps = 100;
    const curve: { tMs: number; voltageV: number; currentMa: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (tMax * i) / steps;
      const expFactor = Math.exp(-t / tau);
      let v = 0;
      let curr = 0;
      if (tType === "rc_charge") {
        v = V0 * (1 - expFactor);
        curr = (V0 / R) * expFactor;
      } else if (tType === "rc_discharge") {
        v = V0 * expFactor;
        curr = -(V0 / R) * expFactor;
      } else {
        // RL rise: V_L(t) and I(t)
        curr = (V0 / R) * (1 - expFactor);
        v = V0 * expFactor; // inductor voltage
      }
      curve.push({
        tMs: roundTo(t * 1000, 3),
        voltageV: roundTo(v, 4),
        currentMa: roundTo(curr * 1000, 4),
      });
    }

    return {
      subMode: "rc_rl_transient",
      summary: {
        transientType: tType,
        timeConstantMs: roundTo(tau * 1000, 4),
        initialCurrentMa: roundTo((V0 / R) * 1000, 3),
        storedEnergyMaxMj: roundTo(
          (tType === "rl_rise"
            ? 0.5 * L * Math.pow(V0 / R, 2)
            : 0.5 * C * V0 * V0) * 1000,
          4
        ),
      },
      details: { curve },
    };
  }

  // Electrostatic field + Faraday Induction
  const charges = (input.charges ?? [
    { qMicroC: 2.0, x: -0.5, y: 0 },
    { qMicroC: -2.0, x: 0.5, y: 0 },
  ]).slice(0, 6);

  // 15x11 field grid over x in [-1.5, 1.5], y in [-1.0, 1.0]
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

  // Faraday induction: magnetic dipole m moving along axis z of N-turn coil of radius R
  const N = Math.max(1, Math.round(input.coilTurns ?? 200));
  const R = Math.max(0.01, input.coilRadiusM ?? 0.05);
  const mDip = Math.max(0.05, input.magnetMomentAm2 ?? 1.5);
  const vMag = Math.max(0.05, input.magnetVelocityMs ?? 0.8);
  const faradayCurve: { tMs: number; zM: number; fluxMwb: number; emfV: number }[] = [];

  // Flux of magnetic dipole m at distance z through circular loop of radius R:
  // Phi(z) = (mu0 * m * R^2) / (2 * (R^2 + z^2)^(3/2))
  // dPhi/dz = -3 * mu0 * m * R^2 * z / (2 * (R^2 + z^2)^(5/2))
  // Emf = -N * (dPhi/dz) * v
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

  // Solenoid central magnetic field
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
