import { create } from "zustand";
import type {
  GamePhase,
  Character,
  WordHint,
  ChatMessage,
  RoundResult,
  Player,
} from "@/types/game";

interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;

  character: Character | null;
  isImpostor: boolean;

  wordHints: WordHint[];
  currentTurnPlayerId: string | null;
  hasSubmittedWord: boolean;

  votes: Record<string, string>;
  eliminatedPlayer: Player | null;
  wasImpostor: boolean;

  chatMessages: ChatMessage[];
  roundResults: RoundResult[];
  winner: "crew" | "impostor" | null;

  timer: number;

  setPhase: (phase: GamePhase) => void;
  setCurrentRound: (round: number) => void;
  setTotalRounds: (total: number) => void;
  setCharacter: (character: Character, isImpostor: boolean) => void;
  setWordHints: (hints: WordHint[]) => void;
  addWordHint: (hint: WordHint) => void;
  setCurrentTurnPlayer: (playerId: string | null) => void;
  setHasSubmittedWord: (value: boolean) => void;
  setVotes: (votes: Record<string, string>) => void;
  addVote: (voterId: string, targetId: string) => void;
  setEliminatedPlayer: (player: Player | null, wasImpostor: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addRoundResult: (result: RoundResult) => void;
  setWinner: (winner: "crew" | "impostor") => void;
  setTimer: (secondsOrFn: number | ((prev: number) => number)) => void;
  resetRound: () => void;
  resetGame: () => void;
}

const initialGameState = {
  phase: "character" as GamePhase,
  currentRound: 1,
  totalRounds: 5,

  character: null,
  isImpostor: false,

  wordHints: [],
  currentTurnPlayerId: null,
  hasSubmittedWord: false,

  votes: {},
  eliminatedPlayer: null,
  wasImpostor: false,

  chatMessages: [],
  roundResults: [],
  winner: null,

  timer: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialGameState,

  setPhase: (phase) => set({ phase }),

  setCurrentRound: (round) => set({ currentRound: round }),

  setTotalRounds: (total) => set({ totalRounds: total }),

  setCharacter: (character, isImpostor) => set({ character, isImpostor }),

  setWordHints: (hints) => set({ wordHints: hints }),

  addWordHint: (hint) =>
    set((state) => ({ wordHints: [...state.wordHints, hint] })),

  setCurrentTurnPlayer: (playerId) => set({ currentTurnPlayerId: playerId }),

  setHasSubmittedWord: (value) => set({ hasSubmittedWord: value }),

  setVotes: (votes) => set({ votes }),

  addVote: (voterId, targetId) =>
    set((state) => ({
      votes: { ...state.votes, [voterId]: targetId },
    })),

  setEliminatedPlayer: (player, wasImpostor) =>
    set({ eliminatedPlayer: player, wasImpostor }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  addRoundResult: (result) =>
    set((state) => ({
      roundResults: [...state.roundResults, result],
    })),

  setWinner: (winner) => set({ winner }),

  setTimer: (secondsOrFn) =>
    set((state) => ({
      timer:
        typeof secondsOrFn === "function"
          ? secondsOrFn(state.timer)
          : secondsOrFn,
    })),

  resetRound: () =>
    set((state) => ({
      wordHints: [],
      currentTurnPlayerId: null,
      hasSubmittedWord: false,
      votes: {},
      eliminatedPlayer: null,
      wasImpostor: false,
      timer: 0,
      currentRound: state.currentRound + 1,
    })),

  resetGame: () => set(initialGameState),
}));
