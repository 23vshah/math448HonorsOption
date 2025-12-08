"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { compareHedgingFrequencies } from "@/lib/api";
import type { HedgingCompareRequest, HedgingCompareResponse, PricingRequest } from "@/lib/types";

interface HedgingFrequencyComparisonProps {
  baseParams: PricingRequest;
}

export default function HedgingFrequencyComparison({ baseParams }: HedgingFrequencyComparisonProps) {
  const [selectedFrequencies, setSelectedFrequencies] = useState<Set<string>>(
    new Set(["daily", "weekly", "biweekly", "monthly"])
  );
  const [transactionCost, setTransactionCost] = useState<number>(0.001);
  const [numSimulations, setNumSimulations] = useState<number>(100);
  const [result, setResult] = useState<HedgingCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableFrequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Biweekly" },
    { value: "monthly", label: "Monthly" },
    { value: "5", label: "Every 5 days" },
    { value: "10", label: "Every 10 days" },
  ];

  const handleCompare = async () => {
    if (selectedFrequencies.size === 0) {
      setError("Please select at least one frequency");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const request: HedgingCompareRequest = {
        S0: baseParams.S0,
        K: baseParams.K,
        r: baseParams.r,
        sigma: baseParams.sigma,
        T: baseParams.T,
        option_type: baseParams.option_type,
        frequencies: Array.from(selectedFrequencies),
        transaction_cost: transactionCost,
        num_simulations: numSimulations,
      };
      const response = await compareHedgingFrequencies(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare frequencies");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Hedging Frequency Comparison</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select Frequencies to Compare:
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
            {availableFrequencies.map((freq) => (
              <label key={freq.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFrequencies.has(freq.value)}
                  onChange={(e) => {
                    const newSet = new Set(selectedFrequencies);
                    if (e.target.checked) {
                      newSet.add(freq.value);
                    } else {
                      newSet.delete(freq.value);
                    }
                    setSelectedFrequencies(newSet);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{freq.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Transaction Cost (%):
          </label>
          <input
            type="number"
            value={transactionCost * 100}
            onChange={(e) => setTransactionCost(parseFloat(e.target.value) / 100)}
            min="0"
            max="10"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Simulations per Frequency:
          </label>
          <input
            type="number"
            value={numSimulations}
            onChange={(e) => setNumSimulations(parseInt(e.target.value) || 100)}
            min="10"
            max="1000"
            step="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={isLoading || selectedFrequencies.size === 0}
        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Comparing..." : "Compare Frequencies"}
      </button>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && result.comparisons.length > 0 && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Mean Final P&L</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.comparisons}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="frequency" />
                <YAxis label={{ value: "Mean P&L ($)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="mean_pnl" fill="#3b82f6" name="Mean P&L" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Mean Transaction Cost</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.comparisons}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="frequency" />
                <YAxis label={{ value: "Cost ($)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="mean_transaction_cost" fill="#ef4444" name="Mean Transaction Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">P&L Range (Min to Max)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.comparisons}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="frequency" />
                <YAxis label={{ value: "P&L ($)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="min_pnl" stroke="#ef4444" strokeWidth={2} name="Min P&L" />
                <Line type="monotone" dataKey="max_pnl" stroke="#10b981" strokeWidth={2} name="Max P&L" />
                <Line type="monotone" dataKey="mean_pnl" stroke="#3b82f6" strokeWidth={2} name="Mean P&L" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mean P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Std Dev P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mean Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mean Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.comparisons.map((comp, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{comp.frequency}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${comp.mean_pnl.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${comp.std_pnl.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${comp.min_pnl.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${comp.max_pnl.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${comp.mean_transaction_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${comp.mean_hedging_error.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
