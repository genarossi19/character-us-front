import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { create } from "zustand";
import * as jsxRuntime from "react/jsx-runtime";

const key = "characterus.room-session";
const credential = { roomId: "room-1", playerId: "stable-player", resumeToken: "a".repeat(64) };

function load(path, deps, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, Error, Date,
    require: (name) => { assert.ok(name in deps, `Unexpected import: ${name}`); return deps[name]; },
    ...globals,
  });
  return exports;
}

function snapshot(phase = "word", status = "playing") {
  const player = { socketId: credential.playerId, username: "Invitado", isGuest: true,
    userId: null, avatarUrl: "/avatars/pirata.webp", isAlive: true, isOnline: true,
    isHost: true, hasVoted: true, isDebateReady: true };
  return {
    serverTime: Date.now() + 10_000,
    room: { id: credential.roomId, hostId: credential.playerId, players: [player],
      status, gamePhase: phase, currentRound: 3, settings: { totalRounds: 5, visibleVotes: false } },
    playerId: credential.playerId,
    phaseExpiresAt: Date.now() + 30_000,
    turnExpiresAt: Date.now() + 45_000,
    currentTurnPlayerId: credential.playerId, turnIndex: 1, totalTurns: 3,
    wordHints: [{ playerId: credential.playerId, username: "Invitado", word: "Luna", skipped: false, revealed: true }],
    characterAssignment: { character: null, isImpostor: true, impostorIds: [credential.playerId] },
    hasSubmittedWord: true, hasVoted: true, votedFor: "other-player", isDebateReady: true,
    votes: {}, voterIds: [credential.playerId], readyPlayerIds: [credential.playerId],
    chatMessages: [{ id: "message-1", message: "Hola", type: "player" }],
    roundResults: [{ round: 2, eliminatedPlayer: null, wasImpostor: false }],
  };
}

function fixture(saved = credential) {
  const storage = new Map(saved ? [[key, JSON.stringify(saved)]] : []);
  const sessionStorage = {
    getItem: (name) => storage.get(name) ?? null,
    setItem: (name, value) => storage.set(name, value),
    removeItem: (name) => storage.delete(name),
  };
  const sessionModule = load("src/store/useRoomSessionStore.ts", { zustand: { create } }, { sessionStorage });
  const session = sessionModule.useRoomSessionStore;
  const game = load("src/store/useGameStore.ts", { zustand: { create } }).useGameStore;
  const room = load("src/store/useRoomStore.ts", { zustand: { create } }).useRoomStore;
  const callbacks = new Map();
  const requests = [];
  const paths = [];
  const messages = [];
  const socket = {
    id: "different-transport-id", connected: true,
    on(name, fn) {
      const set = callbacks.get(name) ?? new Set(); set.add(fn); callbacks.set(name, set);
    },
    off(name, fn) { assert.ok(callbacks.get(name)?.delete(fn), `Listener cleanup: ${name}`); },
    connect() { this.connected = true; this.fire("connect"); },
    fire(name, data) { for (const fn of callbacks.get(name) ?? []) fn(data); },
    emit(event, payload, respond) { requests.push({ event, payload, respond }); },
    timeout(ms) { return { emit: (event, payload, respond) => requests.push({ event, payload, respond, ms }) }; },
  };
  const socketModule = { getSocket: () => socket, isSocketConnected: () => socket.connected };
  const delivery = load("src/services/socket/eventDelivery.ts", {
    "./socket": socketModule, "@/store/useRoomSessionStore": sessionModule,
  });
  const listeners = {
    ...load("src/services/socket/listeners/gameListeners.ts", { "../eventDelivery": delivery }),
    ...load("src/services/socket/listeners/roomListeners.ts", { "../eventDelivery": delivery }),
  };
  const emitters = load("src/services/socket/emitters/room.ts", { "../socket": socketModule, "../eventDelivery": delivery });
  const stores = {
    "@/store/useRoomStore": { useRoomStore: Object.assign(() => room.getState(), room) },
    "@/store/useGameStore": { useGameStore: Object.assign(() => game.getState(), game) },
    "@/store/useRoomSessionStore": sessionModule,
  };
  const navigate = (path) => paths.push(path);
  let cleanupRoom;
  const { useSocketRoomEvents } = load("src/hooks/useSocketRoomEvents.ts", {
    ...stores, react: { useEffect: (setup) => { const cleanup = setup(); if (cleanup) cleanupRoom = cleanup; }, useRef: (value) => ({ current: value }) },
    "react-router": { useNavigate: () => navigate }, sonner: { toast: { error: (message) => messages.push(message) } },
    "@/services/socket": listeners,
  });
  useSocketRoomEvents();
  const { createRoomRecovery } = load("src/services/socket/roomRecovery.ts", { ...stores, "./socket": socketModule });
  const actions = load("src/hooks/useSocketRoom.ts", {
    ...stores, react: { useCallback: (fn) => fn }, "react-router": { useNavigate: () => navigate },
    "@/services/socket": { ...socketModule, ...emitters },
    "@/constants/avatars": { AVATAR_OPTIONS: [] },
  });
  let controller;
  return {
    session, storage, game, room, socket, requests, paths, messages, delivery, callbacks,
    actions: () => actions.useSocketRoom(),
    start: () => { controller = createRoomRecovery(navigate, (message) => messages.push(message)); return controller; },
    stop: () => { controller?.dispose(); cleanupRoom(); },
    ack: (data = snapshot(), index = requests.length - 1) => requests[index].respond(null, { success: true, data }),
  };
}

