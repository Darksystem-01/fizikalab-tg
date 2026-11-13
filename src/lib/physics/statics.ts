import { CODATA, degToRad, radToDeg, roundTo } from "./constants";

export interface ForceVector {
  label: string;
  magnitudeN: number;
  angleDeg: number;
}

export interface BeamLoad {
  label: string;
  positionM: number;
  massKg: number;
}

export interface StaticsInput {
  subMode:
    | "force_table"
    | "beam_moments"
    | "pulley_wheel"
    | "buoyancy"
    | "ladder_friction"
    | "truss";
  forces?: ForceVector[];
  beamLengthM?: number;
  beamMassKg?: number;
  supportAM?: number;
  supportBM?: number;
  loads?: BeamLoad[];
  loadMassKg?: number;
  appliedForceN?: number;
  pulleyStrands?: number;
  wheelRadiusM?: number;
  axleRadiusM?: number;
  mechanismType?: "pulley" | "wheel_axle";
  // Buoyancy
  bodyMassKg?: number;
  bodyVolumeM3?: number;
  fluidDensityKgM3?: number;
  // Ladder friction
  ladderLengthM?: number;
  ladderMassKg?: number;
  muFloor?: number;
  muWall?: number;
  ladderAngleDeg?: number;
  // Truss
  trussSpanM?: number;
  trussHeightM?: number;
  trussLoadN?: number;
}

export interface StaticsResult {
  subMode: string;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
}

