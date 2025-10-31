import os
from typing import Dict, Iterable, List, Tuple, Union

import numpy as np
import matplotlib.pyplot as plt


def _ensure_parent_dir(path: str) -> None:
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)


def loglog_convergence_plot(
    Ns: Iterable[int],
    errors: Iterable[float],
    title: str,
    outfile: str,
    annotate_slope: bool = True,
) -> float:
    """Plot log10(error) vs log10(N) and fit slope.

    Returns the fitted slope (first coefficient of linear fit).
    """
    Ns = np.asarray(list(Ns), dtype=float)
    errs = np.asarray(list(errors), dtype=float)

    x = np.log10(Ns)
    y = np.log10(errs)
    coeffs = np.polyfit(x, y, 1)
    slope, intercept = coeffs[0], coeffs[1]

    y_fit = slope * x + intercept

    plt.figure(figsize=(6, 4))
    plt.scatter(x, y, label="data", color="tab:blue")
    plt.plot(x, y_fit, label=f"fit slope={slope:.3f}", color="tab:orange")
    plt.xlabel("log10(N)")
    plt.ylabel("log10(error)")
    plt.title(title)
    plt.legend()
    plt.grid(True, which="both", ls=":", alpha=0.5)

    _ensure_parent_dir(outfile)
    plt.tight_layout()
    plt.savefig(outfile, dpi=150)
    plt.close()

    return float(slope)


def runtime_plot(
    Ns: Iterable[int],
    times: Union[Iterable[float], Dict[str, Iterable[float]]],
    title: str,
    outfile: str,
    logy: bool = True,
) -> None:
    """Plot runtime(s) vs N.

    - If `times` is a dict[label -> series], plot multiple lines.
    - If `times` is a single series, plot one line.
    """
    Ns = list(Ns)

    plt.figure(figsize=(6, 4))

    if isinstance(times, dict):
        for label, series in times.items():
            plt.plot(Ns, list(series), marker="o", label=label)
        plt.legend()
    else:
        plt.plot(Ns, list(times), marker="o")

    plt.xlabel("N")
    plt.ylabel("time (s)")
    plt.title(title)
    plt.grid(True, which="both", ls=":", alpha=0.5)
    if logy:
        plt.yscale("log")
    plt.xscale("log")

    _ensure_parent_dir(outfile)
    plt.tight_layout()
    plt.savefig(outfile, dpi=150)
    plt.close()


