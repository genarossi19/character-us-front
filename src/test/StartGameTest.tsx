import { useState } from "react";
import { useSocketListener } from "../hooks/use-socket-listeners";
import { getSocket } from "../services/socket/socket";

export function StartGameTest() {
  const [gamePin, setGamePin] = useState<string>("");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameData, setGameData] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSocketListener<Record<string, unknown>>("gameStarted", (data) => {
    setGameStarted(true);
    setGameData(data);
    console.log("🎮 Juego iniciado:", data);
  });

  const handleStartGame = () => {
    if (!gamePin) {
      setError("Ingresa un PIN válido");
      return;
    }

    setLoading(true);
    setError(null);

    const socket = getSocket();
    const pinNumber = parseInt(gamePin, 10);

    socket.emit(
      "startGame",
      { gamePin: pinNumber, categoryId: "1" },
      (response: Record<string, unknown> | undefined) => {
        setLoading(false);
        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          response.success
        ) {
          console.log("✅ Juego iniciado:", response);
        } else if (
          response &&
          typeof response === "object" &&
          "message" in response
        ) {
          setError(String(response.message) || "Error al iniciar juego");
          console.error("❌ Error:", response);
        } else {
          setError("Error al iniciar juego");
          console.error("❌ Error desconocido:", response);
        }
      }
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid orange",
        marginBottom: "20px",
      }}
    >
      <h3>🎮 Iniciar Juego</h3>
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
      <button onClick={handleStartGame} disabled={loading || !gamePin}>
        {loading ? "Iniciando..." : "Iniciar Juego"}
      </button>

      {gameStarted && (
        <div
          style={{ marginTop: "10px", padding: "10px", background: "#fff3e0" }}
        >
          <p>
            <strong>✅ Juego Iniciado</strong>
          </p>
          <pre>{JSON.stringify(gameData, null, 2)}</pre>
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
