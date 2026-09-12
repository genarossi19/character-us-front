import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { toast } from "sonner";

export default function QuickJoinScreenV2() {
  const navigate = useNavigate();
  const { joinRoom } = useSocketRoom();
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [joining, setJoining] = useState(false);
  const [password, setPassword] = useState("");

  const playerName = isLoggedIn && user ? user.username : username.trim();
  const isValid = roomCode.length === 6 && playerName.length >= 2;

  const handleJoin = async () => {
    if (!isValid) return;
    setJoining(true);
    try {
      await joinRoom({
        code: Number(roomCode),
        username: isLoggedIn && user ? user.username : username.trim(),
        isGuest: !isLoggedIn,
        avatarUrl: user?.avatarUrl,
        userId: isLoggedIn ? user?.id : undefined,
        password: password || undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo unir a la sala");
    } finally {
      setJoining(false);
    }
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
                value={isLoggedIn && user ? user.username : username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="¿Cómo te llamas?"
                maxLength={20}
                disabled={isLoggedIn}
                className="text-center text-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Contraseña (si la sala es privada)
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
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
