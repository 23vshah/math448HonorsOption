"use client";

import { useState } from "react";
import type { OptionType, PricingRequest } from "@/lib/types";

interface OptionFormProps {
  onSubmit: (request: PricingRequest) => void;
  isLoading?: boolean;
}

export default function OptionForm({ onSubmit, isLoading = false }: OptionFormProps) {
  const [formData, setFormData] = useState<PricingRequest>({
    S0: 100,
    K: 100,
    r: 0.05,
    sigma: 0.2,
    T: 1.0,
    option_type: "call",
    binomial_steps: 100,
    mc_simulations: 100000,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "option_type"
          ? value
          : name === "binomial_steps" || name === "mc_simulations"
          ? parseInt(value, 10)
          : parseFloat(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Option Parameters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="S0" className="block text-sm font-medium text-gray-700 mb-1">
            Initial Stock Price (S₀)
          </label>
          <input
            type="number"
            id="S0"
            name="S0"
            value={formData.S0}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Current stock price"
          />
        </div>

        <div>
          <label htmlFor="K" className="block text-sm font-medium text-gray-700 mb-1">
            Strike Price (K)
          </label>
          <input
            type="number"
            id="K"
            name="K"
            value={formData.K}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Option strike price"
          />
        </div>

        <div>
          <label htmlFor="r" className="block text-sm font-medium text-gray-700 mb-1">
            Risk-Free Rate (r)
          </label>
          <input
            type="number"
            id="r"
            name="r"
            value={formData.r}
            onChange={handleChange}
            step="0.001"
            min="0"
            max="1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Annual risk-free interest rate (e.g., 0.05 for 5%)"
          />
        </div>

        <div>
          <label htmlFor="sigma" className="block text-sm font-medium text-gray-700 mb-1">
            Volatility (σ)
          </label>
          <input
            type="number"
            id="sigma"
            name="sigma"
            value={formData.sigma}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Annual volatility (e.g., 0.2 for 20%)"
          />
        </div>

        <div>
          <label htmlFor="T" className="block text-sm font-medium text-gray-700 mb-1">
            Time to Maturity (T)
          </label>
          <input
            type="number"
            id="T"
            name="T"
            value={formData.T}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Time to expiration in years"
          />
        </div>

        <div>
          <label htmlFor="option_type" className="block text-sm font-medium text-gray-700 mb-1">
            Option Type
          </label>
          <select
            id="option_type"
            name="option_type"
            value={formData.option_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>

        <div>
          <label htmlFor="binomial_steps" className="block text-sm font-medium text-gray-700 mb-1">
            Binomial Steps
          </label>
          <input
            type="number"
            id="binomial_steps"
            name="binomial_steps"
            value={formData.binomial_steps}
            onChange={handleChange}
            step="1"
            min="1"
            max="10000"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Number of time steps for binomial tree model"
          />
        </div>

        <div>
          <label htmlFor="mc_simulations" className="block text-sm font-medium text-gray-700 mb-1">
            Monte Carlo Simulations
          </label>
          <input
            type="number"
            id="mc_simulations"
            name="mc_simulations"
            value={formData.mc_simulations}
            onChange={handleChange}
            step="1000"
            min="100"
            max="10000000"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            title="Number of Monte Carlo simulation paths"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? "Calculating..." : "Calculate Prices"}
      </button>
    </form>
  );
}

