// Socket connection
export { getSocket, disconnectSocket, isSocketConnected } from "./socket";

// Room emitters
export {
  emitCreateRoom,
  emitJoinRoom,
  emitLeaveRoom,
  emitStartGame,
  emitKickPlayer,
  emitDebateReady,
  emitChangeAvatar,
} from "./emitters/room";

// Game emitters
export {
  emitSubmitWord,
  emitVotePlayer,
  emitSendChatMessage,
} from "./emitters/game";

// Room listeners
export {
  onRoomUpdated,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerKicked,
  onRoomClosed,
} from "./listeners/roomListeners";

// Game listeners
export {
  onCharacterAssigned,
  onPhaseChanged,
  onTurnChanged,
  onWordHintRevealed,
  onAllWordsSubmitted,
  onVoteUpdate,
  onPlayerEliminated,
  onRoundResults,
  onGameEnded,
  onChatMessage,
  onGameStarted,
  onDebateReadyUpdate,
  onReconnectTimeout,
} from "./listeners/gameListeners";
