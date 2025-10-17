import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import NavBarLoggued from "../components/NavBarLoggued";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { Users, Gamepad2, Search } from "lucide-react";
import { Switch } from "../components/ui/switch";

// Mock de salas públicas
const mockRooms = [
  {
    id: "1",
    name: "Sala Magia Disney",
    category: "Disney",
    mode: "Clásico (1 Impostor)",
    creator: "Ana",
    currentPlayers: 5,
    maxPlayers: 8,
    private: false,
    img: "/disney.webp",
  },
  {
    id: "2",
    name: "Clash Royale Challenge",
    category: "Clash Royale",
    mode: "Especial (Pista)",
    creator: "Luis",
    currentPlayers: 0,
    maxPlayers: 8,
    private: false,
    img: "/clash-royale.webp",
  },
  {
    id: "3",
    name: "Los Simpson Trivia",
    category: "Los Simpson",
    mode: "Clásico (2 Impostores)",
    creator: "Carla",
    currentPlayers: 4,
    maxPlayers: 6,
    private: false,
    img: "/los-simpson.webp",
  },
];

export default function PublicRoomsPage() {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [showEmpty, setShowEmpty] = useState(true);

  // Filtrado dinámico
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
      <NavBarLoggued />

      <main className="flex-1 p-6">
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
              {/* Búsqueda */}
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

              {/* Modo */}
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

              {/* Filtro salas vacías */}
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
                        {/* Imagen redonda tipo avatar */}
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
                          asChild
                          className="w-full bg-gradient-to-br from-accent to-secondary hover:from-secondary hover:to-accent text-light font-semibold"
                        >
                          <Link to={`/game/${room.id}`}>Unirse</Link>
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
