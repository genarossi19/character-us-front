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
  emitLobbyReady,
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

function roomTokenRenewal(token?: string): Promise<string> | undefined {
  if (!token) return;
  const session = useUserStore.getState();
  if (session.token !== token || !session.claims || session.claims.exp * 1000 - Date.now() > 120_000) return;
  return session.renewGoogleSession().then(() => {
    const current = useUserStore.getState();
    if (!current.token || current.user?.id !== session.user?.id) {
      throw new SocketAckError("AUTH_REQUIRED", "Inicia sesión para continuar.");
    }
    return current.token;
  });
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
    async (payload: CreateRoomPayload) => {
      const renewal = roomTokenRenewal(payload.token);
      const token = renewal ? await renewal : payload.token;
      return new Promise<Room>((resolve, reject) => {
        try {
          assertConnected();
        } catch (error) {
          reject(error);
          return;
        }
        emitCreateRoom({ ...payload, token }, (response) => {
          try {
            const data = getRoomFromAck(response);
            if (payload.settings?.playMode === "in_person" && data.room.settings?.playMode !== "in_person") throw new Error("El servidor todavía no admite partidas presenciales.");
            commitRoom(data);
            navigate("/lobby");
            resolve(data.room);
          } catch (error) {
            reject(error);
          }
        });
      });
    },
    [commitRoom, navigate]
  );

  const joinRoom = useCallback(
    async (payload: JoinRoomPayload) => {
      const renewal = roomTokenRenewal(payload.token);
      const token = renewal ? await renewal : payload.token;
      return new Promise<Room>((resolve, reject) => {
        try {
          assertConnected();
        } catch (error) {
          reject(error);
          return;
        }
        emitJoinRoom(token ? { ...payload, token } : payload, (response) => {
          try {
            const data = getRoomFromAck(response);
            commitRoom(data);
            navigate("/lobby");
            resolve(data.room);
          } catch (error) {
            reject(error);
          }
        });
      });
    },
    [commitRoom, navigate]
  );

  const leaveRoom = useCallback(
    (roomId: string) =>
      new Promise<void>((resolve, reject) => {
        assertConnected();
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
        assertConnected();
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

  const lobbyReady = useCallback(async (roomId: string): Promise<void> => {
    assertConnected();
    await new Promise<void>((resolve, reject) => {
      emitLobbyReady({ roomId }, (response) => {
        if (!response.success) {
          reject(new SocketAckError(response.code, response.message));
          return;
        }
        resolve();
      });
    });
  }, []);

  const kickPlayer = useCallback(
    async (roomId: string, targetId: string): Promise<void> => {
      assertConnected();
      await new Promise<void>((resolve, reject) => {
        emitKickPlayer({ roomId, targetId }, (response) => {
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
    lobbyReady,
  };
}
