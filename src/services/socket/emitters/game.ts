import type {
  SubmitWordPayload,
  VotePayload,
  SendChatPayload,
  AckCallback,
} from "@/types/game";
import { getSocket } from "../socket";
import { assertRoomActionsReady } from "../eventDelivery";

export const emitSubmitWord = (
  payload: SubmitWordPayload,
  callback?: AckCallback<void>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.timeout(5_000).emit("submitWord", payload, (error: Error | null, response: Parameters<AckCallback>[0]) => {
    if (error) {
      callback?.({
        success: false,
        code: "ACK_TIMEOUT",
        message: "No se pudo confirmar el envío. Revisá el estado de la partida.",
      });
      return;
    }
    callback?.(response);
  });
};

export const emitVotePlayer = (
  payload: VotePayload,
  callback?: AckCallback<void>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("votePlayer", payload, callback);
};

export const emitSendChatMessage = (
  payload: SendChatPayload,
  callback?: AckCallback<void>
): void => {
  assertRoomActionsReady();
  const socket = getSocket();
  socket.emit("sendChatMessage", payload, callback);
};
