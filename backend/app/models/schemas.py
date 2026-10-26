from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class TimeSeriesPoint(BaseModel):
    start_time: datetime
    settlement_period: int
    forecast_mw: Optional[float] = None
    actual_mw: Optional[float] = None
    publish_time: Optional[datetime] = None
    error_mw: Optional[float] = None
    residual_demand_mw: Optional[float] = None

class AccuracyMetrics(BaseModel):
    mae_mw: float
    rmse_mw: float
    mape_percent: float
    bias_mpe_percent: float
    nmae_capacity_percent: float
    p10_error_mw: float
    p90_error_mw: float
    total_periods_evaluated: int
    over_forecast_count: int
    under_forecast_count: int

class HourlyProfile(BaseModel):
    hour: int
    avg_actual_mw: float
    avg_forecast_mw: float
    avg_mae_mw: float

class DashboardSummaryResponse(BaseModel):
    selected_date: str
    gate_cutoff_used: datetime
    points: List[TimeSeriesPoint]
    metrics: AccuracyMetrics
    hourly_breakdown: List[HourlyProfile]
    assumed_demand_mw: float
