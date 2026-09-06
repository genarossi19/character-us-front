import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { useRoomStore } from "@/store/useRoomStore";

export default function QuickJoinScreenV2() {
  const navigate = useNavigate();
  const { joinRoom } = useSocketRoom();
  const setCurrentPlayer = useRoomStore((s) => s.setCurrentPlayer);

  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [joining, setJoining] = useState(false);

  const isValid = roomCode.length === 6 && username.trim().length >= 2;

  const handleJoin = () => {
    if (!isValid) return;
    setJoining(true);

    // Crear jugador invitado temporal
    setCurrentPlayer({
      id: `guest-${Date.now()}`,
      username: username.trim(),
      avatar: `/avatar${Math.floor(Math.random() * 8) + 1}.webp`,
      isHost: false,
      isGuest: true,
      isAlive: true,
      isOnline: true,
    });

    joinRoom({
      code: roomCode,
      username: username.trim(),
      isGuest: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleJoin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            onClick={() => navigate(-1)}
            size="lg"
            variant="ghost"
            className="text-light hover:bg-accent/20 text-lg font-semibold transition-colors"
          >
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            variant="ghost"
            className="text-light hover:bg-accent/20 text-lg font-semibold transition-colors"
          >
            Log In
          </Button>
          <ThemeToggleButton className="text-light" />
        </div>
      </header>

      <BackgroundAnimate />
      <Card className="border-none bg-card min-w-[320px] w-md animate-bounce-in">
        <CardHeader>
          <CardTitle className="flex flex-col text-center justify-center items-center gap-4">
            <img
              src="/logo.webp"
              alt="logo"
              className="w-24 h-24 rounded-md"
            />
            <span className="text-3xl font-fredoka font-bolds">
              Unirse a una Sala
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Tu nombre
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="¿Cómo te llamas?"
                maxLength={20}
                className="text-center text-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="roomCode"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Código de sala
              </label>
              <Input
                id="roomCode"
                value={roomCode}
                onChange={(e) =>
                  setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                className="text-center !text-foreground/70 !text-3xl border-2 !tracking-widest !font-bold h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={!isValid || joining}
              variant="secondary"
              className="h-12"
            >
              <span className="text-xl">
                {joining ? "Uniéndose..." : "Ingresar"}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
