import math
from typing import Literal

import numpy as np


OptionType = Literal["call", "put"]


def price_european(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    N: int,
    option: OptionType = "call",
) -> float:
    """Price a European option using the CRR binomial model.

    Parameters are standard; option is 'call' or 'put'.
    """
    if N <= 0:
        raise ValueError("N must be positive")
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")

    dt = T / N
    u = math.exp(sigma * math.sqrt(dt))
    d = 1.0 / u
    disc = math.exp(-r * dt)
    p = (math.exp(r * dt) - d) / (u - d)
    if not (0 <= p <= 1):
        # For extreme params, p can numerically go outside [0,1]; clamp reasonably
        p = min(1.0, max(0.0, p))

    # Asset prices at maturity
    j = np.arange(N + 1)
    S_T = S0 * (u ** j) * (d ** (N - j))

    if option == "call":
        V = np.maximum(S_T - K, 0.0)
    elif option == "put":
        V = np.maximum(K - S_T, 0.0)
    else:
        raise ValueError("option must be 'call' or 'put'")

    # Backward induction
    for _ in range(N, 0, -1):
        V = disc * (p * V[1:] + (1 - p) * V[:-1])

    return float(V[0])


