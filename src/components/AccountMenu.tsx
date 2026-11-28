import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getDisplayName } from "@/lib/displayName";

export function AccountMenu() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const displayName = getDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Abrir menú de cuenta" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/20 transition cursor-pointer">
          <img
            src={user?.avatarUrl || "/avatars/astronaut.webp"}
            alt=""
            className="size-9 shrink-0 rounded-full border-2 border-accent shadow sm:size-10"
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
  );
}
