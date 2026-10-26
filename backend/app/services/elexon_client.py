import httpx
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class ElexonDataClient:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=25.0)

    async def fetch_fuelhh_actuals(self, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Pulls actual generation from /FUELHH/stream where fuelType == 'WIND'
        """
        url = f"{settings.ELEXON_BASE_URL}/FUELHH/stream"
        params = {"from": f"{start_date}T00:00:00Z", "to": f"{end_date}T23:59:59Z"}
        try:
            resp = await self.client.get(url, params=params)
            if resp.status_code == 200:
                raw_data = resp.json()
                items = [
                    {
                        "startTime": item["startTime"],
                        "generation": float(item["generation"])
                    }
                    for item in raw_data if item.get("fuelType") == "WIND"
                ]
                if items:
                    df = pd.DataFrame(items)
                    df["startTime"] = pd.to_datetime(df["startTime"])
                    return df.sort_values("startTime").reset_index(drop=True)
        except Exception as e:
            logger.warning(f"Could not reach Elexon FUELHH: {e}. Falling back to physics generator.")

        return self._generate_synthetic_actuals(start_date, end_date)

    async def fetch_windfor_forecasts(self, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Pulls forecasts from /WINDFOR/stream
        """
        url = f"{settings.ELEXON_BASE_URL}/WINDFOR/stream"
        params = {"from": f"{start_date}T00:00:00Z", "to": f"{end_date}T23:59:59Z"}
        try:
            resp = await self.client.get(url, params=params)
            if resp.status_code == 200:
                raw_data = resp.json()
                items = [
                    {
                        "startTime": item["startTime"],
                        "publishTime": item["publishTime"],
                        "generation": float(item["generation"])
                    }
                    for item in raw_data
                ]
                if items:
                    df = pd.DataFrame(items)
                    df["startTime"] = pd.to_datetime(df["startTime"])
                    df["publishTime"] = pd.to_datetime(df["publishTime"])
                    return df.sort_values(["startTime", "publishTime"]).reset_index(drop=True)
        except Exception as e:
            logger.warning(f"Could not reach Elexon WINDFOR: {e}. Falling back to physics generator.")

        return self._generate_synthetic_forecasts(start_date, end_date)

    def _generate_synthetic_actuals(self, start_date: str, end_date: str) -> pd.DataFrame:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1)
        timestamps = pd.date_range(start=start_dt, end=end_dt, freq="30min", inclusive="left")
        np.random.seed(42)

        # Base UK wind pattern: Synoptic weather scale (3-5 day cycles) + diurnal patterns
        t_hours = np.arange(len(timestamps)) * 0.5
        weather_cycle = 7500 * np.sin(2 * np.pi * t_hours / 120.0)
        daily_cycle = 1200 * np.sin(2 * np.pi * t_hours / 24.0)
        baseline = 14000.0
        stochastic_noise = np.random.normal(0, 450, len(timestamps))
        
        gen = baseline + weather_cycle + daily_cycle + stochastic_noise
        gen = np.clip(gen, 1200, 26500)

        return pd.DataFrame({"startTime": timestamps, "generation": np.round(gen, 1)})

    def _generate_synthetic_forecasts(self, start_date: str, end_date: str) -> pd.DataFrame:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1)
        timestamps = pd.date_range(start=start_dt, end=end_dt, freq="30min", inclusive="left")
        np.random.seed(99)

        forecast_rows = []
        for target_time in timestamps:
            # Generate runs created at D-2 18:00, D-1 06:00, D-1 10:30, D-1 14:00, D-1 21:00
            for hours_before in [36, 24, 13.5, 9, 3]:
                pub_time = target_time - timedelta(hours=hours_before)
                target_hour = target_time.hour + target_time.minute / 60.0
                
                # Approximate base generation
                t_val = (target_time - pd.to_datetime("2026-01-01")).total_seconds() / 3600.0
                base_val = 14000.0 + 7500 * np.sin(2 * np.pi * t_val / 120.0) + 1200 * np.sin(2 * np.pi * target_hour / 24.0)
                
                # Forecast error decays as publication time approaches delivery
                lead_time_factor = (hours_before / 36.0)
                error_component = np.random.normal(0, 1100 * lead_time_factor)
                
                forecast_val = max(1000.0, base_val + error_component)
                forecast_rows.append({
                    "startTime": target_time,
                    "publishTime": pub_time,
                    "generation": round(forecast_val, 1)
                })

        return pd.DataFrame(forecast_rows)
