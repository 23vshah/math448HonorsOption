"""Delta hedging simulation for options.

This module simulates daily delta hedging for either a long call option or a long put option,
given the ability to trade the underlying asset but not immediately sell the option.
"""

import math
from typing import Literal, Optional, Tuple

import numpy as np
from scipy.stats import norm

OptionType = Literal["call", "put"]


def black_scholes_price(S: float, K: float, r: float, sigma: float, tau: float, option_type: OptionType) -> float:
    """Calculate Black-Scholes option price.
    
    Args:
        S: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        tau: Time to maturity (T - t)
        option_type: 'call' or 'put'
    
    Returns:
        Option price
    """
    if sigma <= 0 or tau <= 0:
        if tau == 0:
            # At expiration
            if option_type == "call":
                return max(0, S - K)
            else:
                return max(0, K - S)
        raise ValueError("sigma and tau must be positive for Black-Scholes")
    
    # Calculate d1 and d2
    d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * tau) / (sigma * math.sqrt(tau))
    d2 = d1 - sigma * math.sqrt(tau)
    
    if option_type == "call":
        return S * norm.cdf(d1) - K * math.exp(-r * tau) * norm.cdf(d2)
    else:  # put
        return K * math.exp(-r * tau) * norm.cdf(-d2) - S * norm.cdf(-d1)


def black_scholes_delta(S: float, K: float, r: float, sigma: float, tau: float, option_type: OptionType) -> float:
    """Calculate Black-Scholes delta.
    
    Args:
        S: Current stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        tau: Time to maturity (T - t)
        option_type: 'call' or 'put'
    
    Returns:
        Delta value
    """
    if sigma <= 0 or tau <= 0:
        if tau == 0:
            # At expiration
            if option_type == "call":
                return 1.0 if S > K else 0.0
            else:  # put
                return -1.0 if S < K else 0.0
        raise ValueError("sigma and tau must be positive for Black-Scholes")
    
    # Calculate d1
    d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * tau) / (sigma * math.sqrt(tau))
    
    if option_type == "call":
        return norm.cdf(d1)
    else:  # put
        return norm.cdf(d1) - 1.0


def simulate_path(S0: float, r: float, sigma: float, T: float, dt: float, seed: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray]:
    """Generate a single stock price path using geometric Brownian motion.
    
    Formula: S_{t+Δt} = S_t * exp((r - 0.5*σ²)Δt + σ√Δt*Z) where Z ~ N(0,1)
    
    Args:
        S0: Initial stock price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        dt: Time step (years)
        seed: Random seed (optional)
    
    Returns:
        Tuple of (time_points, stock_prices)
    """
    if seed is not None:
        rng = np.random.default_rng(seed)
    else:
        rng = np.random.default_rng()
    
    # Generate time points
    num_steps = int(math.ceil(T / dt))
    time_points = np.linspace(0, T, num_steps + 1)
    
    # Generate stock prices using GBM
    Z = rng.standard_normal(size=num_steps)
    dt_actual = T / num_steps if num_steps > 0 else dt
    
    # Calculate stock prices: S_{t+Δt} = S_t * exp((r - 0.5*σ²)Δt + σ√Δt*Z)
    stock_prices = np.zeros(num_steps + 1)
    stock_prices[0] = S0
    
    for i in range(num_steps):
        stock_prices[i + 1] = stock_prices[i] * math.exp(
            (r - 0.5 * sigma * sigma) * dt_actual + sigma * math.sqrt(dt_actual) * Z[i]
        )
    
    return time_points, stock_prices


