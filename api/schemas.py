"""Pydantic schemas for request/response validation."""

from typing import Literal

from pydantic import BaseModel, Field


OptionType = Literal["call", "put"]


class PricingRequest(BaseModel):
    """Request schema for option pricing calculation."""

    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")
    binomial_steps: int = Field(default=100, ge=1, le=10000, description="Number of steps for binomial model")
    mc_simulations: int = Field(default=100000, ge=100, le=10000000, description="Number of Monte Carlo simulations")


class PricingResponse(BaseModel):
    """Response schema for option pricing calculation."""

    black_scholes: float = Field(description="Black-Scholes price")
    binomial: float = Field(description="Binomial tree price")
    monte_carlo: float = Field(description="Monte Carlo price")
    monte_carlo_stderr: float = Field(description="Monte Carlo standard error")
    comparison: dict = Field(description="Comparison metrics")


class ConvergenceRequest(BaseModel):
    """Request schema for convergence analysis."""

    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")


class ConvergenceDataPoint(BaseModel):
    """Single data point for convergence plot."""

    N: int = Field(description="Number of steps/simulations")
    log10_N: float = Field(description="Log10 of N")
    error: float = Field(description="Absolute error from Black-Scholes")
    log10_error: float = Field(description="Log10 of error")
    price: float = Field(description="Calculated price")


class ConvergenceResponse(BaseModel):
    """Response schema for convergence analysis."""

    binomial: list[ConvergenceDataPoint] = Field(description="Binomial convergence data")
    monte_carlo: list[ConvergenceDataPoint] = Field(description="Monte Carlo convergence data")
    binomial_slope: float = Field(description="Fitted slope for binomial (log-log)")
    monte_carlo_slope: float = Field(description="Fitted slope for Monte Carlo (log-log)")
    black_scholes_price: float = Field(description="Black-Scholes reference price")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    message: str = "API is running"


# Greeks schemas
class GreeksRequest(BaseModel):
    """Request schema for Greeks calculation."""

    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")


class GreeksResponse(BaseModel):
    """Response schema for Greeks calculation."""

    delta: float = Field(description="Delta: sensitivity to stock price")
    gamma: float = Field(description="Gamma: sensitivity of delta to stock price")
    theta: float = Field(description="Theta: sensitivity to time decay")
    vega: float = Field(description="Vega: sensitivity to volatility")
    rho: float = Field(description="Rho: sensitivity to interest rate")


class GreeksSensitivityRequest(BaseModel):
    """Request schema for Greeks sensitivity analysis."""

    S0: float = Field(gt=0, description="Base initial stock price")
    K: float = Field(gt=0, description="Base strike price")
    r: float = Field(ge=0, description="Base risk-free rate")
    sigma: float = Field(gt=0, description="Base volatility")
    T: float = Field(gt=0, description="Base time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")
    parameter: str = Field(description="Parameter to vary: 'S0', 'K', 'r', 'sigma', or 'T'")
    min_value: float = Field(description="Minimum value for parameter range")
    max_value: float = Field(description="Maximum value for parameter range")
    steps: int = Field(default=20, ge=5, le=100, description="Number of steps in range")


class GreeksSensitivityDataPoint(BaseModel):
    """Single data point for Greeks sensitivity plot."""

    parameter_value: float = Field(description="Value of the varied parameter")
    delta: float = Field(description="Delta value")
    gamma: float = Field(description="Gamma value")
    theta: float = Field(description="Theta value")
    vega: float = Field(description="Vega value")
    rho: float = Field(description="Rho value")


class GreeksSensitivityResponse(BaseModel):
    """Response schema for Greeks sensitivity analysis."""

    data: list[GreeksSensitivityDataPoint] = Field(description="Greeks values across parameter range")
    parameter_name: str = Field(description="Name of the varied parameter")


class OptionConfig(BaseModel):
    """Configuration for a single option in comparison."""

    label: str = Field(description="Label for this option configuration")
    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")


class GreeksCompareRequest(BaseModel):
    """Request schema for comparing Greeks across multiple options."""

    options: list[OptionConfig] = Field(min_length=1, max_length=10, description="List of option configurations to compare")


class GreeksCompareResponse(BaseModel):
    """Response schema for Greeks comparison."""

    comparisons: list[dict] = Field(description="List of option configs with their Greeks values")


class GreeksMethodCompareRequest(BaseModel):
    """Request schema for comparing Greeks across pricing methods."""

    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")
    binomial_steps: int = Field(default=1000, ge=1, le=10000, description="Number of steps for binomial model")
    mc_simulations: int = Field(default=100000, ge=100, le=10000000, description="Number of Monte Carlo simulations")
    theta_period: Literal["day", "year"] = Field(default="year", description="Time period for theta: 'day' or 'year'")


class GreeksMethodCompareResponse(BaseModel):
    """Response schema for comparing Greeks across pricing methods."""

    black_scholes: dict = Field(description="Greeks from Black-Scholes method")
    binomial: dict = Field(description="Greeks from Binomial method")
    monte_carlo: dict = Field(description="Greeks from Monte Carlo method")


