import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ChatComponent from "../components/ChatComponent";

interface GameScreenProps {
  gameData: any;
  onStartVoting: () => void;
}

const characters = [
  "Detective",
  "Médico",
  "Científico",
  "Ingeniero",
  "Capitán",
  "Piloto",
  "Guardia",
  "Mecánico",
  "Cocinero",
  "Artista",
];

const GameScreen: React.FC<GameScreenProps> = ({ gameData, onStartVoting }) => {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos de discusión
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onStartVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStartVoting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentCharacter =
    gameData.currentUser.character ||
    characters[Math.floor(Math.random() * characters.length)];
  const isImpostor = gameData.currentUser.isImpostor || Math.random() < 0.3;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con timer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/30 px-4 py-2 text-lg"
            >
              Sala: {gameData.roomCode}
            </Badge>
            <div
              className={`px-6 py-3 rounded-2xl font-bold text-xl ${
                timeLeft > 60
                  ? "bg-success"
                  : timeLeft > 30
                  ? "bg-warning"
                  : "bg-danger"
              } text-white`}
            >
              ⏰ {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Tarjeta de personaje */}
        <Card
          className={`border-white/20 backdrop-blur-md ${
            isImpostor ? "bg-red-500/20" : "bg-blue-500/20"
          }`}
        >
          <CardHeader className="text-center">
            <CardTitle
              className={`text-3xl font-bold ${
                isImpostor ? "text-red-300" : "text-blue-300"
              }`}
            >
              {isImpostor ? "🔪 IMPOSTOR" : `👤 ${currentCharacter}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div
              className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl ${
                isImpostor ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {isImpostor ? "😈" : "😊"}
            </div>
            <p
              className={`text-lg font-medium ${
                isImpostor ? "text-red-200" : "text-blue-200"
              }`}
            >
              {isImpostor
                ? "Tu objetivo es eliminar a todos sin ser descubierto"
                : "Tu objetivo es descubrir y votar al impostor"}
            </p>
          </CardContent>
        </Card>

        {/* Lista de jugadores */}
        <Card className="border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Jugadores en la Partida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gameData.players
                .filter((p: any) => p.isAlive)
                .map((player: any) => (
                  <div key={player.id} className="text-center space-y-2">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl ${
                        player.avatar === "red"
                          ? "bg-red-500"
                          : player.avatar === "blue"
                          ? "bg-blue-500"
                          : player.avatar === "green"
                          ? "bg-green-500"
                          : player.avatar === "yellow"
                          ? "bg-yellow-500"
                          : player.avatar === "purple"
                          ? "bg-purple-500"
                          : player.avatar === "orange"
                          ? "bg-orange-500"
                          : player.avatar === "pink"
                          ? "bg-pink-500"
                          : "bg-cyan-500"
                      }`}
                    >
                      😊
                    </div>
                    <p className="text-white font-medium">{player.name}</p>
                    {player.id === gameData.currentUser.id && (
                      <Badge className="bg-accent text-white">Tú</Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => setShowChat(!showChat)}
            className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-3 rounded-2xl"
          >
            💬 {showChat ? "Ocultar Chat" : "Abrir Chat"}
          </Button>

          <Button
            onClick={onStartVoting}
            className="bg-warning hover:bg-warning/90 text-white font-bold px-8 py-3 rounded-2xl"
          >
            🗳️ Iniciar Votación
          </Button>
        </div>

        {/* Chat Component */}
        {showChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md">
              <ChatComponent onClose={() => setShowChat(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
