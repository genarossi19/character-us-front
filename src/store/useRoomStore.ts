import { create } from "zustand";
import type { Room, Player, RoomSettings } from "@/types/game";

interface RoomState {
  room: Room | null;
  currentPlayer: Player | null;
  players: Player[];

  setRoom: (room: Room) => void;
  setCurrentPlayer: (player: Player) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  reset: () => void;
}

const initialState = {
  room: null,
  currentPlayer: null,
  players: [],
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoom: (room) => set({ room, players: room.players }),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
      room: state.room
        ? { ...state.room, players: [...state.room.players, player] }
        : null,
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
      room: state.room
        ? {
            ...state.room,
            players: state.room.players.filter((p) => p.id !== playerId),
          }
        : null,
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
      room: state.room
        ? {
            ...state.room,
            players: state.room.players.map((p) =>
              p.id === playerId ? { ...p, ...updates } : p
            ),
          }
        : null,
    })),

  updateSettings: (settings) =>
    set((state) => ({
      room: state.room
        ? { ...state.room, settings: { ...state.room.settings, ...settings } }
        : null,
    })),

  reset: () => set(initialState),
}));
