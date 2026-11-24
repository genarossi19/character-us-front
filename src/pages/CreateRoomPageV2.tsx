import { useEffect, useRef, useState } from "react";
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
import { Users, Lock, Gamepad2, Settings, Eye, EyeOff, Sparkles, Globe2, Minus, Plus, Play, VenetianMask, SlidersHorizontal, Check, LoaderCircle } from "lucide-react";
import { FormActionButton } from "@/components/ui/form-actions";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { SocketAckError, useSocketRoom } from "@/hooks/useSocketRoom";
import { useUserStore } from "@/store/useUserStore";
import { fetchCategories, type Category } from "@/services/api/category";
import type { RoomMode, RoomSettings } from "@/types/game";
import NavBarLoggued from "@/components/NavBarLoggued";
import { applyRoomModeRules, getMaxImpostors, getMinimumPlayers } from "@/lib/roomModeRules";

const defaultSettings: RoomSettings = {
  category: "",
  impostorCount: 1,
  totalRounds: 5,
  maxRounds: null,
  maxPlayers: 8,
  privacy: "private",
  mode: "classic",
  playMode: "online",
  impostorsKnowEachOther: false,
  visibleVotes: false,
};

const ROUND_LIMITS = [3, 5, 10] as const;

function CategoryLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center page-gutter pt-20 md:h-dvh md:min-h-0 md:overflow-hidden md:pt-24">
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
  const reduced = useReducedMotion();
  const pending = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const { createRoom } = useSocketRoom();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const logout = useUserStore((s) => s.logout);
  const [editableSettings, setSettings] = useState<RoomSettings>(defaultSettings);
  const settings = applyRoomModeRules(editableSettings);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    void fetchCategories().then((data) => {
      if (!active) return;
      setCategories(data);
      setSettings((previous) => data.some((category) => category.id === previous.category)
        ? previous : { ...previous, category: data[0]?.id ?? "" });
      setCategoriesLoading(false);
    });
    return () => { active = false; };
  }, [categoryAttempt]);

  const update = <K extends keyof RoomSettings>(
    key: K,
    value: RoomSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value, ...(key === "privacy" && value === "public" ? { password: undefined } : {}) }));
    setSettingsError(null);
    if (key === "category") setCategoryError(null);
  };

  const selectedCategoryName =
    categories.find((category) => category.id === settings.category)?.name ||
    "Sin seleccionar";
  const maxImpostors = getMaxImpostors(settings.maxPlayers);

  function updateCapacity(maxPlayers: number) {
    setSettings((previous) => ({
      ...previous,
      maxPlayers,
      impostorCount: Math.min(previous.impostorCount, getMaxImpostors(maxPlayers)),
    }));
    setSettingsError(null);
  }

  const handleCreate = async () => {
    if (pending.current) return;
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
    pending.current = true;
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
      pending.current = false;
      setCreating(false);
    }
  };

  const isConfigReady = Boolean(categories.some((category) => category.id === settings.category) &&
    (settings.privacy === "public" || settings.password));
  const modeLabels: Record<RoomMode, string> = { classic: "Clásico", anonymous: "Anónimo", special: "Especial" };
  const controlClass = "min-w-0 w-full border-border bg-muted/20 text-base data-[size=default]:h-12";
  const optionClass = "flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-2 text-base font-normal text-muted-foreground hover:bg-muted peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 peer-data-[state=checked]:font-semibold peer-data-[state=checked]:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring";

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <NavBarLoggued />
        {categoriesLoading ? <CategoryLoading /> : (
          <main className="page-container pb-6 pt-24">
            <header className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-semibold sm:text-4xl"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><Settings className="size-6" aria-hidden="true" /></span>Crear partida</h1>
                <p className="mt-2 text-base text-muted-foreground">Elige cómo van a jugar. Revisa el resumen y reúne al grupo.</p>
              </div>
              <img src="/avatar1.webp" alt="" className="hidden size-18 shrink-0 object-contain sm:block" />
            </header>

            <form onSubmit={(event) => { event.preventDefault(); void handleCreate(); }} className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
              <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <fieldset disabled={creating} className="min-w-0 divide-y divide-border">
                  <legend className="sr-only">Configuración de la partida</legend>
                  <section className="p-5 sm:px-6" aria-labelledby="create-theme">
                    <h2 id="create-theme" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Gamepad2 className="size-5 text-accent" aria-hidden="true" />La partida</h2>
                    {categories.length === 0 && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-danger/25 bg-danger/5 p-3 text-sm"><p>No hay categorías disponibles.</p><Button type="button" variant="outline" size="sm" onClick={() => setCategoryAttempt((value) => value + 1)}>Volver a intentar</Button></div>}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label htmlFor="category" className="mb-2 block text-base">Categoría</Label>
                        <Select value={settings.category} onValueChange={(value) => update("category", value)} disabled={creating || !categories.length}>
                          <SelectTrigger id="category" aria-invalid={Boolean(categoryError)} aria-describedby={categoryError ? "category-error" : undefined} className={controlClass}><SelectValue placeholder="Elige una categoría" /></SelectTrigger>
                          <SelectContent className="bg-card text-foreground">{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
                        </Select>
                        {categoryError && <p id="category-error" role="alert" className="mt-2 text-sm text-danger">{categoryError}</p>}
                      </div>
                      <div><Label htmlFor="mode" className="mb-2 block text-base">Modalidad</Label>
                        <Select value={settings.mode} onValueChange={(value) => update("mode", value as RoomMode)} disabled={creating}>
                          <SelectTrigger id="mode" className={controlClass}><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card text-foreground">{Object.entries(modeLabels).map(([value, name]) => <SelectItem key={value} value={value}>{name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                      <div>
                        <p id="play-mode-label" className="mb-2 font-medium">Tipo de partida</p>
                        <RadioGroup orientation="horizontal" aria-labelledby="play-mode-label" aria-describedby="play-mode-description" value={settings.playMode ?? "online"} onValueChange={(value) => update("playMode", value as RoomSettings["playMode"])} disabled={creating} className="grid grid-cols-2 gap-2">
                          {([{ value: "online", label: "En línea", icon: Globe2 }, { value: "in_person", label: "Presencial", icon: Users }] as const).map((option) => (
                            <div className="relative" key={option.value}>
                              <RadioGroupItem id={`play-mode-${option.value}`} value={option.value} className="peer absolute inset-0 z-10 size-full rounded-md opacity-0" />
                              <Label htmlFor={`play-mode-${option.value}`} className={optionClass}><option.icon className="size-4 shrink-0" aria-hidden="true" />{option.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                        <p id="play-mode-description" className="mt-2 text-sm text-muted-foreground">{settings.playMode === "in_person" ? "Palabras y debate en voz alta. Turnos y votos en la app." : "Palabras, chat y votos en la app."}</p>
                      </div>
                      <div>
                        <p id="max-rounds-label" className="mb-2 font-medium">Límite de rondas</p>
                        <RadioGroup orientation="horizontal" aria-labelledby="max-rounds-label" aria-describedby={settings.maxRounds == null ? "max-rounds-help" : undefined} value={settings.maxRounds?.toString() ?? "unlimited"} onValueChange={(value) => update("maxRounds", ROUND_LIMITS.find((limit) => String(limit) === value) ?? null)} disabled={creating} className="grid grid-cols-[minmax(max-content,1.6fr)_repeat(3,minmax(2.75rem,1fr))] gap-2">
                          {[null, ...ROUND_LIMITS].map((limit) => {
                            const value = limit?.toString() ?? "unlimited";
                            return (
                              <div className="relative" key={value}>
                                <RadioGroupItem id={`round-limit-${value}`} value={value} aria-label={limit ? `${limit} rondas` : "Sin límite"} className="peer absolute inset-0 z-10 size-full rounded-md opacity-0" />
                                <Label htmlFor={`round-limit-${value}`} className={optionClass}>{limit ?? "Sin límite"}</Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                        {settings.maxRounds == null && <p id="max-rounds-help" className="mt-2 text-sm text-muted-foreground">Se juega hasta que haya ganador.</p>}
                      </div>
                    </div>
                  </section>

                  <section className="p-5 sm:px-6" aria-labelledby="create-players">
                    <h2 id="create-players" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Users className="size-5 text-accent" aria-hidden="true" />Jugadores y roles</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label id="capacity-label" className="mb-2 block text-base">Capacidad de la sala</Label>
                        <RadioGroup orientation="horizontal" aria-labelledby="capacity-label" value={String(settings.maxPlayers)} onValueChange={(value) => updateCapacity(Number(value))} className="grid grid-cols-3 gap-2" disabled={creating}>
                          {[4, 6, 8].map((count) => <div key={count} className="relative"><RadioGroupItem id={`capacity-${count}`} value={String(count)} className="peer absolute inset-0 z-10 size-full rounded-md opacity-0" /><Label htmlFor={`capacity-${count}`} className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border text-base peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${settings.maxPlayers === count ? "border-accent bg-accent/10 font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}><Users className="size-4" aria-hidden="true" />{count}</Label></div>)}
                        </RadioGroup>
                      </div>
                      <div><Label htmlFor="impostor-count" className="mb-2 block text-base">Impostores</Label>
                        <div className="flex h-12 items-center gap-2 rounded-md border border-border bg-muted/20 px-1">
                          <Button type="button" variant="ghost" size="icon" disabled={creating || settings.impostorCount <= 1} onClick={() => update("impostorCount", settings.impostorCount - 1)} aria-label="Quitar un impostor"><Minus className="size-4" aria-hidden="true" /></Button>
                          <Input id="impostor-count" type="number" min={1} max={maxImpostors} aria-describedby="impostor-count-help" value={settings.impostorCount} onChange={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= maxImpostors) update("impostorCount", value); }} className="h-10 min-w-0 flex-1 border-0 bg-transparent text-center text-base font-semibold shadow-none" />
                          <Button type="button" variant="ghost" size="icon" disabled={creating || settings.impostorCount >= maxImpostors} onClick={() => update("impostorCount", settings.impostorCount + 1)} aria-label="Agregar un impostor"><Plus className="size-4" aria-hidden="true" /></Button>
                        </div>
                        <p id="impostor-count-help" className="mt-2 text-sm text-muted-foreground">Mínimo {getMinimumPlayers(settings.impostorCount)} jugadores para empezar.</p>
                      </div>
                    </div>
                  </section>

                  <section className="p-5 sm:px-6" aria-labelledby="create-rules">
                    <h2 id="create-rules" className="mb-3 flex items-center gap-2 text-lg font-semibold"><SlidersHorizontal className="size-5 text-accent" aria-hidden="true" />Acceso y reglas</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label id="privacy-label" className="mb-2 block text-base">Privacidad</Label>
                        <RadioGroup orientation="horizontal" aria-labelledby="privacy-label" value={settings.privacy} onValueChange={(value) => update("privacy", value as "public" | "private")} disabled={creating} className="grid grid-cols-2 gap-2">
                          {([{ value: "public", label: "Pública", icon: Globe2 }, { value: "private", label: "Privada", icon: Lock }] as const).map((option) => <div className="relative" key={option.value}><RadioGroupItem id={`privacy-${option.value}`} value={option.value} className="peer absolute inset-0 z-10 size-full rounded-md opacity-0" /><Label htmlFor={`privacy-${option.value}`} className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${settings.privacy === option.value ? "border-accent bg-accent/10 font-semibold" : "border-border text-muted-foreground hover:bg-muted"}`}><option.icon className="size-4" aria-hidden="true" />{option.label}</Label></div>)}
                        </RadioGroup>
                      </div>
                      {settings.privacy === "private" ? <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                        <Label htmlFor="room-password" className="mb-2 block text-base">Contraseña de la sala</Label>
                        <div className="relative"><Input id="room-password" type={showPassword ? "text" : "password"} value={settings.password || ""} onChange={(event) => update("password", event.target.value || undefined)} autoComplete="new-password" maxLength={100} placeholder="Elige una contraseña" className="bg-muted/20 pr-12" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña de sala" : "Mostrar contraseña de sala"} aria-controls="room-password" aria-pressed={showPassword} className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-ring">{showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}</button></div>
                      </motion.div> : <p className="flex items-center gap-2 text-sm leading-relaxed text-muted-foreground sm:pt-6"><Globe2 className="size-4 shrink-0 text-accent" aria-hidden="true" />Se entra con el código de sala, sin contraseña.</p>}
                    </div>
                  </section>
                </fieldset>
              </motion.div>

              <aside aria-labelledby="room-preview" className="flex min-w-0">
                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-accent/25 bg-card shadow-sm">
                  <div className="relative overflow-hidden border-b border-accent/15 bg-accent/10 p-4">
                    <h2 id="room-preview" className="flex items-center gap-2 text-lg font-semibold"><Eye className="size-5 text-accent" aria-hidden="true" />Tu partida</h2>
                    <div className="mt-3 flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-accent"><Gamepad2 className="size-6" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">Categoría</p><p className="break-words text-xl font-semibold">{selectedCategoryName}</p></div></div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-1.5"><Users className="size-4 text-accent" aria-hidden="true" />Hasta {settings.maxPlayers} jugadores</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><VenetianMask className="size-4" aria-hidden="true" />{settings.impostorCount} {settings.impostorCount === 1 ? "impostor" : "impostores"}</span></div>
                      <div className="mt-3 flex gap-1.5" aria-hidden="true">{Array.from({ length: settings.maxPlayers }, (_, index) => <span key={index} className={`flex size-7 flex-1 items-center justify-center rounded-md ${index < settings.impostorCount ? "bg-purple/15 text-purple" : "bg-accent/15 text-accent"}`}>{index < settings.impostorCount ? <VenetianMask className="size-4" /> : <Users className="size-3.5" />}</span>)}</div>
                    </div>
                    <dl className="divide-y divide-border text-sm">
                      {[["Tipo de partida", settings.playMode === "in_person" ? "Presencial" : "En línea"], ["Modalidad", modeLabels[settings.mode]], ["Rondas", settings.maxRounds ?? "Sin límite"], ["Privacidad", settings.privacy === "private" ? "Privada" : "Pública"], ["Impostores se conocen", settings.impostorsKnowEachOther ? "Sí" : "No"], ["Objetivos de los votos", settings.visibleVotes ? "Visibles" : "Ocultos"]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}
                    </dl>
                    <div className="mt-auto border-t border-border pt-4">
                      <p aria-live="polite" className={`mb-3 flex items-center gap-2 text-sm ${isConfigReady ? "text-foreground" : "text-muted-foreground"}`}>{isConfigReady ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}{!settings.category ? "Elige una categoría para continuar." : settings.privacy === "private" && !settings.password ? "Agrega una contraseña para esta sala." : "Todo listo para crear tu sala."}</p>
                      {settingsError && <p role="alert" className="mb-3 rounded-md border border-danger/25 bg-danger/5 p-3 text-sm text-danger">{settingsError}</p>}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="min-w-0 flex-1"><FormActionButton tone="accent" type="submit" disabled={creating || !isLoggedIn || !isConfigReady}>{creating ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}{creating ? "Creando…" : "Crear partida"}</FormActionButton></div>
                        <Button type="button" variant="outline" size="lg" className="px-3 text-base text-foreground" disabled={creating} onClick={() => navigate("/menu")}>Cancelar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </form>
          </main>
        )}
      </div>
    </MotionConfig>
  );
}
