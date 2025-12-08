"""Analysis tools for comparing different delta hedging strategies."""

from typing import List, Literal

import numpy as np

from .delta_hedging import simulate_delta_hedging

OptionType = Literal["call", "put"]


def compare_hedging_frequencies(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    option_type: OptionType,
    frequencies: List[str],
    transaction_cost: float = 0.0,
    num_simulations: int = 100,
    option_contracts: int = 1,
) -> List[dict]:
    """Compare hedging effectiveness across different rebalancing frequencies.
    
    Args:
        S0: Initial stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
        frequencies: List of rebalancing frequencies to compare
        transaction_cost: Transaction cost as fraction
        num_simulations: Number of simulation paths per frequency
        option_contracts: Number of option contracts
    
    Returns:
        List of dictionaries with statistics for each frequency
    """
    results = []
    
    for freq in frequencies:
        pnl_list = []
        transaction_cost_list = []
        hedging_error_list = []
        
        # Run multiple simulations
        for sim_idx in range(num_simulations):
            result = simulate_delta_hedging(
                S0=S0,
                K=K,
                r=r,
                sigma=sigma,
                T=T,
                option_type=option_type,
                rebalance_freq=freq,
                transaction_cost=transaction_cost,
                option_contracts=option_contracts,
                seed=sim_idx,  # Use seed for reproducibility
            )
            
            summary = result["summary"]
            pnl_list.append(summary["final_pnl"])
            transaction_cost_list.append(summary["total_transaction_cost"])
            hedging_error_list.append(summary["hedging_error"])
        
        # Calculate statistics
        pnl_array = np.array(pnl_list)
        tc_array = np.array(transaction_cost_list)
        he_array = np.array(hedging_error_list)
        
        results.append({
            "frequency": freq,
            "mean_pnl": float(np.mean(pnl_array)),
            "std_pnl": float(np.std(pnl_array)),
            "min_pnl": float(np.min(pnl_array)),
            "max_pnl": float(np.max(pnl_array)),
            "mean_transaction_cost": float(np.mean(tc_array)),
            "mean_hedging_error": float(np.mean(he_array)),
        })
    
    return results
