// ============================================
// Contrato de dominio con CharacterUs Server
// ============================================

export interface Player {
  socketId: string;
  userId: string | null;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  isGuest: boolean;
  isAlive: boolean;
  isOnline: boolean;
  hasVoted: boolean;
  isDebateReady: boolean;
}

export type RoomPrivacy = "public" | "private";
export type RoomMode = "classic" | "anonymous" | "special";
export type RoomStatus = "waiting" | "playing" | "finished";
export type GamePhase =
  | "waiting"
  | "character"
  | "word"
  | "debate"
  | "voting"
  | "results"
  | "finished";

export interface RoomSettings {
  category: string;
  impostorCount: number;
  totalRounds: number;
  maxPlayers: number;
  privacy: RoomPrivacy;
  mode: RoomMode;
  impostorsKnowEachOther: boolean;
  visibleVotes: boolean;
  password?: string;
}

export interface Room {
  id: string;
  code: number;
  hostId: string;
  name: string;
  settings: RoomSettings;
  players: Player[];
  status: RoomStatus;
  gamePhase: GamePhase;
  currentRound: number;
}

export interface Character {
  id: string;
  name: string | null;
  imageUrl: string | null;
  category: string;
}

export interface WordHint {
  playerId: string;
  username: string;
  word: string;
  revealed: boolean;
  skipped: boolean;
}

// Duraciones controladas por el servidor. El cliente no debe avanzar fases.
export const PHASE_DURATIONS = {
  character: 6_000,
  word: 0,
  debate: 40_000,
  voting: 40_000,
  results: 5_000,
} as const;

export type ChatMessageType = "player" | "ghost" | "system";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  type: ChatMessageType;
  timestamp: number;
}

export interface RoundResult {
  round: number;
  eliminatedPlayer: Player | null;
  wasImpostor: boolean;
  wasJoker: boolean;
  votes: Record<string, string>;
  wordHints: WordHint[];
}

export interface GameResult {
  winner: "innocent" | "impostor";
  rounds: RoundResult[];
  players: Player[];
  // Final-only reveal; optional for compatibility with servers predating it.
  impostorIds?: string[];
}

export interface CreateRoomPayload {
  username: string;
  token: string;
  settings: RoomSettings;
}

export interface JoinRoomPayload {
  code: number;
  username: string;
  token?: string;
  password?: string;
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

export interface DebateReadyPayload {
  roomId: string;
}

export interface ChangeAvatarPayload {
  roomId: string;
  avatarId: string;
}

export interface RenewRoomInactivityPayload {
  roomId: string;
}

export interface RenewRoomInactivityResponse {
  expiresAt: string | number;
}

export interface RoomResponse {
  room: Room;
  session?: RoomSession;
}

// Private per-tab recovery credential. Never embed in public room DTOs or URLs.
export interface RoomSession {
  roomId: string;
  playerId: string;
  resumeToken: string;
}

export interface RoomSnapshot {
  serverTime: number;
  room: Room;
  playerId: string;
  phaseExpiresAt: number | null;
  turnExpiresAt: number | null;
  currentTurnPlayerId: string | null;
  turnIndex: number;
  totalTurns: number;
  wordHints: WordHint[];
  characterAssignment: CharacterAssignment | null;
  hasSubmittedWord: boolean;
  hasVoted: boolean;
  votedFor: string | null;
  isDebateReady: boolean;
  votes: Record<string, string>;
  voterIds: string[];
  readyPlayerIds: string[];
  chatMessages: ChatMessage[];
  roundResults: RoundResult[];
}

export interface AckSuccess<T = void> {
  success: true;
  data?: T;
}

export interface AckError {
  success: false;
  message: string;
  code: string;
}

export type AckResponse<T = void> = AckSuccess<T> | AckError;
export type AckCallback<T = void> = (response: AckResponse<T>) => void;

export interface CharacterAssignment {
  character: Character | null;
  isImpostor: boolean;
  impostorIds?: string[];
}

export interface PhaseChanged {
  phase: GamePhase;
  data?: Record<string, unknown>;
}

export interface TurnChanged {
  playerId: string;
  username: string;
  turnIndex: number;
  total: number;
}

export interface WordHintRevealed {
  playerId: string;
  username: string;
  word: string;
  skipped: boolean;
}

export interface VoteUpdate {
  votes: Record<string, string>;
  voterId: string;
  targetId?: string;
  visible: boolean;
}

export interface DebateReadyUpdate {
  readyPlayers: string[];
  total: number;
}

export interface ReconnectTimeout {
  playerId: string;
  secondsLeft: number;
}

export interface RoomInactivityWarningEvent {
  roomId: string;
  expiresAt: string | number;
  remainingMs: number;
}

export interface RoomInactivityRenewedEvent {
  roomId: string;
  expiresAt: string | number;
}

export interface RoomClosedEvent {
  reason: string;
}
