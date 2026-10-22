import { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WordSubmission() {
  const { phase, currentTurnPlayerId, wordHints, hasSubmittedWord } = useGameStore();
  const currentPlayer = useRoomStore((s) => s.currentPlayer);
  const players = useRoomStore((s) => s.players);
  const { submitWord } = useSocketGame();

  const [word, setWord] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const myHint = wordHints.find((hint) => hint.playerId === currentPlayer?.socketId);
  const submitted = hasSubmittedWord || Boolean(myHint);

  const isMyTurn = currentTurnPlayerId === currentPlayer?.socketId;
  const currentTurnPlayer = players.find(
    (p) => p.socketId === currentTurnPlayerId
  );
  const turnCompleted = wordHints.some((hint) => hint.playerId === currentTurnPlayerId) || (isMyTurn && submitted);
  const canWrite = phase === "word" && isMyTurn && Boolean(currentPlayer?.isAlive) && !submitted;

  const handleSubmit = useCallback(async () => {
    if (!canWrite || !word.trim() || word.trim().length > 20 || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      await submitWord(word.trim());
      setWord("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo enviar la palabra.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [word, canWrite, submitWord]);

  // Auto-submit on Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const submittedCount = wordHints.length;
  const totalCount = players.filter((player) => player.isAlive).length;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      {/* Turno actual */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {!currentTurnPlayerId || turnCompleted
            ? "Esperando el siguiente turno"
            : isMyTurn ? "Tu turno" : `Turno de ${currentTurnPlayer?.username ?? "otro jugador"}`}
        </h2>
        <p className="text-muted-foreground">
          {!currentTurnPlayerId || turnCompleted
            ? "La partida se actualizará en un momento..."
            : isMyTurn
            ? "Escribe UNA palabra relacionada con tu personaje"
            : "Espera a que este jugador envíe su palabra..."}
        </p>
      </motion.div>

      {/* Input de palabra (solo si es mi turno) */}
      {canWrite && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 w-full max-w-md"
        >
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu palabra..."
            maxLength={20}
            disabled={sending}
            className="text-center text-xl h-14 border-2 border-accent focus:border-accent"
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={!word.trim() || sending}
            className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3 text-lg"
          >
            {sending ? "Enviando..." : "Enviar Palabra"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Esta palabra será tu pista para los demás
          </p>
        </motion.div>
      )}

      {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}

      {/* Mensaje de que ya envié */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-4xl mb-4">✅</div>
          <p className="text-xl font-semibold text-green-500">
            {myHint?.skipped ? "Se agotó tu turno" : "Palabra enviada"}
          </p>
          <p className="text-muted-foreground mt-2">
            Espera a que los demás terminen...
          </p>
        </motion.div>
      )}

      {/* Progreso */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Palabras enviadas</span>
          <span>
            {submittedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${totalCount ? Math.min(100, (submittedCount / totalCount) * 100) : 0}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Las pistas son públicas en cuanto el servidor las acepta. */}
      <div aria-live="polite" className="flex flex-wrap gap-2 justify-center">
        {players.map((player) => {
          const hint = wordHints.find(
            (h) => h.playerId === player.socketId
          );
          const isCurrentPlayer = player.socketId === currentPlayer?.socketId;
          return (
            <div
              key={player.socketId}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                hint
                  ? "bg-green-500/20 text-green-500 border border-green-500/30"
                  : isCurrentPlayer
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{player.username}</span>
              {hint && <span className="ml-2 font-semibold break-all">{hint.skipped ? "Sin palabra" : hint.word}</span>}
              {!hint && !player.isAlive && <span className="ml-2">Eliminado</span>}
            </div>
          );
        })}
      </div>

    </div>
  );
}
