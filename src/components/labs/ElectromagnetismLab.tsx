"use client";

import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { MathFormula } from "@/components/MathFormula";
import { ParamInput } from "@/components/ParamInput";
import { ScientificChart } from "@/components/ScientificChart";
import { ScenarioCatalogSelector } from "@/components/labs/ScenarioCatalogSelector";
import type { ScenarioDefinition } from "@/lib/physics/catalog";
import type { EmResult, EmSubMode } from "@/lib/physics/electromagnetism";

export function ElectromagnetismLab() {
  const [activeScenarioId, setActiveScenarioId] = useState("em-01");
  const [subMode, setSubMode] = useState<EmSubMode>("wheatstone_meter_bridge");

  // Wheatstone & Meter bridge
  const [bridgeType, setBridgeType] = useState<"wheatstone" | "meter_bridge">("meter_bridge");
  const [supplyV, setSupplyV] = useState(6.0);
  const [rKnownOhm, setRKnownOhm] = useState(10.0);
  const [rUnknownOhm, setRUnknownOhm] = useState(14.5);
  const [rP, setRP] = useState(100);
  const [rQ, setRQ] = useState(100);
  const [jockeyCm, setJockeyCm] = useState(40.8);

  // Potentiometer
  const [driverEmfV, setDriverEmfV] = useState(4.0);
  const [testEmfV, setTestEmfV] = useState(1.5);
  const [internalResOhm, setInternalResOhm] = useState(1.8);
  const [shuntResOhm, setShuntResOhm] = useState(5.0);
  const [shuntClosed, setShuntClosed] = useState(true);
  const [sliderCm, setSliderCm] = useState(27.6);

  // RLC Oscilloscope & Transients
  const [vPeakV, setVPeakV] = useState(12.0);
  const [freqHz, setFreqHz] = useState(180);
  const [resistanceOhm, setResistanceOhm] = useState(50);
  const [inductanceMh, setInductanceMh] = useState(120);
  const [capacitanceUf, setCapacitanceUf] = useState(6.8);
  const [transientType, setTransientType] = useState<"rc_charge" | "rc_discharge" | "rl_rise">(
    "rc_charge"
  );

  // Fields & Faraday
  const [q1MicroC, setQ1MicroC] = useState(2.5);
  const [q2MicroC, setQ2MicroC] = useState(-2.5);
  const [coilTurns, setCoilTurns] = useState(250);
  const [magnetVelocityMs, setMagnetVelocityMs] = useState(1.2);
  const [solenoidCurrentA, setSolenoidCurrentA] = useState(2.5);

  const [result, setResult] = useState<EmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [realisticView, setRealisticView] = useState(true);

  const simulate = useCallback(
    async (saveRun = false) => {
      setLoading(true);
      try {
        const res = await fetch("/api/physics/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labKey: "electromagnetism",
            saveRun,
            params: {
              subMode,
              bridgeType,
              supplyV,
              rKnownOhm,
              rUnknownOhm,
              rP,
              rQ,
              jockeyCm,
              galvResistanceOhm: 50,
              driverEmfV,
              testEmfV,
              internalResOhm,
              shuntResOhm,
              shuntClosed,
              sliderCm,
              vPeakV,
              freqHz,
              resistanceOhm,
              inductanceMh,
              capacitanceUf,
              transientType,
              charges: [
                { qMicroC: q1MicroC, x: -0.6, y: 0 },
                { qMicroC: q2MicroC, x: 0.6, y: 0 },
              ],
              coilTurns,
              coilRadiusM: 0.05,
              magnetMomentAm2: 1.5,
              magnetVelocityMs,
              solenoidCurrentA,
              solenoidTurnsPerM: 1200,
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
      bridgeType,
      supplyV,
      rKnownOhm,
      rUnknownOhm,
      rP,
      rQ,
      jockeyCm,
      driverEmfV,
      testEmfV,
      internalResOhm,
      shuntResOhm,
      shuntClosed,
      sliderCm,
      vPeakV,
      freqHz,
      resistanceOhm,
      inductanceMh,
      capacitanceUf,
      transientType,
      q1MicroC,
      q2MicroC,
      coilTurns,
      magnetVelocityMs,
      solenoidCurrentA,
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void simulate(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [simulate]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const cycleDurMs = subMode === "em_fields_faraday" ? 4200 : 3000;
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      setProgress((p) => {
        const next = p + dt / cycleDurMs;
        return next >= 1 ? 0 : next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, subMode]);

  function recordRow() {
    if (!result) return;
    if (subMode === "wheatstone_meter_bridge") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `${bridgeType === "meter_bridge" ? "Metr ko'prigi" : "Uitston"} (l=${jockeyCm} sm)`,
          primaryValue: Number(result.summary.estimatedRxAtJockeyOhm ?? result.summary.trueRxOhm ?? 0),
          unit: "Ω",
          details: {
            Ig_mA: result.summary.galvanometerCurrentMa,
            l_null_cm: result.summary.nullPointCm,
            Rx_true: result.summary.trueRxOhm,
          },
        },
      ]);
    } else if (subMode === "potentiometer") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `Potensiometr (l=${sliderCm} sm, kalit=${shuntClosed ? "yopiq" : "ochiq"})`,
          primaryValue: Number(result.summary.computedInternalResOhm ?? 0),
          unit: "Ω",
          details: {
            L1_cm: result.summary.openCircuitNullL1Cm,
            L2_cm: result.summary.closedShuntNullL2Cm,
            Ig_mA: result.summary.galvanometerCurrentMa,
          },
        },
      ]);
    } else if (subMode === "rlc_oscilloscope") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `RLC (f=${freqHz} Hz, R=${resistanceOhm} Ω)`,
          primaryValue: Number(result.summary.impedanceOhm ?? 0),
          unit: "Ω",
          details: {
            I_peak_mA: result.summary.iPeakMa,
            phi_deg: result.summary.phaseDeg,
            f_res_Hz: result.summary.resonanceFreqHz,
          },
        },
      ]);
    } else if (subMode === "rc_rl_transient") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `O'tish jarayoni (${transientType})`,
          primaryValue: Number(result.summary.timeConstantMs ?? 0),
          unit: "ms",
          details: {
            I0_mA: result.summary.initialCurrentMa,
            E_mJ: result.summary.storedEnergyMaxMj,
          },
        },
      ]);
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `Faradey induksiyasi (N=${coilTurns}, v=${magnetVelocityMs} m/s)`,
          primaryValue: Number(result.summary.peakInducedEmfV ?? 0),
          unit: "V",
          details: {
            B_sol_mT: result.summary.solenoidCenterFieldMt,
          },
        },
      ]);
    }
  }

  const sweepCurve =
    (result?.details?.sweepCurve as { x: number; y: number }[] | undefined) ?? [];
  const waveforms =
    (result?.details?.waveforms as
      | {
          tMs: number;
          vSource: number;
          vResistor: number;
          vInductor: number;
          vCapacitor: number;
          iMa: number;
        }[]
      | undefined) ?? [];
  const rlcSweep =
    (result?.details?.sweep as
      | { freqHz: number; iPeakMa: number; impedanceOhm: number }[]
      | undefined) ?? [];
  const transientCurve =
    (result?.details?.curve as
      | { tMs: number; voltageV: number; currentMa: number }[]
      | undefined) ?? [];
  const fieldGrid =
    (result?.details?.fieldGrid as
      | { x: number; y: number; ex: number; ey: number; eMag: number; potentialV: number }[]
      | undefined) ?? [];
  const faradayCurve =
    (result?.details?.faradayCurve as
      | { tMs: number; zM: number; fluxMwb: number; emfV: number }[]
      | undefined) ?? [];

  const galvMa = Number(result?.summary?.galvanometerCurrentMa ?? 0);
  const needleAngleDeg = Math.max(-45, Math.min(45, galvMa * 1.2));

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.subMode === "string") {
      setSubMode(p.subMode as EmSubMode);
    }
    if (typeof p.supplyV === "number") setSupplyV(p.supplyV);
    if (typeof p.rKnownOhm === "number") setRKnownOhm(p.rKnownOhm);
    if (typeof p.rUnknownOhm === "number") setRUnknownOhm(p.rUnknownOhm);
    if (typeof p.jockeyCm === "number") setJockeyCm(p.jockeyCm);
    if (typeof p.vPeakV === "number") setVPeakV(p.vPeakV);
    if (typeof p.freqHz === "number") setFreqHz(p.freqHz);
  }

  return (
    <div className="space-y-4">
      <ScenarioCatalogSelector
        chapter="electromagnetism"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "wheatstone_meter_bridge", label: "#36/#72 Uitston & Metr Ko'prigi" },
            { id: "potentiometer", label: "#46/#57 Potensiometr & Ichki Qarshilik" },
            { id: "rlc_oscilloscope", label: "#10/#30 KRO Ossillograf & RLC Rezonans" },
            { id: "rc_rl_transient", label: "RC / RL O'tish Jarayonlari" },
            { id: "em_fields_faraday", label: "#54/#66 Elektrostatik Maydon & Faradey" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id as EmSubMode)}
              className={`border px-2.5 py-1.5 text-xs font-medium ${
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
          <h2 className="text-sm font-semibold text-slate-900">Zanjir va Maydon Parametrlari</h2>

          {subMode === "wheatstone_meter_bridge" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBridgeType("meter_bridge")}
                  className={`border py-1.5 font-medium ${
                    bridgeType === "meter_bridge"
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Metr Ko&apos;prigi (100 sm)
                </button>
                <button
                  type="button"
                  onClick={() => setBridgeType("wheatstone")}
                  className={`border py-1.5 font-medium ${
                    bridgeType === "wheatstone"
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Uitston Ko&apos;prigi
                </button>
              </div>
              <ParamInput
                label="Manba kuchlanishi"
                symbol="E"
                unit="V"
                value={supplyV}
                onChange={setSupplyV}
                sliderMin={1}
                sliderMax={30}
                step={0.5}
                minValid={0.1}
              />
              <ParamInput
                label="Etalon qarshilik"
                symbol="R_ma'lum"
                unit="Ω"
                value={rKnownOhm}
                onChange={setRKnownOhm}
                sliderMin={1}
                sliderMax={200}
                step={0.5}
                minValid={0.1}
              />
              <ParamInput
                label="Noma'lum qarshilik"
                symbol="R_x"
                unit="Ω"
                value={rUnknownOhm}
                onChange={setRUnknownOhm}
                sliderMin={1}
                sliderMax={200}
                step={0.5}
                minValid={0.1}
              />
              {bridgeType === "meter_bridge" ? (
                <ParamInput
                  label="Jokey (surilma kontakt)"
                  symbol="l"
                  unit="sm"
                  value={jockeyCm}
                  onChange={setJockeyCm}
                  sliderMin={1}
                  sliderMax={99}
                  step={0.1}
                  minValid={0.5}
                  maxValid={99.5}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block">P qarshilik (Ω)</label>
                    <input
                      type="number"
                      step="any"
                      min={0.5}
                      value={rP}
                      onChange={(e) => setRP(Number(e.target.value))}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block">Q qarshilik (Ω)</label>
                    <input
                      type="number"
                      step="any"
                      min={0.5}
                      value={rQ}
                      onChange={(e) => setRQ(Number(e.target.value))}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {subMode === "potentiometer" && (
            <div className="space-y-3 text-xs">
              <ParamInput
                label="Asosiy manba"
                symbol="E₀"
                unit="V"
                value={driverEmfV}
                onChange={setDriverEmfV}
                sliderMin={1.5}
                sliderMax={24}
                step={0.2}
                minValid={0.5}
              />
              <ParamInput
                label="Tekshiriluvchi element"
                symbol="E_x"
                unit="V"
                value={testEmfV}
                onChange={setTestEmfV}
                sliderMin={0.2}
                sliderMax={Math.max(0.5, driverEmfV - 0.1)}
                step={0.1}
                minValid={0.05}
              />
              <ParamInput
                label="Ichki qarshilik"
                symbol="r"
                unit="Ω"
                value={internalResOhm}
                onChange={setInternalResOhm}
                sliderMin={0.1}
                sliderMax={25}
                step={0.1}
                minValid={0.05}
              />
              <ParamInput
                label="Shunt qarshiligi"
                symbol="R_sh"
                unit="Ω"
                value={shuntResOhm}
                onChange={setShuntResOhm}
                sliderMin={0.5}
                sliderMax={100}
                step={0.5}
                minValid={0.1}
              />
              <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={shuntClosed}
                  onChange={(e) => setShuntClosed(e.target.checked)}
                />
                Shunt kaliti (K₂) yopiq holatda
              </label>
              <ParamInput
                label="Reoxord surilmasi"
                symbol="l"
                unit="sm"
                value={sliderCm}
                onChange={setSliderCm}
                sliderMin={1}
                sliderMax={99}
                step={0.1}
                minValid={0}
                maxValid={100}
              />
            </div>
          )}

          {(subMode === "rlc_oscilloscope" || subMode === "rc_rl_transient") && (
            <div className="space-y-3 text-xs">
              {subMode === "rc_rl_transient" && (
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Rejim</label>
                  <select
                    value={transientType}
                    onChange={(e) => setTransientType(e.target.value as typeof transientType)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
                  >
                    <option value="rc_charge">RC zaryadlanish (Vc(t))</option>
                    <option value="rc_discharge">RC razryadlanish (Vc(t))</option>
                    <option value="rl_rise">RL zanjirda tok o&apos;sishi (I(t))</option>
                  </select>
                </div>
              )}
              <ParamInput
                label="Amplituda"
                symbol="V₀"
                unit="V"
                value={vPeakV}
                onChange={setVPeakV}
                sliderMin={1}
                sliderMax={100}
                step={0.5}
                minValid={0.1}
              />
              {subMode === "rlc_oscilloscope" && (
                <ParamInput
                  label="Generator chastotasi"
                  symbol="f"
                  unit="Hz"
                  value={freqHz}
                  onChange={setFreqHz}
                  sliderMin={10}
                  sliderMax={2000}
                  step={5}
                  minValid={0.5}
                />
              )}
              <ParamInput
                label="Qarshilik"
                symbol="R"
                unit="Ω"
                value={resistanceOhm}
                onChange={setResistanceOhm}
                sliderMin={1}
                sliderMax={2000}
                step={5}
                minValid={0.1}
              />
              <ParamInput
                label="Induktivlik"
                symbol="L"
                unit="mH"
                value={inductanceMh}
                onChange={setInductanceMh}
                sliderMin={1}
                sliderMax={1000}
                step={1}
                minValid={0.01}
              />
              <ParamInput
                label="Sig‘im"
                symbol="C"
                unit="µF"
                value={capacitanceUf}
                onChange={setCapacitanceUf}
                sliderMin={0.1}
                sliderMax={200}
                step={0.2}
                minValid={0.01}
              />
            </div>
          )}

          {subMode === "em_fields_faraday" && (
            <div className="space-y-3 text-xs">
              <ParamInput
                label="1-nuqtaviy zaryad (x=-0.6 m)"
                symbol="q₁"
                unit="µC"
                value={q1MicroC}
                onChange={setQ1MicroC}
                sliderMin={-15}
                sliderMax={15}
                step={0.5}
              />
              <ParamInput
                label="2-nuqtaviy zaryad (x=+0.6 m)"
                symbol="q₂"
                unit="µC"
                value={q2MicroC}
                onChange={setQ2MicroC}
                sliderMin={-15}
                sliderMax={15}
                step={0.5}
              />
              <ParamInput
                label="G‘altak o‘ramlar soni"
                symbol="N"
                unit="ta"
                value={coilTurns}
                onChange={setCoilTurns}
                sliderMin={10}
                sliderMax={2000}
                step={10}
                minValid={1}
                integer
              />
              <ParamInput
                label="Magnit tezligi"
                symbol="v"
                unit="m/s"
                value={magnetVelocityMs}
                onChange={setMagnetVelocityMs}
                sliderMin={0.1}
                sliderMax={10}
                step={0.1}
                minValid={0.05}
              />
              <ParamInput
                label="Solenoid toki"
                symbol="I"
                unit="A"
                value={solenoidCurrentA}
                onChange={setSolenoidCurrentA}
                sliderMin={0.1}
                sliderMax={20}
                step={0.1}
                minValid={0}
              />
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Fizik Model (MNA Matritsa / Maksvell)
            </div>
            <MathFormula
              tex={
                subMode === "wheatstone_meter_bridge"
                  ? "R_x = R_{\\text{ma'lum}} \\frac{100 - l_0}{l_0}, \\quad [G]\\vec{V} = \\vec{I}"
                  : subMode === "potentiometer"
                  ? "r = R_{\\text{sh}}\\left(\\frac{l_1}{l_2} - 1\\right), \\quad \\gamma = \\frac{E_0}{100\\text{ sm}}"
                  : subMode === "rlc_oscilloscope"
                  ? "Z = \\sqrt{R^2 + (X_L - X_C)^2}, \\quad f_0 = \\frac{1}{2\\pi\\sqrt{LC}}"
                  : subMode === "rc_rl_transient"
                  ? "\\tau_{RC} = RC, \\quad \\tau_{RL} = \\frac{L}{R}"
                  : "\\mathcal{E} = -N\\frac{d\\Phi_B}{dt}, \\quad B_{\\text{sol}} = \\mu_0 n I"
              }
            />
          </div>
        </div>

        {/* Display & Charts */}
        <div className="space-y-4 lg:col-span-8">
          {(subMode === "wheatstone_meter_bridge" || subMode === "potentiometer") && result && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Jonli Elektromagnetizm va Ko‘prik Tajriba Stendi
                    </h3>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
                      U = <strong className="text-[#1E3A8A]">{subMode === "wheatstone_meter_bridge" ? supplyV : driverEmfV} V</strong> · l ={" "}
                      <strong className="text-[#1E3A8A]">{(subMode === "wheatstone_meter_bridge" ? jockeyCm : sliderCm).toFixed(1)} sm</strong> · Ig ={" "}
                      <strong className={result.summary.balanced ? "text-[#15803D]" : "text-[#B91C1C]"}>
                        {String(result.summary.galvanometerCurrentMa)} mA
                      </strong> ·{" "}
                      <span className={`font-sans font-semibold ${result.summary.balanced ? "text-emerald-700" : "text-amber-700"}`}>
                        [{result.summary.balanced ? "Nol nuqta topildi!" : "Nol nuqtaga keltiring"}]
                      </span>
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
                      {realisticView ? "🎨 Realistik Stend" : "📐 Akademik Sxema"}
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

                <div className="grid gap-4 border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-12 rounded-md">
                  {/* Galvanometer Gauge */}
                  <div className="flex flex-col items-center justify-center border border-slate-200 bg-white p-3 sm:col-span-5 rounded-md shadow-2xs">
                    <div className="mb-1 text-xs font-semibold text-slate-800">
                      #62 Markaziy-nol Galvanometr
                    </div>
                    <svg viewBox="0 0 220 130" className="h-32 w-full max-w-[220px] select-none">
                      <path
                        d="M 25 110 A 85 85 0 0 1 195 110"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="2"
                      />
                      <line x1={110} y1={25} x2={110} y2={35} stroke="#15803D" strokeWidth="2" />
                      <text x={110} y={48} textAnchor="middle" fontSize="9" fill="#15803D" fontWeight="700">
                        0 (NOL)
                      </text>
                      <g transform={`translate(110, 110) rotate(${needleAngleDeg + (playing ? Math.sin(progress * Math.PI * 6) * 1.2 : 0)})`}>
                        <line
                          x1={0}
                          y1={0}
                          x2={0}
                          y2={-78}
                          stroke={result.summary.balanced ? "#15803D" : "#B91C1C"}
                          strokeWidth="2.5"
                        />
                      </g>
                      <circle cx={110} cy={110} r={5} fill="#0F172A" />
                    </svg>
                    <div className="font-mono text-sm font-semibold text-slate-900">
                      Ig = {String(result.summary.galvanometerCurrentMa)} mA
                    </div>
                    <span
                      className={`mt-1 border px-2 py-0.5 text-[11px] font-semibold ${
                        result.summary.balanced
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-amber-300 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {result.summary.balanced ? "Nol nuqta topildi!" : "Nol nuqtaga keltiring"}
                    </span>
                  </div>

                  {/* Clickable 100 cm Resistance Wire Bar */}
                  <div className="sm:col-span-7 rounded-md border border-slate-200 bg-white p-3 flex flex-col justify-center shadow-2xs">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        100 sm Reoxord / Ko‘prik Simi (Jokeyni suring)
                      </span>
                      <span className="font-mono font-bold text-[#1E3A8A]">
                        l = {(subMode === "wheatstone_meter_bridge" ? jockeyCm : sliderCm).toFixed(1)} sm
                      </span>
                    </div>
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cm = Math.min(99, Math.max(1, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))));
                        if (subMode === "wheatstone_meter_bridge") setJockeyCm(cm);
                        else setSliderCm(cm);
                      }}
                      className="relative h-9 cursor-crosshair rounded border border-slate-300 bg-slate-50"
                      title="Nol nuqtani topish uchun istalgan santimetrga bosing"
                    >
                      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-amber-600/80 rounded-full" />
                      {[0, 25, 50, 75, 100].map((mark) => (
                        <div
                          key={mark}
                          style={{ left: `${mark}%` }}
                          className="absolute top-0 bottom-0 border-l border-slate-300"
                        />
                      ))}
                      <div
                        style={{
                          left: `${subMode === "wheatstone_meter_bridge" ? jockeyCm : sliderCm}%`,
                        }}
                        className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 rounded bg-[#1E3A8A] shadow-xs"
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
                      <span>0 sm</span>
                      <span>25 sm</span>
                      <span>50 sm</span>
                      <span>75 sm</span>
                      <span>100 sm</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-600">
                  <span className="font-semibold">Vaqt o‘qi (Jokey holati):</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={subMode === "wheatstone_meter_bridge" ? jockeyCm : sliderCm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (subMode === "wheatstone_meter_bridge") setJockeyCm(val);
                      else setSliderCm(val);
                    }}
                    className="flex-1 accent-[#1E3A8A]"
                  />
                  <span className="w-16 text-right font-mono tabular-nums">
                    {(subMode === "wheatstone_meter_bridge" ? jockeyCm : sliderCm).toFixed(1)}%
                  </span>
                </div>
              </div>

                {/* Summary metrics */}
                <div className="grid grid-cols-2 gap-2.5 sm:col-span-7">
                  {subMode === "wheatstone_meter_bridge" ? (
                    <>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Nol nuqta masofasi</div>
                        <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                          l₀ = {String(result.summary.nullPointCm)} sm
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Jokeydagi hisobiy R_x</div>
                        <div className="font-mono text-sm font-bold text-slate-900">
                          R_x′ = {String(result.summary.estimatedRxAtJockeyOhm)} Ω
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Haqiqiy qarshilik</div>
                        <div className="font-mono text-sm font-bold text-emerald-700">
                          R_x = {String(result.summary.trueRxOhm)} Ω
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Tugun potensiallari</div>
                        <div className="font-mono text-xs font-bold text-slate-900">
                          V_B = {String(result.summary.nodeBVoltageV)} V · V_C = {String(result.summary.nodeCVoltageV)} V
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Ochiq zanjir nol nuqtasi</div>
                        <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                          l₁ = {String(result.summary.openCircuitNullL1Cm)} sm
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Shunt yopiq nol nuqtasi</div>
                        <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                          l₂ = {String(result.summary.closedShuntNullL2Cm)} sm
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Potensial gradienti</div>
                        <div className="font-mono text-sm font-bold text-slate-900">
                          γ = {String(result.summary.potentialGradientVCm)} V/sm
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] text-slate-500">Aniqlangan ichki qarshilik</div>
                        <div className="font-mono text-sm font-bold text-emerald-700">
                          r = {String(result.summary.computedInternalResOhm)} Ω
                        </div>
                      </div>
                    </>
                  )}
                </div>

              {subMode === "wheatstone_meter_bridge" && sweepCurve.length > 0 && (
                <ScientificChart
                  title="Galvanometr toki Ig(l) ning jokey holatiga bog'liqligi"
                  xLabel="Jokey masofasi l (sm)"
                  yLabel="Ig (mA)"
                  series={[{ label: "Ig (mA)", color: "#1E3A8A", points: sweepCurve }]}
                />
              )}
            </>
          )}

          {subMode === "rlc_oscilloscope" && result && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">To‘liq qarshilik (impedans)</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    Z = {String(result.summary.impedanceOhm)} Ω
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Rezonans chastotasi</div>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    f₀ = {String(result.summary.resonanceFreqHz)} Hz
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Faza siljishi / Maksimal tok</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    φ = {String(result.summary.phaseDeg)}° · I_max = {String(result.summary.iPeakMa)} mA
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Sifat faktori / Rejim</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    Q = {String(result.summary.qualityFactorQ)} · {String(result.summary.regime)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ScientificChart
                  title="KRO Ikki Kanalli Ossillogramma: V_manba va V_R"
                  xLabel="t (ms)"
                  yLabel="Kuchlanish (V)"
                  series={[
                    {
                      label: "CH1: Manba V(t)",
                      color: "#1E3A8A",
                      points: waveforms.map((w) => ({ x: w.tMs, y: w.vSource })),
                    },
                    {
                      label: "CH2: Rezistor VR(t)",
                      color: "#B91C1C",
                      points: waveforms.map((w) => ({ x: w.tMs, y: w.vResistor })),
                    },
                  ]}
                />
                <ScientificChart
                  title="Amplituda-Chastota Xarakteristikasi (Rezonans)"
                  xLabel="f (Hz)"
                  yLabel="I_peak (mA)"
                  series={[
                    {
                      label: "I_peak(f)",
                      color: "#15803D",
                      points: rlcSweep.map((p) => ({ x: p.freqHz, y: p.iPeakMa })),
                    },
                  ]}
                />
              </div>
            </>
          )}

          {subMode === "rc_rl_transient" && result && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Vaqt doimiysi</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    τ = {String(result.summary.timeConstantMs)} ms
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Boshlang‘ich / maksimal tok</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    I₀ = {String(result.summary.initialCurrentMa)} mA
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">To‘plangan energiya</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    W_max = {String(result.summary.storedEnergyMaxMj)} mJ
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ScientificChart
                  title="Kuchlanish o'tish grafigi V(t)"
                  xLabel="t (ms)"
                  yLabel="V (V)"
                  series={[
                    {
                      label: "V(t)",
                      color: "#1E3A8A",
                      points: transientCurve.map((p) => ({ x: p.tMs, y: p.voltageV })),
                    },
                  ]}
                />
                <ScientificChart
                  title="Tok o'tish grafigi I(t)"
                  xLabel="t (ms)"
                  yLabel="I (mA)"
                  series={[
                    {
                      label: "I(t)",
                      color: "#B91C1C",
                      points: transientCurve.map((p) => ({ x: p.tMs, y: p.currentMa })),
                    },
                  ]}
                />
              </div>
            </>
          )}

          {subMode === "em_fields_faraday" && result && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Maksimal induksiya EYuK</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    ℰ_max = {String(result.summary.peakInducedEmfV)} V
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Solenoid markaziy maydoni</div>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    B = {String(result.summary.solenoidCenterFieldMt)} mT
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Zaryadlar soni</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    N_q = {String(result.summary.chargeCount)} ta
                  </div>
                </div>
              </div>

              {/* Animated Faraday Magnet + Coil Simulation */}
              {faradayCurve.length > 0 && (() => {
                const fIdx = Math.min(faradayCurve.length - 1, Math.floor(progress * (faradayCurve.length - 1)));
                const fPt = faradayCurve[fIdx];
                const magPxX = 300 + (fPt.zM / 0.35) * 195;
                const emfClamp = Math.max(-45, Math.min(45, fPt.emfV * 12));
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">
                          Jonli Faradey Elektromagnit Induksiya Qurilmasi
                        </span>
                        <div className="font-mono text-[11px] text-slate-600 tabular-nums">
                          t = {fPt.tMs.toFixed(1)} ms · z = {fPt.zM.toFixed(3)} m · Φ = {fPt.fluxMwb.toFixed(4)} mWb · ℰ = {fPt.emfV.toFixed(4)} V
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
                      <svg viewBox="0 0 600 160" className="h-40 w-full">
                        <line x1={30} y1={90} x2={570} y2={90} stroke="#CBD5E1" strokeDasharray="4 3" />
                        {/* Stationary N-turn Copper Coil */}
                        {[-16, -8, 0, 8, 16].map((dx) => (
                          <ellipse key={dx} cx={300 + dx} cy={90} rx={12} ry={46} fill="none" stroke="#B45309" strokeWidth="3.2" />
                        ))}
                        <text x={300} y={28} textAnchor="middle" fontSize="10" fill="#92400E" fontWeight="700">
                          G‘altak (N={coilTurns})
                        </text>
                        {/* Moving Bar Magnet */}
                        <rect x={magPxX - 46} y={74} width={46} height={32} rx={3} fill="#1E3A8A" />
                        <rect x={magPxX} y={74} width={46} height={32} rx={3} fill="#B91C1C" />
                        <text x={magPxX - 23} y={94} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="700">S</text>
                        <text x={magPxX + 23} y={94} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="700">N</text>
                        {/* Live EMF Galvanometer */}
                        <circle cx={535} cy={44} r={24} fill="#FFFFFF" stroke="#334155" strokeWidth="2" />
                        <g transform={`translate(535,44) rotate(${emfClamp})`}>
                          <line x1={0} y1={0} x2={0} y2={-19} stroke="#B91C1C" strokeWidth="2" />
                        </g>
                        <circle cx={535} cy={44} r={3} fill="#0F172A" />
                        <text x={535} y={82} textAnchor="middle" fontSize="9.5" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                          ℰ = {fPt.emfV.toFixed(2)} V
                        </text>
                      </svg>
                    </div>
                  </div>
                );
              })()}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-slate-200 bg-white p-4">
                  <div className="mb-2 text-xs font-semibold text-slate-900">
                    2D Elektrostatik Maydon E(x, y) Vektor To&apos;ri
                  </div>
                  <svg viewBox="0 0 360 240" className="h-56 w-full border border-slate-100 bg-slate-50">
                    {fieldGrid.map((pt, i) => {
                      const cx = ((pt.x + 1.5) / 3.0) * 320 + 20;
                      const cy = 220 - ((pt.y + 1.0) / 2.0) * 200;
                      const len = pt.eMag > 1e-6 ? 12 : 0;
                      const ux = pt.eMag > 1e-6 ? (pt.ex / pt.eMag) * len : 0;
                      const uy = pt.eMag > 1e-6 ? (pt.ey / pt.eMag) * len : 0;
                      return (
                        <line
                          key={i}
                          x1={cx}
                          y1={cy}
                          x2={cx + ux}
                          y2={cy - uy}
                          stroke="#334155"
                          strokeWidth="1.2"
                        />
                      );
                    })}
                    {/* Charges */}
                    {[
                      { q: q1MicroC, x: -0.6, y: 0, label: "q1" },
                      { q: q2MicroC, x: 0.6, y: 0, label: "q2" },
                    ].map((ch, idx) => {
                      const cx = ((ch.x + 1.5) / 3.0) * 320 + 20;
                      const cy = 220 - ((ch.y + 1.0) / 2.0) * 200;
                      return (
                        <g key={idx}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={10}
                            fill={ch.q >= 0 ? "#B91C1C" : "#1E3A8A"}
                          />
                          <text
                            x={cx}
                            y={cy + 3.5}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#FFFFFF"
                            fontWeight="700"
                          >
                            {ch.q >= 0 ? "+" : "-"}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <ScientificChart
                  title="Faradey Qonuni: Induksiya EYuK E(t)"
                  xLabel="t (ms)"
                  yLabel="EYuK (V)"
                  series={[
                    {
                      label: "Induksiya EYuK (V)",
                      color: "#1E3A8A",
                      points: faradayCurve.map((p) => ({ x: p.tMs, y: p.emfV })),
                    },
                  ]}
                />
              </div>
            </>
          )}

          <LabFormulaStrip section="Elektromagnetizm" />
          <LabReportPanel
            labKey="electromagnetism"
            defaultTitle="Elektromagnetizm va Elektr O'lchovlari Laboratoriya Ishi"
            rows={rows}
            onClearRows={() => setRows([])}
            onDeleteRow={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
          />
        </div>
      </div>
    </div>
  );
}
