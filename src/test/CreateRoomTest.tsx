import { useState } from "react";
import { emitCreateRoom } from "../services/socket/emitters/room";
import { useUserStore } from "../store/useUserStore";

export function CreateRoomTest() {
  const [gamePin, setGamePin] = useState<number | null>(null);
  const [internalId, setInternalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);

  const handleCreateRoom = () => {
    if (!user || user.isGuest || !token) {
      setError("Inicia sesión con una cuenta registrada para crear una sala.");
      return;
    }

    setLoading(true);
    setError(null);

    emitCreateRoom({
      username: user.username,
      token,
      settings: {
        category: "00000000-0000-0000-0000-000000000000",
        impostorCount: 1,
        totalRounds: 3,
        maxPlayers: 3,
        privacy: "public",
        mode: "classic",
        impostorsKnowEachOther: false,
        visibleVotes: false,
      },
    }, (response) => {
      setLoading(false);
      if (response.success && response.data?.room) {
        setGamePin(response.data.room.code);
        setInternalId(response.data.room.id);
        console.log("✅ Sala creada:", response);
      } else {
        setError(response.success ? "Respuesta de sala inválida" : response.message);
        console.error("❌ Error:", response);
      }
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid blue",
        marginBottom: "20px",
      }}
    >
      <h3>🎪 Crear Sala</h3>
      <button onClick={handleCreateRoom} disabled={loading || !user || user.isGuest || !token}>
        {loading ? "Creando..." : "Crear Sala"}
      </button>

      {gamePin && (
        <div
          style={{ marginTop: "10px", padding: "10px", background: "#e8f5e9" }}
        >
          <p>
            <strong>✅ Sala Creada</strong>
          </p>
          <p>
            Código: <code>{gamePin}</code>
          </p>
          <p>
            ID: <code>{internalId}</code>
          </p>
        </div>
      )}

      {error && (
        <div
          style={{ marginTop: "10px", padding: "10px", background: "#ffebee" }}
        >
          <p>
            <strong>❌ Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
}
