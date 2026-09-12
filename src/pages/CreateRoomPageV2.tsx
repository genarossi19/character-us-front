import { useEffect, useState } from "react";
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
import { Users, Lock, Gamepad2, Settings, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SocketAckError, useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { fetchCategories, type Category } from "@/services/api/category";
import type { RoomMode, RoomSettings } from "@/types/game";
import NavBarLoggued from "@/components/NavBarLoggued";

const defaultSettings: RoomSettings = {
  category: "",
  impostorCount: 1,
  totalRounds: 5,
  maxPlayers: 8,
  privacy: "private",
  mode: "classic",
  impostorsKnowEachOther: false,
  visibleVotes: false,
};

function CategoryLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 pt-20 md:h-dvh md:min-h-0 md:overflow-hidden md:pt-24">
      <section
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-accent/25 bg-card px-6 py-10 text-center shadow-xl animate-bounce-in"
        aria-live="polite"
        aria-label="Cargando categorías"
      >
        <div className="absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto mb-7 h-40 w-40">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/50 motion-reduce:animate-none animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-primary/30 motion-reduce:animate-none animate-[spin_7s_linear_infinite_reverse]" />
          <img
            src="/avatars/astronaut.webp"
            alt=""
            className="absolute left-1 top-12 h-12 w-12 rounded-full border-2 border-card object-cover shadow-md motion-reduce:animate-none animate-bounce"
          />
          <img
            src="/avatars/medico.webp"
            alt=""
            className="absolute right-0 top-5 h-14 w-14 rounded-full border-2 border-card object-cover shadow-md motion-reduce:animate-none animate-bounce [animation-delay:-0.5s]"
          />
          <img
            src="/avatars/soldado.webp"
            alt=""
            className="absolute bottom-0 left-14 h-12 w-12 rounded-full border-2 border-card object-cover shadow-md motion-reduce:animate-none animate-bounce [animation-delay:-1s]"
          />
          <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-secondary shadow-lg motion-reduce:animate-none animate-pulse">
            <Gamepad2 className="h-8 w-8 text-light" />
          </div>
        </div>
        <div className="relative space-y-2">
          <p className="flex items-center justify-center gap-2 text-xl font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Preparando la partida
          </p>
          <p className="text-muted-foreground">
            Reuniendo personajes y categorías para ti...
          </p>
          <div className="flex justify-center gap-1 pt-2" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-2.5 w-2.5 rounded-full bg-primary motion-reduce:animate-none animate-bounce"
                style={{ animationDelay: `${dot * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CreateRoomPageV2() {
  const navigate = useNavigate();
  const { createRoom } = useSocketRoom();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const logout = useUserStore((s) => s.logout);
  const [settings, setSettings] = useState<RoomSettings>(defaultSettings);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();
      setCategories(data);
      setSettings((previous) =>
        previous.category || data.length === 0
          ? previous
          : { ...previous, category: data[0].id }
      );
      setCategoriesLoading(false);
    };

    loadCategories();
  }, []);

  const update = <K extends keyof RoomSettings>(
    key: K,
    value: RoomSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsError(null);
    if (key === "category") setCategoryError(null);
  };

  const selectedCategoryName =
    categories.find((category) => category.id === settings.category)?.name ||
    "Sin seleccionar";

  const handleCreate = async () => {
    if (!isLoggedIn || !user || !token) {
      toast.error("Debes iniciar sesión para crear una sala");
      logout();
      navigate("/login", { replace: true });
      return;
    }
    if (!settings.category) {
      setCategoryError("Selecciona una categoría válida para crear la sala.");
      return;
    }
    if (settings.privacy === "private" && !settings.password) {
      setSettingsError("Las salas privadas requieren una contraseña.");
      return;
    }
    setCategoryError(null);
    setSettingsError(null);
    setCreating(true);
    try {
      await createRoom({
        username: user.username,
        token,
        settings,
      });
    } catch (error) {
      if (error instanceof SocketAckError) {
        if (error.code === "AUTH_REQUIRED" || error.code === "AUTH_INVALID") {
          logout();
          toast.error(error.message);
          navigate("/login", { replace: true });
          return;
        }

        if (error.code === "USERNAME_MISMATCH") {
          toast.error(
            "Tu perfil cambió. Usaremos el nombre de usuario de tu sesión al volver a intentarlo."
          );
          return;
        }

        if (error.code === "INVALID_CATEGORY") {
          setCategoryError("Selecciona una categoría disponible e inténtalo nuevamente.");
          return;
        }

        if (error.code === "INVALID_SETTINGS") {
          setSettingsError("Revisa la configuración de la sala e inténtalo nuevamente.");
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error("No se pudo crear la sala. Inténtalo nuevamente.");
    } finally {
      setCreating(false);
    }
  };

  const isConfigReady = settings.category && settings.privacy === "public" || (settings.privacy === "private" && settings.password);

  return (
    <div className="min-h-screen bg-background transition-colors md:h-dvh md:overflow-hidden">
      <NavBarLoggued />
      {categoriesLoading ? (
        <CategoryLoading />
      ) : (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-6 pt-20 sm:px-6 md:h-dvh md:min-h-0 md:justify-center md:overflow-hidden md:pb-4 md:pt-24">
        {/* HEADER */}
        <div className="w-full shrink-0 rounded-t-xl bg-accent p-4 text-background shadow-sm transition-colors dark:bg-muted dark:text-foreground md:p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-light dark:text-foreground" />
              <h1 className="text-3xl font-bold leading-tight text-light md:text-4xl">
                Crear Sala
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-light/90 dark:text-light">
            Configura las reglas principales de tu partida antes de comenzar.
          </p>
        </div>

        {/* FORM  */}
        <div className="mt-4 grid w-full grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          {/* FORMULARIO */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xl transition-colors md:p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground md:text-xl">
              Configuración principal
            </h2>
            {settingsError && (
              <p className="mb-3 text-sm font-medium text-danger" role="alert">
                {settingsError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              {/* Número de jugadores */}
              <div className="space-y-2">
                <Label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Users className="h-5 w-5 text-accent" />
                  Número de jugadores
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
                <p className="text-xs text-muted-foreground">
                  Recomendado: 4 a 6 jugadores para un mejor ritmo.
                </p>
              </div>

              {/* Privacidad */}
              <div className="space-y-2">
                <Label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Lock className="h-5 w-5 text-accent" />
                  Privacidad
                </Label>
                <RadioGroup
                  value={settings.privacy}
                  onValueChange={(val) =>
                    setSettings((previous) => ({
                      ...previous,
                      privacy: val as "public" | "private",
                      password: val === "public" ? undefined : previous.password,
                    }))
                  }
                  className="flex gap-5"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="text-sm text-foreground">
                      Pública
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="text-sm text-foreground">
                      Privada
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Gamepad2 className="h-5 w-5 text-accent" />
                  Categoría
                </Label>
                <Select
                  value={settings.category}
                  onValueChange={(val) => update("category", val)}
                >
                  <SelectTrigger
                    className={`w-full bg-background border-border text-foreground ${
                      categoryError ? "border-danger" : ""
                    }`}
                  >
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryError && (
                  <p className="text-sm font-medium text-danger" role="alert">
                    {categoryError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Elige la temática principal de la partida.
                </p>
              </div>

              {/* Modalidad */}
              <div className="space-y-2">
                <Label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Settings className="h-5 w-5 text-accent" />
                  Modalidad
                </Label>
                <Select
                  value={settings.mode}
                  onValueChange={(val) => update("mode", val as RoomMode)}
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="classic">Clásico</SelectItem>
                    <SelectItem value="anonymous">Anónimo</SelectItem>
                    <SelectItem value="special">Especial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Cambia reglas o visibilidad entre jugadores.
                </p>
              </div>

              {/* Tipo de sala */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Tipo de sala
                </Label>
                <RadioGroup
                  value={settings.mode === "classic" ? "virtual" : "presencial"}
                  onValueChange={(val) =>
                    update("mode", val === "virtual" ? "classic" : "anonymous")
                  }
                  className="flex gap-5"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="virtual" id="virtual" />
                    <Label htmlFor="virtual" className="text-sm text-foreground">
                      Virtual
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="presencial" id="presencial" />
                    <Label htmlFor="presencial" className="text-sm text-foreground">
                      Presencial
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Virtual: acceso remoto. Presencial: mismo lugar físico.
                </p>
              </div>

              {/* Número de rondas */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
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

              {/* Número de impostores */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
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

              {settings.privacy === "private" && (
                <div className="space-y-2">
                  <Label htmlFor="room-password" className="text-sm font-medium text-foreground">
                    Contraseña de la sala
                  </Label>
                  <Input
                    id="room-password"
                    type="password"
                    value={settings.password || ""}
                    onChange={(event) => update("password", event.target.value || undefined)}
                    maxLength={100}
                    className="h-9 bg-background border-border text-foreground"
                  />
                </div>
              )}

              {/* Impostores se conocen */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Los impostores se conocen entre sí
                </Label>
                <RadioGroup
                  value={settings.impostorsKnowEachOther ? "yes" : "no"}
                  onValueChange={(val) =>
                    update("impostorsKnowEachOther", val === "yes")
                  }
                  className="flex gap-5"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="yes" id="know-yes" />
                    <Label htmlFor="know-yes" className="text-sm text-foreground">
                      Sí
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="no" id="know-no" />
                    <Label htmlFor="know-no" className="text-sm text-foreground">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Votos visibles */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Mostrar a quién votó cada jugador
                </Label>
                <RadioGroup
                  value={settings.visibleVotes ? "yes" : "no"}
                  onValueChange={(value) => update("visibleVotes", value === "yes")}
                  className="flex gap-5"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="yes" id="visible-votes-yes" />
                    <Label htmlFor="visible-votes-yes" className="text-sm text-foreground">Sí</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="no" id="visible-votes-no" />
                    <Label htmlFor="visible-votes-no" className="text-sm text-foreground">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA + ACCIONES */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-xl border border-accent/20 bg-accent/10 p-4 shadow-sm transition-colors">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground md:text-lg">
                <Eye className="h-5 w-5 text-accent" />
                Vista previa
              </h3>
              <div className="mt-3 space-y-1">
                {[
                  ["Jugadores", settings.maxPlayers.toString()],
                  ["Privacidad", settings.privacy === "public" ? "Pública" : "Privada"],
                  ["Categoría", selectedCategoryName],
                  ["Modalidad", settings.mode === "classic" ? "Clásico" : "Rápido"],
                  ["Tipo", settings.mode === "classic" ? "Virtual" : "Presencial"],
                  ["Rondas", settings.totalRounds.toString()],
                  ["Impostores", settings.impostorCount.toString()],
                  [
                    "Impostores se conocen",
                    settings.impostorsKnowEachOther ? "Sí" : "No",
                  ],
                  ["Votos visibles", settings.visibleVotes ? "Sí" : "No"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-border py-1.5"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium capitalize text-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Configuración lista:</span>
                <span className={`text-sm font-medium ${isConfigReady ? "text-game-accent" : "text-game-danger"}`}>
                  {isConfigReady ? "Sí" : "No"}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={creating || !isLoggedIn || !settings.category || categoriesLoading}
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
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="py-3 px-5 text-base text-foreground hover:bg-accent/20"
                  disabled
                >
                  Guardar Borrador
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Revisa tu configuración antes de crear la sala. Las privadas requieren un código de acceso.
              </p>
            </div>
          </aside>
        </div>
      </main>
      )}
    </div>
  );
}
