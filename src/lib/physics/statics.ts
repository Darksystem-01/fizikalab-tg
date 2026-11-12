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
  subMode: "force_table" | "beam_moments" | "pulley_wheel";
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
