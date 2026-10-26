export interface TimeSeriesPoint {
  start_time: string;
  settlement_period: number;
  forecast_mw: number | null;
  actual_mw: number | null;
  publish_time: string | null;
  error_mw: number | null;
  residual_demand_mw: number | null;
  lead_time_hours?: number;
}

export interface AccuracyMetrics {
  mae_mw: number;
  rmse_mw: number;
  mape_percent: number;
  bias_mpe_percent: number;
  nmae_capacity_percent: number;
  p10_error_mw: number;
  p90_error_mw: number;
  total_periods_evaluated: number;
  over_forecast_count: number;
  under_forecast_count: number;
  imbalance_cashout_risk_gbp?: number;
  recommended_buffer_mw?: number;
}

export interface HourlyProfile {
  hour: number;
  avg_actual_mw: number;
  avg_forecast_mw: number;
  avg_mae_mw: number;
}

export interface DashboardResponse {
  selected_date: string;
  gate_cutoff_used: string;
  points: TimeSeriesPoint[];
  metrics: AccuracyMetrics;
  hourly_breakdown: HourlyProfile[];
  assumed_demand_mw: number;
  market_condition?: string;
  nominal_capacity_mw: number;
}

export interface PresetScenario {
  date: string;
  label: string;
  description: string;
  tag: string;
  recommendedDemand: number;
}
