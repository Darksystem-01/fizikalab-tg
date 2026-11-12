"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { LabFormulaStrip } from "@/components/LabFormulaStrip";
import { LabReportPanel, type MeasurementRow } from "@/components/LabReportPanel";
import { MathFormula } from "@/components/MathFormula";
import { ParamInput } from "@/components/ParamInput";
import type { MetrologyResult } from "@/lib/physics/metrology";

export function MetrologyLab() {
  const [mode, setMode] = useState<"vernier" | "micrometer" | "spherometer">("vernier");
  const [trueValueMm, setTrueValueMm] = useState(24.64);
  const [leastCountMm, setLeastCountMm] = useState(0.02);
  const [zeroErrorMm, setZeroErrorMm] = useState(0.04);
  const [legSpacingMm, setLegSpacingMm] = useState(40);
  const [sampleCount, setSampleCount] = useState(5);
  const [result, setResult] = useState<MetrologyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MeasurementRow[]>([]);

  const runSimulation = useCallback(async (saveRun = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/physics/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labKey: "metrology",
          saveRun,
          params: {
            mode,
            trueValueMm,
            leastCountMm: mode === "vernier" ? leastCountMm : 0.01,
            zeroErrorMm,
            legSpacingMm,
            sampleCount,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.result);
    } finally {
      setLoading(false);
    }
  }, [mode, trueValueMm, leastCountMm, zeroErrorMm, legSpacingMm, sampleCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSimulation(false);
    }, 40);
    return () => clearTimeout(timer);
  }, [runSimulation]);

  function recordRow() {
    if (!result) return;
    const primary =
      mode === "spherometer" && result.spherometerRadiusMm
        ? result.spherometerRadiusMm
        : result.correctedReadingMm;
    const unit = "mm";
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        label:
          mode === "vernier"
            ? "Verniy shtangensirkul o‘lchovi"
            : mode === "micrometer"
            ? "Mikrometr o‘lchovi"
            : "Sferometr (egrilik radiusi R)",
        primaryValue: primary,
        unit,
        details: {
          MSR_mm: result.mainScaleReadingMm,
          VSR_div: result.secondaryDivision,
          LC_mm: result.leastCountMm,
          ZeroErr_mm: result.zeroErrorMm,
          Corrected_mm: result.correctedReadingMm,
          ...(result.spherometerRadiusMm ? { R_mm: result.spherometerRadiusMm } : {}),
        },
      },
    ]);
  }

  const maxScaleMm = mode === "vernier" ? Math.max(50, Math.ceil(trueValueMm / 10) * 10) : 50;
  const pxPerMm = 360 / maxScaleMm;
  const shiftPx = Math.min(360, Math.max(0, trueValueMm * pxPerMm));
  const microShiftPx = Math.min(180, Math.max(0, trueValueMm * 6.5));

  return (
    <div className="space-y-4">
      {/* Mode selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "vernier", label: "#1 Verniy Shtangensirkul (0,02–0,1 mm)" },
            { id: "micrometer", label: "#2 Mikrometr (0,01 mm)" },
            { id: "spherometer", label: "#3 Sferometr (Linza egrilik radiusi)" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                const next = m.id as "vernier" | "micrometer" | "spherometer";
                setMode(next);
                if (next === "vernier") setTrueValueMm(24.64);
                if (next === "micrometer") setTrueValueMm(6.73);
                if (next === "spherometer") setTrueValueMm(2.15);
              }}
              className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                mode === m.id
                  ? "border-blue-900 bg-blue-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => runSimulation(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Serverda qayta hisoblash
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Controls */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs lg:col-span-4 space-y-3.5">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Qurilma Parametrlari (Erkin kiritish)
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Slayderdan foydalaning yoki o‘z qiymatingizni kiriting
            </p>
          </div>

          <ParamInput
            label={mode === "spherometer" ? "Sagitta balandligi" : "Jism o‘lchami"}
            symbol={mode === "spherometer" ? "h" : "L₀"}
            unit="mm"
            value={trueValueMm}
            onChange={setTrueValueMm}
            sliderMin={mode === "vernier" ? 1 : 0.2}
            sliderMax={mode === "vernier" ? 50 : mode === "micrometer" ? 25 : 10}
            step={mode === "vernier" ? leastCountMm : 0.01}
            minValid={0.01}
          />

          {mode === "vernier" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Verniy aniqlik darajasi (Least Count)
              </label>
              <select
                value={leastCountMm}
                onChange={(e) => setLeastCountMm(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
              >
                <option value={0.02}>0,02 mm (50 bo‘linma)</option>
                <option value={0.05}>0,05 mm (20 bo‘linma)</option>
                <option value={0.1}>0,10 mm (10 bo‘linma)</option>
              </select>
            </div>
          )}

          {mode === "spherometer" && (
            <ParamInput
              label="Oyoqchalar orasidagi masofa"
              symbol="l"
              unit="mm"
              value={legSpacingMm}
              onChange={setLegSpacingMm}
              sliderMin={15}
              sliderMax={80}
              step={1}
              minValid={5}
            />
          )}

          <ParamInput
            label="Nol xatosi"
            symbol="e₀"
            unit="mm"
            value={zeroErrorMm}
            onChange={setZeroErrorMm}
            sliderMin={-0.5}
            sliderMax={0.5}
            step={0.01}
          />

          <ParamInput
            label="Takroriy o‘lchovlar soni"
            symbol="N"
            unit="ta"
            value={sampleCount}
            onChange={setSampleCount}
            sliderMin={3}
            sliderMax={20}
            step={1}
            minValid={3}
            maxValid={30}
            integer
          />

          <button
            type="button"
            onClick={recordRow}
            className="flex w-full items-center justify-center gap-1.5 bg-blue-900 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            O‘lchovni jurnalga yozish
          </button>

          <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800">Matematik model:</div>
            {mode === "spherometer" ? (
              <MathFormula
                display
                tex="R = \frac{l^2}{6h} + \frac{h}{2}, \quad \delta = \frac{\sigma}{\sqrt{N}}"
              />
            ) : (
              <MathFormula
                display
                tex="L = \text{MSR} + (\text{VSR} \times \text{LC}) - e_0"
              />
            )}
          </div>
        </div>

        {/* Instrument Visualization + Backend Output */}
        <div className="border border-slate-200 bg-white p-4 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Qurilma Shkalasi va Real Vaqtli O‘lchov Ko‘rsatkichi
            </h3>
            {result && (
              <span className="font-mono text-xs font-bold text-blue-900">
                Tuzatilgan qiymat: {result.correctedReadingMm} mm
              </span>
            )}
          </div>

          {/* Interactive Technical SVG Apparatus */}
          <div className="border border-slate-200 bg-slate-50 p-3">
            <svg viewBox="0 0 640 210" className="w-full h-auto bg-white border border-slate-200">
              {mode === "vernier" && (
                <g>
                  {/* Fixed Jaw + Main Scale */}
                  <path d="M40 30 H600 V85 H95 V160 L75 185 L40 160 Z" fill="#F1F5F9" stroke="#334155" strokeWidth={1.5} />
                  {/* Main scale ticks (0..maxScaleMm) */}
                  {Array.from({ length: 51 }).map((_, tick) => {
                    const mmVal = (tick / 50) * maxScaleMm;
                    const x = 95 + mmVal * pxPerMm;
                    const isMajor = tick % 10 === 0;
                    const isMid = tick % 5 === 0;
                    return (
                      <g key={tick}>
                        <line
                          x1={x}
                          y1={85}
                          x2={x}
                          y2={isMajor ? 60 : isMid ? 68 : 75}
                          stroke="#0F172A"
                          strokeWidth={isMajor ? 1.4 : 0.8}
                        />
                        {isMajor && (
                          <text x={x} y={54} textAnchor="middle" fontSize={10} fill="#0F172A" fontFamily="monospace">
                            {Math.round(mmVal)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Object between jaws */}
                  <rect
                    x={95}
                    y={112}
                    width={shiftPx}
                    height={38}
                    fill="#DBEAFE"
                    stroke="#1E3A8A"
                    strokeWidth={1.5}
                  />
                  <text
                    x={95 + shiftPx / 2}
                    y={135}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#1E3A8A"
                    fontFamily="monospace"
                  >
                    {trueValueMm.toFixed(2)} mm
                  </text>

                  {/* Sliding Vernier Jaw */}
                  <g transform={`translate(${shiftPx}, 0)`}>
                    <path d="M95 85 H260 V135 H125 V160 L105 185 L95 160 Z" fill="#E2E8F0" fillOpacity={0.92} stroke="#1E3A8A" strokeWidth={1.5} />
                    {Array.from({ length: 11 }).map((_, idx) => {
                      const vx = 95 + idx * 9.4;
                      return (
                        <g key={idx}>
                          <line x1={vx} y1={85} x2={vx} y2={idx % 5 === 0 ? 104 : 98} stroke="#1E3A8A" strokeWidth={1} />
                          {idx % 2 === 0 && (
                            <text x={vx} y={116} textAnchor="middle" fontSize={8.5} fill="#1E3A8A" fontFamily="monospace">
                              {idx}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </g>
              )}

              {mode === "micrometer" && (
                <g>
                  {/* U-frame */}
                  <path d="M70 115 C70 190 220 190 220 115" fill="none" stroke="#334155" strokeWidth={14} />
                  {/* Anvil & Spindle */}
                  <rect x={65} y={85} width={28} height={22} fill="#CBD5E1" stroke="#334155" />
                  <rect x={93} y={83} width={Math.max(8, Math.min(90, trueValueMm * 3.5))} height={26} fill="#DBEAFE" stroke="#1E3A8A" />
                  <rect x={93 + Math.max(8, Math.min(90, trueValueMm * 3.5))} y={86} width={110} height={20} fill="#E2E8F0" stroke="#334155" />
                  {/* Sleeve */}
                  <rect x={250} y={70} width={220} height={52} fill="#F8FAFC" stroke="#334155" strokeWidth={1.5} />
                  <line x1={250} y1={96} x2={470} y2={96} stroke="#0F172A" strokeWidth={1.2} />
                  {Array.from({ length: 21 }).map((_, i) => (
                    <g key={i}>
                      <line x1={260 + i * 7} y1={96} x2={260 + i * 7} y2={i % 5 === 0 ? 78 : 86} stroke="#0F172A" strokeWidth={1} />
                      <line x1={263.5 + i * 7} y1={96} x2={263.5 + i * 7} y2={106} stroke="#475569" strokeWidth={0.8} />
                    </g>
                  ))}
                  {/* Thimble */}
                  <rect x={260 + microShiftPx} y={62} width={120} height={68} fill="#E2E8F0" stroke="#1E3A8A" strokeWidth={1.5} />
                  <text x={320 + microShiftPx} y={100} textAnchor="middle" fontSize={11} fill="#1E3A8A" fontFamily="monospace" fontWeight="bold">
                    {result ? `÷${result.secondaryDivision}` : ""}
                  </text>
                </g>
              )}

              {mode === "spherometer" && (
                <g>
                  {/* Spherical lens/mirror surface */}
                  <path d={`M120 155 Q320 ${Math.max(58, 132 - Math.min(40, trueValueMm * 6))} 520 155`} fill="none" stroke="#1E3A8A" strokeWidth={3} />
                  {/* Spherometer tripod */}
                  <line x1={180} y1={75} x2={460} y2={75} stroke="#334155" strokeWidth={6} />
                  <line x1={180} y1={75} x2={180} y2={138} stroke="#334155" strokeWidth={3} />
                  <line x1={460} y1={75} x2={460} y2={138} stroke="#334155" strokeWidth={3} />
                  {/* Central micrometer screw */}
                  <line x1={320} y1={30} x2={320} y2={Math.max(92, 136 - Math.min(28, trueValueMm * 3))} stroke="#B91C1C" strokeWidth={2.5} />
                  <line x1={180} y1={138} x2={460} y2={138} stroke="#94A3B8" strokeDasharray="4 4" />
                  <text x={335} y={132} fontSize={11} fill="#B91C1C" fontFamily="monospace">
                    h = {trueValueMm.toFixed(2)} mm
                  </text>
                  <text x={320} y={175} textAnchor="middle" fontSize={11} fill="#334155" fontFamily="monospace">
                    l = {legSpacingMm} mm | R = {result?.spherometerRadiusMm ?? "-"} mm
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Numeric Results Grid */}
          {result && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] text-slate-500">Asosiy shkala ko‘rsatkichi</div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  L_asosiy = {result.mainScaleReadingMm} mm
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] text-slate-500">Qo‘shimcha bo‘linma (nonius)</div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  N = {result.secondaryDivision} × {result.leastCountMm} mm
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] text-slate-500">O‘rtacha qiymat (N={result.stats.n})</div>
                <div className="font-mono text-sm font-bold text-blue-900">
                  x̄ = {result.stats.mean} ± {result.stats.stdError} mm
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] text-slate-500">
                  {mode === "spherometer" ? "Egrilik radiusi" : "Nisbiy xatolik"}
                </div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {mode === "spherometer"
                    ? `R = ${result.spherometerRadiusMm} ± ${result.spherometerUncertaintyMm} mm`
                    : `ε = ${result.stats.relativeErrorPct} %`}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                Server tomonidan generatsiya qilingan {result.stats.n} ta takroriy o‘lchovlar (mm):
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {result.samples.map((s, i) => (
                  <span key={i} className="border border-slate-300 bg-white px-2 py-0.5 text-slate-800">
                    x₍{i + 1}₎ = {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <LabFormulaStrip section="Noaniqliklar" />
      <LabReportPanel
        labKey="metrology"
        defaultTitle="1-laboratoriya: Aniq o‘lchov asboblari va xatoliklar tahlili"
        rows={rows}
        onClearRows={() => setRows([])}
        onDeleteRow={(id) => setRows((p) => p.filter((r) => r.id !== id))}
      />
    </div>
  );
}
