import { CODATA, degToRad, radToDeg, roundTo } from "./constants";

export type OpticsSubMode =
  | "optical_bench"
  | "prism_slab"
  | "microscope_telescope"
  | "diffraction_interference"
  | "newton_rings"
  | "polarization"
  | "thin_film"
  | "matrix_optics_thick_lens"
  | "seidel_aberrations"
  | "michelson_interferometer"
  | "fabry_perot_interferometer"
  | "stokes_polarization_mueller";

export interface OpticsInput {
  subMode: OpticsSubMode;
  // Optical bench (single lens or spherical mirror)
  elementType?: "converging_lens" | "diverging_lens" | "concave_mirror" | "convex_mirror";
  focalLengthCm?: number; // positive magnitude
  objectDistanceCm?: number;
  objectHeightCm?: number;
  causticIncidenceDeg?: number; // for curved mirror caustic distance formula

  // Prism & Glass slab
  prismApexDeg?: number;
  incidenceDeg?: number;
  cauchyA?: number; // BK7 crown glass default 1.5046
  cauchyB?: number; // um^2 default 0.00420
  slabThicknessCm?: number;

  // Compound Microscope / Telescope
  instrument?: "microscope" | "telescope";
  fObjectiveCm?: number;
  fEyepieceCm?: number;
  tubeLengthCm?: number;

  // Wave Optics (Double slit & Grating)
  wavelengthNm?: number;
  slitSeparationUm?: number; // d
  slitWidthUm?: number; // a
  numSlits?: number; // N (2 for double slit, >2 for grating)
  screenDistanceM?: number;

  // Newton's Rings
  lensCurvatureRadiusM?: number;
  curvatureRadiusM?: number;
  ringOrder?: number;
  ringType?: "dark" | "bright";

  // Polarization
  polarizerAngleDeg?: number;
  initialIntensityW_M2?: number;
  mediumRefractiveIndex?: number;

  // Thin film
  filmThicknessNm?: number;
  filmRefractiveIndex?: number;

  // Matrix Optics Thick Lens
  lensRadius1Cm?: number; // R1 (+ for convex)
  lensRadius2Cm?: number; // R2 (- for convex)
  lensThicknessCm?: number; // d
  lensRefractiveIndex?: number; // n

  // Seidel Aberrations
  apertureRadiusMm?: number; // pupil radius
  fieldAngleDeg?: number; // field angle theta

  // Michelson Interferometer
  mirrorTranslationUm?: number; // Delta d
  spectralWidthNm?: number; // Delta lambda for coherence

  // Fabry-Perot Interferometer
  mirrorReflectance?: number; // R (0.80..0.99)
  cavityLengthMm?: number; // d
}

export interface OpticsResult {
  subMode: OpticsSubMode;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
  curves?: { label: string; points: { x: number; y: number }[] }[];
}

const SPECTRAL_LINES = [
  { name: "Binafsha (410 nm)", wavelengthNm: 410, color: "#6D28D9" },
  { name: "Ko'k (460 nm)", wavelengthNm: 460, color: "#1D4ED8" },
  { name: "Yashil (532 nm)", wavelengthNm: 532, color: "#15803D" },
  { name: "Sariq (589 nm)", wavelengthNm: 589, color: "#B45309" },
  { name: "Qizil (656 nm)", wavelengthNm: 656, color: "#B91C1C" },
];

