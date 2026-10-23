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
// Phase notices stay on the board; votes use a structured local entry.
function addActivity(key: string, message: string, activity: NonNullable<ChatMessage["activity"]>) {
  const game = useGameStore.getState();
  const id = `activity:${game.currentRound}:${key}`;
  const existing = game.chatMessages.find((entry) => entry.id === id);
  game.addChatMessage({ id, senderId: "system", senderName: "Partida", type: "system", message, activity, timestamp: existing?.timestamp ?? Date.now() });
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
        const duration = ({ character: 6_000, debate: 40_000, voting: 40_000, results: 5_000 } as Partial<Record<typeof data.phase, number>>)[data.phase] ?? 0;
        const offset = useGameStore.getState().serverClockOffset;
        useGameStore.setState({ phaseExpiresAt: duration ? Date.now() + offset + duration : null });
      }),

      onTurnChanged((data) => {
        useGameStore.getState().setCurrentTurnPlayer(data.playerId);
        useGameStore.setState({ turnIndex: data.turnIndex, totalTurns: data.total, turnExpiresAt: Date.now() + useGameStore.getState().serverClockOffset + 60_000 });
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
        if (!data.skipped) addActivity(`word:${data.playerId}`, `${data.username}: ${data.word}`, { kind: "word", actor: data.username, word: data.word });
      }),

      onAllWordsSubmitted((data) => {
        const game = useGameStore.getState();
        game.setWordHints(data.hints);
        game.setCurrentTurnPlayer(null);
        game.setHasSubmittedWord(data.hints.some(
          (hint) => hint.playerId === useRoomStore.getState().currentPlayer?.socketId
        ));
        data.hints.filter((hint) => !hint.skipped).forEach((hint) => addActivity(`word:${hint.playerId}`, `${hint.username}: ${hint.word}`, { kind: "word", actor: hint.username, word: hint.word }));
      }),

      onVoteUpdate((data) => {
        const game = useGameStore.getState();
        game.setVotes(data.votes);
        game.setVotesVisible(data.visible);
        const players = useRoomStore.getState().players;
        const actor = players.find((player) => player.socketId === data.voterId)?.username ?? "Un jugador";
        const targetId = data.targetId ?? data.votes[data.voterId];
        const target = data.visible ? players.find((player) => player.socketId === targetId)?.username : undefined;
        addActivity(`vote:${data.voterId}`, data.visible && target ? `${actor} votó a ${target}` : "Ha votado", data.visible && target ? { kind: "vote", actor, target } : { kind: "vote" });
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
        game.setWinner(result.winner === "impostor" ? "impostor" : "innocent");
        useGameStore.setState({ finalResult: result });
        game.setRoundResults(result.rounds);
        game.setPhase("finished");
      }),

      onChatMessage((message: ChatMessage) => {
        // Votes have a structured entry from voteUpdate. Other system notices
        // are already displayed on the board, so don't repeat them here.
        if (message.type !== "system") useGameStore.getState().addChatMessage(message);
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
