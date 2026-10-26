# BMRS Wind Trading Decision Terminal (UK Day-Ahead Market)

An institutional-grade energy intelligence portal built for UK power utilities buying electricity in the wholesale Day-Ahead auction (EPEX SPOT / Nord Pool). The system ingests Elexon BMRS renewable datasets (`WINDFOR` forecasts and `FUELHH` actuals), applies strict auction gate closure filtering, computes the residual thermal generation requirement, and quantitatively measures forecast errors for delivery in **January 2026**.

---

## Live Demo & Repository
* **Interactive Terminal:** Available locally at `http://localhost:3000`
* **Backend API Docs (Swagger):** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/health`

---

## Core Capabilities
1. **Gate Closure Alignment**: Automatically filters the latest `WINDFOR` forecast available prior to the Day-Ahead auction gate (Default: 11:00 GMT on Day $D-1$). Eliminates lookahead bias.
2. **Residual Thermal Power Calculator**: Computes $\max(0, \text{Demand} - \text{Wind Forecast})$ for all 48 half-hour settlement periods of the delivery day.
3. **Quantitative Accuracy Engine**: Computes MAE, RMSE, MAPE, Capacity-Normalized MAE (nMAE), Directional Bias (MPE), and P10/P90 error confidence bounds.
4. **Diurnal Risk Breakdown**: Displays settlement period error profiles across the 24-hour delivery horizon to identify intraday volatility.
5. **Value-at-Risk Hedging Buffer**: Automatically sizes spinning reserve / flexible contract buffer to mitigate peak evening cash-out imbalance penalties.

---

## Project Structure
```
.
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── models/
│       │   └── schemas.py
│       └── services/
│           ├── elexon_client.py
│           ├── forecast_engine.py
│           └── metrics_engine.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── types/
        │   └── energy.ts
        └── services/
            └── api.ts
```

---

## Quickstart with Docker (Recommended)

### Prerequisites
* Docker Desktop 20.10+
* Docker Compose v2+

### Run Multi-Container Stack
```bash
# Clone the repository
git clone https://github.com/anonymous-org/kjhwr.git
cd kjhwr

# Spin up both Backend and Frontend containers
docker compose up --build -d
```
* **Frontend Cockpit:** `http://localhost:3000`
* **FastAPI Interactive Docs (Swagger):** `http://localhost:8000/docs`
* **Backend Health Check:** `http://localhost:8000/health`

---

## Local Development (Without Docker)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the local development instance.

---

## API Endpoints

### `GET /api/v1/forecast/evaluation`
Parameters:
* `target_date` (string, `YYYY-MM-DD`): Delivery day in January 2026.
* `gate_hour` (int, `0-23`): Day $D-1$ gate closure hour (Default: `11`).
* `client_demand_mw` (float): Total retail demand load in MW.

Sample response:
```json
{
  "selected_date": "2026-01-15",
  "gate_cutoff_used": "2026-01-14T11:00:00",
  "metrics": {
    "mae_mw": 842.12,
    "rmse_mw": 1054.34,
    "mape_percent": 6.84,
    "bias_mpe_percent": 1.25,
    "nmae_capacity_percent": 2.81,
    "p10_error_mw": -1240.5,
    "p90_error_mw": 980.2,
    "total_periods_evaluated": 48
  }
}
```

---

## Video Presentation Scripts (Strictly < 10 Minutes Total)

### Part 1: Client Business Pitch (Max 5 Minutes)
**Target Audience:** Head of Day-Ahead Power Trading & Portfolio Managers at a UK Energy Utility  
**Key themes:** Lookahead bias elimination, 11:00 AM auction cutoff, automated residual thermal procurement sizing, cash-out penalty minimization.

### Part 2: Technical Lead Architecture Review (Max 5 Minutes)
**Target Audience:** Internal Technical Lead / Principal Architect  
**Key themes:** Vector-accelerated Pandas as-of join algorithm, httpx asynchronous streaming, Pydantic V2 static contracts, two-stage Docker builds with Nginx reverse proxy.

---

## AI Usage Disclosure
In compliance with project requirements, AI-assisted development tools (Large Language Models) were utilized during the development of this prototype to generate boilerplate schema mappings, synthesize synoptic wind timeseries algorithms, and assist in drafting front-end Tailwind UI layouts. All financial logic, market clearing rules, statistical metrics, and system integration points were engineered, verified, and audited by the lead developer.
