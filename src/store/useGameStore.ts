import { create } from "zustand";
import type {
  GamePhase,
  Character,
  WordHint,
  ChatMessage,
  RoundResult,
  Player,
  RoomSnapshot,
  GameResult,
} from "@/types/game";

interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;

  character: Character | null;
  isImpostor: boolean;

  wordHints: WordHint[];
  currentTurnPlayerId: string | null;
  turnIndex: number;
  totalTurns: number;
  hasSubmittedWord: boolean;
  hasVoted: boolean;
  votedFor: string | null;
  voterIds: string[];
  impostorIds: string[];
  phaseExpiresAt: number | null;
  turnExpiresAt: number | null;
  serverClockOffset: number;
  hydrateSnapshot: (snapshot: RoomSnapshot) => void;

  votes: Record<string, string>;
  votesVisible: boolean | null;
  eliminatedPlayer: Player | null;
  wasImpostor: boolean;

  chatMessages: ChatMessage[];
  roundResults: RoundResult[];
  winner: "crew" | "impostor" | null;
  finalResult: GameResult | null;
  readyPlayerIds: string[];
  readyPlayersTotal: number;
  reconnectingPlayerId: string | null;
  reconnectSecondsLeft: number;

  timer: number;

  setPhase: (phase: GamePhase) => void;
  setCurrentRound: (round: number) => void;
  setTotalRounds: (total: number) => void;
  setCharacter: (character: Character | null, isImpostor: boolean) => void;
  setWordHints: (hints: WordHint[]) => void;
  addWordHint: (hint: WordHint) => void;
  setCurrentTurnPlayer: (playerId: string | null) => void;
  setHasSubmittedWord: (value: boolean) => void;
  setVotes: (votes: Record<string, string>) => void;
  setVotesVisible: (visible: boolean) => void;
  addVote: (voterId: string, targetId: string) => void;
  setEliminatedPlayer: (player: Player | null, wasImpostor: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addRoundResult: (result: RoundResult) => void;
  setWinner: (winner: "crew" | "impostor") => void;
  setRoundResults: (results: RoundResult[]) => void;
  setDebateReady: (readyPlayers: string[], total: number) => void;
  setReconnectTimeout: (playerId: string | null, secondsLeft: number) => void;
  setTimer: (secondsOrFn: number | ((prev: number) => number)) => void;
  resetRound: () => void;
  resetGame: () => void;
}