export function simulateOptics(input: OpticsInput): OpticsResult {
  // =========================================================================
  // 1. OPTICAL BENCH (THIN LENS / SPHERICAL MIRROR & CAUSTIC)
  // =========================================================================
  if (input.subMode === "optical_bench") {
    const elType = input.elementType ?? "converging_lens";
    const fMag = Math.max(0.2, input.focalLengthCm ?? 15);
    const f =
      elType === "converging_lens" || elType === "concave_mirror" ? fMag : -fMag;
    const doCm = Math.max(0.2, input.objectDistanceCm ?? 30);
    const hoCm = Math.max(0.1, input.objectHeightCm ?? 5);

    const atFocal = Math.abs(doCm - f) < 1e-4;
    const diCm = atFocal ? 1e6 : 1 / (1 / f - 1 / doCm);
    const magnification = atFocal ? 1e4 : -diCm / doCm;
    const hiCm = hoCm * magnification;
    const isMirror = elType === "concave_mirror" || elType === "convex_mirror";
    const isReal = diCm > 0 && !atFocal;
    const diopter = 100 / f;

    const R = 2 * Math.abs(f);
    const thetaInc = degToRad(Math.min(75, Math.max(0, input.causticIncidenceDeg ?? 15)));
    const invRho =
      (isMirror ? 1 / doCm : 0) +
      (elType === "concave_mirror" ? 2 : -2) / (R * Math.cos(thetaInc));
    const causticDistanceCm =
      isMirror && Math.abs(invRho) > 1e-6 ? 1 / invRho : 0;

    return {
      subMode: "optical_bench",
      summary: {
        elementType: elType,
        signedFocalLengthCm: roundTo(f, 3),
        diopterD: roundTo(diopter, 3),
        objectDistanceCm: roundTo(doCm, 3),
        imageDistanceCm: atFocal ? "Cheksizlik" : roundTo(diCm, 3),
        magnification: atFocal ? "Cheksizlik" : roundTo(magnification, 4),
        imageHeightCm: atFocal ? "Cheksizlik" : roundTo(hiCm, 3),
        nature: isReal ? "Haqiqiy (Real)" : "Mavhum (Virtual)",
        orientation: magnification < 0 ? "To'nkarilgan (Inverted)" : "To'g'ri (Erect)",
        causticRadiusCm: roundTo(causticDistanceCm, 3),
        causticDistanceCm: roundTo(causticDistanceCm, 3),
      },
      details: {
        f,
        doCm,
        diCm: atFocal ? 1e6 : diCm,
        magnification: atFocal ? 1e4 : magnification,
        isReal,
        atFocal,
      },
    };
  }

  // =========================================================================
  // 2. PRISM DISPERSION & GLASS SLAB LATERAL SHIFT
  // =========================================================================
  if (input.subMode === "prism_slab") {
    const A_deg = Math.min(80, Math.max(10, input.prismApexDeg ?? 60));
    const A_rad = degToRad(A_deg);
    const i_deg = Math.min(85, Math.max(5, input.incidenceDeg ?? 45));
    const i_rad = degToRad(i_deg);
    const cA = input.cauchyA ?? 1.5046;
    const cB = input.cauchyB ?? 0.0042;
    const slabT = Math.max(0.5, input.slabThicknessCm ?? 5);

    const spectralDispersion = SPECTRAL_LINES.map((sl) => {
      const lamUm = sl.wavelengthNm * 1e-3;
      const n = cA + cB / (lamUm * lamUm);

      const sinR1 = Math.sin(i_rad) / n;
      if (Math.abs(sinR1) >= 1.0) {
        return { ...sl, n: roundTo(n, 4), deviationDeg: 0, tir: true };
      }
      const r1 = Math.asin(sinR1);
      const r2 = A_rad - r1;
      const sinI2 = n * Math.sin(r2);
      if (Math.abs(sinI2) >= 1.0) {
        return { ...sl, n: roundTo(n, 4), deviationDeg: 0, tir: true };
      }
      const i2 = Math.asin(sinI2);
      const devRad = i_rad + i2 - A_rad;
      const devDeg = radToDeg(devRad);

      const dShiftCm =
        (slabT * Math.sin(i_rad - r1)) / Math.cos(r1);

      return {
        name: sl.name,
        wavelengthNm: sl.wavelengthNm,
        color: sl.color,
        n: roundTo(n, 5),
        deviationDeg: roundTo(devDeg, 3),
        lateralShiftCm: roundTo(dShiftCm, 4),
        tir: false,
      };
    });

    const nD = cA + cB / Math.pow(0.589, 2);
    const nF = cA + cB / Math.pow(0.486, 2);
    const nC = cA + cB / Math.pow(0.656, 2);
    const abbeNumber = (nD - 1) / (nF - nC);

    const sinHalfA = Math.sin(A_rad / 2);
    const minDevRad = 2 * Math.asin(Math.min(1.0, nD * sinHalfA)) - A_rad;
    const minDevDeg = radToDeg(minDevRad);

    return {
      subMode: "prism_slab",
      summary: {
        prismApexAngleDeg: A_deg,
        incidenceAngleDeg: i_deg,
        refractiveIndexD: roundTo(nD, 5),
        abbeNumberV: roundTo(abbeNumber, 2),
        minimumDeviationDeg: roundTo(minDevDeg, 3),
        angularDispersionDeg: roundTo(
          (spectralDispersion[0]?.deviationDeg ?? 0) -
            (spectralDispersion[spectralDispersion.length - 1]?.deviationDeg ?? 0),
          3
        ),
      },
      details: { spectralDispersion },
    };
  }

  // =========================================================================
  // 3. MATRIX OPTICS THICK LENS (ABCD 2x2 SYSTEM MATRIX)
  // =========================================================================
  if (input.subMode === "matrix_optics_thick_lens") {
    const R1 = input.lensRadius1Cm ?? 15.0; // front convex
    const R2 = input.lensRadius2Cm ?? -20.0; // back convex
    const d = Math.max(0.1, input.lensThicknessCm ?? 2.5); // thickness
    const n = Math.max(1.0, input.lensRefractiveIndex ?? 1.5168); // BK7

    // Refraction at surface 1: C1 = -(n - 1) / R1
    const C1 = -(n - 1) / R1;
    // Propagation through lens of thickness d: B = d / n
    const B_prop = d / n;
    // Refraction at surface 2: C2 = -(1 - n) / R2 = (n - 1) / R2
    const C2 = (n - 1) / R2;

    // System matrix M = R2 * T * R1
    // M = [[1, 0], [C2, 1]] * [[1, d/n], [0, 1]] * [[1, 0], [C1, 1]]
    // Product gives:
    const A = 1 + C2 * B_prop;
    const B = B_prop;
    const C = C1 + C2 + C1 * C2 * B_prop;
    const D = 1 + C1 * B_prop;

    // Equivalent focal length: f = -1 / C
    const fEquiv = -1 / C;
    // Front focal length: f1 = -D / C, Back focal length: f2 = -A / C
    const bfl = -A / C; // distance from back surface to focal point
    const ffl = -D / C; // distance from front surface to front focal point
    // Principal planes positions:
    const h1 = (D - 1) / C;
    const h2 = (1 - A) / C;

    // Fan of rays for visual ray tracing
    const rayFan: { yIn: number; yOut: number; thetaOutDeg: number }[] = [];
    for (let i = -4; i <= 4; i++) {
      const y0 = i * 2.0; // mm
      const thetaOut = C * (y0 / 10) + D * 0; // rad
      rayFan.push({
        yIn: roundTo(y0, 1),
        yOut: roundTo((A * (y0 / 10) + B * 0) * 10, 2),
        thetaOutDeg: roundTo(radToDeg(thetaOut), 3),
      });
    }

    return {
      subMode: "matrix_optics_thick_lens",
      summary: {
        systemMatrix_A: roundTo(A, 5),
        systemMatrix_B: roundTo(B, 5),
        systemMatrix_C: roundTo(C, 6),
        systemMatrix_D: roundTo(D, 5),
        determinantCheck: roundTo(A * D - B * C, 6),
        equivalentFocalLengthCm: roundTo(fEquiv, 3),
        backFocalLengthCm: roundTo(bfl, 3),
        frontFocalLengthCm: roundTo(ffl, 3),
        principalPlaneH1Cm: roundTo(h1, 3),
        principalPlaneH2Cm: roundTo(h2, 3),
      },
      details: { rayFan },
    };
  }

  // =========================================================================
  // 4. SEIDEL THIRD-ORDER ABERRATIONS
  // =========================================================================
  if (input.subMode === "seidel_aberrations") {
    const f = Math.max(5, input.focalLengthCm ?? 20.0);
    const yPupilMax = Math.max(2, input.apertureRadiusMm ?? 12.0); // pupil radius
    const thetaField = Math.min(25, Math.max(0, input.fieldAngleDeg ?? 8.0));
    const hNorm = Math.tan(degToRad(thetaField));

    // Coefficients: W040 (spherical), W131 (coma), W222 (astigmatism), W220 (field curvature), W311 (distortion)
    const W040 = 0.85; // spherical
    const W131 = 0.55 * hNorm; // coma
    const W222 = 0.40 * hNorm * hNorm; // astigmatism
    const W220 = 0.25 * hNorm * hNorm; // Petzval
    const W311 = 0.15 * Math.pow(hNorm, 3); // distortion

    // Spot diagram ray distribution (pupil rings)
    const spotDiagram: { x: number; y: number }[] = [];
    const numRings = 6;
    for (let rIdx = 1; rIdx <= numRings; rIdx++) {
      const rho = rIdx / numRings;
      const numTheta = rIdx * 8;
      for (let tIdx = 0; tIdx < numTheta; tIdx++) {
        const phi = (2 * Math.PI * tIdx) / numTheta;
        const xP = rho * Math.cos(phi);
        const yP = rho * Math.sin(phi);

        // Transverse ray aberrations on image plane
        const dx = W040 * rho * rho * xP + W131 * (2 * xP * yP) + W222 * xP;
        const dy = W040 * rho * rho * yP + W131 * (3 * yP * yP + xP * xP) + (W222 + W220) * yP + W311;

        spotDiagram.push({ x: roundTo(dx * 40, 2), y: roundTo(dy * 40, 2) }); // microns
      }
    }

    return {
      subMode: "seidel_aberrations",
      summary: {
        focalLengthCm: f,
        apertureDiameterMm: yPupilMax * 2,
        fNumber: roundTo((f * 10) / (yPupilMax * 2), 2),
        sphericalAberrationW040Um: roundTo(W040, 3),
        comaAberrationW131Um: roundTo(W131, 3),
        astigmatismW222Um: roundTo(W222, 3),
        fieldCurvatureW220Um: roundTo(W220, 3),
        distortionW311Um: roundTo(W311, 4),
        spotCount: spotDiagram.length,
      },
      details: {},
      curves: [{ label: "Spot Diagramma (Aberratsiyalar dog'i) [mkm]", points: spotDiagram }],
    };
  }

  // =========================================================================
  // 5. MICHELSON INTERFEROMETER
  // =========================================================================
  if (input.subMode === "michelson_interferometer") {
    const lamNm = Math.max(300, input.wavelengthNm ?? 632.8); // He-Ne laser default
    const dTransUm = Math.max(0.1, input.mirrorTranslationUm ?? 25.0); // mirror movement
    const deltaLamNm = Math.max(0.001, input.spectralWidthNm ?? 0.02); // line width

    // Number of fringe shifts: Delta m = 2 * Delta d / lambda
    const fringeShiftCount = (2 * dTransUm * 1e-6) / (lamNm * 1e-9);
    // Coherence length: Lc = lambda^2 / Delta lambda
    const coherenceLengthMm = (Math.pow(lamNm * 1e-9, 2) / (deltaLamNm * 1e-9)) * 1000;
    // Fringe visibility: V = exp(-pi * (2*d)^2 / (2 * Lc^2))
    const opticalPathDiffMm = 2 * dTransUm * 1e-3;
    const visibility = Math.exp(-Math.PI * Math.pow(opticalPathDiffMm / coherenceLengthMm, 2));

    // Simulated fringe intensity profile across detector radius
    const fringeProfile: { x: number; y: number }[] = [];
    for (let i = 0; i <= 80; i++) {
      const rMm = (15.0 * i) / 80;
      // Phase delta(r) = (2*pi / lambda) * 2d * cos(theta) approx (4*pi*d / lambda) * (1 - r^2 / (2*f^2))
      const fLens = 200; // mm
      const phase = ((4 * Math.PI * (dTransUm * 1e-3)) / (lamNm * 1e-6)) * (1 - (rMm * rMm) / (2 * fLens * fLens));
      const intensity = 0.5 * (1 + visibility * Math.cos(phase));
      fringeProfile.push({ x: roundTo(rMm, 2), y: roundTo(intensity, 4) });
    }

    return {
      subMode: "michelson_interferometer",
      summary: {
        laserWavelengthNm: lamNm,
        mirrorDisplacementUm: dTransUm,
        fringeShiftsCount: roundTo(fringeShiftCount, 2),
        coherenceLengthMm: roundTo(coherenceLengthMm, 3),
        fringeVisibilityFactor: roundTo(visibility, 4),
        calculatedWavelengthNm: roundTo((2 * dTransUm * 1e-6) / Math.round(fringeShiftCount) * 1e9, 2),
      },
      details: {},
      curves: [{ label: "Interferensiya intensivlik profili I(r)", points: fringeProfile }],
    };
  }

  // =========================================================================
  // 6. FABRY-PEROT INTERFEROMETER
  // =========================================================================
  if (input.subMode === "fabry_perot_interferometer") {
    const lamNm = Math.max(300, input.wavelengthNm ?? 532);
    const R = Math.min(0.995, Math.max(0.5, input.mirrorReflectance ?? 0.92));
    const dMm = Math.max(0.1, input.cavityLengthMm ?? 5.0);

    // Coefficient of finesse: F = 4R / (1 - R)^2
    const F = (4 * R) / Math.pow(1 - R, 2);
    // Finesse script F = pi * sqrt(F) / 2
    const finesse = (Math.PI * Math.sqrt(F)) / 2;
    // Free spectral range FSR: Delta lambda_FSR = lambda^2 / (2 * d)
    const fsrNm = Math.pow(lamNm * 1e-9, 2) / (2 * dMm * 1e-3) * 1e9;
    const fsrGhz = (CODATA.c / (2 * dMm * 1e-3)) / 1e9;
    // Minimum resolvable wavelength: delta_lambda = FSR / finesse
    const minResolvableDeltaLamPm = (fsrNm / finesse) * 1000; // picometers

    // Airy transmission function profile: T(delta) = 1 / (1 + F * sin^2(delta/2))
    const airyCurve: { x: number; y: number }[] = [];
    for (let i = -100; i <= 100; i++) {
      const deltaPhi = (2 * Math.PI * i) / 100;
      const trans = 1 / (1 + F * Math.pow(Math.sin(deltaPhi / 2), 2));
      airyCurve.push({ x: roundTo(deltaPhi, 3), y: roundTo(trans, 5) });
    }

    return {
      subMode: "fabry_perot_interferometer",
      summary: {
        mirrorReflectance: roundTo(R, 3),
        cavitySpacingMm: dMm,
        coefficientOfFinesseF: roundTo(F, 2),
        finesseScriptF: roundTo(finesse, 2),
        freeSpectralRangeNm: roundTo(fsrNm, 5),
        freeSpectralRangeGhz: roundTo(fsrGhz, 3),
        resolvingPowerResolvance: roundTo((lamNm / (fsrNm / finesse)), 0),
        minResolvableDeltaLambdaPm: roundTo(minResolvableDeltaLamPm, 2),
      },
      details: {},
      curves: [{ label: "Eyri o'tkazish funksiyasi T(delta)", points: airyCurve }],
    };
  }

  // =========================================================================
  // 7. COMPOUND MICROSCOPE / TELESCOPE
  // =========================================================================
  if (input.subMode === "microscope_telescope") {
    const isMicro = (input.instrument ?? "microscope") === "microscope";
    const fo = Math.max(0.1, input.fObjectiveCm ?? (isMicro ? 0.8 : 80));
    const fe = Math.max(0.1, input.fEyepieceCm ?? (isMicro ? 2.5 : 2.0));
    const L = Math.max(0.1, input.tubeLengthCm ?? 16);

    const DNear = 25; // standard near point distance cm
    let mag = 0;
    let totalLength = 0;

    if (isMicro) {
      mag = -(L / fo) * (DNear / fe);
      totalLength = fo + L + fe;
    } else {
      mag = -fo / fe;
      totalLength = fo + fe;
    }

    return {
      subMode: "microscope_telescope",
      summary: {
        instrumentType: isMicro ? "Murakkab Mikroskop" : "Astronomik Teleskop (Kepler)",
        objectiveFocalLengthCm: fo,
        eyepieceFocalLengthCm: fe,
        angularMagnification: roundTo(Math.abs(mag), 2),
        signedMagnification: roundTo(mag, 2),
        tubeLengthCm: roundTo(totalLength, 2),
        imageNature: "Mavhum, kattalashtirilgan, to'nkarilgan",
      },
      details: {},
    };
  }

  // =========================================================================
  // 8. NEWTON'S RINGS INTERFERENCE
  // =========================================================================
  if (input.subMode === "newton_rings") {
    const lamNm = Math.min(1000, Math.max(200, input.wavelengthNm ?? 589));
    const lamM = lamNm * 1e-9;
    const R = Math.max(0.1, input.lensCurvatureRadiusM ?? input.curvatureRadiusM ?? 1.5);
    const mOrder = Math.max(1, Math.round(input.ringOrder ?? 5));
    const isDark = (input.ringType ?? "dark") === "dark";

    const darkRadiusMm = Math.sqrt(mOrder * lamM * R) * 1000;
    const brightRadiusMm = Math.sqrt((mOrder - 0.5) * lamM * R) * 1000;
    const rMm = isDark ? darkRadiusMm : brightRadiusMm;
    const diameterMm = 2 * rMm;

    const ringRadiiMm: { order: number; darkRadiusMm: number; brightRadiusMm: number }[] = [];
    for (let k = 1; k <= 10; k++) {
      ringRadiiMm.push({
        order: k,
        darkRadiusMm: roundTo(Math.sqrt(k * lamM * R) * 1000, 4),
        brightRadiusMm: roundTo(Math.sqrt((k - 0.5) * lamM * R) * 1000, 4),
      });
    }

    return {
      subMode: "newton_rings",
      summary: {
        wavelengthNm: lamNm,
        lensCurvatureRadiusM: R,
        curvatureRadiusM: R,
        requestedOrder: mOrder,
        ringType: isDark ? "Qorong'i halqa" : "Yorug' halqa",
        ringRadiusMm: roundTo(rMm, 4),
        ringDiameterMm: roundTo(diameterMm, 4),
        darkRingRadiusMm: roundTo(darkRadiusMm, 4),
        brightRingRadiusMm: roundTo(brightRadiusMm, 4),
        centralSpot: "Qorong'i (faza 180° ga sakraydi)",
      },
      details: { ringRadiiMm },
    };
  }

  // =========================================================================
  // 9. POLARIZATION & MALUS'S LAW
  // =========================================================================
  if (input.subMode === "polarization") {
    const thetaDeg = Math.min(360, Math.max(0, input.polarizerAngleDeg ?? 45));
    const thetaRad = degToRad(thetaDeg);
    const I0 = Math.max(0.1, input.initialIntensityW_M2 ?? 100);
    const n = Math.max(1.0, input.mediumRefractiveIndex ?? 1.5);

    const I_after_polarizer1 = I0 / 2;
    const I_after_analyzer = I_after_polarizer1 * Math.pow(Math.cos(thetaRad), 2);
    const brewsterAngleDeg = radToDeg(Math.atan(n));

    return {
      subMode: "polarization",
      summary: {
        unpolarizedIntensityW_M2: I0,
        polarizer1IntensityW_M2: roundTo(I_after_polarizer1, 2),
        analyzerAngleDeg: thetaDeg,
        transmittedIntensityW_M2: roundTo(I_after_analyzer, 3),
        transmissionFractionPct: roundTo((I_after_analyzer / I0) * 100, 2),
        brewsterAngleDeg: roundTo(brewsterAngleDeg, 2),
      },
      details: {},
    };
  }

  // =========================================================================
  // 10. THIN FILM INTERFERENCE
  // =========================================================================
  if (input.subMode === "thin_film") {
    const dNm = Math.max(10, input.filmThicknessNm ?? 250);
    const n = Math.max(1.0, input.filmRefractiveIndex ?? 1.38);
    const lamNm = Math.min(1000, Math.max(300, input.wavelengthNm ?? 550));

    const pathDiffNm = 2 * n * dNm;
    const constructiveLambdaNm = (2 * n * dNm) / 0.5; // for m=0
    const destructiveLambdaNm = (2 * n * dNm) / 1.0;

    return {
      subMode: "thin_film",
      summary: {
        filmThicknessNm: dNm,
        refractiveIndex: n,
        incidentWavelengthNm: lamNm,
        constructiveFirstWavelengthNm: roundTo(constructiveLambdaNm, 1),
        destructiveFirstWavelengthNm: roundTo(destructiveLambdaNm, 1),
        opticalPathDifferenceNm: roundTo(2 * n * dNm, 1),
      },
      details: {},
    };
  }

  // =========================================================================
  // 11. DEFAULT: DIFFRACTION & DOUBLE-SLIT INTERFERENCE
  // =========================================================================
  const lambdaNm = Math.min(2000, Math.max(100, input.wavelengthNm ?? 532));
  const lambdaUm = lambdaNm * 1e-3;
  const dUm = Math.max(0.2, input.slitSeparationUm ?? 20);
  const aUm = Math.min(dUm, Math.max(0.05, input.slitWidthUm ?? 4));
  const N = Math.min(500, Math.max(1, Math.round(input.numSlits ?? 2)));
  const D = Math.max(0.05, input.screenDistanceM ?? 1.5);

  const fringeSpacingMm = ((lambdaUm * 1e-6 * D) / (dUm * 1e-6)) * 1000;
  const maxOrder = Math.floor(dUm / lambdaUm);
  const resolvingPowerOrder1 = N * 1;
  const halfWidthRad = lambdaUm / (N * dUm);

  const profile: { angleDeg: number; screenMm: number; intensity: number }[] = [];
  for (let i = -90; i <= 90; i++) {
    const thetaDeg = i * 0.15;
    const sinT = Math.sin(degToRad(thetaDeg));
    const beta = (Math.PI * aUm * sinT) / lambdaUm;
    const gamma = (Math.PI * dUm * sinT) / lambdaUm;

    const singleSlit = Math.abs(beta) < 1e-7 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
    let multiSlit = 1;
    if (Math.abs(Math.sin(gamma)) < 1e-7) {
      multiSlit = 1;
    } else {
      multiSlit = Math.pow(Math.sin(N * gamma) / (N * Math.sin(gamma)), 2);
    }

    const screenMm = D * Math.tan(degToRad(thetaDeg)) * 1000;
    profile.push({
      angleDeg: roundTo(thetaDeg, 3),
      screenMm: roundTo(screenMm, 3),
      intensity: roundTo(singleSlit * multiSlit, 5),
    });
  }

  return {
    subMode: "diffraction_interference",
    summary: {
      wavelengthNm: lambdaNm,
      slitCountN: N,
      fringeSpacingMm: roundTo(fringeSpacingMm, 4),
      maxVisibleOrder: maxOrder,
      firstOrderAngleDeg:
        lambdaUm / dUm <= 1 ? roundTo(radToDeg(Math.asin(lambdaUm / dUm)), 3) : "None",
      resolvingPowerM1: resolvingPowerOrder1,
      halfLineWidthDeg: roundTo(radToDeg(halfWidthRad), 4),
    },
    details: { profile },
  };
}
