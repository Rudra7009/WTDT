import React, { useState } from "react";
import { TimeSeriesPoint } from "../types/energy";
import { Search, ArrowUpDown, Download, Filter, CheckCircle, AlertTriangle } from "lucide-react";

interface SettlementTableProps {
  points: TimeSeriesPoint[];
  targetDate: string;
  onExportCsv: () => void;
}

export const SettlementTable: React.FC<SettlementTableProps> = ({
  points,
  targetDate,
  onExportCsv
}) => {
  const [filterType, setFilterType] = useState<"all" | "over" | "under">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPoints = points.filter((p) => {
    // Filter by type
    if (filterType === "over" && (p.error_mw ?? 0) <= 50) return false;
    if (filterType === "under" && (p.error_mw ?? 0) >= -50) return false;

    // Filter by search query (SP or time)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const spMatch = `sp${p.settlement_period}`.includes(q) || `${p.settlement_period}` === q;
      const timeMatch = p.start_time.includes(q);
      return spMatch || timeMatch;
    }

    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            48 Half-Hour Settlement Period Regulatory Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of gate-closure frozen forecast vs BMRS FUELHH outturn delivery for {targetDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search SP or time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 w-36 sm:w-44"
            />
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All (48)
            </button>
            <button
              onClick={() => setFilterType("over")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === "over" ? "bg-rose-950/60 text-rose-300 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Over (Short)
            </button>
            <button
              onClick={() => setFilterType("under")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === "under" ? "bg-emerald-950/60 text-emerald-300 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Under (Long)
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={onExportCsv}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[550px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="py-2.5 px-3.5 font-semibold">SP</th>
              <th className="py-2.5 px-3.5 font-semibold">Time Window (GMT)</th>
              <th className="py-2.5 px-3.5 font-semibold text-right">Actual Wind (MW)</th>
              <th className="py-2.5 px-3.5 font-semibold text-right">Gate Forecast (MW)</th>
              <th className="py-2.5 px-3.5 font-semibold text-right">Error Delta (MW)</th>
              <th className="py-2.5 px-3.5 font-semibold text-right">Residual Thermal (MW)</th>
              <th className="py-2.5 px-3.5 font-semibold">Snapshot Published</th>
              <th className="py-2.5 px-3.5 font-semibold text-center">Settlement Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
            {filteredPoints.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  No settlement periods match the current filter.
                </td>
              </tr>
            ) : (
              filteredPoints.map((p) => {
                const startTime = p.start_time.split("T")[1]?.slice(0, 5) || "";
                const [startH, startM] = startTime.split(":").map(Number);
                let endH = startH;
                let endM = startM + 30;
                if (endM >= 60) {
                  endH = (endH + 1) % 24;
                  endM = 0;
                }
                const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                const error = p.error_mw ?? 0;
                const isOver = error > 50;
                const isUnder = error < -50;
                const isBalanced = !isOver && !isUnder;

                const pubTimeFormatted = p.publish_time
                  ? new Date(p.publish_time).toISOString().replace("T", " ").slice(5, 16) + "Z"
                  : "D-1 10:30Z";

                return (
                  <tr key={p.settlement_period} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-300">
                      SP{p.settlement_period}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-sans">
                      {startTime} - {endTime}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-400 tabular-nums">
                      {p.actual_mw?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "—"}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-semibold text-blue-400 tabular-nums">
                      {p.forecast_mw?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "—"}
                    </td>
                    <td className="py-2.5 px-3.5 text-right tabular-nums">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                          isOver
                            ? "bg-rose-950/70 text-rose-300 border border-rose-800/50"
                            : isUnder
                            ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {error > 0 ? `+${error.toFixed(1)}` : error.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-amber-300 font-semibold tabular-nums">
                      {p.residual_demand_mw?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "—"}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">
                      {pubTimeFormatted}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-sans">
                      {isOver && (
                        <span className="text-[10px] text-rose-400 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Short Imbalance
                        </span>
                      )}
                      {isUnder && (
                        <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Long Surplus
                        </span>
                      )}
                      {isBalanced && (
                        <span className="text-[10px] text-slate-500">
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
