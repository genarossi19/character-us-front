import { Link, useNavigate } from "react-router";
import { useUserStore } from "@/store/useUserStore";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Users, LogOut, User } from "lucide-react";

export default function MenuV2() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between bg-card shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/">
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
                  src={user?.avatar || "/avatar1.webp"}
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
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-24">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-foreground">
              Menú Principal
            </h1>
            <p className="text-lg text-muted-foreground">
              {user?.isGuest
                ? `Jugando como ${user.username} (invitado)`
                : `Bienvenido, ${user?.username}`}
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
                    <Link to="/join">Unirse con Código</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    <Link to="/public-rooms">Buscar Salas Públicas</Link>
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
