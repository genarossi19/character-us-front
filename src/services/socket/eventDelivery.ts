import { getSocket } from "./socket";
import { isRecoveringRoom } from "@/store/useRoomSessionStore";

/** Events received before a recovery ack are covered by its newer snapshot.
 * Drop them rather than replaying stale transitions over the snapshot. Socket.IO
 * invokes the ack synchronously before delivering the subsequent event packet.
 */
export function onServerEvent<T>(event: string, callback: (data: T) => void): () => void {
  const socket = getSocket();
  const listener = (data: T) => {
    if (isRecoveringRoom() && event !== "roomClosed" && event !== "playerKicked") return;
    callback(data);
  };
  socket.on(event, listener);
  return () => { socket.off(event, listener); };
}

export function assertRoomActionsReady(): void {
  if (isRecoveringRoom()) throw new Error("Espera a que termine la recuperación de la partida.");
}
