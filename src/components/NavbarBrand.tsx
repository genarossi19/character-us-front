import { Link } from "react-router";
import { cn } from "@/lib/utils";

interface NavbarBrandProps {
  to?: string;
  iconOnlyOnMobile?: boolean;
  className?: string;
}

export function NavbarBrand({ to, iconOnlyOnMobile, className }: NavbarBrandProps) {
  const classes = cn("inline-flex min-w-0 items-center gap-2 sm:gap-3", className);
  const content = (
    <>
      <img src="/logo.webp" alt="" width={48} height={48} className="size-8 shrink-0 rounded-lg sm:size-10 md:size-12" />
      <span className={cn(
        "truncate bg-gradient-to-b from-accent/75 to-accent bg-clip-text text-base font-extrabold text-transparent sm:text-2xl md:text-3xl",
        iconOnlyOnMobile && "sr-only sm:not-sr-only"
      )}>CharacterUs</span>
    </>
  );

  return to ? (
    <Link to={to} aria-label="CharacterUs" className={cn(classes, "rounded-md focus-visible:outline-2 focus-visible:outline-ring")}>
      {content}
    </Link>
  ) : <span className={classes}>{content}</span>;
}
