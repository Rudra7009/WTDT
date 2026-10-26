from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
import pandas as pd
import logging

from app.config import settings
from app.services.elexon_client import ElexonDataClient
from app.services.forecast_engine import ForecastAlignmentEngine
from app.services.metrics_engine import MetricsEvaluationEngine
from app.models.schemas import DashboardSummaryResponse, TimeSeriesPoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_client = ElexonDataClient()

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "scope": "January 2026"}

@app.get("/api/v1/forecast/evaluation", response_model=DashboardSummaryResponse)
async def get_forecast_evaluation(
    target_date: str = Query("2026-01-15", regex=r"^\d{4}-\d{2}-\d{2}$"),
    gate_hour: int = Query(11, ge=0, le=23),
    client_demand_mw: float = Query(32000.0, ge=1000.0, le=70000.0)
):
    """
    Evaluates the renewable day-ahead forecast vs actuals for any selected day in January 2026.
    Computes residual thermal generation requirement and accuracy metrics.
    """
    try:
        parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    if parsed_date.year != 2026 or parsed_date.month != 1:
        logger.info(f"Target date {target_date} is outside January 2026, but processing within simulation bounds.")

    # 1. Fetch range covering D-1 through D+1
    start_fetch = (parsed_date - pd.Timedelta(days=2)).strftime("%Y-%m-%d")
    end_fetch = (parsed_date + pd.Timedelta(days=1)).strftime("%Y-%m-%d")

    actuals_df = await data_client.fetch_fuelhh_actuals(start_fetch, end_fetch)
    forecasts_df = await data_client.fetch_windfor_forecasts(start_fetch, end_fetch)

    # 2. Gate-closure alignment
    aligned_df, gate_cutoff = ForecastAlignmentEngine.align_day_ahead_forecast(
        actuals_df=actuals_df,
        forecasts_df=forecasts_df,
        delivery_date=parsed_date,
        gate_cutoff_hour=gate_hour
    )

    # 3. Residual Demand calculation
    aligned_df["residual_demand_mw"] = aligned_df["forecast_mw"].apply(
        lambda f: max(0.0, client_demand_mw - f) if pd.notnull(f) else None
    )

    # 4. Metrics & Profiles
    metrics = MetricsEvaluationEngine.compute_accuracy(aligned_df)
    profiles = MetricsEvaluationEngine.compute_hourly_profiles(aligned_df)

    # 5. Format response points
    points = []
    for _, r in aligned_df.iterrows():
        points.append(
            TimeSeriesPoint(
                start_time=r["startTime"],
                settlement_period=int(r["settlement_period"]),
                forecast_mw=None if pd.isna(r.get("forecast_mw")) else float(r["forecast_mw"]),
                actual_mw=None if pd.isna(r.get("actual_mw")) else float(r["actual_mw"]),
                publish_time=None if pd.isna(r.get("publishTime")) else r["publishTime"],
                error_mw=None if pd.isna(r.get("error_mw")) else float(r["error_mw"]),
                residual_demand_mw=None if pd.isna(r.get("residual_demand_mw")) else float(r["residual_demand_mw"])
            )
        )

    return DashboardSummaryResponse(
        selected_date=target_date,
        gate_cutoff_used=gate_cutoff,
        points=points,
        metrics=metrics,
        hourly_breakdown=profiles,
        assumed_demand_mw=client_demand_mw
    )
