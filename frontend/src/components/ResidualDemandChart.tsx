import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { TimeSeriesPoint } from "../types/energy";
import { Flame, Info } from "lucide-react";

interface ResidualDemandChartProps {
  points: TimeSeriesPoint[];
  demandCeiling: number;
}

export const ResidualDemandChart: React.FC<ResidualDemandChartProps> = ({
  points,
  demandCeiling
}) => {
  const chartData = points.map((p) => {
    const timeParts = p.start_time.split("T")[1]?.slice(0, 5) || "";
    return {
      ...p,
      clock_time: timeParts,
      label_sp: `SP${p.settlement_period} (${timeParts})`
    };
  });

  // Calculate summary figures
  const validResiduals = points
    .map((p) => p.residual_demand_mw)
    .filter((v): v is number => v !== null && v !== undefined);
  
  const peakResidual = validResiduals.length ? Math.max(...validResiduals) : 0;
  const minResidual = validResiduals.length ? Math.min(...validResiduals) : 0;
  
  // Total Thermal GWh = Sum of MW * 0.5h / 1000
  const totalThermalGwh = Math.round(
    validResiduals.reduce((acc, v) => acc + v * 0.5, 0) / 1000
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Residual Thermal Power Obligation
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Peak Thermal:</span>
            <span className="text-amber-400 font-bold">
              {(peakResidual / 1000).toFixed(1)} GW
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Day Energy:</span>
            <span className="text-white font-bold">{totalThermalGwh.toLocaleString()} GWh</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Procurement Obligation = max(0, Customer Demand - Day-Ahead Wind Forecast) across 48 SPs
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorThermal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
            <XAxis
              dataKey="settlement_period"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(sp) => `SP${sp}`}
              interval={5}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10 }}
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
              formatter={(val: any) => [
                `${Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`,
                "Thermal / Peaker Volume Needed"
              ]}
            />
            <ReferenceLine
              y={demandCeiling}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: `Retail Ceiling: ${(demandCeiling / 1000).toFixed(0)}GW`,
                fill: "#ef4444",
                fontSize: 10,
                position: "insideTopRight"
              }}
            />
            <Area
              type="monotone"
              dataKey="residual_demand_mw"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorThermal)"
              name="Thermal Requirement (MW)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Auction bids submitted based on this curve hedge spot price spikes
        </span>
        <span className="font-mono text-slate-300">Min Thermal: {(minResidual / 1000).toFixed(1)} GW</span>
      </div>
    </div>
  );
};
