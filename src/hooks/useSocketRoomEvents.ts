import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useRoomStore } from "@/store/useRoomStore";
import { useGameStore } from "@/store/useGameStore";
import { useRoomSessionStore } from "@/store/useRoomSessionStore";
import { onRoomUpdated, onPlayerJoined, onPlayerLeft, onPlayerKicked, onRoomClosed, onGameStarted } from "@/services/socket";

export function useSocketRoomEvents() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => {
    const close = (message: string) => {
      useRoomStore.getState().reset();
      useGameStore.getState().resetGame();
      navigateRef.current("/join", { replace: true });
      useRoomSessionStore.getState().clearSession();
      toast.error(message);
    };
    const cleanups = [
      onRoomUpdated((room) => {
        if (useRoomStore.getState().room?.id !== room.id) return;
        useRoomStore.getState().setRoom(room);
        useGameStore.getState().setCurrentRound(room.currentRound);
        if (room.status === "waiting" && !useGameStore.getState().finalResult) {
          useGameStore.getState().setPhase("waiting");
          navigateRef.current("/lobby", { replace: true });
        }
      }),
      onPlayerJoined((player) => {
        if (useRoomStore.getState().room) useRoomStore.getState().addPlayer(player);
      }),
      onPlayerLeft((id) => useRoomStore.getState().removePlayer(id)),
      onPlayerKicked((id) => {
        const localId = useRoomSessionStore.getState().session?.playerId ?? useRoomStore.getState().currentPlayer?.socketId;
        if (id === localId) close("Fuiste expulsado de la sala.");
      }),
      onRoomClosed(({ reason }) => {
        if (useRoomSessionStore.getState().session || useRoomStore.getState().room) close(reason || "La sala se cerró.");
      }),
      onGameStarted((data) => {
        const roomStore = useRoomStore.getState();
        if (roomStore.room?.id !== data.room.id) return;
        const localId = useRoomSessionStore.getState().session?.playerId;
        const player = data.room.players.find((candidate) => candidate.socketId === localId);
        if (!player) return;
        roomStore.setRoom(data.room);
        roomStore.setCurrentPlayer(player);
        const game = useGameStore.getState();
        const clockOffset = game.serverClockOffset;
        game.resetGame();
        useGameStore.setState({ serverClockOffset: clockOffset });
        game.setTotalRounds(data.totalRounds);
        game.setCurrentRound(data.room.currentRound);
        game.setPhase(data.room.gamePhase);
        navigateRef.current("/game", { replace: true });
      }),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
}
