import type {
  Character,
  GamePhase,
  WordHint,
  ChatMessage,
  Player,
  RoundResult,
  GameResult,
  Room,
} from "@/types/game";
import { getSocket } from "../socket";

export const onCharacterAssigned = (
  callback: (data: { character: Character; isImpostor: boolean }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("characterAssigned", callback);
  return () => socket.off("characterAssigned", callback);
};

export const onPhaseChanged = (
  callback: (data: { phase: GamePhase; data?: Record<string, unknown> }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("phaseChanged", callback);
  return () => socket.off("phaseChanged", callback);
};

export const onTurnChanged = (
  callback: (data: { playerId: string; username: string; turnIndex: number; total: number }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("turnChanged", callback);
  return () => socket.off("turnChanged", callback);
};

export const onWordHintRevealed = (
  callback: (data: { playerId: string; username: string }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("wordHintRevealed", callback);
  return () => socket.off("wordHintRevealed", callback);
};

export const onAllWordsSubmitted = (
  callback: (data: { hints: WordHint[] }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("allWordsSubmitted", callback);
  return () => socket.off("allWordsSubmitted", callback);
};

export const onVoteUpdate = (
  callback: (data: { votes: Record<string, string>; voterId: string; targetId: string }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("voteUpdate", callback);
  return () => socket.off("voteUpdate", callback);
};

export const onPlayerEliminated = (
  callback: (data: { player: Player; wasImpostor: boolean }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("playerEliminated", callback);
  return () => socket.off("playerEliminated", callback);
};

export const onRoundResults = (
  callback: (result: RoundResult) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("roundResults", callback);
  return () => socket.off("roundResults", callback);
};

export const onGameEnded = (
  callback: (result: GameResult) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("gameEnded", callback);
  return () => socket.off("gameEnded", callback);
};

export const onChatMessage = (
  callback: (message: ChatMessage) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("chatMessage", callback);
  return () => socket.off("chatMessage", callback);
};

export const onGameStarted = (
  callback: (data: { room: Room; totalRounds: number }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("gameStarted", callback);
  return () => socket.off("gameStarted", callback);
};
