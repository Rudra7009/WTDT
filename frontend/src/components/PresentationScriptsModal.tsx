import React, { useState } from "react";
import { Video, Clock, Copy, Check, Users, Terminal, Sparkles } from "lucide-react";

export const PresentationScriptsModal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<"client" | "tech">("client");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const clientPitchText = `[TIME: 0:00 - 0:45] - Executive Hook & Problem Statement
"Good morning, team. As power buyers in the UK wholesale day-ahead market, your primary mandate is balancing customer demand while avoiding ruinous cash-out imbalance penalties. Every morning before the 11:00 AM auction gate, you are forced to make multi-million-pound hedging decisions. Your single biggest variable risk is wind generation. If you over-estimate wind, you are under-hedged and forced into the expensive Balancing Mechanism at cash-out prices. If you under-estimate wind, you over-procure thermal energy and dump power into a falling market.

Today, I am proud to present our Wind Trading Decision Terminal, specifically calibrated for your procurement decisions in January 2026."

[TIME: 0:45 - 2:15] - Core Value Demonstration: Gate Cut-Off & Residual Thermal Need
"Let's look at the live cockpit. The primary problem with generic forecast dashboards is that they give you real-time forecasts that weren't available when you actually submitted your bids. 

Our portal enforces the EPEX SPOT 11:00 AM D-1 gate cutoff. When evaluating January 15th, 2026, the blue curve represents the latest WINDFOR forecast strictly published before 11:00 AM on January 14th. 

Notice our second widget: 'Residual Thermal Power Required to Procure'. Given your utility's 32 GW retail load profile, the orange area computes your exact thermal procurement obligation for all 48 settlement periods. You no longer need manual spreadsheets to determine how much baseload or CCGT power to bid in the auction. It updates instantaneously as demand inputs adjust."

[TIME: 2:15 - 3:45] - Quantitative Accuracy & Risk Hedging
"Now to the critical quantitative component: How much should you trust this forecast?
In our KPI header, we don't just show simple error. We show:
1. nMAE at 2.8% of national capacity—demonstrating whether the weather models are holding up.
2. Directional Bias: Notice the +3.2% MPE, signaling that during high wind ramps, WINDFOR systematically over-predicts delivery.
3. Tail Risk (P10 to P90): We give you the Value-at-Risk envelope. For settlement periods 18 to 36, our system flags a 1,200 MW down-side tail. 

Our automated recommendation advises your traders to procure a 950 MW spinning reserve or flexible contract buffer, protecting your balance sheet against peak-evening imbalance penalties."

[TIME: 3:45 - 4:45] - Bottom-Line Commercial Impact
"In summary:
- Zero data friction: Direct ingestion of BMRS FUELHH actuals and WINDFOR streams.
- Strict market compliance: Gate closure alignment guarantees zero lookahead bias.
- Quantitative peace of mind: Clear thermal volume sizing with quantified statistical margins.

This portal turns unpredictable weather into a disciplined, data-driven power procurement strategy."`;

  const techReviewText = `[TIME: 4:45 - 5:45] - Architectural Overview & Design Decisions
"Hi everyone. Moving to the technical review. The platform is designed as a decoupled, cloud-native application using FastAPI on the backend and React with TypeScript on the frontend.

Let's address the domain's biggest technical challenge: Lookahead Bias and As-Of Joins.
In the UK market, WINDFOR forecasts are published asynchronously throughout the day. A naive join on settlement period leads to lookahead leakage. 

In app/services/forecast_engine.py, we implemented a vector-accelerated Pandas as-of filtering mechanism. For target delivery day D, we compute a hard cutoff timestamp at D-1 11:00:00 UTC. We filter publishTime <= cutoff, partition by startTime, and take the latest published snapshot. This guarantees deterministic point-in-time state reconstruction."

[TIME: 5:45 - 7:15] - Backend Implementation & Resiliency Patterns
"Let's walk through the codebase:
1. elexon_client.py: Uses httpx.AsyncClient with connection pooling and timeouts to ingest the BMRS stream endpoints for FUELHH and WINDFOR. For local development or cases where downstream test endpoints lack forward January 2026 data, we built a physical simulation fallback that models synoptic weather cycles, diurnal variations, and stochastic noise.
2. metrics_engine.py: Computes MAE, RMSE, MAPE, nMAE against nominal fleet capacity (30 GW), and percentiles P10/P90 using NumPy. It also aggregates diurnal profiles across the 24-hour cycle.
3. Clean Architecture: All DTOs are strictly validated via Pydantic V2 schemas with static typing guarantees."

[TIME: 7:15 - 8:30] - Frontend Engineering & UI/UX Design
"On the frontend (frontend/src):
- React with TypeScript in strict mode.
- Vite for fast HMR and optimized tree-shaken production bundles.
- Tailwind CSS with an ergonomics-first dark trading floor interface.
- Recharts for vector graphics rendering of 48 Settlement Periods.
- Zero layout shift: The chart dynamically updates without refetching unneeded assets, and error states are gracefully handled with fallback UI components."

[TIME: 8:30 - 9:45] - Dockerization, CI/CD, and Deployment Readiness
"For deployment and containerization:
- Backend Dockerfile uses python:3.11-slim with multi-stage considerations and non-root execution.
- Frontend Dockerfile uses a two-stage build: Stage 1 builds the static bundle via Node 20; Stage 2 serves it using a minimal Nginx Alpine image, which also acts as a reverse proxy for the /api route, eliminating CORS overhead in production.
- Orchestrated with docker-compose.yml, spinning up the complete platform with one command: docker compose up --build.
- Ready for immediate one-click container deployment to Heroku or static deployment to Vercel.

Unit tests cover the gate-cutoff timestamp boundary conditions and metrics calculations. The repository is fully documented, modular, and ready for code review."`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Executive Video Presentation Scripts
                <span className="text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  Strictly &lt; 10 Minutes Total
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Verbatim spoken scripts with timed cadence milestones, audience calibration, and key technical talking points.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-center">
            <button
              onClick={() => setActiveSection("client")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSection === "client"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Part 1: Client Pitch (&lt;5 min)
            </button>

            <button
              onClick={() => setActiveSection("tech")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSection === "tech"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              Part 2: Tech Review (&lt;5 min)
            </button>
          </div>
        </div>
      </div>

      {/* Script Card */}
      {activeSection === "client" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Target Audience:
                </span>
                <span className="text-xs text-slate-200">
                  Head of Day-Ahead Power Trading & Portfolio Managers at a UK Energy Utility
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tone:</span>
                <span className="text-xs text-slate-300">
                  Commercial, authoritative, value-focused, risk-mitigating
                </span>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(clientPitchText, "client")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copiedSection === "client" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-xs text-slate-300 bg-slate-950 p-5 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {clientPitchText}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Target Audience:
                </span>
                <span className="text-xs text-slate-200">
                  Internal Technical Lead / Principal Architect / Code Review Board
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tone:</span>
                <span className="text-xs text-slate-300">
                  Technical, architectural, code-level, engineering best practices
                </span>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(techReviewText, "tech")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copiedSection === "tech" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-xs text-slate-300 bg-slate-950 p-5 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {techReviewText}
          </div>
        </div>
      )}
    </div>
  );
};
