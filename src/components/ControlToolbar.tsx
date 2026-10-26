import React from "react";
import { Calendar, Clock, Zap, RefreshCw, Sparkles, Filter } from "lucide-react";

interface ControlToolbarProps {
  targetDate: string;
  onDateChange: (date: string) => void;
  gateHour: number;
  onGateHourChange: (hour: number) => void;
  demandMw: number;
  onDemandChange: (mw: number) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  { date: "2026-01-15", label: "Jan 15: Deep Gale", demand: 32000 },
  { date: "2026-01-08", label: "Jan 08: Dunkelflaute", demand: 36000 },
  { date: "2026-01-22", label: "Jan 22: Polar Front", demand: 34000 },
  { date: "2026-01-29", label: "Jan 29: Steady Run", demand: 30000 },
];

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  targetDate,
  onDateChange,
  gateHour,
  onGateHourChange,
  demandMw,
  onDemandChange,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Controls Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Delivery Date */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">Delivery Date (Day D)</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={targetDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-mono font-medium text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Gate Cutoff Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">Auction Gate (Day D-1)</span>
              <select
                value={gateHour}
                onChange={(e) => onGateHourChange(Number(e.target.value))}
                className="bg-transparent text-xs font-mono font-semibold text-amber-300 focus:outline-none cursor-pointer pr-1"
              >
                <option value={9} className="bg-slate-900">09:00 GMT (Early Lock)</option>
                <option value={10} className="bg-slate-900">10:00 GMT (Pre-Bid)</option>
                <option value={11} className="bg-slate-900">11:00 GMT (EPEX Standard)</option>
                <option value={12} className="bg-slate-900">12:00 GMT (Nord Pool DA)</option>
              </select>
            </div>
          </div>

          {/* Client Retail Demand Input */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <Zap className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">Retail Demand Baseline</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={1000}
                  min={10000}
                  max={60000}
                  value={demandMw}
                  onChange={(e) => onDemandChange(Math.max(1000, Number(e.target.value)))}
                  className="w-20 bg-transparent text-xs font-mono font-bold text-blue-300 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono">MW</span>
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg border border-slate-700 transition flex items-center justify-center"
            title="Recalculate settlement with selected gate cutoff"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>

        {/* Quick Presets / Meteorological Scenarios */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 overflow-x-auto">
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Scenarios:
          </span>
          <div className="flex items-center gap-1.5">
            {PRESET_SCENARIOS.map((sc) => (
              <button
                key={sc.date}
                onClick={() => {
                  onDateChange(sc.date);
                  onDemandChange(sc.demand);
                }}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors whitespace-nowrap ${
                  targetDate === sc.date
                    ? "bg-slate-800 border-emerald-500/50 text-emerald-300 font-semibold"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
