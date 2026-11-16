import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function fixture({ narrow = false, reduced = false, native = true, throws = false, skip = false } = {}) {
  const navigations = [], focused = [], scrolls = [];
  const root = { dataset: {}, hasAttribute: () => Boolean(root.dataset.authTransition) };
  const window = { location: { pathname: "/login" }, matchMedia: (query) => ({ matches: query.includes("min-width") ? !narrow : reduced }), scrollTo: (options) => scrolls.push(options), setTimeout, clearTimeout };
  const document = { documentElement: root, querySelector: () => ({ focus: (options) => focused.push(options) }) };
  let finish, nativeCalls = 0;
  if (native) document.startViewTransition = (update) => {
    nativeCalls++;
    if (throws) throw new Error("No snapshots");
    const done = update();
    return { ready: skip ? Promise.reject(new Error("Snapshot skipped")) : done, finished: done.then(() => new Promise((resolve) => { finish = resolve; })) };
  };
  const exports = {};
  const dependencies = { "react-dom": { flushSync: (callback) => callback() }, "react-router": { useNavigate: () => (path) => { navigations.push(path); window.location.pathname = path; } } };
  const { outputText } = ts.transpileModule(readFileSync("src/hooks/useAuthNavigation.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(outputText, { exports, document, window, requestAnimationFrame: (callback) => callback(), require: (name) => { assert.ok(name in dependencies); return dependencies[name]; } });
  return { navigate: exports.useAuthNavigation(), active: exports.isAuthTransitionActive, navigations, focused, scrolls, root, nativeCalls: () => nativeCalls, finish: async () => { await new Promise((resolve) => setImmediate(resolve)); finish(); } };
}

for (const options of [{ native: false }, { narrow: true }, { reduced: true }]) {
  test(`auth switch keeps SPA navigation and focus without snapshots: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    await f.navigate("/signup");
    assert.deepEqual(f.navigations, ["/signup"]);
    assert.equal(f.nativeCalls(), 0);
    assert.equal(f.focused.length, 1);
    assert.equal(f.scrolls.length, 1);
    assert.equal(f.active(), false);
  });
}

test("auth switch commits once, blocks double clicks and clears temporary state in both directions", async () => {
  const f = fixture();
  for (const target of ["/signup", "/login"]) {
    const pending = f.navigate(target);
    assert.equal(f.active(), true);
    assert.equal(f.navigations.at(-1), target);
    const count = f.navigations.length;
    await f.navigate(target);
    assert.equal(f.navigations.length, count);
    await f.finish();
    await pending;
    assert.equal(f.active(), false);
  }
  assert.equal(f.nativeCalls(), 2);
  assert.equal(f.focused.length, 2);
});

test("a skipped snapshot still navigates once and unlocks the next switch", async () => {
  const f = fixture({ skip: true });
  const pending = f.navigate("/signup");
  await f.finish();
  await pending;
  assert.deepEqual(f.navigations, ["/signup"]);
  assert.equal(f.active(), false);
  assert.equal(f.focused.length, 1);
});

test("a browser API failure falls back to navigation without leaving a transition lock", async () => {
  const f = fixture({ throws: true });
  await f.navigate("/signup");
  await f.navigate("/login");
  assert.deepEqual(f.navigations, ["/signup", "/login"]);
  assert.equal(f.active(), false);
});
