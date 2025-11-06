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

