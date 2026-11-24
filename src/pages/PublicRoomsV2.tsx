import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Gamepad2, RefreshCw, Search, Users } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useSocketRoom, SocketAckError } from "@/hooks/useSocketRoom";
import { ApiError } from "@/services/api/client";
import { fetchCategories, type Category } from "@/services/api/category";
import { fetchPublicRooms, type PublicRoomSummary } from "@/services/api/rooms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";

const MODE_LABELS = { classic: "Clásico", anonymous: "Anónimo", special: "Especial" } as const;
const REFRESH_INTERVAL_MS = 5_000;

export default function PublicRoomsV2() {
  const navigate = useNavigate();
  const { user, token, logout } = useUserStore();
  const { joinRoom } = useSocketRoom();
  const [rooms, setRooms] = useState<PublicRoomSummary[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("all");
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const joiningRef = useRef(false);

  useEffect(() => {
    let active = true;
    void fetchCategories().then((catalog) => {
      if (active) setCategories(catalog);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function refresh() {
      try {
        await useUserStore.getState().renewGoogleSession();
        if (controller.signal.aborted) return;
        const availableRooms = await fetchPublicRooms(controller.signal);
        if (controller.signal.aborted) return;
        setRooms(availableRooms);
        setListError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setListError("No pudimos actualizar las salas públicas.");
      }
      timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
    }

    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [token, refreshAttempt, logout, navigate]);

  async function handleJoinRoom(room: PublicRoomSummary) {
    if (!user || !token || joiningRef.current) return;
    joiningRef.current = true;
    setJoiningRoomId(room.id);
    setJoinError(null);
    try {
      await joinRoom({ code: room.code, listedRoomId: room.id, username: user.username, token });
    } catch (error) {
      if (error instanceof SocketAckError && (error.code === "AUTH_REQUIRED" || error.code === "AUTH_INVALID")) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setJoinError(error instanceof Error ? error.message : "No pudimos unirte a la sala.");
      setRefreshAttempt((attempt) => attempt + 1);
    } finally {
      joiningRef.current = false;
      setJoiningRoomId(null);
    }
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const query = search.trim().toLocaleLowerCase();
  const filteredRooms = rooms?.filter((room) =>
    (mode === "all" || room.mode === mode) &&
    (!query || room.name.toLocaleLowerCase().includes(query) ||
      categoryNames.get(room.categoryId)?.toLocaleLowerCase().includes(query))
  ) ?? [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 page-gutter">
          <Button variant="ghost" asChild>
            <Link to="/menu"><ArrowLeft aria-hidden="true" /> Volver</Link>
          </Button>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 page-padding">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">Salas públicas</h1>
          <Button variant="outline" onClick={() => setRefreshAttempt((attempt) => attempt + 1)}>
            <RefreshCw aria-hidden="true" /> Actualizar
          </Button>
        </div>

        <div className="grid items-end gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="space-y-2">
            <Label htmlFor="room-search">Buscar sala o categoría</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="room-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-mode">Modalidad</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger id="room-mode" className="w-full" size="default"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(MODE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {listError && <p role="alert" className="text-sm text-danger">{listError}</p>}
        {joinError && <p role="alert" className="text-sm text-danger">{joinError}</p>}
        {!rooms && !listError && <p role="status" className="py-8 text-center text-muted-foreground">Buscando salas públicas…</p>}
        {rooms && !filteredRooms.length && !listError && (
          <section className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <p role="status" className="text-muted-foreground">
              {rooms.length ? "No hay salas que coincidan con la búsqueda." : "Por ahora no hay salas públicas disponibles."}
            </p>
            {!rooms.length && <Button variant="outline" className="mt-4" asChild><Link to="/create">Crear partida</Link></Button>}
          </section>
        )}
        {filteredRooms.length > 0 && (
          <ul aria-label="Salas disponibles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <li key={room.id}>
                <Card className="h-full gap-4">
                  <CardHeader>
                    <CardTitle className="break-words text-xl">{room.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{categoryNames.get(room.categoryId) ?? "Categoría no disponible"}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Gamepad2 className="size-4 shrink-0" aria-hidden="true" />
                        {MODE_LABELS[room.mode]} · {room.playMode === "in_person" ? "Presencial" : "En línea"}
                      </p>
                      <p className="flex items-center gap-2"><Users className="size-4 shrink-0" aria-hidden="true" />
                        {room.playerCount} / {room.maxPlayers} jugadores · {room.impostorCount} {room.impostorCount === 1 ? "impostor" : "impostores"}
                      </p>
                    </div>
                    <Button className="mt-auto w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={joiningRoomId !== null} onClick={() => void handleJoinRoom(room)}>
                      {joiningRoomId === room.id ? "Uniéndose…" : "Unirse"}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
