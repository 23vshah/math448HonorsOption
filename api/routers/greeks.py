"""Greeks API endpoints."""

from typing import List

from fastapi import APIRouter, HTTPException

from api.schemas import (
    GreeksRequest,
    GreeksResponse,
    GreeksSensitivityRequest,
    GreeksSensitivityResponse,
    GreeksSensitivityDataPoint,
    GreeksCompareRequest,
    GreeksCompareResponse,
    GreeksMethodCompareRequest,
    GreeksMethodCompareResponse,
    OptionConfig,
)
from pricing.greeks import calculate_all_greeks, calculate_all_greeks_comparison, delta, gamma, theta, vega, rho

router = APIRouter(prefix="/api/greeks", tags=["greeks"])


@router.post("/calculate", response_model=GreeksResponse)
async def calculate_greeks(request: GreeksRequest) -> GreeksResponse:
    """Calculate all Greeks for an option."""
    try:
        greeks = calculate_all_greeks(
            request.S0,
            request.K,
            request.r,
            request.sigma,
            request.T,
            request.option_type,
        )
        return GreeksResponse(
            delta=round(greeks["delta"], 6),
            gamma=round(greeks["gamma"], 6),
            theta=round(greeks["theta"], 6),
            vega=round(greeks["vega"], 6),
            rho=round(greeks["rho"], 6),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/sensitivity", response_model=GreeksSensitivityResponse)
async def calculate_greeks_sensitivity(request: GreeksSensitivityRequest) -> GreeksSensitivityResponse:
    """Calculate Greeks sensitivity across a parameter range."""
    try:
        # Validate parameter name
        valid_params = {"S0", "K", "r", "sigma", "T"}
        if request.parameter not in valid_params:
            raise HTTPException(
                status_code=400,
                detail=f"Parameter must be one of: {', '.join(valid_params)}",
            )

        # Create base parameters dict
        base_params = {
            "S0": request.S0,
            "K": request.K,
            "r": request.r,
            "sigma": request.sigma,
            "T": request.T,
        }

        # Generate parameter values
        min_val = request.min_value
        max_val = request.max_value
        steps = request.steps
        param_values = [min_val + (max_val - min_val) * i / (steps - 1) for i in range(steps)]

        data_points: List[GreeksSensitivityDataPoint] = []

        for param_value in param_values:
            # Update the parameter being varied
            params = base_params.copy()
            params[request.parameter] = param_value

            # Calculate Greeks
            greeks = calculate_all_greeks(
                params["S0"],
                params["K"],
                params["r"],
                params["sigma"],
                params["T"],
                request.option_type,
            )

            data_points.append(
                GreeksSensitivityDataPoint(
                    parameter_value=round(param_value, 6),
                    delta=round(greeks["delta"], 6),
                    gamma=round(greeks["gamma"], 6),
                    theta=round(greeks["theta"], 6),
                    vega=round(greeks["vega"], 6),
                    rho=round(greeks["rho"], 6),
                )
            )

        return GreeksSensitivityResponse(
            data=data_points,
            parameter_name=request.parameter,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/compare", response_model=GreeksCompareResponse)
async def compare_greeks(request: GreeksCompareRequest) -> GreeksCompareResponse:
    """Compare Greeks across multiple option configurations."""
    try:
        comparisons = []

        for option in request.options:
            greeks = calculate_all_greeks(
                option.S0,
                option.K,
                option.r,
                option.sigma,
                option.T,
                option.option_type,
            )

            comparisons.append(
                {
                    "label": option.label,
                    "S0": option.S0,
                    "K": option.K,
                    "r": option.r,
                    "sigma": option.sigma,
                    "T": option.T,
                    "option_type": option.option_type,
                    "delta": round(greeks["delta"], 6),
                    "gamma": round(greeks["gamma"], 6),
                    "theta": round(greeks["theta"], 6),
                    "vega": round(greeks["vega"], 6),
                    "rho": round(greeks["rho"], 6),
                }
            )

        return GreeksCompareResponse(comparisons=comparisons)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/compare-methods", response_model=GreeksMethodCompareResponse)
async def compare_greeks_methods(request: GreeksMethodCompareRequest) -> GreeksMethodCompareResponse:
    """Compare Greeks calculated using Black-Scholes, Binomial, and Monte Carlo methods."""
    try:
        comparison = calculate_all_greeks_comparison(
            request.S0,
            request.K,
            request.r,
            request.sigma,
            request.T,
            request.option_type,
            request.binomial_steps,
            request.mc_simulations,
            theta_period=request.theta_period,
        )
        
        # Round all values for consistency
        def round_greeks(greeks_dict: dict) -> dict:
            return {k: round(v, 6) for k, v in greeks_dict.items()}
        
        return GreeksMethodCompareResponse(
            black_scholes=round_greeks(comparison["black_scholes"]),
            binomial=round_greeks(comparison["binomial"]),
            monte_carlo=round_greeks(comparison["monte_carlo"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