def run_delta_hedge(
    S0: float,
    K: float,
    sigma: float,
    r: float,
    T: float,
    dt: float,
    option_type: OptionType,
    N: int,
    initial_option_position: float = 1.0,
    seed: Optional[int] = None,
    transaction_cost: float = 0.0,
    option_contracts: int = 1,
) -> dict:
    """Run delta hedging simulation.
    
    Args:
        S0: Initial underlying price
        K: Strike
        sigma: Volatility
        r: Risk-free rate
        T: Time to maturity (years)
        dt: Time step (e.g., 1/252)
        option_type: "call" or "put"
        N: Number of simulation steps
        initial_option_position: Usually +1 for long one option
        seed: Random seed for path generation
        transaction_cost: Transaction cost as fraction (e.g., 0.001 = 0.1%)
        option_contracts: Number of option contracts (100 shares per contract)
    
    Returns:
        Dictionary with simulation results
    """
    # Scale by option contracts
    shares_per_contract = 100
    total_shares_underlying = option_contracts * shares_per_contract
    
    # Generate stock price path
    time_points, stock_prices = simulate_path(S0, r, sigma, T, dt, seed)
    
    # Ensure we have N+1 points (N steps)
    if len(time_points) > N + 1:
        # Downsample to N+1 points
        indices = np.linspace(0, len(time_points) - 1, N + 1, dtype=int)
        time_points = time_points[indices]
        stock_prices = stock_prices[indices]
    elif len(time_points) < N + 1:
        # This shouldn't happen, but handle it
        N = len(time_points) - 1
    
    # Calculate actual time step
    dt_actual = T / N if N > 0 else dt
    
    # Initialize arrays
    option_prices = np.zeros(N + 1)
    deltas = np.zeros(N + 1)
    hedge_positions = np.zeros(N + 1)
    cash_balances = np.zeros(N + 1)
    
    # Initial option price and delta
    tau_0 = T
    option_prices[0] = black_scholes_price(S0, K, r, sigma, tau_0, option_type) * total_shares_underlying * initial_option_position
    deltas[0] = black_scholes_delta(S0, K, r, sigma, tau_0, option_type) * initial_option_position
    
    # Initial hedge position: H_0 = -Δ_0 × (option position)
    # Since we're long the option, we take the opposite delta in the underlying
    hedge_positions[0] = -deltas[0] * total_shares_underlying
    
    # Initial cash: pay for option, receive from hedge
    # cash_0 = -initial_option_price - H_0 * S_0
    cash_balances[0] = -option_prices[0] - hedge_positions[0] * S0
    
    # Pay transaction cost on initial hedge
    if abs(hedge_positions[0]) > 1e-10:
        initial_trade_cost = abs(hedge_positions[0]) * S0 * transaction_cost
        cash_balances[0] -= initial_trade_cost
    else:
        initial_trade_cost = 0.0
    
    # Track hedging P&L: Σ[H_{t-1}(S_t - S_{t-1})]
    hedging_pnl = 0.0
    cumulative_transaction_cost = initial_trade_cost
    
    # Track cash without interest for interest calculation
    cash_without_interest = cash_balances[0]
    
    # Daily loop
    for i in range(1, N + 1):
        t = time_points[i]
        S_t = stock_prices[i]
        S_prev = stock_prices[i - 1]
        tau = max(0, T - t)
        
        # Calculate option price and delta at current stock price
        if tau > 0:
            option_prices[i] = black_scholes_price(S_t, K, r, sigma, tau, option_type) * total_shares_underlying * initial_option_position
            deltas[i] = black_scholes_delta(S_t, K, r, sigma, tau, option_type) * initial_option_position
        else:
            # At expiration
            if option_type == "call":
                option_prices[i] = max(0, S_t - K) * total_shares_underlying * initial_option_position
            else:  # put
                option_prices[i] = max(0, K - S_t) * total_shares_underlying * initial_option_position
            deltas[i] = (1.0 if (option_type == "call" and S_t > K) or (option_type == "put" and S_t < K) else 0.0) * initial_option_position
        
        # Determine hedge position needed: H_t = -Δ_t × (option position)
        required_hedge = -deltas[i] * total_shares_underlying
        
        # Apply interest on cash before rebalancing
        cash_balances[i] = cash_balances[i - 1] * math.exp(r * dt_actual)
        
        # Adjust hedge by trading underlying: ΔH_t = H_t - H_{t-1}
        hedge_adjustment = required_hedge - hedge_positions[i - 1]
        
        # Update cash: cash_t = cash_{t-1} - ΔH_t * S_t
        # (buying underlying reduces cash, selling increases)
        cash_balances[i] -= hedge_adjustment * S_t
        
        # Track cash without interest (for interest calculation)
        cash_without_interest -= hedge_adjustment * S_t
        
        # Pay transaction cost
        if abs(hedge_adjustment) > 1e-10:
            trade_cost = abs(hedge_adjustment) * S_t * transaction_cost
            cumulative_transaction_cost += trade_cost
            cash_balances[i] -= trade_cost
            cash_without_interest -= trade_cost
        
        # Update hedge position
        hedge_positions[i] = required_hedge
        
        # Track hedging P&L: Σ[H_{t-1}(S_t - S_{t-1})]
        hedging_pnl += hedge_positions[i - 1] * (S_t - S_prev)
    
    # Add interest on cash to hedging P&L
    # Interest earned = final_cash (with interest) - final_cash (without interest)
    interest_on_cash = cash_balances[-1] - cash_without_interest
    hedging_pnl += interest_on_cash
    
    # Calculate portfolio values: Π_t = option_price(t) + H_t * S_t + cash_t
    portfolio_values = np.zeros(N + 1)
    for i in range(N + 1):
        portfolio_values[i] = option_prices[i] + hedge_positions[i] * stock_prices[i] + cash_balances[i]
    
    # Calculate P&L components
    initial_portfolio_value = portfolio_values[0]
    final_portfolio_value = portfolio_values[-1]
    total_pnl = final_portfolio_value - initial_portfolio_value
    
    # Option P&L: Option payoff - Initial option price
    final_option_payoff = option_prices[-1]
    option_pnl = final_option_payoff - option_prices[0]
    
    # Final error (hedging inefficiency): Option payoff + cash_T + H_T * S_T - 0
    replication_error = final_option_payoff + cash_balances[-1] + hedge_positions[-1] * stock_prices[-1]
    
    # Build time series data
    # Track cumulative transaction cost over time
    cumulative_tx_cost_array = np.zeros(N + 1)
    cumulative_tx_cost_array[0] = initial_trade_cost
    current_tx_cost = initial_trade_cost
    
    time_series = []
    for i in range(N + 1):
        if i > 0:
            # Check if there was a transaction at this step
            if abs(hedge_positions[i] - hedge_positions[i - 1]) > 1e-10:
                trade_cost = abs(hedge_positions[i] - hedge_positions[i - 1]) * stock_prices[i] * transaction_cost
                current_tx_cost += trade_cost
            cumulative_tx_cost_array[i] = current_tx_cost
        
        time_series.append({
            "time": round(time_points[i], 6),
            "stock_price": round(stock_prices[i], 4),
            "delta": round(deltas[i], 6),
            "hedge_shares": round(hedge_positions[i], 2),
            "option_value": round(option_prices[i], 2),
            "cash": round(cash_balances[i], 2),
            "portfolio_value": round(portfolio_values[i], 2),
            "pnl": round(portfolio_values[i] - initial_portfolio_value, 2),
            "cumulative_transaction_cost": round(cumulative_tx_cost_array[i], 2),
        })
    
    # Build transactions list (rebalancing events)
    transactions = []
    cumulative_hedge_pnl = 0.0  # Track cumulative hedging P&L
    
    # Initial transaction
    if abs(hedge_positions[0]) > 1e-10:
        transactions.append({
            "time": round(time_points[0], 6),
            "stock_price": round(stock_prices[0], 4),
            "delta": round(deltas[0], 6),
            "delta_change": 0.0,
            "shares_traded": round(hedge_positions[0], 2),
            "total_shares": round(hedge_positions[0], 2),
            "trade_cost": round(initial_trade_cost, 2),
            "transaction_type": "buy" if hedge_positions[0] > 0 else "sell",
            "transaction_pnl": 0.0,  # No P&L at initial transaction
            "total_pnl": 0.0,  # No cumulative P&L yet
            "option_loss_since_last": 0.0,
            "portfolio_pnl": 0.0,
            "cash": round(cash_balances[0], 2),
        })
    
    # Subsequent transactions
    for i in range(1, N + 1):
        if abs(hedge_positions[i] - hedge_positions[i - 1]) > 1e-10:
            delta_change = deltas[i] - deltas[i - 1]
            shares_traded = hedge_positions[i] - hedge_positions[i - 1]
            trade_cost = abs(shares_traded) * stock_prices[i] * transaction_cost if abs(shares_traded) > 1e-10 else 0.0
            option_pnl_since_last = option_prices[i] - option_prices[i - 1]
            portfolio_pnl_at_tx = portfolio_values[i] - initial_portfolio_value
            
            # Transaction P&L: P&L from holding hedge position H_{t-1} from t-1 to t
            # This is: H_{t-1} * (S_t - S_{t-1})
            transaction_pnl = hedge_positions[i - 1] * (stock_prices[i] - stock_prices[i - 1])
            cumulative_hedge_pnl += transaction_pnl
            
            transactions.append({
                "time": round(time_points[i], 6),
                "stock_price": round(stock_prices[i], 4),
                "delta": round(deltas[i], 6),
                "delta_change": round(delta_change, 6),
                "shares_traded": round(shares_traded, 2),
                "total_shares": round(hedge_positions[i], 2),
                "trade_cost": round(trade_cost, 2),
                "transaction_type": "buy" if shares_traded > 0 else "sell",
                "transaction_pnl": round(transaction_pnl, 2),
                "total_pnl": round(cumulative_hedge_pnl, 2),
                "option_loss_since_last": round(option_pnl_since_last, 2),
                "portfolio_pnl": round(portfolio_pnl_at_tx, 2),
                "cash": round(cash_balances[i], 2),
            })
    
    # Calculate max drawdown
    max_drawdown = 0.0
    peak = portfolio_values[0]
    for value in portfolio_values:
        if value > peak:
            peak = value
        drawdown = peak - value
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    return {
        "time_series": time_series,
        "transactions": transactions,
        "summary": {
            "total_pnl": round(total_pnl, 2),
            "final_pnl": round(total_pnl, 2),  # Alias for compatibility
            "option_pnl": round(option_pnl, 2),
            "hedging_pnl": round(hedging_pnl, 2),
            "replication_error": round(replication_error, 2),
            "total_transaction_cost": round(cumulative_transaction_cost, 2),
            "hedging_error": round(replication_error, 2),  # Alias for compatibility
            "max_drawdown": round(max_drawdown, 2),
            "final_portfolio_value": round(final_portfolio_value, 2),
        },
    }


