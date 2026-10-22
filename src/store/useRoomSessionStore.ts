import { create } from "zustand";
import type { RoomSession } from "@/types/game";

const STORAGE_KEY = "characterus.room-session";
export type RecoveryStatus = "idle" | "connecting" | "recovering" | "error";

function readSession(): RoomSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (value && typeof value.roomId === "string" && value.roomId &&
        typeof value.playerId === "string" && value.playerId &&
        typeof value.resumeToken === "string" && /^[0-9a-f]{64}$/.test(value.resumeToken)) {
      return { roomId: value.roomId, playerId: value.playerId, resumeToken: value.resumeToken };
    }
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Storage may be unavailable or corrupted. */ }
  return null;
}

const savedSession = readSession();

interface RoomSessionState {
  session: RoomSession | null;
  status: RecoveryStatus;
  error: string | null;
  saveSession: (session: RoomSession) => void;
  clearSession: () => void;
}

export const useRoomSessionStore = create<RoomSessionState>((set) => ({
  session: savedSession,
  status: savedSession ? "connecting" : "idle",
  error: null,
  saveSession: (session) => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* Keep in memory for reconnects. */ }
    set({ session, status: "idle", error: null });
  },
  clearSession: () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* No persisted credential to clear. */ }
    set({ session: null, status: "idle", error: null });
  },
}));

export const isRecoveringRoom = () => useRoomSessionStore.getState().status !== "idle";
