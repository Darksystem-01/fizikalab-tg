import { CODATA, degToRad, roundTo } from "./constants";

export type DynamicsSubMode =
  | "inclined_plane"
  | "pendulum"
  | "double_pendulum"
  | "hooke_spring"
  | "coupled_oscillators"
  | "forced_damped_resonance"
  | "collision"
  | "collision_2d"
  | "ballistic_pendulum"
  | "flywheel"
  | "rolling"
  | "gyroscope"
  | "oberbeck_pendulum"
  | "maxwell_wheel";

export interface DynamicsInput {
  subMode: DynamicsSubMode;
  gravity?: number;

  // Connected bodies & Inclined plane
  massKg?: number; // legacy alias for mass1Kg
  mass1Kg?: number; // Block 1 on slope (kg)
  mass2Kg?: number; // Block 2 hanging (kg)
  angleDeg?: number; // Incline angle theta (deg)
  frictionCoeff?: number; // generic friction alias
  muStatic?: number; // static friction coefficient
  muKinetic?: number; // kinetic friction coefficient
  planeLengthM?: number; // incline ramp length (m)
  pulleyMassKg?: number; // mass of pulley disk (kg)
  pulleyRadiusM?: number; // radius of pulley (m)
  cordMassKg?: number; // mass of connecting cord (kg)

  // Pendulum / Double pendulum / Kater
  pendulumLengthM?: number;
  pendulumLength1M?: number;
  pendulumLength2M?: number;
  pendulumMass1Kg?: number;
  pendulumMass2Kg?: number;
  initialAngleDeg?: number;
  initialAngle1Deg?: number;
  initialAngle2Deg?: number;
  katerH1M?: number;
  katerH2M?: number;
  katerT1S?: number;
  katerT2S?: number;

  // Spring & Oscillations
  springK?: number; // primary spring constant (N/m)
  springK2?: number; // secondary spring constant (N/m)
  springKc?: number; // coupling spring constant (N/m)
  dampingC?: number; // viscous damping coefficient (N*s/m)
  springX0M?: number; // initial displacement 1 (m)
  springX2M?: number; // initial displacement 2 (m)
  driverAmplitudeN?: number; // driving force F0 (N)
  driverFreqRadS?: number; // driving frequency Omega (rad/s)

  // Collisions & Ballistics
  v1InitialMs?: number; // initial velocity 1
  v2InitialMs?: number; // initial velocity 2
  v1InitialAngleDeg?: number; // 2D collision angle 1
  v2InitialAngleDeg?: number; // 2D collision angle 2
  impactParameterM?: number; // impact parameter b (m)
  restitutionE?: number; // restitution coefficient e (0 <= e <= 1)
  bulletMassKg?: number; // ballistic bullet mass (kg)
  bulletSpeedMs?: number; // ballistic bullet speed (m/s)
  blockMassKg?: number; // ballistic block mass (kg)

  // Rotational dynamics & Gyroscope
  flywheelInertiaKgM2?: number;
  axleRadiusM?: number;
  fallHeightM?: number;
  rollingShape?: "solid_sphere" | "solid_cylinder" | "hollow_cylinder" | "hollow_sphere" | "spherical_shell";
  radiusM?: number;
  gyroMassKg?: number;
  spinSpeedRadS?: number;
  pivotDistanceM?: number;

  // Oberbeck pendulum
  crossArmMassKg?: number;
  crossArmLengthM?: number;
  cylinderMassKg?: number;
  cylinderDistanceM?: number;

  // Maxwell wheel
  wheelDiscMassKg?: number;
  wheelDiscRadiusM?: number;
  wheelAxleRadiusM?: number;
  wheelDropHeightM?: number;
}

export interface DynamicsResult {
  subMode: DynamicsSubMode;
  summary: Record<string, number | string | boolean>;
  series: { label: string; points: { x: number; y: number }[] }[];
}

