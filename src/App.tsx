import React, { useState, useEffect } from "react";
import { Header, ActiveTab } from "./components/Header";
import { ControlToolbar } from "./components/ControlToolbar";
import { KpiBar } from "./components/KpiBar";
import { ForecastChart } from "./components/ForecastChart";
import { ResidualDemandChart } from "./components/ResidualDemandChart";
import { HourlyErrorChart } from "./components/HourlyErrorChart";
import { QuantActionCard } from "./components/QuantActionCard";
import { SettlementTable } from "./components/SettlementTable";
import { GateCutoffInspector } from "./components/GateCutoffInspector";
import { MarketArchitectureView } from "./components/MarketArchitectureView";
import { PresentationScriptsModal } from "./components/PresentationScriptsModal";
import { fetchForecastDashboard } from "./services/api";
import { DashboardResponse } from "./types/energy";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function App() {
  const [targetDate, setTargetDate] = useState<string>("2026-01-15");
  const [gateHour, setGateHour] = useState<number>(11);
  const [demandMw, setDemandMw] = useState<number>(32000);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cockpit");
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchForecastDashboard(targetDate, gateHour, demandMw);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load settlement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetDate, gateHour, demandMw]);

  // CSV Export utility
  const handleExportCsv = () => {
    if (!data || !data.points.length) return;

    const headers = [
      "Settlement_Period",
      "Start_Time",
      "Actual_Wind_MW",
      "Gate_Aligned_Forecast_MW",
      "Error_Delta_MW",
      "Residual_Thermal_Needed_MW",
      "Gate_Cutoff_Enforced",
      "Forecast_Publish_Time"
    ];

    const rows = data.points.map((p) => [
      p.settlement_period,
      p.start_time,
      p.actual_mw ?? "",
      p.forecast_mw ?? "",
      p.error_mw ?? "",
      p.residual_demand_mw ?? "",
      data.gate_cutoff_used,
      p.publish_time ?? ""
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bmrs_wind_settlement_${targetDate}_gate${gateHour}Z.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 1. Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        marketCondition={data?.market_condition}
        onExportCsv={handleExportCsv}
      />

      {/* 2. Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Error notification if any */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-800/60 text-rose-300 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Global Controls & Scenarios Bar */}
        <ControlToolbar
          targetDate={targetDate}
          onDateChange={setTargetDate}
          gateHour={gateHour}
          onGateHourChange={setGateHour}
          demandMw={demandMw}
          onDemandChange={setDemandMw}
          onRefresh={loadData}
          isLoading={loading}
        />

        {/* Tab 1: Primary Trading Cockpit */}
        {activeTab === "cockpit" && data && (
          <div className="space-y-5">
            {/* Executive Quantitative KPI Bar */}
            <KpiBar metrics={data.metrics} />

            {/* Primary Visual: Day-Ahead Wind Forecast vs Actual Generation */}
            <ForecastChart
              points={data.points}
              targetDate={targetDate}
              gateCutoff={data.gate_cutoff_used}
            />

            {/* Dual Sub-Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Residual Thermal Requirement */}
              <ResidualDemandChart
                points={data.points}
                demandCeiling={demandMw}
              />

              {/* Diurnal Error Distribution */}
              <HourlyErrorChart
                hourlyProfiles={data.hourly_breakdown}
              />
            </div>

            {/* Quant Action Engine Card */}
            <QuantActionCard
              metrics={data.metrics}
              targetDate={targetDate}
            />
          </div>
        )}

        {/* Tab 2: 48 Settlement Periods Regulatory Ledger */}
        {activeTab === "ledger" && data && (
          <SettlementTable
            points={data.points}
            targetDate={targetDate}
            onExportCsv={handleExportCsv}
          />
        )}

        {/* Tab 3: Gate Cutoff & Lookahead Bias Inspector */}
        {activeTab === "cutoff-lab" && data && (
          <GateCutoffInspector
            points={data.points}
            gateHour={gateHour}
            onGateHourChange={setGateHour}
            targetDate={targetDate}
          />
        )}

        {/* Tab 4: Market Architecture & Mathematics */}
        {activeTab === "architecture" && <MarketArchitectureView />}

        {/* Tab 5: Video Presentation Scripts */}
        {activeTab === "scripts" && <PresentationScriptsModal />}
      </main>

      {/* Quiet Corporate Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            <span>BMRS Wind Trading Decision Terminal</span>
            <span className="mx-2">·</span>
            <span>UK EPEX SPOT / Nord Pool Day-Ahead Market Engine</span>
            <span className="mx-2">·</span>
            <span>January 2026 Regulatory Settlement</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Nominal Fleet: 30,000 MW</span>
            <span>Resolution: 30-Min SP</span>
            <span>Source: Elexon BMRS API / WINDFOR / FUELHH</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
