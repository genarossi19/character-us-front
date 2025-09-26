import type React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface QuickJoinScreenProps {
  onJoin: () => void;
  onBack: () => void;
}

const QuickJoinScreen: React.FC<QuickJoinScreenProps> = ({
  onJoin,
  onBack,
}) => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length >= 4 && playerName.trim()) {
      onJoin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2 animate-bounce-in">
          <Button
            onClick={onBack}
            variant="ghost"
            className="absolute top-4 left-4 text-white hover:bg-white/10"
          >
            ← Volver
          </Button>

          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent to-secondary rounded-3xl flex items-center justify-center text-3xl shadow-2xl">
            🚀
          </div>
          <h1 className="text-3xl font-bold text-white text-balance">
            Unirse Rápido
          </h1>
          <p className="text-white/80 text-pretty">
            Ingresa el código de la sala y tu nombre para jugar
          </p>
        </div>

        <Card className="border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">
              Datos de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white font-medium">Código de Sala</label>
                <Input
                  type="text"
                  placeholder="Ej: ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-center text-2xl font-bold tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">Tu Nombre</label>
                <Input
                  type="text"
                  placeholder="Ingresa tu nombre"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-lg"
                  maxLength={20}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={roomCode.length < 4 || !playerName.trim()}
                className="w-full bg-success hover:bg-success/90 text-white font-bold py-4 text-lg rounded-2xl disabled:opacity-50"
              >
                🎮 Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickJoinScreen;
