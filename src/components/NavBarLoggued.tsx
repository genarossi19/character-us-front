import { Link, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { ThemeToggleButton } from "./ui/shadcn-io/theme-toggle-button";

export default function NavBarLoggued() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // lógica de logout mínima (redirección). Puedes ampliar.
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between bg-card shadow-sm">
      <div className="flex items-center gap-6">
        <Link to={"/"}>
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
                src="/avatar1.webp"
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-accent shadow"
              />
              <span className="font-semibold text-lg text-foreground">
                Alex
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
  );
}
