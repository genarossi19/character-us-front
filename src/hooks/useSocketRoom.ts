import { useEffect, useCallback, useRef } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { useGameStore } from "@/store/useGameStore";
import {
  emitCreateRoom,
  emitJoinRoom,
  emitLeaveRoom,
  emitStartGame,
  emitKickPlayer,
  emitChangeAvatar,
  getSocket,
  isSocketConnected,
  onRoomUpdated,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerKicked,
  onRoomClosed,
  onGameStarted,
} from "@/services/socket";
import { AVATAR_OPTIONS } from "@/constants/avatars";
import type {
  AckResponse,
  CreateRoomPayload,
  JoinRoomPayload,
  Player,
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
  const { setRoom, setCurrentPlayer, addPlayer, removePlayer, updatePlayer, reset: resetRoom } =
    useRoomStore();
  const { setTotalRounds, setCurrentRound, setPhase, resetGame } = useGameStore();
  const navigate = useNavigate();

  const commitRoom = useCallback(
    (room: Room, username: string) => {
      setRoom(room);
      const socketId = getSocket().id;
      const player =
        room.players.find((candidate) => candidate.socketId === socketId) ||
        room.players.find((candidate) => candidate.username === username);

      if (player) {
        setCurrentPlayer(player);
      }
    },
    [setCurrentPlayer, setRoom]
  );

  const getRoomFromAck = (response: AckResponse<RoomResponse>): Room => {
    if (!response.success) {
      throw new SocketAckError(response.code, response.message);
    }
    if (!response.data?.room) {
      throw new Error("El servidor no devolvió la sala creada");
    }
    return response.data.room;
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
            const room = getRoomFromAck(response);
            commitRoom(room, payload.username);
            navigate("/lobby");
            resolve(room);
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
            const room = getRoomFromAck(response);
            commitRoom(room, payload.username);
            navigate("/lobby");
            resolve(room);
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
          navigate("/menu");
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
            resolve(getRoomFromAck(response));
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

  const pendingAvatarRef = useRef<string | null>(null);

  const changeAvatar = useCallback(
    (roomId: string, avatarUrl: string) => {
      const state = useRoomStore.getState();
      const currentPlayerId = state.currentPlayer?.socketId;
      const previousAvatarUrl = state.currentPlayer?.avatarUrl;

      const avatarOption = AVATAR_OPTIONS.find((a) => a.url === avatarUrl);
      if (!avatarOption) return;

      pendingAvatarRef.current = avatarUrl;

      if (currentPlayerId) {
        updatePlayer(currentPlayerId, { avatarUrl });
      }

      emitChangeAvatar({ roomId, avatarId: avatarOption.id }, (response) => {
        if (!response.success && currentPlayerId && previousAvatarUrl) {
          pendingAvatarRef.current = null;
          updatePlayer(currentPlayerId, { avatarUrl: previousAvatarUrl });
        }
      });
    },
    [updatePlayer]
  );

  // --- Listeners ---
  useEffect(() => {
    const cleanups = [
      onRoomUpdated((room: Room) => {
        const currentPlayerId = useRoomStore.getState().currentPlayer?.socketId;
        setRoom(room);
        const currentPlayer = room.players.find(
          (player) => player.socketId === currentPlayerId
        );
        if (currentPlayer) setCurrentPlayer(currentPlayer);

        if (pendingAvatarRef.current && currentPlayerId) {
          updatePlayer(currentPlayerId, { avatarUrl: pendingAvatarRef.current });
          const updated = useRoomStore.getState().players.find(
            (p) => p.socketId === currentPlayerId
          );
          if (updated) setCurrentPlayer(updated);
          pendingAvatarRef.current = null;
        }
      }),
      onPlayerJoined((player: Player) => {
        addPlayer(player);
      }),
      onPlayerLeft((playerId: string) => {
        removePlayer(playerId);
      }),
      onPlayerKicked(() => {
        resetRoom();
        resetGame();
        navigate("/menu");
      }),
      onRoomClosed(() => {
        resetRoom();
        resetGame();
        navigate("/menu");
      }),
      onGameStarted((data) => {
        commitRoom(data.room, useRoomStore.getState().currentPlayer?.username || "");
        setTotalRounds(data.totalRounds);
        setCurrentRound(data.room.currentRound);
        setPhase(data.room.gamePhase);
        navigate("/game");
      }),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, [
    setRoom,
    setCurrentPlayer,
    addPlayer,
    removePlayer,
    updatePlayer,
    resetRoom,
    resetGame,
    setTotalRounds,
    setCurrentRound,
    setPhase,
    commitRoom,
    navigate,
  ]);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    kickPlayer,
    changeAvatar,
  };
}
