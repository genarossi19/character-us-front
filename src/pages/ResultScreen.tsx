import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface EliminatedPlayer {
  id: string;
  name: string;
  avatar: string;
  wasImpostor: boolean;
}

interface ResultsScreenProps {
  eliminatedPlayer: EliminatedPlayer;
  onContinue: () => void;
  onBackToLobby: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  eliminatedPlayer,
  onContinue,
  onBackToLobby,
}) => {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowResult(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Resultados de Votación</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">
              ¡Votación Completada!
            </h1>
            <p className="text-muted-foreground text-pretty">
              Los jugadores han decidido eliminar a...
            </p>
          </div>
        </div>

        {/* Eliminated Player Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* Player Avatar */}
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-game-accent/20 rounded-full flex items-center justify-center text-6xl border-4 border-border/50 mx-auto">
                  {eliminatedPlayer.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-game-danger rounded-full flex items-center justify-center border-4 border-background">
                  <span className="text-white text-xl">❌</span>
                </div>
              </div>

              {/* Player Name */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{eliminatedPlayer.name}</h2>
                <Badge
                  variant="destructive"
                  className="bg-game-danger/20 text-game-danger border-game-danger/30"
                >
                  Eliminado
                </Badge>
              </div>

              {/* Reveal Animation */}
              <div className="space-y-4">
                {!showResult ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Result Reveal */}
                    <div
                      className={`p-6 rounded-2xl border-2 ${
                        eliminatedPlayer.wasImpostor
                          ? "bg-game-accent/10 border-game-accent/30"
                          : "bg-game-danger/10 border-game-danger/30"
                      }`}
                    >
                      <div className="text-center space-y-3">
                        <div className="text-4xl">
                          {eliminatedPlayer.wasImpostor ? "🎉" : "😱"}
                        </div>
                        <h3
                          className={`text-xl font-bold ${
                            eliminatedPlayer.wasImpostor
                              ? "text-game-accent"
                              : "text-game-danger"
                          }`}
                        >
                          {eliminatedPlayer.wasImpostor
                            ? "¡Era el Impostor!"
                            : "¡Era Inocente!"}
                        </h3>
                        <p className="text-muted-foreground">
                          {eliminatedPlayer.wasImpostor
                            ? "¡Felicidades! Los jugadores ganaron esta ronda."
                            : "El impostor sigue entre nosotros..."}
                        </p>
                      </div>
                    </div>

                    {/* Game Status */}
                    <Card className="bg-accent/30 border-border/30">
                      <CardContent className="pt-4">
                        <div className="text-center space-y-2">
                          <h4 className="font-semibold">
                            {eliminatedPlayer.wasImpostor
                              ? "Partida Terminada"
                              : "Continúa la Partida"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {eliminatedPlayer.wasImpostor
                              ? "Los jugadores identificaron correctamente al impostor"
                              : "El impostor debe ser eliminado para ganar"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {showResult && (
          <div className="space-y-3">
            <Button
              onClick={onContinue}
              className={`w-full font-medium py-3 text-lg ${
                eliminatedPlayer.wasImpostor
                  ? "bg-game-accent hover:bg-game-accent/90 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {eliminatedPlayer.wasImpostor
                ? "Nueva Partida"
                : "Continuar Jugando"}
            </Button>

            <Button
              onClick={() => onBackToLobby()}
              variant="outline"
              className="w-full border-border/50 hover:bg-accent/50 bg-transparent"
            >
              Volver al Lobby
            </Button>
          </div>
        )}

        {/* Stats */}
        {showResult && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Estadísticas de la Partida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">4</p>
                  <p className="text-xs text-muted-foreground">Jugadores</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-game-warning">2</p>
                  <p className="text-xs text-muted-foreground">Rondas</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-game-accent">30s</p>
                  <p className="text-xs text-muted-foreground">Tiempo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;
