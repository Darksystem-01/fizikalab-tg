"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Compass,
  Layers,
  Maximize2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { MathFormula } from "@/components/MathFormula";
import { ParamInput } from "@/components/ParamInput";
import { ScientificChart } from "@/components/ScientificChart";
import { ScenarioCatalogSelector } from "@/components/labs/ScenarioCatalogSelector";
import { SocraticAiAssistant } from "@/components/SocraticAiAssistant";
import type { ScenarioDefinition } from "@/lib/physics/catalog";
import type { DynamicsResult, DynamicsSubMode } from "@/lib/physics/dynamics";

interface MetricFormatSpec {
  label: string;
  symbol: string;
  unit: string;
}

const DYNAMICS_METRICS: Record<string, MetricFormatSpec> = {
  // Inclined plane
  moving: { label: "Harakat holati", symbol: "Holat", unit: "" },
  direction: { label: "Harakat yo‘nalishi", symbol: "Yo‘nalish", unit: "" },
  normalForceN: { label: "Normal reaksiya kuchi", symbol: "N", unit: "N" },
  trueGravityN: { label: "1-jism og‘irlik kuchi", symbol: "m₁g", unit: "N" },
  gravityParallelN: { label: "Qiyalik bo‘ylab og‘irlik tashkil etuvchisi", symbol: "m₁g·sin(θ)", unit: "N" },
  gravityPerpendicularN: { label: "Qiyalik perpendikulyar tashkil etuvchisi", symbol: "m₁g·cos(θ)", unit: "N" },
  hangingWeightN: { label: "2-osilgan yuk og‘irlik kuchi", symbol: "m₂g", unit: "N" },
  staticMaxFrictionN: { label: "Maksimal tinchlik ishqalanishi", symbol: "f_s,max", unit: "N" },
  kineticFrictionN: { label: "Sirpanish ishqalanish kuchi", symbol: "f_k", unit: "N" },
  actualFrictionN: { label: "Amaldagi ishqalanish kuchi", symbol: "f_ishq", unit: "N" },
  tensionN: { label: "Ip taranglik kuchi", symbol: "T", unit: "N" },
  tensionM1N: { label: "1-jismga ta’sir qiluvchi taranglik", symbol: "T₁", unit: "N" },
  tensionM2N: { label: "2-jismga ta’sir qiluvchi taranglik", symbol: "T₂", unit: "N" },
  accelerationMs2: { label: "Sistema tezlanishi", symbol: "a", unit: "m/s²" },
  travelTimeS: { label: "Tekislik bo‘ylab harakat vaqti", symbol: "t", unit: "s" },
  finalSpeedMs: { label: "Oxirgi tezlik", symbol: "v", unit: "m/s" },
  frictionWorkJ: { label: "Ishqalanish kuchi bajargan ish", symbol: "A_ishq", unit: "J" },
  potentialEnergyChangeJ: { label: "Potensial energiya o‘zgarishi", symbol: "ΔE_p", unit: "J" },
  mechanicalEnergyLossJ: { label: "Mexanik energiya yo‘qotilishi", symbol: "ΔE_mex", unit: "J" },
  pulleyTorqueNm: { label: "G‘altak aylanma momenti", symbol: "M_blok", unit: "N·m" },
  // Pendulum & Double Pendulum
  smallAnglePeriodS: { label: "Kichik burchaklar davri", symbol: "T₀", unit: "s" },
  nonlinearPeriodS: { label: "Nolinear tebranish davri (RK4)", symbol: "T", unit: "s" },
  anharmonicCorrectionPct: { label: "Angarmonik tuzatma", symbol: "ΔT/T₀", unit: "%" },
  angularFreqRadS: { label: "Sikllik chastota", symbol: "ω₀", unit: "rad/s" },
  katerMeasuredG: { label: "Kater mayatnigi bo‘yicha g", symbol: "g_Kater", unit: "m/s²" },
  radiusOfGyrationM: { label: "Inersiya radiusi", symbol: "k_g", unit: "m" },
  totalInitialEnergyJ: { label: "Boshlang‘ich to‘liq energiya", symbol: "E₀", unit: "J" },
  totalFinalEnergyJ: { label: "Yakuniy to‘liq energiya", symbol: "E", unit: "J" },
  energyConservationErrorPct: { label: "Energiya saqlanish xatoligi", symbol: "ΔE/E₀", unit: "%" },
  // Hooke spring & Coupled
  equilibriumStretchM: { label: "Statik cho‘zilish (muvozanat)", symbol: "Δx_st", unit: "m" },
  naturalFreqHz: { label: "Xususiy tebranish chastotasi", symbol: "ν₀", unit: "Hz" },
  periodS: { label: "Tebranish davri", symbol: "T", unit: "s" },
  dampedPeriodS: { label: "So‘nuvchi tebranish davri", symbol: "T_d", unit: "s" },
  maxPotentialEnergyJ: { label: "Maksimal elastiklik energiyasi", symbol: "E_p,max", unit: "J" },
  dampingRatioZeta: { label: "So‘nish parametri", symbol: "ζ", unit: "" },
  dampingRegime: { label: "So‘nish rejimi", symbol: "Rejim", unit: "" },
  logarithmicDecrement: { label: "Logarifmik dekrement", symbol: "λ", unit: "" },
  qualityFactorQ: { label: "Sifat ko‘rsatkichi (Q-faktor)", symbol: "Q", unit: "" },
  mode1FreqHz: { label: "1-normal moda (Sinxron)", symbol: "ν₁", unit: "Hz" },
  mode2FreqHz: { label: "2-normal moda (Antisinxron)", symbol: "ν₂", unit: "Hz" },
  beatPeriodS: { label: "Urishlar (Beats) davri", symbol: "T_urish", unit: "s" },
  // Resonance
  naturalFreqRadS: { label: "Xususiy siklik chastota", symbol: "ω₀", unit: "rad/s" },
  resonantFreqRadS: { label: "Rezonans siklik chastota", symbol: "ω_rez", unit: "rad/s" },
  maxResonantAmplitudeM: { label: "Rezonans maksimal amplitudasi", symbol: "A_max", unit: "m" },
  halfPowerBandwidthRadS: { label: "O‘tkazish polosasining kengligi", symbol: "Δω", unit: "rad/s" },
  // Collision 1D & 2D
  willCollide: { label: "To‘qnashuv sharti (u₁ > u₂)", symbol: "To‘qnashuv", unit: "" },
  v1FinalMs: { label: "1-jism yakuniy tezligi", symbol: "v₁′", unit: "m/s" },
  v2FinalMs: { label: "2-jism yakuniy tezligi", symbol: "v₂′", unit: "m/s" },
  vCenterOfMassMs: { label: "Massa markazi tezligi", symbol: "v_c", unit: "m/s" },
  momentumBeforeKgMs: { label: "Boshlang‘ich impuls", symbol: "p₀", unit: "kg·m/s" },
  momentumAfterKgMs: { label: "Yakuniy impuls", symbol: "p", unit: "kg·m/s" },
  kineticBeforeJ: { label: "Boshlang‘ich kinetik energiya", symbol: "E_k0", unit: "J" },
  kineticAfterJ: { label: "Yakuniy kinetik energiya", symbol: "E_k", unit: "J" },
  energyLostJ: { label: "Issiqlikka aylangan energiya", symbol: "ΔE", unit: "J" },
  impulseOnBody1Ns: { label: "1-jismga berilgan impuls", symbol: "J₁", unit: "N·s" },
  impactParameterM: { label: "To‘qnashuv parametri", symbol: "b", unit: "m" },
  deflectionAngle1Deg: { label: "1-sharcha og‘ish burchagi", symbol: "θ₁", unit: "°" },
  deflectionAngle2Deg: { label: "2-sharcha og‘ish burchagi", symbol: "θ₂", unit: "°" },
  scatteringAngleTotalDeg: { label: "To‘liq sochilish burchagi", symbol: "θ_to‘liq", unit: "°" },
  // Ballistic Pendulum
  bulletSpeedMs: { label: "O‘qning boshlang‘ich tezligi", symbol: "v₀", unit: "m/s" },
  combinedSpeedMs: { label: "Mayatnik va o‘qning umumiy tezligi", symbol: "V", unit: "m/s" },
  maxHeightM: { label: "Maksimal ko‘tarilish balandligi", symbol: "h_max", unit: "m" },
  maxAngleDeg: { label: "Maksimal og‘ish burchagi", symbol: "θ_max", unit: "°" },
  heatDissipatedJ: { label: "Ajralgan issiqlik energiyasi", symbol: "Q", unit: "J" },
  mechanicalEfficiencyPct: { label: "Mexanik samaradorlik", symbol: "η_mex", unit: "%" },
  recoveredBulletSpeedMs: { label: "Tiklangan o‘q tezligi", symbol: "v_hisob", unit: "m/s" },
  // Rolling & Flywheel & Gyroscope
  rollingShape: { label: "Dumalayotgan jism shakli", symbol: "Shakl", unit: "" },
  inertiaCoeffBeta: { label: "Inersiya koeffitsiyenti", symbol: "β = I/(mR²)", unit: "" },
  finalAngularSpeedRadS: { label: "Oxirgi burchak tezlik", symbol: "ω", unit: "rad/s" },
  translationalKineticJ: { label: "Ilgarilanma kinetik energiya", symbol: "E_ilg", unit: "J" },
  rotationalKineticJ: { label: "Aylanma kinetik energiya", symbol: "E_ayl", unit: "J" },
  totalMechanicalEnergyJ: { label: "To‘liq mexanik energiya", symbol: "E_to‘liq", unit: "J" },
  isPureRolling: { label: "Sirpanishsiz toza dumalash", symbol: "Dumalash", unit: "" },
  slipCriticalAngleDeg: { label: "Sirpanish boshlanish burchagi", symbol: "θ_sirpanish", unit: "°" },
  angularAccelRadS2: { label: "Burchak tezlanish", symbol: "ε", unit: "rad/s²" },
  linearAccelMs2: { label: "Chiziqli tezlanish", symbol: "a", unit: "m/s²" },
  fallTimeS: { label: "Tushish vaqti", symbol: "t", unit: "s" },
  omegaFinalRadS: { label: "Oxirgi burchak tezlik", symbol: "ω", unit: "rad/s" },
  potentialEnergyJ: { label: "Boshlang‘ich potensial energiya", symbol: "E_p", unit: "J" },
  precessionSpeedRadS: { label: "Giroskop presessiya tezligi", symbol: "Ω_p", unit: "rad/s" },
  precessionPeriodS: { label: "Presessiya davri", symbol: "T_p", unit: "s" },
  nutationSpeedRadS: { label: "Nutatsiya chastotasi", symbol: "ω_nut", unit: "rad/s" },
  nutationPeriodS: { label: "Nutatsiya davri", symbol: "T_nut", unit: "s" },
  totalInertiaKgM2: { label: "To‘liq inersiya momenti", symbol: "I_to‘liq", unit: "kg·m²" },
  cylinderDistanceM: { label: "Yuklarning o‘qqacha masofasi", symbol: "R_yuk", unit: "m" },
};

