import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { AlertCircle } from "lucide-react";

type Step = "code" | "password" | "name";

const JOIN_TIMEOUT_MS = 20_000;

export default function QuickJoinScreenV2() {
  const navigate = useNavigate();
  const { joinRoom } = useSocketRoom();
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  const [step, setStep] = useState<Step>("code");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearError = () => setErrorMsg(null);

  const joinWithTimeout = useCallback(
    async (payload: Parameters<typeof joinRoom>[0]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          controller.abort();
          reject(new Error("TIMEOUT"));
        }, JOIN_TIMEOUT_MS);
        controller.signal.addEventListener("abort", () => clearTimeout(id));
      });

      return Promise.race([joinRoom(payload), timeoutPromise]);
    },
    [joinRoom]
  );

  const handleCodeSubmit = async () => {
    if (roomCode.length !== 6) return;
    clearError();
    setJoining(true);
    try {
      await joinWithTimeout({
        code: Number(roomCode),
        username: isLoggedIn && user ? user.username : "temp",
        isGuest: !isLoggedIn,
        userId: isLoggedIn ? user?.id : undefined,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg === "TIMEOUT") {
        setErrorMsg("La sala no responde. Verifica el código e intenta de nuevo.");
        setStep("code");
      } else if (msg.toLowerCase().includes("conexión") || msg.toLowerCase().includes("conexion")) {
        setErrorMsg(msg);
      } else if (
        msg.toLowerCase().includes("contraseña") ||
        msg.toLowerCase().includes("password")
      ) {
        setNeedsPassword(true);
        setStep("password");
      } else if (
        msg.toLowerCase().includes("no encontr") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("existe")
      ) {
        setErrorMsg("No se encontró la sala. Verifica el código.");
        setStep("code");
      } else {
        setErrorMsg(msg || "No se pudo unir a la sala.");
      }
    } finally {
      setJoining(false);
    }
  };

  const handlePasswordSubmit = async () => {
    clearError();
    setJoining(true);
    try {
      await joinWithTimeout({
        code: Number(roomCode),
        username: isLoggedIn && user ? user.username : "temp",
        isGuest: !isLoggedIn,
        userId: isLoggedIn ? user?.id : undefined,
        password,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg === "TIMEOUT") {
        setErrorMsg("La sala no responde. Intenta de nuevo.");
        setStep("code");
      } else if (msg.toLowerCase().includes("conexión") || msg.toLowerCase().includes("conexion")) {
        setErrorMsg(msg);
      } else if (
        msg.toLowerCase().includes("contraseña") ||
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("incorrecta") ||
        msg.toLowerCase().includes("invalid")
      ) {
        setErrorMsg("Contraseña incorrecta. Intenta de nuevo.");
      } else if (
        msg.toLowerCase().includes("no encontr") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("existe")
      ) {
        setErrorMsg("No se encontró la sala. Verifica el código.");
        setStep("code");
      } else {
        setErrorMsg(msg || "No se pudo unir a la sala.");
      }
    } finally {
      setJoining(false);
    }
  };

  const handleNameSubmit = async () => {
    const playerName = username.trim();
    if (playerName.length < 2) return;
    clearError();
    setJoining(true);
    try {
      await joinWithTimeout({
        code: Number(roomCode),
        username: playerName,
        isGuest: !isLoggedIn,
        userId: isLoggedIn ? user?.id : undefined,
        password: needsPassword ? password : undefined,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg === "TIMEOUT") {
        setErrorMsg("La sala no responde. Intenta de nuevo.");
        setStep("code");
      } else if (msg.toLowerCase().includes("conexión") || msg.toLowerCase().includes("conexion")) {
        setErrorMsg(msg);
      } else if (
        msg.toLowerCase().includes("contraseña") ||
        msg.toLowerCase().includes("password")
      ) {
        setNeedsPassword(true);
        setStep("password");
      } else if (
        msg.toLowerCase().includes("no encontr") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("existe")
      ) {
        setErrorMsg("No se encontró la sala. Verifica el código.");
        setStep("code");
      } else {
        setErrorMsg(msg || "No se pudo unir a la sala.");
      }
    } finally {
      setJoining(false);
    }
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roomCode.length === 6) {
      e.preventDefault();
      if (isLoggedIn) {
        handleCodeSubmit();
      } else {
        setStep("name");
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && username.trim().length >= 2) {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePasswordSubmit();
    }
  };

  const ErrorBanner = () => {
    if (!errorMsg) return null;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{errorMsg}</span>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case "code":
        return (
          <CardContent>
            <div className="flex flex-col gap-4">
              <ErrorBanner />
              <div>
                <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Codigo de Sala
                </label>
                <Input
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    clearError();
                  }}
                  onKeyDown={handleCodeKeyDown}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="text-center text-foreground !text-3xl border-2 !tracking-widest !font-bold h-12"
                />
              </div>
              <Button
                onClick={() => {
                  if (isLoggedIn) {
                    handleCodeSubmit();
                  } else {
                    setStep("name");
                  }
                }}
                disabled={roomCode.length !== 6 || joining}
                variant="secondary"
                className="h-12"
              >
                <span className="text-xl">
                  {joining ? "Uniéndose..." : "Ingresar"}
                </span>
              </Button>
            </div>
          </CardContent>
        );

      case "name":
        return (
          <CardContent>
            <div className="flex flex-col gap-4">
              <ErrorBanner />
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
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  onKeyDown={handleNameKeyDown}
                  placeholder="¿Cómo te llamas?"
                  maxLength={20}
                  autoFocus
                  className="text-center text-foreground"
                />
              </div>
              <Button
                onClick={handleNameSubmit}
                disabled={username.trim().length < 2 || joining}
                variant="secondary"
                className="h-12"
              >
                <span className="text-xl">
                  {joining ? "Uniéndose..." : "Ingresar"}
                </span>
              </Button>
            </div>
          </CardContent>
        );

      case "password":
        return (
          <CardContent>
            <div className="flex flex-col gap-4">
              <ErrorBanner />
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Contraseña de la sala
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  onKeyDown={handlePasswordKeyDown}
                  placeholder="Ingresa la contraseña"
                  autoFocus
                  className="text-center text-foreground"
                />
              </div>
              <Button
                onClick={handlePasswordSubmit}
                disabled={password.length === 0 || joining}
                variant="secondary"
                className="h-12"
              >
                <span className="text-xl">
                  {joining ? "Uniéndose..." : "Ingresar"}
                </span>
              </Button>
            </div>
          </CardContent>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case "code":
        return "Ingresar a una Sala";
      case "name":
        return "¿Cómo te llamas?";
      case "password":
        return "Sala Privada";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "code":
        return undefined;
      case "name":
        return "Ingresa tu nombre para unirte a la partida";
      case "password":
        return "Esta sala requiere una contraseña";
    }
  };

  const handleBack = () => {
    clearError();
    if (step === "code") {
      navigate(-1);
    } else if (step === "password") {
      setStep("code");
      setPassword("");
    } else {
      setStep(needsPassword ? "password" : "code");
      setUsername("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            onClick={handleBack}
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
            <span className="text-3xl font-fredoka font-bold">
              {getTitle()}
            </span>
            {getSubtitle() && (
              <span className="text-sm text-muted-foreground -mt-2">
                {getSubtitle()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {renderStep()}
      </Card>
    </div>
  );
}
