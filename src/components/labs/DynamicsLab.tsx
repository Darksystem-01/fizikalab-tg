"use client";

import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { MathFormula } from "@/components/MathFormula";
import { ParamInput } from "@/components/ParamInput";
import { ScientificChart } from "@/components/ScientificChart";
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
  gravityParallelN: { label: "Og‘irlik kuchining qiya tashkil etuvchisi", symbol: "F∥", unit: "N" },
  staticMaxFrictionN: { label: "Maksimal tinchlik ishqalanishi", symbol: "f_s,max", unit: "N" },
  kineticFrictionN: { label: "Sirpanish ishqalanish kuchi", symbol: "f_k", unit: "N" },
  actualFrictionN: { label: "Amaldagi ishqalanish kuchi", symbol: "f_ishq", unit: "N" },
  tensionN: { label: "Ip taranglik kuchi", symbol: "T", unit: "N" },
  accelerationMs2: { label: "Sistema tezlanishi", symbol: "a", unit: "m/s²" },
  travelTimeS: { label: "Tekislik bo‘ylab harakat vaqti", symbol: "t", unit: "s" },
  finalSpeedMs: { label: "Oxirgi tezlik", symbol: "v", unit: "m/s" },
  frictionWorkJ: { label: "Ishqalanish kuchi bajargan ish", symbol: "A_ishq", unit: "J" },
  // Pendulum
  smallAnglePeriodS: { label: "Kichik burchaklar davri", symbol: "T₀", unit: "s" },
  nonlinearPeriodS: { label: "Nolinear tebranish davri (RK4)", symbol: "T", unit: "s" },
  anharmonicCorrectionPct: { label: "Angarmonik tuzatma", symbol: "ΔT/T₀", unit: "%" },
  angularFreqRadS: { label: "Sikllik chastota", symbol: "ω₀", unit: "rad/s" },
  katerMeasuredG: { label: "Kater mayatnigi bo‘yicha g", symbol: "g_Kater", unit: "m/s²" },
  // Hooke spring
  equilibriumStretchM: { label: "Statik cho‘zilish (muvozanat)", symbol: "Δx_st", unit: "m" },
  naturalFreqHz: { label: "Xususiy tebranish chastotasi", symbol: "ν₀", unit: "Hz" },
  periodS: { label: "Tebranish davri", symbol: "T", unit: "s" },
  maxPotentialEnergyJ: { label: "Maksimal elastiklik energiyasi", symbol: "E_p,max", unit: "J" },
  dampingRatioZeta: { label: "So‘nish nisbati", symbol: "ζ", unit: "" },
  // Collision
  willCollide: { label: "To‘qnashuv sharti (u₁ > u₂)", symbol: "To‘qnashuv", unit: "" },
  v1FinalMs: { label: "1-vagoncha yakuniy tezligi", symbol: "v₁′", unit: "m/s" },
  v2FinalMs: { label: "2-vagoncha yakuniy tezligi", symbol: "v₂′", unit: "m/s" },
  vCenterOfMassMs: { label: "Massa markazi tezligi", symbol: "v_c", unit: "m/s" },
  momentumBeforeKgMs: { label: "Boshlang‘ich impuls", symbol: "p₀", unit: "kg·m/s" },
  momentumAfterKgMs: { label: "Yakuniy impuls", symbol: "p", unit: "kg·m/s" },
  kineticBeforeJ: { label: "Boshlang‘ich kinetik energiya", symbol: "E_k0", unit: "J" },
  kineticAfterJ: { label: "Yakuniy kinetik energiya", symbol: "E_k", unit: "J" },
  energyLostJ: { label: "Issiqlikka aylangan energiya", symbol: "ΔE", unit: "J" },
  impulseOnBody1Ns: { label: "1-jismga berilgan impuls", symbol: "J₁", unit: "N·s" },
  // Flywheel
  angularAccelRadS2: { label: "Burchak tezlanish", symbol: "ε", unit: "rad/s²" },
  linearAccelMs2: { label: "Yukning chiziqli tezlanishi", symbol: "a", unit: "m/s²" },
  fallTimeS: { label: "Tushish vaqti", symbol: "t", unit: "s" },
  omegaFinalRadS: { label: "Oxirgi burchak tezlik", symbol: "ω", unit: "rad/s" },
  rotationalEnergyJ: { label: "Maxovik aylanma energiyasi", symbol: "E_ayl", unit: "J" },
  translationalEnergyJ: { label: "Yuk ilgarilanma energiyasi", symbol: "E_ilg", unit: "J" },
  potentialEnergyJ: { label: "Boshlang‘ich potensial energiya", symbol: "E_p", unit: "J" },
};

