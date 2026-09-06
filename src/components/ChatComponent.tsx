import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AnimateIcon } from "./animate-ui/icons/icon";
import { MessageSquareX } from "./animate-ui/icons/message-square-x";
import { AnimatePresence, motion } from "motion/react";
import { Send } from "./animate-ui/icons/send";

export interface GameMessage {
  id: string;
  sender: string; // "Tú", jugador o "Sistema"
  message: string;
  timestamp: Date;
  isSelf?: boolean;
  type?: "player" | "system";
  systemType?: "joined" | "left" | "voted" | "eliminated";
}

interface ChatComponentProps {
  messages: GameMessage[];
  onSendMessage: (msg: GameMessage | string) => void;
  onClose?: () => void;
  players?: { id: string; name: string }[];
  currentUser?: { id: string; name: string };
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  messages,
  onSendMessage,
  onClose,
  players = [],
}) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Inicializar mensajes de unión
  useEffect(() => {
    if (!initialized && players.length > 0) {
      players.forEach((p) =>
        onSendMessage({
          id: Date.now().toString() + p.id,
          sender: "Sistema",
          message: `${p.name} se ha unido al chat`,
          timestamp: new Date(),
          type: "system",
          systemType: "joined",
        })
      );
      setInitialized(true);
    }
  }, [initialized, players, onSendMessage]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage({
      id: Date.now().toString(),
      sender: "Tú",
      message: newMessage.trim(),
      timestamp: new Date(),
      isSelf: true,
      type: "player",
    });
    setNewMessage("");
  };

  // Función para definir estilos de mensajes del sistema
  const getSystemClasses = (type?: string) => {
    switch (type) {
      case "joined":
        return "bg-green-100/60 dark:bg-green-500/30 border border-green-400 dark:border-green-300 text-green-900 dark:text-green-50";
      case "left":
        return "bg-gray-200/60 dark:bg-gray-600/30 border border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-100";
      case "voted":
        return "bg-blue-100/60 dark:bg-blue-500/30 border border-blue-400 dark:border-blue-300 text-blue-900 dark:text-blue-50";
      case "eliminated":
        return "bg-red-100/60 dark:bg-red-500/30 border border-red-400 dark:border-red-300 text-red-900 dark:text-red-50";
      default:
        return "bg-yellow-100/60 dark:bg-yellow-500/30 border border-yellow-400 dark:border-yellow-300 text-yellow-900 dark:text-yellow-50";
    }
  };

  return (
    <Card className="flex flex-col h-full w-full bg-[#daf3f8] dark:bg-gray-800 border border-accent dark:border-border shadow-lg rounded-none transition-colors">
      {/* Header */}
      <CardHeader className="flex items-center justify-between p-4 border-b border-accent dark:border-border">
        <CardTitle className="text-foreground text-lg font-bold">
          💬 Chat de la Partida
        </CardTitle>
        {onClose && (
          <AnimateIcon animateOnHover>
            <button
              onClick={onClose}
              className="hover:cursor-pointer text-foreground hover:bg-accent/20 h-10 w-10 p-0 flex items-center justify-center rounded-full transition-colors"
            >
              <MessageSquareX className="h-5 w-5" />
            </button>
          </AnimateIcon>
        )}
      </CardHeader>

      {/* Mensajes */}
      <CardContent className="flex flex-col flex-1 min-h-0 p-4">
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: msg.isSelf ? [10, -5, 0] : 0,
                  scale: msg.isSelf ? [1.2, 0.95, 1] : 1,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-3 ${
                  msg.isSelf ? "justify-end" : "justify-start"
                }`}
              >
                {!msg.isSelf && (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                      msg.type === "system"
                        ? getSystemClasses(msg.systemType)
                        : msg.sender === "Alex"
                        ? "bg-red-500"
                        : msg.sender === "Maria"
                        ? "bg-blue-500"
                        : msg.sender === "Carlos"
                        ? "bg-green-500"
                        : "bg-purple-500"
                    }`}
                  >
                    {msg.type === "system" ? "💡" : "😊"}
                  </div>
                )}

                <div className="flex flex-col max-w-[70%]">
                  {!msg.isSelf && msg.type !== "system" && (
                    <span className="text-sm font-medium text-foreground">
                      {msg.sender} • {formatTime(msg.timestamp)}
                    </span>
                  )}

                  {msg.type === "system" ? (
                    <div
                      className={`flex items-center justify-center gap-2 px-4 py-1 border border-dashed rounded-lg text-center text-sm italic ${getSystemClasses(
                        msg.systemType
                      )}`}
                    >
                      <span>💡</span>
                      <span>{msg.message}</span>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-2xl break-words text-sm shadow-sm ${
                        msg.isSelf
                          ? "bg-accent text-white self-end rounded-br-none"
                          : "bg-white dark:bg-gray-700 text-foreground dark:text-white rounded-bl-none border border-border/40"
                      }`}
                    >
                      {msg.message}
                    </div>
                  )}
                </div>

                {msg.isSelf && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm bg-accent">
                    😊
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-700 border border-border text-foreground placeholder:text-muted-foreground px-4 py-2 focus-visible:ring-accent/40"
            maxLength={200}
          />
          <AnimateIcon animate completeOnStop>
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 rounded-2xl h-11 transition-colors"
            >
              <Send />
            </Button>
          </AnimateIcon>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatComponent;
