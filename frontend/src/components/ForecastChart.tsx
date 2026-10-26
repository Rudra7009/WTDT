import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from "recharts";
import { TimeSeriesPoint } from "../types/energy";
import { TrendingUp, Layers, Activity } from "lucide-react";

interface ForecastChartProps {
  points: TimeSeriesPoint[];
  targetDate: string;
  gateCutoff: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  points,
  targetDate,
  gateCutoff
}) => {
  const [chartType, setChartType] = useState<"area" | "line">("area");
  const [showErrorLine, setShowErrorLine] = useState<boolean>(true);

  // Format date helper
  const formattedGate = new Date(gateCutoff).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }) + " GMT";

  const chartData = points.map((p) => {
    const timeParts = p.start_time.split("T")[1]?.slice(0, 5) || "";
    return {
      ...p,
      clock_time: timeParts,
      label_sp: `SP${p.settlement_period} (${timeParts})`
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Physical Wind Generation: Forecast Frozen @ Gate Cutoff vs Delivered Actuals
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Delivery Day: <span className="font-mono text-slate-200 font-semibold">{targetDate}</span> · Gate Enforced:{" "}
            <span className="font-mono text-amber-300 font-semibold">{formattedGate}</span> (Zero Lookahead Bias)
          </p>
        </div>

        {/* Chart View Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setChartType("area")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                chartType === "area" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                chartType === "line" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Line
            </button>
          </div>

          <button
            onClick={() => setShowErrorLine(!showErrorLine)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              showErrorLine
                ? "bg-purple-950/40 border-purple-800/60 text-purple-300 font-medium"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {showErrorLine ? "Hide Error Delta" : "Show Error Delta"}
          </button>
        </div>
      </div>

      {/* Legend Indicators */}
      <div className="flex flex-wrap items-center gap-5 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block shadow-sm"></span>
          <span className="text-slate-300 font-medium">WINDFOR Day-Ahead Forecast (Gate-Aligned)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm"></span>
          <span className="text-slate-300 font-medium">FUELHH Actual Wind Delivered</span>
        </div>
        {showErrorLine && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded bg-purple-400 inline-block"></span>
            <span className="text-purple-300 font-medium">Forecast Error (F - A)</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="settlement_period"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(sp) => `SP${sp}`}
                interval={3}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)} GW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#1e293b",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                }}
                labelFormatter={(sp, payload) => {
                  const pt = payload?.[0]?.payload;
                  return `Settlement Period ${sp} · ${pt?.clock_time || ""} GMT`;
                }}
                formatter={(val: any, name?: any) => [
                  `${Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`,
                  String(name || "")
                ]}
              />
              <Area
                type="monotone"
                dataKey="forecast_mw"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorForecast)"
                name="Forecast (MW)"
              />
              <Area
                type="monotone"
                dataKey="actual_mw"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorActual)"
                name="Delivered Actual (MW)"
              />
              {showErrorLine && (
                <Line
                  type="monotone"
                  dataKey="error_mw"
                  stroke="#c084fc"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Error Delta (MW)"
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="settlement_period"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(sp) => `SP${sp}`}
                interval={3}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)} GW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#1e293b",
                  borderRadius: "8px"
                }}
                labelFormatter={(sp, payload) => {
                  const pt = payload?.[0]?.payload;
                  return `Settlement Period ${sp} · ${pt?.clock_time || ""} GMT`;
                }}
                formatter={(val: any, name?: any) => [
                  `${Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`,
                  String(name || "")
                ]}
              />
              <Line
                type="monotone"
                dataKey="forecast_mw"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                name="Forecast (MW)"
              />
              <Line
                type="monotone"
                dataKey="actual_mw"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Delivered Actual (MW)"
              />
              {showErrorLine && (
                <Line
                  type="monotone"
                  dataKey="error_mw"
                  stroke="#c084fc"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Error Delta (MW)"
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
