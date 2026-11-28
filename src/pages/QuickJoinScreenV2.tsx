import { useState, useRef, useCallback } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { FormActionButton } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import RoomCodeInput from "@/components/RoomCodeInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { AccessHeader } from "@/components/AccessHeader";
import { SocketAckError, useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { getDisplayName } from "@/lib/displayName";
import { AlertCircle, ArrowRight, Hash, LoaderCircle, LockKeyhole, Users } from "lucide-react";

type Step = "code" | "password" | "name";

const JOIN_TIMEOUT_MS = 20_000;

const ROOM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function QuickJoinScreenV2() {
  const { roomId } = useParams();
  if (roomId && !ROOM_ID.test(roomId)) {
    return <Navigate to="/join" replace state={{ invalidInvite: true }} />;
  }
  return <JoinRoomForm key={roomId ?? "manual"} inviteRoomId={roomId} />;
}

function JoinRoomForm({ inviteRoomId }: { inviteRoomId?: string }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { joinRoom } = useSocketRoom();
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const token = useUserStore((s) => s.token);
  const isSessionReady = useUserStore((s) => s.isSessionReady);
  const [step, setStep] = useState<Step>(inviteRoomId ? "name" : "code");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    state?.invalidInvite ? "El enlace de invitación no es válido. Puedes ingresar el código de la sala." : null
  );
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

      return Promise.race([joinRoom(payload), timeoutPromise]).finally(() => controller.abort());
    },
    [joinRoom]
  );

  const submitJoin = async () => {
    if (joining || !isSessionReady || (!inviteRoomId && roomCode.length !== 6)) return;
    const playerName = isLoggedIn && user ? user.username : username.trim();
    if (playerName.length < 2 || (step === "password" && !password)) return;

    clearError();
    setJoining(true);
    try {
      const target = inviteRoomId ? { inviteRoomId } : { code: Number(roomCode) };
      await joinWithTimeout({
        ...target,
        username: playerName,
        token: isLoggedIn ? token || undefined : undefined,
        password: step === "password" ? password : undefined,
      });
    } catch (error) {
      const code = error instanceof SocketAckError ? error.code : undefined;
      if (code === "WRONG_PASSWORD") {
        if (step === "password") setErrorMsg("Contraseña incorrecta. Intenta de nuevo.");
        setStep("password");
      } else if (code === "ROOM_NOT_FOUND") {
        if (!inviteRoomId) setStep("code");
        setErrorMsg(inviteRoomId ? "La sala de esta invitación ya no está disponible." : "No se encontró la sala. Verifica el código.");
      } else if (error instanceof Error && error.message === "TIMEOUT") {
        setErrorMsg("La sala no responde. Intenta de nuevo.");
      } else {
        setErrorMsg(error instanceof Error ? error.message : "No se pudo unir a la sala.");
      }
    } finally {
      setJoining(false);
    }
  };

  const handleCodeContinue = () => {
    if (roomCode.length !== 6 || joining || !isSessionReady) return;
    if (isLoggedIn) void submitJoin();
    else setStep("name");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (step === "code") handleCodeContinue();
    else void submitJoin();
  };

  const submitLabel = joining ? "Uniéndose…" : step === "code" && !isLoggedIn ? "Continuar" : "Unirme a la sala";

  const ErrorBanner = () => {
    if (!errorMsg) return null;
    return (
      <div id="join-error" role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{errorMsg}</span>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case "code":
        return (
          <CardContent className="sm:px-10">
            <div className="flex flex-col gap-4">
              <ErrorBanner />
              <div>
                <label
                  htmlFor="roomCode"
                  className="block text-base font-medium text-muted-foreground mb-2 sm:text-lg"
                >
                  Código de sala
                </label>
                <RoomCodeInput
                  value={roomCode}
                  onChange={(value) => { setRoomCode(value); clearError(); }}
                  onKeyDown={handleKeyDown}
                  invalid={Boolean(errorMsg)}
                  disabled={joining}
                />
              </div>
              <FormActionButton tone="accent"
                onClick={handleCodeContinue}
                disabled={roomCode.length !== 6 || joining || !isSessionReady}
              >
                {joining ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                <span>{submitLabel}</span>
                {!joining && <ArrowRight className="size-4" aria-hidden="true" />}
              </FormActionButton>
            </div>
          </CardContent>
        );

      case "name":
        return (
          <CardContent className="sm:px-10">
            <div className="flex flex-col gap-4">
              <ErrorBanner />
              {isLoggedIn ? (
                <p className="text-center text-muted-foreground">Entrarás como {getDisplayName(user)}</p>
              ) : <div>
                <label
                  htmlFor="username"
                  className="block text-base font-medium text-muted-foreground mb-2 sm:text-lg"
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
                  onKeyDown={handleKeyDown}
                  placeholder="¿Cómo te llamas?"
                  maxLength={20}
                  autoFocus
                  disabled={joining} className="h-14 bg-muted/30 !text-lg text-foreground sm:h-16 sm:!text-xl"
                />
              </div>}
              <FormActionButton tone="accent"
                onClick={() => void submitJoin()}
                disabled={(!isLoggedIn && username.trim().length < 2) || joining || !isSessionReady}
              >
                {joining ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                <span>{submitLabel}</span>
                {!joining && <ArrowRight className="size-4" aria-hidden="true" />}
              </FormActionButton>
            </div>
          </CardContent>
        );

      case "password":
        return (
          <CardContent className="sm:px-10">
            <div className="flex flex-col gap-4">
              <ErrorBanner />
              <div>
                <label
                  htmlFor="password"
                  className="block text-base font-medium text-muted-foreground mb-2 sm:text-lg"
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
                  onKeyDown={handleKeyDown}
                  placeholder="Ingresa la contraseña"
                  autoFocus
                  disabled={joining} className="h-14 bg-muted/30 !text-lg text-foreground sm:h-16 sm:!text-xl"
                />
              </div>
              <FormActionButton tone="accent"
                onClick={() => void submitJoin()}
                disabled={password.length === 0 || joining || !isSessionReady}
              >
                {joining ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                <span>{submitLabel}</span>
                {!joining && <ArrowRight className="size-4" aria-hidden="true" />}
              </FormActionButton>
            </div>
          </CardContent>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case "code":
        return "Unirse a una sala";
      case "name":
        return isLoggedIn ? "Unirse a la sala" : "¿Cómo te llamas?";
      case "password":
        return "Contraseña de la sala";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "code":
        return "Ingresa el código de 6 dígitos que te compartieron.";
      case "name":
        return isLoggedIn ? "Continúa para ingresar a la partida" : "Ingresa tu nombre para unirte a la partida";
      case "password":
        return "Esta sala requiere una contraseña";
    }
  };

  const handleBack = () => {
    clearError();
    if (step === "code") {
      navigate(-1);
    } else if (step === "password") {
      setStep(inviteRoomId || !isLoggedIn ? "name" : "code");
      setPassword("");
    } else if (inviteRoomId) {
      navigate("/join");
    } else {
      setStep("code");
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={`flex min-h-screen flex-col bg-background page-gutter pb-10 text-foreground ${isLoggedIn ? "pt-24" : "pt-28 sm:pt-24"}`}>
        <AccessHeader onBack={handleBack} showSignIn={!isLoggedIn} />
        <main className="mx-auto flex w-full max-w-xl flex-1 sm:max-w-2xl items-center py-6">
          <motion.div className="w-full" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="w-full gap-7 overflow-hidden border-accent/20 bg-card pb-7 pt-0 shadow-lg shadow-black/5 sm:pb-10">
              <div className="relative flex h-36 items-center justify-between overflow-hidden border-b border-accent/15 bg-accent/8 px-6 sm:h-44 sm:px-10">
                <div className="relative z-10 space-y-3">
                  <p className="text-2xl font-semibold tracking-tight sm:text-3xl">Character<span className="text-accent">Us</span></p>
                  <span className="inline-flex items-center gap-2 rounded-md border border-accent/20 bg-card/80 px-3 py-2 text-sm font-medium sm:text-base text-muted-foreground">
                    {step === "code" ? <Hash className="size-4 text-accent sm:size-5" aria-hidden="true" /> : step === "password" ? <LockKeyhole className="size-4 text-accent sm:size-5" aria-hidden="true" /> : <Users className="size-4 text-accent sm:size-5" aria-hidden="true" />}
                    {step === "code" ? "Código de sala" : step === "password" ? "Sala privada" : inviteRoomId ? "Invitación" : "Tu entrada"}
                  </span>
                </div>
                <div className="absolute -right-7 -top-10 size-48 rounded-full border border-accent/15" aria-hidden="true" />
                <div className="absolute right-2 top-0 size-32 rounded-full bg-accent/10" aria-hidden="true" />
                <motion.img src="/avatar1.webp" alt="" className="relative size-20 shrink-0 object-contain min-[380px]:size-28 sm:size-40" initial={reduced ? false : { rotate: -8, scale: 0.9 }} animate={{ rotate: 5, scale: 1 }} transition={{ duration: 0.5 }} />
              </div>
              <CardHeader className="gap-3 sm:px-10">
                <CardTitle><h1 className="text-3xl font-semibold sm:text-4xl">{getTitle()}</h1></CardTitle>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{getSubtitle()}</p>
                {!inviteRoomId && step !== "code" && <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground"><Hash className="size-4 text-accent" aria-hidden="true" />Sala <span className="font-semibold tracking-widest text-foreground">{roomCode}</span></p>}
              </CardHeader>
              <motion.div key={step} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                {renderStep()}
              </motion.div>
              {(joining || !isSessionReady) && <p role="status" className="px-6 text-sm text-muted-foreground sm:px-8">{joining ? "Esperando respuesta…" : "Verificando tu sesión…"}</p>}
            </Card>
            {!isLoggedIn && <p className="mt-6 flex items-start justify-center gap-2 text-sm text-muted-foreground"><Users className="size-3.5 shrink-0" aria-hidden="true" />Puedes entrar como invitado, sin crear una cuenta.</p>}
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}
