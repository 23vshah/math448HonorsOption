"use client";

import type { PricingResponse } from "@/lib/types";

interface ResultsDisplayProps {
  results: PricingResponse | null;
  isLoading?: boolean;
}

export default function ResultsDisplay({ results, isLoading }: ResultsDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pricing Results</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating prices...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pricing Results</h2>
        <p className="text-gray-500 text-center py-8">
          Enter parameters and click "Calculate Prices" to see results
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pricing Results</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Pricing Method
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                Price
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                Difference from BS
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                % Difference
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                Additional Info
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800">
                Black-Scholes
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-600">
                ${results.black_scholes.toFixed(4)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                —
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                —
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-500">
                Analytical formula
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800">
                Binomial Tree
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-green-600">
                ${results.binomial.toFixed(4)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                ${results.comparison.binomial_diff.toFixed(4)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                {results.comparison.binomial_pct_diff.toFixed(2)}%
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-500">
                CRR model
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800">
                Monte Carlo
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-purple-600">
                ${results.monte_carlo.toFixed(4)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                ${results.comparison.monte_carlo_diff.toFixed(4)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                {results.comparison.monte_carlo_pct_diff.toFixed(2)}%
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-500">
                SE: ±${results.monte_carlo_stderr.toFixed(4)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            • Black-Scholes provides the analytical benchmark price
          </li>
          <li>
            • Binomial Tree: {results.comparison.binomial_diff < 0.01 
              ? "Excellent agreement" 
              : results.comparison.binomial_diff < 0.1 
              ? "Good agreement" 
              : "Moderate agreement"} with Black-Scholes
          </li>
          <li>
            • Monte Carlo: {results.comparison.monte_carlo_diff < 0.01 
              ? "Excellent agreement" 
              : results.comparison.monte_carlo_diff < 0.1 
              ? "Good agreement" 
              : "Moderate agreement"} with Black-Scholes (standard error: ${results.monte_carlo_stderr.toFixed(4)})
          </li>
        </ul>
      </div>
    </div>
  );
}

