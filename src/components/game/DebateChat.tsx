import { useState, useRef, useEffect } from "react";
import { ArrowDown, Ghost, LockKeyhole, MessageCircle, Radio, Send, Activity, PencilLine, Vote, X } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ServerDeadline from "./ServerDeadline";

export default function DebateChat({ onClose, active = true }: { onClose?: () => void; active?: boolean } = {}) {
  const { phase, chatMessages, finalResult } = useGameStore();
  const { currentPlayer, players } = useRoomStore();
  const { sendChatMessage } = useSocketGame();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const sendingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const canChat = phase === "debate" || phase === "voting";
  const isGhost = !(phase === "finished" ? finalResult?.players.find((player) => player.socketId === currentPlayer?.socketId) ?? currentPlayer : currentPlayer)?.isAlive;
  const messages = chatMessages.filter((message) => message.type !== "ghost" || isGhost);

  useEffect(() => {
    if (!active) return;
    if (followRef.current) {
      const container = scrollRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    } else {
      setUnread((count) => count + 1);
    }
  }, [chatMessages, active]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canChat || !newMessage.trim() || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      await sendChatMessage(newMessage.trim());
      setNewMessage("");
      followRef.current = true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const goToLatest = () => {
    followRef.current = true;
    setUnread(0);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-2 lg:hidden"><ServerDeadline /></div>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2.5"><MessageCircle className="size-5 text-accent" aria-hidden="true" /><h2 className="font-semibold">Chat de la partida</h2></div>
        <div className="flex items-center gap-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Radio className="size-3.5 text-accent" aria-hidden="true" />{canChat ? "Abierto" : "Actividad"}</span>{onClose && <Button variant="ghost" className="size-10 p-0 lg:hidden" aria-label="Cerrar chat" onClick={onClose}><X className="size-5" aria-hidden="true" /></Button>}</div>
      </header>
      <div ref={scrollRef} role="log" aria-label="Mensajes y acciones" aria-live="polite" aria-relevant="additions" onScroll={() => {
        const element = scrollRef.current;
        if (!element) return;
        followRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 60;
        if (followRef.current) setUnread(0);
      }} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        {messages.length === 0 && <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground"><Activity className="size-8 text-accent/60" aria-hidden="true" /><p className="text-sm">La partida también se cuenta aquí.</p><p className="max-w-52 text-xs">Las acciones aparecerán a medida que jueguen.</p></div>}
        {messages.map((message) => {
          const mine = message.senderId === currentPlayer?.socketId;
          const player = players.find((candidate) => candidate.socketId === message.senderId);
          const time = new Date(message.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
          if (message.type === "system") {
            const activity = message.activity;
            if (!activity) return null;
            const isWord = activity.kind === "word";
            return (
              <article key={message.id} aria-label={isWord ? "Palabra enviada" : "Voto emitido"} className={`mx-2 border-y border-dashed px-3 py-4 ${isWord ? "border-accent/50 bg-accent/5" : "border-border bg-background/50"}`}>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{isWord ? <PencilLine className="size-3.5 text-accent" aria-hidden="true" /> : <Vote className="size-3.5" aria-hidden="true" />}{isWord ? "Palabra enviada" : "Voto emitido"}<time className="ml-auto text-[10px] font-normal tracking-normal">{time}</time></div>
                {activity.kind === "word" ? <><p className="break-words text-xs text-muted-foreground">{activity.actor}</p><p className="mt-1 break-words text-2xl font-semibold text-accent">{activity.word}</p></> : <p className="break-words text-sm">{activity.actor && activity.target ? <><strong>{activity.actor}</strong><span className="text-muted-foreground"> votó a </span><strong>{activity.target}</strong></> : "Ha votado"}</p>}
              </article>
            );
          }
          return (
            <div key={message.id} className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {player?.avatarUrl ? <img src={player.avatarUrl} alt="" className="size-8 shrink-0 rounded-xl object-cover" /> : <MessageCircle className="size-8 shrink-0 rounded-xl bg-muted p-2 text-muted-foreground" aria-hidden="true" />}
              <div className={`min-w-0 max-w-[85%] px-3 py-2.5 ${message.type === "ghost" ? "rounded-lg border-l-4 border-purple bg-purple/15 text-purple" : mine ? "rounded-2xl rounded-tr-sm border border-accent/20 bg-accent/15" : "rounded-2xl rounded-tl-sm bg-muted"}`}>
                {message.type === "ghost" && <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"><Ghost className="size-3.5" aria-hidden="true" />Fantasmas · solo eliminados</p>}
                <div className="mb-1 flex items-center gap-2 text-xs"><span className="break-words font-semibold">{message.senderName}{mine ? " (tú)" : ""}</span>{message.type === "ghost" && <Ghost className="size-3.5 shrink-0 text-purple" aria-label="Canal de eliminados" />}<time className="ml-auto shrink-0 text-[10px] text-muted-foreground">{time}</time></div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
              </div>
            </div>
          );
        })}
      </div>
      {unread > 0 && <Button variant="ghost" onClick={goToLatest} className="mx-4 mb-2 shrink-0 gap-2 text-accent"><ArrowDown className="size-4" aria-hidden="true" />Ver actividad nueva</Button>}
      <div className="shrink-0 border-t border-border p-4">
        {canChat ? (
          <form onSubmit={handleSend} className="space-y-2">
            {isGhost && <p className="flex items-center gap-1.5 text-xs text-purple"><Ghost className="size-3.5" aria-hidden="true" /> Solo los eliminados reciben tus mensajes.</p>}
            <div className="flex gap-2">
              <Input aria-label="Mensaje para el chat" placeholder={isGhost ? "Habla con los eliminados…" : "Comparte tus sospechas…"} value={newMessage} onChange={(event) => setNewMessage(event.target.value)} disabled={sending} maxLength={500} className="min-w-0 flex-1 rounded-xl bg-muted/30" />
              <Button type="submit" aria-label={sending ? "Enviando mensaje" : "Enviar mensaje"} disabled={!newMessage.trim() || sending} className="size-10 shrink-0 rounded-xl bg-accent p-0 text-accent-foreground hover:bg-accent/90"><Send className="size-4" aria-hidden="true" /></Button>
            </div>
            {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          </form>
        ) : <p className="flex items-center gap-2 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="size-4 shrink-0" aria-hidden="true" />{phase === "finished" ? "Partida terminada. Puedes revisar toda la actividad." : "El historial sigue activo. Podrás escribir al debatir y votar."}</p>}
      </div>
    </div>
  );
}
