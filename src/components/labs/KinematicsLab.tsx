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
import type { KinematicsResult } from "@/lib/physics/kinematics";

export function KinematicsLab() {
  const [activeScenarioId, setActiveScenarioId] = useState("kin-01");
  const [mode, setMode] = useState<"projectile" | "freefall" | "air_track">("projectile");
  const [v0, setV0] = useState(25);
  const [angleDeg, setAngleDeg] = useState(45);
  const [y0, setY0] = useState(0);
  const [massKg, setMassKg] = useState(1.0);
  const [gravity, setGravity] = useState(9.80665);
  const [airDrag, setAirDrag] = useState(true);
  const [dragCoeff, setDragCoeff] = useState(0.47);
  const [areaM2, setAreaM2] = useState(0.015);
  const [accelX, setAccelX] = useState(2.0);
  const [durationS, setDurationS] = useState(5.0);
  const [result, setResult] = useState<KinematicsResult | null>(null);
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
            labKey: "kinematics",
            saveRun,
            params: {
              mode,
              v0,
              angleDeg,
              y0,
              massKg,
              gravity,
              airDrag,
              dragCoeff,
              areaM2,
              airDensity: 1.225,
              accelX,
              durationS,
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
    [mode, v0, angleDeg, y0, massKg, gravity, airDrag, dragCoeff, areaM2, accelX, durationS]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void simulate(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [simulate]);

  useEffect(() => {
    if (!playing || !result || result.points.length < 2) return;
    let raf = 0;
    let last = performance.now();
    const totalDurMs = Math.min(6000, Math.max(2200, (result.flightTimeS || 3) * 700));
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      setProgress((p) => {
        const next = p + dt / totalDurMs;
        return next >= 1 ? 0 : next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, result]);

  function handleSelectScenario(sc: ScenarioDefinition) {
    setActiveScenarioId(sc.id);
    const p = sc.defaultParams as Record<string, unknown>;
    if (typeof p.subMode === "string") {
      if (p.subMode === "projectile" || p.subMode === "freefall" || p.subMode === "air_track") {
        setMode(p.subMode);
      }
    }
    if (typeof p.v0 === "number") setV0(p.v0);
    if (typeof p.angleDeg === "number") setAngleDeg(p.angleDeg);
    if (typeof p.initialHeightM === "number") setY0(p.initialHeightM);
    if (typeof p.heightM === "number") setY0(p.heightM);
    if (typeof p.massKg === "number") setMassKg(p.massKg);
    if (typeof p.dragCoeff === "number") setDragCoeff(p.dragCoeff);
    if (typeof p.airResistance === "boolean") setAirDrag(p.airResistance);
  }

  function recordRow() {
    if (!result) return;
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: `${mode} (v₀=${v0} m/s, θ=${angleDeg}°, drag=${airDrag ? "ha" : "yo‘q"})`,
        primaryValue: mode === "freefall" ? result.flightTimeS : result.rangeM,
        unit: mode === "freefall" ? "s" : "m",
        details: {
          T_s: result.flightTimeS,
          Hmax_m: result.maxHeightM,
          R_m: result.rangeM,
          v_oxirgi: result.impactSpeedMs,
          Eloss_pct: result.energyLostPct,
        },
      },
    ]);
  }

  const pts = result?.points ?? [];
  const activeIdx =
    pts.length > 0 ? Math.min(pts.length - 1, Math.floor(progress * (pts.length - 1))) : 0;
  const activePt = pts[activeIdx];

  return (
    <div className="space-y-4">
      <ScenarioCatalogSelector
        chapter="kinematics"
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "projectile", label: "#21 Parabolik Harakat (RK4)" },
            { id: "freefall", label: "#20 Erkin Tushish Qurilmasi" },
            { id: "air_track", label: "#19 Havo Yo‘lagi (1D)" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                const next = m.id as "projectile" | "freefall" | "air_track";
                setMode(next);
                if (next === "freefall") setY0(20);
                if (next === "projectile") setY0(0);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                mode === m.id
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
              Boshlang‘ich Shartlar (Erkin kiritish)
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Slayderdan foydalaning yoki o‘zingiz istagan sonni yozing
            </p>
          </div>

          {mode !== "freefall" && (
            <ParamInput
              label="Boshlang‘ich tezlik"
              symbol="v₀"
              unit="m/s"
              value={v0}
              onChange={setV0}
              sliderMin={0}
              sliderMax={100}
              step={0.5}
              minValid={0}
            />
          )}

          {mode === "projectile" && (
            <ParamInput
              label="Otish burchagi"
              symbol="θ₀"
              unit="°"
              value={angleDeg}
              onChange={setAngleDeg}
              sliderMin={1}
              sliderMax={89}
              step={0.5}
              minValid={0}
              maxValid={90}
            />
          )}

          {mode !== "air_track" && (
            <ParamInput
              label="Boshlang‘ich balandlik"
              symbol="y₀"
              unit="m"
              value={y0}
              onChange={setY0}
              sliderMin={mode === "freefall" ? 1 : 0}
              sliderMax={120}
              step={0.5}
              minValid={mode === "freefall" ? 0.1 : 0}
            />
          )}

          {mode === "air_track" && (
            <>
              <ParamInput
                label="Tezlanish"
                symbol="a_x"
                unit="m/s²"
                value={accelX}
                onChange={setAccelX}
                sliderMin={-10}
                sliderMax={15}
                step={0.1}
              />
              <ParamInput
                label="Kuzatuv vaqti"
                symbol="T"
                unit="s"
                value={durationS}
                onChange={setDurationS}
                sliderMin={0.5}
                sliderMax={20}
                step={0.5}
                minValid={0.1}
                maxValid={120}
              />
            </>
          )}

          <ParamInput
            label="Jism massasi"
            symbol="m"
            unit="kg"
            value={massKg}
            onChange={setMassKg}
            sliderMin={0.1}
            sliderMax={50}
            step={0.1}
            minValid={0.001}
          />

          <div className="space-y-1.5">
            <ParamInput
              label="Erkin tushish tezlanishi"
              symbol="g"
              unit="m/s²"
              value={gravity}
              onChange={setGravity}
              sliderMin={1}
              sliderMax={25}
              step={0.05}
              minValid={0.05}
            />
            <div className="flex flex-wrap gap-1">
              {[
                { name: "Yer", g: 9.80665 },
                { name: "Oy", g: 1.62 },
                { name: "Mars", g: 3.72 },
                { name: "Yupiter", g: 24.79 },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setGravity(p.g)}
                  className={`rounded border px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                    Math.abs(gravity - p.g) < 0.01
                      ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p.name} ({p.g})
                </button>
              ))}
            </div>
          </div>

          {mode !== "air_track" && (
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={airDrag}
                  onChange={(e) => setAirDrag(e.target.checked)}
                  className="accent-[#1E3A8A]"
                />
                Kvadratik havo qarshiligini yoqish
              </label>
              {airDrag && (
                <div className="space-y-2">
                  <ParamInput
                    label="Qarshilik koeffitsiyenti"
                    symbol="C_d"
                    unit=""
                    value={dragCoeff}
                    onChange={setDragCoeff}
                    sliderMin={0.05}
                    sliderMax={2}
                    step={0.01}
                    minValid={0.01}
                    hideSlider
                  />
                  <ParamInput
                    label="Ko‘ndalang yuza"
                    symbol="A"
                    unit="m²"
                    value={areaM2}
                    onChange={setAreaM2}
                    sliderMin={0.001}
                    sliderMax={0.5}
                    step={0.001}
                    minValid={0.0001}
                    hideSlider
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={recordRow}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#172554]"
          >
            <Plus className="h-3.5 w-3.5" />
            O‘lchovni jurnalga yozish
          </button>

          <div className="border-t border-slate-200 pt-2">
            <MathFormula
              display
              tex="m\frac{d\vec{v}}{dt} = m\vec{g} - \frac{1}{2}\rho C_d A |\vec{v}|\vec{v}"
            />
          </div>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {result && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Jonli Kinematik Tajriba Stendi (RK4 Simulyatsiyasi)
                    </h3>
                    {activePt && (
                      <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
                        t = <strong className="text-[#1E3A8A]">{activePt.t.toFixed(2)} s</strong> ·
                        x = <strong>{activePt.x.toFixed(2)} m</strong> · y ={" "}
                        <strong>{activePt.y.toFixed(2)} m</strong> · |v| ={" "}
                        <strong className="text-[#B91C1C]">{activePt.speed.toFixed(2)} m/s</strong>
                      </div>
                    )}
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
                      <marker id="kinArrRed" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#B91C1C" />
                      </marker>
                      <marker id="kinArrBlue" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#1E3A8A" />
                      </marker>
                    </defs>
                    {(() => {
                      const padL = 46;
                      const padR = 26;
                      const padT = 22;
                      const padB = 30;
                      const w = 640 - padL - padR;
                      const h = 230 - padT - padB;

                      if (mode === "air_track") {
                        const xs = pts.map((p) => p.x);
                        const minX = Math.min(0, ...xs);
                        const maxX = Math.max(10, ...xs);
                        const spanX = Math.max(1, maxX - minX);
                        const toX = (xv: number) => padL + ((xv - minX) / spanX) * w;
                        const trackY = 142;
                        const cx = activePt ? toX(activePt.x) : padL;
                        const vxVal = activePt?.vx ?? v0;
                        const vArrowLen = Math.max(-55, Math.min(55, (vxVal / Math.max(5, Math.abs(vxVal), v0)) * 45));
                        return (
                          <>
                            <rect x={padL - 10} y={trackY} width={w + 20} height={14} rx={3} fill="#CBD5E1" stroke="#475569" />
                            {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                              <g key={frac}>
                                <line x1={padL + frac * w} y1={trackY + 14} x2={padL + frac * w} y2={trackY + 22} stroke="#64748B" />
                                <text x={padL + frac * w} y={trackY + 34} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="monospace">
                                  {(minX + frac * spanX).toFixed(1)} m
                                </text>
                              </g>
                            ))}
                            <rect x={cx - 22} y={trackY - 28} width={44} height={28} rx={4} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1.5" />
                            <text x={cx} y={trackY - 11} textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
                              {massKg} kg
                            </text>
                            {Math.abs(vArrowLen) > 4 && (
                              <line
                                x1={cx}
                                y1={trackY - 40}
                                x2={cx + vArrowLen}
                                y2={trackY - 40}
                                stroke="#B91C1C"
                                strokeWidth="2.2"
                                markerEnd="url(#kinArrRed)"
                              />
                            )}
                            <text x={cx} y={trackY - 48} textAnchor="middle" fontSize="10" fill="#B91C1C" fontFamily="monospace" fontWeight="700">
                              v = {vxVal.toFixed(2)} m/s
                            </text>
                          </>
                        );
                      }

                      if (mode === "freefall") {
                        const maxY = Math.max(2, y0, ...pts.map((p) => p.y));
                        const toY = (yv: number) => padT + h - (yv / maxY) * h;
                        const cy = activePt ? toY(activePt.y) : padT;
                        const vyVal = activePt?.vy ?? 0;
                        return (
                          <>
                            <line x1={padL} y1={padT + h} x2={640 - padR} y2={padT + h} stroke="#334155" strokeWidth="2.5" />
                            <line x1={300} y1={padT} x2={300} y2={padT + h} stroke="#CBD5E1" strokeDasharray="4 3" strokeWidth="2" />
                            {[0, 0.5, 1].map((f) => (
                              <g key={f}>
                                <line x1={240} y1={toY(f * maxY)} x2={252} y2={toY(f * maxY)} stroke="#64748B" />
                                <text x={234} y={toY(f * maxY) + 3} textAnchor="end" fontSize="9.5" fill="#475569" fontFamily="monospace">
                                  {(f * maxY).toFixed(1)} m
                                </text>
                              </g>
                            ))}
                            <rect x={285} y={padT - 8} width={30} height={8} fill="#475569" />
                            {Math.abs(vyVal) > 0.2 && (
                              <line
                                x1={300}
                                y1={cy}
                                x2={300}
                                y2={Math.min(padT + h, cy + 36)}
                                stroke="#B91C1C"
                                strokeWidth="2.2"
                                markerEnd="url(#kinArrRed)"
                              />
                            )}
                            <circle cx={300} cy={cy} r={10} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                            <text x={324} y={cy - 2} fontSize="11" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                              h = {activePt ? activePt.y.toFixed(2) : y0} m
                            </text>
                            <text x={324} y={cy + 13} fontSize="10" fill="#B91C1C" fontFamily="monospace" fontWeight="600">
                              v = {activePt ? activePt.speed.toFixed(2) : 0} m/s
                            </text>
                          </>
                        );
                      }

                      const maxX = Math.max(2, ...pts.map((p) => p.x));
                      const maxY = Math.max(2, ...pts.map((p) => p.y));
                      const toX = (xv: number) => padL + (xv / maxX) * w;
                      const toY = (yv: number) => padT + h - (yv / maxY) * h;
                      const fullPath = pts
                        .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
                        .join(" ");
                      const activePath = pts
                        .slice(0, activeIdx + 1)
                        .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
                        .join(" ");
                      const bx = activePt ? toX(activePt.x) : padL;
                      const by = activePt ? toY(activePt.y) : padT + h;
                      const vScale = Math.max(1, v0);
                      const vxEnd = bx + (activePt ? (activePt.vx / vScale) * 44 : 0);
                      const vyEnd = by - (activePt ? (activePt.vy / vScale) * 44 : 0);

                      return (
                        <>
                          <line x1={padL} y1={padT + h} x2={640 - padR} y2={padT + h} stroke="#334155" strokeWidth="2" />
                          <line x1={padL} y1={padT} x2={padL} y2={padT + h} stroke="#94A3B8" strokeWidth="1.5" />
                          <text x={toX(maxX)} y={padT + h + 16} textAnchor="end" fontSize="9.5" fill="#475569" fontFamily="monospace">
                            R = {result.rangeM} m
                          </text>
                          <text x={padL - 4} y={toY(maxY) + 4} textAnchor="end" fontSize="9.5" fill="#475569" fontFamily="monospace">
                            {result.maxHeightM}m
                          </text>
                          <path d={fullPath} fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 3" />
                          <path d={activePath} fill="none" stroke="#1E3A8A" strokeWidth="2.5" />
                          {activePt && (
                            <>
                              <line x1={bx} y1={by} x2={vxEnd} y2={vyEnd} stroke="#B91C1C" strokeWidth="2.2" markerEnd="url(#kinArrRed)" />
                              <circle cx={bx} cy={by} r={7.5} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
                            </>
                          )}
                        </>
                      );
                    })()}
                  </svg>
                </div>

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
              </div>

              {/* Formal SI Result Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Harakat / uchish vaqti</div>
                  <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    t = {result.flightTimeS} s
                  </div>
                  {airDrag && mode === "projectile" && (
                    <div className="text-[10px] text-slate-400">Vakuum: t₀ = {result.vacuumFlightTimeS} s</div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Uchish uzoqligi / siljish</div>
                  <div className="font-mono text-sm font-bold text-[#1E3A8A] tabular-nums">
                    R = {result.rangeM} m
                  </div>
                  {airDrag && mode === "projectile" && (
                    <div className="text-[10px] text-slate-400">Vakuum: R₀ = {result.vacuumRangeM} m</div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Maksimal balandlik</div>
                  <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    H_max = {result.maxHeightM} m
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">Oxirgi tezlik</div>
                  <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    v = {result.impactSpeedMs} m/s
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ΔE = {result.energyLostPct}%
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {mode === "projectile" ? (
                  <ScientificChart
                    title="Trayektoriya y(x)"
                    xLabel="x [m]"
                    yLabel="y [m]"
                    series={[
                      {
                        label: airDrag ? "Havo qarshiligi bilan" : "Vakuum",
                        color: "#1E3A8A",
                        points: result.points.map((p) => ({ x: p.x, y: p.y })),
                      },
                    ]}
                  />
                ) : (
                  <ScientificChart
                    title="Koordinata x(t) / y(t)"
                    xLabel="t [s]"
                    yLabel={mode === "freefall" ? "y [m]" : "x [m]"}
                    series={[
                      {
                        label: mode === "freefall" ? "y(t)" : "x(t)",
                        color: "#1E3A8A",
                        points: result.points.map((p) => ({
                          x: p.t,
                          y: mode === "freefall" ? p.y : p.x,
                        })),
                      },
                    ]}
                  />
                )}

                <ScientificChart
                  title="Tezlik komponentlari v(t)"
                  xLabel="t [s]"
                  yLabel="Tezlik [m/s]"
                  series={[
                    {
                      label: "|v|(t)",
                      color: "#1E3A8A",
                      points: result.points.map((p) => ({ x: p.t, y: p.speed })),
                    },
                    {
                      label: "v_y(t)",
                      color: "#B91C1C",
                      points: result.points.map((p) => ({ x: p.t, y: p.vy })),
                    },
                  ]}
                />
              </div>

              <ScientificChart
                title="Mexanik Energiya Balansi E(t) = K(t) + U(t)"
                xLabel="t [s]"
                yLabel="Energiya [J]"
                height={200}
                series={[
                  {
                    label: "E_jami",
                    color: "#0F172A",
                    points: result.points.map((p) => ({ x: p.t, y: p.totalEnergy })),
                  },
                  {
                    label: "Kinetik K",
                    color: "#1E3A8A",
                    points: result.points.map((p) => ({ x: p.t, y: p.kineticEnergy })),
                  },
                  {
                    label: "Potensial U",
                    color: "#15803D",
                    points: result.points.map((p) => ({ x: p.t, y: p.potentialEnergy })),
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>

      <LabFormulaStrip section="Kinematika" />
      <LabReportPanel
        labKey="kinematics"
        defaultTitle="2-laboratoriya: Kinematika va parabolik harakat tadqiqoti"
        rows={rows}
        onClearRows={() => setRows([])}
        onDeleteRow={(id) => setRows((p) => p.filter((r) => r.id !== id))}
      />
    </div>
  );
}
