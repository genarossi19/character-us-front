import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { AVATAR_URLS } from "@/constants/avatars";
import { fetchCategories, type Category } from "@/services/api/category";
import { toast } from "sonner";
import RoomInvite from "@/components/RoomInvite";

export default function WaitingRoomV2() {
  const { room, currentPlayer, players } = useRoomStore();
  const { leaveRoom, startGame, kickPlayer, changeAvatar } = useSocketRoom();
  const navigate = useNavigate();
  const selectedAvatar = currentPlayer?.avatarUrl;
  const [changingAvatar, setChangingAvatar] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const isHost = currentPlayer?.isHost;
  const readyPlayers = players.filter((p) => p.isAlive).length;
  const canStartGame =
    isHost && players.length >= 3 && room?.status === "waiting";

  useEffect(() => {
    if (!room || !currentPlayer) {
      navigate("/join", { replace: true });
    }
  }, [room, currentPlayer, navigate]);

  const handleStart = async () => {
    if (!room || !canStartGame) return;
    try {
      await startGame(room.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar la partida");
    }
  };

  const handleLeave = async () => {
    if (!room) return;
    try {
      await leaveRoom(room.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo salir de la sala");
    }
  };

  const handleKick = (playerId: string) => {
    if (!room) return;
    kickPlayer(room.id, playerId);
    toast.success("Jugador expulsado");
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(String(room.code));
    toast.success("Código copiado al portapapeles");
  };

  const usedAvatars = players
    .filter((p) => p.socketId !== currentPlayer?.socketId)
    .map((p) => p.avatarUrl);

  const handleSelectAvatar = async (avatar: string) => {
    if (!room || changingAvatar || avatar === selectedAvatar || usedAvatars.includes(avatar)) return;
    setChangingAvatar(true);
    try {
      await changeAvatar(room.id, avatar);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el avatar");
    } finally {
      setChangingAvatar(false);
    }
  };

  if (!room || !currentPlayer) return null;

  return (
    <div className="min-h-screen p-4 to-primary/5">
      <BackgroundAnimate />
      <ThemeToggleButton className="absolute top-4 right-4 text-light" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-balance text-white">
              Sala de Espera
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <div className="flex flex-col items-center gap-2">
              <span className="text-white text-3xl">Código:</span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-accent/20 text-accent rounded-lg text-5xl font-semibold font-fredoka hover:bg-accent/30 transition-colors cursor-pointer"
              >
                {room.code}
              </button>
              <span className="text-white/60 text-sm">(click para copiar)</span>
              </div>
              <RoomInvite code={room.code} />
            </div>
            <p className="text-white/80 text-lg">{room.name}</p>
          </div>
        </div>

        {/* Players Grid */}
        <Card className="border-border/50 bg-card backdrop-blur-sm relative">
          <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center">
            <CardTitle className="flex items-center justify-between w-full md:w-auto mb-2 md:mb-0">
              <span>Jugadores ({players.length}/{room.settings.maxPlayers})</span>
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary ml-2"
              >
                {readyPlayers} listos
              </Badge>
            </CardTitle>

            <div className="flex gap-2 mt-2 md:mt-0">
              {isHost ? (
                <Button
                  onClick={handleStart}
                  disabled={!canStartGame}
                  className="bg-primary hover:bg-primary/90 text-light font-medium py-2 px-4 text-sm"
                >
                  {canStartGame
                    ? "Iniciar Partida"
                    : `Esperando jugadores (${players.length}/3)`}
                </Button>
              ) : (
                <Badge variant="secondary" className="bg-muted px-4 py-2">
                  Esperando que el host inicie...
                </Badge>
              )}

              <Button
                variant="outline"
                onClick={handleLeave}
                className="border-border/50 hover:bg-accent/50 bg-transparent py-2 px-4 text-sm"
              >
                Salir de la Sala
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {players.map((player) => {
                  const isCurrentPlayer = player.socketId === currentPlayer.socketId;
                  return (
                    <div
                      key={player.socketId}
                      className="flex flex-col items-center space-y-2 p-2 rounded-xl bg-foreground/4 shadow-sm relative animate-in fade-in zoom-in duration-300"
                    >
                      <div className="relative">
                        <img
                          src={player.avatarUrl}
                          alt={player.username}
                          className={`object-cover rounded-full ${
                            isCurrentPlayer ? "w-28 h-28" : "w-24 h-24"
                          }`}
                        />
                        {player.isHost && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-game-warning rounded-full flex items-center justify-center">
                            <span className="text-xs">👑</span>
                          </div>
                        )}
                        {!player.isOnline && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">Offline</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{player.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {isCurrentPlayer
                            ? "Tú"
                            : player.isHost
                            ? "Anfitrión"
                            : "Jugador"}
                        </p>
                      </div>

                      {/* Botón de kick (solo host, no a sí mismo) */}
                      {isHost && !isCurrentPlayer && (
                        <button
                          onClick={() => handleKick(player.socketId)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                          title="Expulsar jugador"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Avatar Selection */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-center text-muted-foreground mb-3">
                <span className="ml-2 font-semibold">{currentPlayer.username},</span>{" "}
                Elige tu avatar
              </h3>
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 justify-items-center">
                {AVATAR_URLS.map((avatar) => {
                  const taken = usedAvatars.includes(avatar);
                  const isSelected = selectedAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      onClick={() => handleSelectAvatar(avatar)}
                      disabled={taken || changingAvatar}
                      aria-pressed={isSelected}
                      aria-label={taken ? "Avatar ocupado" : "Seleccionar avatar"}
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

        {/* Info de la partida */}
        <Card className="border-border/50 bg-card backdrop-blur-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-2 text-center">
            Configuración de la Partida
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="flex flex-col justify-center items-center bg-primary/10 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="text-lg font-bold text-primary capitalize">
                {categories.find((c) => c.id === room.settings.category)?.name || room.settings.category}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center bg-game-danger/10 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Impostores</p>
              <p className="text-lg font-bold text-game-danger">
                {room.settings.impostorCount}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center bg-game-accent/10 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Rondas</p>
              <p className="text-lg font-bold text-game-accent">
                {room.settings.totalRounds}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center bg-secondary/10 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Modo</p>
              <p className="text-lg font-bold text-secondary capitalize">
                {room.settings.mode}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
