import { Check, Clock3, MessageSquareText, PencilLine, UserRoundX } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";

export default function ClueBoard() {
  const { phase, wordHints, currentTurnPlayerId } = useGameStore();
  const { players, currentPlayer } = useRoomStore();
  // Retain accepted clues even if their author leaves the room.
  const entries = [
    ...players.map((player) => ({ id: player.socketId, name: player.username, player, hint: wordHints.find((hint) => hint.playerId === player.socketId) })),
    ...wordHints.filter((hint) => !players.some((player) => player.socketId === hint.playerId))
      .map((hint) => ({ id: hint.playerId, name: hint.username, player: undefined, hint })),
  ];
  const total = entries.filter(({ player, hint }) => player?.isAlive || hint).length;
  return (
    <section aria-labelledby="clue-board-title" className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id="clue-board-title" className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="size-4 text-accent" aria-hidden="true" /> Pistas de la ronda</h3>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{wordHints.length} / {total} pistas</span>
      </div>
      <div aria-live="polite" aria-relevant="additions text" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entries.map(({ id, name, player, hint }) => {
          const active = phase === "word" && currentTurnPlayerId === id && !hint;
          const Icon = hint ? hint.skipped ? Clock3 : Check : active ? PencilLine : player?.isAlive ? Clock3 : UserRoundX;
          return (
            <article key={id} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-colors sm:block ${active ? "border-accent bg-accent/10" : "border-border bg-card"}`}>
              <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:mb-2">
                {player?.avatarUrl ? <img src={player.avatarUrl} alt="" className="size-7 rounded-lg object-cover" /> : <UserRoundX className="size-7 rounded-lg bg-muted p-1.5 text-muted-foreground" aria-hidden="true" />}
                <p className="min-w-0 flex-1 break-words text-sm font-medium">{name}{id === currentPlayer?.socketId && <span className="ml-1 text-muted-foreground">(tú)</span>}</p>
                <Icon className={`size-4 shrink-0 ${(hint && !hint.skipped) || active ? "text-accent" : "text-muted-foreground"}`} aria-hidden="true" />
              </div>
              {hint ? <p className={`max-w-[45%] break-words text-right text-base font-semibold sm:max-w-none sm:text-left sm:text-lg ${hint.skipped ? "text-sm text-muted-foreground" : "text-foreground"}`}>{hint.skipped ? "Sin palabra" : hint.word}</p> : (
                <p className={`max-w-[42%] text-right text-xs sm:max-w-none sm:text-left sm:text-sm ${active ? "font-medium text-accent" : "text-muted-foreground"}`}>
                  {active ? "Escribiendo su pista…" : !player?.isAlive ? "Eliminado" : phase === "word" ? "Esperando su turno" : "Sin pista esta ronda"}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
