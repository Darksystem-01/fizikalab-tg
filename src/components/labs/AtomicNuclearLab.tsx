"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, FileText, Pause, Play, RotateCcw } from "lucide-react";
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
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [realisticView, setRealisticView] = useState(true);

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

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const cycleDurMs = 3000;
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
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Jonli Kvant Fotoeffekt va Yadro Tajriba Stendi
                </h3>
                <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
                  λ = <strong className="text-[#1E3A8A]">{photonWavelengthNm} nm</strong> · hν ={" "}
                  <strong className="text-[#1E3A8A]">{(1239.84 / (photonWavelengthNm || 1)).toFixed(2)} eV</strong> · A ={" "}
                  <strong>{workFunctionEv} eV</strong> · Ek ={" "}
                  <strong className="text-[#15803D]">
                    {Math.max(0, 1239.84 / (photonWavelengthNm || 1) - workFunctionEv).toFixed(2)} eV
                  </strong> ·{" "}
                  <span className={`font-sans font-semibold ${1239.84 / (photonWavelengthNm || 1) >= workFunctionEv ? "text-emerald-700" : "text-amber-700"}`}>
                    [{1239.84 / (photonWavelengthNm || 1) >= workFunctionEv ? "Fotoeffekt kuzatilmoqda" : "Fotoeffekt yo‘q (hν < A)"}]
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
                  {realisticView ? "🎨 Realistik Stend" : "📐 Akademik To‘r"}
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

            {/* Interactive SVG Apparatus */}
            <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2 bg-slate-50/50">
              <svg viewBox="0 0 440 230" className="h-60 w-full select-none">
                <defs>
                  {/* Vacuum Tube Glass Glow */}
                  <linearGradient id="glassTubeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0F172A" />
                    <stop offset="50%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>

                  {/* UV Light Beam Gradient */}
                  <linearGradient id="uvBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                </defs>

                {subMode === "bohr_spectra" ? (
                  /* Bohr Model visualization */
                  <g>
                    {/* Nucleus */}
                    <circle cx="220" cy="115" r="15" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
                    <text x="220" y="119" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle">+Ze</text>
                    
                    {/* Orbits */}
                    <circle cx="220" cy="115" r="38" fill="none" stroke="#CBD5E1" strokeDasharray="3 3" />
                    <circle cx="220" cy="115" r="66" fill="none" stroke="#94A3B8" strokeDasharray="3 3" />
                    <circle cx="220" cy="115" r="94" fill="none" stroke="#64748B" strokeDasharray="3 3" />

                    {/* Orbit labels */}
                    <text x="262" y="110" fill="#64748B" fontSize="8.5" fontFamily="monospace">n=1</text>
                    <text x="290" y="110" fill="#64748B" fontSize="8.5" fontFamily="monospace">n=2</text>
                    <text x="318" y="110" fill="#64748B" fontSize="8.5" fontFamily="monospace">n=3</text>

                    {/* Rotating Electron on Orbit 2 */}
                    {(() => {
                      const eAngle = progress * Math.PI * 2;
                      const ex = 220 + 66 * Math.cos(eAngle);
                      const ey = 115 + 66 * Math.sin(eAngle);
                      return (
                        <>
                          <circle cx={ex} cy={ey} r="5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
                          <circle cx={ex} cy={ey} r="8" fill="#38BDF8" fillOpacity="0.3" />
                        </>
                      );
                    })()}

                    {/* Emitted Photon Wave */}
                    <path
                      d="M 286,115 Q 310,105 330,115 T 370,115"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                    />
                    <text x="345" y="100" fill="#D97706" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      hν (Foton)
                    </text>
                  </g>
                ) : (
                  /* Phototube or General Radiation Apparatus */
                  <g>
                    {/* Phototube glass envelope */}
                    <rect x="90" y="35" width="260" height="135" rx="22" fill="url(#glassTubeGrad)" stroke="#334155" strokeWidth="2.5" />
                    
                    {/* Photocathode plate */}
                    <rect x="120" y="55" width="8" height="95" fill="#94A3B8" stroke="#E2E8F0" rx="2" />
                    <text x="124" y="165" fill="#94A3B8" fontSize="8.5" textAnchor="middle" fontWeight="bold">Katod (-)</text>

                    {/* Anode collector */}
                    <rect x="310" y="55" width="8" height="95" fill="#64748B" stroke="#94A3B8" rx="2" />
                    <text x="314" y="165" fill="#94A3B8" fontSize="8.5" textAnchor="middle" fontWeight="bold">Anod (+)</text>

                    {/* Incident Light Photons from Source */}
                    <line x1="25" y1="65" x2="118" y2="80" stroke="url(#uvBeamGrad)" strokeWidth="3" strokeDasharray="4 2" />
                    <line x1="25" y1="95" x2="118" y2="102" stroke="url(#uvBeamGrad)" strokeWidth="3" strokeDasharray="4 2" />
                    <line x1="25" y1="125" x2="118" y2="125" stroke="url(#uvBeamGrad)" strokeWidth="3" strokeDasharray="4 2" />
                    <text x="42" y="52" fill="#9333EA" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                      UV Chiroq (λ={photonWavelengthNm}nm)
                    </text>

                    {/* Emitted Photoelectrons flying towards anode */}
                    {1239.84 / (photonWavelengthNm || 1) >= workFunctionEv &&
                      [...Array(8)].map((_, i) => {
                        const flightFrac = (progress + i * 0.125) % 1;
                        const ex = 132 + flightFrac * 174;
                        const ey = 68 + ((i * 19) % 70);
                        return (
                          <g key={i}>
                            <circle cx={ex} cy={ey} r="3.2" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.8" />
                            <line x1={ex - 5} y1={ey} x2={ex} y2={ey} stroke="#38BDF8" strokeWidth="1.2" />
                          </g>
                        );
                      })}

                    {/* Voltmeter / Microammeter circuit */}
                    <path d="M 124,150 L 124,200 L 220,200 M 314,150 L 314,200 L 220,200" fill="none" stroke="#475569" strokeWidth="2" />
                    <circle cx="220" cy="200" r="16" fill="#1E293B" stroke="#64748B" strokeWidth="1.8" />
                    <text x="220" y="204" fill="#38BDF8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      µA
                    </text>
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
