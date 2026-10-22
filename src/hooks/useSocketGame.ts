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

// Presentation entries derived only from public, confirmed server events.
// Phases and votes already have server-authored chat messages: do not duplicate them.
function addActivity(key: string, message: string) {
  const game = useGameStore.getState();
  const id = `activity:${game.currentRound}:${key}`;
  const existing = game.chatMessages.find((entry) => entry.id === id);
  game.addChatMessage({ id, senderId: "system", senderName: "Partida", type: "system", message, timestamp: existing?.timestamp ?? Date.now() });
}

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
    async (message: string): Promise<void> => {
      if (!room) throw new Error("No estás en una sala.");
      const text = message.trim();
      if (!text || text.length > 500) throw new Error("El mensaje debe tener entre 1 y 500 caracteres.");
      const phase = useGameStore.getState().phase;
      if (phase !== "debate" && phase !== "voting") throw new Error("El chat se abre durante el debate y la votación.");
      if (!isSocketConnected()) throw new Error("No hay conexión con el servidor.");
      await new Promise<void>((resolve, reject) => {
        emitSendChatMessage({ roomId: room.id, message: text }, (response) => {
          if (!response.success) reject(Object.assign(new Error(response.message), { code: response.code }));
          else resolve();
        });
      });
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
        const player = useRoomStore.getState().players.find((candidate) => candidate.socketId === data.playerId);
        addActivity(`turn:${data.playerId}`, `Turno de ${data.username ?? player?.username ?? "otro jugador"}: está eligiendo su palabra.`);
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
        addActivity(`word:${data.playerId}`, data.skipped ? `${data.username} se quedó sin palabra.` : `${data.username} dio su pista: «${data.word}».`);
      }),

      onAllWordsSubmitted((data) => {
        const game = useGameStore.getState();
        game.setWordHints(data.hints);
        game.setCurrentTurnPlayer(null);
        game.setHasSubmittedWord(data.hints.some(
          (hint) => hint.playerId === useRoomStore.getState().currentPlayer?.socketId
        ));
        data.hints.forEach((hint) => addActivity(`word:${hint.playerId}`, hint.skipped ? `${hint.username} se quedó sin palabra.` : `${hint.username} dio su pista: «${hint.word}».`));
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
        addActivity(`eliminated:${data.player.socketId}`, `${data.player.username} fue eliminado. ${data.wasImpostor ? "Era un impostor." : "Era tripulante."}`);
      }),

      onRoundResults((result: RoundResult) => {
        useGameStore.getState().addRoundResult(result);
      }),

      onGameEnded((result: GameResult) => {
        const game = useGameStore.getState();
        game.setWinner(result.winner === "impostor" ? "impostor" : "crew");
        useGameStore.setState({ finalResult: result });
        game.setRoundResults(result.rounds);
        game.setPhase("finished");
        addActivity("finished", result.winner === "impostor" ? "La partida terminó. Ganaron los impostores." : "La partida terminó. Ganaron los tripulantes.");
      }),

      onChatMessage((message: ChatMessage) => {
        useGameStore.getState().addChatMessage(message);
      }),
      onDebateReadyUpdate((data) => {
        const previous = useGameStore.getState().readyPlayerIds;
        data.readyPlayers.filter((id) => !previous.includes(id)).forEach((id) => {
          const player = useRoomStore.getState().players.find((candidate) => candidate.socketId === id);
          addActivity(`ready:${id}`, `${player?.username ?? "Un jugador"} está listo para votar.`);
        });
        useGameStore.getState().setDebateReady(data.readyPlayers, data.total);
      }),
      onReconnectTimeout((data) => {
        useGameStore.getState().setReconnectTimeout(data.playerId, data.secondsLeft);
      }),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, []);

}
