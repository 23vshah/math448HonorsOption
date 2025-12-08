"use client";

import { compareGreeksMethods } from "@/lib/api";
import type { PricingRequest, GreeksMethodCompareResponse } from "@/lib/types";
import { useState, useEffect } from "react";

interface GreeksDisplayProps {
  baseParams: PricingRequest;
}

const greekDescriptions: Record<string, (thetaPeriod: "day" | "year") => string> = {
  delta: () => "Sensitivity to stock price changes. Measures how much the option price changes for a $1 change in stock price.",
  gamma: () => "Sensitivity of delta to stock price changes. Measures the rate of change of delta.",
  theta: (thetaPeriod) => `Sensitivity to time decay. Typically negative, shows how much the option loses value per ${thetaPeriod}.`,
  vega: () => "Sensitivity to volatility changes. Shows how much the option price changes for a 1% change in volatility (per 1% vol change).",
  rho: () => "Sensitivity to interest rate changes. Shows how much the option price changes for a 1% change in interest rate (per 1% rate change).",
};

const methodColors = {
  black_scholes: "text-blue-600",
  binomial: "text-green-600",
  monte_carlo: "text-purple-600",
};

const methodLabels = {
  black_scholes: "Black-Scholes",
  binomial: "Binomial",
  monte_carlo: "Monte Carlo",
};

export default function GreeksDisplay({ baseParams }: GreeksDisplayProps) {
  const [comparison, setComparison] = useState<GreeksMethodCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thetaPeriod, setThetaPeriod] = useState<"day" | "year">("year");

  useEffect(() => {
    const fetchGreeks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const request = {
          S0: baseParams.S0,
          K: baseParams.K,
          r: baseParams.r,
          sigma: baseParams.sigma,
          T: baseParams.T,
          option_type: baseParams.option_type,
          binomial_steps: baseParams.binomial_steps,
          mc_simulations: baseParams.mc_simulations,
          theta_period: thetaPeriod,
        };
        const result = await compareGreeksMethods(request);
        setComparison(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to calculate Greeks");
      } finally {
        setIsLoading(false);
      }
    };

    if (baseParams) {
      fetchGreeks();
    }
  }, [baseParams, thetaPeriod]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Option Greeks Comparison</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating Greeks across all methods...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Option Greeks Comparison</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const greekNames = ["delta", "gamma", "theta", "vega", "rho"] as const;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Option Greeks Comparison</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="theta-period" className="text-sm text-gray-900">
            Theta period:
          </label>
          <select
            id="theta-period"
            value={thetaPeriod}
            onChange={(e) => setThetaPeriod(e.target.value as "day" | "year")}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="year">Per Year</option>
            <option value="day">Per Day</option>
          </select>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Comparing Greeks calculated using Black-Scholes (analytical), Binomial (finite differences), and Monte Carlo (finite differences) methods.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Greek
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Black-Scholes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Binomial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monte Carlo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {greekNames.map((greekName) => {
              const bsValue = comparison.black_scholes[greekName];
              const binValue = comparison.binomial[greekName];
              const mcValue = comparison.monte_carlo[greekName];
              
              // Calculate percentage differences (handle zero reference)
              const binPctDiff = Math.abs(bsValue) > 1e-10 
                ? (Math.abs(binValue - bsValue) / Math.abs(bsValue)) * 100 
                : 0;
              const mcPctDiff = Math.abs(bsValue) > 1e-10 
                ? (Math.abs(mcValue - bsValue) / Math.abs(bsValue)) * 100 
                : 0;
              
              return (
                <tr key={greekName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{greekName}</div>
                      <div className="text-xs text-gray-500">{greekDescriptions[greekName](thetaPeriod)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${methodColors.black_scholes}`}>
                      {bsValue >= 0 ? "+" : ""}
                      {bsValue.toFixed(6)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`text-sm font-semibold ${methodColors.binomial}`}>
                        {binValue >= 0 ? "+" : ""}
                        {binValue.toFixed(6)}
                      </span>
                      <div className="text-xs text-gray-500">
                        Diff: {binPctDiff.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`text-sm font-semibold ${methodColors.monte_carlo}`}>
                        {mcValue >= 0 ? "+" : ""}
                        {mcValue.toFixed(6)}
                      </span>
                      <div className="text-xs text-gray-500">
                        Diff: {mcPctDiff.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
