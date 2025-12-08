"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { compareGreeks } from "@/lib/api";
import type { GreeksCompareRequest, OptionConfig, PricingRequest } from "@/lib/types";

interface GreeksComparisonProps {
  baseParams: PricingRequest;
}

export default function GreeksComparison({ baseParams }: GreeksComparisonProps) {
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGreek, setSelectedGreek] = useState<string>("delta");

  useEffect(() => {
    const generateComparisons = async () => {
      setIsLoading(true);
      try {
        // Create pre-configured scenarios
        const scenarios: OptionConfig[] = [
          {
            label: "ITM Call",
            S0: baseParams.S0 * 1.1,
            K: baseParams.K,
            r: baseParams.r,
            sigma: baseParams.sigma,
            T: baseParams.T,
            option_type: "call",
          },
          {
            label: "ATM Call",
            S0: baseParams.S0,
            K: baseParams.K,
            r: baseParams.r,
            sigma: baseParams.sigma,
            T: baseParams.T,
            option_type: "call",
          },
          {
            label: "OTM Call",
            S0: baseParams.S0 * 0.9,
            K: baseParams.K,
            r: baseParams.r,
            sigma: baseParams.sigma,
            T: baseParams.T,
            option_type: "call",
          },
          {
            label: "ITM Put",
            S0: baseParams.S0 * 0.9,
            K: baseParams.K,
            r: baseParams.r,
            sigma: baseParams.sigma,
            T: baseParams.T,
            option_type: "put",
          },
          {
            label: "ATM Put",
            S0: baseParams.S0,
            K: baseParams.K,
            r: baseParams.r,
            sigma: baseParams.sigma,
            T: baseParams.T,
            option_type: "put",
          },
          {
            label: "OTM Put",
            S0: baseParams.S0 * 1.1,
            K: baseParams.K,
            r: baseParams.r,
            sigma: baseParams.sigma,
            T: baseParams.T,
            option_type: "put",
          },
        ];

        const request: GreeksCompareRequest = { options: scenarios };
        const response = await compareGreeks(request);
        setComparisons(response.comparisons);
      } catch (error) {
        console.error("Error comparing Greeks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (baseParams) {
      generateComparisons();
    }
  }, [baseParams]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Greeks Comparison</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating comparisons...</p>
        </div>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return null;
  }

  const greekOptions = ["delta", "gamma", "theta", "vega", "rho"];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Greeks Comparison</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Greek to Compare:
        </label>
        <select
          value={selectedGreek}
          onChange={(e) => setSelectedGreek(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {greekOptions.map((greek) => (
            <option key={greek} value={greek}>
              {greek.charAt(0).toUpperCase() + greek.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={comparisons} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toFixed(4)} />
          <Legend />
          <Bar 
            dataKey={selectedGreek} 
            fill="#3b82f6"
            name={selectedGreek.charAt(0).toUpperCase() + selectedGreek.slice(1)}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Option</th>
              {greekOptions.map((greek) => (
                <th key={greek} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {greek.charAt(0).toUpperCase() + greek.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisons.map((comp, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{comp.label}</td>
                {greekOptions.map((greek) => (
                  <td key={greek} className="px-4 py-3 text-sm text-gray-500">
                    {comp[greek].toFixed(4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
