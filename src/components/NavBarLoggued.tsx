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

export default function NavBarLoggued() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // lógica de logout mínima (redirección). Puedes ampliar.
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-4">
          <img className="h-12 w-12 rounded-md" src="/logo.webp" alt="logo" />
          <span className="text-3xl font-extrabold bg-gradient-to-b from-accent/60 via-accent/80 to-accent bg-clip-text text-transparent">
            CharacterUs
          </span>
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
              <span className="font-semibold text-lg">Alex</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
