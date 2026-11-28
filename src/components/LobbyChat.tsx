import { useEffect, useRef, useState, type FormEvent } from "react";
import { emitLobbyMessage } from "@/services/socket/emitters/room";
import type { Room } from "@/types/game";
import { playSound } from "@/lib/sounds";
import { useRoomStore } from "@/store/useRoomStore";
import { Button } from "@/components/ui/button";

export default function LobbyChat({ room, online }: { room: Room; online: boolean }) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const messages = room.lobbyMessages ?? [];
  const lastId = messages[messages.length - 1]?.id;

  const seen = useRef(lastId ?? 0);
  useEffect(() => {
    const mine = useRoomStore.getState().currentPlayer?.username;
    if (messages.some(entry => entry.id > seen.current && entry.kind === "chat" && entry.username !== mine)) playSound("message");
    seen.current = lastId ?? 0;
  }, [lastId, messages]);

  useEffect(() => {
    if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [lastId]);

  function send(event: FormEvent) {
    event.preventDefault();
    if (!online || pending || !draft.trim()) return;
    setPending(true);
    setError("");
    try {
      emitLobbyMessage(room.id, draft.trim(), (result) => {
        setPending(false);
        if (result.success) { setDraft(""); playSound("sent"); }
        else setError(result.message);
      });
    } catch {
      setPending(false);
      setError("Espera a que se restablezca la conexión.");
    }
  }

  return (
    <section className="space-y-3 border-t border-border p-5" aria-labelledby="lobby-chat-title">
      <h2 id="lobby-chat-title" className="text-xl font-semibold">Chat de la sala</h2>
      <div ref={log} role="log" aria-labelledby="lobby-chat-title" className="h-48 space-y-2 overflow-y-auto rounded-lg bg-muted/40 p-3"
        onScroll={(event) => {
          const node = event.currentTarget;
          follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 32;
        }}>
        {messages.map((entry) => entry.kind === "system"
          ? <p key={entry.id} className="break-words text-center text-sm text-muted-foreground">{entry.username} {entry.text}</p>
          : <div key={entry.id} className="w-fit max-w-full break-words rounded-xl border border-border bg-card px-3 py-2">
              <strong className="block text-sm">{entry.username}</strong>{entry.text}
            </div>)}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input aria-label="Mensaje para la sala" placeholder="Escribe un mensaje…" maxLength={300} readOnly={pending}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <Button data-chat-send type="submit" disabled={!online || pending || !draft.trim()}>Enviar</Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
