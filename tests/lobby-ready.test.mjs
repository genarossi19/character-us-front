import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { create } from "zustand";

function load(path, dependencies) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, Error, require(name) {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
function fixture() {
  const requests = [];
  let connected = true;
  const socket = { timeout: (ms) => ({ emit: (event, payload, callback) => requests.push({ ms, event, payload, callback }) }) };
  const emitters = load("src/services/socket/emitters/room.ts", {
    "../socket": { getSocket: () => socket }, "../eventDelivery": { assertRoomActionsReady() {} },
  });
  const { useRoomStore: store } = load("src/store/useRoomStore.ts", { zustand: { create } });
  const readStore = Object.assign(() => store.getState(), { getState: store.getState });
  const players = [{ socketId: "stable-guest", isGuest: true, isLobbyReady: false, avatarUrl: "/avatars/pirata.webp" }, { socketId: "host", isLobbyReady: false, avatarUrl: "/avatars/astronaut.webp" }];
  let sessionSaved = true;
  store.getState().setRoom({ id: "room", players });
  store.getState().setCurrentPlayer(players[0]);
  const { useSocketRoom } = load("src/hooks/useSocketRoom.ts", {
    react: { useCallback: (fn) => fn }, "react-router": { useNavigate: () => () => {} },
    "@/store/useRoomStore": { useRoomStore: readStore },
    "@/store/useGameStore": { useGameStore: () => ({ resetGame() {} }) },
    "@/store/useRoomSessionStore": { useRoomSessionStore: { getState: () => ({ clearSession() { sessionSaved = false; } }) } },
    "@/store/useUserStore": { useUserStore: { getState: () => ({ isLoggedIn: false }) } },
    "@/constants/avatars": { AVATAR_OPTIONS: [{ id: "avatar-1", url: "/avatars/astronaut.webp" }, { id: "avatar-2", url: "/avatars/pirata.webp" }, { id: "avatar-3", url: "/avatars/detective.webp" }] },
    "@/services/socket": { ...emitters, isSocketConnected: () => connected },
  });
  return { actions: useSocketRoom(), requests, store, hasSession: () => sessionSaved, disconnect: () => { connected = false; } };
}
test("lobby readiness waits for roomUpdated instead of claiming success optimistically", async () => {
  const f = fixture();
  const pending = f.actions.lobbyReady("room");
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].event, "lobbyReady");
  assert.equal(f.requests[0].payload.roomId, "room");
  assert.equal(f.store.getState().currentPlayer.isLobbyReady, false);
  f.requests[0].callback(null, { success: true });
  await pending;
  assert.equal(f.store.getState().currentPlayer.isLobbyReady, false);
  f.store.getState().setRoom({ id: "room", players: [{ socketId: "stable-guest", isLobbyReady: true }, { socketId: "host", isLobbyReady: false }] });
  assert.equal(f.store.getState().currentPlayer.isLobbyReady, true);
  assert.equal(f.store.getState().players[1].isLobbyReady, false);
});
test("readiness rejects server errors, offline requests and timeouts, and permits retry", async () => {
  const f = fixture();
  const rejected = f.actions.lobbyReady("room");
  f.requests[0].callback(null, { success: false, code: "ROOM_NOT_WAITING", message: "La partida ya comenzó" });
  await assert.rejects(rejected, (error) => error.code === "ROOM_NOT_WAITING");
  const timeout = f.actions.lobbyReady("room");
  assert.equal(f.requests[1].ms, 10000);
  f.requests[1].callback(new Error("timeout"));
  await assert.rejects(timeout, (error) => error.code === "ACK_TIMEOUT");
  const retry = f.actions.lobbyReady("room");
  f.requests[2].callback(null, { success: true });
  await retry;
  f.disconnect();
  await assert.rejects(f.actions.lobbyReady("room"), /No hay conexión/);
  assert.equal(f.requests.length, 3);
  assert.equal(f.store.getState().currentPlayer.isLobbyReady, false);
});
test("start propagates server readiness rejection and can retry after timeout", async () => {
  const f = fixture();
  const rejected = f.actions.startGame("room");
  f.requests[0].callback(null, { success: false, code: "NOT_ALL_READY", message: "Todos deben estar listos" });
  await assert.rejects(rejected, (error) => error.code === "NOT_ALL_READY");
  const timeout = f.actions.startGame("room");
  f.requests[1].callback(new Error("timeout"));
  await assert.rejects(timeout, (error) => error.code === "ACK_TIMEOUT");
  const retry = f.actions.startGame("room");
  const room = { id: "room", status: "playing" };
  f.requests[2].callback(null, { success: true, data: { room } });
  assert.equal(await retry, room);
});

