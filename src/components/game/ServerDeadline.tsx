import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

export default function ServerDeadline() {
  const { phase, phaseExpiresAt, turnExpiresAt, serverClockOffset } = useGameStore();
  const deadline = phase === "word" ? turnExpiresAt : phaseExpiresAt;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadline]);
  if (!deadline) return null;
  const seconds = Math.max(0, Math.ceil((deadline - now - serverClockOffset) / 1_000));
  return (
    <p className="text-sm text-muted-foreground" role="timer" aria-label="Tiempo restante">
      {phase === "word" ? "Turno" : "Fase"}: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
    </p>
  );
}
