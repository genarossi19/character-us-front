import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoomStore } from "@/store/useRoomStore";
import {
  emitRenewRoomInactivity,
  onRoomInactivityRenewed,
  onRoomInactivityWarning,
} from "@/services/socket";
import type { RoomInactivityWarningEvent } from "@/types/game";

interface ActiveWarning extends RoomInactivityWarningEvent {
  expiresAtMs: number;
}

function toExpirationMs(expiresAt: string | number, remainingMs: number): number {
  if (typeof expiresAt === "number") {
    return expiresAt < 10_000_000_000 ? expiresAt * 1_000 : expiresAt;
  }

  const parsed = Date.parse(expiresAt);
  return Number.isNaN(parsed) ? Date.now() + remainingMs : parsed;
}

function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function renewalErrorMessage(code: string, fallback: string): string {
  switch (code) {
    case "NOT_HOST":
      return "Solo el anfitrión puede mantener la sala activa.";
    case "ROOM_NOT_WAITING":
      return "La sala ya no está esperando jugadores.";
    case "ROOM_NOT_FOUND":
      return "La sala ya no está disponible.";
    default:
      return fallback || "No se pudo extender la sala.";
  }
}

/** Global room-lifecycle feedback. Timers remain server-authoritative. */
export default function RoomInactivityWarning() {
  const roomId = useRoomStore((state) => state.room?.id ?? null);
  const currentPlayer = useRoomStore((state) => state.currentPlayer);
  const [warning, setWarning] = useState<ActiveWarning | null>(null);
  const [now, setNow] = useState(Date.now());
  const [renewing, setRenewing] = useState(false);
  const roomIdRef = useRef(roomId);
  const warningRef = useRef<ActiveWarning | null>(null);

  const clearWarning = () => {
    warningRef.current = null;
    setWarning(null);
    setRenewing(false);
  };

  useEffect(() => {
    roomIdRef.current = roomId;
    if (warningRef.current && warningRef.current.roomId !== roomId) {
      clearWarning();
    }
  }, [roomId]);

  useEffect(() => {
    if (!warning) return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [warning]);

  useEffect(() => {
    const cleanups = [
      onRoomInactivityWarning((data) => {
        if (data.roomId !== roomIdRef.current) return;

        const nextWarning = {
          ...data,
          expiresAtMs: toExpirationMs(data.expiresAt, data.remainingMs),
        };
        warningRef.current = nextWarning;
        setWarning(nextWarning);
        setNow(Date.now());
      }),
      onRoomInactivityRenewed((data) => {
        if (data.roomId !== roomIdRef.current) return;

        const hadWarning = warningRef.current?.roomId === data.roomId;
        clearWarning();
        if (hadWarning) toast.success("La sala permanecerá activa durante otros 40 minutos.");
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const handleRenew = () => {
    if (!warning || !currentPlayer?.isHost || renewing) return;

    setRenewing(true);
    emitRenewRoomInactivity({ roomId: warning.roomId }, (response) => {
      if (!response.success) {
        setRenewing(false);
        toast.error(renewalErrorMessage(response.code, response.message));
        return;
      }

      clearWarning();
      toast.success("La sala permanecerá activa durante otros 40 minutos.");
    });
  };

  if (!warning) return null;

  const remainingMs = Math.max(0, warning.expiresAtMs - now);

  return (
    <section
      aria-live="assertive"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl rounded-xl border border-amber-500/50 bg-card p-5 shadow-2xl"
    >
      <div className="flex gap-4">
        <AlertTriangle className="mt-1 size-6 shrink-0 text-amber-500" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">La sala se cerrará por inactividad</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quedan <span className="font-semibold text-foreground">{formatRemaining(remainingMs)}</span> para que la sala se cierre.
            </p>
          </div>

          {currentPlayer?.isHost ? (
            <Button onClick={handleRenew} disabled={renewing} className="w-full sm:w-auto">
              <RefreshCw className={renewing ? "animate-spin" : undefined} />
              {renewing ? "Extendiendo..." : "Mantener sala activa 40 minutos"}
            </Button>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" aria-hidden="true" />
              Solo el anfitrión puede extender la sala.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
