import { authenticatedApi, getApiError, publicApi } from "./client";

export interface AuthUserResponse {
  id: string;
  username: string;
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
  path: "login" | "signup",
  body: TBody
): Promise<AuthResponse> {
  try {
    const response = await publicApi.post<AuthResponse>(`/auth/${path}`, body);
    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return requestAuth("login", { email, password });
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
