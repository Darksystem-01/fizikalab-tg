"use client";

import { useState } from "react";

export interface ChartSeries {
  label: string;
  color: string;
  points: { x: number; y: number }[];
}

export function ScientificChart({
  title,
  xLabel,
  yLabel,
  series,
  height = 240,
}: {
  title: string;
  xLabel: string;
  yLabel: string;
  series: ChartSeries[];
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 620;
  const pad = { top: 20, right: 20, bottom: 38, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allPts = series.flatMap((s) => s.points);
  if (allPts.length === 0) {
    return (
      <div className="border border-slate-200 bg-white p-4 text-xs text-slate-500">
        {title}: Ma’lumot yo‘q
      </div>
    );
  }

  let minX = Math.min(...allPts.map((p) => p.x));
  let maxX = Math.max(...allPts.map((p) => p.x));
  let minY = Math.min(...allPts.map((p) => p.y));
  let maxY = Math.max(...allPts.map((p) => p.y));

  if (Math.abs(maxX - minX) < 1e-9) {
    minX -= 1;
    maxX += 1;
  }
  if (Math.abs(maxY - minY) < 1e-9) {
    minY -= 1;
    maxY += 1;
  } else {
    const margin = (maxY - minY) * 0.08;
    minY -= margin;
    maxY += margin;
  }

  const sx = (x: number) => pad.left + ((x - minX) / (maxX - minX)) * plotW;
  const sy = (y: number) => pad.top + plotH - ((y - minY) / (maxY - minY)) * plotH;

  const xTicks = 5;
  const yTicks = 4;
  const primaryPts = series[0]?.points ?? [];

  return (
    <div className="border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {series.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-xs"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          if (primaryPts.length === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          const norm = Math.min(1, Math.max(0, (relX - pad.left) / plotW));
          const targetX = minX + norm * (maxX - minX);
          let best = 0;
          let bestDist = Infinity;
          primaryPts.forEach((p, idx) => {
            const d = Math.abs(p.x - targetX);
            if (d < bestDist) {
              bestDist = d;
              best = idx;
            }
          });
          setHoverIdx(best);
        }}
      >
        <rect
          x={pad.left}
          y={pad.top}
          width={plotW}
          height={plotH}
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth={1}
        />

        {/* Grid lines */}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const val = minX + ((maxX - minX) * i) / xTicks;
          const px = sx(val);
          return (
            <g key={`xt-${i}`}>
              <line
                x1={px}
                y1={pad.top}
                x2={px}
                y2={pad.top + plotH}
                stroke="#F1F5F9"
                strokeWidth={1}
              />
              <text
                x={px}
                y={pad.top + plotH + 14}
                textAnchor="middle"
                fontSize={10}
                fill="#475569"
              >
                {Number(val.toPrecision(3))}
              </text>
            </g>
          );
        })}

        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = minY + ((maxY - minY) * i) / yTicks;
          const py = sy(val);
          return (
            <g key={`yt-${i}`}>
              <line
                x1={pad.left}
                y1={py}
                x2={pad.left + plotW}
                y2={py}
                stroke="#F1F5F9"
                strokeWidth={1}
              />
              <text
                x={pad.left - 6}
                y={py + 3}
                textAnchor="end"
                fontSize={10}
                fill="#475569"
              >
                {Number(val.toPrecision(3))}
              </text>
            </g>
          );
        })}

        {/* Zero axes if in range */}
        {minY < 0 && maxY > 0 && (
          <line
            x1={pad.left}
            y1={sy(0)}
            x2={pad.left + plotW}
            y2={sy(0)}
            stroke="#94A3B8"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}
        {minX < 0 && maxX > 0 && (
          <line
            x1={sx(0)}
            y1={pad.top}
            x2={sx(0)}
            y2={pad.top + plotH}
            stroke="#94A3B8"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}

        {/* Series paths */}
        {series.map((s) => {
          const d = s.points
            .map((p, idx) => `${idx === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`)
            .join(" ");
          return (
            <path
              key={s.label}
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={1.8}
            />
          );
        })}

        {/* Hover crosshair */}
        {hoverIdx !== null && primaryPts[hoverIdx] && (
          <g>
            <line
              x1={sx(primaryPts[hoverIdx].x)}
              y1={pad.top}
              x2={sx(primaryPts[hoverIdx].x)}
              y2={pad.top + plotH}
              stroke="#1E3A8A"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            <circle
              cx={sx(primaryPts[hoverIdx].x)}
              cy={sy(primaryPts[hoverIdx].y)}
              r={3.5}
              fill="#1E3A8A"
            />
          </g>
        )}

        {/* Axis labels */}
        <text
          x={pad.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={600}
          fill="#334155"
        >
          {xLabel}
        </text>
        <text
          x={14}
          y={pad.top + plotH / 2}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={600}
          fill="#334155"
          transform={`rotate(-90 14 ${pad.top + plotH / 2})`}
        >
          {yLabel}
        </text>
      </svg>

      {hoverIdx !== null && primaryPts[hoverIdx] && (
        <div className="mt-1 flex flex-wrap gap-4 border-t border-slate-100 pt-1.5 font-mono text-[11px] text-slate-600">
          <span>
            {xLabel}: <strong className="text-slate-900">{primaryPts[hoverIdx].x}</strong>
          </span>
          {series.map((s) => {
            const pt = s.points[hoverIdx];
            if (!pt) return null;
            return (
              <span key={s.label}>
                {s.label}: <strong className="text-slate-900">{pt.y}</strong>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
