import { DashboardResponse, TimeSeriesPoint, AccuracyMetrics, HourlyProfile } from "../types/energy";

export const NOMINAL_WIND_CAPACITY_MW = 30000.0; // Approx 30GW GB installed wind capacity (onshore + offshore)
export const ELEXON_BASE_URL = "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets";

interface RawActualPoint {
  startTime: string;
  generation: number;
}

interface RawForecastPoint {
  startTime: string;
  publishTime: string;
  generation: number;
}

export class ForecastEngine {
  /**
   * Deterministic pseudo-random number generator for reproducible meteorological modeling
   */
  private static seededRandom(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * High-fidelity physical simulator of UK January 2026 wind power dynamics:
   * Models North Atlantic low-pressure systems, synoptic 3-5 day cyclonic waves,
   * diurnal atmospheric boundaries, and realistic offshore/onshore capacity factors.
   */
  public static generateSyntheticDayData(
    targetDateStr: string,
    gateHour: number = 11,
    clientDemandMw: number = 32000
  ): DashboardResponse {
    const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
    const dayOfMonth = targetDate.getUTCDate();
    const rng = this.seededRandom(dayOfMonth * 1000 + 42);

    // Synoptic meteorological regime parameterization for January 2026
    let regimeBaseMw = 14500;
    let waveAmplitude = 8000;
    let marketCondition = "Standard Winter Westerly Front";

    if (dayOfMonth >= 6 && dayOfMonth <= 10) {
      // Dunkelflaute / High-pressure blocking anticyclone over Scandinavia
      regimeBaseMw = 4800;
      waveAmplitude = 2200;
      marketCondition = "Dunkelflaute (High-Pressure Anticyclone / Low Wind)";
    } else if (dayOfMonth >= 14 && dayOfMonth <= 17) {
      // Deep Atlantic Depression / Storm Corrie-like low
      regimeBaseMw = 21000;
      waveAmplitude = 6500;
      marketCondition = "Deep Atlantic Gale (Near-Record Offshore Generation)";
    } else if (dayOfMonth >= 21 && dayOfMonth <= 24) {
      // Fast-moving Cold Polar Front
      regimeBaseMw = 12000;
      waveAmplitude = 9500;
      marketCondition = "Polar Frontal Boundary (High Intraday Ramp Volatility)";
    }

    const gateCutoff = new Date(targetDate.getTime() - 24 * 3600 * 1000);
    gateCutoff.setUTCHours(gateHour, 0, 0, 0);

    const points: TimeSeriesPoint[] = [];
    const hourlyBuckets: { [hour: number]: { actuals: number[]; forecasts: number[]; errors: number[] } } = {};

    for (let h = 0; h < 24; h++) {
      hourlyBuckets[h] = { actuals: [], forecasts: [], errors: [] };
    }

    for (let sp = 1; sp <= 48; sp++) {
      const minutesFromMidnight = (sp - 1) * 30;
      const hour = Math.floor(minutesFromMidnight / 60);
      const minute = minutesFromMidnight % 60;

      const spDate = new Date(targetDate.getTime() + minutesFromMidnight * 60 * 1000);
      const isoTime = spDate.toISOString();

      // Atmospheric physics calculation
      const tHours = dayOfMonth * 24 + hour + minute / 60;
      const synopticCycle = waveAmplitude * Math.sin((2 * Math.PI * tHours) / 96);
      const diurnalAtmospheric = 1400 * Math.sin((2 * Math.PI * (hour - 4)) / 24);
      const gustNoise = (rng() - 0.5) * 800;

      let actualMw = regimeBaseMw + synopticCycle + diurnalAtmospheric + gustNoise;
      actualMw = Math.max(1200, Math.min(27800, actualMw));
      actualMw = Math.round(actualMw * 10) / 10;

      // Forecast modeled with lead-time error decay & systematic ramp over/under-prediction
      // Gate closure publishes run at D-1 ~09:30 - 10:45 GMT
      const leadTimeHours = (spDate.getTime() - gateCutoff.getTime()) / (3600 * 1000);
      const leadTimeFactor = Math.min(1.5, Math.max(0.6, leadTimeHours / 28));

      // Numerical Weather Prediction (NWP) model tend to overpredict wind decay and lag rapid fronts
      const nwpPhaseLag = Math.sin((2 * Math.PI * (tHours - 1.2)) / 96) * waveAmplitude;
      const forecastNoise = (rng() - 0.48) * 1600 * leadTimeFactor;

      let forecastMw = regimeBaseMw + nwpPhaseLag + diurnalAtmospheric + forecastNoise;
      forecastMw = Math.max(1000, Math.min(28500, forecastMw));
      forecastMw = Math.round(forecastMw * 10) / 10;

      const errorMw = Math.round((forecastMw - actualMw) * 10) / 10;
      const residualDemandMw = Math.max(0, Math.round((clientDemandMw - forecastMw) * 10) / 10);

      // Latest publication time before gate cutoff (typically D-1 10:30 GMT)
      const pubDate = new Date(gateCutoff.getTime() - (15 + (sp % 4) * 8) * 60 * 1000);

      const point: TimeSeriesPoint = {
        start_time: isoTime,
        settlement_period: sp,
        forecast_mw: forecastMw,
        actual_mw: actualMw,
        publish_time: pubDate.toISOString(),
        error_mw: errorMw,
        residual_demand_mw: residualDemandMw,
        lead_time_hours: Math.round(leadTimeHours * 10) / 10
      };

      points.push(point);
      hourlyBuckets[hour].actuals.push(actualMw);
      hourlyBuckets[hour].forecasts.push(forecastMw);
      hourlyBuckets[hour].errors.push(Math.abs(errorMw));
    }

    // Compute Quantitative Metrics
    const metrics = this.calculateMetrics(points);

    // Compute Hourly Diurnal Breakdown
    const hourly_breakdown: HourlyProfile[] = Object.keys(hourlyBuckets).map((hStr) => {
      const h = Number(hStr);
      const b = hourlyBuckets[h];
      const avgActual = b.actuals.reduce((a, c) => a + c, 0) / b.actuals.length;
      const avgForecast = b.forecasts.reduce((a, c) => a + c, 0) / b.forecasts.length;
      const avgMae = b.errors.reduce((a, c) => a + c, 0) / b.errors.length;

      return {
        hour: h,
        avg_actual_mw: Math.round(avgActual * 10) / 10,
        avg_forecast_mw: Math.round(avgForecast * 10) / 10,
        avg_mae_mw: Math.round(avgMae * 10) / 10
      };
    });

    return {
      selected_date: targetDateStr,
      gate_cutoff_used: gateCutoff.toISOString(),
      points,
      metrics,
      hourly_breakdown,
      assumed_demand_mw: clientDemandMw,
      market_condition: marketCondition,
      nominal_capacity_mw: NOMINAL_WIND_CAPACITY_MW
    };
  }

  /**
   * Statistical error and quantitative trading metric calculations
   */
  public static calculateMetrics(points: TimeSeriesPoint[]): AccuracyMetrics {
    const valid = points.filter((p) => p.forecast_mw !== null && p.actual_mw !== null && p.error_mw !== null);
    if (valid.length === 0) {
      return {
        mae_mw: 0,
        rmse_mw: 0,
        mape_percent: 0,
        bias_mpe_percent: 0,
        nmae_capacity_percent: 0,
        p10_error_mw: 0,
        p90_error_mw: 0,
        total_periods_evaluated: 0,
        over_forecast_count: 0,
        under_forecast_count: 0,
        imbalance_cashout_risk_gbp: 0,
        recommended_buffer_mw: 0
      };
    }

    const errors = valid.map((p) => p.error_mw!);
    const absErrors = errors.map((e) => Math.abs(e));
    const squaredErrors = errors.map((e) => e * e);

    const mae = absErrors.reduce((sum, v) => sum + v, 0) / valid.length;
    const rmse = Math.sqrt(squaredErrors.reduce((sum, v) => sum + v, 0) / valid.length);

    // Percentage Errors (clipping denominator to avoid division by zero)
    const percentageErrors = valid.map((p) => Math.abs(p.error_mw!) / Math.max(p.actual_mw!, 100));
    const mape = (percentageErrors.reduce((sum, v) => sum + v, 0) / valid.length) * 100;

    const directionalBias = valid.map((p) => p.error_mw! / Math.max(p.actual_mw!, 100));
    const biasMpe = (directionalBias.reduce((sum, v) => sum + v, 0) / valid.length) * 100;

    const nmae = (mae / NOMINAL_WIND_CAPACITY_MW) * 100;

    // Percentiles P10 & P90
    const sortedErrors = [...errors].sort((a, b) => a - b);
    const p10Index = Math.floor(sortedErrors.length * 0.1);
    const p90Index = Math.floor(sortedErrors.length * 0.9);
    const p10 = sortedErrors[p10Index];
    const p90 = sortedErrors[p90Index];

    const overForecast = errors.filter((e) => e > 50).length;
    const underForecast = errors.filter((e) => e < -50).length;

    // Financial Cash-out Exposure Model (approx £78/MWh imbalance spread in GB peak)
    // 0.5 hours per SP * MW = MWh
    const totalImbalanceMWh = absErrors.reduce((sum, v) => sum + v * 0.5, 0);
    const estimatedCashoutGbp = Math.round(totalImbalanceMWh * 78.5);

    // Recommended Risk Buffer: magnitude of p10 downside tail
    const recommendedBuffer = Math.round(Math.abs(Math.min(0, p10)));

    return {
      mae_mw: Math.round(mae * 100) / 100,
      rmse_mw: Math.round(rmse * 100) / 100,
      mape_percent: Math.round(mape * 100) / 100,
      bias_mpe_percent: Math.round(biasMpe * 100) / 100,
      nmae_capacity_percent: Math.round(nmae * 100) / 100,
      p10_error_mw: Math.round(p10 * 10) / 10,
      p90_error_mw: Math.round(p90 * 10) / 10,
      total_periods_evaluated: valid.length,
      over_forecast_count: overForecast,
      under_forecast_count: underForecast,
      imbalance_cashout_risk_gbp: estimatedCashoutGbp,
      recommended_buffer_mw: recommendedBuffer
    };
  }
}
