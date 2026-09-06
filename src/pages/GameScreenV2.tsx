import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { PHASE_DURATIONS } from "@/types/game";
import CharacterReveal from "@/components/game/CharacterReveal";
import WordSubmission from "@/components/game/WordSubmission";
import DebateChat from "@/components/game/DebateChat";
import VotingPhase from "@/components/game/VotingPhase";
import RoundResults from "@/components/game/RoundResults";
import GameEnd from "@/components/game/GameEnd";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { Button } from "@/components/ui/button";

export default function GameScreenV2() {
  const { phase, currentRound, totalRounds, timer, setTimer, setPhase, resetRound } =
    useGameStore();
  const room = useRoomStore((s) => s.room);
  const currentPlayer = useRoomStore((s) => s.currentPlayer);
  const { sendChatMessage } = useSocketGame();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimer((prev: number) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer, setTimer]);

  // Handle phase transitions with timers
  useEffect(() => {
    const duration = PHASE_DURATIONS[phase as keyof typeof PHASE_DURATIONS];
    if (!duration) return;

    setTimer(Math.ceil(duration / 1000));

    const timeout = setTimeout(() => {
      if (phase === "character") {
        setPhase("word");
      } else if (phase === "results") {
        if (currentRound < totalRounds) {
          resetRound();
          setPhase("character");
        }
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [
    phase,
    currentRound,
    totalRounds,
    setPhase,
    setTimer,
    resetRound,
  ]);

  // Handle exit
  const handleExit = () => {
    if (room) {
      sendChatMessage(`${currentPlayer?.username} abandonó la sala`);
    }
    navigate("/menu");
  };

  if (!room || !currentPlayer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Cargando partida...</p>
      </div>
    );
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
        {phase !== "gameEnd" && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-card border border-border px-4 py-2 rounded-full text-sm font-medium text-foreground shadow-sm">
              Ronda {currentRound} / {totalRounds}
            </div>
          </div>
        )}

        {/* Fase del juego */}
        {phase === "character" && <CharacterReveal />}
        {phase === "word" && <WordSubmission />}
        {phase === "turn" && <WordSubmission />}
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
        {phase === "gameEnd" && <GameEnd />}
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
    </div>
  );
}
