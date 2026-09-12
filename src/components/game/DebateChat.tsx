import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useSocketGame } from "@/hooks/useSocketGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface DebateChatProps {
  showHintsOnly?: boolean;
}

export default function DebateChat({ showHintsOnly = false }: DebateChatProps) {
  const { wordHints, chatMessages, readyPlayerIds, readyPlayersTotal } = useGameStore();
  const currentPlayer = useRoomStore((s) => s.currentPlayer);
  const { sendChatMessage, debateReady } = useSocketGame();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGhost = !currentPlayer?.isAlive;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendChatMessage(newMessage.trim());
    setNewMessage("");
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getSystemClasses = (type?: string) => {
    switch (type) {
      case "joined":
        return "bg-green-100/60 dark:bg-green-500/30 border border-green-400 dark:border-green-300 text-green-900 dark:text-green-50";
      case "eliminated":
        return "bg-red-100/60 dark:bg-red-500/30 border border-red-400 dark:border-red-300 text-red-900 dark:text-red-50";
      case "vote":
        return "bg-blue-100/60 dark:bg-blue-500/30 border border-blue-400 dark:border-blue-300 text-blue-900 dark:text-blue-50";
      case "round":
        return "bg-yellow-100/60 dark:bg-yellow-500/30 border border-yellow-400 dark:border-yellow-300 text-yellow-900 dark:text-yellow-50";
      default:
        return "bg-gray-100/60 dark:bg-gray-600/30 border border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-100";
    }
  };

  // Hints panel — used in center during debate, or as header in chat mode
  const hintsPanel = (
    <Card className="rounded-none border-x-0 border-t-0">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          Pistas de la ronda
        </CardTitle>
      </CardHeader>
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {wordHints.map((hint) => (
          <div
            key={hint.playerId}
            className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-sm"
          >
            <span className="font-medium text-foreground">
              {hint.username}:
            </span>{" "}
            <span className="text-accent font-semibold">{hint.word}</span>
          </div>
        ))}
        {wordHints.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Las pistas aparecerán aqui...
          </p>
        )}
      </div>
    </Card>
  );

  // Hints-only mode (center during debate)
  if (showHintsOnly) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-accent/10 border border-accent/20 rounded-full px-4 py-1 text-sm font-medium text-foreground text-center">
          Listos: {readyPlayerIds.length} / {readyPlayersTotal}
        </div>
        {currentPlayer?.isAlive && (
          <Button
            onClick={debateReady}
            disabled={readyPlayerIds.includes(currentPlayer.socketId)}
          >
            {readyPlayerIds.includes(currentPlayer.socketId) ? "Listo" : "Marcar listo"}
          </Button>
        )}
        {hintsPanel}
      </div>
    );
  }

  // Full chat mode (side panel)
  return (
    <div className="flex flex-col h-full">
      {hintsPanel}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${
                msg.senderId === currentPlayer?.socketId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {msg.type === "system" ? (
                <div
                  className={`w-full text-center px-4 py-1 border border-dashed rounded-lg text-sm italic ${getSystemClasses(
                    "systemType" in msg
                      ? String((msg as Record<string, unknown>).systemType)
                      : undefined
                  )}`}
                >
                  <span>{msg.message}</span>
                </div>
              ) : msg.type === "ghost" ? (
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    msg.senderId === currentPlayer?.socketId
                      ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                      : "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                  } italic opacity-70`}
                >
                  <span className="text-xs mr-1">👻</span>
                  <span className="font-medium">{msg.senderName}: </span>
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    msg.senderId === currentPlayer?.socketId
                      ? "bg-accent text-white rounded-br-none"
                      : "bg-white dark:bg-gray-700 text-foreground dark:text-white rounded-bl-none border border-border/40"
                  }`}
                >
                  {msg.senderId !== currentPlayer?.socketId && (
                    <span className="font-medium text-xs block mb-1">
                      {msg.senderName} • {formatTime(msg.timestamp)}
                    </span>
                  )}
                  {msg.message}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <Input
          placeholder={
            isGhost
              ? "Escribe como fantasma (solo eliminados ven esto)..."
              : "Escribe un mensaje..."
          }
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
          maxLength={500}
        />
        <Button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-accent hover:bg-accent/90 text-white"
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}
