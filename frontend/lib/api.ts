/** API client functions for communicating with FastAPI backend. */

import axios from "axios";
import type {
  PricingRequest,
  PricingResponse,
  ConvergenceRequest,
  ConvergenceResponse,
  GreeksRequest,
  GreeksResponse,
  GreeksSensitivityRequest,
  GreeksSensitivityResponse,
  GreeksCompareRequest,
  GreeksCompareResponse,
  GreeksMethodCompareRequest,
  GreeksMethodCompareResponse,
  HedgingSimulateRequest,
  HedgingSimulateResponse,
  HedgingCompareRequest,
  HedgingCompareResponse,
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

// Greeks API functions
export async function calculateGreeks(
  request: GreeksRequest
): Promise<GreeksResponse> {
  try {
    const response = await apiClient.post<GreeksResponse>(
      "/api/greeks/calculate",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to calculate Greeks"
      );
    }
    throw error;
  }
}

export async function calculateGreeksSensitivity(
  request: GreeksSensitivityRequest
): Promise<GreeksSensitivityResponse> {
  try {
    const response = await apiClient.post<GreeksSensitivityResponse>(
      "/api/greeks/sensitivity",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to calculate Greeks sensitivity"
      );
    }
    throw error;
  }
}

export async function compareGreeks(
  request: GreeksCompareRequest
): Promise<GreeksCompareResponse> {
  try {
    const response = await apiClient.post<GreeksCompareResponse>(
      "/api/greeks/compare",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to compare Greeks"
      );
    }
    throw error;
  }
}

export async function compareGreeksMethods(
  request: GreeksMethodCompareRequest
): Promise<GreeksMethodCompareResponse> {
  try {
    const response = await apiClient.post<GreeksMethodCompareResponse>(
      "/api/greeks/compare-methods",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to compare Greeks methods"
      );
    }
    throw error;
  }
}

// Hedging API functions
export async function simulateHedging(
  request: HedgingSimulateRequest
): Promise<HedgingSimulateResponse> {
  try {
    const response = await apiClient.post<HedgingSimulateResponse>(
      "/api/hedging/simulate",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to simulate hedging"
      );
    }
    throw error;
  }
}

export async function compareHedgingFrequencies(
  request: HedgingCompareRequest
): Promise<HedgingCompareResponse> {
  try {
    const response = await apiClient.post<HedgingCompareResponse>(
      "/api/hedging/compare-frequencies",
      request
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to compare hedging frequencies"
      );
    }
    throw error;
  }
}

