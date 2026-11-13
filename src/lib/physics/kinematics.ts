import { CODATA, degToRad, roundTo } from "./constants";

export interface KinematicsInput {
  mode:
    | "projectile"
    | "freefall"
    | "air_track"
    | "circular"
    | "relative"
    | "rocket";
  v0?: number; // m/s
  angleDeg?: number; // degrees
  y0?: number; // m
  massKg?: number; // kg
  gravity?: number; // m/s^2
  airDrag?: boolean;
  dragCoeff?: number; // Cd (dimensionless, ~0.47 for sphere)
  areaM2?: number; // cross-sectional area m^2
  airDensity?: number; // kg/m^3
  accelX?: number; // m/s^2 for 1D air track
  durationS?: number; // s for 1D air track
  // Circular motion
  radiusM?: number;
  angularSpeedRadS?: number;
  angularAccelRadS2?: number;
  // Relative motion
  vRelXMs?: number;
  vRelYMs?: number;
  // Rocket equation
  exhaustSpeedMs?: number;
  initialMassKg?: number;
  finalMassKg?: number;
}

export interface KinematicsPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  at: number; // tangential acceleration
  an: number; // normal (centripetal) acceleration
  curvatureRadius: number; // rho
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
}

export interface KinematicsResult {
  mode: string;
  flightTimeS: number;
  maxHeightM: number;
  rangeM: number;
  impactSpeedMs: number;
  vacuumRangeM: number;
  vacuumMaxHeightM: number;
  vacuumFlightTimeS: number;
  energyLostPct: number;
  points: KinematicsPoint[];
}

