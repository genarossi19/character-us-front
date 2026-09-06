import type {
  CreateRoomPayload,
  JoinRoomPayload,
  RoomResponse,
  KickPlayerPayload,
  AckCallback,
} from "@/types/game";
import { getSocket } from "../socket";

export const emitCreateRoom = (
  payload: CreateRoomPayload,
  callback?: AckCallback<RoomResponse>
): void => {
  const socket = getSocket();
  socket.emit("createRoom", payload, callback);
};

export const emitJoinRoom = (
  payload: JoinRoomPayload,
  callback?: AckCallback<RoomResponse>
): void => {
  const socket = getSocket();
  socket.emit("joinRoom", payload, callback);
};

export const emitLeaveRoom = (
  roomId: string,
  callback?: AckCallback<void>
): void => {
  const socket = getSocket();
  socket.emit("leaveRoom", { roomId }, callback);
};

export const emitStartGame = (
  roomId: string,
  callback?: AckCallback<void>
): void => {
  const socket = getSocket();
  socket.emit("startGame", { roomId }, callback);
};

export const emitKickPlayer = (
  payload: KickPlayerPayload,
  callback?: AckCallback<void>
): void => {
  const socket = getSocket();
  socket.emit("kickPlayer", payload, callback);
};
