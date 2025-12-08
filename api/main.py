"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import pricing, greeks, hedging
from api.schemas import HealthResponse

app = FastAPI(
    title="Option Pricing API",
    description="API for calculating option prices using Black-Scholes, Binomial, and Monte Carlo methods",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pricing.router)
app.include_router(greeks.router)
app.include_router(hedging.router)


@app.get("/", response_model=HealthResponse)
async def root() -> HealthResponse:
    """Root endpoint health check."""
    return HealthResponse()


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse()

