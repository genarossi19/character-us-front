import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AnimateIcon } from "./animate-ui/icons/icon";
import { MessageSquareX } from "./animate-ui/icons/message-square-x";
import { AnimatePresence, motion } from "motion/react";
import { Send } from "./animate-ui/icons/send";

interface ChatComponentProps {
  onClose?: () => void;
}

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  avatar: string;
  isSelf?: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "Alex",
      message: "Amarillo",
      timestamp: new Date(Date.now() - 30000),
      avatar: "red",
    },
    {
      id: "2",
      sender: "Maria",
      message: "Torpe",
      timestamp: new Date(Date.now() - 20000),
      avatar: "blue",
    },
    {
      id: "3",
      sender: "Carlos",
      message: "Extraordinario",
      timestamp: new Date(Date.now() - 10000),
      avatar: "green",
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: "Tú",
      message: newMessage.trim(),
      timestamp: new Date(),
      avatar: "cyan",
      isSelf: true,
    };
    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

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

      {/* Mensajes  */}
      <CardContent className="flex flex-col flex-1 min-h-0 p-4">
        {/* Mensajes  scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={
                  msg.isSelf
                    ? { opacity: 1, y: [10, -5, 0], scale: [1.2, 0.95, 1] }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{
                  duration: msg.isSelf ? 0.3 : 0.2,
                  ease: "easeOut",
                }}
                className={`flex gap-3 ${
                  msg.isSelf ? "justify-end" : "justify-start"
                }`}
              >
                {!msg.isSelf && (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                      msg.avatar === "red"
                        ? "bg-red-500"
                        : msg.avatar === "blue"
                        ? "bg-blue-500"
                        : msg.avatar === "green"
                        ? "bg-green-500"
                        : msg.avatar === "yellow"
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-purple-500"
                    }`}
                  >
                    😊
                  </div>
                )}
                <div className="flex flex-col max-w-[70%]">
                  {!msg.isSelf && (
                    <span className="text-muted-foreground text-sm font-medium">
                      {msg.sender} • {formatTime(msg.timestamp)}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl break-words text-sm shadow-sm ${
                      msg.isSelf
                        ? "bg-accent text-white self-end rounded-br-none"
                        : "bg-white dark:bg-gray-700 text-foreground dark:text-white rounded-bl-none border border-border/40"
                    }`}
                  >
                    {msg.message}
                  </div>
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
