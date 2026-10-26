import React from "react";
import { AccuracyMetrics } from "../types/energy";
import { ArrowUpRight, ArrowDownRight, ShieldAlert, BarChart3 } from "lucide-react";

interface KpiBarProps {
  metrics: AccuracyMetrics;
}

export const KpiBar: React.FC<KpiBarProps> = ({ metrics }) => {
  const isOverBiased = metrics.bias_mpe_percent > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. MAE */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="text-[11px] text-slate-400 font-medium">Mean Absolute Error</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {metrics.mae_mw.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <span className="text-xs text-slate-500 font-mono">MW</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">Mean volume deviation</div>
      </div>

      {/* 2. RMSE */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="text-[11px] text-slate-400 font-medium">Root Mean Sq Err (RMSE)</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono tracking-tight text-amber-400 tabular-nums">
            {metrics.rmse_mw.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <span className="text-xs text-slate-500 font-mono">MW</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">Penalizes tail spikes</div>
      </div>

      {/* 3. nMAE Capacity */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="text-[11px] text-slate-400 font-medium">Normalized Error (nMAE)</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono tracking-tight text-cyan-400 tabular-nums">
            {metrics.nmae_capacity_percent.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-500">30GW Fleet</span>
        </div>
        <div className="text-[10px] text-emerald-400 mt-1">
          {metrics.nmae_capacity_percent < 5.0 ? "Within market benchmark (<5%)" : "Elevated weather volatility"}
        </div>
      </div>

      {/* 4. Directional Bias */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="text-[11px] text-slate-400 font-medium">System Directional Bias</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span
            className={`text-2xl font-bold font-mono tracking-tight tabular-nums flex items-center gap-0.5 ${
              isOverBiased ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {isOverBiased ? (
              <ArrowUpRight className="w-5 h-5 inline-block" />
            ) : (
              <ArrowDownRight className="w-5 h-5 inline-block" />
            )}
            {isOverBiased ? `+${metrics.bias_mpe_percent.toFixed(2)}%` : `${metrics.bias_mpe_percent.toFixed(2)}%`}
          </span>
          <span className="text-xs text-slate-500 font-mono">MPE</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          {isOverBiased ? "Tends to over-forecast (Short)" : "Tends to under-forecast (Long)"}
        </div>
      </div>

      {/* 5. P10 - P90 Uncertainty */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="text-[11px] text-slate-400 font-medium">P10 - P90 Tail Bound</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-sm font-bold font-mono tracking-tight text-slate-200 tabular-nums truncate">
            {metrics.p10_error_mw > 0 ? `+${metrics.p10_error_mw}` : metrics.p10_error_mw} to +{metrics.p90_error_mw}
          </span>
          <span className="text-xs text-slate-500 font-mono">MW</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">80% confidence interval</div>
      </div>

      {/* 6. Over / Under Exposure */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="text-[11px] text-slate-400 font-medium">Imbalance Count & Risk</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-sm font-bold font-mono tracking-tight text-purple-300 tabular-nums">
            {metrics.over_forecast_count} Over / {metrics.under_forecast_count} Under
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-mono">
          Est. £{((metrics.imbalance_cashout_risk_gbp ?? 0) / 1000).toFixed(0)}k cashout spread
        </div>
      </div>
    </div>
  );
};
