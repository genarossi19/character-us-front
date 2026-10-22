import { Navigate } from "react-router";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import CharacterReveal from "@/components/game/CharacterReveal";
import WordSubmission from "@/components/game/WordSubmission";
import DebateChat from "@/components/game/DebateChat";
import VotingPhase from "@/components/game/VotingPhase";
import RoundResults from "@/components/game/RoundResults";
import GameEnd from "@/components/game/GameEnd";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { Button } from "@/components/ui/button";
import ServerDeadline from "@/components/game/ServerDeadline";
import { toast } from "sonner";

export default function GameScreenV2() {
  const { phase, currentRound, totalRounds, reconnectingPlayerId, reconnectSecondsLeft } =
    useGameStore();
  const room = useRoomStore((s) => s.room);
  const currentPlayer = useRoomStore((s) => s.currentPlayer);
  const { leaveRoom } = useSocketRoom();

  // Handle exit
  const handleExit = async () => {
    if (!room) return;
    try {
      await leaveRoom(room.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo salir de la sala.");
    }
  };

  if (!room || !currentPlayer) {
    return <Navigate to="/join" replace />;
  }

  return (
    <div className="flex h-screen bg-background relative">
      {/* Botón salir */}
      <div className="absolute top-4 left-4 z-30">
        <Button
          onClick={handleExit}
          variant="ghost"
          className="text-foreground hover:bg-accent/20"
        >
          ← Salir
        </Button>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 left-20 z-30">
        <ThemeToggleButton />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Indicator de ronda */}
        {phase !== "finished" && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-card border border-border px-4 py-2 rounded-full text-sm font-medium text-foreground shadow-sm">
              Ronda {currentRound} / {totalRounds}
              <ServerDeadline />
            </div>
          </div>
        )}

        {/* Fase del juego */}
        {phase === "character" && <CharacterReveal />}
        {phase === "word" && <WordSubmission />}
        {phase === "debate" && (
          <div className="w-full h-full flex flex-col items-center justify-start p-8 gap-6">
            <h2 className="text-2xl font-bold text-foreground">Debate</h2>
            <div className="w-full max-w-lg">
              <DebateChat showHintsOnly />
            </div>
          </div>
        )}
        {phase === "voting" && <VotingPhase />}
        {phase === "results" && <RoundResults />}
        {phase === "finished" && <GameEnd />}
      </div>

      {/* Chat panel (debate y voting) */}
        {(phase === "debate" || phase === "voting") && (
        <div className="w-96 h-full border-l border-border bg-card">
          {phase === "debate" && <DebateChat />}
          {phase === "voting" && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center px-4">
                🔒 Chat cerrado durante la votación
              </p>
            </div>
          )}
        </div>
      )}
      {reconnectingPlayerId === currentPlayer.socketId && (
        <div className="absolute inset-x-4 bottom-4 z-40 rounded-lg bg-destructive px-4 py-3 text-center text-destructive-foreground">
          Reconecta antes de que termine el tiempo: {reconnectSecondsLeft}s
        </div>
      )}
    </div>
  );
}