test("same room survives a win, lobby return and host restart; only restart clears the result", () => {
  const f = fixture();
  f.start();
  f.ack(snapshot());
  const result = { winner: "innocent", players: [...f.room.getState().players], rounds: [], impostorIds: [credential.playerId] };
  f.game.setState({ finalResult: result, winner: "innocent", phase: "finished" });
  const lobby = { ...f.room.getState().room, code: 123456, status: "waiting", gamePhase: "waiting", currentRound: 0 };
  f.socket.fire("roomUpdated", lobby);
  assert.equal(f.game.getState().finalResult, result);
  assert.equal(f.game.getState().phase, "finished");
  assert.equal(f.session.getState().session.resumeToken, credential.resumeToken);
  assert.equal(f.room.getState().room.code, 123456);

  const { default: GameEnd } = load("src/components/game/GameEnd.tsx", {
    "react/jsx-runtime": jsxRuntime, "motion/react": { motion: { section: "section" } },
    "lucide-react": { ArrowRight: "svg", ShieldAlert: "svg", Trophy: "svg" },
    "@/store/useGameStore": { useGameStore: () => f.game.getState() },
    "@/store/useRoomStore": { useRoomStore: () => f.room.getState() },
    "react-router": { useNavigate: () => (path) => f.paths.push(path) },
    "@/components/ui/button": { Button: "button" },
  });
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    return node?.props ? [node, ...nodes(node.props.children)] : [];
  }
  nodes(GameEnd()).find((node) => node.type === "button").props.onClick();
  assert.equal(f.paths.at(-1), "/lobby");
  assert.equal(f.game.getState().finalResult, result);
  assert.equal(f.requests.length, 1, "returning never emits leaveRoom or disconnects");
  assert.equal(f.socket.connected, true);
  const nextRoom = { ...lobby, currentRound: 1, status: "playing", gamePhase: "character" };
  f.socket.fire("gameStarted", { room: nextRoom, totalRounds: 5 });
  assert.equal(f.paths.at(-1), "/game");
  assert.equal(f.game.getState().finalResult, null);
  assert.equal(f.game.getState().character, null);
  assert.equal(f.game.getState().isImpostor, false);
  assert.equal(f.game.getState().currentRound, 1);
  assert.equal(f.game.getState().roundResults.length, 0);
  assert.equal(f.game.getState().chatMessages.length, 0);
  assert.equal(f.room.getState().room.code, 123456);
  assert.equal(f.session.getState().session.resumeToken, credential.resumeToken);
  f.stop();
});

test("roomUpdated controls round and eliminated status; waiting without a result returns to lobby", () => {
  const f = fixture();
  f.start(); f.ack(snapshot());
  const room = { ...f.room.getState().room, currentRound: 8,
    players: f.room.getState().players.map((p) => ({ ...p, isAlive: false })) };
  f.socket.fire("roomUpdated", room);
  assert.equal(f.game.getState().currentRound, 8);
  assert.equal(f.room.getState().currentPlayer.isAlive, false);
  f.socket.fire("roomUpdated", { ...room, status: "waiting", gamePhase: "waiting" });
  assert.equal(f.paths.at(-1), "/lobby");
  assert.equal(f.session.getState().session.resumeToken, credential.resumeToken);
  f.stop();
});

