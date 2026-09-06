/**
 * Socket Event Types - Definiciones de tipos para eventos de Socket.io
 *
 * Este archivo contiene todas las interfaces y tipos necesarios para
 * validar los datos que se envían y reciben a través de Socket.io.
 * Garantiza type-safety en toda la comunicación con el servidor.
 *
 * Razón de creación: Proporcionar tipos centralizados para mantener
 * coherencia entre el cliente y servidor, evitando errores en tiempo de ejecución.
 */

// ============================================
// Tipos de Sala
// ============================================

export interface Player {
  socketId: string;
  username: string;
  characterId?: string;
  isImpostor?: boolean;
}

export interface Room {
  hostId: string;
  internalId: string;
  gamePin: number;
  categoryId?: string;
  players: Player[];
  gameStarted?: boolean;
}

export interface CreateRoomPayload {
  username: string;
  categoryId: string; // Ahora es requerido, no opcional
}

export interface CreateRoomResponse {
  internalId: string;
  gamePin: number;
}

export interface JoinRoomPayload {
  gamePin: number;
  username: string;
}

export interface JoinRoomResponse {
  internalId: string;
  room: Room;
}

// ============================================
// Tipos de Juego
// ============================================

export interface StartGamePayload {
  gamePin: number;
  categoryId: string;
}

export interface GameState {
  gameStarted: boolean;
  currentRound?: number;
  totalRounds?: number;
}

export interface PlayerVote {
  voterId: string;
  targetSocketId: string;
}

export interface VotePayload {
  targetSocketId: string;
}

// ============================================
// Tipos de Carácter
// ============================================

export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  categoryId?: string;
}

export interface AssignCharacterPayload {
  characterId: string;
}

// ============================================
// Tipos de Evento Genéricos
// ============================================

export interface ErrorResponse {
  message: string;
  code?: string;
}

export interface SuccessResponse {
  message: string;
}

// ============================================
// Tipos de Callback Emit
// ============================================

export type AckCallback<T = void> = (response?: T | ErrorResponse) => void;
