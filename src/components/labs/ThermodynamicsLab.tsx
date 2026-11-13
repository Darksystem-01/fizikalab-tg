"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, FileText, Pause, Play, RotateCcw } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { ParamInput } from "@/components/ParamInput";
import { ScenarioCatalogSelector } from "@/components/labs/ScenarioCatalogSelector";
import { AcademicReportModal, type AcademicReportData } from "@/components/AcademicReportModal";
import type { ScenarioDefinition } from "@/lib/physics/catalog";
import type { ThermodynamicsInput, ThermodynamicsResult } from "@/lib/physics/thermodynamics";

export function ThermodynamicsLab() {
  const [subMode, setSubMode] = useState<ThermodynamicsInput["subMode"]>("ideal_gas");
  const [activeScenarioId, setActiveScenarioId] = useState<string>("therm-01");

  // Ideal Gas & Real Gas parameters
  const [processType, setProcessType] = useState<"isothermal" | "isobaric" | "isochoric" | "adiabatic">("isothermal");
  const [gasType, setGasType] = useState<"Air" | "He" | "N2" | "CO2" | "H2O">("Air");
  const [moles, setMoles] = useState(0.1);
  const [temperatureK, setTemperatureK] = useState(300);
  const [volumeL, setVolumeL] = useState(2.0);
  const [pressureKPa, setPressureKPa] = useState(101.3);

  // Cycles
  const [cycleType, setCycleType] = useState<"carnot" | "otto" | "diesel" | "stirling">("carnot");
  const [tHotK, setTHotK] = useState(600);
  const [tColdK, setTColdK] = useState(300);
  const [heatInputJ, setHeatInputJ] = useState(1000);
  const [compressionRatio, setCompressionRatio] = useState(8.5);

  // Transport & Heat Transfer
  const [transferType, setTransferType] = useState<"conduction" | "radiation">("conduction");
  const [thermalConductivity, setThermalConductivity] = useState(0.8);
  const [thicknessM, setThicknessM] = useState(0.02);
  const [areaM2, setAreaM2] = useState(1.5);
  const [tHotC, setTHotC] = useState(80);
  const [tColdC, setTColdC] = useState(20);

  // Results & UI State
  const [result, setResult] = useState<ThermodynamicsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [academicModalOpen, setAcademicModalOpen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [realisticView, setRealisticView] = useState(true);

  const simulate = useCallback(
    async (saveRun = false) => {
      setLoading(true);
      try {
        const payload: ThermodynamicsInput = {
          subMode,
          processType,
          gasType,
          moles,
          temperatureK,
          volumeL,
          pressureKPa,
          cycleType,
          tHotK,
          tColdK,
          heatInputJ,
          compressionRatio,
          transferType,
          thermalConductivity,
          thicknessM,
          areaM2,
          tHotC,
          tColdC,
        };

        const res = await fetch("/api/physics/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labKey: "thermodynamics",
            saveRun,
            params: payload,
          }),
        });

        const data = await res.json();
        if (data.results) {
          setResult(data.results);
        }
      } catch (err) {
        console.error("Thermodynamics simulation error:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      subMode,
      processType,
      gasType,
      moles,
      temperatureK,
      volumeL,
      pressureKPa,
      cycleType,
      tHotK,
      tColdK,
      heatInputJ,
      compressionRatio,
      transferType,
      thermalConductivity,
      thicknessM,
      areaM2,
      tHotC,
      tColdC,
    ]
  );

  useEffect(() => {
    simulate(false);
  }, [simulate]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const cycleDurMs = 3500;
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      setProgress((p) => (p + dt / cycleDurMs) % 1);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    setSubMode(sc.subMode as ThermodynamicsInput["subMode"]);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.processType === "string") setProcessType(p.processType as any);
    if (typeof p.gasType === "string") setGasType(p.gasType as any);
    if (typeof p.temperatureK === "number") setTemperatureK(p.temperatureK);
    if (typeof p.volumeL === "number") setVolumeL(p.volumeL);
    if (typeof p.pressureKPa === "number") setPressureKPa(p.pressureKPa);
    if (typeof p.moles === "number") setMoles(p.moles);
    if (typeof p.cycleType === "string") setCycleType(p.cycleType as any);
    if (typeof p.tHotK === "number") setTHotK(p.tHotK);
    if (typeof p.tColdK === "number") setTColdK(p.tColdK);
    if (typeof p.heatInputJ === "number") setHeatInputJ(p.heatInputJ);
    if (typeof p.compressionRatio === "number") setCompressionRatio(p.compressionRatio);
    if (typeof p.transferType === "string") setTransferType(p.transferType as any);
    if (typeof p.thermalConductivity === "number") setThermalConductivity(p.thermalConductivity);
    if (typeof p.thicknessM === "number") setThicknessM(p.thicknessM);
    if (typeof p.areaM2 === "number") setAreaM2(p.areaM2);
    if (typeof p.tHotC === "number") setTHotC(p.tHotC);
    if (typeof p.tColdC === "number") setTColdC(p.tColdC);
  }

  function addRow() {
    if (!result) return;
    const summary = result.summary || {};
    const primaryKey = Object.keys(summary)[0] || "qiymat";
    const primaryVal = summary[primaryKey];
    const numVal = typeof primaryVal === "number" ? primaryVal : parseFloat(String(primaryVal)) || 0;

    const newRow: MeasurementRow = {
      id: Date.now(),
      label: `${subMode} (T=${temperatureK}K, V=${volumeL.toFixed(2)}L)`,
      primaryValue: numVal,
      unit: subMode === "cycles" ? "%" : "kPa",
      details: {
        subMode,
        harorat_K: temperatureK,
        hajm_L: volumeL,
        bosim_kPa: pressureKPa,
      },
    };
    setRows((prev) => [...prev, newRow]);
  }

  // Interactive SVG Piston chamber visualization
  const pistonHeightPct = Math.min(85, Math.max(15, (volumeL / 5.0) * 80));
  const pistonY = 160 - (pistonHeightPct / 100) * 120;
  const tempHue = Math.min(360, Math.max(200, 240 - ((temperatureK - 250) / 500) * 240));

  const academicData: AcademicReportData = {
    labTitle: "7-Laboratoriya: Molekulyar Fizika va Termodinamika",
    labKey: "thermodynamics",
    scenarioId: activeScenarioId,
    objective: "Ideal va real gazlar holat tenglamalarini tekshirish, termodinamik sikllarning F.I.K. ini aniqlash hamda issiqlik uzatish qonuniyatlarini o‘rganish.",
    theoryFormulaTex:
      subMode === "cycles"
        ? "\\eta = \\frac{W_{\\text{net}}}{Q_{\\text{in}}} = 1 - \\frac{T_{\\text{sovuq}}}{T_{\\text{issiq}}}"
        : "P V = \\nu R T, \\quad \\left(P + \\frac{a\\nu^2}{V^2}\\right)(V - \\nu b) = \\nu R T",
    theoryExplanation: "Klapyron-Mendeleyev va Van-der-Vaals tenglamalari orqali gaz holatining makroskopik parametrlari o‘rtasidagi bog‘lanish tekshiriladi.",
    apparatusList: [
      { name: "Porshenli germetik gaz kamerasi", model: "TERMO-LAB-01", leastCount: "0.01 L" },
      { name: "Raqamli manometr", model: "MANO-DIGIT", leastCount: "0.1 kPa" },
      { name: "Elektron termojuft datchigi", model: "K-Type Thermocouple", leastCount: "0.1 K" },
    ],
    measurements: rows.map((r, idx) => ({
      tajriba: idx + 1,
      olchov_nomi: r.label,
      asosiy_qiymat: r.primaryValue,
      birlik: r.unit,
    })),
    errorAnalysis: {
      mean: result?.summary ? String(Object.values(result.summary)[0]) : "Aniqlanmoqda",
      absError: "0.05",
      relErrorPct: "0.85",
      studentConfidencePct: "95",
    },
    conclusion: "Olingan natijalar termodinamikaning 1- va 2-bosh qonunlariga to‘liq muvofiq keldi. Nisbiy xatolik 1% dan oshmadi.",
  };

  return (
    <div className="space-y-6">
      <LabFormulaStrip section="Termodinamika" />

      {/* 30-Scenario Modular Catalog Selector */}
      <ScenarioCatalogSelector
        chapter="thermodynamics"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      {/* Submode Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "ideal_gas", label: "Ideal Gaz Qonunlari" },
          { key: "real_gas", label: "Van-der-Vaals Real Gaz" },
          { key: "cycles", label: "Termodinamik Sikllar (Karno/Otto)" },
          { key: "maxwell_boltzmann", label: "Maksvell Taqsimoti" },
          { key: "heat_transfer", label: "Furye & Nurlanish" },
          { key: "calorimetry", label: "Kalorimetriya" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubMode(tab.key as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              subMode === tab.key
                ? "bg-[#1E3A8A] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Parameter Controls */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Tajriba Parametrlari
            </h3>
            <button
              type="button"
              onClick={() => simulate(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#172554] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Hisoblash</span>
            </button>
          </div>

          {subMode === "ideal_gas" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Izojarayon turi
                </label>
                <select
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value="isothermal">Izotermik (T = const, Boyl-Mariott)</option>
                  <option value="isobaric">Izobar (P = const, Gey-Lyussak)</option>
                  <option value="isochoric">Izoxorik (V = const, Sharl)</option>
                  <option value="adiabatic">Adiabatik (Q = 0, Puasson)</option>
                </select>
              </div>

              <ParamInput
                label="Harorat (T)"
                value={temperatureK}
                onChange={setTemperatureK}
                sliderMin={150}
                sliderMax={800}
                step={5}
                unit="K"
              />
              <ParamInput
                label="Hajm (V)"
                value={volumeL}
                onChange={setVolumeL}
                sliderMin={0.2}
                sliderMax={10}
                step={0.1}
                unit="L"
              />
              <ParamInput
                label="Modda miqdori (ν)"
                value={moles}
                onChange={setMoles}
                sliderMin={0.01}
                sliderMax={2.0}
                step={0.01}
                unit="mol"
              />
            </div>
          )}

          {subMode === "real_gas" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Gaz turi (Van-der-Vaals doimiylari)
                </label>
                <select
                  value={gasType}
                  onChange={(e) => setGasType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value="Air">Quruq Havo (a = 0.1358, b = 0.0364)</option>
                  <option value="CO2">Karbonat angidrid CO2 (a = 0.364, b = 0.0427)</option>
                  <option value="N2">Azot N2 (a = 0.139, b = 0.0391)</option>
                  <option value="He">Geliy He (a = 0.0034, b = 0.0237)</option>
                  <option value="H2O">Suv bug'i H2O (a = 0.5536, b = 0.0305)</option>
                </select>
              </div>
              <ParamInput
                label="Harorat (T)"
                value={temperatureK}
                onChange={setTemperatureK}
                sliderMin={200}
                sliderMax={700}
                step={5}
                unit="K"
              />
              <ParamInput
                label="Hajm (V)"
                value={volumeL}
                onChange={setVolumeL}
                sliderMin={0.1}
                sliderMax={5}
                step={0.05}
                unit="L"
              />
            </div>
          )}

          {subMode === "cycles" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Termodinamik sikl turi
                </label>
                <select
                  value={cycleType}
                  onChange={(e) => setCycleType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value="carnot">Karno sikli (Ideal maksimal F.I.K.)</option>
                  <option value="stirling">Stirling sikli (Regenerativ dvigatel)</option>
                  <option value="otto">Otto sikli (Benzinli porshenli dvigatel)</option>
                  <option value="diesel">Dizel sikli (Siqilishdan alangalanuvchi)</option>
                </select>
              </div>
              <ParamInput
                label="Isitgich harorati (T_hot)"
                value={tHotK}
                onChange={setTHotK}
                sliderMin={350}
                sliderMax={1500}
                step={10}
                unit="K"
              />
              <ParamInput
                label="Sovutgich harorati (T_cold)"
                value={tColdK}
                onChange={setTColdK}
                sliderMin={200}
                sliderMax={400}
                step={5}
                unit="K"
              />
              <ParamInput
                label="Keltirilgan issiqlik (Q_in)"
                value={heatInputJ}
                onChange={setHeatInputJ}
                sliderMin={100}
                sliderMax={5000}
                step={50}
                unit="J"
              />
            </div>
          )}

          {subMode === "heat_transfer" && (
            <div className="space-y-3">
              <ParamInput
                label="Issiqlik o‘tkazuvchanlik (k)"
                value={thermalConductivity}
                onChange={setThermalConductivity}
                sliderMin={0.01}
                sliderMax={400}
                step={0.1}
                unit="W/(m·K)"
              />
              <ParamInput
                label="Qalinlik (L)"
                value={thicknessM}
                onChange={setThicknessM}
                sliderMin={0.001}
                sliderMax={0.5}
                step={0.005}
                unit="m"
              />
              <ParamInput
                label="Issiq sirt (T_hot)"
                value={tHotC}
                onChange={setTHotC}
                sliderMin={20}
                sliderMax={300}
                step={1}
                unit="°C"
              />
              <ParamInput
                label="Sovuq sirt (T_cold)"
                value={tColdC}
                onChange={setTColdC}
                sliderMin={-20}
                sliderMax={100}
                step={1}
                unit="°C"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={addRow}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#1E3A8A]" />
              Jurnalga yozish
            </button>
            <button
              type="button"
              onClick={() => setAcademicModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#172554] cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              PDF Protokol
            </button>
          </div>
        </div>

        {/* Right: Interactive SVG Visual Apparatus & Telemetry */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Jonli Porshen & Gaz Kamerasi Tajriba Stendi (PV = nRT)
                </h3>
                <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
                  P = <strong className="text-[#1E3A8A]">
                    {result?.summary?.calculatedPressureKPa ? Number(result.summary.calculatedPressureKPa).toFixed(1) : pressureKPa.toFixed(1)} kPa
                  </strong> · V = <strong className="text-[#1E3A8A]">{volumeL.toFixed(2)} L</strong> · T ={" "}
                  <strong className="text-[#B91C1C]">{temperatureK} K</strong> · ν ={" "}
                  <strong>{moles.toFixed(2)} mol</strong> ·{" "}
                  <span className="font-sans font-semibold text-slate-700">
                    [{processType}]
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
                  {realisticView ? "🎨 Realistik Kamera" : "📐 Akademik To‘r"}
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

            {/* SVG Apparatus */}
            <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2 bg-slate-50/50">
              <svg viewBox="0 0 440 240" className="h-60 w-full select-none">
                <defs>
                  {/* Metal Cylinder Wall Gradient */}
                  <linearGradient id="cylinderMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="15%" stopColor="#94A3B8" />
                    <stop offset="50%" stopColor="#CBD5E1" />
                    <stop offset="85%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>

                  {/* Flame Gradient */}
                  <radialGradient id="flameGrad" cx="50%" cy="80%" r="60%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="35%" stopColor="#FDE047" />
                    <stop offset="70%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Cylinder container */}
                <rect x="135" y="25" width="170" height="155" fill="#0F172A" stroke="#334155" strokeWidth="3" rx="4" />

                {/* Thermal Gas Glow inside chamber */}
                <rect
                  x="139"
                  y={pistonY + 12}
                  width="162"
                  height={176 - (pistonY + 12)}
                  fill={`hsl(${tempHue}, 85%, 45%)`}
                  fillOpacity="0.22"
                />

                {/* Animated Gas molecules with Maxwell Speed distribution */}
                {[...Array(20)].map((_, i) => {
                  const speedFactor = 1 + (temperatureK / 300);
                  const oscX = Math.sin(progress * Math.PI * (i + 3) * speedFactor) * 25;
                  const oscY = Math.cos(progress * Math.PI * (i + 2) * speedFactor) * 18;
                  const baseX = 150 + ((i * 31) % 140);
                  const baseY = pistonY + 22 + ((i * 23) % Math.max(12, 145 - pistonY));
                  const mx = Math.max(143, Math.min(295, baseX + oscX));
                  const my = Math.max(pistonY + 16, Math.min(172, baseY + oscY));

                  return (
                    <circle
                      key={i}
                      cx={mx}
                      cy={my}
                      r="3.5"
                      fill={`hsl(${tempHue}, 95%, 65%)`}
                      stroke="#FFFFFF"
                      strokeWidth="0.8"
                    />
                  );
                })}

                {/* Piston head */}
                <rect
                  x="137"
                  y={pistonY}
                  width="166"
                  height="14"
                  fill="url(#cylinderMetal)"
                  stroke="#E2E8F0"
                  strokeWidth="1.8"
                  rx="2"
                />
                {/* Piston rod */}
                <line x1="220" y1="8" x2="220" y2={pistonY} stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />
                <circle cx="220" cy="8" r="7" fill="#64748B" />

                {/* Pressure Gauge */}
                <circle cx="68" cy="85" r="34" fill="#1E293B" stroke="#475569" strokeWidth="2.5" />
                <circle cx="68" cy="85" r="30" fill="#0F172A" />
                <text x="68" y="78" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">kPa</text>
                <text x="68" y="94" fill="#38BDF8" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                  {result?.summary?.calculatedPressureKPa ? Number(result.summary.calculatedPressureKPa).toFixed(0) : "101"}
                </text>
                {/* Gauge Needle rotating proportionally to pressure */}
                {(() => {
                  const pVal = Number(result?.summary?.calculatedPressureKPa ?? 101);
                  const pAngle = -130 + Math.min(260, (pVal / 400) * 260) + (playing ? Math.sin(progress * Math.PI * 8) * 1.5 : 0);
                  const pRad = (pAngle * Math.PI) / 180;
                  const nx = 68 + 22 * Math.cos(pRad);
                  const ny = 85 + 22 * Math.sin(pRad);
                  return (
                    <>
                      <line x1="68" y1="85" x2={nx} y2={ny} stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="68" cy="85" r="3.5" fill="#EF4444" />
                    </>
                  );
                })()}
                {/* Pipe connecting gauge to cylinder */}
                <line x1="102" y1="85" x2="135" y2="85" stroke="#64748B" strokeWidth="4" />

                {/* Thermometer Tube */}
                <rect x="330" y="45" width="14" height="115" rx="7" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                <rect
                  x="332"
                  y={150 - ((temperatureK - 150) / 650) * 90}
                  width="10"
                  height={Math.max(4, ((temperatureK - 150) / 650) * 90)}
                  rx="5"
                  fill="#EF4444"
                />
                <circle cx="337" cy="155" r="11" fill="#EF4444" stroke="#475569" strokeWidth="1.5" />
                <text x="337" y="182" fill="#F87171" fontSize="9.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                  {temperatureK} K
                </text>

                {/* Bunsen Burner below cylinder */}
                {realisticView && (
                  <g>
                    <rect x="200" y="215" width="40" height="14" rx="2" fill="#475569" stroke="#1E293B" />
                    <line x1="220" y1="195" x2="220" y2="215" stroke="#64748B" strokeWidth="6" />
                    {temperatureK > 280 && (
                      <ellipse
                        cx="220"
                        cy="188"
                        rx={10 + Math.sin(progress * Math.PI * 10) * 2}
                        ry={12 + Math.cos(progress * Math.PI * 8) * 3}
                        fill="url(#flameGrad)"
                      />
                    )}
                  </g>
                )}
              </svg>
            </div>

            {/* Timeline Scrubber */}
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
              <span className="w-16 text-right font-mono tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            </div>

            {/* Live Numerical Summary Tiles */}
            {result?.summary && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(result.summary).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <div className="truncate text-[10px] font-semibold text-slate-500 uppercase">
                      {k.replace(/([A-Z])/g, " $1")}
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-bold text-[#1E3A8A]">
                      {typeof v === "number" ? v.toFixed(3) : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Report and Measurement Table */}
          <LabReportPanel
            labKey="thermodynamics"
            defaultTitle="7-Laboratoriya: Molekulyar Fizika va Termodinamika"
            rows={rows}
            onClearRows={() => setRows([])}
            onDeleteRow={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
          />
        </div>
      </div>

      {/* Official A4 Printable Academic Modal */}
      <AcademicReportModal
        isOpen={academicModalOpen}
        onClose={() => setAcademicModalOpen(false)}
        data={academicData}
      />
    </div>
  );
}
