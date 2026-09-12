import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useUserStore } from "@/store/useUserStore";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { Users, Gamepad2, Search, LogOut, User } from "lucide-react";
import { toast } from "sonner";

// TODO: Replace when the backend exposes a public-room listing contract.
const mockRooms = [
  {
    id: "1",
    name: "Sala Magia Disney",
    category: "Disney",
    mode: "Clásico (1 Impostor)",
    creator: "Ana",
    currentPlayers: 5,
    maxPlayers: 8,
    img: "/disney.webp",
    code: 123456,
  },
  {
    id: "2",
    name: "Clash Royale Challenge",
    category: "Clash Royale",
    mode: "Especial (Pista)",
    creator: "Luis",
    currentPlayers: 0,
    maxPlayers: 8,
    img: "/clash-royale.webp",
    code: 789012,
  },
  {
    id: "3",
    name: "Los Simpson Trivia",
    category: "Los Simpson",
    mode: "Clásico (2 Impostores)",
    creator: "Carla",
    currentPlayers: 4,
    maxPlayers: 6,
    img: "/los-simpson.webp",
    code: 345678,
  },
];

export default function PublicRoomsV2() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const { joinRoom } = useSocketRoom();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [showEmpty, setShowEmpty] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleJoinRoom = async (roomCode: number) => {
    if (!user) return;

    try {
      await joinRoom({
        code: roomCode,
        username: user.username,
        isGuest: user.isGuest,
        userId: user.isGuest ? undefined : user.id,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo unir a la sala");
    }
  };

  const filteredRooms = mockRooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.category.toLowerCase().includes(search.toLowerCase());
    const matchesMode =
      modeFilter === "all" || room.mode.toLowerCase().includes(modeFilter);
    const matchesEmpty = showEmpty ? true : room.currentPlayers > 0;

    return matchesSearch && matchesMode && matchesEmpty;
  });

  return (
    <div className="bg-background min-h-screen flex flex-col transition-colors">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between bg-card shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/menu">
            <div className="flex items-center gap-4">
              <img className="h-12 w-12 rounded-md" src="/logo.webp" alt="" />
              <span className="text-5xl font-extrabold bg-gradient-to-b from-accent/60 via-accent/80 to-accent bg-clip-text text-transparent">
                CharacterUs
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/20 transition">
                <img
                  src={user?.avatarUrl || "/avatars/astronaut.webp"}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border-2 border-accent shadow"
                />
                <span className="font-semibold text-lg text-foreground">
                  {user?.username || "Jugador"}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-48 bg-card text-foreground border border-border shadow-md"
            >
              <DropdownMenuLabel className="text-foreground">
                Mi Cuenta
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="group flex items-center gap-2 text-foreground hover:bg-accent hover:text-light transition-colors"
              >
                <User className="h-4 w-4 text-foreground group-hover:text-light" />
                Perfil
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                variant="destructive"
                className="group flex items-center gap-2 text-foreground hover:bg-accent hover:text-light transition-colors"
              >
                <LogOut className="h-4 w-4 text-foreground group-hover:text-light" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggleButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 pt-24">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Encabezado */}
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-foreground">
              Salas Públicas
            </h1>
            <p className="text-lg text-muted-foreground">
              Filtra y encuentra la mejor sala para unirte
            </p>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="bg-card/70 border border-border shadow-sm rounded-lg p-6 space-y-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background text-foreground border-border"
                />
              </div>

              <div className="w-full md:w-1/3">
                <Label className="text-sm text-foreground">Modo de juego</Label>
                <Select
                  value={modeFilter}
                  onValueChange={(val) => setModeFilter(val)}
                >
                  <SelectTrigger className="w-full bg-background text-foreground border-border">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="clásico">Clásico</SelectItem>
                    <SelectItem value="anónimo">Anónimo</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3 flex items-center justify-start md:justify-end gap-2">
                <Label
                  htmlFor="empty-switch"
                  className="text-sm text-foreground"
                >
                  Mostrar vacías
                </Label>
                <Switch
                  id="empty-switch"
                  checked={showEmpty}
                  onCheckedChange={(val) => setShowEmpty(val)}
                />
              </div>
            </div>
          </div>

          {/* Lista de salas */}
          {filteredRooms.length > 0 ? (
            <motion.div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-xl transition border-border bg-card text-foreground relative">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                        <CardTitle className="text-xl font-bold">
                          {room.name}
                        </CardTitle>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-accent border-2 border-background shadow-md overflow-hidden">
                          <img
                            src={room.img || "/logo.webp"}
                            alt={room.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Gamepad2 className="h-4 w-4" />
                          <span>{room.mode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {room.currentPlayers} / {room.maxPlayers} jugadores
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            Categoría:{" "}
                            <strong className="text-foreground">
                              {room.category}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            Creador:{" "}
                            <strong className="text-foreground">
                              {room.creator}
                            </strong>
                          </span>
                        </div>

                        <Button
                          onClick={() => handleJoinRoom(room.code)}
                          disabled={room.currentPlayers >= room.maxPlayers}
                          className="w-full bg-gradient-to-br from-accent to-secondary hover:from-secondary hover:to-accent text-light font-semibold"
                        >
                          {room.currentPlayers >= room.maxPlayers
                            ? "Sala Llena"
                            : "Unirse"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center text-muted-foreground text-lg">
              No se encontraron salas con esos filtros
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
