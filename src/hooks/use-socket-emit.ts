/**
 * useSocketEmit Hook - Hook para emitir eventos de Socket.io desde componentes
 *
 * Este hook proporciona una forma segura de emitir eventos a través de Socket.io
 * desde componentes React. Retorna una función que puede usarse como manejador
 * de eventos o llamarse directamente desde lógica del componente.
 *
 * Razón de creación: Facilitar la emisión de eventos desde componentes con
 * acceso a la instancia del socket de forma segura y reutilizable.
 */

import { useCallback } from "react";
import { getSocket } from "../services/socket/socket";

/**
 * Retorna una función para emitir eventos de socket
 * @returns Función que emite eventos al servidor
 */
export const useSocketEmit = () => {
  const emit = useCallback(
    <T>(
      eventName: string,
      data?: T,
      callback?: (response?: any) => void
    ): void => {
      const socket = getSocket();

      if (callback) {
        socket.emit(eventName, data, callback);
      } else {
        socket.emit(eventName, data);
      }
    },
    []
  );

  return emit;
};
