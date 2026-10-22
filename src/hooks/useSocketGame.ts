import { useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import {
  emitSubmitWord,
  emitVotePlayer,
  emitSendChatMessage,
  emitDebateReady,
  isSocketConnected,
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
    async (word: string): Promise<void> => {
      const trimmedWord = word.trim();
      if (!room) throw new Error("No estás en una sala.");
      if (!trimmedWord || trimmedWord.length > 20) {
        throw new Error("La palabra debe tener entre 1 y 20 caracteres.");
      }
      if (!isSocketConnected()) throw new Error("No hay conexión con el servidor.");
      const playerId = useRoomStore.getState().currentPlayer?.socketId;
      await new Promise<void>((resolve, reject) => {
        emitSubmitWord({ roomId: room.id, word: trimmedWord }, (response) => {
          if (!response.success) {
            reject(Object.assign(new Error(response.message), { code: response.code }));
            return;
          }
          const game = useGameStore.getState();
          if (useRoomStore.getState().room?.id === room.id &&
              game.phase === "word" && game.currentTurnPlayerId === playerId) {
            game.setHasSubmittedWord(true);
          }
          resolve();
        });
      });
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
        useGameStore.setState({ impostorIds: data.impostorIds ?? [] });
      }),

      onPhaseChanged((data) => {
        useGameStore.getState().setPhase(data.phase);
      }),

      onTurnChanged((data) => {
        useGameStore.getState().setCurrentTurnPlayer(data.playerId);
        useGameStore.setState({ turnIndex: data.turnIndex, totalTurns: data.total });
      }),

      onWordHintRevealed((data) => {
        const game = useGameStore.getState();
        game.addWordHint({
          playerId: data.playerId,
          username: data.username,
          word: data.word,
          revealed: true,
          skipped: data.skipped,
        });
        if (data.playerId === useRoomStore.getState().currentPlayer?.socketId) {
          game.setHasSubmittedWord(true);
        }
      }),

      onAllWordsSubmitted((data) => {
        const game = useGameStore.getState();
        game.setWordHints(data.hints);
        game.setCurrentTurnPlayer(null);
        game.setHasSubmittedWord(data.hints.some(
          (hint) => hint.playerId === useRoomStore.getState().currentPlayer?.socketId
        ));
      }),

      onVoteUpdate((data) => {
        const game = useGameStore.getState();
        game.setVotes(data.votes);
        game.setVotesVisible(data.visible);
        useRoomStore.getState().updatePlayer(data.voterId, { hasVoted: true });
        useGameStore.setState({ voterIds: [...new Set([...game.voterIds, data.voterId])] });
        if (data.voterId === useRoomStore.getState().currentPlayer?.socketId) {
          useGameStore.setState({ hasVoted: true, ...(data.targetId ? { votedFor: data.targetId } : {}) });
        }
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
