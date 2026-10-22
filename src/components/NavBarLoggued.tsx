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
import { useUserStore } from "@/store/useUserStore";
import { getDisplayName } from "@/lib/displayName";

export default function NavBarLoggued() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const displayName = getDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between bg-card shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/menu">
          <div className="flex items-center gap-4">
            <img className="h-12 w-12 rounded-md" src="/logo.webp" alt="" />
            <span className="hidden text-3xl font-extrabold bg-gradient-to-b from-accent/60 via-accent/80 to-accent bg-clip-text text-transparent sm:inline md:text-5xl">
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
                src={user?.avatarUrl || "/avatars/astronaut.webp"}
                alt={`Perfil de ${displayName}`}
                className="w-10 h-10 rounded-full border-2 border-accent shadow"
              />
              <span className="hidden font-semibold text-lg text-foreground lg:inline">
                {displayName}
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
