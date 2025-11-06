"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculatePricing } from "@/lib/api";
import type { PricingRequest, PricingResponse } from "@/lib/types";

interface ParameterSensitivityProps {
  baseParams: PricingRequest;
}

type ParameterName = "S0" | "K" | "r" | "sigma" | "T";

export default function ParameterSensitivity({ baseParams }: ParameterSensitivityProps) {
  const [selectedParam, setSelectedParam] = useState<ParameterName>("S0");
  const [range, setRange] = useState<[number, number]>([50, 150]);
  const [data, setData] = useState<Array<{
    value: number;
    black_scholes: number;
    binomial: number;
    monte_carlo: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const baseParamsRef = useRef(baseParams);

  const paramConfig: Record<ParameterName, { label: string; step: number; min: number; max: number }> = {
    S0: { label: "Stock Price (S₀)", step: 5, min: 10, max: 500 },
    K: { label: "Strike Price (K)", step: 5, min: 10, max: 500 },
    r: { label: "Risk-Free Rate (r)", step: 0.01, min: 0, max: 0.5 },
    sigma: { label: "Volatility (σ)", step: 0.05, min: 0.05, max: 1.0 },
    T: { label: "Time to Maturity (T)", step: 0.1, min: 0.1, max: 5.0 },
  };

  useEffect(() => {
    baseParamsRef.current = baseParams;
    const config = paramConfig[selectedParam];
    setRange([
      Math.max(config.min, baseParams[selectedParam] * 0.5),
      Math.min(config.max, baseParams[selectedParam] * 1.5),
    ]);
  }, [selectedParam, baseParams]);

  const generateSensitivityData = useCallback(async () => {
    setIsLoading(true);
    const config = paramConfig[selectedParam];
    const steps = 10;
    const stepSize = (range[1] - range[0]) / steps;
    const values = Array.from({ length: steps + 1 }, (_, i) => 
      range[0] + i * stepSize
    );

    const results: Array<{
      value: number;
      black_scholes: number;
      binomial: number;
      monte_carlo: number;
    }> = [];

    for (const value of values) {
      try {
        const request: PricingRequest = {
          ...baseParamsRef.current,
          [selectedParam]: value,
        };
        const response: PricingResponse = await calculatePricing(request);
        results.push({
          value: Number(value.toFixed(2)),
          black_scholes: response.black_scholes,
          binomial: response.binomial,
          monte_carlo: response.monte_carlo,
        });
      } catch (error) {
        console.error(`Error calculating for ${selectedParam}=${value}:`, error);
      }
    }

    setData(results);
    setIsLoading(false);
  }, [selectedParam, range]);

  useEffect(() => {
    if (baseParams) {
      generateSensitivityData();
    }
  }, [selectedParam, range, generateSensitivityData, baseParams]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Parameter Sensitivity Analysis</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Parameter to Analyze:
        </label>
        <select
          value={selectedParam}
          onChange={(e) => setSelectedParam(e.target.value as ParameterName)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(paramConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating sensitivity...</p>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="value" 
              label={{ value: paramConfig[selectedParam].label, position: "insideBottom", offset: -5 }}
            />
            <YAxis 
              label={{ value: "Option Price ($)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip 
              formatter={(value: number) => `$${value.toFixed(4)}`}
              contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="black_scholes" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Black-Scholes"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="binomial" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Binomial"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="monte_carlo" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Monte Carlo"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center py-8">
          Calculate prices first to see sensitivity analysis
        </p>
      )}
    </div>
  );
}

