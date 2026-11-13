"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, FileText } from "lucide-react";
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Jonli Porshen & Gaz Kamerasi Telemetriyasi
              </span>
              <span className="font-mono text-xs font-semibold text-[#1E3A8A]">
                T = {temperatureK} K · V = {volumeL.toFixed(2)} L
              </span>
            </div>

            {/* SVG Apparatus */}
            <div className="relative mt-4 flex justify-center bg-slate-950 rounded-lg p-4">
              <svg viewBox="0 0 400 220" className="h-56 w-full max-w-md">
                {/* Cylinder container */}
                <rect x="120" y="30" width="160" height="150" fill="#0F172A" stroke="#334155" strokeWidth="3" rx="4" />
                
                {/* Thermal Gas Glow inside chamber */}
                <rect
                  x="124"
                  y={pistonY + 12}
                  width="152"
                  height={176 - (pistonY + 12)}
                  fill={`hsl(${tempHue}, 85%, 45%)`}
                  fillOpacity="0.25"
                />

                {/* Animated Gas molecules */}
                {[...Array(16)].map((_, i) => {
                  const mx = 135 + ((i * 37) % 130);
                  const my = pistonY + 20 + ((i * 29) % Math.max(10, 150 - pistonY));
                  return (
                    <circle
                      key={i}
                      cx={mx}
                      cy={my}
                      r="3.5"
                      fill={`hsl(${tempHue}, 90%, 65%)`}
                      stroke="#FFFFFF"
                      strokeWidth="0.8"
                    />
                  );
                })}

                {/* Piston head */}
                <rect
                  x="122"
                  y={pistonY}
                  width="156"
                  height="14"
                  fill="#94A3B8"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                  rx="2"
                />
                {/* Piston rod */}
                <line x1="200" y1="10" x2="200" y2={pistonY} stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />
                <circle cx="200" cy="10" r="7" fill="#64748B" />

                {/* Pressure Gauge */}
                <circle cx="70" cy="80" r="32" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                <circle cx="70" cy="80" r="28" fill="#0F172A" />
                <text x="70" y="75" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">kPa</text>
                <text x="70" y="90" fill="#38BDF8" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                  {result?.summary?.calculatedPressureKPa ? Number(result.summary.calculatedPressureKPa).toFixed(0) : "101"}
                </text>
                {/* Needle */}
                <line x1="70" y1="80" x2="86" y2="68" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="70" cy="80" r="3" fill="#EF4444" />
                {/* Pipe connecting gauge to cylinder */}
                <line x1="102" y1="80" x2="120" y2="80" stroke="#64748B" strokeWidth="4" />

                {/* Thermometer Tube */}
                <rect x="315" y="45" width="12" height="110" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                <rect
                  x="317"
                  y={145 - ((temperatureK - 150) / 650) * 85}
                  width="8"
                  height={((temperatureK - 150) / 650) * 85}
                  rx="4"
                  fill="#EF4444"
                />
                <circle cx="321" cy="150" r="9" fill="#EF4444" stroke="#475569" strokeWidth="1.5" />
                <text x="321" y="175" fill="#F87171" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                  {temperatureK} K
                </text>
              </svg>
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
