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
  const players = [{ socketId: "stable-guest", isLobbyReady: false }, { socketId: "host", isLobbyReady: false }];
  store.getState().setRoom({ id: "room", players });
  store.getState().setCurrentPlayer(players[0]);
  const { useSocketRoom } = load("src/hooks/useSocketRoom.ts", {
    react: { useCallback: (fn) => fn }, "react-router": { useNavigate: () => () => {} },
    "@/store/useRoomStore": { useRoomStore: readStore },
    "@/store/useGameStore": { useGameStore: () => ({ resetGame() {} }) },
    "@/store/useRoomSessionStore": {}, "@/store/useUserStore": {}, "@/constants/avatars": {},
    "@/services/socket": { ...emitters, isSocketConnected: () => connected },
  });
  return { actions: useSocketRoom(), requests, store, disconnect: () => { connected = false; } };
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
