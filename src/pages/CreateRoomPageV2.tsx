import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Lock, Gamepad2, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import type { RoomSettings } from "@/types/game";

const defaultSettings: RoomSettings = {
  category: "disney",
  impostorCount: 1,
  totalRounds: 5,
  maxPlayers: 8,
  privacy: "private",
  mode: "classic",
  impostorsKnowEachOther: false,
};

export default function CreateRoomPageV2() {
  const navigate = useNavigate();
  const { createRoom } = useSocketRoom();
  const [roomName, setRoomName] = useState("");
  const [settings, setSettings] = useState<RoomSettings>(defaultSettings);
  const [creating, setCreating] = useState(false);

  const update = <K extends keyof RoomSettings>(
    key: K,
    value: RoomSettings[K]
  ) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleCreate = () => {
    if (!roomName.trim()) {
      toast.error("Ingresa un nombre para la sala");
      return;
    }
    setCreating(true);
    createRoom({
      username: "", // Se llenará desde el store del usuario logueado
      settings,
    });
  };

  return (
    <div className="bg-background min-h-screen transition-colors">
      <div className="flex flex-col items-center justify-start pt-24 px-6 pb-10 w-full max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="w-full bg-accent text-background dark:bg-muted dark:text-foreground rounded-t-xl p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Settings className="h-9 w-9 text-light dark:text-foreground" />
              <h1 className="text-3xl md:text-4xl font-bold leading-tight text-light">
                Crear Sala
              </h1>
            </div>
          </div>
          <p className="mt-3 text-light/90 dark:text-light text-base md:text-lg max-w-3xl leading-relaxed">
            Configura las reglas principales de tu partida antes de comenzar.
          </p>
        </div>

        {/* FORM  */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6 w-full">
          {/* FORMULARIO */}
          <div className="bg-card rounded-xl p-6 md:p-8 shadow-xl border border-border transition-colors">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-5">
              Configuración principal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de sala */}
              <div className="space-y-3 md:col-span-2">
                <Label className="text-base font-medium text-foreground">
                  Nombre de la sala
                </Label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ej: Sala de los Amigos"
                  className="bg-background border-border text-foreground"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base font-medium text-foreground">
                  <Gamepad2 className="h-5 w-5 text-accent" />
                  Categoría
                </Label>
                <Select
                  value={settings.category}
                  onValueChange={(val) => update("category", val)}
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="disney">Disney</SelectItem>
                    <SelectItem value="futbol">Fútbol</SelectItem>
                    <SelectItem value="clash">Clash Royale</SelectItem>
                    <SelectItem value="simpson">Los Simpson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Impostores */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base font-medium text-foreground">
                  <Users className="h-5 w-5 text-accent" />
                  Número de impostores
                </Label>
                <Select
                  value={settings.impostorCount.toString()}
                  onValueChange={(val) =>
                    update("impostorCount", parseInt(val))
                  }
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    {[1, 2, 3].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rondas */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Número de rondas
                </Label>
                <Select
                  value={settings.totalRounds.toString()}
                  onValueChange={(val) =>
                    update("totalRounds", parseInt(val))
                  }
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    {[3, 5, 7, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Máximo jugadores */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Máximo de jugadores
                </Label>
                <Select
                  value={settings.maxPlayers.toString()}
                  onValueChange={(val) =>
                    update("maxPlayers", parseInt(val))
                  }
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    {[4, 6, 8].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Privacidad */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base font-medium text-foreground">
                  <Lock className="h-5 w-5 text-accent" />
                  Privacidad
                </Label>
                <RadioGroup
                  value={settings.privacy}
                  onValueChange={(val) =>
                    update("privacy", val as "public" | "private")
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="text-base text-foreground">
                      Pública
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="text-base text-foreground">
                      Privada
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Impostores se conocen */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Los impostores se conocen entre sí
                </Label>
                <RadioGroup
                  value={settings.impostorsKnowEachOther ? "yes" : "no"}
                  onValueChange={(val) =>
                    update("impostorsKnowEachOther", val === "yes")
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="yes" id="know-yes" />
                    <Label htmlFor="know-yes" className="text-base text-foreground">
                      Sí
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="no" id="know-no" />
                    <Label htmlFor="know-no" className="text-base text-foreground">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA + ACCIONES */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-xl p-5 bg-accent/10 border border-accent/20 shadow-sm transition-colors">
              <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-accent" />
                Vista previa
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  ["Sala", roomName || "(sin nombre)"],
                  ["Categoría", settings.category],
                  ["Impostores", settings.impostorCount.toString()],
                  ["Rondas", settings.totalRounds.toString()],
                  ["Máx. jugadores", settings.maxPlayers.toString()],
                  ["Privacidad", settings.privacy === "public" ? "Pública" : "Privada"],
                  ["Modo", settings.mode],
                  [
                    "Impostores se conocen",
                    settings.impostorsKnowEachOther ? "Sí" : "No",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-border py-2"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium capitalize text-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5 bg-card border border-border shadow-sm flex flex-col gap-4 transition-colors">
              <div className="flex flex-col md:flex-row gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={creating || !roomName.trim()}
                  size="lg"
                  className="flex-1 bg-gradient-to-br from-accent to-secondary hover:opacity-90 transition py-3 px-5 text-base text-light font-semibold"
                >
                  {creating ? "Creando..." : "Crear Sala"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="flex-1 py-3 px-5 text-base text-foreground"
                  onClick={() => navigate("/menu")}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