test("refresh restores guest identity, private game state and deadlines before opening routes", () => {
  const f = fixture();
  assert.equal(f.session.getState().status, "connecting");
  f.start();
  assert.equal(f.requests[0].event, "resumeRoom");
  assert.equal(f.requests[0].payload.resumeToken, credential.resumeToken);
  assert.equal(f.requests[0].ms, 5000);
  assert.equal(f.session.getState().status, "recovering");
  f.session.subscribe((state) => {
    if (state.status !== "idle") return;
    assert.equal(f.room.getState().currentPlayer.socketId, credential.playerId);
    assert.equal(f.game.getState().currentRound, 3);
    assert.equal(f.paths.at(-1), "/game");
  });
  const data = snapshot();
  f.ack(data);
  assert.notEqual(f.room.getState().currentPlayer.socketId, f.socket.id);
  assert.equal(f.game.getState().character, null);
  assert.equal(f.game.getState().isImpostor, true);
  assert.equal(f.game.getState().wordHints[0].word, "Luna");
  assert.equal(f.game.getState().hasSubmittedWord, true);
  assert.equal(f.game.getState().hasVoted, true);
  assert.equal(f.game.getState().votedFor, "other-player");
  assert.equal(Object.keys(f.game.getState().votes).length, 0);
  assert.equal(f.room.getState().currentPlayer.isDebateReady, true);
  assert.equal(f.game.getState().chatMessages.length, 1);
  assert.equal(f.game.getState().turnExpiresAt, data.turnExpiresAt);
  assert.ok(Math.abs(f.game.getState().serverClockOffset - 10_000) < 500);
  assert.ok(f.storage.has(key));
  f.stop();
});

test("lobby resumes without join/start, timeout retains credential and retry is idempotent", () => {
  const f = fixture(); const controller = f.start();
  f.requests[0].respond(new Error("timeout"));
  assert.equal(f.session.getState().status, "error");
  assert.ok(f.storage.has(key));
  controller.recover(); controller.recover();
  assert.equal(f.requests.length, 2);
  f.ack(snapshot("waiting", "waiting"));
  assert.equal(f.paths.at(-1), "/lobby");
  assert.ok(f.requests.every((request) => request.event === "resumeRoom"));
  f.stop();
});

test("registered player restores the private character and the turn that advanced during refresh", () => {
  const f = fixture(); f.start();
  const data = snapshot();
  data.room.players[0].isGuest = false;
  data.room.players[0].userId = "db-user";
  data.characterAssignment = { character: { id: "character-1", name: "Detective" }, isImpostor: false };
  data.currentTurnPlayerId = "next-stable-player";
  data.hasSubmittedWord = false;
  f.ack(data);
  assert.equal(f.room.getState().currentPlayer.userId, "db-user");
  assert.equal(f.room.getState().currentPlayer.isHost, true);
  assert.equal(f.game.getState().character.name, "Detective");
  assert.equal(f.game.getState().currentTurnPlayerId, "next-stable-player");
  assert.equal(f.game.getState().hasSubmittedWord, false);
  f.stop();
});

test("hidden vote is restored privately and the voting UI cannot submit again", () => {
  const f = fixture(); f.start(); const data = snapshot("voting");
  data.room.players.push({ ...data.room.players[0], socketId: "other-player", username: "Host", hasVoted: false });
  f.ack(data);
  let submissions = 0;
  const { default: VotingPhase } = load("src/components/game/VotingPhase.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: (value) => [value, () => {}] },
    "motion/react": { motion: { div: "div" } },
    "@/store/useGameStore": { useGameStore: () => f.game.getState() },
    "@/store/useRoomStore": { useRoomStore: (select) => select ? select(f.room.getState()) : f.room.getState() },
    "@/hooks/useSocketGame": { useSocketGame: () => ({ votePlayer: () => submissions++ }) },
    "@/components/ui/button": { Button: "button" },
    "lucide-react": { Check: "svg", CheckCircle2: "svg", Vote: "svg" },
    "./ClueBoard": { default: "clue-board" },
  });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) node.forEach(visit);
    else if (node?.props) { nodes.push(node); visit(node.props.children); }
    else if (typeof node === "string") nodes.push(node);
  }
  visit(VotingPhase());
  assert.ok(nodes.includes("Voto enviado. Esperando el resultado."));
  assert.equal(nodes.some((node) => node.type === "button" && !node.props.disabled), false);
  assert.ok(nodes.some((node) => node.type === "button" && node.props["aria-pressed"]));
  nodes.filter((node) => node.props?.onClick).forEach((node) => node.props.onClick());
  assert.equal(submissions, 0);
  assert.equal(Object.keys(f.game.getState().votes).length, 0);
  f.stop();
});

