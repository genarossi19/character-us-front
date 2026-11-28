import { NavbarBrand } from "@/components/NavbarBrand";
import { AccountMenu } from "./AccountMenu";
import { ThemeToggleButton } from "./ui/shadcn-io/theme-toggle-button";

export default function NavBarLoggued() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 page-gutter flex items-center justify-between bg-card shadow-sm">
      <div className="flex items-center gap-6">
        <NavbarBrand to="/menu" />
      </div>

      <div className="flex items-center gap-2">
        <AccountMenu />

        <ThemeToggleButton />
      </div>
    </header>
  );
}
