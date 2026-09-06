import { useState, useEffect } from "react";
import { getSocket } from "../services/socket/socket";

export function DiagnosticTest() {
  const [diagnostic, setDiagnostic] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handleCheckDiagnostic = () => {
    setLoading(true);
    const socket = getSocket();

    const diagnosticData = {
      socketConnected: socket.connected,
      socketId: socket.id ?? "no disponible",
      socketURL: socket.io.engine.transport.name || "unknown",
      timestamp: new Date().toISOString(),
    };

    setDiagnostic(diagnosticData);
    console.log("📊 Diagnóstico:", diagnosticData);
    setLoading(false);
  };

  useEffect(() => {
    // Esperar un poco para que se conecte
    const timer = setTimeout(() => {
      handleCheckDiagnostic();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #FF9800",
        marginBottom: "20px",
        background: "#FFF3E0",
      }}
    >
      <h3>📊 Diagnóstico del Servidor</h3>

      <button onClick={handleCheckDiagnostic} disabled={loading}>
        {loading ? "Verificando..." : "Verificar Conexión"}
      </button>

      {diagnostic && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#fff",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          <p>
            <strong>Socket Conectado:</strong>{" "}
            {(diagnostic.socketConnected as boolean)
              ? "✅ Sí"
              : "⏳ Conectando..."}
          </p>
          <p>
            <strong>Socket ID:</strong> {String(diagnostic.socketId)}
          </p>
          <p>
            <strong>Transport:</strong> {String(diagnostic.socketURL)}
          </p>
          <p>
            <strong>Verificado:</strong> {String(diagnostic.timestamp)}
          </p>

          {!(diagnostic.socketConnected as boolean) && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#FFEBEE",
                borderLeft: "3px solid #F44336",
              }}
            >
              <p style={{ margin: "0", color: "#D32F2F" }}>
                ⚠️ Socket aún conectando. Espera unos segundos...
              </p>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "10px",
          fontSize: "12px",
          color: "#666",
          padding: "10px",
          background: "#fff",
          borderRadius: "4px",
        }}
      >
        <p>💡 Si la conexión falla:</p>
        <ul style={{ marginTop: "5px" }}>
          <li>Verifica que el servidor está corriendo en localhost:3000</li>
          <li>Abre la consola de desarrollo (F12)</li>
          <li>Revisa los logs para errores de conexión</li>
        </ul>
      </div>
    </div>
  );
}
