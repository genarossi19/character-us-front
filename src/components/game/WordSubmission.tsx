import { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock3, Send } from "lucide-react";
import ClueBoard from "./ClueBoard";

export default function WordSubmission() {
  const { phase, currentTurnPlayerId, wordHints, hasSubmittedWord, isImpostor } = useGameStore();
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

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* Turno actual */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-xl font-semibold text-foreground mb-1">
          {!currentTurnPlayerId || turnCompleted
            ? "Esperando el siguiente turno"
            : isMyTurn ? "Tu turno" : `Turno de ${currentTurnPlayer?.username ?? "otro jugador"}`}
        </h2>
        {canWrite && <p id="word-help" className="text-sm text-muted-foreground">
          {!currentTurnPlayerId || turnCompleted
            ? "La partida se actualizará en un momento..."
            : isMyTurn
            ? isImpostor ? "Elige una palabra que encaje con las pistas" : "Escribe UNA palabra relacionada con tu personaje"
            : "Espera a que este jugador envíe su palabra..."}
        </p>}
      </motion.div>

      {/* Input de palabra (solo si es mi turno) */}
      {canWrite && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 w-full max-w-md"
        >
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu palabra..."
            maxLength={20}
            disabled={sending}
            aria-label="Tu palabra para esta ronda"
            aria-describedby={error ? "word-error" : "word-help"}
            className="min-w-0 flex-1 text-center text-base h-12 border-accent"
          />
          <Button
            onClick={handleSubmit}
            disabled={!word.trim() || sending}
            className="h-12 shrink-0 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4"
          >
            <Send className="size-4" aria-hidden="true" />
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </motion.div>
      )}

      {error && <p id="word-error" role="alert" className="text-center text-sm text-danger">{error}</p>}

      {/* Mensaje de que ya envié */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-sm text-accent"
        >
          {myHint?.skipped ? <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
          <p role="status">
            {myHint?.skipped ? "Se agotó tu turno" : "Palabra enviada"}
          </p>
        </motion.div>
      )}

      </section>
      <ClueBoard />
    </div>
  );
}
