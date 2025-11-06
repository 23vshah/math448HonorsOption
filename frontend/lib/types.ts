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

