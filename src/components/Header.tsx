import React from "react";
import { Wind, FileSpreadsheet, Activity, Cpu, BookOpen, Video } from "lucide-react";

export type ActiveTab = "cockpit" | "ledger" | "cutoff-lab" | "architecture" | "scripts";

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  marketCondition?: string;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  marketCondition,
  onExportCsv
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
                BMRS Wind Trading Terminal
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                UK Day-Ahead
              </span>
            </div>
            {marketCondition && (
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md hidden md:block">
                {marketCondition}
              </p>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onTabChange("cockpit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === "cockpit"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Trading Cockpit
          </button>

          <button
            onClick={() => onTabChange("ledger")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === "ledger"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            48-SP Ledger
          </button>

          <button
            onClick={() => onTabChange("cutoff-lab")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === "cutoff-lab"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            As-Of Gate Lab
          </button>

          <button
            onClick={() => onTabChange("architecture")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === "architecture"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Market Rules
          </button>

          <button
            onClick={() => onTabChange("scripts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === "scripts"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="w-3.5 h-3.5 text-amber-400" />
            Video Scripts
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onExportCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Download full 48 Settlement Period ledger to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-950/80 border-t border-slate-800 gap-1">
        <button
          onClick={() => onTabChange("cockpit")}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === "cockpit" ? "bg-slate-800 text-white" : "text-slate-400"
          }`}
        >
          Cockpit
        </button>
        <button
          onClick={() => onTabChange("ledger")}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === "ledger" ? "bg-slate-800 text-white" : "text-slate-400"
          }`}
        >
          48-SP Ledger
        </button>
        <button
          onClick={() => onTabChange("cutoff-lab")}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === "cutoff-lab" ? "bg-slate-800 text-white" : "text-slate-400"
          }`}
        >
          Gate Lab
        </button>
        <button
          onClick={() => onTabChange("architecture")}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === "architecture" ? "bg-slate-800 text-white" : "text-slate-400"
          }`}
        >
          Market Rules
        </button>
        <button
          onClick={() => onTabChange("scripts")}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === "scripts" ? "bg-amber-500/20 text-amber-300" : "text-slate-400"
          }`}
        >
          Video Scripts
        </button>
      </div>
    </header>
  );
};
