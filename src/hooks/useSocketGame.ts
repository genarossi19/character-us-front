import { useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import {
  emitSubmitWord,
  emitVotePlayer,
  emitSendChatMessage,
  emitDebateReady,
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
  onDebateReadyUpdate,
  onReconnectTimeout,
} from "@/services/socket";
import type {
  ChatMessage,
  RoundResult,
  GameResult,
} from "@/types/game";

export function useSocketGame() {
  const room = useRoomStore((s) => s.room);

  const submitWord = useCallback(
    (word: string) => {
      if (!room) return;
      emitSubmitWord({ roomId: room.id, word: word.slice(0, 20) });
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
      emitSendChatMessage({ roomId: room.id, message: message.slice(0, 500) });
    },
    [room]
  );

  const debateReady = useCallback(() => {
    if (!room) return;
    emitDebateReady({ roomId: room.id });
  }, [room]);

  return {
    submitWord,
    votePlayer,
    sendChatMessage,
    debateReady,
  };
}

export function useSocketGameEvents() {
  useEffect(() => {
    const cleanups = [
      onCharacterAssigned((data) => {
        // The server sends null to impostors; never infer or fetch the character.
        useGameStore.getState().setCharacter(data.character, data.isImpostor);
      }),

      onPhaseChanged((data) => {
        useGameStore.getState().setPhase(data.phase);
      }),

      onTurnChanged((data) => {
        useGameStore.getState().setCurrentTurnPlayer(data.playerId);
      }),

      onWordHintRevealed((data) => {
        useGameStore.getState().addWordHint({
          playerId: data.playerId,
          username: data.username,
          word: data.word,
          revealed: true,
          skipped: data.skipped,
        });
      }),

      onAllWordsSubmitted((data) => {
        useGameStore.getState().setWordHints(data.hints);
      }),

      onVoteUpdate((data) => {
        const game = useGameStore.getState();
        game.setVotes(data.votes);
        game.setVotesVisible(data.visible);
        useRoomStore.getState().updatePlayer(data.voterId, { hasVoted: true });
      }),

      onPlayerEliminated((data) => {
        useGameStore.getState().setEliminatedPlayer(data.player, data.wasImpostor);
        useRoomStore.getState().updatePlayer(data.player.socketId, { isAlive: false });
      }),

      onRoundResults((result: RoundResult) => {
        useGameStore.getState().addRoundResult(result);
      }),

      onGameEnded((result: GameResult) => {
        const game = useGameStore.getState();
        game.setWinner(result.winner);
        game.setRoundResults(result.rounds);
        game.setPhase("finished");
      }),

      onChatMessage((message: ChatMessage) => {
        useGameStore.getState().addChatMessage(message);
      }),
      onDebateReadyUpdate((data) => {
        useGameStore.getState().setDebateReady(data.readyPlayers, data.total);
      }),
      onReconnectTimeout((data) => {
        useGameStore.getState().setReconnectTimeout(data.playerId, data.secondsLeft);
      }),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, []);

}
