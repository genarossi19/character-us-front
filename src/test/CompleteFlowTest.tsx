import { useState, useEffect } from "react";
import { useSocketListener } from "../hooks/use-socket-listeners";
import { getSocket } from "../services/socket/socket";
import {
  emitCreateRoom,
  emitJoinRoom,
  emitStartGame,
} from "../services/socket/emitters/room";
import { fetchCategories, type Category } from "../services/api/category";

interface Player {
  socketId: string;
  username: string;
  characterId?: string;
  isImpostor?: boolean;
}

export function CompleteFlowTest() {
  // ========== ESTADO GENERAL ==========
  const [socketReady, setSocketReady] = useState(false);
  const [currentSocketId, setCurrentSocketId] = useState<string>("");
  const [hostSocketId, setHostSocketId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ========== FLUJO HOST (CREAR SALA) ==========
  const [hostState, setHostState] = useState<"idle" | "created" | "started">(
    "idle"
  );
  const [hostCategoryId, setHostCategoryId] = useState<string>("");
  const [hostGamePin, setHostGamePin] = useState<number | null>(null);
  const [hostPlayers, setHostPlayers] = useState<Player[]>([]);
  const [hostLoading, setHostLoading] = useState(false);
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostGameData, setHostGameData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // ========== FLUJO GUEST (UNIRSE SALA) ==========
  const [guestState, setGuestState] = useState<"idle" | "joined" | "started">(
    "idle"
  );
  const [guestPin, setGuestPin] = useState<string>("");
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestGameData, setGuestGameData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // ========== EFECTOS ==========
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setSocketReady(true);
      setCurrentSocketId(socket.id || "");
      console.log("✅ Socket listo para usar - ID:", socket.id);
    };

    const handleDisconnect = () => {
      setSocketReady(false);
      console.log("❌ Socket desconectado");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setSocketReady(true);
      setCurrentSocketId(socket.id || "");
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      if (data.length > 0) {
        setHostCategoryId(data[0].id);
      }
      setCategoriesLoading(false);
    };
    loadCategories();
  }, []);

  // Listeners para actualizar jugadores
  useSocketListener<{ players: Player[] }>("updatePlayers", (data) => {
    if (hostState === "created" || hostState === "started") {
      setHostPlayers(data.players || []);
    }
    if (guestState === "joined" || guestState === "started") {
      setGuestPlayers(data.players || []);
    }
  });

  // Listener para cuando inicia el juego
  useSocketListener<Record<string, unknown>>("gameStarted", (data) => {
    console.log("🎮 Juego iniciado:", data);
    setHostState("started");
    setHostGameData(data);
    setGuestState("started");
    setGuestGameData(data);
  });

  // ========== HANDLERS HOST ==========
  const handleCreateRoom = () => {
    if (!hostCategoryId) {
      setHostError("Selecciona una categoría");
      return;
    }

    setHostLoading(true);
    setHostError(null);

    const payload = { username: "Host", categoryId: hostCategoryId };
    console.log("📌 Creando sala con:", payload);

    emitCreateRoom(payload, (response) => {
      setHostLoading(false);
      if (response && "gamePin" in response) {
        const resp = response as unknown as { gamePin: number };
        console.log("✅ Sala creada con PIN:", resp.gamePin);
        setHostGamePin(resp.gamePin);
        setHostState("created");
        setHostSocketId(currentSocketId);
        setHostPlayers([{ socketId: currentSocketId, username: "Host" }]);
      } else {
        setHostError("Error al crear sala");
      }
    });
  };

  const handleStartGame = () => {
    if (!hostGamePin) {
      setHostError("No hay gamePin");
      return;
    }

    setHostLoading(true);
    setHostError(null);

    console.log(
      "🎮 Iniciando juego con PIN:",
      hostGamePin,
      "Categoría:",
      hostCategoryId
    );

    emitStartGame(
      { gamePin: hostGamePin, categoryId: hostCategoryId },
      (response) => {
        setHostLoading(false);
        if (response && typeof response === "object" && "success" in response) {
          console.log("✅ Juego iniciado");
        } else {
          const msg =
            (response as unknown as Record<string, unknown>)?.message ||
            "Error al iniciar";
          setHostError(String(msg));
        }
      }
    );
  };

  // ========== HANDLERS GUEST ==========
  const handleJoinRoom = () => {
    if (!guestPin) {
      setGuestError("Ingresa un PIN");
      return;
    }

    setGuestLoading(true);
    setGuestError(null);

    const pinNumber = parseInt(guestPin, 10);
    console.log("🚪 Uniéndose a sala con PIN:", pinNumber);

    emitJoinRoom({ gamePin: pinNumber, username: "Guest" }, (response) => {
      setGuestLoading(false);
      if (response && typeof response === "object" && "success" in response) {
        console.log("✅ Unido a sala");
        setGuestState("joined");
        setGuestPlayers([{ socketId: currentSocketId, username: "Guest" }]);
      } else {
        const msg =
          (response as unknown as Record<string, unknown>)?.message ||
          "Error al unirse";
        setGuestError(String(msg));
      }
    });
  };

  // ========== FUNCIÓN HELPER PARA RENDERIZAR JUGADORES ==========
  const renderPlayerList = (
    players: Player[],
    currentId: string,
    hostId: string
  ) => {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "12px",
        }}
      >
        {players.map((p) => (
          <div
            key={p.socketId}
            style={{
              padding: "10px",
              background: "#FFF",
              borderRadius: "8px",
              border:
                p.socketId === currentId
                  ? "3px solid #FF6B6B"
                  : "2px solid #DDD",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Imagen del Personaje */}
            {p.isImpostor ? (
              <img
                src="/impostor.webp"
                alt="Impostor"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "4px",
                  marginBottom: "5px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "4px",
                  marginBottom: "5px",
                  background: "#F0F0F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                🎭
              </div>
            )}

            {/* Nombre del Jugador */}
            <p
              style={{
                margin: "5px 0 0 0",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {p.username}
            </p>

            {/* Indicadores */}
            <div style={{ fontSize: "11px", marginTop: "3px" }}>
              {p.socketId === currentId && (
                <span
                  style={{
                    display: "inline-block",
                    background: "#FF6B6B",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    marginRight: "3px",
                  }}
                >
                  👤 tú
                </span>
              )}
              {p.socketId === hostId && (
                <span
                  style={{
                    display: "inline-block",
                    background: "#FFD700",
                    color: "#333",
                    padding: "2px 6px",
                    borderRadius: "3px",
                  }}
                >
                  👑 host
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧪 Test Socket.io - Flujo Completo (DOS VENTANAS)</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Abre esta página en dos ventanas/pestañas: una para HOST (crear) y otra
        para GUEST (unirse)
      </p>

      {/* Status Global */}
      <div
        style={{
          padding: "15px",
          marginBottom: "20px",
          background: socketReady ? "#E8F5E9" : "#FFF3E0",
          borderRadius: "8px",
          fontWeight: "bold",
          border: "2px solid " + (socketReady ? "#4CAF50" : "#FF9800"),
        }}
      >
        {socketReady ? "✅ Socket Conectado" : "⏳ Conectando..."}
      </div>

      {/* Selector de Categoría */}
      {categoriesLoading ? (
        <div
          style={{
            padding: "15px",
            background: "#FFF3E0",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          ⏳ Cargando categorías...
        </div>
      ) : (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            background: "#F5F5F5",
            borderRadius: "8px",
          }}
        >
          <label style={{ fontWeight: "bold" }}>
            📁 Selecciona Categoría para la Sala:
            <select
              value={hostCategoryId}
              onChange={(e) => setHostCategoryId(e.target.value)}
              disabled={hostState !== "idle"}
              style={{ marginLeft: "10px", padding: "8px", fontSize: "14px" }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* DOS COLUMNAS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* ========== PANEL HOST (CREAR SALA) ========== */}
        <div
          style={{
            border: "3px solid #2196F3",
            borderRadius: "8px",
            padding: "20px",
            background: "#E3F2FD",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#1976D2" }}>
            👑 HOST - Crear Sala
          </h3>

          {hostState === "idle" && (
            <button
              onClick={handleCreateRoom}
              disabled={hostLoading || !socketReady || !hostCategoryId}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: hostLoading ? "not-allowed" : "pointer",
              }}
            >
              {hostLoading ? "Creando..." : "🎪 Crear Sala"}
            </button>
          )}

          {hostError && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#FFCDD2",
                borderRadius: "4px",
                color: "#C62828",
              }}
            >
              ❌ {hostError}
            </div>
          )}

          {hostState !== "idle" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#FFF",
                borderRadius: "4px",
                border: "2px solid #4CAF50",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#2E7D32",
                }}
              >
                ✅ Sala Creada
              </p>
              <p style={{ margin: "5px 0", fontSize: "18px" }}>
                📌 PIN:{" "}
                <code
                  style={{
                    background: "#FFF9C4",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  {hostGamePin}
                </code>
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px" }}>
                📂 Categoría:{" "}
                <strong>
                  {categories.find((c) => c.id === hostCategoryId)?.name ||
                    hostCategoryId}
                </strong>
              </p>
            </div>
          )}

          {/* Lista de Jugadores - HOST */}
          {hostState !== "idle" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#E8F5E9",
                borderRadius: "4px",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#2E7D32",
                }}
              >
                👥 Jugadores ({hostPlayers.length})
              </p>
              {renderPlayerList(hostPlayers, currentSocketId, hostSocketId)}
            </div>
          )}

          {/* Botón Iniciar - HOST */}
          {hostState === "created" && (
            <button
              onClick={handleStartGame}
              disabled={hostLoading || !socketReady}
              style={{
                width: "100%",
                marginTop: "15px",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: hostLoading ? "not-allowed" : "pointer",
              }}
            >
              {hostLoading ? "Iniciando..." : "🚀 Iniciar Juego"}
            </button>
          )}

          {/* Resultado del Juego - HOST */}
          {hostState === "started" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#F3E5F5",
                borderRadius: "4px",
                border: "2px solid #9C27B0",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#6A1B9A",
                }}
              >
                🎮 Resultado del Juego
              </p>

              {hostGameData && (
                <div
                  style={{
                    fontSize: "12px",
                    background: "#FFF",
                    padding: "10px",
                    borderRadius: "4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                    📊 JSON Recibido:
                  </p>
                  <pre
                    style={{
                      margin: "0",
                      fontSize: "11px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(hostGameData, null, 2)}
                  </pre>
                </div>
              )}

              {hostGameData && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: "#E8F5E9",
                    borderRadius: "4px",
                  }}
                >
                  {hostGameData && hostGameData.character ? (
                    <div>
                      <p
                        style={{
                          margin: "5px 0",
                          fontWeight: "bold",
                          color: "#2E7D32",
                        }}
                      >
                        🎭 Personaje Asignado
                      </p>
                      <p style={{ margin: "3px 0", fontSize: "12px" }}>
                        Nombre:{" "}
                        <strong>
                          {String(
                            (
                              hostGameData.character as unknown as Record<
                                string,
                                unknown
                              >
                            )?.name
                          )}
                        </strong>
                      </p>
                      <p style={{ margin: "3px 0", fontSize: "12px" }}>
                        ID:{" "}
                        <code>
                          {String(
                            (
                              hostGameData.character as unknown as Record<
                                string,
                                unknown
                              >
                            )?.id
                          )}
                        </code>
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "10px",
                        background: "#FFF3E0",
                        borderRadius: "4px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontWeight: "bold",
                          color: "#F57C00",
                        }}
                      >
                        👑 ERES EL IMPOSTOR
                      </p>
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>
                        Character: <code>null</code>
                      </p>
                    </div>
                  )}
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
                    ¿Impostor?{" "}
                    <strong>
                      {hostGameData.amIImpostor === true ? "👑 SÍ" : "❌ NO"}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========== PANEL GUEST (UNIRSE SALA) ========== */}
        <div
          style={{
            border: "3px solid #FF9800",
            borderRadius: "8px",
            padding: "20px",
            background: "#FFF3E0",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#E65100" }}>
            🚪 GUEST - Unirse a Sala
          </h3>

          {guestState === "idle" && (
            <>
              <input
                type="text"
                placeholder="Ingresa PIN de sala"
                value={guestPin}
                onChange={(e) => setGuestPin(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "4px",
                  border: "2px solid #FF9800",
                  marginBottom: "10px",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleJoinRoom}
                disabled={guestLoading || !socketReady || !guestPin}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  backgroundColor: "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: guestLoading ? "not-allowed" : "pointer",
                }}
              >
                {guestLoading ? "Uniéndose..." : "🚪 Unirse a Sala"}
              </button>
            </>
          )}

          {guestError && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#FFCDD2",
                borderRadius: "4px",
                color: "#C62828",
              }}
            >
              ❌ {guestError}
            </div>
          )}

          {guestState !== "idle" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#FFF",
                borderRadius: "4px",
                border: "2px solid #4CAF50",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#2E7D32",
                }}
              >
                ✅ Unido a Sala
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px" }}>
                📌 PIN:{" "}
                <code
                  style={{
                    background: "#FFF9C4",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {guestPin}
                </code>
              </p>
            </div>
          )}

          {/* Lista de Jugadores - GUEST */}
          {guestState !== "idle" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#E8F5E9",
                borderRadius: "4px",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#2E7D32",
                }}
              >
                👥 Jugadores ({guestPlayers.length})
              </p>
              {renderPlayerList(guestPlayers, currentSocketId, hostSocketId)}
            </div>
          )}

          {/* Esperando que el host inicie - GUEST */}
          {guestState === "joined" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#BBDEFB",
                borderRadius: "4px",
                textAlign: "center",
                color: "#1565C0",
              }}
            >
              ⏳ Esperando que el HOST inicie el juego...
            </div>
          )}

          {/* Resultado del Juego - GUEST */}
          {guestState === "started" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "#F3E5F5",
                borderRadius: "4px",
                border: "2px solid #9C27B0",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#6A1B9A",
                }}
              >
                🎮 Resultado del Juego
              </p>

              {guestGameData && (
                <div
                  style={{
                    fontSize: "12px",
                    background: "#FFF",
                    padding: "10px",
                    borderRadius: "4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                    📊 JSON Recibido:
                  </p>
                  <pre
                    style={{
                      margin: "0",
                      fontSize: "11px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(guestGameData, null, 2)}
                  </pre>
                </div>
              )}

              {guestGameData && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: "#E8F5E9",
                    borderRadius: "4px",
                  }}
                >
                  {guestGameData && guestGameData.character ? (
                    <div>
                      <p
                        style={{
                          margin: "5px 0",
                          fontWeight: "bold",
                          color: "#2E7D32",
                        }}
                      >
                        🎭 Personaje Asignado
                      </p>
                      <p style={{ margin: "3px 0", fontSize: "12px" }}>
                        Nombre:{" "}
                        <strong>
                          {String(
                            (
                              guestGameData.character as unknown as Record<
                                string,
                                unknown
                              >
                            )?.name
                          )}
                        </strong>
                      </p>
                      <p style={{ margin: "3px 0", fontSize: "12px" }}>
                        ID:{" "}
                        <code>
                          {String(
                            (
                              guestGameData.character as unknown as Record<
                                string,
                                unknown
                              >
                            )?.id
                          )}
                        </code>
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "10px",
                        background: "#FFF3E0",
                        borderRadius: "4px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontWeight: "bold",
                          color: "#F57C00",
                        }}
                      >
                        👑 ERES EL IMPOSTOR
                      </p>
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>
                        Character: <code>null</code>
                      </p>
                    </div>
                  )}
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
                    ¿Impostor?{" "}
                    <strong>
                      {guestGameData.amIImpostor === true ? "👑 SÍ" : "❌ NO"}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#F5F5F5",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>📋 Instrucciones:</h4>
        <ol style={{ margin: "0", paddingLeft: "20px" }}>
          <li>
            Abre esta página en <strong>DOS ventanas/pestañas</strong>
          </li>
          <li>
            En la <strong>primera ventana (HOST)</strong>: Selecciona categoría
            y presiona "Crear Sala"
          </li>
          <li>Copia el PIN que aparece en la primera ventana</li>
          <li>
            En la <strong>segunda ventana (GUEST)</strong>: Pega el PIN y
            presiona "Unirse a Sala"
          </li>
          <li>
            En la <strong>primera ventana (HOST)</strong>: Verás la lista de
            jugadores actualizarse y presiona "Iniciar Juego"
          </li>
          <li>
            En <strong>ambas ventanas</strong> verás si eres impostor y qué
            personaje se asignó
          </li>
          <li>Revisa el JSON para ver exactamente qué devolvió el backend</li>
        </ol>
      </div>
    </div>
  );
}
