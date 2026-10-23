import { Check } from "lucide-react";
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
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold">¿Quién no encaja?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Compara las pistas y conversa en el chat.</p>
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
