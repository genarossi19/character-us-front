import type { Room, Player } from "@/types/game";
import { getSocket } from "../socket";

export const onRoomUpdated = (callback: (room: Room) => void): (() => void) => {
  const socket = getSocket();
  socket.on("roomUpdated", callback);
  return () => socket.off("roomUpdated", callback);
};

export const onPlayerJoined = (
  callback: (player: Player) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("playerJoined", callback);
  return () => socket.off("playerJoined", callback);
};

export const onPlayerLeft = (
  callback: (playerId: string) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("playerLeft", callback);
  return () => socket.off("playerLeft", callback);
};

export const onPlayerKicked = (
  callback: (playerId: string) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("playerKicked", callback);
  return () => socket.off("playerKicked", callback);
};

export const onRoomClosed = (
  callback: (data: { reason: string }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("roomClosed", callback);
  return () => socket.off("roomClosed", callback);
};
