import { useState } from "react";
import { useSocketListener } from "../hooks/use-socket-listeners";

export function PlayersListenerTest() {
  const [players, setPlayers] = useState<unknown[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);

  useSocketListener<Record<string, unknown>>("updatePlayers", (data) => {
    if (
      typeof data === "object" &&
      data !== null &&
      "players" in data &&
      "hostId" in data
    ) {
      setPlayers((data.players as unknown[]) || []);
      setHostId((data.hostId as string) || null);
    }
    console.log("🎭 Jugadores actualizados:", data);
  });

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid purple",
        marginBottom: "20px",
      }}
    >
      <h3>👥 Escuchador de Jugadores</h3>

      {players && players.length > 0 ? (
        <div style={{ padding: "10px", background: "#f3e5f5" }}>
          <p>
            <strong>Host ID:</strong> <code>{hostId}</code>
          </p>
          <p>
            <strong>Total Jugadores: {players.length}</strong>
          </p>
          <ul>
            {players.map((player: unknown) => {
              const p = player as Record<string, unknown>;
              return (
                <li key={String(p.socketId)}>
                  {String(p.username)} {p.socketId === hostId && "👑"}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p style={{ color: "#999" }}>Esperando actualización de jugadores...</p>
      )}
    </div>
  );
}
