import { CODATA, degToRad, radToDeg, roundTo } from "./constants";

export interface KinematicsInput {
  mode:
    | "projectile"
    | "freefall"
    | "air_track"
    | "circular"
    | "relative"
    | "rocket"
    | "atmospheric_ballistics"
    | "brachistochrone"
    | "kepler_orbit"
    | "relativistic_kinematics";
  v0?: number; // m/s
  angleDeg?: number; // degrees
  y0?: number; // m
  massKg?: number; // kg
  gravity?: number; // m/s^2
  airDrag?: boolean;
  airResistance?: boolean; // legacy alias
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

  // Atmospheric ballistics & Coriolis / Magnus
  spinRateRpm?: number; // Magnus spin rate (rpm)
  magnusLiftCoeff?: number; // CL
  latitudeDeg?: number; // Earth latitude for Coriolis (deg)
  windSpeedXMs?: number; // Crosswind speed (m/s)

  // Brachistochrone curve
  targetXM?: number; // Destination x
  targetYM?: number; // Destination y (downward positive)

  // Kepler orbital mechanics
  centralMassKg?: number; // Mass of central body (M)
  orbitSemiMajorAxisM?: number; // a (m)
  orbitEccentricity?: number; // e (0 <= e < 1)

  // Relativistic kinematics
  relativisticSpeedMs?: number; // v (m/s)
  movingFrameSpeedMs?: number; // frame speed v
  properLifetimeNs?: number; // proper lifetime tau0 (ns)
  sourceFrequencyHz?: number; // source frequency f0
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
  summary?: Record<string, any>;
  curves?: { label: string; points: { x: number; y: number }[] }[];
}

