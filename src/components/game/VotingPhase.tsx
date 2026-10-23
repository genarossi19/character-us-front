import { useState } from "react";
import { Check, CheckCircle2, Vote } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";

export default function VotingPhase() {
  const { votes, votesVisible, voterIds, hasVoted: confirmedVote, votedFor, wordHints } = useGameStore();
  const { players, currentPlayer, room } = useRoomStore();
  const { votePlayer } = useSocketGame();
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [submittedVote, setHasVoted] = useState(false);
  const hasVoted = confirmedVote || submittedVote;
  const visibleVotes = votesVisible ?? room?.settings.visibleVotes ?? false;
  const alivePlayers = players.filter((player) => player.isAlive && player.socketId !== currentPlayer?.socketId);
  const userVote = votedFor ?? (currentPlayer ? votes[currentPlayer.socketId] : undefined);
  const handleVote = () => {
    if (!selectedVote || !currentPlayer?.isAlive || hasVoted || userVote) return;
    votePlayer(selectedVote);
    setHasVoted(true);
  };

  return (
    <div>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">¿Quién es el impostor?</h2>
            {!hasVoted && !userVote && <p className="mt-1 text-sm text-muted-foreground">{!currentPlayer?.isAlive ? "Estás mirando la votación." : "Elige a alguien y confirma tu voto."}</p>}
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{voterIds.length} / {players.filter((player) => player.isAlive).length} votos</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {alivePlayers.map((player) => {
            const selected = selectedVote === player.socketId || userVote === player.socketId;
            const count = visibleVotes ? Object.values(votes).filter((id) => id === player.socketId).length : 0;
            const hint = wordHints.find((clue) => clue.playerId === player.socketId);
            return (
              <button type="button" key={player.socketId} aria-pressed={selected} disabled={!currentPlayer?.isAlive || hasVoted || Boolean(userVote)} onClick={() => setSelectedVote(player.socketId)}
                className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${selected ? "border-accent bg-accent/10" : "border-border bg-background/30 hover:enabled:border-accent/50"}`}>
                <img src={player.avatarUrl} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{player.username}</p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{hint && !hint.skipped ? `Pista: ${hint.word}` : "Sin palabra"}</p>
                  {visibleVotes && count > 0 && <p className="mt-1 text-xs text-accent">{count} voto{count === 1 ? "" : "s"}</p>}
                  {!visibleVotes && voterIds.includes(player.socketId) && <p className="mt-1 text-xs text-muted-foreground">Ya votó</p>}
                </div>
                {selected && <CheckCircle2 className="size-5 shrink-0 text-accent" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        {selectedVote && !hasVoted && !userVote && <Button onClick={handleVote} className="w-full gap-2 bg-impostor text-white hover:bg-impostor/90 sm:w-auto"><Vote className="size-4" aria-hidden="true" />Confirmar voto por {players.find((player) => player.socketId === selectedVote)?.username}</Button>}
        {(hasVoted || userVote) && <p role="status" className="flex items-center gap-2 text-sm text-accent"><Check className="size-4" aria-hidden="true" />Voto enviado. Esperando el resultado.</p>}
      </section>
    </div>
  );
}
