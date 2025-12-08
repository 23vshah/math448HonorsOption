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
import { calculateGreeksSensitivity } from "@/lib/api";
import type { GreeksSensitivityRequest, PricingRequest } from "@/lib/types";

interface GreeksSensitivityProps {
  baseParams: PricingRequest;
}

type ParameterName = "S0" | "K" | "r" | "sigma" | "T";

export default function GreeksSensitivity({ baseParams }: GreeksSensitivityProps) {
  const [selectedParam, setSelectedParam] = useState<ParameterName>("S0");
  const [range, setRange] = useState<[number, number]>([50, 150]);
  const [data, setData] = useState<Array<{
    parameter_value: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGreeks, setSelectedGreeks] = useState<Set<string>>(
    new Set(["delta", "gamma", "theta", "vega", "rho"])
  );
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
    const minVal = Math.max(config.min, range[0]);
    const maxVal = Math.min(config.max, range[1]);

    try {
      const request: GreeksSensitivityRequest = {
        S0: baseParamsRef.current.S0,
        K: baseParamsRef.current.K,
        r: baseParamsRef.current.r,
        sigma: baseParamsRef.current.sigma,
        T: baseParamsRef.current.T,
        option_type: baseParamsRef.current.option_type,
        parameter: selectedParam,
        min_value: minVal,
        max_value: maxVal,
        steps: 30,
      };

      const response = await calculateGreeksSensitivity(request);
      setData(response.data);
    } catch (error) {
      console.error(`Error calculating sensitivity for ${selectedParam}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedParam, range]);

  useEffect(() => {
    if (baseParams) {
      generateSensitivityData();
    }
  }, [selectedParam, range, generateSensitivityData, baseParams]);

  const greekColors: Record<string, string> = {
    delta: "#3b82f6",
    gamma: "#10b981",
    theta: "#f59e0b",
    vega: "#8b5cf6",
    rho: "#ef4444",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Greeks Sensitivity Analysis</h2>
      
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Greeks to Display:
        </label>
        <div className="flex flex-wrap gap-2">
          {["delta", "gamma", "theta", "vega", "rho"].map((greek) => (
            <label key={greek} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedGreeks.has(greek)}
                onChange={(e) => {
                  const newSet = new Set(selectedGreeks);
                  if (e.target.checked) {
                    newSet.add(greek);
                  } else {
                    newSet.delete(greek);
                  }
                  setSelectedGreeks(newSet);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{greek}</span>
            </label>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating sensitivity...</p>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 50, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="parameter_value" 
              label={{ value: paramConfig[selectedParam].label, position: "insideBottom", offset: -5 }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: "Greek Value (Theta, Vega, Rho)", angle: -90, position: "insideLeft" }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: "Greek Value (Delta, Gamma)", angle: 90, position: "insideRight" }}
            />
            <Tooltip 
              formatter={(value: number) => value.toFixed(4)}
              contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            {selectedGreeks.has("delta") && (
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="delta" 
                stroke={greekColors.delta}
                strokeWidth={2}
                name="Delta"
                dot={false}
              />
            )}
            {selectedGreeks.has("gamma") && (
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="gamma" 
                stroke={greekColors.gamma}
                strokeWidth={2}
                name="Gamma"
                dot={false}
              />
            )}
            {selectedGreeks.has("theta") && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="theta" 
                stroke={greekColors.theta}
                strokeWidth={2}
                name="Theta"
                dot={false}
              />
            )}
            {selectedGreeks.has("vega") && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="vega" 
                stroke={greekColors.vega}
                strokeWidth={2}
                name="Vega"
                dot={false}
              />
            )}
            {selectedGreeks.has("rho") && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rho" 
                stroke={greekColors.rho}
                strokeWidth={2}
                name="Rho"
                dot={false}
              />
            )}
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
