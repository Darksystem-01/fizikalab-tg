import { CODATA, degToRad, roundTo } from "./constants";

export type DynamicsSubMode =
  | "inclined_plane"
  | "pendulum"
  | "hooke_spring"
  | "collision"
  | "flywheel"
  | "rolling"
  | "gyroscope";

export interface DynamicsInput {
  subMode: DynamicsSubMode;
  gravity?: number;
  mass1Kg?: number;
  mass2Kg?: number;
  angleDeg?: number;
  muStatic?: number;
  muKinetic?: number;
  planeLengthM?: number;
  pendulumLengthM?: number;
  initialAngleDeg?: number;
  katerH1M?: number;
  katerH2M?: number;
  katerT1S?: number;
  katerT2S?: number;
  springK?: number;
  dampingC?: number;
  springX0M?: number;
  v1InitialMs?: number;
  v2InitialMs?: number;
  restitutionE?: number;
  flywheelInertiaKgM2?: number;
  axleRadiusM?: number;
  fallHeightM?: number;
  // Rolling motion
  rollingShape?: "solid_sphere" | "solid_cylinder" | "hollow_cylinder" | "hollow_sphere";
  radiusM?: number;
  // Gyroscope
  gyroMassKg?: number;
  spinSpeedRadS?: number;
  pivotDistanceM?: number;
}

export interface DynamicsResult {
  subMode: DynamicsSubMode;
  summary: Record<string, number | string | boolean>;
  series: { label: string; points: { x: number; y: number }[] }[];
}