const initialGameState = {
  phase: "waiting" as GamePhase,
  currentRound: 1,
  totalRounds: 5,

  character: null,
  isImpostor: false,

  wordHints: [],
  currentTurnPlayerId: null,
  turnIndex: 0,
  totalTurns: 0,
  hasSubmittedWord: false,
  hasVoted: false,
  votedFor: null as string | null,
  voterIds: [] as string[],
  impostorIds: [] as string[],
  phaseExpiresAt: null as number | null,
  turnExpiresAt: null as number | null,
  serverClockOffset: 0,

  votes: {},
  votesVisible: null,
  eliminatedPlayer: null,
  wasImpostor: false,

  chatMessages: [],
  roundResults: [],
  winner: null,
  finalResult: null as GameResult | null,
  readyPlayerIds: [],
  readyPlayersTotal: 0,
  reconnectingPlayerId: null as string | null,
  reconnectSecondsLeft: 0,

  timer: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialGameState,

  hydrateSnapshot: (snapshot) => {
    const lastResult = snapshot.roundResults.at(-1);
    set({
      ...initialGameState,
      phase: snapshot.room.gamePhase,
      currentRound: snapshot.room.currentRound,
      totalRounds: snapshot.room.settings.totalRounds,
      character: snapshot.characterAssignment?.isImpostor ? null : snapshot.characterAssignment?.character ?? null,
      isImpostor: snapshot.characterAssignment?.isImpostor ?? false,
      impostorIds: snapshot.characterAssignment?.impostorIds ?? [],
      wordHints: snapshot.wordHints,
      currentTurnPlayerId: snapshot.room.gamePhase === "word" ? snapshot.currentTurnPlayerId : null,
      turnIndex: snapshot.turnIndex,
      totalTurns: snapshot.totalTurns,
      hasSubmittedWord: snapshot.hasSubmittedWord,
      hasVoted: snapshot.hasVoted,
      votedFor: snapshot.votedFor,
      votes: snapshot.room.settings.visibleVotes ? snapshot.votes : {},
      voterIds: snapshot.voterIds,
      votesVisible: snapshot.room.settings.visibleVotes,
      readyPlayerIds: snapshot.readyPlayerIds,
      readyPlayersTotal: snapshot.room.players.filter((player) => player.isAlive).length,
      chatMessages: snapshot.chatMessages,
      roundResults: snapshot.roundResults,
      eliminatedPlayer: lastResult?.eliminatedPlayer ?? null,
      wasImpostor: lastResult?.wasImpostor ?? false,
      phaseExpiresAt: snapshot.phaseExpiresAt,
      turnExpiresAt: snapshot.turnExpiresAt,
      serverClockOffset: snapshot.serverTime - Date.now(),
    });
  },

  setPhase: (phase) => set((state) => ({
    phase,
    ...(state.phase !== phase ? { phaseExpiresAt: null, turnExpiresAt: null } : {}),
    ...(phase !== "word" ? { currentTurnPlayerId: null } : {}),
    // A new word/character phase begins a fresh set of clues, never debate.
    ...((phase === "character" || phase === "word") && state.phase !== phase
      ? { wordHints: [], hasSubmittedWord: false, currentTurnPlayerId: null, turnIndex: 0, totalTurns: 0, hasVoted: false, votedFor: null, voterIds: [], votes: {}, readyPlayerIds: [] }
      : {}),
  })),

  setCurrentRound: (round) => set({ currentRound: round }),

  setTotalRounds: (total) => set({ totalRounds: total }),

  setCharacter: (character, isImpostor) => set({ character, isImpostor }),

  setWordHints: (hints) => set({ wordHints: hints }),

  addWordHint: (hint) =>
    set((state) => ({
      wordHints: state.wordHints.some((existing) => existing.playerId === hint.playerId)
        ? state.wordHints.map((existing) => existing.playerId === hint.playerId ? hint : existing)
        : [...state.wordHints, hint],
    })),

  setCurrentTurnPlayer: (playerId) => set((state) => ({
    currentTurnPlayerId: playerId,
    ...(playerId !== state.currentTurnPlayerId ? { turnExpiresAt: null } : {}),
  })),

  setHasSubmittedWord: (value) => set({ hasSubmittedWord: value }),

  setVotes: (votes) => set({ votes }),

  setVotesVisible: (visible) => set({ votesVisible: visible }),

  addVote: (voterId, targetId) =>
    set((state) => ({
      votes: { ...state.votes, [voterId]: targetId },
    })),

  setEliminatedPlayer: (player, wasImpostor) =>
    set({ eliminatedPlayer: player, wasImpostor }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: state.chatMessages.some((existing) => existing.id === message.id)
        ? state.chatMessages.map((existing) => existing.id === message.id ? message : existing)
        : [...state.chatMessages, message],
    })),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  addRoundResult: (result) =>
    set((state) => ({
      roundResults: [...state.roundResults, result],
    })),

  setWinner: (winner) => set({ winner }),

  setRoundResults: (roundResults) => set({ roundResults }),

  setDebateReady: (readyPlayerIds, readyPlayersTotal) =>
    set({ readyPlayerIds, readyPlayersTotal }),

  setReconnectTimeout: (reconnectingPlayerId, reconnectSecondsLeft) =>
    set({ reconnectingPlayerId, reconnectSecondsLeft }),

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
      turnIndex: 0,
      totalTurns: 0,
      hasSubmittedWord: false,
      hasVoted: false,
      votedFor: null,
      voterIds: [],
      phaseExpiresAt: null,
      turnExpiresAt: null,
      votes: {},
      votesVisible: null,
      eliminatedPlayer: null,
      wasImpostor: false,
      readyPlayerIds: [],
      readyPlayersTotal: 0,
      reconnectingPlayerId: null,
      reconnectSecondsLeft: 0,
      timer: 0,
      currentRound: state.currentRound + 1,
    })),

  resetGame: () => set(initialGameState),
}));
