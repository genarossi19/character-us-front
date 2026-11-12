import { Link } from "react-router";
import { Button } from "./ui/button";
import { ThemeToggleButton } from "../components/ui/shadcn-io/theme-toggle-button/index";

export default function NavMenu() {
  return (
    <header className="px-4 py-3 md:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        {/* Parte izquierda*/}
        <div className="flex items-center gap-2">
          {/* Main  */}
          <div className="flex items-center gap-6">
            <Link to={"/"}>
              <div className="flex items-center gap-4">
                <img className="size-9 rounded-md sm:size-11" src="/logo.webp" alt="" />
                <span className="text-2xl font-extrabold bg-gradient-to-b from-accent/60 via-accent/80 to-accent bg-clip-text text-transparent sm:text-3xl lg:text-4xl">
                  CharacterUs
                </span>
              </div>
            </Link>
          </div>
        </div>
        {/* Parte derecha */}
        <nav aria-label="Acceso al juego" className="order-3 col-span-2 grid grid-cols-2 gap-2 sm:order-none sm:ml-auto sm:flex">
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
