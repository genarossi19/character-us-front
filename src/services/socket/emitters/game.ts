import type {
  SubmitWordPayload,
  VotePayload,
  SendChatPayload,
  AckCallback,
} from "@/types/game";
import { getSocket } from "../socket";

export const emitSubmitWord = (
  payload: SubmitWordPayload,
  callback?: AckCallback<void>
): void => {
  const socket = getSocket();
  socket.emit("submitWord", payload, callback);
};

export const emitVotePlayer = (
  payload: VotePayload,
  callback?: AckCallback<void>
): void => {
  const socket = getSocket();
  socket.emit("votePlayer", payload, callback);
};

export const emitSendChatMessage = (
  payload: SendChatPayload,
  callback?: AckCallback<void>
): void => {
  const socket = getSocket();
  socket.emit("sendChatMessage", payload, callback);
};
