# BMRS Wind Trading Decision Terminal — Complete Architecture & Operations Manual

---

## 1. Domain Context: The Great Britain (GB) Power Market

Electricity cannot be stored cost-effectively on a national grid scale without round-trip losses. In Great Britain, supply and demand are balanced across **48 half-hour Settlement Periods (SPs 1 through 48)** every single delivery day (Day $D$), running from `00:00 GMT` to `23:30 GMT`.

### 1.1 The Day-Ahead Auction Clearing Window
* Wholesale day-ahead power is auctioned on **EPEX SPOT UK** and **Nord Pool**.
* **Gate Closure**: Daily at **11:00 GMT on Day $D-1$** (Nord Pool DA clears at 12:00 GMT).
* Once the gate closes, all bids and offers are frozen.
* Electricity suppliers (power buyers) must submit bids to cover customer demand. Because renewable wind generation has near-zero marginal cost, power buyers first subtract anticipated wind power, then procure the **Residual Thermal Requirement** from gas (CCGT), peaker plants, or interconnectors.

### 1.2 The As-Of Join Rule (Lookahead Bias Elimination)
A standard database join on `Settlement Period` leaks future information. 
* Numerical Weather Prediction (NWP) forecasts (`WINDFOR`) are updated and published continuously throughout Day $D-1$ and Day $D$.
* Any forecast published **after 11:00 GMT on Day $D-1$** was physically and legally impossible to use during the auction.
* **The As-Of Join Algorithm**:
  $$\text{Selected Forecast}(t) = \max_{\text{publishTime} \le \text{GateCutoff}(D-1)} \text{WINDFOR}(t)$$
  Where $\text{GateCutoff}(D-1) = \text{Date}(D-1)\text{ 11:00:00 UTC}$.

---

## 2. Portal Sections & Mathematical Formulations

### 2.1 Top Bar & Navigation Contract
* **Zone 1 (Brand)**: `BMRS Wind Trading Terminal` with active market condition indicator (e.g. *Deep Atlantic Gale*, *Dunkelflaute Anticyclone*, *Polar Frontal Boundary*).
* **Zone 2 (View Tabs)**:
  1. **Trading Cockpit**: Main operational dashboard with charts, KPI strip, and Quant signal.
  2. **48-SP Ledger**: Auditable half-hour settlement ledger.
  3. **As-Of Gate Lab**: Lookahead bias comparison and gate cutoff simulator.
  4. **Market Rules**: GB wholesale market timeline and regulatory reference.
  5. **Video Scripts**: Verbatim, timed teleprompter scripts (<5 min client pitch, <5 min tech review).
* **Zone 3 (Export)**: One-click CSV export button.

### 2.2 Global Control Toolbar
* **Target Delivery Date**: Day $D$ in January 2026.
* **Auction Gate Hour**: Cutoff hour on Day $D-1$ ($09\text{:}00$, $10\text{:}00$, $11\text{:}00$ EPEX, $12\text{:}00$ Nord Pool, $14\text{:}00$ Post-Gate).
* **Retail Demand Baseline**: Total consumer electricity demand in MW (e.g., 32,000 MW).
* **Preset Meteorological Scenarios**:
  * *Jan 15: Deep Gale* (High wind, near-record offshore generation, negative residual thermal risk).
  * *Jan 08: Dunkelflaute* (High-pressure anticyclone, near-zero wind, high thermal procurement).
  * *Jan 22: Polar Front* (Fast-moving front, high intra-day ramp rate volatility).
  * *Jan 29: Steady Run* (Moderate, stable winter westerly generation).

### 2.3 Executive Quantitative KPI Metric Strip
All values use tabular figures (`tabular-nums`) to prevent layout jitter:
1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{N} \sum_{t=1}^{N} |F_t - A_t| \quad [\text{MW}]$$
   *Represents the average absolute volume deviation per half-hour.*
2. **Root Mean Square Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^{N} (F_t - A_t)^2} \quad [\text{MW}]$$
   *Heavily penalizes extreme tail errors (sudden drop-offs or unforecast ramps).*
3. **Capacity-Normalized MAE (nMAE)**:
   $$\text{nMAE} = \frac{\text{MAE}}{\text{Nominal Fleet Capacity (30,000 MW)}} \times 100\%$$
   *Market benchmark is $<5.0\%$. Values $>5\%$ indicate elevated weather model volatility.*
4. **System Directional Bias (MPE %)**:
   $$\text{Bias (MPE)} = \frac{1}{N} \sum_{t=1}^{N} \left(\frac{F_t - A_t}{\max(A_t, 100)}\right) \times 100\%$$
   *Positive ($>0$): Over-forecast tendency $\rightarrow$ Short position risk $\rightarrow$ Penalty at System Buy Price (SBP).*
   *Negative ($<0$): Under-forecast tendency $\rightarrow$ Long surplus position $\rightarrow$ Dump power at System Sell Price (SSP).*
