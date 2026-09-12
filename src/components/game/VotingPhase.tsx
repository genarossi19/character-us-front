import { useState } from "react";
import { motion } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";

export default function VotingPhase() {
  const { votes, votesVisible } = useGameStore();
  const players = useRoomStore((s) => s.players);
  const currentPlayer = useRoomStore((s) => s.currentPlayer);
  const room = useRoomStore((s) => s.room);
  const { votePlayer } = useSocketGame();

  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const visibleVotes = votesVisible ?? room?.settings.visibleVotes ?? false;

  const alivePlayers = players.filter(
    (p) => p.isAlive && p.socketId !== currentPlayer?.socketId
  );
  const userVote = currentPlayer ? votes[currentPlayer.socketId] : undefined;

  const handleVote = () => {
    if (!selectedVote || hasVoted || userVote) return;
    votePlayer(selectedVote);
    setHasVoted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Votación
        </h2>
        <p className="text-muted-foreground">
          {hasVoted || userVote
            ? "Esperando a que voten los demás..."
            : "¿Quién crees que es el impostor?"}
        </p>
      </motion.div>

      {/* Lista de jugadores */}
      <div className="w-full max-w-2xl space-y-3">
        {alivePlayers.map((player) => {
          const isSelected = selectedVote === player.socketId;
          const votesForThisPlayer = Object.values(votes).filter(
            (v) => v === player.socketId
          ).length;

          return (
            <motion.div
              key={player.socketId}
              whileHover={!hasVoted && !userVote ? { scale: 1.02 } : {}}
              whileTap={!hasVoted && !userVote ? { scale: 0.98 } : {}}
              onClick={() => {
                if (!hasVoted && !userVote) {
                  setSelectedVote(player.socketId);
                }
              }}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-cyan-100 dark:bg-cyan-500/20 border-cyan-500 dark:border-cyan-400"
                  : "bg-card border-border hover:border-accent/50"
              } ${
                hasVoted || userVote
                  ? "cursor-not-allowed opacity-70"
                  : ""
              }`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={player.avatarUrl}
                  alt={player.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="flex-1 text-lg font-semibold text-foreground">
                {player.username}
              </p>
              {visibleVotes && votesForThisPlayer > 0 && (
                <div className="bg-muted px-3 py-1 rounded-full text-sm font-medium text-muted-foreground">
                  {votesForThisPlayer} voto{votesForThisPlayer > 1 ? "s" : ""}
                </div>
              )}
              {!visibleVotes && player.hasVoted && (
                <span className="text-muted-foreground text-sm">Ha votado</span>
              )}
              {(hasVoted || userVote) && userVote === player.socketId && (
                <span className="text-green-500 font-bold">✅ Tu voto</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Botón confirmar */}
      {selectedVote && !hasVoted && !userVote && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleVote}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 text-lg"
          >
            Confirmar Voto
          </Button>
        </motion.div>
      )}
    </div>
  );
}
