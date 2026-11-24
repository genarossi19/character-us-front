import { EyeOff } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import CharacterPortrait from "./CharacterPortrait";
import ImpostorTeammates from "./ImpostorTeammates";

export default function RoleCard() {
  const { character, isImpostor } = useGameStore();
  return (
    <section aria-label="Tu identidad privada" className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isImpostor ? "border-impostor/20 bg-impostor/5" : "border-border bg-card"}`}>
      <div className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ${isImpostor ? "text-impostor" : "text-accent"}`}>
        {isImpostor ? <img src="/impostor.webp" alt="" className="size-full object-cover" /> : (
          <CharacterPortrait
            key={character?.imageUrl}
            imageUrl={character?.imageUrl}
            name={character?.name}
            fallbackClassName="size-12"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><EyeOff className="size-3" aria-hidden="true" /> Tu identidad</p>
        <h2 className={`break-words text-base font-semibold ${isImpostor ? "text-impostor" : "text-foreground"}`}>
          {isImpostor ? "Eres el impostor" : character?.name ?? "Esperando tu personaje"}
        </h2>
        <ImpostorTeammates />
      </div>
    </section>
  );
}
