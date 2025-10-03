import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
}

interface VotingScreenProps {
  players: Player[];
  onVote: () => void;
}

const VotingScreen: React.FC<VotingScreenProps> = ({ players, onVote }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasVoted) {
            handleVote();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasVoted]);

  const handleVote = () => {
    setHasVoted(true);
    setTimeout(() => {
      onVote();
    }, 1500);
  };

  const handlePlayerSelect = (playerId: string) => {
    if (!hasVoted) {
      setSelectedPlayer(playerId);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-game-danger/5">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-game-danger/10 border border-game-danger/20 rounded-full">
            <div className="w-2 h-2 bg-game-danger rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-game-danger">
              Votación en Curso
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">
              ¿Quién es el Impostor?
            </h1>
            <p className="text-muted-foreground text-pretty">
              Vota por el jugador que crees que es el impostor
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg
                className="w-20 h-20 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-border"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-game-danger"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${(timeLeft / 30) * 100}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-game-danger">
                  {timeLeft}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Players to Vote */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selecciona un Jugador</span>
              <Badge
                variant="secondary"
                className="bg-game-danger/20 text-game-danger"
              >
                {hasVoted ? "Voto Enviado" : "Votando"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerSelect(player.id)}
                  disabled={hasVoted}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                    selectedPlayer === player.id
                      ? "border-game-danger bg-game-danger/10 shadow-lg"
                      : "border-border/30 bg-accent/20 hover:bg-accent/40 hover:border-border/50"
                  } ${
                    hasVoted
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-game-accent/20 rounded-full flex items-center justify-center text-xl border-2 border-border/50">
                      {player.avatar}
                    </div>
                    {selectedPlayer === player.id && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-game-danger rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.isHost ? "Anfitrión" : "Jugador"}
                    </p>
                  </div>
                  {selectedPlayer === player.id && (
                    <div className="text-game-danger">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vote Button */}
        <div className="space-y-3">
          <Button
            onClick={handleVote}
            disabled={!selectedPlayer || hasVoted}
            className="w-full bg-game-danger hover:bg-game-danger/90 text-white font-medium py-3 text-lg"
          >
            {hasVoted
              ? "Voto Enviado ✓"
              : selectedPlayer
              ? "Confirmar Voto"
              : "Selecciona un Jugador"}
          </Button>

          {hasVoted && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Esperando a que terminen las votaciones...
              </p>
            </div>
          )}
        </div>

        {/* Chat Preview */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Chat de Debate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <div className="flex items-start space-x-2">
                <span className="text-sm font-medium text-primary">Alex:</span>
                <span className="text-sm text-muted-foreground">
                  Creo que Maria actuó sospechoso...
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-sm font-medium text-game-accent">
                  Maria:
                </span>
                <span className="text-sm text-muted-foreground">
                  ¡Yo no soy el impostor!
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-sm font-medium text-game-warning">
                  Carlos:
                </span>
                <span className="text-sm text-muted-foreground">
                  Hmm, no estoy seguro...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VotingScreen;