test("kick waits for server confirmation, propagates rejection/timeout and never removes locally", async () => {
  const f = fixture();
  const rejected = f.actions.kickPlayer("room", "host");
  assert.equal(f.requests[0].event, "kickPlayer");
  assert.deepEqual(JSON.parse(JSON.stringify(f.requests[0].payload)), { roomId: "room", targetId: "host" });
  assert.equal(f.requests[0].ms, 10000);
  f.requests[0].callback(null, { success: false, code: "NOT_HOST", message: "Solo el anfitrión" });
  await assert.rejects(rejected, (error) => error.code === "NOT_HOST");
  const timeout = f.actions.kickPlayer("room", "host");
  f.requests[1].callback(new Error("timeout"));
  await assert.rejects(timeout, (error) => error.code === "ACK_TIMEOUT");
  const retry = f.actions.kickPlayer("room", "host");
  f.requests[2].callback(null, { success: true });
  await retry;
  assert.equal(f.store.getState().players.length, 2, "Only room/player events remove participants");
  f.disconnect();
  await assert.rejects(f.actions.kickPlayer("room", "host"), /No hay conexión/);
  assert.equal(f.requests.length, 3);
});

test("guest avatar sends canonical ID, rejects occupied/invalid choices and waits for roomUpdated", async () => {
  const f = fixture();
  await assert.rejects(f.actions.changeAvatar("room", "/avatars/astronaut.webp"), /ya está en uso/);
  await assert.rejects(f.actions.changeAvatar("room", "/invalid.webp"), /no válido/);
  assert.equal(f.requests.length, 0);
  const rejected = f.actions.changeAvatar("room", "/avatars/detective.webp");
  assert.equal(f.requests[0].event, "changeAvatar");
  assert.deepEqual(JSON.parse(JSON.stringify(f.requests[0].payload)), { roomId: "room", avatarId: "avatar-3" });
  f.requests[0].callback(null, { success: false, code: "AVATAR_TAKEN", message: "Ocupado" });
  await assert.rejects(rejected, (error) => error.code === "AVATAR_TAKEN");
  const timeout = f.actions.changeAvatar("room", "/avatars/detective.webp");
  f.requests[1].callback(new Error("timeout"));
  await assert.rejects(timeout, (error) => error.code === "ACK_TIMEOUT");
  const retry = f.actions.changeAvatar("room", "/avatars/detective.webp");
  f.requests[2].callback(null, { success: true });
  await retry;
  assert.equal(f.store.getState().currentPlayer.avatarUrl, "/avatars/pirata.webp");
  f.store.getState().setRoom({ id: "room", players: f.store.getState().players.map((player) => player.socketId === "stable-guest" ? { ...player, avatarUrl: "/avatars/detective.webp" } : player) });
  assert.equal(f.store.getState().currentPlayer.avatarUrl, "/avatars/detective.webp");
});

test("leave retains room and recovery on timeout, clears them only after successful retry", async () => {
  const f = fixture();
  const pending = f.actions.leaveRoom("room");
  assert.equal(f.requests[0].event, "leaveRoom");
  assert.equal(f.requests[0].ms, 10000);
  f.requests[0].callback(new Error("timeout"));
  await assert.rejects(pending, /no confirmó la salida/);
  assert.ok(f.hasSession());
  assert.equal(f.store.getState().room.id, "room");
  const retry = f.actions.leaveRoom("room");
  f.requests[1].callback(null, { success: true });
  await retry;
  assert.equal(f.hasSession(), false);
  assert.equal(f.store.getState().room, null);
});
