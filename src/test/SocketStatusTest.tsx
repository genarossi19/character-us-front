import { useEffect, useState } from "react";
import { getSocket } from "../services/socket/socket";

export function SocketStatusTest() {
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);
    setSocketId(socket.id ?? null);
    setUrl(socket.io.engine.transport.name || "desconocido");

    const handleConnect = () => {
      setConnected(true);
      console.log("✅ Socket conectado");
    };

    const handleDisconnect = () => {
      setConnected(false);
      console.log("❌ Socket desconectado");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <div
      style={{ padding: "20px", border: "1px solid red", marginBottom: "20px" }}
    >
      <h3>🔌 Estado del Socket</h3>
      <div
        style={{
          padding: "10px",
          background: connected ? "#e8f5e9" : "#ffebee",
        }}
      >
        <p>
          <strong>Estado:</strong>{" "}
          {connected ? "✅ Conectado" : "❌ Desconectado"}
        </p>
        <p>
          <strong>Socket ID:</strong> <code>{socketId}</code>
        </p>
        <p>
          <strong>Transport:</strong> <code>{url}</code>
        </p>
      </div>
    </div>
  );
}
