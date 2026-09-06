import { useEffect, useCallback } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { useGameStore } from "@/store/useGameStore";
import {
  emitCreateRoom,
  emitJoinRoom,
  emitLeaveRoom,
  emitStartGame,
  emitKickPlayer,
  onRoomUpdated,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerKicked,
  onRoomClosed,
  onGameStarted,
} from "@/services/socket";
import type { Room, Player, CreateRoomPayload, JoinRoomPayload } from "@/types/game";
import { useNavigate } from "react-router";

export function useSocketRoom() {
  const { setRoom, addPlayer, removePlayer, reset: resetRoom } = useRoomStore();
  const { setTotalRounds, resetGame } = useGameStore();
  const navigate = useNavigate();

  const createRoom = useCallback(
    (payload: CreateRoomPayload) => {
      emitCreateRoom(payload, (response) => {
        if (response && "room" in response) {
          const room = (response as { room: Room }).room;
          setRoom(room);
          navigate("/lobby");
        }
      });
    },
    [setRoom, navigate]
  );

  const joinRoom = useCallback(
    (payload: JoinRoomPayload) => {
      emitJoinRoom(payload, (response) => {
        if (response && "room" in response) {
          const room = (response as { room: Room }).room;
          setRoom(room);
          navigate("/lobby");
        }
      });
    },
    [setRoom, navigate]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      emitLeaveRoom(roomId, () => {
        resetRoom();
        resetGame();
        navigate("/menu");
      });
    },
    [resetRoom, resetGame, navigate]
  );

  const startGame = useCallback(
    (roomId: string) => {
      emitStartGame(roomId);
    },
    []
  );

  const kickPlayer = useCallback(
    (roomId: string, targetId: string) => {
      emitKickPlayer({ roomId, targetId });
    },
    []
  );

  // --- Listeners ---
  useEffect(() => {
    const cleanups = [
      onRoomUpdated((room: Room) => {
        setRoom(room);
      }),
      onPlayerJoined((player: Player) => {
        addPlayer(player);
      }),
      onPlayerLeft((playerId: string) => {
        removePlayer(playerId);
      }),
      onPlayerKicked((playerId: string) => {
        removePlayer(playerId);
      }),
      onRoomClosed(() => {
        resetRoom();
        resetGame();
        navigate("/menu");
      }),
      onGameStarted((data) => {
        setRoom(data.room);
        setTotalRounds(data.totalRounds);
        navigate("/game");
      }),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, [
    setRoom,
    addPlayer,
    removePlayer,
    resetRoom,
    resetGame,
    setTotalRounds,
    navigate,
  ]);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    kickPlayer,
  };
}
