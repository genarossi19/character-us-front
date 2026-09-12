import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WordSubmission() {
  const { currentTurnPlayerId, wordHints } = useGameStore();
  const currentPlayer = useRoomStore((s) => s.currentPlayer);
  const players = useRoomStore((s) => s.players);
  const { submitWord } = useSocketGame();

  const [word, setWord] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isMyTurn = currentTurnPlayerId === currentPlayer?.socketId;
  const currentTurnPlayer = players.find(
    (p) => p.socketId === currentTurnPlayerId
  );

  const handleSubmit = useCallback(() => {
    if (!word.trim() || submitted) return;
    submitWord(word.trim());
    setSubmitted(true);
    setWord("");
  }, [word, submitted, submitWord]);

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

  // Reset submitted state when turn changes
  useEffect(() => {
    setSubmitted(false);
    setWord("");
  }, [currentTurnPlayerId]);

  const submittedCount = wordHints.length;
  const totalCount = players.length;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      {/* Turno actual */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isMyTurn ? "Tu turno" : `Turno de ${currentTurnPlayer?.username}`}
        </h2>
        <p className="text-muted-foreground">
          {isMyTurn
            ? "Escribe UNA palabra relacionada con tu personaje"
            : "Espera a que este jugador envíe su palabra..."}
        </p>
      </motion.div>

      {/* Input de palabra (solo si es mi turno) */}
      {isMyTurn && !submitted && (
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
            className="text-center text-xl h-14 border-2 border-accent focus:border-accent"
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={!word.trim()}
            className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3 text-lg"
          >
            Enviar Palabra
          </Button>
          <p className="text-sm text-muted-foreground">
            Esta palabra será tu pista para los demás
          </p>
        </motion.div>
      )}

      {/* Mensaje de que ya envié */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-4xl mb-4">✅</div>
          <p className="text-xl font-semibold text-green-500">
            Palabra enviada
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
              width: `${(submittedCount / totalCount) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Lista de quién ya envió */}
      <div className="flex flex-wrap gap-2 justify-center">
        {players.map((player) => {
          const hasSubmitted = wordHints.some(
            (h) => h.playerId === player.socketId
          );
          const isCurrentPlayer = player.socketId === currentPlayer?.socketId;
          return (
            <div
              key={player.socketId}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasSubmitted
                  ? "bg-green-500/20 text-green-500 border border-green-500/30"
                  : isCurrentPlayer
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {player.username} {hasSubmitted ? "✓" : ""}
            </div>
          );
        })}
      </div>

    </div>
  );
}
