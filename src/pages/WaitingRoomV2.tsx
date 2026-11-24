import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Dialog } from "radix-ui";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { Check, Clock3, Crown, Ellipsis, Gamepad2, Globe2, LoaderCircle, Lock, LogOut, Play, Users, VenetianMask, X } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { FormActionButton } from "@/components/ui/form-actions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { fetchCategories, type Category } from "@/services/api/category";
import RoomInvite from "@/components/RoomInvite";
import LobbyAvatarPicker from "@/components/LobbyAvatarPicker";
import type { Player } from "@/types/game";
import { getMinimumPlayers } from "@/lib/roomModeRules";

export default function WaitingRoomV2() {
  const { room, currentPlayer, players } = useRoomStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const { leaveRoom, startGame, kickPlayer, changeAvatar, lobbyReady } = useSocketRoom();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [action, setAction] = useState<"ready" | "start" | "leave" | "kick" | null>(null);
  const busy = useRef(false);
  const [actionError, setActionError] = useState("");
  const [kickTarget, setKickTarget] = useState<Player | null>(null);
  const [kickError, setKickError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const pendingStart = useRef(false);
  const [avatarPreview, setAvatarPreview] = useState<{ roomId: string; playerId: string; url: string } | null>(null);
  const isHost = currentPlayer?.isHost === true;
  const readyPlayers = players.filter((player) => player.isLobbyReady && player.isOnline).length;
  const minimumPlayers = getMinimumPlayers(room?.settings.impostorCount ?? 1);
  const allReady = players.length > 0 && readyPlayers === players.length;
  const canStartGame = isHost && players.length >= minimumPlayers && allReady && room?.status === "waiting";

  useEffect(() => {
    let active = true;
    void fetchCategories().then((data) => { if (active) { setCategories(data); setLoadingCategories(false); } });
    return () => { active = false; };
  }, [categoryAttempt]);

  useEffect(() => {
    if (!room || !currentPlayer) navigate(isLoggedIn ? "/menu" : "/join", { replace: true });
  }, [room, currentPlayer, isLoggedIn, navigate]);

  useEffect(() => {
    if (avatarPreview?.roomId === room?.id && avatarPreview?.playerId === currentPlayer?.socketId && avatarPreview?.url === currentPlayer?.avatarUrl) {
      setAvatarPreview(null);
    }
  }, [avatarPreview, room?.id, currentPlayer?.socketId, currentPlayer?.avatarUrl]);

  const selectAvatar = async (avatar: string) => {
    if (!room || !currentPlayer) return;
    const previous = avatarPreview;
    setAvatarPreview({ roomId: room.id, playerId: currentPlayer.socketId, url: avatar });
    try {
      await changeAvatar(room.id, avatar);
    } catch (cause) {
      // A room update can confirm the change even if its acknowledgement times out.
      const latest = useRoomStore.getState();
      if (latest.room?.id === room.id && latest.currentPlayer?.socketId === currentPlayer.socketId && latest.currentPlayer.avatarUrl === avatar) return;
      setAvatarPreview(previous);
      throw cause;
    }
  };

  const runAction = async (kind: "ready" | "start" | "leave") => {
    if (!room || busy.current || pendingStart.current) return;
    if (kind === "ready" && (currentPlayer?.isLobbyReady || !currentPlayer?.isOnline)) return;
    if (kind === "start" && !canStartGame) return;
    busy.current = true;
    setAction(kind);
    setActionError("");
    try {
      if (kind === "ready") await lobbyReady(room.id);
      if (kind === "leave") await leaveRoom(room.id);
      if (kind === "start") {
        await startGame(room.id);
        // gameStarted owns navigation. Keep start locked until that authoritative event.
        pendingStart.current = true;
      }
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "No se pudo completar la acción. Intenta otra vez.");
    } finally {
      busy.current = false;
      if (!pendingStart.current) setAction(null);
    }
  };

  const handleKick = async () => {
    if (!room || !isHost || !kickTarget || busy.current) return;
    busy.current = true;
    setAction("kick");
    setKickError("");
    try {
      await kickPlayer(room.id, kickTarget.socketId);
      setKickTarget(null);
    } catch (cause) {
      setKickError(cause instanceof Error ? cause.message : "No se pudo expulsar al jugador. Intenta otra vez.");
    } finally {
      busy.current = false;
      setAction(null);
    }
  };

  if (!room || !currentPlayer) return null;

  const modeLabel = { classic: "Clásico", anonymous: "Anónimo", special: "Especial" }[room.settings.mode];
  const category = categories.find((candidate) => candidate.id === room.settings.category);
  const startHint = players.length < minimumPlayers
    ? `Se necesitan al menos ${minimumPlayers} jugadores.`
    : !allReady ? "Todos deben estar conectados y listos." : "";
  const displayPlayer = avatarPreview?.roomId === room.id && avatarPreview.playerId === currentPlayer.socketId
    ? { ...currentPlayer, avatarUrl: avatarPreview.url }
    : currentPlayer;
  const twoRows = players.length > 4;
  const readyStatus = currentPlayer.isLobbyReady && currentPlayer.isOnline;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card">
          <div className="page-container flex h-20 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/logo.webp" alt="" className="size-12 shrink-0 rounded-md" />
              <span className="hidden text-3xl font-extrabold text-accent sm:inline">CharacterUs</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              <ThemeToggleButton />
              <Button type="button" size="lg" variant="ghost" onClick={() => void runAction("leave")} disabled={!!action} className="px-3 text-base sm:text-lg"><LogOut aria-hidden="true" />{action === "leave" ? "Saliendo…" : "Salir"}</Button>
            </div>
          </div>
        </header>

        <main className="page-container py-5">
          <h1 className="mb-5 text-3xl font-bold sm:text-4xl">Sala de espera<span className="text-accent">.</span></h1>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
            <motion.section initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="players-title">
              <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <h2 id="players-title" tabIndex={-1} className="flex items-center gap-2 text-xl font-semibold"><Users className="size-5 text-accent" aria-hidden="true" />Jugadores</h2>
                <p className="text-base text-muted-foreground" aria-label={`${players.length} de ${room.settings.maxPlayers} jugadores`}>{players.length}<span className="mx-1 text-muted-foreground/50">/</span>{room.settings.maxPlayers}</p>
              </div>

              <div className={`grid grid-cols-2 gap-x-3 gap-y-6 bg-accent/[0.035] px-5 py-6 sm:grid-cols-4 sm:px-6 ${twoRows ? "sm:gap-y-4 sm:py-4" : ""}`}>
                {players.map((player, index) => {
                  const mine = player.socketId === currentPlayer.socketId;
                  const ready = player.isLobbyReady && player.isOnline;
                  return (
                    <motion.article key={player.socketId} aria-label={`Jugador ${player.username}${mine ? ", tú" : ""}${player.isHost ? ", anfitrión" : ""}`} initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.18) }} className="relative flex min-w-0 flex-col items-center pt-3">
                      {isHost && !mine && <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon" variant="ghost" disabled={!!action} className="absolute -right-1 top-0 size-8" aria-label={`Opciones de ${player.username}`}><Ellipsis className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-card text-foreground"><DropdownMenuItem onSelect={() => { setKickError(""); setKickTarget(player); }} className="text-red-700 focus:bg-red-50 focus:text-red-800 dark:text-red-300 dark:focus:bg-red-400/10 dark:focus:text-red-200"><LogOut aria-hidden="true" />Expulsar de la sala</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
                      <div className={`relative flex size-24 items-center justify-center rounded-full ${twoRows ? "mb-3 sm:mb-2 sm:size-20" : "mb-3 sm:size-28"} ${mine ? "bg-accent/15 ring-1 ring-accent/40" : "bg-accent/[0.07]"}`}>
                        <img src={mine ? displayPlayer.avatarUrl : player.avatarUrl} alt="" className={`size-20 object-contain ${twoRows ? "sm:size-[72px]" : "sm:size-24"} ${!player.isOnline ? "grayscale opacity-50" : ""}`} />
                        {player.isHost && <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-300 dark:text-amber-950"><Crown className="size-3" aria-hidden="true" />Anfitrión</span>}
                      </div>
                      <div className="flex max-w-full items-baseline justify-center gap-1.5"><h3 className="truncate text-base font-semibold" title={player.username}>{player.username}</h3>{mine && <span className="shrink-0 text-xs text-muted-foreground">Tú</span>}</div>
                      <p className={`mt-1 flex items-center gap-1 text-sm ${ready ? "text-teal-800 dark:text-teal-200" : "text-muted-foreground"}`}>
                        {ready ? <Check className="size-3.5" aria-hidden="true" /> : <Clock3 className="size-3.5" aria-hidden="true" />}{!player.isOnline ? "Sin conexión" : ready ? "Listo" : "Preparándose"}
                      </p>
                    </motion.article>
                  );
                })}
              </div>

              <div className="border-t border-border px-5 py-4 sm:px-6">
                <LobbyAvatarPicker player={displayPlayer} players={players} disabled={!!action || room.status !== "waiting" || !currentPlayer.isOnline} onSelect={selectAvatar} />
              </div>
              <div className="space-y-3 border-t border-border px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {!readyStatus ? <div className="w-full sm:w-auto sm:min-w-44"><FormActionButton tone="accent" disabled={!!action || !currentPlayer.isOnline || room.status !== "waiting"} onClick={() => void runAction("ready")}>
                    {action === "ready" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}{action === "ready" ? "Confirmando…" : "Estoy listo"}
                  </FormActionButton></div> : <p role="status" className="flex min-h-10 items-center justify-center gap-2 text-base text-teal-900 sm:mr-auto dark:text-teal-100"><Check className="size-4 shrink-0" aria-hidden="true" />{isHost ? "Estás listo" : "Esperando que el anfitrión inicie"}</p>}
                  {isHost && <div className="w-full sm:w-auto sm:min-w-48"><FormActionButton tone="accent" disabled={!canStartGame || !!action} aria-describedby={startHint ? "start-hint" : undefined} onClick={() => void runAction("start")}>{action === "start" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}{action === "start" ? "Iniciando…" : "Iniciar partida"}</FormActionButton></div>}
                </div>
                {isHost && startHint && <p id="start-hint" aria-live="polite" className="text-sm text-muted-foreground sm:text-right">{startHint}</p>}
                {actionError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-400/10 dark:text-red-200">{actionError}</p>}
              </div>
            </motion.section>

            <aside className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-5" aria-label="Invitación y resumen de la partida">
              <section aria-labelledby="invite-title" className="p-5">
                <h2 id="invite-title" className="mb-4 text-xl font-semibold">Invitación</h2>
                <RoomInvite code={room.code} isPrivate={room.settings.privacy === "private"} />
              </section>
              <section aria-labelledby="summary-title" className="border-t border-border p-5">
                <div className="mb-4 flex items-center gap-3"><Gamepad2 className="size-5 shrink-0 text-accent" aria-hidden="true" /><div className="min-w-0"><h2 id="summary-title" className="text-sm text-muted-foreground">Categoría</h2><p className="break-words text-xl font-semibold leading-snug">{category?.name || (loadingCategories ? "Cargando…" : "No disponible")}</p></div></div>
                <div className="space-y-4">
                  {!category && !loadingCategories && <button type="button" onClick={() => { setLoadingCategories(true); setCategoryAttempt((attempt) => attempt + 1); }} className="text-sm text-teal-800 underline underline-offset-2 dark:text-teal-200">Reintentar cargar categoría</button>}
                  <div className="flex flex-wrap gap-2 text-sm"><span className="rounded-md bg-accent/10 px-2 py-1 text-teal-900 dark:text-teal-100">{modeLabel}</span><span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">{room.settings.privacy === "private" ? <Lock className="size-3.5" aria-hidden="true" /> : <Globe2 className="size-3.5" aria-hidden="true" />}{room.settings.privacy === "private" ? "Privada" : "Pública"}</span><span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1"><VenetianMask className="size-3.5 text-purple-600 dark:text-purple-300" aria-hidden="true" />{room.settings.impostorCount} {room.settings.impostorCount === 1 ? "impostor" : "impostores"}</span></div>
                  <dl className="space-y-2.5 text-sm">{[["Tipo de partida", room.settings.playMode === "in_person" ? "Presencial" : "En línea"], ["Rondas", room.settings.maxRounds ?? "Sin límite"], ["Impostores se conocen", room.settings.impostorsKnowEachOther ? "Sí" : "No"], ["Objetivos de los votos", room.settings.visibleVotes ? "Visibles" : "Ocultos"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
                </div>
              </section>
            </aside>
          </div>
        </main>

        <Dialog.Root open={!!kickTarget} onOpenChange={(open) => { if (!open && action !== "kick") setKickTarget(null); }}>
          <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" /><Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById("players-title")?.focus(); }} className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl">
            <div className="flex items-start justify-between gap-3"><Dialog.Title className="text-2xl font-bold">¿Expulsar a {kickTarget?.username}?</Dialog.Title><Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="Cerrar confirmación" disabled={action === "kick"}><X className="size-5" /></Button></Dialog.Close></div>
            <Dialog.Description className="mt-3 text-base text-muted-foreground">Saldrá de esta sala. Podrá volver a unirse con la invitación.</Dialog.Description>
            {kickError && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{kickError}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2"><Dialog.Close asChild><Button type="button" variant="outline" size="lg" disabled={action === "kick"} className="px-5 text-base">Cancelar</Button></Dialog.Close><Button type="button" size="lg" disabled={!!action} onClick={() => void handleKick()} className="bg-red-600 px-5 text-base text-white hover:bg-red-700">{action === "kick" && <LoaderCircle className="animate-spin" aria-hidden="true" />}{action === "kick" ? "Expulsando…" : "Expulsar"}</Button></div>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
      </div>
    </MotionConfig>
  );
}
