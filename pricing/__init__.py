"""Pricing package: Black–Scholes, Binomial (CRR), Monte Carlo, Greeks, Hedging.

Modules:
- black_scholes: Closed-form Black–Scholes call/put pricing
- binomial: Cox–Ross–Rubinstein binomial tree pricing
- monte_carlo: Monte Carlo pricer for European options
- greeks: Option Greeks calculation (Delta, Gamma, Theta, Vega, Rho)
- delta_hedging: Delta hedging simulation
"""

from .black_scholes import call_price as bs_call_price, put_price as bs_put_price
from .binomial import price_european as binomial_price
from .monte_carlo import mc_price_european as mc_price
from .greeks import (
    delta,
    gamma,
    theta,
    vega,
    rho,
    calculate_all_greeks,
)

__all__ = [
    "bs_call_price",
    "bs_put_price",
    "binomial_price",
    "mc_price",
    "delta",
    "gamma",
    "theta",
    "vega",
    "rho",
    "calculate_all_greeks",
]


