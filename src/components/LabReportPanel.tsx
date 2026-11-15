"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Printer, Send, Trash2 } from "lucide-react";

export interface MeasurementRow {
  id: number;
  label: string;
  primaryValue: number;
  unit: string;
  details: Record<string, number | string | boolean>;
}

interface AssignmentOption {
  id: number;
  title: string;
  lab_key: string;
}

export function LabReportPanel({
  labKey,
  defaultTitle,
  rows,
  onClearRows,
  onDeleteRow,
}: {
  labKey: string;
  defaultTitle: string;
  rows: MeasurementRow[];
  onClearRows: () => void;
  onDeleteRow: (id: number) => void;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [conclusion, setConclusion] = useState("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [rawAnalysis, setRawAnalysis] = useState<{
    n: number;
    mean: number;
    stdDev: number;
    stdError: number;
    relativeErrorPct: number;
  } | null>(null);
  const analysis = rows.length === 0 ? null : rawAnalysis;
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const qAssignmentId = params?.get("assignmentId");
    const qTitle = params?.get("title");
    if (qTitle) {
      try {
        setTitle(decodeURIComponent(qTitle));
      } catch {
        setTitle(qTitle);
      }
    }

    fetch("/api/assignments")
      .then((r) => (r.ok ? r.json() : { assignments: [] }))
      .then((d) => {
        const list = (d.assignments || []).filter(
          (a: AssignmentOption) => a.lab_key === labKey
        );
        setAssignments(list);
        if (qAssignmentId && list.some((a: AssignmentOption) => String(a.id) === qAssignmentId)) {
          setAssignmentId(qAssignmentId);
        } else if (list.length > 0) {
          setAssignmentId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [labKey]);

  useEffect(() => {
    if (rows.length === 0) {
      return;
    }
    const values = rows.map((r) => r.primaryValue);
    fetch("/api/physics/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.stats) setRawAnalysis(d.stats);
      })
      .catch(() => {});
  }, [rows]);

  function safeCsvCell(raw: unknown): string {
    const s = String(raw ?? "");
    // Prevent CSV formula injection (=, +, -, @, tab, CR)
    const neutralized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${neutralized.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    if (rows.length === 0) return;
    const detailKeys = Array.from(
      new Set(rows.flatMap((r) => Object.keys(r.details)))
    );
    const header = ["#", "Tajriba", "Asosiy qiymat", "Birlik", ...detailKeys];
    const lines = [
      header.map(safeCsvCell).join(","),
      ...rows.map((r, idx) =>
        [
          idx + 1,
          safeCsvCell(r.label),
          r.primaryValue,
          safeCsvCell(r.unit),
          ...detailKeys.map((k) => safeCsvCell(r.details[k] ?? "")),
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${labKey}_olchovlar.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rows.length === 0) {
      setMessage({
        type: "err",
        text: "Avval kamida 1 ta o‘lchov natijasini jurnalga yozib oling.",
      });
      return;
    }
    if (!conclusion.trim()) {
      setMessage({ type: "err", text: "Ilmiy xulosa matnini kiriting." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignmentId ? Number(assignmentId) : null,
          labKey,
          title,
          measurements: rows,
          errorAnalysis: analysis ?? {},
          conclusion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Xatolik yuz berdi" });
      } else {
        setMessage({
          type: "ok",
          text: `Hisobot (#${data.id}) bazaga saqlandi va ustoz tekshiruviga yuborildi.`,
        });
        setConclusion("");
      }
    } catch {
      setMessage({ type: "err", text: "Tarmoq xatosi" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Laboratoriya O‘lchov Jurnali va Hisobot Topshirish
          </h2>
          <p className="text-xs text-slate-500">
            Backend xatolik tahlili (σ, δ = σ/√N) avtomatik hisoblanadi
          </p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> CSV yuklash
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Chop etish / PDF
          </button>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={onClearRows}
              className="inline-flex items-center gap-1 border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Tozalash
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {rows.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Hali o‘lchov yozib olinmagan. Yuqoridagi tajribadan kerakli parametrlarni sozlab{" "}
            <strong className="text-slate-800">“O‘lchovni jurnalga yozish”</strong> tugmasini bosing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2 px-2.5 font-semibold">#</th>
                  <th className="py-2 px-2.5 font-semibold">Tajriba / Parametr</th>
                  <th className="py-2 px-2.5 font-semibold">Asosiy o‘lchov</th>
                  <th className="py-2 px-2.5 font-semibold">Qo‘shimcha ko‘rsatkichlar</th>
                  <th className="no-print py-2 px-2.5 text-right font-semibold">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="py-2 px-2.5 font-mono text-slate-500">{i + 1}</td>
                    <td className="py-2 px-2.5 font-medium text-slate-900">{r.label}</td>
                    <td className="py-2 px-2.5 font-mono font-semibold text-blue-900">
                      {r.primaryValue} {r.unit}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600">
                      {Object.entries(r.details)
                        .slice(0, 4)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" | ")}
                    </td>
                    <td className="no-print py-2 px-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteRow(r.id)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                        title="O‘chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {analysis && (
          <div className="mt-4 grid grid-cols-2 gap-2 border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5">
            <div>
              <div className="text-[11px] text-slate-500">Tajribalar soni (N)</div>
              <div className="font-mono text-sm font-bold text-slate-900">{analysis.n}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">O‘rtacha qiymat (x̄)</div>
              <div className="font-mono text-sm font-bold text-slate-900">{analysis.mean}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Standart og‘ish (σ)</div>
              <div className="font-mono text-sm font-bold text-slate-900">{analysis.stdDev}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Standart xatolik (δ)</div>
              <div className="font-mono text-sm font-bold text-blue-900">±{analysis.stdError}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Nisbiy xatolik</div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {analysis.relativeErrorPct}%
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="no-print mt-4 space-y-3 border-t border-slate-200 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Hisobot sarlavhasi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Ustoz topshirig‘iga biriktirish
              </label>
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                <option value="">Mustaqil laboratoriya ishi</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Ilmiy xulosa va tahlil
            </label>
            <textarea
              rows={2}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Olingan tajriba natijalari, nazariy qiymat bilan solishtirish va xatolik sabablari haqida xulosa yozing..."
              className="w-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
            />
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 border px-3 py-2 text-xs ${
                message.type === "ok"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-red-300 bg-red-50 text-red-900"
              }`}
            >
              {message.type === "ok" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Yuborilmoqda..." : "Hisobotni ustozga topshirish"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
