import { useRoomSessionStore } from "@/store/useRoomSessionStore";
import { Button } from "@/components/ui/button";

export default function RoomRecoveryScreen({ onRetry }: { onRetry: () => void }) {
  const { status, error } = useRoomSessionStore();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md space-y-4 text-center" role="status">
        <h1 className="text-2xl font-semibold">Recuperando partida</h1>
        <p className="text-muted-foreground">
          {error || "Estamos restableciendo tu lugar en la sala. Los turnos siguen corriendo."}
        </p>
        <p className="text-sm text-muted-foreground">Puedes volver durante los 60 segundos posteriores a la desconexión.</p>
        <Button onClick={onRetry} disabled={status === "recovering"}>
          {status === "recovering" ? "Recuperando..." : "Reintentar conexión"}
        </Button>
      </div>
    </main>
  );
}
