import type {
  CreateRoomPayload,
  JoinRoomPayload,
  RoomResponse,
  KickPlayerPayload,
  DebateReadyPayload,
  ChangeAvatarPayload,
  RenewRoomInactivityPayload,
  RenewRoomInactivityResponse,
  AckCallback,
} from "@/types/game";
import { getSocket } from "../socket";
import { assertRoomActionsReady } from "../eventDelivery";

export const emitCreateRoom = (
  payload: CreateRoomPayload,
  callback?: AckCallback<RoomResponse>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("createRoom", payload, callback);
};

export const emitJoinRoom = (
  payload: JoinRoomPayload,
  callback?: AckCallback<RoomResponse>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("joinRoom", payload, callback);
};

export const emitLeaveRoom = (
  roomId: string,
  callback?: AckCallback<void>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("leaveRoom", { roomId }, callback);
};

export const emitStartGame = (
  roomId: string,
  callback?: AckCallback<RoomResponse>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("startGame", { roomId }, callback);
};

export const emitKickPlayer = (
  payload: KickPlayerPayload,
  callback?: AckCallback<void>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("kickPlayer", payload, callback);
};

export const emitDebateReady = (
  payload: DebateReadyPayload,
  callback?: AckCallback
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("debateReady", payload, callback);
};

export const emitChangeAvatar = (
  payload: ChangeAvatarPayload,
  callback?: AckCallback
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.timeout(10_000).emit("changeAvatar", payload, (error: Error | null, response: Parameters<AckCallback>[0]) => {
    if (error) {
      callback?.({
        success: false,
        code: "ACK_TIMEOUT",
        message: "El servidor no confirmó el cambio de avatar. Intenta nuevamente.",
      });
      return;
    }
    callback?.(response);
  });
};

export const emitRenewRoomInactivity = (
  payload: RenewRoomInactivityPayload,
  callback?: AckCallback<RenewRoomInactivityResponse>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("renewRoomInactivity", payload, callback);
};
