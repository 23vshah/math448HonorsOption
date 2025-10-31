import math
from typing import Literal, Optional, Tuple, Union

import numpy as np


OptionType = Literal["call", "put"]


def mc_price_european(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    N: int,
    option: OptionType = "call",
    seed: Optional[int] = None,
    rng: Optional[np.random.Generator] = None,
    return_stderr: bool = False,
) -> Union[float, Tuple[float, float]]:
    """Monte Carlo pricing for European call/put under GBM.

    Returns price, and optionally standard error of the estimator.
    """
    if N <= 0:
        raise ValueError("N must be positive")
    if sigma < 0 or T < 0:
        raise ValueError("sigma and T must be non-negative")

    if rng is None:
        rng = np.random.default_rng(seed)

    if T == 0:
        # Immediate maturity
        ST = np.full(N, S0)
    else:
        Z = rng.standard_normal(size=N)
        drift = (r - 0.5 * sigma * sigma) * T
        diffusion = sigma * math.sqrt(T) * Z
        ST = S0 * np.exp(drift + diffusion)

    if option == "call":
        payoff = np.maximum(ST - K, 0.0)
    elif option == "put":
        payoff = np.maximum(K - ST, 0.0)
    else:
        raise ValueError("option must be 'call' or 'put'")

    discount = math.exp(-r * T) if T > 0 else 1.0
    price = discount * float(np.mean(payoff))

    if not return_stderr:
        return price

    # Standard error of discounted payoff mean
    stderr = discount * (float(np.std(payoff, ddof=1)) / math.sqrt(N))
    return price, stderr


