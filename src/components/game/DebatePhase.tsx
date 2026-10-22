import { Check, MessagesSquare } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";
import ClueBoard from "./ClueBoard";

export default function DebatePhase() {
  const { readyPlayerIds, readyPlayersTotal } = useGameStore();
  const currentPlayer = useRoomStore((state) => state.currentPlayer);
  const { debateReady } = useSocketGame();
  const ready = Boolean(currentPlayer && readyPlayerIds.includes(currentPlayer.socketId));
  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="max-w-md">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-accent"><MessagesSquare className="size-4" aria-hidden="true" /> Pongan las pistas sobre la mesa</p>
          <h2 className="text-3xl font-semibold">¿Quién no encaja?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Compara las palabras y comparte tus sospechas en el chat.</p>
        </div>
        <div className="flex flex-col gap-2">
          {currentPlayer?.isAlive && <Button onClick={debateReady} disabled={ready} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"><Check className="size-4" aria-hidden="true" />{ready ? "Listo para votar" : "Estoy listo para votar"}</Button>}
          <p className="text-center text-xs text-muted-foreground">{readyPlayerIds.length} de {readyPlayersTotal} listos</p>
        </div>
      </section>
      <ClueBoard />
    </div>
  );
}
