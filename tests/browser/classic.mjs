import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { createServer as createVite } from "vite";

const backend = new URL("../../../character-us-server/", import.meta.url);
const requireBackend = createRequire(new URL("package.json", backend));
const { Server } = requireBackend("socket.io");

const scenarios = [
  { size: 4, count: 1, winner: "innocent", tieFirst: true },
  { size: 4, count: 1, winner: "impostor" },
  { size: 6, count: 2, winner: "impostor" },
  { size: 6, count: 2, winner: "innocent" },
  { size: 8, count: 3, winner: "impostor" },
];
async function readSnapshot(page, roomId) {
  return page.evaluate(async id => {
    const { getSocket } = await import("/src/services/socket/socket.ts");
    return getSocket().timeout(5000).emitWithAck("getGameState", { roomId: id });
  }, roomId);
}

const cases = ["classic", "anonymous"].flatMap(mode => scenarios.map(scenario => ({ ...scenario, mode })));
for (const {size, count, winner, tieFirst, mode} of cases) test(`${mode}: ${size} players, ${count} impostors, ${winner}`, { timeout: 120_000 }, async (t) => {
  process.env.ADMIN_EMAIL = "browser@example.invalid";
  process.env.ADMIN_HASH = "unused";
  process.env.JWT_SECRET = "local-browser-test-only";
  process.env.DB_CONNECTION_STRING = "postgres://test:test@127.0.0.1:1/test";
  const { registerSocketHandlers } = await import(new URL("src/sockets/index.ts", backend));
  const { createRoom, deleteRoom } = await import(new URL("src/sockets/services/room.service.ts", backend));
  const model = async name => (await import(new URL("src/db/models/" + name + ".ts", backend))).default;
  const category = size === 4 ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222";
  const character = { id: "secret-id-479", name: size === 4 ? "Personaje Secreto 479" : "Athena", imageUrl: "/secret-479.webp" };
  t.mock.method(await model("Character"), "findAll", async ({where}) => where.category_id === category ? [character] : []);
  t.mock.method((await model("GameHistory")).sequelize, "transaction", async (run) => run({}));
  t.mock.method(await model("GameHistory"), "create", async () => ({ get: () => "history" }));
  t.mock.method(await model("GamePlayer"), "create", async () => ({}));
  const { hashResumeToken } = await import(new URL("src/sockets/services/session.service.ts", backend));
  const http = createServer();
  const io = new Server(http, { transports: ["websocket"] });
  registerSocketHandlers(io);
  await new Promise(resolve => http.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => io.close(resolve)));
  const room = createRoom("fixture-host", "Anfitrión", {
    category, maxPlayers: size, impostorCount: count,
    mode, playMode: "online", privacy: "public", visibleVotes: true, impostorsKnowEachOther: true,
  }, "", null, false, "Prueba");
  t.after(() => deleteRoom(room.id));
  const resumeToken = "ab".repeat(32);
  room.players.get(room.hostId).resumeTokenHash = hashResumeToken(resumeToken);

  const socketUrl = "http://127.0.0.1:" + http.address().port;
  const vite = await createVite({ server: { host: "127.0.0.1", port: 0 }, define: {
    "import.meta.env.VITE_SOCKET_URL": JSON.stringify(socketUrl),
    "import.meta.env.VITE_API_URL": JSON.stringify(socketUrl + "/api"),
  } });
  await vite.listen();
  t.after(() => vite.close());
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
  t.after(() => browser.close());

  async function join(name) {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.playedDurations = [];
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        start.apply(this, args);
        if (this.context.state === "running") window.playedDurations.push(this.buffer.duration);
      };
    });
    const page = await context.newPage();
    // Estas consultas HTTP no participan en la partida. Todos los sockets usan el servidor real.
    page.setDefaultTimeout(15_000);
    await page.route(url => url.pathname.startsWith("/api/"), route => route.fulfill({
      status: route.request().url().includes("refresh") ? 401 : 200,
      json: [], headers: { "Access-Control-Allow-Origin": vite.resolvedUrls.local[0].replace(/\/$/, ""), "Access-Control-Allow-Credentials": "true" },
    }));
    const frames = [];
    page.on("websocket", ws => {
      if (!ws.url().includes("/socket.io/")) return;
      ws.on("framereceived", ({ payload }) => {
        const packet = /^4[23]\d*(\[.*)$/s.exec(String(payload));
        if (packet) frames.push(JSON.parse(packet[1]));
      });
    });
    if (name === "Anfitrión") {
      await context.addInitScript(session => sessionStorage.setItem("characterus.room-session", JSON.stringify(session)),
        { roomId: room.id, playerId: room.hostId, resumeToken });
      await page.goto(vite.resolvedUrls.local[0] + "lobby");
    } else {
      await page.goto(vite.resolvedUrls.local[0] + "join/" + room.id, { waitUntil: "domcontentloaded" });
      await page.getByLabel("Tu nombre").fill(name);
      await page.getByRole("button", { name: "Unirme a la sala" }).click();
    }
    await page.getByRole("log").waitFor();
    const id = await page.evaluate(() => JSON.parse(sessionStorage.getItem("characterus.room-session")).playerId);
    return { page, frames, name, id };
  }
  const players = [];
  for (const name of ["Anfitrión", "Ana", "Sol", "Leo", "Luz", "Noa", "Teo", "Paz"].slice(0,size)) players.push(await join(name));
  await Promise.all(players.map(({page}) => page.getByRole("button", {name:"Estoy listo", exact:true}).click()));
  await players[0].page.getByRole("button", {name:"Iniciar partida"}).click();
  for (const p of players) {
    await p.page.getByRole("heading", {name: new RegExp("Eres el impostor|" + character.name, "i")}).first().waitFor();
    const roles = p.frames.filter(([name]) => name === "characterAssigned");
    assert.equal(roles.length, 1);
    p.role = roles[0][1];
    const snapshot = await readSnapshot(p.page, room.id);
    assert.equal(snapshot.success, true);
    assert.deepEqual(snapshot.data.characterAssignment, p.role);
    for (const player of snapshot.data.room.players) {
      for (const field of ["isImpostor", "characterId", "impostorIds"]) assert.ok(!(field in player));
    }
    const screen = await p.page.locator("main").innerText();
    if (mode === "anonymous") {
      assert.equal(snapshot.data.room.settings.visibleVotes, false);
      assert.equal(snapshot.data.room.settings.impostorsKnowEachOther, false);
      assert.ok(!("impostorIds" in p.role));
      assert.doesNotMatch(screen, /compañero[s]? impostor/i);
    }
    assert.equal(screen.includes(character.name), !p.role.isImpostor);
    assert.equal(/Eres el impostor/i.test(screen), p.role.isImpostor);
    assert.deepEqual(p.role.character, p.role.isImpostor ? null : {...character, category:room.settings.category});
  }
  const impostors = players.filter(p => p.role.isImpostor);
  assert.equal(impostors.length, count);
  const innocents = players.filter(p => !p.role.isImpostor);
  let alive = [...players];
  for (let round = 1; round <= 2; round++) {
    for (let i = 0; i < alive.length; i++) {
      const actor = await Promise.any(alive.map(async p => {
        await p.page.getByLabel("Tu palabra para esta ronda").waitFor();
        return p;
      }));
      const input = actor.page.getByLabel("Tu palabra para esta ronda");
      await input.fill(["verde","cielo","brisa","hoja","mar","nube","luna","roca"][i]);
      await input.press("Enter");
      await input.waitFor({state:"hidden"});
    }
    if (round === 1 && size === 4 && winner === "innocent") {
      const [sender, receiver] = alive;
      await sender.page.getByLabel("Mensaje para el chat").fill("Hola equipo");
      await sender.page.getByRole("button", {name:"Enviar mensaje"}).click();
      for (const [player, file] of [[sender, "chat-out.wav"], [receiver, "chat-in.wav"]]) {
        const duration = await player.page.evaluate(async filename => {
          const ctx = new AudioContext();
          try {
            const res = await fetch("/sounds/" + filename);
            return (await ctx.decodeAudioData(await res.arrayBuffer())).duration;
          } finally { await ctx.close(); }
        }, file);
        await player.page.waitForFunction(d => window.playedDurations.includes(d), duration);
      }
    }
    const checkButtonAudio = round === 1 && size === 4 && winner === "innocent";
    if (checkButtonAudio) await alive[0].page.evaluate(() => { window.playedDurations = []; });
    await Promise.all(alive.map(p => p.page.getByRole("button",{name:"Estoy listo para votar"}).click()));
    if (checkButtonAudio) {
      const duration = await alive[0].page.evaluate(async () => {
        const ctx = new AudioContext();
        try {
          const res = await fetch("/sounds/click_001.ogg");
          return (await ctx.decodeAudioData(await res.arrayBuffer())).duration;
        } finally { await ctx.close(); }
      });
      await alive[0].page.waitForFunction(d => window.playedDurations.includes(d), duration);
    }
    const tie = tieFirst && round === 1;
    const target = winner === "impostor" ? innocents[round-1] : impostors[tieFirst ? 0 : round-1];
    const votes = {};
    for (const [i, p] of alive.entries()) {
      const choice = tie ? players[[1,0,0,1][i]] : p === target ? alive.find(x => x !== target) : target;
      votes[p.id] = choice.id;
      await p.page.getByRole("button",{name:new RegExp("^"+choice.name+" ")}).click();
      await p.page.getByRole("button",{name:"Confirmar voto por "+choice.name}).click();
      if (mode === "anonymous" && i === 0) {
        const observer = alive[1];
        if (round === 1) await observer.page.reload({waitUntil:"domcontentloaded"});
        await observer.page.getByRole("button", {name: new RegExp("^" + p.name + " .*Ya votó")}).waitFor();
        for (const viewer of players) {
          const snapshot = await readSnapshot(viewer.page, room.id);
          assert.deepEqual(snapshot.data.votes, {});
          assert.deepEqual(snapshot.data.voterIds, [p.id]);
          assert.equal(snapshot.data.votedFor, viewer === p ? choice.id : null);
          const body = await viewer.page.locator("body").innerText();
          assert.doesNotMatch(body, /(?:ha votado|votó) a |compañeros? impostor/i);
        }
      }
    }
    for (const p of players) {
      await p.page.getByRole("heading",{name: round === 2 ? (winner === "innocent" ? "Ganan los inocentes":count === 1 ? "Gana el impostor" : "Ganan los impostores") : /Resultado/i}).first().waitFor();
      const result = p.frames.filter(([key]) => key === "roundResults").at(-1)[1];
      assert.equal(result.round, round);
      assert.deepEqual(result.votes, mode === "anonymous" ? {} : votes);
      assert.equal(result.eliminatedPlayer?.socketId ?? null, tie ? null : target.id);
    }
    if (!tie) alive = alive.filter(p => p !== target);
    const remaining = alive.filter(p => p.role.isImpostor).length;
    if (round === 1) assert.ok(remaining > 0 && alive.length > 2 * remaining);
    else if (winner === "impostor") assert.equal(alive.length, 2 * remaining);
    else assert.equal(remaining, 0);
  }
  for (const p of players) {
    const end = p.frames.findIndex(([key]) => key === "gameEnded");
    assert.ok(end > 0);
    assert.deepEqual(new Set(p.frames[end][1].impostorIds), new Set(impostors.map(p => p.id)));
    assert.equal(p.frames[end][1].winner, winner);
    if (mode === "anonymous") {
      for (const r of p.frames[end][1].rounds) assert.deepEqual(r.votes, {});
      const updates = p.frames.filter(([key]) => key === "voteUpdate");
      assert.equal(updates.length, size + (tieFirst ? size : size - 1));
      for (const [, update] of updates) {
        assert.deepEqual(update, { votes: {}, visible: false, voterId: update.voterId });
        assert.ok(players.some(player => player.id === update.voterId));
      }
    }
    for (const frame of p.frames.slice(0,end)) {
      const raw = JSON.stringify(frame);
      if (mode === "anonymous") assert.doesNotMatch(raw, /"impostorIds":|ha votado a /);
      if (p.role.isImpostor) for (const secret of Object.values(character)) assert.ok(!raw.includes(secret));
      else assert.doesNotMatch(raw, /"isImpostor":true|"impostorIds":/);
    }
  }
});
