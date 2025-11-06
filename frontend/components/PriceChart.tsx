"use client";

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
import type { PricingResponse } from "@/lib/types";

interface PriceChartProps {
  results: PricingResponse | null;
}

export default function PriceChart({ results }: PriceChartProps) {
  if (!results) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Price Comparison Chart</h2>
        <p className="text-gray-500 text-center py-8">
          Calculate prices to see the comparison chart
        </p>
      </div>
    );
  }

  const data = [
    {
      name: "Black-Scholes",
      price: results.black_scholes,
    },
    {
      name: "Binomial",
      price: results.binomial,
    },
    {
      name: "Monte Carlo",
      price: results.monte_carlo,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Price Comparison Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            label={{ value: "Price ($)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toFixed(4)}`}
            contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
          />
          <Legend />
          <Bar 
            dataKey="price" 
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

