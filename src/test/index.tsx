import { CompleteFlowTest } from "./CompleteFlowTest";

export function TestPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>🧪 Test de Socket.io - Flujo Completo</h1>
      <p style={{ color: "#666" }}>
        Prueba completa del flujo de juego: crear sala → unirse → iniciar juego
      </p>

      <CompleteFlowTest />

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h4>📝 Notas:</h4>
        <ul>
          <li>Abre la consola del navegador para ver los logs detallados</li>
          <li>El servidor debe estar corriendo en localhost:3000</li>
          <li>Cada test es independiente</li>
          <li>
            Puedes usar múltiples pestañas para simular diferentes jugadores
          </li>
        </ul>
      </div>
    </div>
  );
}
