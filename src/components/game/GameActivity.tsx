import { Activity, X } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { Button } from "@/components/ui/button";

export default function GameActivity({ onClose }: { onClose: () => void }) {
  const { phase, currentRound, currentTurnPlayerId, completedTurns, chatMessages, roundResults, winner, voterIds } = useGameStore();
  const players = useRoomStore((state) => state.players);
  const turn = players.find((player) => player.socketId === currentTurnPlayerId);
  const phaseLabels = { waiting: "Preparando partida", character: "Revelando personajes", word: "Turnos de palabras", debate: "Debate en persona", voting: "Votación abierta", results: "Resultados", finished: "Partida terminada" };
  const votes = chatMessages.filter((message) => message.activity?.kind === "vote" && message.id.startsWith(`activity:${currentRound}:`));
  return <section className="flex h-full min-h-0 flex-col">
    <header className="flex items-center justify-between border-b border-border p-4"><h2 className="flex items-center gap-2 font-semibold"><Activity className="size-5 text-accent" aria-hidden="true" />Actividad de la partida</h2><Button variant="ghost" size="icon" aria-label="Cerrar actividad" onClick={onClose} className="lg:hidden"><X /></Button></header>
    <div role="log" aria-label="Actividad de la partida" aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <div className="rounded-xl bg-accent/10 p-4"><p className="text-sm text-muted-foreground">Ronda {currentRound} · Presencial</p><p className="mt-1 font-semibold">{phaseLabels[phase]}</p>{phase === "word" && turn && <p className="mt-2 text-sm">Turno de {turn.username}</p>}</div>
      {completedTurns.map((completed) => <p key={`${completed.round}:${completed.playerId}`} className="border-b border-border pb-3 text-sm"><strong>{completed.username}</strong> · {completed.skipped ? "Turno agotado" : "Turno completado"}</p>)}
      {votes.length === 0 && voterIds.length > 0 && <p className="text-sm">{voterIds.length} votos registrados</p>}
      {votes.map((message) => { const vote = message.activity; return vote?.kind === "vote" ? <p key={message.id} className="border-b border-border pb-3 text-sm">{vote.actor && vote.target ? `${vote.actor} votó a ${vote.target}` : "Se registró un voto"}</p> : null; })}
      {roundResults.map((result) => <div key={result.round} className="rounded-xl border border-border p-3 text-sm"><p className="font-semibold">Resultado · ronda {result.round}</p><p className="mt-1">{result.eliminatedPlayer ? `${result.eliminatedPlayer.username} fue eliminado. ${result.wasImpostor ? "Era impostor." : "Era inocente."}` : "Nadie fue eliminado."}</p></div>)}
      {winner && <p className="rounded-xl bg-accent/10 p-4 font-semibold">{winner === "impostor" ? "Ganaron los impostores" : "Ganaron los inocentes"}</p>}
    </div>
  </section>;
}