5. **P10 to P90 Error Uncertainty Envelope**:
   *The 10th and 90th percentiles of error distribution ($E_t = F_t - A_t$), giving the $80\%$ empirical confidence interval in MW.*
6. **Imbalance Counts & Cash-out Risk Exposure**:
   *Counts of Settlement Periods with error $>+50\text{ MW}$ (Over) vs $<-50\text{ MW}$ (Under).*
   $$\text{Cashout Exposure} \approx \sum_{t=1}^{48} (|E_t| \times 0.5\text{ h}) \times £78.50/\text{MWh}$$

### 2.4 Primary Wind Generation Chart
* **WINDFOR Curve (Blue Area)**: Day-Ahead wind forecast strictly published before Day $D-1$ 11:00 GMT.
* **FUELHH Actuals Curve (Emerald Area)**: Metered physical generation outturn from Elexon BMRS (`fuelType=WIND`).
* **Error Delta Line (Purple Dashed)**: Instantaneous delta $(F_t - A_t)$.
* Switchable between Area fill and Line rendering.

### 2.5 Residual Thermal Power Requirement Chart
* **Formula**:
  $$\text{Thermal Required}_t = \max(0, \text{Customer Demand}_t - \text{Day-Ahead Wind Forecast}_t)$$
* **Red Dashed Line**: Customer Demand Baseline ceiling.
* **KPIs**: Peak Thermal MW, Min Thermal MW, and Total Daily Thermal Energy Obligation (in GWh).

### 2.6 Diurnal Volatility & Hourly Error Chart
* Evaluates forecast error across the 24 hours of the day ($00\text{:}00$ to $23\text{:}00\text{ GMT}$).
* Highlights peak risk windows during morning load ramps ($07\text{:}00 - 09\text{:}00$) and evening peaks ($17\text{:}00 - 19\text{:}00$).

### 2.7 Quant Action Engine (Value-at-Risk Hedging Signal)
* Calculates the recommended spinning reserve or flexible contract buffer:
  $$\text{Buffer MW} = |\min(0, P_{10})|$$
* Protects utilities against peak-evening imbalance cash-out spikes.
* One-click "Copy Directive" button generates formatted text for trader order tickets.

### 2.8 48-SP Settlement Period Regulatory Ledger
* Complete audit table of all 48 half-hour settlement periods.
* Searchable by SP or clock time. Filterable by status (All, Over/Short, Under/Long).
* One-click CSV export: `bmrs_wind_settlement_YYYY-MM-DD_gate11Z.csv`.

### 2.9 As-Of Gate Cutoff & Lookahead Bias Inspector Lab
* Compares valid operational Day-Ahead MAE vs flawed lookahead backtest MAE.
* Shows how using post-gate forecasts artificially deflates MAE, hiding real trading risk.

---

## 3. How to Run Locally & Push to GitHub

### 3.1 Download from AI Studio
1. Click the **Export** / **Download Project** button in the AI Studio Build interface (or use the Git integration).
2. Unzip the downloaded archive to a directory of your choice, e.g.:
   ```bash
   cd ~/projects/bmrs-wind-trading-terminal
   ```

### 3.2 Method A: Run via Docker Compose (Recommended)
This runs both the Python FastAPI backend and the React Nginx frontend in isolated containers:
```bash
# 1. Ensure Docker Desktop is running
docker --version
docker compose version

# 2. Build and launch all containers
docker compose up --build -d

# 3. Access applications:
# Frontend UI: http://localhost:3000
# Backend API Docs (Swagger): http://localhost:8000/docs
# Backend Health Check: http://localhost:8000/health
```

### 3.3 Method B: Run Without Docker (Local Native)

#### Step 1: Start Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Step 2: Start Frontend (React + Vite)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

---

## 4. Pushing to a New GitHub Repository

Run the following commands in the project root directory:

```bash
# 1. Initialize Git repository
git init

# 2. Check status (verify node_modules and .env are ignored via .gitignore)
git status

# 3. Stage all project files
git add .

# 4. Commit files
git commit -m "feat: initial commit of BMRS Wind Trading Decision Terminal (UK Day-Ahead)"

# 5. Create a new repository on GitHub (via GitHub Web UI or GitHub CLI):
# If using GitHub CLI:
gh repo create bmrs-wind-trading-terminal --public --source=. --remote=origin --push

# If creating manually on github.com:
# 5a. Create a new empty repository at https://github.com/new (do NOT check Initialize with README)
# 5b. Link and push:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/bmrs-wind-trading-terminal.git
git branch -M main
git push -u origin main
```
