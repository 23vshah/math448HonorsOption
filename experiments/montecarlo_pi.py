import os
import time
from typing import Dict, List

import numpy as np

from utils.plotting import loglog_convergence_plot


def run_pi_convergence_experiment() -> Dict[str, float]:
    figures_dir = os.path.join("figures")
    os.makedirs(figures_dir, exist_ok=True)

    Ns = [10**2, 10**3, 10**4, 10**5, 10**6]
    errors: List[float] = []

    # Unseeded RNG for variability between runs; set a number for reproducibility
    rng = np.random.default_rng()
    for N in Ns:
        # Generate in [-1,1]^2
        xy = rng.uniform(low=-1.0, high=1.0, size=(N, 2))
        inside = np.sum(np.sum(xy * xy, axis=1) <= 1.0)
        pi_hat = 4.0 * inside / float(N)
        errors.append(abs(pi_hat - np.pi))

    fig_path = os.path.join(figures_dir, "montecarlo_pi_convergence.png")
    slope = loglog_convergence_plot(
        Ns,
        errors,
        title="Monte Carlo π estimation convergence",
        outfile=fig_path,
    )

    return {"slope_pi": float(slope), "pi_convergence": fig_path}


if __name__ == "__main__":
    res = run_pi_convergence_experiment()
    for k, v in res.items():
        print(f"{k}: {v}")


