import React from "react";
import { BookOpen, Clock, ShieldCheck, Zap, Database, ArrowRight, Layers, FileCode } from "lucide-react";

export const MarketArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              GB Wholesale Electricity Market Architecture & Trading Mechanics
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
              Power supply and demand in Great Britain is cleared in half-hour Settlement Periods (SPs 1 through 48).
              Market participants (generators, suppliers, and trading houses) trade Day-Ahead contracts on power exchanges
              (EPEX SPOT UK and Nord Pool) before the auction gate closure.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Timeline Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          The Day-Ahead Trading Timeline & Gate-Closure Sequence
        </h4>

        <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-8 py-2">
          {/* Step 1 */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-400 ring-4 ring-slate-900"></span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-amber-300 font-bold">Day D-1 @ 11:00 GMT</span>
                <span className="text-slate-500">Auction Gate Closure</span>
              </div>
              <h5 className="text-sm font-semibold text-white">EPEX SPOT UK / Nord Pool Day-Ahead Clearing</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Auction bids and offers are frozen. System performs an <strong>As-Of Join</strong> to capture the latest
                forecast <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">F(t)</code> published by Elexon BMRS (<code className="text-emerald-400">WINDFOR</code>)
                strictly with <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">publishTime &le; 11:00 GMT</code>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-400 ring-4 ring-slate-900"></span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-blue-300 font-bold">Day D-1 @ 12:00 - 15:30 GMT</span>
                <span className="text-slate-500">Clearing & Intraday</span>
              </div>
              <h5 className="text-sm font-semibold text-white">Residual Thermal Contract Placement</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Traders calculate their net exposure: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">Thermal Needed = max(0, Customer Demand - Wind Forecast)</code>.
                Thermal CCGT, biomass, and battery contracts are booked to balance the portfolio prior to delivery.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-slate-900"></span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-emerald-300 font-bold">Day D @ 00:00 - 23:30 (48 SPs)</span>
                <span className="text-slate-500">Physical Delivery</span>
              </div>
              <h5 className="text-sm font-semibold text-white">Physical Generation Outturn Recorded</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Actual renewable energy generation is metered and streamed through Elexon BMRS (<code className="text-emerald-400">FUELHH</code> stream with <code className="text-emerald-300">fuelType=WIND</code>).
                Differences between contracted positions and actuals enter the Balancing Mechanism.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-400 ring-4 ring-slate-900"></span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-purple-300 font-bold">Post-Delivery (D+1 to D+28)</span>
                <span className="text-slate-500">Settlement Administration</span>
              </div>
              <h5 className="text-sm font-semibold text-white">Cash-Out Imbalance Settlement</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Parties that over-forecasted wind are short and must buy balancing energy at the <strong>System Buy Price (SBP)</strong>,
                which spikes during tight system conditions. Parties that under-forecasted sell surplus at <strong>System Sell Price (SSP)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Formulation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Residual Thermal Requirement
          </h4>
          <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-amber-300 border border-slate-800">
            Thermal Required_t = max(0, Customer Demand_t - Wind Forecast_t)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Determines the exact megawatts of thermal (CCGT, peakers) or flexible storage needed to meet supplier obligations without incurring balancing market penalties.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Normalized Accuracy (nMAE)
          </h4>
          <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800">
            nMAE = (MAE / Nominal Fleet Capacity) &times; 100%
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates accuracy as a percentage of Great Britain's nominal ~30,000 MW wind fleet. Benchmarks &lt; 5.0% indicate strong meteorological forecast stability.
          </p>
        </div>
      </div>
    </div>
  );
};