# Hedging schemas
class HedgingSimulateRequest(BaseModel):
    """Request schema for delta hedging simulation."""

    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")
    rebalance_freq: str = Field(description="Rebalancing frequency: 'daily', 'weekly', 'biweekly', 'monthly', or custom days")
    transaction_cost: float = Field(default=0.0, ge=0, le=0.1, description="Transaction cost as fraction (e.g., 0.001 = 0.1%)")
    num_simulations: int = Field(default=1, ge=1, le=1000, description="Number of simulation paths")
    option_contracts: int = Field(default=1, ge=1, description="Number of option contracts (100 shares per contract)")
    initial_option_position: float = Field(default=1.0, description="Initial option position (usually +1 for long one option)")


class HedgingDataPoint(BaseModel):
    """Single data point in hedging time series."""

    time: float = Field(description="Time (years from start)")
    stock_price: float = Field(description="Stock price at this time")
    delta: float = Field(description="Option delta at this time")
    hedge_shares: float = Field(description="Number of shares in hedge position")
    option_value: float = Field(description="Option value at this time")
    cash: float = Field(description="Cash balance at this time")
    portfolio_value: float = Field(description="Total portfolio value")
    pnl: float = Field(description="Profit and loss")
    cumulative_transaction_cost: float = Field(description="Cumulative transaction costs")


class HedgingTransaction(BaseModel):
    """Single rebalancing transaction."""

    time: float = Field(description="Time (years from start)")
    stock_price: float = Field(description="Stock price at transaction")
    delta: float = Field(description="Option delta at transaction")
    delta_change: float = Field(description="Change in delta from previous rebalance")
    shares_traded: float = Field(description="Number of shares bought (positive) or sold (negative)")
    total_shares: float = Field(description="Total shares held after transaction")
    trade_cost: float = Field(description="Transaction cost for this trade")
    transaction_type: str = Field(description="'buy' or 'sell'")
    transaction_pnl: float = Field(description="Realized profit/loss from this transaction")
    total_pnl: float = Field(description="Cumulative total P&L from all transactions up to this point")
    option_loss_since_last: float = Field(description="Option P&L since last transaction (positive = gain for short option, negative = loss)")
    portfolio_pnl: float = Field(description="Total portfolio P&L at this transaction point")


class HedgingSummary(BaseModel):
    """Summary statistics for hedging simulation."""

    total_pnl: float = Field(description="Total profit and loss")
    final_pnl: float = Field(description="Final profit and loss (alias for total_pnl)")
    option_pnl: float = Field(description="Option profit/loss (premium received - payoff paid)")
    hedging_pnl: float = Field(description="Hedging P&L: Σ[H_{t-1}(S_t - S_{t-1})] + interest on cash")
    replication_error: float = Field(description="Replication error: Option payoff + cash_T + H_T * S_T - 0")
    total_transaction_cost: float = Field(description="Total transaction costs")
    hedging_error: float = Field(description="Hedging error (deviation from perfect hedge, alias for replication_error)")
    max_drawdown: float = Field(description="Maximum drawdown in portfolio value")
    final_portfolio_value: float = Field(description="Final portfolio value")


class HedgingSimulateResponse(BaseModel):
    """Response schema for delta hedging simulation."""

    time_series: list[HedgingDataPoint] = Field(description="Time series data for the simulation")
    transactions: list[HedgingTransaction] = Field(description="List of rebalancing transactions")
    summary: HedgingSummary = Field(description="Summary statistics")


class HedgingCompareRequest(BaseModel):
    """Request schema for comparing different hedging frequencies."""

    S0: float = Field(gt=0, description="Initial stock price")
    K: float = Field(gt=0, description="Strike price")
    r: float = Field(ge=0, description="Risk-free rate")
    sigma: float = Field(gt=0, description="Volatility")
    T: float = Field(gt=0, description="Time to maturity (years)")
    option_type: OptionType = Field(description="Option type: 'call' or 'put'")
    frequencies: list[str] = Field(min_length=1, max_length=10, description="List of rebalancing frequencies to compare")
    transaction_cost: float = Field(default=0.0, ge=0, le=0.1, description="Transaction cost as fraction")
    num_simulations: int = Field(default=100, ge=10, le=1000, description="Number of simulation paths per frequency")
    option_contracts: int = Field(default=1, ge=1, description="Number of option contracts")


class HedgingFrequencyStats(BaseModel):
    """Statistics for a single hedging frequency."""

    frequency: str = Field(description="Rebalancing frequency name")
    mean_pnl: float = Field(description="Mean final P&L across simulations")
    std_pnl: float = Field(description="Standard deviation of final P&L")
    min_pnl: float = Field(description="Minimum final P&L")
    max_pnl: float = Field(description="Maximum final P&L")
    mean_transaction_cost: float = Field(description="Mean total transaction cost")
    mean_hedging_error: float = Field(description="Mean hedging error")


class HedgingCompareResponse(BaseModel):
    """Response schema for comparing hedging frequencies."""

    comparisons: list[HedgingFrequencyStats] = Field(description="Statistics for each frequency")

