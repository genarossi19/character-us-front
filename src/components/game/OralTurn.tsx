import { useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { FormActionButton } from "@/components/ui/form-actions";

export default function OralTurn() {
  const { phase, currentTurnPlayerId, hasSubmittedWord, completedTurns } = useGameStore();
  const { currentPlayer, players } = useRoomStore();
  const { completeTurn } = useSocketGame();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const mine = currentTurnPlayerId === currentPlayer?.socketId;
  const done = hasSubmittedWord || completedTurns.some((turn) => turn.playerId === currentPlayer?.socketId);
  const canConfirm = phase === "word" && mine && currentPlayer?.isAlive && !done;
  const turnDone = completedTurns.some((turn) => turn.playerId === currentTurnPlayerId) || (mine && done);
  const active = players.find((player) => player.socketId === currentTurnPlayerId);
  const confirm = async () => {
    if (!canConfirm || busy.current) return;
    busy.current = true; setSending(true); setError("");
    try { await completeTurn(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo confirmar el turno."); }
    finally { busy.current = false; setSending(false); }
  };
  return <section className="space-y-5 rounded-2xl border border-border bg-card p-6 text-center">
    {active && <img src={active.avatarUrl} alt="" className="mx-auto size-24 object-contain" />}
    <h2 className="text-2xl font-semibold">{mine && !done ? "Tu turno" : active && !turnDone ? `Turno de ${active.username}` : "Esperando el siguiente turno"}</h2>
    <p className="text-base text-muted-foreground">{canConfirm ? "Di tu palabra en voz alta y confirma cuando termines." : !currentPlayer?.isAlive ? "Estás observando la partida." : mine && done ? "Tu turno terminó." : "Escucha la palabra del grupo."}</p>
    {canConfirm && <div className="mx-auto max-w-xs"><FormActionButton tone="accent" disabled={sending} onClick={() => void confirm()}>{sending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}{sending ? "Confirmando…" : "Listo"}</FormActionButton></div>}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </section>;
}
