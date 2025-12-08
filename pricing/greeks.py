"""Greeks calculation for Black-Scholes, Binomial, and Monte Carlo options.

This module provides:
- Analytical formulas for Black-Scholes Greeks
- Numerical (finite difference) Greeks for Binomial and Monte Carlo methods
"""

import math
from typing import Literal, Optional

import numpy as np
from scipy.stats import norm

from .black_scholes import _d1, _d2
from .binomial import price_european as binomial_price
from .monte_carlo import mc_price_european as mc_price

OptionType = Literal["call", "put"]


def delta(S0: float, K: float, r: float, sigma: float, T: float, option_type: OptionType) -> float:
    """Calculate option delta (sensitivity to stock price changes).
    
    Delta measures the rate of change of the option price with respect to
    changes in the underlying asset's price.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
    
    Returns:
        Delta value (call: 0 to 1, put: -1 to 0)
    """
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")
    
    d1_val = _d1(S0, K, r, sigma, T)
    
    if option_type == "call":
        return norm.cdf(d1_val)
    elif option_type == "put":
        return norm.cdf(d1_val) - 1.0
    else:
        raise ValueError("option_type must be 'call' or 'put'")


def gamma(S0: float, K: float, r: float, sigma: float, T: float) -> float:
    """Calculate option gamma (sensitivity of delta to stock price changes).
    
    Gamma measures the rate of change of delta with respect to changes in
    the underlying asset's price. Same for call and put options.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
    
    Returns:
        Gamma value (always positive)
    """
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")
    
    d1_val = _d1(S0, K, r, sigma, T)
    # Standard normal PDF: N'(x) = (1/sqrt(2*pi)) * exp(-x^2/2)
    n_prime_d1 = norm.pdf(d1_val)
    
    return n_prime_d1 / (S0 * sigma * math.sqrt(T))


def theta(S0: float, K: float, r: float, sigma: float, T: float, option_type: OptionType) -> float:
    """Calculate option theta (sensitivity to time decay).
    
    Theta measures the rate of change of the option price with respect to
    the passage of time (time decay). Typically negative (options lose value over time).
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
    
    Returns:
        Theta value (typically negative, per year)
    """
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")
    
    d1_val = _d1(S0, K, r, sigma, T)
    d2_val = _d2(d1_val, sigma, T)
    n_prime_d1 = norm.pdf(d1_val)
    
    if option_type == "call":
        theta_val = (
            -S0 * n_prime_d1 * sigma / (2 * math.sqrt(T))
            - r * K * math.exp(-r * T) * norm.cdf(d2_val)
        )
    elif option_type == "put":
        theta_val = (
            -S0 * n_prime_d1 * sigma / (2 * math.sqrt(T))
            + r * K * math.exp(-r * T) * norm.cdf(-d2_val)
        )
    else:
        raise ValueError("option_type must be 'call' or 'put'")
    
    return theta_val


def vega(S0: float, K: float, r: float, sigma: float, T: float) -> float:
    """Calculate option vega (sensitivity to volatility changes).
    
    Vega measures the rate of change of the option price with respect to
    changes in the volatility of the underlying asset. Same for call and put options.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
    
    Returns:
        Vega value (always positive, per 1% change in volatility)
        Note: Standard formula gives per unit change, so we divide by 100 to get per 1% change.
    """
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")
    
    d1_val = _d1(S0, K, r, sigma, T)
    n_prime_d1 = norm.pdf(d1_val)
    
    # Standard formula gives per unit change, convert to per 1% change
    return S0 * n_prime_d1 * math.sqrt(T) / 100.0


def rho(S0: float, K: float, r: float, sigma: float, T: float, option_type: OptionType) -> float:
    """Calculate option rho (sensitivity to interest rate changes).
    
    Rho measures the rate of change of the option price with respect to
    changes in the risk-free interest rate.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
    
    Returns:
        Rho value (call: positive, put: negative, per 1% change in rate)
        Note: Standard formula gives per unit change, so we divide by 100 to get per 1% change.
    """
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")
    
    d1_val = _d1(S0, K, r, sigma, T)
    d2_val = _d2(d1_val, sigma, T)
    
    # Standard formula gives per unit change, convert to per 1% change
    if option_type == "call":
        return K * T * math.exp(-r * T) * norm.cdf(d2_val) / 100.0
    elif option_type == "put":
        return -K * T * math.exp(-r * T) * norm.cdf(-d2_val) / 100.0
    else:
        raise ValueError("option_type must be 'call' or 'put'")


