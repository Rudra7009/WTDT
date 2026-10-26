import pandas as pd
from datetime import datetime, time
from typing import Tuple

class ForecastAlignmentEngine:
    @staticmethod
    def align_day_ahead_forecast(
        actuals_df: pd.DataFrame,
        forecasts_df: pd.DataFrame,
        delivery_date: datetime.date,
        gate_cutoff_hour: int = 11
    ) -> Tuple[pd.DataFrame, datetime]:
        """
        Applies strict GB Day-Ahead gate closure logic:
        For target date D, the cutoff is D-1 @ gate_cutoff_hour:00:00 UTC.
        Only forecasts with publishTime <= cutoff are eligible.
        We select the latest published forecast before that cutoff.
        """
        target_start = pd.to_datetime(delivery_date)
        target_end = target_start + pd.Timedelta(days=1)
        gate_cutoff = pd.to_datetime(delivery_date - pd.Timedelta(days=1)) + pd.Timedelta(hours=gate_cutoff_hour)

        # 1. Filter actuals for target delivery day
        day_actuals = actuals_df[
            (actuals_df["startTime"] >= target_start) & 
            (actuals_df["startTime"] < target_end)
        ].copy()
        day_actuals = day_actuals.rename(columns={"generation": "actual_mw"})

        # 2. Filter forecasts valid at gate closure
        valid_forecasts = forecasts_df[
            (forecasts_df["startTime"] >= target_start) &
            (forecasts_df["startTime"] < target_end) &
            (forecasts_df["publishTime"] <= gate_cutoff)
        ].copy()

        # Sort descending by publishTime to get the latest available forecast before gate closure
        valid_forecasts = valid_forecasts.sort_values(["startTime", "publishTime"], ascending=[True, False])
        latest_forecasts = valid_forecasts.drop_duplicates(subset=["startTime"], keep="first")
        latest_forecasts = latest_forecasts.rename(columns={"generation": "forecast_mw"})

        # 3. Outer merge to guarantee full 48 Settlement Periods
        aligned = pd.merge(day_actuals, latest_forecasts, on="startTime", how="outer")
        aligned = aligned.sort_values("startTime").reset_index(drop=True)

        # 4. Compute Settlement Period (1..48)
        aligned["settlement_period"] = ((aligned["startTime"].dt.hour * 60 + aligned["startTime"].dt.minute) // 30) + 1
        
        # 5. Calculate residual errors
        aligned["error_mw"] = aligned["forecast_mw"] - aligned["actual_mw"]
        
        return aligned, gate_cutoff