export function simulateDynamics(input: DynamicsInput): DynamicsResult {
  const g = Math.max(0.1, input.gravity ?? CODATA.g);

  if (input.subMode === "inclined_plane") {
    const m1 = Math.max(0.001, (input as any).massKg ?? input.mass1Kg ?? 2);
    const m2 = Math.max(0, input.mass2Kg ?? 0);
    const theta = degToRad(Math.min(89.5, Math.max(0.5, input.angleDeg ?? 30)));
    const genericFriction = (input as any).frictionCoeff;
    const muS = Math.max(0, input.muStatic ?? (genericFriction !== undefined ? genericFriction : 0.35));
    const muK = Math.min(muS, Math.max(0, input.muKinetic ?? (genericFriction !== undefined ? genericFriction : 0.25)));
    const L = Math.max(0.1, input.planeLengthM ?? 2.5);

    const N = m1 * g * Math.cos(theta);
    const fgParallel = m1 * g * Math.sin(theta);
    const fgHanging = m2 * g;
    const netDrive = fgParallel - fgHanging;
    const fStaticMax = muS * N;
    const fKineticMag = muK * N;

    let moving = false;
    let direction: "down_slope" | "up_slope" | "static" = "static";
    let accel = 0;
    let frictionForce = netDrive;
    let tension = fgHanging;

    if (Math.abs(netDrive) > fStaticMax) {
      moving = true;
      if (netDrive > 0) {
        direction = "down_slope";
        frictionForce = fKineticMag;
        accel = (netDrive - fKineticMag) / (m1 + m2);
        tension = m2 * (g + accel);
      } else {
        direction = "up_slope";
        frictionForce = -fKineticMag;
        accel = (netDrive + fKineticMag) / (m1 + m2);
        tension = m2 * (g - Math.abs(accel));
      }
    }

    const aMag = Math.abs(accel);
    const travelTimeS = moving && aMag > 1e-6 ? Math.sqrt((2 * L) / aMag) : 0;
    const finalSpeedMs = moving ? aMag * travelTimeS : 0;
    const frictionWorkJ = moving ? -fKineticMag * L : 0;

    const Tmax = moving ? travelTimeS : 3.0;
    const steps = 80;
    const posSeries: { x: number; y: number }[] = [];
    const velSeries: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (Tmax * i) / steps;
      posSeries.push({ x: roundTo(t, 4), y: roundTo(0.5 * accel * t * t, 4) });
      velSeries.push({ x: roundTo(t, 4), y: roundTo(accel * t, 4) });
    }

    return {
      subMode: "inclined_plane",
      summary: {
        moving,
        direction,
        normalForceN: roundTo(N, 4),
        gravityParallelN: roundTo(fgParallel, 4),
        staticMaxFrictionN: roundTo(fStaticMax, 4),
        kineticFrictionN: roundTo(fKineticMag, 4),
        actualFrictionN: roundTo(frictionForce, 4),
        tensionN: roundTo(tension, 4),
        accelerationMs2: roundTo(accel, 4),
        travelTimeS: roundTo(travelTimeS, 4),
        finalSpeedMs: roundTo(finalSpeedMs, 4),
        frictionWorkJ: roundTo(frictionWorkJ, 4),
      },
      series: [
        { label: "s(t) [m]", points: posSeries },
        { label: "v(t) [m/s]", points: velSeries },
      ],
    };
  }

  if (input.subMode === "pendulum") {
    const L = Math.max(0.1, input.pendulumLengthM ?? 1.0);
    const theta0Deg = Math.min(179.5, Math.max(0.1, input.initialAngleDeg ?? 15));
    const theta0 = degToRad(theta0Deg);
    const T0 = 2 * Math.PI * Math.sqrt(L / g);

    const stepsPerCycle = theta0Deg > 150 ? 360 : 120;
    const dt = T0 / stepsPerCycle;
    const totalTime = T0 * 2.5;
    let theta = theta0;
    let omega = 0;
    const thetaSeries: { x: number; y: number }[] = [];
    const omegaSeries: { x: number; y: number }[] = [];
    const zeroCrossings: number[] = [];

    const steps = Math.round(totalTime / dt);
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      thetaSeries.push({ x: roundTo(t, 4), y: roundTo((theta * 180) / Math.PI, 4) });
      omegaSeries.push({ x: roundTo(t, 4), y: roundTo(omega, 4) });

      const f = (th: number) => -(g / L) * Math.sin(th);
      const k1t = omega;
      const k1w = f(theta);
      const k2t = omega + 0.5 * dt * k1w;
      const k2w = f(theta + 0.5 * dt * k1t);
      const k3t = omega + 0.5 * dt * k2w;
      const k3w = f(theta + 0.5 * dt * k2t);
      const k4t = omega + dt * k3w;
      const k4w = f(theta + dt * k3t);

      const nextTheta = theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
      const nextOmega = omega + (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);

      if (theta > 0 && nextTheta <= 0) {
        const frac = theta / (theta - nextTheta);
        zeroCrossings.push(t + frac * dt);
      }
      theta = nextTheta;
      omega = nextOmega;
    }

    const nonlinearPeriodS =
      zeroCrossings.length >= 2
        ? zeroCrossings[1] - zeroCrossings[0]
        : T0 * (1 + (1 / 16) * theta0 * theta0 + (11 / 3072) * Math.pow(theta0, 4));

    const h1 = Math.max(0.05, input.katerH1M ?? 0.65);
    const h2 = Math.max(0.05, input.katerH2M ?? 0.35);
    const t1 = input.katerT1S ?? nonlinearPeriodS;
    const t2 = input.katerT2S ?? nonlinearPeriodS * 1.004;
    const denom =
      Math.abs(h1 - h2) > 1e-4
        ? (t1 * t1 + t2 * t2) / (2 * (h1 + h2)) +
          (t1 * t1 - t2 * t2) / (2 * (h1 - h2))
        : (t1 * t1) / (h1 + h2);
    const katerG = denom > 1e-6 ? (4 * Math.PI * Math.PI) / denom : g;

    return {
      subMode: "pendulum",
      summary: {
        smallAnglePeriodS: roundTo(T0, 5),
        nonlinearPeriodS: roundTo(nonlinearPeriodS, 5),
        anharmonicCorrectionPct: roundTo(((nonlinearPeriodS - T0) / T0) * 100, 4),
        angularFreqRadS: roundTo(Math.sqrt(g / L), 4),
        katerMeasuredG: roundTo(katerG, 5),
      },
      series: [
        { label: "theta(t) [deg]", points: thetaSeries },
        { label: "omega(t) [rad/s]", points: omegaSeries },
      ],
    };
  }

  if (input.subMode === "hooke_spring") {
    const m = Math.max(0.05, input.mass1Kg ?? 0.5);
    const k = Math.max(0.5, input.springK ?? 25);
    const c = Math.max(0, input.dampingC ?? 0.15);
    const x0 = input.springX0M ?? 0.12;

    const eqExtM = (m * g) / k;
    const omega0 = Math.sqrt(k / m);
    const T0 = (2 * Math.PI) / omega0;
    const totalTime = Math.min(12, Math.max(2, T0 * 4));
    const steps = 160;
    const dt = totalTime / steps;

    let x = x0;
    let v = 0;
    const xSeries: { x: number; y: number }[] = [];
    const eSeries: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const energy = 0.5 * m * v * v + 0.5 * k * x * x;
      xSeries.push({ x: roundTo(t, 4), y: roundTo(x, 5) });
      eSeries.push({ x: roundTo(t, 4), y: roundTo(energy, 5) });

      const f = (pos: number, vel: number) => (-k * pos - c * vel) / m;
      const k1x = v;
      const k1v = f(x, v);
      const k2x = v + 0.5 * dt * k1v;
      const k2v = f(x + 0.5 * dt * k1x, v + 0.5 * dt * k1v);
      const k3x = v + 0.5 * dt * k2v;
      const k3v = f(x + 0.5 * dt * k2x, v + 0.5 * dt * k2v);
      const k4x = v + dt * k3v;
      const k4v = f(x + dt * k3x, v + dt * k3v);

      x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }

    return {
      subMode: "hooke_spring",
      summary: {
        equilibriumStretchM: roundTo(eqExtM, 5),
        naturalFreqHz: roundTo(omega0 / (2 * Math.PI), 4),
        periodS: roundTo(T0, 4),
        maxPotentialEnergyJ: roundTo(0.5 * k * x0 * x0, 5),
        dampingRatioZeta: roundTo(c / (2 * Math.sqrt(k * m)), 4),
      },
      series: [
        { label: "x(t) [m]", points: xSeries },
        { label: "E_mech(t) [J]", points: eSeries },
      ],
    };
  }

  if (input.subMode === "collision") {
    const m1 = Math.max(0.001, input.mass1Kg ?? 1.5);
    const m2 = Math.max(0.001, input.mass2Kg ?? 1.0);
    const u1 = input.v1InitialMs ?? 4.0;
    const u2 = input.v2InitialMs ?? -1.0;
    const e = Math.min(1, Math.max(0, input.restitutionE ?? 1.0));
    const willCollide = u1 > u2 + 1e-9;

    const v1 = willCollide
      ? (m1 * u1 + m2 * u2 + m2 * e * (u2 - u1)) / (m1 + m2)
      : u1;
    const v2 = willCollide
      ? (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2)
      : u2;
    const vCM = (m1 * u1 + m2 * u2) / (m1 + m2);
    const pBefore = m1 * u1 + m2 * u2;
    const pAfter = m1 * v1 + m2 * v2;
    const kBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const kAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    const impulse1 = m1 * (v1 - u1);

    const x1Series: { x: number; y: number }[] = [];
    const x2Series: { x: number; y: number }[] = [];
    const tColl = 1.5;
    for (let i = 0; i <= 60; i++) {
      const t = (3.0 * i) / 60;
      const x1 = willCollide
        ? t <= tColl
          ? u1 * (t - tColl)
          : v1 * (t - tColl)
        : -0.6 + u1 * t;
      const x2 = willCollide
        ? t <= tColl
          ? u2 * (t - tColl)
          : v2 * (t - tColl)
        : 0.6 + u2 * t;
      x1Series.push({ x: roundTo(t, 3), y: roundTo(x1, 4) });
      x2Series.push({ x: roundTo(t, 3), y: roundTo(x2, 4) });
    }

    return {
      subMode: "collision",
      summary: {
        willCollide,
        v1FinalMs: roundTo(v1, 4),
        v2FinalMs: roundTo(v2, 4),
        vCenterOfMassMs: roundTo(vCM, 4),
        momentumBeforeKgMs: roundTo(pBefore, 4),
        momentumAfterKgMs: roundTo(pAfter, 4),
        kineticBeforeJ: roundTo(kBefore, 4),
        kineticAfterJ: roundTo(kAfter, 4),
        energyLostJ: roundTo(Math.max(0, kBefore - kAfter), 4),
        impulseOnBody1Ns: roundTo(impulse1, 4),
      },
      series: [
        { label: "x1(t) [m]", points: x1Series },
        { label: "x2(t) [m]", points: x2Series },
      ],
    };
  }

  if (input.subMode === "rolling") {
    const shape = input.rollingShape ?? "solid_sphere";
    let beta = 2 / 5; // solid sphere I = 2/5 m R^2
    if (shape === "solid_cylinder") beta = 1 / 2;
    else if (shape === "hollow_cylinder") beta = 1.0;
    else if (shape === "hollow_sphere") beta = 2 / 3;

    const thetaDeg = Math.min(85, Math.max(1, input.angleDeg ?? 25));
    const thetaRad = degToRad(thetaDeg);
    const L = Math.max(0.1, input.planeLengthM ?? 2.0);
    const m = Math.max(0.01, input.mass1Kg ?? 1.0);
    const R = Math.max(0.005, input.radiusM ?? 0.05);

    // a = g * sin(theta) / (1 + beta)
    const accel = (g * Math.sin(thetaRad)) / (1 + beta);
    const travelTimeS = Math.sqrt((2 * L) / accel);
    const finalSpeedMs = accel * travelTimeS;
    const finalOmegaRadS = finalSpeedMs / R;
    const kTrans = 0.5 * m * finalSpeedMs * finalSpeedMs;
    const kRot = 0.5 * (beta * m * R * R) * finalOmegaRadS * finalOmegaRadS;

    const posSeries: { x: number; y: number }[] = [];
    const velSeries: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = (travelTimeS * i) / 60;
      posSeries.push({ x: roundTo(t, 4), y: roundTo(0.5 * accel * t * t, 4) });
      velSeries.push({ x: roundTo(t, 4), y: roundTo(accel * t, 4) });
    }

    return {
      subMode: "rolling",
      summary: {
        rollingShape: shape,
        inertiaCoeffBeta: roundTo(beta, 3),
        accelerationMs2: roundTo(accel, 4),
        finalSpeedMs: roundTo(finalSpeedMs, 4),
        finalAngularSpeedRadS: roundTo(finalOmegaRadS, 3),
        travelTimeS: roundTo(travelTimeS, 4),
        translationalKineticJ: roundTo(kTrans, 4),
        rotationalKineticJ: roundTo(kRot, 4),
        totalMechanicalEnergyJ: roundTo(kTrans + kRot, 4),
      },
      series: [
        { label: "s(t) [m]", points: posSeries },
        { label: "v(t) [m/s]", points: velSeries },
      ],
    };
  }

  if (input.subMode === "gyroscope") {
    const M = Math.max(0.05, input.gyroMassKg ?? 1.5);
    const R = Math.max(0.01, input.radiusM ?? 0.08);
    const d = Math.max(0.01, input.pivotDistanceM ?? 0.12);
    const omegaSpin = Math.max(1, input.spinSpeedRadS ?? 120);

    // I = 0.5 * M * R^2 (flywheel disc)
    const I_disc = 0.5 * M * R * R;
    const spinAngularMomentum = I_disc * omegaSpin;
    const torque = M * g * d;
    const omegaPrecession = torque / spinAngularMomentum;
    const precessionPeriodS = (2 * Math.PI) / omegaPrecession;

    return {
      subMode: "gyroscope",
      summary: {
        gyroMassKg: roundTo(M, 3),
        discInertiaKgM2: roundTo(I_disc, 5),
        spinSpeedRadS: roundTo(omegaSpin, 2),
        spinAngularMomentumKgM2S: roundTo(spinAngularMomentum, 4),
        torqueNm: roundTo(torque, 4),
        precessionSpeedRadS: roundTo(omegaPrecession, 4),
        precessionPeriodS: roundTo(precessionPeriodS, 3),
      },
      series: [],
    };
  }

  const I = Math.max(0.0001, input.flywheelInertiaKgM2 ?? 0.08);
  const m = Math.max(0.001, input.mass1Kg ?? 0.5);
  const r = Math.max(0.002, input.axleRadiusM ?? 0.04);
  const h = Math.max(0.05, input.fallHeightM ?? 1.2);

  const alpha = (m * g * r) / (I + m * r * r);
  const aLinear = alpha * r;
  const fallTimeS = Math.sqrt((2 * h) / Math.max(1e-9, aLinear));
  const omegaFinal = alpha * fallTimeS;
  const vFinal = aLinear * fallTimeS;
  const kRot = 0.5 * I * omegaFinal * omegaFinal;
  const kTrans = 0.5 * m * vFinal * vFinal;

  const omegaSeries: { x: number; y: number }[] = [];
  const thetaSeries: { x: number; y: number }[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (fallTimeS * i) / 60;
    omegaSeries.push({ x: roundTo(t, 4), y: roundTo(alpha * t, 4) });
    thetaSeries.push({ x: roundTo(t, 4), y: roundTo(0.5 * alpha * t * t, 4) });
  }

  return {
    subMode: "flywheel",
    summary: {
      angularAccelRadS2: roundTo(alpha, 4),
      linearAccelMs2: roundTo(aLinear, 4),
      fallTimeS: roundTo(fallTimeS, 4),
      omegaFinalRadS: roundTo(omegaFinal, 4),
      rotationalEnergyJ: roundTo(kRot, 4),
      translationalEnergyJ: roundTo(kTrans, 4),
      potentialEnergyJ: roundTo(m * g * h, 4),
    },
    series: [
      { label: "omega(t) [rad/s]", points: omegaSeries },
      { label: "theta(t) [rad]", points: thetaSeries },
    ],
  };
}
