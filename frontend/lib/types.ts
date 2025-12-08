/** TypeScript interfaces for option pricing data. */

export type OptionType = "call" | "put";

export interface PricingRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
  binomial_steps: number;
  mc_simulations: number;
}

export interface PricingResponse {
  black_scholes: number;
  binomial: number;
  monte_carlo: number;
  monte_carlo_stderr: number;
  comparison: {
    binomial_diff: number;
    monte_carlo_diff: number;
    binomial_pct_diff: number;
    monte_carlo_pct_diff: number;
  };
}

export interface ConvergenceDataPoint {
  N: number;
  log10_N: number;
  error: number;
  log10_error: number;
  price: number;
}

export interface ConvergenceResponse {
  binomial: ConvergenceDataPoint[];
  monte_carlo: ConvergenceDataPoint[];
  binomial_slope: number;
  monte_carlo_slope: number;
  black_scholes_price: number;
}

export interface ConvergenceRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
}

// Greeks types
export interface GreeksRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
}

export interface GreeksResponse {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface GreeksSensitivityRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
  parameter: "S0" | "K" | "r" | "sigma" | "T";
  min_value: number;
  max_value: number;
  steps?: number;
}

export interface GreeksSensitivityDataPoint {
  parameter_value: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface GreeksSensitivityResponse {
  data: GreeksSensitivityDataPoint[];
  parameter_name: string;
}

export interface OptionConfig {
  label: string;
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
}

export interface GreeksCompareRequest {
  options: OptionConfig[];
}

export interface GreeksCompareResponse {
  comparisons: Array<{
    label: string;
    S0: number;
    K: number;
    r: number;
    sigma: number;
    T: number;
    option_type: OptionType;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  }>;
}

export interface GreeksMethodCompareRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
  binomial_steps?: number;
  mc_simulations?: number;
  theta_period?: "day" | "year";
}

export interface GreeksMethodCompareResponse {
  black_scholes: GreeksResponse;
  binomial: GreeksResponse;
  monte_carlo: GreeksResponse;
}

// Hedging types
export interface HedgingSimulateRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
  rebalance_freq: string;
  transaction_cost?: number;
  num_simulations?: number;
  option_contracts?: number;
}

export interface HedgingDataPoint {
  time: number;
  stock_price: number;
  delta: number;
  hedge_shares: number;
  option_value: number;
  portfolio_value: number;
  pnl: number;
  cumulative_transaction_cost: number;
}

export interface HedgingTransaction {
  time: number;
  stock_price: number;
  delta: number;
  delta_change: number;
  shares_traded: number;
  total_shares: number;
  trade_cost: number;
  cash?: number;
  transaction_type: "buy" | "sell";
  transaction_pnl: number;
  total_pnl: number;
  option_loss_since_last: number;
  portfolio_pnl: number;
}

export interface HedgingSummary {
  final_pnl: number;
  option_pnl: number;
  total_transaction_cost: number;
  hedging_error: number;
  max_drawdown: number;
  final_portfolio_value: number;
}

export interface HedgingSimulateResponse {
  time_series: HedgingDataPoint[];
  transactions: HedgingTransaction[];
  summary: HedgingSummary;
}

export interface HedgingCompareRequest {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  option_type: OptionType;
  frequencies: string[];
  transaction_cost?: number;
  num_simulations?: number;
  option_contracts?: number;
}

export interface HedgingFrequencyStats {
  frequency: string;
  mean_pnl: number;
  std_pnl: number;
  min_pnl: number;
  max_pnl: number;
  mean_transaction_cost: number;
  mean_hedging_error: number;
}

export interface HedgingCompareResponse {
  comparisons: HedgingFrequencyStats[];
}