export function simulateDynamics(input: DynamicsInput): DynamicsResult {
  const g = Math.max(0.1, input.gravity ?? CODATA.g);

  // =========================================================================
  // 1. INCLINED PLANE (CONNECTED BODIES SYSTEM)
  // =========================================================================
  if (input.subMode === "inclined_plane") {
    const m1 = Math.max(0.001, input.mass1Kg ?? input.massKg ?? 2.0);
    const m2 = Math.max(0, input.mass2Kg ?? 0);
    const thetaDeg = Math.min(89.5, Math.max(0.5, input.angleDeg ?? 30));
    const theta = degToRad(thetaDeg);

    const genericFriction = input.frictionCoeff;
    const muS = Math.max(0, input.muStatic ?? (genericFriction !== undefined ? genericFriction : 0.35));
    const muK = Math.min(muS, Math.max(0, input.muKinetic ?? (genericFriction !== undefined ? genericFriction : 0.25)));
    const L = Math.max(0.1, input.planeLengthM ?? 2.5);

    // Pulley inertia & cord effects
    const mPulley = Math.max(0, input.pulleyMassKg ?? 0);
    const rPulley = Math.max(0.01, input.pulleyRadiusM ?? 0.05);
    const mCord = Math.max(0, input.cordMassKg ?? 0);
    // Effective inertia of pulley disk: I = 0.5 * mP * rP^2 => effective inertia mass = 0.5 * mP
    const effectiveInertiaMass = 0.5 * mPulley + (1 / 3) * mCord;
    const totalSystemInertiaMass = m1 + m2 + effectiveInertiaMass;

    // Component force vectors on Block 1
    const N = m1 * g * Math.cos(theta); // Normal force perpendicular to incline
    const fg1 = m1 * g; // True gravity on Block 1
    const fgParallel = m1 * g * Math.sin(theta); // Gravity component down the slope
    const fgPerpendicular = m1 * g * Math.cos(theta); // Gravity component into the slope
    const fgHanging = m2 * g; // Weight of hanging block 2

    // Maximum static friction and kinetic friction magnitude
    const fStaticMax = muS * N;
    const fKineticMag = muK * N;

    // Driving forces:
    // Drive uphill: (m2 * g - m1 * g * sin(theta))
    // Drive downhill: (m1 * g * sin(theta) - m2 * g)
    const netDriveUp = fgHanging - fgParallel;
    const netDriveDown = fgParallel - fgHanging;

    let moving = false;
    let direction: "up_slope" | "down_slope" | "static" = "static";
    let accel = 0; // Acceleration magnitude along incline (m/s^2)
    let frictionForceSigned = 0; // Along slope: positive = uphill, negative = downhill
    let frictionMagnitude = 0;
    let tension1 = fgHanging; // Tension acting on block 1
    let tension2 = fgHanging; // Tension acting on block 2

    if (netDriveUp > fStaticMax + 1e-9) {
      // Accelerates UP the slope, Block 2 descends
      moving = true;
      direction = "up_slope";
      // Dynamic equation: m2*g - T2 = m2*a; T1 - m1*g*sin(theta) - fk = m1*a; (T2 - T1)*r = I*alpha => a*(I/r^2)
      accel = (netDriveUp - fKineticMag) / totalSystemInertiaMass;
      frictionMagnitude = fKineticMag;
      frictionForceSigned = -fKineticMag; // Friction opposes motion -> points down the slope
      tension2 = m2 * (g - accel);
      tension1 = m1 * (accel + g * Math.sin(theta)) + fKineticMag;
    } else if (netDriveDown > fStaticMax + 1e-9) {
      // Accelerates DOWN the slope, Block 2 ascends
      moving = true;
      direction = "down_slope";
      // Dynamic equation: m1*g*sin(theta) - T1 - fk = m1*a; T2 - m2*g = m2*a
      accel = (netDriveDown - fKineticMag) / totalSystemInertiaMass;
      frictionMagnitude = fKineticMag;
      frictionForceSigned = fKineticMag; // Friction opposes motion -> points up the slope
      tension2 = m2 * (g + accel);
      tension1 = m1 * (g * Math.sin(theta) - accel) - fKineticMag;
    } else {
      // Static equilibrium: system does not move
      moving = false;
      direction = "static";
      accel = 0;
      // Static friction balances the net drive exactly
      frictionForceSigned = netDriveUp; // If netDriveDown > 0, frictionForceSigned is negative (uphill)
      frictionMagnitude = Math.abs(netDriveDown);
      tension1 = fgHanging;
      tension2 = fgHanging;
    }

    const aMag = Math.abs(accel);
    const travelTimeS = moving && aMag > 1e-6 ? Math.sqrt((2 * L) / aMag) : 0;
    const finalSpeedMs = moving ? aMag * travelTimeS : 0;
    const frictionWorkJ = moving ? -frictionMagnitude * L : 0;
    const totalPotentialEnergyChangeJ =
      direction === "down_slope"
        ? m1 * g * L * Math.sin(theta) - m2 * g * L
        : direction === "up_slope"
        ? m2 * g * L - m1 * g * L * Math.sin(theta)
        : 0;
    const mechanicalEnergyLossJ = moving ? Math.abs(frictionWorkJ) : 0;
    const pulleyTorqueNm = (tension2 - tension1) * rPulley;

    // Time-series displacement and velocity along slope
    const Tmax = moving ? travelTimeS : 3.0;
    const steps = 80;
    const posSeries: { x: number; y: number }[] = [];
    const velSeries: { x: number; y: number }[] = [];
    const kineticEnergySeries: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (Tmax * i) / steps;
      const s = 0.5 * accel * t * t;
      const v = accel * t;
      const ek = 0.5 * (m1 + m2 + effectiveInertiaMass) * v * v;
      posSeries.push({ x: roundTo(t, 4), y: roundTo(s, 4) });
      velSeries.push({ x: roundTo(t, 4), y: roundTo(v, 4) });
      kineticEnergySeries.push({ x: roundTo(t, 4), y: roundTo(ek, 4) });
    }

    return {
      subMode: "inclined_plane",
      summary: {
        moving,
        direction,
        angleDeg: roundTo(thetaDeg, 2),
        normalForceN: roundTo(N, 4),
        trueGravityN: roundTo(fg1, 4),
        gravityParallelN: roundTo(fgParallel, 4),
        gravityPerpendicularN: roundTo(fgPerpendicular, 4),
        hangingWeightN: roundTo(fgHanging, 4),
        staticMaxFrictionN: roundTo(fStaticMax, 4),
        kineticFrictionN: roundTo(fKineticMag, 4),
        actualFrictionN: roundTo(frictionMagnitude, 4),
        frictionForceSignedN: roundTo(frictionForceSigned, 4),
        frictionDirection:
          frictionMagnitude < 1e-7
            ? "none"
            : frictionForceSigned > 0
            ? "up_slope"
            : "down_slope",
        tensionN: roundTo(tension1, 4),
        tensionM1N: roundTo(tension1, 4),
        tensionM2N: roundTo(tension2, 4),
        accelerationMs2: roundTo(accel, 4),
        travelTimeS: roundTo(travelTimeS, 4),
        finalSpeedMs: roundTo(finalSpeedMs, 4),
        frictionWorkJ: roundTo(frictionWorkJ, 4),
        potentialEnergyChangeJ: roundTo(totalPotentialEnergyChangeJ, 4),
        mechanicalEnergyLossJ: roundTo(mechanicalEnergyLossJ, 4),
        pulleyInertiaKgM2: roundTo(0.5 * mPulley * rPulley * rPulley, 5),
        pulleyTorqueNm: roundTo(pulleyTorqueNm, 4),
      },
      series: [
        { label: "s(t) [m]", points: posSeries },
        { label: "v(t) [m/s]", points: velSeries },
        { label: "E_k(t) [J]", points: kineticEnergySeries },
      ],
    };
  }

  // =========================================================================
  // 2. NONLINEAR & KATER REVERSIBLE PENDULUM
  // =========================================================================
  if (input.subMode === "pendulum") {
    const L = Math.max(0.1, input.pendulumLengthM ?? 1.0);
    const theta0Deg = Math.min(179.5, Math.max(0.1, input.initialAngleDeg ?? 15));
    const theta0 = degToRad(theta0Deg);
    const T0 = 2 * Math.PI * Math.sqrt(L / g);

    // Adaptive step size RK4 integration for non-linear pendulum: d^2 theta / dt^2 = - (g / L) * sin(theta)
    const stepsPerCycle = theta0Deg > 150 ? 480 : theta0Deg > 90 ? 240 : 120;
    const dt = T0 / stepsPerCycle;
    const totalTime = T0 * 2.5;
    let theta = theta0;
    let omega = 0;
    const thetaSeries: { x: number; y: number }[] = [];
    const omegaSeries: { x: number; y: number }[] = [];
    const phaseSpaceSeries: { x: number; y: number }[] = [];
    const zeroCrossings: number[] = [];

    const steps = Math.round(totalTime / dt);
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      thetaSeries.push({ x: roundTo(t, 4), y: roundTo((theta * 180) / Math.PI, 4) });
      omegaSeries.push({ x: roundTo(t, 4), y: roundTo(omega, 4) });
      phaseSpaceSeries.push({ x: roundTo((theta * 180) / Math.PI, 3), y: roundTo(omega, 3) });

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

    // Kater's reversible pendulum: Bessel's formula for g:
    // 4*pi^2 / g = (T1^2 + T2^2)/(2*(h1+h2)) + (T1^2 - T2^2)/(2*(h1-h2))
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

    // Physical pendulum radius of gyration k_g: I = m*(h^2 + k_g^2)
    const radiusOfGyrationM = Math.sqrt(Math.max(0, (g / (4 * Math.PI * Math.PI)) * t1 * t1 * h1 - h1 * h1));

    return {
      subMode: "pendulum",
      summary: {
        smallAnglePeriodS: roundTo(T0, 5),
        nonlinearPeriodS: roundTo(nonlinearPeriodS, 5),
        anharmonicCorrectionPct: roundTo(((nonlinearPeriodS - T0) / T0) * 100, 4),
        angularFreqRadS: roundTo(Math.sqrt(g / L), 4),
        katerMeasuredG: roundTo(katerG, 5),
        katerEffectiveLengthM: roundTo(h1 + h2, 4),
        radiusOfGyrationM: roundTo(radiusOfGyrationM, 4),
        maxVelocityMs: roundTo(Math.sqrt(2 * g * L * (1 - Math.cos(theta0))), 4),
        maxAccelerationRadS2: roundTo((g / L) * Math.sin(theta0), 4),
      },
      series: [
        { label: "theta(t) [deg]", points: thetaSeries },
        { label: "omega(t) [rad/s]", points: omegaSeries },
        { label: "Faza portreti omega(theta)", points: phaseSpaceSeries },
      ],
    };
  }

  // =========================================================================
  // 3. CHAOTIC DOUBLE PENDULUM (LAGRANGIAN MECHANICS)
  // =========================================================================
  if (input.subMode === "double_pendulum") {
    const l1 = Math.max(0.1, input.pendulumLength1M ?? input.pendulumLengthM ?? 1.0);
    const l2 = Math.max(0.1, input.pendulumLength2M ?? 0.8);
    const m1 = Math.max(0.05, input.pendulumMass1Kg ?? 1.0);
    const m2 = Math.max(0.05, input.pendulumMass2Kg ?? 0.8);

    const th1_0 = degToRad(input.initialAngle1Deg ?? input.initialAngleDeg ?? 45);
    const th2_0 = degToRad(input.initialAngle2Deg ?? 60);

    // Equations of motion from Euler-Lagrange:
    // d(th1)/dt = w1, d(th2)/dt = w2
    // d(w1)/dt = f1(th1, th2, w1, w2)
    // d(w2)/dt = f2(th1, th2, w1, w2)
    const calcDerivs = (th1: number, th2: number, w1: number, w2: number) => {
      const dTh = th1 - th2;
      const num1 =
        -g * (2 * m1 + m2) * Math.sin(th1) -
        m2 * g * Math.sin(th1 - 2 * th2) -
        2 * Math.sin(dTh) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(dTh));
      const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * th1 - 2 * th2));
      const alpha1 = num1 / den1;

      const num2 =
        2 *
        Math.sin(dTh) *
        (w1 * w1 * l1 * (m1 + m2) +
          g * (m1 + m2) * Math.cos(th1) +
          w2 * w2 * l2 * m2 * Math.cos(dTh));
      const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * th1 - 2 * th2));
      const alpha2 = num2 / den2;

      return { alpha1, alpha2 };
    };

    const calcEnergy = (th1: number, th2: number, w1: number, w2: number) => {
      const y1 = -l1 * Math.cos(th1);
      const y2 = y1 - l2 * Math.cos(th2);
      const v1Sq = l1 * l1 * w1 * w1;
      const v2Sq =
        l1 * l1 * w1 * w1 +
        l2 * l2 * w2 * w2 +
        2 * l1 * l2 * w1 * w2 * Math.cos(th1 - th2);
      const T = 0.5 * m1 * v1Sq + 0.5 * m2 * v2Sq;
      const V = m1 * g * y1 + m2 * g * y2;
      return T + V;
    };

    const E0 = calcEnergy(th1_0, th2_0, 0, 0);
    let th1 = th1_0;
    let th2 = th2_0;
    let w1 = 0;
    let w2 = 0;

    const totalTime = 10.0;
    const dt = 0.005;
    const steps = Math.round(totalTime / dt);

    const th1Series: { x: number; y: number }[] = [];
    const th2Series: { x: number; y: number }[] = [];
    const bob2XySeries: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      if (i % 4 === 0) {
        th1Series.push({ x: roundTo(t, 3), y: roundTo((th1 * 180) / Math.PI, 3) });
        th2Series.push({ x: roundTo(t, 3), y: roundTo((th2 * 180) / Math.PI, 3) });
        const x2 = l1 * Math.sin(th1) + l2 * Math.sin(th2);
        const y2 = -l1 * Math.cos(th1) - l2 * Math.cos(th2);
        bob2XySeries.push({ x: roundTo(x2, 4), y: roundTo(y2, 4) });
      }

      // RK4 step
      const k1 = calcDerivs(th1, th2, w1, w2);
      const k1_th1 = w1;
      const k1_th2 = w2;

      const k2 = calcDerivs(
        th1 + 0.5 * dt * k1_th1,
        th2 + 0.5 * dt * k1_th2,
        w1 + 0.5 * dt * k1.alpha1,
        w2 + 0.5 * dt * k1.alpha2
      );
      const k2_th1 = w1 + 0.5 * dt * k1.alpha1;
      const k2_th2 = w2 + 0.5 * dt * k1.alpha2;

      const k3 = calcDerivs(
        th1 + 0.5 * dt * k2_th1,
        th2 + 0.5 * dt * k2_th2,
        w1 + 0.5 * dt * k2.alpha1,
        w2 + 0.5 * dt * k2.alpha2
      );
      const k3_th1 = w1 + 0.5 * dt * k2.alpha1;
      const k3_th2 = w2 + 0.5 * dt * k2.alpha2;

      const k4 = calcDerivs(
        th1 + dt * k3_th1,
        th2 + dt * k3_th2,
        w1 + dt * k3.alpha1,
        w2 + dt * k3.alpha2
      );
      const k4_th1 = w1 + dt * k3.alpha1;
      const k4_th2 = w2 + dt * k3.alpha2;

      th1 += (dt / 6) * (k1_th1 + 2 * k2_th1 + 2 * k3_th1 + k4_th1);
      th2 += (dt / 6) * (k1_th2 + 2 * k2_th2 + 2 * k3_th2 + k4_th2);
      w1 += (dt / 6) * (k1.alpha1 + 2 * k2.alpha1 + 2 * k3.alpha1 + k4.alpha1);
      w2 += (dt / 6) * (k1.alpha2 + 2 * k2.alpha2 + 2 * k3.alpha2 + k4.alpha2);
    }

    const EFinal = calcEnergy(th1, th2, w1, w2);
    const energyDriftPct = Math.abs((EFinal - E0) / Math.max(1e-4, Math.abs(E0))) * 100;

    return {
      subMode: "double_pendulum",
      summary: {
        length1M: roundTo(l1, 3),
        length2M: roundTo(l2, 3),
        mass1Kg: roundTo(m1, 3),
        mass2Kg: roundTo(m2, 3),
        initialAngle1Deg: roundTo((th1_0 * 180) / Math.PI, 2),
        initialAngle2Deg: roundTo((th2_0 * 180) / Math.PI, 2),
        totalInitialEnergyJ: roundTo(E0, 4),
        totalFinalEnergyJ: roundTo(EFinal, 4),
        energyConservationErrorPct: roundTo(energyDriftPct, 5),
        isChaotic: Math.abs(th1_0) + Math.abs(th2_0) > 0.4,
      },
      series: [
        { label: "theta1(t) [deg]", points: th1Series },
        { label: "theta2(t) [deg]", points: th2Series },
        { label: "2-yuk trayektoriyasi y(x)", points: bob2XySeries },
      ],
    };
  }

  // =========================================================================
  // 4. HOOKE SPRING & DAMPED HARMONIC OSCILLATOR
  // =========================================================================
  if (input.subMode === "hooke_spring") {
    const m = Math.max(0.05, input.mass1Kg ?? input.massKg ?? 0.5);
    const k = Math.max(0.5, input.springK ?? 25);
    const c = Math.max(0, input.dampingC ?? 0.15);
    const x0 = input.springX0M ?? 0.12;

    const eqExtM = (m * g) / k;
    const omega0 = Math.sqrt(k / m);
    const T0 = (2 * Math.PI) / omega0;
    const zeta = c / (2 * Math.sqrt(k * m));

    // Damped frequency
    const omegaD = zeta < 1 ? omega0 * Math.sqrt(1 - zeta * zeta) : 0;
    const Td = omegaD > 0 ? (2 * Math.PI) / omegaD : 0;
    const logDecrement = zeta < 1 ? (2 * Math.PI * zeta) / Math.sqrt(1 - zeta * zeta) : 0;
    const qualityFactorQ = 1 / (2 * Math.max(1e-6, zeta));

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
        dampedPeriodS: roundTo(Td, 4),
        maxPotentialEnergyJ: roundTo(0.5 * k * x0 * x0, 5),
        dampingRatioZeta: roundTo(zeta, 4),
        dampingRegime:
          zeta < 0.001
            ? "So'nmas (Ideal)"
            : zeta < 1
            ? "Kam so'nuvchi (Underdamped)"
            : Math.abs(zeta - 1) < 0.05
            ? "Kritik so'nish (Critically Damped)"
            : "Kuchli so'nuvchi (Overdamped)",
        logarithmicDecrement: roundTo(logDecrement, 4),
        qualityFactorQ: roundTo(qualityFactorQ, 3),
      },
      series: [
        { label: "x(t) [m]", points: xSeries },
        { label: "E_mech(t) [J]", points: eSeries },
      ],
    };
  }

  // =========================================================================
  // 5. COUPLED OSCILLATORS (NORMAL MODES & BEATS)
  // =========================================================================
  if (input.subMode === "coupled_oscillators") {
    const m1 = Math.max(0.05, input.mass1Kg ?? 0.8);
    const m2 = Math.max(0.05, input.mass2Kg ?? 0.8);
    const k1 = Math.max(0.5, input.springK ?? 20.0);
    const k2 = Math.max(0.5, input.springK2 ?? 20.0);
    const kc = Math.max(0.1, input.springKc ?? 5.0);

    const x1_0 = input.springX0M ?? 0.15;
    const x2_0 = input.springX2M ?? 0.0;

    // Normal frequencies for identical masses & outer springs:
    // w1^2 = k / m (symmetric, in-phase)
    // w2^2 = (k + 2*kc) / m (anti-symmetric, out-of-phase)
    const omega1 = Math.sqrt((k1 + (m1 !== m2 ? 0 : 0)) / m1);
    const omega2 = Math.sqrt((k1 + 2 * kc) / m1);
    const beatPeriodS = Math.abs(omega1 - omega2) > 1e-4 ? (2 * Math.PI) / Math.abs(omega1 - omega2) : 0;

    const totalTime = Math.min(25, Math.max(5, beatPeriodS * 2.5 || 10));
    const dt = 0.02;
    const steps = Math.round(totalTime / dt);

    let x1 = x1_0;
    let x2 = x2_0;
    let v1 = 0;
    let v2 = 0;

    const x1Series: { x: number; y: number }[] = [];
    const x2Series: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      x1Series.push({ x: roundTo(t, 3), y: roundTo(x1, 5) });
      x2Series.push({ x: roundTo(t, 3), y: roundTo(x2, 5) });

      // Accelerations:
      // m1 * a1 = -k1 * x1 + kc * (x2 - x1)
      // m2 * a2 = -k2 * x2 - kc * (x2 - x1)
      const a1 = (-k1 * x1 + kc * (x2 - x1)) / m1;
      const a2 = (-k2 * x2 - kc * (x2 - x1)) / m2;

      v1 += a1 * dt;
      v2 += a2 * dt;
      x1 += v1 * dt;
      x2 += v2 * dt;
    }

    return {
      subMode: "coupled_oscillators",
      summary: {
        mass1Kg: roundTo(m1, 3),
        mass2Kg: roundTo(m2, 3),
        outerSpringK: roundTo(k1, 2),
        couplingSpringKc: roundTo(kc, 2),
        mode1FreqHz: roundTo(omega1 / (2 * Math.PI), 3),
        mode2FreqHz: roundTo(omega2 / (2 * Math.PI), 3),
        beatPeriodS: roundTo(beatPeriodS, 3),
        couplingRatioKcToK: roundTo(kc / k1, 3),
      },
      series: [
        { label: "x1(t) [m]", points: x1Series },
        { label: "x2(t) [m]", points: x2Series },
      ],
    };
  }

  // =========================================================================
  // 6. FORCED DAMPED RESONANCE CURVE
  // =========================================================================
  if (input.subMode === "forced_damped_resonance") {
    const m = Math.max(0.05, input.mass1Kg ?? 0.5);
    const k = Math.max(0.5, input.springK ?? 50);
    const c = Math.max(0.01, input.dampingC ?? 0.2);
    const F0 = Math.max(0.1, input.driverAmplitudeN ?? 2.0);

    const omega0 = Math.sqrt(k / m);
    const beta = c / (2 * m);
    const omegaR = Math.sqrt(Math.max(0, omega0 * omega0 - 2 * beta * beta));
    const Q = (m * omega0) / c;

    // Amplitude response A(Omega) = (F0 / m) / sqrt((omega0^2 - Omega^2)^2 + 4 * beta^2 * Omega^2)
    // Phase response delta(Omega) = atan2(2 * beta * Omega, omega0^2 - Omega^2)
    const resonanceCurve: { x: number; y: number }[] = [];
    const phaseCurve: { x: number; y: number }[] = [];

    const omegaMax = omega0 * 2.5;
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const Om = (omegaMax * i) / steps;
      const denom = Math.sqrt(Math.pow(omega0 * omega0 - Om * Om, 2) + 4 * beta * beta * Om * Om);
      const amp = denom > 1e-6 ? F0 / m / denom : 0;
      const phi = Math.atan2(2 * beta * Om, omega0 * omega0 - Om * Om);
      resonanceCurve.push({ x: roundTo(Om, 3), y: roundTo(amp, 5) });
      phaseCurve.push({ x: roundTo(Om, 3), y: roundTo((phi * 180) / Math.PI, 2) });
    }

    const ARes = (F0 / m) / (2 * beta * Math.sqrt(Math.max(1e-6, omega0 * omega0 - beta * beta)));

    return {
      subMode: "forced_damped_resonance",
      summary: {
        naturalFreqRadS: roundTo(omega0, 3),
        resonantFreqRadS: roundTo(omegaR, 3),
        maxResonantAmplitudeM: roundTo(ARes, 5),
        qualityFactorQ: roundTo(Q, 3),
        halfPowerBandwidthRadS: roundTo(2 * beta, 3),
        drivingForceN: roundTo(F0, 2),
      },
      series: [
        { label: "Amplituda-chastota javobi A(Omega) [m]", points: resonanceCurve },
        { label: "Faza siljishi delta(Omega) [deg]", points: phaseCurve },
      ],
    };
  }

  // =========================================================================
  // 7. 1D COLLISION (ELASTIC / INELASTIC)
  // =========================================================================
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

  // =========================================================================
  // 8. 2D OBLIQUE COLLISION
  // =========================================================================
  if (input.subMode === "collision_2d") {
    const m1 = Math.max(0.05, input.mass1Kg ?? 1.2);
    const m2 = Math.max(0.05, input.mass2Kg ?? 1.2);
    const u1 = input.v1InitialMs ?? 5.0;
    const u2 = input.v2InitialMs ?? 0.0;
    const r1 = Math.max(0.02, input.radiusM ?? 0.05);
    const r2 = r1;
    const b = Math.min(r1 + r2 - 0.001, Math.max(0, input.impactParameterM ?? 0.03));
    const e = Math.min(1, Math.max(0, input.restitutionE ?? 1.0));

    // Collision normal angle: sin(alpha) = b / (r1 + r2)
    const sinAlpha = b / (r1 + r2);
    const cosAlpha = Math.sqrt(Math.max(0, 1 - sinAlpha * sinAlpha));

    // Velocities decomposed along normal (n) and tangent (t) axes
    const u1n = u1 * cosAlpha;
    const u1t = -u1 * sinAlpha;
    const u2n = u2 * cosAlpha;
    const u2t = -u2 * sinAlpha;

    // Normal velocities after collision
    const v1n = (m1 * u1n + m2 * u2n + m2 * e * (u2n - u1n)) / (m1 + m2);
    const v2n = (m1 * u1n + m2 * u2n + m1 * e * (u1n - u2n)) / (m1 + m2);

    // Tangential velocities unchanged (frictionless contact)
    const v1t = u1t;
    const v2t = u2t;

    // Reconstruct Cartesian velocities
    const v1x = v1n * cosAlpha - v1t * sinAlpha;
    const v1y = v1n * sinAlpha + v1t * cosAlpha;
    const v2x = v2n * cosAlpha - v2t * sinAlpha;
    const v2y = v2n * sinAlpha + v2t * cosAlpha;

    const v1Final = Math.hypot(v1x, v1y);
    const v2Final = Math.hypot(v2x, v2y);
    const theta1Deg = (Math.atan2(v1y, v1x) * 180) / Math.PI;
    const theta2Deg = (Math.atan2(v2y, v2x) * 180) / Math.PI;

    const kBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const kAfter = 0.5 * m1 * v1Final * v1Final + 0.5 * m2 * v2Final * v2Final;

    const puck1Path: { x: number; y: number }[] = [];
    const puck2Path: { x: number; y: number }[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = (2.0 * i) / 40 - 1.0;
      if (t <= 0) {
        puck1Path.push({ x: roundTo(t * u1, 3), y: roundTo(b, 3) });
        puck2Path.push({ x: roundTo(0, 3), y: roundTo(0, 3) });
      } else {
        puck1Path.push({ x: roundTo(t * v1x, 3), y: roundTo(b + t * v1y, 3) });
        puck2Path.push({ x: roundTo(t * v2x, 3), y: roundTo(t * v2y, 3) });
      }
    }

    return {
      subMode: "collision_2d",
      summary: {
        impactParameterM: roundTo(b, 4),
        deflectionAngle1Deg: roundTo(theta1Deg, 2),
        deflectionAngle2Deg: roundTo(theta2Deg, 2),
        scatteringAngleTotalDeg: roundTo(Math.abs(theta1Deg - theta2Deg), 2),
        v1FinalMs: roundTo(v1Final, 3),
        v2FinalMs: roundTo(v2Final, 3),
        kineticEnergyBeforeJ: roundTo(kBefore, 4),
        kineticEnergyAfterJ: roundTo(kAfter, 4),
        energyLostJ: roundTo(Math.max(0, kBefore - kAfter), 4),
      },
      series: [
        { label: "1-sharcha y(x) [m]", points: puck1Path },
        { label: "2-sharcha y(x) [m]", points: puck2Path },
      ],
    };
  }

  // =========================================================================
  // 9. BALLISTIC PENDULUM
  // =========================================================================
  if (input.subMode === "ballistic_pendulum") {
    const mb = Math.max(0.001, input.bulletMassKg ?? 0.015);
    const Mb = Math.max(0.1, input.blockMassKg ?? 2.5);
    const vb = Math.max(10, input.bulletSpeedMs ?? 420);
    const L = Math.max(0.2, input.pendulumLengthM ?? 1.5);

    // Completely inelastic impact:
    // mb * vb = (mb + Mb) * V => V = (mb / (mb + Mb)) * vb
    const V = (mb / (mb + Mb)) * vb;
    const initialKineticJ = 0.5 * mb * vb * vb;
    const combinedKineticJ = 0.5 * (mb + Mb) * V * V;
    const heatDissipatedJ = initialKineticJ - combinedKineticJ;

    // Swing height: (mb + Mb) * g * h = 0.5 * (mb + Mb) * V^2 => h = V^2 / (2 * g)
    const h = (V * V) / (2 * g);
    // Angle: cos(theta) = 1 - h / L
    const cosTheta = Math.max(-1, Math.min(1, 1 - h / L));
    const maxAngleRad = Math.acos(cosTheta);
    const maxAngleDeg = (maxAngleRad * 180) / Math.PI;

    // Calculated bullet velocity recovered from swing height:
    const recoveredVb = ((mb + Mb) / mb) * Math.sqrt(2 * g * h);

    const periodS = 2 * Math.PI * Math.sqrt(L / g);
    const swingSeries: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = (periodS * i) / 60;
      const th = maxAngleDeg * Math.sin((2 * Math.PI * t) / periodS);
      swingSeries.push({ x: roundTo(t, 3), y: roundTo(th, 2) });
    }

    return {
      subMode: "ballistic_pendulum",
      summary: {
        bulletMassKg: roundTo(mb, 4),
        blockMassKg: roundTo(Mb, 3),
        bulletSpeedMs: roundTo(vb, 1),
        combinedSpeedMs: roundTo(V, 4),
        maxHeightM: roundTo(h, 4),
        maxAngleDeg: roundTo(maxAngleDeg, 2),
        initialBulletEnergyJ: roundTo(initialKineticJ, 2),
        heatDissipatedJ: roundTo(heatDissipatedJ, 2),
        mechanicalEfficiencyPct: roundTo((combinedKineticJ / initialKineticJ) * 100, 3),
        recoveredBulletSpeedMs: roundTo(recoveredVb, 2),
      },
      series: [{ label: "Mayatnik burchagi theta(t) [deg]", points: swingSeries }],
    };
  }

  // =========================================================================
  // 10. ROLLING MOTION (RIGID BODY INCLINE)
  // =========================================================================
  if (input.subMode === "rolling") {
    const shape = input.rollingShape ?? "solid_sphere";
    let beta = 2 / 5; // solid sphere I = 2/5 m R^2
    if (shape === "solid_cylinder") beta = 1 / 2;
    else if (shape === "hollow_cylinder") beta = 1.0;
    else if (shape === "hollow_sphere" || shape === "spherical_shell") beta = 2 / 3;

    const thetaDeg = Math.min(85, Math.max(1, input.angleDeg ?? 25));
    const thetaRad = degToRad(thetaDeg);
    const L = Math.max(0.1, input.planeLengthM ?? 2.0);
    const m = Math.max(0.01, input.mass1Kg ?? input.massKg ?? 1.0);
    const R = Math.max(0.005, input.radiusM ?? 0.05);
    const muS = Math.max(0, input.muStatic ?? 0.35);

    // a = g * sin(theta) / (1 + beta)
    const accel = (g * Math.sin(thetaRad)) / (1 + beta);
    const travelTimeS = Math.sqrt((2 * L) / accel);
    const finalSpeedMs = accel * travelTimeS;
    const finalOmegaRadS = finalSpeedMs / R;
    const kTrans = 0.5 * m * finalSpeedMs * finalSpeedMs;
    const kRot = 0.5 * (beta * m * R * R) * finalOmegaRadS * finalOmegaRadS;

    // Minimum static friction required for pure rolling without slip:
    // f_s = (beta / (1 + beta)) * m * g * sin(theta) <= mu_s * m * g * cos(theta)
    const fStaticRequired = (beta / (1 + beta)) * m * g * Math.sin(thetaRad);
    const fStaticLimit = muS * m * g * Math.cos(thetaRad);
    const isPureRolling = fStaticRequired <= fStaticLimit + 1e-9;
    const slipCriticalAngleDeg = (Math.atan(((1 + beta) / beta) * muS) * 180) / Math.PI;

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
        isPureRolling,
        fStaticRequiredN: roundTo(fStaticRequired, 4),
        fStaticLimitN: roundTo(fStaticLimit, 4),
        slipCriticalAngleDeg: roundTo(Math.min(90, slipCriticalAngleDeg), 2),
      },
      series: [
        { label: "s(t) [m]", points: posSeries },
        { label: "v(t) [m/s]", points: velSeries },
      ],
    };
  }

  // =========================================================================
  // 11. GYROSCOPE PRECESSION & NUTATION
  // =========================================================================
  if (input.subMode === "gyroscope") {
    const M = Math.max(0.05, input.gyroMassKg ?? 1.5);
    const R = Math.max(0.01, input.radiusM ?? 0.08);
    const d = Math.max(0.01, input.pivotDistanceM ?? 0.12);
    const omegaSpin = Math.max(1, input.spinSpeedRadS ?? 120);

    // I_spin = 0.5 * M * R^2 (flywheel disc)
    const I_spin = 0.5 * M * R * R;
    const I_transverse = 0.25 * M * R * R + M * d * d;

    const spinAngularMomentum = I_spin * omegaSpin;
    const torque = M * g * d;
    const omegaPrecession = torque / spinAngularMomentum;
    const precessionPeriodS = (2 * Math.PI) / omegaPrecession;

    // Fast precession nutation frequency: omega_nut = I_spin * omega_spin / I_transverse
    const omegaNutation = spinAngularMomentum / I_transverse;
    const nutationPeriodS = (2 * Math.PI) / omegaNutation;

    // Precession orbit trajectory: X(t) = d * cos(omegaP * t), Y(t) = d * sin(omegaP * t)
    const orbitSeries: { x: number; y: number }[] = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = (precessionPeriodS * i) / steps;
      orbitSeries.push({
        x: roundTo(d * Math.cos(omegaPrecession * t), 4),
        y: roundTo(d * Math.sin(omegaPrecession * t), 4),
      });
    }

    return {
      subMode: "gyroscope",
      summary: {
        gyroMassKg: roundTo(M, 3),
        discInertiaKgM2: roundTo(I_spin, 5),
        transverseInertiaKgM2: roundTo(I_transverse, 5),
        spinSpeedRadS: roundTo(omegaSpin, 2),
        spinAngularMomentumKgM2S: roundTo(spinAngularMomentum, 4),
        torqueNm: roundTo(torque, 4),
        precessionSpeedRadS: roundTo(omegaPrecession, 4),
        precessionPeriodS: roundTo(precessionPeriodS, 3),
        nutationSpeedRadS: roundTo(omegaNutation, 3),
        nutationPeriodS: roundTo(nutationPeriodS, 4),
      },
      series: [{ label: "Presessiya fazoviy trayektoriyasi Y(X)", points: orbitSeries }],
    };
  }

  // =========================================================================
  // 12. OBERBECK PENDULUM (MOMENT OF INERTIA CROSS APPARATUS)
  // =========================================================================
  if (input.subMode === "oberbeck_pendulum") {
    const mCross = Math.max(0.1, input.crossArmMassKg ?? 0.6);
    const LCross = Math.max(0.1, input.crossArmLengthM ?? 0.4);
    const mCyl = Math.max(0.02, input.cylinderMassKg ?? 0.15); // 4 cylinders
    const rCyl = Math.max(0.02, Math.min(LCross, input.cylinderDistanceM ?? 0.25));

    const mFalling = Math.max(0.01, input.mass1Kg ?? input.massKg ?? 0.2);
    const rAxle = Math.max(0.005, input.axleRadiusM ?? 0.03);
    const hFall = Math.max(0.1, input.fallHeightM ?? 1.2);

    // Cross arm inertia: 2 rods of length 2*LCross rotated about center => 2 * (1/12) * m * (2L)^2
    const ICross = (2 / 12) * mCross * Math.pow(2 * LCross, 2);
    // 4 point-like cylinders at distance rCyl: 4 * mCyl * rCyl^2
    const ICyl = 4 * mCyl * rCyl * rCyl;
    const ITotal = ICross + ICyl;

    // Angular acceleration: alpha = (mFalling * g * rAxle) / (ITotal + mFalling * rAxle^2)
    const alpha = (mFalling * g * rAxle) / (ITotal + mFalling * rAxle * rAxle);
    const aLinear = alpha * rAxle;
    const fallTimeS = Math.sqrt((2 * hFall) / aLinear);
    const omegaFinal = alpha * fallTimeS;

    const omegaSeries: { x: number; y: number }[] = [];
    for (let i = 0; i <= 50; i++) {
      const t = (fallTimeS * i) / 50;
      omegaSeries.push({ x: roundTo(t, 3), y: roundTo(alpha * t, 3) });
    }

    return {
      subMode: "oberbeck_pendulum",
      summary: {
        crossArmInertiaKgM2: roundTo(ICross, 6),
        cylinderInertiaKgM2: roundTo(ICyl, 6),
        totalInertiaKgM2: roundTo(ITotal, 6),
        fallingMassKg: roundTo(mFalling, 3),
        cylinderDistanceM: roundTo(rCyl, 3),
        angularAccelRadS2: roundTo(alpha, 4),
        linearAccelMs2: roundTo(aLinear, 4),
        fallTimeS: roundTo(fallTimeS, 3),
        finalAngularVelocityRadS: roundTo(omegaFinal, 3),
      },
      series: [{ label: "omega(t) [rad/s]", points: omegaSeries }],
    };
  }

  // =========================================================================
  // 13. MAXWELL WHEEL
  // =========================================================================
  if (input.subMode === "maxwell_wheel") {
    const MDisc = Math.max(0.1, input.wheelDiscMassKg ?? 0.8);
    const RDisc = Math.max(0.02, input.wheelDiscRadiusM ?? 0.08);
    const rAxle = Math.max(0.002, input.wheelAxleRadiusM ?? 0.005);
    const h = Math.max(0.1, input.wheelDropHeightM ?? input.fallHeightM ?? 0.8);

    // Moment of inertia of disc: I = 0.5 * M * R^2
    const I = 0.5 * MDisc * RDisc * RDisc;
    // Downward acceleration: a = g / (1 + I / (M * r^2))
    const accel = g / (1 + I / (MDisc * rAxle * rAxle));
    const fallTimeS = Math.sqrt((2 * h) / accel);
    const vBottom = accel * fallTimeS;
    const omegaBottom = vBottom / rAxle;

    const posSeries: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = (fallTimeS * i) / 60;
      posSeries.push({ x: roundTo(t, 4), y: roundTo(0.5 * accel * t * t, 4) });
    }

    return {
      subMode: "maxwell_wheel",
      summary: {
        wheelMassKg: roundTo(MDisc, 3),
        discInertiaKgM2: roundTo(I, 6),
        linearAccelMs2: roundTo(accel, 4),
        fallTimeS: roundTo(fallTimeS, 3),
        finalLinearSpeedMs: roundTo(vBottom, 4),
        finalAngularSpeedRadS: roundTo(omegaBottom, 2),
        potentialEnergyJ: roundTo(MDisc * g * h, 4),
        translationalKineticJ: roundTo(0.5 * MDisc * vBottom * vBottom, 4),
        rotationalKineticJ: roundTo(0.5 * I * omegaBottom * omegaBottom, 4),
      },
      series: [{ label: "y(t) [m]", points: posSeries }],
    };
  }

  // =========================================================================
  // 14. DEFAULT: FLYWHEEL INERTIA APPARATUS
  // =========================================================================
  const I = Math.max(0.0001, input.flywheelInertiaKgM2 ?? 0.08);
  const m = Math.max(0.001, input.mass1Kg ?? input.massKg ?? 0.5);
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
