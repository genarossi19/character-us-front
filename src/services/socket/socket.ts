/**
 * Socket Service - Gestiona la conexión y configuración de Socket.io
 *
 * Este archivo es el punto de entrada para todas las operaciones de Socket.io.
 * Crea una instancia única del cliente de socket, configura la conexión
 * y proporciona métodos para emitir eventos y escuchar respuestas.
 *
 * Razón de creación: Centralizar la configuración de Socket.io para evitar
 * múltiples instancias y mantener un único punto de control sobre la conexión.
 */

import { io, Socket } from "socket.io-client";

// URL del servidor de Socket.io
const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Instancia única del socket (singleton pattern)
let socketInstance: Socket | null = null;

/**
 * Obtiene la instancia del socket, creándola si no existe
 */
export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ["websocket"],
      autoConnect: true,
      closeOnBeforeunload: true,
    });

    // Log de conexión para debugging
    socketInstance.on("connect", () => {
      console.log("✅ Socket conectado:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket desconectado:", reason);
      if (reason === "io server disconnect") {
        // El servidor desconectó el socket, intentar reconectar
        console.log("🔄 Intentando reconectar...");
        socketInstance?.connect();
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("⚠️ Error de conexión:", error.message || error);
    });

    socketInstance.on("error", (error) => {
      console.error("⚠️ Error de socket:", error);
    });
  }

  return socketInstance;
};

/**
 * Desconecta la instancia del socket
 */
export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

/**
 * Comprueba si el socket está conectado
 */
export const isSocketConnected = (): boolean => {
  return socketInstance?.connected ?? false;
};
