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
  const [realisticView, setRealisticView] = useState(true);
  const [showComponents, setShowComponents] = useState(true);

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
                    {mode === "projectile" && (
                      <button
                        type="button"
                        onClick={() => setShowComponents((c) => !c)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition cursor-pointer ${
                          showComponents
                            ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {showComponents ? "Vektorlar (vx, vy)" : "Oddiy |v|"}
                      </button>
                    )}
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

                <div className="lab-grid overflow-hidden rounded-md border border-slate-200 p-2 bg-slate-50/50">
                  <svg viewBox="0 0 640 230" className="h-60 w-full select-none">
                    <defs>
                      <marker id="kinArrRed" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                        <path d="M0,1 L0,7 L7,4 z" fill="#DC2626" />
                      </marker>
                      <marker id="kinArrGreen" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                        <path d="M0,1 L0,7 L7,4 z" fill="#16A34A" />
                      </marker>
                      <marker id="kinArrCyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                        <path d="M0,1 L0,7 L7,4 z" fill="#0284C7" />
                      </marker>
                      <marker id="kinArrOrange" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                        <path d="M0,1 L0,7 L7,4 z" fill="#EA580C" />
                      </marker>
                      <marker id="kinArrBlue" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#1E3A8A" />
                      </marker>

                      {/* 3D Specular Shaded Cannonball */}
                      <radialGradient id="cannonBallGrad" cx="35%" cy="30%" r="65%" fx="28%" fy="25%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="20%" stopColor="#93C5FD" />
                        <stop offset="55%" stopColor="#1E3A8A" />
                        <stop offset="85%" stopColor="#0F172A" />
                        <stop offset="100%" stopColor="#020617" />
                      </radialGradient>

                      {/* Metallic Cannon Gradient */}
                      <linearGradient id="cannonMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#64748B" />
                        <stop offset="35%" stopColor="#CBD5E1" />
                        <stop offset="70%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1E293B" />
                      </linearGradient>

                      {/* Cannon Brass Trim */}
                      <linearGradient id="cannonBrass" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FDE047" />
                        <stop offset="50%" stopColor="#CA8A04" />
                        <stop offset="100%" stopColor="#854D0E" />
                      </linearGradient>

                      {/* Realistic Sky Gradient */}
                      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EFF6FF" />
                        <stop offset="65%" stopColor="#F8FAFC" />
                        <stop offset="100%" stopColor="#F1F5F9" />
                      </linearGradient>

                      {/* Realistic Ground Grass to Soil Gradient */}
                      <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22C55E" />
                        <stop offset="22%" stopColor="#16A34A" />
                        <stop offset="40%" stopColor="#78350F" />
                        <stop offset="100%" stopColor="#451A03" />
                      </linearGradient>

                      {/* Ruler Ticks Pattern */}
                      <pattern id="rulerTicks" width="20" height="8" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1" />
                        <line x1="5" y1="0" x2="5" y2="4" stroke="#94A3B8" strokeWidth="0.8" />
                        <line x1="10" y1="0" x2="10" y2="6" stroke="#64748B" strokeWidth="0.8" />
                        <line x1="15" y1="0" x2="15" y2="4" stroke="#94A3B8" strokeWidth="0.8" />
                      </pattern>

                      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="2.5" />
                      </filter>
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
                            <circle cx={300} cy={cy} r={10} fill="url(#cannonBallGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
                            <text x={324} y={cy - 2} fontSize="11" fill="#1E3A8A" fontFamily="monospace" fontWeight="700">
                              h = {activePt ? activePt.y.toFixed(2) : y0} m
                            </text>
                            <text x={324} y={cy + 13} fontSize="10" fill="#B91C1C" fontFamily="monospace" fontWeight="600">
                              v = {activePt ? activePt.speed.toFixed(2) : 0} m/s
                            </text>
                          </>
                        );
                      }

                      // Mode: Projectile (Ballistic)
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
                          {/* Realistic Sky Background if active */}
                          {realisticView && (
                            <rect
                              x={padL - 10}
                              y={padT - 10}
                              width={w + 20}
                              height={h + 10}
                              fill="url(#skyGrad)"
                              rx="6"
                            />
                          )}

                          {/* Horizontal grid elevation lines */}
                          {[0.25, 0.5, 0.75, 1].map((f) => (
                            <line
                              key={f}
                              x1={padL}
                              y1={toY(f * maxY)}
                              x2={padL + w}
                              y2={toY(f * maxY)}
                              stroke="#E2E8F0"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                          ))}

                          {/* Realistic Ground and Measuring Ruler */}
                          {realisticView ? (
                            <>
                              <rect
                                x={padL - 20}
                                y={padT + h}
                                width={w + 40}
                                height={padB + 10}
                                fill="url(#groundGrad)"
                              />
                              <line
                                x1={padL - 20}
                                y1={padT + h}
                                x2={padL + w + 20}
                                y2={padT + h}
                                stroke="#16A34A"
                                strokeWidth="3"
                              />
                              {/* Steel measuring tape along ground */}
                              <rect
                                x={padL}
                                y={padT + h + 4}
                                width={w}
                                height={7}
                                fill="#FEF08A"
                                stroke="#CA8A04"
                                strokeWidth="0.8"
                              />
                              <rect
                                x={padL}
                                y={padT + h + 4}
                                width={w}
                                height={7}
                                fill="url(#rulerTicks)"
                              />
                              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                                const rx = padL + f * w;
                                const valM = (f * maxX).toFixed(1);
                                return (
                                  <g key={f}>
                                    <line
                                      x1={rx}
                                      y1={padT + h + 2}
                                      x2={rx}
                                      y2={padT + h + 14}
                                      stroke="#0F172A"
                                      strokeWidth="1.2"
                                    />
                                    <text
                                      x={rx}
                                      y={padT + h + 23}
                                      textAnchor="middle"
                                      fontSize="9"
                                      fill="#0F172A"
                                      fontFamily="monospace"
                                      fontWeight="600"
                                    >
                                      {valM} m
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          ) : (
                            <>
                              <line
                                x1={padL}
                                y1={padT + h}
                                x2={640 - padR}
                                y2={padT + h}
                                stroke="#334155"
                                strokeWidth="2"
                              />
                              <text
                                x={toX(maxX)}
                                y={padT + h + 16}
                                textAnchor="end"
                                fontSize="9.5"
                                fill="#475569"
                                fontFamily="monospace"
                              >
                                R = {result.rangeM} m
                              </text>
                            </>
                          )}

                          {/* Vertical Axis Tick Labels */}
                          <line
                            x1={padL}
                            y1={padT}
                            x2={padL}
                            y2={padT + h}
                            stroke="#94A3B8"
                            strokeWidth="1.5"
                          />
                          <text
                            x={padL - 4}
                            y={toY(maxY) + 4}
                            textAnchor="end"
                            fontSize="9.5"
                            fill="#475569"
                            fontFamily="monospace"
                          >
                            {result.maxHeightM}m
                          </text>

                          {/* Full Theoretical Trajectory Path */}
                          <path
                            d={fullPath}
                            fill="none"
                            stroke={realisticView ? "#94A3B8" : "#CBD5E1"}
                            strokeWidth={realisticView ? "2.2" : "2"}
                            strokeDasharray="4 3"
                          />

                          {/* Active Completed Trajectory Path */}
                          <path
                            d={activePath}
                            fill="none"
                            stroke="#1E3A8A"
                            strokeWidth={realisticView ? "3" : "2.5"}
                          />

                          {/* Apex Altitude Marker Crosshair */}
                          {realisticView && result.maxHeightM > 0 && (
                            <g
                              transform={`translate(${toX(result.rangeM / 2)}, ${toY(
                                result.maxHeightM
                              )})`}
                            >
                              <line
                                x1="-8"
                                y1="0"
                                x2="8"
                                y2="0"
                                stroke="#0284C7"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                              />
                              <line
                                x1="0"
                                y1="-8"
                                x2="0"
                                y2="8"
                                stroke="#0284C7"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                              />
                              <circle
                                cx="0"
                                cy="0"
                                r="3"
                                fill="none"
                                stroke="#0284C7"
                                strokeWidth="1.2"
                              />
                              <text
                                x="5"
                                y="-6"
                                fontSize="9"
                                fill="#0284C7"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                H = {result.maxHeightM}m
                              </text>
                            </g>
                          )}

                          {/* Landing Target Flag at Range R */}
                          {realisticView && result.rangeM > 0 && result.rangeM <= maxX && (
                            <g transform={`translate(${toX(result.rangeM)}, ${padT + h})`}>
                              <ellipse
                                cx="0"
                                cy="0"
                                rx="9"
                                ry="3.5"
                                fill="#DC2626"
                                fillOpacity="0.4"
                                stroke="#DC2626"
                                strokeWidth="1.2"
                              />
                              <ellipse cx="0" cy="0" rx="4" ry="1.8" fill="#FFFFFF" />
                              <line x1="0" y1="0" x2="0" y2="-28" stroke="#334155" strokeWidth="1.5" />
                              <polygon points="0,-28 16,-22 0,-16" fill="#DC2626" />
                              <text
                                x="3"
                                y="-31"
                                fontSize="9"
                                fill="#DC2626"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                R = {result.rangeM}m
                              </text>
                            </g>
                          )}

                          {/* Realistic Cannon Launcher Apparatus at Launch Point */}
                          {realisticView && (
                            <g transform={`translate(${padL}, ${toY(y0)})`}>
                              {/* Heavy Pedestal Base */}
                              <path
                                d="M-13,0 L-7,-9 L7,-9 L13,0 Z"
                                fill="#334155"
                                stroke="#1E293B"
                                strokeWidth="1"
                              />
                              {/* Carriage Wheel */}
                              <circle
                                cx="0"
                                cy="0"
                                r="8.5"
                                fill="#475569"
                                stroke="#1E293B"
                                strokeWidth="1.5"
                              />
                              <circle cx="0" cy="0" r="2.5" fill="#CBD5E1" />
                              {/* Rotating Cannon Barrel */}
                              <g transform={`rotate(${-angleDeg}, 0, 0)`}>
                                <rect
                                  x="0"
                                  y="-5.5"
                                  width="26"
                                  height="11"
                                  rx="2"
                                  fill="url(#cannonMetal)"
                                  stroke="#1E293B"
                                  strokeWidth="1"
                                />
                                <rect
                                  x="23"
                                  y="-6.5"
                                  width="4"
                                  height="13"
                                  rx="1"
                                  fill="url(#cannonBrass)"
                                  stroke="#854D0E"
                                  strokeWidth="0.8"
                                />
                                <ellipse cx="26" cy="0" rx="1.5" ry="5.5" fill="#0F172A" />
                              </g>
                              <text
                                x="12"
                                y="-12"
                                fontSize="9"
                                fill="#1E3A8A"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {angleDeg}°
                              </text>
                            </g>
                          )}

                          {/* Projectile & Physics Vectors */}
                          {activePt && (
                            <>
                              {/* Realistic ground drop-shadow */}
                              {realisticView && (
                                <ellipse
                                  cx={bx}
                                  cy={padT + h}
                                  rx={Math.max(2.5, 8.5 * (1 - (activePt.y / (maxY || 1)) * 0.7))}
                                  ry={Math.max(1.2, 3.2 * (1 - (activePt.y / (maxY || 1)) * 0.7))}
                                  fill="#0F172A"
                                  opacity={Math.max(0.12, 0.45 - (activePt.y / (maxY || 1)) * 0.35)}
                                  filter="url(#softShadow)"
                                />
                              )}

                              {/* Trajectory motion particles */}
                              {realisticView &&
                                pts.slice(Math.max(0, activeIdx - 10), activeIdx).map((pt, ti) => (
                                  <circle
                                    key={ti}
                                    cx={toX(pt.x)}
                                    cy={toY(pt.y)}
                                    r={Math.max(1.5, 4.5 * (ti / 10))}
                                    fill="#3B82F6"
                                    opacity={0.12 + 0.3 * (ti / 10)}
                                  />
                                ))}

                              {/* Horizontal (vx, green) and Vertical (vy, cyan) Component Vectors */}
                              {showComponents && (
                                <>
                                  <line
                                    x1={bx}
                                    y1={by}
                                    x2={bx + (activePt.vx / vScale) * 44}
                                    y2={by}
                                    stroke="#16A34A"
                                    strokeWidth="1.8"
                                    markerEnd="url(#kinArrGreen)"
                                  />
                                  <line
                                    x1={bx}
                                    y1={by}
                                    x2={bx}
                                    y2={by - (activePt.vy / vScale) * 44}
                                    stroke="#0284C7"
                                    strokeWidth="1.8"
                                    markerEnd="url(#kinArrCyan)"
                                  />
                                  {/* Dashed parallelogram projection */}
                                  <line
                                    x1={bx + (activePt.vx / vScale) * 44}
                                    y1={by}
                                    x2={vxEnd}
                                    y2={vyEnd}
                                    stroke="#94A3B8"
                                    strokeWidth="0.8"
                                    strokeDasharray="2 2"
                                  />
                                  <line
                                    x1={bx}
                                    y1={by - (activePt.vy / vScale) * 44}
                                    x2={vxEnd}
                                    y2={vyEnd}
                                    stroke="#94A3B8"
                                    strokeWidth="0.8"
                                    strokeDasharray="2 2"
                                  />
                                </>
                              )}

                              {/* Total Resultant Velocity Vector (Crimson) */}
                              <line
                                x1={bx}
                                y1={by}
                                x2={vxEnd}
                                y2={vyEnd}
                                stroke="#DC2626"
                                strokeWidth="2.4"
                                markerEnd="url(#kinArrRed)"
                              />

                              {/* Aerodynamic Air Drag Vector (Orange, Opposite to v) */}
                              {airDrag && activePt.speed > 1 && (
                                <line
                                  x1={bx}
                                  y1={by}
                                  x2={bx - (activePt.vx / activePt.speed) * 18}
                                  y2={by + (activePt.vy / activePt.speed) * 18}
                                  stroke="#EA580C"
                                  strokeWidth="1.8"
                                  markerEnd="url(#kinArrOrange)"
                                />
                              )}

                              {/* 3D Specular Shaded Spherical Ball */}
                              <circle
                                cx={bx}
                                cy={by}
                                r={realisticView ? 8.5 : 7.5}
                                fill={realisticView ? "url(#cannonBallGrad)" : "#1E3A8A"}
                                stroke="#FFFFFF"
                                strokeWidth="1.5"
                              />
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
