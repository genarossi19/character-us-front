"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ChatComponentProps {
  onClose: () => void;
}

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  avatar: string;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: "Tú",
        message: newMessage.trim(),
        timestamp: new Date(),
        avatar: "red",
      };
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-white/20 bg-white/10 backdrop-blur-md h-96 flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-white text-lg">
          💬 Chat de Discusión
        </CardTitle>
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          ✕
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 p-4">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  msg.avatar === "red"
                    ? "bg-red-500"
                    : msg.avatar === "blue"
                    ? "bg-blue-500"
                    : msg.avatar === "green"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              >
                😊
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">
                    {msg.sender}
                  </span>
                  <span className="text-white/50 text-xs">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className="bg-white/10 rounded-lg px-3 py-2">
                  <p className="text-white text-sm">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
            maxLength={200}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-accent hover:bg-accent/90 text-white px-4"
          >
            📤
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatComponent;
