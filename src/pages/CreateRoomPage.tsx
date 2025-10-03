"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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

import { Users, Lock, Globe, Gamepad2, Settings } from "lucide-react";
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
    // TODO: Lógica para crear sala en backend y obtener id

    navigate(`/game`);
  };

  return (
    <div>
      <NavBarLoggued />
      <div className="min-h-screen bg-gradient-to-b from-accent/6 to-transparent flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <Card className="overflow-hidden shadow-2xl border-none bg-white/95 max-h-[calc(100vh-5rem)]">
            <CardHeader className="bg-gradient-to-r from-accent to-secondary rounded-t-lg py-4 px-6">
              <CardTitle className="text-3xl md:text-4xl text-white font-bold flex items-center gap-3">
                <Settings className="h-8 w-8 text-white/95" />
                Crear Sala
              </CardTitle>
              <p className="mt-2 text-white/90 max-w-2xl text-sm md:text-base">
                Configura tu sala: elige jugadores, privacidad, categoría y
                modalidad. Estas opciones ayudan a personalizar la experiencia
                del juego.
              </p>
            </CardHeader>

            <CardContent className="p-4 overflow-auto">
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Left / center: formulario */}
                <div className="md:col-span-2 bg-white/70 rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Número de jugadores */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Users className="h-5 w-5 text-gray-600" />
                        Número de jugadores
                      </Label>
                      <Select
                        value={formData.jugadores}
                        onValueChange={(val) =>
                          setFormData({ ...formData, jugadores: val })
                        }
                      >
                        <SelectTrigger className="w-full bg-white text-gray-800 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {[3, 4, 5, 6, 7, 8].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Máx 8 jugadores. Recomendado 4-6 para partidas rápidas.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Lock className="h-5 w-5 text-gray-600" />
                        Privacidad
                      </Label>
                      <RadioGroup
                        value={formData.privacidad}
                        onValueChange={(val) =>
                          setFormData({ ...formData, privacidad: val })
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="publica" id="publica" />
                          <Label htmlFor="publica">Pública</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="privada" id="privada" />
                          <Label htmlFor="privada">Privada</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-gray-500">
                        Las salas privadas requieren código para unirse.
                      </p>
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Gamepad2 className="h-5 w-5 text-gray-600" />
                        Categoría
                      </Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(val) =>
                          setFormData({ ...formData, categoria: val })
                        }
                      >
                        <SelectTrigger className="w-full bg-white text-gray-800 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disney">Disney</SelectItem>
                          <SelectItem value="futbol">Fútbol</SelectItem>
                          <SelectItem value="clash">Clash Royale</SelectItem>
                          <SelectItem value="simpson">Los Simpson</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Elige la temática de las preguntas para la partida.
                      </p>
                    </div>

                    {/* Modalidad */}
                    <div className="space-y-2">
                      <Label className="text-sm">Modalidad</Label>
                      <Select
                        value={formData.modalidad}
                        onValueChange={(val) =>
                          setFormData({ ...formData, modalidad: val })
                        }
                      >
                        <SelectTrigger className="w-full bg-white text-gray-800 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clasico">Clásico</SelectItem>
                          <SelectItem value="anonimo">Anónimo</SelectItem>
                          <SelectItem value="especial">Especial</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Modifica cómo se ven los jugadores y las reglas de la
                        partida.
                      </p>
                    </div>

                    {/* Tipo */}
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Globe className="h-5 w-5 text-gray-600" />
                        Tipo de sala
                      </Label>
                      <RadioGroup
                        value={formData.tipo}
                        onValueChange={(val) =>
                          setFormData({ ...formData, tipo: val })
                        }
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="virtual" id="virtual" />
                          <Label htmlFor="virtual">Virtual</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="presencial" id="presencial" />
                          <Label htmlFor="presencial">Presencial</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-gray-500">
                        Virtual = acceso desde cualquier dispositivo. Presencial
                        = partida en un mismo lugar.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-600">
                      Cuando estés listo, crea la sala y comparte el código con
                      tus jugadores.
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      className="ml-auto bg-gradient-to-br from-accent to-secondary hover:from-secondary hover:to-accent"
                    >
                      Crear Sala
                    </Button>
                  </div>
                </div>

                {/* Right: vista previa / resumen */}
                <aside className="hidden md:flex flex-col gap-4 items-stretch">
                  <div className="rounded-lg p-4 bg-gradient-to-b from-white to-accent/5 border border-gray-100 shadow">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Vista previa
                    </h3>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Jugadores</span>
                        <span className="text-sm font-medium">
                          {formData.jugadores}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Privacidad
                        </span>
                        <span className="text-sm font-medium capitalize">
                          {formData.privacidad}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Categoría</span>
                        <span className="text-sm font-medium capitalize">
                          {formData.categoria}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Modalidad</span>
                        <span className="text-sm font-medium capitalize">
                          {formData.modalidad}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Tipo</span>
                        <span className="text-sm font-medium capitalize">
                          {formData.tipo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg p-4 bg-white border border-gray-100 shadow-sm">
                    <h4 className="text-xs text-gray-500">Consejos rápidos</h4>
                    <ul className="mt-2 text-sm text-gray-600 space-y-2">
                      <li>Usa privacidad privada para partidas cerradas.</li>
                      <li>Elige categorías variadas para más dinamismo.</li>
                      <li>Recomendada 4-6 jugadores para mejor experiencia.</li>
                    </ul>
                  </div>
                </aside>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
