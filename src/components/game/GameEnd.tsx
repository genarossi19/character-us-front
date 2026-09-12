import { motion } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export default function GameEnd() {
  const { winner, roundResults } = useGameStore();
  const { room, currentPlayer } = useRoomStore();
  const { resetGame } = useGameStore();
  const navigate = useNavigate();

  const isHost = currentPlayer?.isHost;
  const crewWon = winner === "crew";

  const handleBackToLobby = () => {
    resetGame();
    if (isHost && room) {
      // Host puede crear nueva sala
      navigate("/create");
    } else {
      navigate("/menu");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      {/* Victoria */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-center"
      >
        <div className="text-8xl mb-4">{crewWon ? "🎉" : "🕵️"}</div>
        <h1
          className={`text-5xl font-extrabold mb-2 ${
            crewWon ? "text-green-500" : "text-red-500"
          }`}
        >
          {crewWon ? "¡Tripulantes Ganan!" : "¡Impostor Gana!"}
        </h1>
        <p className="text-xl text-muted-foreground">
          {crewWon
            ? "El impostor fue descubierto"
            : "El impostor logró confundir a todos"}
        </p>
      </motion.div>

      {/* Resumen de rondas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-lg space-y-3"
      >
        <h3 className="text-lg font-semibold text-foreground text-center">
          Resumen de la partida
        </h3>
        {roundResults.map((result, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border border-border"
          >
            <span className="text-sm text-muted-foreground">
              Ronda {result.round}
            </span>
            {result.eliminatedPlayer ? (
              <div className="flex items-center gap-2">
                <img
                  src={result.eliminatedPlayer.avatarUrl}
                  alt={result.eliminatedPlayer.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-medium text-foreground text-sm">
                  {result.eliminatedPlayer.username}
                </span>
                <span
                  className={`text-xs font-bold ${
                    result.wasImpostor ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {result.wasImpostor ? "IMPOSTOR" : "tripulante"}
                </span>
              </div>
            ) : (
              <span className="text-sm text-yellow-500 font-medium">
                Empate
              </span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Botón */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={handleBackToLobby}
          className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 text-lg"
        >
          {isHost ? "Crear Nueva Sala" : "Volver al Menú"}
        </Button>
      </motion.div>
    </div>
  );
}
