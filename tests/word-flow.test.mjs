import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { create } from "zustand";
import * as jsxRuntime from "react/jsx-runtime";

// Exercise the real stores, listeners, emitters and component handlers without
// opening sockets or needing an authenticated backend/Supabase connection.
function loadSource(path, dependencies) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    Error,
    require(name) {
      assert.ok(name in dependencies, `Missing dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

function fixture(localId = "socket-guest") {
  const { useGameStore: game } = loadSource("src/store/useGameStore.ts", {
    zustand: { create },
  });
  const players = [
    { socketId: "socket-guest", userId: null, username: "Invitado", isAlive: true },
    { socketId: "socket-host", userId: "db-user", username: "Host", isAlive: true },
  ];
  const room = { id: "room-1", players };
  const roomState = { room, players, currentPlayer: players.find((p) => p.socketId === localId) };
  const roomStore = Object.assign((select) => select ? select(roomState) : roomState, {
    getState: () => roomState,
  });
  roomState.updatePlayer = (id, updates) => {
    roomState.players = roomState.players.map((player) => player.socketId === id ? { ...player, ...updates } : player);
    roomState.currentPlayer = roomState.players.find((player) => player.socketId === localId);
  };
  const callbacks = new Map();
  const requests = [];
  const socket = {
    on(event, callback) {
      assert.equal(callbacks.has(event), false, `Duplicate listener: ${event}`);
      callbacks.set(event, callback);
    },
    off(event, callback) {
      assert.equal(callbacks.get(event), callback, `Cleanup identity: ${event}`);
      callbacks.delete(event);
    },
    timeout(ms) {
      return {
        emit(event, payload, respond) {
          requests.push({ event, payload, respond, ms });
        },
      };
    },
  };
  const socketModule = { getSocket: () => socket };
  const delivery = loadSource("src/services/socket/eventDelivery.ts", {
    "./socket": socketModule,
    "@/store/useRoomSessionStore": { isRecoveringRoom: () => false },
  });
  const listeners = loadSource("src/services/socket/listeners/gameListeners.ts", {
    "../eventDelivery": delivery,
  });
  const emitters = loadSource("src/services/socket/emitters/game.ts", {
    "../socket": socketModule,
    "../eventDelivery": delivery,
  });
  let cleanup;
  const hooks = loadSource("src/hooks/useSocketGame.ts", {
    react: { useEffect: (setup) => { cleanup = setup(); }, useCallback: (fn) => fn },
    "@/store/useGameStore": { useGameStore: game },
    "@/store/useRoomStore": { useRoomStore: roomStore },
    "@/services/socket": { ...listeners, ...emitters, isSocketConnected: () => true },
  });
  return {
    game, hooks, requests, roomStore, callbacks,
    mount: () => hooks.useSocketGameEvents(),
    unmount: () => cleanup(),
    receive: (event, data) => callbacks.get(event)(data),
  };
}

test("clues publish immediately to guest and host, upsert by socket ID, then advance", () => {
  const clients = [fixture(), fixture("socket-host")];
  for (const client of clients) {
    client.mount();
    client.receive("phaseChanged", { phase: "word" });
    client.receive("turnChanged", { playerId: "socket-guest" });
    client.receive("wordHintRevealed", {
      playerId: "socket-guest", username: "Invitado", word: "Luna", skipped: false,
    });
    assert.equal(client.game.getState().wordHints[0].word, "Luna");
    assert.equal(client.game.getState().hasSubmittedWord, client === clients[0]);
    client.receive("wordHintRevealed", {
      playerId: "socket-guest", username: "Invitado", word: "Sol", skipped: false,
    });
    assert.equal(client.game.getState().wordHints.length, 1);
    assert.equal(client.game.getState().wordHints[0].word, "Sol");
    client.receive("turnChanged", { playerId: "socket-host" });
    assert.equal(client.game.getState().currentTurnPlayerId, "socket-host");
  }
});

test("skipped clue, last turn, debate preservation and new-round reset", () => {
  const client = fixture();
  client.mount();
  client.receive("phaseChanged", { phase: "word" });
  client.receive("turnChanged", { playerId: "socket-guest" });
  client.receive("wordHintRevealed", {
    playerId: "socket-guest", username: "Invitado", word: "Sin palabra", skipped: true,
  });
  assert.equal(client.game.getState().hasSubmittedWord, true);
  const hints = [...client.game.getState().wordHints, {
    playerId: "socket-host", username: "Host", word: "Espacio", skipped: false, revealed: true,
  }];
  client.receive("allWordsSubmitted", { hints });
  assert.equal(client.game.getState().wordHints.length, 2);
  assert.equal(client.game.getState().currentTurnPlayerId, null);
  client.receive("phaseChanged", { phase: "debate" });
  assert.equal(client.game.getState().wordHints.length, 2);
  client.receive("phaseChanged", { phase: "character" });
  assert.equal(client.game.getState().wordHints.length, 0);
  assert.equal(client.game.getState().hasSubmittedWord, false);
  client.receive("phaseChanged", { phase: "word" });
  client.receive("turnChanged", { playerId: "socket-host" });
  client.receive("phaseChanged", { phase: "voting" });
  assert.equal(client.game.getState().currentTurnPlayerId, null);
});

test("submit waits for ack, trims input, propagates rejection and times out at 5s", async () => {
  const client = fixture();
  client.game.getState().setPhase("word");
  client.game.getState().setCurrentTurnPlayer("socket-guest");
  const { submitWord } = client.hooks.useSocketGame();
  const accepted = submitWord(" Luna ");
  assert.equal(client.requests[0].payload.word, "Luna");
  assert.equal(client.requests[0].ms, 5000);
  assert.equal(client.game.getState().hasSubmittedWord, false);
  client.requests[0].respond(null, { success: true });
  await accepted;
  assert.equal(client.game.getState().hasSubmittedWord, true);
  client.game.getState().setHasSubmittedWord(false);
  const rejected = submitWord("Sol");
  client.requests[1].respond(null, { success: false, code: "INVALID_TURN", message: "No es tu turno" });
  await assert.rejects(rejected, (error) => error.code === "INVALID_TURN");
  assert.equal(client.game.getState().hasSubmittedWord, false);
  const timedOut = submitWord("Sol");
  client.requests[2].respond(new Error("timeout"));
  await assert.rejects(timedOut, /No se pudo confirmar/);
  await assert.rejects(submitWord(" "), /entre 1 y 20/);
  await assert.rejects(submitWord("x".repeat(21)), /entre 1 y 20/);
  assert.equal(client.requests.length, 3);
});

test("StrictMode setup/cleanup removes the exact callbacks before remounting", () => {
  const client = fixture();
  client.mount();
  const count = client.callbacks.size;
  assert.ok(count > 0);
  client.unmount();
  assert.equal(client.callbacks.size, 0);
  client.mount();
  assert.equal(client.callbacks.size, count);
  client.unmount();
});

function componentHarness(client) {
  const slots = [];
  let cursor;
  const state = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (value) => { slots[index] = value; }];
  };
  const { default: ClueBoard } = loadSource("src/components/game/ClueBoard.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": { Check: "svg", Clock3: "svg", MessageSquareText: "svg", PencilLine: "svg", UserRoundX: "svg" },
    "@/store/useGameStore": { useGameStore: () => client.game.getState() },
    "@/store/useRoomStore": { useRoomStore: client.roomStore },
  });
  const { default: WordSubmission } = loadSource("src/components/game/WordSubmission.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: state, useRef: (value) => state({ current: value })[0], useCallback: (fn) => fn },
    "motion/react": { motion: { div: "div" } },
    "@/store/useGameStore": { useGameStore: () => client.game.getState() },
    "@/store/useRoomStore": { useRoomStore: client.roomStore },
    "@/hooks/useSocketGame": { useSocketGame: client.hooks.useSocketGame },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "lucide-react": { CheckCircle2: "svg", Clock3: "svg", Send: "svg" },
    "./ClueBoard": { default: ClueBoard },
  });
  function flatten(node) {
    if (Array.isArray(node)) return node.flatMap(flatten);
    if (typeof node?.type === "function") return flatten(node.type(node.props));
    if (node?.props) return [node, ...flatten(node.props.children)];
    return node == null ? [] : [node];
  }
  return () => { cursor = 0; return flatten(WordSubmission()); };
}

test("UI retains rejected input, prevents duplicate sends and shows public clues during word", async () => {
  const client = fixture();
  client.mount();
  client.receive("phaseChanged", { phase: "word" });
  client.receive("turnChanged", { playerId: "socket-guest" });
  const render = componentHarness(client);
  let elements = render();
  elements.find((node) => node.type === "input").props.onChange({ target: { value: "Luna" } });
  elements = render();
  const send = elements.find((node) => node.type === "button").props.onClick;
  const pending = send();
  await send();
  assert.equal(client.requests.length, 1);
  assert.equal(render().find((node) => node.type === "input").props.disabled, true);
  client.requests[0].respond(null, { success: false, code: "INVALID_TURN", message: "No es tu turno" });
  await pending;
  elements = render();
  assert.equal(elements.find((node) => node.type === "input").props.value, "Luna");
  assert.equal(elements.find((node) => node.props?.role === "alert").props.children, "No es tu turno");
  const success = elements.find((node) => node.type === "button").props.onClick();
  client.requests[1].respond(null, { success: true });
  await success;
  client.receive("wordHintRevealed", {
    playerId: "socket-guest", username: "Invitado", word: "Luna", skipped: false,
  });
  client.receive("turnChanged", { playerId: "socket-host" });
  elements = render();
  assert.ok(elements.includes("Luna"));
  assert.ok(elements.includes("Turno de Host"));
  assert.equal(elements.some((node) => node.type === "input"), false);
});

test("chat waits for confirmation, preserves server rejection and never emits outside debate/voting", async () => {
  const client = fixture();
  const { sendChatMessage } = client.hooks.useSocketGame();
  await assert.rejects(sendChatMessage("hola"), /debate y la votación/);
  assert.equal(client.requests.length, 0);
  client.game.getState().setPhase("debate");
  const accepted = sendChatMessage(" hola ");
  assert.equal(client.requests[0].payload.message, "hola");
  assert.equal(client.requests[0].ms, 5000);
  assert.equal(client.game.getState().chatMessages.length, 0, "no optimistic echo");
  client.requests[0].respond(null, { success: true });
  await accepted;
  client.game.getState().setPhase("voting");
  const rejected = sendChatMessage("otro");
  client.requests[1].respond(null, { success: false, code: "FLOOD_LIMIT", message: "Muy rápido" });
  await assert.rejects(rejected, (error) => error.code === "FLOOD_LIMIT");
  const timedOut = sendChatMessage("otro");
  client.requests[2].respond(new Error("timeout"));
  await assert.rejects(timedOut, /Revisá el chat/);
});

test("activity follows public server events without duplicating clues or revealing private assignments", () => {
  const client = fixture();
  client.mount();
  client.receive("characterAssigned", { character: null, isImpostor: true });
  assert.equal(client.game.getState().chatMessages.length, 0);
  client.receive("phaseChanged", { phase: "word" });
  client.receive("turnChanged", { playerId: "socket-guest", username: "Invitado" });
  const hint = { playerId: "socket-guest", username: "Invitado", word: "Luna", skipped: false };
  client.receive("wordHintRevealed", hint);
  client.receive("wordHintRevealed", hint);
  client.receive("allWordsSubmitted", { hints: [hint] });
  assert.equal(client.game.getState().chatMessages.filter((message) => message.message.includes("Luna")).length, 1);
  client.receive("phaseChanged", { phase: "debate" });
  assert.equal(client.game.getState().chatMessages.length, 2);
  const message = { id: "server-vote", type: "system", message: "Host ha votado", timestamp: 123 };
  client.receive("chatMessage", message);
  client.receive("chatMessage", message);
  assert.equal(client.game.getState().chatMessages.length, 3);
});

test("final result keeps revealed impostor identities through the lobby reset and normalizes innocent", () => {
  const client = fixture();
  client.mount();
  const finalPlayers = [...client.roomStore.getState().players];
  client.receive("gameEnded", { winner: "innocent", players: finalPlayers, rounds: [], impostorIds: ["socket-host"] });
  client.roomStore.getState().players = [];
  assert.equal(client.game.getState().winner, "crew");
  assert.equal(client.game.getState().phase, "finished");
  assert.equal(client.game.getState().finalResult.impostorIds[0], "socket-host");
  assert.equal(client.game.getState().finalResult.players.length, 2);
  client.game.getState().resetGame();
  assert.equal(client.game.getState().finalResult, null);
});

function chatHarness(client) {
  const slots = [];
  let cursor = 0;
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
  };
  const { default: Chat } = loadSource("src/components/game/DebateChat.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState, useRef: (value) => useState({ current: value })[0], useEffect: () => {} },
    "lucide-react": Object.fromEntries(["ArrowDown", "Ghost", "LockKeyhole", "MessageCircle", "Radio", "Send", "Activity"].map((name) => [name, "svg"])),
    "@/store/useGameStore": { useGameStore: () => client.game.getState() },
    "@/store/useRoomStore": { useRoomStore: client.roomStore },
    "@/hooks/useSocketGame": { useSocketGame: client.hooks.useSocketGame },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
  });
  function flatten(node) {
    if (Array.isArray(node)) return node.flatMap(flatten);
    if (node?.props) return [node, ...flatten(node.props.children)];
    return node == null ? [] : [node];
  }
  return () => { cursor = 0; return flatten(Chat()); };
}

test("chat UI keeps rejected drafts, prevents duplicate submissions and waits for the server echo", async () => {
  const client = fixture();
  client.mount();
  client.game.getState().setPhase("debate");
  const render = chatHarness(client);
  render().find((node) => node.type === "input").props.onChange({ target: { value: "Sospecho del host" } });
  const submit = () => render().find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
  const pending = submit();
  await submit();
  assert.equal(client.requests.length, 1);
  client.requests[0].respond(null, { success: false, code: "FLOOD_LIMIT", message: "Muy rápido" });
  await pending;
  assert.equal(render().find((node) => node.type === "input").props.value, "Sospecho del host");
  assert.equal(render().find((node) => node.props?.role === "alert").props.children, "Muy rápido");
  const accepted = submit();
  client.receive("chatMessage", { id: "echo", senderId: "socket-guest", senderName: "Invitado", message: "Sospecho del host", type: "player", timestamp: Date.now() });
  client.requests[1].respond(null, { success: true });
  await accepted;
  assert.equal(render().find((node) => node.type === "input").props.value, "");
  assert.equal(client.game.getState().chatMessages.length, 1);
  client.game.getState().setPhase("word");
  assert.equal(render().some((node) => node.type === "form"), false);
  assert.ok(render().includes("Sospecho del host"));
});

test("ghost messages stay hidden for living players and remain available to eliminated players after lobby reset", () => {
  const client = fixture();
  client.game.getState().setPhase("voting");
  client.game.getState().addChatMessage({ id: "ghost", senderId: "other", senderName: "Fantasma", message: "Mensaje privado", type: "ghost", timestamp: Date.now() });
  const render = chatHarness(client);
  assert.equal(render().includes("Mensaje privado"), false);
  client.roomStore.getState().updatePlayer("socket-guest", { isAlive: false });
  assert.ok(render().includes("Mensaje privado"));
  const finalPlayers = [...client.roomStore.getState().players];
  client.game.setState({ phase: "finished", finalResult: { winner: "impostor", players: finalPlayers, rounds: [], impostorIds: ["socket-host"] } });
  client.roomStore.getState().updatePlayer("socket-guest", { isAlive: true });
  assert.ok(render().includes("Mensaje privado"));
});
