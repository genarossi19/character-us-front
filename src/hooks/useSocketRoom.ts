import { useCallback } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { useGameStore } from "@/store/useGameStore";
import {
  emitCreateRoom,
  emitJoinRoom,
  emitLeaveRoom,
  emitStartGame,
  emitKickPlayer,
  emitChangeAvatar,
  isSocketConnected,
} from "@/services/socket";
import { useRoomSessionStore } from "@/store/useRoomSessionStore";
import { useUserStore } from "@/store/useUserStore";
import { AVATAR_OPTIONS } from "@/constants/avatars";
import type {
  AckResponse,
  CreateRoomPayload,
  JoinRoomPayload,
  Room,
  RoomResponse,
} from "@/types/game";
import { useNavigate } from "react-router";

export class SocketAckError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SocketAckError";
    this.code = code;
  }
}

function assertConnected(): void {
  if (!isSocketConnected()) {
    throw new Error("No hay conexión con el servidor. Verifica tu conexión e intenta de nuevo.");
  }
}

export function useSocketRoom() {
  const { setRoom, setCurrentPlayer, reset: resetRoom } =
    useRoomStore();
  const { resetGame } = useGameStore();
  const navigate = useNavigate();

  const commitRoom = useCallback(
    (data: RoomResponse) => {
      const { room, session } = data;
      if (!session || session.roomId !== room.id) throw new Error("El servidor no devolvió una sesión recuperable.");
      const player = room.players.find((candidate) => candidate.socketId === session.playerId);
      if (!player) throw new Error("El jugador no está en la sala recibida.");
      useRoomSessionStore.getState().saveSession(session);
      resetGame();
      setRoom(room);
      setCurrentPlayer(player);
    },
    [setCurrentPlayer, setRoom, resetGame]
  );

  const getRoomFromAck = (response: AckResponse<RoomResponse>): RoomResponse => {
    if (!response.success) {
      throw new SocketAckError(response.code, response.message);
    }
    if (!response.data?.room) {
      throw new Error("El servidor no devolvió la sala creada");
    }
    return response.data;
  };

  const createRoom = useCallback(
    (payload: CreateRoomPayload) =>
      new Promise<Room>((resolve, reject) => {
        try {
          assertConnected();
        } catch (error) {
          reject(error);
          return;
        }
        emitCreateRoom(payload, (response) => {
          try {
            const data = getRoomFromAck(response);
            commitRoom(data);
            navigate("/lobby");
            resolve(data.room);
          } catch (error) {
            reject(error);
          }
        });
      }),
    [commitRoom, navigate]
  );

  const joinRoom = useCallback(
    (payload: JoinRoomPayload) =>
      new Promise<Room>((resolve, reject) => {
        try {
          assertConnected();
        } catch (error) {
          reject(error);
          return;
        }
        emitJoinRoom(payload, (response) => {
          try {
            const data = getRoomFromAck(response);
            commitRoom(data);
            navigate("/lobby");
            resolve(data.room);
          } catch (error) {
            reject(error);
          }
        });
      }),
    [commitRoom, navigate]
  );

  const leaveRoom = useCallback(
    (roomId: string) =>
      new Promise<void>((resolve, reject) => {
        emitLeaveRoom(roomId, (response) => {
          if (!response.success) {
            reject(new Error(response.message));
            return;
          }
          resetRoom();
          resetGame();
          useRoomSessionStore.getState().clearSession();
          navigate(useUserStore.getState().isLoggedIn ? "/menu" : "/join");
          resolve();
        });
      }),
    [resetRoom, resetGame, navigate]
  );

  const startGame = useCallback(
    (roomId: string) =>
      new Promise<Room>((resolve, reject) => {
        emitStartGame(roomId, (response) => {
          try {
            resolve(getRoomFromAck(response).room);
          } catch (error) {
            reject(error);
          }
        });
      }),
    []
  );

  const kickPlayer = useCallback(
    (roomId: string, targetId: string) => {
      emitKickPlayer({ roomId, targetId });
    },
    []
  );

  const changeAvatar = useCallback(
    async (roomId: string, avatarUrl: string): Promise<void> => {
      assertConnected();
      const state = useRoomStore.getState();
      const currentPlayerId = state.currentPlayer?.socketId;
      const avatarOption = AVATAR_OPTIONS.find((a) => a.url === avatarUrl);
      if (!avatarOption) throw new Error("Avatar no válido");
      if (state.room?.id !== roomId || !currentPlayerId) {
        throw new Error("No estás en esta sala");
      }
      if (state.players.some((player) =>
        player.socketId !== currentPlayerId && player.avatarUrl === avatarUrl
      )) {
        throw new Error("Este avatar ya está en uso");
      }

      await new Promise<void>((resolve, reject) => {
        emitChangeAvatar({ roomId, avatarId: avatarOption.id }, (response) => {
          if (!response.success) {
            reject(new SocketAckError(response.code, response.message));
            return;
          }
          resolve();
        });
      });
    },
    []
  );

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    kickPlayer,
    changeAvatar,
  };
}
