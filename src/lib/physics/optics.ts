import { degToRad, radToDeg, roundTo } from "./constants";

export type OpticsSubMode =
  | "optical_bench"
  | "prism_slab"
  | "microscope_telescope"
  | "diffraction_interference";

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
}

export interface OpticsResult {
  subMode: OpticsSubMode;
  summary: Record<string, number | string | boolean>;
  details: Record<string, unknown>;
}

const SPECTRAL_LINES = [
  { name: "Binafsha (410 nm)", wavelengthNm: 410, color: "#6D28D9" },
  { name: "Ko'k (460 nm)", wavelengthNm: 460, color: "#1D4ED8" },
  { name: "Yashil (532 nm)", wavelengthNm: 532, color: "#15803D" },
  { name: "Sariq (589 nm)", wavelengthNm: 589, color: "#B45309" },
  { name: "Qizil (656 nm)", wavelengthNm: 656, color: "#B91C1C" },
];

export function simulateOptics(input: OpticsInput): OpticsResult {
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

    // Curved mirror caustic distance formula from Physics-Guide:
    // 1/rho = 1/s' + 2/(R * cos(theta))
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
        imageNature: atFocal
          ? "Parallel nurlar (cheksizda)"
          : isReal
          ? "Haqiqiy tasvir"
          : "Mavhum tasvir",
        imageOrientation: atFocal
          ? "Aniqlanmagan"
          : magnification < 0
          ? "Teskari"
          : "To‘g‘ri",
        ...(isMirror ? { causticDistanceCm: roundTo(causticDistanceCm, 3) } : {}),
      },
      details: {
        isMirror,
        f,
        doCm,
        diCm: atFocal ? 9999 : diCm,
        hoCm,
        hiCm: atFocal ? 0 : hiCm,
        atFocal,
      },
    };
  }

  if (input.subMode === "prism_slab") {
    const apexDeg = Math.min(80, Math.max(15, input.prismApexDeg ?? 60));
    const apexRad = degToRad(apexDeg);
    const i1Deg = Math.min(85, Math.max(1, input.incidenceDeg ?? 45));
    const i1Rad = degToRad(i1Deg);
    const A = Math.max(1.1, input.cauchyA ?? 1.5046);
    const B = Math.max(0, input.cauchyB ?? 0.0042);
    const slabThicknessCm = Math.max(0.5, input.slabThicknessCm ?? 4.0);

    const spectralRays = SPECTRAL_LINES.map((line) => {
      const lamUm = line.wavelengthNm / 1000;
      const n = A + B / (lamUm * lamUm);
      const r1Rad = Math.asin(Math.min(1, Math.sin(i1Rad) / n));
      const r2Rad = apexRad - r1Rad;
      const sinI2 = n * Math.sin(r2Rad);
      const tir = Math.abs(sinI2) > 1;
      const i2Deg = tir ? NaN : radToDeg(Math.asin(sinI2));
      const deviationDeg = tir ? NaN : i1Deg + i2Deg - apexDeg;
      const minDeviationDeg = radToDeg(2 * Math.asin(n * Math.sin(apexRad / 2)) - apexRad);
      // Parallel glass slab lateral shift: d = t * sin(i1 - r1) / cos(r1)
      const slabShiftCm =
        (slabThicknessCm * Math.sin(i1Rad - r1Rad)) / Math.cos(r1Rad);

      return {
        name: line.name,
        wavelengthNm: line.wavelengthNm,
        color: line.color,
        refractiveIndex: roundTo(n, 5),
        r1Deg: roundTo(radToDeg(r1Rad), 3),
        r2Deg: roundTo(radToDeg(r2Rad), 3),
        emergentDeg: tir ? null : roundTo(i2Deg, 3),
        deviationDeg: tir ? null : roundTo(deviationDeg, 3),
        minDeviationDeg: roundTo(minDeviationDeg, 3),
        totalInternalReflection: tir,
        slabLateralShiftCm: roundTo(slabShiftCm, 4),
      };
    });

    const yellow = spectralRays[3];
    const angularDispersionDeg =
      spectralRays[0].deviationDeg !== null &&
      spectralRays[4].deviationDeg !== null
        ? Math.abs(spectralRays[0].deviationDeg - spectralRays[4].deviationDeg)
        : 0;

    return {
      subMode: "prism_slab",
      summary: {
        prismApexDeg: apexDeg,
        incidenceDeg: i1Deg,
        nSodium589: yellow.refractiveIndex,
        deviationSodiumDeg: yellow.deviationDeg ?? "TIR",
        minDeviationSodiumDeg: yellow.minDeviationDeg,
        angularDispersionDeg: roundTo(angularDispersionDeg, 4),
        slabLateralShiftCm: yellow.slabLateralShiftCm,
        criticalAngleSodiumDeg: roundTo(radToDeg(Math.asin(1 / yellow.refractiveIndex)), 3),
      },
      details: { spectralRays },
    };
  }

  if (input.subMode === "microscope_telescope") {
    const inst = input.instrument ?? "telescope";
    const fo = Math.max(0.2, input.fObjectiveCm ?? (inst === "telescope" ? 80 : 1.6));
    const fe = Math.max(0.2, input.fEyepieceCm ?? 4.0);
    const L = Math.max(2, input.tubeLengthCm ?? 16.0);
    const nearPointCm = 25.0;

    if (inst === "telescope") {
      const angularMag = -fo / fe;
      const lengthCm = fo + fe;
      return {
        subMode: "microscope_telescope",
        summary: {
          instrument: "telescope",
          fObjectiveCm: roundTo(fo, 2),
          fEyepieceCm: roundTo(fe, 2),
          tubeLengthCm: roundTo(lengthCm, 2),
          angularMagnification: roundTo(angularMag, 3),
        },
        details: {},
      };
    }

    const mObj = -L / fo;
    const mEye = nearPointCm / fe;
    const totalMag = mObj * mEye;
    return {
      subMode: "microscope_telescope",
      summary: {
        instrument: "microscope",
        fObjectiveCm: roundTo(fo, 2),
        fEyepieceCm: roundTo(fe, 2),
        tubeLengthCm: roundTo(L, 2),
        objectiveMag: roundTo(mObj, 3),
        eyepieceMag: roundTo(mEye, 3),
        totalMagnification: roundTo(totalMag, 2),
      },
      details: {},
    };
  }

  // Diffraction & Double-Slit Interference
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

  // Sample intensity profile I(theta) over -15 deg to +15 deg
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
