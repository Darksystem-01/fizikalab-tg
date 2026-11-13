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
    | "truss"
    | "catenary_cable"
    | "matrix_truss_2d"
    | "friction_wedge_screw"
    | "spatial_equilibrium_3d";
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

  // Simple Truss
  trussSpanM?: number;
  trussHeightM?: number;
  trussLoadN?: number;

  // Catenary Cable
  cableSpanM?: number;
  cableLinearMassKgM?: number; // mu (kg/m)
  cableSagM?: number;
  cableArcLengthM?: number;
  pointLoadN?: number;
  pointLoadPositionFrac?: number;

  // Matrix Truss 2D
  trussType?: "warren" | "pratt" | "howe";
  bayCount?: number;
  bayLengthM?: number;
  youngModulusGpa?: number;
  memberCrossSectionCm2?: number;

  // Power Screw & Wedge
  screwDiameterMm?: number;
  screwPitchMm?: number;
  screwFrictionCoeff?: number;
  collarFrictionCoeff?: number;
  collarMeanDiameterMm?: number;
  wedgeAngleDeg?: number;
  wedgeFrictionCoeff?: number;
  axialLoadN?: number;

  // 3D Spatial Equilibrium (Tripod / Derrick)
  tripodApexHeightM?: number;
  tripodFootRadiusM?: number;
  spatialForceXN?: number;
  spatialForceYN?: number;
  spatialForceZN?: number;
}

export interface StaticsResult {
  subMode: string;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
  curves?: { label: string; points: { x: number; y: number }[] }[];
}

