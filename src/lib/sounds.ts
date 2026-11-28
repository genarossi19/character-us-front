const clips = {
  click: "click_001.ogg", select: "select_001.ogg", message: "chat-in.wav", sent: "chat-out.wav", vote: "confirmation_001.ogg",
  voting: "question_001.ogg", debate: "open_001.ogg", turn: "pluck_001.ogg", start: "start.wav",
  innocent: "jingles_nes_3.ogg", impostor: "jingles_nes_8.ogg",
} as const;
type Cue = keyof typeof clips;
const key = "characterus.sound-muted";
export function isMuted() {
  try { return localStorage.getItem(key) === "true"; } catch { return false; }
}
let context: AudioContext | undefined;
const buffers = new Map<Cue, Promise<AudioBuffer>>();
const playing = new Map<Cue, AudioBufferSourceNode>();
let generation = 0;
export function unlockSound() {
  if (isMuted()) return;
  try {
    if (!context || context.state === "closed") context = new AudioContext();
    if (context.state !== "running") void context.resume().catch(() => {});
  } catch { /* Audio may be unavailable on this device. */ }
}
export function toggleSound() {
  const muted = !isMuted();
  try { localStorage.setItem(key, String(muted)); } catch { return; }
  generation++;
  if (muted) for (const source of playing.values()) source.stop();
  else { unlockSound(); playSound("select"); }
  window.dispatchEvent(new Event("sound-preference"));
}
export function playSound(cue: Cue) {
  const engine = context;
  if (!engine || engine.state === "closed" || isMuted()) return;
  const version = generation;
  let buffer = buffers.get(cue);
  if (!buffer) {
    buffer = fetch("/sounds/" + clips[cue]).then(async response => {
      if (!response.ok) throw new Error("Audio unavailable");
      return engine.decodeAudioData(await response.arrayBuffer());
    });
    buffers.set(cue, buffer);
  }
  const started = performance.now();
  const ready = engine.state === "running" ? Promise.resolve() : engine.resume();
  void Promise.all([buffer, ready]).then(([audio]) => {
    if (performance.now() - started > 2000) return;
    if (version !== generation || isMuted() || engine.state !== "running") return;
    playing.get(cue)?.stop();
    const source = engine.createBufferSource();
    const gain = engine.createGain();
    gain.gain.value = cue === "click" ? 0.34 : 0.42;
    source.buffer = audio;
    source.connect(gain).connect(engine.destination);
    playing.set(cue, source);
    source.onended = () => {
      if (playing.get(cue) === source) playing.delete(cue);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }).catch(() => buffers.delete(cue));
}
