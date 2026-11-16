import type { ComponentProps } from "react";
import { Button } from "./button";

// Login is the visual reference for navigation and primary form actions.
export function BackButton({ onClick, onDarkBackground = false }: { onClick: () => void; onDarkBackground?: boolean }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      size="lg"
      variant="ghost"
      className={`hover:bg-accent/20 text-lg font-semibold transition-colors ${onDarkBackground ? "text-light hover:text-light" : "text-foreground hover:text-foreground"}`}
    >
      ← Volver
    </Button>
  );
}

type FormActionProps = Omit<ComponentProps<typeof Button>, "size" | "variant" | "className"> & { tone?: "primary" | "accent" };

export function FormActionButton({ tone = "primary", ...props }: FormActionProps) {
  return (
    <Button
      type="button"
      size="lg"
      variant={tone === "accent" ? "secondary" : "default"}
      className={`w-full font-semibold text-lg rounded-md ${tone === "accent" ? "bg-accent text-white hover:bg-accent/90" : "text-white"}`}
      {...props}
    />
  );
}
