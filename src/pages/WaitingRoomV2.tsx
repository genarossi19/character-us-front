import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { AVATAR_URLS } from "@/constants/avatars";
import { fetchCategories, type Category } from "@/services/api/category";
import { toast } from "sonner";
import RoomInvite from "@/components/RoomInvite";
import { Check, Clock3, Copy, Crown, LoaderCircle, LogOut, Play, Users } from "lucide-react";

export default function WaitingRoomV2() {
  const { room, currentPlayer, players } = useRoomStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const { leaveRoom, startGame, kickPlayer, changeAvatar, lobbyReady } = useSocketRoom();
  const navigate = useNavigate();
  const selectedAvatar = currentPlayer?.avatarUrl;
  const [changingAvatar, setChangingAvatar] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const isHost = currentPlayer?.isHost;
  const readyPlayers = players.filter((p) => p.isLobbyReady && p.isOnline).length;
  const minimumPlayers = Math.max(3, (room?.settings.impostorCount ?? 1) + 1);
  const allReady = players.length > 0 && readyPlayers === players.length;
  const canStartGame = isHost && players.length >= minimumPlayers && allReady && room?.status === "waiting";

  useEffect(() => {
    if (!room || !currentPlayer) {
      navigate(isLoggedIn ? "/menu" : "/join", { replace: true });
    }
  }, [room, currentPlayer, isLoggedIn, navigate]);

  const handleStart = async () => {
    if (!room || !canStartGame || starting) return;
    setStarting(true);
    try {
      await startGame(room.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar la partida");
    } finally {
      setStarting(false);
    }
  };

  const handleReady = async () => {
    if (!room || markingReady || currentPlayer?.isLobbyReady) return;
    setMarkingReady(true);
    try {
      await lobbyReady(room.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo confirmar que estás listo");
    } finally {
      setMarkingReady(false);
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

  const handleCopyCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(String(room.code));
      toast.success("Código copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el código. Puedes seleccionarlo para compartirlo.");
    }
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

  const modeLabel = { classic: "Clásico", anonymous: "Anónimo", special: "Especial" }[room.settings.mode];
  const startHint = players.length < minimumPlayers
    ? `Se necesitan al menos ${minimumPlayers} jugadores.`
    : !allReady ? "Todos deben estar conectados y listos para comenzar." : "Todo listo para comenzar.";

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-4">
      <BackgroundAnimate />
      <div className="relative mx-auto max-w-7xl space-y-5 lg:space-y-4">
        <header className="flex items-center justify-between gap-3 text-white">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">Sala de espera</h1>
            <p className="truncate text-sm text-white/70">{room.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggleButton className="text-white" />
            <Button variant="ghost" onClick={handleLeave} className="text-white hover:bg-white/10"><LogOut className="size-4" aria-hidden="true" />Salir<span className="hidden sm:inline">de la sala</span></Button>
          </div>
        </header>

        <main className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="min-w-0 gap-4 border-border/50 bg-card py-5 shadow-lg">
            <CardHeader className="gap-3 px-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5 text-accent" aria-hidden="true" />Jugadores <span className="text-sm font-normal text-muted-foreground">{players.length}/{room.settings.maxPlayers}</span></CardTitle>
                <Badge className="bg-accent/15 text-teal-800 dark:text-teal-200">{readyPlayers}/{players.length} listos</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-4 sm:px-5 lg:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {players.map((player) => {
                  const mine = player.socketId === currentPlayer.socketId;
                  const ready = player.isLobbyReady && player.isOnline;
                  return (
                    <div key={player.socketId} className={`relative flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 lg:gap-1 lg:p-2 xl:gap-2 xl:p-3 ${mine ? "border-accent/50 bg-accent/5" : "border-border bg-muted/30"}`}>
                      <div className="relative">
                        <img src={player.avatarUrl} alt="" className="size-16 rounded-full object-cover sm:size-20 lg:size-14 xl:size-20" />
                        {player.isHost && <span title="Anfitrión" className="absolute -right-1 -top-1 rounded-full bg-warning p-1 text-warning-foreground"><Crown className="size-3.5" aria-label="Anfitrión" /></span>}
                      </div>
                      <div className="w-full text-center">
                        <p className="truncate text-sm font-semibold" title={player.username}>{player.username}</p>
                        <p className="text-xs text-muted-foreground">{mine ? "Tú" : player.isHost ? "Anfitrión" : "Jugador"}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs ${ready ? "text-teal-800 dark:text-teal-200" : "text-muted-foreground"}`}>
                        {ready ? <Check className="size-3.5" aria-hidden="true" /> : <Clock3 className="size-3.5" aria-hidden="true" />}
                        {!player.isOnline ? "Sin conexión" : ready ? "Listo" : "Preparándose"}
                      </span>
                      {isHost && !mine && <button onClick={() => handleKick(player.socketId)} aria-label={`Expulsar a ${player.username}`} className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/15 hover:text-danger">×</button>}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {!currentPlayer.isLobbyReady ? (
                  <Button onClick={handleReady} disabled={markingReady || starting || !currentPlayer.isOnline} className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {markingReady ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                    {markingReady ? "Confirmando…" : "Estoy listo"}
                  </Button>
                ) : (
                  <p role="status" className="flex items-center justify-center gap-2 rounded-xl border border-teal-600/25 bg-teal-50 px-3 py-3 text-center text-sm font-medium text-teal-900 dark:border-teal-300/25 dark:bg-teal-400/10 dark:text-teal-100">
                    <Check className="size-4 shrink-0" aria-hidden="true" />{isHost ? "Estás listo para iniciar la partida" : "Esperando que el anfitrión inicie"}
                  </p>
                )}
                {isHost && <Button onClick={handleStart} disabled={!canStartGame || starting} aria-describedby="start-hint" className="h-11 w-full text-base">
                  {starting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}{starting ? "Iniciando partida…" : "Iniciar partida"}
                </Button>}
                <p id="start-hint" aria-live="polite" className="text-center text-xs text-muted-foreground">{startHint}</p>
              </div>

              <section className="border-t border-border pt-4" aria-labelledby="avatar-title">
                <h2 id="avatar-title" className="mb-3 text-sm font-medium">Tu avatar</h2>
                {currentPlayer.isGuest ? <p className="text-xs text-muted-foreground">Tu avatar se asignó al unirte a la sala.</p> : (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {AVATAR_URLS.map((avatar, index) => {
                      const taken = usedAvatars.includes(avatar);
                      const selected = selectedAvatar === avatar;
                      return <button key={avatar} onClick={() => handleSelectAvatar(avatar)} disabled={taken || changingAvatar} aria-pressed={selected} aria-label={`Avatar ${index + 1}${taken ? ", ocupado" : selected ? ", seleccionado" : ""}`} className={`mx-auto aspect-square w-full max-w-14 rounded-full border-2 p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${selected ? "border-accent bg-accent/20" : "border-transparent hover:border-accent/50"} ${taken ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}>
                        <img src={avatar} alt="" className="size-full rounded-full object-cover" />
                      </button>;
                    })}
                  </div>
                )}
              </section>
            </CardContent>
          </Card>

          <aside className="min-w-0 space-y-4">
            <Card className="gap-3 border-border/50 bg-card py-5 shadow-lg">
              <CardHeader className="px-5"><CardTitle className="text-base">Invita a tus amigos</CardTitle></CardHeader>
              <CardContent className="space-y-3 px-5">
                <button onClick={handleCopyCode} aria-label={`Copiar código de sala ${room.code}`} className="flex w-full items-center justify-between gap-2 rounded-xl bg-accent/10 px-4 py-2 text-accent hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-ring">
                  <span className="text-left"><span className="block text-xs text-muted-foreground">Código de sala</span><span className="text-3xl font-semibold tracking-widest">{room.code}</span></span><Copy className="size-5 shrink-0" aria-hidden="true" />
                </button>
                <RoomInvite code={room.code} />
              </CardContent>
            </Card>
            <Card className="gap-3 border-border/50 bg-card py-5 shadow-lg">
              <CardHeader className="px-5"><CardTitle className="text-base">Configuración de la partida</CardTitle></CardHeader>
              <CardContent className="px-5">
                <dl className="space-y-3 text-sm">
                  {[["Categoría", categories.find((c) => c.id === room.settings.category)?.name || "Categoría seleccionada"], ["Impostores", room.settings.impostorCount], ["Modo", modeLabel], ["Duración", "Hasta que haya ganador"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-medium">{value}</dd></div>)}
                </dl>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}
