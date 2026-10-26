import React, { useState } from "react";
import { AccuracyMetrics } from "../types/energy";
import { ShieldCheck, CheckCircle2, Copy, Check, TrendingDown, ArrowRight } from "lucide-react";

interface QuantActionCardProps {
  metrics: AccuracyMetrics;
  targetDate: string;
}

export const QuantActionCard: React.FC<QuantActionCardProps> = ({
  metrics,
  targetDate
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const bufferMw = metrics.recommended_buffer_mw ?? Math.abs(Math.min(0, metrics.p10_error_mw));

  const handleCopy = () => {
    const text = `[UK DA Wind Quant Directive] Target Date: ${targetDate} | Enforced P10 Tail Buffer: +${bufferMw} MW across SP17-SP38 | nMAE: ${metrics.nmae_capacity_percent}% | Directional Bias: ${metrics.bias_mpe_percent}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Recommended Procurement Buffer (Value-at-Risk Quant Signal)
              </h4>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                90% Confidence VaR
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
              To hedge against 90th percentile under-forecasting risk, increase wholesale purchase by{" "}
              <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                +{bufferMw.toLocaleString()} MW
              </span>{" "}
              across Settlement Periods 17 to 38 (evening demand ramp). This mitigates exposure to peak Cash-Out prices (SBP) in the Balancing Mechanism.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            title="Copy hedge directive for trader ticket"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Directive</span>
              </>
            )}
          </button>

          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Day-Ahead Ready
          </span>
        </div>
      </div>
    </div>
  );
};
