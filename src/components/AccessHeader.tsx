import { NavbarBrand } from "@/components/NavbarBrand";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { ThemeToggleButton } from "./ui/shadcn-io/theme-toggle-button";

interface AccessHeaderProps {
  onBack: () => void;
  showSignIn?: boolean;
}

export function AccessHeader({ onBack, showSignIn = false }: AccessHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-accent/15 bg-background/95 backdrop-blur-sm">
      <div className="page-container flex min-h-16 flex-wrap items-center gap-x-2 sm:gap-x-4 md:min-h-20">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="Volver"
            className="shrink-0 hover:bg-accent/15 hover:text-foreground sm:w-auto sm:px-2">
            <ArrowLeft aria-hidden="true" /><span className="hidden sm:inline">Volver</span>
          </Button>
          <NavbarBrand to="/" className="sm:border-l sm:border-accent/20 sm:pl-4" />
        </div>

        {showSignIn && (
          <div className="order-last flex basis-full justify-end border-t border-accent/15 py-1 sm:order-none sm:basis-auto sm:border-0 sm:py-0">
            <Button asChild variant="ghost" size="sm" className="text-sm hover:bg-accent/15 hover:text-foreground">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        )}

        <div role="group" aria-label="Sonido y tema" className="flex h-16 shrink-0 items-center gap-1 md:h-20">
          <ThemeToggleButton className="text-foreground hover:text-foreground" />
        </div>
      </div>
    </header>
  );
}
