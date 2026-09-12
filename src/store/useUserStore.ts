import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import {
  getCurrentUserRequest,
  loginRequest,
  signupRequest,
  type AuthUserResponse,
  type SignupPayload,
} from "@/services/api/auth";
import { AVATAR_URLS } from "@/constants/avatars";
import { setAccessToken } from "@/services/auth/accessToken";

export interface AccessTokenClaims {
  userId: string;
  username: string;
  email: string;
  gamesPlayed: number;
  gamesWon: number;
  timesImpostor: number;
  timesEliminated: number;
  tokenType: "access";
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
  jti: string;
}

interface RegisteredUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  gamesPlayed: number;
  gamesWon: number;
  timesImpostor: number;
  timesEliminated: number;
  isGuest: false;
}

interface GuestUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  isGuest: true;
}

export type User = RegisteredUser | GuestUser;

interface UserState {
  user: User | null;
  token: string | null;
  claims: AccessTokenClaims | null;
  isLoggedIn: boolean;
  isRestoringSession: boolean;
  isSessionReady: boolean;

  loginAsGuest: (username: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  restoreSession: () => Promise<void>;
}

const SESSION_KEY = "characterus.session";
const LEGACY_SESSION_KEY = "characterus-session";

if (typeof window !== "undefined") {
  // Do not keep a JWT in the legacy localStorage session after this migration.
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function removeStoredSession(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

const getRandomAvatar = () =>
  AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];

function decodeAccessToken(token: string): AccessTokenClaims {
  try {
    const claims = jwtDecode<AccessTokenClaims>(token);

    if (
      !claims.userId ||
      !claims.username ||
      !claims.email ||
      !Number.isFinite(claims.exp)
    ) {
      throw new Error("El token no contiene una sesión válida");
    }

    if (claims.exp * 1000 <= Date.now()) {
      throw new Error("La sesión ha expirado");
    }

    return claims;
  } catch {
    throw new Error("No se pudo validar la sesión recibida");
  }
}

function createRegisteredUser(
  user: AuthUserResponse,
  avatarUrl = getRandomAvatar()
): RegisteredUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    timesImpostor: user.timesImpostor,
    timesEliminated: user.timesEliminated,
    isGuest: false,
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      claims: null,
      isLoggedIn: false,
      isRestoringSession: false,
      isSessionReady: false,

      loginAsGuest: (username) => {
        setAccessToken(null);
        set({
          user: {
            id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            username,
            email: "",
            avatarUrl: getRandomAvatar(),
            isGuest: true,
          },
          token: null,
          claims: null,
          isLoggedIn: false,
          isRestoringSession: false,
          isSessionReady: true,
        });
      },

      login: async (email, password) => {
        const response = await loginRequest(email, password);
        const claims = decodeAccessToken(response.token);
        const avatarUrl = get().user?.avatarUrl;
        const user = createRegisteredUser(response.user, avatarUrl);

        setAccessToken(response.token);
        set({
          user,
          token: response.token,
          claims,
          isLoggedIn: true,
          isRestoringSession: false,
          isSessionReady: true,
        });
      },

      signup: async (payload) => {
        const response = await signupRequest(payload);
        const claims = decodeAccessToken(response.token);
        const user = createRegisteredUser(response.user);

        setAccessToken(response.token);
        set({
          user,
          token: response.token,
          claims,
          isLoggedIn: true,
          isRestoringSession: false,
          isSessionReady: true,
        });
      },

      logout: () => {
        setAccessToken(null);
        set({
          user: null,
          token: null,
          claims: null,
          isLoggedIn: false,
          isRestoringSession: false,
          isSessionReady: true,
        });
        removeStoredSession();
      },

      setUser: (user) => {
        const token = user.isGuest ? null : get().token;
        setAccessToken(token);
        set({ user, token, isLoggedIn: Boolean(token) });
      },

      restoreSession: async () => {
        if (get().isRestoringSession || get().isSessionReady) return;

        set({ isRestoringSession: true });
        const { token, user } = get();

        if (!token || !user || user.isGuest) {
          setAccessToken(null);
          set({
            user: null,
            token: null,
            claims: null,
            isLoggedIn: false,
            isRestoringSession: false,
            isSessionReady: true,
          });
          removeStoredSession();
          return;
        }

        try {
          const claims = decodeAccessToken(token);
          setAccessToken(token);
          const authenticatedUser = await getCurrentUserRequest();
          if (get().token !== token) return;

          set({
            user: createRegisteredUser(authenticatedUser, user.avatarUrl),
            claims,
            isLoggedIn: true,
            isRestoringSession: false,
            isSessionReady: true,
          });
        } catch {
          if (get().token !== token) return;

          setAccessToken(null);
          set({
            user: null,
            token: null,
            claims: null,
            isLoggedIn: false,
            isRestoringSession: false,
            isSessionReady: true,
          });
          removeStoredSession();
        }
      },
    }),
    {
      name: SESSION_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user?.isGuest ? null : state.user,
        token: state.user?.isGuest ? null : state.token,
        claims: state.user?.isGuest ? null : state.claims,
      }),
      onRehydrateStorage: () => (state) => {
        setAccessToken(state?.token || null);
      },
    }
  )
);
