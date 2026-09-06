/**
 * useSocketListeners Hook - Hook para registrar listeners de Socket.io en componentes
 *
 * Este hook simplifica el registro de listeners en componentes React,
 * manejando automáticamente la desuscripción cuando el componente se desmonta.
 * Utiliza un patrón de uso similar a useEffect pero específico para sockets.
 *
 * Razón de creación: Proporcionar una forma simple y segura de escuchar
 * eventos de socket con limpieza automática en el desuso del componente.
 */

import { useEffect } from "react";
import { getSocket } from "../services/socket/socket";

/**
 * Registra un listener de socket con limpieza automática
 * @param eventName - Nombre del evento a escuchar
 * @param callback - Función a ejecutar cuando se emite el evento
 * @param dependencies - Array de dependencias (como en useEffect)
 */
export const useSocketListener = <T>(
  eventName: string,
  callback: (data: T) => void,
  dependencies: React.DependencyList = []
): void => {
  useEffect(() => {
    const socket = getSocket();

    socket.on(eventName, callback);

    // Limpieza: desuscribirse cuando el componente se desmonta
    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback, dependencies]);
};

/**
 * Registra múltiples listeners en un solo componente
 * @param listeners - Objeto con pares de { eventName: callback }
 * @param dependencies - Array de dependencias
 */
export const useSocketListeners = <
  T extends Record<string, (...args: unknown[]) => void>
>(
  listeners: T,
  dependencies: React.DependencyList = []
): void => {
  useEffect(() => {
    const socket = getSocket();

    // Registrar todos los listeners
    Object.entries(listeners).forEach(([eventName, callback]) => {
      socket.on(eventName, callback);
    });

    // Limpieza: desuscribirse de todos
    return () => {
      Object.entries(listeners).forEach(([eventName, callback]) => {
        socket.off(eventName, callback);
      });
    };
  }, [listeners, dependencies]);
};
