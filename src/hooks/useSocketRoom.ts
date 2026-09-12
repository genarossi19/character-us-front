import { useEffect, useCallback } from "react";
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
  onRoomUpdated,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerKicked,
  onRoomClosed,
  onGameStarted,
} from "@/services/socket";
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

  const changeAvatar = useCallback(
    (roomId: string, avatarUrl: string) => {
      const currentPlayerId = useRoomStore.getState().currentPlayer?.socketId;
      if (currentPlayerId) {
        updatePlayer(currentPlayerId, { avatarUrl });
      }

      emitChangeAvatar({ roomId, avatarUrl }, (response) => {
        if (!response.success && currentPlayerId) {
          const previous = useRoomStore.getState().players.find(
            (p) => p.socketId === currentPlayerId
          );
          if (previous) {
            updatePlayer(currentPlayerId, { avatarUrl: previous.avatarUrl });
          }
          throw new SocketAckError(response.code, response.message);
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
