"""Pricing API endpoints."""

import math
from typing import List

import numpy as np
from fastapi import APIRouter, HTTPException

from api.schemas import (
    ConvergenceRequest,
    ConvergenceResponse,
    ConvergenceDataPoint,
    PricingRequest,
    PricingResponse,
)
from pricing import bs_call_price, bs_put_price, binomial_price, mc_price

router = APIRouter(prefix="/api/pricing", tags=["pricing"])


@router.post("/calculate", response_model=PricingResponse)
async def calculate_pricing(request: PricingRequest) -> PricingResponse:
    """Calculate option prices using all three pricing methods."""
    try:
        # Black-Scholes pricing
        if request.option_type == "call":
            bs_price = bs_call_price(request.S0, request.K, request.r, request.sigma, request.T)
        else:
            bs_price = bs_put_price(request.S0, request.K, request.r, request.sigma, request.T)

        # Binomial pricing
        try:
            binomial_price_val = binomial_price(
                request.S0,
                request.K,
                request.r,
                request.sigma,
                request.T,
                request.binomial_steps,
                request.option_type,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Binomial pricing error: {str(e)}")

        # Monte Carlo pricing
        try:
            mc_price_val, mc_stderr = mc_price(
                request.S0,
                request.K,
                request.r,
                request.sigma,
                request.T,
                request.mc_simulations,
                request.option_type,
                return_stderr=True,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Monte Carlo pricing error: {str(e)}")

        # Calculate comparison metrics
        binomial_diff = abs(binomial_price_val - bs_price)
        mc_diff = abs(mc_price_val - bs_price)
        binomial_pct_diff = (binomial_diff / bs_price * 100) if bs_price > 0 else 0
        mc_pct_diff = (mc_diff / bs_price * 100) if bs_price > 0 else 0

        comparison = {
            "binomial_diff": round(binomial_diff, 6),
            "monte_carlo_diff": round(mc_diff, 6),
            "binomial_pct_diff": round(binomial_pct_diff, 4),
            "monte_carlo_pct_diff": round(mc_pct_diff, 4),
        }

        return PricingResponse(
            black_scholes=round(bs_price, 6),
            binomial=round(binomial_price_val, 6),
            monte_carlo=round(mc_price_val, 6),
            monte_carlo_stderr=round(mc_stderr, 6),
            comparison=comparison,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/convergence", response_model=ConvergenceResponse)
async def calculate_convergence(request: ConvergenceRequest) -> ConvergenceResponse:
    """Calculate convergence data for binomial and Monte Carlo methods."""
    try:
        # Get Black-Scholes reference price
        if request.option_type == "call":
            bs_price = bs_call_price(request.S0, request.K, request.r, request.sigma, request.T)
        else:
            bs_price = bs_put_price(request.S0, request.K, request.r, request.sigma, request.T)

        # Binomial convergence: use a range of steps
        binomial_Ns = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
        binomial_data: List[ConvergenceDataPoint] = []

        for N in binomial_Ns:
            try:
                price = binomial_price(
                    request.S0,
                    request.K,
                    request.r,
                    request.sigma,
                    request.T,
                    N,
                    request.option_type,
                )
                error = abs(price - bs_price)
                if error > 0:
                    log10_error = math.log10(error)
                else:
                    log10_error = -10  # Very small error, use a floor value
                
                binomial_data.append(
                    ConvergenceDataPoint(
                        N=N,
                        log10_N=math.log10(N),
                        error=error,
                        log10_error=log10_error,
                        price=price,
                    )
                )
            except ValueError:
                # Skip invalid N values
                continue

        # Calculate binomial slope
        if len(binomial_data) >= 2:
            x_binomial = [point.log10_N for point in binomial_data]
            y_binomial = [point.log10_error for point in binomial_data]
            coeffs_binomial = np.polyfit(x_binomial, y_binomial, 1)
            binomial_slope = float(coeffs_binomial[0])
        else:
            binomial_slope = 0.0

        # Monte Carlo convergence: use a range of simulations
        mc_Ns = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000]
        mc_data: List[ConvergenceDataPoint] = []

        for N in mc_Ns:
            try:
                price, _ = mc_price(
                    request.S0,
                    request.K,
                    request.r,
                    request.sigma,
                    request.T,
                    N,
                    request.option_type,
                    return_stderr=True,
                )
                error = abs(price - bs_price)
                if error > 0:
                    log10_error = math.log10(error)
                else:
                    log10_error = -10  # Very small error, use a floor value
                
                mc_data.append(
                    ConvergenceDataPoint(
                        N=N,
                        log10_N=math.log10(N),
                        error=error,
                        log10_error=log10_error,
                        price=price,
                    )
                )
            except ValueError:
                # Skip invalid N values
                continue

        # Calculate Monte Carlo slope
        if len(mc_data) >= 2:
            x_mc = [point.log10_N for point in mc_data]
            y_mc = [point.log10_error for point in mc_data]
            coeffs_mc = np.polyfit(x_mc, y_mc, 1)
            mc_slope = float(coeffs_mc[0])
        else:
            mc_slope = 0.0

        return ConvergenceResponse(
            binomial=binomial_data,
            monte_carlo=mc_data,
            binomial_slope=round(binomial_slope, 4),
            monte_carlo_slope=round(mc_slope, 4),
            black_scholes_price=round(bs_price, 6),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