def calculate_all_greeks(S0: float, K: float, r: float, sigma: float, T: float, option_type: OptionType) -> dict:
    """Calculate all Greeks for an option using Black-Scholes analytical formulas.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
    
    Returns:
        Dictionary with all five Greeks: delta, gamma, theta, vega, rho
    """
    return {
        "delta": delta(S0, K, r, sigma, T, option_type),
        "gamma": gamma(S0, K, r, sigma, T),
        "theta": theta(S0, K, r, sigma, T, option_type),
        "vega": vega(S0, K, r, sigma, T),
        "rho": rho(S0, K, r, sigma, T, option_type),
    }


def calculate_binomial_greeks(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    option_type: OptionType,
    N: int = 1000,
    perturbation: float = 0.01,
) -> dict:
    """Calculate Greeks using Binomial tree with finite differences.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
        N: Number of steps in binomial tree
        perturbation: Relative perturbation for finite differences (e.g., 0.01 = 1%)
    
    Returns:
        Dictionary with all five Greeks: delta, gamma, theta, vega, rho
    """
    # Base price
    base_price = binomial_price(S0, K, r, sigma, T, N, option_type)
    
    # Delta: dV/dS
    dS = S0 * perturbation
    price_up = binomial_price(S0 + dS, K, r, sigma, T, N, option_type)
    price_down = binomial_price(S0 - dS, K, r, sigma, T, N, option_type)
    delta_val = (price_up - price_down) / (2 * dS)
    
    # Gamma: d²V/dS²
    # Use averaging of N and N+1 step trees to smooth out oscillations
    # Binomial trees can have odd-even step errors that cause jagged pricing functions
    base_price_N1 = binomial_price(S0, K, r, sigma, T, N + 1, option_type)
    price_up_N1 = binomial_price(S0 + dS, K, r, sigma, T, N + 1, option_type)
    price_down_N1 = binomial_price(S0 - dS, K, r, sigma, T, N + 1, option_type)
    
    # Average the base prices and perturbed prices from N and N+1 step trees
    base_avg = (base_price + base_price_N1) / 2.0
    price_up_avg = (price_up + price_up_N1) / 2.0
    price_down_avg = (price_down + price_down_N1) / 2.0
    
    gamma_val = (price_up_avg - 2 * base_avg + price_down_avg) / (dS * dS)
    
    # Theta: -dV/dT (negative because time decreases)
    # As time passes (T decreases), option value decreases
    # theta = -∂V/∂T where ∂V/∂T ≈ (V(T) - V(T-dT)) / dT = (base_price - price_time) / dT (positive)
    # Therefore theta = -(base_price - price_time) / dT = (price_time - base_price) / dT (negative)
    dT = max(T * perturbation, 0.001)  # Ensure positive
    price_time = binomial_price(S0, K, r, sigma, T - dT, N, option_type)
    theta_val = (price_time - base_price) / dT
    
    # Vega: dV/dσ (per 1% change in volatility)
    # Use original finite difference formula, then divide by 100 to convert to per 1% change
    dsigma = sigma * perturbation
    price_vol_up = binomial_price(S0, K, r, sigma + dsigma, T, N, option_type)
    price_vol_down = binomial_price(S0, K, r, sigma - dsigma, T, N, option_type)
    # Original formula gives per unit change, divide by 100 for per 1% change
    vega_val = (price_vol_up - price_vol_down) / (2 * dsigma) / 100.0
    
    # Rho: dV/dr (per 1% change in interest rate)
    # Use original finite difference formula, then divide by 100 to convert to per 1% change
    dr = r * perturbation if r > 0 else 0.001
    price_rate_up = binomial_price(S0, K, r + dr, sigma, T, N, option_type)
    price_rate_down = binomial_price(S0, K, r - dr, sigma, T, N, option_type)
    # Original formula gives per unit change, divide by 100 for per 1% change
    rho_val = (price_rate_up - price_rate_down) / (2 * dr) / 100.0
    
    return {
        "delta": delta_val,
        "gamma": gamma_val,
        "theta": theta_val,
        "vega": vega_val,
        "rho": rho_val,
    }


