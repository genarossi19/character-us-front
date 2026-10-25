import { Navigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useUserStore } from "@/store/useUserStore";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import CharacterReveal from "@/components/game/CharacterReveal";
import WordSubmission from "@/components/game/WordSubmission";
import DebateChat from "@/components/game/DebateChat";
import DebatePhase from "@/components/game/DebatePhase";
import RoleCard from "@/components/game/RoleCard";
import VotingPhase from "@/components/game/VotingPhase";
import RoundResults from "@/components/game/RoundResults";
import GameEnd from "@/components/game/GameEnd";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { Button } from "@/components/ui/button";
import ServerDeadline from "@/components/game/ServerDeadline";
import { toast } from "sonner";
import type { GamePhase } from "@/types/game";

const steps = ["character", "word", "debate", "voting", "results"] as const;
const labels: Record<GamePhase, string> = { waiting: "Preparando partida", character: "Tu identidad", word: "Palabras", debate: "Debate", voting: "Votación", results: "Resultado", finished: "Partida terminada" };

export default function GameScreenV2() {
  const { phase, currentRound, reconnectingPlayerId, reconnectSecondsLeft } = useGameStore();
  const { room, currentPlayer, players } = useRoomStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const { leaveRoom } = useSocketRoom();
  const messages = useGameStore((state) => state.chatMessages);
  const [chatOpen, setChatOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [readIds, setReadIds] = useState(() => new Set(messages.map((message) => message.id)));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const hasSession = Boolean(room && currentPlayer);
  const unread = chatOpen || desktop ? 0 : messages.filter((message) => !readIds.has(message.id) && message.senderId !== currentPlayer?.socketId && (message.type !== "ghost" || currentPlayer?.isAlive === false)).length;
  const closeChat = () => {
    setReadIds(new Set(messages.map((message) => message.id)));
    setChatOpen(false);
    chatButtonRef.current?.focus();
  };
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const resize = () => {
      setDesktop(query.matches);
      setReadIds(new Set(useGameStore.getState().chatMessages.map((message) => message.id)));
    };
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.close();
    if (desktop) dialog.show();
    else if (chatOpen) dialog.showModal();
  }, [chatOpen, desktop, hasSession]);
  const handleExit = async () => {
    if (!room) return;
    try { await leaveRoom(room.id); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo salir de la sala."); }
  };

  if (!room || !currentPlayer) return <Navigate to={isLoggedIn ? "/menu" : "/join"} replace />;

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button onClick={handleExit} variant="ghost" className="gap-2"><ArrowLeft className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Salir</span><span className="sr-only sm:hidden">Salir de la partida</span></Button>
          <img src="/logo.webp" alt="" className="size-8 object-contain" />
          <span className="hidden text-lg font-semibold sm:inline">Character<span className="text-accent">Us</span></span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <ServerDeadline />
          <span className="hidden whitespace-nowrap text-sm text-muted-foreground sm:inline">{phase === "finished" ? "Final" : `Ronda ${currentRound}`}</span>
          <div className="hidden sm:block"><ThemeToggleButton /></div>
          <Button ref={chatButtonRef} variant="ghost" aria-label={`Abrir chat${unread ? `, ${unread} novedades sin leer` : ""}`} aria-haspopup="dialog" aria-expanded={chatOpen} aria-controls="game-chat" onClick={() => { setReadIds(new Set(messages.map((message) => message.id))); setChatOpen(true); }} className="relative size-11 p-0 lg:hidden"><MessageCircle className="size-5" aria-hidden="true" />{unread > 0 && <span className="absolute -right-1 top-0 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{unread > 99 ? "99+" : unread}</span>}</Button>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-4 p-3 sm:gap-5 sm:p-5 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 lg:overflow-y-auto lg:pr-1">
          <div className="mx-auto w-full max-w-3xl space-y-4 pb-3">
            <div className="flex items-center justify-between gap-3 px-1 py-1">
              <div><p className="text-xs text-muted-foreground">Ronda {currentRound} · {players.filter((player) => player.isAlive).length} en juego</p><h1 className="text-lg font-semibold">{labels[phase]}</h1></div>
              <div className="flex flex-col items-end gap-2"><ServerDeadline /><ol aria-label="Fases de la ronda" className="flex gap-1.5">{steps.map((step) => <li key={step} aria-current={phase === step ? "step" : undefined} title={labels[step]} className={`h-1 w-5 rounded-full ${phase === step ? "bg-accent" : "bg-muted"}`}><span className="sr-only">{labels[step]}</span></li>)}</ol></div>
            </div>
            {(phase === "word" || phase === "debate" || phase === "voting") && <RoleCard />}
            {phase === "waiting" && <p className="py-16 text-center text-muted-foreground">Esperando el inicio de la partida…</p>}
            {phase === "character" && <CharacterReveal />}
            {phase === "word" && <WordSubmission key={currentRound} />}
            {phase === "debate" && <DebatePhase />}
            {phase === "voting" && <VotingPhase key={currentRound} />}
            {phase === "results" && <RoundResults />}
            {phase === "finished" && <GameEnd />}
          </div>
        </main>
        <dialog ref={dialogRef} id="game-chat" aria-label="Chat y actividad de la partida" onCancel={(event) => { event.preventDefault(); closeChat(); }} className="fixed inset-0 m-auto h-[min(92dvh,48rem)] max-h-[92dvh] w-[calc(100%_-_1.5rem)] max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/60 lg:static lg:m-0 lg:h-full lg:max-h-none lg:w-full lg:max-w-none lg:shadow-none">
          <DebateChat onClose={closeChat} active={desktop || chatOpen} />
        </dialog>
      </div>
      {reconnectingPlayerId === currentPlayer.socketId && <div role="alert" className="fixed inset-x-4 bottom-4 z-40 rounded-xl border border-danger/40 bg-card px-4 py-3 text-center text-danger shadow-lg">Reconecta antes de que termine el tiempo: {reconnectSecondsLeft}s</div>}
    </div>
  );
}
