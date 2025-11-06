/** API client functions for communicating with FastAPI backend. */

import axios from "axios";
import type {
  PricingRequest,
  PricingResponse,
  ConvergenceRequest,
  ConvergenceResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function calculatePricing(
  request: PricingRequest
): Promise<PricingResponse> {
  try {
    const response = await apiClient.post<PricingResponse>(
      "/api/pricing/calculate",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to calculate pricing"
      );
    }
    throw error;
  }
}

export async function healthCheck(): Promise<{ status: string; message: string }> {
  try {
    const response = await apiClient.get("/api/health");
    return response.data;
  } catch (error) {
    throw new Error("API health check failed");
  }
}

export async function calculateConvergence(
  request: ConvergenceRequest
): Promise<ConvergenceResponse> {
  try {
    const response = await apiClient.post<ConvergenceResponse>(
      "/api/pricing/convergence",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to calculate convergence"
      );
    }
    throw error;
  }
}

