import React from "react";
import { Button } from "../components/ui/button";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  isImpostor: boolean;
  character: string;
}

interface VotingPanelProps {
  players: Player[];
  currentUserId: string;
  phase: "voting" | "voteSummary";
  votes: Record<string, string>;
  selectedVote: string | null;
  setSelectedVote: (id: string | null) => void;
  confirmVote: () => void;
  endVoting: () => void;
  votingCountdown: number;
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  players,
  currentUserId,
  phase,
  votes,
  selectedVote,
  setSelectedVote,
  confirmVote,
  endVoting,
  votingCountdown,
}) => {
  return (
    <div className="w-full max-w-4xl flex flex-col gap-4 overflow-hidden">
      {phase === "voting" && (
        <div className="text-center text-yellow-400 font-bold mb-2">
          Tiempo para votar: {votingCountdown}s
        </div>
      )}

      {players
        .filter((p) => p.isAlive)
        .map((player) => {
          const hasVoted = votes[currentUserId] === player.id;
          const isSelected = selectedVote === player.id;
          const votersForThisPlayer = Object.entries(votes)
            .filter(([_, votedId]) => votedId === player.id)
            .map(([voterId]) => players.find((p) => p.id === voterId));

          return (
            <div
              key={player.id}
              onClick={() => phase === "voting" && setSelectedVote(player.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer ${
                isSelected
                  ? "bg-cyan-500 border-white"
                  : "bg-gray-800/60 border-white/20"
              }`}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="flex-1 text-lg font-semibold">{player.name}</p>

              {/* Avatares de votantes (solo en resumen) */}
              {phase === "voteSummary" && votersForThisPlayer.length > 0 && (
                <div className="flex gap-1">
                  {votersForThisPlayer.map(
                    (voter) =>
                      voter && (
                        <div
                          key={voter.id}
                          className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/30"
                        >
                          <img
                            src={voter.avatar}
                            alt={voter.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                  )}
                </div>
              )}

              {/* Marca de votado */}
              {phase === "voting" && hasVoted && (
                <span className="text-green-400 font-bold">✅</span>
              )}
            </div>
          );
        })}

      {/* Confirmar voto (solo en votación) */}
      {phase === "voting" && selectedVote && (
        <Button
          onClick={confirmVote}
          className="mt-2 bg-red-500 hover:bg-red-600 px-6 py-2 rounded-2xl font-bold"
        >
          Confirmar Voto
        </Button>
      )}

      {/* Botón cerrar votación */}
      {phase === "voting" && (
        <Button
          onClick={endVoting}
          className="mt-2 bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-2xl font-bold"
        >
          Cerrar Votación
        </Button>
      )}
    </div>
  );
};

export default VotingPanel;
