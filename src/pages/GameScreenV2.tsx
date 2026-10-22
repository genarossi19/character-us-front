import { Navigate } from "react-router";
import { ArrowLeft, Flag, MessageCircle, Users } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
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
  const { phase, currentRound, totalRounds, reconnectingPlayerId, reconnectSecondsLeft } = useGameStore();
  const { room, currentPlayer, players } = useRoomStore();
  const { leaveRoom } = useSocketRoom();
  const handleExit = async () => {
    if (!room) return;
    try { await leaveRoom(room.id); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo salir de la sala."); }
  };

  if (!room || !currentPlayer) return <Navigate to="/join" replace />;

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button onClick={handleExit} variant="ghost" className="gap-2"><ArrowLeft className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Salir</span><span className="sr-only sm:hidden">Salir de la partida</span></Button>
          <div className="h-7 w-px bg-border" />
          <img src="/logo.webp" alt="" className="size-9 object-contain" />
          <span className="text-lg font-semibold">Character<span className="text-accent">Us</span></span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {phase !== "finished" && <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex"><Users className="size-4" aria-hidden="true" />{players.filter((player) => player.isAlive).length} en juego</span>}
          <span className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm"><Flag className="size-3.5 text-accent" aria-hidden="true" />{phase === "finished" ? "Final" : `Ronda ${currentRound} / ${totalRounds}`}</span>
          <ThemeToggleButton />
          <a href="#game-chat" className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"><MessageCircle className="size-4" aria-hidden="true" />Chat</a>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-4 p-3 sm:gap-5 sm:p-5 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 lg:overflow-y-auto lg:pr-1">
          <div className="mx-auto w-full max-w-5xl space-y-5 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <ol aria-label="Fases de la ronda" className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
                {steps.map((step, index) => <li key={step} aria-current={phase === step ? "step" : undefined} className={`flex items-center gap-2 ${phase === step ? "font-semibold text-accent" : "text-muted-foreground"}`}><span className={`flex size-5 items-center justify-center rounded-full text-[10px] ${phase === step ? "bg-accent text-accent-foreground" : "bg-muted"}`}>{index + 1}</span>{labels[step]}</li>)}
              </ol>
              <ServerDeadline />
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
        <aside id="game-chat" aria-label="Chat y actividad de la partida" className="h-[32rem] min-h-0 min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-border bg-card lg:h-full">
          <DebateChat />
        </aside>
      </div>
      {reconnectingPlayerId === currentPlayer.socketId && <div role="alert" className="fixed inset-x-4 bottom-4 z-40 rounded-xl border border-danger/40 bg-card px-4 py-3 text-center text-danger shadow-lg">Reconecta antes de que termine el tiempo: {reconnectSecondsLeft}s</div>}
    </div>
  );
}
