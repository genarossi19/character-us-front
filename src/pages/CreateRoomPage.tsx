import { useState } from "react";
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

export default function CreateRoomPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jugadores: "4",
    privacidad: "publica",
    categoria: "disney",
    modalidad: "clasico",
    tipo: "virtual",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/game`);
  };

  return (
    <div className="bg-gradient-to-b from-accent/10 via-background to-white min-h-screen">
      <NavBarLoggued />
      <div className="flex flex-col items-center justify-start pt-24 px-6 pb-10 w-full max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="w-full bg-gradient-to-r from-accent to-secondary text-white rounded-t-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Settings className="h-9 w-9 text-white/95" />
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Crear Sala
              </h1>
            </div>
            <Eye className="h-6 w-6 text-white/80" />
          </div>
          <p className="mt-3 text-white/95 text-base md:text-lg max-w-3xl leading-relaxed">
            Configura las reglas principales de tu partida antes de comenzar.
          </p>
        </div>

        {/* FORM + VISTA PREVIA */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6 w-full"
        >
          {/* FORMULARIO */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-5">
              Configuración principal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jugadores */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-gray-700">
                  <Users className="h-6 w-6 text-accent" />
                  Número de jugadores
                </Label>
                <Select
                  value={formData.jugadores}
                  onValueChange={(val) =>
                    setFormData({ ...formData, jugadores: val })
                  }
                >
                  <SelectTrigger className="w-full bg-white border-gray-200 focus:ring-accent/30 py-3">
                    <SelectValue placeholder="Selecciona cantidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Recomendado: 4 a 6 jugadores para un mejor ritmo.
                </p>
              </div>

              {/* Privacidad */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-gray-700">
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
                        formData.tipo === "presencial" ? "text-gray-400" : ""
                      }`}
                    >
                      Pública
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="privada" id="privada" />
                    <Label htmlFor="privada" className="text-base">
                      Privada
                    </Label>
                  </div>
                </RadioGroup>
                {formData.tipo === "presencial" && (
                  <p className="text-sm text-gray-500">
                    Las salas presenciales siempre son privadas.
                  </p>
                )}
              </div>

              {/* Categoría */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-gray-700">
                  <Gamepad2 className="h-6 w-6 text-accent" />
                  Categoría
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(val) =>
                    setFormData({ ...formData, categoria: val })
                  }
                >
                  <SelectTrigger className="w-full bg-white border-gray-200 focus:ring-accent/30 py-3">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disney">Disney</SelectItem>
                    <SelectItem value="futbol">Fútbol</SelectItem>
                    <SelectItem value="clash">Clash Royale</SelectItem>
                    <SelectItem value="simpson">Los Simpson</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Elige la temática principal de la partida.
                </p>
              </div>

              {/* Modalidad */}
              <div className="space-y-3">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-gray-700">
                  <Settings className="h-6 w-6 text-accent" />
                  Modalidad
                </Label>
                <Select
                  value={formData.modalidad}
                  onValueChange={(val) =>
                    setFormData({ ...formData, modalidad: val })
                  }
                >
                  <SelectTrigger className="w-full bg-white border-gray-200 focus:ring-accent/30 py-3">
                    <SelectValue placeholder="Selecciona modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clasico">Clásico</SelectItem>
                    <SelectItem value="anonimo">Anónimo</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Cambia reglas o visibilidad entre jugadores.
                </p>
              </div>

              {/* Tipo */}
              <div className="space-y-3 md:col-span-2">
                <Label className="flex items-center gap-3 text-base md:text-lg font-medium text-gray-700">
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
                    <Label htmlFor="virtual" className="text-base">
                      Virtual
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="presencial" id="presencial" />
                    <Label htmlFor="presencial" className="text-base">
                      Presencial
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-gray-500">
                  Virtual: acceso remoto. Presencial: mismo lugar físico.
                </p>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA + ACCIONES */}
          <aside className="flex flex-col gap-4">
            {/* Vista previa */}
            <div className="rounded-xl p-5 bg-gradient-to-b from-accent/10 to-background border border-accent/20 shadow-sm">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
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
                    className="flex items-center justify-between border-b border-gray-100 py-2"
                  >
                    <span className="text-sm md:text-base text-gray-600">
                      {label}
                    </span>
                    <span className="text-sm md:text-base font-medium capitalize text-gray-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="rounded-xl p-5 bg-white border border-gray-100 shadow-sm flex flex-col gap-4">
              {/* Estado de configuración */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Configuración lista:
                </span>
                <span className="text-sm font-semibold text-green-600">
                  ✔ Sí
                </span>
              </div>

              {/* Botones */}
              <div className="flex flex-col md:flex-row gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-gradient-to-br from-accent to-secondary hover:opacity-90 transition py-3 px-5 text-base"
                >
                  Crear Sala
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="flex-1 py-3 px-5 text-base"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="flex-1 py-3 px-5 text-base"
                  onClick={() => alert("Guardado como borrador")}
                >
                  Guardar Borrador
                </Button>
              </div>

              {/* Nota adicional */}
              <p className="text-sm text-gray-500 mt-2">
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
