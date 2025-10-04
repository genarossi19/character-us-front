"use client";

import { Link } from "react-router";
import NavBarLoggued from "../components/NavBarLoggued";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PlusCircle, Users } from "lucide-react";

export default function MenuPage() {
  return (
    <div className="bg-accent/8 min-h-screen flex flex-col">
      <NavBarLoggued />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-foreground">
              Menú Principal
            </h1>
            <p className="text-lg text-muted-foreground">
              Únete a una partida existente o crea una nueva
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Crear Partida */}
            <Card className="shadow-lg border-none hover:shadow-xl transition animate-bounce-in">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <PlusCircle className="h-16 w-16 text-accent" />
                <CardTitle className="text-2xl font-bold">
                  Crear Partida
                </CardTitle>
                <p className="text-muted-foreground text-center">
                  Configura una partida nueva y comparte el código con tus
                  amigos.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-br from-accent to-secondary hover:from-secondary hover:to-accent"
                >
                  <Link to="/create">Crear</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Unirse a Partida */}
            <Card className="shadow-lg border-none hover:shadow-xl transition animate-bounce-in">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <Users className="h-16 w-16 text-accent" />
                <CardTitle className="text-2xl font-bold">
                  Unirse a Partida
                </CardTitle>
                <p className="text-muted-foreground text-center">
                  Elige cómo quieres unirte a una partida existente.
                </p>

                <div className="w-full space-y-3">
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="w-full"
                  >
                    <Link to="/join">Unirse a una Sala</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    <Link to="/public-rooms">Buscar Salas</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
