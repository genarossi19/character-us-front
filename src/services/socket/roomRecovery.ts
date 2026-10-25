import { getSocket } from "./socket";
import { useRoomSessionStore } from "@/store/useRoomSessionStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useGameStore } from "@/store/useGameStore";
import { useUserStore } from "@/store/useUserStore";
import type { AckResponse, RoomSnapshot } from "@/types/game";

export function createRoomRecovery(navigate: (path: string) => void, notifyExpired: (message: string) => void = () => {}) {
  const socket = getSocket();
  let generation = 0;
  let inFlight = false;
  let disposed = false;

  const recover = () => {
    const session = useRoomSessionStore.getState().session;
    if (!session || inFlight || disposed) return;
    if (!socket.connected) {
      useRoomSessionStore.setState({ status: "connecting", error: null });
      socket.connect();
      return;
    }
    const attempt = ++generation;
    inFlight = true;
    useRoomSessionStore.setState({ status: "recovering", error: null });
    let checkingCurrentRoom = false;
    const handleResponse = (error: Error | null, ack: AckResponse<RoomSnapshot>) => {
      if (disposed || attempt !== generation || useRoomSessionStore.getState().session !== session) return;
      inFlight = false;
      if (error) {
        useRoomSessionStore.setState({ status: "error", error: "No se pudo confirmar la recuperación. Puedes reintentar." });
        return;
      }
      if (!ack.success) {
        if (ack.code === "ALREADY_IN_ROOM" && !checkingCurrentRoom) {
          // Only accept the existing connection if the private snapshot matches
          // BOTH saved room and player. Never replace another session silently.
          checkingCurrentRoom = true;
          inFlight = true;
          socket.timeout(5_000).emit("getGameState", { roomId: session.roomId }, handleResponse);
          return;
        }
        if (ack.code === "ROOM_NOT_FOUND" || ack.code === "INVALID_SESSION") {
          useRoomStore.getState().reset();
          useGameStore.getState().resetGame();
          navigate(useUserStore.getState().isLoggedIn ? "/menu" : "/join");
          useRoomSessionStore.getState().clearSession();
          notifyExpired(ack.message);
        } else {
          useRoomSessionStore.setState({ status: "error", error: ack.message });
        }
        return;
      }
      const snapshot = ack.data;
      const player = snapshot?.room.players.find((candidate) => candidate.socketId === snapshot.playerId);
      if (!snapshot || !player || snapshot.room.id !== session.roomId || snapshot.playerId !== session.playerId) {
        useRoomSessionStore.setState({ status: "error", error: "No se pudo validar el estado recuperado. Intenta nuevamente." });
        return;
      }
      const players = snapshot.room.players.map((candidate) => ({
        ...candidate,
        hasVoted: candidate.socketId === snapshot.playerId ? snapshot.hasVoted : snapshot.voterIds.includes(candidate.socketId),
        isDebateReady: candidate.socketId === snapshot.playerId ? snapshot.isDebateReady : snapshot.readyPlayerIds.includes(candidate.socketId),
      }));
      // No live packets run until this synchronous ack handler finishes. Keep
      // the route gate closed until BOTH stores and the destination are ready.
      useGameStore.getState().hydrateSnapshot(snapshot);
      useRoomStore.setState({
        room: { ...snapshot.room, players },
        players,
        currentPlayer: players.find((candidate) => candidate.socketId === snapshot.playerId)!,
      });
      navigate(snapshot.room.status === "playing" ? "/game" : "/lobby");
      useRoomSessionStore.setState({ status: "idle", error: null });
    };
    socket.timeout(5_000).emit("resumeRoom", {
      roomId: session.roomId,
      resumeToken: session.resumeToken,
    }, handleResponse);
  };

  const onDisconnect = (reason: string) => {
    generation++;
    inFlight = false;
    if (!useRoomSessionStore.getState().session) return;
    useRoomSessionStore.setState({
      status: reason === "io server disconnect" ? "error" : "connecting",
      error: reason === "io server disconnect" ? "El servidor cerró esta conexión. Puedes intentar recuperar tu partida." : null,
    });
  };
  const onConnectError = () => {
    if (useRoomSessionStore.getState().session) {
      useRoomSessionStore.setState({ status: "error", error: "No hay conexión con el servidor. Seguimos intentando reconectar." });
    }
  };
  socket.on("connect", recover);
  socket.on("disconnect", onDisconnect);
  socket.on("connect_error", onConnectError);
  if (socket.connected) recover();

  return {
    recover,
    dispose: () => {
      disposed = true;
      generation++;
      socket.off("connect", recover);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    },
  };
}
