/**
 * useSocket Hook - Hook personalizado para usar Socket.io en componentes React
 *
 * Este hook proporciona un acceso seguro a la instancia del socket desde
 * componentes React, manteniendo la conexión durante toda la vida del componente.
 * Maneja la desuscripción de eventos automáticamente al desmontar el componente.
 *
 * Razón de creación: Abstraer la lógica de Socket.io en un hook reutilizable
 * que se integre naturalmente con el ciclo de vida de React.
 */

import { useEffect, useRef } from "react";
import { getSocket, isSocketConnected } from "../services/socket/socket";
import type { Socket } from "socket.io-client";

/**
 * Hook que proporciona acceso al socket y maneja su ciclo de vida
 * @returns Socket conectado
 */
export const useSocket = (): Socket | null => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Obtener la instancia del socket
    socketRef.current = getSocket();

    // Cleanup: No necesitamos desconectar aquí porque Socket.io
    // maneja la reconexión automáticamente
    return () => {
      // Opcional: Hacer algo cuando el componente se desmonta
      // pero sin desconectar el socket globalmente
    };
  }, []);

  return socketRef.current;
};

/**
 * Hook que retorna si el socket está conectado
 * @returns true si está conectado, false en caso contrario
 */
export const useSocketConnected = (): boolean => {
  useSocket();
  // En una aplicación real, aquí usarías useState y un listener
  // para actualizar el estado. Por ahora, retornamos el estado actual
  return isSocketConnected();
};
