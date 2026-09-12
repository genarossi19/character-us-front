import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";

export default function RoundResults() {
  const { eliminatedPlayer, wasImpostor, currentRound, totalRounds, votes } =
    useGameStore();
  const players = useRoomStore((s) => s.players);
  const visibleVotes = useRoomStore((s) => s.room?.settings.visibleVotes ?? false);

  const votedPlayers = Object.entries(votes).map(([voterId, targetId]) => {
    const voter = players.find((p) => p.socketId === voterId);
    const target = players.find((p) => p.socketId === targetId);
    return { voter, target };
  });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground"
      >
        Resultados Ronda {currentRound} / {totalRounds}
      </motion.h2>

      <AnimatePresence mode="wait">
        {eliminatedPlayer ? (
          <motion.div
            key="eliminated"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-6xl mb-2">
              {wasImpostor ? "🎉" : "💀"}
            </div>
            <h3 className="text-2xl font-bold text-red-500">
              Jugador Eliminado
            </h3>
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-red-500 shadow-2xl">
              <img
                src={eliminatedPlayer.avatarUrl}
                alt={eliminatedPlayer.username}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {eliminatedPlayer.username}
            </p>
            <p
              className={`text-xl font-bold ${
                wasImpostor ? "text-red-500" : "text-green-400"
              }`}
            >
              {wasImpostor
                ? "¡Era el Impostor! Ganan los tripulantes"
                : "Era un Tripulante"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="no-elimination"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-6xl mb-2">🤝</div>
            <h3 className="text-2xl font-bold text-yellow-500">
              Nadie fue eliminado
            </h3>
            <p className="text-lg text-muted-foreground">Empate de votos</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Votos */}
      {visibleVotes && <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-lg"
      >
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 text-center">
          ¿Quién votó a quién?
        </h4>
        <div className="space-y-2">
          {votedPlayers.map(({ voter, target }, i) =>
            voter && target ? (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={voter.avatarUrl}
                    alt={voter.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-foreground text-sm">
                    {voter.username}
                  </span>
                </div>
                <span className="text-muted-foreground text-sm">→</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">
                    {target.username}
                  </span>
                  <img
                    src={target.avatarUrl}
                    alt={target.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
              </div>
            ) : null
          )}
        </div>
      </motion.div>}

      <p className="text-sm text-muted-foreground">
        Siguiente ronda en unos segundos...
      </p>
    </div>
  );
}
