import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/services/auth/accessToken";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

export const authenticatedApi = axios.create({
  baseURL: API_BASE_URL,
});

authenticatedApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  }
);

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    options?: { code?: string; fieldErrors?: Record<string, string[]> }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.fieldErrors = options?.fieldErrors;
  }
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export function getApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return new ApiError(
      0,
      error instanceof Error ? error.message : "No se pudo conectar con el servidor"
    );
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const status = axiosError.response?.status || 0;
  const payload = axiosError.response?.data;

  return new ApiError(
    status,
    payload?.message || payload?.error || axiosError.message || "Error de red",
    { code: payload?.code, fieldErrors: payload?.errors }
  );
}
