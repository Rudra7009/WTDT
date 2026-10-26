import React, { useState } from "react";
import { Clock, ShieldAlert, Cpu, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TimeSeriesPoint } from "../types/energy";

interface GateCutoffInspectorProps {
  points: TimeSeriesPoint[];
  gateHour: number;
  onGateHourChange: (hour: number) => void;
  targetDate: string;
}

export const GateCutoffInspector: React.FC<GateCutoffInspectorProps> = ({
  points,
  gateHour,
  onGateHourChange,
  targetDate
}) => {
  const [showLookaheadComparison, setShowLookaheadComparison] = useState<boolean>(true);

  // Simulated lookahead bias data (intraday forecasts published right up to 2 hours before delivery)
  const comparisonData = points.map((p) => {
    const timeParts = p.start_time.split("T")[1]?.slice(0, 5) || "";
    const actual = p.actual_mw ?? 14000;
    // With lookahead bias, NWP error is artificially dampened by 60%
    const unhedgedError = p.error_mw ?? 0;
    const naiveLookaheadForecast = Math.round(actual + unhedgedError * 0.4);

    return {
      sp: p.settlement_period,
      clock_time: timeParts,
      actual: actual,
      gateAlignedForecast: p.forecast_mw,
      naiveLookaheadForecast: naiveLookaheadForecast,
      trueError: Math.abs(unhedgedError),
      naiveError: Math.abs(naiveLookaheadForecast - actual)
    };
  });

  const trueMae = Math.round(
    comparisonData.reduce((acc, c) => acc + c.trueError, 0) / comparisonData.length
  );
  const naiveMae = Math.round(
    comparisonData.reduce((acc, c) => acc + c.naiveError, 0) / comparisonData.length
  );

  return (
    <div className="space-y-6">
      {/* Educational Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              The Gate-Closure As-Of Join & Elimination of Lookahead Bias
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              In the GB wholesale electricity market (EPEX SPOT UK / Nord Pool), Day-Ahead auctions clear between{" "}
              <strong className="text-amber-300">11:00 GMT and 12:00 GMT</strong> on Day $D-1$ for all 48 half-hour settlement periods of delivery Day $D$.
              Any forecast published <strong className="text-rose-400">after 11:00 GMT on Day D-1</strong> is legally and operationally useless for the Day-Ahead clearing auction.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Valid: <code className="text-slate-200">publishTime &le; D-1 @ {gateHour}:00 GMT</code>
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                Discarded: <code className="text-slate-200">publishTime &gt; D-1 @ {gateHour}:00 GMT</code>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Gate Simulation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Interactive Gate-Closure Timeline Simulator
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust the cutoff threshold to inspect how forecast freshness impacts Day-Ahead bidding integrity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {[9, 10, 11, 12, 14].map((h) => (
                <button
                  key={h}
                  onClick={() => onGateHourChange(h)}
                  className={`px-3 py-1.5 rounded font-mono font-medium transition-colors ${
                    gateHour === h
                      ? h > 11
                        ? "bg-rose-900/60 text-rose-200 border border-rose-700/50"
                        : "bg-emerald-900/60 text-emerald-200 border border-emerald-700/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {String(h).padStart(2, "0")}:00 GMT
                  {h === 11 && " (EPEX)"}
                  {h === 12 && " (NordPool)"}
                  {h === 14 && " (Illegal Post-Gate)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quant Discrepancy Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">True Operational Day-Ahead MAE</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Valid Bidding
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">{trueMae}</span>
              <span className="text-xs text-slate-400 font-mono">MW</span>
              <span className="text-xs text-slate-500 ml-auto">({((trueMae / 30000) * 100).toFixed(2)}% nMAE)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Based strictly on WINDFOR forecasts published prior to Day D-1 @ {gateHour}:00 GMT. Reflects real market risk.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Naive Forecast MAE (With Lookahead Leakage)</span>
              <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                Flawed Backtest
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-rose-400 tabular-nums">{naiveMae}</span>
              <span className="text-xs text-slate-400 font-mono">MW</span>
              <span className="text-xs text-slate-500 ml-auto">({((naiveMae / 30000) * 100).toFixed(2)}% nMAE)</span>
            </div>
            <p className="text-[11px] text-rose-300/80 mt-2">
              Artificially flatters performance by {(trueMae - naiveMae).toFixed(0)} MW by peeking into intraday forecasts published after auction clearance.
            </p>
          </div>
        </div>

        {/* Visual Chart Comparison */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTrue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorNaive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="sp"
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                tickFormatter={(sp) => `SP${sp}`}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}GW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#1e293b",
                  borderRadius: "8px"
                }}
                formatter={(val: any, name?: any) => [
                  `${Number(val).toLocaleString()} MW`,
                  String(name || "")
                ]}
              />
              <Area
                type="monotone"
                dataKey="gateAlignedForecast"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTrue)"
                name="Legitimate Gate-Aligned Forecast (MW)"
              />
              <Area
                type="monotone"
                dataKey="naiveLookaheadForecast"
                stroke="#ec4899"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorNaive)"
                name="Flawed Lookahead Leakage Forecast (MW)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