test("expired session or missing room clears recovery and goes to join", () => {
  for (const code of ["INVALID_SESSION", "ROOM_NOT_FOUND"]) {
    const f = fixture(); f.start();
    f.requests[0].respond(null, { success: false, code, message: "Sesión vencida" });
    assert.equal(f.storage.has(key), false);
    assert.equal(f.session.getState().session, null);
    assert.equal(f.room.getState().room, null);
    assert.equal(f.paths.at(-1), "/join");
    assert.equal(f.messages.at(-1), "Sesión vencida"); f.stop();
  }
});

test("live packets preceding snapshot are discarded and later packets keep their order", () => {
  const f = fixture();
  const off = f.delivery.onServerEvent("wordHintRevealed", (data) => f.game.getState().addWordHint(data));
  f.start();
  f.socket.fire("wordHintRevealed", { playerId: "old", word: "stale" });
  assert.equal(f.game.getState().wordHints.length, 0);
  assert.throws(() => f.delivery.assertRoomActionsReady(), /recuperación/);
  f.ack();
  f.socket.fire("wordHintRevealed", { playerId: "other", word: "after-1" });
  f.socket.fire("wordHintRevealed", { playerId: "other", word: "after-2" });
  assert.equal(f.game.getState().wordHints.length, 2);
  assert.equal(f.game.getState().wordHints[1].word, "after-2");
  off(); f.stop();
});

test("disconnect automatically resumes again; stale ack and disposed controller cannot hydrate", () => {
  const f = fixture(); f.start();
  f.socket.connected = false; f.socket.fire("disconnect", "transport close");
  f.ack();
  assert.equal(f.room.getState().room, null);
  f.socket.connected = true; f.socket.fire("connect");
  assert.equal(f.requests.length, 2); f.ack();
  assert.equal(f.room.getState().currentPlayer.socketId, credential.playerId);
  f.socket.fire("disconnect", "transport close"); f.socket.fire("connect");
  f.stop(); f.ack();
  assert.equal(f.session.getState().status, "recovering");
  assert.equal([...f.callbacks.values()].reduce((sum, set) => sum + set.size, 0), 0);
});

test("kick/roomClosed invalidate recovery even while ack is pending", () => {
  for (const [event, payload] of [["playerKicked", credential.playerId], ["roomClosed", { reason: "Sala cerrada" }]]) {
    const f = fixture(); f.start(); f.socket.fire(event, payload); f.ack();
    assert.equal(f.storage.has(key), false);
    assert.equal(f.session.getState().session, null);
    assert.equal(f.room.getState().room, null);
    assert.equal(f.paths.at(-1), "/join"); f.stop();
  }
});

test("already-bound connection may only hydrate the same saved player", () => {
  const f = fixture(); f.start();
  f.requests[0].respond(null, { success: false, code: "ALREADY_IN_ROOM", message: "Otra sala" });
  assert.equal(f.requests[1].event, "getGameState");
  f.ack({ ...snapshot(), playerId: "someone-else" });
  assert.equal(f.session.getState().status, "error");
  assert.equal(f.room.getState().room, null);
  assert.ok(f.storage.has(key)); f.stop();
});

test("create/join save session and identify by stable ID; only successful leave clears it", async () => {
  for (const action of ["createRoom", "joinRoom"]) {
    const f = fixture(null); f.start();
    assert.equal(f.requests.length, 0);
    const pending = f.actions()[action]({ username: "Invitado" });
    f.requests[0].respond({ success: true, data: { room: snapshot("waiting", "waiting").room, session: credential } });
    await pending;
    assert.equal(f.room.getState().currentPlayer.socketId, credential.playerId);
    assert.equal(JSON.parse(f.storage.get(key)).resumeToken, credential.resumeToken);
    const failedLeave = f.actions().leaveRoom(credential.roomId);
    f.requests[1].respond({ success: false, message: "Error" });
    await assert.rejects(failedLeave); assert.ok(f.storage.has(key));
    const leave = f.actions().leaveRoom(credential.roomId);
    f.requests[2].respond({ success: true }); await leave;
    assert.equal(f.storage.has(key), false); assert.equal(f.room.getState().room, null);
    f.stop();
  }
});
