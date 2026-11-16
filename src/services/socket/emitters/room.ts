import type {
  CreateRoomPayload,
  JoinRoomPayload,
  RoomResponse,
  KickPlayerPayload,
  DebateReadyPayload,
  ChangeAvatarPayload,
  LobbyReadyPayload,
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
  socket.timeout(10_000).emit("leaveRoom", { roomId }, (error: Error | null, response: Parameters<AckCallback>[0]) => {
    callback?.(error ? { success: false, code: "ACK_TIMEOUT", message: "El servidor no confirmó la salida. Intenta nuevamente." } : response);
  });
};

export const emitStartGame = (
  roomId: string,
  callback?: AckCallback<RoomResponse>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.timeout(10_000).emit("startGame", { roomId }, (error: Error | null, response: Parameters<AckCallback<RoomResponse>>[0]) => {
    callback?.(error ? { success: false, code: "ACK_TIMEOUT", message: "El servidor no confirmó el inicio. Intenta nuevamente." } : response);
  });
};

export const emitLobbyReady = (payload: LobbyReadyPayload, callback?: AckCallback): void => {
  assertRoomActionsReady();
  getSocket().timeout(10_000).emit("lobbyReady", payload, (error: Error | null, response: Parameters<AckCallback>[0]) => {
    callback?.(error ? { success: false, code: "ACK_TIMEOUT", message: "El servidor no confirmó que estás listo. Intenta nuevamente." } : response);
  });
};

export const emitKickPlayer = (
  payload: KickPlayerPayload,
  callback?: AckCallback<void>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.timeout(10_000).emit("kickPlayer", payload, (error: Error | null, response: Parameters<AckCallback>[0]) => {
    callback?.(error ? { success: false, code: "ACK_TIMEOUT", message: "El servidor no confirmó la expulsión. Intenta nuevamente." } : response);
  });
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
