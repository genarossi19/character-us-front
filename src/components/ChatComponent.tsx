import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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
      message: "¿Alguien vio algo sospechoso?",
      timestamp: new Date(Date.now() - 30000),
      avatar: "red",
    },
    {
      id: "2",
      sender: "Maria",
      message: "Vi a Carlos cerca del laboratorio...",
      timestamp: new Date(Date.now() - 20000),
      avatar: "blue",
    },
    {
      id: "3",
      sender: "Carlos",
      message: "¡Yo estaba haciendo tareas! 😤",
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
    <Card className="flex flex-col h-full w-full bg-gray-800 border border-gray-700 shadow-lg rounded-none">
      {/* Header */}
      <CardHeader className="flex items-center justify-between p-4 border-b border-gray-700">
        <CardTitle className="text-white text-lg font-bold">
          💬 Chat de la Partida
        </CardTitle>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white hover:bg-gray-700 h-8 w-8 p-0"
          >
            ✕
          </Button>
        )}
      </CardHeader>

      {/* Mensajes + Input */}
      <CardContent className="flex flex-col flex-1 min-h-0 p-4">
        {/* Mensajes con scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
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
                      ? "bg-yellow-400"
                      : "bg-purple-500"
                  }`}
                >
                  😊
                </div>
              )}
              <div className="flex flex-col max-w-[70%]">
                {!msg.isSelf && (
                  <span className="text-gray-300 text-sm font-semibold">
                    {msg.sender} • {formatTime(msg.timestamp)}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl break-words text-sm ${
                    msg.isSelf
                      ? "bg-cyan-500 text-white self-end rounded-br-none"
                      : "bg-gray-700 text-white rounded-bl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
              {msg.isSelf && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm bg-cyan-500">
                  😊
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-2xl bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 px-4 py-2"
            maxLength={200}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 rounded-2xl"
          >
            📤
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatComponent;
