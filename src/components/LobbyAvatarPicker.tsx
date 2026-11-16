import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AVATAR_OPTIONS } from "@/constants/avatars";
import type { Player } from "@/types/game";

const avatarNames = ["Astronauta", "Pirata", "Detective", "Chef", "Médico", "Artista", "Soldado", "Villano"];

export default function LobbyAvatarPicker({ player, players, disabled, onSelect }: {
  player: Player;
  players: Player[];
  disabled: boolean;
  onSelect: (avatar: string) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  const select = async (avatar: string) => {
    if (busy.current || disabled || avatar === player.avatarUrl) return;
    busy.current = true;
    setPending(true);
    try {
      await onSelect(avatar);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudo cambiar el avatar. Intenta otra vez.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <section aria-labelledby="avatar-title" className="xl:flex xl:flex-wrap xl:items-center xl:gap-4">
      <div className="mb-3 flex shrink-0 items-center gap-3 xl:mb-0">
        <h2 id="avatar-title" className="text-base font-semibold">Tu avatar</h2>
      </div>
      <div className="grid flex-1 grid-cols-4 gap-3 sm:grid-cols-8">
        {AVATAR_OPTIONS.map((avatar, index) => {
          const owner = players.find((candidate) => candidate.socketId !== player.socketId && candidate.avatarUrl === avatar.url);
          const selected = player.avatarUrl === avatar.url;
          const label = `${avatarNames[index]}${owner ? `, ocupado por ${owner.username}` : selected ? ", seleccionado" : ""}`;
          return (
            <button type="button" key={avatar.id} title={label} disabled={!!owner || !!pending || disabled} aria-pressed={selected} aria-label={label} onClick={() => void select(avatar.url)} className={`relative mx-auto flex aspect-square w-full max-w-[72px] items-center justify-center rounded-xl border-2 p-1 transition-[background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed ${selected ? "border-accent bg-accent/10" : "border-transparent hover:border-accent/30 hover:bg-accent/5"} ${owner ? "opacity-30 grayscale" : ""}`}>
              <img src={avatar.url} alt="" className="size-full object-contain" />
              {selected && <span className="absolute -right-1 -top-1 rounded-full bg-accent p-0.5 text-accent-foreground"><Check className="size-3" aria-hidden="true" /></span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
