import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

function load(path, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(name) { assert.ok(name in dependencies, `Unexpected import: ${name}`); return dependencies[name]; } });
  return exports;
}

const { applyRoomModeRules, getMinimumPlayers, getMaxImpostors } = load("src/lib/roomModeRules.ts");

test("room capacity and the lobby minimum require more innocents than impostors", () => {
  assert.deepEqual([1, 2, 3].map(getMinimumPlayers), [3, 5, 7]);
  assert.deepEqual([4, 6, 8].map(getMaxImpostors), [1, 2, 3]);
});

test("changing modality overrides conflicting flags and preserves the other room settings", () => {
  const initial = { mode: "classic", impostorsKnowEachOther: false, visibleVotes: false, category: "simpsons", privacy: "private", password: "test-password", playMode: "in_person", maxPlayers: 8, impostorCount: 2, maxRounds: 10 };
  const classic = applyRoomModeRules(initial);
  assert.equal(classic.impostorsKnowEachOther, true);
  assert.equal(classic.visibleVotes, true);
  const anonymous = applyRoomModeRules({ ...classic, mode: "anonymous" });
  assert.equal(anonymous.impostorsKnowEachOther, false);
  assert.equal(anonymous.visibleVotes, false);
  const restored = applyRoomModeRules({ ...anonymous, mode: "classic" });
  assert.deepEqual(restored, classic);
  for (const key of ["category", "privacy", "password", "playMode", "maxPlayers", "impostorCount", "maxRounds"]) assert.equal(anonymous[key], initial[key]);
  assert.equal(initial.visibleVotes, false);
});

test("teammates use private server assignment and are hidden for anonymous and innocent players", () => {
  const game = { isImpostor: true, impostorIds: ["self", "teammate"] };
  const room = { room: { settings: { mode: "classic", impostorsKnowEachOther: true } }, currentPlayer: { socketId: "self" }, players: [{ socketId: "self", username: "Yo" }, { socketId: "teammate", username: "Compañero" }, { socketId: "innocent", username: "Inocente" }] };
  const { default: Teammates } = load("src/components/game/ImpostorTeammates.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "@/store/useGameStore": { useGameStore: () => game },
    "@/store/useRoomStore": { useRoomStore: () => room },
  });
  assert.ok(JSON.stringify(Teammates()).includes("Compañero"));
  assert.ok(!JSON.stringify(Teammates()).includes("Inocente"));
  room.room.settings.mode = "anonymous";
  assert.equal(Teammates(), null);
  room.room.settings.mode = "classic";
  game.isImpostor = false;
  assert.equal(Teammates(), null);
  game.isImpostor = true;
  game.impostorIds = [];
  assert.equal(Teammates(), null);
});
