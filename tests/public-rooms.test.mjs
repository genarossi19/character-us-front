import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

function loadSource(path, dependencies, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, Error, ...globals, require: (name) => {
    assert.ok(name in dependencies, `Missing dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  return node?.props ? [node, ...flatten(node.props.children)] : node == null ? [] : [node];
}

test("public rooms refresh the authenticated listing and join the selected room through Socket.IO", async () => {
  const room = { id: "room-id", code: 123456, name: "Sala de Ana", categoryId: "category-id",
    mode: "anonymous", playMode: "online", impostorCount: 1, playerCount: 2, maxPlayers: 4 };
  const requests = [];
  let availableRooms = [];
  const api = {
    authenticatedApi: { async get(url, options) {
      requests.push({ url, ...options });
      return { data: { rooms: availableRooms } };
    } },
    getApiError: (error) => error,
    ApiError: Error,
  };
  const roomsApi = loadSource("src/services/api/rooms.ts", { "./client": api });
  const slots = [];
  const effects = [];
  const joins = [];
  let cursor = 0;
  let refresh;
  const useState = (value) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = value;
    return [slots[index], (update) => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }];
  };
  const { default: PublicRoomsV2 } = loadSource("src/pages/PublicRoomsV2.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState, useRef: (value) => useState({ current: value })[0], useEffect: (fn) => effects.push(fn) },
    "react-router": { Link: "a", useNavigate: () => () => {} },
    "lucide-react": Object.fromEntries(["ArrowLeft", "Gamepad2", "Plus", "RefreshCw", "Search", "Users"].map((name) => [name, "svg"])),
    "@/store/useUserStore": { useUserStore: Object.assign(() => ({ user: { username: "Viewer" }, token: "access-token" }), { getState: () => ({ renewGoogleSession: async () => {} }) }) },
    "@/hooks/useSocketRoom": { useSocketRoom: () => ({ joinRoom: async (payload) => { joins.push(payload); } }) },
    "@/services/api/client": api,
    "@/services/api/category": { fetchCategories: async () => [{ id: "category-id", name: "Personajes" }] },
    "@/services/api/rooms": roomsApi,
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/card": { Card: "section", CardHeader: "div", CardContent: "div", CardTitle: "h2" },
    "@/components/ui/input": { Input: "input" },
    "@/components/ui/label": { Label: "label" },
    "@/components/ui/select": Object.fromEntries(["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"].map((name) => [name, name])),
    "@/components/NavBarLoggued": { default: "header" },
  }, { AbortController, setTimeout: (fn) => { refresh = fn; }, clearTimeout: () => {} });
  const render = () => { cursor = 0; return flatten(PublicRoomsV2()); };
  render();
  const cleanups = effects.splice(0).map((setup) => setup());
  await new Promise(setImmediate);
  const empty = render();
  assert.ok(empty.includes("No hay salas públicas disponibles"));
  assert.ok(empty.includes("Crear sala pública"));
  assert.ok(empty.some(node => node?.props?.to === "/create?privacy=public"));

  availableRooms = [room, { ...room, id: "in-person-room", name: "Sala presencial", playMode: "in_person" }];
  await refresh();
  const cards = render();
  assert.ok(cards.includes("Sala de Ana"));
  assert.ok(!cards.includes("Sala presencial"));
  assert.ok(cards.includes("Personajes"));
  const join = cards.find((element) => element?.props?.children === "Unirse");
  assert.ok(join);
  join.props.onClick();
  assert.equal(joins.length, 1);
  assert.deepEqual({ ...joins[0] }, { code: 123456, listedRoomId: "room-id", username: "Viewer", token: "access-token" });

  availableRooms = [];
  await refresh();
  assert.ok(!render().includes("Sala de Ana"));
  assert.ok(requests.every((request) => request.url === "/rooms/public" && request.timeout === 5000));
  cleanups.forEach((cleanup) => cleanup());
  assert.ok(requests.every((request) => request.signal.aborted));
});