export function simulateKinematics(input: KinematicsInput): KinematicsResult {
  const g = Math.max(0.01, input.gravity ?? CODATA.g);
  const m = Math.max(0.001, input.massKg ?? 1);
  const y0 = Math.max(0, input.y0 ?? 0);
  const v0 = Math.max(0, input.v0 ?? 0);

  // Singularity guard: zero velocity at ground level
  if (v0 === 0 && y0 === 0 && input.mode !== "circular" && input.mode !== "air_track" && input.mode !== "relative" && input.mode !== "rocket") {
    return {
      mode: input.mode,
      flightTimeS: 0,
      maxHeightM: 0,
      rangeM: 0,
      impactSpeedMs: 0,
      vacuumRangeM: 0,
      vacuumMaxHeightM: 0,
      vacuumFlightTimeS: 0,
      energyLostPct: 0,
      points: [
        {
          t: 0,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          speed: 0,
          at: 0,
          an: 0,
          curvatureRadius: 0,
          kineticEnergy: 0,
          potentialEnergy: 0,
          totalEnergy: 0,
        },
      ],
    };
  }

  // Circular motion: a_c = v^2 / r = omega^2 * r
  if (input.mode === "circular") {
    const r = Math.max(0.01, input.radiusM ?? 1.5);
    const omega0 = Math.max(0, input.angularSpeedRadS ?? (v0 > 0 ? v0 / r : 4.0));
    const alpha = input.angularAccelRadS2 ?? 0;
    const T = Math.min(300, Math.max(0.1, input.durationS ?? 5));
    const steps = 100;
    const dt = T / steps;
    const points: KinematicsPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const omega = omega0 + alpha * t;
      const theta = omega0 * t + 0.5 * alpha * t * t;
      const v = omega * r;
      const at = alpha * r;
      const an = omega * omega * r;
      const K = 0.5 * m * v * v;
      points.push({
        t: roundTo(t, 4),
        x: roundTo(r * Math.cos(theta), 4),
        y: roundTo(r * Math.sin(theta), 4),
        vx: roundTo(-v * Math.sin(theta), 4),
        vy: roundTo(v * Math.cos(theta), 4),
        speed: roundTo(Math.abs(v), 4),
        at: roundTo(at, 4),
        an: roundTo(an, 4),
        curvatureRadius: roundTo(r, 4),
        kineticEnergy: roundTo(K, 4),
        potentialEnergy: 0,
        totalEnergy: roundTo(K, 4),
      });
    }

    const last = points[points.length - 1];
    return {
      mode: "circular",
      flightTimeS: roundTo(T, 4),
      maxHeightM: roundTo(r, 4),
      rangeM: roundTo(2 * Math.PI * r * ((omega0 * T) / (2 * Math.PI)), 4),
      impactSpeedMs: last.speed,
      vacuumRangeM: roundTo(2 * Math.PI * r, 4),
      vacuumMaxHeightM: roundTo(r, 4),
      vacuumFlightTimeS: roundTo(T, 4),
      energyLostPct: 0,
      points,
    };
  }

  // Relative motion
  if (input.mode === "relative") {
    const vRelX = input.vRelXMs ?? 15;
    const vRelY = input.vRelYMs ?? 5;
    const vRel = Math.hypot(vRelX, vRelY);
    const T = Math.max(1, input.durationS ?? 10);
    const steps = 50;
    const dt = T / steps;
    const points: KinematicsPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      points.push({
        t: roundTo(t, 4),
        x: roundTo(vRelX * t, 4),
        y: roundTo(vRelY * t, 4),
        vx: roundTo(vRelX, 4),
        vy: roundTo(vRelY, 4),
        speed: roundTo(vRel, 4),
        at: 0,
        an: 0,
        curvatureRadius: 0,
        kineticEnergy: roundTo(0.5 * m * vRel * vRel, 4),
        potentialEnergy: 0,
        totalEnergy: roundTo(0.5 * m * vRel * vRel, 4),
      });
    }

    const last = points[points.length - 1];
    return {
      mode: "relative",
      flightTimeS: roundTo(T, 4),
      maxHeightM: last.y,
      rangeM: last.x,
      impactSpeedMs: roundTo(vRel, 4),
      vacuumRangeM: last.x,
      vacuumMaxHeightM: last.y,
      vacuumFlightTimeS: roundTo(T, 4),
      energyLostPct: 0,
      points,
    };
  }

  // Tsiolkovsky rocket equation: Delta v = v_ex * ln(m0 / mf)
  if (input.mode === "rocket") {
    const vex = Math.max(100, input.exhaustSpeedMs ?? 2500); // 2500 m/s
    const m0 = Math.max(10, input.initialMassKg ?? 1000); // 1000 kg
    const mf = Math.max(1, Math.min(m0 * 0.99, input.finalMassKg ?? 200)); // 200 kg
    const deltaV = vex * Math.log(m0 / mf);
    const T = Math.max(1, input.durationS ?? 60);
    const steps = 60;
    const dt = T / steps;
    const points: KinematicsPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const currentM = m0 - ((m0 - mf) * t) / T;
      const v = vex * Math.log(m0 / currentM);
      points.push({
        t: roundTo(t, 4),
        x: 0,
        y: roundTo(0.5 * v * t, 4),
        vx: 0,
        vy: roundTo(v, 4),
        speed: roundTo(v, 4),
        at: roundTo(vex * ((m0 - mf) / (T * currentM)), 4),
        an: 0,
        curvatureRadius: 0,
        kineticEnergy: roundTo(0.5 * currentM * v * v, 4),
        potentialEnergy: roundTo(currentM * g * 0.5 * v * t, 4),
        totalEnergy: roundTo(0.5 * currentM * v * v, 4),
      });
    }

    const last = points[points.length - 1];
    return {
      mode: "rocket",
      flightTimeS: roundTo(T, 4),
      maxHeightM: last.y,
      rangeM: 0,
      impactSpeedMs: roundTo(deltaV, 4),
      vacuumRangeM: 0,
      vacuumMaxHeightM: last.y,
      vacuumFlightTimeS: roundTo(T, 4),
      energyLostPct: 0,
      points,
    };
  }

  if (input.mode === "air_track") {
    const ax = input.accelX ?? 1.5;
    const T = Math.min(3600, Math.max(0.01, input.durationS ?? 5));
    const steps = 120;
    const dt = T / steps;
    const points: KinematicsPoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const vx = v0 + ax * t;
      const x = v0 * t + 0.5 * ax * t * t;
      const K = 0.5 * m * vx * vx;
      points.push({
        t: roundTo(t, 4),
        x: roundTo(x, 4),
        y: 0,
        vx: roundTo(vx, 4),
        vy: 0,
        speed: roundTo(Math.abs(vx), 4),
        at: roundTo(ax, 4),
        an: 0,
        curvatureRadius: 0,
        kineticEnergy: roundTo(K, 4),
        potentialEnergy: 0,
        totalEnergy: roundTo(K, 4),
      });
    }
    const last = points[points.length - 1];
    return {
      mode: input.mode,
      flightTimeS: roundTo(T, 4),
      maxHeightM: 0,
      rangeM: last.x,
      impactSpeedMs: last.speed,
      vacuumRangeM: last.x,
      vacuumMaxHeightM: 0,
      vacuumFlightTimeS: roundTo(T, 4),
      energyLostPct: 0,
      points,
    };
  }

  const theta =
    input.mode === "freefall" ? -Math.PI / 2 : degToRad(input.angleDeg ?? 45);
  const vx0 = input.mode === "freefall" ? 0 : v0 * Math.cos(theta);
  const vy0 = input.mode === "freefall" ? 0 : v0 * Math.sin(theta);

  // Analytical vacuum reference
  const disc = vy0 * vy0 + 2 * g * y0;
  const vacuumFlightTimeS = (vy0 + Math.sqrt(Math.max(0, disc))) / g;
  const vacuumMaxHeightM = vy0 > 0 ? y0 + (vy0 * vy0) / (2 * g) : y0;
  const vacuumRangeM = vx0 * vacuumFlightTimeS;

  const kDrag = input.airDrag
    ? (0.5 * (input.airDensity || CODATA.rho_air) * (input.dragCoeff || 0.47) * (input.areaM2 || 0.01)) / m
    : 0;

  const deriv = (_t: number, s: [number, number, number, number]): [number, number, number, number] => {
    const [, , vx, vy] = s;
    const speed = Math.hypot(vx, vy);
    const ax = -kDrag * speed * vx;
    const ay = -g - kDrag * speed * vy;
    return [vx, vy, ax, ay];
  };

  let state: [number, number, number, number] = [0, y0, vx0, vy0];
  let t = 0;
  const dt = Math.max(0.002, Math.min(0.02, (vacuumFlightTimeS || 2) / 250));
  const maxSteps = 5000;

  const rawPoints: KinematicsPoint[] = [];
  const pushPoint = (time: number, s: [number, number, number, number]) => {
    const [x, y, vx, vy] = s;
    const speed = Math.hypot(vx, vy);
    const [, , ax, ay] = deriv(time, s);
    let at = 0;
    let an = 0;
    let curvatureRadius = 0;
    if (speed > 1e-6) {
      at = (vx * ax + vy * ay) / speed;
      const aMag2 = ax * ax + ay * ay;
      an = Math.sqrt(Math.max(0, aMag2 - at * at));
      curvatureRadius = an > 1e-6 ? (speed * speed) / an : 0;
    }
    const K = 0.5 * m * speed * speed;
    const U = m * g * Math.max(0, y);
    rawPoints.push({
      t: roundTo(time, 4),
      x: roundTo(x, 4),
      y: roundTo(Math.max(0, y), 4),
      vx: roundTo(vx, 4),
      vy: roundTo(vy, 4),
      speed: roundTo(speed, 4),
      at: roundTo(at, 4),
      an: roundTo(an, 4),
      curvatureRadius: roundTo(Math.min(curvatureRadius, 1e6), 3),
      kineticEnergy: roundTo(K, 4),
      potentialEnergy: roundTo(U, 4),
      totalEnergy: roundTo(K + U, 4),
    });
  };

  pushPoint(0, state);
  let maxH = y0;

  for (let step = 0; step < maxSteps; step++) {
    const k1 = deriv(t, state);
    const s2: [number, number, number, number] = [
      state[0] + 0.5 * dt * k1[0],
      state[1] + 0.5 * dt * k1[1],
      state[2] + 0.5 * dt * k1[2],
      state[3] + 0.5 * dt * k1[3],
    ];
    const k2 = deriv(t + 0.5 * dt, s2);
    const s3: [number, number, number, number] = [
      state[0] + 0.5 * dt * k2[0],
      state[1] + 0.5 * dt * k2[1],
      state[2] + 0.5 * dt * k2[2],
      state[3] + 0.5 * dt * k2[3],
    ];
    const k3 = deriv(t + 0.5 * dt, s3);
    const s4: [number, number, number, number] = [
      state[0] + dt * k3[0],
      state[1] + dt * k3[1],
      state[2] + dt * k3[2],
      state[3] + dt * k3[3],
    ];
    const k4 = deriv(t + dt, s4);

    const next: [number, number, number, number] = [
      state[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      state[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
      state[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
      state[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
    ];
    const nextT = t + dt;

    if (next[1] > maxH) maxH = next[1];

    if (next[1] <= 0 && step > 0) {
      const frac = state[1] / Math.max(1e-9, state[1] - next[1]);
      const impT = t + frac * dt;
      const impState: [number, number, number, number] = [
        state[0] + frac * (next[0] - state[0]),
        0,
        state[2] + frac * (next[2] - state[2]),
        state[3] + frac * (next[3] - state[3]),
      ];
      pushPoint(impT, impState);
      break;
    }

    state = next;
    t = nextT;
    pushPoint(t, state);
  }

  let points = rawPoints;
  if (rawPoints.length > 160) {
    const stride = Math.ceil(rawPoints.length / 150);
    points = rawPoints.filter((_, idx) => idx % stride === 0 || idx === rawPoints.length - 1);
  }

  const first = points[0];
  const last = points[points.length - 1];
  const energyLostPct =
    first.totalEnergy > 1e-9
      ? Math.max(0, ((first.totalEnergy - last.totalEnergy) / first.totalEnergy) * 100)
      : 0;

  return {
    mode: input.mode,
    flightTimeS: last.t,
    maxHeightM: roundTo(maxH, 4),
    rangeM: last.x,
    impactSpeedMs: last.speed,
    vacuumRangeM: roundTo(vacuumRangeM, 4),
    vacuumMaxHeightM: roundTo(vacuumMaxHeightM, 4),
    vacuumFlightTimeS: roundTo(vacuumFlightTimeS, 4),
    energyLostPct: roundTo(energyLostPct, 3),
    points,
  };
}
