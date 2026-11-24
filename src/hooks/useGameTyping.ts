import { useEffect, useRef, useState } from "react";
import { onServerEvent } from "@/services/socket/eventDelivery";
import { getSocket } from "@/services/socket/socket";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { isRecoveringRoom } from "@/store/useRoomSessionStore";
import type { PlayerTyping, TypingActivityPayload } from "@/types/game";

const TYPING_INTERVAL_MS = 750;

export function useGameTyping() {
  const { room, currentPlayer, players } = useRoomStore();
  const { phase, currentRound, turnIndex, currentTurnPlayerId } = useGameStore();
  const [signals, setSignals] = useState<Record<string, PlayerTyping>>({});
  const lastSent = useRef<{ scope: string; startedAt: number; active: boolean } | undefined>(undefined);

  useEffect(() => {
    const socket = getSocket();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    function removeSignal(playerId: string) {
      clearTimeout(timers.get(playerId));
      timers.delete(playerId);
      setSignals((previous) => {
        if (!previous[playerId]) return previous;
        const next = { ...previous };
        delete next[playerId];
        return next;
      });
    }
    const unsubscribe = onServerEvent<PlayerTyping>("playerTyping", (signal) => {
      if (!signal.active) {
        removeSignal(signal.playerId);
        return;
      }
      clearTimeout(timers.get(signal.playerId));
      timers.set(signal.playerId, setTimeout(() => removeSignal(signal.playerId), signal.ttlMs));
      setSignals((previous) => ({ ...previous, [signal.playerId]: signal }));
    });
    function clearTimers() {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    }
    function onDisconnect() {
      clearTimers();
      lastSent.current = undefined;
      setSignals({});
    }
    socket.on("disconnect", onDisconnect);
    return () => {
      clearTimers();
      unsubscribe();
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  function reportTyping(active: boolean) {
    if (!room || !currentPlayer || room.settings.playMode === "in_person" || isRecoveringRoom() ||
        (phase !== "word" && phase !== "debate" && phase !== "voting")) return;

    const socket = getSocket();
    if (!socket.connected) return;
    const scope = `${room.id}:${currentRound}:${phase}:${phase === "word" ? turnIndex : "chat"}`;
    const previous = lastSent.current?.scope === scope ? lastSent.current : undefined;
    const now = performance.now();
    if (active ? previous && now - previous.startedAt < TYPING_INTERVAL_MS : !previous?.active) return;

    lastSent.current = { scope, startedAt: active ? now : previous?.startedAt ?? now, active };
    const payload: TypingActivityPayload = {
      roomId: room.id, round: currentRound, active,
      ...(phase === "word" ? { phase, turnIndex } : { phase }),
    };
    if (active && previous?.active) socket.volatile.emit("typingActivity", payload);
    else socket.emit("typingActivity", payload);
  }

  const typingPlayers = players.filter((player) => {
    const signal = signals[player.socketId];
    return signal && player.isOnline && player.socketId !== currentPlayer?.socketId &&
      (player.isAlive || currentPlayer?.isAlive === false) &&
      signal.roomId === room?.id && signal.round === currentRound && signal.phase === phase &&
      (signal.phase !== "word" || signal.turnIndex === turnIndex);
  });
  return {
    reportTyping,
    chatTypers: phase === "debate" || phase === "voting" ? typingPlayers : [],
    isWordTyping: phase === "word" && typingPlayers.some((player) => player.socketId === currentTurnPlayerId),
  };
}
