"use client";

import { useState } from "react";
import OptionForm from "@/components/OptionForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import PriceChart from "@/components/PriceChart";
import ParameterSensitivity from "@/components/ParameterSensitivity";
import ConvergenceAnalysis from "@/components/ConvergenceAnalysis";
import GreeksDisplay from "@/components/GreeksDisplay";
import GreeksSensitivity from "@/components/GreeksSensitivity";
import GreeksComparison from "@/components/GreeksComparison";
import HedgingAnalysis from "@/components/HedgingAnalysis";
import { calculatePricing } from "@/lib/api";
import type { PricingRequest, PricingResponse, ConvergenceRequest } from "@/lib/types";

export default function Home() {
  const [results, setResults] = useState<PricingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<PricingRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"pricing" | "convergence" | "greeks" | "hedging">("pricing");

  const handleCalculate = async (request: PricingRequest) => {
    setIsLoading(true);
    setError(null);
    setLastRequest(request);

    try {
      const response = await calculatePricing(request);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const convergenceRequest: ConvergenceRequest | null = lastRequest
    ? {
        S0: lastRequest.S0,
        K: lastRequest.K,
        r: lastRequest.r,
        sigma: lastRequest.sigma,
        T: lastRequest.T,
        option_type: lastRequest.option_type,
      }
    : null;

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Option Pricing Simulator
          </h1>
          <p className="text-gray-600">
            Compare Black-Scholes, Binomial Tree, and Monte Carlo pricing models
          </p>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <OptionForm onSubmit={handleCalculate} isLoading={isLoading} />
          </div>
          <div>
            <ResultsDisplay results={results} isLoading={isLoading} />
          </div>
        </div>

        {/* Tab Navigation */}
        {lastRequest && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("pricing")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "pricing"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Pricing Analysis
                </button>
                <button
                  onClick={() => setActiveTab("convergence")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "convergence"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Convergence Analysis
                </button>
                <button
                  onClick={() => setActiveTab("greeks")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "greeks"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Greeks Analysis
                </button>
                <button
                  onClick={() => setActiveTab("hedging")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "hedging"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Delta Hedging
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "pricing" && (
          <>
            {results && (
              <div className="mb-6">
                <PriceChart results={results} />
              </div>
            )}

            {lastRequest && (
              <div>
                <ParameterSensitivity baseParams={lastRequest} />
              </div>
            )}
          </>
        )}

        {activeTab === "convergence" && (
          <div>
            <ConvergenceAnalysis baseParams={convergenceRequest} />
          </div>
        )}

        {activeTab === "greeks" && lastRequest && (
          <div className="space-y-6">
            <GreeksDisplay baseParams={lastRequest} />
            <GreeksSensitivity baseParams={lastRequest} />
            <GreeksComparison baseParams={lastRequest} />
          </div>
        )}

        {activeTab === "hedging" && lastRequest && (
          <div>
            <HedgingAnalysis baseParams={lastRequest} />
          </div>
        )}
      </div>
    </main>
  );
}

