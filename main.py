import os

from experiments.convergence_plots import run_option_convergence_experiments
from experiments.montecarlo_pi import run_pi_convergence_experiment
from pricing.black_scholes import bs_test_case


def main() -> None:
    os.makedirs("figures", exist_ok=True)

    # Sanity check Black–Scholes reference values
    bs_vals = bs_test_case()
    print("Black–Scholes test case (S0=K=100, r=0.05, sigma=0.2, T=1):")
    print(f"  Call: {bs_vals['call']:.6f}")
    print(f"  Put : {bs_vals['put']:.6f}")

    option_results = run_option_convergence_experiments()
    print("\nOption convergence results:")
    print(f"  Binomial slope:      {option_results['slope_binomial']:.3f}")
    print(f"  Monte Carlo slope:   {option_results['slope_monte_carlo']:.3f}")
    print(f"  Binomial plot:       {option_results['binomial_convergence']}")
    print(f"  MC option plot:      {option_results['monte_carlo_convergence']}")

    pi_results = run_pi_convergence_experiment()
    print("\nPi convergence result:")
    print(f"  MC π slope:          {pi_results['slope_pi']:.3f}")
    print(f"  π convergence plot:  {pi_results['pi_convergence']}")


if __name__ == "__main__":
    main()


