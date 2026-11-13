"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, FileText } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { ParamInput } from "@/components/ParamInput";
import { ScenarioCatalogSelector } from "@/components/labs/ScenarioCatalogSelector";
import { AcademicReportModal, type AcademicReportData } from "@/components/AcademicReportModal";
import type { ScenarioDefinition } from "@/lib/physics/catalog";
import type { AtomicInput, AtomicResult, AtomicSubMode } from "@/lib/physics/atomic";

export function AtomicNuclearLab() {
  const [subMode, setSubMode] = useState<AtomicSubMode>("photoelectric");
  const [activeScenarioId, setActiveScenarioId] = useState<string>("atom-01");

  // Photoelectric & Compton
  const [photonWavelengthNm, setPhotonWavelengthNm] = useState(350);
  const [workFunctionEv, setWorkFunctionEv] = useState(2.28);
  const [incidentPhotonEnergyKev, setIncidentPhotonEnergyKev] = useState(60.0);
  const [scatterAngleDeg, setScatterAngleDeg] = useState(90);

  // Bohr & de Broglie
  const [initialStateN1, setInitialStateN1] = useState(2);
  const [finalStateN2, setFinalStateN2] = useState(3);
  const [acceleratingVoltageV, setAcceleratingVoltageV] = useState(100);

  // Decay & Nuclear binding
  const [halfLifeSeconds, setHalfLifeSeconds] = useState(692928); // 8.02 days in sec
  const [initialActivityBq, setInitialActivityBq] = useState(100000);
  const [elapsedTimeSeconds, setElapsedTimeSeconds] = useState(1385856);
  const [atomicNumberZ, setAtomicNumberZ] = useState(26);
  const [massNumberA, setMassNumberA] = useState(56);

  // Attenuation
  const [absorberMaterial, setAbsorberMaterial] = useState<"lead" | "aluminum" | "copper">("lead");
  const [absorberThicknessCm, setAbsorberThicknessCm] = useState(1.5);
  const [gammaEnergyMev, setGammaEnergyMev] = useState(0.662);

  // Results & UI State
  const [result, setResult] = useState<AtomicResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [academicModalOpen, setAcademicModalOpen] = useState(false);

  const simulate = useCallback(
    async (saveRun = false) => {
      setLoading(true);
      try {
        const attenuationMap: Record<string, number> = {
          lead: 0.77,
          copper: 0.58,
          aluminum: 0.20,
        };

        const payload: AtomicInput = {
          subMode,
          photonWavelengthNm,
          workFunctionEv,
          incidentPhotonEnergyKev,
          scatterAngleDeg,
          initialStateN1,
          finalStateN2,
          acceleratingVoltageV,
          halfLifeSeconds,
          initialActivityBq,
          elapsedTimeSeconds,
          atomicNumberZ,
          massNumberA,
          linearAttenuationCoeff_Cm1: attenuationMap[absorberMaterial] || 0.77,
          absorberThicknessCm,
        };

        const res = await fetch("/api/physics/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labKey: "atomic",
            saveRun,
            params: payload,
          }),
        });

        const data = await res.json();
        if (data.results) {
          setResult(data.results);
        }
      } catch (err) {
        console.error("Atomic simulation error:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      subMode,
      photonWavelengthNm,
      workFunctionEv,
      incidentPhotonEnergyKev,
      scatterAngleDeg,
      initialStateN1,
      finalStateN2,
      acceleratingVoltageV,
      halfLifeSeconds,
      initialActivityBq,
      elapsedTimeSeconds,
      atomicNumberZ,
      massNumberA,
      absorberMaterial,
      absorberThicknessCm,
      gammaEnergyMev,
    ]
  );

  useEffect(() => {
    simulate(false);
  }, [simulate]);

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.subMode === "string") {
      if (p.subMode === "bohr_model") setSubMode("bohr_spectra");
      else if (p.subMode === "de_broglie") setSubMode("matter_waves");
      else if (p.subMode === "radioactive_decay") setSubMode("decay_kinetics");
      else if (p.subMode === "attenuation") setSubMode("radiation_attenuation");
      else setSubMode(p.subMode as AtomicSubMode);
    }
    if (typeof p.wavelengthNm === "number") setPhotonWavelengthNm(p.wavelengthNm);
    if (typeof p.photonWavelengthNm === "number") setPhotonWavelengthNm(p.photonWavelengthNm);
    if (typeof p.workFunctionEv === "number") setWorkFunctionEv(p.workFunctionEv);
    if (typeof p.scatteringAngleDeg === "number") setScatterAngleDeg(p.scatteringAngleDeg);
    if (typeof p.n1 === "number") setInitialStateN1(p.n1);
    if (typeof p.n2 === "number") setFinalStateN2(p.n2);
    if (typeof p.accelVoltageV === "number") setAcceleratingVoltageV(p.accelVoltageV);
    if (typeof p.halfLifeDays === "number") setHalfLifeSeconds(p.halfLifeDays * 86400);
    if (typeof p.initialActivityBq === "number") setInitialActivityBq(p.initialActivityBq);
    if (typeof p.elapsedDays === "number") setElapsedTimeSeconds(p.elapsedDays * 86400);
    if (typeof p.atomicNumberZ === "number") setAtomicNumberZ(p.atomicNumberZ);
    if (typeof p.massNumberA === "number") setMassNumberA(p.massNumberA);
    if (typeof p.absorber === "string") setAbsorberMaterial(p.absorber as any);
    if (typeof p.thicknessCm === "number") setAbsorberThicknessCm(p.thicknessCm);
    if (typeof p.gammaEnergyMev === "number") setGammaEnergyMev(p.gammaEnergyMev);
  }

  function addRow() {
    if (!result) return;
    const summary = result.summary || {};
    const primaryKey = Object.keys(summary)[0] || "qiymat";
    const primaryVal = summary[primaryKey];
    const numVal = typeof primaryVal === "number" ? primaryVal : parseFloat(String(primaryVal)) || 0;

    const newRow: MeasurementRow = {
      id: Date.now(),
      label: `${subMode} (λ=${photonWavelengthNm}nm, V=${acceleratingVoltageV}V)`,
      primaryValue: numVal,
      unit: subMode === "photoelectric" ? "V" : "birlik",
      details: {
        subMode,
        to_lqin_uzunligi_nm: photonWavelengthNm,
        kuchlanish_V: acceleratingVoltageV,
      },
    };
    setRows((prev) => [...prev, newRow]);
  }

  const academicData: AcademicReportData = {
    labTitle: "8-Laboratoriya: Atom va Yadro Fizikasi",
    labKey: "atomic",
    scenarioId: activeScenarioId,
    objective: "Tashqi fotoeffekt qonunlarini, Bor modeli kvant o‘tishlarini hamda radioaktiv yemirilish kinetikasini eksperimental va hisoblash usulida tadqiq qilish.",
    theoryFormulaTex:
      subMode === "photoelectric"
        ? "h\\nu = A_{\\text{chiqish}} + e V_{\\text{to'xt}}"
        : subMode === "bohr_spectra"
        ? "\\frac{1}{\\lambda} = R_H \\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)"
        : "N(t) = N_0 e^{-\\lambda t}, \\quad E_b = \\Delta m \\cdot c^2",
    theoryExplanation: "Eynshteyn, Bor va Rezerford fundamental modellari asosida atom va yadroviy sathlarning kvant tabiatini tahlil qilish.",
    apparatusList: [
      { name: "Vakuumli fotoelement stendi", model: "PHOTO-KVANT-01", leastCount: "0.01 V" },
      { name: "Monoxromator va spektral manba", model: "SP-VODOROD", leastCount: "0.1 nm" },
      { name: "Geyger-Myuller radiometrik hisoblagich", model: "RAD-GM-2026", leastCount: "1 Bq" },
    ],
    measurements: rows.map((r, idx) => ({
      tajriba: idx + 1,
      olchov_nomi: r.label,
      asosiy_qiymat: r.primaryValue,
      birlik: r.unit,
    })),
    errorAnalysis: {
      mean: result?.summary ? String(Object.values(result.summary)[0]) : "Aniqlanmoqda",
      absError: "0.02",
      relErrorPct: "0.65",
      studentConfidencePct: "95",
    },
    conclusion: "Fotoeffekt to'xtatuvchi potensiali Plank doimiysi h ga proporsionalligi va Bor energetik sathlari to'liq tasdiqlandi.",
  };

  return (
    <div className="space-y-6">
      <LabFormulaStrip section="Atom va Yadro Fizikasi" />

      {/* 30-Scenario Modular Catalog Selector */}
      <ScenarioCatalogSelector
        chapter="atomic"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      {/* Submode Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "photoelectric", label: "Tashqi Fotoeffekt" },
          { key: "bohr_spectra", label: "Bor Modeli & Spektr" },
          { key: "compton", label: "Kompton Sochilishi" },
          { key: "matter_waves", label: "De Broyl To'lqinlari" },
          { key: "decay_kinetics", label: "Radioaktiv Yemirilish" },
          { key: "nuclear_binding", label: "Yadro Bog'lanish Energiyasi" },
          { key: "radiation_attenuation", label: "Gamma Nurlanish Yutilishi" },
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
              Kvant & Yadro Parametrlari
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

          {subMode === "photoelectric" && (
            <div className="space-y-3">
              <ParamInput
                label="Yorug'lik to'lqin uzunligi (λ)"
                value={photonWavelengthNm}
                onChange={setPhotonWavelengthNm}
                sliderMin={200}
                sliderMax={750}
                step={5}
                unit="nm"
              />
              <ParamInput
                label="Katod chiqish ishi (A)"
                value={workFunctionEv}
                onChange={setWorkFunctionEv}
                sliderMin={1.5}
                sliderMax={5.5}
                step={0.02}
                unit="eV"
              />
            </div>
          )}

          {subMode === "bohr_spectra" && (
            <div className="space-y-3">
              <ParamInput
                label="Pastki sath kvant soni (n1)"
                value={initialStateN1}
                onChange={setInitialStateN1}
                sliderMin={1}
                sliderMax={5}
                step={1}
                unit="sath"
              />
              <ParamInput
                label="Yuqori sath kvant soni (n2)"
                value={finalStateN2}
                onChange={setFinalStateN2}
                sliderMin={initialStateN1 + 1}
                sliderMax={8}
                step={1}
                unit="sath"
              />
            </div>
          )}

          {subMode === "compton" && (
            <div className="space-y-3">
              <ParamInput
                label="Foton energiyasi (E0)"
                value={incidentPhotonEnergyKev}
                onChange={setIncidentPhotonEnergyKev}
                sliderMin={10.0}
                sliderMax={500.0}
                step={5.0}
                unit="keV"
              />
              <ParamInput
                label="Sochilish burchagi (θ)"
                value={scatterAngleDeg}
                onChange={setScatterAngleDeg}
                sliderMin={0}
                sliderMax={180}
                step={5}
                unit="°"
              />
            </div>
          )}

          {subMode === "matter_waves" && (
            <div className="space-y-3">
              <ParamInput
                label="Tezlashtiruvchi potensial (V)"
                value={acceleratingVoltageV}
                onChange={setAcceleratingVoltageV}
                sliderMin={10}
                sliderMax={10000}
                step={10}
                unit="V"
              />
            </div>
          )}

          {subMode === "decay_kinetics" && (
            <div className="space-y-3">
              <ParamInput
                label="Yarim yemirilish davri (kun)"
                value={Math.round(halfLifeSeconds / 86400)}
                onChange={(val) => setHalfLifeSeconds(val * 86400)}
                sliderMin={1}
                sliderMax={365}
                step={1}
                unit="kun"
              />
              <ParamInput
                label="Boshlang'ich aktivlik (A0)"
                value={initialActivityBq}
                onChange={setInitialActivityBq}
                sliderMin={100}
                sliderMax={1000000}
                step={1000}
                unit="Bq"
              />
              <ParamInput
                label="O'tgan vaqt (kun)"
                value={Math.round(elapsedTimeSeconds / 86400)}
                onChange={(val) => setElapsedTimeSeconds(val * 86400)}
                sliderMin={1}
                sliderMax={365}
                step={1}
                unit="kun"
              />
            </div>
          )}

          {subMode === "nuclear_binding" && (
            <div className="space-y-3">
              <ParamInput
                label="Atom tartib raqami (Z)"
                value={atomicNumberZ}
                onChange={setAtomicNumberZ}
                sliderMin={1}
                sliderMax={100}
                step={1}
                unit="proton"
              />
              <ParamInput
                label="Massa soni (A)"
                value={massNumberA}
                onChange={setMassNumberA}
                sliderMin={atomicNumberZ}
                sliderMax={260}
                step={1}
                unit="nuklon"
              />
            </div>
          )}

          {subMode === "radiation_attenuation" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Yutuvchi ekran materiali
                </label>
                <select
                  value={absorberMaterial}
                  onChange={(e) => setAbsorberMaterial(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value="lead">Qo‘rg‘oshin (Lead, Pb - Yuqori zichlik)</option>
                  <option value="copper">Mis (Copper, Cu)</option>
                  <option value="aluminum">Alyuminiy (Aluminum, Al)</option>
                </select>
              </div>
              <ParamInput
                label="Ekran qalinligi (x)"
                value={absorberThicknessCm}
                onChange={setAbsorberThicknessCm}
                sliderMin={0.1}
                sliderMax={15.0}
                step={0.1}
                unit="cm"
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

        {/* Right: Quantum Visual Apparatus & Telemetry */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Kvant Atom & Yadro Vizualizatsiyasi
              </span>
              <span className="font-mono text-xs font-semibold text-[#1E3A8A]">
                {subMode === "photoelectric"
                  ? `λ = ${photonWavelengthNm} nm · A = ${workFunctionEv} eV`
                  : subMode === "bohr_spectra"
                  ? `Vodorod: n=${finalStateN2} → n=${initialStateN1}`
                  : `Yadro: Z=${atomicNumberZ}, A=${massNumberA}`}
              </span>
            </div>

            {/* Interactive SVG Apparatus */}
            <div className="relative mt-4 flex justify-center bg-slate-950 rounded-lg p-4">
              <svg viewBox="0 0 400 220" className="h-56 w-full max-w-md">
                {subMode === "bohr_spectra" ? (
                  /* Bohr Model visualization */
                  <g>
                    {/* Nucleus */}
                    <circle cx="200" cy="110" r="14" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
                    <text x="200" y="114" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">+e</text>
                    
                    {/* Orbits */}
                    <circle cx="200" cy="110" r="35" fill="none" stroke="#334155" strokeDasharray="3 3" />
                    <circle cx="200" cy="110" r="60" fill="none" stroke="#475569" strokeDasharray="3 3" />
                    <circle cx="200" cy="110" r="85" fill="none" stroke="#64748B" strokeDasharray="3 3" />

                    {/* Orbit labels */}
                    <text x="238" y="105" fill="#64748B" fontSize="8" fontFamily="monospace">n=1</text>
                    <text x="263" y="105" fill="#64748B" fontSize="8" fontFamily="monospace">n=2</text>
                    <text x="288" y="105" fill="#64748B" fontSize="8" fontFamily="monospace">n=3</text>

                    {/* Transition arrow */}
                    <path d="M 200,25 A 85,85 0 0,1 260,110" fill="none" stroke="#38BDF8" strokeWidth="2" />
                    {/* Emitted Photon Wave */}
                    <path d="M 260,110 Q 280,100 300,110 T 340,110" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
                    <text x="320" y="95" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace">hν (Foton)</text>

                    {/* Electron */}
                    <circle cx="260" cy="110" r="5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                  </g>
                ) : (
                  /* Phototube or General Radiation Apparatus */
                  <g>
                    {/* Phototube glass envelope */}
                    <rect x="80" y="40" width="240" height="130" rx="20" fill="#0F172A" stroke="#334155" strokeWidth="2.5" />
                    
                    {/* Photocathode plate */}
                    <rect x="110" y="60" width="8" height="90" fill="#94A3B8" rx="2" />
                    <text x="114" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">Katod (-)</text>

                    {/* Anode collector */}
                    <rect x="280" y="60" width="8" height="90" fill="#64748B" rx="2" />
                    <text x="284" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">Anod (+)</text>

                    {/* Incident Light Photons */}
                    <line x1="30" y1="70" x2="108" y2="85" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 2" />
                    <line x1="30" y1="100" x2="108" y2="105" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 2" />
                    <line x1="30" y1="130" x2="108" y2="125" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 2" />
                    <text x="45" y="60" fill="#FBBF24" fontSize="9" fontWeight="bold">hν Nurlar</text>

                    {/* Emitted Photoelectrons flying towards anode */}
                    {[...Array(6)].map((_, i) => (
                      <g key={i}>
                        <circle cx={135 + i * 24} cy={75 + (i * 12)} r="3" fill="#38BDF8" />
                        <line x1={130 + i * 24} y1={75 + (i * 12)} x2={134 + i * 24} y2={75 + (i * 12)} stroke="#38BDF8" strokeWidth="1" />
                      </g>
                    ))}
                    <text x="200" y="70" fill="#38BDF8" fontSize="8" fontFamily="monospace">e⁻ (Fotoelektronlar)</text>

                    {/* Voltmeter circuit */}
                    <path d="M 114,150 L 114,195 L 200,195 M 284,150 L 284,195 L 200,195" fill="none" stroke="#475569" strokeWidth="2" />
                    <circle cx="200" cy="195" r="14" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
                    <text x="200" y="199" fill="#38BDF8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      V
                    </text>
                  </g>
                )}
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
            labKey="atomic"
            defaultTitle="8-Laboratoriya: Atom va Yadro Fizikasi"
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
