import { useState } from "react";
import { emitJoinRoom } from "../services/socket/emitters/room";
import type { Room } from "../types/game";

export function JoinRoomTest() {
  const [gamePin, setGamePin] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinRoom = () => {
    if (!gamePin) {
      setError("Ingresa un PIN válido");
      return;
    }

    setLoading(true);
    setError(null);

    const pinNumber = parseInt(gamePin, 10);

    emitJoinRoom(
      { code: pinNumber, username: "TestPlayer2" },
      (response) => {
        setLoading(false);
        if (response.success) {
            setJoined(true);
            setRoomInfo(response.data?.room || null);
            console.log("✅ Unido a sala:", response.data?.room.code);
        } else {
          setError(response.message || "Error al unirse");
        }
      }
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid green",
        marginBottom: "20px",
      }}
    >
      <h3>🚪 Unirse a Sala</h3>
      <div>
        <label>
          PIN de Sala:{" "}
          <input
            type="text"
            value={gamePin}
            onChange={(e) => setGamePin(e.target.value)}
            placeholder="Ej: 123456"
          />
        </label>
      </div>
      <button onClick={handleJoinRoom} disabled={loading || !gamePin}>
        {loading ? "Uniéndose..." : "Unirse"}
      </button>

      {joined && (
        <div
          style={{ marginTop: "10px", padding: "10px", background: "#e8f5e9" }}
        >
          <p>
            <strong>✅ Unido a Sala</strong>
          </p>
          <p>
            {roomInfo && typeof roomInfo === "object" && "message" in roomInfo
              ? String(roomInfo.message)
              : "Unido correctamente"}
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