function formatMetricValue(key: string, val: number | string | boolean): { label: string; equation: string } {
  const spec = DYNAMICS_METRICS[key];
  if (!spec) {
    return { label: key, equation: String(val) };
  }
  if (key === "moving") {
    return {
      label: spec.label,
      equation: val ? "Harakatda" : "Tinch (muvozanatda)",
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
      down_slope: "Pastga sirpanish",
      up_slope: "Yuqoriga tortilish",
      static: "Harakatsiz (muvozanat)",
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
  const [subMode, setSubMode] = useState<DynamicsSubMode>("inclined_plane");
  const [mass1Kg, setMass1Kg] = useState(3.0);
  const [mass2Kg, setMass2Kg] = useState(1.2);
  const [angleDeg, setAngleDeg] = useState(30);
  const [muStatic, setMuStatic] = useState(0.25);
  const [muKinetic, setMuKinetic] = useState(0.15);
  const [planeLengthM, setPlaneLengthM] = useState(2.5);
  const [pendulumLengthM, setPendulumLengthM] = useState(1.2);
  const [initialAngleDeg, setInitialAngleDeg] = useState(25);
  const [springK, setSpringK] = useState(30);
  const [dampingC, setDampingC] = useState(0.2);
  const [springX0M, setSpringX0M] = useState(0.15);
  const [v1InitialMs, setV1InitialMs] = useState(4.0);
  const [v2InitialMs, setV2InitialMs] = useState(-1.5);
  const [restitutionE, setRestitutionE] = useState(1.0);
  const [flywheelInertia, setFlywheelInertia] = useState(0.08);
  const [axleRadiusM, setAxleRadiusM] = useState(0.04);
  const [fallHeightM, setFallHeightM] = useState(1.5);
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
              pendulumLengthM,
              initialAngleDeg,
              springK,
              dampingC,
              springX0M,
              v1InitialMs,
              v2InitialMs,
              restitutionE,
              flywheelInertiaKgM2: flywheelInertia,
              axleRadiusM,
              fallHeightM,
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
      pendulumLengthM,
      initialAngleDeg,
      springK,
      dampingC,
      springX0M,
      v1InitialMs,
      v2InitialMs,
      restitutionE,
      flywheelInertia,
      axleRadiusM,
      fallHeightM,
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
        const next = p + dt / 4800;
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
    } else if (subMode === "pendulum") {
      primary = Number(result.summary.nonlinearPeriodS);
      unit = "s";
    } else if (subMode === "hooke_spring") {
      primary = Number(result.summary.periodS);
      unit = "s";
    } else if (subMode === "collision") {
      primary = Number(result.summary.momentumAfterKgMs);
      unit = "kg·m/s";
    } else {
      primary = Number(result.summary.angularAccelRadS2);
      unit = "rad/s²";
    }

    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: `${subMode} tajribasi`,
        primaryValue: primary,
        unit,
        details: result.summary,
      },
    ]);
  }

  const pts0 = result?.series?.[0]?.points ?? [];
  const pts1 = result?.series?.[1]?.points ?? [];
  const idx = pts0.length > 0 ? Math.min(pts0.length - 1, Math.floor(progress * (pts0.length - 1))) : 0;
  const val0 = pts0[idx]?.y ?? 0;
  const val1 = pts1[idx]?.y ?? 0;
  const tCur = pts0[idx]?.x ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "inclined_plane", label: "#27 Qiya Tekislik & Ishqalanish" },
            { id: "pendulum", label: "#28/#59 Mayatnik (Nolinear + Kater)" },
            { id: "hooke_spring", label: "#14 Guk Qonuni & So‘nuvchi Tebranish" },
            { id: "collision", label: "Elastik / Noelastik To‘qnashuv" },
            { id: "flywheel", label: "#64 Maxovik Inersiya Momenti" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id as DynamicsSubMode)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                subMode === m.id
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
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
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Bazaga yozib hisoblash
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs lg:col-span-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Qurilma Parametrlari (Ixtiyoriy qiymat kiritish)
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Slayderdan foydalaning yoki o‘z soningizni to‘g‘ridan-to‘g‘ri yozing
            </p>
          </div>

          {subMode === "inclined_plane" && (
            <>
              <ParamInput
                label="Qiya massa"
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
                label="Osilgan yuk"
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
                label="Statik ishqalanish"
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
                label="Sirpanish ishqalanish"
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
              <MathFormula display tex="a = \frac{m_1 g\sin\theta - m_2 g \pm \mu_k m_1 g\cos\theta}{m_1 + m_2}" />
            </>
          )}

          {subMode === "pendulum" && (
            <>
              <ParamInput
                label="Mayatnik uzunligi"
                symbol="L"
                unit="m"
                value={pendulumLengthM}
                onChange={setPendulumLengthM}
                sliderMin={0.1}
                sliderMax={5}
                step={0.05}
                minValid={0.05}
              />
              <ParamInput
                label="Boshlang‘ich og‘ish"
                symbol="θ₀"
                unit="°"
                value={initialAngleDeg}
                onChange={setInitialAngleDeg}
                sliderMin={1}
                sliderMax={150}
                step={1}
                minValid={1}
                maxValid={165}
              />
              <MathFormula display tex="\ddot{\theta} + \frac{g}{L}\sin\theta = 0" />
            </>
          )}

          {subMode === "hooke_spring" && (
            <>
              <ParamInput
                label="Yuk massasi"
                symbol="m"
                unit="kg"
                value={mass1Kg}
                onChange={setMass1Kg}
                sliderMin={0.1}
                sliderMax={20}
                step={0.1}
                minValid={0.01}
              />
              <ParamInput
                label="Prujina qattiqligi"
                symbol="k"
                unit="N/m"
                value={springK}
                onChange={setSpringK}
                sliderMin={1}
                sliderMax={500}
                step={1}
                minValid={0.1}
              />
              <ParamInput
                label="Boshlang‘ich siljish"
                symbol="x₀"
                unit="m"
                value={springX0M}
                onChange={setSpringX0M}
                sliderMin={0.02}
                sliderMax={0.5}
                step={0.01}
                minValid={0.005}
              />
              <ParamInput
                label="So‘nish koeffitsiyenti"
                symbol="c"
                unit="N·s/m"
                value={dampingC}
                onChange={setDampingC}
                sliderMin={0}
                sliderMax={10}
                step={0.05}
                minValid={0}
              />
              <MathFormula display tex="m\ddot{x} + c\dot{x} + kx = 0" />
            </>
          )}

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
              <MathFormula display tex="\alpha = \frac{mgr}{I + mr^2}, \quad E_{\text{ayl}} = \frac{1}{2}I\omega^2" />
            </>
          )}

          <button
            type="button"
            onClick={recordRow}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#172554]"
          >
            <Plus className="h-3.5 w-3.5" />
            O‘lchovni jurnalga yozish
          </button>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {result && (
            <>
              {/* Live Animated Apparatus Stage */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Jonli Mexanik Qurilma Simulyatsiyasi
                    </h3>
                    <div className="font-mono text-[11px] text-slate-600 tabular-nums">
                      t = <strong className="text-[#1E3A8A]">{tCur.toFixed(2)} s</strong> ·{" "}
                      {subMode === "inclined_plane"
                        ? `s(t) = ${val0.toFixed(3)} m · v(t) = ${val1.toFixed(3)} m/s`
                        : subMode === "pendulum"
                        ? `θ(t) = ${val0.toFixed(2)}° · ω(t) = ${val1.toFixed(3)} rad/s`
                        : subMode === "hooke_spring"
                        ? `x(t) = ${val0.toFixed(4)} m · E(t) = ${val1.toFixed(4)} J`
                        : subMode === "collision"
                        ? `x₁(t) = ${val0.toFixed(2)} m · x₂(t) = ${val1.toFixed(2)} m`
                        : `ω(t) = ${val0.toFixed(2)} rad/s · φ(t) = ${val1.toFixed(2)} rad`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
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

                <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2">
                  <svg viewBox="0 0 640 230" className="h-56 w-full">
                    <defs>
                      <marker id="dynArrBlue" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#1E3A8A" />
                      </marker>
                      <marker id="dynArrRed" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#B91C1C" />
                      </marker>
                      <marker id="dynArrGreen" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#15803D" />
                      </marker>
                    </defs>

                    {subMode === "pendulum" && (() => {
                      const rad = (val0 * Math.PI) / 180;
                      const Lpx = Math.min(155, Math.max(70, 90 + pendulumLengthM * 24));
                      const bx = 320 + Lpx * Math.sin(rad);
                      const by = 24 + Lpx * Math.cos(rad);
                      const vScale = Math.max(-45, Math.min(45, val1 * 12));
                      const tx = bx + vScale * Math.cos(rad);
                      const ty = by - vScale * Math.sin(rad);
                      return (
                        <>
                          <rect x={200} y={16} width={240} height={8} rx={2} fill="#334155" />
                          <line x1={320} y1={24} x2={320} y2={205} stroke="#CBD5E1" strokeDasharray="4 3" />
                          <path
                            d={`M ${320 - 40 * Math.sin((initialAngleDeg * Math.PI) / 180)} ${24 + 40 * Math.cos((initialAngleDeg * Math.PI) / 180)} A 40 40 0 0 0 ${320 + 40 * Math.sin((initialAngleDeg * Math.PI) / 180)} ${24 + 40 * Math.cos((initialAngleDeg * Math.PI) / 180)}`}
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="1.2"
                            strokeDasharray="3 2"
                          />
                          <line x1={320} y1={24} x2={bx} y2={by} stroke="#1E3A8A" strokeWidth="2.5" />
                          {Math.abs(vScale) > 3 && (
                            <line
                              x1={bx}
                              y1={by}
                              x2={tx}
                              y2={ty}
                              stroke="#B91C1C"
                              strokeWidth="2"
                              markerEnd="url(#dynArrRed)"
                            />
                          )}
                          <circle cx={320} cy={24} r={4.5} fill="#0F172A" />
                          <circle cx={bx} cy={by} r={14} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={bx + 20} y={by - 2} fontSize="11" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                            θ = {val0.toFixed(1)}°
                          </text>
                          <text x={bx + 20} y={by + 12} fontSize="10" fill="#475569" fontFamily="monospace">
                            L = {pendulumLengthM} m
                          </text>
                        </>
                      );
                    })()}

                    {subMode === "hooke_spring" && (() => {
                      const amp = Math.max(0.01, Math.abs(springX0M));
                      const yBob = 110 + Math.max(-58, Math.min(58, (val0 / amp) * 48));
                      const coils = 12;
                      const ptsStr = Array.from({ length: coils + 1 }, (_, k) => {
                        const y = 26 + ((yBob - 26) * k) / coils;
                        const x = k === 0 || k === coils ? 290 : 290 + (k % 2 === 0 ? -15 : 15);
                        return `${x},${y.toFixed(1)}`;
                      }).join(" ");
                      return (
                        <>
                          <rect x={210} y={18} width={220} height={8} rx={2} fill="#334155" />
                          <line x1={180} y1={110} x2={460} y2={110} stroke="#CBD5E1" strokeDasharray="4 3" strokeWidth="1.5" />
                          <text x={185} y={104} fontSize="10" fill="#64748B" fontFamily="monospace">
                            x = 0
                          </text>
                          <polyline points={ptsStr} fill="none" stroke="#1E3A8A" strokeWidth="2.4" />
                          {dampingC > 0 && (
                            <>
                              <line x1={350} y1={26} x2={350} y2={84} stroke="#64748B" strokeWidth="4" />
                              <rect x={342} y={70} width={16} height={26} fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                              <line x1={350} y1={yBob} x2={350} y2={82} stroke="#475569" strokeWidth="2" />
                              <line x1={290} y1={yBob} x2={350} y2={yBob} stroke="#64748B" strokeWidth="2" />
                            </>
                          )}
                          <rect x={264} y={yBob} width={52} height={34} rx={4} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={290} y={yBob + 21} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            {mass1Kg} kg
                          </text>
                          <text x={395} y={yBob + 20} fontSize="11" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                            x = {val0.toFixed(3)} m
                          </text>
                        </>
                      );
                    })()}

                    {subMode === "collision" && (() => {
                      const allX = [...pts0.map((p) => p.y), ...pts1.map((p) => p.y)];
                      const minX = Math.min(-3, ...allX);
                      const maxX = Math.max(3, ...allX);
                      const span = Math.max(1, maxX - minX);
                      // Reserve padding on left/right equal to full cart width so bumpers touching at x1=x2 NEVER overlap!
                      const cartW1 = Math.min(72, Math.max(46, 40 + mass1Kg * 2.5));
                      const cartW2 = Math.min(72, Math.max(46, 40 + mass2Kg * 2.5));
                      const trackLeft = 92;
                      const trackRight = 548;
                      const toContactX = (xv: number) =>
                        trackLeft + ((xv - minX) / span) * (trackRight - trackLeft);

                      // Bumper positions (right edge of Cart 1, left edge of Cart 2)
                      const b1Right = toContactX(val0);
                      const b2Left = Math.max(b1Right + 2, toContactX(val1));
                      const b1Left = b1Right - cartW1;
                      const c1Center = b1Left + cartW1 / 2;
                      const c2Center = b2Left + cartW2 / 2;

                      const isBefore = tCur < 1.5;
                      const curV1 = isBefore
                        ? v1InitialMs
                        : Number(result.summary.v1FinalMs ?? v1InitialMs);
                      const curV2 = isBefore
                        ? v2InitialMs
                        : Number(result.summary.v2FinalMs ?? v2InitialMs);
                      const atImpact = Boolean(result.summary.willCollide) && Math.abs(tCur - 1.5) < 0.14;

                      return (
                        <>
                          {/* Air track rail */}
                          <rect x={24} y={144} width={592} height={12} rx={3} fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                          <line x1={320} y1={144} x2={320} y2={164} stroke="#94A3B8" strokeDasharray="3 2" />

                          {/* Impact contact spark */}
                          {atImpact && (
                            <>
                              <circle cx={(b1Right + b2Left) / 2} cy={120} r={16} fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                              <text x={(b1Right + b2Left) / 2} y={74} textAnchor="middle" fontSize="10" fill="#B45309" fontWeight="700">
                                TO‘QNASHUV!
                              </text>
                            </>
                          )}

                          {/* Cart 1: right bumper ends at b1Right */}
                          <rect x={b1Left} y={102} width={cartW1} height={34} rx={4} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                          <rect x={b1Right - 3} y={110} width={4} height={18} rx={1} fill="#93C5FD" />
                          <circle cx={b1Left + 12} cy={140} r={4.5} fill="#0F172A" />
                          <circle cx={b1Right - 12} cy={140} r={4.5} fill="#0F172A" />
                          <text x={c1Center} y={123} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            m₁
                          </text>

                          {/* Cart 2: left bumper starts at b2Left */}
                          <rect x={b2Left} y={102} width={cartW2} height={34} rx={4} fill="#B91C1C" stroke="#FFFFFF" strokeWidth="2" />
                          <rect x={b2Left - 1} y={110} width={4} height={18} rx={1} fill="#FCA5A5" />
                          <circle cx={b2Left + 12} cy={140} r={4.5} fill="#0F172A" />
                          <circle cx={b2Left + cartW2 - 12} cy={140} r={4.5} fill="#0F172A" />
                          <text x={c2Center} y={123} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            m₂
                          </text>

                          {/* Clean separated labels & velocity vectors above carts */}
                          <text x={c1Center} y={48} textAnchor="middle" fontSize="10.5" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                            m₁={mass1Kg}kg · v₁={curV1.toFixed(2)} m/s
                          </text>
                          <text x={c2Center} y={66} textAnchor="middle" fontSize="10.5" fill="#B91C1C" fontFamily="monospace" fontWeight="700">
                            m₂={mass2Kg}kg · v₂={curV2.toFixed(2)} m/s
                          </text>
                          {Math.abs(curV1) > 0.05 && (
                            <line
                              x1={c1Center}
                              y1={88}
                              x2={c1Center + Math.sign(curV1) * Math.min(48, Math.max(14, Math.abs(curV1) * 7))}
                              y2={88}
                              stroke="#1E3A8A"
                              strokeWidth="2.2"
                              markerEnd="url(#dynArrBlue)"
                            />
                          )}
                          {Math.abs(curV2) > 0.05 && (
                            <line
                              x1={c2Center}
                              y1={88}
                              x2={c2Center + Math.sign(curV2) * Math.min(48, Math.max(14, Math.abs(curV2) * 7))}
                              y2={88}
                              stroke="#B91C1C"
                              strokeWidth="2.2"
                              markerEnd="url(#dynArrRed)"
                            />
                          )}
                          <text x={320} y={185} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="monospace">
                            Impuls saqlanishi: p = {String(result.summary.momentumAfterKgMs)} kg·m/s (e = {restitutionE})
                          </text>
                        </>
                      );
                    })()}

                    {subMode === "inclined_plane" && (() => {
                      const rad = (angleDeg * Math.PI) / 180;
                      const rampLen = 230;
                      const topX = 390;
                      const topY = 48;
                      const baseX = topX - rampLen * Math.cos(rad);
                      const baseY = topY + rampLen * Math.sin(rad);
                      const dir = String(result.summary.direction ?? "static");
                      const frac =
                        dir === "down_slope"
                          ? Math.min(0.86, 0.22 + (Math.abs(val0) / Math.max(0.2, planeLengthM)) * 0.64)
                          : dir === "up_slope"
                          ? Math.max(0.18, 0.82 - (Math.abs(val0) / Math.max(0.2, planeLengthM)) * 0.64)
                          : 0.5;
                      const bx = topX - frac * rampLen * Math.cos(rad);
                      const by = topY + frac * rampLen * Math.sin(rad);
                      const dropY = topY + 26 + (1 - frac) * 90;

                      return (
                        <>
                          {/* Wedge */}
                          <polygon
                            points={`${topX},${topY} ${baseX},${baseY} ${topX},${baseY}`}
                            fill="#E2E8F0"
                            stroke="#475569"
                            strokeWidth="2"
                          />
                          <line x1={baseX - 25} y1={baseY} x2={topX + 95} y2={baseY} stroke="#334155" strokeWidth="2.5" />
                          {/* Pulley */}
                          <circle cx={topX + 12} cy={topY - 7} r={10} fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                          <line x1={bx} y1={by} x2={topX + 12} y2={topY - 16} stroke="#334155" strokeWidth="1.8" />
                          <line x1={topX + 22} y1={topY - 7} x2={topX + 22} y2={dropY} stroke="#334155" strokeWidth="1.8" />
                          {/* Hanging mass m2 */}
                          <rect x={topX + 7} y={dropY} width={30} height={26} fill="#B91C1C" stroke="#FFFFFF" strokeWidth="1.5" rx={3} />
                          <text x={topX + 22} y={dropY + 16} textAnchor="middle" fontSize="9.5" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            {mass2Kg}kg
                          </text>
                          {/* Sliding mass m1 + force vectors */}
                          <g transform={`translate(${bx}, ${by}) rotate(${-angleDeg})`}>
                            <rect x={-21} y={-28} width={42} height={28} rx={3} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1.5" />
                            <text x={0} y={-10} textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                              {mass1Kg}kg
                            </text>
                            <line x1={0} y1={-28} x2={0} y2={-62} stroke="#15803D" strokeWidth="2" markerEnd="url(#dynArrGreen)" />
                            <text x={6} y={-54} fontSize="10" fill="#15803D" fontWeight="700">N</text>
                          </g>
                          <text x={baseX + 30} y={baseY - 6} fontSize="10.5" fill="#334155" fontFamily="monospace" fontWeight="600">
                            θ = {angleDeg}°
                          </text>
                          <text x={455} y={40} fontSize="11" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                            a = {String(result.summary.accelerationMs2)} m/s²
                          </text>
                          <text x={455} y={58} fontSize="10.5" fill="#475569" fontFamily="monospace">
                            v(t) = {val1.toFixed(2)} m/s
                          </text>
                        </>
                      );
                    })()}

                    {subMode === "flywheel" && (() => {
                      const angleRotDeg = (val1 * 180) / Math.PI;
                      const fallFrac = Math.min(1, progress);
                      const dropPx = fallFrac * 105;
                      return (
                        <>
                          <circle cx={240} cy={110} r={66} fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="7" />
                          <circle cx={240} cy={110} r={14} fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                          <g transform={`translate(240,110) rotate(${angleRotDeg})`}>
                            <line x1={-60} y1={0} x2={60} y2={0} stroke="#1E3A8A" strokeWidth="3" />
                            <line x1={0} y1={-60} x2={0} y2={60} stroke="#1E3A8A" strokeWidth="3" />
                            <circle cx={46} cy={0} r={5.5} fill="#B91C1C" />
                          </g>
                          {/* String tangent to axle radius */}
                          <line x1={240} y1={96} x2={430} y2={64} stroke="#334155" strokeWidth="1.8" />
                          <circle cx={430} cy={72} r={9} fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                          <line x1={439} y1={72} x2={439} y2={88 + dropPx} stroke="#334155" strokeWidth="1.8" />
                          <rect x={424} y={88 + dropPx} width={30} height={24} fill="#B91C1C" stroke="#FFFFFF" strokeWidth="1.5" rx={3} />
                          <text x={439} y={104 + dropPx} textAnchor="middle" fontSize="9.5" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            {mass1Kg}kg
                          </text>
                          {/* Height scale */}
                          <line x1={475} y1={88} x2={475} y2={195} stroke="#94A3B8" strokeDasharray="3 2" />
                          <text x={483} y={145} fontSize="10.5" fill="#475569" fontFamily="monospace">
                            h = {fallHeightM} m
                          </text>
                          <text x={483} y={164} fontSize="10.5" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                            ω = {val0.toFixed(2)} rad/s
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600">
                  <span className="font-semibold">Vaqt:</span>
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
                  <span className="w-12 text-right font-mono">{Math.round(progress * 100)}%</span>
                </div>
              </div>

              {/* Formal SI Metric Cards */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(result.summary).map(([key, val]) => {
                  const formatted = formatMetricValue(key, val);
                  return (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-[11px] font-medium text-slate-500">{formatted.label}</div>
                      <div className="mt-0.5 font-mono text-sm font-bold text-[#1E3A8A] tabular-nums">
                        {formatted.equation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {result.series.map((ser, idx2) => (
                  <ScientificChart
                    key={ser.label}
                    title={ser.label}
                    xLabel="t [s]"
                    yLabel={ser.label}
                    series={[
                      {
                        label: ser.label,
                        color: idx2 === 0 ? "#1E3A8A" : "#B91C1C",
                        points: ser.points,
                      },
                    ]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <LabFormulaStrip section="Dinamika" />
      <LabReportPanel
        labKey="dynamics"
        defaultTitle="3-laboratoriya: Dinamika, mayatniklar va to‘qnashuvlar"
        rows={rows}
        onClearRows={() => setRows([])}
        onDeleteRow={(id) => setRows((p) => p.filter((r) => r.id !== id))}
      />
    </div>
  );
}