def _parse_rebalance_freq(freq: str, T: float) -> float:
    """Parse rebalancing frequency string to time step in years.
    
    Args:
        freq: Frequency string ('daily', 'weekly', 'biweekly', 'monthly') or number of days
        T: Time to maturity (years)
    
    Returns:
        Time step in years (dt)
    """
    freq_lower = freq.lower().strip()
    
    if freq_lower == "daily":
        return 1.0 / 252  # Trading days per year
    elif freq_lower == "weekly":
        return 1.0 / 52
    elif freq_lower == "biweekly":
        return 1.0 / 26
    elif freq_lower == "monthly":
        return 1.0 / 12
    else:
        # Try to parse as number of days
        try:
            days = float(freq)
            if days <= 0:
                raise ValueError("Days must be positive")
            return days / 252.0  # Convert days to years
        except ValueError:
            raise ValueError(f"Invalid rebalancing frequency: {freq}. Use 'daily', 'weekly', 'biweekly', 'monthly', or a number of days")


def simulate_delta_hedging(
    S0: float,
    K: float,
    r: float,
    sigma: float,
    T: float,
    option_type: OptionType,
    rebalance_freq: str,
    transaction_cost: float = 0.0,
    option_contracts: int = 1,
    initial_option_position: float = 1.0,
    seed: Optional[int] = None,
) -> dict:
    """Simulate delta hedging for a single path (API-compatible wrapper).
    
    Args:
        S0: Initial stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to maturity (years)
        option_type: 'call' or 'put'
        rebalance_freq: Rebalancing frequency ('daily', 'weekly', etc. or days)
        transaction_cost: Transaction cost as fraction (e.g., 0.001 = 0.1%)
        option_contracts: Number of option contracts (100 shares per contract)
        initial_option_position: Usually +1 for long one option
        seed: Random seed for stock path generation
    
    Returns:
        Dictionary with time series data and summary statistics
    """
    # Parse rebalancing frequency
    dt = _parse_rebalance_freq(rebalance_freq, T)
    
    # Calculate number of steps
    N = int(math.ceil(T / dt))
    
    # Run the hedging simulation
    return run_delta_hedge(
        S0=S0,
        K=K,
        sigma=sigma,
        r=r,
        T=T,
        dt=dt,
        option_type=option_type,
        N=N,
        initial_option_position=initial_option_position,
        seed=seed,
        transaction_cost=transaction_cost,
        option_contracts=option_contracts,
    )


