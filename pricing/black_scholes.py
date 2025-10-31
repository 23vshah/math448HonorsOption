import math
from dataclasses import dataclass

import numpy as np
from scipy.stats import norm


@dataclass(frozen=True)
class BSParams:
    S0: float
    K: float
    r: float
    sigma: float
    T: float


def _d1(S0: float, K: float, r: float, sigma: float, T: float) -> float:
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive for Black–Scholes")
    return (math.log(S0 / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * math.sqrt(T))


def _d2(d1: float, sigma: float, T: float) -> float:
    return d1 - sigma * math.sqrt(T)


def call_price(S0: float, K: float, r: float, sigma: float, T: float) -> float:
    d1 = _d1(S0, K, r, sigma, T)
    d2 = _d2(d1, sigma, T)
    return S0 * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)


def put_price(S0: float, K: float, r: float, sigma: float, T: float) -> float:
    d1 = _d1(S0, K, r, sigma, T)
    d2 = _d2(d1, sigma, T)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S0 * norm.cdf(-d1)


def bs_test_case() -> dict:
    """Returns Black–Scholes prices for the standard validation case.

    Case: S0=100, K=100, r=0.05, sigma=0.2, T=1.
    """
    S0 = 100.0
    K = 100.0
    r = 0.05
    sigma = 0.2
    T = 1.0
    c = call_price(S0, K, r, sigma, T)
    p = put_price(S0, K, r, sigma, T)
    return {"call": c, "put": p}


