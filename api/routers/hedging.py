"""Delta hedging API endpoints."""

from typing import List

from fastapi import APIRouter, HTTPException

from api.schemas import (
    HedgingSimulateRequest,
    HedgingSimulateResponse,
    HedgingDataPoint,
    HedgingTransaction,
    HedgingSummary,
    HedgingCompareRequest,
    HedgingCompareResponse,
    HedgingFrequencyStats,
)
from pricing.delta_hedging import simulate_delta_hedging
from pricing.hedging_analysis import compare_hedging_frequencies

router = APIRouter(prefix="/api/hedging", tags=["hedging"])


@router.post("/simulate", response_model=HedgingSimulateResponse)
async def simulate_hedging(request: HedgingSimulateRequest) -> HedgingSimulateResponse:
    """Simulate delta hedging for a single path."""
    try:
        result = simulate_delta_hedging(
            S0=request.S0,
            K=request.K,
            r=request.r,
            sigma=request.sigma,
            T=request.T,
            option_type=request.option_type,
            rebalance_freq=request.rebalance_freq,
            transaction_cost=request.transaction_cost,
            option_contracts=request.option_contracts,
            initial_option_position=request.initial_option_position,
        )
        
        # Convert time series to data points
        time_series = [
            HedgingDataPoint(
                time=point["time"],
                stock_price=point["stock_price"],
                delta=point["delta"],
                hedge_shares=point["hedge_shares"],
                option_value=point["option_value"],
                cash=point.get("cash", 0.0),
                portfolio_value=point["portfolio_value"],
                pnl=point["pnl"],
                cumulative_transaction_cost=point["cumulative_transaction_cost"],
            )
            for point in result["time_series"]
        ]
        
        # Convert transactions to data points
        transactions = [
            HedgingTransaction(
                time=tx["time"],
                stock_price=tx["stock_price"],
                delta=tx["delta"],
                delta_change=tx["delta_change"],
                shares_traded=tx["shares_traded"],
                total_shares=tx["total_shares"],
                trade_cost=tx["trade_cost"],
                transaction_type=tx["transaction_type"],
                transaction_pnl=tx.get("transaction_pnl", 0.0),
                total_pnl=tx.get("total_pnl", 0.0),
                option_loss_since_last=tx.get("option_loss_since_last", 0.0),
                portfolio_pnl=tx.get("portfolio_pnl", 0.0),
            )
            for tx in result.get("transactions", [])
        ]
        
        summary = HedgingSummary(
            total_pnl=result["summary"].get("total_pnl", result["summary"]["final_pnl"]),
            final_pnl=result["summary"]["final_pnl"],
            option_pnl=result["summary"]["option_pnl"],
            hedging_pnl=result["summary"].get("hedging_pnl", 0.0),
            replication_error=result["summary"].get("replication_error", result["summary"].get("hedging_error", 0.0)),
            total_transaction_cost=result["summary"]["total_transaction_cost"],
            hedging_error=result["summary"].get("hedging_error", result["summary"].get("replication_error", 0.0)),
            max_drawdown=result["summary"]["max_drawdown"],
            final_portfolio_value=result["summary"]["final_portfolio_value"],
        )
        
        return HedgingSimulateResponse(
            time_series=time_series,
            transactions=transactions,
            summary=summary,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/compare-frequencies", response_model=HedgingCompareResponse)
async def compare_frequencies(request: HedgingCompareRequest) -> HedgingCompareResponse:
    """Compare hedging effectiveness across different rebalancing frequencies."""
    try:
        results = compare_hedging_frequencies(
            S0=request.S0,
            K=request.K,
            r=request.r,
            sigma=request.sigma,
            T=request.T,
            option_type=request.option_type,
            frequencies=request.frequencies,
            transaction_cost=request.transaction_cost,
            num_simulations=request.num_simulations,
            option_contracts=request.option_contracts,
        )
        
        comparisons = [
            HedgingFrequencyStats(
                frequency=result["frequency"],
                mean_pnl=round(result["mean_pnl"], 2),
                std_pnl=round(result["std_pnl"], 2),
                min_pnl=round(result["min_pnl"], 2),
                max_pnl=round(result["max_pnl"], 2),
                mean_transaction_cost=round(result["mean_transaction_cost"], 2),
                mean_hedging_error=round(result["mean_hedging_error"], 2),
            )
            for result in results
        ]
        
        return HedgingCompareResponse(comparisons=comparisons)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
