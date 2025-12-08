"use client";

import { useState, useEffect } from "react";
import { calculateGreeksSensitivity } from "@/lib/api";
import type { GreeksSensitivityRequest, PricingRequest } from "@/lib/types";

interface GreeksHeatmapProps {
  baseParams: PricingRequest;
  greekName: "delta" | "gamma" | "theta" | "vega" | "rho";
}

type ParameterPair = "S0_T" | "S0_sigma" | "K_T";

export default function GreeksHeatmap({ baseParams, greekName }: GreeksHeatmapProps) {
  const [selectedPair, setSelectedPair] = useState<ParameterPair>("S0_T");
  const [data, setData] = useState<Array<{ x: number; y: number; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateHeatmapData = async () => {
      setIsLoading(true);
      try {
        const [param1, param2] = selectedPair.split("_");
        const steps = 15;
        const heatmapData: Array<{ x: number; y: number; value: number }> = [];

        // Define ranges for each parameter
        const ranges: Record<string, [number, number]> = {
          S0: [baseParams.S0 * 0.7, baseParams.S0 * 1.3],
          K: [baseParams.K * 0.7, baseParams.K * 1.3],
          T: [baseParams.T * 0.3, baseParams.T * 1.5],
          sigma: [Math.max(0.1, baseParams.sigma * 0.5), Math.min(1.0, baseParams.sigma * 1.5)],
        };

        const [min1, max1] = ranges[param1];
        const [min2, max2] = ranges[param2];

        for (let i = 0; i < steps; i++) {
          for (let j = 0; j < steps; j++) {
            const val1 = min1 + (max1 - min1) * (i / (steps - 1));
            const val2 = min2 + (max2 - min2) * (j / (steps - 1));

            const request: GreeksSensitivityRequest = {
              S0: param1 === "S0" ? val1 : param2 === "S0" ? val2 : baseParams.S0,
              K: param1 === "K" ? val1 : param2 === "K" ? val2 : baseParams.K,
              r: baseParams.r,
              sigma: param1 === "sigma" ? val1 : param2 === "sigma" ? val2 : baseParams.sigma,
              T: param1 === "T" ? val1 : param2 === "T" ? val2 : baseParams.T,
              option_type: baseParams.option_type,
              parameter: param1 as any,
              min_value: val1,
              max_value: val1,
              steps: 1,
            };

            try {
              const response = await calculateGreeksSensitivity(request);
              if (response.data.length > 0) {
                heatmapData.push({
                  x: val1,
                  y: val2,
                  value: response.data[0][greekName],
                });
              }
            } catch (error) {
              // Skip invalid combinations
            }
          }
        }

        setData(heatmapData);
      } catch (error) {
        console.error("Error generating heatmap:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (baseParams) {
      generateHeatmapData();
    }
  }, [baseParams, selectedPair, greekName]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {greekName.charAt(0).toUpperCase() + greekName.slice(1)} Heatmap
        </h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Generating heatmap...</p>
        </div>
      </div>
    );
  }

  // Simple 2D visualization using a table/grid
  const gridSize = Math.sqrt(data.length);
  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));
  const range = maxValue - minValue;

  const getColor = (value: number) => {
    const normalized = (value - minValue) / range;
    const hue = (1 - normalized) * 240; // Blue to red
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {greekName.charAt(0).toUpperCase() + greekName.slice(1)} Heatmap
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parameter Pair:
        </label>
        <select
          value={selectedPair}
          onChange={(e) => setSelectedPair(e.target.value as ParameterPair)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="S0_T">Stock Price vs Time</option>
          <option value="S0_sigma">Stock Price vs Volatility</option>
          <option value="K_T">Strike vs Time</option>
        </select>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="text-sm text-gray-600 mb-2">
            Range: {minValue.toFixed(4)} to {maxValue.toFixed(4)}
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {data.map((point, idx) => (
              <div
                key={idx}
                className="aspect-square rounded"
                style={{ backgroundColor: getColor(point.value) }}
                title={`Value: ${point.value.toFixed(4)}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No data available</p>
      )}
    </div>
  );
}