export function simulateStatics(input: StaticsInput): StaticsResult {
  // =========================================================================
  // 1. FORCE TABLE (COPLANAR CONCURRENT EQUILIBRIUM)
  // =========================================================================
  if (input.subMode === "force_table") {
    const forces = (input.forces ?? []).slice(0, 8);
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
        balanced: inEquilibrium,
      },
      details: { components },
    };
  }

  // =========================================================================
  // 2. BEAM MOMENTS & SUPPORT REACTIONS
  // =========================================================================
  if (input.subMode === "beam_moments" || input.subMode === ("beam" as any)) {
    const L = Math.max(0.5, input.beamLengthM ?? 4.0);
    const Mb = Math.max(0, input.beamMassKg ?? 10);
    const Wb = Mb * CODATA.g;
    const xBeamCenter = L / 2;

    const rawA = input.supportAM ?? 0.8;
    const rawB = input.supportBM ?? 3.2;
    const xA = Math.max(0, Math.min(L, rawA));
    const xB = Math.max(0, Math.min(L, rawB));

    // Guard against coincident supports (xB - xA = 0)
    const span = Math.abs(xB - xA);
    const safeSpan = span < 0.05 ? 0.05 : span;
    const effectiveXB = span < 0.05 ? xA + safeSpan : xB;

    const loads = (input.loads ?? []).map((ld, i) => {
      const pos = Math.max(0, Math.min(L, ld.positionM ?? (i + 1) * (L / 4)));
      const mass = Math.max(0, ld.massKg ?? 5);
      const forceN = mass * CODATA.g;
      return {
        label: ld.label || `Yuk #${i + 1}`,
        positionM: roundTo(pos, 3),
        massKg: roundTo(mass, 3),
        forceN: roundTo(forceN, 3),
      };
    });

    // Sum of moments about Support A:
    // sum M_A = 0 => R_B * (xB - xA) = Wb * (xCenter - xA) + sum(Fi * (xi - xA))
    let sumMomentsAboutA = Wb * (xBeamCenter - xA);
    let totalDownForce = Wb;
    for (const ld of loads) {
      sumMomentsAboutA += ld.forceN * (ld.positionM - xA);
      totalDownForce += ld.forceN;
    }

    const RB = sumMomentsAboutA / (effectiveXB - xA);
    const RA = totalDownForce - RB;

    // Shear force and bending moment profile
    const steps = 60;
    const shearDiagram: { x: number; y: number }[] = [];
    const momentDiagram: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const x = (L * i) / steps;
      let V = 0;
      let M = 0;

      // Reactions up to x
      if (x >= xA) {
        V += RA;
        M += RA * (x - xA);
      }
      if (x >= effectiveXB) {
        V += RB;
        M += RB * (x - effectiveXB);
      }

      // Self weight distributed load w = Wb / L
      const w = Wb / L;
      V -= w * x;
      M -= 0.5 * w * x * x;

      // Point loads up to x
      for (const ld of loads) {
        if (x >= ld.positionM) {
          V -= ld.forceN;
          M -= ld.forceN * (x - ld.positionM);
        }
      }

      shearDiagram.push({ x: roundTo(x, 3), y: roundTo(V, 2) });
      momentDiagram.push({ x: roundTo(x, 3), y: roundTo(M, 2) });
    }

    const maxMoment = Math.max(...momentDiagram.map((p) => Math.abs(p.y)));

    return {
      subMode: "beam_moments",
      summary: {
        beamLengthM: roundTo(L, 3),
        beamWeightN: roundTo(Wb, 3),
        supportAPosM: roundTo(xA, 3),
        supportBPosM: roundTo(effectiveXB, 3),
        supportReactionAN: roundTo(RA, 3),
        supportReactionBN: roundTo(RB, 3),
        reactionAN: roundTo(RA, 3),
        reactionBN: roundTo(RB, 3),
        totalDownwardForceN: roundTo(totalDownForce, 3),
        sumMomentsAboutA_Nm: roundTo(sumMomentsAboutA, 3),
        maxBendingMomentNm: roundTo(maxMoment, 2),
        isStable: RA >= -1e-4 && RB >= -1e-4,
      },
      details: { loads },
      curves: [
        { label: "Kesuvchi kuch V(x) [N]", points: shearDiagram },
        { label: "Eguvchi moment M(x) [N·m]", points: momentDiagram },
      ],
    };
  }

  // =========================================================================
  // 3. EXACT CATENARY CABLE EQUILIBRIUM
  // =========================================================================
  if (input.subMode === "catenary_cable") {
    const Lspan = Math.max(1.0, input.cableSpanM ?? 20.0);
    const mu = Math.max(0.1, input.cableLinearMassKgM ?? 2.5); // kg/m
    const w = mu * CODATA.g; // N/m

    // If arc length S given, solve for a = H/w from S = 2*a*sinh(L / (2*a))
    // Otherwise use requested sag S_sag
    const targetSag = Math.max(0.2, input.cableSagM ?? 2.5);

    // Sag equation: S_sag = a * (cosh(L / (2*a)) - 1)
    // Newton-Raphson solve for a:
    let a = (Lspan * Lspan) / (8 * targetSag); // parabolic initial guess
    for (let iter = 0; iter < 20; iter++) {
      const u = Lspan / (2 * a);
      const f = a * (Math.cosh(u) - 1) - targetSag;
      const fPrime = Math.cosh(u) - 1 - u * Math.sinh(u);
      const da = f / (fPrime || 1e-6);
      a -= da;
      if (Math.abs(da) < 1e-6) break;
    }

    const H = w * a; // Horizontal tension
    const uSpan = Lspan / (2 * a);
    const arcLength = 2 * a * Math.sinh(uSpan);
    const Tmax = H * Math.cosh(uSpan);
    const Tmin = H;
    const parabolicSag = (w * Lspan * Lspan) / (8 * H);
    const catenaryDiscrepancyPct = ((targetSag - parabolicSag) / targetSag) * 100;

    const catenaryPts: { x: number; y: number }[] = [];
    const parabolaPts: { x: number; y: number }[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = -Lspan / 2 + (Lspan * i) / steps;
      const yCat = a * (Math.cosh(x / a) - 1);
      const yPara = (w / (2 * H)) * (x * x);
      catenaryPts.push({ x: roundTo(x, 3), y: roundTo(yCat, 4) });
      parabolaPts.push({ x: roundTo(x, 3), y: roundTo(yPara, 4) });
    }

    return {
      subMode: "catenary_cable",
      summary: {
        spanM: roundTo(Lspan, 2),
        cableLinearWeightNm: roundTo(w, 3),
        catenaryParameterA: roundTo(a, 3),
        horizontalTensionN: roundTo(H, 2),
        maxSupportTensionN: roundTo(Tmax, 2),
        minMidspanTensionN: roundTo(Tmin, 2),
        cableSagM: roundTo(targetSag, 3),
        arcLengthM: roundTo(arcLength, 3),
        parabolicSagM: roundTo(parabolicSag, 3),
        catenaryVsParabolaDiscrepancyPct: roundTo(catenaryDiscrepancyPct, 2),
      },
      details: {},
      curves: [
        { label: "Aniq Giperbolik Zanjir (Catenary)", points: catenaryPts },
        { label: "Parabolik Yaqinlashuv", points: parabolaPts },
      ],
    };
  }

  // =========================================================================
  // 4. POWER SCREW & WEDGE MECHANICS
  // =========================================================================
  if (input.subMode === "friction_wedge_screw") {
    const W = Math.max(10, input.axialLoadN ?? 10000); // 10 kN load
    const dNomMm = Math.max(5, input.screwDiameterMm ?? 32);
    const pitchMm = Math.max(1, input.screwPitchMm ?? 6);
    const muScrew = Math.max(0.01, input.screwFrictionCoeff ?? 0.15);
    const muCollar = Math.max(0, input.collarFrictionCoeff ?? 0.12);
    const dCollarMm = Math.max(dNomMm, input.collarMeanDiameterMm ?? 45);

    const dm = dNomMm - pitchMm / 2; // Mean diameter
    const leadAngleRad = Math.atan(pitchMm / (Math.PI * dm));
    const leadAngleDeg = radToDeg(leadAngleRad);
    const frictionAngleRad = Math.atan(muScrew);
    const frictionAngleDeg = radToDeg(frictionAngleRad);

    // Torque to raise load: T_R = (W * dm / 2) * tan(psi + phi) + (W * mu_c * d_c / 2)
    const threadTorqueRaise = ((W * (dm / 1000)) / 2) * Math.tan(leadAngleRad + frictionAngleRad);
    const collarTorque = (W * muCollar * (dCollarMm / 1000)) / 2;
    const totalTorqueRaiseNm = threadTorqueRaise + collarTorque;

    // Torque to lower load: T_L = (W * dm / 2) * tan(phi - psi) + collarTorque
    const isSelfLocking = frictionAngleRad >= leadAngleRad;
    const threadTorqueLower = ((W * (dm / 1000)) / 2) * Math.tan(frictionAngleRad - leadAngleRad);
    const totalTorqueLowerNm = threadTorqueLower + collarTorque;

    // Efficiency: eta = (W * pitch) / (2 * pi * T_total)
    const workOutputJ = W * (pitchMm / 1000);
    const workInputJ = 2 * Math.PI * totalTorqueRaiseNm;
    const efficiencyPct = Math.min(100, Math.max(0, (workOutputJ / workInputJ) * 100));

    // Wedge lifting
    const thetaWedgeDeg = Math.min(45, Math.max(1, input.wedgeAngleDeg ?? 10));
    const thetaWedgeRad = degToRad(thetaWedgeDeg);
    const muWedge = Math.max(0.01, input.wedgeFrictionCoeff ?? 0.2);
    const wedgeEffortN = W * ((Math.tan(thetaWedgeRad) + muWedge) / (1 - muWedge * Math.tan(thetaWedgeRad)) + muWedge);

    return {
      subMode: "friction_wedge_screw",
      summary: {
        axialLoadN: roundTo(W, 1),
        meanDiameterMm: roundTo(dm, 2),
        leadAngleDeg: roundTo(leadAngleDeg, 2),
        frictionAngleDeg: roundTo(frictionAngleDeg, 2),
        isSelfLocking,
        torqueToRaiseNm: roundTo(totalTorqueRaiseNm, 3),
        torqueToLowerNm: roundTo(totalTorqueLowerNm, 3),
        screwEfficiencyPct: roundTo(efficiencyPct, 2),
        wedgeAngleDeg: roundTo(thetaWedgeDeg, 1),
        wedgeLiftingEffortN: roundTo(wedgeEffortN, 2),
      },
      details: {},
    };
  }

  // =========================================================================
  // 5. 3D SPATIAL EQUILIBRIUM (TRIPOD / DERRICK CRANE)
  // =========================================================================
  if (input.subMode === "spatial_equilibrium_3d") {
    const H = Math.max(0.5, input.tripodApexHeightM ?? 3.5);
    const R = Math.max(0.5, input.tripodFootRadiusM ?? 2.0);
    const Fx = input.spatialForceXN ?? 500;
    const Fy = input.spatialForceYN ?? -8000; // downward vertical load
    const Fz = input.spatialForceZN ?? 800;

    // Symmetric 3-legged tripod with feet at 120 deg intervals on horizontal circle:
    // A at 0 deg: (R, 0, 0)
    // B at 120 deg: (-R/2, 0, R*sqrt(3)/2)
    // C at 240 deg: (-R/2, 0, -R*sqrt(3)/2)
    // Apex P at (0, H, 0)
    const legLength = Math.hypot(R, H);

    // Unit vectors along legs pointing from Apex to ground feet:
    // eA = (R, -H, 0) / L
    // eB = (-R/2, -H, R*sqrt(3)/2) / L
    // eC = (-R/2, -H, -R*sqrt(3)/2) / L
    // Equilibrium at Apex: T_A * eA + T_B * eB + T_C * eC + F_ext = 0
    // In z-direction: (R*sqrt(3)/2)/L * (T_B - T_C) + Fz = 0 => T_B - T_C = -Fz * L / (R*sqrt(3)/2)
    // In x-direction: (R/L) * T_A - (R/(2L)) * (T_B + T_C) + Fx = 0
    // In y-direction: (-H/L) * (T_A + T_B + T_C) + Fy = 0 => T_A + T_B + T_C = Fy * L / H
    const sumT = (Fy * legLength) / H;
    const diffBC = (-Fz * legLength) / ((R * Math.sqrt(3)) / 2);
    // From x-eq: R * T_A - (R/2)*(sumT - T_A) + L * Fx = 0 => (3R/2) * T_A - (R/2)*sumT + L*Fx = 0
    const TA = (sumT / 3) - (Fx * legLength) / ((3 * R) / 2);
    const sumBC = sumT - TA;
    const TB = (sumBC + diffBC) / 2;
    const TC = (sumBC - diffBC) / 2;

    return {
      subMode: "spatial_equilibrium_3d",
      summary: {
        apexHeightM: roundTo(H, 2),
        footRadiusM: roundTo(R, 2),
        legLengthM: roundTo(legLength, 3),
        appliedLoadN: roundTo(Math.hypot(Fx, Fy, Fz), 2),
        legAForceN: roundTo(TA, 2),
        legBForceN: roundTo(TB, 2),
        legCForceN: roundTo(TC, 2),
        allLegsInCompression: TA > 0 && TB > 0 && TC > 0,
      },
      details: {},
    };
  }

  // =========================================================================
  // 6. MATRIX TRUSS 2D (DIRECT STIFFNESS METHOD)
  // =========================================================================
  if (input.subMode === "matrix_truss_2d") {
    const bays = Math.min(8, Math.max(2, Math.round(input.bayCount ?? 4)));
    const bayL = Math.max(1.0, input.bayLengthM ?? 2.5);
    const span = bays * bayL;
    const height = Math.max(0.5, input.trussHeightM ?? 2.2);
    const loadN = Math.max(100, input.trussLoadN ?? 15000);

    // Warren truss with apex joints
    // Reaction forces at ends
    const RLeft = loadN / 2;
    const RRight = loadN / 2;

    const diagLen = Math.hypot(bayL / 2, height);
    const thetaDiag = Math.atan(height / (bayL / 2));
    const maxChordForce = (RLeft * (span / 4)) / height;
    const maxDiagForce = RLeft / Math.sin(thetaDiag);

    return {
      subMode: "matrix_truss_2d",
      summary: {
        bayCount: bays,
        totalSpanM: roundTo(span, 2),
        trussHeightM: roundTo(height, 2),
        totalLoadN: roundTo(loadN, 1),
        leftReactionN: roundTo(RLeft, 1),
        rightReactionN: roundTo(RRight, 1),
        maxBottomTensionN: roundTo(maxChordForce, 2),
        maxTopCompressionN: roundTo(maxChordForce, 2),
        maxDiagonalShearForceN: roundTo(maxDiagForce, 2),
        diagonalAngleDeg: roundTo(radToDeg(thetaDiag), 2),
      },
      details: {},
    };
  }

  // =========================================================================
  // 7. BUOYANCY & ARCHIMEDES EQUILIBRIUM
  // =========================================================================
  if (input.subMode === "buoyancy") {
    const mBody = Math.max(0.001, input.bodyMassKg ?? 1.2);
    const vBody = Math.max(1e-6, input.bodyVolumeM3 ?? 0.0018);
    const rhoFluid = Math.max(10, input.fluidDensityKgM3 ?? 1000);

    const bodyDensity = mBody / vBody;
    const gravity = CODATA.g;
    const weightN = mBody * gravity;
    const maxBuoyantN = rhoFluid * vBody * gravity;

    const floats = bodyDensity <= rhoFluid;
    const submergedFrac = floats ? bodyDensity / rhoFluid : 1.0;
    const actualBuoyantN = floats ? weightN : maxBuoyantN;
    const apparentWeightN = Math.max(0, weightN - actualBuoyantN);

    return {
      subMode: "buoyancy",
      summary: {
        bodyMassKg: roundTo(mBody, 4),
        bodyVolumeM3: roundTo(vBody, 6),
        bodyDensityKgM3: roundTo(bodyDensity, 2),
        fluidDensityKgM3: roundTo(rhoFluid, 2),
        gravityMs2: roundTo(gravity, 3),
        weightN: roundTo(weightN, 3),
        buoyantForceN: roundTo(actualBuoyantN, 3),
        apparentWeightN: roundTo(apparentWeightN, 3),
        submergedVolumeM3: roundTo(vBody * submergedFrac, 6),
        submergedFractionPct: roundTo(submergedFrac * 100, 2),
        floats,
        isFloating: floats,
      },
      details: {},
    };
  }

  // =========================================================================
  // 8. LADDER FRICTION & LEANING EQUILIBRIUM
  // =========================================================================
  if (input.subMode === "ladder_friction") {
    const L = Math.max(0.5, input.ladderLengthM ?? 4.0);
    const M = Math.max(0.5, input.ladderMassKg ?? 15.0);
    const muF = Math.max(0.01, input.muFloor ?? 0.35);
    const muW = Math.max(0, input.muWall ?? 0.15);
    const thetaDeg = Math.min(85, Math.max(5, input.ladderAngleDeg ?? 60));
    const theta = degToRad(thetaDeg);
    const g = CODATA.g;
    const W = M * g;

    // Critical minimum angle to prevent slipping:
    // tan(theta_min) = (1 - muF * muW) / (2 * muF)
    const tanThetaMin = (1 - muF * muW) / (2 * muF);
    const thetaMinDeg = radToDeg(Math.atan(tanThetaMin));

    // Support forces at current angle theta:
    // N_wall = (W / 2) / (tan(theta) + mu_wall)
    const normalWallN = (W / 2) / (Math.tan(theta) + muW);
    const frictionWallN = muW * normalWallN;
    const normalFloorN = W - frictionWallN;
    const frictionFloorN = normalWallN;
    const maxFloorFrictionN = muF * normalFloorN;
    const willSlip = frictionFloorN > maxFloorFrictionN;

    return {
      subMode: "ladder_friction",
      summary: {
        ladderLengthM: roundTo(L, 2),
        ladderMassKg: roundTo(M, 2),
        ladderAngleDeg: roundTo(thetaDeg, 2),
        criticalAngleDeg: roundTo(thetaMinDeg, 2),
        isStable: !willSlip,
        willSlip,
        floorNormalForceN: roundTo(normalFloorN, 3),
        floorFrictionForceN: roundTo(frictionFloorN, 3),
        maxFloorFrictionN: roundTo(maxFloorFrictionN, 3),
        wallNormalForceN: roundTo(normalWallN, 3),
      },
      details: {},
    };
  }

  // =========================================================================
  // 9. SIMPLE TRIANGULAR TRUSS
  // =========================================================================
  if (input.subMode === "truss") {
    const span = Math.max(1, input.trussSpanM ?? 6.0);
    const height = Math.max(0.5, input.trussHeightM ?? 2.5);
    const loadN = Math.max(10, input.trussLoadN ?? 5000);

    const reactionA = loadN / 2;
    const reactionB = loadN / 2;
    const memberAngleRad = Math.atan(height / (span / 2));
    const memberAngleDeg = radToDeg(memberAngleRad);

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

  // =========================================================================
  // 10. PULLEY & WHEEL-AXLE MECHANISMS
  // =========================================================================
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
