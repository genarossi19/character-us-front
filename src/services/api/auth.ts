import { authenticatedApi, cookieAuthApi, getApiError, publicApi } from "./client";

export interface AuthUserResponse {
  id: string;
  username: string;
  name?: string | null;
  email: string;
  gamesPlayed: number;
  gamesWon: number;
  timesImpostor: number;
  timesEliminated: number;
  isGuest: false;
}

export interface AuthResponse {
  user: AuthUserResponse;
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
}

interface CurrentUserResponse {
  user: AuthUserResponse;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

async function requestAuth<TBody>(
  path: "login" | "signup" | "google",
  body: TBody
): Promise<AuthResponse> {
  try {
    const client = path === "google" ? cookieAuthApi : publicApi;
    const response = await client.post<AuthResponse>(`/auth/${path}`, body);
    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return requestAuth("login", { email, password });
}

export function googleLoginRequest(credential: string): Promise<AuthResponse> {
  return requestAuth("google", { credential });
}

export async function refreshGoogleSessionRequest(): Promise<AuthResponse> {
  try {
    const { data } = await cookieAuthApi.post<AuthResponse>("/auth/refresh", {}, { timeout: 8_000 });
    return data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function logoutGoogleSessionRequest(): Promise<void> {
  await cookieAuthApi.post("/auth/logout", {}, { timeout: 8_000 });
}

export function signupRequest(
  payload: SignupPayload
): Promise<AuthResponse> {
  return requestAuth("signup", payload);
}

export async function getCurrentUserRequest(): Promise<AuthUserResponse> {
  try {
    const response = await authenticatedApi.get<CurrentUserResponse>("/auth/me");
    return response.data.user;
  } catch (error) {
    throw getApiError(error);
  }
}
