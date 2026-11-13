"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { MathFormula } from "@/components/MathFormula";
import { ParamInput } from "@/components/ParamInput";
import { ScientificChart } from "@/components/ScientificChart";
import { ScenarioCatalogSelector } from "@/components/labs/ScenarioCatalogSelector";
import type { ScenarioDefinition } from "@/lib/physics/catalog";
import type { OpticsResult, OpticsSubMode } from "@/lib/physics/optics";

function wavelengthToColor(nm: number): string {
  if (nm < 440) return "#6D28D9";
  if (nm < 490) return "#1D4ED8";
  if (nm < 520) return "#047857";
  if (nm < 570) return "#15803D";
  if (nm < 600) return "#B45309";
  if (nm < 630) return "#C2410C";
  return "#B91C1C";
}

export function OpticsLab() {
  const [activeScenarioId, setActiveScenarioId] = useState("opt-01");
  const [subMode, setSubMode] = useState<OpticsSubMode>("optical_bench");

  // Optical bench
  const [elementType, setElementType] = useState<
    "converging_lens" | "diverging_lens" | "concave_mirror" | "convex_mirror"
  >("converging_lens");
  const [focalLengthCm, setFocalLengthCm] = useState(15);
  const [objectDistanceCm, setObjectDistanceCm] = useState(32);
  const [objectHeightCm, setObjectHeightCm] = useState(6);
  const [causticIncidenceDeg, setCausticIncidenceDeg] = useState(20);

  // Prism & slab
  const [prismApexDeg, setPrismApexDeg] = useState(60);
  const [incidenceDeg, setIncidenceDeg] = useState(48);
  const [cauchyA, setCauchyA] = useState(1.5046);
  const [cauchyB, setCauchyB] = useState(0.0042);
  const [slabThicknessCm, setSlabThicknessCm] = useState(4.0);

  // Microscope / Telescope
  const [instrument, setInstrument] = useState<"telescope" | "microscope">("telescope");
  const [fObjectiveCm, setFObjectiveCm] = useState(80);
  const [fEyepieceCm, setFEyepieceCm] = useState(4);
  const [tubeLengthCm, setTubeLengthCm] = useState(16);

  // Diffraction
  const [wavelengthNm, setWavelengthNm] = useState(532);
  const [slitSeparationUm, setSlitSeparationUm] = useState(20);
  const [slitWidthUm, setSlitWidthUm] = useState(4);
  const [numSlits, setNumSlits] = useState(4);
  const [screenDistanceM, setScreenDistanceM] = useState(1.5);

  const [result, setResult] = useState<OpticsResult | null>(null);
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
            labKey: "optics",
            saveRun,
            params: {
              subMode,
              elementType,
              focalLengthCm,
              objectDistanceCm,
              objectHeightCm,
              causticIncidenceDeg,
              prismApexDeg,
              incidenceDeg,
              cauchyA,
              cauchyB,
              slabThicknessCm,
              instrument,
              fObjectiveCm,
              fEyepieceCm,
              tubeLengthCm,
              wavelengthNm,
              slitSeparationUm,
              slitWidthUm: Math.min(slitWidthUm, slitSeparationUm),
              numSlits,
              screenDistanceM,
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
      elementType,
      focalLengthCm,
      objectDistanceCm,
      objectHeightCm,
      causticIncidenceDeg,
      prismApexDeg,
      incidenceDeg,
      cauchyA,
      cauchyB,
      slabThicknessCm,
      instrument,
      fObjectiveCm,
      fEyepieceCm,
      tubeLengthCm,
      wavelengthNm,
      slitSeparationUm,
      slitWidthUm,
      numSlits,
      screenDistanceM,
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void simulate(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [simulate]);

  function recordRow() {
    if (!result) return;
    if (subMode === "optical_bench") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `${elementType} (f=${focalLengthCm}sm, d_o=${objectDistanceCm}sm)`,
          primaryValue: Number(result.summary.imageDistanceCm) || 0,
          unit: "sm",
          details: {
            M: result.summary.magnification,
            D_dptr: result.summary.diopterD,
            tasvir: result.summary.imageNature,
            holat: result.summary.imageOrientation,
          },
        },
      ]);
    } else if (subMode === "prism_slab") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `Prizma (A=${prismApexDeg}°, i₁=${incidenceDeg}°)`,
          primaryValue: Number(result.summary.minDeviationSodiumDeg ?? 0),
          unit: "°",
          details: {
            n_589: result.summary.nSodium589,
            delta_589: result.summary.deviationSodiumDeg,
            disp: result.summary.angularDispersionDeg,
          },
        },
      ]);
    } else if (subMode === "microscope_telescope") {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `${instrument === "telescope" ? "Teleskop" : "Mikroskop"} (f_o=${fObjectiveCm}, f_e=${fEyepieceCm})`,
          primaryValue: Number(
            instrument === "telescope"
              ? result.summary.angularMagnification
              : result.summary.totalMagnification
          ),
          unit: "×",
          details: {
            L_sm: result.summary.tubeLengthCm,
          },
        },
      ]);
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: `Difraksiya (λ=${wavelengthNm}nm, N=${numSlits}, d=${slitSeparationUm}µm)`,
          primaryValue: Number(result.summary.fringeSpacingMm ?? 0),
          unit: "mm",
          details: {
            theta_1: result.summary.firstOrderAngleDeg,
            max_m: result.summary.maxVisibleOrder,
          },
        },
      ]);
    }
  }

  const spectralRays =
    (result?.details?.spectralRays as
      | {
          name: string;
          wavelengthNm: number;
          color: string;
          refractiveIndex: number;
          r1Deg: number;
          r2Deg: number;
          emergentDeg: number | null;
          deviationDeg: number | null;
          minDeviationDeg: number;
          totalInternalReflection: boolean;
          slabLateralShiftCm: number;
        }[]
      | undefined) ?? [];

  const diffProfile =
    (result?.details?.profile as
      | { angleDeg: number; screenMm: number; intensity: number }[]
      | undefined) ?? [];

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.subMode === "string") {
      setSubMode(p.subMode as OpticsSubMode);
    }
    if (typeof p.focalLengthCm === "number") setFocalLengthCm(p.focalLengthCm);
    if (typeof p.objectDistanceCm === "number") setObjectDistanceCm(p.objectDistanceCm);
    if (typeof p.wavelengthNm === "number") setWavelengthNm(p.wavelengthNm);
    if (typeof p.prismApexDeg === "number") setPrismApexDeg(p.prismApexDeg);
    if (typeof p.incidenceDeg === "number") setIncidenceDeg(p.incidenceDeg);
  }

  return (
    <div className="space-y-4">
      <ScenarioCatalogSelector
        chapter="optics"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "optical_bench", label: "#41/#31 Optik Skameyka (Linza & Ko‘zgu)" },
            { id: "prism_slab", label: "#47/#25 Prizma Dispersiyasi & Shisha Plastina" },
            { id: "microscope_telescope", label: "#69/#70 Mikroskop & Teleskop" },
            { id: "diffraction_interference", label: "Difraksiya Panjarasi & Yung Interferensiyasi" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id as OpticsSubMode)}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
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
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Bazaga yozish
          </button>
          <button
            type="button"
            onClick={recordRow}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#172554] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Qayd etish
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs lg:col-span-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Optik Parametrlar (Erkin kiritish)
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Slayder yoki katakchadan istalgan qiymatni kiriting
            </p>
          </div>

          {subMode === "optical_bench" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Optik element turi</label>
                <select
                  value={elementType}
                  onChange={(e) => setElementType(e.target.value as typeof elementType)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-800"
                >
                  <option value="converging_lens">Yig‘uvchi (qabariq) linza (f &gt; 0)</option>
                  <option value="diverging_lens">Sochuvchi (botiq) linza (f &lt; 0)</option>
                  <option value="concave_mirror">Botiq sferik ko‘zgu (f &gt; 0)</option>
                  <option value="convex_mirror">Qabariq sferik ko‘zgu (f &lt; 0)</option>
                </select>
              </div>
              <ParamInput
                label="Fokus masofasi"
                symbol="|f|"
                unit="sm"
                value={focalLengthCm}
                onChange={setFocalLengthCm}
                sliderMin={3}
                sliderMax={50}
                step={0.5}
                minValid={0.2}
              />
              <ParamInput
                label="Buyum masofasi"
                symbol="d_o"
                unit="sm"
                value={objectDistanceCm}
                onChange={setObjectDistanceCm}
                sliderMin={2}
                sliderMax={100}
                step={0.5}
                minValid={0.2}
              />
              <ParamInput
                label="Buyum balandligi"
                symbol="h_o"
                unit="sm"
                value={objectHeightCm}
                onChange={setObjectHeightCm}
                sliderMin={1}
                sliderMax={20}
                step={0.5}
                minValid={0.1}
              />
              {(elementType === "concave_mirror" || elementType === "convex_mirror") && (
                <ParamInput
                  label="Kaustik tushish burchagi"
                  symbol="θ"
                  unit="°"
                  value={causticIncidenceDeg}
                  onChange={setCausticIncidenceDeg}
                  sliderMin={0}
                  sliderMax={60}
                  step={1}
                  minValid={0}
                  maxValid={75}
                />
              )}
            </div>
          )}

          {subMode === "prism_slab" && (
            <div className="space-y-3 text-xs">
              <ParamInput
                label="Prizma sindirish burchagi"
                symbol="A"
                unit="°"
                value={prismApexDeg}
                onChange={setPrismApexDeg}
                sliderMin={15}
                sliderMax={80}
                step={1}
                minValid={15}
                maxValid={80}
              />
              <ParamInput
                label="Tushish burchagi"
                symbol="i₁"
                unit="°"
                value={incidenceDeg}
                onChange={setIncidenceDeg}
                sliderMin={1}
                sliderMax={85}
                step={0.5}
                minValid={1}
                maxValid={85}
              />
              <ParamInput
                label="Koshi koeffitsiyenti A (BK7=1.5046)"
                symbol="A"
                unit=""
                value={cauchyA}
                onChange={setCauchyA}
                sliderMin={1.2}
                sliderMax={2.2}
                step={0.005}
                minValid={1.05}
              />
              <ParamInput
                label="Koshi koeffitsiyenti B"
                symbol="B"
                unit="µm²"
                value={cauchyB}
                onChange={setCauchyB}
                sliderMin={0.001}
                sliderMax={0.05}
                step={0.0005}
                minValid={0}
              />
              <ParamInput
                label="Shisha plastina qalinligi"
                symbol="d"
                unit="sm"
                value={slabThicknessCm}
                onChange={setSlabThicknessCm}
                sliderMin={0.5}
                sliderMax={15}
                step={0.25}
                minValid={0.1}
              />
            </div>
          )}

          {subMode === "microscope_telescope" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setInstrument("telescope");
                    setFObjectiveCm(80);
                    setFEyepieceCm(4);
                  }}
                  className={`rounded-md border py-1.5 font-semibold cursor-pointer ${
                    instrument === "telescope"
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  #69 Teleskop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInstrument("microscope");
                    setFObjectiveCm(1.6);
                    setFEyepieceCm(4);
                  }}
                  className={`rounded-md border py-1.5 font-semibold cursor-pointer ${
                    instrument === "microscope"
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  #70 Mikroskop
                </button>
              </div>
              <ParamInput
                label="Obyektiv fokusi"
                symbol="f_o"
                unit="sm"
                value={fObjectiveCm}
                onChange={setFObjectiveCm}
                sliderMin={instrument === "microscope" ? 0.3 : 10}
                sliderMax={instrument === "microscope" ? 10 : 200}
                step={instrument === "microscope" ? 0.1 : 1}
                minValid={0.2}
              />
              <ParamInput
                label="Okulyar fokusi"
                symbol="f_e"
                unit="sm"
                value={fEyepieceCm}
                onChange={setFEyepieceCm}
                sliderMin={0.5}
                sliderMax={20}
                step={0.2}
                minValid={0.2}
              />
              {instrument === "microscope" && (
                <ParamInput
                  label="Tubus uzunligi"
                  symbol="L"
                  unit="sm"
                  value={tubeLengthCm}
                  onChange={setTubeLengthCm}
                  sliderMin={5}
                  sliderMax={40}
                  step={0.5}
                  minValid={2}
                />
              )}
            </div>
          )}

          {subMode === "diffraction_interference" && (
            <div className="space-y-3 text-xs">
              <ParamInput
                label="To‘lqin uzunligi"
                symbol="λ"
                unit="nm"
                value={wavelengthNm}
                onChange={setWavelengthNm}
                sliderMin={380}
                sliderMax={760}
                step={1}
                minValid={100}
                maxValid={2000}
              />
              <ParamInput
                label="Tirqishlar davri"
                symbol="d"
                unit="µm"
                value={slitSeparationUm}
                onChange={(v) => {
                  setSlitSeparationUm(v);
                  if (slitWidthUm > v) setSlitWidthUm(v);
                }}
                sliderMin={2}
                sliderMax={80}
                step={0.5}
                minValid={0.5}
              />
              <ParamInput
                label="Tirqish kengligi"
                symbol="a"
                unit="µm"
                value={slitWidthUm}
                onChange={setSlitWidthUm}
                sliderMin={0.5}
                sliderMax={Math.max(1, slitSeparationUm)}
                step={0.2}
                minValid={0.05}
                maxValid={slitSeparationUm}
              />
              <ParamInput
                label="Tirqishlar soni (2=Yung)"
                symbol="N"
                unit="ta"
                value={numSlits}
                onChange={setNumSlits}
                sliderMin={2}
                sliderMax={40}
                step={1}
                minValid={1}
                maxValid={500}
                integer
              />
              <ParamInput
                label="Ekrangacha masofa"
                symbol="D"
                unit="m"
                value={screenDistanceM}
                onChange={setScreenDistanceM}
                sliderMin={0.2}
                sliderMax={5}
                step={0.1}
                minValid={0.05}
              />
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Optika Tenglamalari
            </div>
            <MathFormula
              tex={
                subMode === "optical_bench"
                  ? "\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}, \\quad M = -\\frac{d_i}{d_o}"
                  : subMode === "prism_slab"
                  ? "n(\\lambda) = A + \\frac{B}{\\lambda^2}, \\quad n = \\frac{\\sin\\frac{A+\\delta_m}{2}}{\\sin\\frac{A}{2}}"
                  : subMode === "microscope_telescope"
                  ? instrument === "telescope"
                    ? "M = -\\frac{f_o}{f_e}, \\quad L = f_o + f_e"
                    : "M_{\\text{um}} = -\\frac{L}{f_o}\\cdot\\frac{25\\text{ sm}}{f_e}"
                  : "I(\\theta) = I_0 \\left(\\frac{\\sin\\beta}{\\beta}\\right)^2 \\left(\\frac{\\sin N\\gamma}{N\\sin\\gamma}\\right)^2"
              }
            />
          </div>
        </div>

        {/* Display & Analysis */}
        <div className="space-y-4 lg:col-span-8">
          {subMode === "optical_bench" && result && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-sm font-semibold text-slate-900">
                    Geometrik Nurlar Trassirovkasi (Optik Skameyka)
                  </span>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-slate-700">
                    {String(result.summary.imageNature ?? "—")} · {String(result.summary.imageOrientation ?? "—")}
                  </span>
                </div>
                <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2">
                  <svg viewBox="0 0 640 250" className="h-64 w-full">
                    <defs>
                      <marker id="optArrowDark" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#0F172A" />
                      </marker>
                      <marker id="optArrowBlue" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#1E3A8A" />
                      </marker>
                    </defs>
                    {(() => {
                      const cx = 320;
                      const cy = 125;
                      const isMirror = Boolean((result.details as { isMirror?: boolean }).isMirror);
                      const f = Number((result.details as { f?: number }).f ?? 15);
                      const doCm = Number((result.details as { doCm?: number }).doCm ?? 30);
                      const diCm = Number((result.details as { diCm?: number }).diCm ?? 30);
                      const hoCm = Number((result.details as { hoCm?: number }).hoCm ?? 6);
                      const hiCm = Number((result.details as { hiCm?: number }).hiCm ?? -6);
                      const atFocal = Boolean((result.details as { atFocal?: boolean }).atFocal);

                      const visibleSpan = Math.max(
                        35,
                        doCm * 1.15,
                        Math.abs(f) * 2.2,
                        !atFocal && Math.abs(diCm) < 160 ? Math.abs(diCm) * 1.15 : 0
                      );
                      const pxPerCm = 270 / visibleSpan;

                      const objX = Math.max(28, cx - doCm * pxPerCm);
                      const maxHeight = Math.max(hoCm, !atFocal && Math.abs(hiCm) < 60 ? Math.abs(hiCm) : hoCm, 6);
                      const pxPerHeight = 78 / maxHeight;
                      const objTopY = cy - hoCm * pxPerHeight;

                      const rawImgX = isMirror ? cx - diCm * pxPerCm : cx + diCm * pxPerCm;
                      const clampedImgX = Math.max(24, Math.min(616, rawImgX));
                      const imgVisible = !atFocal && Math.abs(diCm) < 500;
                      const imgTopY = imgVisible
                        ? cy - Math.max(-105, Math.min(105, hiCm * pxPerHeight)) / (hiCm * pxPerHeight ? 1 : 1)
                        : cy;
                      // Smoothly cap ray slope if hiCm is huge
                      const safeImgTopY = Math.max(18, Math.min(232, imgTopY));

                      const fLeftX = cx - Math.abs(f) * pxPerCm;
                      const fRightX = cx + Math.abs(f) * pxPerCm;

                      // Curvature intensity responds visibly to 1/|f|!
                      const curveBulge = Math.max(6, Math.min(26, 260 / Math.max(5, Math.abs(f))));
                      const lensTop = 26;
                      const lensBot = 224;

                      return (
                        <>
                          {/* Optical axis */}
                          <line x1={16} y1={cy} x2={624} y2={cy} stroke="#64748B" strokeDasharray="5 3" strokeWidth="1.2" />

                          {/* Lens / Mirror Element with TRUE dynamic shape */}
                          {elementType === "converging_lens" && (
                            <g>
                              <path
                                d={`M ${cx} ${lensTop} Q ${cx + curveBulge} ${cy} ${cx} ${lensBot} Q ${cx - curveBulge} ${cy} ${cx} ${lensTop} Z`}
                                fill="#DBEAFE"
                                fillOpacity="0.65"
                                stroke="#1E3A8A"
                                strokeWidth="2.2"
                              />
                              <line x1={cx} y1={lensTop} x2={cx} y2={lensBot} stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 2" />
                              {/* Converging arrows at tips */}
                              <path d={`M ${cx - 5} ${lensTop + 7} L ${cx} ${lensTop} L ${cx + 5} ${lensTop + 7}`} fill="none" stroke="#1E3A8A" strokeWidth="2" />
                              <path d={`M ${cx - 5} ${lensBot - 7} L ${cx} ${lensBot} L ${cx + 5} ${lensBot - 7}`} fill="none" stroke="#1E3A8A" strokeWidth="2" />
                            </g>
                          )}

                          {elementType === "diverging_lens" && (() => {
                            const rimHalf = Math.max(12, curveBulge * 0.95);
                            const waistHalf = 3.5;
                            return (
                              <g>
                                <path
                                  d={`M ${cx - rimHalf} ${lensTop} L ${cx + rimHalf} ${lensTop} Q ${cx + waistHalf} ${cy} ${cx + rimHalf} ${lensBot} L ${cx - rimHalf} ${lensBot} Q ${cx - waistHalf} ${cy} ${cx - rimHalf} ${lensTop} Z`}
                                  fill="#DBEAFE"
                                  fillOpacity="0.65"
                                  stroke="#1E3A8A"
                                  strokeWidth="2.2"
                                />
                                <line x1={cx} y1={lensTop} x2={cx} y2={lensBot} stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 2" />
                                {/* Diverging inward arrows */}
                                <path d={`M ${cx - 6} ${lensTop - 6} L ${cx} ${lensTop} L ${cx + 6} ${lensTop - 6}`} fill="none" stroke="#1E3A8A" strokeWidth="2" />
                                <path d={`M ${cx - 6} ${lensBot + 6} L ${cx} ${lensBot} L ${cx + 6} ${lensBot + 6}`} fill="none" stroke="#1E3A8A" strokeWidth="2" />
                              </g>
                            );
                          })()}

                          {elementType === "concave_mirror" && (
                            <g>
                              <path
                                d={`M ${cx - curveBulge * 0.75} ${lensTop} Q ${cx + curveBulge * 1.15} ${cy} ${cx - curveBulge * 0.75} ${lensBot}`}
                                fill="none"
                                stroke="#1E3A8A"
                                strokeWidth="4"
                              />
                              {[40, 65, 90, 115, 140, 165, 190].map((yy) => {
                                const t = (yy - lensTop) / (lensBot - lensTop);
                                const mx =
                                  (1 - t) * (1 - t) * (cx - curveBulge * 0.75) +
                                  2 * (1 - t) * t * (cx + curveBulge * 1.15) +
                                  t * t * (cx - curveBulge * 0.75);
                                return <line key={yy} x1={mx + 2} y1={yy} x2={mx + 10} y2={yy - 7} stroke="#64748B" strokeWidth="1.3" />;
                              })}
                            </g>
                          )}

                          {elementType === "convex_mirror" && (
                            <g>
                              <path
                                d={`M ${cx + curveBulge * 0.75} ${lensTop} Q ${cx - curveBulge * 1.15} ${cy} ${cx + curveBulge * 0.75} ${lensBot}`}
                                fill="none"
                                stroke="#1E3A8A"
                                strokeWidth="4"
                              />
                              {[40, 65, 90, 115, 140, 165, 190].map((yy) => {
                                const t = (yy - lensTop) / (lensBot - lensTop);
                                const mx =
                                  (1 - t) * (1 - t) * (cx + curveBulge * 0.75) +
                                  2 * (1 - t) * t * (cx - curveBulge * 1.15) +
                                  t * t * (cx + curveBulge * 0.75);
                                return <line key={yy} x1={mx + 2} y1={yy} x2={mx + 10} y2={yy - 7} stroke="#64748B" strokeWidth="1.3" />;
                              })}
                            </g>
                          )}

                          {/* Focal points */}
                          <circle cx={elementType === "convex_mirror" ? fRightX : fLeftX} cy={cy} r={3.5} fill="#B91C1C" />
                          <text x={elementType === "convex_mirror" ? fRightX : fLeftX} y={cy + 15} textAnchor="middle" fontSize="10" fill="#B91C1C" fontWeight="700">
                            F ({Math.abs(f)} sm)
                          </text>
                          {!isMirror && (
                            <>
                              <circle cx={fRightX} cy={cy} r={3.5} fill="#B91C1C" />
                              <text x={fRightX} y={cy + 15} textAnchor="middle" fontSize="10" fill="#B91C1C" fontWeight="700">
                                F&apos;
                              </text>
                            </>
                          )}

                          {/* Object arrow */}
                          <line
                            x1={objX}
                            y1={cy}
                            x2={objX}
                            y2={objTopY}
                            stroke="#0F172A"
                            strokeWidth="3"
                            markerEnd="url(#optArrowDark)"
                          />
                          <text x={objX} y={cy + 15} textAnchor="middle" fontSize="10" fill="#0F172A" fontWeight="600">
                            Buyum (d_o={doCm})
                          </text>

                          {/* Principal Rays */}
                          {imgVisible && (
                            <>
                              {/* Ray 1: parallel to axis -> focal */}
                              <line x1={objX} y1={objTopY} x2={cx} y2={objTopY} stroke="#B91C1C" strokeWidth="1.7" />
                              {!isMirror && diCm > 0 ? (
                                <line x1={cx} y1={objTopY} x2={clampedImgX} y2={safeImgTopY} stroke="#B91C1C" strokeWidth="1.7" />
                              ) : !isMirror && diCm < 0 ? (
                                <>
                                  <line
                                    x1={cx}
                                    y1={objTopY}
                                    x2={610}
                                    y2={elementType === "diverging_lens" ? objTopY + ((objTopY - cy) * (610 - cx)) / (cx - fLeftX) : objTopY + ((cy - objTopY) * (610 - cx)) / (fRightX - cx)}
                                    stroke="#B91C1C"
                                    strokeWidth="1.7"
                                  />
                                  <line x1={cx} y1={objTopY} x2={clampedImgX} y2={safeImgTopY} stroke="#B91C1C" strokeWidth="1.4" strokeDasharray="4 3" />
                                </>
                              ) : (
                                <>
                                  <line x1={cx} y1={objTopY} x2={Math.max(24, cx - 260)} y2={elementType === "concave_mirror" ? objTopY + ((cy - objTopY) * 260) / (cx - fLeftX) : objTopY - ((objTopY - cy) * 260) / (fRightX - cx)} stroke="#B91C1C" strokeWidth="1.7" />
                                  {diCm < 0 && <line x1={cx} y1={objTopY} x2={clampedImgX} y2={safeImgTopY} stroke="#B91C1C" strokeWidth="1.4" strokeDasharray="4 3" />}
                                </>
                              )}

                              {/* Ray 2: through optical center (lenses) or vertex (mirrors) */}
                              <line
                                x1={objX}
                                y1={objTopY}
                                x2={isMirror ? cx : clampedImgX}
                                y2={isMirror ? cy : safeImgTopY}
                                stroke="#15803D"
                                strokeWidth="1.6"
                              />
                              {!isMirror && diCm < 0 && (
                                <line x1={objX} y1={objTopY} x2={clampedImgX} y2={safeImgTopY} stroke="#15803D" strokeWidth="1.3" strokeDasharray="4 3" />
                              )}
                            </>
                          )}

                          {/* Image arrow */}
                          {imgVisible && rawImgX > 18 && rawImgX < 622 && (
                            <>
                              <line
                                x1={clampedImgX}
                                y1={cy}
                                x2={clampedImgX}
                                y2={safeImgTopY}
                                stroke="#1E3A8A"
                                strokeWidth="3"
                                strokeDasharray={diCm < 0 ? "4 2" : undefined}
                                markerEnd="url(#optArrowBlue)"
                              />
                              <text x={clampedImgX} y={safeImgTopY > cy ? cy - 8 : cy + 15} textAnchor="middle" fontSize="10" fill="#1E3A8A" fontWeight="700">
                                Tasvir (d_i={String(result.summary.imageDistanceCm)})
                              </text>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Tasvir masofasi</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    d_i = {String(result.summary.imageDistanceCm)}{typeof result.summary.imageDistanceCm === "number" ? " sm" : ""}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Chiziqli kattalashtirish</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    M = {String(result.summary.magnification)}×
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Optik kuch</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    D = {String(result.summary.diopterD)} dptr
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">
                    {result.summary.causticDistanceCm !== undefined ? "Kaustik masofa" : "Tasvir balandligi"}
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {result.summary.causticDistanceCm !== undefined
                      ? `ρ = ${String(result.summary.causticDistanceCm)} sm`
                      : `h_i = ${String(result.summary.imageHeightCm)}${typeof result.summary.imageHeightCm === "number" ? " sm" : ""}`}
                  </div>
                </div>
              </div>
            </>
          )}

          {subMode === "prism_slab" && result && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Natriy nuri (589 nm)</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    n = {String(result.summary.nSodium589)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Og‘ish burchagi</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    δ = {String(result.summary.deviationSodiumDeg)}°
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Minimal og‘ish burchagi</div>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    δ_min = {String(result.summary.minDeviationSodiumDeg)}°
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Plastina siljishi / Kritik</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    Δx = {String(result.summary.slabLateralShiftCm)} sm | θ_kr = {String(result.summary.criticalAngleSodiumDeg)}°
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Prizmada Oq Yorug‘likning Spektral Dispersiyasi (A={prismApexDeg}°, i₁={incidenceDeg}°)
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    Δδ = {String(result.summary.angularDispersionDeg)}°
                  </span>
                </div>
                <div className="lab-grid mb-4 rounded-md border border-slate-200 p-2">
                  <svg viewBox="0 0 600 190" className="h-44 w-full">
                    {(() => {
                      const apexRad = (prismApexDeg * Math.PI) / 180;
                      const halfW = Math.min(95, 110 * Math.tan(apexRad / 2));
                      const pTop = [260, 26];
                      const pLeft = [260 - halfW, 168];
                      const pRight = [260 + halfW, 168];
                      const entryX = 260 - halfW * 0.45;
                      const entryY = 26 + (168 - 26) * 0.45;
                      const exitX = 260 + halfW * 0.48;
                      const exitY = 26 + (168 - 26) * 0.48;
                      const incRad = (incidenceDeg * Math.PI) / 180;
                      const srcX = entryX - 135 * Math.cos(incRad * 0.45);
                      const srcY = entryY + 135 * Math.sin(incRad * 0.45) * 0.6;
                      return (
                        <>
                          <polygon
                            points={`${pTop[0]},${pTop[1]} ${pLeft[0]},${pLeft[1]} ${pRight[0]},${pRight[1]}`}
                            fill="#EFF6FF"
                            fillOpacity="0.85"
                            stroke="#1E3A8A"
                            strokeWidth="2.5"
                          />
                          <line x1={srcX} y1={srcY} x2={entryX} y2={entryY} stroke="#0F172A" strokeWidth="3" />
                          <text x={srcX} y={srcY - 8} fontSize="10" fill="#0F172A" fontWeight="600">
                            Oq nur (i₁={incidenceDeg}°)
                          </text>
                          <line x1={550} y1={24} x2={550} y2={176} stroke="#334155" strokeWidth="4" />
                          {spectralRays.map((ray, idx) => {
                            const dev = ray.totalInternalReflection ? 80 : Number(ray.deviationDeg ?? 38);
                            const yEnd = Math.min(172, Math.max(28, exitY + (dev - 30) * 1.45 + idx * 4));
                            return (
                              <g key={ray.wavelengthNm}>
                                <line x1={entryX} y1={entryY} x2={exitX} y2={exitY + idx * 1.5} stroke={ray.color} strokeWidth="1.2" opacity="0.7" />
                                <line
                                  x1={exitX}
                                  y1={exitY + idx * 1.5}
                                  x2={ray.totalInternalReflection ? 260 : 548}
                                  y2={ray.totalInternalReflection ? 166 : yEnd}
                                  stroke={ray.color}
                                  strokeWidth="2.2"
                                />
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="mb-2 text-xs font-semibold text-slate-900">
                  Spektral Dispersiya Jadvali (Koshi tenglamasi asosida)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-2 py-1.5">Spektr chizig‘i</th>
                        <th className="px-2 py-1.5">n(λ)</th>
                        <th className="px-2 py-1.5">r₁ (°)</th>
                        <th className="px-2 py-1.5">r₂ (°)</th>
                        <th className="px-2 py-1.5">Chiqish i₂ (°)</th>
                        <th className="px-2 py-1.5">Og‘ish δ (°)</th>
                        <th className="px-2 py-1.5">Plastina Δx (sm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spectralRays.map((ray) => (
                        <tr key={ray.wavelengthNm} className="border-b border-slate-100">
                          <td className="px-2 py-1.5 font-medium">
                            <span
                              className="mr-1.5 inline-block h-2.5 w-2.5"
                              style={{ backgroundColor: ray.color }}
                            />
                            {ray.name}
                          </td>
                          <td className="px-2 py-1.5 font-mono">{ray.refractiveIndex}</td>
                          <td className="px-2 py-1.5 font-mono">{ray.r1Deg}</td>
                          <td className="px-2 py-1.5 font-mono">{ray.r2Deg}</td>
                          <td className="px-2 py-1.5 font-mono">
                            {ray.totalInternalReflection ? "TIR (Ichki qaytish)" : ray.emergentDeg}
                          </td>
                          <td className="px-2 py-1.5 font-mono font-semibold">
                            {ray.totalInternalReflection ? "—" : ray.deviationDeg}
                          </td>
                          <td className="px-2 py-1.5 font-mono">{ray.slabLateralShiftCm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {subMode === "microscope_telescope" && result && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 text-sm font-semibold text-slate-900">
                  {instrument === "telescope" ? "Refraktor Teleskop Optik Sxemasi" : "Murakkab Mikroskop Optik Sxemasi"}
                </div>
                <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2">
                  <svg viewBox="0 0 600 180" className="h-44 w-full">
                    <line x1={20} y1={90} x2={580} y2={90} stroke="#94A3B8" strokeDasharray="4 3" />
                    {/* Objective lens */}
                    <path d="M 180 25 Q 196 90 180 155 Q 164 90 180 25 Z" fill="#DBEAFE" fillOpacity="0.65" stroke="#1E3A8A" strokeWidth="2" />
                    <text x={180} y={172} textAnchor="middle" fontSize="10" fill="#1E3A8A" fontWeight="700">
                      Obyektiv (f_o={fObjectiveCm} sm)
                    </text>
                    {/* Eyepiece lens */}
                    <path d="M 430 45 Q 442 90 430 135 Q 418 90 430 45 Z" fill="#DBEAFE" fillOpacity="0.65" stroke="#15803D" strokeWidth="2" />
                    <text x={430} y={172} textAnchor="middle" fontSize="10" fill="#15803D" fontWeight="700">
                      Okulyar (f_e={fEyepieceCm} sm)
                    </text>
                    {/* Ray trace */}
                    <line x1={30} y1={52} x2={180} y2={52} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={180} y1={52} x2={345} y2={90} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={345} y1={90} x2={430} y2={112} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={430} y1={112} x2={570} y2={116} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={30} y1={128} x2={180} y2={128} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={180} y1={128} x2={345} y2={90} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={345} y1={90} x2={430} y2={68} stroke="#B91C1C" strokeWidth="1.8" />
                    <line x1={430} y1={68} x2={570} y2={64} stroke="#B91C1C" strokeWidth="1.8" />
                    {/* Tube brace */}
                    <line x1={180} y1={18} x2={430} y2={18} stroke="#334155" strokeWidth="1.5" />
                    <text x={305} y={14} textAnchor="middle" fontSize="10" fill="#334155" fontFamily="monospace" fontWeight="700">
                      L = {String(result.summary.tubeLengthCm)} sm
                    </text>
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Qurilma turi</div>
                  <div className="text-sm font-bold text-slate-900">
                    {instrument === "telescope" ? "Refraktor Teleskop" : "Murakkab Mikroskop"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Fokus masofalari</div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    f_o = {String(result.summary.fObjectiveCm)} sm · f_e = {String(result.summary.fEyepieceCm)} sm
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Optik truba uzunligi</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    L = {String(result.summary.tubeLengthCm)} sm
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Umumiy kattalashtirish</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    M ={" "}
                    {String(
                      instrument === "telescope"
                        ? result.summary.angularMagnification
                        : result.summary.totalMagnification
                    )}
                    ×
                  </div>
                </div>
              </div>
            </>
          )}

          {subMode === "diffraction_interference" && result && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    Interferensiya va Difraksiya Manzarasi (λ = {wavelengthNm} nm, N = {numSlits})
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    Δy = {String(result.summary.fringeSpacingMm)} mm
                  </span>
                </div>
                <div className="overflow-hidden rounded-md border border-slate-300 bg-slate-950 p-3">
                  <svg viewBox="0 0 600 64" className="h-16 w-full">
                    {diffProfile.map((pt, idx) => {
                      const x = ((idx + 0.5) / Math.max(1, diffProfile.length)) * 600;
                      const w = 600 / Math.max(1, diffProfile.length) + 1;
                      return (
                        <rect
                          key={idx}
                          x={x}
                          y={4}
                          width={w}
                          height={56}
                          fill={wavelengthToColor(wavelengthNm)}
                          fillOpacity={Math.min(1, Math.max(0.03, Math.pow(pt.intensity, 0.55)))}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Interferensiya yo‘l kengligi</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A]">
                    Δy = {String(result.summary.fringeSpacingMm)} mm
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">1-tartib burchagi</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    θ₁ = {String(result.summary.firstOrderAngleDeg)}°
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Maksimal tartib</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    m_max = {String(result.summary.maxVisibleOrder)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Ajrata olish qobiliyati (m=1)</div>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    R = {String(result.summary.resolvingPowerM1)}
                  </div>
                </div>
              </div>
              <ScientificChart
                title="Ekrandagi Nisbiy Intensivlik Taqsimoti I(θ)/I₀"
                xLabel="Burchak θ (°)"
                yLabel="Intensivlik I/I₀"
                series={[
                  {
                    label: "I(θ)/I₀",
                    color: wavelengthToColor(wavelengthNm),
                    points: diffProfile.map((p) => ({ x: p.angleDeg, y: p.intensity })),
                  },
                ]}
              />
            </>
          )}

          <LabFormulaStrip section="Optika" />
          <LabReportPanel
            labKey="optics"
            defaultTitle="6-laboratoriya: Geometrik va to‘lqin optikasi"
            rows={rows}
            onClearRows={() => setRows([])}
            onDeleteRow={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
          />
        </div>
      </div>
    </div>
  );
}
