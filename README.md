# Option Pricing Simulator

An interactive web application for comparing option pricing models: Black-Scholes, Binomial Tree (CRR), and Monte Carlo simulation. Built with FastAPI backend and Next.js frontend.

## Features

- **Multi-Model Comparison**: Compare prices from Black-Scholes analytical formula, Binomial Tree model, and Monte Carlo simulation
- **Interactive Parameter Input**: Adjust option parameters (S₀, K, r, σ, T) and see real-time results
- **Visualizations**: 
  - Bar chart comparing all three pricing methods
  - Parameter sensitivity analysis with interactive line charts
- **Detailed Results**: View prices, differences, percentage differences, and standard errors

## Project Structure

```
math448HonorsOption/
├── api/                    # FastAPI backend
│   ├── main.py            # FastAPI app with CORS
│   ├── routers/           # API route handlers
│   │   └── pricing.py     # Pricing endpoints
│   └── schemas.py         # Pydantic models
├── pricing/               # Pricing models (backend)
│   ├── black_scholes.py   # Black-Scholes formula
│   ├── binomial.py        # Binomial tree model
│   └── monte_carlo.py     # Monte Carlo simulation
├── frontend/              # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── lib/               # Utilities and API client
└── requirements.txt       # Python dependencies
```

## Setup Instructions

### Prerequisites

- Python 3.8+ with virtual environment
- Node.js 18+ and npm

### Backend Setup

1. **Activate your virtual environment** (if not already activated):
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server**:
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/api/health`

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

### Running the Application

1. Start the backend server (in one terminal):
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```

2. Start the frontend server (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Enter Option Parameters**:
   - Initial Stock Price (S₀)
   - Strike Price (K)
   - Risk-Free Rate (r)
   - Volatility (σ)
   - Time to Maturity (T)
   - Option Type (Call/Put)
   - Binomial Steps (for binomial model)
   - Monte Carlo Simulations (for MC model)

2. **Click "Calculate Prices"** to see results from all three models

3. **View Results**:
   - Comparison table showing prices and differences
   - Bar chart visualization
   - Parameter sensitivity analysis

## API Endpoints

### POST `/api/pricing/calculate`

Calculate option prices using all three methods.

**Request Body**:
```json
{
  "S0": 100.0,
  "K": 100.0,
  "r": 0.05,
  "sigma": 0.2,
  "T": 1.0,
  "option_type": "call",
  "binomial_steps": 100,
  "mc_simulations": 100000
}
```

**Response**:
```json
{
  "black_scholes": 10.450584,
  "binomial": 10.451234,
  "monte_carlo": 10.452345,
  "monte_carlo_stderr": 0.012345,
  "comparison": {
    "binomial_diff": 0.000650,
    "monte_carlo_diff": 0.001761,
    "binomial_pct_diff": 0.0062,
    "monte_carlo_pct_diff": 0.0168
  }
}
```

### GET `/api/health`

Health check endpoint.

## Future Plans

1. **Delta Hedging Simulator**
   - Delta calculation functions
   - Portfolio rebalancing simulation
   - Hedging effectiveness visualization
   - P&L analysis

2. **Additional Features**
   - Greeks calculation (Delta, Gamma, Theta, Vega, Rho)
   - Implied volatility calculator
   - American option pricing support
   - Historical data integration
   - Export results to CSV/PDF
   - Save/load parameter presets
   - Convergence analysis visualization
   - Performance benchmarking

3. **Advanced Visualizations**
   - 3D surface plots (price vs S0 and T)
   - Interactive payoff diagrams
   - Probability distribution of Monte Carlo paths
   - Heat maps for parameter sensitivity

## Technologies Used

### Backend
- FastAPI - Modern Python web framework
- Pydantic - Data validation
- NumPy, SciPy - Numerical computations
- Uvicorn - ASGI server

### Frontend
- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Recharts - Data visualization
- Axios - HTTP client

## License

This project is part of a Math 448 Honors Option project.
