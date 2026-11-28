import { useEffect, useState } from "react";
import { publicApi } from "@/services/api/client";
import { Button } from "@/components/ui/button";

interface Stats {
  games_played: number;
  games_won: number;
  impostor_wins: number;
  impostor_losses: number;
  innocent_wins: number;
  innocent_losses: number;
  times_eliminated: number;
}

export function ProfileStats({ id }: { id: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    publicApi.get<{ user: Stats }>(`/stats/user/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setStats(data.user); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [id, attempt]);

  return <section aria-labelledby="profile-stats" className="space-y-3">
    <h2 id="profile-stats" className="text-xl font-semibold">Mis estadísticas</h2>
    {failed ? <div role="alert">No pudimos cargar las estadísticas. <Button variant="ghost" onClick={() => setAttempt(n => n + 1)}>Reintentar</Button></div>
      : !stats ? <p role="status">Cargando estadísticas…</p>
      : <>
        <table className="w-full text-right text-sm tabular-nums">
          <thead><tr className="border-b"><th className="py-2 text-left">Rol</th><th>Jugadas</th><th>Ganadas</th><th>Perdidas</th></tr></thead>
          <tbody>{[["Impostor", stats.impostor_wins, stats.impostor_losses], ["Inocente", stats.innocent_wins, stats.innocent_losses]].map(([role, wins, losses]) =>
            <tr key={role} className="border-b"><th scope="row" className="py-2 text-left">{role}</th><td>{Number(wins) + Number(losses)}</td><td>{wins}</td><td>{losses}</td></tr>)}</tbody>
          <tfoot><tr className="font-semibold"><th className="pt-2 text-left">Total</th><td>{stats.games_played}</td><td>{stats.games_won}</td><td>{stats.games_played - stats.games_won}</td></tr></tfoot>
        </table>
        <p className="text-sm text-muted-foreground">Veces eliminado: {stats.times_eliminated}</p>
      </>}
  </section>;
}
