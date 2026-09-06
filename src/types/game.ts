// ============================================
// Tipos canónicos del dominio CharacterUs
// ============================================

// --- Identidad ---

export interface Player {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
  isGuest: boolean;
  isAlive: boolean;
  isOnline: boolean;
}

// --- Sala ---

export type RoomPrivacy = "public" | "private";
export type RoomMode = "classic" | "anonymous" | "special";
export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomSettings {
  category: string;
  impostorCount: number;
  totalRounds: number;
  maxPlayers: number;
  privacy: RoomPrivacy;
  mode: RoomMode;
  impostorsKnowEachOther: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  name: string;
  settings: RoomSettings;
  players: Player[];
  status: RoomStatus;
}

// --- Juego ---

export type GamePhase =
  | "character"
  | "word"
  | "turn"
  | "debate"
  | "voting"
  | "results"
  | "gameEnd";

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
}

export interface WordHint {
  playerId: string;
  username: string;
  word: string;
  revealed: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

// Duraciones de fase en milisegundos (fijas)
export const PHASE_DURATIONS = {
  character: 6000,
  word: 45000,
  debate: 90000,
  voting: 20000,
  results: 5000,
} as const;

// --- Chat ---

export type ChatMessageType = "player" | "ghost" | "system";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  type: ChatMessageType;
  timestamp: number;
}

// --- Resultados ---

export interface RoundResult {
  round: number;
  eliminatedPlayer: Player | null;
  wasImpostor: boolean;
  votes: Record<string, string>;
  wordHints: WordHint[];
}

export interface GameResult {
  winner: "crew" | "impostor";
  rounds: RoundResult[];
  players: Player[];
}

// --- Payloads Socket.IO ---

export interface CreateRoomPayload {
  username: string;
  settings: RoomSettings;
}

export interface JoinRoomPayload {
  code: string;
  username: string;
  isGuest: boolean;
}

export interface SubmitWordPayload {
  roomId: string;
  word: string;
}

export interface VotePayload {
  roomId: string;
  targetId: string;
}

export interface SendChatPayload {
  roomId: string;
  message: string;
}

export interface KickPlayerPayload {
  roomId: string;
  targetId: string;
}

// --- Responses Socket.IO ---

export interface RoomResponse {
  room: Room;
}

export interface ErrorResponse {
  message: string;
  code?: string;
}

export type AckCallback<T = void> = (response?: T | ErrorResponse) => void;