def calculate_mc_greeks(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    option_type: OptionType,
    N: int = 100000,
    perturbation: float = 0.01,
    seed: Optional[int] = None,
) -> dict:
    """Calculate Greeks using Monte Carlo with finite differences.
    
    Uses the same random seed for all calculations to ensure consistency.
    This reduces variance by using the same random numbers across all finite difference calculations.
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
        N: Number of Monte Carlo simulations
        perturbation: Relative perturbation for finite differences (e.g., 0.01 = 1%)
        seed: Random seed for reproducibility (use same seed for all calculations)
    
    Returns:
        Dictionary with all five Greeks: delta, gamma, theta, vega, rho
    """
    # Use a fixed seed if not provided to ensure reproducibility
    if seed is None:
        seed = 42
    
    # Base price
    base_price = mc_price(S0, K, r, sigma, T, N, option_type, seed=seed)
    
    # Delta: dV/dS
    dS = S0 * perturbation
    price_up = mc_price(S0 + dS, K, r, sigma, T, N, option_type, seed=seed)
    price_down = mc_price(S0 - dS, K, r, sigma, T, N, option_type, seed=seed)
    delta_val = (price_up - price_down) / (2 * dS)
    
    # Gamma: d²V/dS²
    gamma_val = (price_up - 2 * base_price + price_down) / (dS * dS)
    
    # Theta: -dV/dT (negative because time decreases)
    # As time passes (T decreases), option value decreases
    # theta = -∂V/∂T where ∂V/∂T ≈ (V(T) - V(T-dT)) / dT = (base_price - price_time) / dT (positive)
    # Therefore theta = -(base_price - price_time) / dT = (price_time - base_price) / dT (negative)
    dT = max(T * perturbation, 0.001)  # Ensure positive
    price_time = mc_price(S0, K, r, sigma, T - dT, N, option_type, seed=seed)
    theta_val = (price_time - base_price) / dT
    
    # Vega: dV/dσ (per 1% change in volatility)
    # Use original finite difference formula, then divide by 100 to convert to per 1% change
    dsigma = sigma * perturbation
    price_vol_up = mc_price(S0, K, r, sigma + dsigma, T, N, option_type, seed=seed)
    price_vol_down = mc_price(S0, K, r, sigma - dsigma, T, N, option_type, seed=seed)
    # Original formula gives per unit change, divide by 100 for per 1% change
    vega_val = (price_vol_up - price_vol_down) / (2 * dsigma) / 100.0
    
    # Rho: dV/dr (per 1% change in interest rate)
    # Use original finite difference formula with larger perturbation for stability, then divide by 100
    # Rho is particularly sensitive because it affects both drift and discount factor
    if r > 0:
        # Use at least 0.01 (1%) absolute change, or relative perturbation if larger
        dr = max(r * perturbation, 0.01)
    else:
        dr = 0.01
    # Ensure we don't go negative
    dr = min(dr, r) if r > 0 else 0.01
    price_rate_up = mc_price(S0, K, r + dr, sigma, T, N, option_type, seed=seed)
    price_rate_down = mc_price(S0, K, max(0, r - dr), sigma, T, N, option_type, seed=seed)
    # Original formula gives per unit change, divide by 100 for per 1% change
    rho_val = (price_rate_up - price_rate_down) / (2 * dr) / 100.0
    
    return {
        "delta": delta_val,
        "gamma": gamma_val,
        "theta": theta_val,
        "vega": vega_val,
        "rho": rho_val,
    }


def calculate_all_greeks_comparison(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    option_type: OptionType,
    binomial_steps: int = 1000,
    mc_simulations: int = 500000,  # Increased default for better accuracy in Greeks
    mc_seed: Optional[int] = 42,
    theta_period: Literal["day", "year"] = "year",
) -> dict:
    """Calculate Greeks using all three methods (Black-Scholes, Binomial, Monte Carlo).
    
    Args:
        S0: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
        binomial_steps: Number of steps for binomial tree
        mc_simulations: Number of Monte Carlo simulations
        mc_seed: Random seed for Monte Carlo (use same seed for all finite difference calculations)
        theta_period: Time period for theta ('day' or 'year'). Default is 'year'.
                     If 'day', theta is converted from per year to per day (divide by 365).
    
    Returns:
        Dictionary with Greeks from all three methods:
        {
            "black_scholes": {delta, gamma, theta, vega, rho},
            "binomial": {delta, gamma, theta, vega, rho},
            "monte_carlo": {delta, gamma, theta, vega, rho}
        }
    """
    bs_greeks = calculate_all_greeks(S0, K, r, sigma, T, option_type)
    binomial_greeks = calculate_binomial_greeks(S0, K, r, sigma, T, option_type, binomial_steps)
    # Use fixed seed for Monte Carlo to ensure same random numbers across all finite difference calculations
    mc_greeks = calculate_mc_greeks(S0, K, r, sigma, T, option_type, mc_simulations, seed=mc_seed)
    
    # Convert theta to per day if requested (theta is calculated per year by default)
    if theta_period == "day":
        bs_greeks["theta"] = bs_greeks["theta"] / 365.0
        binomial_greeks["theta"] = binomial_greeks["theta"] / 365.0
        mc_greeks["theta"] = mc_greeks["theta"] / 365.0
    
    return {
        "black_scholes": bs_greeks,
        "binomial": binomial_greeks,
        "monte_carlo": mc_greeks,
    }
