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
  const userVotedFor = votes[currentUserId]; // id del jugador al que votó

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
          const isSelected = selectedVote === player.id;
          const hasVotedThisPlayer = userVotedFor === player.id; // solo true para el jugador votado
          const votersForThisPlayer = Object.entries(votes)
            .filter(([, votedId]) => votedId === player.id)
            .map(([voterId]) => players.find((p) => p.id === voterId));

          return (
            <div
              key={player.id}
              onClick={() => {
                if (phase === "voting" && !userVotedFor) {
                  setSelectedVote(player.id);
                }
              }}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer ${
                isSelected
                  ? "bg-cyan-100 dark:bg-cyan-500 border-cyan-500 dark:border-cyan-700 text-white"
                  : "bg-card border-gray-200 dark:bg-gray-800/60 dark:border-white/20"
              } ${
                userVotedFor && !hasVotedThisPlayer
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="flex-1 text-lg text-foreground font-semibold">
                {player.name}
              </p>

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

              {phase === "voting" && hasVotedThisPlayer && (
                <span className="text-green-400 font-bold">✅ Votaste</span>
              )}
            </div>
          );
        })}

      {/* Confirmar voto (solo si no ha votado) */}
      {phase === "voting" && selectedVote && !userVotedFor && (
        <Button
          onClick={confirmVote}
          className="mt-2 bg-red-500 hover:bg-red-600 px-6 py-2 rounded-2xl font-bold"
        >
          Confirmar Voto
        </Button>
      )}

      {/* Botón para cerrar la votación */}
      {phase === "voting" && (
        <Button
          onClick={endVoting}
          className="mt-2 bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-2xl font-bold"
        >
          Cerrar Votación (botón simulador)
        </Button>
      )}
    </div>
  );
};

export default VotingPanel;