export function simulateKinematics(input: KinematicsInput): KinematicsResult {
  const g = Math.max(0.01, input.gravity ?? CODATA.g);
  const m = Math.max(0.001, input.massKg ?? 1);
  const y0 = Math.max(0, input.y0 ?? 0);
  const v0 = Math.max(0, input.v0 ?? 0);

  // =========================================================================
  // SINGULARITY GUARD: ZERO VELOCITY AT GROUND LEVEL
  // =========================================================================
  const isSpecialNonBallistic =
    input.mode === "circular" ||
    input.mode === "air_track" ||
    input.mode === "relative" ||
    input.mode === "rocket" ||
    input.mode === "brachistochrone" ||
    input.mode === "kepler_orbit" ||
    input.mode === "relativistic_kinematics";

  if (v0 === 0 && y0 === 0 && !isSpecialNonBallistic) {
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
      summary: {
        flightTimeS: 0,
        maxHeightM: 0,
        rangeM: 0,
        impactSpeedMs: 0,
        vacuumRangeM: 0,
        vacuumMaxHeightM: 0,
        vacuumFlightTimeS: 0,
        energyLostPct: 0,
      },
    };
  }

  // =========================================================================
  // SUBMODE: BRACHISTOCHRONE & COMPARATIVE DESCENT
  // =========================================================================
  if (input.mode === "brachistochrone") {
    const x1 = Math.max(0.5, input.targetXM ?? 5.0);
    const y1 = Math.max(0.5, input.targetYM ?? 3.0); // downward positive

    // Solve for cycloid parameter theta1 via Newton-Raphson:
    // x1 / y1 = (theta - sin(theta)) / (1 - cos(theta))
    const ratio = x1 / y1;
    let theta = 2.4;
    for (let iter = 0; iter < 25; iter++) {
      const f = (theta - Math.sin(theta)) / (1 - Math.cos(theta)) - ratio;
      const fPrime =
        ((1 - Math.cos(theta)) * (1 - Math.cos(theta)) -
          (theta - Math.sin(theta)) * Math.sin(theta)) /
        Math.pow(1 - Math.cos(theta), 2);
      const dTheta = f / (fPrime || 1e-6);
      theta -= dTheta;
      if (Math.abs(dTheta) < 1e-8) break;
    }
    const R = y1 / (1 - Math.cos(theta));
    const tCycloid = theta * Math.sqrt(R / g);

    // Straight ramp: L = sqrt(x1^2 + y1^2), a = g * sin(alpha) = g * (y1 / L)
    // t_straight = sqrt(2 * L / a) = sqrt(2 * (x1^2 + y1^2) / (g * y1))
    const tStraight = Math.sqrt((2 * (x1 * x1 + y1 * y1)) / (g * y1));

    // Circular arc from (0,0) to (x1, y1):
    // Circle equation (x - xc)^2 + (y - yc)^2 = Rc^2 with vertical tangent at origin => xc = Rc, yc = 0
    // (x1 - Rc)^2 + y1^2 = Rc^2 => x1^2 - 2 Rc x1 + y1^2 = 0 => Rc = (x1^2 + y1^2) / (2 * x1)
    const Rc = (x1 * x1 + y1 * y1) / (2 * x1);
    let tCircle = 0;
    const numSteps = 120;
    for (let i = 1; i <= numSteps; i++) {
      const xPrev = ((i - 1) * x1) / numSteps;
      const xCurr = (i * x1) / numSteps;
      const yPrev = Math.sqrt(Math.max(0, 2 * Rc * xPrev - xPrev * xPrev));
      const yCurr = Math.sqrt(Math.max(0, 2 * Rc * xCurr - xCurr * xCurr));
      const ds = Math.hypot(xCurr - xPrev, yCurr - yPrev);
      const yMid = 0.5 * (yPrev + yCurr);
      const vMid = Math.sqrt(Math.max(1e-5, 2 * g * yMid));
      tCircle += ds / vMid;
    }

    // Parabolic chute: y = (y1 / x1^2) * x^2
    let tParabola = 0;
    const kPara = y1 / (x1 * x1);
    for (let i = 1; i <= numSteps; i++) {
      const xPrev = ((i - 1) * x1) / numSteps;
      const xCurr = (i * x1) / numSteps;
      const yPrev = kPara * xPrev * xPrev;
      const yCurr = kPara * xCurr * xCurr;
      const ds = Math.hypot(xCurr - xPrev, yCurr - yPrev);
      const yMid = 0.5 * (yPrev + yCurr);
      const vMid = Math.sqrt(Math.max(1e-5, 2 * g * yMid));
      tParabola += ds / vMid;
    }

    // Curve point series for visualizer
    const cycloidPts: { x: number; y: number }[] = [];
    const straightPts: { x: number; y: number }[] = [];
    const circlePts: { x: number; y: number }[] = [];
    const parabolaPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= 60; i++) {
      const th = (theta * i) / 60;
      cycloidPts.push({
        x: roundTo(R * (th - Math.sin(th)), 4),
        y: roundTo(R * (1 - Math.cos(th)), 4),
      });

      const xf = (x1 * i) / 60;
      straightPts.push({ x: roundTo(xf, 4), y: roundTo((y1 / x1) * xf, 4) });
      parabolaPts.push({ x: roundTo(xf, 4), y: roundTo(kPara * xf * xf, 4) });
      circlePts.push({
        x: roundTo(xf, 4),
        y: roundTo(Math.sqrt(Math.max(0, 2 * Rc * xf - xf * xf)), 4),
      });
    }

    const pts: KinematicsPoint[] = cycloidPts.map((p, idx) => {
      const curT = (tCycloid * idx) / 60;
      const speed = Math.sqrt(2 * g * p.y);
      return {
        t: roundTo(curT, 4),
        x: p.x,
        y: p.y,
        vx: roundTo(speed * 0.707, 3),
        vy: roundTo(speed * 0.707, 3),
        speed: roundTo(speed, 3),
        at: roundTo(g * 0.5, 3),
        an: roundTo(g * 0.5, 3),
        curvatureRadius: roundTo(2 * R, 3),
        kineticEnergy: roundTo(0.5 * m * speed * speed, 4),
        potentialEnergy: roundTo(m * g * (y1 - p.y), 4),
        totalEnergy: roundTo(m * g * y1, 4),
      };
    });

    return {
      mode: "brachistochrone",
      flightTimeS: roundTo(tCycloid, 4),
      maxHeightM: y1,
      rangeM: x1,
      impactSpeedMs: roundTo(Math.sqrt(2 * g * y1), 4),
      vacuumRangeM: x1,
      vacuumMaxHeightM: y1,
      vacuumFlightTimeS: roundTo(tStraight, 4),
      energyLostPct: 0,
      points: pts,
      curves: [
        { label: "Sikloida (Braxistoxrona - Eng tez)", points: cycloidPts },
        { label: "To'g'ri chiziqli qiya ramp", points: straightPts },
        { label: "Doira yoyi", points: circlePts },
        { label: "Parabolik nishab", points: parabolaPts },
      ],
      summary: {
        tCycloidS: roundTo(tCycloid, 4),
        tStraightS: roundTo(tStraight, 4),
        tCircleS: roundTo(tCircle, 4),
        tParabolaS: roundTo(tParabola, 4),
        timeSavedVsStraightPct: roundTo(((tStraight - tCycloid) / tStraight) * 100, 2),
        cycloidRadiusM: roundTo(R, 4),
        cycloidTheta1Rad: roundTo(theta, 4),
        impactSpeedMs: roundTo(Math.sqrt(2 * g * y1), 4),
      },
    };
  }

  // =========================================================================
  // SUBMODE: KEPLERIAN ORBITAL MECHANICS
  // =========================================================================
  if (input.mode === "kepler_orbit") {
    const M_central = Math.max(1e20, input.centralMassKg ?? 1.989e30); // Sun default
    const mu = CODATA.G * (M_central + m);
    const a = Math.max(1e6, input.orbitSemiMajorAxisM ?? 1.496e11); // 1 AU default
    const e = Math.min(0.96, Math.max(0, input.orbitEccentricity ?? 0.25));

    // Period T = 2 * pi * sqrt(a^3 / mu)
    const T_orbitS = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
    const rPeriapsis = a * (1 - e);
    const rApoapsis = a * (1 + e);
    const vPeriapsis = Math.sqrt((mu * (1 + e)) / (a * (1 - e)));
    const vApoapsis = Math.sqrt((mu * (1 - e)) / (a * (1 + e)));
    const specificEnergy = -mu / (2 * a);
    const specificAngularMomentum = Math.sqrt(mu * a * (1 - e * e));

    const orbitPts: { x: number; y: number }[] = [];
    const speedPts: { x: number; y: number }[] = [];
    const numOrbitSteps = 100;

    for (let i = 0; i <= numOrbitSteps; i++) {
      // Mean anomaly M(t) = 2*pi * t / T
      const M_anom = (2 * Math.PI * i) / numOrbitSteps;
      // Solve Kepler's equation M = E - e * sin(E)
      let E_anom = M_anom;
      for (let iter = 0; iter < 10; iter++) {
        const deltaE = (E_anom - e * Math.sin(E_anom) - M_anom) / (1 - e * Math.cos(E_anom));
        E_anom -= deltaE;
        if (Math.abs(deltaE) < 1e-7) break;
      }
      // True anomaly theta
      const cosTheta = (Math.cos(E_anom) - e) / (1 - e * Math.cos(E_anom));
      const sinTheta = (Math.sqrt(1 - e * e) * Math.sin(E_anom)) / (1 - e * Math.cos(E_anom));
      const r_inst = a * (1 - e * Math.cos(E_anom));
      const xOrb = r_inst * cosTheta;
      const yOrb = r_inst * sinTheta;
      const v_inst = Math.sqrt(mu * (2 / r_inst - 1 / a));

      orbitPts.push({ x: roundTo(xOrb / 1e9, 3), y: roundTo(yOrb / 1e9, 3) }); // millions km
      speedPts.push({ x: roundTo((T_orbitS * i) / numOrbitSteps / 86400, 2), y: roundTo(v_inst / 1000, 2) });
    }

    const pts: KinematicsPoint[] = speedPts.map((sp, idx) => ({
      t: sp.x,
      x: orbitPts[idx].x,
      y: orbitPts[idx].y,
      vx: 0,
      vy: 0,
      speed: sp.y,
      at: 0,
      an: 0,
      curvatureRadius: 0,
      kineticEnergy: 0.5 * m * Math.pow(sp.y * 1000, 2),
      potentialEnergy: -mu * m / Math.max(1, orbitPts[idx].x * 1e9),
      totalEnergy: specificEnergy * m,
    }));

    return {
      mode: "kepler_orbit",
      flightTimeS: roundTo(T_orbitS, 2),
      maxHeightM: roundTo(rApoapsis, 0),
      rangeM: roundTo(2 * a, 0),
      impactSpeedMs: roundTo(vPeriapsis, 2),
      vacuumRangeM: roundTo(rPeriapsis, 0),
      vacuumMaxHeightM: roundTo(rApoapsis, 0),
      vacuumFlightTimeS: roundTo(T_orbitS / 86400, 2),
      energyLostPct: 0,
      points: pts,
      curves: [{ label: "Orbita y(x) [mln km]", points: orbitPts }],
      summary: {
        orbitalPeriodDays: roundTo(T_orbitS / 86400, 2),
        semiMajorAxisKm: roundTo(a / 1000, 1),
        eccentricity: roundTo(e, 4),
        periapsisDistanceKm: roundTo(rPeriapsis / 1000, 1),
        apoapsisDistanceKm: roundTo(rApoapsis / 1000, 1),
        maxVelocityKmS: roundTo(vPeriapsis / 1000, 2),
        minVelocityKmS: roundTo(vApoapsis / 1000, 2),
        specificAngularMomentumM2S: roundTo(specificAngularMomentum, 3),
        totalOrbitalEnergyJ: roundTo(specificEnergy * m, 3),
      },
    };
  }

  // =========================================================================
  // SUBMODE: RELATIVISTIC KINEMATICS & LORENTZ BOOST
  // =========================================================================
  if (input.mode === "relativistic_kinematics") {
    const c = CODATA.c;
    const v = Math.min(0.99999 * c, Math.max(10, input.relativisticSpeedMs ?? 0.85 * c));
    const beta = v / c;
    const gamma = 1 / Math.sqrt(1 - beta * beta);

    const restMassKg = m;
    const pRel = gamma * restMassKg * v;
    const totalEnergyJ = gamma * restMassKg * c * c;
    const kineticEnergyJ = (gamma - 1) * restMassKg * c * c;
    const kineticClassicJ = 0.5 * restMassKg * v * v;
    const relativisticDiscrepancyPct = ((kineticEnergyJ - kineticClassicJ) / kineticClassicJ) * 100;

    // Proper lifetime and dilated lifetime (e.g. muon)
    const tau0 = Math.max(0.1, input.properLifetimeNs ?? 2197); // 2.197 us default muon
    const dilatedLifetimeNs = gamma * tau0;
    const decayDistanceKm = (v * (dilatedLifetimeNs * 1e-9)) / 1000;

    // Relativistic Doppler
    const f0 = Math.max(1, input.sourceFrequencyHz ?? 5e14); // 500 THz green light
    const fApproaching = f0 * Math.sqrt((1 + beta) / (1 - beta));
    const fReceding = f0 * Math.sqrt((1 - beta) / (1 + beta));
    const fTransverse = f0 * Math.sqrt(1 - beta * beta);

    const gammaCurve: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const bTest = (0.995 * i) / 60;
      const gTest = 1 / Math.sqrt(1 - bTest * bTest);
      gammaCurve.push({ x: roundTo(bTest, 3), y: roundTo(gTest, 3) });
    }

    return {
      mode: "relativistic_kinematics",
      flightTimeS: roundTo(dilatedLifetimeNs * 1e-9, 9),
      maxHeightM: roundTo(decayDistanceKm * 1000, 2),
      rangeM: roundTo(decayDistanceKm * 1000, 2),
      impactSpeedMs: roundTo(v, 2),
      vacuumRangeM: roundTo((v * tau0 * 1e-9), 2),
      vacuumMaxHeightM: roundTo(decayDistanceKm * 1000, 2),
      vacuumFlightTimeS: roundTo(tau0 * 1e-9, 9),
      energyLostPct: 0,
      points: [
        {
          t: roundTo(dilatedLifetimeNs * 1e-9, 9),
          x: roundTo(decayDistanceKm * 1000, 2),
          y: 0,
          vx: v,
          vy: 0,
          speed: v,
          at: 0,
          an: 0,
          curvatureRadius: 0,
          kineticEnergy: kineticEnergyJ,
          potentialEnergy: 0,
          totalEnergy: totalEnergyJ,
        },
      ],
      curves: [{ label: "Lorens omili gamma(beta)", points: gammaCurve }],
      summary: {
        speedMs: roundTo(v, 2),
        speedFractionC: roundTo(beta, 5),
        lorentzFactorGamma: roundTo(gamma, 4),
        relativisticMomentumKgMs: roundTo(pRel, 4),
        totalRelativisticEnergyJ: roundTo(totalEnergyJ, 3),
        relativisticKineticEnergyJ: roundTo(kineticEnergyJ, 3),
        classicalKineticEnergyJ: roundTo(kineticClassicJ, 3),
        relativisticDiscrepancyPct: roundTo(relativisticDiscrepancyPct, 2),
        dilatedLifetimeNs: roundTo(dilatedLifetimeNs, 2),
        flightDistanceKm: roundTo(decayDistanceKm, 2),
        dopplerApproachingHz: roundTo(fApproaching, 0),
        dopplerRecedingHz: roundTo(fReceding, 0),
        dopplerTransverseHz: roundTo(fTransverse, 0),
      },
    };
  }

  // =========================================================================
  // SUBMODE: AIR TRACK (LINEAR 1D MOTION)
  // =========================================================================
  if (input.mode === "air_track") {
    const dur = Math.max(0.1, input.durationS ?? 10.0);
    const ax = input.accelX ?? 0;
    const v0x = input.v0 ?? 0;
    const steps = 80;
    const dt = dur / steps;
    const pts: KinematicsPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const x = v0x * t + 0.5 * ax * t * t;
      const vx = v0x + ax * t;
      const speed = Math.abs(vx);
      const k = 0.5 * m * speed * speed;
      pts.push({
        t: roundTo(t, 4),
        x: roundTo(x, 4),
        y: 0,
        vx: roundTo(vx, 4),
        vy: 0,
        speed: roundTo(speed, 4),
        at: roundTo(ax, 4),
        an: 0,
        curvatureRadius: 0,
        kineticEnergy: roundTo(k, 4),
        potentialEnergy: 0,
        totalEnergy: roundTo(k, 4),
      });
    }

    const finalPt = pts[pts.length - 1];
    return {
      mode: "air_track",
      flightTimeS: dur,
      maxHeightM: 0,
      rangeM: finalPt.x,
      impactSpeedMs: finalPt.speed,
      vacuumRangeM: finalPt.x,
      vacuumMaxHeightM: 0,
      vacuumFlightTimeS: dur,
      energyLostPct: 0,
      points: pts,
      summary: {
        flightTimeS: dur,
        distanceM: finalPt.x,
        finalSpeedMs: finalPt.speed,
        accelMs2: ax,
        initialSpeedMs: v0x,
      },
    };
  }

  // =========================================================================
  // SUBMODE: CIRCULAR MOTION
  // =========================================================================
  if (input.mode === "circular") {
    const R = Math.max(0.1, input.radiusM ?? 2.0);
    const omega0 = input.angularSpeedRadS ?? 3.0;
    const alpha = input.angularAccelRadS2 ?? 0;
    const dur = Math.max(0.5, input.durationS ?? 6.0);
    const steps = 80;
    const dt = dur / steps;
    const pts: KinematicsPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const omega = omega0 + alpha * t;
      const theta = omega0 * t + 0.5 * alpha * t * t;
      const x = R * Math.cos(theta);
      const y = R * Math.sin(theta);
      const speed = Math.abs(omega) * R;
      const vx = -R * omega * Math.sin(theta);
      const vy = R * omega * Math.cos(theta);
      const at = alpha * R;
      const an = (speed * speed) / R;
      const k = 0.5 * m * speed * speed;
      pts.push({
        t: roundTo(t, 3),
        x: roundTo(x, 4),
        y: roundTo(y, 4),
        vx: roundTo(vx, 4),
        vy: roundTo(vy, 4),
        speed: roundTo(speed, 4),
        at: roundTo(at, 4),
        an: roundTo(an, 4),
        curvatureRadius: R,
        kineticEnergy: roundTo(k, 4),
        potentialEnergy: 0,
        totalEnergy: roundTo(k, 4),
      });
    }

    const last = pts[pts.length - 1];
    return {
      mode: "circular",
      flightTimeS: dur,
      maxHeightM: R,
      rangeM: roundTo(2 * Math.PI * R, 3),
      impactSpeedMs: last.speed,
      vacuumRangeM: roundTo(2 * Math.PI * R, 3),
      vacuumMaxHeightM: R,
      vacuumFlightTimeS: dur,
      energyLostPct: 0,
      points: pts,
      summary: {
        radiusM: R,
        finalAngularSpeedRadS: roundTo(omega0 + alpha * dur, 4),
        centripetalAccelerationMs2: roundTo(last.an, 4),
        tangentialAccelerationMs2: roundTo(last.at, 4),
        totalRotations: roundTo((omega0 * dur + 0.5 * alpha * dur * dur) / (2 * Math.PI), 3),
      },
    };
  }

  // =========================================================================
  // SUBMODE: RELATIVE MOTION
  // =========================================================================
  if (input.mode === "relative") {
    const vxRel = input.vRelXMs ?? 15.0;
    const vyRel = input.vRelYMs ?? 5.0;
    const vObjX = input.v0 ?? 25.0;
    const vObjY = 0;
    const dur = Math.max(0.5, input.durationS ?? 5.0);
    const steps = 60;
    const dt = dur / steps;
    const pts: KinematicsPoint[] = [];

    const vTotalX = vObjX - vxRel;
    const vTotalY = vObjY - vyRel;
    const speed = Math.hypot(vTotalX, vTotalY);

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const x = vTotalX * t;
      const y = vTotalY * t;
      const k = 0.5 * m * speed * speed;
      pts.push({
        t: roundTo(t, 3),
        x: roundTo(x, 4),
        y: roundTo(y, 4),
        vx: roundTo(vTotalX, 4),
        vy: roundTo(vTotalY, 4),
        speed: roundTo(speed, 4),
        at: 0,
        an: 0,
        curvatureRadius: 1e6,
        kineticEnergy: roundTo(k, 4),
        potentialEnergy: 0,
        totalEnergy: roundTo(k, 4),
      });
    }

    return {
      mode: "relative",
      flightTimeS: dur,
      maxHeightM: Math.abs(roundTo(vTotalY * dur, 4)),
      rangeM: roundTo(vTotalX * dur, 4),
      impactSpeedMs: roundTo(speed, 4),
      vacuumRangeM: roundTo(vTotalX * dur, 4),
      vacuumMaxHeightM: Math.abs(roundTo(vTotalY * dur, 4)),
      vacuumFlightTimeS: dur,
      energyLostPct: 0,
      points: pts,
      summary: {
        relativeSpeedMs: roundTo(speed, 4),
        relativeHeadingDeg: roundTo(((radToDeg(Math.atan2(vTotalY, vTotalX)) % 360) + 360) % 360, 2),
      },
    };
  }

  // =========================================================================
  // SUBMODE: ROCKET EQUATION (TSIOLKOVSKY)
  // =========================================================================
  if (input.mode === "rocket") {
    const ve = Math.max(10, input.exhaustSpeedMs ?? 2800);
    const m0 = Math.max(1, input.initialMassKg ?? 1000);
    const mf = Math.min(m0, Math.max(1, input.finalMassKg ?? 250));
    const dur = Math.max(0.5, input.durationS ?? 50);

    const deltaV = ve * Math.log(m0 / mf);
    const massFlowRate = (m0 - mf) / dur;
    const thrustN = massFlowRate * ve;

    const steps = 80;
    const dt = dur / steps;
    const pts: KinematicsPoint[] = [];
    let curY = 0;
    let curV = 0;

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const curM = m0 - massFlowRate * t;
      const aNet = massFlowRate > 0 ? thrustN / curM - g : -g;
      const k = 0.5 * curM * curV * curV;
      const u = curM * g * curY;
      pts.push({
        t: roundTo(t, 3),
        x: 0,
        y: roundTo(curY, 3),
        vx: 0,
        vy: roundTo(curV, 3),
        speed: roundTo(Math.abs(curV), 3),
        at: roundTo(aNet, 3),
        an: 0,
        curvatureRadius: 1e6,
        kineticEnergy: roundTo(k, 3),
        potentialEnergy: roundTo(u, 3),
        totalEnergy: roundTo(k + u, 3),
      });

      curV += aNet * dt;
      curY += curV * dt;
      if (curY < 0 && i > 0) {
        curY = 0;
        curV = 0;
      }
    }

    const last = pts[pts.length - 1];
    return {
      mode: "rocket",
      flightTimeS: dur,
      maxHeightM: last.y,
      rangeM: 0,
      impactSpeedMs: last.speed,
      vacuumRangeM: 0,
      vacuumMaxHeightM: last.y,
      vacuumFlightTimeS: dur,
      energyLostPct: 0,
      points: pts,
      summary: {
        idealTsiolkovskyDeltaVMs: roundTo(deltaV, 3),
        burnDurationS: dur,
        massRatioM0ToMf: roundTo(m0 / mf, 3),
        thrustN: roundTo(thrustN, 1),
        payloadFractionPct: roundTo((mf / m0) * 100, 2),
      },
    };
  }

  // =========================================================================
  // SUBMODE: BALLISTIC TRAJECTORY (PROJECTILE / FREEFALL / ATMOSPHERIC)
  // =========================================================================
  const angleDeg = Math.min(90, Math.max(0, input.angleDeg ?? 45));
  const rad = degToRad(angleDeg);
  const vx0 = v0 * Math.cos(rad);
  const vy0 = v0 * Math.sin(rad);

  const dragEnabled = Boolean(input.airDrag || input.airResistance);
  const Cd = Math.max(0.01, input.dragCoeff ?? 0.47);
  const area = Math.max(1e-5, input.areaM2 ?? 0.05);
  const rho0 = Math.max(0.01, input.airDensity ?? 1.225);
  const H0 = 8500; // Atmospheric scale height (m)

  // Vacuum analytical benchmark
  const discr = vy0 * vy0 + 2 * g * y0;
  const vacuumFlightTimeS = (vy0 + Math.sqrt(Math.max(0, discr))) / g;
  const vacuumRangeM = vx0 * vacuumFlightTimeS;
  const vacuumMaxHeightM = y0 + (vy0 * vy0) / (2 * g);

  // RK4 Integration for Ballistics
  const dtEst = Math.min(0.05, Math.max(0.001, vacuumFlightTimeS / 200 || 0.01));
  const dt = dtEst;
  const maxSteps = 4000;

  type State = [number, number, number, number]; // [x, y, vx, vy]
  let state: State = [0, y0, vx0, vy0];
  let t = 0;

  const rawPoints: KinematicsPoint[] = [];

  const deriv = (_tCur: number, s: State): State => {
    const yCur = Math.max(0, s[1]);
    const vxCur = s[2];
    const vyCur = s[3];
    const speed = Math.hypot(vxCur, vyCur);

    let ax = 0;
    let ay = -g;

    if (dragEnabled && speed > 1e-9) {
      // Exponential barometric density: rho(y) = rho0 * exp(-y / H0)
      const rho = rho0 * Math.exp(-yCur / H0);
      const Fd = 0.5 * Cd * rho * area * speed * speed;
      ax -= (Fd * (vxCur / speed)) / m;
      ay -= (Fd * (vyCur / speed)) / m;
    }

    return [vxCur, vyCur, ax, ay];
  };

  const pushPoint = (curT: number, s: State) => {
    const x = s[0];
    const y = s[1];
    const vx = s[2];
    const vy = s[3];
    const speed = Math.hypot(vx, vy);
    const d = deriv(curT, s);
    const ax = d[2];
    const ay = d[3];

    const at = speed > 1e-6 ? (vx * ax + vy * ay) / speed : 0;
    const anVec = Math.hypot(ax - (at * vx) / Math.max(1e-6, speed), ay - (at * vy) / Math.max(1e-6, speed));
    const an = anVec;
    const curvatureRadius = an > 1e-6 ? (speed * speed) / an : 1e6;

    const K = 0.5 * m * speed * speed;
    const U = m * g * y;

    rawPoints.push({
      t: roundTo(curT, 4),
      x: roundTo(x, 4),
      y: roundTo(y, 4),
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
    const s2: State = [
      state[0] + 0.5 * dt * k1[0],
      state[1] + 0.5 * dt * k1[1],
      state[2] + 0.5 * dt * k1[2],
      state[3] + 0.5 * dt * k1[3],
    ];
    const k2 = deriv(t + 0.5 * dt, s2);
    const s3: State = [
      state[0] + 0.5 * dt * k2[0],
      state[1] + 0.5 * dt * k2[1],
      state[2] + 0.5 * dt * k2[2],
      state[3] + 0.5 * dt * k2[3],
    ];
    const k3 = deriv(t + 0.5 * dt, s3);
    const s4: State = [
      state[0] + dt * k3[0],
      state[1] + dt * k3[1],
      state[2] + dt * k3[2],
      state[3] + dt * k3[3],
    ];
    const k4 = deriv(t + dt, s4);

    const next: State = [
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
      const impState: State = [
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
    summary: {
      flightTimeS: last.t,
      maxHeightM: roundTo(maxH, 4),
      rangeM: last.x,
      impactSpeedMs: last.speed,
      vacuumRangeM: roundTo(vacuumRangeM, 4),
      vacuumMaxHeightM: roundTo(vacuumMaxHeightM, 4),
      vacuumFlightTimeS: roundTo(vacuumFlightTimeS, 4),
      energyLostPct: roundTo(energyLostPct, 3),
    },
  };
}
