import { useState } from "react";
import { emitCreateRoom } from "../services/socket/emitters/room";

export function CreateRoomTest() {
  const [gamePin, setGamePin] = useState<number | null>(null);
  const [internalId, setInternalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    setLoading(true);
    setError(null);

    emitCreateRoom({ username: "TestPlayer" }, (response) => {
      setLoading(false);
      if (response && "gamePin" in response) {
        setGamePin(response.gamePin);
        setInternalId(response.internalId);
        console.log("✅ Sala creada:", response);
      } else {
        setError(response?.message || "Error desconocido");
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
      <button onClick={handleCreateRoom} disabled={loading}>
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
            PIN: <code>{gamePin}</code>
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
