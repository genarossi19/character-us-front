import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Gamepad2, Plus, RefreshCw, Search, Users } from "lucide-react";
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
import NavBarLoggued from "@/components/NavBarLoggued";

const MODE_LABELS = { classic: "Clásico", anonymous: "Anónimo" } as const;
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
      <NavBarLoggued />

      <main className="page-container space-y-5 pb-8 pt-24 sm:space-y-6">
        <div className="space-y-2">
          <Link to="/menu" className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            <ArrowLeft className="size-4" aria-hidden="true" /> Volver al menú
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Gamepad2 className="size-6" aria-hidden="true" />
              </span>
              Salas públicas
            </h1>
            <Button type="button" variant="outline" size="lg" className="px-3 sm:px-4" onClick={() => setRefreshAttempt((attempt) => attempt + 1)}>
              <RefreshCw aria-hidden="true" /> Actualizar
            </Button>
          </div>
        </div>

        <div className="grid items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="room-search">Buscar sala o categoría</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="room-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-mode">Modalidad</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger id="room-mode" className="w-full data-[size=default]:h-11" size="default"><SelectValue /></SelectTrigger>
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
        {rooms?.length === 0 && !listError && (
          <section aria-labelledby="public-rooms-empty-title" className="grid overflow-hidden rounded-2xl border border-accent/25 bg-linear-to-br from-card via-card to-accent/15 shadow-sm md:grid-cols-[1fr_1fr]">
            <div className="flex flex-col items-start justify-center px-6 pb-7 pt-2 sm:px-9 md:py-10 lg:px-12">
              <h2 id="public-rooms-empty-title" className="max-w-md text-2xl font-extrabold tracking-tight sm:text-3xl">
                No hay salas públicas disponibles
              </h2>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
                Abre una sala y deja que otros jugadores se unan desde el listado.
              </p>
              <Button asChild size="lg" className="mt-5 h-11 w-full gap-2 px-5 text-base sm:w-auto">
                <Link to="/create?privacy=public"><Plus className="size-5" aria-hidden="true" />Crear sala pública</Link>
              </Button>
            </div>

            <div aria-hidden="true" className="relative order-first mx-auto h-40 w-full max-w-md md:order-last md:h-full md:min-h-64">
              <div className="absolute inset-x-[14%] inset-y-[12%] -rotate-6 rounded-[50%] border border-dashed border-accent/45 bg-accent/10" />
              <div className="absolute inset-x-[22%] inset-y-[23%] rotate-6 rounded-[50%] border border-accent/25" />
              <span className="absolute left-[16%] top-[15%] text-xl text-accent md:text-3xl">✦</span>
              <span className="absolute bottom-[16%] right-[14%] text-lg text-warning md:text-2xl">✧</span>
              <img src="/avatar7.webp" alt="" className="absolute bottom-[14%] left-[15%] w-[27%] max-w-28 -rotate-12 object-contain drop-shadow-lg md:max-w-36" />
              <img src="/avatar8.webp" alt="" className="absolute bottom-[14%] right-[15%] w-[26%] max-w-28 rotate-12 object-contain drop-shadow-lg md:max-w-36" />
              <img src="/avatar1.webp" alt="" className="absolute bottom-[8%] left-1/2 w-[35%] max-w-32 -translate-x-1/2 rotate-3 object-contain drop-shadow-lg md:max-w-44" />
            </div>
          </section>
        )}
        {rooms && rooms.length > 0 && !filteredRooms.length && !listError && (
          <p role="status" className="rounded-xl border border-dashed border-border bg-card/60 px-5 py-10 text-center text-muted-foreground">
            No hay salas que coincidan con la búsqueda.
          </p>
        )}
        {filteredRooms.length > 0 && (
          <ul aria-label="Salas disponibles" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <li key={room.id} className="min-w-0">
                <Card className="h-full gap-4">
                  <CardHeader>
                    <CardTitle className="break-words text-xl">{room.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{categoryNames.get(room.categoryId) ?? "Categoría no disponible"}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Gamepad2 className="size-4 shrink-0" aria-hidden="true" />
                        {MODE_LABELS[room.mode]} · En línea
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
