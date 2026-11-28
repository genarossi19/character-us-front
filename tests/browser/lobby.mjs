import { readdirSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { createServer as createVite } from "vite";

const backend = new URL("../../../character-us-server/", import.meta.url);
const requireBackend = createRequire(new URL("package.json", backend));
const { Server } = requireBackend("socket.io");

test("tres jugadores ven el mismo chat y los avisos del lobby", { timeout: 120_000 }, async (t) => {
  process.env.ADMIN_EMAIL = "browser@example.invalid";
  process.env.ADMIN_HASH = "unused";
  process.env.JWT_SECRET = "local-browser-test-only";
  process.env.DB_CONNECTION_STRING = "postgres://test:test@127.0.0.1:1/test";
  const { registerSocketHandlers } = await import(new URL("src/sockets/index.ts", backend));
  const { createRoom, deleteRoom } = await import(new URL("src/sockets/services/room.service.ts", backend));
  const http = createServer();
  const io = new Server(http, { transports: ["websocket"] });
  registerSocketHandlers(io);
  await new Promise(resolve => http.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => io.close(resolve)));
  const room = createRoom("fixture-host", "Anfitrión", {
    category: "11111111-1111-4111-8111-111111111111", maxPlayers: 4, impostorCount: 1,
    mode: "classic", playMode: "online", privacy: "private", password: "solo-invitados", visibleVotes: true, impostorsKnowEachOther: true,
  }, "", null, false, "Prueba");
  t.after(() => deleteRoom(room.id));

  const socketUrl = "http://127.0.0.1:" + http.address().port;
  const vite = await createVite({ server: { host: "127.0.0.1", port: 0 }, define: {
    "import.meta.env.VITE_SOCKET_URL": JSON.stringify(socketUrl),
    "import.meta.env.VITE_API_URL": JSON.stringify(socketUrl + "/api"),
  } });
  await vite.listen();
  t.after(() => vite.close());
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
  t.after(() => browser.close());

  async function join(name, manualCode = false) {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: {
        writeText: async value => { window.inviteClipboard = value; },
      } });
    });
    const page = await context.newPage();
    // Estas consultas HTTP no participan en el chat. Todos los sockets usan el servidor real.
    page.setDefaultTimeout(15_000);
    await page.route(url => url.pathname.startsWith("/api/"), route => route.fulfill({
      status: route.request().url().includes("refresh") ? 401 : 200,
      json: [], headers: { "Access-Control-Allow-Origin": vite.resolvedUrls.local[0].replace(/\/$/, ""), "Access-Control-Allow-Credentials": "true" },
    }));
    const target = manualCode ? room.code : room.id;
    await page.goto(vite.resolvedUrls.local[0] + "join/" + target, { waitUntil: "domcontentloaded" });
    if (manualCode) {
      await page.waitForURL("**/join");
      const codeInput = page.locator("#roomCode");
      assert.equal(await codeInput.inputValue(), "");
      await codeInput.fill(String(room.code));
      await page.getByRole("button", { name: "Continuar" }).click();
    }
    await page.getByLabel("Tu nombre").fill(name);
    await page.getByRole("button", { name: "Unirme a la sala" }).click();
    const password = page.getByLabel("Contraseña de la sala", { exact: true });
    await password.fill("incorrecta");
    await page.getByRole("button", { name: "Unirme a la sala" }).click();
    await page.getByRole("alert").getByText("Contraseña incorrecta. Intenta de nuevo.").waitFor();
    await password.fill("solo-invitados");
    await page.getByRole("button", { name: "Unirme a la sala" }).click();
    await page.getByRole("log").waitFor();
    return page;
  }
  async function visible(pages, text) {
    for (const page of pages) await page.getByRole("log").getByText(text).waitFor();
  }
  async function send(page, text) {
    await page.getByLabel("Mensaje para la sala").fill(text);
    await page.getByRole("button", { name: "Enviar" }).click();
  }
  const ana = await join("Ana");
  await ana.getByRole("button", { name: "Copiar enlace" }).click();
  await ana.waitForFunction(() => Boolean(window.inviteClipboard));
  const invitation = new URL(await ana.evaluate(() => window.inviteClipboard));
  assert.equal(invitation.pathname, "/join/" + room.id);
  assert.equal(invitation.search, "");
  await ana.getByRole("button", {name: "Silenciar sonido"}).click();
  await ana.reload();
  await ana.getByRole("button", {name: "Activar sonido"}).click();
  const clips = readdirSync(new URL("../../public/sounds/", import.meta.url)).filter(file => /\.(ogg|wav)$/.test(file));
  assert.ok(clips.length > 0);
  await ana.evaluate(async files => {
    const context = new AudioContext();
    try {
      for (const file of files) {
        const response = await fetch("/sounds/" + file);
        const clip = await context.decodeAudioData(await response.arrayBuffer());
        if (!clip.duration) throw new Error(file);
      }
    } finally { await context.close(); }
  }, clips);
  const leo = await join("Leo");
  await visible([ana, leo], "Leo se unió a la partida.");
  await send(ana, "Hola desde Ana");
  await send(leo, "Hola desde Leo");
  const sol = await join("Sol", true);
  const all = [ana, leo, sol];
  const ids = await Promise.all(all.map(page => page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("characterus.room-session")).playerId)));
  assert.equal(new Set(ids).size, 3);
  await visible(all, "Sol se unió a la partida.");
  await visible(all, "Hola desde Ana");
  await visible(all, "Hola desde Leo");
  await sol.getByRole("button", { name: "Estoy listo" }).click();
  await visible(all, "Sol está listo.");
  await sol.getByRole("button", { name: "Salir" }).click();
  await visible([ana, leo], "Sol abandonó la partida.");
  await leo.reload();
  await visible([leo], "Hola desde Ana");
  await visible([leo], "Sol abandonó la partida.");
  assert.equal(await ana.getByRole("log").innerText(), await leo.getByRole("log").innerText());
});
