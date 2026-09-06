import { useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import {
  emitSubmitWord,
  emitVotePlayer,
  emitSendChatMessage,
  onCharacterAssigned,
  onPhaseChanged,
  onTurnChanged,
  onWordHintRevealed,
  onAllWordsSubmitted,
  onVoteUpdate,
  onPlayerEliminated,
  onRoundResults,
  onGameEnded,
  onChatMessage,
} from "@/services/socket";
import type {
  GamePhase,
  ChatMessage,
  RoundResult,
  GameResult,
} from "@/types/game";

export function useSocketGame() {
  const game = useGameStore();
  const room = useRoomStore((s) => s.room);

  const submitWord = useCallback(
    (word: string) => {
      if (!room) return;
      emitSubmitWord({ roomId: room.id, word });
    },
    [room]
  );

  const votePlayer = useCallback(
    (targetId: string) => {
      if (!room) return;
      emitVotePlayer({ roomId: room.id, targetId });
    },
    [room]
  );

  const sendChatMessage = useCallback(
    (message: string) => {
      if (!room) return;
      emitSendChatMessage({ roomId: room.id, message });
    },
    [room]
  );

  // --- Listeners ---
  useEffect(() => {
    const cleanups = [
      onCharacterAssigned((data) => {
        game.setCharacter(data.character, data.isImpostor);
      }),

      onPhaseChanged((data) => {
        game.setPhase(data.phase as GamePhase);
      }),

      onTurnChanged((data) => {
        game.setCurrentTurnPlayer(data.playerId);
      }),

      onWordHintRevealed((data) => {
        game.addWordHint({
          playerId: data.playerId,
          username: data.username,
          word: "",
          revealed: false,
        });
      }),

      onAllWordsSubmitted((data) => {
        game.setWordHints(data.hints);
      }),

      onVoteUpdate((data) => {
        game.setVotes(data.votes);
      }),

      onPlayerEliminated((data) => {
        game.setEliminatedPlayer(data.player, data.wasImpostor);
        // Actualizar estado del jugador eliminado
        const roomStore = useRoomStore.getState();
        roomStore.updatePlayer(data.player.id, { isAlive: false });
      }),

      onRoundResults((result: RoundResult) => {
        game.addRoundResult(result);
      }),

      onGameEnded((result: GameResult) => {
        game.setWinner(result.winner);
        game.setPhase("gameEnd");
      }),

      onChatMessage((message: ChatMessage) => {
        game.addChatMessage(message);
      }),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, [game]);

  return {
    submitWord,
    votePlayer,
    sendChatMessage,
  };
}
