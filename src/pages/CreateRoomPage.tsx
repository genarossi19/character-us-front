import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { Users, Lock, Globe, Gamepad2, Settings, Eye } from "lucide-react";
import NavBarLoggued from "../components/NavBarLoggued";
import { toast } from "sonner";

export default function CreateRoomPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jugadores: "4",
    privacidad: "publica",
    categoria: "disney",
    modalidad: "clasico",
    tipo: "virtual",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/game`);
  };

  return (
    <div className="bg-background min-h-screen transition-colors">
      <NavBarLoggued />
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
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6 w-full"
        >
          {/* FORMULARIO */}
          <div className="bg-card rounded-xl p-6 md:p-8 shadow-xl border border-border transition-colors">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-5">
              Configuración principal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jugadores */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-foreground">
                  <Users className="h-6 w-6 text-accent" />
                  Número de jugadores
                </Label>
                <Select
                  value={formData.jugadores}
                  onValueChange={(val) =>
                    setFormData({ ...formData, jugadores: val })
                  }
                >
                  <SelectTrigger className="w-full bg-background border border-border focus:ring-accent/30 py-3 text-foreground">
                    <SelectValue placeholder="Selecciona cantidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    {[3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Recomendado: 4 a 6 jugadores para un mejor ritmo.
                </p>
              </div>

              {/* Privacidad */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-foreground">
                  <Lock className="h-6 w-6 text-accent" />
                  Privacidad
                </Label>
                <RadioGroup
                  value={formData.privacidad}
                  onValueChange={(val) =>
                    setFormData({ ...formData, privacidad: val })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="publica"
                      id="publica"
                      disabled={formData.tipo === "presencial"}
                    />
                    <Label
                      htmlFor="publica"
                      className={`text-base ${
                        formData.tipo === "presencial"
                          ? "text-muted-foreground/50"
                          : "text-foreground"
                      }`}
                    >
                      Pública
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="privada" id="privada" />
                    <Label
                      htmlFor="privada"
                      className="text-base text-foreground"
                    >
                      Privada
                    </Label>
                  </div>
                </RadioGroup>
                {formData.tipo === "presencial" && (
                  <p className="text-sm text-muted-foreground">
                    Las salas presenciales siempre son privadas.
                  </p>
                )}
              </div>

              {/* Categorias */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-foreground">
                  <Gamepad2 className="h-6 w-6 text-accent" />
                  Categoría
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(val) =>
                    setFormData({ ...formData, categoria: val })
                  }
                >
                  <SelectTrigger className="w-full bg-background border border-border focus:ring-accent/30 py-3 text-foreground">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="disney">Disney</SelectItem>
                    <SelectItem value="futbol">Fútbol</SelectItem>
                    <SelectItem value="clash">Clash Royale</SelectItem>
                    <SelectItem value="simpson">Los Simpson</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Elige la temática principal de la partida.
                </p>
              </div>

              {/* Modalidad */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-foreground">
                  <Settings className="h-6 w-6 text-accent" />
                  Modalidad
                </Label>
                <Select
                  value={formData.modalidad}
                  onValueChange={(val) =>
                    setFormData({ ...formData, modalidad: val })
                  }
                >
                  <SelectTrigger className="w-full bg-background border border-border focus:ring-accent/30 py-3 text-foreground">
                    <SelectValue placeholder="Selecciona modalidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="clasico">Clásico</SelectItem>
                    <SelectItem value="anonimo">Anónimo</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Cambia reglas o visibilidad entre jugadores.
                </p>
              </div>

              {/* Tipo */}
              <div className="space-y-3 md:col-span-2">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-foreground">
                  <Globe className="h-6 w-6 text-accent" />
                  Tipo de sala
                </Label>
                <RadioGroup
                  value={formData.tipo}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      tipo: val,
                      privacidad:
                        val === "presencial" ? "privada" : formData.privacidad,
                    })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="virtual" id="virtual" />
                    <Label
                      htmlFor="virtual"
                      className="text-base text-foreground"
                    >
                      Virtual
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="presencial" id="presencial" />
                    <Label
                      htmlFor="presencial"
                      className="text-base text-foreground"
                    >
                      Presencial
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  Virtual: acceso remoto. Presencial: mismo lugar físico.
                </p>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA + ACCIONES */}
          <aside className="flex flex-col gap-4">
            {/* Vista previa */}
            <div className="rounded-xl p-5 bg-accent/10 border border-accent/20 shadow-sm transition-colors">
              <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-accent" />
                Vista previa
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  ["Jugadores", formData.jugadores],
                  ["Privacidad", formData.privacidad],
                  ["Categoría", formData.categoria],
                  ["Modalidad", formData.modalidad],
                  ["Tipo", formData.tipo],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-border py-2"
                  >
                    <span className="text-sm md:text-base text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-sm md:text-base font-medium capitalize text-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTONES DE ACCION */}
            <div className="rounded-xl p-5 bg-card border border-border shadow-sm flex flex-col gap-4 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Configuración lista:
                </span>
                <span className="text-sm font-semibold text-green-500">
                  ✔ Sí
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-gradient-to-br from-accent to-secondary hover:opacity-90 transition py-3 px-5 text-base text-light font-semibold"
                >
                  Crear Sala
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
                  className="flex-1 py-3 px-5 text-base text-foreground"
                  onClick={() => toast.success("Borrador guardado")}
                >
                  Guardar Borrador
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-2">
                Revisa tu configuración antes de crear la sala. Las privadas
                requieren un código de acceso.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