function formatMetricValue(key: string, val: number | string | boolean): { label: string; equation: string } {
  const spec = DYNAMICS_METRICS[key];
  if (!spec) {
    return { label: key, equation: String(val) };
  }
  if (key === "moving") {
    return {
      label: spec.label,
      equation: val ? "Harakatda (a > 0)" : "Tinch (Muvozanatda)",
    };
  }
  if (key === "isPureRolling") {
    return {
      label: spec.label,
      equation: val ? "Sirpanishsiz toza dumalash (f_s ≤ f_s,max)" : "Sirpanish bilan dumalash (f_s > f_s,max)",
    };
  }
  if (key === "willCollide") {
    return {
      label: spec.label,
      equation: val ? "To‘qnashadi (u₁ > u₂)" : "To‘qnashmaydi (ajralmoqda)",
    };
  }
  if (key === "direction") {
    const map: Record<string, string> = {
      down_slope: "Qiyalik bo‘ylab pastga sirpanish",
      up_slope: "Qiyalik bo‘ylab yuqoriga tortilish",
      static: "Harakatsiz (Muvozanat holati)",
    };
    return { label: spec.label, equation: map[String(val)] ?? String(val) };
  }
  const unitSuffix = spec.unit ? ` ${spec.unit}` : "";
  return {
    label: spec.label,
    equation: `${spec.symbol} = ${val}${unitSuffix}`,
  };
}

