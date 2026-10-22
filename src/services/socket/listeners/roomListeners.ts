import type {
  Player,
  Room,
  RoomClosedEvent,
  RoomInactivityRenewedEvent,
  RoomInactivityWarningEvent,
} from "@/types/game";
import { onServerEvent } from "../eventDelivery";

export const onRoomUpdated = (callback: (room: Room) => void): (() => void) => {
  return onServerEvent("roomUpdated", callback);
};

export const onPlayerJoined = (
  callback: (player: Player) => void
): (() => void) => {
  return onServerEvent("playerJoined", callback);
};

export const onPlayerLeft = (
  callback: (playerId: string) => void
): (() => void) => {
  return onServerEvent("playerLeft", callback);
};

export const onPlayerKicked = (
  callback: (playerId: string) => void
): (() => void) => {
  return onServerEvent("playerKicked", callback);
};

export const onRoomClosed = (
  callback: (data: RoomClosedEvent) => void
): (() => void) => {
  return onServerEvent("roomClosed", callback);
};

export const onRoomInactivityWarning = (
  callback: (data: RoomInactivityWarningEvent) => void
): (() => void) => {
  return onServerEvent("roomInactivityWarning", callback);
};

export const onRoomInactivityRenewed = (
  callback: (data: RoomInactivityRenewedEvent) => void
): (() => void) => {
  return onServerEvent("roomInactivityRenewed", callback);
};
