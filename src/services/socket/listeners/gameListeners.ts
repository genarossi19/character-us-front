import type {
  CharacterAssignment,
  PhaseChanged,
  TurnChanged,
  WordHintRevealed,
  VoteUpdate,
  DebateReadyUpdate,
  ReconnectTimeout,
  WordHint,
  ChatMessage,
  Player,
  RoundResult,
  GameResult,
  Room,
} from "@/types/game";
import { onServerEvent } from "../eventDelivery";

export const onCharacterAssigned = (
  callback: (data: CharacterAssignment) => void
): (() => void) => {
  return onServerEvent("characterAssigned", callback);
};

export const onPhaseChanged = (
  callback: (data: PhaseChanged) => void
): (() => void) => {
  return onServerEvent("phaseChanged", callback);
};

export const onTurnChanged = (
  callback: (data: TurnChanged) => void
): (() => void) => {
  return onServerEvent("turnChanged", callback);
};

export const onWordHintRevealed = (
  callback: (data: WordHintRevealed) => void
): (() => void) => {
  return onServerEvent("wordHintRevealed", callback);
};

export const onAllWordsSubmitted = (
  callback: (data: { hints: WordHint[] }) => void
): (() => void) => {
  return onServerEvent("allWordsSubmitted", callback);
};

export const onVoteUpdate = (
  callback: (data: VoteUpdate) => void
): (() => void) => {
  return onServerEvent("voteUpdate", callback);
};

export const onPlayerEliminated = (
  callback: (data: { player: Player; wasImpostor: boolean }) => void
): (() => void) => {
  return onServerEvent("playerEliminated", callback);
};

export const onRoundResults = (
  callback: (result: RoundResult) => void
): (() => void) => {
  return onServerEvent("roundResults", callback);
};

export const onGameEnded = (
  callback: (result: GameResult) => void
): (() => void) => {
  return onServerEvent("gameEnded", callback);
};

export const onChatMessage = (
  callback: (message: ChatMessage) => void
): (() => void) => {
  return onServerEvent("chatMessage", callback);
};

export const onDebateReadyUpdate = (
  callback: (data: DebateReadyUpdate) => void
): (() => void) => {
  return onServerEvent("debateReadyUpdate", callback);
};

export const onReconnectTimeout = (
  callback: (data: ReconnectTimeout) => void
): (() => void) => {
  return onServerEvent("reconnectTimeout", callback);
};

export const onGameStarted = (
  callback: (data: { room: Room; totalRounds: number }) => void
): (() => void) => {
  return onServerEvent("gameStarted", callback);
};