export function simulateStatics(input: StaticsInput): StaticsResult {
  if (input.subMode === "force_table") {
    const forces = (input.forces ?? []).slice(0, 6);
    let rx = 0;
    let ry = 0;
    const components = forces.map((f) => {
      const rad = degToRad(f.angleDeg);
      const fx = f.magnitudeN * Math.cos(rad);
      const fy = f.magnitudeN * Math.sin(rad);
      rx += fx;
      ry += fy;
      return {
        label: f.label,
        magnitudeN: roundTo(f.magnitudeN, 4),
        angleDeg: roundTo(f.angleDeg, 2),
        fx: roundTo(fx, 4),
        fy: roundTo(fy, 4),
      };
    });

    const resultantMag = Math.hypot(rx, ry);
    const resultantAngle = ((radToDeg(Math.atan2(ry, rx)) % 360) + 360) % 360;
    const equilibrantAngle = (resultantAngle + 180) % 360;
    const inEquilibrium = resultantMag < 0.05;

    return {
      subMode: "force_table",
      summary: {
        sumFxN: roundTo(rx, 4),
        sumFyN: roundTo(ry, 4),
        resultantMagnitudeN: roundTo(resultantMag, 4),
        resultantAngleDeg: roundTo(resultantAngle, 2),
        equilibrantMagnitudeN: roundTo(resultantMag, 4),
        equilibrantAngleDeg: roundTo(equilibrantAngle, 2),
        inEquilibrium,
      },
      details: { components },
    };
  }

  if (input.subMode === "beam_moments") {
    const L = Math.max(0.5, input.beamLengthM ?? 4.0);
    const Mb = Math.max(0, input.beamMassKg ?? 10);
    const xA = Math.min(L, Math.max(0, input.supportAM ?? 0.5));
    const xB = Math.min(L, Math.max(xA + 0.1, input.supportBM ?? 3.5));
    const loads = (input.loads ?? []).map((ld) => ({
      label: ld.label,
      positionM: Math.min(L, Math.max(0, ld.positionM)),
      forceN: Math.max(0, ld.massKg) * CODATA.g,
    }));

    const beamWeightN = Mb * CODATA.g;
    const beamCenterM = L / 2;

    let momentAboutA = beamWeightN * (beamCenterM - xA);
    let totalDownForce = beamWeightN;
    for (const ld of loads) {
      momentAboutA += ld.forceN * (ld.positionM - xA);
      totalDownForce += ld.forceN;
    }

    const rB = momentAboutA / (xB - xA);
    const rA = totalDownForce - rB;
    const stable = rA >= -1e-4 && rB >= -1e-4;

    const sampleN = 80;
    const shearSeries: { x: number; y: number }[] = [];
    const momentSeries: { x: number; y: number }[] = [];
    for (let i = 0; i <= sampleN; i++) {
      const x = (L * i) / sampleN;
      let V = 0;
      let M = 0;
      if (x >= xA) {
        V += rA;
        M += rA * (x - xA);
      }
      if (x >= xB) {
        V += rB;
        M += rB * (x - xB);
      }
      const wDist = beamWeightN / L;
      V -= wDist * x;
      M -= 0.5 * wDist * x * x;

      for (const ld of loads) {
        if (x >= ld.positionM) {
          V -= ld.forceN;
          M -= ld.forceN * (x - ld.positionM);
        }
      }
      shearSeries.push({ x: roundTo(x, 4), y: roundTo(V, 3) });
      momentSeries.push({ x: roundTo(x, 4), y: roundTo(M, 3) });
    }

    const maxBendingMomentNm = momentSeries.reduce(
      (m, p) => Math.max(m, Math.abs(p.y)),
      0
    );

    return {
      subMode: "beam_moments",
      summary: {
        reactionAN: roundTo(rA, 3),
        reactionBN: roundTo(rB, 3),
        totalLoadN: roundTo(totalDownForce, 3),
        maxBendingMomentNm: roundTo(maxBendingMomentNm, 3),
        stable,
      },
      details: {
        shearSeries,
        momentSeries,
        xA,
        xB,
        L,
        loads,
      },
    };
  }

  if (input.subMode === "buoyancy") {
    const mBody = Math.max(0.01, input.bodyMassKg ?? 5.0);
    const vBody = Math.max(1e-6, input.bodyVolumeM3 ?? 0.008);
    const rhoFluid = Math.max(10, input.fluidDensityKgM3 ?? 1000); // water = 1000 kg/m^3
    const rhoBody = mBody / vBody;

    const gravityForceN = mBody * CODATA.g;
    const maxBuoyancyN = rhoFluid * CODATA.g * vBody;
    const isFloating = rhoBody < rhoFluid;
    const submergedFraction = Math.min(1.0, rhoBody / rhoFluid);
    const actualBuoyancyN = isFloating ? gravityForceN : maxBuoyancyN;
    const apparentWeightN = Math.max(0, gravityForceN - actualBuoyancyN);

    return {
      subMode: "buoyancy",
      summary: {
        bodyMassKg: roundTo(mBody, 3),
        bodyVolumeLiters: roundTo(vBody * 1000, 3),
        bodyDensityKgM3: roundTo(rhoBody, 1),
        fluidDensityKgM3: roundTo(rhoFluid, 1),
        gravityForceN: roundTo(gravityForceN, 3),
        buoyancyForceN: roundTo(actualBuoyancyN, 3),
        apparentWeightN: roundTo(apparentWeightN, 3),
        submergedVolumePct: roundTo(submergedFraction * 100, 2),
        isFloating,
      },
      details: {},
    };
  }

  if (input.subMode === "ladder_friction") {
    const L = Math.max(0.5, input.ladderLengthM ?? 4.0);
    const m = Math.max(1, input.ladderMassKg ?? 15.0);
    const muF = Math.max(0.01, input.muFloor ?? 0.4);
    const muW = Math.max(0, input.muWall ?? 0.0);
    const thetaDeg = Math.min(89, Math.max(1, input.ladderAngleDeg ?? 60));
    const thetaRad = degToRad(thetaDeg);

    // Critical minimum angle before slip: tan(theta_c) = (1 - muF * muW) / (2 * muF)
    const tanThetaC = (1 - muF * muW) / (2 * muF);
    const criticalAngleDeg = radToDeg(Math.atan(tanThetaC));
    const isStable = thetaDeg >= criticalAngleDeg;

    const weightN = m * CODATA.g;
    // Normal at wall: N_w = (m * g * cos(theta)) / (2 * sin(theta)) = (m*g) / (2 * tan(theta))
    const normalWallN = weightN / (2 * Math.tan(thetaRad));
    const normalFloorN = weightN;
    const frictionFloorN = normalWallN;
    const maxFloorFrictionN = muF * normalFloorN;

    return {
      subMode: "ladder_friction",
      summary: {
        ladderLengthM: roundTo(L, 2),
        ladderMassKg: roundTo(m, 1),
        ladderAngleDeg: roundTo(thetaDeg, 1),
        criticalAngleDeg: roundTo(criticalAngleDeg, 2),
        isStable,
        floorFrictionN: roundTo(frictionFloorN, 3),
        maxFloorFrictionN: roundTo(maxFloorFrictionN, 3),
        wallNormalForceN: roundTo(normalWallN, 3),
      },
      details: {},
    };
  }

  if (input.subMode === "truss") {
    const span = Math.max(1, input.trussSpanM ?? 6.0);
    const height = Math.max(0.5, input.trussHeightM ?? 2.5);
    const loadN = Math.max(10, input.trussLoadN ?? 5000);

    // Symmetric equilateral/triangular truss with central vertical load at apex
    const reactionA = loadN / 2;
    const reactionB = loadN / 2;
    const memberAngleRad = Math.atan(height / (span / 2));
    const memberAngleDeg = radToDeg(memberAngleRad);

    // Method of joints:
    // Joint A: N_bottom + N_top * cos(theta) = 0, R_A + N_top * sin(theta) = 0
    // -> N_top = -R_A / sin(theta) (compression)
    // -> N_bottom = -N_top * cos(theta) = R_A / tan(theta) (tension)
    const compressionTopChordN = reactionA / Math.sin(memberAngleRad);
    const tensionBottomChordN = reactionA / Math.tan(memberAngleRad);

    return {
      subMode: "truss",
      summary: {
        trussSpanM: roundTo(span, 2),
        trussHeightM: roundTo(height, 2),
        apexLoadN: roundTo(loadN, 1),
        reactionAN: roundTo(reactionA, 1),
        reactionBN: roundTo(reactionB, 1),
        chordAngleDeg: roundTo(memberAngleDeg, 2),
        topChordCompressionN: roundTo(compressionTopChordN, 2),
        bottomChordTensionN: roundTo(tensionBottomChordN, 2),
      },
      details: {},
    };
  }

  const loadMass = Math.max(0.1, input.loadMassKg ?? 10);
  const loadForceN = loadMass * CODATA.g;
  const mechanismType = input.mechanismType ?? "pulley";
  const ima =
    mechanismType === "pulley"
      ? Math.max(1, Math.round(input.pulleyStrands ?? 4))
      : Math.max(0.1, (input.wheelRadiusM ?? 0.3) / Math.max(0.01, input.axleRadiusM ?? 0.05));

  const idealEffortN = loadForceN / ima;
  const appliedForceN = Math.max(0.1, input.appliedForceN ?? idealEffortN * 1.15);
  const ama = loadForceN / appliedForceN;
  const efficiencyPct = Math.min(100, (ama / ima) * 100);

  return {
    subMode: "pulley_wheel",
    summary: {
      mechanismType,
      loadForceN: roundTo(loadForceN, 3),
      idealEffortN: roundTo(idealEffortN, 3),
      actualEffortN: roundTo(appliedForceN, 3),
      idealMechanicalAdvantage: roundTo(ima, 3),
      actualMechanicalAdvantage: roundTo(ama, 3),
      efficiencyPct: roundTo(efficiencyPct, 2),
      canLift: appliedForceN >= idealEffortN,
    },
    details: {},
  };
}
