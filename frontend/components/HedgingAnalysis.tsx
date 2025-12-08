"use client";

import { useState } from "react";
import DeltaHedgingSimulator from "./DeltaHedgingSimulator";
import HedgingFrequencyComparison from "./HedgingFrequencyComparison";
import type { PricingRequest } from "@/lib/types";

interface HedgingAnalysisProps {
  baseParams: PricingRequest;
}

export default function HedgingAnalysis({ baseParams }: HedgingAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"simulate" | "compare">("simulate");

  return (
    <div>
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("simulate")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "simulate"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Single Simulation
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "compare"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Frequency Comparison
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "simulate" && <DeltaHedgingSimulator baseParams={baseParams} />}
      {activeTab === "compare" && <HedgingFrequencyComparison baseParams={baseParams} />}
    </div>
  );
}
