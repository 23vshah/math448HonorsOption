import os
import time
from typing import Dict, List, Tuple

import numpy as np

from pricing.black_scholes import call_price as bs_call_price
from pricing.binomial import price_european as binomial_price
from pricing.monte_carlo import mc_price_european as mc_price
from utils.plotting import loglog_convergence_plot, runtime_plot


def run_option_convergence_experiments() -> Dict[str, float]:
    """Run binomial and MC convergence experiments and save figures.

    Returns a dict with fitted slopes for each experiment.
    """
    # Common parameters
    S0 = 100.0
    K = 100.0
    r = 0.05
    sigma = 0.2
    T = 1.0

    figures_dir = os.path.join("figures")
    os.makedirs(figures_dir, exist_ok=True)

    bs_ref = bs_call_price(S0, K, r, sigma, T)

    # Binomial convergence
    binomial_N = [5, 10, 50, 100, 500, 1000, 5000]
    binomial_errors: List[float] = []
    binomial_times: List[float] = []
    for N in binomial_N:
        t0 = time.perf_counter()
        price = binomial_price(S0, K, r, sigma, T, N, option="call")
        t1 = time.perf_counter()
        binomial_times.append(t1 - t0)
        binomial_errors.append(abs(price - bs_ref))

    binomial_fig = os.path.join(figures_dir, "binomial_convergence.png")
    slope_binomial = loglog_convergence_plot(
        binomial_N,
        binomial_errors,
        title="Binomial (CRR) convergence for European call",
        outfile=binomial_fig,
    )

    # Monte Carlo convergence
    mc_N = [10**2, 10**3, 10**4, 10**5, 10**6]
    mc_errors: List[float] = []
    mc_times: List[float] = []
    for N in mc_N:
        t0 = time.perf_counter()
        # No fixed seed to allow variability across runs; set seed here for reproducibility if desired
        price, _ = mc_price(S0, K, r, sigma, T, N, option="call", seed=None, return_stderr=True)
        t1 = time.perf_counter()
        mc_times.append(t1 - t0)
        mc_errors.append(abs(price - bs_ref))

    mc_fig = os.path.join(figures_dir, "montecarlo_option_convergence.png")
    slope_mc = loglog_convergence_plot(
        mc_N,
        mc_errors,
        title="Monte Carlo option pricing convergence (European call)",
        outfile=mc_fig,
    )

    # Runtime comparison chart
    runtime_fig = os.path.join(figures_dir, "runtime_comparison.png")
    runtime_plot(
        binomial_N,
        {"Binomial": binomial_times},
        title="Runtime vs N (Binomial)",
        outfile=os.path.join(figures_dir, "runtime_binomial.png"),
    )
    runtime_plot(
        mc_N,
        {"Monte Carlo": mc_times},
        title="Runtime vs N (Monte Carlo)",
        outfile=os.path.join(figures_dir, "runtime_montecarlo.png"),
    )
    # Combined (align x by plotting both on same axes using union of Ns)
    # We will plot separately via dict by resampling onto union; simplest is to plot two axes separately above
    # For a combined comparison, we can just output the two plots already saved.

    return {
        "slope_binomial": float(slope_binomial),
        "slope_monte_carlo": float(slope_mc),
        "binomial_convergence": binomial_fig,
        "monte_carlo_convergence": mc_fig,
    }


if __name__ == "__main__":
    res = run_option_convergence_experiments()
    for k, v in res.items():
        print(f"{k}: {v}")


