import type React from "react";
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

interface GameData {
  roomCode: string;
  players: Player[];
  currentUser: { id: string; name: string; isHost: boolean };
}

interface WaitingRoomProps {
  gameData: GameData;
  onStartGame: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ gameData, onStartGame }) => {
  const { roomCode, players, currentUser } = gameData;
  const readyPlayers = players.filter((p) => p.isReady).length;
  const canStartGame = players.length >= 3 && readyPlayers === players.length;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-game-accent rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Sala Activa</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">Sala de Espera</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">Código:</span>
              <code className="px-3 py-1 bg-primary/20 text-primary rounded-lg font-mono text-lg font-bold">
                {roomCode}
              </code>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Jugadores ({players.length}/8)</span>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {readyPlayers}/{players.length} listos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-accent/30 border border-border/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-game-accent/20 rounded-full flex items-center justify-center text-2xl border-2 border-border/50">
                      {player.avatar}
                    </div>
                    {player.isHost && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-game-warning rounded-full flex items-center justify-center">
                        <span className="text-xs">👑</span>
                      </div>
                    )}
                    {player.isReady && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-game-accent rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.isHost
                        ? "Anfitrión"
                        : player.isReady
                        ? "Listo"
                        : "Esperando"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">
                  {players.length}
                </p>
                <p className="text-sm text-muted-foreground">Jugadores</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-game-danger">1</p>
                <p className="text-sm text-muted-foreground">Impostor</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-game-accent">3</p>
                <p className="text-sm text-muted-foreground">Mín. jugadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentUser.isHost ? (
            <Button
              onClick={onStartGame}
              disabled={!canStartGame}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 text-lg"
            >
              {canStartGame
                ? "Iniciar Partida"
                : `Esperando jugadores (${players.length}/3)`}
            </Button>
          ) : (
            <Button className="w-full bg-game-accent hover:bg-game-accent/90 text-white font-medium py-3 text-lg">
              Estoy Listo ✓
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full border-border/50 hover:bg-accent/50 bg-transparent"
          >
            Salir de la Sala
          </Button>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {canStartGame
              ? "¡Todos listos! El anfitrión puede iniciar la partida."
              : `Esperando a que ${
                  players.length < 3
                    ? "se unan más jugadores"
                    : "todos estén listos"
                }...`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
