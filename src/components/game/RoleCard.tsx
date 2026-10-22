import { EyeOff, ScanFace, ShieldAlert } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";

export default function RoleCard() {
  const { character, isImpostor } = useGameStore();
  return (
    <section aria-label="Tu identidad privada" className={`flex items-center gap-4 rounded-2xl border p-4 sm:p-5 ${isImpostor ? "border-impostor/30 bg-impostor/5" : "border-accent/30 bg-accent/5"}`}>
      <div className={`flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-card sm:size-24 ${isImpostor ? "border-impostor/30 text-impostor" : "border-accent/30 text-accent"}`}>
        {isImpostor ? <ShieldAlert className="size-12" aria-hidden="true" /> : character?.imageUrl ? (
          <img src={character.imageUrl} alt={character.name ?? "Tu personaje"} className="size-full object-cover" />
        ) : <ScanFace className="size-12" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground"><EyeOff className="size-3.5" aria-hidden="true" /> Solo tú puedes verlo</p>
        <h2 className={`break-words text-2xl font-semibold sm:text-3xl ${isImpostor ? "text-impostor" : "text-foreground"}`}>
          {isImpostor ? "Eres el impostor" : character?.name ?? "Esperando tu personaje"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{isImpostor ? "Escucha las pistas y pasa desapercibido." : "Da una pista sin revelar el personaje."}</p>
      </div>
    </section>
  );
}
