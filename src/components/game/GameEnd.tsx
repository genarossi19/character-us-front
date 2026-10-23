import { motion } from "motion/react";
import { ArrowRight, ShieldAlert, Trophy } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export default function GameEnd() {
  const { winner, roundResults, finalResult, impostorIds, isImpostor } = useGameStore();
  const { currentPlayer, players } = useRoomStore();
  const navigate = useNavigate();
  const innocentsWon = winner === "innocent";
  // Use the final payload: roomUpdated resets the lobby players immediately afterwards.
  const finalPlayers = finalResult?.players ?? players;
  const revealedIds = new Set(finalResult?.impostorIds ?? [
    ...impostorIds,
    ...(isImpostor && currentPlayer ? [currentPlayer.socketId] : []),
    ...roundResults.flatMap((result) => result.wasImpostor && result.eliminatedPlayer ? [result.eliminatedPlayer.socketId] : []),
  ]);
  const impostors = finalPlayers.filter((player) => revealedIds.has(player.socketId));
  const handleContinue = () => {
    navigate("/lobby", { replace: true });
  };

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-3xl border px-5 py-9 text-center sm:px-8 sm:py-12 ${innocentsWon ? "border-accent/30 bg-accent/5" : "border-impostor/30 bg-impostor/5"}`}>
        <div aria-hidden="true" className={`pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl ${innocentsWon ? "bg-accent/10" : "bg-impostor/10"}`} />
        <div className="relative">
          {innocentsWon ? <Trophy className="mx-auto mb-4 size-14 text-accent" aria-hidden="true" /> : <ShieldAlert className="mx-auto mb-4 size-14 text-impostor" aria-hidden="true" />}
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Partida terminada</p>
          <h1 className={`text-4xl font-semibold sm:text-5xl ${innocentsWon ? "text-accent" : "text-impostor"}`}>{innocentsWon ? "Ganan los inocentes" : impostors.length > 1 ? "Ganan los impostores" : "Gana el impostor"}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{innocentsWon ? "Las pistas y las sospechas dieron resultado." : impostors.length > 1 ? "Consiguieron pasar desapercibidos hasta el final." : "Consiguió pasar desapercibido hasta el final."}</p>
          <div className="mt-9 border-t border-border pt-7">
            <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">{impostors.length > 1 ? "Estos eran los impostores" : "Este era el impostor"}</h2>
            {impostors.length > 0 ? <div className="flex flex-wrap justify-center gap-8">
              {impostors.map((player) => <div key={player.socketId} className="flex min-w-0 max-w-full flex-col items-center">
                <div className="relative">
                  <img src={player.avatarUrl} alt={player.username} className={`rounded-3xl border-4 border-impostor/60 object-cover shadow-xl shadow-impostor/10 ${innocentsWon ? "size-32 sm:size-40" : "size-44 sm:size-56"}`} />
                  <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-impostor px-4 py-1.5 text-xs font-semibold text-white"><ShieldAlert className="size-3.5" aria-hidden="true" />IMPOSTOR</span>
                </div>
                <p className="mt-6 max-w-full break-words text-3xl font-semibold sm:text-4xl">{player.username}{player.socketId === currentPlayer?.socketId && <span className="ml-2 text-lg text-muted-foreground">(tú)</span>}</p>
              </div>)}
            </div> : <div className="flex flex-col items-center gap-4"><ShieldAlert className="size-28 text-impostor" aria-hidden="true" /><p className="text-sm text-muted-foreground">Identidad sin revelar</p></div>}
          </div>
        </div>
      </motion.section>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Así se jugó la partida</h2>
        {roundResults.map((result) => <div key={result.round} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">Ronda {result.round}</span>
          {result.eliminatedPlayer ? <div className="flex min-w-0 items-center gap-2">
            <img src={result.eliminatedPlayer.avatarUrl} alt="" className="size-8 rounded-lg object-cover" />
            <span className="min-w-0 break-words text-sm font-medium">{result.eliminatedPlayer.username}</span>
            <span className={`text-xs ${result.wasImpostor ? "text-impostor" : "text-muted-foreground"}`}>{result.wasImpostor ? "Impostor" : "Inocente"}</span>
          </div> : <span className="text-sm text-muted-foreground">Sin eliminación</span>}
        </div>)}
      </section>
      <div className="text-center"><Button onClick={handleContinue} className="gap-2 bg-accent px-6 text-accent-foreground hover:bg-accent/90">Volver al lobby<ArrowRight className="size-4" aria-hidden="true" /></Button></div>
    </div>
  );
}
