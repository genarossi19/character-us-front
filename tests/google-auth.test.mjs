import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { create } from "zustand";
import * as middleware from "zustand/middleware";

function load(path, dependencies, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(outputText, { exports, ...globals, require(name) {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

test("Google sends only credential to the public auth endpoint and propagates conflicts", async () => {
  const calls = [];
  const result = { token: "characterus-jwt" };
  let rejection;
  const auth = load("src/services/api/auth.ts", { "./client": {
    publicApi: { post: async (url, body) => { calls.push({ url, body }); if (rejection) throw rejection; return { data: result }; } },
    getApiError: (error) => error,
  } });
  assert.equal(await auth.googleLoginRequest("google-id-token"), result);
  assert.equal(calls[0].url, "/auth/google");
  assert.deepEqual(Object.keys(calls[0].body), ["credential"]);
  assert.equal(calls[0].body.credential, "google-id-token");
  rejection = new Error("La cuenta ya existe");
  await assert.rejects(auth.googleLoginRequest("other"), /cuenta ya existe/);
});

test("Google stores only CharacterUs session, retains backend username/name and cleans up on logout", async () => {
  const storage = new Map();
  const sessionStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  let token;
  let disabled = 0;
  let fail = false;
  const user = { id: "id", username: "google_stable_id", name: "Nombre Google", email: "test@example.com", gamesPlayed: 2, isGuest: false };
  const { useUserStore: store } = load("src/store/useUserStore.ts", {
    zustand: { create }, "zustand/middleware": middleware,
    "jwt-decode": { jwtDecode: () => ({ userId: "id", username: user.username, email: user.email, exp: Date.now() / 1000 + 3600 }) },
    "@/services/api/auth": { googleLoginRequest: async () => { if (fail) throw new Error("Conflicto 409"); return { token: "characterus-jwt", user }; }, getCurrentUserRequest: async () => user },
    "@/constants/avatars": { AVATAR_URLS: ["/avatar1.webp"] },
    "@/services/auth/accessToken": { setAccessToken: (value) => { token = value; } },
    "@/services/auth/googleIdentity": { disableGoogleAutoSelect: () => disabled++ },
  }, { window: {}, sessionStorage, localStorage: { removeItem() {} } });
  await store.getState().loginWithGoogle("private-google-credential");
  assert.equal(token, "characterus-jwt");
  assert.equal(store.getState().user.username, user.username);
  assert.equal(store.getState().user.name, user.name);
  assert.equal(store.getState().isLoggedIn, true);
  assert.equal(storage.get("characterus.session").includes("private-google-credential"), false);
  fail = true;
  await assert.rejects(store.getState().loginWithGoogle("invalid"), /409/);
  assert.equal(store.getState().token, "characterus-jwt");
  store.getState().logout();
  assert.equal(token, null);
  assert.equal(disabled, 1);
  assert.equal(storage.has("characterus.session"), false);
});

test("GIS loads once, initializes once and ignores callbacks after unmount", async () => {
  const scripts = [];
  let initializeCount = 0;
  let callback;
  const window = { setTimeout: () => 1, clearTimeout() {} };
  const sdk = { initialize: (options) => { initializeCount++; callback = options.callback; }, renderButton() {}, disableAutoSelect() {} };
  const api = load("src/services/auth/googleIdentity.ts", {}, { window, document: { createElement: () => ({ remove() {} }), head: { appendChild: (script) => scripts.push(script) } } });
  const first = api.loadGoogleIdentity();
  assert.equal(api.loadGoogleIdentity(), first);
  window.google = { accounts: { id: sdk } };
  scripts[0].onload();
  assert.equal(await first, sdk);
  assert.equal(scripts.length, 1);
  let received = 0;
  const element = { clientWidth: 300, replaceChildren() {} };
  const cleanup = api.renderGoogleButton(sdk, element, "client-id", () => received++);
  callback({ credential: "one" });
  cleanup();
  callback({ credential: "two" });
  assert.equal(received, 1);
  api.renderGoogleButton(sdk, element, "client-id", () => received++);
  assert.equal(initializeCount, 1);
});

test("GIS loading failure allows a fresh retry", async () => {
  const scripts = [];
  const window = { setTimeout: () => 1, clearTimeout() {} };
  const api = load("src/services/auth/googleIdentity.ts", {}, { window, document: { createElement: () => ({ remove() {} }), head: { appendChild: (script) => scripts.push(script) } } });
  const failed = api.loadGoogleIdentity();
  scripts[0].onerror();
  await assert.rejects(failed, /No se pudo cargar Google/);
  const retry = api.loadGoogleIdentity();
  assert.equal(scripts.length, 2);
  const sdk = {};
  window.google = { accounts: { id: sdk } };
  scripts[1].onload();
  assert.equal(await retry, sdk);
});