export function DynamicsLab() {
  const [activeScenarioId, setActiveScenarioId] = useState("dyn-01");
  const [subMode, setSubMode] = useState<DynamicsSubMode>("inclined_plane");

  // Incline Connected Bodies
  const [mass1Kg, setMass1Kg] = useState(3.0);
  const [mass2Kg, setMass2Kg] = useState(1.8);
  const [angleDeg, setAngleDeg] = useState(30.0);
  const [muStatic, setMuStatic] = useState(0.28);
  const [muKinetic, setMuKinetic] = useState(0.18);
  const [planeLengthM, setPlaneLengthM] = useState(2.5);
  const [pulleyMassKg, setPulleyMassKg] = useState(0.3);

  // Pendulum & Double Pendulum
  const [pendulumLengthM, setPendulumLengthM] = useState(1.2);
  const [pendulumLength2M, setPendulumLength2M] = useState(0.9);
  const [initialAngleDeg, setInitialAngleDeg] = useState(30);
  const [initialAngle2Deg, setInitialAngle2Deg] = useState(45);
  const [pendulumMass1Kg, setPendulumMass1Kg] = useState(1.0);
  const [pendulumMass2Kg, setPendulumMass2Kg] = useState(0.8);

  // Hooke spring & Coupled & Resonance
  const [springK, setSpringK] = useState(30);
  const [springKc, setSpringKc] = useState(6.0);
  const [dampingC, setDampingC] = useState(0.25);
  const [springX0M, setSpringX0M] = useState(0.15);
  const [driverAmplitudeN, setDriverAmplitudeN] = useState(2.0);

  // Collision & Ballistic
  const [v1InitialMs, setV1InitialMs] = useState(4.0);
  const [v2InitialMs, setV2InitialMs] = useState(-1.5);
  const [restitutionE, setRestitutionE] = useState(0.9);
  const [impactParameterM, setImpactParameterM] = useState(0.035);
  const [bulletMassKg, setBulletMassKg] = useState(0.015);
  const [bulletSpeedMs, setBulletSpeedMs] = useState(450);
  const [blockMassKg, setBlockMassKg] = useState(2.5);

  // Rotational Dynamics
  const [flywheelInertia, setFlywheelInertia] = useState(0.08);
  const [axleRadiusM, setAxleRadiusM] = useState(0.04);
  const [fallHeightM, setFallHeightM] = useState(1.5);
  const [rollingShape, setRollingShape] = useState<"solid_sphere" | "solid_cylinder" | "hollow_cylinder" | "hollow_sphere">("solid_sphere");
  const [gyroMassKg, setGyroMassKg] = useState(1.5);
  const [spinSpeedRadS, setSpinSpeedRadS] = useState(180);
  const [cylinderDistanceM, setCylinderDistanceM] = useState(0.25);

  // Vector Display HUD Toggles (inclined plane & apparatus)
  const [showAllVectors, setShowAllVectors] = useState(true);
  const [showDecomposition, setShowDecomposition] = useState(true);
  const [showFrictionTension, setShowFrictionTension] = useState(true);
  const [showForceValues, setShowForceValues] = useState(true);
  const [showAngleArc, setShowAngleArc] = useState(true);
  const [showFbdModal, setShowFbdModal] = useState(false);
  const [realisticView, setRealisticView] = useState(true);

  const [result, setResult] = useState<DynamicsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const simulate = useCallback(
    async (saveRun = false) => {
      setLoading(true);
      try {
        const res = await fetch("/api/physics/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labKey: "dynamics",
            saveRun,
            params: {
              subMode,
              gravity: 9.80665,
              mass1Kg,
              mass2Kg,
              angleDeg,
              muStatic,
              muKinetic: Math.min(muStatic, muKinetic),
              planeLengthM,
              pulleyMassKg,
              pendulumLengthM,
              pendulumLength1M: pendulumLengthM,
              pendulumLength2M,
              initialAngleDeg,
              initialAngle1Deg: initialAngleDeg,
              initialAngle2Deg,
              pendulumMass1Kg,
              pendulumMass2Kg,
              springK,
              springKc,
              dampingC,
              springX0M,
              driverAmplitudeN,
              v1InitialMs,
              v2InitialMs,
              restitutionE,
              impactParameterM,
              bulletMassKg,
              bulletSpeedMs,
              blockMassKg,
              flywheelInertiaKgM2: flywheelInertia,
              axleRadiusM,
              fallHeightM,
              rollingShape,
              gyroMassKg,
              spinSpeedRadS,
              cylinderDistanceM,
            },
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data.result);
          setProgress(0);
          setPlaying(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      subMode,
      mass1Kg,
      mass2Kg,
      angleDeg,
      muStatic,
      muKinetic,
      planeLengthM,
      pulleyMassKg,
      pendulumLengthM,
      pendulumLength2M,
      initialAngleDeg,
      initialAngle2Deg,
      pendulumMass1Kg,
      pendulumMass2Kg,
      springK,
      springKc,
      dampingC,
      springX0M,
      driverAmplitudeN,
      v1InitialMs,
      v2InitialMs,
      restitutionE,
      impactParameterM,
      bulletMassKg,
      bulletSpeedMs,
      blockMassKg,
      flywheelInertia,
      axleRadiusM,
      fallHeightM,
      rollingShape,
      gyroMassKg,
      spinSpeedRadS,
      cylinderDistanceM,
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void simulate(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [simulate]);

  useEffect(() => {
    if (!playing || !result || result.series.length === 0) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      setProgress((p) => {
        const next = p + dt / 4500;
        return next >= 1 ? 0 : next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, result]);

  function recordRow() {
    if (!result) return;
    let primary = 0;
    let unit = "";
    if (subMode === "inclined_plane") {
      primary = Number(result.summary.accelerationMs2);
      unit = "m/s²";
    } else if (subMode === "pendulum" || subMode === "double_pendulum") {
      primary = Number(result.summary.nonlinearPeriodS ?? result.summary.smallAnglePeriodS ?? 0);
      unit = "s";
    } else if (subMode === "hooke_spring" || subMode === "coupled_oscillators") {
      primary = Number(result.summary.periodS ?? result.summary.beatPeriodS ?? 0);
      unit = "s";
    } else if (subMode === "collision" || subMode === "collision_2d") {
      primary = Number(result.summary.momentumAfterKgMs ?? result.summary.scatteringAngleTotalDeg ?? 0);
      unit = subMode === "collision" ? "kg·m/s" : "°";
    } else if (subMode === "ballistic_pendulum") {
      primary = Number(result.summary.bulletSpeedMs ?? 0);
      unit = "m/s";
    } else if (subMode === "rolling") {
      primary = Number(result.summary.accelerationMs2 ?? 0);
      unit = "m/s²";
    } else {
      primary = Number(result.summary.angularAccelRadS2 ?? result.summary.precessionSpeedRadS ?? 0);
      unit = "rad/s²";
    }

    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: `${subMode} o‘lchovi`,
        primaryValue: primary,
        unit,
        details: result.summary,
      },
    ]);
  }

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.subMode === "string") {
      if (p.subMode === "incline_plane") setSubMode("inclined_plane");
      else if (
        [
          "inclined_plane",
          "pendulum",
          "double_pendulum",
          "hooke_spring",
          "coupled_oscillators",
          "forced_damped_resonance",
          "collision",
          "collision_2d",
          "ballistic_pendulum",
          "flywheel",
          "rolling",
          "gyroscope",
          "oberbeck_pendulum",
          "maxwell_wheel",
        ].includes(p.subMode)
      ) {
        setSubMode(p.subMode as DynamicsSubMode);
      }
    }
    if (typeof p.massKg === "number") setMass1Kg(p.massKg);
    if (typeof p.m1Kg === "number") setMass1Kg(p.m1Kg);
    if (typeof p.m2Kg === "number") setMass2Kg(p.m2Kg);
    if (typeof p.angleDeg === "number") setAngleDeg(p.angleDeg);
    if (typeof p.frictionCoeff === "number") setMuKinetic(p.frictionCoeff);
    if (typeof p.springConstantNm === "number") setSpringK(p.springConstantNm);
  }

  const pts0 = result?.series?.[0]?.points ?? [];
  const pts1 = result?.series?.[1]?.points ?? [];
  const idx = pts0.length > 0 ? Math.min(pts0.length - 1, Math.floor(progress * (pts0.length - 1))) : 0;
  const val0 = pts0[idx]?.y ?? 0;
  const val1 = pts1[idx]?.y ?? 0;
  const tCur = pts0[idx]?.x ?? 0;

  return (
    <div className="space-y-4">
      <ScenarioCatalogSelector
        chapter="dynamics"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      {/* Submode Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "inclined_plane", label: "Qiya Tekislik & Bog'langan Jismlar (FBD)" },
            { id: "pendulum", label: "Matematik / Kater Mayatnigi" },
            { id: "double_pendulum", label: "Xaos: Qo'shaloq Mayatnik" },
            { id: "hooke_spring", label: "Guk Qonuni & So'nuvchi Tebranish" },
            { id: "coupled_oscillators", label: "Bog'langan Tebranishlar & Urishlar" },
            { id: "forced_damped_resonance", label: "Majburiy Tebranish & Rezonans" },
            { id: "collision", label: "1D To'qnashuv (Elastik/Noelastik)" },
            { id: "collision_2d", label: "2D Qiya To'qnashuv (Bilyard)" },
            { id: "ballistic_pendulum", label: "Ballistik Mayatnik" },
            { id: "rolling", label: "Inersiya Momentlari Dumalashi" },
            { id: "gyroscope", label: "Giroskop Presessiyasi" },
            { id: "oberbeck_pendulum", label: "Oberbek Mayatnigi" },
            { id: "maxwell_wheel", label: "Maksvell G'ildiragi" },
            { id: "flywheel", label: "Maxovik Inersiyasi" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id as DynamicsSubMode)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                subMode === m.id
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-xs"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => simulate(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Bazaga yozib hisoblash
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Control Panel */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs lg:col-span-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tajriba Parametrlari
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Har bir parametr o'zgarishi dinamik tenglamalarni real vaqtda qayta hisoblaydi
            </p>
          </div>

          {/* INCLINED PLANE PARAMS */}
          {subMode === "inclined_plane" && (
            <>
              <ParamInput
                label="1-jism massasi (qiya sirtda)"
                symbol="m₁"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.5}
                sliderMax={25}
                step={0.1}
                minValid={0.001}
              />
              <ParamInput
                label="2-jism massasi (osilgan yuk)"
                symbol="m₂"
                unit="kg"
                value={mass2Kg}
                onChange={setMass2Kg}
                sliderMin={0}
                sliderMax={20}
                step={0.1}
                minValid={0}
              />
              <ParamInput
                label="Qiyalik burchagi"
                symbol="θ"
                unit="°"
                value={angleDeg}
                onChange={setAngleDeg}
                sliderMin={1}
                sliderMax={85}
                step={0.5}
                minValid={0.5}
                maxValid={89.5}
              />
              <ParamInput
                label="Qiya tekislik uzunligi"
                symbol="L"
                unit="m"
                value={planeLengthM}
                onChange={setPlaneLengthM}
                sliderMin={0.5}
                sliderMax={10}
                step={0.1}
                minValid={0.1}
              />
              <ParamInput
                label="Tinchlik ishqalanish koeffitsiyenti"
                symbol="μ_s"
                unit=""
                value={muStatic}
                onChange={(v) => {
                  setMuStatic(v);
                  if (muKinetic > v) setMuKinetic(v);
                }}
                sliderMin={0}
                sliderMax={1.2}
                step={0.01}
                minValid={0}
              />
              <ParamInput
                label="Sirpanish ishqalanish koeffitsiyenti"
                symbol="μ_k"
                unit=""
                value={muKinetic}
                onChange={setMuKinetic}
                sliderMin={0}
                sliderMax={Math.max(0.05, muStatic)}
                step={0.01}
                minValid={0}
                maxValid={muStatic}
              />
              <ParamInput
                label="G'altak (blok) massasi"
                symbol="m_blok"
                unit="kg"
                value={pulleyMassKg}
                onChange={setPulleyMassKg}
                sliderMin={0}
                sliderMax={2.0}
                step={0.05}
                minValid={0}
              />

              {/* Vector Decomposition HUD Toggles */}
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                  <span>📐 Vektorlar va Kuchlar HUD</span>
                  <button
                    type="button"
                    onClick={() => setShowFbdModal(true)}
                    className="text-[#1E3A8A] hover:underline text-[10.5px] font-semibold"
                  >
                    FBD Paneli ↗
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllVectors}
                      onChange={(e) => setShowAllVectors(e.target.checked)}
                      className="accent-[#1E3A8A]"
                    />
                    <span>Asosiy Kuchlar (N, m₁g, T)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDecomposition}
                      onChange={(e) => setShowDecomposition(e.target.checked)}
                      className="accent-[#1E3A8A]"
                    />
                    <span>Proyeksiyalar (F∥, F⊥)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFrictionTension}
                      onChange={(e) => setShowFrictionTension(e.target.checked)}
                      className="accent-[#1E3A8A]"
                    />
                    <span>Ishqalanish & Taranglik</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showForceValues}
                      onChange={(e) => setShowForceValues(e.target.checked)}
                      className="accent-[#1E3A8A]"
                    />
                    <span>Nyutondagi Qiymatlar</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={showAngleArc}
                      onChange={(e) => setShowAngleArc(e.target.checked)}
                      className="accent-[#1E3A8A]"
                    />
                    <span>Burchak yoyi (θ = {angleDeg}°)</span>
                  </label>
                </div>
              </div>

              <MathFormula
                display
                tex="a = \frac{m_2 g - m_1 g\sin\theta - \mu_k m_1 g\cos\theta}{m_1 + m_2 + \frac{1}{2}m_{\text{blok}}}"
              />
            </>
          )}

          {/* PENDULUM PARAMS */}
          {subMode === "pendulum" && (
            <>
              <ParamInput
                label="Mayatnik ipi uzunligi"
                symbol="L"
                unit="m"
                value={pendulumLengthM}
                onChange={setPendulumLengthM}
                sliderMin={0.2}
                sliderMax={5}
                step={0.05}
                minValid={0.1}
              />
              <ParamInput
                label="Boshlang‘ich og‘ish burchagi"
                symbol="θ₀"
                unit="°"
                value={initialAngleDeg}
                onChange={setInitialAngleDeg}
                sliderMin={1}
                sliderMax={179.5}
                step={0.5}
                minValid={0.1}
                maxValid={179.5}
              />
              <MathFormula display tex="T \approx 2\pi\sqrt{\frac{L}{g}}\left(1 + \frac{1}{16}\theta_0^2 + \frac{11}{3072}\theta_0^4\right)" />
            </>
          )}

          {/* DOUBLE PENDULUM */}
          {subMode === "double_pendulum" && (
            <>
              <ParamInput
                label="1-zveno uzunligi"
                symbol="L₁"
                unit="m"
                value={pendulumLengthM}
                onChange={setPendulumLengthM}
                sliderMin={0.2}
                sliderMax={2.0}
                step={0.05}
              />
              <ParamInput
                label="2-zveno uzunligi"
                symbol="L₂"
                unit="m"
                value={pendulumLength2M}
                onChange={setPendulumLength2M}
                sliderMin={0.2}
                sliderMax={2.0}
                step={0.05}
              />
              <ParamInput
                label="1-yuk massasi"
                symbol="m₁"
                unit="kg"
                value={pendulumMass1Kg}
                onChange={setPendulumMass1Kg}
                sliderMin={0.1}
                sliderMax={5.0}
                step={0.1}
              />
              <ParamInput
                label="2-yuk massasi"
                symbol="m₂"
                unit="kg"
                value={pendulumMass2Kg}
                onChange={setPendulumMass2Kg}
                sliderMin={0.1}
                sliderMax={5.0}
                step={0.1}
              />
              <ParamInput
                label="1-burchak"
                symbol="θ₁"
                unit="°"
                value={initialAngleDeg}
                onChange={setInitialAngleDeg}
                sliderMin={-170}
                sliderMax={170}
                step={1}
              />
              <ParamInput
                label="2-burchak"
                symbol="θ₂"
                unit="°"
                value={initialAngle2Deg}
                onChange={setInitialAngle2Deg}
                sliderMin={-170}
                sliderMax={170}
                step={1}
              />
              <MathFormula display tex="\frac{d}{dt}\frac{\partial L}{\partial \dot{\theta}_i} - \frac{\partial L}{\partial \theta_i} = 0 \quad (\text{Lagranj Xaosi})" />
            </>
          )}

          {/* HOOKE SPRING */}
          {subMode === "hooke_spring" && (
            <>
              <ParamInput
                label="Prujina bikrligi"
                symbol="k"
                unit="N/m"
                value={springK}
                onChange={setSpringK}
                sliderMin={2}
                sliderMax={250}
                step={1}
                minValid={0.5}
              />
              <ParamInput
                label="Yuk massasi"
                symbol="m"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.1}
                sliderMax={10}
                step={0.05}
                minValid={0.05}
              />
              <ParamInput
                label="So‘nish koeffitsiyenti"
                symbol="c"
                unit="N·s/m"
                value={dampingC}
                onChange={setDampingC}
                sliderMin={0}
                sliderMax={5}
                step={0.02}
                minValid={0}
              />
              <ParamInput
                label="Boshlang‘ich siljish"
                symbol="x₀"
                unit="m"
                value={springX0M}
                onChange={setSpringX0M}
                sliderMin={-0.4}
                sliderMax={0.4}
                step={0.01}
              />
              <MathFormula display tex="m\ddot{x} + c\dot{x} + kx = 0, \quad \zeta = \frac{c}{2\sqrt{km}}" />
            </>
          )}

          {/* COUPLED OSCILLATORS */}
          {subMode === "coupled_oscillators" && (
            <>
              <ParamInput
                label="Asosiy prujinalar bikrligi"
                symbol="k"
                unit="N/m"
                value={springK}
                onChange={setSpringK}
                sliderMin={5}
                sliderMax={150}
                step={1}
              />
              <ParamInput
                label="Bog'lovchi prujina bikrligi"
                symbol="k_c"
                unit="N/m"
                value={springKc}
                onChange={setSpringKc}
                sliderMin={0.5}
                sliderMax={50}
                step={0.5}
              />
              <ParamInput
                label="1-vagoncha massasi"
                symbol="m₁"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.1}
                sliderMax={5}
                step={0.1}
              />
              <ParamInput
                label="2-vagoncha massasi"
                symbol="m₂"
                unit="kg"
                value={mass2Kg}
                onChange={setMass2Kg}
                sliderMin={0.1}
                sliderMax={5}
                step={0.1}
              />
              <MathFormula display tex="\omega_1 = \sqrt{\frac{k}{m}}, \quad \omega_2 = \sqrt{\frac{k+2k_c}{m}}" />
            </>
          )}

          {/* FORCED DAMPED RESONANCE */}
          {subMode === "forced_damped_resonance" && (
            <>
              <ParamInput
                label="Majburlovchi kuch amplitudasi"
                symbol="F₀"
                unit="N"
                value={driverAmplitudeN}
                onChange={setDriverAmplitudeN}
                sliderMin={0.5}
                sliderMax={20}
                step={0.5}
              />
              <ParamInput
                label="Prujina bikrligi"
                symbol="k"
                unit="N/m"
                value={springK}
                onChange={setSpringK}
                sliderMin={5}
                sliderMax={200}
                step={5}
              />
              <ParamInput
                label="Massa"
                symbol="m"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.1}
                sliderMax={5}
                step={0.1}
              />
              <ParamInput
                label="So‘nish koeffitsiyenti"
                symbol="c"
                unit="N·s/m"
                value={dampingC}
                onChange={setDampingC}
                sliderMin={0.02}
                sliderMax={2.0}
                step={0.02}
              />
              <MathFormula display tex="A(\Omega) = \frac{F_0/m}{\sqrt{(\omega_0^2 - \Omega^2)^2 + 4\beta^2\Omega^2}}" />
            </>
          )}

          {/* 1D COLLISION */}
          {subMode === "collision" && (
            <>
              <ParamInput
                label="1-vagoncha massasi"
                symbol="m₁"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.1}
                sliderMax={20}
                step={0.1}
                minValid={0.001}
              />
              <ParamInput
                label="2-vagoncha massasi"
                symbol="m₂"
                unit="kg"
                value={mass2Kg}
                onChange={setMass2Kg}
                sliderMin={0.1}
                sliderMax={20}
                step={0.1}
                minValid={0.001}
              />
              <ParamInput
                label="1-vagoncha boshlang‘ich tezligi"
                symbol="u₁"
                unit="m/s"
                value={v1InitialMs}
                onChange={setV1InitialMs}
                sliderMin={-15}
                sliderMax={15}
                step={0.1}
              />
              <ParamInput
                label="2-vagoncha boshlang‘ich tezligi"
                symbol="u₂"
                unit="m/s"
                value={v2InitialMs}
                onChange={setV2InitialMs}
                sliderMin={-15}
                sliderMax={15}
                step={0.1}
              />
              <ParamInput
                label="Tiklanish koeffitsiyenti"
                symbol="e"
                unit=""
                value={restitutionE}
                onChange={setRestitutionE}
                sliderMin={0}
                sliderMax={1}
                step={0.05}
                minValid={0}
                maxValid={1}
              />
              <MathFormula display tex="e = \frac{v_2 - v_1}{u_1 - u_2}, \quad \sum \vec{p}_i = \sum \vec{p}_f" />
            </>
          )}

          {/* 2D OBLIQUE COLLISION */}
          {subMode === "collision_2d" && (
            <>
              <ParamInput
                label="1-sharcha tezligi"
                symbol="u₁"
                unit="m/s"
                value={v1InitialMs}
                onChange={setV1InitialMs}
                sliderMin={1}
                sliderMax={15}
                step={0.2}
              />
              <ParamInput
                label="To'qnashuv parametri (nishon masofasi)"
                symbol="b"
                unit="m"
                value={impactParameterM}
                onChange={setImpactParameterM}
                sliderMin={0}
                sliderMax={0.095}
                step={0.005}
              />
              <ParamInput
                label="Tiklanish koeffitsiyenti"
                symbol="e"
                unit=""
                value={restitutionE}
                onChange={setRestitutionE}
                sliderMin={0}
                sliderMax={1}
                step={0.05}
              />
              <MathFormula display tex="\sin\alpha = \frac{b}{r_1 + r_2}, \quad J_n = \frac{(1+e)v_{rel,n}}{\frac{1}{m_1} + \frac{1}{m_2}}" />
            </>
          )}

          {/* BALLISTIC PENDULUM */}
          {subMode === "ballistic_pendulum" && (
            <>
              <ParamInput
                label="O'q massasi"
                symbol="m_o'q"
                unit="kg"
                value={bulletMassKg}
                onChange={setBulletMassKg}
                sliderMin={0.002}
                sliderMax={0.05}
                step={0.001}
              />
              <ParamInput
                label="O'q tezligi"
                symbol="v_o'q"
                unit="m/s"
                value={bulletSpeedMs}
                onChange={setBulletSpeedMs}
                sliderMin={50}
                sliderMax={1000}
                step={10}
              />
              <ParamInput
                label="Blok massasi"
                symbol="M_blok"
                unit="kg"
                value={blockMassKg}
                onChange={setBlockMassKg}
                sliderMin={0.5}
                sliderMax={10}
                step={0.1}
              />
              <ParamInput
                label="Ip uzunligi"
                symbol="L"
                unit="m"
                value={pendulumLengthM}
                onChange={setPendulumLengthM}
                sliderMin={0.5}
                sliderMax={3.0}
                step={0.1}
              />
              <MathFormula display tex="v_{\text{o'q}} = \frac{m + M}{m}\sqrt{2gh}" />
            </>
          )}

          {/* ROLLING MOTION */}
          {subMode === "rolling" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Jism shakli (Inersiya momenti):</label>
                <select
                  value={rollingShape}
                  onChange={(e) => setRollingShape(e.target.value as any)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                >
                  <option value="solid_sphere">Yaxlit shar (I = 2/5 mR²)</option>
                  <option value="solid_cylinder">Yaxlit silindr / disk (I = 1/2 mR²)</option>
                  <option value="hollow_sphere">Qobiq sferik pufak (I = 2/3 mR²)</option>
                  <option value="hollow_cylinder">Yupqa halqa / quvur (I = mR²)</option>
                </select>
              </div>
              <ParamInput
                label="Qiyalik burchagi"
                symbol="θ"
                unit="°"
                value={angleDeg}
                onChange={setAngleDeg}
                sliderMin={2}
                sliderMax={80}
                step={1}
              />
              <ParamInput
                label="Tinchlik ishqalanishi"
                symbol="μ_s"
                unit=""
                value={muStatic}
                onChange={setMuStatic}
                sliderMin={0.05}
                sliderMax={1.0}
                step={0.01}
              />
              <MathFormula display tex="a = \frac{g\sin\theta}{1 + \beta}, \quad \beta = \frac{I}{mR^2}" />
            </>
          )}

          {/* GYROSCOPE */}
          {subMode === "gyroscope" && (
            <>
              <ParamInput
                label="Giroskop diski massasi"
                symbol="M"
                unit="kg"
                value={gyroMassKg}
                onChange={setGyroMassKg}
                sliderMin={0.2}
                sliderMax={5.0}
                step={0.1}
              />
              <ParamInput
                label="Aylanish tezligi"
                symbol="ω_ayl"
                unit="rad/s"
                value={spinSpeedRadS}
                onChange={setSpinSpeedRadS}
                sliderMin={20}
                sliderMax={500}
                step={10}
              />
              <MathFormula display tex="\Omega_p = \frac{\tau}{L} = \frac{Mgd}{I\omega_{\text{ayl}}}" />
            </>
          )}

          {/* OBERBECK PENDULUM */}
          {subMode === "oberbeck_pendulum" && (
            <>
              <ParamInput
                label="Yuklarning o'qqacha masofasi"
                symbol="R_yuk"
                unit="m"
                value={cylinderDistanceM}
                onChange={setCylinderDistanceM}
                sliderMin={0.05}
                sliderMax={0.4}
                step={0.01}
              />
              <ParamInput
                label="Tushuvchi yuk massasi"
                symbol="m"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.05}
                sliderMax={1.0}
                step={0.05}
              />
              <MathFormula display tex="I = I_{\text{xoch}} + 4 m_{\text{yuk}} R^2, \quad \varepsilon = \frac{mgr}{I + mr^2}" />
            </>
          )}

          {/* MAXWELL WHEEL */}
          {subMode === "maxwell_wheel" && (
            <>
              <ParamInput
                label="Disk massasi"
                symbol="M"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.2}
                sliderMax={3.0}
                step={0.1}
              />
              <ParamInput
                label="Tushish balandligi"
                symbol="h"
                unit="m"
                value={fallHeightM}
                onChange={setFallHeightM}
                sliderMin={0.2}
                sliderMax={2.0}
                step={0.05}
              />
              <MathFormula display tex="a = \frac{g}{1 + I/(Mr^2)}, \quad v = \sqrt{2ah}" />
            </>
          )}

          {/* FLYWHEEL */}
          {subMode === "flywheel" && (
            <>
              <ParamInput
                label="Inersiya momenti"
                symbol="I"
                unit="kg·m²"
                value={flywheelInertia}
                onChange={setFlywheelInertia}
                sliderMin={0.005}
                sliderMax={1}
                step={0.005}
                minValid={0.0001}
              />
              <ParamInput
                label="Osilgan yuk massasi"
                symbol="m"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.1}
                sliderMax={10}
                step={0.1}
                minValid={0.001}
              />
              <ParamInput
                label="Val radiusi"
                symbol="r"
                unit="m"
                value={axleRadiusM}
                onChange={setAxleRadiusM}
                sliderMin={0.01}
                sliderMax={0.2}
                step={0.005}
                minValid={0.002}
              />
              <ParamInput
                label="Tushish balandligi"
                symbol="h"
                unit="m"
                value={fallHeightM}
                onChange={setFallHeightM}
                sliderMin={0.2}
                sliderMax={5}
                step={0.1}
                minValid={0.05}
              />
              <MathFormula display tex="\varepsilon = \frac{mgr}{I + mr^2}, \quad E_{\text{ayl}} = \frac{1}{2}I\omega^2" />
            </>
          )}

          <button
            type="button"
            onClick={recordRow}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#172554] shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            O‘lchovni jurnalga yozish
          </button>
        </div>

        {/* Right Stage & Visualization Area */}
        <div className="space-y-4 lg:col-span-8">
          {result && (
            <>
              {/* Animated Apparatus Stage */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#1E3A8A]" />
                      Jonli Dinamik Tajriba Stendi (Klassik Nyuton Mexanikasi)
                    </h3>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
                      t = <strong className="text-[#1E3A8A]">{tCur.toFixed(2)} s</strong> ·{" "}
                      {subMode === "inclined_plane"
                        ? `s(t) = ${val0.toFixed(3)} m · v(t) = ${val1.toFixed(3)} m/s · a = ${String(result.summary.accelerationMs2)} m/s²`
                        : subMode === "pendulum"
                        ? `θ(t) = ${val0.toFixed(2)}° · ω(t) = ${val1.toFixed(3)} rad/s`
                        : subMode === "double_pendulum"
                        ? `θ₁(t) = ${val0.toFixed(1)}° · θ₂(t) = ${val1.toFixed(1)}°`
                        : subMode === "hooke_spring"
                        ? `x(t) = ${val0.toFixed(4)} m · E(t) = ${val1.toFixed(4)} J`
                        : subMode === "coupled_oscillators"
                        ? `x₁(t) = ${val0.toFixed(4)} m · x₂(t) = ${val1.toFixed(4)} m`
                        : subMode === "collision"
                        ? `x₁(t) = ${val0.toFixed(2)} m · x₂(t) = ${val1.toFixed(2)} m`
                        : subMode === "ballistic_pendulum"
                        ? `θ(t) = ${val0.toFixed(2)}° · v_o'q = ${String(result.summary.bulletSpeedMs)} m/s`
                        : subMode === "rolling"
                        ? `s(t) = ${val0.toFixed(3)} m · v(t) = ${val1.toFixed(3)} m/s`
                        : `ω(t) = ${val0.toFixed(2)} rad/s · t = ${tCur.toFixed(2)} s`}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRealisticView((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        realisticView
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {realisticView ? "🎨 Realistik Stend" : "📐 Chizma To'r"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaying((p) => !p)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                    >
                      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {playing ? "Pauza" : "O‘ynatish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProgress(0);
                        setPlaying(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Qayta
                    </button>
                  </div>
                </div>

                {/* SVG CANVAS CONTAINER */}
                <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2 bg-slate-50/60 shadow-inner">
                  <svg viewBox="0 0 680 270" className="h-64 w-full select-none">
                    <defs>
                      <marker id="dynArrBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#1E3A8A" />
                      </marker>
                      <marker id="dynArrRed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#B91C1C" />
                      </marker>
                      <marker id="dynArrGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#15803D" />
                      </marker>
                      <marker id="dynArrPurple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#7E22CE" />
                      </marker>
                      <marker id="dynArrAmber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#D97706" />
                      </marker>

                      {/* Brass & Wood Material Gradients */}
                      <radialGradient id="brassGrad" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="25%" stopColor="#FEF08A" />
                        <stop offset="60%" stopColor="#CA8A04" />
                        <stop offset="100%" stopColor="#713F12" />
                      </radialGradient>
                      <linearGradient id="wedgeWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E2E8F0" />
                        <stop offset="60%" stopColor="#CBD5E1" />
                        <stop offset="100%" stopColor="#94A3B8" />
                      </linearGradient>
                      <linearGradient id="wedgeRealisticWood" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="40%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#78350F" />
                      </linearGradient>
                      <linearGradient id="steelBlockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F8FAFC" />
                        <stop offset="35%" stopColor="#94A3B8" />
                        <stop offset="100%" stopColor="#334155" />
                      </linearGradient>
                    </defs>

                    {/* ======================================================== */}
                    {/* SUBMODE 1: CONNECTED BODIES ON INCLINED PLANE            */}
                    {/* EXACT DIAGRAM REPRODUCTION FROM USER IMAGE               */}
                    {/* ======================================================== */}
                    {subMode === "inclined_plane" && (() => {
                      const rad = (angleDeg * Math.PI) / 180;
                      const rampLen = 320;
                      const topX = 430;
                      const topY = 55;
                      const baseX = topX - rampLen * Math.cos(rad);
                      const baseY = topY + rampLen * Math.sin(rad);

                      const dir = String(result.summary.direction ?? "static");
                      const moving = Boolean(result.summary.moving);

                      // Block 1 position on slope:
                      const frac =
                        dir === "down_slope"
                          ? Math.min(0.82, 0.25 + (Math.abs(val0) / Math.max(0.2, planeLengthM)) * 0.57)
                          : dir === "up_slope"
                          ? Math.max(0.18, 0.82 - (Math.abs(val0) / Math.max(0.2, planeLengthM)) * 0.57)
                          : 0.5;

                      const b1CenterDist = frac * rampLen;
                      const b1X = topX - b1CenterDist * Math.cos(rad);
                      const b1Y = topY + b1CenterDist * Math.sin(rad);

                      // Block 2 position:
                      // When Block 1 moves down slope (down_slope), Block 2 moves up.
                      // When Block 1 moves up slope (up_slope), Block 2 moves down.
                      const dropInit = 110;
                      const dropY =
                        dir === "down_slope"
                          ? Math.max(75, dropInit - (frac - 0.25) * 60)
                          : dir === "up_slope"
                          ? Math.min(220, dropInit + (0.82 - frac) * 60)
                          : dropInit;

                      // Numerical force values for vector arrow scaling
                      const N = Number(result.summary.normalForceN ?? 0);
                      const Fg1 = Number(result.summary.trueGravityN ?? mass1Kg * 9.8);
                      const FgPar = Number(result.summary.gravityParallelN ?? 0);
                      const FgPerp = Number(result.summary.gravityPerpendicularN ?? 0);
                      const Fk = Number(result.summary.actualFrictionN ?? 0);
                      const T = Number(result.summary.tensionN ?? 0);
                      const Fg2 = Number(result.summary.hangingWeightN ?? mass2Kg * 9.8);

                      // Arrow scaling factor: scale proportional to Newtons
                      const maxF = Math.max(Fg1, Fg2, N, 25);
                      const scale = 58 / maxF;
                      const lenN = Math.min(75, Math.max(22, N * scale));
                      const lenFg1 = Math.min(75, Math.max(22, Fg1 * scale));
                      const lenPar = Math.min(75, Math.max(18, FgPar * scale));
                      const lenPerp = Math.min(75, Math.max(18, FgPerp * scale));
                      const lenFk = Math.min(65, Math.max(15, Fk * scale));
                      const lenT1 = Math.min(75, Math.max(20, T * scale));
                      const lenT2 = Math.min(75, Math.max(20, T * scale));
                      const lenFg2 = Math.min(75, Math.max(22, Fg2 * scale));

                      // Angle Arc path at bottom-left corner (baseX, baseY)
                      const arcR = 40;
                      const arcEndX = baseX + arcR * Math.cos(rad);
                      const arcEndY = baseY - arcR * Math.sin(rad);
                      const arcStartX = baseX + arcR;
                      const arcStartY = baseY;

                      // Pulley coordinates at top apex
                      const pulleyR = 14;
                      const pulleyCx = topX + pulleyR * Math.sin(rad) + 2;
                      const pulleyCy = topY - pulleyR * Math.cos(rad) + 2;
                      const pulleyHangX = pulleyCx + pulleyR;

                      // Block 1 dimensions
                      const blockW = 54;
                      const blockH = 34;

                      // Friction direction along slope:
                      // If moving down_slope or static with net downhill drive => friction opposes, points uphill (+slope direction towards top)
                      // If moving up_slope or static with net uphill drive => friction points downhill (-slope direction towards base)
                      const fkPointsUphill =
                        dir === "down_slope" || (dir === "static" && FgPar > Fg2);

                      return (
                        <>
                          {/* Ground Surface */}
                          <line
                            x1={baseX - 35}
                            y1={baseY}
                            x2={topX + 130}
                            y2={baseY}
                            stroke="#334155"
                            strokeWidth="3"
                          />
                          {/* Ground hatch marks */}
                          {Array.from({ length: 24 }).map((_, i) => (
                            <line
                              key={i}
                              x1={baseX - 30 + i * 22}
                              y1={baseY}
                              x2={baseX - 40 + i * 22}
                              y2={baseY + 10}
                              stroke="#94A3B8"
                              strokeWidth="1.2"
                            />
                          ))}

                          {/* Wedge Body */}
                          <polygon
                            points={`${topX},${topY} ${baseX},${baseY} ${topX},${baseY}`}
                            fill={realisticView ? "url(#wedgeRealisticWood)" : "url(#wedgeWoodGrad)"}
                            stroke="#1E293B"
                            strokeWidth="2.5"
                          />

                          {/* Angle arc at bottom vertex θ */}
                          {showAngleArc && (
                            <g>
                              <path
                                d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
                                fill="none"
                                stroke="#1E3A8A"
                                strokeWidth="2"
                              />
                              <text
                                x={baseX + arcR + 8}
                                y={baseY - 10}
                                fontSize="12"
                                fill="#1E3A8A"
                                fontWeight="800"
                                fontFamily="monospace"
                              >
                                {angleDeg.toFixed(0)}°
                              </text>
                            </g>
                          )}

                          {/* Pulley at apex */}
                          <g>
                            {/* Pulley bracket */}
                            <line x1={topX} y1={topY} x2={pulleyCx} y2={pulleyCy} stroke="#475569" strokeWidth="4" />
                            {/* Pulley wheel */}
                            <circle
                              cx={pulleyCx}
                              cy={pulleyCy}
                              r={pulleyR}
                              fill="#CBD5E1"
                              stroke="#0F172A"
                              strokeWidth="2.5"
                            />
                            {/* Rotating groove spokes */}
                            <g transform={`rotate(${(progress * 360 * (dir === "down_slope" ? 1 : -1)) % 360}, ${pulleyCx}, ${pulleyCy})`}>
                              <line x1={pulleyCx - pulleyR + 3} y1={pulleyCy} x2={pulleyCx + pulleyR - 3} y2={pulleyCy} stroke="#475569" strokeWidth="1.5" />
                              <line x1={pulleyCx} y1={pulleyCy - pulleyR + 3} x2={pulleyCx} y2={pulleyCy + pulleyR - 3} stroke="#475569" strokeWidth="1.5" />
                            </g>
                            <circle cx={pulleyCx} cy={pulleyCy} r={3.5} fill="#0F172A" />
                          </g>

                          {/* Cord: from Block 1 along slope to pulley, over pulley, down to Block 2 */}
                          <line
                            x1={b1X + (blockW / 2) * Math.cos(rad) - (blockH / 2) * Math.sin(rad)}
                            y1={b1Y - (blockW / 2) * Math.sin(rad) - (blockH / 2) * Math.cos(rad)}
                            x2={pulleyCx - pulleyR * Math.sin(rad)}
                            y2={pulleyCy - pulleyR * Math.cos(rad)}
                            stroke="#0F172A"
                            strokeWidth="2.2"
                          />
                          <path
                            d={`M ${pulleyCx - pulleyR * Math.sin(rad)} ${pulleyCy - pulleyR * Math.cos(rad)} A ${pulleyR} ${pulleyR} 0 0 1 ${pulleyHangX} ${pulleyCy}`}
                            fill="none"
                            stroke="#0F172A"
                            strokeWidth="2.2"
                          />
                          <line
                            x1={pulleyHangX}
                            y1={pulleyCy}
                            x2={pulleyHangX}
                            y2={dropY}
                            stroke="#0F172A"
                            strokeWidth="2.2"
                          />

                          {/* ============================================== */}
                          {/* BLOCK 2 (HANGING MASS m2) & ITS 2 FORCE VECTORS */}
                          {/* ============================================== */}
                          <g transform={`translate(${pulleyHangX}, ${dropY})`}>
                            {/* Hanging Block Box */}
                            <rect
                              x={-18}
                              y={0}
                              width={36}
                              height={34}
                              rx={3}
                              fill={realisticView ? "#B91C1C" : "#991B1B"}
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              className="shadow-sm"
                            />
                            {/* Label "2" inside */}
                            <text
                              x={0}
                              y={22}
                              textAnchor="middle"
                              fontSize="16"
                              fill="#FFFFFF"
                              fontWeight="900"
                              fontFamily="sans-serif"
                            >
                              2
                            </text>

                            {/* FORCE VECTOR T (Tension pointing straight UP) */}
                            {showFrictionTension && (
                              <g>
                                <line
                                  x1={0}
                                  y1={0}
                                  x2={0}
                                  y2={-lenT2}
                                  stroke="#1E3A8A"
                                  strokeWidth="2.6"
                                  markerEnd="url(#dynArrBlue)"
                                />
                                <text
                                  x={8}
                                  y={-lenT2 + 10}
                                  fontSize="11"
                                  fill="#1E3A8A"
                                  fontWeight="800"
                                  fontFamily="sans-serif"
                                >
                                  T {showForceValues ? `(${T.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}

                            {/* FORCE VECTOR m2g (Weight pointing straight DOWN) */}
                            {showAllVectors && (
                              <g>
                                <line
                                  x1={0}
                                  y1={34}
                                  x2={0}
                                  y2={34 + lenFg2}
                                  stroke="#B91C1C"
                                  strokeWidth="2.6"
                                  markerEnd="url(#dynArrRed)"
                                />
                                <text
                                  x={8}
                                  y={34 + lenFg2}
                                  fontSize="11"
                                  fill="#B91C1C"
                                  fontWeight="800"
                                  fontFamily="sans-serif"
                                >
                                  m₂g {showForceValues ? `(${Fg2.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}
                          </g>

                          {/* ============================================== */}
                          {/* BLOCK 1 (SLIDING MASS m1) & ALL 6 FORCE VECTORS */}
                          {/* ============================================== */}
                          <g transform={`translate(${b1X}, ${b1Y})`}>
                            {/* Rotated Block 1 Body */}
                            <g transform={`rotate(${-angleDeg})`}>
                              <rect
                                x={-blockW / 2}
                                y={-blockH}
                                width={blockW}
                                height={blockH}
                                rx={3}
                                fill={realisticView ? "#FFFFFF" : "#F8FAFC"}
                                stroke="#0F172A"
                                strokeWidth="2.5"
                              />
                              {/* Label "1" exactly matching uploaded image */}
                              <text
                                x={0}
                                y={-10}
                                textAnchor="middle"
                                fontSize="20"
                                fill="#0F172A"
                                fontWeight="900"
                                fontFamily="sans-serif"
                              >
                                1
                              </text>
                            </g>

                            {/* VECTOR 1: N (Normal reaction force: perpendicular to slope pointing OUTWARDS) */}
                            {showAllVectors && (
                              <g transform={`rotate(${-angleDeg})`}>
                                <line
                                  x1={0}
                                  y1={-blockH}
                                  x2={0}
                                  y2={-blockH - lenN}
                                  stroke="#0F172A"
                                  strokeWidth="2.6"
                                  markerEnd="url(#dynArrBlue)"
                                />
                                <text
                                  x={-8}
                                  y={-blockH - lenN - 6}
                                  fontSize="13"
                                  fill="#0F172A"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                >
                                  N {showForceValues ? `(${N.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}

                            {/* VECTOR 2: m1g (True gravity pointing straight DOWN) */}
                            {showAllVectors && (
                              <g>
                                <line
                                  x1={0}
                                  y1={-blockH / 2}
                                  x2={0}
                                  y2={-blockH / 2 + lenFg1}
                                  stroke="#0F172A"
                                  strokeWidth="2.8"
                                  markerEnd="url(#dynArrRed)"
                                />
                                <text
                                  x={6}
                                  y={-blockH / 2 + lenFg1 + 14}
                                  fontSize="13"
                                  fill="#0F172A"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                >
                                  m₁g {showForceValues ? `(${Fg1.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}

                            {/* VECTOR 3: m1g*sin(θ) (Parallel component pointing DOWNHILL along slope) */}
                            {showDecomposition && (
                              <g transform={`rotate(${-angleDeg})`}>
                                <line
                                  x1={-blockW / 2}
                                  y1={-blockH / 2}
                                  x2={-blockW / 2 - lenPar}
                                  y2={-blockH / 2}
                                  stroke="#0F172A"
                                  strokeWidth="2.5"
                                  markerEnd="url(#dynArrBlue)"
                                />
                                <text
                                  x={-blockW / 2 - lenPar - 6}
                                  y={-blockH / 2 + 16}
                                  textAnchor="end"
                                  fontSize="11"
                                  fill="#0F172A"
                                  fontWeight="800"
                                  fontFamily="sans-serif"
                                >
                                  m₁g·sin(θ) {showForceValues ? `(${FgPar.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}

                            {/* VECTOR 4: m1g*cos(θ) (Perpendicular component pointing INTO the slope) */}
                            {showDecomposition && (
                              <g transform={`rotate(${-angleDeg})`}>
                                <line
                                  x1={0}
                                  y1={0}
                                  x2={0}
                                  y2={lenPerp}
                                  stroke="#0F172A"
                                  strokeWidth="2.5"
                                  markerEnd="url(#dynArrBlue)"
                                />
                                <text
                                  x={8}
                                  y={lenPerp + 14}
                                  fontSize="11"
                                  fill="#0F172A"
                                  fontWeight="800"
                                  fontFamily="sans-serif"
                                >
                                  m₁g·cos(θ) {showForceValues ? `(${FgPerp.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}

                            {/* VECTOR 5: Fk / fs (Friction force pointing along slope opposing motion) */}
                            {showFrictionTension && Fk > 1e-4 && (
                              <g transform={`rotate(${-angleDeg})`}>
                                {fkPointsUphill ? (
                                  // Points UPHILL (towards pulley)
                                  <g>
                                    <line
                                      x1={blockW / 2}
                                      y1={-2}
                                      x2={blockW / 2 + lenFk}
                                      y2={-2}
                                      stroke="#B91C1C"
                                      strokeWidth="2.5"
                                      markerEnd="url(#dynArrRed)"
                                    />
                                    <text
                                      x={blockW / 2 + lenFk + 6}
                                      y={6}
                                      fontSize="12"
                                      fill="#B91C1C"
                                      fontWeight="900"
                                      fontFamily="sans-serif"
                                    >
                                      F_k {showForceValues ? `(${Fk.toFixed(1)} N)` : ""}
                                    </text>
                                  </g>
                                ) : (
                                  // Points DOWNHILL (opposing uphill drive)
                                  <g>
                                    <line
                                      x1={-blockW / 2}
                                      y1={-2}
                                      x2={-blockW / 2 - lenFk}
                                      y2={-2}
                                      stroke="#B91C1C"
                                      strokeWidth="2.5"
                                      markerEnd="url(#dynArrRed)"
                                    />
                                    <text
                                      x={-blockW / 2 - lenFk - 6}
                                      y={6}
                                      textAnchor="end"
                                      fontSize="12"
                                      fill="#B91C1C"
                                      fontWeight="900"
                                      fontFamily="sans-serif"
                                    >
                                      F_k {showForceValues ? `(${Fk.toFixed(1)} N)` : ""}
                                    </text>
                                  </g>
                                )}
                              </g>
                            )}

                            {/* VECTOR 6: T (Tension on Block 1 pointing UPHILL towards pulley) */}
                            {showFrictionTension && (
                              <g transform={`rotate(${-angleDeg})`}>
                                <line
                                  x1={blockW / 2}
                                  y1={-blockH + 5}
                                  x2={blockW / 2 + lenT1}
                                  y2={-blockH + 5}
                                  stroke="#1E3A8A"
                                  strokeWidth="2.6"
                                  markerEnd="url(#dynArrBlue)"
                                />
                                <text
                                  x={blockW / 2 + lenT1 + 6}
                                  y={-blockH + 4}
                                  fontSize="12"
                                  fill="#1E3A8A"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                >
                                  T {showForceValues ? `(${T.toFixed(1)} N)` : ""}
                                </text>
                              </g>
                            )}
                          </g>

                          {/* Dynamic State Status Badge on Canvas */}
                          <g transform="translate(485, 20)">
                            <rect
                              x={0}
                              y={0}
                              width={180}
                              height={64}
                              rx={6}
                              fill="#FFFFFF"
                              stroke="#E2E8F0"
                              strokeWidth="1.5"
                              className="shadow-xs"
                            />
                            <text x={10} y={18} fontSize="11" fill="#0F172A" fontWeight="800">
                              Harakat:{" "}
                              <tspan
                                fill={
                                  dir === "static"
                                    ? "#475569"
                                    : dir === "down_slope"
                                    ? "#B91C1C"
                                    : "#15803D"
                                }
                              >
                                {dir === "down_slope"
                                  ? "Pastga tezlanish ↓"
                                  : dir === "up_slope"
                                  ? "Yuqoriga tezlanish ↑"
                                  : "Tinch (Muvozanat) ="}
                              </tspan>
                            </text>
                            <text x={10} y={36} fontSize="10.5" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                              a = {String(result.summary.accelerationMs2)} m/s²
                            </text>
                            <text x={10} y={52} fontSize="10.5" fill="#475569" fontFamily="monospace">
                              T = {String(result.summary.tensionN)} N · fk = {String(result.summary.actualFrictionN)} N
                            </text>
                          </g>
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 2: PENDULUM (KATER & NONLINEAR)                  */}
                    {/* ======================================================== */}
                    {subMode === "pendulum" && (() => {
                      const rad = (val0 * Math.PI) / 180;
                      const Lpx = Math.min(180, Math.max(80, 95 + pendulumLengthM * 30));
                      const bx = 340 + Lpx * Math.sin(rad);
                      const by = 30 + Lpx * Math.cos(rad);
                      const vScale = Math.max(-50, Math.min(50, val1 * 14));
                      const tx = bx + vScale * Math.cos(rad);
                      const ty = by - vScale * Math.sin(rad);
                      return (
                        <>
                          <rect x={220} y={20} width={240} height={10} rx={2} fill="#334155" />
                          <line x1={340} y1={28} x2={340} y2={230} stroke="#CBD5E1" strokeDasharray="4 3" />
                          <line x1={340} y1={28} x2={bx} y2={by} stroke="#1E3A8A" strokeWidth="2.8" />
                          {Math.abs(vScale) > 2 && (
                            <line
                              x1={bx}
                              y1={by}
                              x2={tx}
                              y2={ty}
                              stroke="#B91C1C"
                              strokeWidth="2.4"
                              markerEnd="url(#dynArrRed)"
                            />
                          )}
                          <circle cx={340} cy={28} r={5} fill="#0F172A" />
                          <circle cx={bx} cy={by} r={16} fill="url(#brassGrad)" stroke="#FFFFFF" strokeWidth="2.5" />
                          <text x={bx + 22} y={by - 2} fontSize="12" fill="#1E3A8A" fontFamily="monospace" fontWeight="800">
                            θ = {val0.toFixed(1)}°
                          </text>
                          <text x={bx + 22} y={by + 14} fontSize="10.5" fill="#475569" fontFamily="monospace">
                            T_nolin = {String(result.summary.nonlinearPeriodS)} s
                          </text>
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 3: DOUBLE PENDULUM                               */}
                    {/* ======================================================== */}
                    {subMode === "double_pendulum" && (() => {
                      const l1px = Math.min(95, Math.max(50, pendulumLengthM * 60));
                      const l2px = Math.min(85, Math.max(45, pendulumLength2M * 60));
                      const rad1 = (val0 * Math.PI) / 180;
                      const rad2 = (val1 * Math.PI) / 180;
                      const x0 = 340;
                      const y0 = 40;
                      const x1 = x0 + l1px * Math.sin(rad1);
                      const y1 = y0 + l1px * Math.cos(rad1);
                      const x2 = x1 + l2px * Math.sin(rad2);
                      const y2 = y1 + l2px * Math.cos(rad2);

                      return (
                        <>
                          <rect x={240} y={28} width={200} height={10} rx={2} fill="#334155" />
                          <circle cx={x0} cy={y0} r={5} fill="#0F172A" />
                          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#1E3A8A" strokeWidth="3" />
                          <circle cx={x1} cy={y1} r={11} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B91C1C" strokeWidth="2.6" />
                          <circle cx={x2} cy={y2} r={10} fill="#B91C1C" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={x1 + 14} y={y1 + 4} fontSize="11" fill="#1E3A8A" fontWeight="700">m₁</text>
                          <text x={x2 + 14} y={y2 + 4} fontSize="11" fill="#B91C1C" fontWeight="700">m₂</text>
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 4: HOOKE SPRING                                  */}
                    {/* ======================================================== */}
                    {subMode === "hooke_spring" && (() => {
                      const amp = Math.max(0.01, Math.abs(springX0M));
                      const yBob = 125 + Math.max(-65, Math.min(65, (val0 / amp) * 55));
                      const coils = 12;
                      const ptsStr = Array.from({ length: coils + 1 }, (_, k) => {
                        const y = 30 + ((yBob - 30) * k) / coils;
                        const x = k === 0 || k === coils ? 310 : 310 + (k % 2 === 0 ? -16 : 16);
                        return `${x},${y.toFixed(1)}`;
                      }).join(" ");
                      return (
                        <>
                          <rect x={220} y={22} width={240} height={8} rx={2} fill="#334155" />
                          <line x1={180} y1={125} x2={480} y2={125} stroke="#CBD5E1" strokeDasharray="4 3" strokeWidth="1.5" />
                          <polyline points={ptsStr} fill="none" stroke="#1E3A8A" strokeWidth="2.6" />
                          {dampingC > 0 && (
                            <>
                              <line x1={380} y1={30} x2={380} y2={95} stroke="#64748B" strokeWidth="4" />
                              <rect x={372} y={80} width={16} height={30} fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                              <line x1={380} y1={yBob} x2={380} y2={95} stroke="#475569" strokeWidth="2" />
                              <line x1={310} y1={yBob} x2={380} y2={yBob} stroke="#64748B" strokeWidth="2" />
                            </>
                          )}
                          <rect x={282} y={yBob} width={56} height={36} rx={4} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={310} y={yBob + 23} textAnchor="middle" fontSize="12" fill="#FFFFFF" fontWeight="800">
                            {mass1Kg} kg
                          </text>
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 5: COUPLED OSCILLATORS                           */}
                    {/* ======================================================== */}
                    {subMode === "coupled_oscillators" && (() => {
                      const x1px = 220 + val0 * 180;
                      const x2px = 440 + val1 * 180;
                      return (
                        <>
                          <line x1={60} y1={160} x2={620} y2={160} stroke="#334155" strokeWidth="3" />
                          {/* Left wall */}
                          <line x1={70} y1={100} x2={70} y2={160} stroke="#1E293B" strokeWidth="6" />
                          {/* Right wall */}
                          <line x1={610} y1={100} x2={610} y2={160} stroke="#1E293B" strokeWidth="6" />

                          {/* Spring 1 */}
                          <line x1={70} y1={130} x2={x1px - 25} y2={130} stroke="#1E3A8A" strokeWidth="2.5" strokeDasharray="6 3" />
                          {/* Cart 1 */}
                          <rect x={x1px - 25} y={110} width={50} height={34} rx={3} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={x1px} y={132} textAnchor="middle" fontSize="12" fill="#FFFFFF" fontWeight="800">m₁</text>

                          {/* Coupling Spring */}
                          <line x1={x1px + 25} y1={130} x2={x2px - 25} y2={130} stroke="#D97706" strokeWidth="2.5" strokeDasharray="5 2" />

                          {/* Cart 2 */}
                          <rect x={x2px - 25} y={110} width={50} height={34} rx={3} fill="#B91C1C" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={x2px} y={132} textAnchor="middle" fontSize="12" fill="#FFFFFF" fontWeight="800">m₂</text>

                          {/* Spring 2 */}
                          <line x1={x2px + 25} y1={130} x2={610} y2={130} stroke="#1E3A8A" strokeWidth="2.5" strokeDasharray="6 3" />
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 6: BALLISTIC PENDULUM                            */}
                    {/* ======================================================== */}
                    {subMode === "ballistic_pendulum" && (() => {
                      const rad = (val0 * Math.PI) / 180;
                      const Lpx = 140;
                      const bx = 380 + Lpx * Math.sin(rad);
                      const by = 35 + Lpx * Math.cos(rad);
                      const bulletX = tCur < 0.2 ? 60 + (tCur / 0.2) * (380 - 60) : bx;

                      return (
                        <>
                          <rect x={280} y={26} width={200} height={9} rx={2} fill="#334155" />
                          {/* Gun barrel */}
                          <rect x={50} y={160} width={55} height={16} rx={2} fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
                          {/* Bullet */}
                          {tCur < 0.2 && (
                            <ellipse cx={bulletX} cy={168} rx={7} ry={3.5} fill="#D97706" stroke="#92400E" strokeWidth="1" />
                          )}
                          {/* Pendulum suspension wires */}
                          <line x1={370} y1={35} x2={bx - 15} y2={by} stroke="#1E3A8A" strokeWidth="2" />
                          <line x1={390} y1={35} x2={bx + 15} y2={by} stroke="#1E3A8A" strokeWidth="2" />
                          {/* Target block */}
                          <rect x={bx - 25} y={by} width={50} height={40} rx={4} fill="#D97706" stroke="#78350F" strokeWidth="2" />
                          <text x={bx} y={by + 24} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="800">M_blok</text>
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 7: ROLLING MOTION                                */}
                    {/* ======================================================== */}
                    {subMode === "rolling" && (() => {
                      const rad = (angleDeg * Math.PI) / 180;
                      const rampLen = 320;
                      const topX = 460;
                      const topY = 55;
                      const baseX = topX - rampLen * Math.cos(rad);
                      const baseY = topY + rampLen * Math.sin(rad);
                      const frac = Math.min(0.85, 0.15 + progress * 0.7);
                      const curDist = frac * rampLen;
                      const cx = topX - curDist * Math.cos(rad);
                      const cy = topY + curDist * Math.sin(rad);
                      const R = 20;

                      return (
                        <>
                          <line x1={baseX - 30} y1={baseY} x2={topX + 80} y2={baseY} stroke="#334155" strokeWidth="2.5" />
                          <polygon points={`${topX},${topY} ${baseX},${baseY} ${topX},${baseY}`} fill="url(#wedgeWoodGrad)" stroke="#1E293B" strokeWidth="2" />
                          <g transform={`translate(${cx - R * Math.sin(rad)}, ${cy - R * Math.cos(rad)}) rotate(${progress * 720})`}>
                            <circle cx={0} cy={0} r={R} fill="url(#steelBlockGrad)" stroke="#0F172A" strokeWidth="2" />
                            <line x1={-R + 2} y1={0} x2={R - 2} y2={0} stroke="#1E3A8A" strokeWidth="2" />
                            <line x1={0} y1={-R + 2} x2={0} y2={R - 2} stroke="#1E3A8A" strokeWidth="2" />
                          </g>
                        </>
                      );
                    })()}

                    {/* ======================================================== */}
                    {/* SUBMODE 8: GYROSCOPE                                     */}
                    {/* ======================================================== */}
                    {subMode === "gyroscope" && (() => {
                      const spinDeg = (progress * 1440) % 360;
                      const precRad = progress * 2 * Math.PI;
                      const px = 340 + 80 * Math.cos(precRad);
                      const py = 120 + 25 * Math.sin(precRad);

                      return (
                        <>
                          {/* Stand base & Pivot */}
                          <line x1={260} y1={230} x2={420} y2={230} stroke="#334155" strokeWidth="4" />
                          <line x1={340} y1={230} x2={340} y2={120} stroke="#475569" strokeWidth="5" />
                          <circle cx={340} cy={120} r={6} fill="#0F172A" />

                          {/* Axle rod extending to disc */}
                          <line x1={340} y1={120} x2={px} y2={py} stroke="#1E3A8A" strokeWidth="4" />
                          {/* Gyro rotor disc */}
                          <g transform={`translate(${px}, ${py}) rotate(${spinDeg})`}>
                            <ellipse cx={0} cy={0} rx={12} ry={38} fill="url(#brassGrad)" stroke="#713F12" strokeWidth="2" />
                            <line x1={0} y1={-36} x2={0} y2={36} stroke="#0F172A" strokeWidth="1.5" />
                          </g>
                          <ellipse cx={340} cy={120} rx={80} ry={25} fill="none" stroke="#94A3B8" strokeDasharray="3 2" />
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Scrubber Range Slider */}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-600">
                  <span className="font-semibold">Vaqt o‘qi:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.005}
                    value={progress}
                    onChange={(e) => {
                      setPlaying(false);
                      setProgress(Number(e.target.value));
                    }}
                    className="flex-1 accent-[#1E3A8A]"
                  />
                  <span className="font-mono tabular-nums text-slate-800 font-semibold w-12 text-right">
                    {(progress * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Dynamic Summary Cards Grid */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-[#1E3A8A]" />
                    Fizikaviy Kattaliklar & Hisoblangan Natijalar
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Holat: <strong className="text-emerald-700">{String(result.summary.direction ?? "Bajarildi")}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(result.summary).map(([key, value]) => {
                    const formatted = formatMetricValue(key, value);
                    return (
                      <div
                        key={key}
                        className="rounded-md border border-slate-100 bg-slate-50/70 p-2 text-left transition hover:border-slate-300"
                      >
                        <div className="text-[10px] font-medium text-slate-500 truncate" title={formatted.label}>
                          {formatted.label}
                        </div>
                        <div className="mt-1 font-mono text-xs font-bold text-slate-900 break-words">
                          {formatted.equation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Charts Area */}
              {result.series.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {result.series.map((s, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                      <ScientificChart
                        title={s.label}
                        xLabel={s.label.includes("theta") || s.label.includes("omega") ? "t [s]" : "X"}
                        yLabel="Y"
                        height={200}
                        series={[
                          {
                            label: s.label,
                            color: idx === 0 ? "#1E3A8A" : "#B91C1C",
                            points: s.points,
                          },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Formulas Strip */}
          <LabFormulaStrip section="Dinamika" />

          {/* Measurement Journal Table */}
          <LabReportPanel
            labKey="dynamics"
            defaultTitle="3-laboratoriya: Qiya tekislik va Nyuton dinamikasi"
            rows={rows}
            onClearRows={() => setRows([])}
            onDeleteRow={(id) => setRows((p) => p.filter((r) => r.id !== id))}
          />
        </div>
      </div>

      {/* Free Body Diagram (FBD) Modal / Detailed Callout */}
      {showFbdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#1E3A8A]" />
                Erkin Jism Diagrammasi (Free Body Diagram - FBD)
              </h2>
              <button
                type="button"
                onClick={() => setShowFbdModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Block 1 FBD */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                  1-Jism FBD (Qiya sirt bo‘ylab koordinata sistemasi)
                </h4>
                <div className="h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 200 160" className="w-full h-full">
                    {/* Coordinate axes */}
                    <line x1={100} y1={140} x2={100} y2={20} stroke="#94A3B8" strokeDasharray="3 2" />
                    <line x1={20} y1={80} x2={180} y2={80} stroke="#94A3B8" strokeDasharray="3 2" />
                    <rect x={76} y={58} width={48} height={44} rx={3} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                    <text x={100} y={85} textAnchor="middle" fontSize="13" fill="#FFFFFF" fontWeight="800">m₁</text>
                    {/* Normal N */}
                    <line x1={100} y1={58} x2={100} y2={20} stroke="#15803D" strokeWidth="2" markerEnd="url(#dynArrGreen)" />
                    <text x={106} y={30} fontSize="10" fill="#15803D" fontWeight="700">N</text>
                    {/* Parallel m1g sin(theta) */}
                    <line x1={76} y1={80} x2={30} y2={80} stroke="#1E3A8A" strokeWidth="2" markerEnd="url(#dynArrBlue)" />
                    <text x={25} y={74} fontSize="9.5" fill="#1E3A8A" fontWeight="700">m₁g·sin(θ)</text>
                    {/* Perpendicular m1g cos(theta) */}
                    <line x1={100} y1={102} x2={100} y2={142} stroke="#1E3A8A" strokeWidth="2" markerEnd="url(#dynArrBlue)" />
                    <text x={106} y={138} fontSize="9.5" fill="#1E3A8A" fontWeight="700">m₁g·cos(θ)</text>
                    {/* Tension T */}
                    <line x1={124} y1={80} x2={170} y2={80} stroke="#B91C1C" strokeWidth="2" markerEnd="url(#dynArrRed)" />
                    <text x={172} y={74} fontSize="10" fill="#B91C1C" fontWeight="700">T</text>
                  </svg>
                </div>
                <p className="text-[11px] text-slate-600">
                  Oy o‘qi: <code className="font-mono text-slate-800">N - m₁g·cos(θ) = 0 ⇒ N = m₁g·cos(θ)</code>
                  <br />
                  Ox o‘qi: <code className="font-mono text-slate-800">T - m₁g·sin(θ) - f_k = m₁a</code>
                </p>
              </div>

              {/* Block 2 FBD */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                  2-Jism FBD (Vertikal koordinata sistemasi)
                </h4>
                <div className="h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 200 160" className="w-full h-full">
                    <line x1={100} y1={140} x2={100} y2={20} stroke="#94A3B8" strokeDasharray="3 2" />
                    <rect x={78} y={60} width={44} height={40} rx={3} fill="#B91C1C" stroke="#FFFFFF" strokeWidth="2" />
                    <text x={100} y={85} textAnchor="middle" fontSize="13" fill="#FFFFFF" fontWeight="800">m₂</text>
                    {/* Tension T up */}
                    <line x1={100} y1={60} x2={100} y2={22} stroke="#1E3A8A" strokeWidth="2" markerEnd="url(#dynArrBlue)" />
                    <text x={108} y={32} fontSize="10" fill="#1E3A8A" fontWeight="700">T</text>
                    {/* Weight m2g down */}
                    <line x1={100} y1={100} x2={100} y2={142} stroke="#B91C1C" strokeWidth="2" markerEnd="url(#dynArrRed)" />
                    <text x={108} y={138} fontSize="10" fill="#B91C1C" fontWeight="700">m₂g</text>
                  </svg>
                </div>
                <p className="text-[11px] text-slate-600">
                  Pastga harakatda: <code className="font-mono text-slate-800">m₂g - T = m₂a ⇒ T = m₂(g - a)</code>
                  <br />
                  Yuqoriga harakatda: <code className="font-mono text-slate-800">T - m₂g = m₂a ⇒ T = m₂(g + a)</code>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowFbdModal(false)}
                className="rounded-md bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172554]"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Socratic Pedagogical AI Assistant */}
      <SocraticAiAssistant labKey="dynamics" labTitle="3. Qiya Tekislik va Dinamika Stendi" />
    </div>
  );
}
