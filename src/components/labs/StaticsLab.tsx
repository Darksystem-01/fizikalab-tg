"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { MathFormula } from "@/components/MathFormula";
import { ParamInput } from "@/components/ParamInput";
import { ScientificChart } from "@/components/ScientificChart";
import { ScenarioCatalogSelector } from "@/components/labs/ScenarioCatalogSelector";
import type { ScenarioDefinition } from "@/lib/physics/catalog";
import type { StaticsResult } from "@/lib/physics/statics";

interface ForceItem {
  label: string;
  magnitudeN: number;
  angleDeg: number;
}

interface BeamLoadItem {
  label: string;
  positionM: number;
  massKg: number;
}

export function StaticsLab() {
  const [activeScenarioId, setActiveScenarioId] = useState("stat-01");
  const [subMode, setSubMode] = useState<"force_table" | "beam_moments" | "pulley_wheel">(
    "force_table"
  );

  // Force table state (#49)
  const [forces, setForces] = useState<ForceItem[]>([
    { label: "F1", magnitudeN: 12, angleDeg: 30 },
    { label: "F2", magnitudeN: 15, angleDeg: 135 },
    { label: "F3", magnitudeN: 10, angleDeg: 255 },
  ]);

  // Beam & moments state (#19)
  const [beamLengthM, setBeamLengthM] = useState(4.0);
  const [beamMassKg, setBeamMassKg] = useState(8.0);
  const [supportAM, setSupportAM] = useState(0.5);
  const [supportBM, setSupportBM] = useState(3.5);
  const [loads, setLoads] = useState<BeamLoadItem[]>([
    { label: "m1", positionM: 1.5, massKg: 10 },
    { label: "m2", positionM: 2.8, massKg: 6 },
  ]);

  // Pulley & Wheel-Axle state (#33, #71)
  const [mechanismType, setMechanismType] = useState<"pulley" | "wheel_axle">("pulley");
  const [loadMassKg, setLoadMassKg] = useState(20);
  const [appliedForceN, setAppliedForceN] = useState(55);
  const [pulleyStrands, setPulleyStrands] = useState(4);
  const [wheelRadiusM, setWheelRadiusM] = useState(0.24);
  const [axleRadiusM, setAxleRadiusM] = useState(0.06);

  const [result, setResult] = useState<StaticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MeasurementRow[]>([]);

  const simulate = useCallback(
    async (saveRun = false) => {
      setLoading(true);
      try {
        const res = await fetch("/api/physics/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labKey: "statics",
            saveRun,
            params: {
              subMode,
              forces,
              beamLengthM,
              beamMassKg,
              supportAM,
              supportBM,
              loads,
              mechanismType,
              loadMassKg,
              appliedForceN,
              pulleyStrands,
              wheelRadiusM,
              axleRadiusM,
            },
          }),
        });
        const data = await res.json();
        if (res.ok) setResult(data.result);
      } finally {
        setLoading(false);
      }
    },
    [
      subMode,
      forces,
      beamLengthM,
      beamMassKg,
      supportAM,
      supportBM,
      loads,
      mechanismType,
      loadMassKg,
      appliedForceN,
      pulleyStrands,
      wheelRadiusM,
      axleRadiusM,
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void simulate(false);
    }, 40);
    return () => clearTimeout(timer);
  }, [simulate]);

  function recordRow() {
    if (!result) return;
    if (subMode === "force_table") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `Kuchlar stoli (${forces.length} kuch)`,
          primaryValue: Number(result.summary.resultantMagnitudeN ?? 0),
          unit: "N",
          details: {
            Fx: result.summary.sumFxN,
            Fy: result.summary.sumFyN,
            theta_R: result.summary.resultantAngleDeg,
            F_eq: result.summary.equilibrantMagnitudeN,
            theta_eq: result.summary.equilibrantAngleDeg,
          },
        },
      ]);
    } else if (subMode === "beam_moments") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `Balka L=${beamLengthM} m (A=${supportAM}m, B=${supportBM}m)`,
          primaryValue: Number(result.summary.maxBendingMomentNm ?? 0),
          unit: "N·m",
          details: {
            RA_N: result.summary.reactionAN,
            RB_N: result.summary.reactionBN,
            W_tot_N: result.summary.totalLoadN,
            M_max: result.summary.maxBendingMomentNm,
          },
        },
      ]);
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `${mechanismType === "pulley" ? "Polispast" : "G'ildirak-o'q"} (m=${loadMassKg} kg)`,
          primaryValue: Number(result.summary.efficiencyPct ?? 0),
          unit: "%",
          details: {
            F_yuk: result.summary.loadForceN,
            F_kuch: result.summary.actualEffortN,
            IMA: result.summary.idealMechanicalAdvantage,
            AMA: result.summary.actualMechanicalAdvantage,
          },
        },
      ]);
    }
  }

  const components =
    (result?.details?.components as
      | { label: string; magnitudeN: number; angleDeg: number; fx: number; fy: number }[]
      | undefined) ?? [];

  const maxForce = Math.max(
    1,
    ...components.map((c) => c.magnitudeN),
    Number(result?.summary?.resultantMagnitudeN ?? 0)
  );

  const shearSeries =
    (result?.details?.shearSeries as { x: number; y: number }[] | undefined) ?? [];
  const momentSeries =
    (result?.details?.momentSeries as { x: number; y: number }[] | undefined) ?? [];

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.subMode === "string") {
      if (p.subMode === "force_table" || p.subMode === "beam_moments" || p.subMode === "pulley_wheel") {
        setSubMode(p.subMode);
      }
    }
    if (Array.isArray(p.forces)) setForces(p.forces as any);
    if (typeof p.beamLengthM === "number") setBeamLengthM(p.beamLengthM);
    if (typeof p.beamMassKg === "number") setBeamMassKg(p.beamMassKg);
    if (typeof p.loadMassKg === "number") setLoadMassKg(p.loadMassKg);
    if (typeof p.pulleyStrands === "number") setPulleyStrands(p.pulleyStrands);
  }

  return (
    <div className="space-y-4">
      <ScenarioCatalogSelector
        chapter="statics"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "force_table", label: "#49 Kuchlar Stoli (Vektor Muvozanati)" },
            { id: "beam_moments", label: "#19 Balka Reaksiyasi va Momentlar" },
            { id: "pulley_wheel", label: "#33/#71 Bloklar Tizimi & G'ildirak-O'q" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id as typeof subMode)}
              className={`border px-3 py-1.5 text-xs font-medium ${
                subMode === m.id
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => simulate(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Bazaga yozish
          </button>
          <button
            type="button"
            onClick={recordRow}
            className="inline-flex items-center gap-1.5 bg-[#1E3A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#172554]"
          >
            <Plus className="h-3.5 w-3.5" />
            Qayd etish
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-3 border border-slate-200 bg-slate-50 p-4 lg:col-span-4">
          <h2 className="text-sm font-semibold text-slate-900">Statika Parametrlari</h2>

          {subMode === "force_table" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Ta&apos;sir etuvchi kuchlar (maks. 6 ta)
                </span>
                {forces.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForces((prev) => [
                        ...prev,
                        { label: `F${prev.length + 1}`, magnitudeN: 10, angleDeg: 0 },
                      ])
                    }
                    className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="h-3 w-3" /> Kuch qo&apos;shish
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {forces.map((f, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center gap-1.5 border border-slate-200 bg-white p-2 text-xs"
                  >
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) =>
                        setForces((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, label: e.target.value } : item
                          )
                        )
                      }
                      className="col-span-2 border border-slate-200 px-1.5 py-1 font-mono text-xs"
                    />
                    <div className="col-span-4">
                      <label className="block text-[10px] text-slate-500">F (N)</label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={f.magnitudeN}
                        onChange={(e) =>
                          setForces((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, magnitudeN: Number(e.target.value) } : item
                            )
                          )
                        }
                        className="w-full border border-slate-200 px-1.5 py-0.5 font-mono"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] text-slate-500">θ (°)</label>
                      <input
                        type="number"
                        step="any"
                        value={f.angleDeg}
                        onChange={(e) =>
                          setForces((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, angleDeg: Number(e.target.value) } : item
                            )
                          )
                        }
                        className="w-full border border-slate-200 px-1.5 py-0.5 font-mono"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {forces.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForces((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-slate-400 hover:text-red-700"
                          title="O'chirish"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!result) return;
                  const eqMag = Number(result.summary.equilibrantMagnitudeN ?? 0);
                  const eqAng = Number(result.summary.equilibrantAngleDeg ?? 0);
                  if (forces.length < 6 && eqMag > 0.05) {
                    setForces((prev) => [
                      ...prev,
                      { label: `Feq`, magnitudeN: Number(eqMag.toFixed(2)), angleDeg: Number(eqAng.toFixed(1)) },
                    ]);
                  }
                }}
                disabled={forces.length >= 6 || Boolean(result?.summary?.inEquilibrium)}
                className="w-full border border-[#1E3A8A] bg-white px-3 py-1.5 text-xs font-medium text-[#1E3A8A] hover:bg-blue-50 disabled:opacity-40"
              >
                Muvozanatlovchi kuchni (Feq) qo&apos;shish
              </button>
            </div>
          )}

          {subMode === "beam_moments" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-slate-700">Balka uzunligi L (m)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={beamLengthM}
                    onChange={(e) => setBeamLengthM(Number(e.target.value))}
                    className="w-full border border-slate-300 bg-white px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-700">Balka massasi Mb (kg)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={beamMassKg}
                    onChange={(e) => setBeamMassKg(Number(e.target.value))}
                    className="w-full border border-slate-300 bg-white px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-700">A tayanch xA (m)</label>
                  <input
                    type="number"
                    min={0}
                    max={beamLengthM}
                    step={0.1}
                    value={supportAM}
                    onChange={(e) => setSupportAM(Number(e.target.value))}
                    className="w-full border border-slate-300 bg-white px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-700">B tayanch xB (m)</label>
                  <input
                    type="number"
                    min={0}
                    max={beamLengthM}
                    step={0.1}
                    value={supportBM}
                    onChange={(e) => setSupportBM(Number(e.target.value))}
                    className="w-full border border-slate-300 bg-white px-2 py-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-slate-700">Nuqtaviy yuklar</span>
                {loads.length < 5 && (
                  <button
                    type="button"
                    onClick={() =>
                      setLoads((prev) => [
                        ...prev,
                        {
                          label: `m${prev.length + 1}`,
                          positionM: Number((beamLengthM / 2).toFixed(2)),
                          massKg: 5,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="h-3 w-3" /> Yuk qo&apos;shish
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {loads.map((ld, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center gap-1.5 border border-slate-200 bg-white p-2"
                  >
                    <span className="col-span-2 font-mono font-semibold text-slate-700">
                      {ld.label}
                    </span>
                    <div className="col-span-4">
                      <label className="block text-[10px] text-slate-500">x (m)</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={beamLengthM}
                        value={ld.positionM}
                        onChange={(e) =>
                          setLoads((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, positionM: Number(e.target.value) } : item
                            )
                          )
                        }
                        className="w-full border border-slate-200 px-1.5 py-0.5 font-mono"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] text-slate-500">m (kg)</label>
                      <input
                        type="number"
                        step={0.5}
                        min={0.5}
                        max={200}
                        value={ld.massKg}
                        onChange={(e) =>
                          setLoads((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, massKg: Number(e.target.value) } : item
                            )
                          )
                        }
                        className="w-full border border-slate-200 px-1.5 py-0.5 font-mono"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {loads.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLoads((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-slate-400 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subMode === "pulley_wheel" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Mexanizm turi</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMechanismType("pulley")}
                    className={`rounded-md border py-1.5 text-xs font-semibold cursor-pointer ${
                      mechanismType === "pulley"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    #33 Polispast (Bloklar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMechanismType("wheel_axle")}
                    className={`rounded-md border py-1.5 text-xs font-semibold cursor-pointer ${
                      mechanismType === "wheel_axle"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    #71 G&apos;ildirak va O&apos;q
                  </button>
                </div>
              </div>
              <ParamInput
                label="Yuk massasi"
                symbol="m"
                unit="kg"
                value={loadMassKg}
                onChange={setLoadMassKg}
                sliderMin={1}
                sliderMax={100}
                step={0.5}
                minValid={0.01}
              />
              <ParamInput
                label="Amaliy tortish kuchi"
                symbol="F_amaliy"
                unit="N"
                value={appliedForceN}
                onChange={setAppliedForceN}
                sliderMin={1}
                sliderMax={500}
                step={1}
                minValid={0.1}
              />
              {mechanismType === "pulley" ? (
                <ParamInput
                  label="Ko‘taruvchi iplar soni"
                  symbol="n"
                  unit="ta"
                  value={pulleyStrands}
                  onChange={setPulleyStrands}
                  sliderMin={1}
                  sliderMax={10}
                  step={1}
                  minValid={1}
                  integer
                />
              ) : (
                <>
                  <ParamInput
                    label="G‘ildirak radiusi"
                    symbol="R"
                    unit="m"
                    value={wheelRadiusM}
                    onChange={setWheelRadiusM}
                    sliderMin={0.05}
                    sliderMax={1.0}
                    step={0.01}
                    minValid={0.01}
                  />
                  <ParamInput
                    label="O‘q radiusi"
                    symbol="r"
                    unit="m"
                    value={axleRadiusM}
                    onChange={setAxleRadiusM}
                    sliderMin={0.01}
                    sliderMax={0.4}
                    step={0.005}
                    minValid={0.005}
                  />
                </>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Muvozanat Shartlari
            </div>
            <MathFormula
              tex={
                subMode === "force_table"
                  ? "\\sum \\vec{F} = 0, \\quad R_x = \\sum F_i\\cos\\theta_i, \\quad R_y = \\sum F_i\\sin\\theta_i"
                  : subMode === "beam_moments"
                  ? "\\sum F_y = 0, \\quad \\sum \\tau_A = R_B(x_B-x_A) - \\sum m_i g(x_i-x_A) = 0"
                  : "\\eta = \\frac{\\text{AMA}}{\\text{IMA}} \\times 100\\%, \\quad \\text{AMA} = \\frac{mg}{F_{\\text{amaliy}}}"
              }
            />
          </div>
        </div>

        {/* Visualization & Results */}
        <div className="space-y-4 lg:col-span-8">
          {/* Submode 1: Force Table SVG */}
          {subMode === "force_table" && result && (
            <>
              <div className="border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    360° Kuchlar Stoli Vektor Sxemasi
                  </span>
                  <span
                    className={`border px-2 py-0.5 text-xs font-semibold ${
                      result.summary.inEquilibrium
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {result.summary.inEquilibrium
                      ? "Tizim muvozanatda (|R| < 0.05 N)"
                      : `Muvozanatda emas (|R| = ${result.summary.resultantMagnitudeN} N)`}
                  </span>
                </div>
                <svg viewBox="0 0 420 300" className="h-72 w-full border border-slate-100 bg-white">
                  <defs>
                    <marker
                      id="arrBlue"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L7,3 z" fill="#1E3A8A" />
                    </marker>
                    <marker
                      id="arrRed"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L7,3 z" fill="#B91C1C" />
                    </marker>
                    <marker
                      id="arrGreen"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L7,3 z" fill="#15803D" />
                    </marker>
                  </defs>

                  <circle cx={210} cy={150} r={115} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
                  <circle cx={210} cy={150} r={75} fill="none" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <circle cx={210} cy={150} r={35} fill="none" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1={85} y1={150} x2={335} y2={150} stroke="#CBD5E1" />
                  <line x1={210} y1={25} x2={210} y2={275} stroke="#CBD5E1" />

                  {[0, 90, 180, 270].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const tx = 210 + 128 * Math.cos(rad);
                    const ty = 150 - 128 * Math.sin(rad);
                    return (
                      <text
                        key={deg}
                        x={tx}
                        y={ty + 3}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#475569"
                        fontFamily="monospace"
                      >
                        {deg}°
                      </text>
                    );
                  })}

                  {components.map((c, idx) => {
                    const scale = (c.magnitudeN / maxForce) * 100;
                    const rad = (c.angleDeg * Math.PI) / 180;
                    const x2 = 210 + scale * Math.cos(rad);
                    const y2 = 150 - scale * Math.sin(rad);
                    return (
                      <g key={idx}>
                        <line
                          x1={210}
                          y1={150}
                          x2={x2}
                          y2={y2}
                          stroke="#1E3A8A"
                          strokeWidth="2.2"
                          markerEnd="url(#arrBlue)"
                        />
                        <text
                          x={x2 + 10 * Math.cos(rad)}
                          y={y2 - 10 * Math.sin(rad)}
                          fontSize="10"
                          fontWeight="600"
                          fill="#1E3A8A"
                          textAnchor="middle"
                        >
                          {c.label} ({c.magnitudeN}N)
                        </text>
                      </g>
                    );
                  })}

                  {Number(result.summary.resultantMagnitudeN ?? 0) > 0.05 && (
                    <>
                      {(() => {
                        const rMag = Number(result.summary.resultantMagnitudeN);
                        const rAng = Number(result.summary.resultantAngleDeg);
                        const eAng = Number(result.summary.equilibrantAngleDeg);
                        const scale = (rMag / maxForce) * 100;
                        const rRad = (rAng * Math.PI) / 180;
                        const eRad = (eAng * Math.PI) / 180;
                        return (
                          <>
                            <line
                              x1={210}
                              y1={150}
                              x2={210 + scale * Math.cos(rRad)}
                              y2={150 - scale * Math.sin(rRad)}
                              stroke="#B91C1C"
                              strokeWidth="2.4"
                              strokeDasharray="4 2"
                              markerEnd="url(#arrRed)"
                            />
                            <line
                              x1={210}
                              y1={150}
                              x2={210 + scale * Math.cos(eRad)}
                              y2={150 - scale * Math.sin(eRad)}
                              stroke="#15803D"
                              strokeWidth="2.0"
                              strokeDasharray="2 2"
                              markerEnd="url(#arrGreen)"
                            />
                          </>
                        );
                      })()}
                    </>
                  )}
                  <circle cx={210} cy={150} r={4} fill="#0F172A" />
                </svg>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-[#1E3A8A]" /> Qo&apos;yilgan kuchlar (Fi)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-[#B91C1C]" /> Teng ta&apos;sir etuvchi (R)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-[#15803D]" /> Muvozanatlovchi (Feq)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Kuch proyeksiyalari</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    ΣFx = {String(result.summary.sumFxN)} N · ΣFy = {String(result.summary.sumFyN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Natijaviy teng ta&apos;sir etuvchi</div>
                  <div className="font-mono text-sm font-bold text-[#B91C1C]">
                    |R| = {String(result.summary.resultantMagnitudeN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Natijaviy burchak</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    θ_R = {String(result.summary.resultantAngleDeg)}°
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Muvozanatlovchi burchagi</div>
                  <div className="font-mono text-sm font-bold text-[#15803D]">
                    θ_eq = {String(result.summary.equilibrantAngleDeg)}°
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submode 2: Beam Moments */}
          {subMode === "beam_moments" && result && (
            <>
              <div className="border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    Balka Tayanchlari va Yuklanish Sxemasi
                  </span>
                  <span
                    className={`border px-2 py-0.5 text-xs font-semibold ${
                      result.summary.stable
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-red-300 bg-red-50 text-red-800"
                    }`}
                  >
                    {result.summary.stable
                      ? "Barqaror muvozanat (RA ≥ 0, RB ≥ 0)"
                      : "Ag'darilish xavfi (manfiy tayanch reaksiyasi)"}
                  </span>
                </div>
                <svg viewBox="0 0 600 160" className="h-40 w-full border border-slate-100 bg-white">
                  {(() => {
                    const x0 = 50;
                    const w = 500;
                    const toPx = (m: number) => x0 + (m / Math.max(0.5, beamLengthM)) * w;
                    const pxA = toPx(supportAM);
                    const pxB = toPx(supportBM);
                    return (
                      <>
                        {/* Beam */}
                        <rect x={x0} y={70} width={w} height={14} fill="#CBD5E1" stroke="#334155" />
                        {/* Support A */}
                        <polygon
                          points={`${pxA},84 ${pxA - 12},110 ${pxA + 12},110`}
                          fill="#1E3A8A"
                        />
                        <text x={pxA} y={128} textAnchor="middle" fontSize="11" fill="#1E3A8A" fontWeight="600">
                          RA = {String(result.summary.reactionAN)} N
                        </text>
                        {/* Support B */}
                        <polygon
                          points={`${pxB},84 ${pxB - 12},110 ${pxB + 12},110`}
                          fill="#1E3A8A"
                        />
                        <text x={pxB} y={128} textAnchor="middle" fontSize="11" fill="#1E3A8A" fontWeight="600">
                          RB = {String(result.summary.reactionBN)} N
                        </text>
                        {/* Point loads */}
                        {loads.map((ld, i) => {
                          const px = toPx(ld.positionM);
                          return (
                            <g key={i}>
                              <line
                                x1={px}
                                y1={24}
                                x2={px}
                                y2={68}
                                stroke="#B91C1C"
                                strokeWidth="2.5"
                              />
                              <polygon points={`${px},70 ${px - 5},60 ${px + 5},60`} fill="#B91C1C" />
                              <text
                                x={px}
                                y={18}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#B91C1C"
                                fontWeight="600"
                              >
                                {ld.label}: {ld.massKg}kg
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">A tayanch reaksiyasi</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    R_A = {String(result.summary.reactionAN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">B tayanch reaksiyasi</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    R_B = {String(result.summary.reactionBN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Umumiy og&apos;irlik</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    ΣW = {String(result.summary.totalLoadN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Maksimal eguvchi moment</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    M_max = {String(result.summary.maxBendingMomentNm)} N·m
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ScientificChart
                  title="Kesuvchi kuch diagrammasi V(x)"
                  xLabel="x (m)"
                  yLabel="V (N)"
                  series={[{ label: "V(x)", color: "#1E3A8A", points: shearSeries }]}
                />
                <ScientificChart
                  title="Eguvchi moment diagrammasi M(x)"
                  xLabel="x (m)"
                  yLabel="M (N·m)"
                  series={[{ label: "M(x)", color: "#B91C1C", points: momentSeries }]}
                />
              </div>
            </>
          )}

          {/* Submode 3: Pulley & Wheel-Axle */}
          {subMode === "pulley_wheel" && result && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {mechanismType === "pulley"
                      ? `Polispast (Bloklar tizimi, n = ${pulleyStrands} ip)`
                      : `G‘ildirak va O‘q mexanizmi (R = ${wheelRadiusM} m, r = ${axleRadiusM} m)`}
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                      result.summary.canLift
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-red-300 bg-red-50 text-red-800"
                    }`}
                  >
                    {result.summary.canLift ? "Ko‘tarish mumkin" : "Kuch yetarli emas"}
                  </span>
                </div>
                <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2">
                  <svg viewBox="0 0 600 210" className="h-48 w-full">
                    {mechanismType === "pulley" ? (() => {
                      const n = Math.min(8, Math.max(1, pulleyStrands));
                      const liftShift = result.summary.canLift ? -12 : 8;
                      return (
                        <>
                          <rect x={200} y={16} width={200} height={8} rx={2} fill="#334155" />
                          {/* Fixed top pulley */}
                          <circle cx={300} cy={46} r={22} fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="3" />
                          <circle cx={300} cy={46} r={4} fill="#0F172A" />
                          <line x1={300} y1={24} x2={300} y2={46} stroke="#334155" strokeWidth="3" />
                          {/* Strands */}
                          {Array.from({ length: n }).map((_, idx) => {
                            const sx = 282 + (idx / Math.max(1, n - 1)) * 36;
                            return <line key={idx} x1={sx} y1={46} x2={sx} y2={132 + liftShift} stroke="#475569" strokeWidth="1.8" />;
                          })}
                          {/* Movable pulley */}
                          <circle cx={300} cy={132 + liftShift} r={18} fill="#DBEAFE" stroke="#1E3A8A" strokeWidth="2.5" />
                          <rect x={274} y={156 + liftShift} width={52} height={32} rx={3} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1.5" />
                          <text x={300} y={176 + liftShift} textAnchor="middle" fontSize="10.5" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            {loadMassKg} kg
                          </text>
                          {/* Applied effort rope */}
                          <line x1={322} y1={46} x2={410} y2={136} stroke="#B91C1C" strokeWidth="2.4" />
                          <text x={420} y={140} fontSize="11" fill="#B91C1C" fontFamily="monospace" fontWeight="700">
                            F = {appliedForceN} N
                          </text>
                        </>
                      );
                    })() : (() => {
                      const rOuter = 68;
                      const rInner = Math.max(14, Math.min(54, (axleRadiusM / Math.max(0.02, wheelRadiusM)) * rOuter));
                      return (
                        <>
                          <circle cx={260} cy={105} r={rOuter} fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="3.5" />
                          <circle cx={260} cy={105} r={rInner} fill="#DBEAFE" stroke="#334155" strokeWidth="2.5" />
                          <circle cx={260} cy={105} r={4} fill="#0F172A" />
                          {/* Load hanging from inner axle */}
                          <line x1={260 - rInner} y1={105} x2={260 - rInner} y2={160} stroke="#334155" strokeWidth="2" />
                          <rect x={260 - rInner - 20} y={160} width={40} height={26} rx={3} fill="#1E3A8A" />
                          <text x={260 - rInner} y={177} textAnchor="middle" fontSize="9.5" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                            {loadMassKg}kg
                          </text>
                          {/* Effort pulling outer rim */}
                          <line x1={260 + rOuter} y1={105} x2={260 + rOuter} y2={175} stroke="#B91C1C" strokeWidth="2.5" />
                          <text x={260 + rOuter + 10} y={170} fontSize="11" fill="#B91C1C" fontFamily="monospace" fontWeight="700">
                            F = {appliedForceN} N
                          </text>
                          <text x={440} y={70} fontSize="10.5" fill="#1E3A8A" fontFamily="monospace" fontWeight="600">
                            R = {wheelRadiusM} m
                          </text>
                          <text x={440} y={88} fontSize="10.5" fill="#334155" fontFamily="monospace" fontWeight="600">
                            r = {axleRadiusM} m
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Yuk og&apos;irligi</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    P = {String(result.summary.loadForceN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Ideal tortish kuchi</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    F_ideal = {String(result.summary.idealEffortN)} N
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Kuchdan yutuq (IMA / AMA)</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    IMA = {String(result.summary.idealMechanicalAdvantage)} · AMA = {String(result.summary.actualMechanicalAdvantage)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Mexanizm FIK</div>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    η = {String(result.summary.efficiencyPct)} %
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    Mexanik Kuch Yutug&apos;i va Foydali Ish Koeffitsienti Tahlili
                  </span>
                  <span
                    className={`border px-2 py-0.5 font-semibold ${
                      result.summary.canLift
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-red-300 bg-red-50 text-red-800"
                    }`}
                  >
                    {result.summary.canLift
                      ? "Yuk muvaffaqiyatli ko'tariladi (F_amaliy ≥ F_ideal)"
                      : "Kuch yetarli emas — yuk ko'tarilmaydi"}
                  </span>
                </div>
                <div className="grid gap-3 text-xs text-slate-700 sm:grid-cols-2">
                  <div className="border border-slate-100 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-900">Fizik izoh:</div>
                    <p className="mt-1">
                      Ideal mexanizmda kuch yutug&apos;i (IMA) ishqalanishsiz holda{" "}
                      {mechanismType === "pulley"
                        ? `ko'taruvchi iplar soniga teng (n = ${pulleyStrands})`
                        : `g'ildirak va o'q radiuslari nisbatiga teng (R/r = ${Number(
                            (wheelRadiusM / Math.max(0.005, axleRadiusM)).toFixed(2)
                          )})`}
                      . Amalda ishqalanish tufayli ko&apos;proq kuch talab etiladi va FIK 100% dan
                      past bo&apos;ladi.
                    </p>
                  </div>
                  <div className="border border-slate-100 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-900">Holat ko&apos;rsatkichi:</div>
                    <p className="mt-1 font-mono">
                      F_amaliy = {String(result.summary.actualEffortN)} N | F_ideal ={" "}
                      {String(result.summary.idealEffortN)} N | Ishqalanish yo&apos;qotishi ≈{" "}
                      {Math.max(
                        0,
                        Number(result.summary.actualEffortN) - Number(result.summary.idealEffortN)
                      ).toFixed(2)}{" "}
                      N
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <LabFormulaStrip section="Statika" />
          <LabReportPanel
            labKey="statics"
            defaultTitle="Statika va Kuchlar Muvozanati Laboratoriya Ishi"
            rows={rows}
            onClearRows={() => setRows([])}
            onDeleteRow={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
          />
        </div>
      </div>
    </div>
  );
}
