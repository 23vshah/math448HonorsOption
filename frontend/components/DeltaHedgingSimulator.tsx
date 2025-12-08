"use client";

import { useState } from "react";
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
import { simulateHedging } from "@/lib/api";
import type { HedgingSimulateRequest, HedgingSimulateResponse, PricingRequest } from "@/lib/types";

interface DeltaHedgingSimulatorProps {
  baseParams: PricingRequest;
}

export default function DeltaHedgingSimulator({ baseParams }: DeltaHedgingSimulatorProps) {
  const [rebalanceFreq, setRebalanceFreq] = useState<string>("daily");
  const [transactionCost, setTransactionCost] = useState<number>(0.001);
  const [optionContracts, setOptionContracts] = useState<number>(1);
  const [result, setResult] = useState<HedgingSimulateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const request: HedgingSimulateRequest = {
        S0: baseParams.S0,
        K: baseParams.K,
        r: baseParams.r,
        sigma: baseParams.sigma,
        T: baseParams.T,
        option_type: baseParams.option_type,
        rebalance_freq: rebalanceFreq,
        transaction_cost: transactionCost,
        option_contracts: optionContracts,
      };
      const response = await simulateHedging(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to simulate hedging");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Delta Hedging Simulator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Rebalancing Frequency:
          </label>
          <select
            value={rebalanceFreq}
            onChange={(e) => setRebalanceFreq(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="5">Every 5 days</option>
            <option value="10">Every 10 days</option>
          </select>
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
            Option Contracts:
          </label>
          <input
            type="number"
            value={optionContracts}
            onChange={(e) => setOptionContracts(parseInt(e.target.value) || 1)}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={isLoading}
        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Simulating..." : "Run Simulation"}
      </button>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Final P&L</div>
              <div className="text-2xl font-bold text-gray-900">
                ${result.summary.final_pnl.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Transaction Cost</div>
              <div className="text-2xl font-bold text-gray-900">
                ${result.summary.total_transaction_cost.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Hedging Error</div>
              <div className="text-2xl font-bold text-gray-900">
                ${result.summary.hedging_error.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Max Drawdown</div>
              <div className="text-2xl font-bold text-gray-900">
                ${result.summary.max_drawdown.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Final Portfolio Value</div>
              <div className="text-2xl font-bold text-gray-900">
                ${result.summary.final_portfolio_value.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Portfolio Value Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.time_series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: "Time (years)", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "Value ($)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="portfolio_value" stroke="#3b82f6" strokeWidth={2} name="Portfolio Value" dot={false} />
                <Line type="monotone" dataKey="option_value" stroke="#10b981" strokeWidth={2} name="Option Value" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Stock Price and Delta</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.time_series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: "Time (years)", position: "insideBottom", offset: -5 }} />
                <YAxis yAxisId="left" label={{ value: "Price ($)", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: "Delta", angle: 90, position: "insideRight" }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="stock_price" stroke="#ef4444" strokeWidth={2} name="Stock Price" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="delta" stroke="#8b5cf6" strokeWidth={2} name="Delta" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">P&L Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.time_series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: "Time (years)", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "P&L ($)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="pnl" stroke="#f59e0b" strokeWidth={2} name="P&L" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {result.transactions && result.transactions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Rebalancing Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time (years)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delta Change
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shares Traded
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Shares
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trade Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.transactions.map((tx, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.time.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${tx.stock_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.delta.toFixed(4)}
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          tx.delta_change >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {tx.delta_change >= 0 ? "+" : ""}{tx.delta_change.toFixed(4)}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${
                          tx.transaction_type === "buy" ? "text-green-600" : "text-red-600"
                        }`}>
                          {tx.transaction_type === "buy" ? "BUY" : "SELL"}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${
                          tx.shares_traded >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {tx.shares_traded >= 0 ? "+" : ""}{tx.shares_traded.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.total_shares.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${tx.trade_cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
