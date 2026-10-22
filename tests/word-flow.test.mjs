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
  const { default: WordSubmission } = loadSource("src/components/game/WordSubmission.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: state, useRef: (value) => state({ current: value })[0], useCallback: (fn) => fn },
    "motion/react": { motion: { div: "div" } },
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
