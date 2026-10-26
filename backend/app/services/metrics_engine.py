import numpy as np
import pandas as pd
from app.models.schemas import AccuracyMetrics, HourlyProfile
from app.config import settings

class MetricsEvaluationEngine:
    @staticmethod
    def compute_accuracy(aligned_df: pd.DataFrame) -> AccuracyMetrics:
        valid_df = aligned_df.dropna(subset=["forecast_mw", "actual_mw"]).copy()
        
        if valid_df.empty:
            return AccuracyMetrics(
                mae_mw=0, rmse_mw=0, mape_percent=0, bias_mpe_percent=0,
                nmae_capacity_percent=0, p10_error_mw=0, p90_error_mw=0,
                total_periods_evaluated=0, over_forecast_count=0, under_forecast_count=0
            )

        errors = valid_df["error_mw"].values
        actuals = valid_df["actual_mw"].values

        mae = float(np.mean(np.abs(errors)))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mape = float(np.mean(np.abs(errors / np.clip(actuals, 100, None))) * 100)
        bias = float(np.mean(errors / np.clip(actuals, 100, None)) * 100)
        nmae = (mae / settings.NOMINAL_WIND_CAPACITY_MW) * 100.0

        p10 = float(np.percentile(errors, 10))
        p90 = float(np.percentile(errors, 90))

        over_counts = int(np.sum(errors > 50.0))
        under_counts = int(np.sum(errors < -50.0))

        return AccuracyMetrics(
            mae_mw=round(mae, 2),
            rmse_mw=round(rmse, 2),
            mape_percent=round(mape, 2),
            bias_mpe_percent=round(bias, 2),
            nmae_capacity_percent=round(nmae, 2),
            p10_error_mw=round(p10, 2),
            p90_error_mw=round(p90, 2),
            total_periods_evaluated=len(valid_df),
            over_forecast_count=over_counts,
            under_forecast_count=under_counts
        )

    @staticmethod
    def compute_hourly_profiles(aligned_df: pd.DataFrame) -> list[HourlyProfile]:
        valid_df = aligned_df.dropna(subset=["forecast_mw", "actual_mw"]).copy()
        if valid_df.empty:
            return []
        
        valid_df["hour"] = valid_df["startTime"].dt.hour
        valid_df["abs_error"] = valid_df["error_mw"].abs()
        
        grouped = valid_df.groupby("hour").agg({
            "actual_mw": "mean",
            "forecast_mw": "mean",
            "abs_error": "mean"
        }).reset_index()

        return [
            HourlyProfile(
                hour=int(row["hour"]),
                avg_actual_mw=round(float(row["actual_mw"]), 1),
                avg_forecast_mw=round(float(row["forecast_mw"]), 1),
                avg_mae_mw=round(float(row["abs_error"]), 1)
            )
            for _, row in grouped.iterrows()
        ]
