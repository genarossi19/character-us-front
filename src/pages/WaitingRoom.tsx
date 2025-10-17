import type React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import BackgroundAnimate from "../components/BackgroundAnimate";
import { ThemeToggleButton } from "../components/ui/shadcn-io/theme-toggle-button";
import { Link } from "react-router";

interface Player {
  id: string;
  name: string;
  avatar: string; // nombre de archivo avatar1..avatar8
  isHost: boolean;
  isReady: boolean;
}

interface GameData {
  roomCode: string;
  players: Player[];
  currentUser: { id: string; name: string; isHost: boolean };
  category: string; // nueva propiedad
  impostorsKnowEachOther: boolean; // nueva propiedad
  impostorCount: number; // número de impostores
  minPlayers: number; // mínimo de jugadores
}

interface WaitingRoomProps {
  gameData: GameData;
  onStartGame: () => void;
  onToggleReady?: () => void; // para marcar listo si no es host
}

const avatarOptions = [
  "/avatar1.webp",
  "/avatar2.webp",
  "/avatar3.webp",
  "/avatar4.webp",
  "/avatar5.webp",
  "/avatar6.webp",
  "/avatar7.webp",
  "/avatar8.webp",
];

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  gameData,
  onStartGame,
  onToggleReady,
}) => {
  const { roomCode, players, currentUser } = gameData;
  const readyPlayers = players.filter((p) => p.isReady).length;
  const canStartGame = players.length >= 3 && readyPlayers === players.length;

  const [selectedAvatar, setSelectedAvatar] = useState(
    players.find((p) => p.id === currentUser.id)?.avatar || ""
  );

  const usedAvatars = players
    .filter((p) => p.id !== currentUser.id)
    .map((p) => p.avatar);

  const handleSelectAvatar = (avatar: string) => {
    if (usedAvatars.includes(avatar)) return;
    setSelectedAvatar(avatar);
  };

  const displayedPlayers = players.map((p) =>
    p.id === currentUser.id ? { ...p, avatar: selectedAvatar } : p
  );

  return (
    <div className="min-h-screen p-4  to-primary/5">
      <ThemeToggleButton className="absolute top-4 right-4 text-light" />
      <BackgroundAnimate />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-balance text-white">
              Sala de Espera
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-white text-3xl">Código:</span>
              <code className="px-3 py-1 bg-accent/20 text-accent rounded-lg  text-5xl font-semibold font-fredoka">
                {roomCode}
              </code>
            </div>
          </div>
        </div>

        {/* Players Grid + Action Buttons */}
        <Card className="border-border/50 bg-card backdrop-blur-sm relative">
          <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center">
            <CardTitle className="flex items-center justify-between w-full md:w-auto mb-2 md:mb-0">
              <span>Jugadores ({players.length}/8)</span>
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary ml-2"
              >
                {readyPlayers}/{players.length} listos
              </Badge>
            </CardTitle>

            {/* Botones siempre visibles en desktop */}
            <div className="flex gap-2 mt-2 md:mt-0">
              {currentUser.isHost ? (
                <Button
                  onClick={onStartGame}
                  disabled={!canStartGame}
                  className="bg-primary hover:bg-primary/90 text-light font-medium py-2 px-4 text-sm"
                >
                  {canStartGame
                    ? "Iniciar Partida"
                    : `Esperando jugadores (${players.length}/3)`}
                </Button>
              ) : (
                <Button
                  onClick={onToggleReady}
                  className="bg-game-accent hover:bg-game-accent/90 text-white font-medium py-2 px-4 text-sm"
                >
                  {players.find((p) => p.id === currentUser.id)?.isReady
                    ? "Listo ✓"
                    : "Estoy Listo"}
                </Button>
              )}

              <Link to="/join">
                <Button
                  variant="outline"
                  className="border-border/50 hover:bg-accent/50 bg-transparent py-2 px-4 text-sm"
                >
                  Salir de la Sala
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ">
              {displayedPlayers.map((player) => {
                const isCurrentUser = player.id === currentUser.id;
                return (
                  <div
                    key={player.id}
                    className="flex flex-col items-center space-y-2 p-2 rounded-xl bg-foreground/4 shadow-sm"
                  >
                    <div className="relative">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className={`object-cover rounded-full ${
                          isCurrentUser ? "w-28 h-28" : "w-24 h-24"
                        }`}
                      />
                      {player.isHost && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-game-warning rounded-full flex items-center justify-center">
                          <span className="text-xs">👑</span>
                        </div>
                      )}
                      {player.isReady && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-game-accent rounded-full flex items-center justify-center">
                          <span className="text-xs text-green-400">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isCurrentUser
                          ? "Tú"
                          : player.isHost
                          ? "Anfitrión"
                          : player.isReady
                          ? "Listo"
                          : "Esperando"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Avatar Selection */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-center text-muted-foreground mb-2">
                <span className="ml-2 font-semibold">{currentUser.name},</span>{" "}
                Elige tu avatar
              </h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {avatarOptions.map((avatar) => {
                  const taken =
                    usedAvatars.includes(avatar) && selectedAvatar !== avatar;
                  const isSelected = selectedAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      onClick={() => handleSelectAvatar(avatar)}
                      disabled={taken}
                      className={`w-20 h-20 rounded-full border-4 transition-all ${
                        isSelected
                          ? "border-game-accent scale-110"
                          : "border-border hover:scale-105"
                      } ${
                        taken
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <img
                        src={avatar}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Info Compacta */}
        <Card className="border-border/50 bg-card backdrop-blur-sm p-4 md:p-6 h-[220px] md:h-[180px]">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-2 text-center">
            Información de la Partida
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 h-full">
            {/* Jugadores Totales */}
            <div className="flex flex-col justify-center items-center bg-primary/10 rounded-lg p-2 h-full">
              <p className="text-xs text-muted-foreground">Jugadores</p>
              <p className="text-xl font-bold text-primary">
                {gameData.players.length}
              </p>
            </div>

            {/* Impostores */}
            <div className="flex flex-col justify-center items-center bg-game-danger/10 rounded-lg p-2 h-full">
              <p className="text-xs text-muted-foreground">Impostores</p>
              <p className="text-xl font-bold text-game-danger">
                {gameData.impostorCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {gameData.impostorsKnowEachOther
                  ? "Se conocen"
                  : "No se conocen"}
              </p>
            </div>

            {/* Mínimo jugadores */}
            <div className="flex flex-col justify-center items-center bg-game-accent/10 rounded-lg p-2 h-full">
              <p className="text-xs text-muted-foreground">Mínimo Jugadores</p>
              <p className="text-xl font-bold text-game-accent">
                {gameData.minPlayers}
              </p>
            </div>

            {/* Categoría */}
            <div className="flex flex-col justify-center items-center bg-secondary/10 rounded-lg p-2 h-full">
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="text-xl font-bold text-secondary">
                {gameData.category}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WaitingRoom;
