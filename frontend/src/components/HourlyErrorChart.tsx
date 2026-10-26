import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { HourlyProfile } from "../types/energy";
import { BarChart2, AlertCircle } from "lucide-react";

interface HourlyErrorChartProps {
  hourlyProfiles: HourlyProfile[];
}

export const HourlyErrorChart: React.FC<HourlyErrorChartProps> = ({
  hourlyProfiles
}) => {
  // Find highest risk hour
  const highestRiskHour = [...hourlyProfiles].sort((a, b) => b.avg_mae_mw - a.avg_mae_mw)[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Hourly Wind Volatility & Absolute Error (MAE)
            </h3>
          </div>
          {highestRiskHour && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-purple-300">
              <span>Peak Risk:</span>
              <span className="font-bold text-white">{highestRiskHour.hour}:00 GMT</span>
              <span className="text-slate-500">({highestRiskHour.avg_mae_mw.toFixed(0)} MW MAE)</span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Identifies diurnal settlement risk windows where intraday trading desk attention is critical
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyProfiles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(h) => `${h}:00`}
            />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `${val} MW`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#090d16",
                borderColor: "#1e293b",
                borderRadius: "8px"
              }}
              labelFormatter={(h) => `Hour ${h}:00 - ${h}:59 GMT`}
              formatter={(val: any) => [`${Number(val).toFixed(1)} MW`, "Average MAE"]}
            />
            <Bar
              dataKey="avg_mae_mw"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="Average Absolute Error (MW)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
          Ramp hours (07:00-09:00 & 17:00-19:00) require dynamic intraday re-hedging
        </span>
        <span className="font-mono text-slate-300">24 Hour Horizon</span>
      </div>
    </div>
  );
};
