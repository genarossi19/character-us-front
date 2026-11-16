import { Link } from "react-router";
import { Button } from "./ui/button";
import { ThemeToggleButton } from "../components/ui/shadcn-io/theme-toggle-button/index";

export default function NavMenu() {
  return (
    <header className="py-6">
      <div className="page-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        {/* Parte izquierda*/}
        <div className="flex items-center gap-2">
          {/* Main  */}
          <div className="flex items-center gap-6">
            <Link to={"/"}>
              <div className="flex items-center gap-3">
                <img className="size-11 rounded-xl sm:size-14" src="/logo.webp" alt="" />
                <span className="text-2xl font-extrabold bg-gradient-to-b from-accent/60 via-accent/80 to-accent bg-clip-text text-transparent sm:text-4xl lg:text-5xl">
                  CharacterUs
                </span>
              </div>
            </Link>
          </div>
        </div>
        {/* Parte derecha */}
        <nav aria-label="Acceso al juego" className="order-3 col-span-2 grid grid-cols-2 gap-2 sm:order-none sm:ml-auto sm:flex">
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
        </nav>
        <ThemeToggleButton variant="circle-blur" start="top-right" />
      </div>
    </header>
  );
}
