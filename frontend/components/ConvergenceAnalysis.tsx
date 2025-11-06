"use client";

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
import { calculateConvergence } from "@/lib/api";
import type { ConvergenceRequest, ConvergenceResponse } from "@/lib/types";
import { useState, useEffect } from "react";

interface ConvergenceAnalysisProps {
  baseParams: ConvergenceRequest | null;
}

export default function ConvergenceAnalysis({ baseParams }: ConvergenceAnalysisProps) {
  const [results, setResults] = useState<ConvergenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (baseParams) {
      setIsLoading(true);
      setError(null);
      calculateConvergence(baseParams)
        .then((data) => {
          setResults(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "An error occurred");
          setIsLoading(false);
        });
    }
  }, [baseParams]);

  if (!baseParams) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Convergence Analysis
        </h2>
        <p className="text-gray-500 text-center py-8">
          Calculate prices first to see convergence analysis
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Convergence Analysis
        </h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating convergence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Convergence Analysis
        </h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // Prepare data for binomial plot with fitted line
  const binomialData = results.binomial.map((point) => ({
    log10_N: point.log10_N,
    log10_error: point.log10_error,
    N: point.N,
    error: point.error,
  }));

  // Calculate fitted line for binomial using least squares
  const binomialFitted = (() => {
    if (results.binomial.length < 2) return [];
    const x = results.binomial.map((p) => p.log10_N);
    const y = results.binomial.map((p) => p.log10_error);
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    const intercept = meanY - results.binomial_slope * meanX;
    
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    // Generate more points for smoother line
    const numPoints = 50;
    const fittedPoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const xVal = minX + (maxX - minX) * (i / numPoints);
      fittedPoints.push({
        log10_N: xVal,
        log10_error: results.binomial_slope * xVal + intercept,
      });
    }
    return fittedPoints;
  })();

  // Prepare data for Monte Carlo plot with fitted line
  const mcData = results.monte_carlo.map((point) => ({
    log10_N: point.log10_N,
    log10_error: point.log10_error,
    N: point.N,
    error: point.error,
  }));

  // Calculate fitted line for Monte Carlo using least squares
  const mcFitted = (() => {
    if (results.monte_carlo.length < 2) return [];
    const x = results.monte_carlo.map((p) => p.log10_N);
    const y = results.monte_carlo.map((p) => p.log10_error);
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    const intercept = meanY - results.monte_carlo_slope * meanX;
    
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    // Generate more points for smoother line
    const numPoints = 50;
    const fittedPoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const xVal = minX + (maxX - minX) * (i / numPoints);
      fittedPoints.push({
        log10_N: xVal,
        log10_error: results.monte_carlo_slope * xVal + intercept,
      });
    }
    return fittedPoints;
  })();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Convergence Analysis
      </h2>
      <p className="text-gray-600 mb-6">
        Log-log plots showing error convergence as a function of number of steps/simulations.
        Black-Scholes reference price: <strong>${results.black_scholes_price.toFixed(4)}</strong>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Binomial Convergence */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Binomial Tree Convergence
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Slope: <strong>{results.binomial_slope.toFixed(4)}</strong>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="log10_N"
                domain={["dataMin", "dataMax"]}
                label={{ value: "log₁₀(N)", position: "insideBottom", offset: -5 }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis
                type="number"
                dataKey="log10_error"
                domain={["dataMin", "dataMax"]}
                label={{ value: "log₁₀(error)", angle: -90, position: "insideLeft" }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  if (name === "Data" && props?.payload) {
                    const payload = props.payload;
                    return [
                      `log₁₀(error): ${value?.toFixed(4) || "N/A"}\nlog₁₀(N): ${payload.log10_N?.toFixed(4) || "N/A"}\nN: ${payload.N || "N/A"}\nError: $${payload.error?.toFixed(6) || "N/A"}`,
                      "Data",
                    ];
                  }
                  return [`log₁₀(error): ${value?.toFixed(4) || "N/A"}`, "Fitted Line"];
                }}
                contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="log10_error"
                data={binomialData}
                stroke="#10b981"
                strokeWidth={0}
                dot={{ fill: "#10b981", r: 5 }}
                activeDot={{ r: 7 }}
                name="Data"
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="log10_error"
                data={binomialFitted}
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name={`Fit (slope=${results.binomial_slope.toFixed(4)})`}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monte Carlo Convergence */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Monte Carlo Convergence
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Slope: <strong>{results.monte_carlo_slope.toFixed(4)}</strong>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="log10_N"
                domain={["dataMin", "dataMax"]}
                label={{ value: "log₁₀(N)", position: "insideBottom", offset: -5 }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis
                type="number"
                dataKey="log10_error"
                domain={["dataMin", "dataMax"]}
                label={{ value: "log₁₀(error)", angle: -90, position: "insideLeft" }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  if (name === "Data" && props?.payload) {
                    const payload = props.payload;
                    return [
                      `log₁₀(error): ${value?.toFixed(4) || "N/A"}\nlog₁₀(N): ${payload.log10_N?.toFixed(4) || "N/A"}\nN: ${payload.N || "N/A"}\nError: $${payload.error?.toFixed(6) || "N/A"}`,
                      "Data",
                    ];
                  }
                  return [`log₁₀(error): ${value?.toFixed(4) || "N/A"}`, "Fitted Line"];
                }}
                contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="log10_error"
                data={mcData}
                stroke="#8b5cf6"
                strokeWidth={0}
                dot={{ fill: "#8b5cf6", r: 5 }}
                activeDot={{ r: 7 }}
                name="Data"
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="log10_error"
                data={mcFitted}
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name={`Fit (slope=${results.monte_carlo_slope.toFixed(4)})`}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold text-gray-800 mb-2">Interpretation</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            • <strong>Slope</strong> indicates the convergence rate: steeper (more negative) slopes mean faster convergence
          </li>
          <li>
            • <strong>Binomial Tree</strong>: Typically converges with slope ≈ -1 (error ∝ 1/N)
          </li>
          <li>
            • <strong>Monte Carlo</strong>: Typically converges with slope ≈ -0.5 (error ∝ 1/√N)
          </li>
          <li>
            • The fitted line shows the theoretical convergence rate
          </li>
        </ul>
      </div>
    </div>
  );
}