def main() -> None:
    """Example run of delta hedging simulation."""
    # Example parameters
    S0 = 100.0
    K = 100.0
    r = 0.05
    sigma = 0.2
    T = 1.0
    dt = 1.0 / 252  # Daily
    option_type = "call"
    N = 252  # Daily for 1 year
    initial_option_position = 1.0
    
    print("Delta Hedging Simulation Example")
    print("=" * 50)
    print(f"S0: ${S0:.2f}")
    print(f"K: ${K:.2f}")
    print(f"r: {r:.2%}")
    print(f"sigma: {sigma:.2%}")
    print(f"T: {T:.2f} years")
    print(f"dt: {dt:.6f} years (daily)")
    print(f"Option type: {option_type}")
    print(f"Initial option position: {initial_option_position}")
    print()
    
    result = run_delta_hedge(
        S0=S0,
        K=K,
        sigma=sigma,
        r=r,
        T=T,
        dt=dt,
        option_type=option_type,
        N=N,
        initial_option_position=initial_option_position,
        seed=42,
    )
    
    print("Results:")
    print(f"  Total P&L: ${result['summary']['total_pnl']:.2f}")
    print(f"  Option P&L: ${result['summary']['option_pnl']:.2f}")
    print(f"  Hedging P&L: ${result['summary']['hedging_pnl']:.2f}")
    print(f"  Replication Error: ${result['summary']['replication_error']:.2f}")
    print(f"  Final Portfolio Value: ${result['summary']['final_portfolio_value']:.2f}")
    print()
    print(f"Number of time steps: {len(result['time_series'])}")
    print(f"Number of transactions: {len(result['transactions'])}")


if __name__ == "__main__":
    main()
