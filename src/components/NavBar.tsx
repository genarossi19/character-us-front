import { NavbarBrand } from "@/components/NavbarBrand";
import { Link } from "react-router";
import { useUserStore } from "@/store/useUserStore";
import { AccountMenu } from "./AccountMenu";
import { Button } from "./ui/button";
import { ThemeToggleButton } from "../components/ui/shadcn-io/theme-toggle-button/index";

export default function NavMenu() {
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const isSessionReady = useUserStore(state => state.isSessionReady);

  return (
    <header className="py-6">
      <div className="page-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        {/* Parte izquierda*/}
        <div className="flex items-center gap-2">
          {/* Main  */}
          <div className="flex items-center gap-6">
            <NavbarBrand to="/" />
          </div>
        </div>
        {/* Parte derecha */}
        {isSessionReady && !isLoggedIn && <nav aria-label="Acceso al juego" className="order-3 col-span-2 grid grid-cols-2 gap-2 sm:order-none sm:ml-auto sm:flex">
          <a href="/#como-jugar" className="hidden items-center px-4 text-sm hover:text-accent lg:flex">Cómo se juega</a>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="min-w-0 px-3 text-sm text-foreground sm:px-5"
          >
            <Link to={"/login"}>Iniciar sesión</Link>
          </Button>
          <Button asChild size="lg" className="min-w-0 px-3 text-sm text-light sm:px-5">
            <Link to={"/join"}>Unirse</Link>
          </Button>
        </nav>}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          {isLoggedIn && <AccountMenu />}
          <ThemeToggleButton variant="circle-blur" start="top-right" />
        </div>
      </div>
    </header>
  );
}
