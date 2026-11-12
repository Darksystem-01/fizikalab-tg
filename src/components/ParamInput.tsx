"use client";

import { useState } from "react";

export interface ParamInputProps {
  label: string;
  symbol?: string;
  unit?: string;
  value: number;
  onChange: (next: number) => void;
  sliderMin: number;
  sliderMax: number;
  step?: number;
  minValid?: number;
  maxValid?: number;
  integer?: boolean;
  hideSlider?: boolean;
}

export function ParamInput({
  label,
  symbol,
  unit,
  value,
  onChange,
  sliderMin,
  sliderMax,
  step = 0.1,
  integer = false,
  hideSlider = false,
}: ParamInputProps) {
  const [focused, setFocused] = useState(false);
  const [localDraft, setLocalDraft] = useState(String(value));

  const displayedValue = focused ? localDraft : String(value);

  const handleTextChange = (raw: string) => {
    setLocalDraft(raw);
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return;
    }
    onChange(integer ? Math.round(parsed) : parsed);
  };

  const handleBlur = () => {
    const trimmed = localDraft.trim();
    const parsed = Number(trimmed);
    setFocused(false);
    if (trimmed === "" || !Number.isFinite(parsed)) {
      setLocalDraft(String(value));
      return;
    }
    const next = integer ? Math.round(parsed) : parsed;
    if (next !== value) {
      onChange(next);
    }
  };

  const sliderVal = Math.min(
    sliderMax,
    Math.max(sliderMin, Number.isFinite(value) ? value : sliderMin)
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700">
          {label}
          {symbol ? <span className="ml-1 font-mono text-slate-500">({symbol})</span> : null}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={integer ? 1 : "any"}
            value={displayedValue}
            onFocus={() => {
              setLocalDraft(String(value));
              setFocused(true);
            }}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
            aria-label={label}
            className="w-24 rounded border-2 border-slate-300 bg-white px-2 py-0.5 text-right font-mono text-xs font-bold text-[#1E3A8A] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100 tabular-nums"
          />
          {unit ? (
            <span className="min-w-[2.1rem] text-left font-mono text-[11px] font-semibold text-slate-600">
              {unit}
            </span>
          ) : null}
        </div>
      </div>

      {!hideSlider && (
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={step}
          value={sliderVal}
          onChange={(e) => {
            const next = Number(e.target.value);
            setLocalDraft(String(next));
            onChange(next);
          }}
          className="w-full cursor-pointer accent-[#1E3A8A]"
        />
      )}
    </div>
  );
}
